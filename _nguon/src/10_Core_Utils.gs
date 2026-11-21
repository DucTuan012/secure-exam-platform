/**
 * 10_Core_Utils.gs — Hàm tiện ích THUẦN (không gọi dịch vụ Google), test được bằng Node.
 */

/** Băm chuỗi -> số nguyên 32-bit (FNV-1a) */
function U_hash32(str) {
  str = String(str);
  var h = 0x811c9dc5;
  for (var i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/** Bộ sinh số ngẫu nhiên có hạt giống (mulberry32) — cùng hạt giống => cùng kết quả (tái lập được đề) */
function U_rng(seed) {
  var a = U_hash32(seed);
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    var t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Trộn mảng (Fisher–Yates), trả về mảng mới */
function U_shuffle(arr, rnd) {
  var a = arr.slice();
  for (var i = a.length - 1; i > 0; i--) {
    var j = Math.floor(rnd() * (i + 1));
    var t = a[i]; a[i] = a[j]; a[j] = t;
  }
  return a;
}

function U_str(v) {
  if (v === null || v === undefined) return '';
  if (v instanceof Date) return v.toISOString();
  return String(v).trim();
}

function U_upper(v) { return U_str(v).toUpperCase(); }

/** Tách danh sách theo , ; | hoặc xuống dòng */
function U_splitList(v) {
  var s = U_str(v);
  if (!s) return [];
  return s.split(/[,;|\n]+/).map(function (x) { return x.trim(); }).filter(function (x) { return x !== ''; });
}

function U_bool(v, dflt) {
  var s = U_upper(v);
  if (s === '') return !!dflt;
  return ['CO', 'CÓ', 'TRUE', 'YES', 'Y', '1', 'X', 'BẬT', 'BAT'].indexOf(s) >= 0;
}

function U_num(v, dflt) {
  if (typeof v === 'number' && !isNaN(v)) return v;
  var s = U_str(v).replace(',', '.');
  if (s === '') return dflt;
  var n = Number(s);
  return isNaN(n) ? dflt : n;
}

function U_removeDiacritics(s) {
  return String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D');
}

/** Chuẩn hoá họ tên để so khớp (bỏ dấu, viết thường, gộp khoảng trắng) */
function U_normName(s) {
  return U_removeDiacritics(U_str(s)).toLowerCase().replace(/\s+/g, ' ').trim();
}

/** Chuẩn hoá câu trả lời dạng chữ */
function U_normText(s) {
  return U_str(s).normalize('NFC').toLowerCase().replace(/\s+/g, ' ').replace(/[.。]+$/, '').trim();
}

/**
 * Đọc số từ câu trả lời của thí sinh: "3,14" "3.14" "1/2" "-2" "50%" "1e-3".
 * Trả về null nếu không phải số.
 */
function U_parseNumber(s) {
  var t = U_str(s).replace(/\s+/g, '').replace(/−/g, '-');
  if (t === '') return null;
  t = t.replace(/%$/, '');
  var m = t.match(/^([-+]?\d+(?:[.,]\d+)?)\/([-+]?\d+(?:[.,]\d+)?)$/);
  if (m) {
    var a = Number(m[1].replace(',', '.')), b = Number(m[2].replace(',', '.'));
    if (b === 0 || isNaN(a) || isNaN(b)) return null;
    return a / b;
  }
  if (/^[-+]?\d+,\d+$/.test(t)) t = t.replace(',', '.');
  if (!/^[-+]?(\d+\.?\d*|\.\d+)(e[-+]?\d+)?$/i.test(t)) return null;
  var n = Number(t);
  return isNaN(n) ? null : n;
}

function U_round(x, d) {
  var p = Math.pow(10, d === undefined ? 2 : d);
  return Math.round((x + 1e-12) * p) / p;
}

function U_escapeRegex(s) {
  return String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function U_letterIndex(L) { return APP.LETTERS.indexOf(U_upper(L)); }

/** Tạo mã ngẫu nhiên ngắn */
function U_randomId(n) {
  var chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789', s = '';
  for (var i = 0; i < (n || 6); i++) s += chars.charAt(Math.floor(Math.random() * chars.length));
  return s;
}

/** Nhóm mảng theo khoá */
function U_groupBy(arr, keyFn) {
  var m = {};
  arr.forEach(function (x) { var k = keyFn(x); (m[k] = m[k] || []).push(x); });
  return m;
}

/** Tách "Tiếng Việt || English" */
function U_bilingual(s) {
  var t = U_str(s);
  var i = t.indexOf('||');
  if (i < 0) return { vi: t, en: '' };
  return { vi: t.substring(0, i).trim(), en: t.substring(i + 2).trim() };
}

/** Dạng câu: chấp nhận cả mã và tên tiếng Việt */
function U_normDang(v) {
  var s = U_removeDiacritics(U_str(v)).toUpperCase().replace(/[\s\/\-]+/g, '_');
  var alias = {
    'MOT_DA': 'MOT_DA', '1_DAP_AN': 'MOT_DA', 'MOT_DAP_AN': 'MOT_DA', 'TN': 'MOT_DA', 'MC': 'MOT_DA',
    'NHIEU_DA': 'NHIEU_DA', 'NHIEU_DAP_AN': 'NHIEU_DA', 'MS': 'NHIEU_DA',
    'DUNG_SAI': 'DUNG_SAI', 'DS': 'DUNG_SAI', 'D_S': 'DUNG_SAI', 'TF': 'DUNG_SAI',
    'TRA_LOI_NGAN': 'TRA_LOI_NGAN', 'TLN': 'TRA_LOI_NGAN', 'SA': 'TRA_LOI_NGAN', 'DIEN': 'TRA_LOI_NGAN',
    'GHEP_NOI': 'GHEP_NOI', 'GN': 'GHEP_NOI', 'MATCH': 'GHEP_NOI'
  };
  return alias[s] || '';
}

/** Đọc thang mức độ từ cấu hình "NB:Nhận biết|TH:Thông hiểu|..." */
function U_parseLevels(cfgValue) {
  var parts = U_str(cfgValue || DEFAULT_CONFIG[1][1]).split('|');
  return parts.map(function (p, i) {
    var kv = p.split(':');
    return { code: U_upper(kv[0]), name: (kv[1] || kv[0]).trim(), order: i };
  }).filter(function (x) { return x.code; });
}
