/**
 * 50_PhongThi.gs — PHÒNG THI WEB: phía quản trị (chạy trong file Trung tâm)
 *
 * Kiến trúc an toàn:
 *  - Thí sinh làm bài trên một DỰ ÁN APPS SCRIPT RIÊNG ("Phòng thi", gắn với file PhongThi_DuLieu, triển khai
 *    Web App "Bất kỳ ai"). Dự án đó KHÔNG có ngân hàng câu hỏi và KHÔNG có đáp án → dù ai đó tìm cách gọi trực tiếp
 *    hàm máy chủ cũng không lấy được đáp án.
 *  - Hệ thống trung tâm "phát đề" = ghi gói đề (không đáp án) + danh sách thí sinh + mã truy cập vào PhongThi_DuLieu,
 *    rồi "thu bài" = đọc bài làm từ đó và chấm bằng bộ chấm hiện có.
 */

var PTA_PROP_ROOM = 'ROOM_SS_ID';
var PTA_SRC_SHEET = 'MaNguon';
var PTA_WEB_PREFIX = 'WEB-';
var PTA_PAPER_PREFIX = 'GIAY-';

/* ------------------------------------------------------------------ file dữ liệu phòng thi */

function PTA_roomId() { return S_props().getProperty(PTA_PROP_ROOM) || ''; }

function PTA_room(create) {
  var id = PTA_roomId();
  if (id) { try { return S_open(id); } catch (e) { if (!create) throw new Error('Không mở được file PhongThi_DuLieu (đã xoá?). Bấm "Tạo / kiểm tra file dữ liệu phòng thi".'); } }
  if (!create) throw new Error('Chưa tạo file dữ liệu phòng thi. Vào tab ⑤ Phòng thi web › bấm "Tạo / kiểm tra file dữ liệu phòng thi".');
  var ss = SpreadsheetApp.create('PhongThi_DuLieu — dữ liệu phòng thi web');
  try { DriveApp.getFileById(ss.getId()).moveTo(S_rootFolder()); } catch (e) { }
  S_props().setProperty(PTA_PROP_ROOM, ss.getId());
  _SS_CACHE[ss.getId()] = ss;
  return ss;
}

/** Tạo/sửa cấu trúc file phòng thi. Định dạng văn bản thuần để SBD "001" không bị đổi thành số 1. */
function PTA_setupRoom() {
  var ss = PTA_room(true);
  var big = {}; big[RSH.BAI_LAM] = 20000; big[RSH.NHAT_KY] = 20000; big[RSH.THI_SINH] = 2000; big[RSH.GOI_DE] = 2000;
  [RSH.KY_THI, RSH.THI_SINH, RSH.GOI_DE, RSH.BAI_LAM, RSH.NHAT_KY].forEach(function (name) {
    var sh = ss.getSheetByName(name) || ss.insertSheet(name);
    var want = big[name] || 200;
    if (sh.getMaxRows() < want) sh.insertRowsAfter(sh.getMaxRows(), want - sh.getMaxRows());
    S_ensureSheet(ss, name, RHEADERS[name], { text: true, color: '#0f4c5c' });
  });
  var g = ss.getSheetByName(RSH.HUONG_DAN) || ss.insertSheet(RSH.HUONG_DAN);
  g.clear();
  var lines = [
    ['FILE DỮ LIỆU PHÒNG THI WEB — đừng sửa tay khi đang thi'],
    ['• Hệ thống Trung tâm ghi vào: KyThi, ThiSinh (cột nhận dạng + cột giám thị), GoiDe (đề KHÔNG có đáp án).'],
    ['• Dự án "Phòng thi" ghi vào: ThiSinh (cột trạng thái), BaiLam (tự lưu & nộp bài), NhatKy (đăng nhập, rời màn hình…).'],
    ['CÀI ĐẶT DỰ ÁN PHÒNG THI (làm 1 lần — mọi lần nâng cấp sau Trung tâm TỰ ĐẨY mã sang sheet MaNguon):'],
    ['1. Mở file này › Tiện ích mở rộng › Apps Script. Xoá nội dung Code.gs, dán BỘ KHỞI ĐỘNG (Trung tâm › tab ⑤ › mục A › Sao chép mã khởi động). Lưu.'],
    ['2. Lần đầu: Triển khai › Tùy chọn triển khai mới › Ứng dụng web › Thực thi: TÔI › Truy cập: BẤT KỲ AI. Đã có triển khai: Quản lý triển khai › ✎ › Phiên bản MỚI.'],
    ['3. Sao chép URL Web App (…/exec) dán vào tab ⑤ › mục A, bấm "Kiểm tra kết nối phòng thi" → phải hiện ✔.'],
    ['4. Sheet MaNguon do Trung tâm ghi — KHÔNG sửa tay.']
  ];
  g.getRange(1, 1, lines.length, 1).setValues(lines);
  g.getRange(1, 1).setFontWeight('bold').setFontSize(13);
  g.getRange(4, 1).setFontWeight('bold');
  g.setColumnWidth(1, 900);
  var s1 = ss.getSheetByName('Sheet1') || ss.getSheetByName('Trang tính1');
  if (s1 && ss.getSheets().length > 1) { try { ss.deleteSheet(s1); } catch (e) { } }
  PTA_pushCode(ss, true);
  S_log('PHONG_THI_KHOI_TAO', ss.getId());
  return { id: ss.getId(), url: ss.getUrl() };
}

/**
 * ĐẨY MÃ PHÒNG THI: ghi mã lõi + giao diện thí sinh (ROOM_BUNDLE) vào sheet MaNguon của file phòng thi.
 * Bộ khởi động nạp mã từ đây (≤ 20 giây sau khi đẩy) → không cần dán mã / triển khai lại dự án Phòng thi.
 * Mỗi mảnh có tiền tố "~" để Google Sheets không hiểu nhầm thành công thức.
 */
function PTA_pushCode(room, force) {
  room = room || PTA_room(false);
  var b = ROOM_BUNDLE;
  var sh = room.getSheetByName(PTA_SRC_SHEET) || room.insertSheet(PTA_SRC_SHEET);
  if (!force && sh.getLastRow() >= 3) {
    var cur = sh.getRange(2, 1, 1, 6).getValues()[0];
    if (U_str(cur[0]) === 'VER' && U_str(cur[2]) === b.hash) return { pushed: false, version: b.version, hash: b.hash };
  }
  var rows = [];
  PK_chunks(b.code, 40000).forEach(function (c, i) { rows.push(['CODE', b.version, b.hash, String(i), '~' + c, '']); });
  PK_chunks(b.html, 40000).forEach(function (c, i) { rows.push(['HTML', b.version, b.hash, String(i), '~' + c, '']); });
  var need = rows.length + 2;
  if (sh.getMaxRows() < need) sh.insertRowsAfter(sh.getMaxRows(), need - sh.getMaxRows());
  sh.getRange(1, 1, sh.getMaxRows(), 6).setNumberFormat('@');
  sh.getRange(1, 1, 1, 6).setValues([['Loai', 'PhienBan', 'MaBam', 'Manh', 'DuLieu', 'ChieuDai']]);
  sh.getRange(3, 1, rows.length, 6).setValues(rows);
  var last = sh.getLastRow();
  if (last > need) sh.getRange(need + 1, 1, last - need, 6).clearContent();
  // dòng VER ghi SAU CÙNG: máy chủ phòng thi chỉ chuyển sang mã mới khi mọi mảnh đã sẵn sàng
  sh.getRange(2, 1, 1, 6).setValues([['VER', b.version, b.hash, '', '', b.code.length + '/' + b.html.length]]);
  FX_try(function () { sh.getRange(1, 1, 1, 6).setFontWeight('bold'); sh.setColumnWidth(5, 300); });
  try { CacheService.getScriptCache().remove('ptping|' + PTA_webUrl()); } catch (e) { }
  S_log('PHONG_THI_DAY_MA', b.version + ' ' + b.hash);
  return { pushed: true, version: b.version, hash: b.hash };
}

/** Gọi thử link phòng thi (?ping=1): bộ khởi động đã triển khai đúng chưa, đang chạy mã lõi nào */
function PTA_ping(force) {
  var url = PTA_webUrl(), b = ROOM_BUNDLE;
  var base = { expectedBoot: b.bootVersion, expectedCore: b.version, expectedHash: b.hash };
  if (!url) { base.ok = false; base.error = 'Chưa nhập link Web App phòng thi (mục A)'; return base; }
  var c = CacheService.getScriptCache(), k = 'ptping|' + url;
  if (!force) { var s = c.get(k); if (s) return JSON.parse(s); }
  var out = base;
  try {
    var res = UrlFetchApp.fetch(url + '?ping=1&t=' + Date.now(), { muteHttpExceptions: true, followRedirects: true });
    var code = res.getResponseCode(), txt = U_str(res.getContentText ? res.getContentText() : '');
    var j = null;
    try { j = JSON.parse(txt); } catch (e) { }
    if (j && j.boot) { out.ok = true; out.boot = U_str(j.boot); out.core = U_str(j.core); out.hash = U_str(j.hash); out.url = U_str(j.url); out.coreError = U_str(j.coreError); }
    else {
      out.ok = false; out.http = code;
      out.error = code === 200 && !/accounts\.google|ServiceLogin|signin/i.test(txt)
        ? 'Link phòng thi đang chạy MÃ CŨ: chưa dán Bộ khởi động mới, hoặc dán rồi nhưng chưa "Quản lý triển khai › ✎ › Phiên bản MỚI › Triển khai".'
        : (/accounts\.google|ServiceLogin|signin/i.test(txt) || code === 401 || code === 403 ? 'Phòng thi đang yêu cầu đăng nhập Google — sửa triển khai: Người có quyền truy cập = "Bất kỳ ai".' : 'Không mở được link phòng thi (HTTP ' + code + ').');
    }
  } catch (e) { out.ok = false; out.error = 'Không gọi được link phòng thi: ' + e.message; }
  // v2 vẫn chạy được mọi thứ trừ chấm code (thiếu quyền gửi yêu cầu ra ngoài) → chỉ bắt buộc v3 khi kỳ thi có bài lập trình
  out.bootOk = !!out.ok && Number(out.boot) >= 2;
  out.bootLt = !!out.ok && Number(out.boot) >= 3;
  out.bootLatest = !!out.ok && out.boot === b.bootVersion;
  out.coreOk = !!out.ok && out.hash === b.hash;
  if (out.ok && !out.bootOk) out.error = 'Bộ khởi động trên phòng thi là v' + out.boot + ', cần v' + b.bootVersion + ' → dán Bộ khởi động mới + triển khai Phiên bản mới.';
  if (out.bootOk && !out.bootLatest) out.hint = 'Bộ khởi động v' + out.boot + ' dùng tốt cho thi trắc nghiệm. Thi LẬP TRÌNH cần v' + b.bootVersion + ': sao chép Bộ khởi động mới (bước 2), dán đè, chạy hàm doGet 1 lần để cấp quyền, rồi Quản lý triển khai › ✎ › Phiên bản mới.';
  try { c.put(k, JSON.stringify(out), out.bootOk && out.coreOk ? 120 : 10); } catch (e) { }
  return out;
}

/** Mã nguồn bộ khởi động (để sao chép dán vào dự án Phòng thi) */
function PTA_bootSource() { return { code: ROOM_BUNDLE.boot, version: ROOM_BUNDLE.bootVersion, core: ROOM_BUNDLE.version }; }

/** Bổ sung cột mới (VD: CamThi) vào file phòng thi đã tạo từ bản cũ */
/** Báo máy thí sinh có lệnh mới (cột TinHieu của dòng kỳ thi; gộp với tín hiệu trong 90 giây gần nhất để không ai bị lỡ) */
function PTA_signal(maKyThi, sbds) {
  try {
    var room = PTA_room(false), sh = room.getSheetByName(RSH.KY_THI), head = S_headers(sh);
    if (head.indexOf('TinHieu') < 0) { PTA_ensureCols(room); head = S_headers(sh); }
    var r = PTA_examRow(room, maKyThi); if (!r) return;
    var old = U_str(r.TinHieu), i = old.indexOf('|'), ts = Number(old.substring(0, i)) || 0, who = i > 0 ? old.substring(i + 1) : '';
    var now = Date.now(), add = sbds && sbds.length ? sbds.map(function (x) { return U_upper(x); }) : ['*'];
    var set = {};
    if (now - ts < 90000 && who) who.split(',').forEach(function (x) { if (x) set[x] = 1; });
    add.forEach(function (x) { set[x] = 1; });
    var list = set['*'] ? '*' : Object.keys(set).join(',');
    if (list.length > 40000) list = '*';
    PTA_writeCols(sh, head, r.__row, { TinHieu: now + '|' + list });
  } catch (e) { }
}
function PTA_ensureCols(room) {
  S_ensureSheet(room, RSH.THI_SINH, RHEADERS[RSH.THI_SINH], { text: true, color: '#0f4c5c' });
  S_ensureSheet(room, RSH.KY_THI, RHEADERS[RSH.KY_THI], { text: true, color: '#0f4c5c' });
  S_ensureSheet(room, RSH.BAI_LAM, RHEADERS[RSH.BAI_LAM], { text: true, color: '#0f4c5c' });
  [RSH.LT_TEST, RSH.LT_NOP].forEach(function (n) { if (!room.getSheetByName(n)) S_ensureSheet(room, n, RHEADERS[n], { text: true, color: '#3b2a6b' }); });
}

/** Đọc N dòng cuối của một sheet (nhật ký dài vẫn nhanh) */
function PTA_tail(ss, name, n) {
  var sh = ss.getSheetByName(name);
  if (!sh) return [];
  var last = sh.getLastRow();
  if (last < 2) return [];
  var head = S_headers(sh), start = Math.max(2, last - n + 1);
  return sh.getRange(start, 1, last - start + 1, head.length).getValues().map(function (r, i) {
    var o = { __row: start + i };
    head.forEach(function (h, j) { if (h) o[h] = r[j]; });
    return o;
  }).filter(function (o) { return U_str(o[head[0]]) !== ''; });
}

function PTA_webUrl() { return U_str(Repo_config().PHONG_THI_URL); }

function PTA_setUrl(url) {
  url = U_str(url);
  if (url && !/^https:\/\/script\.google\.com\/(a\/[^\/]+\/)?macros\/s\/[-\w]+\/exec$/.test(url)) {
    throw new Error('Link phải có dạng https://script.google.com/macros/s/…/exec (Triển khai › Quản lý triển khai › sao chép URL Ứng dụng web)');
  }
  S_upsert(S_hub(), SH.CAU_HINH, function (o) { return U_str(o.Khoa); }, { Khoa: 'PHONG_THI_URL', GiaTri: url,
    MoTa: 'Link Web App của dự án Phòng thi' });
  Repo_clearCache();
  return { url: url };
}

/** NHẬN DIỆN CLB trên trang thi: tên, khẩu hiệu, màu, logo (data URI ≤ 45.000 ký tự). Lưu ở Cấu hình + đẩy ngay lên mọi kỳ thi trên phòng thi */
function PTA_brand(o) {
  if (o) {
    var mau = U_str(o.mau); if (mau && !/^#[0-9a-fA-F]{6}$/.test(mau)) throw new Error('Màu dạng #RRGGBB');
    var logo = U_str(o.logo);
    if (logo && !/^data:image\/(png|jpeg|webp|svg\+xml);base64,/.test(logo) && !/^https:\/\//.test(logo)) throw new Error('Logo không hợp lệ');
    if (logo.length > 45000) throw new Error('Logo quá lớn (' + Math.round(logo.length / 1000) + ' KB) — chọn ảnh nhỏ hơn');
    var kv = { CLB_TEN: U_str(o.ten).substring(0, 80), CLB_KHAU: U_str(o.khau).substring(0, 120), CLB_MAU: '#14237A', CLB_LOGO: logo };
    Object.keys(kv).forEach(function (k) { S_upsert(S_hub(), SH.CAU_HINH, function (x) { return U_str(x.Khoa); }, { Khoa: k, GiaTri: kv[k], MoTa: 'Nhận diện trang thi' }); });
    Repo_clearCache();
    try {
      var room = PTA_room(false);
      S_ensureSheet(room, RSH.KY_THI, RHEADERS[RSH.KY_THI], { text: true, color: '#0f4c5c' });
      S_update(room, RSH.KY_THI, function () { return true; }, PTA_brandCols());
    } catch (e) { }
    S_log('PHONG_THI_NHAN_DIEN', kv.CLB_TEN);
  }
  var c = Repo_config();
  return { ten: U_str(c.CLB_TEN), khau: U_str(c.CLB_KHAU), mau: '#14237A', logo: U_str(c.CLB_LOGO) };
}
function PTA_brandCols() {
  var c = Repo_config(), logo = U_str(c.CLB_LOGO);
  return { ClbTen: U_str(c.CLB_TEN), ClbKhau: U_str(c.CLB_KHAU), ClbMau: U_str(c.CLB_MAU), ClbLogo: logo ? '~' + logo + '~' : '', CapNhat: String(Date.now()) };
}

function PTA_examRow(room, maKyThi) {
  return S_read(room, RSH.KY_THI).filter(function (r) { return U_str(r.MaKyThi) === U_str(maKyThi); })[0] || null;
}

/** Thí sinh trên phòng thi (mặc định BỎ tài khoản thi thử của giám thị — không lẫn vào giám sát, kết quả, lệnh cả phòng) */
function PTA_students(room, maKyThi, withThu) {
  return S_read(room, RSH.THI_SINH).filter(function (r) { return U_str(r.MaKyThi) === U_str(maKyThi) && (withThu || !PTA_isThu(r)); });
}

/* ------------------------------------------------------------------ THI THỬ CỦA GIÁM THỊ */
var PTA_THU_SBD = 'GV-THU', PTA_THU_HOURS = 12;
function PTA_isThu(r) { return !!r && U_upper(r.SBD) === PTA_THU_SBD && /^THU\|/.test(U_str(r.GhiChu)); }

/**
 * Tạo link thi thử: 1 tài khoản ảo "GV-THU" (mỗi kỳ thi 1 tài khoản), khoá bí mật 32 ký tự trong link, hạn 12 giờ.
 * Tạo link mới = bài thử làm lại từ đầu, link cũ hết hiệu lực. o = {maDe, guard}
 */
function PTA_preview(maKyThi, o) {
  o = o || {};
  return S_withLock(function () {
    var room = PTA_room(false), r = room && PTA_examRow(room, maKyThi);
    if (!r) throw new Error('Kỳ thi chưa được phát lên phòng thi — bấm "📤 Phát đề lên phòng thi" (mục B) trước.');
    var url = PTA_webUrl();
    if (!url) throw new Error('Chưa có link phòng thi web (mục A).');
    PTA_ensureCols(room);
    var ver = U_str(r.PhienBanGoi), des = {};
    S_read(room, RSH.GOI_DE).forEach(function (x) { if (U_str(x.MaKyThi) === maKyThi && U_str(x.PhienBan) === ver) des[U_str(x.MaDe)] = true; });
    var codes = Object.keys(des).sort();
    if (!codes.length) throw new Error('Chưa có gói đề trên phòng thi — phát đề lại.');
    var md = codes.indexOf(U_str(o.maDe)) >= 0 ? U_str(o.maDe) : codes[0];
    var all = PTA_students(room, maKyThi, true);
    if (all.some(function (s) { return U_upper(s.SBD) === PTA_THU_SBD && !PTA_isThu(s); })) throw new Error('Đã có thí sinh thật mang SBD ' + PTA_THU_SBD + ' — đổi SBD đó để dùng thi thử.');
    var key = (Utilities.getUuid() + Utilities.getUuid()).replace(/-/g, '').substring(0, 32), exp = Date.now() + PTA_THU_HOURS * 3600000;
    var row = { MaKyThi: maKyThi, SBD: PTA_THU_SBD, HoTen: 'Giám thị (thi thử)', Lop: '', MaDe: md, MaTruyCap: key,
      GhiChu: 'THU|' + exp + '|' + (o.guard ? '1' : '0') + '|' + codes.join(','), TrangThai: R_TT.CHUA_VAO };
    R_ST_ROOM.concat(R_ST_ADMIN).forEach(function (k) { if (row[k] === undefined) row[k] = ''; });
    var old = all.filter(PTA_isThu)[0];
    if (old) { var sh = room.getSheetByName(RSH.THI_SINH); PTA_writeCols(sh, S_headers(sh), old.__row, row); }
    else S_append(room, RSH.THI_SINH, [row]);
    S_log('THI_THU', maKyThi + ': giám thị tạo link thi thử mã đề ' + md + (o.guard ? ' (bật chống gian lận)' : ''));
    return { url: url + (url.indexOf('?') >= 0 ? '&' : '?') + 'thu=' + key, maDe: md, codes: codes, exp: exp, guard: !!o.guard, mo: U_upper(r.TrangThai) };
  });
}
/** Huỷ link thi thử (xoá tài khoản ảo) */
function PTA_previewEnd(maKyThi) {
  return S_withLock(function () {
    var room = PTA_room(false); if (!room) return { n: 0 };
    var n = PTA_students(room, maKyThi, true).filter(PTA_isThu).length;
    if (n) S_replaceWhere(room, RSH.THI_SINH, function (x) { return U_str(x.MaKyThi) === maKyThi && PTA_isThu(x); }, []);
    return { n: n };
  });
}
/** Trạng thái + chấm bài thử bằng đúng bộ chấm thật */
function PTA_previewPeek(maKyThi) {
  var room = PTA_room(false), st = room ? PTA_students(room, maKyThi, true).filter(PTA_isThu)[0] : null;
  if (!st) return { none: true };
  var p = U_str(st.GhiChu).split('|'), out = PTA_peek(maKyThi, PTA_THU_SBD);
  out.exp = U_num(p[1], 0); out.guard = p[2] === '1'; out.codes = (p[3] || '').split(',').filter(String);
  out.batDau = U_num(st.BatDau, 0); out.nopLuc = U_num(st.NopLuc, 0); out.viPham = U_num(st.ViPham, 0); out.nghiMuc = U_num(st.NghiMuc, 0); out.nghiLyDo = U_str(st.NghiLyDo);
  return out;
}

/* ------------------------------------------------------------------ trạng thái cho bảng điều khiển */

function PTA_state(maKyThi) {
  var out = { roomReady: false, webUrl: PTA_webUrl(), exam: null };
  var id = PTA_roomId();
  if (!id) return out;
  var room;
  try { room = PTA_room(false); } catch (e) { out.error = e.message; return out; }
  out.roomReady = !!room.getSheetByName(RSH.THI_SINH);
  out.roomUrl = room.getUrl();
  out.bundle = { version: ROOM_BUNDLE.version, hash: ROOM_BUNDLE.hash, boot: ROOM_BUNDLE.bootVersion };
  var src = room.getSheetByName(PTA_SRC_SHEET);
  if (src && src.getLastRow() >= 2) { var v = src.getRange(2, 1, 1, 6).getValues()[0]; out.pushed = { version: U_str(v[1]), hash: U_str(v[2]) }; }
  if (out.webUrl) out.ping = PTA_ping(false);
  if (!maKyThi || !out.roomReady) return out;
  var r = PTA_examRow(room, maKyThi);
  if (r) {
    out.exam = PTA_examView(r);
    out.nStudents = PTA_students(room, maKyThi).length;
    out.nPkg = S_read(room, RSH.GOI_DE).filter(function (x) { return U_str(x.MaKyThi) === maKyThi && U_str(x.PhienBan) === U_str(r.PhienBanGoi); })
      .map(function (x) { return U_str(x.MaDe); }).filter(function (x, i, a) { return a.indexOf(x) === i; }).length;
  }
  return out;
}

function PTA_examView(r) {
  return {
    maKyThi: U_str(r.MaKyThi), ten: U_str(r.TenKyThi), trangThai: U_str(r.TrangThai) || 'CHUA_MO', thoiGian: U_num(r.ThoiGianPhut, 0),
    tinhGio: U_str(r.TinhGio) || 'RIENG', moLuc: U_num(r.MoLuc, 0), dongLuc: U_num(r.DongLuc, 0), nghiemNgat: U_upper(r.NghiemNgat) === 'CO', chongAI: ['BAO', 'KHOA', 'KHOA_HET'].indexOf(U_upper(r.ChongAI)) >= 0 ? U_upper(r.ChongAI) : 'KHOA', maMoKhoa: U_str(r.MaMoKhoa), henDong: U_num(r.HenDong, 0), henCung: U_upper(r.HenCung) === 'CO',
    maPhong: U_str(r.MaPhong), batBuocSEB: U_bool(r.BatBuocSEB, false), dangNhapLai: U_str(r.DangNhapLai) || 'CHO_PHEP',
    viPhamToiDa: U_num(r.ViPhamToiDa, 0), thongBao: U_str(r.ThongBao), phienBan: U_num(r.PhienBanGoi, 0), soCau: U_num(r.SoCau, 0),
    tongDiem: U_num(r.TongDiem, 0), coSeb: !!PTA_sebXmlOf(r), capNhat: U_num(r.CapNhat, 0)
  };
}

/* ------------------------------------------------------------------ cài đặt & phát đề */

/** Các cài đặt chỉnh được từ giao diện (không đổi đề) */
function PTA_settingsPatch(o) {
  var p = {};
  if (o.tinhGio !== undefined) p.TinhGio = o.tinhGio === 'CHUNG' ? 'CHUNG' : 'RIENG';
  if (o.maPhong !== undefined) p.MaPhong = U_upper(o.maPhong).replace(/\s+/g, '');
  if (o.batBuocSEB !== undefined) p.BatBuocSEB = o.batBuocSEB ? 'CO' : 'KHONG';
  if (o.dangNhapLai !== undefined) p.DangNhapLai = o.dangNhapLai === 'CAN_GIAM_THI' ? 'CAN_GIAM_THI' : 'CHO_PHEP';
  if (o.viPhamToiDa !== undefined) p.ViPhamToiDa = String(Math.max(0, Math.round(U_num(o.viPhamToiDa, 0))));
  if (o.thongBao !== undefined) p.ThongBao = U_str(o.thongBao).substring(0, 500);
  if (o.huongDan !== undefined) p.HuongDan = U_str(o.huongDan).substring(0, 2000);
  if (o.henDong !== undefined) p.HenDong = o.henDong ? String(EC_parseLocal(o.henDong).getTime()) : '';
  if (o.nghiemNgat !== undefined) p.NghiemNgat = o.nghiemNgat ? 'CO' : 'KHONG';
  if (o.chongAI !== undefined) p.ChongAI = ['BAO', 'KHOA', 'KHOA_HET'].indexOf(U_upper(o.chongAI)) >= 0 ? U_upper(o.chongAI) : 'KHOA';
  return p;
}

function PTA_saveSettings(maKyThi, o) {
  var room = PTA_room(false);
  var r = PTA_examRow(room, maKyThi);
  if (!r) throw new Error('Kỳ thi chưa được phát lên phòng thi — bấm "Phát đề lên phòng thi" trước.');
  var p = PTA_settingsPatch(o || {});
  p.CapNhat = String(Date.now());
  if (p.ChongAI !== undefined) PTA_ensureCols(room);
  if (p.NghiemNgat === 'CO' && !U_str(r.MaMoKhoa)) p.MaMoKhoa = PTA_newUnlock();
  if (p.HenDong !== undefined && String(p.HenDong) !== U_str(r.HenDong)) { p.HenCung = ''; PTA_ensureCols(room); PTA_clearVuotHen(room, maKyThi); }   // mốc mới → bỏ phần vượt mốc cũ
  S_update(room, RSH.KY_THI, function (x) { return U_str(x.MaKyThi) === maKyThi; }, p);
  S_log('PHONG_THI_CAI_DAT', maKyThi + ' ' + JSON.stringify(p));
  return PTA_examView(PTA_examRow(room, maKyThi));
}

/** Ảnh Drive/URL → data URL (nhúng thẳng vào gói đề để thí sinh không phải tải từ Drive) */
function PTA_media(cache) {
  return function (ref) {
    if (cache[ref]) return cache[ref];
    var r;
    try {
      var blob = FX_blobFromRef(ref);
      var bytes = blob.getBytes();
      if (bytes.length > 1.5 * 1024 * 1024) r = { err: 'ảnh lớn hơn 1,5 MB — hãy nén ảnh' };
      else r = { src: 'data:' + (blob.getContentType() || 'image/png') + ';base64,' + Utilities.base64Encode(bytes) };
    } catch (e) { r = { err: e.message }; }
    cache[ref] = r;
    return r;
  };
}

/**
 * PHÁT ĐỀ: ghi gói đề (không đáp án) của mọi mã đề + danh sách thí sinh + mã truy cập lên phòng thi.
 * Có thể phát lại khi chưa thí sinh nào bắt đầu (giữ nguyên mã truy cập).
 */
function PTA_publish(maKyThi, o) {
  o = o || {};
  return S_withLock(function () {
    Repo_clearCache();
    var hub = S_hub(), cfg = Repo_config();
    var exRow = Repo_examRow(maKyThi), exam = Gen_examFromRow(exRow);
    var stg = ES_stage(exRow.TrangThai);
    if (stg < ES_stage(TT_KY_THI.DA_CHOT)) throw new Error('Cần Chốt đề (tab ③) trước khi phát lên phòng thi.');
    var room = PTA_room(true);
    if (!room.getSheetByName(RSH.THI_SINH)) PTA_setupRoom();
    PTA_ensureCols(room);
    PTA_pushCode(room);
    var cur = PTA_examRow(room, maKyThi);
    var oldSt = PTA_students(room, maKyThi);
    // Phát lại được khi phòng thi KHÔNG mở (đã đóng → thi bù / thêm thí sinh). Đề của mỗi mã đề không đổi; trạng thái, bài đã làm giữ nguyên.
    var working = oldSt.filter(function (s) { return U_num(s.BatDau, 0) > 0 && U_upper(s.TrangThai) !== R_TT.DA_NOP; });
    if (cur && U_upper(cur.TrangThai) === 'MO' && working.length && !o.force) {
      throw new Error(working.length + ' thí sinh đang làm bài — hãy ĐÓNG phòng thi trước khi phát lại (để thêm thí sinh / thi bù).');
    }

    var students = Repo_students(maKyThi);
    if (!students.length) throw new Error('Chưa có thí sinh (tab ④).');
    var noCode = students.filter(function (s) { return !s.MaDe; });
    if (noCode.length) throw new Error(noCode.length + ' thí sinh chưa được phân mã đề (tab ④ › Phân mã đề).');

    var bank = Repo_bank(exam.maMon);
    var sections = Repo_sections(exRow);
    var allItems = Repo_items(maKyThi);
    var warnings = [];
    FX_snapshot(allItems, bank, warnings);
    var clean = allItems.map(function (it) { var x = {}; HEADERS[SH.DE_THI].forEach(function (h) { x[h] = it[h]; }); return x; });
    S_replaceWhere(hub, SH.DE_THI, function (x) { return U_str(x.MaKyThi) === exam.maKyThi; }, clean);

    var byV = U_groupBy(allItems, function (x) { return x.MaDe; });
    // kỳ thi CHỈ lập trình (không có câu trắc nghiệm): mỗi mã đề có 0 câu trắc nghiệm
    var ltCfg = LT_examCfg(exRow);
    if (ltCfg.bai.length) Repo_variantRows(maKyThi).forEach(function (v) { if (!byV[U_str(v.MaDe)]) byV[U_str(v.MaDe)] = []; });
    var codes = Object.keys(byV).sort();
    var used = {};
    students.forEach(function (s) { if (!byV[s.MaDe]) throw new Error('Thí sinh ' + s.SBD + ' được phân mã đề ' + s.MaDe + ' nhưng mã đề này không có câu hỏi'); used[s.MaDe] = true; });
    var version = String(Date.now());
    var mediaCache = {}, media = PTA_media(mediaCache), pkgRows = [], bytes = 0, soCau = 0, tong = 0;
    codes.filter(function (md) { return used[md]; }).forEach(function (md) {
      var pkg = PK_build({ exRow: exRow, cfg: cfg, sections: sections, items: byV[md], bank: bank, maDe: md,
        bilingual: U_bool(cfg.SONG_NGU, true), media: media });
      pkg.warnings.forEach(function (w) { if (warnings.indexOf(w) < 0) warnings.push(w); });
      delete pkg.warnings;
      if (ltCfg.bai.length) {                       // phần LẬP TRÌNH: đề công khai + test mẫu (test ẩn ở sheet LT_Test, không gửi máy thí sinh)
        var lt = LT_pkgItems(exRow, pkg.items.length), ltMax = LT_total(exRow);
        pkg.items = pkg.items.concat(lt); pkg.soCau += lt.length; pkg.tongDiem += ltMax;
        pkg.sections.push({ phan: 'LT', ten: 'Lập trình', diem: ltMax, n: lt.length, moiCau: '', dangs: ['LAP_TRINH'] });
        pkg.hints.LAP_TRINH = 'Viết chương trình đọc dữ liệu vào chuẩn (bàn phím) và in kết quả ra màn hình. Chạy thử với test mẫu, rồi bấm Nộp code để chấm trên toàn bộ test.';
        pkg.ltLangs = ltCfg.nn; pkg.ltTinh = ltCfg.tinh;
      }
      soCau = pkg.soCau; tong = pkg.tongDiem;
      var json = JSON.stringify(pkg);
      bytes += json.length;
      PK_chunks(json, 45000).forEach(function (c, i) { pkgRows.push({ MaKyThi: maKyThi, MaDe: md, PhienBan: version, Manh: String(i), DuLieu: '~' + c }); });
    });
    S_replaceWhere(room, RSH.GOI_DE, function (x) { return U_str(x.MaKyThi) === maKyThi; }, pkgRows);
    var ltRoom = LT_roomData(maKyThi, exRow);
    if (room.getSheetByName(RSH.LT_TEST) || ltRoom.tests.length) S_replaceWhere(room, RSH.LT_TEST, function (x) { return U_str(x.MaKyThi) === maKyThi; }, ltRoom.tests);

    var oldMap = {};
    oldSt.forEach(function (s) { oldMap[U_upper(s.SBD)] = s; });
    var takenCodes = {};
    oldSt.forEach(function (s) { if (U_str(s.MaTruyCap)) takenCodes[U_upper(s.MaTruyCap)] = true; });
    var stRows = students.map(function (s) {
      var old = oldMap[U_upper(s.SBD)] || {};
      var code = U_upper(old.MaTruyCap);
      if (!code || o.newCodes) { do { code = PK_code(); } while (takenCodes[code]); takenCodes[code] = true; }
      var row = { MaKyThi: maKyThi, SBD: U_upper(s.SBD), HoTen: U_str(s.HoTen), Lop: U_str(s.Lop), MaDe: U_str(s.MaDe), MaTruyCap: code };
      R_ST_ROOM.concat(R_ST_ADMIN).forEach(function (k) { row[k] = old[k] !== undefined ? U_str(old[k]) : ''; });
      if (!row.TrangThai) row.TrangThai = R_TT.CHUA_VAO;
      return row;
    });
    S_replaceWhere(room, RSH.THI_SINH, function (x) { return U_str(x.MaKyThi) === maKyThi; }, stRows);

    var base = cur || { TrangThai: 'CHUA_MO', TinhGio: 'RIENG', BatBuocSEB: 'KHONG', DangNhapLai: 'CHO_PHEP', ViPhamToiDa: '0',
      KhoaUA: U_randomId(10), MaPhong: '' };
    var kRow = {};
    RHEADERS[RSH.KY_THI].forEach(function (h) { kRow[h] = base[h] !== undefined ? U_str(base[h]) : ''; });
    kRow.MaKyThi = maKyThi; kRow.TenKyThi = U_str(exRow.TenKyThi); kRow.DonVi = U_str(cfg.TEN_DON_VI); kRow.MaMon = exam.maMon;
    kRow.ThoiGianPhut = String(U_num(exRow.ThoiGianPhut, 0)); kRow.PhienBanGoi = version; kRow.SoCau = String(soCau);
    kRow.TongDiem = String(tong); kRow.CapNhat = String(Date.now());
    if (!kRow.KhoaUA) kRow.KhoaUA = U_randomId(10);
    if (!kRow.HuongDan) kRow.HuongDan = U_str(cfg.HUONG_DAN_DE);
    var patch = PTA_settingsPatch(o);
    Object.keys(patch).forEach(function (k) { kRow[k] = patch[k]; });
    var bc = PTA_brandCols(); Object.keys(bc).forEach(function (k) { kRow[k] = bc[k]; });
    kRow.LapTrinh = ltRoom.cfg;
    if (kRow.NghiemNgat === 'CO' && !kRow.MaMoKhoa) kRow.MaMoKhoa = PTA_newUnlock();
    S_ensureSheet(room, RSH.KY_THI, RHEADERS[RSH.KY_THI], { text: true, color: '#0f4c5c' });
    S_upsert(room, RSH.KY_THI, function (x) { return U_str(x.MaKyThi); }, kRow);

    if (stg === ES_stage(TT_KY_THI.DA_CHOT)) Repo_setExam(maKyThi, { TrangThai: TT_KY_THI.DA_XUAT });
    S_log('PHONG_THI_PHAT_DE', maKyThi + ': ' + codes.length + ' mã đề, ' + stRows.length + ' thí sinh, ' + Math.round(bytes / 1024) + ' KB');
    return { version: version, nVariants: Object.keys(used).length, nStudents: stRows.length, kb: Math.round(bytes / 1024),
      warnings: warnings, roomUrl: room.getUrl() };
  });
}

/* ------------------------------------------------------------------ mở / đóng */

function PTA_open(maKyThi, force) {
  var room0 = PTA_room(false);
  if (!PTA_examRow(room0, maKyThi)) throw new Error('Chưa phát đề lên phòng thi.');
  if (!PTA_webUrl()) throw new Error('Chưa nhập Link Web App phòng thi (mục Cài đặt).');
  PTA_pushCode(room0);
  var ping = PTA_ping(true);
  if (!ping.bootOk && !force) {
    throw new Error('PING:⛔ Chưa mở phòng thi vì máy thí sinh sẽ chạy MÃ CŨ: ' + (ping.error || 'bộ khởi động chưa đúng') +
      ' Hãy làm theo mục A (Sao chép mã khởi động → dán → Quản lý triển khai › ✎ › Phiên bản MỚI), bấm "Kiểm tra kết nối", rồi mở lại.');
  }
  if (ping.bootOk && !ping.bootLt && !force && LT_examCfg(Repo_examRow(maKyThi)).bai.length) {
    throw new Error('PING:⛔ Kỳ thi có bài lập trình nhưng phòng thi đang dùng Bộ khởi động v' + ping.boot + ' (chưa có quyền gửi code tới máy chấm). ' + ping.hint);
  }
  return S_withLock(function () {
    var room = room0;
    var r = PTA_examRow(room, maKyThi);
    if (!r) throw new Error('Chưa phát đề lên phòng thi.');
    if (!PTA_webUrl()) throw new Error('Chưa nhập Link Web App phòng thi (mục Cài đặt).');
    var p = { TrangThai: 'MO', DongLuc: '', CapNhat: String(Date.now()) }, hen = U_num(r.HenDong, 0);
    if (!U_num(r.MoLuc, 0)) p.MoLuc = String(Date.now());
    // mở lại phòng (VD: cho 1 em thi lại) mà giờ "Hẹn tự đóng" đã qua → bỏ hẹn, nếu không em vào sẽ bị nộp ngay
    if (hen && hen <= Date.now()) { p.HenDong = ''; p.HenCung = ''; }
    S_update(room, RSH.KY_THI, function (x) { return U_str(x.MaKyThi) === maKyThi; }, p);
    var ex = Repo_examRow(maKyThi), hp = { TrangThai: TT_KY_THI.DANG_THI };
    if (!U_str(ex.MoLuc)) hp.MoLuc = S_now();
    Repo_setExam(maKyThi, hp);
    S_log('PHONG_THI_MO', maKyThi + (p.HenDong === '' ? ' (bỏ giờ hẹn đóng đã qua)' : ''));
    var view = PTA_examView(PTA_examRow(room, maKyThi));
    if (p.HenDong === '') view.henCleared = true;
    return view;
  });
}

function PTA_close(maKyThi) {
  return S_withLock(function () {
    var room = PTA_room(false);
    if (!PTA_examRow(room, maKyThi)) throw new Error('Chưa phát đề lên phòng thi.');
    S_update(room, RSH.KY_THI, function (x) { return U_str(x.MaKyThi) === maKyThi; },
      { TrangThai: 'DONG', DongLuc: String(Date.now()), CapNhat: String(Date.now()) });
    var ex = Repo_examRow(maKyThi), patch = { DongLuc: S_now() };
    if (ES_stage(ex.TrangThai) <= ES_stage(TT_KY_THI.DANG_THI)) patch.TrangThai = TT_KY_THI.DA_DONG;
    Repo_setExam(maKyThi, patch);
    S_log('PHONG_THI_DONG', maKyThi);
    return PTA_examView(PTA_examRow(room, maKyThi));
  });
}

/* ------------------------------------------------------------------ giám sát & lệnh giám thị */

/** Tóm tắt điểm lập trình của 1 thí sinh (cột LtDiem phòng thi) → {d: tổng điểm, n: số lần nộp} */
function PTA_ltBrief(v) {
  try {
    var o = JSON.parse(U_str(v) || '{}') || {}, d = 0, n = 0;
    Object.keys(o).forEach(function (k) { d += Number(o[k].d) || 0; n += Number(o[k].n) || 0; });
    return n ? { d: Math.round(d * 100) / 100, n: n } : null;
  } catch (e) { return null; }
}
function PTA_monitor(maKyThi) {
  var room = PTA_room(false);
  var r = PTA_examRow(room, maKyThi);
  if (!r) throw new Error('Chưa phát đề lên phòng thi.');
  var now = Date.now(), counts = { CHUA_VAO: 0, CHO: 0, DANG_LAM: 0, MAT_KET_NOI: 0, KHOA: 0, DA_NOP: 0, CAM: 0, TAM_DUNG: 0 };
  var list = PTA_students(room, maKyThi).map(function (s) {
    var st = U_upper(s.TrangThai) || R_TT.CHUA_VAO, last = U_num(s.LanCuoi, 0);
    var paused = !!U_num(s.DungLuc, 0) && st !== R_TT.DA_NOP;
    var view = U_upper(s.CamThi) === 'CO' ? R_TT.CAM : paused ? 'TAM_DUNG' : st;
    if ((view === R_TT.DANG_LAM || st === R_TT.CHO) && last && now - last > R_OFFLINE_MS) view = 'MAT_KET_NOI';
    counts[view] = (counts[view] || 0) + 1;
    var dl = U_num(s.BatDau, 0) || U_upper(r.TinhGio) === 'CHUNG' ? PK_deadline(r, s) : Infinity;
    return {
      sbd: U_str(s.SBD), hoTen: U_str(s.HoTen), lop: U_str(s.Lop), maDe: U_str(s.MaDe), code: U_str(s.MaTruyCap), tt: view,
      daLam: U_num(s.DaLam, 0), viPham: U_num(s.ViPham, 0), viPhamMoc: U_num(s.ViPhamMoc, 0), soLanVao: U_num(s.SoLanVao, 0),
      seb: U_str(s.SEB) === 'CO', trinhDuyet: U_str(s.TrinhDuyet), batDau: U_num(s.BatDau, 0), nopLuc: U_num(s.NopLuc, 0),
      lanCuoi: last, themPhut: U_num(s.ThemPhut, 0), conLai: isFinite(dl) ? Math.max(0, dl - now) : null,
      lenhCho: U_str(s.LenhId) && U_str(s.LenhId) !== U_str(s.LenhDaXuLy) ? U_str(s.Lenh) : '', lyDoCam: U_str(s.LyDoCam),
      tamDung: paused, dungMs: PK_pausedMs(s, now), vuotHen: U_num(s.VuotHen, 0), manHinh: U_str(s.ManHinh), sebKey: U_str(s.SebKey).toLowerCase(), sebVer: U_str(s.SebVer),
      lt: PTA_ltBrief(s.LtDiem), nghiTD: U_num(s.NghiTD, 0), nghiMuc: U_num(s.NghiMuc, 0), nghiLyDo: U_str(s.NghiLyDo)
    };
  });
  // LỚP 4: so mã cấu hình SEB với "máy chuẩn" (nếu đã chọn) hoặc với mã phổ biến nhất trong phòng
  var chuan = U_str(r.SebKeyChuan).toLowerCase(), freq = {}, top = '', topN = 0;
  list.forEach(function (s) { if (s.sebKey) { freq[s.sebKey] = (freq[s.sebKey] || 0) + 1; if (freq[s.sebKey] > topN) { topN = freq[s.sebKey]; top = s.sebKey; } } });
  var ref = chuan || top;
  list.forEach(function (s) { s.sebOk = !s.sebKey ? null : !ref || s.sebKey === ref; });
  // câu hỏi thí sinh gửi giám thị (nút "Hỏi giám thị" trong trang thi) + trạng thái đã trả lời
  var tail = PTA_tail(room, RSH.NHAT_KY, 4000);
  var ev = tail.filter(function (e) { return U_str(e.MaKyThi) === maKyThi && /^(HOI|TRA_LOI)$/.test(U_str(e.SuKien)); });
  var lastReply = {};
  ev.forEach(function (e) { if (U_str(e.SuKien) === 'TRA_LOI') lastReply[U_upper(e.SBD)] = Math.max(lastReply[U_upper(e.SBD)] || 0, U_num(e.ThoiGian, 0)); });
  var names = {};
  list.forEach(function (s) { names[U_upper(s.sbd)] = s.hoTen; });
  names[PTA_THU_SBD] = 'Giám thị (thi thử)';
  var questions = ev.filter(function (e) { return U_str(e.SuKien) === 'HOI'; }).slice(-40).reverse().map(function (e) {
    var t = U_num(e.ThoiGian, 0), sb = U_upper(e.SBD);
    return { t: t, sbd: U_str(e.SBD), hoTen: names[sb] || '', text: U_str(e.ChiTiet), answered: (lastReply[sb] || 0) >= t && !!lastReply[sb] };
  });
  var allEv = tail, ptVer = '';
  for (var i = allEv.length - 1; i >= 0 && i >= allEv.length - 400; i--) {
    var mv = U_str(allEv[i].ChiTiet).match(/^pt v([\d.]+)/);
    if (mv) { ptVer = mv[1]; break; }
  }
  return { exam: PTA_examView(r), now: now, counts: counts, students: list, total: list.length, questions: questions,
    ptVersion: ptVer, ptExpected: APP.PT_VERSION, serverNow: now, sebChuan: chuan, sebRef: ref };
}

/**
 * Lệnh giám thị cho 1 hoặc nhiều thí sinh (máy thí sinh nhận ở lần tự lưu kế tiếp, ≤ ~45 giây):
 *  MO_KHOA (mở khoá bài bị khoá do vi phạm) · THEM_PHUT (cộng thêm phút) · THU_BAI (buộc nộp bài)
 *  CHO_VAO_LAI (cho đăng nhập lại trên máy khác) · TIN (nhắn riêng)
 */
function PTA_command(maKyThi, sbds, cmd, value) {
  cmd = U_upper(cmd);
  if (['MO_KHOA', 'THEM_PHUT', 'THU_BAI', 'CHO_VAO_LAI', 'TIN'].indexOf(cmd) < 0) throw new Error('Lệnh không hợp lệ: ' + cmd);
  var room = PTA_room(false);
  var set = {};
  (sbds || []).forEach(function (x) { set[U_upper(x)] = true; });
  var all = !sbds || !sbds.length;
  var id = String(Date.now()) + U_randomId(3);
  // CHỈ ghi các cột của giám thị — không ghi đè cột trạng thái mà máy chủ phòng thi đang cập nhật liên tục
  var sh = room.getSheetByName(RSH.THI_SINH), head = S_headers(sh), n = 0;
  if (cmd === 'THEM_PHUT' && !Math.round(U_num(value, 0))) throw new Error('Nhập số phút cần cộng (có thể âm)');
  S_read(room, RSH.THI_SINH).forEach(function (s) {
    if (U_str(s.MaKyThi) !== maKyThi || !(all || set[U_upper(s.SBD)]) || PTA_isThu(s)) return;
    var p = cmd === 'THEM_PHUT' ? { ThemPhut: String(U_num(s.ThemPhut, 0) + Math.round(U_num(value, 0))), VuotHen: String(U_num(s.VuotHen, 0) + Math.round(U_num(value, 0))) }
      : { Lenh: cmd, LenhGiaTri: cmd === 'TIN' ? U_str(value).substring(0, 300) : '', LenhId: id };
    PTA_writeCols(sh, head, s.__row, p);
    n++;
    if (cmd === 'TIN') { try { S_append(room, RSH.NHAT_KY, [{ ThoiGian: String(Date.now()), MaKyThi: maKyThi, SBD: U_str(s.SBD), SuKien: 'TRA_LOI', ChiTiet: U_str(value).substring(0, 300) }]); } catch (e) { } }
  });
  var warn = '';
  if (cmd === 'THEM_PHUT') {
    var rx = PTA_examRow(room, maKyThi) || {};
    if (U_num(rx.HenDong, 0)) warn = 'Đang hẹn đóng lúc ' + PTA_fmt(rx.HenDong).substring(11, 16) + ': ' + (all ? 'mọi thí sinh' : 'thí sinh được chọn') + ' được cộng ' + Math.round(U_num(value, 0)) + ' phút VƯỢT mốc này (các em khác vẫn đóng đúng mốc).';
  }
  S_log('PHONG_THI_LENH', maKyThi + ' ' + cmd + ' ' + (all ? 'TẤT CẢ' : Object.keys(set).join(',')) + (value ? ' (' + value + ')' : ''));
  return { updated: n, warning: warn };
}

/** Ghi một số cột của 1 dòng (gom cột liền nhau) */
function PTA_writeCols(sh, head, row, patch) {
  var idx = Object.keys(patch).map(function (k) { return head.indexOf(k); }).filter(function (i) { return i >= 0; }).sort(function (a, b) { return a - b; });
  var i = 0;
  while (i < idx.length) {
    var j = i;
    while (j + 1 < idx.length && idx[j + 1] === idx[j] + 1) j++;
    var vals = [];
    for (var k = idx[i]; k <= idx[j]; k++) vals.push(U_str(patch[head[k]]));
    sh.getRange(row, idx[i] + 1, 1, vals.length).setValues([vals]);
    i = j + 1;
  }
}

/**
 * CHO LÀM LẠI: huỷ lượt làm bài của thí sinh (bài cũ được giữ lại trong BaiLam với Loai = HUY_…, không tính điểm),
 * đưa thí sinh về "Chưa vào" để đăng nhập lại và làm từ đầu với CÙNG mã đề, cùng mã truy cập.
 */
function PTA_reset(maKyThi, sbds, newCode) {
  if (!sbds || !sbds.length) throw new Error('Chọn thí sinh cần cho làm lại');
  return S_withLock(function () {
    var room = PTA_room(false), set = {};
    PTA_ensureCols(room);
    sbds.forEach(function (x) { set[U_upper(x)] = true; });
    var sh = room.getSheetByName(RSH.THI_SINH), head = S_headers(sh), n = 0, codes = [];
    var all = S_read(room, RSH.THI_SINH), taken = {};
    all.forEach(function (s) { taken[U_upper(s.MaTruyCap)] = true; });
    all.forEach(function (s) {
      if (U_str(s.MaKyThi) !== maKyThi || !set[U_upper(s.SBD)]) return;
      // GhiChu "RESET:<ms>" → máy chủ phòng thi bỏ khoá "nhập sai quá nhiều lần" có từ trước lúc này
      var p = { TrangThai: R_TT.CHUA_VAO, Token: '', BatDau: '', SoLanVao: '', NopLuc: '', LanCuoi: '', DaLam: '', ViPham: '', ViPhamMoc: '',
        LenhDaXuLy: '', ThemPhut: '', Lenh: '', LenhGiaTri: '', LenhId: '', GhiChu: 'RESET:' + Date.now(), CamThi: '', LyDoCam: '' };
      if (newCode) { var c; do { c = PK_code(); } while (taken[c]); taken[c] = true; p.MaTruyCap = c; }
      PTA_writeCols(sh, head, s.__row, p);
      codes.push({ sbd: U_str(s.SBD), hoTen: U_str(s.HoTen), code: newCode ? p.MaTruyCap : U_str(s.MaTruyCap) });
      n++;
    });
    var bl = room.getSheetByName(RSH.BAI_LAM), bh = S_headers(bl), nv = 0;
    S_read(room, RSH.BAI_LAM).forEach(function (r) {
      if (U_str(r.MaKyThi) !== maKyThi || !set[U_upper(r.SBD)] || /^HUY_/.test(U_upper(r.Loai))) return;
      PTA_writeCols(bl, bh, r.__row, { Loai: 'HUY_' + U_upper(r.Loai) });
      nv++;
    });
    S_replaceWhere(S_hub(), SH.BAI_LAM, function (x) {
      return U_str(x.MaKyThi) === maKyThi && GR_isWebId(x.ResponseId) && set[U_upper(x.SBD)];
    }, []);
    Object.keys(set).forEach(function (sbd) {
      try { S_append(room, RSH.NHAT_KY, [{ ThoiGian: String(Date.now()), MaKyThi: maKyThi, SBD: sbd, SuKien: 'CHO_LAM_LAI', ChiTiet: 'Giám thị ' + (S_user() || '') }]); } catch (e) { }
    });
    S_log('PHONG_THI_LAM_LAI', maKyThi + ': ' + Object.keys(set).join(','));
    return { reset: n, voided: nv, codes: codes, newCode: !!newCode };
  });
}

/**
 * CHO LÀM TIẾP: giữ nguyên bài đã làm, cho thí sinh vào lại (kể cả đã nộp / hết giờ / kỳ thi đã đóng).
 * Bài nộp cũ chuyển thành bản lưu (lần nộp mới mới được tính). Tự cộng giờ để còn ít nhất `addMin` phút (mặc định 10).
 */
function PTA_continue(maKyThi, sbds, addMin) {
  if (!sbds || !sbds.length) throw new Error('Chọn thí sinh cần cho làm tiếp');
  addMin = Math.max(1, Math.round(U_num(addMin, 10)));
  return S_withLock(function () {
    var room = PTA_room(false), set = {};
    PTA_ensureCols(room);
    sbds.forEach(function (x) { set[U_upper(x)] = true; });
    var r = PTA_examRow(room, maKyThi);
    if (!r) throw new Error('Chưa phát đề lên phòng thi.');
    var now = Date.now();
    var exPatch = {};
    if (Object.keys(exPatch).length) { S_update(room, RSH.KY_THI, function (x) { return U_str(x.MaKyThi) === maKyThi; }, exPatch); r.HenDong = ''; }
    var sim = {}; Object.keys(r).forEach(function (k) { sim[k] = r[k]; }); sim.TrangThai = 'MO'; sim.DongLuc = '';
    var sh = room.getSheetByName(RSH.THI_SINH), head = S_headers(sh), id = String(now) + U_randomId(3), out = [];
    S_read(room, RSH.THI_SINH).forEach(function (s) {
      if (U_str(s.MaKyThi) !== maKyThi || !set[U_upper(s.SBD)]) return;
      var p = { Lenh: 'CHO_VAO_LAI', LenhGiaTri: '', LenhId: id, CamThi: '', LyDoCam: '' };
      var extra = 0;
      if (U_num(s.BatDau, 0) || U_upper(r.TinhGio) === 'CHUNG') {
        var dl = PK_deadline(sim, s);
        if (isFinite(dl) && dl < now + addMin * 60000) extra = Math.ceil((now + addMin * 60000 - dl) / 60000);
      }
      if (extra) { p.ThemPhut = String(U_num(s.ThemPhut, 0) + extra); p.VuotHen = String(U_num(s.VuotHen, 0) + extra); }   // vượt cả hẹn đóng, riêng em này
      if (U_upper(s.TrangThai) === R_TT.DA_NOP || U_upper(s.TrangThai) === R_TT.KHOA) { p.TrangThai = U_num(s.BatDau, 0) ? R_TT.DANG_LAM : R_TT.CHUA_VAO; p.NopLuc = ''; }
      if (U_upper(s.TrangThai) === R_TT.KHOA) p.ViPhamMoc = U_str(s.ViPham);
      PTA_writeCols(sh, head, s.__row, p);
      out.push({ sbd: U_str(s.SBD), hoTen: U_str(s.HoTen), code: U_str(s.MaTruyCap), themPhut: extra });
    });
    var bl = room.getSheetByName(RSH.BAI_LAM), bh = S_headers(bl);
    S_read(room, RSH.BAI_LAM).forEach(function (x) {
      if (U_str(x.MaKyThi) === maKyThi && set[U_upper(x.SBD)] && /^NOP/.test(U_upper(x.Loai))) PTA_writeCols(bl, bh, x.__row, { Loai: 'LUU' });
    });
    S_replaceWhere(S_hub(), SH.BAI_LAM, function (x) { return U_str(x.MaKyThi) === maKyThi && /^WEB-/.test(U_str(x.ResponseId)) && set[U_upper(x.SBD)]; }, []);
    S_log('PHONG_THI_LAM_TIEP', maKyThi + ': ' + Object.keys(set).join(','));
    return { students: out, open: U_upper(r.TrangThai) === 'MO' };
  });
}

/**
 * THI LẠI TOÀN BỘ KỲ THI (dùng lại đúng đề): huỷ mọi bài, đưa mọi thí sinh về "Chưa vào", phòng thi về "Chưa mở",
 * kỳ thi về bước "Đã phát đề" — như chưa thi lần nào. Bài cũ vẫn lưu trong file phòng thi (Loai = HUY_…).
 */
function PTA_resetExam(maKyThi, newCodes) {
  var room = PTA_room(false);
  if (!PTA_examRow(room, maKyThi)) throw new Error('Chưa phát đề lên phòng thi.');
  var all = PTA_students(room, maKyThi).map(function (s) { return U_str(s.SBD); });
  var r = all.length ? PTA_reset(maKyThi, all, newCodes) : { reset: 0, voided: 0, codes: [] };
  return S_withLock(function () {
    S_update(room, RSH.KY_THI, function (x) { return U_str(x.MaKyThi) === maKyThi; },
      { TrangThai: 'CHUA_MO', MoLuc: '', DongLuc: '', HenDong: '', HenCung: '', ThongBao: '', CapNhat: String(Date.now()) });
    PTA_clearVuotHen(room, maKyThi);
    Repo_setExam(maKyThi, { TrangThai: TT_KY_THI.DA_XUAT, MoLuc: '', DongLuc: '' });
    try { GR_compile(maKyThi); } catch (e) { }
    S_log('PHONG_THI_THI_LAI', maKyThi + ': ' + r.reset + ' thí sinh');
    r.examReset = true;
    return r;
  });
}

/** CẤM THI (đình chỉ) ngay trong giờ: máy thí sinh bị đẩy ra trong ≤ ~40 giây, không đăng nhập lại được; bài đã làm được giữ làm bằng chứng */
function PTA_ban(maKyThi, sbds, reason) {
  if (!sbds || !sbds.length) throw new Error('Chọn thí sinh cần đình chỉ');
  return S_withLock(function () {
    var room = PTA_room(false), set = {};
    PTA_ensureCols(room);
    sbds.forEach(function (x) { set[U_upper(x)] = true; });
    var sh = room.getSheetByName(RSH.THI_SINH), head = S_headers(sh), n = 0;
    reason = U_str(reason).substring(0, 200);
    S_read(room, RSH.THI_SINH).forEach(function (s) {
      if (U_str(s.MaKyThi) !== maKyThi || !set[U_upper(s.SBD)]) return;
      PTA_writeCols(sh, head, s.__row, { CamThi: 'CO', LyDoCam: reason, Token: '' });
      try { S_append(room, RSH.NHAT_KY, [{ ThoiGian: String(Date.now()), MaKyThi: maKyThi, SBD: U_str(s.SBD), SuKien: 'CAM_THI', ChiTiet: reason || '(không ghi lý do)' }]); } catch (e) { }
      n++;
    });
    S_log('PHONG_THI_CAM', maKyThi + ': ' + Object.keys(set).join(',') + ' — ' + reason);
    return { banned: n };
  });
}

/**
 * GỠ CẤM / CHO THI LẠI sau khi bị đình chỉ:
 *  mode TIEP  : làm tiếp bài đang dở (giữ câu trả lời, tự cộng giờ còn ≥ o.phut phút)
 *  mode LAI   : làm lại từ đầu, cùng mã đề
 *  mode DE_MOI: đổi sang ĐỀ RIÊNG rồi làm lại từ đầu — o.kieu = TRON (cùng câu, trộn lại) | MOI (bộ câu mới theo ma trận)
 */
function PTA_unban(maKyThi, sbds, mode, o) {
  o = o || {};
  if (!sbds || !sbds.length) throw new Error('Chọn thí sinh');
  var room = PTA_room(false), set = {};
  PTA_ensureCols(room);
  sbds.forEach(function (x) { set[U_upper(x)] = true; });
  S_withLock(function () {
    var sh = room.getSheetByName(RSH.THI_SINH), head = S_headers(sh);
    S_read(room, RSH.THI_SINH).forEach(function (s) {
      if (U_str(s.MaKyThi) === maKyThi && set[U_upper(s.SBD)]) PTA_writeCols(sh, head, s.__row, { CamThi: '', LyDoCam: '' });
    });
  });
  var out;
  if (mode === 'TIEP') out = PTA_continue(maKyThi, sbds, o.phut || 10);
  else if (mode === 'DE_MOI') out = PTA_personal(maKyThi, sbds, o.kieu === 'MOI' ? 'MOI' : 'TRON', !!o.newCode);
  else out = PTA_reset(maKyThi, sbds, !!o.newCode);
  S_log('PHONG_THI_GO_CAM', maKyThi + ': ' + Object.keys(set).join(',') + ' → ' + mode);
  out.mode = mode;
  return out;
}

/** Đổi sang đề riêng (mỗi thí sinh 1 mã đề mới "<mã gốc>-R<n>") rồi cho làm lại từ đầu */
function PTA_personal(maKyThi, sbds, kieu, newCode) {
  var made = S_withLock(function () {
    Repo_clearCache();
    var hub = S_hub(), cfg = Repo_config(), room = PTA_room(false);
    var exRow = Repo_examRow(maKyThi), exam = Gen_examFromRow(exRow);
    var bank = Repo_bank(exam.maMon), matrix = Repo_matrix(exam.maMaTran);
    var allItems = Repo_items(maKyThi), sections = Repo_sections(exRow);
    var rEx = PTA_examRow(room, maKyThi);
    if (!rEx) throw new Error('Chưa phát đề lên phòng thi.');
    var stRoom = {};
    PTA_students(room, maKyThi).forEach(function (s) { stRoom[U_upper(s.SBD)] = s; });
    var codes = {}, res = [], warnings = [], newRows = [], pkgRows = [];
    allItems.forEach(function (it) { codes[U_str(it.MaDe)] = true; });
    sbds.forEach(function (sbd) {
      var s = stRoom[U_upper(sbd)];
      if (!s) throw new Error('Không có thí sinh ' + sbd + ' trên phòng thi');
      var baseMd = U_str(s.MaDe).replace(/-R\d+$/, ''), n = 1;
      while (codes[baseMd + '-R' + n]) n++;
      var md = baseMd + '-R' + n;
      codes[md] = true;
      var g = Gen_extraVariant(exam, matrix, bank, allItems.concat(newRows), baseMd, md, kieu, String(Date.now()) + sbd);
      if (g.errors.length) throw new Error('Không tạo được đề riêng cho ' + sbd + ': ' + g.errors.join('; '));
      g.warnings.forEach(function (w) { warnings.push(sbd + ': ' + w); });
      newRows = newRows.concat(g.items);
      var pkg = PK_build({ exRow: exRow, cfg: cfg, sections: sections, items: g.items, bank: bank, maDe: md,
        bilingual: U_bool(cfg.SONG_NGU, true), media: PTA_media({}) });
      delete pkg.warnings;
      PK_chunks(JSON.stringify(pkg), 45000).forEach(function (c, i) { pkgRows.push({ MaKyThi: maKyThi, MaDe: md, PhienBan: U_str(rEx.PhienBanGoi), Manh: String(i), DuLieu: '~' + c }); });
      res.push({ sbd: U_str(s.SBD), hoTen: U_str(s.HoTen), oldMd: U_str(s.MaDe), maDe: md });
    });
    var clean = newRows.map(function (it) { var x = {}; HEADERS[SH.DE_THI].forEach(function (h) { x[h] = it[h]; }); return x; });
    S_append(hub, SH.DE_THI, clean);
    S_append(room, RSH.GOI_DE, pkgRows);
    var map = {};
    res.forEach(function (x) { map[U_upper(x.sbd)] = x.maDe; });
    S_update(hub, SH.THI_SINH, function (x) { return U_str(x.MaKyThi) === maKyThi && map[U_upper(x.SBD)]; }, function (x) { return { MaDe: map[U_upper(x.SBD)], LinkThi: '' }; });
    var sh = room.getSheetByName(RSH.THI_SINH), head = S_headers(sh);
    S_read(room, RSH.THI_SINH).forEach(function (s) {
      if (U_str(s.MaKyThi) === maKyThi && map[U_upper(s.SBD)]) PTA_writeCols(sh, head, s.__row, { MaDe: map[U_upper(s.SBD)] });
    });
    S_log('DE_RIENG', maKyThi + ': ' + res.map(function (x) { return x.sbd + '→' + x.maDe; }).join(', ') + ' (' + kieu + ')');
    return { variants: res, warnings: warnings };
  });
  var r = PTA_reset(maKyThi, sbds, newCode);
  r.variants = made.variants; r.warnings = made.warnings;
  return r;
}

/**
 * TẠM DỪNG / TIẾP TỤC giờ thi (sự cố chung: mất điện, mất mạng cả phòng… hoặc riêng 1 thí sinh).
 * Khi tạm dừng: máy thí sinh hiện màn "Tạm dừng", không làm bài được, đồng hồ đứng; khi tiếp tục, giờ được bù đúng
 * thời gian đã dừng (tính từ lúc thí sinh thực sự bắt đầu nếu bắt đầu sau khi dừng).
 * sbds rỗng = cả phòng (khi tiếp tục cả phòng, giờ "Hẹn tự đóng" cũng lùi tương ứng).
 */
function PTA_pause(maKyThi, sbds, on) {
  return S_withLock(function () {
    var room = PTA_room(false), all = !sbds || !sbds.length, set = {};
    PTA_ensureCols(room);
    (sbds || []).forEach(function (x) { set[U_upper(x)] = true; });
    var r = PTA_examRow(room, maKyThi);
    if (!r) throw new Error('Chưa phát đề lên phòng thi.');
    var sh = room.getSheetByName(RSH.THI_SINH), head = S_headers(sh), now = Date.now(), n = 0, maxCredit = 0;
    var chung = U_upper(r.TinhGio) === 'CHUNG';
    S_read(room, RSH.THI_SINH).forEach(function (s) {
      if (U_str(s.MaKyThi) !== maKyThi || !(all || set[U_upper(s.SBD)]) || PTA_isThu(s)) return;
      var tt = U_upper(s.TrangThai);
      if (on) {
        if (U_num(s.DungLuc, 0) || tt === R_TT.DA_NOP || U_upper(s.CamThi) === 'CO') return;
        PTA_writeCols(sh, head, s.__row, { DungLuc: String(now) });
      } else {
        var from = U_num(s.DungLuc, 0);
        if (!from) return;
        var bd = U_num(s.BatDau, 0);
        var credit = chung ? now - from : (bd ? now - Math.max(from, bd) : 0);
        credit = Math.max(0, credit);
        maxCredit = Math.max(maxCredit, now - from);
        var pp = { DungLuc: '', DungMs: String(U_num(s.DungMs, 0) + credit) };
        if (!all && U_num(r.HenDong, 0)) pp.VuotHen = String(Math.round((U_num(s.VuotHen, 0) + (now - from) / 60000) * 100) / 100);   // dừng riêng 1 em → mốc hẹn của em lùi tương ứng
        PTA_writeCols(sh, head, s.__row, pp);
      }
      n++;
    });
    var shifted = '';
    if (!on && all && U_num(r.HenDong, 0) && maxCredit) {
      var nh = U_num(r.HenDong, 0) + maxCredit;
      S_update(room, RSH.KY_THI, function (x) { return U_str(x.MaKyThi) === maKyThi; }, { HenDong: String(nh), CapNhat: String(now) });
      shifted = PTA_fmt(nh).substring(11, 16);
    }
    try { S_append(room, RSH.NHAT_KY, [{ ThoiGian: String(now), MaKyThi: maKyThi, SBD: all ? '*' : Object.keys(set).join(','), SuKien: on ? 'TAM_DUNG' : 'TIEP_TUC', ChiTiet: n + ' thí sinh' + (maxCredit ? ' · dừng ' + Math.round(maxCredit / 1000) + ' giây' : '') }]); } catch (e) { }
    S_log(on ? 'PHONG_THI_TAM_DUNG' : 'PHONG_THI_TIEP_TUC', maKyThi + ': ' + (all ? 'cả phòng' : Object.keys(set).join(',')) + ' (' + n + ')');
    return { count: n, pausedSec: Math.round(maxCredit / 1000), henDongMoi: shifted };
  });
}

/**
 * THÊM THÍ SINH MUỘN mà KHÔNG cần đóng phòng / phát lại: đưa thí sinh mới (đã phân mã đề ở tab ④) lên phòng thi,
 * cập nhật họ tên/lớp người cũ. Không đụng tới trạng thái, bài làm, mã truy cập của ai đang thi.
 */
function PTA_syncStudents(maKyThi) {
  return S_withLock(function () {
    Repo_clearCache();
    var room = PTA_room(false), r = PTA_examRow(room, maKyThi);
    if (!r) throw new Error('Kỳ thi chưa được phát lên phòng thi — bấm "📤 Phát đề lên phòng thi" (mục B).');
    PTA_ensureCols(room);
    var hubSt = Repo_students(maKyThi), roomSt = PTA_students(room, maKyThi), have = {}, taken = {};
    roomSt.forEach(function (s) { have[U_upper(s.SBD)] = s; if (U_str(s.MaTruyCap)) taken[U_upper(s.MaTruyCap)] = true; });
    var mdOk = {};
    S_read(room, RSH.GOI_DE).forEach(function (x) { if (U_str(x.MaKyThi) === maKyThi) mdOk[U_str(x.MaDe)] = true; });
    var add = [], noCode = [], noPkg = [], renamed = 0;
    var sh = room.getSheetByName(RSH.THI_SINH), head = S_headers(sh);
    hubSt.forEach(function (s) {
      var sbd = U_upper(s.SBD), old = have[sbd];
      if (old) {
        if (U_str(old.HoTen) !== U_str(s.HoTen) || U_str(old.Lop) !== U_str(s.Lop)) { PTA_writeCols(sh, head, old.__row, { HoTen: U_str(s.HoTen), Lop: U_str(s.Lop) }); renamed++; }
        return;
      }
      if (!U_str(s.MaDe)) { noCode.push(sbd); return; }
      if (!mdOk[U_str(s.MaDe)]) { noPkg.push(sbd + ' (' + s.MaDe + ')'); return; }
      var code; do { code = PK_code(); } while (taken[code]); taken[code] = true;
      var row = { MaKyThi: maKyThi, SBD: sbd, HoTen: U_str(s.HoTen), Lop: U_str(s.Lop), MaDe: U_str(s.MaDe), MaTruyCap: code };
      R_ST_ROOM.concat(R_ST_ADMIN).forEach(function (k) { row[k] = ''; });
      row.TrangThai = R_TT.CHUA_VAO;
      add.push(row);
    });
    if (add.length) S_append(room, RSH.THI_SINH, add);
    S_update(room, RSH.KY_THI, function (x) { return U_str(x.MaKyThi) === maKyThi; }, { CapNhat: String(Date.now()) });
    S_log('PHONG_THI_THEM_TS', maKyThi + ': +' + add.length + (noCode.length ? ' · chưa phân: ' + noCode.join(',') : '') + (noPkg.length ? ' · thiếu gói đề: ' + noPkg.join(',') : ''));
    return { added: add.map(function (x) { return { sbd: x.SBD, hoTen: x.HoTen, maDe: x.MaDe, code: x.MaTruyCap }; }), renamed: renamed, noCode: noCode, noPkg: noPkg,
      hub: hubSt.length, room: roomSt.length + add.length,
      open: U_upper(r.TrangThai) === 'MO' };
  });
}
/** Xoá phần "vượt hẹn đóng" riêng của mọi thí sinh trong kỳ thi */
function PTA_clearVuotHen(room, maKyThi) {
  var sh = room.getSheetByName(RSH.THI_SINH), head = S_headers(sh);
  if (head.indexOf('VuotHen') < 0) return;
  S_read(room, RSH.THI_SINH).forEach(function (s) { if (U_str(s.MaKyThi) === maKyThi && U_str(s.VuotHen)) PTA_writeCols(sh, head, s.__row, { VuotHen: '' }); });
}
/**
 * HẸN ĐÓNG: đặt mốc kết thúc chung cho phòng.
 *   o.phut   : đóng sau N phút   | o.luc: 'HH:mm' (hôm nay; đã qua thì hiểu là ngày mai)
 *   o.dongBo : true = ĐỒNG BỘ — mọi thí sinh kết thúc ĐÚNG mốc này (kể cả em còn ít / nhiều giờ hơn), bỏ mọi phần vượt mốc cũ
 *              false = mốc là giới hạn trên: em hết giờ trước thì vẫn nộp trước; phần vượt mốc cũ cũng bỏ (mốc mới)
 * Sau đó giám thị vẫn cộng giờ riêng cho từng em → em đó được VƯỢT mốc đúng số phút cộng.
 */
function PTA_closeIn(maKyThi, minutes, o) {
  o = o || {};
  var room = PTA_room(false), r = PTA_examRow(room, maKyThi);
  if (!r) throw new Error('Chưa phát đề lên phòng thi.');
  var now = Date.now(), at;
  if (o.luc) {
    var mm = String(o.luc).match(/^(\d{1,2}):(\d{2})$/);
    if (!mm) throw new Error('Giờ hẹn dạng HH:mm, VD 10:45');
    at = EC_parseLocal(Utilities.formatDate(new Date(now), APP.TZ, 'yyyy-MM-dd') + ' ' + ('0' + mm[1]).slice(-2) + ':' + mm[2]).getTime();
    if (at <= now) at += 86400000;
  } else {
    var m = Math.round(U_num(minutes, 0));
    if (m < 1) throw new Error('Nhập số phút ≥ 1');
    at = now + m * 60000;
  }
  var mins = Math.round((at - now) / 60000), hhmm = PTA_fmt(at).substring(11, 16);
  PTA_ensureCols(room);
  PTA_clearVuotHen(room, maKyThi);
  S_update(room, RSH.KY_THI, function (x) { return U_str(x.MaKyThi) === maKyThi; },
    { HenDong: String(at), HenCung: o.dongBo ? 'CO' : '', ThongBao: (o.dongBo ? 'Tất cả thí sinh kết thúc bài lúc ' : 'Phòng thi sẽ kết thúc lúc ') + hhmm + ' (còn ' + mins + ' phút). Hãy kiểm tra lại và nộp bài; hết giờ hệ thống tự nộp.', CapNhat: String(now) });
  S_log('PHONG_THI_DONG_SAU', maKyThi + ': ' + hhmm + (o.dongBo ? ' (đồng bộ mọi thí sinh)' : ''));
  return { at: at, hhmm: hhmm, mins: mins, dongBo: !!o.dongBo };
}
/** Bỏ hẹn đóng: mỗi thí sinh quay về giờ làm bài riêng của mình (kể cả phần đã cộng) */
function PTA_cancelClose(maKyThi) {
  var room = PTA_room(false), r = PTA_examRow(room, maKyThi);
  if (!r) throw new Error('Chưa phát đề lên phòng thi.');
  PTA_ensureCols(room);
  PTA_clearVuotHen(room, maKyThi);
  var p = { HenDong: '', HenCung: '', CapNhat: String(Date.now()) };
  if (/^(Phòng thi sẽ kết thúc|Tất cả thí sinh kết thúc)/.test(U_str(r.ThongBao))) p.ThongBao = '';
  S_update(room, RSH.KY_THI, function (x) { return U_str(x.MaKyThi) === maKyThi; }, p);
  S_log('PHONG_THI_BO_HEN', maKyThi);
  return { ok: true };
}

/** Bài làm JSON của 1 dòng BaiLam phòng thi (ghép 2 ô khi bài có code dài) */
function PTA_ansOf(row) { var b = row.TraLoi2 == null ? '' : String(row.TraLoi2); return U_str(row.TraLoi) + b.replace(/^~/, '').replace(/~$/, ''); }

/** XEM BÀI ĐANG LÀM của 1 thí sinh (bản tự lưu / bài nộp mới nhất), kèm đúng/sai từng câu — chỉ giám thị thấy */
function PTA_peek(maKyThi, sbd) {
  Repo_clearCache();
  sbd = U_upper(sbd);
  var room = PTA_room(false), cfg = Repo_config(), exRow = Repo_examRow(maKyThi);
  var st = PTA_students(room, maKyThi, sbd === PTA_THU_SBD).filter(function (s) { return U_upper(s.SBD) === sbd; })[0];
  if (!st) throw new Error('Không có thí sinh ' + sbd);
  var since = PTA_isThu(st) ? U_num(st.BatDau, 0) : 0;            // thi thử: chỉ lượt hiện tại (lượt cũ bị bỏ khi bấm "Làm lại")
  var rows = S_read(room, RSH.BAI_LAM).filter(function (x) { return U_str(x.MaKyThi) === maKyThi && U_upper(x.SBD) === sbd && !/^HUY_/.test(U_upper(x.Loai)) && (!since || U_num(x.ThoiGian, 0) >= since); });
  if (PTA_isThu(st) && !since) rows = [];
  var best = null;
  rows.forEach(function (x) { if (!best || U_num(x.Seq, 0) > U_num(best.Seq, 0) || (U_num(x.Seq, 0) === U_num(best.Seq, 0) && U_num(x.ThoiGian, 0) > U_num(best.ThoiGian, 0))) best = x; });
  var md = U_str(st.MaDe);
  var items = Repo_items(maKyThi).filter(function (x) { return U_str(x.MaDe) === md; }).sort(function (a, b) { return Number(a.STT) - Number(b.STT); });
  var web = {};
  try { web = best ? JSON.parse(PTA_ansOf(best) || '{}') : {}; } catch (e) { }
  var g = Grade_submission(PK_webItems(items), PK_toGradeAnswers(web, items), Repo_sections(exRow), Grade_reviewMap(Repo_reviews(maKyThi), maKyThi), U_num(cfg.LAM_TRON, 2));
  var okMap = {};
  (g.perItem || []).forEach(function (p) { okMap[Number(p.stt)] = p; });
  var list = items.map(function (it) {
    var one = PK_answerString(web, [it]).replace(/^\d+/, '');
    var p = okMap[Number(it.STT)] || {};
    return { stt: Number(it.STT), dang: U_str(it.DangCau), ans: one === '-' ? '' : one.replace(/^[:=]/, ''), key: U_str(it.DapAnMaDe), ok: one === '-' ? null : !!p.ok };
  });
  // lập trình: điểm tốt nhất từng bài + code bản lưu cuối
  var lt = [], ltSt = {};
  try { ltSt = JSON.parse(U_str(st.LtDiem) || '{}') || {}; } catch (e) { }
  LT_examCfg(exRow).bai.forEach(function (b, i) {
    var s = ltSt[b.ma] || {}, c = web['L' + (i + 1)] || {};
    lt.push({ ma: b.ma, diem: U_num(s.d, 0), max: b.diem, n: U_num(s.n, 0), lang: c.l || s.lang || '', code: String(c.c || '') });
  });
  var ltSum = lt.reduce(function (a, x) { return a + x.diem; }, 0);
  return { sbd: sbd, hoTen: U_str(st.HoTen), maDe: md, tt: U_str(st.TrangThai), savedAt: best ? U_num(best.ThoiGian, 0) : 0, kind: best ? U_str(best.Loai) : '',
    seq: best ? U_num(best.Seq, 0) : 0, total: U_round(g.total + ltSum, 2), max: (Repo_sections(exRow) || []).reduce(function (a, s) { return a + Number(s.diem || 0); }, 0) + LT_total(exRow), items: list, lt: lt };
}

/** KIỂM TRA TRƯỚC GIỜ THI: liệt kê mọi điểm còn thiếu để buổi thi không gặp sự cố */
function PTA_check(maKyThi) {
  var out = [], add = function (ok, text, level) { out.push({ ok: !!ok, level: ok ? 'ok' : (level || 'err'), text: text }); };
  var url = PTA_webUrl();
  add(!!PTA_roomId(), 'File dữ liệu phòng thi đã tạo');
  add(!!url, url ? 'Đã có link phòng thi' : 'Chưa nhập link Web App phòng thi (mục A)');
  if (!PTA_roomId()) return out;
  var room = PTA_room(false), r = PTA_examRow(room, maKyThi);
  add(!!r, r ? 'Đề đã phát lên phòng thi' : 'Chưa phát đề lên phòng thi (mục B)');
  if (!r) return out;
  var hubSt = Repo_students(maKyThi), roomSt = PTA_students(room, maKyThi);
  add(hubSt.length > 0, hubSt.length + ' thí sinh trong danh sách');
  var notRoom = hubSt.filter(function (s) { return !roomSt.some(function (x) { return U_upper(x.SBD) === U_upper(s.SBD); }); });
  add(!notRoom.length, notRoom.length ? notRoom.length + ' thí sinh mới chưa có trên phòng thi (' + notRoom.slice(0, 5).map(function (s) { return s.SBD; }).join(', ') + ') → bấm Phát đề lại' : 'Danh sách thí sinh trên phòng thi khớp tab ④');
  var noCode = roomSt.filter(function (s) { return !U_str(s.MaTruyCap) || !U_str(s.MaDe); });
  add(!noCode.length, noCode.length ? noCode.length + ' thí sinh thiếu mã truy cập / mã đề' : 'Mọi thí sinh có mã truy cập và mã đề');
  var pkgCodes = {};
  S_read(room, RSH.GOI_DE).forEach(function (x) { if (U_str(x.MaKyThi) === maKyThi && U_str(x.PhienBan) === U_str(r.PhienBanGoi)) pkgCodes[U_str(x.MaDe)] = true; });
  var noPkg = roomSt.filter(function (s) { return !pkgCodes[U_str(s.MaDe)]; });
  add(!noPkg.length, noPkg.length ? noPkg.length + ' thí sinh có mã đề chưa có gói đề → Phát đề lại' : 'Gói đề đủ cho mọi mã đề');
  add(U_num(r.ThoiGianPhut, 0) > 0, U_num(r.ThoiGianPhut, 0) > 0 ? 'Thời gian làm bài ' + U_num(r.ThoiGianPhut, 0) + ' phút' : 'Thời gian làm bài = 0 (không giới hạn) — đặt ở tab ③ rồi Phát đề lại', 'warn');
  var hen = U_num(r.HenDong, 0);
  add(!hen || hen > Date.now(), hen ? (hen > Date.now() ? 'Hẹn tự đóng lúc ' + PTA_fmt(hen).substring(11, 16) : 'Giờ "Hẹn tự đóng" đã qua — thí sinh vào sẽ bị nộp ngay! Xoá ở mục B') : 'Không hẹn tự đóng (đóng bằng tay)', 'err');
  add(!!PTA_sebXmlOf(r), PTA_sebXmlOf(r) ? 'Đã tạo file .seb' : 'Chưa tạo file .seb (mục C)', 'warn');
  add(U_bool(r.BatBuocSEB, false), U_bool(r.BatBuocSEB, false) ? 'Bắt buộc dùng SEB' : 'Chưa bắt buộc SEB — thí sinh có thể làm bằng trình duyệt thường', 'warn');
  if (PTA_sebXmlOf(r)) {
    var sx = PTA_sebXmlOf(r);
    add(/<key>strongKill<\/key>\s*<true\/>/.test(sx) && /<key>lockdownModePolicy<\/key>\s*<integer>2/.test(sx),
      /<key>strongKill<\/key>\s*<true\/>/.test(sx) ? 'File .seb: buộc đóng ứng dụng cấm + khoá máy (Windows màn hình riêng, macOS Assessment Mode)' : 'File .seb tạo từ bản cũ: chỉ HỎI đóng ứng dụng, không buộc đóng → tạo lại file .seb (mục C)', 'warn');
    var stu4 = PTA_students(room, maKyThi), withKey = stu4.filter(function (x) { return U_str(x.SebKey); });
    var ch = U_str(r.SebKeyChuan).toLowerCase();
    if (ch) {
      var bad = withKey.filter(function (x) { return U_str(x.SebKey).toLowerCase() !== ch; });
      add(!bad.length, bad.length ? bad.length + ' máy có cấu hình SEB KHÁC máy chuẩn: ' + bad.slice(0, 6).map(function (x) { return U_str(x.SBD); }).join(', ') : 'Đã chọn máy chuẩn cấu hình SEB — máy khác cấu hình bị chặn đăng nhập', 'warn');
    } else if (withKey.length) add(false, 'Chưa chọn máy chuẩn cấu hình SEB: mở 1 máy bằng file .seb mới → ⚙ Điều khiển máy đó › 📌 Lấy làm chuẩn', 'warn');
  }
  // bài lập trình: có test trên phòng thi, đã kiểm thử đề, máy chấm chạy được
  var ltc = LT_examCfg(Repo_examRow(maKyThi));
  if (ltc.bai.length) {
    var ltRoomCfg = null; try { ltRoomCfg = JSON.parse(U_str(r.LapTrinh) || 'null'); } catch (e) { }
    var miss = ltc.bai.filter(function (b) { return !ltRoomCfg || !ltRoomCfg.bai || !ltRoomCfg.bai[b.ma]; });
    add(!miss.length, miss.length ? 'Bài lập trình chưa có trên phòng thi: ' + miss.map(function (b) { return b.ma; }).join(', ') + ' → Phát đề lại' : ltc.bai.length + ' bài lập trình đã có trên phòng thi');
    var lst = LT_list(), notOk = ltc.bai.filter(function (b) { var p = lst.filter(function (x) { return x.ma === b.ma; })[0]; return !p || !/^ĐẠT/.test(p.kiemThu); });
    add(!notOk.length, notOk.length ? 'Bài chưa "Kiểm thử đề" đạt: ' + notOk.map(function (b) { return b.ma; }).join(', ') + ' (tab ⑧)' : 'Mọi bài lập trình đã kiểm thử đề đạt', 'warn');
    var tj = { ok: false };
    try { tj = LT_testJudge(); } catch (e) { tj = { ok: false, err: e.message }; }
    add(tj.ok, tj.ok ? 'Máy chấm ' + tj.p + ' chạy được Python & C' : 'Máy chấm ' + (tj.p || '') + ' chưa chạy được — tab ⑧ › 🔍 Kiểm tra máy chấm');
  }
  PTA_pushCode(room);
  var pg = PTA_ping(true);
  add(pg.bootOk, pg.bootOk ? 'Bộ khởi động phòng thi v' + pg.boot + ' đã triển khai đúng (link trả lời được)' : (pg.error || 'Bộ khởi động chưa đúng'));
  if (ltc.bai.length && pg.bootOk) add(pg.bootLt, Number(pg.boot) >= 3 ? 'Bộ khởi động hỗ trợ chấm code (v3)' : 'Thi lập trình cần bộ khởi động v3: dán lại PhongThi.gs mới, chạy hàm doGet 1 lần để cấp quyền "kết nối dịch vụ bên ngoài", rồi Triển khai › Phiên bản mới');
  if (pg.bootOk) add(pg.coreOk, pg.coreOk ? 'Máy thí sinh sẽ chạy mã mới nhất v' + pg.core : 'Mã phòng thi vừa được đẩy, đang chờ phòng thi nhận (≤ 20 giây) — bấm Kiểm tra lại', 'warn');
  if (PTA_sebXmlOf(r) && url) {
    var m0 = PTA_sebXmlOf(r).match(/<key>startURL<\/key>\s*<string>([^<]*)<\/string>/);
    var su = m0 ? m0[1].replace(/&amp;/g, '&') : '';
    add(!su || su === url, su === url ? 'File .seb trỏ đúng link phòng thi hiện tại' : 'File .seb đang trỏ link KHÁC link phòng thi hiện tại → thí sinh mở file cũ sẽ vào mã cũ. Tạo lại file .seb (mục C) và phát lại cho máy thi');
  }
  // thí sinh đăng nhập mà nhật ký không có dấu phiên bản → máy đó đang vào bằng mã/link CŨ
  var tail = PTA_tail(room, RSH.NHAT_KY, 3000).filter(function (e) { return U_str(e.MaKyThi) === maKyThi && /^(VAO|VAO_LAI)$/.test(U_str(e.SuKien)) && U_num(e.ThoiGian, 0) > Date.now() - 6 * 3600000; });
  var oldLogins = tail.filter(function (e) { var m = U_str(e.ChiTiet).match(/^pt v([\d.]+)/); return !m || m[1] !== APP.PT_VERSION; });
  if (tail.length) add(!oldLogins.length, oldLogins.length ? oldLogins.length + ' lượt đăng nhập gần đây chạy mã CŨ (' + oldLogins.slice(-4).map(function (e) { return U_str(e.SBD); }).join(', ') + ') — máy đó dùng file .seb / link cũ' : 'Mọi lượt đăng nhập gần đây chạy đúng mã v' + APP.PT_VERSION);
  add(U_upper(r.TrangThai) !== 'DONG', U_upper(r.TrangThai) === 'DONG' ? 'Phòng thi đang ĐÓNG' : 'Phòng thi: ' + (U_upper(r.TrangThai) === 'MO' ? 'ĐANG MỞ' : 'chưa mở (sẵn sàng)'), 'warn');
  return out;
}

function PTA_events(maKyThi, sbd) {
  var room = PTA_room(false);
  return PTA_tail(room, RSH.NHAT_KY, 6000).filter(function (e) { return U_str(e.MaKyThi) === maKyThi && (sbd ? U_upper(e.SBD) === U_upper(sbd) : U_upper(e.SBD) !== PTA_THU_SBD); })
    .slice(-300).map(function (e) { return { t: U_num(e.ThoiGian, 0), sbd: U_str(e.SBD), k: U_str(e.SuKien), d: U_str(e.ChiTiet) }; });
}

/* ------------------------------------------------------------------ thu bài & chấm */

function PTA_fmt(ms) { return ms ? Utilities.formatDate(new Date(Number(ms)), APP.TZ, 'yyyy-MM-dd HH:mm:ss') : ''; }

/** Thu bài từ phòng thi (bài đã nộp; ai chưa nộp thì lấy bản tự lưu mới nhất) → chấm → ghi BaiLam (Trung tâm) */
function PTA_collect(maKyThi) {
  return S_withLock(function () {
    Repo_clearCache();
    var hub = S_hub(), cfg = Repo_config();
    var room = PTA_room(false);
    var exRow = Repo_examRow(maKyThi);
    var rEx = PTA_examRow(room, maKyThi) || {};
    var sections = Repo_sections(exRow);
    var reviews = Grade_reviewMap(Repo_reviews(maKyThi), maKyThi);
    var digits = U_num(cfg.LAM_TRON, 2);
    var byV = U_groupBy(Repo_items(maKyThi), function (x) { return x.MaDe; });
    var stMap = {};
    PTA_students(room, maKyThi).forEach(function (s) { stMap[U_upper(s.SBD)] = s; });
    var subs = S_read(room, RSH.BAI_LAM).filter(function (x) { return U_str(x.MaKyThi) === maKyThi && U_upper(x.SBD) !== PTA_THU_SBD; });   // bỏ bài thi thử của giám thị
    var bySbd = U_groupBy(subs, function (x) { return U_upper(x.SBD); });
    var rows = [], kinds = { NOP: 0, NOP_TRE: 0, TU_THU: 0, GIAY: 0, TRONG: 0 }, bad = [], webBySbd = {}, banSet = {};
    var hasLt = LT_examCfg(exRow).bai.length > 0;
    // đã bắt đầu làm nhưng chưa lưu được câu nào → bài trống (0 điểm, có cảnh báo) thay vì "vắng"
    Object.keys(stMap).forEach(function (sbd) {
      var s = stMap[sbd];
      if (U_num(s.BatDau, 0) && !bySbd[sbd]) bySbd[sbd] = [{ Loai: 'TRONG', ThoiGian: U_str(s.NopLuc) || U_str(s.LanCuoi) || U_str(s.BatDau), MaDe: s.MaDe, TraLoi: '{}', Seq: 0 }];
    });
    Object.keys(bySbd).forEach(function (sbd) {
      var pick = PK_pickFinal(bySbd[sbd]);
      if (!pick && U_upper(bySbd[sbd][0].Loai) === 'TRONG') pick = { row: bySbd[sbd][0], kind: 'TRONG' };
      if (!pick) return;
      var st = stMap[sbd] || {};
      var md = U_str(pick.row.MaDe) || U_str(st.MaDe);
      var items = byV[md] || (hasLt ? [] : null);
      if (!items) { bad.push(sbd + ' (mã đề ' + md + ' không có trong kỳ thi)'); return; }
      var web = {};
      try { web = JSON.parse(PTA_ansOf(pick.row) || '{}'); } catch (e) { bad.push(sbd + ': dữ liệu bài làm hỏng'); }
      var banned = U_upper(st.CamThi) === 'CO';
      webBySbd[sbd] = web; if (banned) banSet[sbd] = true;
      var ans = banned ? {} : PK_toGradeAnswers(web, items);    // đình chỉ thi → 0 điểm (bài làm vẫn lưu ở file phòng thi)
      ans.__SBD = sbd; ans.__HOTEN = U_str(st.HoTen);
      var g = GR_row(maKyThi, md, PTA_WEB_PREFIX + sbd + '-' + pick.kind, PTA_fmt(pick.row.ThoiGian), ans, '__SBD', '__HOTEN',
        PK_webItems(items), sections, reviews, digits, exRow);
      var flags = [];
      if (banned) flags.push('ĐÌNH CHỈ THI — 0 điểm' + (U_str(st.LyDoCam) ? ' (' + U_str(st.LyDoCam) + ')' : ''));
      if (pick.kind === 'TU_THU') flags.push('Không bấm nộp — hệ thống thu bản tự lưu lúc ' + PTA_fmt(pick.row.ThoiGian).substring(11));
      if (pick.kind === 'NOP_TRE') flags.push('Nộp trễ sau hết giờ');
      if (pick.kind === 'GIAY') flags.push('Bài làm trên giấy (nhập tay)');
      if (pick.kind === 'TRONG') flags.push('Có vào thi nhưng chưa lưu được câu trả lời nào');
      var vp = U_num(st.ViPham, 0);
      if (vp) flags.push('Rời màn hình thi ' + vp + ' lần');
      if (U_num(st.SoLanVao, 0) > 1) flags.push('Đăng nhập ' + U_num(st.SoLanVao, 0) + ' lần');
      if (U_bool(rEx.BatBuocSEB, false) && U_str(st.SEB) !== 'CO') flags.push('Không dùng SEB');
      g.CanhBaoThem = flags.join(' | ');
      rows.push(g);
      kinds[pick.kind] = (kinds[pick.kind] || 0) + 1;
    });
    S_ensureSheet(hub, SH.BAI_LAM, HEADERS[SH.BAI_LAM]);
    S_replaceWhere(hub, SH.BAI_LAM, function (x) { return U_str(x.MaKyThi) === maKyThi && /^WEB-/.test(U_str(x.ResponseId)); }, rows);
    S_log('PHONG_THI_THU_BAI', maKyThi + ': ' + rows.length + ' bài ' + JSON.stringify(kinds));
    var lt = hasLt ? LT_collect(maKyThi, room, webBySbd, banSet) : null;
    if (lt && lt.errors && lt.errors.length) bad = bad.concat(lt.errors.map(function (e) { return 'Lập trình ' + e; }));
    return { count: rows.length, kinds: kinds, errors: bad, lt: lt };
  });
}

/** Nhập bài làm trên giấy (phương án dự phòng khi mất mạng/hỏng máy) — chấm như bài trực tuyến */
function PTA_manual(maKyThi, sbd, text, dryRun) {
  Repo_clearCache();
  sbd = U_upper(sbd);
  var st = Repo_students(maKyThi).filter(function (s) { return U_upper(s.SBD) === sbd; })[0];
  if (!st) throw new Error('Không có SBD ' + sbd + ' trong kỳ thi');
  if (!st.MaDe) throw new Error('Thí sinh chưa được phân mã đề');
  var items = Repo_items(maKyThi).filter(function (x) { return x.MaDe === st.MaDe; });
  var p = PK_parseManual(text, items);
  var out = { sbd: sbd, hoTen: U_str(st.HoTen), maDe: st.MaDe, nCau: items.length, count: p.count, errors: p.errors,
    normalized: PK_answerString(p.answers, items) };
  if (dryRun || p.errors.length) return out;
  return S_withLock(function () {
    var cfg = Repo_config(), exRow = Repo_examRow(maKyThi);
    var ans = PK_toGradeAnswers(p.answers, items);
    ans.__SBD = sbd; ans.__HOTEN = U_str(st.HoTen);
    var g = GR_row(maKyThi, st.MaDe, PTA_PAPER_PREFIX + sbd, S_now(), ans, '__SBD', '__HOTEN', PK_webItems(items), Repo_sections(exRow),
      Grade_reviewMap(Repo_reviews(maKyThi), maKyThi), U_num(cfg.LAM_TRON, 2), exRow);
    g.CanhBaoThem = 'Bài làm trên giấy (nhập tay bởi ' + (S_user() || 'giám thị') + ')';
    S_ensureSheet(S_hub(), SH.BAI_LAM, HEADERS[SH.BAI_LAM]);
    S_replaceWhere(S_hub(), SH.BAI_LAM, function (x) { return U_str(x.MaKyThi) === maKyThi && U_str(x.ResponseId) === PTA_PAPER_PREFIX + sbd; }, [g]);
    S_log('NHAP_BAI_GIAY', maKyThi + ' ' + sbd + ': ' + p.count + ' câu');
    out.saved = true; out.tongDiem = g.TongDiem;
    return out;
  });
}

/* ------------------------------------------------------------------ Safe Exam Browser */

function PTA_seb(maKyThi, o) {
  o = o || {};
  var url = PTA_webUrl();
  if (!url) throw new Error('Chưa nhập Link Web App phòng thi.');
  var room = PTA_room(false);
  var r = PTA_examRow(room, maKyThi);
  if (!r) throw new Error('Chưa phát đề lên phòng thi.');
  var key = U_str(r.KhoaUA) || U_randomId(10);
  var pw = U_str(o.quitPassword);
  var hash = pw ? PK_hex(Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, pw, Utilities.Charset.UTF_8)) : '';
  var quit = url + '?p=thoat';
  // âm thanh: AUTO = chỉ giữ tiếng khi đề có câu nghe
  var amThanh = U_upper(o.audio || 'AUTO'), hasAudio = PTA_examHasAudio(room, maKyThi);
  var keepAudio = amThanh === 'GIU' || (amThanh === 'AUTO' && hasAudio);
  var groups = Array.isArray(o.groups) ? o.groups.filter(function (g) { return PK_APP_GROUPS.some(function (x) { return x[0] === g; }); }) : null;
  var xml = PK_sebXml({ startURL: url, quitURL: quit, quitHash: hash, uaSuffix: ' PhongThi/' + key, urlFilter: !!o.urlFilter,
    blockApps: o.blockApps !== false, macMenuBar: !!o.macMenuBar, groups: groups, extraApps: U_str(o.extraApps), forceQuit: o.forceQuit !== false,
    macAAC: o.macAAC !== false, keepAudio: keepAudio });
  // cấu hình đổi ⇒ mã cấu hình SEB đổi ⇒ bỏ "máy chuẩn" cũ (chọn lại sau khi 1 máy mở file .seb mới)
  var patch = { KhoaUA: key, ThoatURL: quit, CapNhat: String(Date.now()), SebKeyChuan: '' };
  // Google Sheets giới hạn 50.000 ký tự/ô → chia file .seb ra tối đa 4 ô (mỗi ô ≤ 45.000)
  var parts = PK_chunks(xml, 45000);
  if (parts.length > 4) throw new Error('Cấu hình SEB quá dài (' + xml.length + ' ký tự) — bớt ứng dụng ở ô "Chặn thêm".');
  ['SebXml', 'SebXml2', 'SebXml3', 'SebXml4'].forEach(function (k, i) { patch[k] = parts[i] ? '~' + parts[i] + '~' : ''; });  // '~' 2 đầu: giữ nguyên xuống dòng ở mép mảnh
  PTA_ensureCols(room);
  if (o.batBuocSEB !== undefined) patch.BatBuocSEB = o.batBuocSEB ? 'CO' : 'KHONG';
  S_update(room, RSH.KY_THI, function (x) { return U_str(x.MaKyThi) === maKyThi; }, patch);
  var fileUrl = '';
  try {
    var folder = FX_examFolder(Repo_examRow(maKyThi));
    var name = 'PhongThi_' + maKyThi + '.seb';
    var old = folder.getFilesByName(name);
    while (old.hasNext()) { try { old.next().setTrashed(true); } catch (e) { break; } }
    var f = folder.createFile(Utilities.newBlob(xml, 'application/seb', name));
    fileUrl = f.getUrl ? f.getUrl() : '';
  } catch (e) { /* vẫn trả nội dung để tải trực tiếp */ }
  S_log('PHONG_THI_SEB', maKyThi + (pw ? ' (có mật khẩu thoát)' : ''));
  return { xml: xml, fileName: 'PhongThi_' + maKyThi + '.seb', fileUrl: fileUrl, sebsUrl: url.replace(/^https:/, 'sebs:') + '?seb=' + encodeURIComponent(maKyThi),
    hasQuitPassword: !!pw, blockApps: o.blockApps !== false, macMenuBar: !!o.macMenuBar, keepAudio: keepAudio, hasAudio: hasAudio,
    nApps: o.blockApps !== false ? PK_blockedApps(groups, U_str(o.extraApps), true).length : 0, forceQuit: o.forceQuit !== false, macAAC: o.macAAC !== false,
    groups: (groups || PK_APP_GROUPS.map(function (g) { return g[0]; })) };
}
/** Mã mở khoá giám thị (6 số, dễ đọc to) */
function PTA_newUnlock() { var s = ''; for (var i = 0; i < 6; i++) s += Math.floor(Math.random() * 10); return s; }
function PTA_unlockCode(maKyThi, renew) {
  var room = PTA_room(false), r = PTA_examRow(room, maKyThi);
  if (!r) throw new Error('Chưa phát đề lên phòng thi.');
  var code = U_str(r.MaMoKhoa);
  if (renew || !code) { code = PTA_newUnlock(); PTA_ensureCols(room); S_update(room, RSH.KY_THI, function (x) { return U_str(x.MaKyThi) === maKyThi; }, { MaMoKhoa: code, CapNhat: String(Date.now()) }); S_log('PHONG_THI_MA_MO_KHOA', maKyThi); }
  return { code: code };
}
/** Ghép lại file .seb đã chia nhiều ô */
function PTA_sebXmlOf(r) { return r ? ['SebXml', 'SebXml2', 'SebXml3', 'SebXml4'].map(function (k) { return String(r[k] == null ? '' : r[k]).replace(/^~|~$/g, ''); }).join('') : ''; }
/** Đề đã phát có câu nghe (âm thanh) không — đọc thẳng gói đề trên phòng thi */
function PTA_examHasAudio(room, maKyThi) {
  try {
    var rows = S_read(room, RSH.GOI_DE).filter(function (x) { return U_str(x.MaKyThi) === maKyThi; });
    return rows.some(function (x) { return /"audio":"[^"]/.test(U_str(x.DuLieu)); });
  } catch (e) { return false; }
}
/** Danh sách nhóm ứng dụng chặn (cho bảng điều khiển) */
function PTA_appGroups() { return PK_APP_GROUPS.map(function (g) { return { id: g[0], ten: g[1], nMac: g[2].length, nWin: g[3].length }; }); }
/** Lấy mã cấu hình SEB của 1 máy đã đăng nhập làm "chuẩn" (sbd rỗng = bỏ chuẩn) */
function PTA_sebRef(maKyThi, sbd) {
  var room = PTA_room(false);
  if (!PTA_examRow(room, maKyThi)) throw new Error('Chưa phát đề lên phòng thi.');
  var key = '';
  if (sbd) {
    var s = PTA_students(room, maKyThi).filter(function (x) { return U_upper(x.SBD) === U_upper(sbd); })[0];
    if (!s) throw new Error('Không thấy thí sinh ' + sbd);
    key = U_str(s.SebKey).toLowerCase();
    if (!key) throw new Error('Máy của ' + sbd + ' chưa báo mã cấu hình SEB (chưa vào bằng SEB, hoặc SEB quá cũ / không hỗ trợ). Không thể lấy làm chuẩn.');
  }
  S_update(room, RSH.KY_THI, function (x) { return U_str(x.MaKyThi) === maKyThi; }, { SebKeyChuan: key, CapNhat: String(Date.now()) });
  S_log('PHONG_THI_SEB_CHUAN', maKyThi + ' ' + (key ? sbd + ' ' + key.substring(0, 12) : '(bỏ chuẩn)'));
  return { chuan: key };
}

/* ------------------------------------------------------------------ in đề / phiếu / PDF */

/** Dữ liệu in: đề từng mã đề (có đáp án cho trang đáp án của giáo viên) */
function PTA_printData(maKyThi, maDe) {
  Repo_clearCache();
  var cfg = Repo_config(), exRow = Repo_examRow(maKyThi), exam = Gen_examFromRow(exRow);
  var bank = Repo_bank(exam.maMon), sections = Repo_sections(exRow);
  var byV = U_groupBy(Repo_items(maKyThi), function (x) { return x.MaDe; });
  var codes = Object.keys(byV).sort().filter(function (md) { return !maDe || md === String(maDe); });
  if (!codes.length) throw new Error('Chưa có mã đề (hãy sinh đề).');
  var media = PTA_media({});
  var variants = codes.map(function (md) {
    return PK_build({ exRow: exRow, cfg: cfg, sections: sections, items: byV[md], bank: bank, maDe: md,
      bilingual: U_bool(cfg.SONG_NGU, true), media: media, withKey: true });
  });
  var subj = Repo_subjects().filter(function (s) { return s.maMon === exam.maMon; })[0] || {};
  return { donVi: U_str(cfg.TEN_DON_VI), ten: exam.ten, mon: subj.ten || exam.maMon, thoiGian: exam.thoiGian,
    ngayThi: U_str(exRow.NgayThi), huongDan: U_str(cfg.HUONG_DAN_DE), variants: variants, stage: U_str(exRow.TrangThai) };
}

/** Phiếu đăng nhập (SBD + mã truy cập) để cắt phát cho thí sinh */
function PTA_cards(maKyThi) {
  var room = PTA_room(false);
  var r = PTA_examRow(room, maKyThi);
  if (!r) throw new Error('Chưa phát đề lên phòng thi.');
  return { ten: U_str(r.TenKyThi), donVi: U_str(r.DonVi), url: PTA_webUrl(), maPhong: U_str(r.MaPhong), thoiGian: U_num(r.ThoiGianPhut, 0),
    students: PTA_students(room, maKyThi).map(function (s) {
      return { sbd: U_str(s.SBD), hoTen: U_str(s.HoTen), lop: U_str(s.Lop), maDe: U_str(s.MaDe), code: U_str(s.MaTruyCap) };
    }) };
}

/* ---- PDF trên Drive (Google Docs → PDF). Công thức phức tạp thành ảnh, code dùng phông chữ đều. ---- */

function PTA_pdf(maKyThi, maDe, kind) {
  var data = PTA_printData(maKyThi, kind === 'DAP_AN' ? '' : maDe);
  var exRow = Repo_examRow(maKyThi), cfg = Repo_config();
  var folder = FX_examFolder(exRow);
  var name = kind === 'DAP_AN' ? 'DapAn_' + maKyThi : 'De_' + maKyThi + '_Ma' + maDe;
  [name, name + '.pdf'].forEach(function (n) {
    var it = folder.getFilesByName(n);
    while (it.hasNext()) { try { it.next().setTrashed(true); } catch (e) { break; } }
  });
  var doc = DocumentApp.create(name);
  var body = doc.getBody();
  FX_try(function () { body.setPageWidth(595.28).setPageHeight(841.89); });
  body.setMarginTop(34).setMarginBottom(34).setMarginLeft(42).setMarginRight(36);
  var ctx = { body: body, cfg: cfg, warnings: [] };
  if (kind === 'DAP_AN') PD_keyDoc(ctx, data);
  else PD_examDoc(ctx, data, data.variants[0]);
  var first = body.getChild(0);
  FX_try(function () { if (first && body.getNumChildren() > 1 && first.asParagraph && first.asParagraph().getText() === '') body.removeChild(first); });
  doc.saveAndClose();
  var file = DriveApp.getFileById(doc.getId());
  FX_try(function () { file.moveTo(folder); });
  var pdf = folder.createFile(file.getAs('application/pdf').setName(name + '.pdf'));
  S_log('IN_PDF', maKyThi + ' ' + (kind || 'DE') + ' ' + (maDe || ''));
  return { name: name, docUrl: doc.getUrl(), pdfUrl: pdf.getUrl ? pdf.getUrl() : '', warnings: ctx.warnings };
}

function PD_para(ctx, text, o) {
  o = o || {};
  var p = ctx.body.appendParagraph('');
  if (text) PD_rich(ctx, p, text, o);
  FX_try(function () { p.setSpacingAfter(o.after === undefined ? 2 : o.after).setSpacingBefore(o.before || 0).setLineSpacing(1.1); });
  if (o.align) FX_try(function () { p.setAlignment(o.align); });
  return p;
}

/** Ghi chuỗi có $…$ vào đoạn: công thức đơn giản → chữ, phức tạp → ảnh nội dòng */
function PD_rich(ctx, p, s, o) {
  o = o || {};
  LX_segments(U_str(s)).forEach(function (sg) {
    if (sg.type === 'text') { if (sg.value) PD_txt(p.appendText(sg.value), o); return; }
    if (!LX_needsImage(sg)) { PD_txt(p.appendText(LX_toUnicode(sg.value).text), o); return; }
    try {
      var img = p.appendInlineImage(FX_latexBlob(sg.value, ctx.cfg));
      PD_scale(img, sg.type === 'display' ? 0.5 : 0.45, 470);
    } catch (e) { ctx.warnings.push('Công thức ' + sg.value + ': ' + e.message); PD_txt(p.appendText(sg.value), o); }
  });
}

function PD_txt(t, o) {
  FX_try(function () { t.setFontFamily(o.font || 'Times New Roman').setFontSize(o.size || 12).setBold(!!o.bold).setItalic(!!o.italic); });
  return t;
}

function PD_scale(img, k, maxW) {
  FX_try(function () {
    var w = img.getWidth() * k, h = img.getHeight() * k;
    if (w > maxW) { h = h * maxW / w; w = maxW; }
    img.setWidth(Math.round(w)).setHeight(Math.round(h));
  });
}

/** Văn bản câu hỏi: tách khối code ``` để in phông chữ đều trong khung */
function PD_block(ctx, text, lead) {
  var parts = U_str(text).replace(/\r\n?/g, '\n').split(/```[\w+#.-]*[ \t]*\n([\s\S]*?)\n[ \t]*```/);
  var first = true;
  parts.forEach(function (part, i) {
    if (i % 2 === 1) { PD_code(ctx, part); return; }
    part.split('\n').forEach(function (line, j, arr) {
      if (!line.trim() && !(first && lead)) { if (j > 0 && j < arr.length - 1) PD_para(ctx, '', { after: 0 }); return; }
      var p = ctx.body.appendParagraph('');
      if (first && lead) { PD_txt(p.appendText(lead), { bold: true }); first = false; }
      PD_rich(ctx, p, line);
      FX_try(function () { p.setSpacingAfter(2).setSpacingBefore(0).setLineSpacing(1.1); });
    });
  });
  if (first && lead) { var p0 = ctx.body.appendParagraph(''); PD_txt(p0.appendText(lead), { bold: true }); }
}

function PD_code(ctx, code) {
  var t = ctx.body.appendTable([['']]);
  FX_try(function () { t.setBorderColor('#9aa7b5').setBorderWidth(0.5); });
  var cell = t.getCell(0, 0);
  FX_try(function () { cell.setBackgroundColor('#f3f5f8').setPaddingTop(4).setPaddingBottom(4).setPaddingLeft(6); });
  LX_decodeEntities(code).replace(/\t/g, '    ').split('\n').forEach(function (line, i) {
    var p = i === 0 ? cell.getChild(0).asParagraph() : cell.appendParagraph('');
    PD_txt(p.appendText(line.replace(/ /g, ' ') || ' '), { font: 'Courier New', size: 10 });
    FX_try(function () { p.setSpacingAfter(0).setSpacingBefore(0).setLineSpacing(1); });
  });
}

function PD_media(ctx, list) {
  (list || []).forEach(function (m) {
    if (!m.src) return;
    try {
      var b64 = m.src.substring(m.src.indexOf(',') + 1), type = m.src.substring(5, m.src.indexOf(';'));
      var img = ctx.body.appendParagraph('').appendInlineImage(Utilities.newBlob(Utilities.base64Decode(b64), type, 'h'));
      PD_scale(img, 0.6, 420);
    } catch (e) { ctx.warnings.push('Ảnh: ' + e.message); }
  });
}

function PD_plainLen(s) { return U_str(s).replace(/\$[^$]*\$/g, 'xxxxxx').length; }

function PD_examDoc(ctx, data, v) {
  var b = ctx.body;
  var head = b.appendTable([[U_upper(data.donVi || ''), U_upper(data.ten || 'ĐỀ THI')], ['ĐỀ CHÍNH THỨC', 'Môn: ' + data.mon +
    '\nThời gian làm bài: ' + (data.thoiGian || '…') + ' phút (không kể thời gian phát đề)']]);
  FX_try(function () {
    head.setBorderWidth(0);
    [0, 1].forEach(function (r) { [0, 1].forEach(function (c) {
      var p = head.getCell(r, c).getChild(0).asParagraph();
      p.setAlignment(DocumentApp.HorizontalAlignment.CENTER);
      p.editAsText().setFontFamily('Times New Roman').setFontSize(r === 0 ? 12 : 11).setBold(r === 0);
    }); });
    head.getCell(0, 0).setWidth(220);
  });
  PD_para(ctx, 'Mã đề ' + v.maDe + '   ·   ' + v.soCau + ' câu   ·   ' + v.tongDiem + ' điểm', { bold: true, align: DocumentApp.HorizontalAlignment.CENTER, before: 6 });
  PD_para(ctx, 'Họ và tên thí sinh: ............................................................   Số báo danh: ........................', { before: 6, after: 6 });
  if (data.huongDan) PD_para(ctx, data.huongDan, { italic: true, size: 10 });
  var curSec = null, groupShown = {};
  v.items.forEach(function (it) {
    if (it.phan !== curSec) {
      curSec = it.phan;
      var s = v.sections.filter(function (x) { return x.phan === it.phan; })[0] || {};
      PD_para(ctx, 'PHẦN ' + s.phan + '. ' + U_upper(s.ten) + ' (' + s.n + ' câu · ' + s.diem + ' điểm · mỗi câu ' + s.moiCau + ' điểm)', { bold: true, before: 10, after: 2 });
      (s.dangs || []).forEach(function (d) { PD_para(ctx, '→ ' + PK_hint(d), { italic: true, size: 10 }); });
    }
    if (it.g && v.groups[it.g] && !groupShown[it.g]) {
      groupShown[it.g] = true;
      var g = v.groups[it.g];
      PD_para(ctx, 'Sử dụng thông tin sau để trả lời từ câu ' + g.from + ' đến câu ' + g.to + ':', { bold: true, italic: true, before: 6 });
      PD_block(ctx, g.vi);
      if (g.latex) PD_para(ctx, '$$' + g.latex + '$$', { align: DocumentApp.HorizontalAlignment.CENTER });
      PD_media(ctx, g.media);
    }
    PD_block(ctx, it.vi, 'Câu ' + it.stt + '. ');
    if (it.en) PD_block(ctx, it.en);
    if (it.latex) PD_para(ctx, '$$' + it.latex + '$$', { align: DocumentApp.HorizontalAlignment.CENTER });
    PD_media(ctx, it.media);
    PD_options(ctx, it);
  });
  PD_para(ctx, '------------ HẾT ------------', { bold: true, align: DocumentApp.HorizontalAlignment.CENTER, before: 12 });
  PD_para(ctx, 'Thí sinh không được sử dụng tài liệu. Giám thị không giải thích gì thêm.', { italic: true, size: 10, align: DocumentApp.HorizontalAlignment.CENTER });
  b.appendPageBreak();
  PD_sheet(ctx, data, v);
}

function PD_options(ctx, it) {
  var L = APP.LETTERS;
  if (it.dang === DANG.MOT_DA || it.dang === DANG.NHIEU_DA) {
    var maxLen = Math.max.apply(null, it.opts.map(function (o) { return PD_plainLen(o.vi) + (o.en ? PD_plainLen(o.en) + 3 : 0); }).concat([0]));
    var hasCode = it.opts.some(function (o) { return /```/.test(o.vi); });
    var cols = hasCode ? 1 : maxLen <= 16 ? 4 : maxLen <= 38 ? 2 : 1;
    if (cols === 1) { it.opts.forEach(function (o, i) { PD_block(ctx, o.vi + (o.en ? ' / ' + o.en : ''), L[i] + '. '); }); return; }
    var rows = [];
    for (var i = 0; i < it.opts.length; i += cols) { var r = []; for (var j = 0; j < cols; j++) r.push(''); rows.push(r); }
    var t = ctx.body.appendTable(rows);
    FX_try(function () { t.setBorderWidth(0); });
    it.opts.forEach(function (o, i) {
      var p = t.getCell(Math.floor(i / cols), i % cols).getChild(0).asParagraph();
      PD_txt(p.appendText(L[i] + '. '), { bold: true });
      PD_rich(ctx, p, o.vi + (o.en ? ' / ' + o.en : ''));
      FX_try(function () { p.setSpacingAfter(0); });
    });
  } else if (it.dang === DANG.DUNG_SAI) {
    var tb = ctx.body.appendTable([['Ý', 'Nội dung', 'Đúng', 'Sai']].concat(it.opts.map(function (o, i) { return [String.fromCharCode(97 + i) + ')', '', '☐', '☐']; })));
    FX_try(function () { tb.setBorderWidth(0.5); tb.getCell(0, 0).setWidth(28); tb.getCell(0, 2).setWidth(40); tb.getCell(0, 3).setWidth(40); });
    it.opts.forEach(function (o, i) { PD_rich(ctx, tb.getCell(i + 1, 1).getChild(0).asParagraph(), o.vi + (o.en ? ' / ' + o.en : '')); });
  } else if (it.dang === DANG.GHEP_NOI) {
    var n = Math.max(it.opts.length, it.right.length), rws = [];
    for (var k = 0; k < n; k++) rws.push(['', '']);
    var tg = ctx.body.appendTable(rws);
    FX_try(function () { tg.setBorderWidth(0.5); });
    it.opts.forEach(function (o, i) { var p = tg.getCell(i, 0).getChild(0).asParagraph(); PD_txt(p.appendText(L[i] + '. '), { bold: true }); PD_rich(ctx, p, o.vi); });
    it.right.forEach(function (o, i) { var p = tg.getCell(i, 1).getChild(0).asParagraph(); PD_txt(p.appendText((i + 1) + '. '), { bold: true }); PD_rich(ctx, p, o.vi); });
  } else if (it.dang === DANG.TRA_LOI_NGAN) {
    PD_para(ctx, 'Trả lời: ........................................................', { before: 2 });
  }
}

/** Phiếu trả lời (tô / ghi đáp án) */
function PD_sheet(ctx, data, v) {
  PD_para(ctx, 'PHIẾU TRẢ LỜI — ' + U_upper(data.ten || '') + ' — MÃ ĐỀ ' + v.maDe, { bold: true, size: 13, align: DocumentApp.HorizontalAlignment.CENTER });
  PD_para(ctx, 'Họ và tên: .........................................................   SBD: .....................   Chữ ký: ................', { before: 6, after: 4 });
  PD_para(ctx, 'Khoanh tròn đáp án chọn (câu nhiều đáp án: khoanh tất cả). Đúng/Sai: ghi Đ hoặc S cho từng ý. Ghép nối: ghi số. Trả lời ngắn: ghi kết quả.', { italic: true, size: 10, after: 6 });
  var cols = 3, per = Math.ceil(v.items.length / cols), rows = [];
  for (var r = 0; r < per; r++) {
    var row = [];
    for (var c = 0; c < cols; c++) {
      var it = v.items[c * per + r];
      if (!it) { row.push(''); continue; }
      var cell;
      if (it.dang === DANG.MOT_DA || it.dang === DANG.NHIEU_DA) cell = it.opts.map(function (o, i) { return '(' + APP.LETTERS[i] + ')'; }).join(' ');
      else if (it.dang === DANG.DUNG_SAI) cell = it.opts.map(function (o, i) { return String.fromCharCode(97 + i) + ':__'; }).join(' ');
      else if (it.dang === DANG.GHEP_NOI) cell = it.opts.map(function (o, i) { return APP.LETTERS[i] + '→__'; }).join(' ');
      else cell = '______________';
      row.push(it.stt + '.  ' + cell);
    }
    rows.push(row);
  }
  var t = ctx.body.appendTable(rows);
  FX_try(function () { t.setBorderWidth(0.5); t.editAsText().setFontFamily('Courier New').setFontSize(10); });
}

function PD_keyDoc(ctx, data) {
  PD_para(ctx, 'ĐÁP ÁN — ' + U_upper(data.ten || ''), { bold: true, size: 14, align: DocumentApp.HorizontalAlignment.CENTER });
  PD_para(ctx, (data.donVi || '') + ' · Môn: ' + data.mon + ' · Tài liệu dành cho giáo viên — KHÔNG phát cho thí sinh', { italic: true, size: 10, align: DocumentApp.HorizontalAlignment.CENTER, after: 8 });
  data.variants.forEach(function (v) {
    PD_para(ctx, 'Mã đề ' + v.maDe, { bold: true, before: 8 });
    var cols = 5, per = Math.ceil(v.items.length / cols), rows = [];
    for (var r = 0; r < per; r++) {
      var row = [];
      for (var c = 0; c < cols; c++) { var it = v.items[c * per + r]; row.push(it ? it.stt + '. ' + it.key : ''); }
      rows.push(row);
    }
    var t = ctx.body.appendTable(rows);
    FX_try(function () { t.setBorderWidth(0.5); t.editAsText().setFontFamily('Courier New').setFontSize(10); });
  });
}
