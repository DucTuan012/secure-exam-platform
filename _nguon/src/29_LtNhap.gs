/**
 * NHẬP NHANH BÀI LẬP TRÌNH
 *  - Dán văn bản theo mẫu "### TIÊU ĐỀ MỤC" (AI trả về đúng mẫu này) hoặc JSON — 1 hay nhiều bài một lần.
 *  - Xuất bài ra cùng định dạng (sao lưu / chia sẻ giữa các trung tâm / sửa hàng loạt rồi nhập lại).
 *  - Nhập test từ file ZIP / nhiều file (.in/.out, .inp/.out, .in/.ans, input01.txt/output01.txt, thư mục Test01/BAI.INP…).
 *  - Sinh input test bằng code (code đọc số thứ tự test, in ra input) → output lấy từ lời giải mẫu.
 */

/** Nhãn mục (đã bỏ dấu, viết hoa) → trường */
var LTN_KEYS = {
  'BAI': 'bai', 'BAI MOI': 'bai', 'MA': 'ma', 'MA BAI': 'ma', 'TEN': 'tieuDe', 'TEN BAI': 'tieuDe', 'TIEU DE': 'tieuDe',
  'DO KHO': 'doKho', 'CHU DE': 'chuDe', 'DE BAI': 'noiDung', 'NOI DUNG': 'noiDung', 'MO TA': 'noiDung',
  'INPUT': 'vao', 'DU LIEU VAO': 'vao', 'DINH DANG VAO': 'vao', 'DAU VAO': 'vao',
  'OUTPUT': 'ra', 'KET QUA': 'ra', 'DU LIEU RA': 'ra', 'DINH DANG RA': 'ra', 'DAU RA': 'ra',
  'RANG BUOC': 'rangBuoc', 'GIOI HAN DU LIEU': 'rangBuoc', 'GHI CHU': 'ghiChu', 'NGON NGU': 'nn',
  'THOI GIAN': 'tl', 'GIOI HAN THOI GIAN': 'tl', 'BO NHO': 'ml', 'GIOI HAN BO NHO': 'ml', 'GIOI HAN': 'gioiHan',
  'SO SANH': 'cmp', 'SO SANH OUTPUT': 'cmp', 'SAI SO': 'eps', 'CHAM': 'cham', 'CACH CHAM': 'cham', 'CHAM DIEM': 'cham', 'CACH TINH DIEM': 'cham',
  'THU VIEN PYTHON': 'tvPy', 'THU VIEN PY': 'tvPy', 'THU VIEN C': 'tvC', 'KHONG DUOC DUNG': 'cam', 'CAM DUNG': 'cam', 'CAM': 'cam',
  'HET': 'het', 'KET THUC': 'het', 'END': 'het',
  'LOI GIAI': 'loiGiai', 'LOI GIAI MAU': 'loiGiai', 'CODE KHOI TAO PYTHON': 'mauPy', 'KHOI TAO PYTHON': 'mauPy', 'CODE KHOI TAO C': 'mauC', 'KHOI TAO C': 'mauC'
};
function LTN_norm(s) { return U_removeDiacritics(String(s || '')).toUpperCase().replace(/[^A-Z0-9 ]+/g, ' ').replace(/\s+/g, ' ').trim(); }
/** Bỏ dòng trống đầu / cuối; khối nằm trọn trong ``` … ``` thì bỏ hàng rào (trả về cả ngôn ngữ ghi trên hàng rào) */
function LTN_unfence(s) {
  var lines = String(s || '').replace(/\r\n?/g, '\n').split('\n');
  while (lines.length && !lines[0].trim()) lines.shift();
  while (lines.length && !lines[lines.length - 1].trim()) lines.pop();
  var lang = '';
  if (lines.length >= 2 && /^\s*(```|~~~)/.test(lines[0]) && /^\s*(```|~~~)\s*$/.test(lines[lines.length - 1])) {
    lang = lines[0].replace(/^\s*(```|~~~)/, '').trim().toLowerCase();
    lines = lines.slice(1, -1);
  }
  return { text: lines.join('\n'), lang: lang };
}
function LTN_lang(s, code) {
  var u = LTN_norm(s);
  if (/^(C|GCC|C99|C11|C17)$/.test(u)) return 'c';
  if (/PY|PYTHON/.test(u)) return 'py';
  if (code !== undefined) return /#\s*include\b|\bint\s+main\s*\(/.test(code) ? 'c' : 'py';
  return '';
}
function LTN_testIO(s) {                                        // nội dung 1 test (input / output) → luôn kết thúc bằng 1 dấu xuống dòng
  var lines = String(s || '').replace(/\r\n?/g, '\n').split('\n');
  while (lines.length && !lines[0].trim()) lines.shift();
  while (lines.length && !lines[lines.length - 1].trim()) lines.pop();
  if (lines.length && /^\s*(```|~~~)[\w-]*\s*$/.test(lines[0])) lines.shift();          // test bọc trong ``` (kể cả khi ``` bao cả dấu ===)
  if (lines.length && /^\s*(```|~~~)\s*$/.test(lines[lines.length - 1])) lines.pop();
  var t = lines.join('\n');
  return t.trim() ? t.replace(/\n+$/, '') + '\n' : '';
}

/**
 * Đọc văn bản / JSON → {items:[{p, errs, warns}], errors}
 * p theo dạng LT_save (ma, tieuDe, noiDung, vao, ra, rangBuoc, tests[], loiGiai, nnLoiGiai, mau{py,c}, nn, tl, ml, cmp, eps, cham, tvPy, tvC, cam…)
 */
function LT_parseImport(txt) {
  txt = String(txt || '').replace(/^﻿/, '').replace(/\r\n?/g, '\n');
  var raw = [], errors = [];
  if (/^\s*[\[{]/.test(txt)) {
    try {
      var j = JSON.parse(txt);
      raw = Array.isArray(j) ? j : j && Array.isArray(j.bai) ? j.bai : j && Array.isArray(j.problems) ? j.problems : [j];
    } catch (e) { errors.push('JSON không hợp lệ: ' + e.message); }
    raw = raw.map(function (o) { return LTN_fromObj(o || {}); });
  } else raw = LTN_fromText(txt);
  if (!raw.length && !errors.length) errors.push('Không thấy bài nào. Mỗi bài cần ít nhất mục "### TÊN" và "### ĐỀ BÀI" (xem mẫu).');
  return { items: raw.map(LTN_check), errors: errors };
}

/** Văn bản theo mẫu "### MỤC: giá trị" + nội dung bên dưới */
function LTN_fromText(txt) {
  var lines = txt.split('\n'), out = [], cur = null, sec = null, fence = '';
  // AI bọc cả câu trả lời trong ```markdown … ``` → bỏ lớp bọc ngoài
  var f0 = 0; while (f0 < lines.length && !lines[f0].trim()) f0++;
  var f1 = f0 + 1; while (f1 < lines.length && !lines[f1].trim()) f1++;
  if (f0 < lines.length && /^\s*(`{3,}|~{3,})\s*(markdown|md|text|txt|plaintext)?\s*$/i.test(lines[f0]) && f1 < lines.length && /^\s*#{2,4}\s+\S/.test(lines[f1]) && LTN_head(lines[f1].replace(/^\s*#{2,4}\s+/, ''))) {
    var e = lines.length - 1; while (e > f1 && !lines[e].trim()) e--;
    lines = lines.slice(f1, /^\s*(`{3,}|~{3,})\s*$/.test(lines[e]) ? e : lines.length);
  }
  var flush = function () { if (sec && cur) { sec.body = sec.lines.join('\n'); cur.secs.push(sec); } sec = null; };
  var newP = function () { flush(); cur = { secs: [] }; out.push(cur); };
  for (var i = 0; i < lines.length; i++) {
    var L = lines[i], fm = /^\s*(```|~~~)/.exec(L);
    if (fence) { if (fm && fm[1] === fence && /^\s*(```|~~~)\s*$/.test(L)) fence = ''; if (sec) sec.lines.push(L); continue; }
    if (fm) { fence = fm[1]; if (sec) sec.lines.push(L); continue; }
    var h = /^\s*#{2,4}\s+(.+?)\s*#*\s*$/.exec(L);
    var kv = h ? LTN_head(h[1]) : null;
    if (!kv) { if (sec) sec.lines.push(L); continue; }
    if (kv.f === 'het') { flush(); continue; }                          // ### HẾT: bỏ mọi chữ thừa phía sau (đến mục kế tiếp)
    if (kv.f === 'bai' || !cur || (kv.f === 'ma' && cur.secs.some(function (s) { return s.f === 'ma' || (s.f === 'bai' && s.val); }))) newP();
    flush();
    sec = { f: kv.f, val: kv.val, mau: kv.mau, lines: [] };
  }
  flush();
  return out.filter(function (c) { return c.secs.some(function (s) { return s.f !== 'bai' || s.val; }); }).map(LTN_fromSecs);
}
/** Dòng tiêu đề mục → {f, val, mau} ; không phải mục quen → null (giữ như nội dung) */
function LTN_head(s) {
  var m = /^([^:|]+?)\s*(?:[:|]\s*(.*))?$/.exec(s);
  if (!m) return null;
  var lab = LTN_norm(m[1]), val = (m[2] || '').trim();
  var t = /^(TEST|VI DU)\b\s*(.*)$/.exec(lab);
  if (t) {
    var rest = t[2], mau = /\bMAU\b/.test(rest) || t[1] === 'VI DU';
    return { f: 'test', val: val, mau: mau };
  }
  var f = LTN_KEYS[lab];
  return f ? { f: f, val: val } : null;
}
/** Tách input / output của 1 test ở dòng "===" (bỏ qua "===" nằm trong khối ```; cả test bọc trong 1 khối ``` thì tách bên trong) */
var LTN_SEP = /^[ \t]*={3,}[ \t]*(?:OUTPUT|KET QUA|KẾT QUẢ)?[ \t]*=*[ \t]*$/i;
function LTN_splitIO(lines, inner) {
  var fence = '', cut = -1;
  for (var i = 0; i < lines.length; i++) {
    var fm = /^\s*(```|~~~)/.exec(lines[i]);
    if (!inner && fence) { if (fm && fm[1] === fence && /^\s*(```|~~~)\s*$/.test(lines[i])) fence = ''; continue; }
    if (!inner && fm) { fence = fm[1]; continue; }
    if (LTN_SEP.test(lines[i])) { cut = i; break; }
  }
  if (cut < 0 && !inner) {
    var L = lines.slice(); while (L.length && !L[0].trim()) L.shift(); while (L.length && !L[L.length - 1].trim()) L.pop();
    if (L.length >= 2 && /^\s*(```|~~~)[\w-]*\s*$/.test(L[0]) && /^\s*(```|~~~)\s*$/.test(L[L.length - 1])) return LTN_splitIO(L.slice(1, -1), true);
  }
  if (cut < 0 && !inner) {
    // AI hiển thị "input↵===" thành tiêu đề Markdown → khi sao chép ra "# input" (mất dòng ===): dòng "# …" cuối cùng là hết input
    var h = -1;
    for (var k = 0; k < lines.length; k++) if (/^#\s+\S/.test(lines[k])) h = k;
    if (h >= 0) { var inp = lines.slice(0, h + 1); inp[h] = inp[h].replace(/^#\s+/, ''); return [inp.join('\n'), lines.slice(h + 1).join('\n')]; }
  }
  return cut < 0 ? [lines.join('\n')] : [lines.slice(0, cut).join('\n'), lines.slice(cut + 1).join('\n')];
}
function LTN_fromSecs(c) {
  var p = { tests: [], mau: {} }, raw = {};
  c.secs.forEach(function (s) {
    var b = LTN_unfence(s.body), v = s.val;
    switch (s.f) {
      case 'bai':
        if (v) { var ps = v.split('|').map(function (x) { return x.trim(); }); if (ps[0]) raw.ma = ps[0]; if (ps[1]) raw.tieuDe = ps[1]; if (ps[2]) raw.doKho = ps[2]; if (ps[3]) raw.chuDe = ps[3]; }
        break;
      case 'test': {
        var parts = LTN_splitIO(s.lines);
        var tt = { in: LTN_testIO(parts[0]), out: parts.length > 1 ? LTN_testIO(parts.slice(1).join('\n')) : '', mau: !!s.mau, diem: s.mau ? 0 : 1, gt: '', noOut: parts.length < 2 };
        (v ? v.split('|') : []).forEach(function (x) {
          x = x.trim(); var u = LTN_norm(x);
          if (!x) return;
          if (/^-?\d+(\.\d+)?$/.test(x)) tt.diem = Number(x);
          else if (u === 'MAU' || u === 'VI DU') { tt.mau = true; if (!/\|\s*\d/.test(v)) tt.diem = 0; }
          else if (u === 'AN') tt.mau = false;
          else tt.gt = x;
        });
        p.tests.push(tt); break;
      }
      case 'loiGiai': raw.loiGiai = b.text; raw.nnLoiGiai = LTN_lang(v || b.lang, b.text); break;
      case 'mauPy': raw.mauPy = b.text; break;
      case 'mauC': raw.mauC = b.text; break;
      case 'noiDung': case 'vao': case 'ra': case 'rangBuoc': raw[s.f] = (v ? v + (b.text ? '\n' : '') : '') + b.text; break;
      default: raw[s.f] = v || b.text.trim();
    }
  });
  var o = LTN_fromObj(raw);
  o.tests = p.tests;
  return o;
}
/** Đối tượng "lỏng" (JSON / các mục đã đọc) → dạng LT_save */
function LTN_fromObj(o) {
  var g = function () { for (var i = 0; i < arguments.length; i++) { var v = o[arguments[i]]; if (v !== undefined && v !== null && v !== '') return v; } return ''; };
  var p = {
    ma: String(g('ma', 'maBai', 'MaBai', 'code', 'id')).trim(), tieuDe: String(g('tieuDe', 'ten', 'tenBai', 'title', 'TieuDe')).trim(),
    doKho: LTN_kho(g('doKho', 'difficulty', 'DoKho')), chuDe: String(g('chuDe', 'topic', 'tags', 'ChuDe')).trim(),
    noiDung: String(g('noiDung', 'deBai', 'statement', 'description', 'NoiDung')), vao: String(g('vao', 'input', 'dinhDangVao', 'inputFormat')),
    ra: String(g('ra', 'output', 'dinhDangRa', 'outputFormat')), rangBuoc: String(g('rangBuoc', 'constraints')), ghiChu: String(g('ghiChu', 'note')),
    nn: LTN_nn(g('nn', 'ngonNgu', 'languages')), tl: 2, ml: 256, cmp: LTN_cmp(g('cmp', 'soSanh', 'checker')), eps: U_num(g('eps', 'saiSo'), 1e-6) || 1e-6,
    cham: /TAT|DUNG HET|ALL/.test(LTN_norm(g('cham', 'chamDiem', 'scoring'))) ? 'TAT_CA' : 'TUNG_TEST',
    loiGiai: String(g('loiGiai', 'solution')), nnLoiGiai: '', mau: { py: '', c: '' },
    tvPy: LTN_tv(g('tvPy', 'thuVienPy'), false), tvC: LTN_tv(g('tvC', 'thuVienC'), true), cam: String(g('cam', 'camDung', 'khongDuocDung')).trim(),
    tests: []
  };
  var gh = String(g('gioiHan')), tl = g('tl', 'thoiGian', 'timeLimit'), ml = g('ml', 'boNho', 'memoryLimit');
  var mt = /([\d.,]+)\s*(giay|giây|s|sec|second)/i.exec(gh), mm = /([\d.,]+)\s*(mb|m\b)/i.exec(gh);
  p.tl = U_num(String(tl || (mt ? mt[1] : '')).replace(',', '.').replace(/[^\d.]/g, ''), 2) || 2;
  p.ml = U_num(String(ml || (mm ? mm[1] : '')).replace(/[^\d]/g, ''), 256) || 256;
  var mau = o.mau && typeof o.mau === 'object' ? o.mau : {};
  p.mau.py = String(mau.py || g('mauPy', 'mauPython', 'starterPython') || '');
  p.mau.c = String(mau.c || g('mauC', 'starterC') || '');
  p.nnLoiGiai = LTN_lang(g('nnLoiGiai', 'solutionLang'), p.loiGiai) || 'py';
  var ts = o.tests || o.test || o.testCases || [];
  p.tests = (Array.isArray(ts) ? ts : []).map(function (t) {
    t = t || {};
    var mauT = t.mau !== undefined ? !!t.mau && t.mau !== 'false' && t.mau !== 'FALSE' : !!(t.sample || t.example);
    var inp = t.in !== undefined ? t.in : t.input !== undefined ? t.input : '', out = t.out !== undefined ? t.out : t.output !== undefined ? t.output : t.expected;
    var d = t.diem !== undefined ? t.diem : t.weight !== undefined ? t.weight : t.score;
    return { in: LTN_testIO(String(inp)), out: out === undefined || out === null ? '' : LTN_testIO(String(out)), mau: mauT, diem: d === undefined || d === '' ? (mauT ? 0 : 1) : U_num(d, 1),
      gt: String(t.gt || t.giaiThich || t.explanation || ''), noOut: out === undefined || out === null };
  });
  return p;
}
function LTN_kho(v) { var u = LTN_norm(v); return /^(KHO|HARD)/.test(u) ? 'KHO' : /^(DE|EASY)$/.test(u) ? 'DE' : 'TB'; }
function LTN_nn(v) {
  var a = Array.isArray(v) ? v.join(',') : String(v || ''), u = ',' + LTN_norm(a).replace(/ /g, ',') + ',', r = [];
  if (/,(PY|PYTHON|PYTHON3|PYTHON 3),/.test(u) || /PY/.test(u)) r.push('py');
  if (/,(C|GCC|C99|C11),/.test(u)) r.push('c');
  return r.length ? r : ['py', 'c'];
}
function LTN_cmp(v) {
  var u = LTN_norm(v);
  if (!u) return 'TOKEN';
  if (LT_CMP.indexOf(u.replace(/ /g, '_')) >= 0) return u.replace(/ /g, '_');
  if (/HOA THUONG|NOCASE|CASE/.test(u)) return 'NOCASE';
  if (/SO THUC|SAI SO|FLOAT/.test(u)) return 'FLOAT';
  if (/CHINH XAC|EXACT|KY TU/.test(u)) return 'EXACT';
  if (/DONG|LINE/.test(u)) return 'LINE';
  return 'TOKEN';
}
function LTN_tv(v, isC) {
  var u = LTN_norm(v);
  if (!u || /^(TAT CA|MOI|ALL|KHONG GIOI HAN|TAT CA THU VIEN CHUAN|MOI THU VIEN CHUAN)/.test(u)) return 'TAT_CA';
  if (!isC && /^(KHONG|NONE|KHONG DUOC IMPORT)/.test(u)) return 'KHONG';
  return LT_tvNorm(String(v).replace(/^\s*(chỉ|chi)\s*:?\s*/i, ''), isC);
}
/** Kiểm tra 1 bài → {p, errs (chặn nhập), warns} */
function LTN_check(p) {
  var errs = [], warns = [];
  if (!p.tieuDe) errs.push('thiếu tên bài (### TÊN)');
  if (!String(p.noiDung).trim()) errs.push('thiếu đề bài (### ĐỀ BÀI)');
  if (!p.ma && p.tieuDe) p.ma = 'LT_' + LTN_norm(p.tieuDe).replace(/ /g, '_').substring(0, 28);
  p.ma = U_upper(p.ma).replace(/[^A-Z0-9_-]/g, '');
  if (!p.ma) errs.push('thiếu mã bài');
  var big = [['Đề bài', p.noiDung], ['Lời giải', p.loiGiai]];
  p.tests.forEach(function (t, i) { big.push(['Input test ' + (i + 1), t.in], ['Output test ' + (i + 1), t.out]); });
  big.forEach(function (b) { if (String(b[1] || '').length > LT_MAX_CELL) errs.push(b[0] + ' dài quá ' + LT_MAX_CELL + ' ký tự (giới hạn 1 ô Google Sheets)'); });
  if (!p.tests.length) warns.push('chưa có test');
  else {
    if (!p.tests.some(function (t) { return t.mau; })) warns.push('chưa có test MẪU');
    if (p.tests.every(function (t) { return t.mau; })) warns.push('mọi test đều là mẫu — nên có test ẩn');
  }
  var noOut = p.tests.filter(function (t) { return !t.out.trim(); }).length;
  if (!String(p.loiGiai).trim()) warns.push('chưa có lời giải mẫu — không kiểm thử được' + (noOut ? ', ' + noOut + ' test thiếu output sẽ không tự điền được' : ''));
  if (p.loiGiai && p.nn.indexOf(p.nnLoiGiai) < 0) warns.push('lời giải viết bằng ' + (p.nnLoiGiai === 'c' ? 'C' : 'Python') + ' nhưng bài không cho thí sinh dùng ngôn ngữ đó (vẫn kiểm thử được)');
  if (p.loiGiai) { var lv = JD_libCheck(p.nnLoiGiai, p.loiGiai, LT_lib(p)); if (lv) warns.push('lời giải mẫu vi phạm quy định thư viện của chính bài: ' + lv.msg); }
  p.tests.forEach(function (t) { delete t.noOut; });
  return { p: p, errs: errs, warns: warns, nMau: p.tests.filter(function (t) { return t.mau; }).length, nAn: p.tests.filter(function (t) { return !t.mau; }).length, noOut: noOut };
}

/** Xem trước (không ghi) */
function LT_importPreview(txt) {
  var r = LT_parseImport(txt), have = {};
  LT_list().forEach(function (x) { have[x.ma] = true; });
  return {
    errors: r.errors,
    items: r.items.map(function (x) {
      return { ma: x.p.ma, tieuDe: x.p.tieuDe, doKho: x.p.doKho, chuDe: x.p.chuDe, nn: x.p.nn, nMau: x.nMau, nAn: x.nAn, noOut: x.noOut, sol: !!String(x.p.loiGiai).trim(),
        nnLoiGiai: x.p.nnLoiGiai, tl: x.p.tl, ml: x.p.ml, cmp: x.p.cmp, tv: LT_tvView(x.p), errs: x.errs, warns: x.warns, trung: !!have[x.p.ma] };
    })
  };
}
/**
 * Nhập vào ngân hàng. o.dup: 'DOI_MA' (mặc định — thêm _2, _3…) | 'GHI_DE' | 'BO_QUA'
 * → {saved:[{ma, tieuDe, nTest, noOut, sol, ghiDe}], skipped:[{ma, why}], failed:[{ma, err}]}
 */
function LT_import(txt, o) {
  o = o || {};
  var r = LT_parseImport(txt);
  if (r.errors.length && !r.items.length) throw new Error(r.errors.join('\n'));
  var have = {}, out = { saved: [], skipped: [], failed: [] };
  LT_list().forEach(function (x) { have[x.ma] = true; });
  r.items.forEach(function (x) {
    var p = x.p;
    if (x.errs.length) { out.failed.push({ ma: p.ma || '(không mã)', tieuDe: p.tieuDe, err: x.errs.join('; ') }); return; }
    var ghiDe = false;
    if (have[p.ma]) {
      if (o.dup === 'BO_QUA') { out.skipped.push({ ma: p.ma, tieuDe: p.tieuDe, why: 'trùng mã bài đã có' }); return; }
      if (o.dup === 'GHI_DE') ghiDe = true;
      else { var i = 2; while (have[p.ma + '_' + i]) i++; p.ma = p.ma + '_' + i; }
    }
    p.isNew = !ghiDe; p.testsChanged = true;
    try {
      var s = LT_save(p);
      have[s.ma] = true;
      out.saved.push({ ma: s.ma, tieuDe: s.tieuDe, nTest: s.tests.length, noOut: s.tests.filter(function (t) { return !t.out.trim(); }).length, sol: !!s.loiGiai.trim(), ghiDe: ghiDe, warns: x.warns });
    } catch (e) { out.failed.push({ ma: p.ma, tieuDe: p.tieuDe, err: e.message }); }
  });
  S_log('LT_NHAP_NHANH', out.saved.length + ' bài: ' + out.saved.map(function (x) { return x.ma; }).join(', '));
  return out;
}

/** Xuất bài ra văn bản cùng định dạng nhập (mas rỗng = cả ngân hàng) */
function LT_exportText(mas) {
  var list = mas && mas.length ? mas : LT_list().map(function (x) { return x.ma; });
  var fence = function (code, lang) { var f = /```/.test(code) ? '~~~' : '```'; return f + lang + '\n' + String(code || '').replace(/\n+$/, '') + '\n' + f; };
  var io = function (s) { s = String(s || ''); return /^\s*(#{2,4}\s|={3,}|```|~~~)/m.test(s) ? fence(s, 'text') : s.replace(/\n+$/, ''); };
  var tvTxt = function (v) { return v === 'TAT_CA' ? 'Tất cả' : v === 'KHONG' ? 'Không' : v; };
  var blocks = list.map(function (ma) {
    var p = LT_get(ma), L = [];
    L.push('### BÀI: ' + p.ma + ' | ' + p.tieuDe + ' | ' + ({ DE: 'Dễ', TB: 'Trung bình', KHO: 'Khó' }[U_upper(p.doKho)] || 'Trung bình') + ' | ' + p.chuDe);
    L.push('### ĐỀ BÀI', p.noiDung.replace(/\n+$/, ''), '### INPUT', p.vao.replace(/\n+$/, ''), '### OUTPUT', p.ra.replace(/\n+$/, ''));
    if (p.rangBuoc.trim()) L.push('### RÀNG BUỘC', p.rangBuoc.replace(/\n+$/, ''));
    if (p.ghiChu) L.push('### GHI CHÚ: ' + p.ghiChu);
    L.push('### NGÔN NGỮ: ' + p.nn.map(function (x) { return x === 'c' ? 'C' : 'Python'; }).join(', '));
    L.push('### GIỚI HẠN: ' + p.tl + ' giây, ' + p.ml + ' MB', '### SO SÁNH: ' + p.cmp + (p.cmp === 'FLOAT' ? '\n### SAI SỐ: ' + p.eps : ''), '### CHẤM: ' + p.cham);
    L.push('### THƯ VIỆN PYTHON: ' + tvTxt(p.tvPy), '### THƯ VIỆN C: ' + tvTxt(p.tvC));
    if (p.cam) L.push('### KHÔNG ĐƯỢC DÙNG: ' + p.cam);
    if (p.loiGiai.trim()) L.push('### LỜI GIẢI: ' + (p.nnLoiGiai === 'c' ? 'C' : 'Python'), fence(p.loiGiai, p.nnLoiGiai === 'c' ? 'c' : 'python'));
    if (p.mau.py.trim()) L.push('### CODE KHỞI TẠO PYTHON', fence(p.mau.py, 'python'));
    if (p.mau.c.trim()) L.push('### CODE KHỞI TẠO C', fence(p.mau.c, 'c'));
    p.tests.forEach(function (t) {
      L.push('### TEST' + (t.mau ? ' MẪU' : '') + ' | ' + t.diem + (t.gt ? ' | ' + String(t.gt).replace(/[|\n]+/g, ' ') : ''), io(t.in), '=== OUTPUT ===', io(t.out));
    });
    return L.join('\n');
  });
  return { text: blocks.join('\n\n') + '\n', n: blocks.length };
}

/* ------------------------------------------------------------------ TEST TỪ FILE / ZIP */

/**
 * files: [{name, text}] (file lẻ đã đọc sẵn) hoặc [{name, b64}] (file .zip) → ghép cặp input / output
 * → {tests:[{in, out, name}], unpaired:[tên], n}
 */
function LT_testFiles(files) {
  var flat = [];
  (files || []).forEach(function (f) {
    if (f.b64) {
      var blobs;
      try { blobs = Utilities.unzip(Utilities.newBlob(Utilities.base64Decode(f.b64), 'application/zip', f.name || 'tests.zip')); }
      catch (e) { throw new Error('Không mở được file ZIP ' + (f.name || '') + ': ' + e.message); }
      blobs.forEach(function (b) { flat.push({ name: String(b.getName()), text: b.getDataAsString('UTF-8') }); });
    } else flat.push({ name: String(f.name || ''), text: String(f.text == null ? '' : f.text) });
  });
  return LT_pairTests(flat);
}
var LTN_IN_EXT = ['in', 'inp', 'input'], LTN_OUT_EXT = ['out', 'ans', 'ok', 'output', 'a', 'sol', 'res'];
function LT_pairTests(files) {
  var groups = {}, unpaired = [];
  files.forEach(function (f) {
    var path = f.name.replace(/\\/g, '/');
    if (/(^|\/)(__MACOSX|\.)/.test(path) || /\/$/.test(path)) return;     // rác của macOS / file ẩn / thư mục
    var parts = path.split('/'), base = parts.pop(), dot = base.lastIndexOf('.');
    var stem = dot > 0 ? base.substring(0, dot) : base, ext = dot > 0 ? base.substring(dot + 1).toLowerCase() : '';
    var dirs = parts.filter(function (d) { return !/^(inputs?|outputs?|in|out|ans|answers?|tests?)$/i.test(d); });
    var role = '', key = '';
    if (LTN_IN_EXT.indexOf(ext) >= 0) { role = 'in'; key = stem; }
    else if (!ext && /^\d+$/.test(stem)) { role = 'in'; key = stem; }                 // Codeforces / Polygon: 01 + 01.a
    else if (LTN_OUT_EXT.indexOf(ext) >= 0) { role = 'out'; key = stem; }
    else {
      var m = /^(input|in|inp)[-_ .]?(.*)$/i.exec(stem), n = /^(output|out|ans|answer|expected)[-_ .]?(.*)$/i.exec(stem);
      if (m) { role = 'in'; key = m[2]; } else if (n) { role = 'out'; key = n[2]; }
      else { var dIn = parts.some(function (d) { return /^(inputs?|in)$/i.test(d); }), dOut = parts.some(function (d) { return /^(outputs?|out|ans|answers?)$/i.test(d); });
        if (dIn) { role = 'in'; key = stem; } else if (dOut) { role = 'out'; key = stem; } }
    }
    if (!role) { unpaired.push(path); return; }
    // Themis / thư mục mỗi test: Test01/BAI.INP + Test01/BAI.OUT → khoá theo thư mục
    var k = (dirs.join('/') + '/' + key).toLowerCase();
    var g = groups[k] = groups[k] || { key: k, label: (dirs.concat([key])).filter(String).join('/') || stem };
    if (g[role] !== undefined) { unpaired.push(path); return; }
    g[role] = f.text;
  });
  var keys = Object.keys(groups).sort(function (a, b) {               // sắp tự nhiên: test2 trước test10
    var x = a.split(/(\d+)/), y = b.split(/(\d+)/);
    for (var i = 0; i < Math.min(x.length, y.length); i++) {
      if (x[i] === y[i]) continue;
      var nx = /^\d+$/.test(x[i]), ny = /^\d+$/.test(y[i]);
      if (nx && ny) return Number(x[i]) - Number(y[i]);
      return x[i] < y[i] ? -1 : 1;
    }
    return x.length - y.length;
  });
  var tests = [];
  keys.forEach(function (k) {
    var g = groups[k];
    if (g.in === undefined) { unpaired.push(g.label + ' (chỉ có output)'); return; }
    tests.push({ in: LTN_raw(g.in), out: g.out === undefined ? '' : LTN_raw(g.out), name: g.label, mau: false, diem: 1, gt: '' });
  });
  tests.forEach(function (t) { if (t.in.length > LT_MAX_CELL || t.out.length > LT_MAX_CELL) t.tooBig = true; });
  return { tests: tests, unpaired: unpaired, n: tests.length, tooBig: tests.filter(function (t) { return t.tooBig; }).map(function (t) { return t.name; }) };
}
function LTN_raw(s) { s = String(s || '').replace(/^﻿/, '').replace(/\r\n?/g, '\n'); return s && !/\n$/.test(s) ? s + '\n' : s; }

/* ------------------------------------------------------------------ SINH TEST BẰNG CODE */

/**
 * Chạy code sinh input n lần: lần thứ t nhận "t" (1…n) ở input, in ra input của test t.
 * → {tests:[{in}], errs:[{t, msg}]} — output điền sau bằng lời giải mẫu (⚙ Điền output trống)
 */
function LT_genTests(lang, code, n) {
  n = Math.max(1, Math.min(50, Math.floor(U_num(n, 10))));
  if (!String(code || '').trim()) throw new Error('Chưa có code sinh test');
  var ins = []; for (var t = 1; t <= n; t++) ins.push({ in: t + '\n' });
  var r = JD_run(LT_judge(), lang === 'c' ? 'c' : 'py', code, ins, { tl: 5, ml: 512 });
  if (r.ce) return { ce: r.ce, tests: [], errs: [] };
  var tests = [], errs = [];
  r.results.forEach(function (x, i) {
    if (x.v !== 'OK' && x.v !== 'AC') { errs.push({ t: i + 1, msg: (x.v || 'lỗi') + (x.err ? ': ' + JD_cut(x.err, 300) : '') }); return; }
    var s = LTN_raw(x.out);
    if (s.length > LT_MAX_CELL) { errs.push({ t: i + 1, msg: 'input dài ' + s.length + ' ký tự — quá giới hạn 1 ô Google Sheets (' + LT_MAX_CELL + ')' }); return; }
    if (/…\(đã cắt bớt\)\s*$/.test(s)) { errs.push({ t: i + 1, msg: 'output quá dài, bị cắt' }); return; }
    tests.push({ in: s, out: '', mau: false, diem: 1, gt: '', gen: i + 1 });
  });
  return { tests: tests, errs: errs, rt: r.rt || '' };
}
