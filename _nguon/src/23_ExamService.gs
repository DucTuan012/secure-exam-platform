/**
 * 23_ExamService.gs — Kỳ thi, sinh đề nháp, đổi/khoá câu, chốt đề, ma trận
 */

function ES_examList() {
  return Repo_examRows().map(function (r) {
    return {
      maKyThi: U_str(r.MaKyThi), ten: U_str(r.TenKyThi), maMon: U_str(r.MaMon), maMaTran: U_str(r.MaMaTran),
      cheDo: U_str(r.CheDo), soMaDe: U_num(r.SoMaDe, 1), maDeBatDau: U_str(r.MaDeBatDau), tronCau: U_str(r.TronCau),
      tronDapAn: U_str(r.TronDapAn), tronYDungSai: U_str(r.TronYDungSai), thoiGian: U_num(r.ThoiGianPhut, 0),
      ngayThi: U_str(r.NgayThi), trangThai: U_str(r.TrangThai) || TT_KY_THI.NHAP, moLuc: U_str(r.MoLuc), dongLuc: U_str(r.DongLuc),
      tuDongDong: U_str(r.TuDongDongLuc), ghiChu: U_str(r.GhiChu), lanSinh: U_num(r.LanSinh, 0)
    };
  });
}

var ES_ORDER = [TT_KY_THI.NHAP, TT_KY_THI.DA_SINH, TT_KY_THI.DA_CHOT, TT_KY_THI.DA_XUAT, TT_KY_THI.DANG_THI, TT_KY_THI.DA_DONG, TT_KY_THI.DA_CHAM];
function ES_stage(st) { var i = ES_ORDER.indexOf(U_str(st) || TT_KY_THI.NHAP); return i < 0 ? 0 : i; }

/** Tạo / cập nhật kỳ thi */
function ES_saveExam(o) {
  var ma = U_upper(o.maKyThi).replace(/[^A-Z0-9_\-]/g, '');
  if (!ma) throw new Error('Mã kỳ thi chỉ gồm chữ không dấu, số, _ hoặc -');
  if (!U_str(o.ten)) throw new Error('Chưa nhập tên kỳ thi');
  Repo_subject(o.maMon);
  var mx = Repo_matrix(o.maMaTran);
  if (!mx.sections.length) throw new Error('Ma trận ' + o.maMaTran + ' chưa có Phần nào');
  var hub = S_hub();
  var cur = Repo_examRows().filter(function (r) { return U_str(r.MaKyThi) === ma; })[0];
  var row = {
    MaKyThi: ma, TenKyThi: U_str(o.ten), MaMon: U_str(o.maMon), MaMaTran: U_str(o.maMaTran),
    CheDo: o.cheDo === CHE_DO.A_TRON ? CHE_DO.A_TRON : CHE_DO.B_KHAC, SoMaDe: Math.max(1, Math.round(U_num(o.soMaDe, 1))),
    MaDeBatDau: U_str(o.maDeBatDau) || '101', TronCau: o.tronCau ? 'CO' : 'KHONG', TronDapAn: o.tronDapAn ? 'CO' : 'KHONG',
    TronYDungSai: o.tronYDungSai ? 'CO' : 'KHONG', ThoiGianPhut: U_num(o.thoiGian, 0), NgayThi: U_str(o.ngayThi), GhiChu: U_str(o.ghiChu)
  };
  if (cur) {
    var stage = ES_stage(cur.TrangThai);
    var structural = ['MaMon', 'MaMaTran', 'CheDo', 'SoMaDe', 'MaDeBatDau', 'TronCau', 'TronDapAn', 'TronYDungSai'];
    var changed = structural.filter(function (k) { return U_str(cur[k]) !== U_str(row[k]); });
    if (changed.length && stage >= ES_stage(TT_KY_THI.DA_XUAT)) {
      throw new Error('Kỳ thi đã xuất Form — không thể đổi: ' + changed.join(', ') + '. Hãy tạo kỳ thi mới.');
    }
    if (changed.length && stage >= ES_stage(TT_KY_THI.DA_SINH)) row.TrangThai = TT_KY_THI.NHAP; // cần sinh lại
    S_update(hub, SH.KY_THI, function (r) { return U_str(r.MaKyThi) === ma; }, row);
  } else {
    row.TrangThai = TT_KY_THI.NHAP; row.HatGiong = U_randomId(8); row.LanSinh = 0; row.NgayTao = S_now();
    S_append(hub, SH.KY_THI, [row]);
  }
  S_log('LUU_KY_THI', ma);
  return { maKyThi: ma };
}

/** Kiểm tra form của kỳ thi đã có bài nộp chưa */
function ES_responsesCount(maKyThi) {
  var n = 0;
  Repo_variantRows(maKyThi).forEach(function (v) {
    if (!U_str(v.FormId)) return;
    try { n += FormApp.openById(U_str(v.FormId)).getResponses().length; } catch (e) { }
  });
  return n;
}

/** Sinh (hoặc sinh lại) toàn bộ mã đề — giữ các câu đã khoá */
function ES_generate(maKyThi) {
  return S_withLock(function () {
    Repo_clearCache();
    var hub = S_hub();
    var r = Repo_examRow(maKyThi);
    var stage = ES_stage(r.TrangThai);
    if (stage >= ES_stage(TT_KY_THI.DA_CHOT)) {
      throw new Error('Đề đã chốt. Bấm "Mở chốt" trước khi sinh lại.');
    }
    var lan = U_num(r.LanSinh, 0) + 1;
    r.LanSinh = lan;
    var exam = Gen_examFromRow(r);
    var bank = Repo_bank(exam.maMon);
    var mx = Repo_matrix(exam.maMaTran);
    var prev = Repo_items(maKyThi);
    // kỳ thi CHỈ lập trình: ma trận 0 câu → các mã đề rỗng (đề thi là các bài lập trình gắn ở tab ⑧)
    var ltOnly = LT_examCfg(r).bai.length > 0 && !mx.totalQuestions;
    var g = ltOnly ? { errors: [], warnings: [], variants: Array.apply(null, Array(exam.soMaDe || 1)).map(function (_, i) {
      return { maDe: String((Number(exam.maDeBatDau) || 101) + i), items: [] };
    }) } : Gen_generate(exam, mx, bank, prev);
    if (g.errors.length) return { ok: false, errors: g.errors, warnings: g.warnings };
    var items = [];
    g.variants.forEach(function (v) { items = items.concat(v.items); });
    S_replaceWhere(hub, SH.DE_THI, function (o) { return U_str(o.MaKyThi) === exam.maKyThi; }, items);
    var oldV = {};
    Repo_variantRows(maKyThi).forEach(function (v) { oldV[U_str(v.MaDe)] = v; });
    var vRows = g.variants.map(function (v) {
      var o = oldV[v.maDe] || {};
      return { MaKyThi: exam.maKyThi, MaDe: v.maDe, SoCau: v.items.length, TrangThai: 'NHAP', FormId: U_str(o.FormId),
        LinkSua: U_str(o.LinkSua), LinkThi: U_str(o.LinkThi), ItemIdSBD: '', ItemIdHoTen: '', NgayXuat: '', GhiChu: '' };
    });
    var dropped = Object.keys(oldV).filter(function (md) { return !g.variants.some(function (v) { return v.maDe === md; }) && U_str(oldV[md].FormId); });
    S_replaceWhere(hub, SH.MA_DE, function (o) { return U_str(o.MaKyThi) === exam.maKyThi; }, vRows);
    var sections = mx.sections.map(function (s) { return { phan: s.phan, ten: s.ten, diem: s.diem }; });
    Repo_setExam(maKyThi, { LanSinh: lan, TrangThai: TT_KY_THI.DA_SINH, CauTrucPhan: JSON.stringify(sections) });
    S_log('SINH_DE', maKyThi + ' lần ' + lan + ' — ' + g.variants.length + ' mã đề');
    var warn = g.warnings.slice();
    if (dropped.length) warn.push('Các mã đề cũ không còn dùng (Form vẫn còn trên Drive): ' + dropped.join(', '));
    return { ok: true, warnings: warn, stats: g.stats };
  });
}

/** Dữ liệu xem trước các mã đề */
function ES_variants(maKyThi) {
  Repo_clearCache();
  var r = Repo_examRow(maKyThi);
  var exam = Gen_examFromRow(r);
  var bank = Repo_bank(exam.maMon);
  var items = Repo_items(maKyThi);
  var byV = U_groupBy(items, function (x) { return x.MaDe; });
  var vRows = Repo_variantRows(maKyThi);
  var sections = Repo_sections(r);
  var variants = vRows.map(function (v) {
    var list = (byV[U_str(v.MaDe)] || []).sort(function (a, b) { return Number(a.STT) - Number(b.STT); });
    var lastG = null;
    return {
      maDe: U_str(v.MaDe), formId: U_str(v.FormId), linkSua: U_str(v.LinkSua), linkThi: U_str(v.LinkThi),
      trangThai: U_str(v.TrangThai), ngayXuat: U_str(v.NgayXuat),
      items: list.map(function (it) {
        var q = bank.questions[it.MaCH];
        var perm = U_str(it.ThuTu) ? U_str(it.ThuTu).split(',') : [];
        var o = {
          stt: Number(it.STT), phan: it.Phan, maCH: it.MaCH, maNhom: U_str(it.MaNhom), dang: U_str(it.DangCau),
          mucDo: U_str(it.MucDo), maChuDe: U_str(it.MaChuDe), dapAn: U_str(it.DapAnMaDe), dapAnGoc: U_str(it.DapAnGoc),
          khoa: U_bool(it.Khoa, false), diem: U_num(it.Diem, 0), missing: !q
        };
        if (q) {
          o.vi = q.vi; o.en = q.en; o.latex = q.latex; o.hinh = q.hinh.length; o.video = q.video; o.amThanh = q.amThanh;
          o.options = perm.map(function (L, i) {
            var op = q.options[U_letterIndex(L)] || { vi: '?', en: '' };
            return { label: APP.LETTERS[i], goc: L, vi: op.vi, en: op.en };
          });
          o.right = q.right;
          o.loiGiai = q.loiGiaiVi;
          if (q.maNhom && q.maNhom !== lastG && bank.groups[q.maNhom]) {
            var g = bank.groups[q.maNhom];
            o.group = { id: g.id, vi: g.vi, en: g.en, latex: g.latex, hinh: g.hinh.length };
          }
        }
        lastG = q ? q.maNhom : null;
        return o;
      })
    };
  });
  var stats = Gen_stats(variants.map(function (v) {
    return { maDe: v.maDe, items: v.items.map(function (x) { return { MaCH: x.maCH, MucDo: x.mucDo }; }) };
  }), bank);
  return { exam: ES_examList().filter(function (x) { return x.maKyThi === exam.maKyThi; })[0], sections: sections,
    variants: variants, stats: stats, levels: Repo_levels() };
}

function ES_requireEditable(r) {
  if (ES_stage(r.TrangThai) !== ES_stage(TT_KY_THI.DA_SINH)) {
    throw new Error('Chỉ đổi/khoá câu khi đề ở trạng thái DA_SINH_DE (chưa chốt). Trạng thái: ' + U_str(r.TrangThai));
  }
}

function ES_swap(maKyThi, maDe, maCH) {
  return S_withLock(function () {
    Repo_clearCache();
    var r = Repo_examRow(maKyThi);
    ES_requireEditable(r);
    var exam = Gen_examFromRow(r);
    var bank = Repo_bank(exam.maMon);
    var mx = Repo_matrix(exam.maMaTran);
    var items = Repo_items(maKyThi);
    var res = Gen_swap(exam, mx, bank, items, String(maDe), String(maCH), Date.now());
    if (!res.items) throw new Error(res.error);
    S_replaceWhere(S_hub(), SH.DE_THI, function (o) { return U_str(o.MaKyThi) === exam.maKyThi; }, res.items);
    S_log('DOI_CAU', maKyThi + ' ' + maDe + ': ' + res.oldUid + ' -> ' + res.newUid);
    return { oldUid: res.oldUid, newUid: res.newUid };
  });
}

function ES_lock(maKyThi, maDe, maCH, value) {
  return S_withLock(function () {
    var r = Repo_examRow(maKyThi);
    ES_requireEditable(r);
    var items = Repo_items(maKyThi);
    var target = items.filter(function (x) { return x.MaDe === String(maDe) && x.MaCH === String(maCH); })[0];
    if (!target) throw new Error('Không tìm thấy câu');
    var uid = Gen_uidOfItem(target);
    var allVariants = U_upper(r.CheDo) === CHE_DO.A_TRON;
    var n = S_update(S_hub(), SH.DE_THI, function (o) {
      return U_str(o.MaKyThi) === U_str(maKyThi) && (allVariants || U_str(o.MaDe) === String(maDe)) && Gen_uidOfItem({ MaNhom: U_str(o.MaNhom), MaCH: U_str(o.MaCH) }) === uid;
    }, { Khoa: value ? 'TRUE' : 'FALSE' });
    return { updated: n };
  });
}

function ES_finalize(maKyThi) {
  return S_withLock(function () {
    Repo_clearCache();
    var r = Repo_examRow(maKyThi);
    if (ES_stage(r.TrangThai) !== ES_stage(TT_KY_THI.DA_SINH)) throw new Error('Chỉ chốt được khi đã sinh đề (DA_SINH_DE)');
    var exam = Gen_examFromRow(r);
    var bank = Repo_bank(exam.maMon);
    var bad = Repo_items(maKyThi).filter(function (it) { var q = bank.questions[it.MaCH]; return !q || !q.valid || !q.active; })
      .map(function (it) { return it.MaDe + ':' + it.MaCH; });
    if (bad.length) throw new Error('Có câu không còn hợp lệ / đã ẩn trong ngân hàng: ' + bad.join(', ') + '. Hãy Đổi câu hoặc sửa ngân hàng.');
    Repo_setExam(maKyThi, { TrangThai: TT_KY_THI.DA_CHOT });
    S_log('CHOT_DE', maKyThi);
    return { ok: true };
  });
}

function ES_unfinalize(maKyThi) {
  return S_withLock(function () {
    var r = Repo_examRow(maKyThi);
    var st = ES_stage(r.TrangThai);
    if (st < ES_stage(TT_KY_THI.DA_CHOT)) return { ok: true };
    if (st >= ES_stage(TT_KY_THI.DANG_THI)) throw new Error('Kỳ thi đã mở / đã thi — không thể mở chốt.');
    var n = ES_responsesCount(maKyThi);
    if (n > 0) throw new Error('Form đã có ' + n + ' bài nộp — không thể mở chốt.');
    Repo_setExam(maKyThi, { TrangThai: TT_KY_THI.DA_SINH });
    S_log('MO_CHOT', maKyThi);
    return { ok: true, note: st >= ES_stage(TT_KY_THI.DA_XUAT) ? 'Sau khi chỉnh sửa cần Chốt và Xuất Form lại (Form cũ được dùng lại, link không đổi).' : '' };
  });
}

/* ---------------- Ma trận ---------------- */

function ES_matrixRaw(maMaTran) {
  var hub = S_hub();
  return {
    sections: S_read(hub, SH.MT_PHAN).filter(function (r) { return U_str(r.MaMaTran) === maMaTran; }).map(ES_clean),
    cells: S_read(hub, SH.MT_CHITIET).filter(function (r) { return U_str(r.MaMaTran) === maMaTran; }).map(ES_clean)
  };
}
function ES_clean(r) { var o = {}; Object.keys(r).forEach(function (k) { if (k !== '__row') o[k] = U_str(r[k]); }); return o; }

function ES_saveMatrix(maMaTran, maMon, ten, sections, cells) {
  var id = U_upper(maMaTran).replace(/[^A-Z0-9_\-]/g, '');
  if (!id) throw new Error('Mã ma trận không hợp lệ');
  var used = Repo_examRows().filter(function (r) { return U_str(r.MaMaTran) === id && ES_stage(r.TrangThai) >= ES_stage(TT_KY_THI.DA_CHOT); });
  var hub = S_hub();
  var secRows = (sections || []).filter(function (s) { return U_str(s.Phan); }).map(function (s) {
    return { MaMaTran: id, MaMon: U_str(maMon), TenMaTran: U_str(ten), Phan: U_str(s.Phan), TenPhan: U_str(s.TenPhan),
      DiemPhan: U_str(s.DiemPhan), TongSoCau: U_str(s.TongSoCau), DangCauChoPhep: U_str(s.DangCauChoPhep), GhiChu: U_str(s.GhiChu) };
  });
  var phans = secRows.map(function (s) { return s.Phan; });
  var cellRows = (cells || []).filter(function (c) { return U_str(c.Phan); }).map(function (c) {
    if (phans.indexOf(U_str(c.Phan)) < 0) throw new Error('Ô ma trận thuộc Phần "' + c.Phan + '" chưa khai báo');
    return { MaMaTran: id, Phan: U_str(c.Phan), Chuong: U_str(c.Chuong), MaChuDe: U_str(c.MaChuDe), MucDo: U_str(c.MucDo),
      DangCau: U_str(c.DangCau), SoCau: U_str(c.SoCau), TiLe: U_str(c.TiLe), GhiChu: U_str(c.GhiChu) };
  });
  S_replaceWhere(hub, SH.MT_PHAN, function (r) { return U_str(r.MaMaTran) === id; }, secRows);
  S_replaceWhere(hub, SH.MT_CHITIET, function (r) { return U_str(r.MaMaTran) === id; }, cellRows);
  S_log('LUU_MA_TRAN', id);
  var mx = Repo_matrix(id);
  return { id: id, issues: mx.issues, totalPoints: mx.totalPoints, totalQuestions: mx.totalQuestions,
    note: used.length ? 'Lưu ý: kỳ thi đã chốt dùng ma trận này vẫn giữ cấu trúc cũ (đã chụp lúc sinh đề).' : '' };
}

function ES_checkMatrix(maMaTran, maMon, nVariants, cheDo) {
  Repo_clearCache();
  var mx = Repo_matrix(maMaTran);
  var bank = Repo_bank(maMon || mx.maMon);
  var feas = Mx_feasibility(mx, bank, U_num(nVariants, 1), cheDo);
  // chạy thử sinh đề để phát hiện tranh chấp giữa các ô
  var trial = Gen_generate({ maKyThi: 'THU', cheDo: cheDo, soMaDe: U_num(nVariants, 1), maDeBatDau: '1', tronCau: true,
    tronDapAn: true, tronYDungSai: true, seed: 'trial|' + Date.now() }, mx, bank, []);
  return { issues: mx.issues, feasibility: feas, trialErrors: trial.errors, trialStats: trial.stats || null,
    totalPoints: mx.totalPoints, totalQuestions: mx.totalQuestions };
}
