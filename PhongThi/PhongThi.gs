/**
 * PhongThi.gs — BỘ KHỞI ĐỘNG PHÒNG THI (dán MỘT LẦN DUY NHẤT vào dự án Apps Script của file PhongThi_DuLieu)
 * ==========================================================================================================
 *  Bộ khởi động này KHÔNG chứa logic thi. Mã xử lý + giao diện thí sinh được Hệ thống Trung tâm tự đẩy vào
 *  sheet "MaNguon" mỗi khi Phát đề / Mở phòng thi / bấm "Đẩy mã phòng thi" → máy thí sinh luôn chạy bản mới nhất,
 *  KHÔNG cần dán mã hay triển khai lại nữa.
 *
 *  Cài đặt (1 lần):
 *   1. Mở PhongThi_DuLieu › Tiện ích mở rộng › Apps Script. Xoá hết nội dung Code.gs, dán toàn bộ tệp này. Lưu.
 *      (Tệp HTML "ThiSinh" cũ nếu có thì xoá đi hoặc để nguyên — không còn dùng.)
 *   2. Lần đầu: Triển khai › Tùy chọn triển khai mới › Ứng dụng web · Thực thi: TÔI · Truy cập: BẤT KỲ AI.
 *      Đã có triển khai: Triển khai › Quản lý triển khai › ✎ (bút chì) › Phiên bản: MỚI › Triển khai  (link giữ nguyên).
 *   3. Lần đầu dùng v3 (thi lập trình): Google hỏi cấp quyền "kết nối dịch vụ bên ngoài" (để gửi code tới máy chấm) → Cho phép.
 *      Nếu không thấy hỏi: chọn hàm doGet ở thanh trên › ▶ Chạy › cấp quyền (báo lỗi sau đó là bình thường).
 *   4. Trung tâm › tab ⑤ › mục A › "Kiểm tra kết nối phòng thi" phải báo ✔ bộ khởi động v3.
 *
 *  Bảo mật: chỉ 2 hàm công khai doGet, PT_api. Mã lõi đọc từ file dữ liệu của chính chủ hệ thống (thí sinh không sửa được).
 */

var BOOT_VERSION = '3';
var SRC_SHEET_ = 'MaNguon';

function doGet(e) {
  var p = (e && e.parameter) || {};
  if (p.ping) return ContentService.createTextOutput(JSON.stringify(bootInfo_())).setMimeType(ContentService.MimeType.JSON);
  try {
    return core_().doGet(e);
  } catch (x) {
    return HtmlService.createHtmlOutput('<div style="font:16px system-ui,sans-serif;padding:48px;text-align:center;color:#234">' +
      '<h2>Phòng thi chưa sẵn sàng</h2><p>' + String(x && x.message || x).replace(/^SETUP:/, '').replace(/</g, '&lt;') + '</p><p>Hãy báo giám thị. Trang dùng được sau khi giám thị bấm "Đẩy mã phòng thi".</p></div>')
      .setTitle('Phòng thi');
  }
}

function PT_api(name, args) {
  var core;
  try { core = core_(); }
  catch (x) {
    var m = String(x && x.message || x);
    return JSON.stringify({ ok: false, code: /^SETUP:/.test(m) ? 'SETUP' : 'BUSY', error: /^SETUP:/.test(m) ? m.substring(6) : 'Máy chủ đang cập nhật, hệ thống tự thử lại…' });
  }
  return core.PT_api(name, args);
}

/** Không bao giờ được gọi — chỉ để Google biết dự án cần quyền gửi yêu cầu ra ngoài (máy chấm lập trình). */
function scope_() { UrlFetchApp.fetchAll([]); UrlFetchApp.fetch('https://wandbox.org'); }

/* ------------------------------------------------------------------ nạp mã lõi */

var _CORE_ = null;
function core_() {
  if (_CORE_) return _CORE_;
  var code = srcPart_('CODE');
  _CORE_ = (new Function('HTML_', code))(function () { return srcPart_('HTML'); });
  return _CORE_;
}

function srcSheet_() {
  var sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SRC_SHEET_);
  if (!sh || sh.getLastRow() < 3) throw new Error('SETUP:Chưa có mã phòng thi. Giám thị: Trung tâm › tab ⑤ › "Đẩy mã phòng thi".');
  return sh;
}

/** Dòng 2 của sheet MaNguon: VER | phiên bản | mã băm | | | độ dài mã/độ dài html  (đệm 20 giây) */
function srcHead_() {
  var c = CacheService.getScriptCache(), s = c.get('src|head');
  if (s) return JSON.parse(s);
  var r = srcSheet_().getRange(2, 1, 1, 6).getValues()[0];
  var lens = String(r[5]).split('/');
  var h = { ver: String(r[1]), hash: String(r[2]), cl: Number(lens[0]) || 0, hl: Number(lens[1]) || 0 };
  if (String(r[0]) !== 'VER' || !h.hash) throw new Error('SETUP:Sheet MaNguon bị hỏng. Giám thị: bấm "Đẩy mã phòng thi".');
  c.put('src|head', JSON.stringify(h), 20);
  return h;
}

/** Ghép mã (CODE) hoặc giao diện (HTML) từ các mảnh; đệm 6 giờ theo mã băm; kiểm tra đủ độ dài */
function srcPart_(kind) {
  var h = srcHead_(), c = CacheService.getScriptCache(), base = 'src|' + h.hash + '|' + kind, want = kind === 'CODE' ? h.cl : h.hl;
  var n = Number(c.get(base + '|n') || 0);
  if (n) {
    var keys = [];
    for (var i = 0; i < n; i++) keys.push(base + '|' + i);
    var got = c.getAll(keys), parts = [], ok = true;
    keys.forEach(function (k) { if (got[k] === undefined || got[k] === null) ok = false; else parts.push(got[k]); });
    var joined = parts.join('');
    if (ok && joined.length === want) return joined;
  }
  var sh = srcSheet_(), last = sh.getLastRow();
  var rows = sh.getRange(3, 1, last - 2, 5).getValues()
    .filter(function (r) { return String(r[0]) === kind && String(r[2]) === h.hash; })
    .sort(function (a, b) { return Number(a[3]) - Number(b[3]); });
  var text = rows.map(function (r) { return String(r[4]).replace(/^~/, ''); }).join('');   // '~' = tiền tố chống hiểu nhầm công thức
  if (text.length !== want) throw new Error('Mã phòng thi đang được cập nhật (' + kind + ' ' + text.length + '/' + want + ')');
  try {
    var put = {}, k = 0;
    for (var p = 0; p < text.length; p += 30000) put[base + '|' + (k++)] = text.substring(p, p + 30000);
    put[base + '|n'] = String(k);
    c.putAll(put, 21600);
  } catch (e) { }
  return text;
}

/** ?ping=1 — Trung tâm kiểm tra bộ khởi động đã triển khai đúng & mã lõi đang chạy bản nào */
function bootInfo_() {
  var o = { ok: true, boot: BOOT_VERSION, now: Date.now(), core: '', hash: '', url: '' };
  try { var h = srcHead_(); o.core = h.ver; o.hash = h.hash; } catch (e) { o.coreError = String(e.message || e).replace(/^SETUP:/, ''); }
  try { o.url = ScriptApp.getService().getUrl(); } catch (e) { }
  return o;
}
