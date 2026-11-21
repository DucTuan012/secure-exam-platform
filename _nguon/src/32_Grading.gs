/**
 * 32_Grading.gs — Thu bài từ Form, chấm, tổng hợp kết quả, phúc khảo, báo cáo
 */

/** Đọc bài nộp của 1 mã đề từ Form, chấm và lưu vào sheet BaiLam */
function GR_collectVariant(maKyThi, maDe) {
  return S_withLock(function () {
    Repo_clearCache();
    maDe = String(maDe);
    var cfg = Repo_config();
    var exRow = Repo_examRow(maKyThi);
    var v = Repo_variantRows(maKyThi).filter(function (x) { return U_str(x.MaDe) === maDe; })[0];
    if (!v || !U_str(v.FormId)) throw new Error('Mã đề ' + maDe + ' chưa xuất Form');
    var form = FormApp.openById(U_str(v.FormId));
    var items = Repo_items(maKyThi).filter(function (x) { return x.MaDe === maDe; });
    var sections = Repo_sections(exRow);
    var reviews = Grade_reviewMap(Repo_reviews(maKyThi), maKyThi);
    var digits = U_num(cfg.LAM_TRON, 2);
    var sbdId = U_str(v.ItemIdSBD), nameId = U_str(v.ItemIdHoTen);
    var rows = form.getResponses().map(function (resp) {
      var answers = {};
      resp.getItemResponses().forEach(function (ir) { answers[String(ir.getItem().getId())] = ir.getResponse(); });
      return GR_row(maKyThi, maDe, resp.getId(), Utilities.formatDate(resp.getTimestamp(), APP.TZ, 'yyyy-MM-dd HH:mm:ss'),
        answers, sbdId, nameId, items, sections, reviews, digits, exRow);
    });
    S_replaceWhere(S_hub(), SH.BAI_LAM, function (o) {
      return U_str(o.MaKyThi) === maKyThi && U_str(o.MaDe) === maDe && !GR_isWebId(o.ResponseId);
    }, rows);
    return { maDe: maDe, count: rows.length };
  });
}

function GR_row(maKyThi, maDe, respId, time, answers, sbdId, nameId, items, sections, reviews, digits, exRow) {
  var g = Grade_submission(items, answers, sections, reviews, digits);
  var order = sections.map(function (s) { return String(s.phan); });
  return {
    MaKyThi: maKyThi, MaDe: maDe, ResponseId: respId, ThoiDiemNop: time,
    SBD: U_upper(answers[sbdId]), HoTen: U_str(answers[nameId]), TongDiem: g.total, SoCauDung: g.soDung, TongSoCau: g.tongSoCau,
    ChiTietPhan: Grade_sectionSummary(g.sections, order),
    TraLoi: JSON.stringify(answers),
    KetQuaCau: g.perItem.map(function (p) { return p.maCH + '=' + (p.removed ? '-' : (p.ok ? '1' : '0')); }).join(';'),
    LanCham: S_now()
  };
}

/** Bài từ phòng thi web (WEB-…) hoặc nhập tay từ giấy (GIAY-…) */
function GR_isWebId(id) { return /^(WEB|GIAY)-/.test(U_str(id)); }

/** Chấm lại toàn bộ từ dữ liệu đã lưu trong BaiLam (dùng sau phúc khảo, không cần mở Form) */
function GR_regradeStored(maKyThi) {
  return S_withLock(function () {
    Repo_clearCache();
    var cfg = Repo_config();
    var exRow = Repo_examRow(maKyThi);
    var sections = Repo_sections(exRow);
    var reviews = Grade_reviewMap(Repo_reviews(maKyThi), maKyThi);
    var digits = U_num(cfg.LAM_TRON, 2);
    var items = Repo_items(maKyThi);
    var byV = U_groupBy(items, function (x) { return x.MaDe; });
    var vmap = {};
    Repo_variantRows(maKyThi).forEach(function (v) { vmap[U_str(v.MaDe)] = v; });
    var old = S_read(S_hub(), SH.BAI_LAM).filter(function (o) { return U_str(o.MaKyThi) === maKyThi; });
    var rows = old.map(function (o) {
      var md = U_str(o.MaDe), v = vmap[md] || {};
      var answers = {};
      try { answers = JSON.parse(U_str(o.TraLoi) || '{}'); } catch (e) { }
      var web = GR_isWebId(o.ResponseId);
      var g = GR_row(maKyThi, md, U_str(o.ResponseId), U_str(o.ThoiDiemNop), answers,
        web ? '__SBD' : U_str(v.ItemIdSBD), web ? '__HOTEN' : U_str(v.ItemIdHoTen),
        web ? PK_webItems(byV[md] || []) : (byV[md] || []), sections, reviews, digits, exRow);
      g.CanhBaoThem = U_str(o.CanhBaoThem);
      return g;
    });
    S_ensureSheet(S_hub(), SH.BAI_LAM, HEADERS[SH.BAI_LAM]);
    S_replaceWhere(S_hub(), SH.BAI_LAM, function (o) { return U_str(o.MaKyThi) === maKyThi; }, rows);
    S_log('CHAM_LAI', maKyThi + ': ' + rows.length + ' bài');
    return { count: rows.length };
  });
}

/** Tổng hợp: chọn bài chính thức mỗi thí sinh (bài nộp ĐẦU TIÊN), gắn cảnh báo, ghi KetQua + dữ liệu phân tích */
function GR_compile(maKyThi) {
  return S_withLock(function () {
    Repo_clearCache();
    var hub = S_hub();
    var exRow = Repo_examRow(maKyThi);
    var exam = Gen_examFromRow(exRow);
    var sections = Repo_sections(exRow);
    var students = Repo_students(maKyThi);
    var stMap = {};
    students.forEach(function (s) { stMap[U_upper(s.SBD)] = s; });
    var subs = S_read(hub, SH.BAI_LAM).filter(function (o) { return U_str(o.MaKyThi) === maKyThi; });
    var bySbd = U_groupBy(subs, function (o) { return U_upper(o.SBD) || '(trống)'; });
    var items = Repo_items(maKyThi);
    var itemMeta = {};
    items.forEach(function (it) { itemMeta[it.MaDe + '|' + it.MaCH] = it; });
    var topics = {};
    try { topics = Repo_bank(exam.maMon).topics; } catch (e) { }
    var ltMax = LT_total(exRow), ltSc = ltMax ? LT_scores(maKyThi) : {};
    var now = S_now();
    var results = [], secRows = [], topicRows = [];

    Object.keys(bySbd).forEach(function (sbd) {
      var list = bySbd[sbd].sort(function (a, b) { return U_str(a.ThoiDiemNop) < U_str(b.ThoiDiemNop) ? -1 : 1; });
      var paper = list.filter(function (o) { return /^GIAY-/.test(U_str(o.ResponseId)); });
      var main = paper.length ? paper[paper.length - 1] : list[0], st = stMap[sbd];
      var flags = [];
      if (!st) flags.push('SBD không có trong danh sách');
      if (paper.length && list.length > 1) flags.push('Dùng bài làm trên giấy (nhập tay) thay cho bài trực tuyến');
      else if (list.length > 1) flags.push('Nộp ' + list.length + ' lần (tính bài đầu tiên)');
      if (U_str(main.CanhBaoThem)) flags.push(U_str(main.CanhBaoThem));
      if (st && st.MaDe && st.MaDe !== U_str(main.MaDe)) flags.push('Làm sai mã đề (được phân ' + st.MaDe + ', làm ' + main.MaDe + ')');
      if (st && U_normName(st.HoTen) !== U_normName(main.HoTen)) flags.push('Họ tên khác danh sách ("' + U_str(main.HoTen) + '")');
      if (!GR_isWebId(main.ResponseId) && U_str(exRow.DongLuc) && U_str(main.ThoiDiemNop) > U_str(exRow.DongLuc)) flags.push('Nộp sau giờ đóng');
      var lop = st ? U_str(st.Lop) : '';
      var lt = ltMax ? (ltSc[sbd] || { diem: 0, max: ltMax, chiTiet: '', canhBao: [] }) : null;
      if (lt) flags = flags.concat(lt.canhBao);
      results.push({
        MaKyThi: maKyThi, SBD: sbd, HoTen: st ? U_str(st.HoTen) : U_str(main.HoTen), Lop: lop, MaDe: U_str(main.MaDe),
        TrangThai: st ? 'DA_NOP' : 'NGOAI_DS', TongDiem: U_round(U_num(main.TongDiem, 0) + (lt ? lt.diem : 0), U_num(Repo_config().LAM_TRON, 2)), SoCauDung: U_num(main.SoCauDung, 0),
        TongSoCau: U_num(main.TongSoCau, 0), ChiTietPhan: U_str(main.ChiTietPhan) + (lt ? (U_str(main.ChiTietPhan) ? '; ' : '') + 'LT: ' + lt.diem + '/' + lt.max : ''), ThoiDiemNop: U_str(main.ThoiDiemNop),
        SoLanNop: list.length, CanhBao: flags.join(' | '), ResponseId: U_str(main.ResponseId), LanCham: now,
        DiemLapTrinh: lt ? lt.diem : '', ChiTietLapTrinh: lt ? lt.chiTiet : ''
      });
      // điểm từng phần (dạng dài)
      U_str(main.ChiTietPhan).split(';').forEach(function (p) {
        var m = p.trim().match(/^(.+?):\s*([\d.]+)\/([\d.]+)$/);
        if (!m) return;
        var sec = sections.filter(function (s) { return String(s.phan) === m[1]; })[0] || (m[1] === 'LT' ? { ten: 'Lập trình' } : {});
        secRows.push({ MaKyThi: maKyThi, SBD: sbd, Lop: lop, MaDe: U_str(main.MaDe), Phan: m[1], TenPhan: sec.ten || '',
          Diem: Number(m[2]), DiemToiDa: Number(m[3]) });
      });
      // theo chủ đề
      var agg = {};
      U_str(main.KetQuaCau).split(';').forEach(function (p) {
        var kv = p.split('=');
        if (kv.length !== 2 || kv[1] === '-') return;
        var it = itemMeta[U_str(main.MaDe) + '|' + kv[0]];
        if (!it) return;
        var k = U_str(it.MaChuDe) + '|' + U_str(it.MucDo);
        agg[k] = agg[k] || { MaChuDe: U_str(it.MaChuDe), MucDo: U_str(it.MucDo), SoCau: 0, SoDung: 0 };
        agg[k].SoCau++; if (kv[1] === '1') agg[k].SoDung++;
      });
      Object.keys(agg).forEach(function (k) {
        var t = topics[agg[k].MaChuDe] || {};
        topicRows.push({ MaKyThi: maKyThi, SBD: sbd, Lop: lop, MaChuDe: agg[k].MaChuDe, Chuong: t.chuong || '', ChuDe: t.chuDe || '',
          MucDo: agg[k].MucDo, SoCau: agg[k].SoCau, SoDung: agg[k].SoDung });
      });
    });
    students.forEach(function (s) {
      if (bySbd[U_upper(s.SBD)]) return;
      results.push({ MaKyThi: maKyThi, SBD: U_upper(s.SBD), HoTen: U_str(s.HoTen), Lop: U_str(s.Lop), MaDe: s.MaDe, TrangThai: 'VANG',
        TongDiem: '', SoCauDung: '', TongSoCau: '', ChiTietPhan: '', ThoiDiemNop: '', SoLanNop: 0, CanhBao: 'Không có bài nộp', ResponseId: '', LanCham: now });
    });
    results.sort(function (a, b) { return a.SBD < b.SBD ? -1 : 1; });
    if (S_headers(hub.getSheetByName(SH.KET_QUA)).indexOf('DiemLapTrinh') < 0) S_ensureSheet(hub, SH.KET_QUA, HEADERS[SH.KET_QUA], { color: '#1b5e20' });
    S_replaceWhere(hub, SH.KET_QUA, function (o) { return U_str(o.MaKyThi) === maKyThi; }, results);
    S_replaceWhere(hub, SH.DIEM_PHAN, function (o) { return U_str(o.MaKyThi) === maKyThi; }, secRows);
    S_replaceWhere(hub, SH.KQ_CHU_DE, function (o) { return U_str(o.MaKyThi) === maKyThi; }, topicRows);
    if (ES_stage(exRow.TrangThai) >= ES_stage(TT_KY_THI.DA_DONG)) Repo_setExam(maKyThi, { TrangThai: TT_KY_THI.DA_CHAM });
    S_log('TONG_HOP_KET_QUA', maKyThi + ': ' + results.length);
    return { count: results.length, submitted: results.filter(function (r) { return r.TrangThai !== 'VANG'; }).length };
  });
}

/** Báo cáo cho bảng điều khiển */
function GR_report(maKyThi) {
  Repo_clearCache();
  var hub = S_hub();
  var exRow = Repo_examRow(maKyThi);
  var exam = Gen_examFromRow(exRow);
  var sections = Repo_sections(exRow);
  var maxTotal = (sections.reduce(function (a, s) { return a + Number(s.diem); }, 0) + LT_total(exRow)) || 100;
  var res = S_read(hub, SH.KET_QUA).filter(function (o) { return U_str(o.MaKyThi) === maKyThi; }).map(ES_clean);
  var done = res.filter(function (r) { return r.TrangThai !== 'VANG'; });
  var scores = done.map(function (r) { return Number(r.TongDiem) || 0; });
  var byLop = U_groupBy(done, function (r) { return r.Lop || '(không lớp)'; });
  var lop = Object.keys(byLop).sort().map(function (k) {
    var d = Grade_describe(byLop[k].map(function (r) { return Number(r.TongDiem) || 0; }));
    d.lop = k; return d;
  });
  // tỉ lệ đúng từng câu (từ bài chính thức)
  var official = {};
  done.forEach(function (r) { official[r.ResponseId] = true; });
  var subs = S_read(hub, SH.BAI_LAM).filter(function (o) { return U_str(o.MaKyThi) === maKyThi && official[U_str(o.ResponseId)]; });
  var q = {};
  subs.forEach(function (s) {
    U_str(s.KetQuaCau).split(';').forEach(function (p) {
      var kv = p.split('=');
      if (kv.length !== 2) return;
      q[kv[0]] = q[kv[0]] || { maCH: kv[0], n: 0, dung: 0, loai: kv[1] === '-' };
      if (kv[1] === '-') return;
      q[kv[0]].n++; if (kv[1] === '1') q[kv[0]].dung++;
    });
  });
  var items = Repo_items(maKyThi);
  var meta = {};
  items.forEach(function (it) { if (!meta[it.MaCH]) meta[it.MaCH] = it; });
  var qs = Object.keys(q).map(function (k) {
    var m = meta[k] || {};
    var o = q[k];
    o.rate = o.n ? Math.round(100 * o.dung / o.n) : null;
    o.dang = U_str(m.DangCau); o.phan = U_str(m.Phan); o.mucDo = U_str(m.MucDo); o.maChuDe = U_str(m.MaChuDe); o.dapAnGoc = U_str(m.DapAnGoc);
    return o;
  }).sort(function (a, b) { return (a.rate === null ? 999 : a.rate) - (b.rate === null ? 999 : b.rate); });
  var tRows = S_read(hub, SH.KQ_CHU_DE).filter(function (o) { return U_str(o.MaKyThi) === maKyThi; });
  var tAgg = {};
  tRows.forEach(function (t) {
    var k = U_str(t.MaChuDe);
    tAgg[k] = tAgg[k] || { maChuDe: k, chuong: U_str(t.Chuong), chuDe: U_str(t.ChuDe), soCau: 0, soDung: 0 };
    tAgg[k].soCau += Number(t.SoCau) || 0; tAgg[k].soDung += Number(t.SoDung) || 0;
  });
  var topicsOut = Object.keys(tAgg).sort().map(function (k) { var o = tAgg[k]; o.rate = o.soCau ? Math.round(100 * o.soDung / o.soCau) : null; return o; });
  var secAgg = {};
  S_read(hub, SH.DIEM_PHAN).filter(function (o) { return U_str(o.MaKyThi) === maKyThi; }).forEach(function (r) {
    var k = U_str(r.Phan);
    secAgg[k] = secAgg[k] || { phan: k, ten: U_str(r.TenPhan), sum: 0, n: 0, max: Number(r.DiemToiDa) || 0 };
    secAgg[k].sum += Number(r.Diem) || 0; secAgg[k].n++;
  });
  return {
    exam: { maKyThi: exam.maKyThi, ten: exam.ten, trangThai: U_str(exRow.TrangThai) }, maxTotal: maxTotal,
    summary: Grade_describe(scores), hist: Grade_histogram(scores, maxTotal), byClass: lop,
    sections: Object.keys(secAgg).map(function (k) { var s = secAgg[k]; return { phan: s.phan, ten: s.ten, mean: s.n ? U_round(s.sum / s.n, 2) : 0, max: s.max }; }),
    questions: qs, topics: topicsOut, results: res, vang: res.length - done.length,
    canhBao: done.filter(function (r) { return r.CanhBao; }).length,
    reviews: Repo_reviews(maKyThi).map(ES_clean)
  };
}

/** Thêm điều chỉnh phúc khảo */
function GR_addReview(maKyThi, maCH, action, value, reason) {
  action = U_upper(action);
  if ([PK.DOI_DAP_AN, PK.THEM_DAP_AN, PK.TANG_DIEM, PK.LOAI_CAU].indexOf(action) < 0) throw new Error('Hành động không hợp lệ');
  var it = Repo_items(maKyThi).filter(function (x) { return x.MaCH === U_str(maCH); })[0];
  if (!it) throw new Error('Câu ' + maCH + ' không có trong kỳ thi');
  if (action === PK.DOI_DAP_AN || action === PK.THEM_DAP_AN) {
    var pk = Bank_parseKey(U_str(it.DangCau), value, {});
    if (!pk.ok) throw new Error('Giá trị đáp án không hợp lệ: ' + pk.err + ' (ghi theo ký hiệu GỐC trong ngân hàng, hiện là ' + it.DapAnGoc + ')');
  }
  if (!U_str(reason)) throw new Error('Cần ghi lý do điều chỉnh');
  S_append(S_hub(), SH.PHUC_KHAO, [{ MaKyThi: maKyThi, MaCH: U_str(maCH), HanhDong: action, GiaTri: U_str(value), LyDo: U_str(reason),
    ApDung: 'CO', NguoiTao: S_user(), NgayTao: S_now() }]);
  S_log('PHUC_KHAO', maKyThi + ' ' + maCH + ' ' + action + ' ' + U_str(value));
  return { ok: true };
}

function GR_toggleReview(maKyThi, rowIndex, apply) {
  var all = S_read(S_hub(), SH.PHUC_KHAO).filter(function (o) { return U_str(o.MaKyThi) === maKyThi; });
  var target = all[Number(rowIndex)];
  if (!target) throw new Error('Không tìm thấy dòng phúc khảo');
  S_update(S_hub(), SH.PHUC_KHAO, function (o) { return o.__row === target.__row; }, { ApDung: apply ? 'CO' : 'KHONG' });
  S_log('PHUC_KHAO_BAT_TAT', maKyThi + ' dòng ' + target.__row + ' -> ' + (apply ? 'CO' : 'KHONG'));
  return { ok: true };
}
