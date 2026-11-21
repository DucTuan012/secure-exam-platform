/**
 * 31_ExamControl.gs — Thí sinh, phân mã đề, mở/đóng thi, hẹn giờ đóng, theo dõi số bài nộp
 */

/**
 * Nhập danh sách thí sinh từ văn bản dán (copy từ Excel/Sheets): mỗi dòng SBD, Họ tên, Lớp, Email
 * (phân cách bằng Tab, dấu phẩy hoặc chấm phẩy). Dòng tiêu đề có chữ "SBD" sẽ được bỏ qua.
 */
function EC_importStudents(maKyThi, text, mode) {
  return S_withLock(function () {
    Repo_examRow(maKyThi);
    var lines = U_str(text).split(/\r?\n/).map(function (l) { return l.trim(); }).filter(String);
    var rows = [], seen = {}, errors = [];
    lines.forEach(function (l, i) {
      var parts = l.indexOf('\t') >= 0 ? l.split('\t') : l.split(/[;,]/);
      parts = parts.map(function (p) { return p.trim(); });
      if (i === 0 && /sbd|số báo danh|student/i.test(parts[0])) return;
      var sbd = U_upper(parts[0]);
      if (!sbd) return;
      if (seen[sbd]) { errors.push('Trùng SBD ' + sbd + ' (dòng ' + (i + 1) + ')'); return; }
      if (!parts[1]) errors.push('Thiếu họ tên SBD ' + sbd);
      seen[sbd] = true;
      rows.push({ MaKyThi: maKyThi, SBD: sbd, HoTen: parts[1] || '', Lop: parts[2] || '', Email: parts[3] || '' });
    });
    var hub = S_hub();
    var old = Repo_students(maKyThi);
    var oldMap = {};
    old.forEach(function (s) { oldMap[U_upper(s.SBD)] = s; });
    rows.forEach(function (r) {
      var o = oldMap[r.SBD];
      if (o) { r.MaDe = o.MaDe; r.LinkThi = o.LinkThi; r.GhiChu = o.GhiChu; }
    });
    if (mode === 'THEM') {
      var keep = old.filter(function (s) { return !seen[U_upper(s.SBD)]; });
      rows = keep.concat(rows);
    }
    var clean = rows.map(function (r) { var o = {}; HEADERS[SH.THI_SINH].forEach(function (h) { o[h] = r[h]; }); return o; });
    S_replaceWhere(hub, SH.THI_SINH, function (o) { return U_str(o.MaKyThi) === maKyThi; }, clean);
    S_log('NHAP_THI_SINH', maKyThi + ': ' + clean.length);
    return { count: clean.length, errors: errors };
  });
}

function EC_students(maKyThi) {
  return Repo_students(maKyThi).map(function (s) {
    return { sbd: s.SBD, hoTen: U_str(s.HoTen), lop: U_str(s.Lop), email: U_str(s.Email), maDe: s.MaDe, link: U_str(s.LinkThi) };
  });
}

/** Phân mã đề: NGAU_NHIEN (trộn rồi chia đều) hoặc THU_TU (lần lượt theo danh sách) */
function EC_assign(maKyThi, method) {
  return S_withLock(function () {
    var r = Repo_examRow(maKyThi);
    // Kỳ thi đã từng mở: KHÔNG đổi mã đề của người đã có (tránh lệch bài đã làm), chỉ phân cho thí sinh mới thêm
    var onlyNew = ES_stage(r.TrangThai) >= ES_stage(TT_KY_THI.DANG_THI);
    var vRows = Repo_variantRows(maKyThi);
    if (!vRows.length) throw new Error('Chưa sinh mã đề');
    var codes = vRows.map(function (v) { return U_str(v.MaDe); });
    var links = {};
    vRows.forEach(function (v) { links[U_str(v.MaDe)] = U_str(v.LinkThi); });
    var st = Repo_students(maKyThi);
    if (!st.length) throw new Error('Chưa có thí sinh');
    var map = {}, cnt0 = {};
    codes.forEach(function (c) { cnt0[c] = 0; });
    var todo = st;
    if (onlyNew) {
      st.forEach(function (s) { if (s.MaDe && cnt0[s.MaDe] !== undefined) { map[s.SBD] = s.MaDe; cnt0[s.MaDe]++; } });
      todo = st.filter(function (s) { return !map[s.SBD]; });
      if (!todo.length) throw new Error('Kỳ thi đã từng mở nên giữ nguyên mã đề của thí sinh cũ — và mọi thí sinh đều đã có mã đề. Muốn cho một em thi lại: tab ⑤ › bảng giám sát › nút ♻ Cho làm lại.');
    }
    var order = method === 'THU_TU' ? todo.slice() : U_shuffle(todo, U_rng(maKyThi + '|assign|' + Date.now()));
    order.forEach(function (s) {
      var md = codes.slice().sort(function (a, b) { return cnt0[a] - cnt0[b]; })[0];  // chia đều
      map[s.SBD] = md; cnt0[md]++;
    });
    S_update(S_hub(), SH.THI_SINH, function (o) { return U_str(o.MaKyThi) === maKyThi; }, function (o) {
      var md = map[U_str(o.SBD)];
      return { MaDe: md, LinkThi: links[md] || '' };
    });
    var upd = EC_syncValidation(maKyThi);
    S_log('PHAN_DE', maKyThi + ' (' + method + ')');
    var cnt = {};
    codes.forEach(function (c) { cnt[c] = 0; });
    Object.keys(map).forEach(function (k) { cnt[map[k]]++; });
    return { perVariant: cnt, formsUpdated: upd, onlyNew: onlyNew, assignedNew: order.length };
  });
}

/** Cập nhật ràng buộc SBD trên các Form đã xuất theo phân công hiện tại */
function EC_syncValidation(maKyThi) {
  var st = Repo_students(maKyThi);
  var n = 0;
  Repo_variantRows(maKyThi).forEach(function (v) {
    if (!U_str(v.FormId) || !U_str(v.ItemIdSBD)) return;
    try {
      var form = FormApp.openById(U_str(v.FormId));
      var item = form.getItemById(Number(v.ItemIdSBD)).asTextItem();
      FX_applySbdValidation(item, st.filter(function (s) { return s.MaDe === U_str(v.MaDe); }).map(function (s) { return s.SBD; }));
      n++;
    } catch (e) { /* bỏ qua form lỗi */ }
  });
  return n;
}

function EC_forms(maKyThi) {
  return Repo_variantRows(maKyThi).filter(function (v) { return U_str(v.FormId); }).map(function (v) {
    return { maDe: U_str(v.MaDe), form: FormApp.openById(U_str(v.FormId)) };
  });
}

/** MỞ THI: mọi Form nhận bài */
function EC_open(maKyThi) {
  return S_withLock(function () {
    var r = Repo_examRow(maKyThi);
    var stg = ES_stage(r.TrangThai);
    if (stg < ES_stage(TT_KY_THI.DA_XUAT)) throw new Error('Phải xuất Form cho tất cả mã đề trước khi mở thi.');
    var noAssign = Repo_students(maKyThi).filter(function (s) { return !s.MaDe; }).length;
    var forms = EC_forms(maKyThi);
    forms.forEach(function (f) {
      FX_try(function () { if (typeof f.form.isPublished === 'function' && !f.form.isPublished()) f.form.setPublished(true); });
      f.form.setAcceptingResponses(true);
    });
    var patch = { TrangThai: TT_KY_THI.DANG_THI };
    if (!U_str(r.MoLuc)) patch.MoLuc = S_now();
    Repo_setExam(maKyThi, patch);
    S_log('MO_THI', maKyThi);
    return { opened: forms.length, warn: noAssign ? noAssign + ' thí sinh chưa được phân mã đề' : '' };
  });
}

/** ĐÓNG THI: mọi Form ngừng nhận bài */
function EC_close(maKyThi, auto) {
  return S_withLock(function () {
    var forms = EC_forms(maKyThi);
    forms.forEach(function (f) { f.form.setAcceptingResponses(false); });
    var r = Repo_examRow(maKyThi);
    var patch = { DongLuc: S_now(), TuDongDongLuc: '' };
    if (ES_stage(r.TrangThai) <= ES_stage(TT_KY_THI.DANG_THI)) patch.TrangThai = TT_KY_THI.DA_DONG;
    Repo_setExam(maKyThi, patch);
    S_log(auto ? 'TU_DONG_DONG_THI' : 'DONG_THI', maKyThi);
    return { closed: forms.length };
  });
}

/** Hẹn giờ tự đóng (giờ địa phương 'yyyy-MM-ddTHH:mm'). Chuỗi rỗng = huỷ hẹn. */
function EC_scheduleClose(maKyThi, localDateTime) {
  var s = U_str(localDateTime);
  if (!s) {
    Repo_setExam(maKyThi, { TuDongDongLuc: '' });
    EC_rescheduleTrigger();
    return { scheduled: '' };
  }
  var d = EC_parseLocal(s);
  if (d.getTime() <= Date.now() + 30 * 1000) throw new Error('Thời điểm đóng phải ở tương lai');
  Repo_setExam(maKyThi, { TuDongDongLuc: Utilities.formatDate(d, APP.TZ, 'yyyy-MM-dd HH:mm') });
  EC_rescheduleTrigger();
  S_log('HEN_GIO_DONG', maKyThi + ' ' + s);
  return { scheduled: Utilities.formatDate(d, APP.TZ, 'yyyy-MM-dd HH:mm') };
}

/** '2026-11-20T09:30' hoặc '2026-11-20 09:30' theo múi giờ Việt Nam -> Date */
function EC_parseLocal(s) {
  var m = U_str(s).match(/^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})/);
  if (!m) throw new Error('Định dạng thời gian không hợp lệ: ' + s);
  return Utilities.parseDate(m[1] + '-' + m[2] + '-' + m[3] + ' ' + m[4] + ':' + m[5] + ':00', APP.TZ, 'yyyy-MM-dd HH:mm:ss');
}

/** Giữ đúng 1 trigger một-lần cho lần đóng sớm nhất đang chờ */
function EC_rescheduleTrigger() {
  ScriptApp.getProjectTriggers().forEach(function (t) {
    if (t.getHandlerFunction() === 'EC_autoCloseTick') ScriptApp.deleteTrigger(t);
  });
  var next = null;
  Repo_examRows().forEach(function (r) {
    if (!U_str(r.TuDongDongLuc)) return;
    var d = EC_parseLocal(U_str(r.TuDongDongLuc));
    if (!next || d < next) next = d;
  });
  if (next) {
    var at = new Date(Math.max(next.getTime(), Date.now() + 60 * 1000));
    ScriptApp.newTrigger('EC_autoCloseTick').timeBased().at(at).create();
  }
}

/** Được trigger gọi: đóng các kỳ thi đến giờ */
function EC_autoCloseTick() {
  Repo_clearCache();
  var now = Date.now();
  Repo_examRows().forEach(function (r) {
    if (!U_str(r.TuDongDongLuc)) return;
    if (EC_parseLocal(U_str(r.TuDongDongLuc)).getTime() <= now + 30 * 1000) {
      try { EC_close(U_str(r.MaKyThi), true); } catch (e) { S_log('LOI_TU_DONG_DONG', U_str(r.MaKyThi) + ': ' + e.message); }
    }
  });
  Repo_clearCache();
  EC_rescheduleTrigger();
}

/** Theo dõi: số bài nộp mỗi mã đề, trạng thái nhận bài */
function EC_monitor(maKyThi) {
  var r = Repo_examRow(maKyThi);
  var st = Repo_students(maKyThi);
  var perV = U_groupBy(st, function (s) { return s.MaDe || '(chưa phân)'; });
  var rows = Repo_variantRows(maKyThi).map(function (v) {
    var o = { maDe: U_str(v.MaDe), link: U_str(v.LinkThi), linkSua: U_str(v.LinkSua), soThiSinh: (perV[U_str(v.MaDe)] || []).length,
      soBai: null, nhanBai: null };
    if (U_str(v.FormId)) {
      try {
        var f = FormApp.openById(U_str(v.FormId));
        o.soBai = f.getResponses().length;
        o.nhanBai = f.isAcceptingResponses();
      } catch (e) { o.loi = e.message; }
    }
    return o;
  });
  return { trangThai: U_str(r.TrangThai), moLuc: U_str(r.MoLuc), dongLuc: U_str(r.DongLuc), tuDongDong: U_str(r.TuDongDongLuc),
    thoiGian: U_num(r.ThoiGianPhut, 0), variants: rows, tongThiSinh: st.length,
    tongBai: rows.reduce(function (a, x) { return a + (x.soBai || 0); }, 0), now: S_now() };
}
