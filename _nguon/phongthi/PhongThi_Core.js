/**
 * PhongThi_Core.js — MÃ LÕI PHÒNG THI (KHÔNG dán tay).
 * Hệ thống Trung tâm đóng gói tệp này + ThiSinh.html và tự đẩy sang file PhongThi_DuLieu (sheet "MaNguon").
 * Bộ khởi động PhongThi.gs (dán 1 lần) nạp & chạy mã này → mọi lần cập nhật sau không phải triển khai lại.
 * Được chạy bằng new Function('HTML_', mã) — HTML_() trả về giao diện thí sinh.
 *
 * Bảo mật: dự án phòng thi KHÔNG chứa ngân hàng câu hỏi hay đáp án; chỉ 2 hàm công khai (doGet, PT_api) nằm ở bộ khởi động.
 * Tải: mỗi thí sinh ~1 lượt gọi / 12–30 giây, dãn cách ngẫu nhiên; ghi bài bằng appendRow (nguyên tử), không khoá toàn cục.
 */

var PT_VERSION = '1.7.9';
var PT_GRACE_SAVE_ = 90 * 1000;          // còn nhận bản tự lưu 90 giây sau hết giờ
var PT_GRACE_SUBMIT_ = 5 * 60 * 1000;    // còn nhận nộp bài 5 phút sau hết giờ (mạng chậm) — đánh dấu nộp trễ nếu > 30 giây
var PT_LATE_MS_ = 30 * 1000;
var PT_SERIOUS_ = ['ROI_TAB', 'ROI_CUA_SO', 'THOAT_TOAN_MAN', 'MAN_HINH_PHU', 'CUA_SO_NHO', 'CHUP_MAN_HINH'];
/** Chế độ nghiêm ngặt (thi bằng link, không SEB): 1 lần rời màn hình = khoá ngay, mở bằng mã giám thị tại máy */
/* THI THỬ CỦA GIÁM THỊ: 1 dòng thí sinh ảo SBD "GV-THU" (trang quản trị tạo, kèm khoá bí mật dùng 1 lần trong link, hạn 12 giờ).
   Vào được cả khi phòng chưa mở / đã đóng, không bị hẹn đóng, không tính vào kết quả / giám sát. GhiChu = "THU|<hạn>|<chống gian lận 1/0>|<mã đề,…>" */
var THU_SBD_ = 'GV-THU';
function isThu_(st) { return !!st && up_(st.SBD) === THU_SBD_ && /^THU\|/.test(str_(st.GhiChu)); }
function thuInfo_(st) {
  var p = str_(st.GhiChu).split('|');
  return { exp: num_(p[1]), guard: p[2] === '1', des: (p[3] || '').split(',').filter(function (x) { return !!x; }) };
}
function strict_(ex, st) { return up_(ex.NghiemNgat) === 'CO' && up_(st.SEB) !== 'CO'; }
function maxVp_(ex, st) { return strict_(ex, st) ? 1 : num_(ex.ViPhamToiDa); }

var RSH_ = { KY_THI: 'KyThi', THI_SINH: 'ThiSinh', GOI_DE: 'GoiDe', BAI_LAM: 'BaiLam', NHAT_KY: 'NhatKy', LT_TEST: 'LT_Test', LT_NOP: 'LT_Nop' };
/** Phải khớp RHEADERS bên Hệ thống Trung tâm (18_Core_Package.gs) */
var RHEADERS_ = {
  KyThi: ['MaKyThi', 'TenKyThi', 'DonVi', 'MaMon', 'TrangThai', 'ThoiGianPhut', 'TinhGio', 'MoLuc', 'DongLuc', 'HenDong',
    'MaPhong', 'BatBuocSEB', 'KhoaUA', 'DangNhapLai', 'ViPhamToiDa', 'ThongBao', 'HuongDan', 'PhienBanGoi', 'SoCau', 'TongDiem',
    'ThoatURL', 'SebXml', 'CapNhat', 'SebKeyChuan', 'SebXml2', 'SebXml3', 'SebXml4', 'HenCung', 'ClbTen', 'ClbKhau', 'ClbLogo', 'ClbMau', 'NghiemNgat', 'MaMoKhoa', 'LapTrinh', 'TinHieu', 'ChongAI'],
  ThiSinh: ['MaKyThi', 'SBD', 'HoTen', 'Lop', 'MaDe', 'MaTruyCap',
    'TrangThai', 'Token', 'BatDau', 'SoLanVao', 'TrinhDuyet', 'SEB', 'NopLuc', 'LanCuoi', 'DaLam', 'ViPham', 'ViPhamMoc', 'LenhDaXuLy', 'SebKey', 'SebVer', 'ManHinh', 'LtDiem', 'NghiTD', 'NghiMuc', 'NghiLyDo',
    'ThemPhut', 'Lenh', 'LenhGiaTri', 'LenhId', 'GhiChu', 'CamThi', 'LyDoCam', 'DungLuc', 'DungMs', 'VuotHen'],
  GoiDe: ['MaKyThi', 'MaDe', 'PhienBan', 'Manh', 'DuLieu'],
  BaiLam: ['ThoiGian', 'MaKyThi', 'SBD', 'MaDe', 'Loai', 'Seq', 'SoCauDaLam', 'TraLoi', 'MaXacNhan', 'TraLoi2'],
  LT_Test: ['MaKyThi', 'MaBai', 'STT', 'Input', 'Output', 'Mau', 'Diem'],
  LT_Nop: ['ThoiGian', 'MaKyThi', 'SBD', 'MaBai', 'NgonNgu', 'Loai', 'Code', 'KetQua', 'Diem', 'DiemToiDa'],
  NhatKy: ['ThoiGian', 'MaKyThi', 'SBD', 'SuKien', 'ChiTiet']
};

/* ============================================================ CỔNG VÀO */

function doGet(e) {
  var p = (e && e.parameter) || {};
  if (p.seb) return sebFile_(String(p.seb));
  if (p.p === 'thoat') {
    return HtmlService.createHtmlOutput('<div style="font:16px system-ui,sans-serif;padding:48px;text-align:center;color:#234">' +
      '<h2>Đã kết thúc bài thi</h2><p>Bạn có thể rời khỏi máy.</p></div>').setTitle('Kết thúc bài thi');
  }
  // nhúng sẵn tên / khẩu hiệu / logo CLB vào trang → hiện ngay khi trang mở, không phải chờ gọi máy chủ lần nữa
  var html = HTML_(), b = null, title = 'Phòng thi trực tuyến';
  try { b = info_().brand; } catch (x) { b = null; }
  if (b) {
    var inj = '<script>window.PT_BRAND=' + JSON.stringify(b).replace(/</g, '\\u003c') + ';</script>\n<script>\n\'use strict\';';
    html = html.replace('<script>\n\'use strict\';', function () { return inj; });
    if (b.ten) title = b.ten + ' — Phòng thi';
  }
  return HtmlService.createHtmlOutput(html).setTitle(title)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

/** Cổng API duy nhất cho trang thí sinh */
function PT_api(name, args) {
  try {
    var fn = ROUTES_[name];
    if (!fn) throw err_('BAD', 'Yêu cầu không hợp lệ');
    var data = fn.apply(null, args || []);
    return JSON.stringify({ ok: true, data: data === undefined ? null : data });
  } catch (e) {
    var msg = (e && e.message) ? e.message : String(e);
    // lỗi tạm thời của Google (quá tải, hết thời gian, lỗi dịch vụ) → "BUSY" để máy thí sinh tự thử lại, không làm phiền thí sinh
    var code = (e && e.code) || (/too many|quá nhiều|Service invoked|simultaneous|timed out|timeout|hết thời gian|Service error|Internal error|lỗi máy chủ|try again|thử lại|Lock|unavailable|Rate Limit|backend error/i.test(msg) ? 'BUSY' : 'ERR');
    return JSON.stringify({ ok: false, code: code, error: code === 'BUSY' ? 'Máy chủ đang bận, hệ thống tự thử lại…' : msg });
  }
}

var ROUTES_ = {
  info: function () { return info_(); },
  login: function (sbd, code, room, client) { return login_(sbd, code, room, client || {}); },
  wait: function (tok, ky, sbd) { return wait_(tok, ky, sbd); },
  start: function (tok, ky, sbd) { return start_(tok, ky, sbd); },
  save: function (tok, ky, sbd, p) { return save_(tok, ky, sbd, p || {}); },
  poll: function (ky, sbd) { return poll_(ky, sbd); },
  submit: function (tok, ky, sbd, p) { return submit_(tok, ky, sbd, p || {}); },
  ask: function (tok, ky, sbd, text) { return ask_(tok, ky, sbd, text); },
  resume: function (tok, ky, sbd) { return resume_(tok, ky, sbd); },
  unlock: function (tok, ky, sbd, code, p) { return unlock_(tok, ky, sbd, code, p || {}); },
  runCode: function (tok, ky, sbd, p) { return runCode_(tok, ky, sbd, p || {}); },
  submitCode: function (tok, ky, sbd, p) { return submitCode_(tok, ky, sbd, p || {}); },
  thuLogin: function (key, client) { return thuLogin_(key, client || {}); },
  thuCtl: function (tok, ky, sbd, act, arg) { return thuCtl_(tok, ky, sbd, act, arg); }
};

/* ============================================================ TIỆN ÍCH */

function err_(code, msg) { var e = new Error(msg); e.code = code; return e; }
function str_(v) { return v === null || v === undefined ? '' : (v instanceof Date ? String(v.getTime()) : String(v).trim()); }
function up_(v) { return str_(v).toUpperCase(); }
function num_(v, d) { var n = Number(str_(v).replace(',', '.')); return str_(v) === '' || isNaN(n) ? (d === undefined ? 0 : d) : n; }
function ss_() { return SpreadsheetApp.getActiveSpreadsheet(); }
function cache_() { return CacheService.getScriptCache(); }
function hash_(s) {
  var h = 0x811c9dc5; s = String(s);
  for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193); }
  return h >>> 0;
}
function receipt_(s) { var h = ('00000000' + hash_(s).toString(16).toUpperCase()).slice(-8); return h.slice(0, 4) + '-' + h.slice(4); }

var _HEAD_ = {};
function head_(sh) {
  var n = sh.getName();
  if (!_HEAD_[n]) _HEAD_[n] = sh.getRange(1, 1, 1, Math.max(1, sh.getLastColumn())).getValues()[0].map(str_);
  return _HEAD_[n];
}
function sheet_(name) {
  var sh = ss_().getSheetByName(name);
  if (!sh) throw err_('SETUP', 'Phòng thi chưa được cài đặt (thiếu sheet ' + name + '). Báo giám thị.');
  return sh;
}
function readAll_(name) {
  var sh = sheet_(name), last = sh.getLastRow();
  if (last < 2) return [];
  var h = head_(sh), v = sh.getRange(2, 1, last - 1, h.length).getValues(), out = [];
  for (var i = 0; i < v.length; i++) {
    var o = { __row: i + 2 }, any = false;
    for (var j = 0; j < h.length; j++) { if (h[j]) { o[h[j]] = v[i][j]; if (v[i][j] !== '' && v[i][j] !== null) any = true; } }
    if (any) out.push(o);
  }
  return out;
}
function readRow_(sh, row) {
  var h = head_(sh), v = sh.getRange(row, 1, 1, h.length).getValues()[0], o = { __row: row };
  for (var j = 0; j < h.length; j++) if (h[j]) o[h[j]] = v[j];
  return o;
}
/** Ghi các cột trong patch, gom cột liền nhau thành ít lần ghi nhất */
function writeCols_(sh, row, patch) {
  var h = head_(sh), idx = Object.keys(patch).map(function (k) { return h.indexOf(k); }).filter(function (i) { return i >= 0; }).sort(function (a, b) { return a - b; });
  var i = 0;
  while (i < idx.length) {
    var j = i;
    while (j + 1 < idx.length && idx[j + 1] === idx[j] + 1) j++;
    var vals = [];
    for (var k = idx[i]; k <= idx[j]; k++) { var v = patch[h[k]]; vals.push(v === undefined || v === null ? '' : String(v)); }
    sh.getRange(row, idx[i] + 1, 1, vals.length).setValues([vals]);
    i = j + 1;
  }
}
function append_(name, obj) {
  var sh = sheet_(name), h = head_(sh);
  sh.appendRow(h.map(function (k) { var v = obj[k]; return v === undefined || v === null ? '' : String(v); }));
}
function safeCell_(s) { s = String(s == null ? '' : s); return /^[=+\-@]/.test(s) ? ' ' + s : s; }   // chặn Sheets hiểu nhầm thành công thức
function log_(ky, sbd, k, d) { try { append_(RSH_.NHAT_KY, { ThoiGian: Date.now(), MaKyThi: ky, SBD: sbd, SuKien: k, ChiTiet: safeCell_(d || '') }); } catch (e) { } }

/** Dòng kỳ thi (đệm 10 giây để mở/đóng thi lan tới thí sinh nhanh mà vẫn nhẹ máy chủ) */
function exam_(ky) {
  var c = cache_(), key = 'ex|' + ky, s = c.get(key);
  if (s) return JSON.parse(s);
  var r = readAll_(RSH_.KY_THI).filter(function (x) { return str_(x.MaKyThi) === ky; })[0];
  if (!r) throw err_('NO_EXAM', 'Kỳ thi không còn trên phòng thi');
  var o = {};
  Object.keys(r).forEach(function (k) { if (!/^SebXml/.test(k) && k !== '__row') o[k] = str_(r[k]); });
  c.put(key, JSON.stringify(o), 5);
  return o;
}

/**
 * TÍN HIỆU NHANH: máy thí sinh hỏi mỗi 6–20 giây "giám thị có lệnh mới cho em không?" — chỉ đọc dòng kỳ thi đã đệm 5 giây
 * (không mở sheet thí sinh, không khoá) → có lệnh thì máy thí sinh đồng bộ ngay, không phải chờ nhịp lưu bài 20–30 giây.
 * TinHieu = "<mốc>|<SBD,SBD,…>" hoặc "<mốc>|*" (cả phòng). Không trả danh sách SBD về máy thí sinh.
 */
function poll_(ky, sbd) {
  ky = str_(ky); sbd = up_(sbd);
  var e = exam_(ky), s = str_(e.TinHieu), i = s.indexOf('|'), v = i > 0 ? s.substring(0, i) : s, who = i > 0 ? s.substring(i + 1) : '';
  var n = 40; try { var m = cache_().get('rows|' + ky); if (m) n = Object.keys(JSON.parse(m)).length; } catch (x) { }
  return { v: v, me: !!v && (who === '*' || (',' + who + ',').indexOf(',' + sbd + ',') >= 0), iv: Math.min(20, Math.max(6, Math.round(n / 6))), tt: str_(e.TrangThai) };
}

/** Tìm dòng thí sinh (bảng SBD → số dòng đệm 10 phút, luôn kiểm tra lại) */
function findRow_(ky, sbd) {
  var sh = sheet_(RSH_.THI_SINH), c = cache_(), key = 'rows|' + ky, map = null, s = c.get(key);
  if (s) map = JSON.parse(s);
  if (map && map[sbd]) {
    var r = readRow_(sh, map[sbd]);
    if (str_(r.MaKyThi) === ky && up_(r.SBD) === sbd) return r;
  }
  map = {};
  var hit = null;
  readAll_(RSH_.THI_SINH).forEach(function (x) {
    if (str_(x.MaKyThi) !== ky) return;
    map[up_(x.SBD)] = x.__row;
    if (up_(x.SBD) === sbd) hit = x;
  });
  try { c.put(key, JSON.stringify(map), 600); } catch (e) { }
  return hit;
}

/** Thời gian đã tạm dừng (ms) của thí sinh — giờ thi được bù đúng bằng thời gian này */
function pausedMs_(st, now) { return num_(st.DungMs) + (num_(st.DungLuc) ? Math.max(0, (now || Date.now()) - num_(st.DungLuc)) : 0); }
function deadline_(ex, st) {
  var dur = (num_(ex.ThoiGianPhut) + num_(st.ThemPhut)) * 60000;
  if (isThu_(st)) return dur > 0 && num_(st.BatDau) ? num_(st.BatDau) + dur + pausedMs_(st) : 0;   // thi thử: giờ riêng, không theo hẹn đóng / đóng phòng
  // Tính giờ CHUNG: cả phòng tính từ lúc mở; riêng em được "làm lại" SAU lúc mở phòng thì tính từ lúc em bắt đầu lượt mới
  var chung = up_(ex.TinhGio) === 'CHUNG', ra = resetAt_(st);
  var base = chung && !(ra > num_(ex.MoLuc)) ? num_(ex.MoLuc) : num_(st.BatDau);
  var d = dur > 0 && base ? base + dur + pausedMs_(st) : 0;
  var cap = [];
  // Hẹn đóng (mốc chung) + phần vượt riêng của em; HenCung=CO: mọi em kết thúc đúng mốc
  if (num_(ex.HenDong)) {
    var capH = num_(ex.HenDong) + num_(st.VuotHen) * 60000;
    if (up_(ex.HenCung) === 'CO') d = capH; else cap.push(capH);
  }
  if (up_(ex.TrangThai) === 'DONG' && num_(ex.DongLuc)) cap.push(num_(ex.DongLuc));
  cap.forEach(function (x) { d = d ? Math.min(d, x) : x; });
  return d; // 0 = không giới hạn
}

/** Phiên hợp lệ? trả {ex, st, sh} */
function session_(tok, ky, sbd) {
  ky = str_(ky); sbd = up_(sbd);
  var st = findRow_(ky, sbd);
  if (!st) throw err_('NO_STUDENT', 'Không tìm thấy thí sinh');
  if (up_(st.CamThi) === 'CO') throw err_('BANNED', banMsg_(st));
  if (!tok || str_(st.Token) !== str_(tok)) {
    if (!str_(st.Token) && resetAt_(st)) throw err_('RESET', 'Giám thị đã cho làm lại bài thi từ đầu. Bài cũ đã được huỷ.');
    throw err_('REPLACED', 'Phiên làm bài này đã được mở ở máy/cửa sổ khác. Báo giám thị nếu không phải bạn.');
  }
  if (isThu_(st) && thuInfo_(st).exp < Date.now()) throw err_('THU_HET', 'Link thi thử đã hết hạn. Tạo link mới ở trang quản trị › ⑤ › Thi thử.');
  return { ex: exam_(ky), st: st, sh: sheet_(RSH_.THI_SINH), ky: ky, sbd: sbd, thu: isThu_(st) };
}

function msgOf_(ex) { return str_(ex.ThongBao); }
function banMsg_(st) { return 'Bạn đã bị ĐÌNH CHỈ THI' + (str_(st.LyDoCam) ? ': ' + str_(st.LyDoCam) : '') + '. Hãy làm theo hướng dẫn của giám thị.'; }
/** Mốc "cho làm lại" gần nhất (GhiChu = RESET:<ms>) — dùng làm mã lượt thi */
function resetAt_(st) { var m = str_(st.GhiChu).match(/^RESET:(\d+)/); return m ? Number(m[1]) : 0; }
function payload_(st, ex, tok, isSeb) {
  return {
    tok: tok, ky: str_(st.MaKyThi), sbd: up_(st.SBD), hoTen: str_(st.HoTen), lop: str_(st.Lop), maDe: str_(st.MaDe), now: Date.now(), seb: isSeb,
    att: String(resetAt_(st)),
    brand: brand_(ex),
    exam: { ten: str_(ex.TenKyThi), donVi: str_(ex.DonVi), thoiGian: num_(ex.ThoiGianPhut), soCau: num_(ex.SoCau), tongDiem: num_(ex.TongDiem),
      huongDan: str_(ex.HuongDan), mo: up_(ex.TrangThai) === 'MO', tinhGio: up_(ex.TinhGio) || 'RIENG', viPhamToiDa: num_(ex.ViPhamToiDa), nghiemNgat: up_(ex.NghiemNgat) === 'CO',
      thongBao: msgOf_(ex), started: num_(st.BatDau) > 0 },
    thu: isThu_(st) ? (function (i) { return { exp: i.exp, guard: i.guard, des: i.des, mo: up_(ex.TrangThai) }; })(thuInfo_(st)) : null
  };
}
/** Tải lại trang (F5 / nút tải lại của SEB): vào tiếp bằng phiên cũ, không cần đăng nhập lại */
function resume_(tok, ky, sbd) {
  ky = str_(ky); sbd = up_(sbd);
  var c = cache_(), pk = 'ptok|' + ky + '|' + sbd;
  var st0 = findRow_(ky, sbd);
  // lần tải lại trước đã cấp phiên mới nhưng phản hồi bị mất (mạng chập chờn) → vẫn nhận phiên cũ trong 2 phút
  if (st0 && str_(tok) && str_(st0.Token) && str_(st0.Token) !== str_(tok) && c.get(pk) === str_(tok)) tok = str_(st0.Token);
  var s = session_(tok, ky, sbd);
  if (up_(s.st.TrangThai) === 'DA_NOP' && !s.thu) throw err_('DONE', 'Bạn đã nộp bài.');
  if (up_(s.ex.TrangThai) === 'DONG' && !num_(s.st.BatDau) && !s.thu) throw err_('CLOSED', 'Kỳ thi đã kết thúc.');
  // cấp phiên mới: nếu đường link bị mở ở tab/máy khác thì tab cũ bị thay thế (không thể 2 nơi cùng ghi bài)
  var nt = Utilities.getUuid();
  writeCols_(s.sh, s.st.__row, { LanCuoi: Date.now(), Token: nt });
  try { c.put(pk, str_(tok), 120); } catch (e) { }
  if (!s.thu) log_(s.ky, s.sbd, 'TAI_LAI', 'pt v' + PT_VERSION + ' · Tải lại trang');
  var pl = payload_(s.st, s.ex, nt, up_(s.st.SEB) === 'CO');
  if (s.thu) { pl.exam.mo = true; pl.thu.done = up_(s.st.TrangThai) === 'DA_NOP'; }
  return pl;
}

/* ============================================================ API */

function info_() {
  var list = readAll_(RSH_.KY_THI).filter(function (r) { return up_(r.TrangThai) !== 'DONG'; })
    .map(function (r) { return { ten: str_(r.TenKyThi), donVi: str_(r.DonVi), mo: up_(r.TrangThai) === 'MO', maPhong: !!str_(r.MaPhong) }; });
  // nhận diện CLB: lấy từ kỳ thi đang mở (hoặc kỳ thi đầu tiên chưa đóng / bất kỳ)
  var all = readAll_(RSH_.KY_THI), src = all.filter(function (r) { return up_(r.TrangThai) === 'MO'; })[0] || all.filter(function (r) { return up_(r.TrangThai) !== 'DONG'; })[0] || all[0];
  return { now: Date.now(), exams: list, v: PT_VERSION, brand: brand_(src) };
}
function brand_(r) {
  if (!r) return null;
  var logo = str_(r.ClbLogo).replace(/^~|~$/g, '');
  return { ten: str_(r.ClbTen), khau: str_(r.ClbKhau), mau: /^#[0-9a-fA-F]{6}$/.test(str_(r.ClbMau)) ? str_(r.ClbMau) : '', logo: /^data:image\//.test(logo) || /^https:\/\//.test(logo) ? logo : '' };
}

function login_(sbd, code, room, client) {
  sbd = up_(sbd).replace(/\s+/g, ''); code = up_(code).replace(/\s+/g, '');
  if (!sbd || !code) throw err_('INPUT', 'Nhập Số báo danh và Mã truy cập');
  var c = cache_(), failKey = 'fail|' + sbd, f = null;
  try { f = JSON.parse(c.get(failKey) || 'null'); } catch (e) { }
  f = f && typeof f === 'object' ? f : { n: 0, t: Date.now() };
  var openEx = {};
  readAll_(RSH_.KY_THI).forEach(function (r) { if (up_(r.TrangThai) !== 'DONG') openEx[str_(r.MaKyThi)] = true; });
  var mine = readAll_(RSH_.THI_SINH).filter(function (x) { return up_(x.SBD) === sbd && openEx[str_(x.MaKyThi)] && !isThu_(x); });   // tài khoản thi thử chỉ vào bằng link
  // Giám thị thao tác với thí sinh này (↺ Cho vào lại, ▶ Cho làm tiếp, ♻ Làm lại, gỡ đình chỉ, nhắn tin…) → bỏ khoá "nhập sai mã".
  // So sánh MỐC bằng giá trị (mốc làm lại + mã lệnh giám thị), không so giờ giữa 2 máy chủ → luôn chính xác.
  var resetAt = 0;
  mine.forEach(function (x) { var m = str_(x.GhiChu).match(/^RESET:(\d+)/); if (m) resetAt = Math.max(resetAt, Number(m[1])); });
  var mark = String(resetAt) + '|' + mine.map(function (x) { return str_(x.LenhId); }).sort().join(',');
  if (f.n && String(f.r == null ? '' : f.r) !== mark) { f = { n: 0, t: Date.now(), r: mark }; c.remove(failKey); }
  if (f.n >= 8) {
    if (mine[0]) log_(str_(mine[0].MaKyThi), sbd, 'DANG_NHAP_SAI', 'Bị chặn do nhập sai mã nhiều lần');
    throw err_('LOCKED', 'Nhập sai mã quá nhiều lần. Báo giám thị bấm ↺ Cho vào lại (giữ nguyên bài) để mở ngay, hoặc chờ 10 phút.');
  }
  var st = mine.filter(function (x) { return up_(x.MaTruyCap) === code; })[0];
  if (!st) {
    c.put(failKey, JSON.stringify({ n: f.n + 1, t: f.n ? f.t : Date.now(), r: mark }), 600);
    if (mine[0]) log_(str_(mine[0].MaKyThi), sbd, 'DANG_NHAP_SAI', 'Sai mã truy cập (nhập "' + code.substring(0, 12) + '") · lần ' + (f.n + 1) + '/8');
    throw err_('BAD_LOGIN', mine.length ? 'Mã truy cập không đúng. Nếu giám thị vừa cấp mã mới, hãy dùng mã mới (hỏi giám thị). Còn ' + Math.max(0, 7 - f.n) + ' lần thử.'
      : 'Không tìm thấy Số báo danh trong kỳ thi đang mở (kỳ thi có thể đã đóng — báo giám thị).');
  }
  var ky = str_(st.MaKyThi), ex = exam_(ky);
  if (up_(st.CamThi) === 'CO') { log_(ky, sbd, 'DANG_NHAP_SAI', 'Đang bị đình chỉ thi'); throw err_('BANNED', banMsg_(st)); }
  if (str_(ex.MaPhong) && up_(room).replace(/\s+/g, '') !== up_(ex.MaPhong)) { log_(ky, sbd, 'DANG_NHAP_SAI', 'Sai mã phòng'); throw err_('BAD_ROOM', 'Mã phòng thi không đúng (giám thị sẽ đọc mã phòng).'); }
  var ua = str_(client.ua).substring(0, 300);
  var isSeb = /SEB\//.test(ua) && (!str_(ex.KhoaUA) || ua.indexOf(str_(ex.KhoaUA)) >= 0);
  if (up_(ex.BatBuocSEB) === 'CO' && !isSeb) { log_(ky, sbd, 'DANG_NHAP_SAI', (/SEB\//.test(ua) ? 'SEB nhưng không mở từ file .seb của kỳ thi này' : 'Không dùng SEB') + ' · ' + ua.substring(0, 100)); throw err_('NEED_SEB', 'Kỳ thi này bắt buộc làm bài trong Safe Exam Browser, mở bằng file .seb MỚI NHẤT của kỳ thi do giám thị cung cấp.'); }
  // LỚP 4 — mã cấu hình SEB (Config Key do chính SEB tính từ file .seb): khác "máy chuẩn" ⇒ file .seb bị sửa / SEB cấu hình khác
  var ck = str_(client.ck).replace(/[^0-9a-fA-F]/g, '').substring(0, 128).toLowerCase(), chuan = str_(ex.SebKeyChuan).toLowerCase();
  if (up_(ex.BatBuocSEB) === 'CO' && chuan && ck !== chuan) {
    log_(ky, sbd, 'DANG_NHAP_SAI', 'Sai mã cấu hình SEB (' + (ck ? ck.substring(0, 8) : 'không có') + ' ≠ ' + chuan.substring(0, 8) + ')');
    throw err_('NEED_SEB', 'Cấu hình Safe Exam Browser của máy này KHÔNG khớp file .seb của kỳ thi (file đã bị sửa hoặc SEB quá cũ). Báo giám thị để mở bằng file .seb mới nhất.');
  }
  var tt = up_(st.TrangThai) || 'CHUA_VAO';
  if (tt === 'DA_NOP') { log_(ky, sbd, 'DANG_NHAP_SAI', 'Đã nộp bài trước đó'); throw err_('DONE', 'Bạn đã nộp bài lúc ' + Utilities.formatDate(new Date(num_(st.NopLuc)), 'Asia/Ho_Chi_Minh', 'HH:mm:ss') + '. Nếu cần sửa bài, giám thị bấm ▶ Cho làm tiếp (giữ bài) hoặc ♻ Làm lại từ đầu.'); }
  var patch = {};
  var pendingCmd = str_(st.LenhId) && str_(st.LenhId) !== str_(st.LenhDaXuLy) ? up_(st.Lenh) : '';
  var hadSession = !!str_(st.Token) && num_(st.BatDau) > 0;
  if (hadSession && up_(ex.DangNhapLai) === 'CAN_GIAM_THI' && str_(client.tok) !== str_(st.Token)) {
    if (pendingCmd !== 'CHO_VAO_LAI') {
      log_(ky, sbd, 'CHAN_VAO_LAI', ua.substring(0, 120));
      throw err_('NEED_PROCTOR', 'Bạn đã vào thi trước đó. Hãy báo giám thị bấm "Cho vào lại" rồi đăng nhập lại.');
    }
    patch.LenhDaXuLy = str_(st.LenhId);
  }
  c.remove(failKey);
  var tok = Utilities.getUuid();
  var n = num_(st.SoLanVao) + 1;
  patch.Token = tok; patch.SoLanVao = n; patch.TrinhDuyet = ua.substring(0, 180); patch.SEB = isSeb ? 'CO' : 'KHONG';
  patch.SebKey = ck; patch.SebVer = str_(client.sv).substring(0, 60);
  patch.LanCuoi = Date.now();
  if (tt === 'CHUA_VAO') patch.TrangThai = 'CHO';
  writeCols_(sheet_(RSH_.THI_SINH), st.__row, patch);
  log_(ky, sbd, n > 1 ? 'VAO_LAI' : 'VAO', 'pt v' + PT_VERSION + ' · ' + (isSeb ? 'SEB · ' : '') + ua.substring(0, 120) + (client.scr ? ' · ' + client.scr : ''));
  return payload_(st, ex, tok, isSeb);
}

function wait_(tok, ky, sbd) {
  var s = session_(tok, ky, sbd);
  writeCols_(s.sh, s.st.__row, { LanCuoi: Date.now() });
  if (s.thu) return { mo: true, dong: false, now: Date.now(), msg: '' };
  return { mo: up_(s.ex.TrangThai) === 'MO', dong: up_(s.ex.TrangThai) === 'DONG', now: Date.now(), msg: msgOf_(s.ex) };
}

/** Gói đề (đệm theo mảnh ≤ 30.000 ký tự / khoá) */
function pkg_(ky, md, ver) {
  var c = cache_(), base = 'pkg|' + ky + '|' + md + '|' + ver, n = c.get(base + '|n');
  if (n) {
    var keys = [];
    for (var i = 0; i < Number(n); i++) keys.push(base + '|' + i);
    var got = c.getAll(keys), parts = [], ok = true;
    keys.forEach(function (k) { if (got[k] === undefined || got[k] === null) ok = false; else parts.push(got[k]); });
    if (ok) return parts.join('');
  }
  var rows = readAll_(RSH_.GOI_DE).filter(function (r) { return str_(r.MaKyThi) === ky && str_(r.MaDe) === md && str_(r.PhienBan) === ver; })
    .sort(function (a, b) { return num_(a.Manh) - num_(b.Manh); });
  if (!rows.length) throw err_('NO_PKG', 'Chưa có đề cho mã đề ' + md + '. Báo giám thị.');
  var json = rows.map(function (r) { return String(r.DuLieu).replace(/^~/, ''); }).join('');   // '~' chống Sheets hiểu nhầm '=' đầu mảnh là công thức
  try {
    var put = {}, k = 0;
    for (var p = 0; p < json.length; p += 30000) put[base + '|' + (k++)] = json.substring(p, p + 30000);
    put[base + '|n'] = String(k);
    c.putAll(put, 21600);
  } catch (e) { }
  return json;
}

/** Bài làm đã lưu gần nhất (đệm; nếu mất đệm thì đọc sheet) */
function saved_(ky, sbd, since) {
  since = num_(since);
  var s = cache_().get('ans|' + ky + '|' + sbd);
  if (s) { var c = JSON.parse(s); if (num_(c.t) >= since) return c; }
  var best = null;
  readAll_(RSH_.BAI_LAM).forEach(function (r) {
    if (str_(r.MaKyThi) !== ky || up_(r.SBD) !== sbd || /^HUY_/.test(up_(r.Loai)) || num_(r.ThoiGian) < since) return;
    if (!best || num_(r.Seq) > best.seq || (num_(r.Seq) === best.seq && num_(r.ThoiGian) > best.t)) best = { seq: num_(r.Seq), t: num_(r.ThoiGian), raw: ansOf_(r) };
  });
  if (!best) return null;
  try { return { seq: best.seq, t: best.t, a: JSON.parse(best.raw || '{}') }; } catch (e) { return null; }
}

function start_(tok, ky, sbd) {
  var s = session_(tok, ky, sbd), ex = s.ex, st = s.st, now = Date.now();
  var tt = s.thu ? 'MO' : up_(ex.TrangThai);
  if (tt === 'CHUA_MO') throw err_('NOT_OPEN', 'Giám thị chưa mở đề.');
  if (up_(st.TrangThai) === 'DA_NOP') throw err_('DONE', 'Bạn đã nộp bài.');
  var patch = { LanCuoi: now }, fresh = false;
  if (!num_(st.BatDau)) {
    fresh = true;
    if (tt === 'DONG') throw err_('CLOSED', 'Kỳ thi đã kết thúc.');
    patch.BatDau = now; st.BatDau = now;
    if (!s.thu) log_(s.ky, s.sbd, 'BAT_DAU', 'Mã đề ' + str_(st.MaDe));
  }
  if (up_(st.TrangThai) !== 'KHOA') patch.TrangThai = 'DANG_LAM';
  writeCols_(s.sh, st.__row, patch);
  var dl = deadline_(ex, st);
  return {
    pkg: pkg_(s.ky, str_(st.MaDe), str_(ex.PhienBanGoi)), saved: saved_(s.ky, s.sbd, st.BatDau), now: now, deadline: dl, lt: ltState_(st),
    locked: up_(st.TrangThai) === 'KHOA', viPham: num_(st.ViPham) - num_(st.ViPhamMoc), viPhamToiDa: maxVp_(ex, st), nghiemNgat: strict_(ex, st), chongAI: ['BAO', 'KHOA', 'KHOA_HET'].indexOf(up_(ex.ChongAI)) >= 0 ? up_(ex.ChongAI) : 'KHOA',
    msg: s.thu ? '' : msgOf_(ex), timeUp: !!dl && now > dl && !num_(st.DungLuc), fresh: fresh, att: String(resetAt_(st)), paused: !!num_(st.DungLuc)
  };
}

function countEvents_(ev, inSeb) {
  var n = 0, sum = {};
  (ev || []).slice(0, 200).forEach(function (e) {
    var k = up_(e && e.k).replace(/[^A-Z_]/g, '').substring(0, 20);
    if (!k || k === 'TU_DONG') return;                         // dấu hiệu tác tử AI ghi riêng (botEv_)
    // Trong SEB không thể rời sang ứng dụng khác: mất focus / ẩn trang / thoát toàn màn hình đều do thao tác với thanh công cụ,
    // nút tải lại… của chính SEB → chỉ ghi nhận, KHÔNG tính vi phạm
    if (inSeb && PT_SERIOUS_.indexOf(k) >= 0) k = 'SEB_' + k;
    if (inSeb && k === 'SEB_ROI_CUA_SO') k = 'SEB_THANH_CC';
    sum[k] = sum[k] || { n: 0, s: 0 };
    sum[k].n++; sum[k].s += Math.max(0, Math.round(num_(e.d)));
    if (e.x && !sum[k].x) sum[k].x = str_(e.x).replace(/[\r\n]/g, ' ').substring(0, 120);
    if (PT_SERIOUS_.indexOf(k) >= 0) n++;
  });
  var text = Object.keys(sum).map(function (k) { return k + '×' + sum[k].n + (sum[k].s ? ' (' + sum[k].s + 's)' : '') + (sum[k].x ? ' [' + sum[k].x + ']' : ''); }).join(', ');
  return { serious: n, text: text, bot: sum.TU_DONG ? sum.TU_DONG.n : 0 };
}

/** Ghi dấu hiệu tác tử AI / phần mềm điều khiển: mỗi dấu hiệu 1 dòng nhật ký NGHI_AI (mức + lý do + bằng chứng), cộng dồn cột NghiTD, mức cao nhất NghiMuc */
var BOT_LV_ = ['', 'Nghi', 'Nghi cao', 'Chắc chắn'];
function botEv_(s, st, ev, patch) {
  var n = 0, top = num_(st.NghiMuc), why = [];
  (ev || []).slice(0, 100).forEach(function (e) {
    if (up_(e && e.k) !== 'TU_DONG') return;
    var lv = Math.max(1, Math.min(3, Math.round(num_(e.d)) || 1)), x = str_(e.x).replace(/[\r\n]+/g, ' ').substring(0, 300);
    n++; if (lv > top) top = lv;
    why.push(x || BOT_LV_[lv]);
    log_(s.ky, s.sbd, 'NGHI_AI', x || BOT_LV_[lv]);
  });
  if (!n) return 0;
  patch.NghiTD = num_(st.NghiTD) + n; patch.NghiMuc = top;
  patch.NghiLyDo = why.concat(str_(st.NghiLyDo) ? [str_(st.NghiLyDo)] : []).join(' ‖ ').substring(0, 900);
  return n;
}
function save_(tok, ky, sbd, p) {
  var s = session_(tok, ky, sbd), ex = s.ex, st = s.st, now = Date.now();
  var res = { ok: true, now: now, msg: s.thu ? '' : msgOf_(ex) };
  var tt = s.thu ? 'MO' : up_(ex.TrangThai);
  if (up_(st.TrangThai) === 'DA_NOP') { res.done = true; return res; }
  var dl = deadline_(ex, st);
  res.deadline = dl;
  var patch = { LanCuoi: now };
  var late = dl && now > dl + PT_GRACE_SAVE_ && !num_(st.DungLuc);
  if (p.a && typeof p.a === 'object' && !late && tt !== 'CHUA_MO') {
    var json = JSON.stringify(p.a);
    if (json.length > 90000) throw err_('BIG', 'Bài làm quá dài (code quá dài) — hãy rút gọn code');
    append_(RSH_.BAI_LAM, { ThoiGian: now, MaKyThi: s.ky, SBD: s.sbd, MaDe: str_(st.MaDe), Loai: 'LUU', Seq: num_(p.seq), SoCauDaLam: num_(p.n), TraLoi: json.substring(0, 45000), TraLoi2: json.length > 45000 ? '~' + json.substring(45000) + '~' : '' });
    try { cache_().put('ans|' + s.ky + '|' + s.sbd, JSON.stringify({ seq: num_(p.seq), t: now, a: p.a }), 21600); } catch (e) { }
    res.saved = num_(p.seq);
  }
  if (p.n !== undefined) patch.DaLam = num_(p.n);
  if (p.env && typeof p.env === 'object') patch.ManHinh = (p.env.fs ? 'TOAN' : 'THUONG') + (p.env.ext ? '|2MH' : '') + (p.env.foc === 0 ? '|ROI' : '');
  var evs = countEvents_(p.ev, up_(st.SEB) === 'CO');
  var vp = num_(st.ViPham) + evs.serious, moc = num_(st.ViPhamMoc);
  if (evs.serious) patch.ViPham = vp;
  botEv_(s, st, p.ev, patch);                                     // dấu hiệu bị phần mềm / tác tử AI điều khiển
  // máy thí sinh tự khoá (tạm dừng mà rời màn hình, chụp màn hình, phát hiện tác tử AI…) → khoá cả trên máy chủ: tải lại trang vẫn khoá
  if (p.lk && up_(st.TrangThai) !== 'KHOA' && !(str_(st.LenhId) && str_(st.LenhId) !== str_(st.LenhDaXuLy) && up_(st.Lenh) === 'MO_KHOA')) {
    patch.TrangThai = 'KHOA'; log_(s.ky, s.sbd, 'KHOA_BAI', str_(p.lk).substring(0, 200)); res.lockSaved = true;
  }
  if (evs.text) log_(s.ky, s.sbd, evs.serious ? 'VI_PHAM' : 'SU_KIEN', evs.text);
  // lệnh giám thị
  if (str_(st.LenhId) && str_(st.LenhId) !== str_(st.LenhDaXuLy)) {
    var cmd = up_(st.Lenh);
    patch.LenhDaXuLy = str_(st.LenhId);
    if (cmd === 'MO_KHOA') { moc = vp; patch.ViPhamMoc = vp; res.unlock = true; if (up_(st.TrangThai) === 'KHOA') patch.TrangThai = 'DANG_LAM'; }
    else if (cmd === 'THU_BAI') res.cmd = 'SUBMIT';
    else if (cmd === 'TIN') res.pmsg = str_(st.LenhGiaTri);
    if (cmd !== 'CHO_VAO_LAI') log_(s.ky, s.sbd, 'NHAN_LENH', cmd);
  }
  var max = maxVp_(ex, st);
  res.viPham = vp - moc;
  if (max > 0 && vp - moc >= max && !res.unlock) {
    if (up_(st.TrangThai) !== 'KHOA') { patch.TrangThai = 'KHOA'; log_(s.ky, s.sbd, 'KHOA_BAI', 'Vi phạm ' + (vp - moc) + '/' + max); }
    res.locked = true;
  }
  writeCols_(s.sh, st.__row, patch);
  res.paused = !!num_(st.DungLuc);
  if (tt === 'DONG') res.closed = true;
  if (dl && now > dl && !res.paused) res.timeUp = true;
  return res;
}

/** Giám thị gõ MÃ MỞ KHOÁ ngay tại máy thí sinh (chế độ nghiêm ngặt) */
function unlock_(tok, ky, sbd, code, p) {
  var s = session_(tok, ky, sbd), ex = s.ex, st = s.st, c = cache_(), k = 'unl|' + s.ky + '|' + s.sbd;
  if (up_(ex.NghiemNgat) !== 'CO' || !str_(ex.MaMoKhoa)) throw err_('INPUT', 'Kỳ thi không dùng mã mở khoá — chờ giám thị mở từ xa.');
  var n = num_(c.get(k));
  if (n >= 5) throw err_('LOCKED', 'Nhập sai mã mở khoá quá nhiều lần. Chờ giám thị mở từ máy giám thị.');
  if (up_(code).replace(/\s+/g, '') !== up_(ex.MaMoKhoa)) { c.put(k, String(n + 1), 600); log_(s.ky, s.sbd, 'MO_KHOA_SAI', 'Sai mã mở khoá lần ' + (n + 1)); throw err_('INPUT', 'Mã mở khoá không đúng.'); }
  c.remove(k);
  var evs = countEvents_(p.ev, up_(st.SEB) === 'CO'), vp = num_(st.ViPham) + evs.serious;
  if (evs.text) log_(s.ky, s.sbd, 'VI_PHAM', evs.text);
  var patch = { ViPham: vp, ViPhamMoc: vp, LanCuoi: Date.now() };
  botEv_(s, st, p.ev, patch);
  if (up_(st.TrangThai) === 'KHOA') patch.TrangThai = 'DANG_LAM';
  writeCols_(s.sh, st.__row, patch);
  log_(s.ky, s.sbd, 'MO_KHOA_TAI_CHO', 'Giám thị mở khoá tại máy (vi phạm ' + vp + ')');
  return { ok: true };
}

/** Bài làm JSON (ghép 2 ô nếu dài) */
function ansOf_(r) { var b = String(r.TraLoi2 == null ? '' : r.TraLoi2); return str_(r.TraLoi) + b.replace(/^~/, '').replace(/~$/, ''); }

/* ============================================================ LẬP TRÌNH (chạy thử / nộp code) */
function ltCfg_(ex) { try { return JSON.parse(str_(ex.LapTrinh) || 'null'); } catch (e) { return null; } }
function ltUn_(v) { var s = v === null || v === undefined ? '' : String(v); if (s.charAt(0) === '~') s = s.substring(1); if (s.charAt(s.length - 1) === '~') s = s.substring(0, s.length - 1); return s; }
function ltState_(st) { try { return JSON.parse(str_(st.LtDiem) || '{}') || {}; } catch (e) { return {}; } }
/** Bộ test của 1 bài (đệm 5 phút nếu nhỏ) */
function ltTests_(ky, ma) {
  var c = cache_(), key = 'ltt|' + ky + '|' + ma, s = c.get(key);
  if (s) return JSON.parse(s);
  var out = readAll_(RSH_.LT_TEST).filter(function (t) { return str_(t.MaKyThi) === ky && str_(t.MaBai) === ma; })
    .sort(function (a, b) { return num_(a.STT) - num_(b.STT); })
    .map(function (t) { return { in: ltUn_(t.Input), out: ltUn_(t.Output), mau: up_(t.Mau) === 'CO', w: str_(t.Diem) === '' ? 1 : num_(t.Diem) }; });
  var js = JSON.stringify(out);
  if (js.length < 90000) try { c.put(key, js, 300); } catch (e) { }
  return out;
}
/** Kiểm tra được chạy/nộp code: đang làm bài, không khoá/tạm dừng, còn giờ, không bấm quá nhanh, máy chấm không quá tải */
function ltGuard_(s, kind, gap) {
  var ex = s.ex, st = s.st, now = Date.now(), cfg = ltCfg_(ex);
  if (!cfg) throw err_('INPUT', 'Kỳ thi không có phần lập trình');
  if (up_(ex.TrangThai) !== 'MO' && !s.thu) throw err_('CLOSED', 'Phòng thi không mở — không chạy code được.');
  var tt = up_(st.TrangThai);
  if (tt === 'DA_NOP') throw err_('DONE', 'Bạn đã nộp bài.');
  if (tt === 'KHOA') throw err_('INPUT', 'Bài thi đang bị khoá.');
  if (num_(st.DungLuc)) throw err_('INPUT', 'Bài thi đang tạm dừng.');
  var dl = deadline_(ex, st);
  if (dl && now > dl) throw err_('TIME_UP', 'Đã hết giờ làm bài.');
  var c = cache_(), k = 'ltc|' + kind + '|' + s.ky + '|' + s.sbd, last = num_(c.get(k));
  if (last && now - last < gap * 1000) throw err_('WAIT', 'Chờ ' + Math.ceil((gap * 1000 - (now - last)) / 1000) + ' giây rồi ' + (kind === 'NOP' ? 'nộp' : 'chạy') + ' lại.');
  var busy = num_(c.get('ltbusy'));
  if (busy >= 14) throw err_('JUDGE_BUSY', 'Máy chấm đang bận — hệ thống tự thử lại sau vài giây.');
  c.put(k, String(now), Math.max(gap, 5) + 5);
  c.put('ltbusy', String(busy + 1), 60);
  return cfg;
}
function ltDone_() { try { var c = cache_(), b = num_(c.get('ltbusy')); c.put('ltbusy', String(Math.max(0, b - 1)), 60); } catch (e) { } }
function ltProb_(cfg, p) {
  var ma = str_(p.ma), pc = cfg.bai && cfg.bai[ma];
  if (!pc) throw err_('INPUT', 'Bài lập trình không có trong kỳ thi');
  if (p.lang !== 'c' && p.lang !== 'py') throw err_('INPUT', 'Ngôn ngữ không hợp lệ (chỉ Python hoặc C)');
  var lang = p.lang;
  if ((pc.nn || ['py', 'c']).indexOf(lang) < 0) throw err_('INPUT', 'Kỳ thi không cho dùng ngôn ngữ này cho bài ' + ma);
  var code = String(p.code == null ? '' : p.code);
  if (!code.trim()) throw err_('INPUT', 'Chưa có code');
  if (code.length > 30000) throw err_('INPUT', 'Code dài quá 30.000 ký tự');
  return { ma: ma, pc: pc, lang: lang, code: code };
}
function ltView_(x, t, show) {
  var o = { v: x.v, time: x.time, mem: x.mem };
  if (show) {
    o.inp = JD_cut(t.in, 4000); o.exp = t.out === undefined ? undefined : JD_cut(t.out, 4000); o.out = JD_cut(x.out, 4000); o.err = JD_cut(x.err, 4000);
    if (x.v === 'WA') o.diff = JD_firstDiff(t.out, x.out);
  }
  return o;
}
/** Chạy thử: test mẫu (+ input tự nhập). Không tính lượt, không tính điểm. */
function runCode_(tok, ky, sbd, p) {
  var s = session_(tok, ky, sbd), cfg = ltGuard_(s, 'CHAY', 0);
  try {
    if (cfg.chayThu === false) throw err_('INPUT', 'Kỳ thi này không cho chạy thử — chỉ được nộp.');
    var q = ltProb_(cfg, p), samples = ltTests_(s.ky, q.ma).filter(function (t) { return t.mau; });
    var gap = Math.max(2, num_(cfg.giayChay) || 5), c = cache_(), k = 'ltr|' + s.ky + '|' + s.sbd, last = num_(c.get(k)), now = Date.now();
    if (last && now - last < gap * 1000) throw err_('WAIT', 'Chờ ' + Math.ceil((gap * 1000 - (now - last)) / 1000) + ' giây rồi chạy lại.');
    c.put(k, String(now), gap + 5);
    var list = p.onlyCustom ? [] : samples.map(function (t) { return { in: t.in, out: t.out }; });
    var nS = list.length;
    if (p.custom !== undefined && p.custom !== null) list.push({ in: String(p.custom).substring(0, 20000) });
    if (!list.length) list.push({ in: '' });
    var r = JD_run(cfg.may, q.lang, q.code, list, q.pc);
    if (r.lib) { log_(s.ky, s.sbd, 'LT_THU_VIEN', q.ma + ' (chạy thử): ' + r.lib); return { lib: r.lib, ce: r.lib, results: [] }; }
    log_(s.ky, s.sbd, 'LT_CHAY', q.ma + ' ' + q.lang + ' · ' + r.results.map(function (x) { return x.v; }).join(','));
    return { ce: r.ce, rt: r.rt, results: r.results.map(function (x, i) { var o = ltView_(x, list[i], true); o.custom = i >= nS; return o; }) };
  } finally { ltDone_(); }
}
/** Nộp code: chấm trên MỌI test (ẩn chỉ trả về kết quả, không trả input/output). Tính lượt + điểm. */
function submitCode_(tok, ky, sbd, p) {
  var s = session_(tok, ky, sbd), cfg = ltGuard_(s, 'NOP', 8);
  try {
    var q = ltProb_(cfg, p), st = s.st, stt = ltState_(st), me = stt[q.ma] || { d: 0, n: 0 };
    var soLan = Math.max(1, num_(cfg.soLan) || 30);
    if (me.n >= soLan) throw err_('INPUT', 'Bạn đã dùng hết ' + soLan + ' lượt nộp cho bài này.');
    var tests = ltTests_(s.ky, q.ma);
    if (!tests.length) throw err_('INPUT', 'Bài chưa có test — báo giám thị');
    var r = JD_run(cfg.may, q.lang, q.code, tests.map(function (t) { return { in: t.in, out: t.out }; }), q.pc);
    // vi phạm quy định thư viện: báo ngay, KHÔNG tính lượt nộp
    if (r.lib) { log_(s.ky, s.sbd, 'LT_THU_VIEN', q.ma + ': ' + r.lib); return { lib: r.lib, ce: r.lib, results: [], n: me.n, left: soLan - me.n, best: num_(me.d), max: q.pc.diem }; }
    if (r.results.some(function (x) { return x.v === 'IE'; })) {
      log_(s.ky, s.sbd, 'LT_LOI_MAY_CHAM', q.ma + ': ' + (r.results.filter(function (x) { return x.v === 'IE'; })[0].err || '').substring(0, 200));
      throw err_(r.busy ? 'JUDGE_BUSY' : 'JUDGE', 'Máy chấm gặp sự cố — lượt này KHÔNG bị tính. Hãy nộp lại sau vài giây.');
    }
    var score = JD_score(r.results, tests.map(function (t) { return t.w; }), q.pc.diem, q.pc.cham), now = Date.now();
    var brief = r.results.map(function (x) { return [x.v, x.time == null ? '' : x.time, x.mem == null ? '' : x.mem]; });
    append_(RSH_.LT_NOP, { ThoiGian: now, MaKyThi: s.ky, SBD: s.sbd, MaBai: q.ma, NgonNgu: q.lang, Loai: 'NOP', Code: '~' + q.code + '~', KetQua: JSON.stringify(brief), Diem: score, DiemToiDa: q.pc.diem });
    if (score > num_(me.d) || !me.tb) me.tb = now;            // thời điểm đạt điểm cao nhất (bảng xếp hạng)
    me.n++; me.last = score; me.t = now; me.lang = q.lang;
    me.d = cfg.tinh === 'LAN_CUOI' ? score : Math.max(num_(me.d), score);
    stt[q.ma] = me;
    writeCols_(s.sh, st.__row, { LtDiem: JSON.stringify(stt), LanCuoi: now });
    log_(s.ky, s.sbd, 'LT_NOP', q.ma + ' ' + q.lang + ' · ' + score + '/' + q.pc.diem + ' · ' + r.results.filter(function (x) { return x.v === 'AC'; }).length + '/' + tests.length);
    return { score: score, max: q.pc.diem, best: me.d, n: me.n, left: soLan - me.n, ce: r.ce, rt: r.rt,
      results: r.results.map(function (x, i) { var o = ltView_(x, tests[i], tests[i].mau || s.thu); o.mau = tests[i].mau; o.an = s.thu && !tests[i].mau ? 1 : undefined; o.w = tests[i].w; return o; }) };   // thi thử: giám thị xem được cả test ẩn
  } finally { ltDone_(); }
}

function submit_(tok, ky, sbd, p) {
  var s = session_(tok, ky, sbd), ex = s.ex, st = s.st, now = Date.now();
  if (up_(st.TrangThai) === 'DA_NOP') {
    return { receipt: cache_().get('rc|' + s.ky + '|' + s.sbd) || '', at: num_(st.NopLuc), again: true, quit: str_(ex.ThoatURL) };
  }
  var dl = deadline_(ex, st);
  if (!s.thu && up_(ex.TrangThai) === 'DONG' && num_(ex.DongLuc) && now > num_(ex.DongLuc) + PT_GRACE_SUBMIT_) {
    throw err_('CLOSED', 'Kỳ thi đã đóng. Bài làm tự lưu gần nhất của bạn vẫn được tính.');
  }
  if (dl && now > dl + PT_GRACE_SUBMIT_) throw err_('TIME_UP', 'Đã quá giờ nộp. Bài làm tự lưu gần nhất của bạn vẫn được tính.');
  var a = p.a && typeof p.a === 'object' ? p.a : (saved_(s.ky, s.sbd, st.BatDau) || {}).a || {};
  var json = JSON.stringify(a), rc = receipt_(s.sbd + '|' + json);
  var loai = dl && now > dl + PT_LATE_MS_ ? 'NOP_TRE' : 'NOP';
  if (json.length > 90000) throw err_('BIG', 'Bài làm quá dài (code quá dài) — hãy rút gọn code');
  append_(RSH_.BAI_LAM, { ThoiGian: now, MaKyThi: s.ky, SBD: s.sbd, MaDe: str_(st.MaDe), Loai: loai, Seq: num_(p.seq), SoCauDaLam: num_(p.n), TraLoi: json.substring(0, 45000), TraLoi2: json.length > 45000 ? '~' + json.substring(45000) + '~' : '', MaXacNhan: rc });
  var evs = countEvents_(p.ev, up_(st.SEB) === 'CO');
  var patch = { TrangThai: 'DA_NOP', NopLuc: now, LanCuoi: now, DaLam: num_(p.n) };
  botEv_(s, st, p.ev, patch);
  if (evs.serious) patch.ViPham = num_(st.ViPham) + evs.serious;
  writeCols_(s.sh, st.__row, patch);
  if (evs.text) log_(s.ky, s.sbd, evs.serious ? 'VI_PHAM' : 'SU_KIEN', evs.text);
  log_(s.ky, s.sbd, p.auto ? 'TU_NOP' : 'NOP', 'MXN ' + rc + ' · ' + num_(p.n) + ' câu' + (loai === 'NOP_TRE' ? ' · trễ' : ''));
  try { cache_().putAll({ ['ans|' + s.ky + '|' + s.sbd]: JSON.stringify({ seq: num_(p.seq), t: now, a: a }), ['rc|' + s.ky + '|' + s.sbd]: rc }, 21600); } catch (e) { }
  return { receipt: rc, at: now, quit: s.thu ? '' : str_(ex.ThoatURL), late: loai === 'NOP_TRE', thu: s.thu || undefined };
}

/* ============================================================ THI THỬ CỦA GIÁM THỊ */

/** Mở link thi thử (?thu=<khoá>) — khoá 32 ký tự ngẫu nhiên do trang quản trị tạo, hạn 12 giờ */
function thuLogin_(key, client) {
  key = str_(key).replace(/[^0-9a-zA-Z]/g, '');
  var c = cache_(), fk = 'thufail', nf = num_(c.get(fk));
  if (nf >= 30) throw err_('LOCKED', 'Thử link sai quá nhiều lần. Chờ 10 phút.');
  var st = key.length >= 24 ? readAll_(RSH_.THI_SINH).filter(function (x) { return isThu_(x) && str_(x.MaTruyCap) === key; })[0] : null;
  if (!st) { c.put(fk, String(nf + 1), 600); throw err_('THU_SAI', 'Link thi thử không đúng hoặc đã được thay bằng link mới. Tạo lại ở trang quản trị › ⑤ › Thi thử.'); }
  if (thuInfo_(st).exp < Date.now()) throw err_('THU_HET', 'Link thi thử đã hết hạn (12 giờ). Tạo link mới ở trang quản trị › ⑤ › Thi thử.');
  var ky = str_(st.MaKyThi), ex = exam_(ky), tok = Utilities.getUuid(), ua = str_(client.ua).substring(0, 300);
  var patch = { Token: tok, SoLanVao: num_(st.SoLanVao) + 1, TrinhDuyet: ua.substring(0, 180), SEB: /SEB\//.test(ua) ? 'CO' : 'KHONG', LanCuoi: Date.now() };
  if (!up_(st.TrangThai) || up_(st.TrangThai) === 'CHUA_VAO') patch.TrangThai = 'CHO';
  writeCols_(sheet_(RSH_.THI_SINH), st.__row, patch);
  var pl = payload_(st, ex, tok, patch.SEB === 'CO');
  pl.exam.mo = true; pl.thu.done = up_(st.TrangThai) === 'DA_NOP';
  return pl;
}

/** Thanh công cụ thi thử: làm lại · đổi mã đề · mở khoá */
function thuCtl_(tok, ky, sbd, act, arg) {
  var s = session_(tok, ky, sbd);
  if (!s.thu) throw err_('BAD', 'Chỉ dùng được khi thi thử');
  var st = s.st, info = thuInfo_(st), patch = { LanCuoi: Date.now() };
  act = str_(act);
  if (act === 'unlock') {
    patch.ViPhamMoc = num_(st.ViPham); patch.LenhDaXuLy = str_(st.LenhId);
    if (up_(st.TrangThai) === 'KHOA') patch.TrangThai = 'DANG_LAM';
    writeCols_(s.sh, st.__row, patch);
    return { ok: true };
  }
  if (act === 'de') {
    var md = str_(arg);
    if (info.des.indexOf(md) < 0) throw err_('INPUT', 'Mã đề ' + md + ' không có trong đề đã phát');
    pkg_(s.ky, md, str_(s.ex.PhienBanGoi));                     // kiểm tra có gói đề
    patch.MaDe = md;
  } else if (act !== 'reset') throw err_('BAD', 'Thao tác không hợp lệ');
  // làm lại từ đầu: bài cũ bị bỏ qua vì chỉ lấy bản lưu sau mốc bắt đầu mới
  ['BatDau', 'NopLuc', 'DaLam', 'ViPham', 'ViPhamMoc', 'LtDiem', 'NghiTD', 'NghiMuc', 'NghiLyDo', 'DungLuc', 'DungMs', 'ThemPhut', 'VuotHen', 'ManHinh'].forEach(function (k) { patch[k] = ''; });
  patch.TrangThai = 'CHO';
  writeCols_(s.sh, st.__row, patch);
  try { cache_().removeAll(['ans|' + s.ky + '|' + s.sbd, 'rc|' + s.ky + '|' + s.sbd]); } catch (e) { }
  return { ok: true, maDe: patch.MaDe || str_(st.MaDe) };
}

/** Thí sinh gửi câu hỏi cho giám thị (trong trang thi — không phải rời màn hình) */
function ask_(tok, ky, sbd, text) {
  var s = session_(tok, ky, sbd);
  text = str_(text).replace(/\s+/g, ' ').substring(0, 300);
  if (!text) throw err_('INPUT', 'Nhập nội dung câu hỏi');
  var c = cache_(), k = 'ask|' + s.ky + '|' + s.sbd, n = num_(c.get(k));
  if (n >= 10) throw err_('LIMIT', 'Bạn đã gửi nhiều câu hỏi. Hãy giơ tay báo giám thị.');
  c.put(k, String(n + 1), 1800);
  log_(s.ky, s.sbd, 'HOI', text);
  return { ok: true, now: Date.now() };
}

/** sebs://…/exec?seb=MA_KY_THI → SEB tải cấu hình trực tiếp */
function sebFile_(ky) {
  var r = readAll_(RSH_.KY_THI).filter(function (x) { return str_(x.MaKyThi) === ky; })[0];
  // file .seb dài (>50.000 ký tự/ô) được chia ra nhiều ô, mỗi mảnh có tiền tố '~'
  var xml = r ? ['SebXml', 'SebXml2', 'SebXml3', 'SebXml4'].map(function (k) { return String(r[k] == null ? '' : r[k]).replace(/^~|~$/g, ''); }).join('') : '';
  if (!xml) return ContentService.createTextOutput('Chưa có cấu hình SEB cho kỳ thi này').setMimeType(ContentService.MimeType.TEXT);
  return ContentService.createTextOutput(xml).setMimeType(ContentService.MimeType.XML);
}

/* ============================================================ XUẤT CHO BỘ KHỞI ĐỘNG */
return { doGet: doGet, PT_api: PT_api, version: PT_VERSION };
