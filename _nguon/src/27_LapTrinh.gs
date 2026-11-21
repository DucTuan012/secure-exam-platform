/**
 * 27_LapTrinh.gs — THI LẬP TRÌNH (Python / C) kiểu HackerRank
 *
 *  Ngân hàng bài (sheet LT_BaiTap) + bộ test (LT_Test): đề bài (markdown + LaTeX), định dạng vào/ra, ràng buộc,
 *  test mẫu (thí sinh thấy) & test ẩn, trọng số từng test, giới hạn thời gian/bộ nhớ, cách so sánh output,
 *  code khởi tạo cho từng ngôn ngữ, lời giải mẫu → "Kiểm thử đề" chạy lời giải trên mọi test, sinh output tự động.
 *  Gắn bài vào kỳ thi (KyThi.LapTrinh): điểm từng bài, ngôn ngữ cho phép, số lần nộp, cách tính điểm.
 *  Phát lên phòng thi: đề công khai đi kèm gói đề; test (cả ẩn) nằm ở sheet LT_Test của file phòng thi — KHÔNG gửi về máy thí sinh.
 *  Thu bài: điểm cao nhất / lần nộp cuối mỗi bài → LT_KetQua; tự chấm bản lưu cuối nếu thí sinh chưa bấm Nộp; phát hiện code giống nhau.
 */

var LT_CMP = ['TOKEN', 'LINE', 'EXACT', 'FLOAT', 'NOCASE'];
var LT_MAX_CELL = 45000;

/** Giữ nguyên khoảng trắng & chặn hiểu nhầm công thức: lưu dạng ~nội dung~ */
function LT_wrap(s) { return '~' + String(s == null ? '' : s).replace(/\r\n?/g, '\n') + '~'; }
function LT_un(v) { var s = v === null || v === undefined ? '' : String(v); if (s.charAt(0) === '~') s = s.substring(1); if (s.charAt(s.length - 1) === '~') s = s.substring(0, s.length - 1); return s; }
function LT_langs(v) {
  var a = U_str(v).toLowerCase().split(/[\s,;]+/).map(function (x) { return x === 'python' || x === 'python3' ? 'py' : x; })
    .filter(function (x) { return x === 'py' || x === 'c'; });
  return a.length ? a.filter(function (x, i) { return a.indexOf(x) === i; }) : ['py', 'c'];
}
function LT_ensure() {
  var hub = S_hub();
  [SH.LT_BAI, SH.LT_TEST, SH.LT_KQ].forEach(function (n) { if (!hub.getSheetByName(n)) S_ensureSheet(hub, n, HEADERS[n], { text: true, color: '#3b2a6b' }); });
  if (S_headers(hub.getSheetByName(SH.KY_THI)).indexOf('LapTrinh') < 0) S_ensureSheet(hub, SH.KY_THI, HEADERS[SH.KY_THI], { text: true });
  return hub;
}

/* ================================================================ NGÂN HÀNG BÀI */

/** Thư viện cho phép: chuẩn hoá chuỗi lưu ("TAT_CA" | "KHONG" | "math, sys") */
function LT_tvNorm(s, isC) {
  var u = U_upper(s);
  if (!u || u === 'TAT_CA' || u === '*') return 'TAT_CA';
  if (u === 'KHONG') return isC ? 'TAT_CA' : 'KHONG';
  var r = JD_libRules(isC ? '' : s, isC ? s : '', '');
  var l = r ? (isC ? r.c : r.py) : null;
  return l && l.length ? l.join(', ') : (isC ? 'TAT_CA' : 'KHONG');
}
function LT_lib(p) { return JD_libRules(p.tvPy, p.tvC, p.cam); }
/** Quy định thư viện để hiện cho thí sinh */
function LT_tvView(p) {
  var r = LT_lib(p) || { py: null, c: null, cam: [] };
  return { py: r.py === null ? 'TAT_CA' : r.py.length ? r.py.join(', ') : 'KHONG', c: r.c === null ? 'TAT_CA' : r.c.join(', '), cam: r.cam.join(', ') };
}

function LT_problemFromRow(r, tests) {
  return {
    ma: U_str(r.MaBai), tieuDe: U_str(r.TieuDe), doKho: U_str(r.DoKho) || 'TB', chuDe: U_str(r.ChuDe),
    noiDung: LT_un(r.NoiDung), vao: LT_un(r.DinhDangVao), ra: LT_un(r.DinhDangRa), rangBuoc: LT_un(r.RangBuoc),
    nn: LT_langs(r.NgonNgu), tl: U_num(r.GioiHanGiay, 2) || 2, ml: U_num(r.GioiHanMB, 256) || 256,
    cmp: LT_CMP.indexOf(U_upper(r.SoSanh)) >= 0 ? U_upper(r.SoSanh) : 'TOKEN', eps: U_num(r.SaiSo, 1e-6) || 1e-6,
    cham: U_upper(r.ChamDiem) === 'TAT_CA' ? 'TAT_CA' : 'TUNG_TEST',
    mau: { py: LT_un(r.MauPython), c: LT_un(r.MauC) }, loiGiai: LT_un(r.LoiGiai), nnLoiGiai: U_str(r.NgonNguLoiGiai).toLowerCase() === 'c' ? 'c' : 'py',
    kiemThuLuc: U_str(r.KiemThuLuc), kiemThu: U_str(r.KiemThuKetQua), capNhat: U_str(r.CapNhat), ghiChu: U_str(r.GhiChu),
    tvPy: U_str(r.ThuVienPy) || 'TAT_CA', tvC: U_str(r.ThuVienC) || 'TAT_CA', cam: U_str(r.CamDung),
    tests: tests || []
  };
}
function LT_testsOf(ma, allTests) {
  return (allTests || S_read(S_hub(), SH.LT_TEST)).filter(function (t) { return U_str(t.MaBai) === ma; })
    .sort(function (a, b) { return U_num(a.STT, 0) - U_num(b.STT, 0); })
    .map(function (t) { return { in: LT_un(t.Input), out: LT_un(t.Output), mau: U_bool(t.Mau, false), diem: U_str(t.Diem) === '' ? 1 : U_num(t.Diem, 1), gt: LT_un(t.GiaiThich) }; });
}
function LT_list() {
  var hub = LT_ensure(), tests = S_read(hub, SH.LT_TEST), used = {};
  Repo_examRows().forEach(function (e) { (LT_examCfg(e).bai || []).forEach(function (b) { (used[b.ma] = used[b.ma] || []).push(U_str(e.MaKyThi)); }); });
  return S_read(hub, SH.LT_BAI).filter(function (r) { return U_str(r.MaBai); }).map(function (r) {
    var p = LT_problemFromRow(r), ts = tests.filter(function (t) { return U_str(t.MaBai) === p.ma; });
    return { ma: p.ma, tieuDe: p.tieuDe, doKho: p.doKho, chuDe: p.chuDe, nn: p.nn, nTest: ts.length,
      nMau: ts.filter(function (t) { return U_bool(t.Mau, false); }).length, kiemThu: p.kiemThu, kiemThuLuc: p.kiemThuLuc, dung: used[p.ma] || [] };
  });
}
function LT_get(ma) {
  var hub = LT_ensure();
  var r = S_read(hub, SH.LT_BAI).filter(function (x) { return U_str(x.MaBai) === U_str(ma); })[0];
  if (!r) throw new Error('Không có bài ' + ma);
  return LT_problemFromRow(r, LT_testsOf(U_str(ma)));
}
/** Lưu bài (tạo mới / sửa). o = dạng LT_get. Trả về bài đã lưu. */
function LT_save(o) {
  return S_withLock(function () {
    var hub = LT_ensure();
    var ma = U_upper(o.ma).replace(/[^A-Z0-9_-]/g, '');
    if (!ma) throw new Error('Mã bài chỉ gồm chữ không dấu, số, _ hoặc -');
    if (!U_str(o.tieuDe)) throw new Error('Chưa nhập tên bài');
    var big = function (lab, s) { if (String(s || '').length > LT_MAX_CELL) throw new Error(lab + ' dài quá ' + LT_MAX_CELL + ' ký tự (giới hạn 1 ô Google Sheets)'); return s; };
    var tests = (o.tests || []).map(function (t, i) {
      big('Input test ' + (i + 1), t.in); big('Output test ' + (i + 1), t.out);
      return { MaBai: ma, STT: i + 1, Input: LT_wrap(t.in), Output: LT_wrap(t.out), Mau: t.mau ? 'TRUE' : 'FALSE', Diem: String(t.diem === '' || t.diem == null ? 1 : Number(t.diem)), GiaiThich: LT_wrap(t.gt || '') };
    });
    var old = S_read(hub, SH.LT_BAI).filter(function (x) { return U_str(x.MaBai) === ma; })[0];
    if (o.isNew && old) throw new Error('Mã bài ' + ma + ' đã có — chọn mã khác');
    var row = {
      MaBai: ma, TieuDe: U_str(o.tieuDe), DoKho: U_str(o.doKho) || 'TB', ChuDe: U_str(o.chuDe),
      NoiDung: LT_wrap(big('Đề bài', o.noiDung)), DinhDangVao: LT_wrap(o.vao), DinhDangRa: LT_wrap(o.ra), RangBuoc: LT_wrap(o.rangBuoc),
      NgonNgu: LT_langs((o.nn || []).join(',')).join(','), GioiHanGiay: String(Math.min(10, Math.max(0.5, U_num(o.tl, 2)))),
      GioiHanMB: String(Math.min(1024, Math.max(32, U_num(o.ml, 256)))), SoSanh: LT_CMP.indexOf(U_upper(o.cmp)) >= 0 ? U_upper(o.cmp) : 'TOKEN',
      SaiSo: String(U_num(o.eps, 1e-6) || 1e-6), ChamDiem: U_upper(o.cham) === 'TAT_CA' ? 'TAT_CA' : 'TUNG_TEST',
      MauPython: LT_wrap(big('Code khởi tạo Python', (o.mau || {}).py)), MauC: LT_wrap(big('Code khởi tạo C', (o.mau || {}).c)),
      LoiGiai: LT_wrap(big('Lời giải', o.loiGiai)), NgonNguLoiGiai: o.nnLoiGiai === 'c' ? 'c' : 'py',
      KiemThuLuc: old ? U_str(old.KiemThuLuc) : '', KiemThuKetQua: old ? U_str(old.KiemThuKetQua) : '',
      NgayTao: old ? U_str(old.NgayTao) : S_now(), CapNhat: S_now(), GhiChu: U_str(o.ghiChu),
      ThuVienPy: LT_tvNorm(o.tvPy, false), ThuVienC: LT_tvNorm(o.tvC, true), CamDung: (JD_libRules('', '', o.cam) || { cam: [] }).cam.join(', ')
    };
    // đổi test / lời giải sau khi kiểm thử → đánh dấu cần kiểm thử lại
    if (old && (o.testsChanged || LT_un(old.LoiGiai) !== String(o.loiGiai || '') || U_str(old.ThuVienPy) !== row.ThuVienPy || U_str(old.ThuVienC) !== row.ThuVienC || U_str(old.CamDung) !== row.CamDung)) { row.KiemThuKetQua = row.KiemThuKetQua ? 'CẦN KIỂM THỬ LẠI' : ''; }
    S_upsert(hub, SH.LT_BAI, function (x) { return U_str(x.MaBai); }, row);
    S_replaceWhere(hub, SH.LT_TEST, function (x) { return U_str(x.MaBai) === ma; }, tests);
    S_log('LT_LUU_BAI', ma + ' · ' + tests.length + ' test');
    return LT_get(ma);
  });
}
function LT_delete(ma) {
  return S_withLock(function () {
    var hub = LT_ensure(), used = [];
    Repo_examRows().forEach(function (e) { if ((LT_examCfg(e).bai || []).some(function (b) { return b.ma === ma; })) used.push(U_str(e.MaKyThi)); });
    if (used.length) throw new Error('Bài đang dùng trong kỳ thi: ' + used.join(', ') + ' — gỡ khỏi kỳ thi trước khi xoá.');
    S_replaceWhere(hub, SH.LT_BAI, function (x) { return U_str(x.MaBai) === ma; }, []);
    S_replaceWhere(hub, SH.LT_TEST, function (x) { return U_str(x.MaBai) === ma; }, []);
    S_log('LT_XOA_BAI', ma);
    return { ok: true };
  });
}
function LT_copy(ma) {
  var p = LT_get(ma), list = LT_list().map(function (x) { return x.ma; }), i = 2;
  while (list.indexOf(ma + '_' + i) >= 0) i++;
  p.ma = ma + '_' + i; p.tieuDe = p.tieuDe + ' (bản sao)'; p.isNew = true;
  return LT_save(p);
}

/* ================================================================ MÁY CHẤM */

function LT_judge() {
  var c = Repo_config();
  return { p: U_str(c.LT_MAY_CHAM) || 'wandbox', url: U_str(c.LT_URL), key: U_str(c.LT_KHOA) };
}
function LT_setJudge(o) {
  var p = U_str(o.p).toLowerCase();
  if (['wandbox', 'judge0', 'piston'].indexOf(p) < 0) throw new Error('Máy chấm không hợp lệ');
  var url = U_str(o.url);
  if (url && !/^https:\/\//.test(url)) throw new Error('Địa chỉ máy chấm phải bắt đầu bằng https://');
  if (p === 'piston' && !url) throw new Error('Piston cần địa chỉ máy chủ tự cài (máy chủ công khai emkc.org đã ngừng cho dùng tự do)');
  // khoá API: để trống = giữ khoá đã lưu; gõ "-" = xoá khoá
  var key = U_str(o.key), oldKey = LT_judge().key;
  var kv = { LT_MAY_CHAM: p, LT_URL: url, LT_KHOA: key === '-' ? '' : key || oldKey };
  Object.keys(kv).forEach(function (k) { S_upsert(S_hub(), SH.CAU_HINH, function (x) { return U_str(x.Khoa); }, { Khoa: k, GiaTri: kv[k], MoTa: 'Máy chấm lập trình' }); });
  Repo_clearCache();
  try { JD_cachePut('jdrt|x', null, 1); } catch (e) { }
  S_log('LT_MAY_CHAM', p + ' ' + url);
  return LT_judgeView();
}
function LT_judgeView() { var j = LT_judge(); return { p: j.p, url: j.url, hasKey: !!j.key }; }
/** Chạy thử "tổng 2 số" bằng Python & C trên máy chấm đang chọn */
function LT_testJudge() {
  var j = LT_judge(), out = { p: j.p, langs: {} };
  var probe = { py: 'a, b = map(int, input().split())\nprint(a + b)\n', c: '#include <stdio.h>\nint main(){int a,b;scanf("%d %d",&a,&b);printf("%d\\n",a+b);return 0;}\n' };
  ['py', 'c'].forEach(function (lang) {
    var t0 = Date.now();
    try {
      var r = JD_run(j, lang, probe[lang], [{ in: '2 3\n', out: '5' }], { tl: 2, ml: 256 });
      var x = r.results[0];
      out.langs[lang] = { ok: x.v === 'AC', v: x.v, rt: r.rt, ms: Date.now() - t0, time: x.time, err: x.err || r.ce || '' };
    } catch (e) { out.langs[lang] = { ok: false, err: e.message, ms: Date.now() - t0 }; }
  });
  out.ok = out.langs.py.ok && out.langs.c.ok;
  return out;
}

/** Kiểm thử đề: chạy lời giải mẫu trên mọi test. fill = 'EMPTY' (điền output còn trống) | 'ALL' (ghi đè mọi output) */
function LT_validate(ma, fill) {
  var p = LT_get(ma);
  if (!p.loiGiai.trim()) throw new Error('Chưa có lời giải mẫu để kiểm thử');
  if (!p.tests.length) throw new Error('Bài chưa có test nào');
  var lim = { tl: p.tl, ml: p.ml, cmp: p.cmp, eps: p.eps, lib: LT_lib(p) };
  var tests = p.tests.map(function (t) { return { in: t.in, out: fill === 'ALL' || (fill === 'EMPTY' && !t.out.trim()) ? undefined : t.out }; });
  var r = JD_run(LT_judge(), p.nnLoiGiai, p.loiGiai, tests, lim);
  var filled = 0, tooBig = [];
  if (fill && !r.ce) {
    p.tests.forEach(function (t, i) {
      var x = r.results[i];
      if (tests[i].out === undefined && x.v === 'OK') {
        if (String(x.out).length > LT_MAX_CELL || /…\(đã cắt bớt\)\s*$/.test(x.out)) { tooBig.push(i + 1); return; }   // output quá 1 ô Sheets → bỏ qua test này, không hỏng cả bài
        t.out = x.out; filled++;
      }
    });
    if (filled) { p.testsChanged = false; LT_save(p); }
  }
  var res = r.results.map(function (x, i) {
    var v = tests[i].out === undefined ? (x.v === 'OK' ? (tooBig.indexOf(i + 1) >= 0 ? 'QUA_DAI' : 'AC') : x.v) : x.v;
    return { stt: i + 1, mau: p.tests[i].mau, v: v, time: x.time, mem: x.mem, out: JD_cut(x.out, 3000), exp: JD_cut(p.tests[i].out, 3000), inp: JD_cut(p.tests[i].in, 3000), err: x.err || '' };
  });
  var pass = res.filter(function (x) { return x.v === 'AC'; }).length, maxT = Math.max.apply(null, res.map(function (x) { return x.time || 0; }).concat([0]));
  var summary = pass + '/' + res.length + ' test đúng' + (maxT ? ' · chậm nhất ' + maxT + ' ms' : '');
  S_update(S_hub(), SH.LT_BAI, function (x) { return U_str(x.MaBai) === p.ma; }, { KiemThuLuc: S_now(), KiemThuKetQua: (pass === res.length ? 'ĐẠT ' : 'LỖI ') + summary });
  var warn = [];
  if (maxT && maxT > p.tl * 1000 * 0.5) warn.push('Lời giải mẫu dùng ' + maxT + ' ms — gần giới hạn ' + p.tl + ' s, nên nới giới hạn thời gian.');
  if (!p.tests.some(function (t) { return t.mau; })) warn.push('Chưa có test MẪU — thí sinh sẽ không có ví dụ để chạy thử.');
  if (p.tests.every(function (t) { return t.mau; })) warn.push('Mọi test đều là test mẫu — thí sinh xem được hết đáp án, nên thêm test ẩn.');
  if (tooBig.length) warn.unshift('Test ' + tooBig.join(', ') + ': output của lời giải dài quá ' + LT_MAX_CELL + ' ký tự (giới hạn 1 ô Google Sheets) nên KHÔNG điền được — giảm kích thước input của test đó (hoặc xoá test) rồi kiểm thử lại.');
  if (r.lib) warn.unshift('Lời giải mẫu vi phạm quy định thư viện của chính bài này — ' + r.lib);
  return { ok: pass === res.length && !r.ce, ce: r.ce, rt: r.rt, results: res, filled: filled, summary: summary, warnings: warn };
}
/** Giám thị thử chạy 1 đoạn code trên test mẫu / input tự nhập (soạn đề) */
function LT_tryCode(ma, lang, code, custom) {
  var p = LT_get(ma), tests = p.tests.filter(function (t) { return t.mau; }).map(function (t) { return { in: t.in, out: t.out }; });
  if (custom !== undefined && custom !== null && custom !== '') tests.push({ in: String(custom) });
  if (!tests.length) tests.push({ in: '' });
  var r = JD_run(LT_judge(), lang, code, tests, { tl: p.tl, ml: p.ml, cmp: p.cmp, eps: p.eps, lib: LT_lib(p) });
  return { lib: r.lib || '', ce: r.ce, rt: r.rt, results: r.results.map(function (x, i) { return { v: x.v, time: x.time, mem: x.mem, out: JD_cut(x.out, 4000), err: x.err, inp: JD_cut(tests[i].in, 4000), exp: tests[i].out }; }) };
}

/* ================================================================ GẮN VÀO KỲ THI */

/** Cấu hình lập trình của 1 kỳ thi: {bai:[{ma, diem}], nn:['py','c'], soLan, tinh:'CAO_NHAT'|'LAN_CUOI', tuCham, chayThu} */
function LT_examCfg(exRow) {
  var c = {};
  try { c = JSON.parse(U_str(exRow && exRow.LapTrinh) || '{}') || {}; } catch (e) { c = {}; }
  return { bai: (c.bai || []).filter(function (b) { return b && b.ma; }).map(function (b) { return { ma: U_str(b.ma), diem: U_num(b.diem, 10) }; }),
    nn: LT_langs((c.nn || ['py', 'c']).join(',')), soLan: Math.max(1, U_num(c.soLan, 30)), tinh: c.tinh === 'LAN_CUOI' ? 'LAN_CUOI' : 'CAO_NHAT',
    tuCham: c.tuCham !== false, chayThu: c.chayThu !== false, giayChay: Math.max(2, U_num(c.giayChay, 5)) };
}
function LT_examGet(maKyThi) {
  var r = Repo_examRow(maKyThi), c = LT_examCfg(r);
  return { cfg: c, all: LT_list(), stage: U_str(r.TrangThai) };
}
function LT_examSave(maKyThi, o) {
  LT_ensure();
  return S_withLock(function () {
    Repo_clearCache();
    var r = Repo_examRow(maKyThi), list = LT_list(), have = {};
    list.forEach(function (x) { have[x.ma] = x; });
    var bai = (o.bai || []).map(function (b) {
      var x = have[U_str(b.ma)];
      if (!x) throw new Error('Không có bài ' + b.ma);
      if (!x.nTest) throw new Error('Bài ' + b.ma + ' chưa có test');
      return { ma: x.ma, diem: Math.max(0, U_num(b.diem, 10)) };
    });
    var c = { bai: bai, nn: LT_langs((o.nn || []).join(',')), soLan: Math.max(1, Math.min(200, U_num(o.soLan, 30))), tinh: o.tinh === 'LAN_CUOI' ? 'LAN_CUOI' : 'CAO_NHAT',
      tuCham: o.tuCham !== false, chayThu: o.chayThu !== false, giayChay: Math.max(2, Math.min(60, U_num(o.giayChay, 5))) };
    if (!c.nn.length) throw new Error('Chọn ít nhất 1 ngôn ngữ');
    Repo_setExam(maKyThi, { LapTrinh: bai.length ? JSON.stringify(c) : '' });
    S_log('LT_GAN_KY_THI', maKyThi + ': ' + bai.map(function (b) { return b.ma + '(' + b.diem + 'đ)'; }).join(', '));
    var warn = [];
    if (ES_stage(r.TrangThai) >= ES_stage(TT_KY_THI.DA_XUAT)) warn.push('Kỳ thi đã phát lên phòng thi — bấm "📤 Phát đề lên phòng thi" (tab ⑤) để cập nhật bài lập trình.');
    bai.forEach(function (b) { var x = have[b.ma]; if (!/^ĐẠT/.test(x.kiemThu)) warn.push('Bài ' + b.ma + ' chưa "Kiểm thử đề" đạt — nên kiểm thử trước khi thi.'); });
    return { cfg: c, warnings: warn };
  });
}
/** Tổng điểm phần lập trình của kỳ thi */
function LT_total(exRow) { return LT_examCfg(exRow).bai.reduce(function (a, b) { return a + b.diem; }, 0); }

/** Phần đề CÔNG KHAI đưa vào gói đề (không có test ẩn) — offset = số câu trắc nghiệm */
function LT_pkgItems(exRow, offset) {
  var c = LT_examCfg(exRow);
  if (!c.bai.length) return [];
  var all = S_read(S_hub(), SH.LT_TEST);
  var rows = S_read(S_hub(), SH.LT_BAI);
  return c.bai.map(function (b, i) {
    var r = rows.filter(function (x) { return U_str(x.MaBai) === b.ma; })[0];
    if (!r) throw new Error('Bài lập trình ' + b.ma + ' không còn trong ngân hàng');
    var p = LT_problemFromRow(r, LT_testsOf(b.ma, all));
    var nn = p.nn.filter(function (x) { return c.nn.indexOf(x) >= 0; });
    if (!nn.length) throw new Error('Bài ' + b.ma + ' không cho dùng ngôn ngữ nào mà kỳ thi cho phép');
    return { k: 'L' + (i + 1), stt: offset + i + 1, phan: 'LT', dang: 'LAP_TRINH', ma: p.ma, tieuDe: p.tieuDe, doKho: p.doKho,
      noiDung: p.noiDung, vao: p.vao, ra: p.ra, rangBuoc: p.rangBuoc, nn: nn, tl: p.tl, ml: p.ml, diem: b.diem, cham: p.cham,
      mau: { py: p.mau.py, c: p.mau.c }, nTest: p.tests.length,
      samples: p.tests.filter(function (t) { return t.mau; }).map(function (t) { return { in: t.in, out: t.out, gt: t.gt }; }),
      tv: LT_tvView(p), soLan: c.soLan, chayThu: c.chayThu, opts: [], vi: '' };
  });
}
/** Cấu hình chấm + bộ test cho phòng thi */
function LT_roomData(maKyThi, exRow) {
  var c = LT_examCfg(exRow), all = S_read(S_hub(), SH.LT_TEST), rows = S_read(S_hub(), SH.LT_BAI), bai = {}, tests = [];
  c.bai.forEach(function (b) {
    var r = rows.filter(function (x) { return U_str(x.MaBai) === b.ma; })[0];
    var p = LT_problemFromRow(r, LT_testsOf(b.ma, all));
    bai[p.ma] = { tl: p.tl, ml: p.ml, cmp: p.cmp, eps: p.eps, cham: p.cham, diem: b.diem, nn: p.nn.filter(function (x) { return c.nn.indexOf(x) >= 0; }), lib: LT_lib(p) };
    p.tests.forEach(function (t, i) { tests.push({ MaKyThi: maKyThi, MaBai: p.ma, STT: i + 1, Input: LT_wrap(t.in), Output: LT_wrap(t.out), Mau: t.mau ? 'CO' : '', Diem: String(t.diem) }); });
  });
  return { cfg: c.bai.length ? JSON.stringify({ bai: bai, soLan: c.soLan, tinh: c.tinh, chayThu: c.chayThu, giayChay: c.giayChay, may: LT_judge() }) : '', tests: tests };
}

/* ================================================================ THU BÀI & CHẤM */

/**
 * Thu kết quả lập trình từ phòng thi → LT_KetQua.
 * webBySbd: {SBD: bài làm web (để lấy code bản lưu cuối khi thí sinh chưa bấm Nộp code)}
 */
function LT_collect(maKyThi, room, webBySbd, bannedSet) {
  var exRow = Repo_examRow(maKyThi), c = LT_examCfg(exRow);
  if (!c.bai.length) return { count: 0, autoJudged: 0 };
  var hub = LT_ensure();
  var nop = room.getSheetByName(RSH.LT_NOP) ? S_read(room, RSH.LT_NOP).filter(function (x) { return U_str(x.MaKyThi) === maKyThi && U_upper(x.Loai) === 'NOP' && U_upper(x.SBD) !== PTA_THU_SBD; }) : [];
  var by = {};
  nop.forEach(function (x) { var k = U_upper(x.SBD) + '|' + U_str(x.MaBai); (by[k] = by[k] || []).push(x); });
  var rd = LT_roomData(maKyThi, exRow), cfgRoom = JSON.parse(rd.cfg || '{"bai":{}}');
  var rows = [], auto = 0, autoErr = [];
  var sbds = {};
  Object.keys(by).forEach(function (k) { sbds[k.split('|')[0]] = 1; });
  Object.keys(webBySbd || {}).forEach(function (s) { sbds[s] = 1; });
  Object.keys(sbds).forEach(function (sbd) {
    c.bai.forEach(function (b, i) {
      var list = (by[sbd + '|' + b.ma] || []).sort(function (x, y) { return U_num(x.ThoiGian, 0) - U_num(y.ThoiGian, 0); });
      var banned = bannedSet && bannedSet[sbd];
      var pick = null;
      if (list.length) pick = c.tinh === 'LAN_CUOI' ? list[list.length - 1] : list.reduce(function (a, x) { return U_num(x.Diem, 0) > U_num(a.Diem, 0) ? x : a; }, list[0]);
      var row = { MaKyThi: maKyThi, SBD: sbd, MaBai: b.ma, DiemToiDa: b.diem, SoLanNop: list.length, TuongDong: '' };
      if (pick) {
        row.Diem = banned ? 0 : U_num(pick.Diem, 0); row.NgonNgu = U_str(pick.NgonNgu); row.ThoiDiem = PTA_fmt(pick.ThoiGian);
        row.KetQua = U_str(pick.KetQua); row.Nguon = 'NOP'; row.Code = LT_wrap(LT_un(pick.Code));
      } else {
        var w = (webBySbd || {})[sbd] || {}, saved = w['L' + (i + 1)];
        if (!saved || !String(saved.c || '').trim()) return;
        row.NgonNgu = saved.l === 'c' ? 'c' : 'py'; row.Code = LT_wrap(saved.c); row.Nguon = 'BAN_LUU'; row.Diem = 0; row.KetQua = '';
        if (c.tuCham && !banned) {
          try {
            var all = S_read(room, RSH.LT_TEST).filter(function (t) { return U_str(t.MaKyThi) === maKyThi && U_str(t.MaBai) === b.ma; })
              .sort(function (x, y) { return U_num(x.STT, 0) - U_num(y.STT, 0); });
            var pc = cfgRoom.bai[b.ma] || {};
            var r = JD_run(LT_judge(), row.NgonNgu, saved.c, all.map(function (t) { return { in: LT_un(t.Input), out: LT_un(t.Output) }; }), pc);
            row.Diem = JD_score(r.results, all.map(function (t) { return U_num(t.Diem, 1); }), b.diem, pc.cham);
            row.KetQua = JSON.stringify(r.results.map(function (x) { return x.v; })); row.Nguon = 'TU_CHAM'; auto++;
          } catch (e) { autoErr.push(sbd + '/' + b.ma + ': ' + e.message); }
        }
      }
      rows.push(row);
    });
  });
  // phát hiện code giống nhau (≥ 85%) giữa các thí sinh trong cùng bài
  c.bai.forEach(function (b) {
    var rs = rows.filter(function (x) { return x.MaBai === b.ma && x.Code; });
    for (var i = 0; i < rs.length; i++) for (var j = i + 1; j < rs.length; j++) {
      if (rs[i].NgonNgu !== rs[j].NgonNgu) continue;
      var s = JD_similar(LT_un(rs[i].Code), LT_un(rs[j].Code), rs[i].NgonNgu);
      if (s >= 0.85) {
        var tag = function (x, y) { x.TuongDong = (x.TuongDong ? x.TuongDong + ', ' : '') + y.SBD + ' (' + Math.round(s * 100) + '%)'; };
        tag(rs[i], rs[j]); tag(rs[j], rs[i]);
      }
    }
  });
  S_replaceWhere(hub, SH.LT_KQ, function (x) { return U_str(x.MaKyThi) === maKyThi; }, rows);
  S_log('LT_THU_BAI', maKyThi + ': ' + rows.length + ' kết quả, tự chấm ' + auto);
  return { count: rows.length, autoJudged: auto, errors: autoErr, similar: rows.filter(function (x) { return x.TuongDong; }).length };
}
/** Điểm lập trình theo thí sinh: {SBD: {diem, max, chiTiet:'L1 8/10; L2 0/10', canhBao}} */
function LT_scores(maKyThi) {
  var exRow = Repo_examRow(maKyThi), c = LT_examCfg(exRow), out = {};
  if (!c.bai.length) return out;
  var max = LT_total(exRow);
  var rows = S_hub().getSheetByName(SH.LT_KQ) ? S_read(S_hub(), SH.LT_KQ).filter(function (x) { return U_str(x.MaKyThi) === maKyThi; }) : [];
  rows.forEach(function (x) {
    var s = U_upper(x.SBD), o = out[s] = out[s] || { diem: 0, max: max, parts: {}, canhBao: [] };
    o.diem += U_num(x.Diem, 0); o.parts[U_str(x.MaBai)] = U_num(x.Diem, 0);
    if (U_str(x.TuongDong)) o.canhBao.push('Code bài ' + U_str(x.MaBai) + ' giống ' + U_str(x.TuongDong));
    if (U_str(x.Nguon) === 'TU_CHAM') o.canhBao.push('Bài ' + U_str(x.MaBai) + ': chưa bấm Nộp, đã tự chấm bản lưu cuối');
  });
  Object.keys(out).forEach(function (s) {
    var o = out[s];
    o.diem = U_round(o.diem, 2);
    o.chiTiet = c.bai.map(function (b) { return b.ma + ' ' + (o.parts[b.ma] || 0) + '/' + b.diem; }).join(', ');
  });
  return out;
}
/** Bảng kết quả lập trình cho tab ⑦ / ⑧ */
function LT_report(maKyThi) {
  var exRow = Repo_examRow(maKyThi), c = LT_examCfg(exRow);
  var rows = S_hub().getSheetByName(SH.LT_KQ) ? S_read(S_hub(), SH.LT_KQ).filter(function (x) { return U_str(x.MaKyThi) === maKyThi; }) : [];
  return { cfg: c, rows: rows.map(function (x) { return { sbd: U_str(x.SBD), ma: U_str(x.MaBai), diem: U_num(x.Diem, 0), max: U_num(x.DiemToiDa, 0), n: U_num(x.SoLanNop, 0),
    nn: U_str(x.NgonNgu), luc: U_str(x.ThoiDiem), nguon: U_str(x.Nguon), kq: U_str(x.KetQua), giong: U_str(x.TuongDong), code: LT_un(x.Code) }; }) };
}
/** Bảng xếp hạng lập trình TRỰC TIẾP (đọc điểm hiện tại trên phòng thi): tổng điểm ↓, đạt sớm hơn ↑, ít lần nộp hơn ↑ */
function LT_board(maKyThi) {
  var c = LT_examCfg(Repo_examRow(maKyThi));
  if (!c.bai.length) return { bai: [], rows: [], max: 0, now: Date.now() };
  var room = PTA_room(false), st = PTA_students(room, maKyThi);
  var rows = st.map(function (s) {
    var o = {}; try { o = JSON.parse(U_str(s.LtDiem) || '{}') || {}; } catch (e) { o = {}; }
    var cells = c.bai.map(function (b) { var x = o[b.ma] || {}; return { d: Number(x.d) || 0, n: Number(x.n) || 0, max: b.diem, t: Number(x.tb || x.t) || 0 }; });
    return { sbd: U_str(s.SBD), hoTen: U_str(s.HoTen), lop: U_str(s.Lop), tt: U_upper(s.TrangThai) || 'CHUA_VAO', cells: cells,
      tong: Math.round(cells.reduce(function (a, x) { return a + x.d; }, 0) * 100) / 100, n: cells.reduce(function (a, x) { return a + x.n; }, 0),
      t: cells.reduce(function (a, x) { return x.d > 0 ? Math.max(a, x.t) : a; }, 0) };
  });
  rows.sort(function (a, b) { return b.tong - a.tong || (a.t || 9e15) - (b.t || 9e15) || a.n - b.n || (a.sbd < b.sbd ? -1 : 1); });
  rows.forEach(function (r, i) { r.hang = i && r.tong === rows[i - 1].tong && r.t === rows[i - 1].t ? rows[i - 1].hang : i + 1; });
  var stats = c.bai.map(function (b, j) {
    var tried = rows.filter(function (r) { return r.cells[j].n > 0; }), full = tried.filter(function (r) { return r.cells[j].d >= b.diem; });
    return { ma: b.ma, diem: b.diem, tried: tried.length, full: full.length, avg: tried.length ? Math.round(tried.reduce(function (a, r) { return a + r.cells[j].d; }, 0) / tried.length * 100) / 100 : 0 };
  });
  return { bai: c.bai, stats: stats, rows: rows, max: LT_total(Repo_examRow(maKyThi)), now: Date.now() };
}
/** Lịch sử nộp code của 1 thí sinh (giám thị xem trong giờ thi) */
function LT_history(maKyThi, sbd) {
  var room = PTA_room(false);
  if (!room.getSheetByName(RSH.LT_NOP)) return [];
  return S_read(room, RSH.LT_NOP).filter(function (x) { return U_str(x.MaKyThi) === maKyThi && U_upper(x.SBD) === U_upper(sbd); })
    .map(function (x) { return { t: PTA_fmt(x.ThoiGian), ma: U_str(x.MaBai), nn: U_str(x.NgonNgu), loai: U_str(x.Loai), diem: U_str(x.Diem), max: U_str(x.DiemToiDa), kq: U_str(x.KetQua), code: LT_un(x.Code) }; })
    .reverse().slice(0, 60);
}

/* ================================================================ BÀI MẪU */

function LT_sample() {
  var mk = function (ma, tieuDe, doKho, chuDe, noiDung, vao, ra, rb, loiGiai, tests, mau) {
    return { ma: ma, tieuDe: tieuDe, doKho: doKho, chuDe: chuDe, noiDung: noiDung, vao: vao, ra: ra, rangBuoc: rb, nn: ['py', 'c'], tl: 2, ml: 256, cmp: 'TOKEN',
      cham: 'TUNG_TEST', loiGiai: loiGiai, nnLoiGiai: 'py', mau: mau || { py: '', c: '#include <stdio.h>\n\nint main(void) {\n    \n    return 0;\n}\n' }, tests: tests };
  };
  var T = function (i, o, mau, gt) { return { in: i, out: o, mau: !!mau, diem: mau ? 0 : 1, gt: gt || '' }; };
  return [
    mk('LT_TONG', 'Tổng hai số', 'De', 'Nhập xuất', 'Cho hai số nguyên $a$ và $b$. Hãy in ra $a + b$.', 'Một dòng gồm hai số nguyên $a, b$.', 'Một số nguyên là $a + b$.',
      '$-10^{18} \\le a, b \\le 10^{18}$', 'a, b = map(int, input().split())\nprint(a + b)\n',
      [T('1 2\n', '3\n', 1, '1 + 2 = 3'), T('-5 5\n', '0\n', 1), T('1000000000000000000 1000000000000000000\n', '2000000000000000000\n'), T('-7 -8\n', '-15\n'), T('123456789 987654321\n', '1111111110\n')]),
    mk('LT_NGUYEN_TO', 'Đếm số nguyên tố', 'TB', 'Số học, Sàng', 'Cho số nguyên dương $N$. Đếm số các số nguyên tố không vượt quá $N$.\n\nGợi ý: dùng **sàng Eratosthenes** để chạy kịp với $N$ lớn.',
      'Một số nguyên $N$.', 'Số lượng số nguyên tố $\\le N$.', '$1 \\le N \\le 2 \\cdot 10^6$',
      'n = int(input())\ns = bytearray([1]) * (n + 1)\ns[0:2] = b"\\x00\\x00"[:min(2, n + 1)]\ni = 2\nwhile i * i <= n:\n    if s[i]:\n        s[i*i::i] = bytearray(len(s[i*i::i]))\n    i += 1\nprint(sum(s))\n',
      [T('10\n', '4\n', 1, 'Các số nguyên tố ≤ 10: 2, 3, 5, 7'), T('1\n', '0\n', 1), T('2\n', '1\n'), T('100\n', '25\n'), T('1000000\n', '78498\n'), T('2000000\n', '148933\n')]),
    mk('LT_DAO_CHUOI', 'Đảo từ trong câu', 'De', 'Xâu ký tự', 'Cho một câu gồm các từ cách nhau bởi dấu cách. In ra câu với **thứ tự các từ bị đảo ngược** (mỗi từ giữ nguyên).',
      'Một dòng là câu cần đảo (không quá 1000 ký tự).', 'Câu sau khi đảo thứ tự từ, các từ cách nhau đúng 1 dấu cách.', 'Câu chỉ gồm chữ cái Latin, chữ số và dấu cách.',
      'print(" ".join(input().split()[::-1]))\n',
      [T('hoc lap trinh vui\n', 'vui trinh lap hoc\n', 1), T('a\n', 'a\n', 1), T('  nhieu   dau   cach  \n', 'cach dau nhieu\n'), T('1 2 3 4 5 6 7 8 9 10\n', '10 9 8 7 6 5 4 3 2 1\n')])
  ];
}
function LT_loadSample() {
  var out = [];
  // ma trận "chỉ lập trình" (0 câu trắc nghiệm) để tạo kỳ thi thuần lập trình
  if (!S_read(S_hub(), SH.MT_PHAN).some(function (r) { return U_str(r.MaMaTran) === 'MT_CHI_LT'; })) {
    var mon = Repo_subjects()[0];
    if (mon) S_append(S_hub(), SH.MT_PHAN, [{ MaMaTran: 'MT_CHI_LT', MaMon: mon.maMon, TenMaTran: 'Chỉ lập trình (không trắc nghiệm)', Phan: 'I', TenPhan: 'Không có trắc nghiệm', DiemPhan: '0', TongSoCau: '0', DangCauChoPhep: '', GhiChu: 'Dùng cho kỳ thi chỉ có bài lập trình' }]);
  }
  LT_sample().forEach(function (p) {
    var exists = false;
    try { LT_get(p.ma); exists = true; } catch (e) { }
    if (!exists) { p.isNew = true; LT_save(p); out.push(p.ma); }
  });
  return { added: out };
}
