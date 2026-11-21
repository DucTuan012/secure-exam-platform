/**
 * 20_Sheets.gs — Đọc/ghi Google Sheets theo TÊN CỘT.
 */

var _SS_CACHE = {};

function S_props() { return PropertiesService.getScriptProperties(); }

function S_open(id) {
  if (!_SS_CACHE[id]) _SS_CACHE[id] = SpreadsheetApp.openById(id);
  return _SS_CACHE[id];
}

/** File TRUNG TÂM */
function S_hub() {
  var id = S_props().getProperty(APP.PROP_HUB_ID);
  if (id) return S_open(id);
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) throw new Error('Chưa khởi tạo hệ thống. Mở file Trung tâm và chọn menu 🎓 Hệ thống thi › Khởi tạo hệ thống.');
  return ss;
}

function S_isReady() { return !!S_props().getProperty(APP.PROP_HUB_ID); }

/** Tạo sheet nếu chưa có, bảo đảm có đủ các cột tiêu đề */
function S_ensureSheet(ss, name, headers, opts) {
  opts = opts || {};
  var sh = ss.getSheetByName(name);
  if (!sh) sh = ss.insertSheet(name);
  if (headers && headers.length) {
    var lastCol = Math.max(sh.getLastColumn(), 1);
    var cur = sh.getRange(1, 1, 1, lastCol).getValues()[0].map(U_str);
    var empty = cur.every(function (x) { return x === ''; });
    if (empty) {
      sh.getRange(1, 1, 1, headers.length).setValues([headers]);
    } else {
      var missing = headers.filter(function (h) { return cur.indexOf(h) < 0; });
      if (missing.length) sh.getRange(1, cur.length + 1, 1, missing.length).setValues([missing]);
    }
    var n = sh.getLastColumn();
    sh.getRange(1, 1, 1, n).setFontWeight('bold').setBackground(opts.color || '#1f3b5b').setFontColor('#ffffff')
      .setWrap(true).setVerticalAlignment('middle');
    sh.setFrozenRows(1);
    if (opts.text) {
      // định dạng văn bản thuần để Google Sheets không tự đổi "1/2" thành ngày, "001" thành 1…
      sh.getRange(1, 1, sh.getMaxRows(), n).setNumberFormat('@');
    }
  }
  return sh;
}

function S_headers(sh) {
  var lastCol = sh.getLastColumn();
  if (lastCol < 1) return [];
  return sh.getRange(1, 1, 1, lastCol).getValues()[0].map(U_str);
}

/** Đọc toàn bộ sheet -> mảng đối tượng {TenCot: giá trị, __row: số dòng} */
function S_read(ss, name) {
  var sh = ss.getSheetByName(name);
  if (!sh) return [];
  var lastRow = sh.getLastRow(), lastCol = sh.getLastColumn();
  if (lastRow < 2 || lastCol < 1) return [];
  var values = sh.getRange(1, 1, lastRow, lastCol).getValues();
  var head = values[0].map(U_str);
  var out = [];
  for (var i = 1; i < values.length; i++) {
    var row = values[i], o = { __row: i + 1 }, any = false;
    for (var j = 0; j < head.length; j++) {
      if (!head[j]) continue;
      var v = row[j];
      if (v !== '' && v !== null) any = true;
      o[head[j]] = v;
    }
    if (any) out.push(o);
  }
  return out;
}

function S_toRow(head, o) {
  return head.map(function (h) {
    if (!h) return '';
    var v = o[h];
    if (v === undefined || v === null) return '';
    if (typeof v === 'boolean') return v ? 'TRUE' : 'FALSE';
    if (typeof v === 'object' && !(v instanceof Date)) return JSON.stringify(v);
    return v;
  });
}

/** Ghi lại toàn bộ dữ liệu (giữ dòng tiêu đề) */
function S_writeAll(ss, name, objs) {
  var sh = ss.getSheetByName(name);
  if (!sh) throw new Error('Không có sheet ' + name);
  var head = S_headers(sh);
  var lastRow = sh.getLastRow();
  if (lastRow > 1) sh.getRange(2, 1, lastRow - 1, Math.max(head.length, 1)).clearContent();
  if (!objs.length) return;
  var data = objs.map(function (o) { return S_toRow(head, o); });
  if (sh.getMaxRows() < data.length + 1) sh.insertRowsAfter(sh.getMaxRows(), data.length + 1 - sh.getMaxRows());
  sh.getRange(2, 1, data.length, head.length).setValues(data);
}

function S_append(ss, name, objs) {
  if (!objs.length) return;
  var sh = ss.getSheetByName(name);
  var head = S_headers(sh);
  var data = objs.map(function (o) { return S_toRow(head, o); });
  sh.getRange(sh.getLastRow() + 1, 1, data.length, head.length).setValues(data);
}

/** Xoá các dòng thoả điều kiện rồi thêm dòng mới (ghi lại cả sheet — phù hợp dữ liệu vừa và nhỏ) */
function S_replaceWhere(ss, name, pred, newObjs) {
  var all = S_read(ss, name);
  var keep = all.filter(function (o) { return !pred(o); });
  S_writeAll(ss, name, keep.concat(newObjs || []));
}

/** Cập nhật các dòng thoả điều kiện bằng patch (đối tượng hoặc hàm) */
function S_update(ss, name, pred, patch) {
  var sh = ss.getSheetByName(name);
  var head = S_headers(sh);
  var rows = S_read(ss, name), n = 0;
  rows.forEach(function (o) {
    if (!pred(o)) return;
    var p = typeof patch === 'function' ? patch(o) : patch;
    Object.keys(p).forEach(function (k) { o[k] = p[k]; });
    sh.getRange(o.__row, 1, 1, head.length).setValues([S_toRow(head, o)]);
    n++;
  });
  return n;
}

/** Thêm mới hoặc cập nhật theo khoá */
function S_upsert(ss, name, keyFn, obj) {
  var k = keyFn(obj);
  var n = S_update(ss, name, function (o) { return keyFn(o) === k; }, obj);
  if (!n) S_append(ss, name, [obj]);
}

function S_now() { return Utilities.formatDate(new Date(), APP.TZ, 'yyyy-MM-dd HH:mm:ss'); }

function S_user() {
  try { return Session.getActiveUser().getEmail() || Session.getEffectiveUser().getEmail() || ''; } catch (e) { return ''; }
}

function S_log(action, detail) {
  try {
    S_append(S_hub(), SH.NHAT_KY, [{ ThoiGian: S_now(), NguoiDung: S_user(), HanhDong: action,
      ChiTiet: typeof detail === 'string' ? detail : JSON.stringify(detail) }]);
  } catch (e) { /* không chặn luồng chính */ }
}

function S_withLock(fn) {
  var lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try { return fn(); } finally { lock.releaseLock(); }
}

/** Thư mục dữ liệu trên Drive */
function S_folder(propKey, name) {
  var id = S_props().getProperty(propKey);
  if (id) { try { return DriveApp.getFolderById(id); } catch (e) { /* tạo lại */ } }
  var root = propKey === APP.PROP_ROOT_FOLDER ? null : S_folder(APP.PROP_ROOT_FOLDER, APP.ROOT_FOLDER_NAME);
  var f = root ? root.createFolder(name) : DriveApp.createFolder(name);
  S_props().setProperty(propKey, f.getId());
  return f;
}
function S_rootFolder() { return S_folder(APP.PROP_ROOT_FOLDER, APP.ROOT_FOLDER_NAME); }
function S_latexFolder() { return S_folder(APP.PROP_LATEX_FOLDER, 'AnhCongThuc_Cache'); }
function S_examFolder() { return S_folder(APP.PROP_EXAM_FOLDER, 'KyThi'); }
