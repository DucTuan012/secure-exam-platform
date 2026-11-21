/**
 * HeThongThi.gs — BẢN GỘP để dán vào Apps Script (v1.7.9). Nguồn tách file: thư mục src/
 */

/* ======================= 00_Config.gs ======================= */
/**
 * =====================================================================
 *  HỆ THỐNG NGÂN HÀNG ĐỀ & THI TRẮC NGHIỆM TRÊN GOOGLE FORMS
 *  00_Config.gs — Hằng số, tên sheet, tiêu đề cột, danh mục mã
 * =====================================================================
 *  Kiến trúc:
 *   - 1 file TRUNG TÂM (Google Sheets chứa mã Apps Script này): cấu hình,
 *     danh sách môn, ma trận, kỳ thi, mã đề, thí sinh, bài làm, kết quả.
 *   - Mỗi môn 1 file NGÂN HÀNG riêng: CauHoi, Nhom (câu chùm), DanhMuc.
 *   - Mỗi mã đề = 1 Google Form (không bật chế độ Quiz của Google để
 *     tránh lộ đáp án; hệ thống tự chấm theo luật riêng).
 */

var APP = {
  NAME: 'Hệ thống Ngân hàng đề & Thi trắc nghiệm',
  VERSION: '1.7.9',
  PT_VERSION: '1.7.9',
  TZ: 'Asia/Ho_Chi_Minh',
  LETTERS: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'],   // tối đa 10 lựa chọn / ý
  ROOT_FOLDER_NAME: 'HeThongThi_DuLieu',
  PROP_HUB_ID: 'HUB_ID',
  PROP_ROOT_FOLDER: 'ROOT_FOLDER_ID',
  PROP_LATEX_FOLDER: 'LATEX_FOLDER_ID',
  PROP_EXAM_FOLDER: 'EXAM_FOLDER_ID'
};

/** Tên các sheet trong file TRUNG TÂM */
var SH = {
  CAU_HINH: 'CauHinh',
  MON_HOC: 'MonHoc',
  MT_PHAN: 'MaTran_Phan',
  MT_CHITIET: 'MaTran_ChiTiet',
  KY_THI: 'KyThi',
  MA_DE: 'MaDe',
  DE_THI: 'DeThi',
  THI_SINH: 'ThiSinh',
  BAI_LAM: 'BaiLam',
  KET_QUA: 'KetQua',
  DIEM_PHAN: 'KetQua_Phan',
  KQ_CHU_DE: 'KetQua_ChuDe',
  PHUC_KHAO: 'PhucKhao',
  NHAT_KY: 'NhatKy',
  LT_BAI: 'LT_BaiTap',
  LT_TEST: 'LT_Test',
  LT_KQ: 'LT_KetQua',
  HUONG_DAN: 'HuongDan'
};

/** Tên các sheet trong file NGÂN HÀNG của từng môn */
var BSH = {
  CAU_HOI: 'CauHoi',
  NHOM: 'Nhom',
  DANH_MUC: 'DanhMuc',
  HUONG_DAN: 'HuongDan',
  DS: '_DanhSach'
};

/** Tiêu đề cột (thứ tự cột khi khởi tạo). Mã đọc theo TÊN cột nên có thể chèn thêm cột. */
var HEADERS = {};
HEADERS[SH.CAU_HINH] = ['Khoa', 'GiaTri', 'MoTa'];
HEADERS[SH.MON_HOC] = ['MaMon', 'TenMon', 'FileNganHangId', 'LinkFile', 'NgayTao', 'GhiChu'];
HEADERS[SH.MT_PHAN] = ['MaMaTran', 'MaMon', 'TenMaTran', 'Phan', 'TenPhan', 'DiemPhan', 'TongSoCau', 'DangCauChoPhep', 'GhiChu'];
HEADERS[SH.MT_CHITIET] = ['MaMaTran', 'Phan', 'Chuong', 'MaChuDe', 'MucDo', 'DangCau', 'SoCau', 'TiLe', 'GhiChu'];
HEADERS[SH.KY_THI] = ['MaKyThi', 'TenKyThi', 'MaMon', 'MaMaTran', 'CheDo', 'SoMaDe', 'MaDeBatDau', 'TronCau', 'TronDapAn',
  'TronYDungSai', 'ThoiGianPhut', 'NgayThi', 'HatGiong', 'LanSinh', 'TrangThai', 'ThuMucId', 'MoLuc', 'DongLuc',
  'TuDongDongLuc', 'CauTrucPhan', 'NgayTao', 'GhiChu', 'LapTrinh'];
HEADERS[SH.MA_DE] = ['MaKyThi', 'MaDe', 'SoCau', 'TrangThai', 'FormId', 'LinkSua', 'LinkThi', 'ItemIdSBD', 'ItemIdHoTen',
  'NgayXuat', 'GhiChu'];
HEADERS[SH.DE_THI] = ['MaKyThi', 'MaDe', 'Phan', 'STT', 'MaCH', 'MaNhom', 'DangCau', 'MaChuDe', 'MucDo', 'OMaTran',
  'ThuTu', 'DapAnGoc', 'DapAnMaDe', 'Diem', 'Khoa', 'FormItemId', 'GhiChu'];
HEADERS[SH.THI_SINH] = ['MaKyThi', 'SBD', 'HoTen', 'Lop', 'Email', 'MaDe', 'LinkThi', 'GhiChu'];
HEADERS[SH.BAI_LAM] = ['MaKyThi', 'MaDe', 'ResponseId', 'ThoiDiemNop', 'SBD', 'HoTen', 'TongDiem', 'SoCauDung', 'TongSoCau',
  'ChiTietPhan', 'TraLoi', 'KetQuaCau', 'LanCham', 'CanhBaoThem'];
HEADERS[SH.KET_QUA] = ['MaKyThi', 'SBD', 'HoTen', 'Lop', 'MaDe', 'TrangThai', 'TongDiem', 'SoCauDung', 'TongSoCau',
  'ChiTietPhan', 'ThoiDiemNop', 'SoLanNop', 'CanhBao', 'ResponseId', 'LanCham', 'DiemLapTrinh', 'ChiTietLapTrinh'];
HEADERS[SH.DIEM_PHAN] = ['MaKyThi', 'SBD', 'Lop', 'MaDe', 'Phan', 'TenPhan', 'Diem', 'DiemToiDa'];
HEADERS[SH.KQ_CHU_DE] = ['MaKyThi', 'SBD', 'Lop', 'MaChuDe', 'Chuong', 'ChuDe', 'MucDo', 'SoCau', 'SoDung'];
HEADERS[SH.PHUC_KHAO] = ['MaKyThi', 'MaCH', 'HanhDong', 'GiaTri', 'LyDo', 'ApDung', 'NguoiTao', 'NgayTao'];
HEADERS[SH.NHAT_KY] = ['ThoiGian', 'NguoiDung', 'HanhDong', 'ChiTiet'];
/* ---- LẬP TRÌNH ---- */
HEADERS[SH.LT_BAI] = ['MaBai', 'TieuDe', 'DoKho', 'ChuDe', 'NoiDung', 'DinhDangVao', 'DinhDangRa', 'RangBuoc', 'NgonNgu', 'GioiHanGiay',
  'GioiHanMB', 'SoSanh', 'SaiSo', 'ChamDiem', 'MauPython', 'MauC', 'LoiGiai', 'NgonNguLoiGiai', 'KiemThuLuc', 'KiemThuKetQua',
  'NgayTao', 'CapNhat', 'GhiChu', 'ThuVienPy', 'ThuVienC', 'CamDung'];
HEADERS[SH.LT_TEST] = ['MaBai', 'STT', 'Input', 'Output', 'Mau', 'Diem', 'GiaiThich'];
HEADERS[SH.LT_KQ] = ['MaKyThi', 'SBD', 'MaBai', 'Diem', 'DiemToiDa', 'SoLanNop', 'NgonNgu', 'ThoiDiem', 'KetQua', 'Nguon', 'Code', 'TuongDong'];

HEADERS[BSH.CAU_HOI] = ['MaCH', 'MaChuDe', 'MucDo', 'DangCau', 'MaNhom', 'NoiDung_VI', 'NoiDung_EN', 'LaTeX', 'HinhAnh',
  'Video', 'AmThanh', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'CotGhep', 'DapAn', 'KhongTron', 'LoiGiai_VI', 'LoiGiai_EN', 'TrangThai',
  'Tag', 'NgayTao', 'GhiChu'];
HEADERS[BSH.NHOM] = ['MaNhom', 'MaChuDe', 'MucDo', 'DangCau', 'NoiDung_VI', 'NoiDung_EN', 'LaTeX', 'HinhAnh', 'Video',
  'AmThanh', 'TrangThai', 'GhiChu'];
HEADERS[BSH.DANH_MUC] = ['MaChuDe', 'Khoi_CapDo', 'Chuong', 'ChuDe', 'YeuCauCanDat', 'GhiChu'];

/** Dạng câu hỏi */
var DANG = {
  MOT_DA: 'MOT_DA',            // 1 đáp án đúng (A–J)
  NHIEU_DA: 'NHIEU_DA',        // nhiều đáp án đúng — phải chọn ĐỦ và ĐÚNG
  DUNG_SAI: 'DUNG_SAI',        // Đúng/Sai nhiều ý — phải đúng TẤT CẢ ý
  TRA_LOI_NGAN: 'TRA_LOI_NGAN',// điền số / từ
  GHEP_NOI: 'GHEP_NOI'         // ghép nối (lưới) — phải đúng TẤT CẢ cặp
};
var DANG_TEN = {
  MOT_DA: 'Một đáp án',
  NHIEU_DA: 'Nhiều đáp án',
  DUNG_SAI: 'Đúng/Sai nhiều ý',
  TRA_LOI_NGAN: 'Trả lời ngắn',
  GHEP_NOI: 'Ghép nối'
};

/** Chế độ sinh mã đề */
var CHE_DO = {
  A_TRON: 'A_TRON',   // (a) cùng bộ câu hỏi, chỉ trộn thứ tự câu + đáp án
  B_KHAC: 'B_KHAC'    // (b) mỗi mã đề bốc câu khác nhau theo cùng ma trận (tương đương độ khó)
};

/** Trạng thái kỳ thi */
var TT_KY_THI = {
  NHAP: 'NHAP', DA_SINH: 'DA_SINH_DE', DA_CHOT: 'DA_CHOT', DA_XUAT: 'DA_XUAT_FORM',
  DANG_THI: 'DANG_THI', DA_DONG: 'DA_DONG', DA_CHAM: 'DA_CHAM'
};

/** Hành động phúc khảo / điều chỉnh sau thi */
var PK = {
  DOI_DAP_AN: 'DOI_DAP_AN',     // thay đáp án đúng (ghi theo ký hiệu GỐC trong ngân hàng)
  THEM_DAP_AN: 'THEM_DAP_AN',   // chấp nhận thêm đáp án
  TANG_DIEM: 'TANG_DIEM',       // mọi thí sinh được điểm câu này
  LOAI_CAU: 'LOAI_CAU'          // loại câu khỏi đề, chia lại điểm trong phần
};

/** Giá trị mặc định của sheet CauHinh */
var DEFAULT_CONFIG = [
  ['TEN_DON_VI', 'Học viện / Khoa ...', 'Tên đơn vị hiển thị trên đề'],
  ['MUC_DO', 'NB:Nhận biết|TH:Thông hiểu|VD:Vận dụng|VDC:Vận dụng cao',
    'Thang mức độ (mã:tên, cách nhau bởi |). Có thể đổi thành Bloom 6 mức hoặc Dễ/TB/Khó'],
  ['SONG_NGU', 'CO', 'CO = hiển thị tiếng Anh bên dưới tiếng Việt trên Form'],
  ['BAT_BUOC_TRA_LOI', 'KHONG', 'CO = bắt buộc trả lời mọi câu trước khi nộp'],
  ['MOI_PHAN_MOT_TRANG', 'CO', 'CO = mỗi Phần của đề là một trang trên Form'],
  ['LATEX_DPI', '160', 'Độ nét ảnh công thức LaTeX'],
  ['LATEX_URL', 'https://latex.codecogs.com/png.image?', 'Dịch vụ chuyển LaTeX -> PNG (CodeCogs, miễn phí cho mục đích phi thương mại)'],
  ['THANG_DIEM', '100', 'Thang điểm tổng'],
  ['LAM_TRON', '2', 'Số chữ số thập phân khi làm tròn điểm'],
  ['THONG_BAO_NOP_BAI', 'Bài làm đã được ghi nhận. Vui lòng chờ giám thị hướng dẫn. / Your answers have been submitted.',
    'Thông báo sau khi thí sinh nộp bài'],
  ['QUAN_TRI_EMAIL', '', 'Email đồng quản trị (cùng tên miền), cách nhau dấu phẩy. Chủ file luôn có quyền'],
  ['CLB_TEN', '', 'Tên câu lạc bộ / đơn vị hiện trên trang thi (tab ⑤ › Nhận diện)'],
  ['CLB_KHAU', '', 'Khẩu hiệu ngắn dưới tên CLB'],
  ['CLB_MAU', '#14237A', 'Màu chủ đạo trang thi (cố định xanh navy)'],
  ['CLB_LOGO', '', 'Logo (ảnh nhỏ, data URI — đặt ở tab ⑤ › Nhận diện)'],
  ['LT_MAY_CHAM', 'wandbox', 'Máy chấm lập trình: wandbox (miễn phí) | judge0 | piston'],
  ['LT_URL', '', 'Địa chỉ máy chấm (để trống = mặc định của dịch vụ)'],
  ['LT_KHOA', '', 'Khoá API máy chấm (Judge0 RapidAPI / tự cài) — để trống nếu không cần'],
  ['PHONG_THI_URL', '', 'Link Web App của dự án Phòng thi (tab ⑤ Phòng thi web › Cài đặt)'],
  ['HUONG_DAN_DE', 'Nhập đúng Số báo danh và Họ tên. Mỗi thí sinh chỉ nộp 1 lần. / Enter your Student ID and full name. Submit only once.',
    'Hướng dẫn in ở đầu mỗi đề']
];

/* ======================= 10_Core_Utils.gs ======================= */
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

/* ======================= 11_Core_Latex.gs ======================= */
/**
 * 11_Core_Latex.gs — Xử lý công thức (THUẦN, test được bằng Node)
 *
 * Quy ước nhập liệu trong ngân hàng:
 *   $...$    công thức trong dòng. Hệ thống cố gắng đổi sang ký tự Unicode (x², √x, ∑, α, ≤ …)
 *            để hiển thị trực tiếp trên Google Form. Nếu công thức quá phức tạp (ma trận, tích phân
 *            nhiều tầng…) sẽ tự chuyển thành ẢNH và để ký hiệu [CT1] trong câu.
 *   $$...$$  công thức hiển thị riêng -> luôn chuyển thành ẢNH chèn ngay trước câu hỏi.
 *   \$       ký tự đô-la thường.
 *   Cột LaTeX của câu hỏi: công thức lớn (không cần $), luôn thành ảnh.
 */

var LX_SYM = {
  alpha: 'α', beta: 'β', gamma: 'γ', delta: 'δ', epsilon: 'ε', varepsilon: 'ε', zeta: 'ζ', eta: 'η', theta: 'θ',
  vartheta: 'ϑ', iota: 'ι', kappa: 'κ', lambda: 'λ', mu: 'μ', nu: 'ν', xi: 'ξ', pi: 'π', varpi: 'ϖ', rho: 'ρ',
  varrho: 'ϱ', sigma: 'σ', varsigma: 'ς', tau: 'τ', upsilon: 'υ', phi: 'ϕ', varphi: 'φ', chi: 'χ', psi: 'ψ', omega: 'ω',
  Gamma: 'Γ', Delta: 'Δ', Theta: 'Θ', Lambda: 'Λ', Xi: 'Ξ', Pi: 'Π', Sigma: 'Σ', Upsilon: 'Υ', Phi: 'Φ', Psi: 'Ψ', Omega: 'Ω',
  times: '×', cdot: '·', div: '÷', pm: '±', mp: '∓', le: '≤', leq: '≤', ge: '≥', geq: '≥', ne: '≠', neq: '≠',
  approx: '≈', equiv: '≡', sim: '∼', simeq: '≃', cong: '≅', propto: '∝', infty: '∞', partial: '∂', nabla: '∇',
  sum: '∑', prod: '∏', int: '∫', iint: '∬', iiint: '∭', oint: '∮', in: '∈', notin: '∉', ni: '∋', subset: '⊂',
  subseteq: '⊆', supset: '⊃', supseteq: '⊇', cup: '∪', cap: '∩', setminus: '∖', emptyset: '∅', varnothing: '∅',
  forall: '∀', exists: '∃', nexists: '∄', neg: '¬', lnot: '¬', land: '∧', wedge: '∧', lor: '∨', vee: '∨',
  to: '→', rightarrow: '→', leftarrow: '←', gets: '←', Rightarrow: '⇒', Leftarrow: '⇐', Leftrightarrow: '⇔',
  leftrightarrow: '↔', iff: '⇔', implies: '⇒', mapsto: '↦', uparrow: '↑', downarrow: '↓',
  ldots: '…', cdots: '⋯', dots: '…', vdots: '⋮', ddots: '⋱', circ: '∘', bullet: '•', degree: '°', angle: '∠',
  perp: '⊥', parallel: '∥', top: 'ᵀ', star: '⋆', ast: '∗', oplus: '⊕', otimes: '⊗', odot: '⊙',
  langle: '⟨', rangle: '⟩', lfloor: '⌊', rfloor: '⌋', lceil: '⌈', rceil: '⌉', mid: '|', vert: '|', Vert: '‖',
  ll: '≪', gg: '≫', prime: '′', hbar: 'ℏ', ell: 'ℓ', Re: 'ℜ', Im: 'ℑ', aleph: 'ℵ', therefore: '∴', because: '∵',
  '|': '‖', '{': '{', '}': '}', '%': '%', '$': '$', '_': '_', '&': '&', '#': '#',
  quad: ' ', qquad: '  ', ',': ' ', ';': ' ', ':': ' ', '>': ' ', '!': '', ' ': ' ',
  left: '', right: '', big: '', Big: '', bigg: '', Bigg: '', bigl: '', bigr: '', Bigl: '', Bigr: '',
  displaystyle: '', textstyle: '', limits: '', nolimits: ''
};

/** Toán tử dạng chữ: \sin, \log, … */
var LX_WORDS = ['sin', 'cos', 'tan', 'cot', 'sec', 'csc', 'arcsin', 'arccos', 'arctan', 'sinh', 'cosh', 'tanh',
  'log', 'ln', 'lg', 'exp', 'lim', 'max', 'min', 'sup', 'inf', 'det', 'arg', 'dim', 'ker', 'deg', 'gcd', 'Pr',
  'mod', 'bmod', 'argmax', 'argmin', 'tr', 'rank', 'sgn', 'var', 'Var', 'cov', 'Cov', 'diag'];

var LX_SUP = {
  '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹',
  '+': '⁺', '-': '⁻', '−': '⁻', '=': '⁼', '(': '⁽', ')': '⁾', 'a': 'ᵃ', 'b': 'ᵇ', 'c': 'ᶜ', 'd': 'ᵈ', 'e': 'ᵉ',
  'f': 'ᶠ', 'g': 'ᵍ', 'h': 'ʰ', 'i': 'ⁱ', 'j': 'ʲ', 'k': 'ᵏ', 'l': 'ˡ', 'm': 'ᵐ', 'n': 'ⁿ', 'o': 'ᵒ', 'p': 'ᵖ',
  'r': 'ʳ', 's': 'ˢ', 't': 'ᵗ', 'u': 'ᵘ', 'v': 'ᵛ', 'w': 'ʷ', 'x': 'ˣ', 'y': 'ʸ', 'z': 'ᶻ', 'A': 'ᴬ', 'B': 'ᴮ',
  'D': 'ᴰ', 'E': 'ᴱ', 'G': 'ᴳ', 'H': 'ᴴ', 'I': 'ᴵ', 'J': 'ᴶ', 'K': 'ᴷ', 'L': 'ᴸ', 'M': 'ᴹ', 'N': 'ᴺ', 'O': 'ᴼ',
  'P': 'ᴾ', 'R': 'ᴿ', 'T': 'ᵀ', 'U': 'ᵁ', 'V': 'ⱽ', 'W': 'ᵂ', 'ᵀ': 'ᵀ', '*': '*', '′': '′', ' ': '',
  'β': 'ᵝ', 'γ': 'ᵞ', 'δ': 'ᵟ', 'θ': 'ᶿ', 'φ': 'ᵠ', 'χ': 'ᵡ', '∞': '^∞', ',': '˒'
};
var LX_SUB = {
  '0': '₀', '1': '₁', '2': '₂', '3': '₃', '4': '₄', '5': '₅', '6': '₆', '7': '₇', '8': '₈', '9': '₉',
  '+': '₊', '-': '₋', '−': '₋', '=': '₌', '(': '₍', ')': '₎', 'a': 'ₐ', 'e': 'ₑ', 'h': 'ₕ', 'i': 'ᵢ', 'j': 'ⱼ',
  'k': 'ₖ', 'l': 'ₗ', 'm': 'ₘ', 'n': 'ₙ', 'o': 'ₒ', 'p': 'ₚ', 'r': 'ᵣ', 's': 'ₛ', 't': 'ₜ', 'u': 'ᵤ', 'v': 'ᵥ',
  'x': 'ₓ', 'β': 'ᵦ', 'γ': 'ᵧ', 'ρ': 'ᵨ', 'φ': 'ᵩ', 'χ': 'ᵪ', ' ': '', ',': ','
};

var LX_ACCENT = { hat: '̂', widehat: '̂', bar: '̄', overline: '̅', tilde: '̃', widetilde: '̃',
  vec: '⃗', dot: '̇', ddot: '̈', underline: '̲' };

var LX_PLAIN1 = ['mathbf', 'boldsymbol', 'bm', 'mathrm', 'text', 'textrm', 'textbf', 'textit', 'mathit', 'mathsf',
  'mathtt', 'texttt', 'operatorname', 'mbox', 'emph'];

function LX_bb(ch) {
  var m = { R: 'ℝ', N: 'ℕ', Z: 'ℤ', Q: 'ℚ', C: 'ℂ', P: 'ℙ', H: 'ℍ', E: '𝔼', '1': '𝟙' };
  return m[ch] || ch;
}
function LX_cal(ch) {
  var hole = { B: 0x212C, E: 0x2130, F: 0x2131, H: 0x210B, I: 0x2110, L: 0x2112, M: 0x2133, R: 0x211B };
  if (hole[ch]) return String.fromCodePoint(hole[ch]);
  if (/[A-Z]/.test(ch)) return String.fromCodePoint(0x1D49C + ch.charCodeAt(0) - 65);
  return ch;
}

/** Đọc một "đối số": {…} hoặc 1 ký tự hoặc 1 lệnh \cmd. Trả {raw, end} */
function LX_readArg(s, i) {
  while (i < s.length && s[i] === ' ') i++;
  if (i >= s.length) return { raw: '', end: i, ok: false };
  if (s[i] === '{') {
    var depth = 0, j = i;
    for (; j < s.length; j++) {
      if (s[j] === '\\') { j++; continue; }
      if (s[j] === '{') depth++;
      else if (s[j] === '}') { depth--; if (depth === 0) break; }
    }
    if (j >= s.length) return { raw: s.substring(i + 1), end: s.length, ok: false };
    return { raw: s.substring(i + 1, j), end: j + 1, ok: true };
  }
  if (s[i] === '\\') {
    var m = s.substring(i).match(/^\\([A-Za-z]+|.)/);
    return { raw: m[0], end: i + m[0].length, ok: true };
  }
  return { raw: s[i], end: i + 1, ok: true };
}

function LX_isSimple(t) {
  return /^[^\s+\-−*\/=<>,;:()|±×·÷]+$/.test(t) || Array.from(t).length === 1;
}
function LX_wrap(t) { return LX_isSimple(t) ? t : '(' + t + ')'; }

function LX_script(content, map, mark) {
  var chars = Array.from(content);
  var ok = chars.every(function (c) { return map[c] !== undefined; });
  if (ok && chars.length) return chars.map(function (c) { return map[c]; }).join('');
  return mark + LX_wrap(content);
}

/**
 * Đổi công thức LaTeX (trong dòng) sang chuỗi Unicode.
 * @return {{text:string, ok:boolean}} ok=false nếu gặp lệnh không hỗ trợ -> nên dùng ảnh.
 */
function LX_toUnicode(src) {
  var state = { ok: true };
  var out = LX_conv(String(src), state);
  out = out.replace(/\s+/g, ' ').trim();
  return { text: out, ok: state.ok };
}

function LX_conv(s, st) {
  var out = '', i = 0;
  while (i < s.length) {
    var c = s[i];
    if (c === '\\') {
      var m = s.substring(i).match(/^\\([A-Za-z]+|.)/);
      if (!m) { out += c; i++; continue; }
      var cmd = m[1];
      i += m[0].length;
      if (cmd === '\\' || cmd === 'begin' || cmd === 'end' || cmd === 'binom' || cmd === 'matrix' ||
        cmd === 'pmatrix' || cmd === 'cases' || cmd === 'stackrel' || cmd === 'overset' || cmd === 'underset' ||
        cmd === 'substack' || cmd === 'xrightarrow') {
        st.ok = false; out += '\\' + cmd; continue;
      }
      if (cmd === 'frac' || cmd === 'dfrac' || cmd === 'tfrac') {
        var a = LX_readArg(s, i); var b = LX_readArg(s, a.end); i = b.end;
        if (!a.ok || !b.ok) st.ok = false;
        out += LX_wrap(LX_conv(a.raw, st).trim()) + '/' + LX_wrap(LX_conv(b.raw, st).trim());
        continue;
      }
      if (cmd === 'sqrt') {
        var n = '';
        while (s[i] === ' ') i++;
        if (s[i] === '[') { var k = s.indexOf(']', i); n = s.substring(i + 1, k).trim(); i = k + 1; }
        var r = LX_readArg(s, i); i = r.end;
        var inner = LX_conv(r.raw, st).trim();
        var root = n === '' ? '√' : (n === '3' ? '∛' : (n === '4' ? '∜' : LX_script(n, LX_SUP, '') + '√'));
        out += root + LX_wrap(inner);
        continue;
      }
      if (LX_ACCENT[cmd]) {
        var ac = LX_readArg(s, i); i = ac.end;
        var t = Array.from(LX_conv(ac.raw, st).trim());
        out += t.map(function (ch) { return ch + LX_ACCENT[cmd]; }).join('');
        continue;
      }
      if (cmd === 'mathbb' || cmd === 'mathcal' || cmd === 'mathscr') {
        var bb = LX_readArg(s, i); i = bb.end;
        out += Array.from(bb.raw.trim()).map(cmd === 'mathbb' ? LX_bb : LX_cal).join('');
        continue;
      }
      if (LX_PLAIN1.indexOf(cmd) >= 0) {
        var p = LX_readArg(s, i); i = p.end;
        out += (cmd.indexOf('text') === 0 || cmd === 'mbox') ? p.raw : LX_conv(p.raw, st);
        continue;
      }
      if (LX_WORDS.indexOf(cmd) >= 0) {
        var nxt = s.substring(i).replace(/^\s+/, '');
        out += cmd + (/^[A-Za-z0-9\\]/.test(nxt) ? ' ' : '');
        continue;
      }
      if (LX_SYM.hasOwnProperty(cmd)) {
        out += LX_SYM[cmd];
        if (['partial', 'nabla', 'neg', 'lnot'].indexOf(cmd) >= 0) { while (s[i] === ' ') i++; continue; }
        if (/^[A-Za-z]+$/.test(cmd) && LX_SYM[cmd].length && /^\s*[A-Za-z0-9]/.test(s.substring(i)) &&
          ['sum', 'prod', 'int', 'top', 'prime', 'partial', 'nabla', 'neg', 'lnot'].indexOf(cmd) < 0) out += ' ';
        continue;
      }
      st.ok = false; out += '\\' + cmd;
      continue;
    }
    if (c === '^' || c === '_') {
      var g = LX_readArg(s, i + 1); i = g.end;
      if (!g.ok) st.ok = false;
      var content = LX_conv(g.raw, st).trim();
      if (c === '^' && (content === 'ᵀ' || content === 'T')) { out += 'ᵀ'; continue; }
      if (c === '^' && (content === '′' || content === "'")) { out += '′'; continue; }
      out += LX_script(content, c === '^' ? LX_SUP : LX_SUB, c);
      continue;
    }
    if (c === '{' || c === '}') { i++; continue; }
    if (c === '&') { st.ok = false; out += c; i++; continue; }
    if (c === '~') { out += ' '; i++; continue; }
    if (c === '-' ) { out += '−'; i++; continue; }
    if (c === "'") { out += '′'; i++; continue; }
    out += c; i++;
  }
  return out;
}

/** Tách văn bản thành các đoạn: text / inline ($…$) / display ($$…$$) */
function LX_segments(s) {
  s = U_str(s);
  var segs = [], buf = '', i = 0;
  while (i < s.length) {
    if (s[i] === '\\' && s[i + 1] === '$') { buf += '$'; i += 2; continue; }
    if (s[i] === '$') {
      var dbl = s[i + 1] === '$';
      var close = dbl ? s.indexOf('$$', i + 2) : LX_findClose(s, i + 1);
      if (close < 0) { buf += s[i]; i++; continue; }
      if (buf) { segs.push({ type: 'text', value: buf }); buf = ''; }
      segs.push({ type: dbl ? 'display' : 'inline', value: s.substring(i + (dbl ? 2 : 1), close).trim() });
      i = close + (dbl ? 2 : 1);
      continue;
    }
    buf += s[i]; i++;
  }
  if (buf) segs.push({ type: 'text', value: buf });
  return segs;
}
function LX_findClose(s, from) {
  for (var j = from; j < s.length; j++) {
    if (s[j] === '\\') { j++; continue; }
    if (s[j] === '$') return j;
  }
  return -1;
}

function LX_hasMath(s) { return LX_segments(s).some(function (x) { return x.type !== 'text'; }); }

/**
 * Chuẩn bị văn bản cho Google Form.
 * @param {string} s văn bản có thể chứa $…$ / $$…$$
 * @param {Array} images mảng (dùng chung cho cả câu) để thêm công thức cần chuyển thành ảnh
 * @return {{text:string, ok:boolean}} ok=false nếu có công thức phải chuyển thành ảnh
 */
var LX_CODE_TAG = '\u0001CODE\u0001';

/** Cách hiển thị khối code / công thức trên Google Form (đặt từ CauHinh khi xuất Form) */
var LX_CODE_AS_IMAGE = false;   // false: code hiện dạng chữ (giữ thụt lề); true: ảnh PNG (thử nghiệm)
var LX_IMG_COMPLEX = true;      // true: công thức phân số/giới hạn/tổng/tích phân/căn… luôn thành ảnh

/** Giải mã thực thể HTML thường gặp khi code được dán từ trang web (&lt; &gt; &amp; …) */
function LX_decodeEntities(s) {
  return String(s).replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#0?39;/g, "'").replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&');
}

/** Công thức "đơn giản" mới đổi sang chữ Unicode được; còn lại nên là ảnh */
function LX_isSimpleFormula(src) {
  var s = String(src);
  if (s.length > 40) return false;
  return !/\\(frac|dfrac|tfrac|lim|sum|prod|int|oint|sqrt|binom|begin|end|overline|underline|vec|hat|bar|widehat|widetilde|left|right|cdots|ldots|over|choose)(?![A-Za-z])|\\\\/.test(s);
}

/** Đoạn $…$ có phải chuyển thành ảnh không? (sg: phần tử của LX_segments) */
function LX_needsImage(sg) {
  if (sg.type === 'display') return true;
  if (sg.type !== 'inline') return false;
  var r = LX_toUnicode(sg.value);
  if (!r.ok) return true;
  return LX_IMG_COMPLEX && !LX_isSimpleFormula(sg.value);
}

/** Khối code → chữ thường (giữ thụt lề bằng khoảng trắng không ngắt dòng, có vạch dọc bên trái) */
function LX_codeText(code, lang) {
  var NB = ' ';
  var lines = LX_decodeEntities(code).replace(/\r/g, '').replace(/\t/g, '    ').split('\n').map(function (l) {
    l = l.replace(/\s+$/, '');
    var lead = l.match(/^ */)[0].length;
    var rest = l.substring(lead).replace(/ {2,}/g, function (m) { return new Array(m.length + 1).join(NB); });
    return '│' + NB + new Array(lead + 1).join(NB) + rest;
  });
  return (lang ? '▸ Code (' + lang + '):\n' : '▸ Code:\n') + lines.join('\n');
}

/** Khối code ``` … ``` → LaTeX (chữ đều, giữ thụt lề) để render thành ảnh PNG (chế độ thử nghiệm) */
function LX_codeLatex(code) {
  var esc = function (ch) {
    return ({ '\\': '\\textbackslash{}', '{': '\\{', '}': '\\}', '$': '\\$', '%': '\\%', '&': '\\&', '#': '\\#', '_': '\\_',
      '^': '\\textasciicircum{}', '~': '\\textasciitilde{}', ' ': '\\ ', '<': '\\textless{}', '>': '\\textgreater{}', '|': '\\textbar{}' })[ch] || ch;
  };
  var lines = LX_decodeEntities(code).replace(/\t/g, '    ').split('\n').map(function (l) {
    return l ? '\\texttt{' + l.split('').map(esc).join('') + '}' : '\\texttt{\\ }';
  });
  return '\\begin{array}{l}' + lines.join('\\\\') + '\\end{array}';
}

function LX_forForm(s, images) {
  s = U_str(s).replace(/```([\w+#.-]*)[ \t]*\r?\n([\s\S]*?)\r?\n[ \t]*```/g, function (m, lang, body) {
    if (LX_CODE_AS_IMAGE) {
      images.push(LX_CODE_TAG + body);
      return '[CT' + images.length + ']';
    }
    return '\n' + LX_codeText(body, lang) + '\n';
  });
  var segs = LX_segments(s), out = '', allOk = true;
  segs.forEach(function (sg) {
    if (sg.type === 'text') { out += sg.value; return; }
    if (!LX_needsImage(sg)) { out += LX_toUnicode(sg.value).text; return; }
    allOk = false;
    images.push(sg.value);
    out += '[CT' + images.length + ']';
  });
  return { text: out, ok: allOk };
}

/** Văn bản thuần không còn ký hiệu $ (dùng khi cần so sánh / xem trước) */
function LX_plain(s) {
  return LX_segments(s).map(function (sg) {
    return sg.type === 'text' ? sg.value : LX_toUnicode(sg.value).text;
  }).join('');
}

/** URL ảnh PNG của công thức */
function LX_imageUrl(latex, dpi, base) {
  base = base || 'https://latex.codecogs.com/png.image?';
  return base + encodeURIComponent('\\dpi{' + (dpi || 160) + '} ' + latex);
}

/**
 * Ghép danh sách lựa chọn thành MỘT công thức dạng bảng để render 1 ảnh
 * (dùng khi đáp án chứa công thức phức tạp mà Google Form không hiển thị được).
 * @param {Array<{label:string, text:string}>} rows
 */
function LX_rowsLatex(rows) {
  var lines = rows.map(function (r) {
    var body = LX_segments(r.text).map(function (sg) {
      if (sg.type === 'text') return sg.value.trim() ? '\\text{' + sg.value.replace(/([{}%#&_])/g, '\\$1') + '}' : '';
      return sg.value;
    }).join('\\ ');
    return '\\textbf{' + r.label + '}\\quad ' + body;
  });
  return '\\begin{array}{l}' + lines.join('\\\\[6pt]') + '\\end{array}';
}

/* ======================= 12_Core_Bank.gs ======================= */
/**
 * 12_Core_Bank.gs — Đọc, chuẩn hoá và kiểm tra NGÂN HÀNG câu hỏi (THUẦN).
 *
 * Cách ghi cột DapAn theo dạng câu:
 *   MOT_DA       : B
 *   NHIEU_DA     : A,C,D          (thí sinh phải chọn ĐỦ và ĐÚNG mới được điểm)
 *   DUNG_SAI     : Đ,S,Đ,Đ        (theo thứ tự ý A,B,C,D; chấp nhận Đ/D/T/S/F) — phải đúng hết mới được điểm
 *   TRA_LOI_NGAN : 0.5 | 1/2      (nhiều đáp án chấp nhận cách nhau bởi |; số có sai số: 3.14~0.01)
 *   GHEP_NOI     : A-2,B-1,C-3    (ý bên trái ở cột A..E, danh sách bên phải ở cột CotGhep cách nhau bởi |)
 *
 * Cột KhongTron (không trộn đáp án):
 *   (trống)      tự phát hiện: "Tất cả đều đúng", "Cả A và B"… sẽ được giữ cố định
 *   TAT_CA       giữ nguyên thứ tự mọi đáp án của câu này
 *   D,E          giữ cố định vị trí các đáp án D và E
 *   TRON_HET     trộn tất cả, bỏ qua tự phát hiện
 */

var BANK_FIXED_RE = /(tất cả|tat ca|cả hai|ca hai|cả\s+[A-J]\b|không có (đáp án|phương án|ý) nào|đều đúng|đều sai|all of the (above|these)|none of the (above|these)|both|neither)/i;
var BANK_LETTER_REF_RE = /\b[A-J]\b\s*(,|và|va|and|&|hoặc|hoac|or)\s*\b[A-J]\b/;

function Bank_parseTF(tok) {
  var t = U_removeDiacritics(U_str(tok)).toUpperCase();
  if (['D', 'T', 'DUNG', 'TRUE', '1', 'Y'].indexOf(t) >= 0) return true;
  if (['S', 'F', 'SAI', 'FALSE', '0', 'N'].indexOf(t) >= 0) return false;
  return null;
}

/**
 * Phân tích đáp án theo dạng câu.
 * @param {string} dang
 * @param {string} raw
 * @param {{nOpt:number, nRight:number}} ctx số lựa chọn / số mục cột phải (để kiểm tra)
 * @return {{ok:boolean, key:Object, err:string}}
 */
function Bank_parseKey(dang, raw, ctx) {
  ctx = ctx || {};
  var s = U_str(raw);
  if (!s) return { ok: false, err: 'Chưa có đáp án (cột DapAn)' };
  var letters, toks;
  switch (dang) {
    case DANG.MOT_DA:
    case DANG.NHIEU_DA:
      letters = U_upper(s).replace(/HOẶC|HOAC|V[AÀ]|AND|OR/g, ' ').replace(/[^A-J]/g, '').split('');
      letters = letters.filter(function (x, i) { return letters.indexOf(x) === i; }).sort();
      if (!letters.length) return { ok: false, err: 'Đáp án phải là chữ cái A–J' };
      if (dang === DANG.MOT_DA && letters.length !== 1) return { ok: false, err: 'Dạng MOT_DA chỉ có 1 đáp án đúng' };
      if (ctx.nOpt) {
        for (var i = 0; i < letters.length; i++) {
          if (U_letterIndex(letters[i]) >= ctx.nOpt) return { ok: false, err: 'Đáp án ' + letters[i] + ' không có nội dung lựa chọn' };
        }
      }
      return { ok: true, key: { letters: letters } };
    case DANG.DUNG_SAI:
      toks = /[,;|\s]/.test(s) ? s.split(/[,;|\s]+/).filter(String) : Array.from(s);
      var tf = toks.map(Bank_parseTF);
      if (tf.some(function (x) { return x === null; })) return { ok: false, err: 'Đáp án Đúng/Sai chỉ gồm Đ hoặc S, ví dụ: Đ,S,Đ,Đ' };
      if (ctx.nOpt && tf.length !== ctx.nOpt) return { ok: false, err: 'Số đáp án Đ/S (' + tf.length + ') khác số ý (' + ctx.nOpt + ')' };
      return { ok: true, key: { tf: tf } };
    case DANG.TRA_LOI_NGAN:
      var answers = s.split('|').map(function (x) { return x.trim(); }).filter(String).map(function (a) {
        var tol = 0, v = a;
        var m = a.match(/^(.*?)~\s*([0-9.,]+)$/);
        if (m) { v = m[1].trim(); tol = U_parseNumber(m[2]) || 0; }
        return { text: v, norm: U_normText(v), num: U_parseNumber(v), tol: tol };
      });
      if (!answers.length) return { ok: false, err: 'Chưa có đáp án' };
      return { ok: true, key: { answers: answers } };
    case DANG.GHEP_NOI:
      var map = {}, bad = false;
      U_upper(s).split(/[,;|\s]+/).filter(String).forEach(function (p) {
        var m2 = p.match(/^([A-J])\s*[-:=>]*\s*(\d+)$/);
        if (!m2) { bad = true; return; }
        map[m2[1]] = Number(m2[2]);
      });
      if (bad || !Object.keys(map).length) return { ok: false, err: 'Đáp án ghép nối dạng A-2,B-1,C-3' };
      if (ctx.nOpt) {
        for (var k = 0; k < ctx.nOpt; k++) {
          if (!map[APP.LETTERS[k]]) return { ok: false, err: 'Thiếu cặp ghép cho ý ' + APP.LETTERS[k] };
        }
      }
      if (ctx.nRight) {
        for (var kk in map) if (map[kk] < 1 || map[kk] > ctx.nRight) return { ok: false, err: 'Cặp ' + kk + '-' + map[kk] + ' vượt số mục cột phải' };
      }
      return { ok: true, key: { map: map } };
  }
  return { ok: false, err: 'Dạng câu không hợp lệ' };
}

/** Ghi đáp án về dạng chuỗi chuẩn */
function Bank_keyToString(dang, key) {
  if (!key) return '';
  switch (dang) {
    case DANG.MOT_DA: case DANG.NHIEU_DA: return key.letters.join(',');
    case DANG.DUNG_SAI: return key.tf.map(function (b) { return b ? 'Đ' : 'S'; }).join(',');
    case DANG.TRA_LOI_NGAN: return key.answers.map(function (a) { return a.text + (a.tol ? '~' + a.tol : ''); }).join(' | ');
    case DANG.GHEP_NOI: return Object.keys(key.map).sort().map(function (k) { return k + '-' + key.map[k]; }).join(',');
  }
  return '';
}

function Bank_isActive(v) {
  var s = U_removeDiacritics(U_str(v)).toUpperCase();
  return !(s === 'AN' || s === 'HIDE' || s === 'NGUNG' || s === 'KHONG' || s === 'NO' || s === 'X_AN');
}

/** Chuẩn hoá cột KhongTron cho một câu */
function Bank_shuffleRule(raw, options) {
  var s = U_removeDiacritics(U_str(raw)).toUpperCase().replace(/\s+/g, '_');
  if (s === 'TAT_CA' || s === 'ALL' || s === 'CO' || s === 'X' || s === 'GIU_NGUYEN') return { noShuffle: true, fixed: [], auto: false };
  if (s === 'TRON_HET' || s === 'TRON') return { noShuffle: false, fixed: [], auto: false };
  if (s) {
    var fixed = s.replace(/[^A-J]/g, '').split('');
    return { noShuffle: false, fixed: fixed, auto: false };
  }
  // tự phát hiện
  var res = { noShuffle: false, fixed: [], auto: true };
  options.forEach(function (o) {
    var txt = o.vi + ' ' + o.en;
    if (BANK_LETTER_REF_RE.test(txt)) res.noShuffle = true;
    else if (BANK_FIXED_RE.test(txt)) res.fixed.push(o.key);
  });
  return res;
}

function Bank_splitRefs(v) {
  return U_str(v).split(/[\n;]+/).map(function (x) { return x.trim(); }).filter(String);
}

/**
 * Xây dựng ngân hàng từ dữ liệu sheet.
 * @param {Array<Object>} qRows dòng sheet CauHoi (đối tượng theo tên cột, có __row)
 * @param {Array<Object>} gRows dòng sheet Nhom
 * @param {Array<Object>} tRows dòng sheet DanhMuc
 * @param {Array} levels thang mức độ U_parseLevels
 */
function Bank_build(qRows, gRows, tRows, levels) {
  var issues = [];
  var levelCodes = levels.map(function (l) { return l.code; });
  function issue(lv, ma, row, msg) { issues.push({ level: lv, ma: ma, row: row, msg: msg }); }

  var topics = {};
  (tRows || []).forEach(function (r) {
    var code = U_str(r.MaChuDe);
    if (!code) return;
    if (topics[code]) issue('LOI', code, r.__row, 'Mã chủ đề bị trùng trong DanhMuc');
    topics[code] = { code: code, khoi: U_str(r.Khoi_CapDo), chuong: U_str(r.Chuong), chuDe: U_str(r.ChuDe), yccd: U_str(r.YeuCauCanDat) };
  });

  var groups = {};
  (gRows || []).forEach(function (r) {
    var id = U_str(r.MaNhom);
    if (!id) return;
    if (groups[id]) issue('LOI', id, r.__row, 'Mã nhóm bị trùng');
    groups[id] = {
      id: id, maChuDe: U_str(r.MaChuDe), mucDo: U_upper(r.MucDo), dang: U_normDang(r.DangCau),
      vi: U_str(r.NoiDung_VI), en: U_str(r.NoiDung_EN), latex: U_str(r.LaTeX), hinh: Bank_splitRefs(r.HinhAnh),
      video: U_str(r.Video), amThanh: U_str(r.AmThanh), active: Bank_isActive(r.TrangThai), row: r.__row, children: []
    };
  });

  var questions = {};
  (qRows || []).forEach(function (r) {
    var id = U_str(r.MaCH);
    var hasContent = U_str(r.NoiDung_VI) || U_str(r.NoiDung_EN) || U_str(r.A);
    if (!id) { if (hasContent) issue('LOI', '(dòng ' + r.__row + ')', r.__row, 'Thiếu mã câu hỏi MaCH'); return; }
    if (questions[id]) { issue('LOI', id, r.__row, 'Mã câu hỏi bị trùng — dòng sau bị bỏ qua'); return; }
    var q = {
      id: id, maChuDe: U_str(r.MaChuDe), mucDo: U_upper(r.MucDo), dang: U_normDang(r.DangCau), maNhom: U_str(r.MaNhom),
      vi: U_str(r.NoiDung_VI), en: U_str(r.NoiDung_EN), latex: U_str(r.LaTeX), hinh: Bank_splitRefs(r.HinhAnh),
      video: U_str(r.Video), amThanh: U_str(r.AmThanh), loiGiaiVi: U_str(r.LoiGiai_VI), loiGiaiEn: U_str(r.LoiGiai_EN),
      tag: U_str(r.Tag), active: Bank_isActive(r.TrangThai), row: r.__row, keyRaw: U_str(r.DapAn), options: [], right: []
    };
    var g = q.maNhom ? groups[q.maNhom] : null;
    if (q.maNhom && !g) issue('LOI', id, r.__row, 'Mã nhóm ' + q.maNhom + ' không có trong sheet Nhom');
    if (g) {
      if (!q.maChuDe) q.maChuDe = g.maChuDe;
      if (!q.mucDo) q.mucDo = g.mucDo;
      if (!q.dang) q.dang = g.dang;
    }
    APP.LETTERS.forEach(function (L) {
      var raw = U_str(r[L]);
      if (raw) { var b = U_bilingual(raw); q.options.push({ key: L, vi: b.vi, en: b.en, raw: raw }); }
    });
    // lựa chọn phải liền nhau A,B,C… không bỏ trống ở giữa
    q.options.forEach(function (o, idx) {
      if (o.key !== APP.LETTERS[idx]) issue('LOI', id, r.__row, 'Các lựa chọn phải điền liên tiếp từ cột A (đang trống ở giữa)');
    });
    if (U_str(r.CotGhep)) {
      q.right = U_str(r.CotGhep).split('|').map(function (x) { return U_bilingual(x.trim()); }).filter(function (x) { return x.vi || x.en; });
    }
    if (!q.dang) issue('LOI', id, r.__row, 'DangCau không hợp lệ (MOT_DA, NHIEU_DA, DUNG_SAI, TRA_LOI_NGAN, GHEP_NOI)');
    if (!q.mucDo) issue('LOI', id, r.__row, 'Thiếu mức độ MucDo');
    else if (levelCodes.indexOf(q.mucDo) < 0) issue('LOI', id, r.__row, 'Mức độ ' + q.mucDo + ' không có trong thang CauHinh!MUC_DO');
    if (!q.maChuDe) issue('LOI', id, r.__row, 'Thiếu mã chủ đề MaChuDe');
    else if (!topics[q.maChuDe]) issue('CANH_BAO', id, r.__row, 'Mã chủ đề ' + q.maChuDe + ' chưa khai báo trong DanhMuc');
    if (!q.vi && !q.en && !q.latex && !q.hinh.length) issue('LOI', id, r.__row, 'Câu hỏi chưa có nội dung');

    var nOpt = q.options.length;
    if (q.dang === DANG.MOT_DA || q.dang === DANG.NHIEU_DA) {
      if (nOpt < 2) issue('LOI', id, r.__row, 'Cần ít nhất 2 lựa chọn');
    } else if (q.dang === DANG.DUNG_SAI) {
      if (nOpt < 2) issue('LOI', id, r.__row, 'Câu Đúng/Sai cần các ý ở cột A, B, C, D');
      else if (nOpt !== 4) issue('CANH_BAO', id, r.__row, 'Câu Đúng/Sai có ' + nOpt + ' ý (chuẩn là 4)');
    } else if (q.dang === DANG.GHEP_NOI) {
      if (nOpt < 2) issue('LOI', id, r.__row, 'Câu ghép nối cần ít nhất 2 ý bên trái (cột A, B, …)');
      if (q.right.length < 2) issue('LOI', id, r.__row, 'Câu ghép nối cần cột CotGhep (các mục bên phải cách nhau bởi |)');
    }
    if (q.dang) {
      var pk = Bank_parseKey(q.dang, q.keyRaw, { nOpt: (q.dang === DANG.TRA_LOI_NGAN ? 0 : nOpt), nRight: q.right.length });
      if (!pk.ok) issue('LOI', id, r.__row, pk.err);
      else q.key = pk.key;
    }
    q.shuffle = Bank_shuffleRule(r.KhongTron, q.options);
    if (LX_segments(q.vi).some(function (x) { return x.type === 'inline' && !LX_toUnicode(x.value).ok; })) {
      issue('CANH_BAO', id, r.__row, 'Có công thức $…$ phức tạp — sẽ chuyển thành ảnh [CT]');
    }
    q.valid = !!(q.dang && q.key && q.mucDo && q.maChuDe && levelCodes.indexOf(q.mucDo) >= 0 &&
      !issues.some(function (x) { return x.ma === id && x.level === 'LOI'; }));
    questions[id] = q;
    if (g) g.children.push(id);
  });

  // Đơn vị bốc đề: câu đơn hoặc cả nhóm (câu chùm luôn đi liền nhau)
  var units = [];
  Object.keys(questions).forEach(function (id) {
    var q = questions[id];
    if (q.maNhom || !q.active || !q.valid) return;
    units.push(Bank_unit('Q:' + id, 'Q', [id], q, topics));
  });
  Object.keys(groups).forEach(function (gid) {
    var g = groups[gid];
    var kids = g.children.filter(function (cid) { return questions[cid].active; });
    if (!g.active) return;
    if (!kids.length) { issue('CANH_BAO', gid, g.row, 'Nhóm chưa có câu hỏi con nào đang dùng'); return; }
    var invalid = kids.filter(function (cid) { return !questions[cid].valid; });
    if (invalid.length) { issue('LOI', gid, g.row, 'Nhóm có câu con lỗi: ' + invalid.join(', ') + ' — nhóm tạm không được bốc'); return; }
    var dangs = kids.map(function (cid) { return questions[cid].dang; });
    if (dangs.some(function (d) { return d !== dangs[0]; })) {
      issue('LOI', gid, g.row, 'Các câu trong một nhóm phải cùng dạng câu (để nằm cùng một Phần)'); return;
    }
    var first = questions[kids[0]];
    var meta = { maChuDe: g.maChuDe || first.maChuDe, mucDo: g.mucDo || first.mucDo, dang: dangs[0] };
    units.push(Bank_unit('G:' + gid, 'G', kids, meta, topics));
  });

  return { questions: questions, groups: groups, topics: topics, units: units, issues: issues, levels: levels };
}

function Bank_unit(uid, kind, ids, meta, topics) {
  var t = topics[meta.maChuDe] || {};
  return {
    uid: uid, kind: kind, ids: ids, size: ids.length, maChuDe: meta.maChuDe, chuong: t.chuong || '',
    mucDo: meta.mucDo, dang: meta.dang
  };
}

/** Thống kê số câu theo Chương/Chủ đề × Mức độ × Dạng (chỉ câu hợp lệ, đang dùng) */
function Bank_summary(bank) {
  var rows = {};
  bank.units.forEach(function (u) {
    var k = u.maChuDe + '|' + u.dang;
    if (!rows[k]) rows[k] = { maChuDe: u.maChuDe, chuong: u.chuong, chuDe: (bank.topics[u.maChuDe] || {}).chuDe || '', dang: u.dang, byLevel: {}, total: 0 };
    rows[k].byLevel[u.mucDo] = (rows[k].byLevel[u.mucDo] || 0) + u.size;
    rows[k].total += u.size;
  });
  return Object.keys(rows).sort().map(function (k) { return rows[k]; });
}

/* ======================= 13_Core_Matrix.gs ======================= */
/**
 * 13_Core_Matrix.gs — MA TRẬN ĐẶC TẢ (THUẦN)
 *
 * Sheet MaTran_Phan  : mỗi dòng = 1 Phần của đề (Phần I trắc nghiệm, Phần II Đúng/Sai, Phần III trả lời ngắn…)
 *     DiemPhan       : tổng điểm của phần (các câu trong phần chia đều)
 *     TongSoCau      : tổng số câu của phần (bắt buộc nếu dùng TiLe %)
 *     DangCauChoPhep : các dạng câu được phép trong phần, ví dụ MOT_DA,NHIEU_DA
 * Sheet MaTran_ChiTiet: mỗi dòng = 1 ô của ma trận (bộ lọc + số câu)
 *     Chuong / MaChuDe / MucDo / DangCau : để trống = không lọc; có thể ghi nhiều giá trị cách nhau bởi dấu phẩy
 *     SoCau          : số câu cần bốc cho ô này, HOẶC
 *     TiLe           : % số câu của phần (hệ thống tự làm tròn để tổng đúng bằng TongSoCau)
 */

function Mx_build(maMaTran, phanRows, cellRows) {
  var issues = [];
  var secs = phanRows.filter(function (r) { return U_str(r.MaMaTran) === maMaTran; });
  if (!secs.length) issues.push({ level: 'LOI', msg: 'Ma trận ' + maMaTran + ' chưa có Phần nào (sheet MaTran_Phan)' });
  var sections = secs.map(function (r, si) {
    var phan = U_str(r.Phan) || String(si + 1);
    var sec = {
      si: si, phan: phan, ten: U_str(r.TenPhan) || ('Phần ' + phan), diem: U_num(r.DiemPhan, 0),
      tongSoCau: U_num(r.TongSoCau, 0), allowed: U_splitList(r.DangCauChoPhep).map(U_normDang).filter(String),
      cells: [], maMon: U_str(r.MaMon), tenMaTran: U_str(r.TenMaTran)
    };
    var cRows = cellRows.filter(function (c) { return U_str(c.MaMaTran) === maMaTran && U_str(c.Phan) === phan; });
    sec.cells = cRows.map(function (c, ci) {
      return {
        ci: ci, chuong: U_splitList(c.Chuong), maChuDe: U_splitList(c.MaChuDe), mucDo: U_splitList(c.MucDo).map(U_upper),
        dang: U_splitList(c.DangCau).map(U_normDang).filter(String), soCau: U_num(c.SoCau, null), tiLe: U_num(c.TiLe, null),
        ghiChu: U_str(c.GhiChu), row: c.__row
      };
    });
    if (!sec.cells.length) {
      sec.cells = [{ ci: 0, chuong: [], maChuDe: [], mucDo: [], dang: [], soCau: sec.tongSoCau, tiLe: null, ghiChu: '(toàn bộ phần)' }];
    }
    Mx_computeCounts(sec, issues);
    sec.need = sec.cells.reduce(function (a, c) { return a + c.need; }, 0);
    if (sec.tongSoCau && sec.need !== sec.tongSoCau) {
      issues.push({ level: 'LOI', msg: sec.ten + ': tổng số câu các ô (' + sec.need + ') khác TongSoCau (' + sec.tongSoCau + ')' });
    }
    if (sec.diem <= 0) issues.push({ level: 'LOI', msg: sec.ten + ': chưa có DiemPhan' });
    return sec;
  });
  var totalPoints = sections.reduce(function (a, s) { return a + s.diem; }, 0);
  return {
    id: maMaTran, sections: sections, issues: issues, totalPoints: totalPoints,
    totalQuestions: sections.reduce(function (a, s) { return a + s.need; }, 0),
    maMon: sections.length ? sections[0].maMon : '', ten: sections.length ? sections[0].tenMaTran : ''
  };
}

/** Tính số câu từng ô: SoCau cố định, phần còn lại chia theo TiLe bằng phương pháp phần dư lớn nhất */
function Mx_computeCounts(sec, issues) {
  var fixed = 0, pctCells = [];
  sec.cells.forEach(function (c) {
    if (c.soCau !== null && c.soCau !== undefined && c.soCau !== '') { c.need = Math.max(0, Math.round(c.soCau)); fixed += c.need; }
    else if (c.tiLe !== null && c.tiLe !== undefined) pctCells.push(c);
    else { c.need = 0; issues.push({ level: 'CANH_BAO', msg: sec.ten + ': một ô chưa có SoCau hoặc TiLe (tính là 0 câu)' }); }
  });
  if (pctCells.length) {
    if (!sec.tongSoCau) {
      issues.push({ level: 'LOI', msg: sec.ten + ': dùng TiLe % thì phải có TongSoCau' });
      pctCells.forEach(function (c) { c.need = 0; });
      return;
    }
    var remain = sec.tongSoCau - fixed;
    var sumPct = pctCells.reduce(function (a, c) { return a + c.tiLe; }, 0) || 1;
    var raw = pctCells.map(function (c) { return remain * c.tiLe / sumPct; });
    var floors = raw.map(Math.floor);
    var left = remain - floors.reduce(function (a, b) { return a + b; }, 0);
    var order = raw.map(function (v, i) { return { i: i, frac: v - floors[i] }; }).sort(function (a, b) { return b.frac - a.frac; });
    for (var k = 0; k < left && k < order.length; k++) floors[order[k].i]++;
    pctCells.forEach(function (c, i) { c.need = floors[i]; });
    if (Math.abs(sumPct - 100) > 0.01) issues.push({ level: 'CANH_BAO', msg: sec.ten + ': tổng TiLe = ' + sumPct + '% (không phải 100%), đã chia theo tỉ lệ tương đối' });
  }
}

function Mx_norm(s) { return U_removeDiacritics(U_str(s)).toLowerCase().replace(/\s+/g, ' ').trim(); }

function Mx_chuongMatch(unitChuong, list) {
  if (!list.length) return true;
  var u = Mx_norm(unitChuong);
  return list.some(function (v) {
    var n = Mx_norm(v);
    return u === n || u.indexOf(n + '.') === 0 || u.indexOf(n + ' ') === 0 || u.indexOf(n + ':') === 0;
  });
}

function Mx_matches(unit, cell, sec) {
  if (sec.allowed.length && sec.allowed.indexOf(unit.dang) < 0) return false;
  if (cell.dang.length && cell.dang.indexOf(unit.dang) < 0) return false;
  if (cell.maChuDe.length && cell.maChuDe.indexOf(unit.maChuDe) < 0) return false;
  if (cell.mucDo.length && cell.mucDo.indexOf(unit.mucDo) < 0) return false;
  if (!Mx_chuongMatch(unit.chuong, cell.chuong)) return false;
  return true;
}

function Mx_specificity(cell) {
  return (cell.maChuDe.length ? 4 : 0) + (cell.chuong.length ? 2 : 0) + (cell.mucDo.length ? 2 : 0) + (cell.dang.length ? 1 : 0);
}

function Mx_cellLabel(sec, cell) {
  var parts = [];
  if (cell.chuong.length) parts.push('Chương ' + cell.chuong.join('/'));
  if (cell.maChuDe.length) parts.push('Chủ đề ' + cell.maChuDe.join('/'));
  if (cell.mucDo.length) parts.push('Mức ' + cell.mucDo.join('/'));
  if (cell.dang.length) parts.push(cell.dang.join('/'));
  return sec.ten + ' › ' + (parts.length ? parts.join(', ') : 'Bất kỳ');
}

/** Tập tổng kích thước có thể tạo được (subset-sum) đến giới hạn */
function Mx_reachable(sizes, limit) {
  var can = [true];
  for (var i = 1; i <= limit; i++) can[i] = false;
  sizes.forEach(function (s) {
    for (var t = limit; t >= s; t--) if (can[t - s]) can[t] = true;
  });
  return can;
}

/**
 * Kiểm tra khả thi từng ô ma trận.
 * @return {Array} [{label, need, supply, needAll, status, note}]
 */
function Mx_feasibility(matrix, bank, nVariants, cheDo) {
  var out = [];
  nVariants = Math.max(1, nVariants || 1);
  matrix.sections.forEach(function (sec) {
    sec.cells.forEach(function (cell) {
      var cands = bank.units.filter(function (u) { return Mx_matches(u, cell, sec); });
      var supply = cands.reduce(function (a, u) { return a + u.size; }, 0);
      var sizes = cands.map(function (u) { return u.size; });
      var reach = Mx_reachable(sizes, cell.need);
      var needAll = cheDo === CHE_DO.B_KHAC ? cell.need * nVariants : cell.need;
      var st = 'OK', note = '';
      if (cell.need === 0) { st = 'OK'; note = 'Ô 0 câu'; }
      else if (!reach[cell.need]) { st = 'THIEU'; note = supply < cell.need ? 'Thiếu ' + (cell.need - supply) + ' câu' : 'Không ghép đủ đúng ' + cell.need + ' câu (do câu chùm theo nhóm)'; }
      else if (cheDo === CHE_DO.B_KHAC && supply < needAll) {
        st = 'TRUNG';
        note = 'Đủ cho từng mã đề nhưng các mã đề sẽ dùng chung khoảng ' + (needAll - supply) + ' lượt câu';
      }
      out.push({ phan: sec.phan, label: Mx_cellLabel(sec, cell), need: cell.need, supply: supply, needAll: needAll, status: st, note: note });
    });
  });
  return out;
}

/* ======================= 14_Core_Generate.gs ======================= */
/**
 * 14_Core_Generate.gs — SINH MÃ ĐỀ theo ma trận (THUẦN)
 *
 * Chế độ A_TRON : bốc 1 bộ câu theo ma trận, mọi mã đề dùng chung bộ câu, chỉ trộn thứ tự câu và đáp án.
 * Chế độ B_KHAC : mỗi mã đề bốc riêng theo cùng ma trận (cùng số câu mỗi Chương × Mức độ × Dạng
 *                 => tương đương độ khó), ưu tiên câu ít được dùng nhất để các mã đề trùng nhau ít nhất.
 * Câu bị KHOÁ (cột Khoa = TRUE trong sheet DeThi) được giữ lại khi bấm "Sinh lại".
 */

/** Chọn tập đơn vị có tổng kích thước đúng bằng need. Ưu tiên theo thứ tự cands. */
function Gen_fill(cands, need) {
  if (need <= 0) return [];
  var pick = [], rem = need;
  for (var i = 0; i < cands.length && rem > 0; i++) {
    if (cands[i].size <= rem) { pick.push(cands[i]); rem -= cands[i].size; }
  }
  if (rem === 0) return pick;
  // quay lui (giới hạn số bước) khi có câu chùm làm lệch tổng
  var best = null, steps = 0;
  (function dfs(idx, r, acc) {
    if (best || steps++ > 50000) return;
    if (r === 0) { best = acc.slice(); return; }
    for (var j = idx; j < cands.length; j++) {
      if (cands[j].size <= r) { acc.push(cands[j]); dfs(j + 1, r - cands[j].size, acc); acc.pop(); if (best) return; }
    }
  })(0, need, []);
  return best;
}

/** Sắp ứng viên: trộn ngẫu nhiên rồi ưu tiên câu ít dùng */
function Gen_orderCands(cands, rnd, usage) {
  var sh = U_shuffle(cands, rnd);
  if (!usage) return sh;
  return sh.map(function (u, i) { return { u: u, i: i, n: usage[u.uid] || 0 }; })
    .sort(function (a, b) { return a.n - b.n || a.i - b.i; })
    .map(function (x) { return x.u; });
}

/**
 * Bốc câu cho một mã đề.
 * @param locked [{uid, si, ci}] các đơn vị bị khoá phải giữ
 * @return {{picks:Array<{si,ci,unit,locked}>, errors:Array<string>, warnings:Array<string>}}
 */
function Gen_select(matrix, bank, rnd, usage, locked) {
  var unitMap = {};
  bank.units.forEach(function (u) { unitMap[u.uid] = u; });
  var used = {}, picks = [], errors = [], warnings = [];
  var remain = matrix.sections.map(function (s) { return s.cells.map(function (c) { return c.need; }); });

  (locked || []).forEach(function (lk) {
    var u = unitMap[lk.uid];
    if (!u) { warnings.push('Câu khoá ' + lk.uid + ' không còn hợp lệ trong ngân hàng — bỏ khoá'); return; }
    if (used[u.uid]) return;
    var sec = matrix.sections[lk.si], cell = sec && sec.cells[lk.ci];
    if (!cell || !Mx_matches(u, cell, sec) || remain[lk.si][lk.ci] < u.size) {
      warnings.push('Câu khoá ' + lk.uid + ' không còn khớp ô ma trận — bỏ khoá'); return;
    }
    used[u.uid] = true; remain[lk.si][lk.ci] -= u.size;
    picks.push({ si: lk.si, ci: lk.ci, unit: u, locked: true });
  });

  var cellOrder = [];
  matrix.sections.forEach(function (sec) {
    sec.cells.forEach(function (cell) { cellOrder.push({ sec: sec, cell: cell, sp: Mx_specificity(cell) }); });
  });
  cellOrder.sort(function (a, b) { return b.sp - a.sp || a.sec.si - b.sec.si || a.cell.ci - b.cell.ci; });

  cellOrder.forEach(function (co) {
    var need = remain[co.sec.si][co.cell.ci];
    if (need <= 0) return;
    var cands = bank.units.filter(function (u) { return !used[u.uid] && Mx_matches(u, co.cell, co.sec); });
    var chosen = Gen_fill(Gen_orderCands(cands, rnd, usage), need);
    if (!chosen) {
      errors.push(Mx_cellLabel(co.sec, co.cell) + ': cần ' + need + ' câu nhưng ngân hàng không đủ (còn ' +
        cands.reduce(function (a, u) { return a + u.size; }, 0) + ' câu phù hợp chưa dùng)');
      return;
    }
    chosen.forEach(function (u) {
      used[u.uid] = true;
      picks.push({ si: co.sec.si, ci: co.cell.ci, unit: u, locked: false });
    });
  });
  return { picks: picks, errors: errors, warnings: warnings };
}

/** Hoán vị đáp án/ý: trả về mảng chữ cái GỐC theo thứ tự HIỂN THỊ */
function Gen_perm(q, exam, rnd) {
  if (q.dang === DANG.TRA_LOI_NGAN) return [];
  var keys = q.options.map(function (o) { return o.key; });
  var allow;
  if (q.dang === DANG.DUNG_SAI) allow = exam.tronYDungSai;
  else allow = exam.tronDapAn;
  if (!allow || q.shuffle.noShuffle || keys.length < 2) return keys;
  var fixed = (q.shuffle.fixed || []).filter(function (L) { return keys.indexOf(L) >= 0; });
  var movable = keys.filter(function (L) { return fixed.indexOf(L) < 0; });
  var sh = U_shuffle(movable, rnd), out = [], k = 0;
  keys.forEach(function (L) { out.push(fixed.indexOf(L) >= 0 ? L : sh[k++]); });
  return out;
}

/** Đáp án theo ký hiệu HIỂN THỊ của mã đề */
function Gen_displayKey(dang, key, perm) {
  if (!key) return '';
  switch (dang) {
    case DANG.MOT_DA: case DANG.NHIEU_DA:
      return key.letters.map(function (L) { return APP.LETTERS[perm.indexOf(L)]; }).sort().join(',');
    case DANG.DUNG_SAI:
      return perm.map(function (L) { return key.tf[U_letterIndex(L)] ? 'Đ' : 'S'; }).join(',');
    case DANG.GHEP_NOI:
      return perm.map(function (L, i) { return APP.LETTERS[i] + '-' + key.map[L]; }).join(',');
    case DANG.TRA_LOI_NGAN:
      return Bank_keyToString(dang, key);
  }
  return '';
}

/** Sắp thứ tự đơn vị trong một phần */
function Gen_orderUnits(entries, tronCau, rnd, levels) {
  if (tronCau) return U_shuffle(entries, rnd);
  var ord = {};
  levels.forEach(function (l) { ord[l.code] = l.order; });
  return entries.slice().sort(function (a, b) {
    return (ord[a.unit.mucDo] || 0) - (ord[b.unit.mucDo] || 0) || (a.unit.chuong < b.unit.chuong ? -1 : a.unit.chuong > b.unit.chuong ? 1 : 0) ||
      (a.unit.uid < b.unit.uid ? -1 : 1);
  });
}

/**
 * Chuyển "kế hoạch" (đơn vị đã sắp theo phần) thành các dòng DeThi.
 * plan = [{si, entries:[{unit, ci, locked}]}], perms = {MaCH: [..]}
 */
function Gen_planToItems(exam, matrix, bank, maDe, plan, perms) {
  var items = [], stt = 0;
  plan.forEach(function (p) {
    var sec = matrix.sections[p.si];
    var nQ = p.entries.reduce(function (a, e) { return a + e.unit.size; }, 0);
    var pts = nQ ? sec.diem / nQ : 0;
    p.entries.forEach(function (e) {
      e.unit.ids.forEach(function (qid) {
        var q = bank.questions[qid];
        var perm = perms[qid] || [];
        stt++;
        items.push({
          MaKyThi: exam.maKyThi, MaDe: maDe, Phan: sec.phan, STT: stt, MaCH: qid, MaNhom: q.maNhom || '',
          DangCau: q.dang, MaChuDe: q.maChuDe, MucDo: q.mucDo, OMaTran: p.si + ':' + e.ci, ThuTu: perm.join(','),
          DapAnGoc: Bank_keyToString(q.dang, q.key), DapAnMaDe: Gen_displayKey(q.dang, q.key, perm),
          Diem: U_round(pts, 4), Khoa: !!e.locked, FormItemId: '', GhiChu: ''
        });
      });
    });
  });
  return items;
}

function Gen_variantCodes(exam) {
  var start = U_str(exam.maDeBatDau) || '101';
  var n = Math.max(1, Math.round(exam.soMaDe || 1));
  var codes = [];
  if (/^\d+$/.test(start)) { for (var i = 0; i < n; i++) codes.push(String(Number(start) + i)); }
  else { for (var j = 0; j < n; j++) codes.push(start + (j + 1)); }
  return codes;
}

function Gen_uidOfItem(it) { return it.MaNhom ? 'G:' + it.MaNhom : 'Q:' + it.MaCH; }

/** Lấy danh sách đơn vị bị khoá từ các dòng DeThi cũ */
function Gen_lockedFromItems(items) {
  var out = {}, seen = {};
  items.forEach(function (it) {
    if (!U_bool(it.Khoa, false)) return;
    var uid = Gen_uidOfItem(it), md = U_str(it.MaDe);
    var k = md + '|' + uid;
    if (seen[k]) return; seen[k] = true;
    var sc = U_str(it.OMaTran).split(':');
    (out[md] = out[md] || []).push({ uid: uid, si: Number(sc[0]), ci: Number(sc[1]) });
  });
  return out;
}

/**
 * Sinh toàn bộ mã đề của kỳ thi.
 * @param exam {maKyThi, cheDo, soMaDe, maDeBatDau, tronCau, tronDapAn, tronYDungSai, seed}
 * @param prevItems các dòng DeThi hiện có của kỳ thi (để giữ câu khoá)
 */
function Gen_generate(exam, matrix, bank, prevItems) {
  var codes = Gen_variantCodes(exam);
  var lockedBy = Gen_lockedFromItems(prevItems || []);
  var result = { variants: [], errors: [], warnings: [] };
  matrix.issues.forEach(function (x) { if (x.level === 'LOI') result.errors.push('Ma trận: ' + x.msg); });
  if (result.errors.length) return result;

  var basePicks = null;
  if (exam.cheDo === CHE_DO.A_TRON) {
    var allLocked = [], seen = {};
    Object.keys(lockedBy).forEach(function (md) {
      lockedBy[md].forEach(function (lk) { if (!seen[lk.uid]) { seen[lk.uid] = true; allLocked.push(lk); } });
    });
    var sel = Gen_select(matrix, bank, U_rng(exam.seed + '|BASE'), null, allLocked);
    sel.errors.forEach(function (e) { result.errors.push(e); });
    sel.warnings.forEach(function (w) { result.warnings.push(w); });
    basePicks = sel.picks;
  }

  var usage = {};
  codes.forEach(function (md) {
    var rnd = U_rng(exam.seed + '|' + md);
    var picks;
    if (basePicks) picks = basePicks;
    else {
      var s = Gen_select(matrix, bank, rnd, usage, lockedBy[md]);
      s.errors.forEach(function (e) { result.errors.push('Mã ' + md + ': ' + e); });
      s.warnings.forEach(function (w) { result.warnings.push('Mã ' + md + ': ' + w); });
      picks = s.picks;
      picks.forEach(function (p) { usage[p.unit.uid] = (usage[p.unit.uid] || 0) + 1; });
    }
    var plan = matrix.sections.map(function (sec) {
      var entries = picks.filter(function (p) { return p.si === sec.si; }).map(function (p) { return { unit: p.unit, ci: p.ci, locked: p.locked }; });
      return { si: sec.si, entries: Gen_orderUnits(entries, exam.tronCau, rnd, bank.levels) };
    });
    var perms = {};
    plan.forEach(function (p) {
      p.entries.forEach(function (e) {
        e.unit.ids.forEach(function (qid) { perms[qid] = Gen_perm(bank.questions[qid], exam, rnd); });
      });
    });
    result.variants.push({ maDe: md, items: Gen_planToItems(exam, matrix, bank, md, plan, perms) });
  });
  result.stats = Gen_stats(result.variants, bank);
  return result;
}

/**
 * ĐỀ RIÊNG cho một thí sinh (sau khi đã chốt đề), mã đề mới `newCode`.
 *  mode TRON: cùng bộ câu của mã đề `baseMd`, trộn lại thứ tự câu + đáp án.
 *  mode MOI : rút bộ câu mới theo đúng ma trận, ưu tiên câu CHƯA xuất hiện trong các mã đề hiện có.
 */
function Gen_extraVariant(exam, matrix, bank, allItems, baseMd, newCode, mode, salt) {
  var rnd = U_rng(exam.seed + '|RIENG|' + newCode + '|' + (salt || ''));
  var ex2 = {}; Object.keys(exam).forEach(function (k) { ex2[k] = exam[k]; });
  ex2.tronCau = true; ex2.tronDapAn = true;
  var plan, out = { items: null, errors: [], warnings: [] };
  if (mode === 'MOI') {
    var usage = {};
    allItems.forEach(function (it) { var u = Gen_uidOfItem(it); usage[u] = (usage[u] || 0) + 1000; });
    var sel = Gen_select(matrix, bank, rnd, usage, null);
    sel.errors.forEach(function (e) { out.errors.push(e); });
    sel.warnings.forEach(function (w) { out.warnings.push(w); });
    if (out.errors.length) return out;
    var reused = sel.picks.filter(function (p) { return usage[p.unit.uid]; }).length;
    if (reused) out.warnings.push(reused + ' câu/nhóm phải dùng lại từ đề cũ vì ngân hàng không đủ câu mới cho ô ma trận');
    plan = matrix.sections.map(function (sec) {
      return { si: sec.si, entries: U_shuffle(sel.picks.filter(function (p) { return p.si === sec.si; }).map(function (p) { return { unit: p.unit, ci: p.ci, locked: false }; }), rnd) };
    });
  } else {
    var base = allItems.filter(function (x) { return U_str(x.MaDe) === String(baseMd); });
    if (!base.length) { out.errors.push('Không có mã đề gốc ' + baseMd); return out; }
    plan = Gen_planFromItems(matrix, bank, base).plan.map(function (p) { return { si: p.si, entries: U_shuffle(p.entries, rnd) }; });
  }
  var perms = {};
  plan.forEach(function (p) { p.entries.forEach(function (e) { e.unit.ids.forEach(function (qid) { if (bank.questions[qid]) perms[qid] = Gen_perm(bank.questions[qid], ex2, rnd); }); }); });
  out.items = Gen_planToItems(exam, matrix, bank, String(newCode), plan, perms);
  return out;
}

/** Dựng lại kế hoạch từ các dòng DeThi của một mã đề */
function Gen_planFromItems(matrix, bank, items) {
  var unitMap = {};
  bank.units.forEach(function (u) { unitMap[u.uid] = u; });
  var sorted = items.slice().sort(function (a, b) { return Number(a.STT) - Number(b.STT); });
  var plan = matrix.sections.map(function (s) { return { si: s.si, entries: [] }; });
  var perms = {}, lastUid = null;
  sorted.forEach(function (it) {
    var sc = U_str(it.OMaTran).split(':');
    var si = Number(sc[0]), ci = Number(sc[1]);
    var uid = Gen_uidOfItem(it);
    perms[U_str(it.MaCH)] = U_str(it.ThuTu) ? U_str(it.ThuTu).split(',') : [];
    if (uid === lastUid) return;
    lastUid = uid;
    var u = unitMap[uid] || { uid: uid, ids: [U_str(it.MaCH)], size: 1, missing: true };
    if (u.missing && it.MaNhom) {
      u.ids = sorted.filter(function (x) { return U_str(x.MaNhom) === U_str(it.MaNhom); }).map(function (x) { return U_str(x.MaCH); });
      u.size = u.ids.length;
    }
    if (plan[si]) plan[si].entries.push({ unit: u, ci: ci, locked: U_bool(it.Khoa, false) });
  });
  return { plan: plan, perms: perms };
}

/**
 * Đổi một câu (hoặc cả nhóm chứa câu đó) bằng câu khác cùng ô ma trận.
 * Chế độ A_TRON: đổi đồng loạt ở MỌI mã đề.
 * @param allItems tất cả dòng DeThi của kỳ thi
 * @return {{items:Array|null, error:string, oldUid, newUid}}
 */
function Gen_swap(exam, matrix, bank, allItems, maDe, maCH, salt) {
  var byVar = U_groupBy(allItems, function (x) { return U_str(x.MaDe); });
  var target = (byVar[maDe] || []).filter(function (x) { return U_str(x.MaCH) === maCH; })[0];
  if (!target) return { items: null, error: 'Không tìm thấy câu ' + maCH + ' trong mã đề ' + maDe };
  var oldUid = Gen_uidOfItem(target);
  var sc = U_str(target.OMaTran).split(':');
  var si = Number(sc[0]), ci = Number(sc[1]);
  var sec = matrix.sections[si], cell = sec && sec.cells[ci];
  if (!cell) return { items: null, error: 'Ô ma trận của câu không còn tồn tại — hãy Sinh lại đề' };
  var affected = exam.cheDo === CHE_DO.A_TRON ? Object.keys(byVar) : [maDe];
  var usedIn = {}, usage = {};
  allItems.forEach(function (it) {
    var u = Gen_uidOfItem(it);
    if (affected.indexOf(U_str(it.MaDe)) >= 0) usedIn[u] = true;
    usage[u] = (usage[u] || 0) + 1;
  });
  var oldSize = (byVar[maDe].filter(function (x) { return Gen_uidOfItem(x) === oldUid; })).length;
  var rnd = U_rng(exam.seed + '|swap|' + maDe + '|' + maCH + '|' + (salt || Date.now()));
  var cands = bank.units.filter(function (u) { return !usedIn[u.uid] && u.size === oldSize && Mx_matches(u, cell, sec); });
  if (!cands.length) return { items: null, error: 'Không còn câu nào khác cùng ô (' + Mx_cellLabel(sec, cell) + ') với cùng số câu để đổi' };
  var newUnit = Gen_orderCands(cands, rnd, usage)[0];
  var out = [];
  Object.keys(byVar).forEach(function (md) {
    if (affected.indexOf(md) < 0) { out = out.concat(byVar[md]); return; }
    var pf = Gen_planFromItems(matrix, bank, byVar[md]);
    var vr = U_rng(exam.seed + '|swapperm|' + md + '|' + newUnit.uid);
    pf.plan.forEach(function (p) {
      p.entries.forEach(function (e, idx) {
        if (e.unit.uid === oldUid) {
          p.entries[idx] = { unit: newUnit, ci: e.ci, locked: false };
          newUnit.ids.forEach(function (qid) { pf.perms[qid] = Gen_perm(bank.questions[qid], exam, vr); });
        }
      });
    });
    out = out.concat(Gen_planToItems(exam, matrix, bank, md, pf.plan, pf.perms));
  });
  return { items: out, error: '', oldUid: oldUid, newUid: newUnit.uid };
}

/** Thống kê mã đề: số câu theo mức độ, độ trùng giữa các cặp mã đề */
function Gen_stats(variants, bank) {
  var per = variants.map(function (v) {
    var lv = {};
    v.items.forEach(function (it) { lv[it.MucDo] = (lv[it.MucDo] || 0) + 1; });
    return { maDe: v.maDe, soCau: v.items.length, byLevel: lv };
  });
  var overlap = [];
  for (var i = 0; i < variants.length; i++) {
    for (var j = i + 1; j < variants.length; j++) {
      var a = {}, shared = 0;
      variants[i].items.forEach(function (x) { a[x.MaCH] = true; });
      variants[j].items.forEach(function (x) { if (a[x.MaCH]) shared++; });
      overlap.push({ a: variants[i].maDe, b: variants[j].maDe, shared: shared,
        pct: variants[i].items.length ? Math.round(100 * shared / variants[i].items.length) : 0 });
    }
  }
  return { perVariant: per, overlap: overlap };
}

/** Đọc dòng sheet KyThi thành đối tượng dùng cho bộ sinh đề */
function Gen_examFromRow(r) {
  var seedBase = U_str(r.HatGiong) || U_str(r.MaKyThi);
  return {
    maKyThi: U_str(r.MaKyThi), ten: U_str(r.TenKyThi), maMon: U_str(r.MaMon), maMaTran: U_str(r.MaMaTran),
    cheDo: U_upper(r.CheDo) === CHE_DO.A_TRON ? CHE_DO.A_TRON : CHE_DO.B_KHAC,
    soMaDe: Math.max(1, Math.round(U_num(r.SoMaDe, 1))), maDeBatDau: U_str(r.MaDeBatDau) || '101',
    tronCau: U_bool(r.TronCau, true), tronDapAn: U_bool(r.TronDapAn, true), tronYDungSai: U_bool(r.TronYDungSai, true),
    thoiGian: U_num(r.ThoiGianPhut, 0), seed: seedBase + ':' + (U_num(r.LanSinh, 0) || 0)
  };
}

/* ======================= 15_Core_Grade.gs ======================= */
/**
 * 15_Core_Grade.gs — CHẤM ĐIỂM (THUẦN)
 *
 * Luật chấm (theo yêu cầu):
 *  - Mỗi Phần có tổng điểm riêng; các câu trong phần chia đều điểm.
 *  - Sai hoặc bỏ trống: 0 điểm câu đó, KHÔNG trừ điểm.
 *  - NHIEU_DA: chọn đủ và đúng toàn bộ mới được điểm.
 *  - DUNG_SAI: đúng TẤT CẢ các ý mới được điểm cả câu.
 *  - GHEP_NOI: đúng tất cả các cặp mới được điểm.
 *  - Phúc khảo (sheet PhucKhao): DOI_DAP_AN, THEM_DAP_AN, TANG_DIEM, LOAI_CAU.
 *  Đáp án dùng để chấm là bản CHỤP lúc xuất đề (cột DapAnGoc trong DeThi) + điều chỉnh phúc khảo,
 *  nên sửa ngân hàng sau khi thi không làm thay đổi điểm một cách ngầm.
 */

var GR_TRUE_LABEL = 'Đúng / True';
var GR_FALSE_LABEL = 'Sai / False';

/** Đọc chữ cái ở đầu nhãn lựa chọn "B. nội dung" */
function Grade_letterOf(label) {
  var m = U_str(label).match(/^([A-J])(?:[.)]|\s|$)/);
  return m ? m[1] : '';
}

function Grade_toArray(raw) {
  if (raw === null || raw === undefined || raw === '') return [];
  if (Array.isArray(raw)) return raw;
  return [raw];
}

/**
 * Chuyển câu trả lời trên Form (ký hiệu HIỂN THỊ) về ký hiệu GỐC của ngân hàng.
 * @param {string} dang
 * @param {Array<string>} perm chữ cái gốc theo thứ tự hiển thị
 * @param {*} raw giá trị lấy từ ItemResponse.getResponse()
 */
function Grade_toOriginal(dang, perm, raw) {
  var mapL = function (dispL) {
    var i = U_letterIndex(dispL);
    if (i < 0) return '';
    return perm && perm.length ? (perm[i] || '') : dispL;
  };
  switch (dang) {
    case DANG.MOT_DA:
    case DANG.NHIEU_DA:
      var letters = Grade_toArray(raw).map(Grade_letterOf).filter(String).map(mapL).filter(String);
      return { letters: letters.filter(function (x, i) { return letters.indexOf(x) === i; }).sort() };
    case DANG.DUNG_SAI:
      var arr = Grade_toArray(raw);
      var n = perm.length;
      var tf = [];
      for (var k = 0; k < n; k++) tf.push(null);
      for (var r = 0; r < n; r++) {
        var v = U_str(arr[r]);
        var val = v === '' ? null : (v === GR_TRUE_LABEL || /^(Đúng|Dung|True|Đ)/i.test(v) ? true :
          (v === GR_FALSE_LABEL || /^(Sai|False|S)/i.test(v) ? false : null));
        var orig = U_letterIndex(perm[r]);
        if (orig >= 0) tf[orig] = val;
      }
      return { tf: tf };
    case DANG.GHEP_NOI:
      var arr2 = Grade_toArray(raw), map = {};
      for (var j = 0; j < perm.length; j++) {
        var c = U_str(arr2[j]);
        var num = parseInt(c, 10);
        if (!isNaN(num)) map[perm[j]] = num;
      }
      return { map: map };
    case DANG.TRA_LOI_NGAN:
      return { text: U_str(Grade_toArray(raw).join(' ')) };
  }
  return {};
}

/** So khớp câu trả lời (ký hiệu gốc) với một đáp án */
function Grade_match(dang, key, ans) {
  if (!key || !ans) return false;
  switch (dang) {
    case DANG.MOT_DA:
    case DANG.NHIEU_DA:
      return ans.letters.length > 0 && ans.letters.join(',') === key.letters.slice().sort().join(',');
    case DANG.DUNG_SAI:
      if (!ans.tf || ans.tf.length !== key.tf.length) return false;
      for (var i = 0; i < key.tf.length; i++) if (ans.tf[i] !== key.tf[i]) return false;
      return true;
    case DANG.GHEP_NOI:
      var ks = Object.keys(key.map);
      return ks.length > 0 && ks.every(function (k) { return ans.map[k] === key.map[k]; });
    case DANG.TRA_LOI_NGAN:
      var t = U_str(ans.text);
      if (!t) return false;
      var n = U_parseNumber(t), nt = U_normText(t);
      return key.answers.some(function (a) {
        if (a.num !== null && a.num !== undefined && n !== null) {
          var tol = Math.max(a.tol || 0, 1e-9 * Math.max(1, Math.abs(a.num)));
          return Math.abs(n - a.num) <= tol;
        }
        return a.norm === nt;
      });
  }
  return false;
}

/** Gom các điều chỉnh phúc khảo theo MaCH */
function Grade_reviewMap(reviewRows, maKyThi) {
  var m = {};
  (reviewRows || []).forEach(function (r) {
    if (U_str(r.MaKyThi) !== maKyThi) return;
    if (U_str(r.ApDung) && !U_bool(r.ApDung, true)) return;
    var id = U_str(r.MaCH);
    (m[id] = m[id] || []).push({ action: U_upper(r.HanhDong), value: U_str(r.GiaTri) });
  });
  return m;
}

/**
 * Chấm một bài làm.
 * @param items dòng DeThi của mã đề (có DangCau, ThuTu, DapAnGoc, Phan, MaCH, FormItemId…)
 * @param answers {FormItemId: rawResponse}
 * @param sections [{phan, ten, diem}]
 * @param reviews kết quả Grade_reviewMap
 */
function Grade_submission(items, answers, sections, reviews, roundDigits) {
  reviews = reviews || {};
  var secMap = {};
  sections.forEach(function (s) { secMap[s.phan] = { phan: s.phan, ten: s.ten, max: s.diem, diem: 0, n: 0, dung: 0, removed: 0 }; });
  // đếm số câu còn hiệu lực trong từng phần
  items.forEach(function (it) {
    var sm = secMap[U_str(it.Phan)];
    if (!sm) return;
    var rv = reviews[U_str(it.MaCH)] || [];
    if (rv.some(function (x) { return x.action === PK.LOAI_CAU; })) sm.removed++;
    else sm.n++;
  });
  var per = [], total = 0, soDung = 0, counted = 0, raw = {};
  items.slice().sort(function (a, b) { return Number(a.STT) - Number(b.STT); }).forEach(function (it) {
    var dang = U_str(it.DangCau), maCH = U_str(it.MaCH);
    var perm = U_str(it.ThuTu) ? U_str(it.ThuTu).split(',') : [];
    var rv = reviews[maCH] || [];
    var sm = secMap[U_str(it.Phan)];
    var resp = answers[U_str(it.FormItemId)];
    raw[maCH] = resp === undefined ? null : resp;
    var removed = rv.some(function (x) { return x.action === PK.LOAI_CAU; });
    if (removed || !sm) { per.push({ maCH: maCH, stt: it.STT, ok: null, pts: 0, removed: true }); return; }
    var keyStr = U_str(it.DapAnGoc);
    rv.forEach(function (x) { if (x.action === PK.DOI_DAP_AN) keyStr = x.value; });
    var nOpt = perm.length || 0;
    var keys = [];
    var k0 = Bank_parseKey(dang, keyStr, {});
    if (k0.ok) keys.push(k0.key);
    rv.forEach(function (x) {
      if (x.action === PK.THEM_DAP_AN) { var kx = Bank_parseKey(dang, x.value, {}); if (kx.ok) keys.push(kx.key); }
    });
    var ans = Grade_toOriginal(dang, perm, resp);
    var ok = rv.some(function (x) { return x.action === PK.TANG_DIEM; }) ||
      keys.some(function (k) { return Grade_match(dang, k, ans); });
    var pts = ok ? sm.max / Math.max(1, sm.n) : 0;
    if (ok) { sm.diem += pts; sm.dung++; soDung++; }
    total += pts; counted++;
    per.push({ maCH: maCH, stt: it.STT, ok: ok, pts: pts, blank: resp === undefined || resp === null || resp === '' || nOpt < 0 });
  });
  var d = roundDigits === undefined ? 2 : roundDigits;
  Object.keys(secMap).forEach(function (k) { secMap[k].diem = U_round(secMap[k].diem, d); });
  return { total: U_round(total, d), soDung: soDung, tongSoCau: counted, sections: secMap, perItem: per, raw: raw };
}

/** Chuỗi tóm tắt điểm từng phần: "I: 45/50; II: 20/30" */
function Grade_sectionSummary(sections, order) {
  return order.map(function (p) {
    var s = sections[p];
    return s && (Number(s.max) > 0 || Number(s.diem) > 0) ? (p + ': ' + s.diem + '/' + s.max) : '';   // bỏ phần 0 điểm (kỳ thi chỉ lập trình)
  }).filter(String).join('; ');
}

/** Phổ điểm theo khoảng 10 điểm trên thang max */
function Grade_histogram(scores, max) {
  max = max || 100;
  var step = max / 10, bins = [];
  for (var i = 0; i < 10; i++) bins.push({ from: U_round(i * step, 2), to: U_round((i + 1) * step, 2), n: 0 });
  scores.forEach(function (s) {
    var idx = Math.min(9, Math.floor(s / step));
    if (idx >= 0) bins[idx].n++;
  });
  return bins;
}

function Grade_describe(scores) {
  if (!scores.length) return { n: 0 };
  var a = scores.slice().sort(function (x, y) { return x - y; });
  var sum = a.reduce(function (p, c) { return p + c; }, 0), mean = sum / a.length;
  var sd = Math.sqrt(a.reduce(function (p, c) { return p + (c - mean) * (c - mean); }, 0) / a.length);
  var med = a.length % 2 ? a[(a.length - 1) / 2] : (a[a.length / 2 - 1] + a[a.length / 2]) / 2;
  return { n: a.length, mean: U_round(mean, 2), sd: U_round(sd, 2), min: a[0], max: a[a.length - 1], median: U_round(med, 2) };
}

/* ======================= 16_SampleData.gs ======================= */
/**
 * 16_SampleData.gs — Dữ liệu MẪU để chạy thử toàn bộ quy trình (môn DEMO: Học máy, Python, Toán).
 * Có đủ 5 dạng câu, câu chùm, công thức LaTeX, song ngữ, đáp án cố định vị trí.
 */
function Sample_data() {
  var topics = [
    ['CD01', 'Cơ bản', 'C1. Học máy cơ bản', 'Học có giám sát / Supervised learning', 'Phân biệt phân loại, hồi quy, phân cụm'],
    ['CD02', 'Cơ bản', 'C1. Học máy cơ bản', 'Đánh giá mô hình / Model evaluation', 'Hiểu overfitting và các chỉ số đánh giá'],
    ['CD03', 'Cơ bản', 'C2. Python', 'Cú pháp & cấu trúc dữ liệu / Syntax & data structures', 'Đọc hiểu đoạn mã Python cơ bản'],
    ['CD04', 'Cơ bản', 'C3. Đại số tuyến tính', 'Ma trận & định thức / Matrices & determinants', 'Tính toán với ma trận cỡ nhỏ'],
    ['CD05', 'Cơ bản', 'C4. Xác suất thống kê', 'Xác suất cơ bản / Basic probability', 'Tính xác suất, kỳ vọng'],
    ['CD06', 'Cơ bản', 'C5. Giải tích', 'Đạo hàm & gradient / Derivatives & gradients', 'Tính đạo hàm, đạo hàm riêng']
  ].map(function (r) { return { MaChuDe: r[0], Khoi_CapDo: r[1], Chuong: r[2], ChuDe: r[3], YeuCauCanDat: r[4] }; });

  var groups = [
    { MaNhom: 'G01', MaChuDe: 'CD03', MucDo: 'TH', DangCau: 'MOT_DA',
      NoiDung_VI: 'Đọc đoạn mã sau và trả lời các câu hỏi:\n\ndef f(n):\n    return n * f(n - 1) if n > 1 else 1',
      NoiDung_EN: 'Read the following code and answer the questions.', TrangThai: 'DUNG' },
    { MaNhom: 'G02', MaChuDe: 'CD05', MucDo: 'VD', DangCau: 'MOT_DA',
      NoiDung_VI: 'Một lớp có 40 sinh viên: 25 người học Python, 20 người học R, 10 người học cả hai.',
      NoiDung_EN: 'A class has 40 students: 25 study Python, 20 study R, 10 study both.', TrangThai: 'DUNG' }
  ];

  function Q(o) { o.TrangThai = o.TrangThai || 'DUNG'; return o; }
  var questions = [
    Q({ MaCH: 'Q001', MaChuDe: 'CD01', MucDo: 'NB', DangCau: 'MOT_DA', NoiDung_VI: 'Bài toán dự đoán giá nhà thuộc loại bài toán nào?',
      NoiDung_EN: 'Predicting house prices is what type of problem?', A: 'Phân loại || Classification', B: 'Hồi quy || Regression',
      C: 'Phân cụm || Clustering', D: 'Giảm chiều dữ liệu || Dimensionality reduction', DapAn: 'B',
      LoiGiai_VI: 'Giá nhà là biến liên tục nên đây là bài toán hồi quy.' }),
    Q({ MaCH: 'Q002', MaChuDe: 'CD02', MucDo: 'TH', DangCau: 'MOT_DA', NoiDung_VI: 'Mô hình đạt độ chính xác 99% trên tập huấn luyện nhưng chỉ 60% trên tập kiểm tra. Hiện tượng này gọi là gì?',
      NoiDung_EN: 'A model reaches 99% training accuracy but only 60% test accuracy. What is this called?', A: 'Underfitting',
      B: 'Overfitting', C: 'Data leakage', D: 'Regularization', DapAn: 'B' }),
    Q({ MaCH: 'Q003', MaChuDe: 'CD02', MucDo: 'VD', DangCau: 'MOT_DA', NoiDung_VI: 'Một bộ phân loại có $TP = 40$, $FP = 10$, $FN = 20$. Precision bằng bao nhiêu?',
      NoiDung_EN: 'A classifier has TP = 40, FP = 10, FN = 20. What is its precision?', A: '0.8', B: '0.667', C: '0.5', D: '0.75', DapAn: 'A',
      LoiGiai_VI: '$Precision = \\frac{TP}{TP+FP} = \\frac{40}{50} = 0.8$' }),
    Q({ MaCH: 'Q004', MaChuDe: 'CD03', MucDo: 'NB', DangCau: 'MOT_DA', NoiDung_VI: 'Kết quả của len([1, [2, 3], 4]) trong Python là?',
      NoiDung_EN: 'What does len([1, [2, 3], 4]) return in Python?', A: '3', B: '4', C: '2', D: 'Báo lỗi || Error', DapAn: 'A' }),
    Q({ MaCH: 'Q005', MaChuDe: 'CD03', MucDo: 'TH', DangCau: 'MOT_DA', NoiDung_VI: 'Sau khi chạy:\nx = [1, 2, 3]\ny = x\ny.append(4)\ngiá trị của x là?',
      NoiDung_EN: 'After running the code above, what is x?', A: '[1, 2, 3]', B: '[1, 2, 3, 4]', C: '[4]', D: 'Báo lỗi || Error', DapAn: 'B' }),
    Q({ MaCH: 'Q006', MaChuDe: 'CD04', MucDo: 'NB', DangCau: 'MOT_DA', NoiDung_VI: 'Cho $A$ là ma trận cỡ $3 \\times 2$ và $B$ cỡ $2 \\times 4$. Ma trận $AB$ có cỡ là?',
      NoiDung_EN: 'A is 3×2 and B is 2×4. What is the size of AB?', A: '$3 \\times 4$', B: '$2 \\times 2$', C: '$4 \\times 3$',
      D: 'Không xác định || Undefined', DapAn: 'A' }),
    Q({ MaCH: 'Q007', MaChuDe: 'CD04', MucDo: 'VD', DangCau: 'MOT_DA', NoiDung_VI: 'Tính định thức của ma trận A dưới đây.',
      NoiDung_EN: 'Compute the determinant of the matrix A below.', LaTeX: 'A=\\begin{pmatrix}2 & 1\\\\ 5 & 3\\end{pmatrix}',
      A: '1', B: '11', C: '-1', D: '6', DapAn: 'A', LoiGiai_VI: '$\\det A = 2\\cdot 3 - 1\\cdot 5 = 1$' }),
    Q({ MaCH: 'Q008', MaChuDe: 'CD05', MucDo: 'TH', DangCau: 'MOT_DA', NoiDung_VI: 'Gieo hai con xúc xắc cân đối. Xác suất để tổng số chấm bằng 7 là?',
      NoiDung_EN: 'Two fair dice are rolled. What is the probability that the sum is 7?', A: '$\\frac{1}{6}$', B: '$\\frac{1}{12}$',
      C: '$\\frac{7}{36}$', D: '$\\frac{5}{36}$', DapAn: 'A' }),
    Q({ MaCH: 'Q009', MaChuDe: 'CD06', MucDo: 'TH', DangCau: 'MOT_DA', NoiDung_VI: 'Đạo hàm của $f(x) = x^2 e^x$ là?',
      NoiDung_EN: 'What is the derivative of f(x) = x²eˣ?', A: '$2x e^x$', B: '$(x^2 + 2x) e^x$', C: '$x^2 e^x$', D: '$2x + e^x$', DapAn: 'B' }),
    Q({ MaCH: 'Q010', MaChuDe: 'CD01', MucDo: 'TH', DangCau: 'MOT_DA', NoiDung_VI: 'Thuật toán nào sau đây là học có giám sát?',
      NoiDung_EN: 'Which of the following are supervised learning algorithms?', A: 'Linear Regression', B: 'Decision Tree', C: 'SVM',
      D: 'K-Means', E: 'Cả A, B và C || A, B and C', DapAn: 'E' }),
    Q({ MaCH: 'Q011', MaChuDe: 'CD02', MucDo: 'TH', DangCau: 'NHIEU_DA', NoiDung_VI: 'Những kỹ thuật nào giúp giảm overfitting?',
      NoiDung_EN: 'Which techniques help reduce overfitting?', A: 'Dropout', B: 'Tăng số epoch || More epochs', C: 'L2 regularization',
      D: 'Thêm dữ liệu huấn luyện || More training data', E: 'Tăng độ sâu mô hình || Deeper model', DapAn: 'A,C,D' }),
    Q({ MaCH: 'Q012', MaChuDe: 'CD03', MucDo: 'NB', DangCau: 'NHIEU_DA', NoiDung_VI: 'Kiểu dữ liệu nào trong Python là bất biến (immutable)?',
      NoiDung_EN: 'Which Python types are immutable?', A: 'list', B: 'tuple', C: 'dict', D: 'str', E: 'set', DapAn: 'B,D' }),
    Q({ MaCH: 'Q013', MaChuDe: 'CD04', MucDo: 'TH', DangCau: 'DUNG_SAI', NoiDung_VI: 'Cho $A$ là ma trận vuông khả nghịch. Xét tính đúng/sai của các mệnh đề:',
      NoiDung_EN: 'Let A be an invertible square matrix. True or false?', A: '$\\det(A) \\neq 0$', B: '$(A^{-1})^{-1} = A$',
      C: '$(AB)^{-1} = A^{-1}B^{-1}$ với mọi $B$ khả nghịch || for every invertible B', D: '$A^{\\top}$ cũng khả nghịch || is also invertible', DapAn: 'Đ,Đ,S,Đ' }),
    Q({ MaCH: 'Q014', MaChuDe: 'CD05', MucDo: 'VD', DangCau: 'DUNG_SAI', NoiDung_VI: 'Cho biến ngẫu nhiên $X \\sim \\mathcal{N}(0, 1)$. Xét các mệnh đề:',
      NoiDung_EN: 'Let X follow the standard normal distribution.', A: '$E[X] = 0$', B: '$Var(X) = 1$', C: '$P(X > 0) = 0.5$', D: '$P(X = 0) > 0$', DapAn: 'Đ,Đ,Đ,S' }),
    Q({ MaCH: 'Q015', MaChuDe: 'CD01', MucDo: 'TH', DangCau: 'DUNG_SAI', NoiDung_VI: 'Xét các phát biểu về thuật toán học máy:',
      NoiDung_EN: 'Statements about ML algorithms:', A: 'K-Means là học không giám sát || K-Means is unsupervised',
      B: 'Logistic regression dùng để dự đoán giá trị liên tục || predicts continuous values', C: 'Random Forest là phương pháp ensemble || is an ensemble method',
      D: 'PCA là thuật toán phân loại || is a classification algorithm', DapAn: 'ĐSĐS' }),
    Q({ MaCH: 'Q016', MaChuDe: 'CD04', MucDo: 'VD', DangCau: 'TRA_LOI_NGAN', NoiDung_VI: 'Tính $\\det\\begin{pmatrix}1 & 2\\\\ 3 & 4\\end{pmatrix}$.',
      NoiDung_EN: 'Compute the determinant.', DapAn: '-2' }),
    Q({ MaCH: 'Q017', MaChuDe: 'CD06', MucDo: 'VD', DangCau: 'TRA_LOI_NGAN', NoiDung_VI: 'Cho $f(x, y) = x^2 + 3xy$. Tính $\\frac{\\partial f}{\\partial x}$ tại điểm $(1, 2)$.',
      NoiDung_EN: 'Compute ∂f/∂x at (1, 2).', DapAn: '8' }),
    Q({ MaCH: 'Q018', MaChuDe: 'CD05', MucDo: 'VD', DangCau: 'TRA_LOI_NGAN', NoiDung_VI: 'Biến ngẫu nhiên $X$ nhận các giá trị 1, 2, 3 với xác suất lần lượt 0.2; 0.5; 0.3. Tính $E[X]$.',
      NoiDung_EN: 'X takes values 1, 2, 3 with probabilities 0.2, 0.5, 0.3. Find E[X].', DapAn: '2.1' }),
    Q({ MaCH: 'Q019', MaChuDe: 'CD03', MucDo: 'TH', DangCau: 'TRA_LOI_NGAN', NoiDung_VI: 'Kết quả in ra của print(7 // 2) là?',
      NoiDung_EN: 'What does print(7 // 2) output?', DapAn: '3' }),
    Q({ MaCH: 'Q020', MaChuDe: 'CD02', MucDo: 'TH', DangCau: 'GHEP_NOI', NoiDung_VI: 'Ghép mỗi chỉ số với công thức tương ứng.',
      NoiDung_EN: 'Match each metric with its formula.', A: 'Precision', B: 'Recall', C: 'Accuracy',
      CotGhep: 'TP/(TP+FP) | TP/(TP+FN) | (TP+TN)/Tổng số mẫu || (TP+TN)/Total', DapAn: 'A-1,B-2,C-3' }),
    Q({ MaCH: 'Q021', MaNhom: 'G01', NoiDung_VI: 'f(4) trả về giá trị nào?', NoiDung_EN: 'What does f(4) return?', A: '24', B: '12', C: '4', D: '1', DapAn: 'A' }),
    Q({ MaCH: 'Q022', MaNhom: 'G01', NoiDung_VI: 'Hàm f sử dụng kỹ thuật lập trình nào?', NoiDung_EN: 'Which technique does f use?',
      A: 'Đệ quy || Recursion', B: 'Vòng lặp || Loop', C: 'Lambda', D: 'Generator', DapAn: 'A' }),
    Q({ MaCH: 'Q023', MaNhom: 'G02', NoiDung_VI: 'Chọn ngẫu nhiên 1 sinh viên. Xác suất người đó học ít nhất một ngôn ngữ là?',
      NoiDung_EN: 'Probability that a random student studies at least one language?', A: '0.875', B: '0.625', C: '0.5', D: '1', DapAn: 'A' }),
    Q({ MaCH: 'Q024', MaNhom: 'G02', NoiDung_VI: 'Biết sinh viên được chọn học R, xác suất người đó cũng học Python là?',
      NoiDung_EN: 'Given the student studies R, probability they also study Python?', A: '0.4', B: '0.5', C: '0.25', D: '0.625', DapAn: 'B' })
  ];

  var matrixPhan = [
    { MaMaTran: 'MT_DEMO', MaMon: 'DEMO', TenMaTran: 'Ma trận mẫu 12 câu', Phan: 'I', TenPhan: 'Trắc nghiệm nhiều lựa chọn / Multiple choice',
      DiemPhan: 50, TongSoCau: 8, DangCauChoPhep: 'MOT_DA,NHIEU_DA' },
    { MaMaTran: 'MT_DEMO', MaMon: 'DEMO', TenMaTran: 'Ma trận mẫu 12 câu', Phan: 'II', TenPhan: 'Đúng/Sai / True-False',
      DiemPhan: 30, TongSoCau: 2, DangCauChoPhep: 'DUNG_SAI' },
    { MaMaTran: 'MT_DEMO', MaMon: 'DEMO', TenMaTran: 'Ma trận mẫu 12 câu', Phan: 'III', TenPhan: 'Trả lời ngắn & ghép nối / Short answer & matching',
      DiemPhan: 20, TongSoCau: 2, DangCauChoPhep: 'TRA_LOI_NGAN,GHEP_NOI' }
  ];
  var matrixCells = [
    { MaMaTran: 'MT_DEMO', Phan: 'I', MucDo: 'NB', SoCau: 2 },
    { MaMaTran: 'MT_DEMO', Phan: 'I', MucDo: 'TH', SoCau: 4 },
    { MaMaTran: 'MT_DEMO', Phan: 'I', MucDo: 'VD', SoCau: 2 },
    { MaMaTran: 'MT_DEMO', Phan: 'II', TiLe: 100 },
    { MaMaTran: 'MT_DEMO', Phan: 'III', Chuong: 'C3, C5', SoCau: 1, GhiChu: 'Toán' },
    { MaMaTran: 'MT_DEMO', Phan: 'III', Chuong: 'C1, C2', SoCau: 1, GhiChu: 'ML/Python' }
  ];
  var exam = { MaKyThi: 'KT_DEMO', TenKyThi: 'Kiểm tra thử — Nhập môn AI & Toán cơ sở', MaMon: 'DEMO', MaMaTran: 'MT_DEMO',
    CheDo: 'B_KHAC', SoMaDe: 2, MaDeBatDau: '101', TronCau: 'CO', TronDapAn: 'CO', TronYDungSai: 'CO', ThoiGianPhut: 30,
    TrangThai: 'NHAP' };
  var students = [
    ['SV001', 'Nguyễn Văn An', 'KHMT1'], ['SV002', 'Trần Thị Bình', 'KHMT1'], ['SV003', 'Lê Hoàng Cường', 'KHMT1'],
    ['SV004', 'Phạm Minh Dung', 'KHDL1'], ['SV005', 'Võ Thu Hà', 'KHDL1'], ['SV006', 'Đặng Quốc Huy', 'KHDL1']
  ].map(function (r) { return { MaKyThi: 'KT_DEMO', SBD: r[0], HoTen: r[1], Lop: r[2] }; });
  return { topics: topics, groups: groups, questions: questions, matrixPhan: matrixPhan, matrixCells: matrixCells, exam: exam, students: students };
}

/* ======================= 17_Core_Parse.gs ======================= */
/**
 * 17_Core_Parse.gs — PHÂN TÍCH VĂN BẢN DÁN VÀO (THUẦN, tự chứa).
 *
 * Dùng cho trình "Nhập câu hỏi nhanh": người dùng copy câu hỏi từ web / Word / PDF rồi dán,
 * hệ thống tự tách: nội dung câu, các lựa chọn A–J, đáp án, lời giải, mức độ, dạng câu.
 *
 * Các hàm PQ_* KHÔNG gọi hàm nào khác ngoài PQ_* để có thể chép nguyên văn sang trình duyệt
 * (PQ_clientSource) — một mã nguồn duy nhất cho cả máy chủ và giao diện.
 *
 * Nhận diện được:
 *   - Nhiều câu: "Câu 1:", "Câu 2 (TH).", "Question 3:", "Bài 4)" hoặc đánh số 1. 2. 3. liên tiếp
 *   - Lựa chọn (tối đa 10, A–J): "A." "A)" "(A)" "[A]" mỗi dòng một lựa chọn hoặc nằm chung một dòng "A. 1  B. 2  C. 3  D. 4"
 *   - Đáp án: "Đáp án: B", "Đáp án đúng là C", "Answer: A, C", "Chọn B", dấu * trước/sau lựa chọn,
 *     chữ in đậm/gạch chân khi dán từ web (ký hiệu đánh dấu PQ_MARK), bảng đáp án cuối bài "1.A 2.C 3.B…"
 *   - Đúng/Sai: các ý a) b) c) d) + đáp án "Đ S Đ S" / "a) Đúng b) Sai…" / (Đ) (S) cuối mỗi ý
 *   - Trả lời ngắn: câu không có lựa chọn, đáp án là phần sau "Đáp án:"
 *   - Lời giải: "Lời giải:", "Giải:", "Hướng dẫn giải", "Giải thích", "Explanation", "Solution"
 *   - Mức độ trong ngoặc sau số câu: (NB) (TH) (VD) (VDC) (Nhận biết)…
 */

/** Ký hiệu nội bộ đánh dấu đoạn chữ được nhấn mạnh (in đậm / gạch chân / tô màu) khi dán từ HTML */
var PQ_MARK = '\uE000';

function PQ_clientSource() {
  var fns = [PQ_normalize, PQ_dedupMath, PQ_noMark, PQ_levelOf, PQ_labelRe, PQ_findQuestionStarts, PQ_extractKeyTable, PQ_splitInline,
    PQ_parseTF, PQ_parseLetters, PQ_parseBlock, PQ_codeExtract, PQ_codeRestore, PQ_parse, PQ_parseNoCode, PQ_lang, PQ_fold, PQ_shingles, PQ_similarity, PQ_toRecord,
    PQ_optionMarks];
  return 'var PQ_MARK = "\\uE000";\n' + fns.map(function (f) { return f.toString(); }).join('\n\n');
}

function PQ_normalize(s) {
  s = String(s === null || s === undefined ? '' : s);
  if (s.normalize) s = s.normalize('NFC');
  return s.replace(/\r\n?/g, '\n').replace(/[\u00a0\u2007\u202f\u3000]/g, ' ').replace(/[\u200b-\u200d\u2060\ufeff]/g, '')
    .replace(/\t/g, '    ').split('\n').map(PQ_dedupMath).join('\n').replace(/[ ]+\n/g, '\n').replace(/\n[ ]*\n([ ]*\n)+/g, '\n\n').replace(/^\n+|\s+$/g, '');
}

/**
 * Bỏ phần công thức bị lặp khi copy từ web dùng MathJax/KaTeX: "x∈Rx∈R" → "x∈R", "arccotx+1>0arccotx+1>0" → "arccotx+1>0".
 * Chỉ gộp khi đoạn lặp có ký hiệu toán học (tránh sửa nhầm chữ thường).
 */
function PQ_dedupMath(s) {
  return String(s || '').replace(/([^\s]{3,}?)\1(?![^\s])/g, function (m, a) {
    return /[=<>+\-−∈∉∞()\[\]^_\/√∑∫≤≥≠≈·×|{}]/.test(a) && !/^[\d.,]+$/.test(a) ? a : m;
  }).replace(/([^\s]{3,}?)\1/g, function (m, a) {
    return /[=<>∈∉∞√∑∫≤≥≠≈]/.test(a) && /[A-Za-z]/.test(a) ? a : m;
  });
}

function PQ_noMark(s) { return String(s || '').split('\uE000').join('').replace(/[ ]{2,}/g, ' ').trim(); }

/** Mức độ từ chữ viết tắt / tên đầy đủ (trả '' nếu không nhận ra) */
function PQ_levelOf(s) {
  var t = PQ_fold(s).replace(/[^a-z ]/g, ' ').replace(/\s+/g, ' ').trim();
  if (!t) return '';
  if (/^(vdc|van dung cao)$/.test(t)) return 'VDC';
  if (/^(vd|van dung|vdt|van dung thap)$/.test(t)) return 'VD';
  if (/^(th|thong hieu)$/.test(t)) return 'TH';
  if (/^(nb|nhan biet|biet)$/.test(t)) return 'NB';
  return '';
}

/** Bỏ dấu tiếng Việt + chữ thường */
function PQ_fold(s) {
  return String(s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase();
}

/** Nhãn câu hỏi ở đầu dòng: "Câu 12 (TH):" "Question 3." "Bài 2)" */
function PQ_labelRe() {
  return /^\s*(?:câu\s*hỏi|câu|cau\s*hoi|cau|question|bài|bai|q)\s*(\d{1,4})\s*(?:\(([^)]{1,40})\)|\[([^\]]{1,40})\])?\s*[:.)\-–]?\s*/i;
}

/** Vị trí các dòng bắt đầu câu hỏi */
function PQ_findQuestionStarts(lines) {
  var re = PQ_labelRe(), out = [];
  lines.forEach(function (ln, i) {
    var m = ln.replace(/^[\uE000\s]+/, '').match(re);
    if (m) out.push({ i: i, num: Number(m[1]) });
  });
  if (out.length) return out;
  // không có "Câu N": dùng dòng đánh số "1." "2)" nếu số tăng liên tiếp
  var cands = [];
  lines.forEach(function (ln, i) {
    var m = ln.replace(/^[\uE000\s]+/, '').match(/^\s*(\d{1,3})\s*[.)]\s+\S/);
    if (m) cands.push({ i: i, num: Number(m[1]) });
  });
  if (cands.length < 2) return [];
  var seq = [], expect = cands[0].num;
  cands.forEach(function (c) { if (c.num === expect) { seq.push(c); expect++; } });
  return seq.length >= 2 ? seq : [];
}

/**
 * Bảng đáp án ở cuối: "ĐÁP ÁN\n1.A 2.B 3.C" hoặc "1-A, 2-C, 3-B" (≥3 cặp nếu không có tiêu đề).
 * @return {{lines:Array, table:Object}} lines đã cắt bỏ phần bảng
 */
function PQ_extractKeyTable(lines) {
  var pairRe = /(\d{1,4})\s*[.\-:)]?\s*([A-Ja-j](?:\s*[,&]\s*[A-Ja-j])*)(?![A-Za-zÀ-ỹ])/g;
  function pairs(text) {
    var res = [], m;
    pairRe.lastIndex = 0;
    while ((m = pairRe.exec(text))) res.push({ num: Number(m[1]), key: m[2].toUpperCase().replace(/\s+/g, '') });
    return res;
  }
  function onlyPairs(text) { return !text.replace(pairRe, '').replace(/[\s|,;.:\-–]+/g, ''); }
  var headRe = /^\s*(?:bảng\s*)?(?:đáp\s*án|dap\s*an|answer\s*key|answers|key)\s*[:.]?\s*$/i;
  var cut = -1, table = {};
  for (var i = lines.length - 1; i >= 0; i--) {
    if (headRe.test(lines[i])) {
      var rest = lines.slice(i + 1).join('\n');
      var ps = pairs(rest);
      if (ps.length >= 1) { cut = i; ps.forEach(function (p) { table[p.num] = p.key; }); }
      break;
    }
  }
  if (cut < 0) {
    // không có tiêu đề: các dòng cuối toàn cặp số-chữ
    var j = lines.length;
    while (j > 0 && (!lines[j - 1].trim() || onlyPairs(lines[j - 1]))) j--;
    var tail = lines.slice(j).join('\n');
    var tp = pairs(tail);
    if (tp.length >= 3) { cut = j; tp.forEach(function (p) { table[p.num] = p.key; }); }
  }
  return { lines: cut >= 0 ? lines.slice(0, cut) : lines, table: table };
}

/**
 * Tách các lựa chọn nằm chung một dòng: "… A. 1   B. 2   C. 3   D. 4".
 * @param {string} line
 * @param {boolean} lower dùng a) b) c) d)
 * @return {{before:string, opts:Array<string>}|null}
 */
function PQ_splitInline(line, lower) {
  var L = lower ? 'abcdefghij' : 'ABCDEFGHIJ';
  var pos = [], from = 0;
  for (var k = 0; k < 10; k++) {
    var re = new RegExp('(^|[\\s\\uE000*(\\[])\\*?[(\\[]?' + L[k] + '\\s*[.):\\]](?=\\s|\\uE000|$)', 'g');
    re.lastIndex = from;
    var m = re.exec(line);
    if (!m) break;
    var start = m.index + m[1].length;
    pos.push({ start: start, end: m.index + m[0].length });
    from = m.index + m[0].length;
  }
  if (pos.length < 2) return null;
  var beforeTxt = line.substring(0, pos[0].start);
  if (beforeTxt.trim() && pos.length < 3) return null; // giữa dòng cần ≥3 lựa chọn để tránh nhầm
  var opts = pos.map(function (p, idx) {
    var raw = line.substring(p.start, idx + 1 < pos.length ? pos[idx + 1].start : line.length);
    var lead = /^\s*\*/.test(raw) ? '*' : '';
    return lead + raw.replace(/^\s*\*?[(\[]?[A-Ja-j]\s*[.):\]]/, '').trim();
  });
  return { before: beforeTxt.replace(/\s+$/, ''), opts: opts };
}

/** Đ/S → true/false; null nếu không nhận ra */
function PQ_parseTF(tok) {
  var t = PQ_fold(tok).replace(/[^a-z]/g, '');
  if (['d', 't', 'dung', 'true', 'y', 'yes'].indexOf(t) >= 0) return true;
  if (['s', 'f', 'sai', 'false', 'n', 'no'].indexOf(t) >= 0) return false;
  return null;
}

/** "B" "A, C" "A và D" "AC" → ['A','C'] ; trả [] nếu không phải danh sách chữ cái */
function PQ_parseLetters(s) {
  var t = String(s || '').trim().replace(/[.。]+$/, '');
  if (!/^[A-Ja-j](?:\s*(?:,|;|&|\/|\+|và|va|and|hoặc|\s)\s*[A-Ja-j])*$/i.test(t) && !/^[A-J]{2,10}$/.test(t)) return [];
  var out = [];
  t.toUpperCase().replace(/HOẶC|HOAC|V[AÀ]|AND|OR/g, ' ').replace(/[^A-J]/g, '').split('').forEach(function (x) { if (out.indexOf(x) < 0) out.push(x); });
  return out.sort();
}

/** Lựa chọn nào được đánh dấu đúng: dấu * ✓ (đúng) hoặc chữ nhấn mạnh khi dán HTML */
function PQ_optionMarks(text) {
  var t = String(text || '');
  var star = /^\s*\*|\*\s*$|\(\s*\*\s*\)|[✓✔]|\((?:đúng|dung|correct)\)\s*$/i.test(t);
  var clean = PQ_noMark(t).replace(/^\s*\*+\s*/, '').replace(/\s*\*+\s*$/, '').replace(/\(\s*\*\s*\)/g, '')
    .replace(/\s*[✓✔]\s*/g, ' ').replace(/\s*\((?:đúng|dung|correct)\)\s*$/i, '').trim();
  var emph = t.indexOf('\uE000') >= 0;
  return { text: clean, star: star, emph: emph };
}

/**
 * Phân tích một khối văn bản của MỘT câu hỏi.
 * @return {Object} {num, stem, options[], correct[], tf[], answerText, dang, mucDo, loiGiai, warnings[], lang}
 */
function PQ_parseBlock(text, num, keyFromTable) {
  var lines = String(text || '').split('\n');
  var q = { num: num || null, stem: '', options: [], correct: [], tf: [], answerText: '', dang: '', mucDo: '', loiGiai: '',
    warnings: [], lang: 'vi', hasImageHint: false };
  if (lines.length) lines[0] = lines[0].replace(/^[\uE000\s]+/, '');
  var lab = lines.length ? lines[0].match(PQ_labelRe()) : null;
  if (lab) {
    q.num = Number(lab[1]);
    q.mucDo = PQ_levelOf(lab[2] || lab[3] || '');
    lines[0] = lines[0].substring(lab[0].length);
  } else if (lines.length) {
    var nm = lines[0].match(/^\s*(\d{1,3})\s*[.)]\s+/);
    if (nm && num) lines[0] = lines[0].substring(nm[0].length);
  }
  // mức độ ghi ở cuối dòng đầu: "... (TH)"
  if (!q.mucDo && lines.length) {
    var lm = lines[0].match(/\s*[(\[]\s*(NB|TH|VDC|VD|Nhận biết|Thông hiểu|Vận dụng cao|Vận dụng)\s*[)\]]\s*$/i);
    if (lm) { q.mucDo = PQ_levelOf(lm[1]); lines[0] = lines[0].substring(0, lines[0].length - lm[0].length); }
  }

  // dòng đáp án: "Đáp án: B" / "Đáp án đúng là C" / "Answer: A" / "ĐS: 5"
  var ansRe = /^\s*(đáp\s*án(?:\s*đúng)?(?:\s*là)?|dap\s*an(?:\s*dung)?(?:\s*la)?|correct\s*answers?|answers?|ans|key|kết\s*quả|ket\s*qua|đáp\s*số|đs|đa)\s*([:.\-–]?)\s*(.*)$/i;
  var chonRe = /^\s*(?:[Cc]họn|[Cc]hon|CHỌN)\s*(?:đáp\s*án|phương\s*án|câu|phương án)?\s*([A-J](?:\s*(?:,|và|&)\s*[A-J])*)\s*[.:)]?\s*(.*)$/;
  var solRe = /^\s*(lời\s*giải|loi\s*giai|hướng\s*dẫn\s*giải|hướng\s*dẫn|huong\s*dan(?:\s*giai)?|giải\s*thích|giai\s*thich|giải\s*chi\s*tiết|giải|giai|explanation|solution)\s*(?:chi\s*tiết)?\s*([:.\-–]?)\s*(.*)$/i;
  var upRe = /^\s*(\*?)\s*[(\[]?([A-J])\s*[.):\]]\s*(.*)$/;
  var loRe = /^\s*(\*?)\s*[(\[]?([a-j])\s*[.):\]]\s*(.*)$/;

  var state = 'stem', stem = [], opts = [], optCase = '', sol = [], ansRaw = '', pendingEmpty = false;
  function nextLetter(cs) { return (cs === 'lo' ? 'abcdefghij' : 'ABCDEFGHIJ')[opts.length]; }
  function pushOpt(raw, cs) { opts.push(raw); optCase = cs; }

  for (var i = 0; i < lines.length; i++) {
    var ln = lines[i];
    var plain = PQ_noMark(ln);
    if (!plain && state !== 'sol') { pendingEmpty = false; continue; }
    if (state !== 'sol') {
      var am = plain.match(ansRe);
      if (am && (state === 'opts' || stem.length)) {
        var isVN = /^(đáp|dap)/i.test(am[1]);
        var okAns = am[2] === ':' || am[2] === '-' || am[2] === '–' ||
          (isVN && (state === 'opts' || PQ_parseLetters((am[3] || '').split(/[.:)\s]/)[0]).length > 0) && !/[?？]\s*$/.test(am[3]));
        if (okAns) { ansRaw = am[3]; state = 'sol'; continue; }
      }
      var cm = plain.match(chonRe);
      if (cm && (state === 'opts' || opts.length)) { ansRaw = cm[1] + (cm[2] ? '. ' + cm[2] : ''); state = 'sol'; continue; }
      var sm = plain.match(solRe);
      if (sm && (state === 'opts' || stem.length) && (sm[2] === ':' || (state === 'opts' && (sm[2] || !sm[3])))) {
        if (sm[3]) sol.push(sm[3]);
        state = 'sol'; continue;
      }
      // lựa chọn chung 1 dòng
      if (!opts.length) {
        var inl = PQ_splitInline(ln, false) || PQ_splitInline(ln, true);
        if (inl) {
          if (inl.before.trim()) stem.push(inl.before);
          var lower = /^\s*\*?\s*[(\[]?a\s*[.):\]]/.test(ln.substring(inl.before.length));
          inl.opts.forEach(function (o) { pushOpt(o, lower ? 'lo' : 'up'); });
          state = 'opts';
          continue;
        }
      } else if (opts.length < 10) {
        var inl2 = PQ_splitInline(ln, optCase === 'lo');
        if (inl2 && !inl2.before.trim()) {
          var firstL = ln.match(optCase === 'lo' ? loRe : upRe);
          if (firstL && firstL[2] === nextLetter(optCase)) {
            inl2.opts.forEach(function (o) { pushOpt(o, optCase); });
            continue;
          }
        }
      }
      var mUp = PQ_noMark(ln) ? ln.replace(/^\uE000+/, '').match(upRe) : null;
      var mLo = ln.replace(/^\uE000+/, '').match(loRe);
      var m = null, cs = '';
      if (mUp && mUp[2] === nextLetter(optCase || 'up') && (!optCase || optCase === 'up')) { m = mUp; cs = 'up'; }
      else if (mLo && mLo[2] === nextLetter(optCase || 'lo') && (!optCase || optCase === 'lo')) { m = mLo; cs = 'lo'; }
      if (m && (stem.length || opts.length)) {
        var lead = /^\uE000/.test(ln) ? '\uE000' : '';
        var content = (m[1] ? '*' : '') + lead + m[3];
        pushOpt(content, cs);
        pendingEmpty = !PQ_noMark(m[3]).replace(/^\*/, '');
        state = 'opts';
        continue;
      }
      if (state === 'opts') {
        if (pendingEmpty) { opts[opts.length - 1] += plain ? ' ' + ln.trim() : ''; pendingEmpty = false; }
        else opts[opts.length - 1] += '\n' + ln.trim();
        continue;
      }
      stem.push(ln);
    } else {
      var sh = plain.match(solRe);
      if (sh && (sh[2] === ':' || !sh[3]) && !sol.length) { if (sh[3]) sol.push(sh[3]); }
      else sol.push(ln);
    }
  }

  // ---- đáp án ----
  var optInfo = opts.map(PQ_optionMarks);
  q.options = optInfo.map(function (o) { return o.text; });
  q.stem = stem.map(function (s) { return s.split('\uE000').join('').replace(/\s+$/, ''); }).join('\n')
    .replace(/\n{3,}/g, '\n\n').replace(/^\s+|\s+$/g, '');
  ansRaw = PQ_noMark(ansRaw);
  var solText = sol.map(PQ_noMark).join('\n').trim();
  var stemFold = PQ_fold(q.stem);
  var isTFText = /dung hay sai|dung\s*\/\s*sai|dung, sai|true or false|true\/false|moi y|moi menh de|cac menh de sau/.test(stemFold);

  if (q.options.length >= 2 && (optCase === 'lo' || isTFText)) {
    // thử dạng Đúng/Sai
    var tf = [];
    var src = ansRaw || (keyFromTable || '');
    if (src) {
      var cleaned = PQ_fold(src).replace(/(^|[\s,;(])[a-j]\s*[).:\-]/g, ' ');
      var toks = cleaned.split(/[^a-z]+/).filter(String);
      tf = toks.map(PQ_parseTF).filter(function (x) { return x !== null; });
    }
    if (!tf.length) {
      // (Đ) / (S) / - Đúng ở cuối mỗi ý
      var perOpt = q.options.map(function (o) {
        var mm = o.match(/[\s(\[\-–]+(Đ|S|Đúng|Sai|T|F|True|False)\s*[)\]]?\s*$/i);
        return mm ? PQ_parseTF(mm[1]) : null;
      });
      if (perOpt.every(function (x) { return x !== null; })) {
        tf = perOpt;
        q.options = q.options.map(function (o) { return o.replace(/[\s(\[\-–]+(Đ|S|Đúng|Sai|T|F|True|False)\s*[)\]]?\s*$/i, '').trim(); });
      }
    }
    if (tf.length && tf.length === q.options.length) {
      q.dang = 'DUNG_SAI'; q.tf = tf; ansRaw = '';
    } else if (isTFText || (optCase === 'lo' && !PQ_parseLetters((src || '').split(/[.:\s]/)[0]).length)) {
      q.dang = 'DUNG_SAI'; q.tf = q.options.map(function () { return null; });
      if (src && tf.length) q.warnings.push('Số đáp án Đ/S (' + tf.length + ') khác số ý (' + q.options.length + ')');
      else q.warnings.push('Chưa nhận ra đáp án Đúng/Sai — hãy bấm chọn Đ/S cho từng ý');
    }
  }

  if (!q.dang && q.options.length >= 2) {
    var letters = [], tail = '';
    if (ansRaw) {
      var lm2 = ansRaw.match(/^\s*(?:là\s*)?(?:phương\s*án|đáp\s*án|câu)?\s*([A-Ja-j](?:\s*(?:,|;|&|\/|\+|và|and|hoặc)\s*[A-Ja-j])*)(?![A-Za-zÀ-ỹ])\s*[.:)\-–]?\s*([\s\S]*)$/);
      if (lm2) { letters = PQ_parseLetters(lm2[1]); tail = lm2[2]; }
      if (!letters.length) {
        // đáp án ghi bằng nội dung lựa chọn
        var hit = q.options.map(function (o, k) { return PQ_fold(o).trim() === PQ_fold(ansRaw).trim() ? 'ABCDEFGHIJ'[k] : ''; }).filter(String);
        if (hit.length === 1) letters = hit;
      }
    }
    if (!letters.length && keyFromTable) letters = PQ_parseLetters(keyFromTable);
    if (!letters.length) {
      var stars = optInfo.map(function (o, k) { return o.star ? 'ABCDEFGHIJ'[k] : ''; }).filter(String);
      if (stars.length && stars.length < q.options.length) letters = stars;
    }
    if (!letters.length) {
      var em = optInfo.map(function (o, k) { return o.emph ? 'ABCDEFGHIJ'[k] : ''; }).filter(String);
      if (em.length && em.length < q.options.length) { letters = em; q.warnings.push('Đáp án đoán từ chữ in đậm/tô màu khi dán — hãy kiểm tra lại'); }
    }
    letters = letters.filter(function (L) { return 'ABCDEFGHIJ'.indexOf(L) < q.options.length; });
    q.correct = letters.map(function (L) { return 'ABCDEFGHIJ'.indexOf(L); });
    var multiHint = /chon (tat ca|cac|hai|2|ba|3|nhung) (dap an|phuong an|y|cau)|(nhieu|cac) dap an dung|select all|choose (two|three|all)|all that apply/.test(stemFold);
    q.dang = (letters.length > 1 || (multiHint && letters.length !== 1)) ? 'NHIEU_DA' : 'MOT_DA';
    if (!letters.length) q.warnings.push('Chưa nhận ra đáp án đúng — hãy bấm chọn chữ cái đáp án');
    if (tail && tail.trim()) solText = (tail.trim() + (solText ? '\n' + solText : '')).trim();
    if (q.options.length > 10) q.warnings.push('Có hơn 10 lựa chọn — chỉ hỗ trợ A–J');
  }

  if (!q.dang) {
    q.dang = 'TRA_LOI_NGAN';
    var at = ansRaw || keyFromTable || '';
    q.answerText = at.replace(/[.。]\s*$/, '').trim();
    if (!q.options.length && !q.answerText) q.warnings.push('Không thấy lựa chọn A–D; coi là câu Trả lời ngắn — hãy nhập đáp án');
    if (q.options.length === 1) q.warnings.push('Chỉ tìm thấy 1 lựa chọn — kiểm tra lại định dạng A. B. C. D.');
  }
  q.loiGiai = solText;
  if (!q.stem) q.warnings.push('Không tách được nội dung câu hỏi');
  if (/hình\s*(vẽ|bên|dưới)|đồ\s*thị\s*(bên|dưới|sau)|figure|shown below|the graph/i.test(q.stem)) {
    q.hasImageHint = true;
    q.warnings.push('Câu có nhắc đến hình — nhớ dán ảnh kèm theo');
  }
  q.lang = PQ_lang(q.stem + ' ' + q.options.join(' '));
  return q;
}

/**
 * Khối code: dòng chứa ``` (có thể kèm tên ngôn ngữ) mở, dòng ``` đóng. Nội dung bên trong được giữ NGUYÊN VĂN
 * (không chuẩn hóa, không bị đọc thành đáp án/công thức). Thay bằng ký hiệu giữ chỗ 1 dòng "\uE001n\uE001" khi phân tích.
 * @return {{text:string, blocks:string[]}}
 */
function PQ_codeExtract(text) {
  var lines = String(text === null || text === undefined ? '' : text).replace(/\r\n?/g, '\n').split('\n');
  var out = [], blocks = [], i = 0;
  while (i < lines.length) {
    var m = lines[i].match(/^\s*```+\s*([\w+#.-]*)\s*$/);
    if (!m) { out.push(lines[i]); i++; continue; }
    var j = i + 1, body = [];
    while (j < lines.length && !/^\s*```+\s*$/.test(lines[j])) { body.push(lines[j]); j++; }
    if (j >= lines.length) { out.push(lines[i]); i++; continue; } // không có dòng đóng: coi là chữ thường
    var ind = Math.min.apply(null, body.filter(function (l) { return l.trim(); }).map(function (l) { return l.match(/^ */)[0].length; }).concat([1e9]));
    body = body.map(function (l) { return l.substring(ind === 1e9 ? 0 : ind).replace(/\t/g, '    ').replace(/\s+$/, ''); });
    while (body.length && !body[0]) body.shift();
    while (body.length && !body[body.length - 1]) body.pop();
    blocks.push('```' + (m[1] || '') + '\n' + body.join('\n') + '\n```');
    out.push('\uE001' + (blocks.length - 1) + '\uE001');
    i = j + 1;
  }
  return { text: out.join('\n'), blocks: blocks };
}

function PQ_codeRestore(s, blocks) {
  if (!blocks || !blocks.length || !s) return s;
  return String(s).replace(/\uE001(\d+)\uE001/g, function (m, n) { return blocks[Number(n)] !== undefined ? '\n' + blocks[Number(n)] + '\n' : m; })
    .replace(/\n{3,}/g, '\n\n').replace(/^\n+|\n+$/g, '');
}

/** Phân tích văn bản có thể chứa nhiều câu */
function PQ_parse(text) {
  var cx = PQ_codeExtract(text);
  var qs = PQ_parseNoCode(cx.text);
  if (!cx.blocks.length) return qs;
  qs.forEach(function (q) {
    q.stem = PQ_codeRestore(q.stem, cx.blocks);
    q.loiGiai = PQ_codeRestore(q.loiGiai, cx.blocks);
    q.options = q.options.map(function (o) { return PQ_codeRestore(o, cx.blocks); });
    q.hasCode = /```/.test(q.stem + q.options.join(''));
  });
  return qs;
}

function PQ_parseNoCode(text) {
  var norm = PQ_normalize(text);
  if (!norm) return [];
  var lines = norm.split('\n');
  var kt = PQ_extractKeyTable(lines);
  lines = kt.lines;
  var starts = PQ_findQuestionStarts(lines);
  var blocks = [];
  if (!starts.length) blocks.push({ text: lines.join('\n'), num: null });
  else {
    var pre = lines.slice(0, starts[0].i).join('\n').trim();
    starts.forEach(function (s, k) {
      var end = k + 1 < starts.length ? starts[k + 1].i : lines.length;
      blocks.push({ text: lines.slice(s.i, end).join('\n'), num: s.num });
    });
    if (pre && blocks.length) blocks[0].pre = pre; // phần dẫn chung trước câu đầu (bỏ qua)
  }
  return blocks.map(function (b) {
    var q = PQ_parseBlock(b.text, b.num, b.num !== null ? kt.table[b.num] : '');
    return q;
  }).filter(function (q) { return q.stem || q.options.length; });
}

/** Ngôn ngữ: 'vi' nếu có chữ có dấu tiếng Việt, 'en' nếu toàn chữ Latin không dấu */
function PQ_lang(text) {
  var t = String(text || '').replace(/\$[^$]*\$/g, ' ');
  var vn = (t.match(/[ăâđêôơưàáạảãằắặẳẵầấậẩẫèéẹẻẽềếệểễìíịỉĩòóọỏõồốộổỗờớợởỡùúụủũừứựửữỳýỵỷỹ]/gi) || []).length;
  var words = (t.match(/[A-Za-z]{2,}/g) || []).length;
  if (vn === 0 && words >= 3) return 'en';
  return 'vi';
}

/** Tập "bigram từ" để so độ giống (bỏ dấu, bỏ ký hiệu) */
function PQ_shingles(text) {
  var w = PQ_fold(text).replace(/\$/g, ' ').replace(/[^a-z0-9]+/g, ' ').trim().split(' ').filter(String);
  var set = {};
  if (w.length === 1) set[w[0]] = 1;
  for (var i = 0; i + 1 < w.length; i++) set[w[i] + ' ' + w[i + 1]] = 1;
  return set;
}

/** Hệ số giống nhau Jaccard 0..1 */
function PQ_similarity(a, b) {
  var ka = Object.keys(a), nb = Object.keys(b).length;
  if (!ka.length || !nb) return 0;
  var inter = 0;
  ka.forEach(function (k) { if (b[k]) inter++; });
  return inter / (ka.length + nb - inter);
}

/**
 * Chuyển kết quả phân tích -> bản ghi theo cột sheet CauHoi (chưa có MaCH / MaChuDe).
 * @param {Object} q kết quả PQ_parseBlock (có thể đã được người dùng sửa)
 */
function PQ_toRecord(q) {
  var r = { MucDo: q.mucDo || '', DangCau: q.dang, NoiDung_VI: '', NoiDung_EN: '', LoiGiai_VI: '', LoiGiai_EN: '', DapAn: '', CotGhep: '' };
  if (q.lang === 'en') { r.NoiDung_EN = q.stem; r.LoiGiai_EN = q.loiGiai || ''; }
  else { r.NoiDung_VI = q.stem; r.LoiGiai_VI = q.loiGiai || ''; }
  ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'].forEach(function (L, k) { r[L] = q.options[k] !== undefined ? q.options[k] : ''; });
  if (q.dang === 'MOT_DA' || q.dang === 'NHIEU_DA') r.DapAn = (q.correct || []).map(function (k) { return 'ABCDEFGHIJ'[k]; }).sort().join(',');
  else if (q.dang === 'DUNG_SAI') r.DapAn = (q.tf || []).every(function (x) { return x === true || x === false; }) && (q.tf || []).length ?
    q.tf.map(function (b) { return b ? 'Đ' : 'S'; }).join(',') : '';
  else if (q.dang === 'TRA_LOI_NGAN') { r.DapAn = q.answerText || ''; ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'].forEach(function (L) { r[L] = ''; }); }
  return r;
}

/* ======================= 18_Core_Package.gs ======================= */
/**
 * 18_Core_Package.gs — PHÒNG THI WEB: phần THUẦN (test được bằng Node)
 *
 *  - Cấu trúc file dữ liệu phòng thi (PhongThi_DuLieu) dùng chung với dự án Apps Script "Phòng thi".
 *  - Đóng gói đề cho thí sinh (KHÔNG chứa đáp án).
 *  - Chuyển bài làm web → định dạng của bộ chấm hiện có (Grade_submission).
 *  - Đọc bài làm trên giấy nhập tay (phương án dự phòng).
 *  - Sinh file cấu hình Safe Exam Browser (.seb, dạng plist XML).
 */

/** Tên sheet trong file dữ liệu phòng thi */
var RSH = { KY_THI: 'KyThi', THI_SINH: 'ThiSinh', GOI_DE: 'GoiDe', BAI_LAM: 'BaiLam', NHAT_KY: 'NhatKy', HUONG_DAN: 'HuongDan', LT_TEST: 'LT_Test', LT_NOP: 'LT_Nop' };

/** Cột ThiSinh: [nhận dạng] + [cột do PHÒNG THI ghi] + [cột do GIÁM THỊ ghi] — hai phía không ghi đè lên nhau */
var R_ST_ID = ['MaKyThi', 'SBD', 'HoTen', 'Lop', 'MaDe', 'MaTruyCap'];
var R_ST_ROOM = ['TrangThai', 'Token', 'BatDau', 'SoLanVao', 'TrinhDuyet', 'SEB', 'NopLuc', 'LanCuoi', 'DaLam', 'ViPham', 'ViPhamMoc', 'LenhDaXuLy', 'SebKey', 'SebVer', 'ManHinh', 'LtDiem', 'NghiTD', 'NghiMuc', 'NghiLyDo'];
var R_ST_ADMIN = ['ThemPhut', 'Lenh', 'LenhGiaTri', 'LenhId', 'GhiChu', 'CamThi', 'LyDoCam', 'DungLuc', 'DungMs', 'VuotHen'];

var RHEADERS = {};
RHEADERS[RSH.KY_THI] = ['MaKyThi', 'TenKyThi', 'DonVi', 'MaMon', 'TrangThai', 'ThoiGianPhut', 'TinhGio', 'MoLuc', 'DongLuc', 'HenDong',
  'MaPhong', 'BatBuocSEB', 'KhoaUA', 'DangNhapLai', 'ViPhamToiDa', 'ThongBao', 'HuongDan', 'PhienBanGoi', 'SoCau', 'TongDiem',
  'ThoatURL', 'SebXml', 'CapNhat', 'SebKeyChuan', 'SebXml2', 'SebXml3', 'SebXml4', 'HenCung', 'ClbTen', 'ClbKhau', 'ClbLogo', 'ClbMau', 'NghiemNgat', 'MaMoKhoa', 'LapTrinh', 'TinHieu', 'ChongAI'];
RHEADERS[RSH.THI_SINH] = R_ST_ID.concat(R_ST_ROOM, R_ST_ADMIN);
RHEADERS[RSH.GOI_DE] = ['MaKyThi', 'MaDe', 'PhienBan', 'Manh', 'DuLieu'];
RHEADERS[RSH.BAI_LAM] = ['ThoiGian', 'MaKyThi', 'SBD', 'MaDe', 'Loai', 'Seq', 'SoCauDaLam', 'TraLoi', 'MaXacNhan', 'TraLoi2'];
RHEADERS[RSH.LT_TEST] = ['MaKyThi', 'MaBai', 'STT', 'Input', 'Output', 'Mau', 'Diem'];
RHEADERS[RSH.LT_NOP] = ['ThoiGian', 'MaKyThi', 'SBD', 'MaBai', 'NgonNgu', 'Loai', 'Code', 'KetQua', 'Diem', 'DiemToiDa'];
RHEADERS[RSH.NHAT_KY] = ['ThoiGian', 'MaKyThi', 'SBD', 'SuKien', 'ChiTiet'];

/** Trạng thái thí sinh trên phòng thi */
var R_TT = { CHUA_VAO: 'CHUA_VAO', CHO: 'CHO', DANG_LAM: 'DANG_LAM', KHOA: 'KHOA', DA_NOP: 'DA_NOP', CAM: 'CAM' };
/** Sự kiện được tính là vi phạm (rời khỏi bài thi) */
var R_VI_PHAM = ['ROI_TAB', 'ROI_CUA_SO', 'THOAT_TOAN_MAN'];
var R_OFFLINE_MS = 150 * 1000;   // không nhận tín hiệu quá 2,5 phút → "mất kết nối"
var R_GRACE_SUBMIT = 5 * 60 * 1000;

function PK_hint(dang) {
  return {
    MOT_DA: 'Chọn 1 đáp án đúng.',
    NHIEU_DA: 'Chọn TẤT CẢ đáp án đúng (đúng đủ mới được điểm).',
    DUNG_SAI: 'Chọn Đúng hoặc Sai cho TỪNG ý (đúng tất cả các ý mới được điểm).',
    GHEP_NOI: 'Với mỗi ý bên trái, chọn số thứ tự của mục bên phải.',
    TRA_LOI_NGAN: 'Chỉ ghi kết quả cuối cùng; số thập phân dùng dấu chấm hoặc phẩy.'
  }[dang] || '';
}

/**
 * Đóng gói một mã đề cho thí sinh.
 * @param o {exRow, cfg, sections, items (dòng DeThi của mã đề), bank, maDe, bilingual, media(ref)->{src}|{err}, withKey}
 * withKey = true chỉ dùng cho bản in của giáo viên (KHÔNG BAO GIỜ gửi bản có đáp án cho phòng thi).
 */
function PK_build(o) {
  var items = o.items.slice().sort(function (a, b) { return Number(a.STT) - Number(b.STT); });
  var bank = o.bank, bi = !!o.bilingual, warnings = [];
  var tr = function (v) { return bi ? U_str(v) : ''; };
  var med = function (refs) {
    return (refs || []).map(function (ref) {
      var r = o.media ? o.media(ref) : { err: 'không tải ảnh' };
      if (r && r.err) warnings.push('Ảnh ' + ref + ': ' + r.err);
      return r && r.src ? { t: 'img', src: r.src } : { t: 'img', err: (r && r.err) || 'lỗi ảnh' };
    });
  };
  var groups = {}, out = [];
  items.forEach(function (it) {
    var q = bank.questions[it.MaCH];
    if (!q) throw new Error('Câu ' + it.MaCH + ' (mã đề ' + o.maDe + ') không còn trong ngân hàng');
    var perm = U_str(it.ThuTu) ? U_str(it.ThuTu).split(',') : q.options.map(function (x) { return x.key; });
    var x = {
      k: 'S' + Number(it.STT), stt: Number(it.STT), phan: U_str(it.Phan), dang: q.dang, vi: q.vi, en: tr(q.en),
      latex: q.latex, media: med(q.hinh), video: U_str(q.video), audio: U_str(q.amThanh), g: q.maNhom || '',
      opts: q.dang === DANG.TRA_LOI_NGAN ? [] : perm.map(function (L) {
        var op = q.options[U_letterIndex(L)] || { vi: '?', en: '' };
        return { vi: op.vi, en: tr(op.en) };
      }),
      right: (q.right || []).map(function (r) { return { vi: r.vi, en: tr(r.en) }; })
    };
    if (o.withKey) { x.key = U_str(it.DapAnMaDe); x.maCH = U_str(it.MaCH); x.mucDo = U_str(it.MucDo); }
    if (q.maNhom && bank.groups[q.maNhom]) {
      var g = groups[q.maNhom];
      if (!g) {
        var gb = bank.groups[q.maNhom];
        g = groups[q.maNhom] = { vi: gb.vi, en: tr(gb.en), latex: gb.latex, media: med(gb.hinh), video: U_str(gb.video), audio: U_str(gb.amThanh), from: x.stt, to: x.stt };
      }
      g.from = Math.min(g.from, x.stt); g.to = Math.max(g.to, x.stt);
    }
    out.push(x);
  });
  var secs = o.sections.map(function (s) {
    var n = out.filter(function (x) { return x.phan === String(s.phan); }).length;
    var dangs = {};
    out.forEach(function (x) { if (x.phan === String(s.phan)) dangs[x.dang] = true; });
    return { phan: String(s.phan), ten: s.ten, diem: Number(s.diem), n: n, moiCau: n ? U_round(Number(s.diem) / n, 3) : 0,
      dangs: Object.keys(dangs) };
  }).filter(function (s) { return s.n > 0; });
  var cfg = o.cfg || {}, ex = o.exRow || {};
  return {
    v: 1, maKyThi: U_str(ex.MaKyThi), ten: U_str(ex.TenKyThi), donVi: U_str(cfg.TEN_DON_VI), maDe: String(o.maDe),
    thoiGian: U_num(ex.ThoiGianPhut, 0), tongDiem: secs.reduce(function (a, s) { return a + s.diem; }, 0), soCau: out.length,
    sections: secs, items: out, groups: groups, hints: Object.keys(DANG).reduce(function (m, k) { m[k] = PK_hint(k); return m; }, {}),
    warnings: warnings
  };
}

/** Cắt chuỗi dài thành các mảnh (ô Google Sheets chứa tối đa 50.000 ký tự) */
function PK_chunks(s, size) {
  s = String(s); size = size || 45000;
  var out = [];
  for (var i = 0; i < s.length; i += size) out.push(s.substring(i, i + size));
  return out.length ? out : [''];
}

/** Dòng DeThi → bản sao dùng khoá câu trả lời 'S<STT>' cho bộ chấm */
function PK_webItems(items) {
  return items.map(function (it) {
    var o = {};
    Object.keys(it).forEach(function (k) { o[k] = it[k]; });
    o.FormItemId = 'S' + Number(it.STT);
    return o;
  });
}

/**
 * Bài làm web (ký hiệu HIỂN THỊ): {S1:'B', S2:['A','C'], S3:['Đ','S',null,'Đ'], S4:[2,1,3], S5:'3,14'}
 * → câu trả lời theo định dạng Google Form mà Grade_toOriginal hiểu được.
 */
function PK_toGradeAnswers(web, items) {
  var a = {};
  web = web || {};
  items.forEach(function (it) {
    var k = 'S' + Number(it.STT), v = web[k];
    if (v === undefined || v === null || v === '') return;
    switch (U_str(it.DangCau)) {
      case DANG.MOT_DA: a[k] = U_upper(Array.isArray(v) ? v[0] : v); break;
      case DANG.NHIEU_DA: a[k] = (Array.isArray(v) ? v : String(v).split(',')).map(U_upper).filter(String); break;
      case DANG.DUNG_SAI: a[k] = (Array.isArray(v) ? v : []).map(function (x) {
        var s = U_upper(x);
        return s === 'Đ' || s === 'D' || s === 'TRUE' ? GR_TRUE_LABEL : (s === 'S' || s === 'FALSE' ? GR_FALSE_LABEL : '');
      }); break;
      case DANG.GHEP_NOI: a[k] = (Array.isArray(v) ? v : []).map(function (x) { return x === null || x === undefined || x === '' ? '' : String(x); }); break;
      case DANG.TRA_LOI_NGAN: a[k] = U_str(v); break;
    }
  });
  return a;
}

/** Bài làm web → chuỗi gọn để đọc / ghi lên giấy: "1A 2BD 3ĐSSĐ 4:2-1-3 5=3,14" */
function PK_answerString(web, items) {
  web = web || {};
  return items.slice().sort(function (a, b) { return Number(a.STT) - Number(b.STT); }).map(function (it) {
    var n = Number(it.STT), v = web['S' + n], d = U_str(it.DangCau);
    if (v === undefined || v === null || v === '' || (Array.isArray(v) && !v.some(function (x) { return x !== null && x !== ''; }))) return n + '-';
    if (d === DANG.MOT_DA) return n + U_upper(v);
    if (d === DANG.NHIEU_DA) return n + v.slice().sort().join('');
    if (d === DANG.DUNG_SAI) return n + v.map(function (x) { return x ? (U_upper(x) === 'S' ? 'S' : 'Đ') : '_'; }).join('');
    if (d === DANG.GHEP_NOI) return n + ':' + v.map(function (x) { return x ? x : '0'; }).join('-');
    return n + '=' + U_str(v).replace(/\s+/g, '');
  }).join(' ');
}

/**
 * Đọc bài làm trên giấy do giám thị gõ lại.
 *  - Dạng đánh số: "1A 2BD 3ĐSSĐ 4:2-1-3 5=3,14"  (cũng chấp nhận "1.A", "1: A", "1 A"; bỏ trống: "6-")
 *  - Dạng chuỗi liền (chỉ khi mọi câu là MOT_DA): "ABCDA-BC…" (dấu - hoặc _ là bỏ trống)
 * @return {answers:{S1:..}, errors:[], count}
 */
function PK_parseManual(text, items) {
  var list = items.slice().sort(function (a, b) { return Number(a.STT) - Number(b.STT); });
  var byStt = {};
  list.forEach(function (it) { byStt[Number(it.STT)] = it; });
  var t = U_str(text).normalize('NFC');
  var answers = {}, errors = [];
  if (!t) return { answers: answers, errors: ['Chưa nhập bài làm'], count: 0 };
  if (!/\d/.test(t)) {
    var chars = t.replace(/\s+/g, '').toUpperCase().split('');
    if (list.some(function (it) { return U_str(it.DangCau) !== DANG.MOT_DA; })) {
      return { answers: {}, errors: ['Đề có câu không phải 1 đáp án — hãy ghi kèm số câu, ví dụ: 1A 2BD 3ĐSSĐ'], count: 0 };
    }
    if (chars.length > list.length) errors.push('Nhập ' + chars.length + ' ký tự nhưng đề chỉ có ' + list.length + ' câu');
    chars.forEach(function (c, i) {
      var it = list[i];
      if (!it) return;
      if (c === '-' || c === '_' || c === '.') return;
      if (!/^[A-J]$/.test(c)) { errors.push('Câu ' + it.STT + ': ký tự "' + c + '" không hợp lệ'); return; }
      if (U_letterIndex(c) >= (U_str(it.ThuTu).split(',').length || 4)) { errors.push('Câu ' + it.STT + ': không có lựa chọn ' + c); return; }
      answers['S' + Number(it.STT)] = c;
    });
    return { answers: answers, errors: errors, count: Object.keys(answers).length };
  }
  // dạng đánh số: mỗi mục "số[.:)=]?đáp_án"; số đứng riêng thì mục kế tiếp là đáp án của nó ("4 213", "1: A")
  var toks = t.split(/[\s;]+/).filter(String), merged = [], pending = null;
  toks.forEach(function (tok) {
    if (pending !== null) { merged.push([pending, tok.replace(/^[.:)=]/, '')]); pending = null; return; }
    var m = tok.match(/^(\d+)[.:)=]?(.*)$/);
    if (!m) { errors.push('Không đọc được "' + tok + '" (cần có số câu phía trước)'); return; }
    if (m[2] === '') pending = m[1]; else merged.push([m[1], m[2]]);
  });
  if (pending !== null) merged.push([pending, '']);
  var seen = {};
  merged.forEach(function (pr) {
    var n = Number(pr[0]), rest = pr[1].trim(), it = byStt[n];
    if (!it) { errors.push('Đề không có câu ' + n); return; }
    if (seen[n]) errors.push('Câu ' + n + ' được nhập 2 lần (lấy lần sau)');
    seen[n] = true;
    var key = 'S' + n, d = U_str(it.DangCau), nOpt = U_str(it.ThuTu) ? U_str(it.ThuTu).split(',').length : 0;
    if (rest === '' || /^[-_?]+$/.test(rest)) { delete answers[key]; return; }
    if (d === DANG.MOT_DA || d === DANG.NHIEU_DA) {
      var L = rest.toUpperCase().replace(/[^A-Z]/g, '').split('');
      var bad = L.filter(function (x) { return U_letterIndex(x) < 0 || U_letterIndex(x) >= (nOpt || 10); });
      if (!L.length || bad.length) { errors.push('Câu ' + n + ': "' + rest + '" không phải lựa chọn hợp lệ'); return; }
      L = L.filter(function (x, i) { return L.indexOf(x) === i; }).sort();
      if (d === DANG.MOT_DA && L.length > 1) { errors.push('Câu ' + n + ' chỉ có 1 đáp án nhưng ghi ' + L.join('')); return; }
      answers[key] = d === DANG.MOT_DA ? L[0] : L;
    } else if (d === DANG.DUNG_SAI) {
      var cs = rest.toUpperCase().replace(/[^ĐDSTF01_\-?]/g, '').split('');
      if (cs.length !== nOpt) { errors.push('Câu ' + n + ' có ' + nOpt + ' ý Đúng/Sai nhưng nhập ' + cs.length + ' ký tự'); return; }
      answers[key] = cs.map(function (c) { return /[ĐDT1]/.test(c) ? 'Đ' : (/[SF0]/.test(c) ? 'S' : null); });
    } else if (d === DANG.GHEP_NOI) {
      var parts = /[-,\/]/.test(rest) ? rest.split(/[-,\/]+/) : rest.split('');
      parts = parts.map(function (p) { var x = parseInt(p, 10); return isNaN(x) || x === 0 ? null : x; });
      if (parts.length !== nOpt) { errors.push('Câu ' + n + ' có ' + nOpt + ' ý cần ghép nhưng nhập ' + parts.length); return; }
      answers[key] = parts;
    } else {
      answers[key] = rest.replace(/^=/, '');
    }
  });
  return { answers: answers, errors: errors, count: Object.keys(answers).length };
}

/**
 * Chọn bài chính thức của một thí sinh trong các dòng BaiLam (phòng thi):
 * GIAY (nhập tay, mới nhất) > NOP / NOP_TRE (lần đầu) > LUU (bản tự lưu có Seq lớn nhất → "tự thu").
 */
function PK_pickFinal(rows) {
  var by = function (type) { return rows.filter(function (r) { return U_upper(r.Loai) === type; }); };
  var num = function (v) { return Number(v) || 0; };
  var giay = by('GIAY').sort(function (a, b) { return num(b.ThoiGian) - num(a.ThoiGian); });
  if (giay.length) return { row: giay[0], kind: 'GIAY' };
  var nop = by('NOP').concat(by('NOP_TRE')).sort(function (a, b) { return num(a.ThoiGian) - num(b.ThoiGian); });
  if (nop.length) return { row: nop[0], kind: U_upper(nop[0].Loai) };
  var luu = by('LUU').sort(function (a, b) { return num(b.Seq) - num(a.Seq) || num(b.ThoiGian) - num(a.ThoiGian); });
  if (luu.length) return { row: luu[0], kind: 'TU_THU' };
  return null;
}

/** Hạn nộp (ms) của một thí sinh — cùng công thức với máy chủ phòng thi */
function PK_pausedMs(st, now) { return U_num(st.DungMs, 0) + (U_num(st.DungLuc, 0) ? Math.max(0, (now || Date.now()) - U_num(st.DungLuc, 0)) : 0); }
function PK_deadline(ex, st) {
  var dur = (U_num(ex.ThoiGianPhut, 0) + U_num(st.ThemPhut, 0)) * 60000;
  // CHUNG: tính từ lúc mở phòng; thí sinh được "làm lại" sau lúc mở thì tính từ lúc em bắt đầu lượt mới (khớp máy chủ phòng thi)
  var m = String(st.GhiChu == null ? '' : st.GhiChu).match(/^RESET:(\d+)/), ra = m ? Number(m[1]) : 0;
  var base = U_upper(ex.TinhGio) === 'CHUNG' && !(ra > U_num(ex.MoLuc, 0)) ? U_num(ex.MoLuc, 0) : U_num(st.BatDau, 0);
  var d = dur > 0 && base ? base + dur + PK_pausedMs(st) : Infinity;
  // HẸN ĐÓNG = mốc chung của phòng; VuotHen = số phút RIÊNG em được vượt mốc (do giám thị cộng giờ / tạm dừng riêng)
  // HenCung = CO: "đồng bộ" — mọi em kết thúc đúng mốc (+ phần vượt riêng), bất kể giờ làm bài còn lại
  if (U_num(ex.HenDong, 0)) {
    var capH = U_num(ex.HenDong, 0) + U_num(st.VuotHen, 0) * 60000;
    d = U_upper(ex.HenCung) === 'CO' ? capH : Math.min(d, capH);
  }
  if (U_upper(ex.TrangThai) === 'DONG' && U_num(ex.DongLuc, 0)) d = Math.min(d, U_num(ex.DongLuc, 0));
  return d;
}

/** Mã truy cập 6 ký tự dễ đọc (không có 0/O, 1/I) */
function PK_code(rnd) {
  var chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789', s = '';
  rnd = rnd || Math.random;
  for (var i = 0; i < 6; i++) s += chars.charAt(Math.floor(rnd() * chars.length));
  return s;
}

/* ---------------- Safe Exam Browser ---------------- */

function PK_xmlEsc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }

function PK_plist(v, ind) {
  ind = ind || '';
  if (v === true) return ind + '<true/>';
  if (v === false) return ind + '<false/>';
  if (typeof v === 'number') return ind + '<integer>' + Math.round(v) + '</integer>';
  if (Array.isArray(v)) return ind + '<array>\n' + v.map(function (x) { return PK_plist(x, ind + '  '); }).join('\n') + '\n' + ind + '</array>';
  if (v && typeof v === 'object') {
    return ind + '<dict>\n' + Object.keys(v).map(function (k) {
      return ind + '  <key>' + PK_xmlEsc(k) + '</key>\n' + PK_plist(v[k], ind + '  ');
    }).join('\n') + '\n' + ind + '</dict>';
  }
  return ind + '<string>' + PK_xmlEsc(v) + '</string>';
}

/**
 * Tạo nội dung file .seb (plist XML, không mã hoá).
 * @param o {startURL, quitURL, quitHash (SHA-256 hex của mật khẩu thoát, có thể rỗng), uaSuffix, urlFilter (bool)}
 */
function PK_sebXml(o) {
  var s = {
    originatorVersion: 'HeThongThi_PhongThiWeb',
    startURL: o.startURL,
    sendBrowserExamKey: false,
    browserUserAgent: o.uaSuffix || '',
    allowQuit: true,
    hashedQuitPassword: o.quitHash || '',
    quitURL: o.quitURL || '',
    quitURLConfirm: true,
    browserViewMode: 1,
    mainBrowserWindowWidth: '100%',
    mainBrowserWindowHeight: '100%',
    showTaskBar: true,
    showTime: true,
    showReloadButton: true,
    browserWindowAllowReload: true,
    showReloadWarning: true,
    newBrowserWindowByLinkPolicy: 1,
    newBrowserWindowByScriptPolicy: 1,
    allowSpellCheck: false,
    allowDictionaryLookup: false,
    allowDictation: false,
    allowDeveloperConsole: false,
    enableRightMouse: false,
    enablePrintScreen: false,
    allowVirtualMachine: false,
    allowedDisplaysMaxNumber: 1,
    allowDisplayMirroring: false,
    enableAppSwitcherCheck: true,
    allowSwitchToApplications: false,
    allowScreenSharing: false,
    examSessionClearCookiesOnStart: true,
    examSessionClearCookiesOnEnd: true,
    allowDownUploads: false,
    allowPDFReaderToolbar: false,
    enableZoomPage: true,
    enableZoomText: true,
    // LỚP 3 — âm thanh: tắt tiếng khi vào thi (tab nghe nhạc / video nền im lặng) và ẩn nút âm lượng
    audioMute: !o.keepAudio,
    audioControlEnabled: !!o.keepAudio,
    audioSetVolumeLevel: !!o.keepAudio,
    audioVolumeLevel: 60,
    // LỚP 1 — khoá máy theo hệ điều hành
    createNewDesktop: true,                // Windows: SEB chạy trên màn hình làm việc MỚI, không với tới cửa sổ nào khác
    killExplorerShell: false,
    lockdownModePolicy: o.macAAC === false ? 0 : 2, // macOS: 2 = BẮT BUỘC Assessment Mode (AAC): mọi app khác mất mạng & không quay được màn hình
    enableMacOSAAC: o.macAAC !== false,
    detectAccessibilityApps: true,         // macOS: app có quyền Trợ năng (điều khiển máy) bị đóng
    URLFilterEnable: !!o.urlFilter,
    URLFilterEnableContentFilter: false,
    allowWlan: true,                       // Windows: hiện điều khiển Wi-Fi trên thanh tác vụ SEB
    showMenuBar: !!o.macMenuBar,           // macOS: hiện thanh menu hệ thống (wifi, pin) — có thể mở menu hệ thống
    monitorProcesses: true                 // luôn giám sát: cửa sổ app không được phép bị ẩn, không ẩn được thì bị đóng
  };
  // LỚP 2 — buộc đóng ngay (không hỏi) các nhóm ứng dụng đã chọn + danh sách tự thêm
  if (o.blockApps !== false) s.prohibitedProcesses = PK_blockedApps(o.groups, o.extraApps, o.forceQuit !== false);
  if (o.urlFilter) {
    var allow = ['script.google.com', '*.google.com', '*.googleusercontent.com', '*.gstatic.com', '*.googleapis.com', 'cdn.jsdelivr.net',
      'fonts.googleapis.com', 'fonts.gstatic.com', 'www.youtube-nocookie.com'].concat(o.extraAllow || []);
    s.URLFilterRules = allow.map(function (e) { return { active: true, regex: false, expression: e, action: 1 }; });
  }
  return '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">\n' +
    '<plist version="1.0">\n' + PK_plist(s) + '\n</plist>\n';
}

/** Ứng dụng bị SEB đóng khi thi: trình duyệt khác (Meet chạy trong trình duyệt), gọi video, nhắn tin, điều khiển từ xa, trợ lý AI */
/** Nhóm ứng dụng bị chặn: [mã, tên hiển thị, macOS bundle id[], Windows .exe[]] */
var PK_APP_GROUPS = [
  ['TRINH_DUYET', 'Trình duyệt khác (kể cả tab nghe nhạc, Google Meet trên web)',
    ['com.google.Chrome', 'com.google.Chrome.canary', 'com.google.Chrome.beta', 'com.microsoft.edgemac', 'org.mozilla.firefox', 'com.apple.Safari',
      'com.brave.Browser', 'com.operasoftware.Opera', 'com.operasoftware.OperaGX', 'company.thebrowser.Browser', 'com.coccoc.Coccoc', 'com.vivaldi.Vivaldi',
      'org.chromium.Chromium', 'ru.yandex.desktop.yandex-browser'],
    ['chrome.exe', 'msedge.exe', 'firefox.exe', 'opera.exe', 'opera_gx.exe', 'brave.exe', 'browser.exe', 'vivaldi.exe', 'iexplore.exe', 'chromium.exe', 'arc.exe']],
  ['NHAN_TIN', 'Nhắn tin & gọi video (Zalo, Messenger, Meet, Zoom, Teams, Discord, Telegram…)',
    ['com.vng.zalo', 'com.facebook.archon', 'ru.keepcoder.Telegram', 'org.telegram.desktop', 'com.hnc.Discord', 'com.tinyspeck.slackmacgap',
      'net.whatsapp.WhatsApp', 'desktop.WhatsApp', 'com.apple.MobileSMS', 'com.apple.FaceTime', 'com.skype.skype', 'com.viber.osx', 'jp.naver.line.mac',
      'us.zoom.xos', 'com.microsoft.teams2', 'com.microsoft.teams', 'Cisco-Systems.Spark', 'com.cisco.webexmeetingsapp'],
    ['Zalo.exe', 'ZaloCall.exe', 'Messenger.exe', 'Telegram.exe', 'Discord.exe', 'slack.exe', 'WhatsApp.exe', 'Skype.exe', 'Viber.exe', 'LINE.exe',
      'Zoom.exe', 'Teams.exe', 'ms-teams.exe', 'CiscoCollabHost.exe', 'webexmta.exe']],
  ['AI', 'Trợ lý AI (ChatGPT, Claude, Copilot, Gemini, Perplexity…)',
    ['com.openai.chat', 'com.anthropic.claudefordesktop', 'com.microsoft.copilot', 'ai.perplexity.mac', 'com.google.GeminiMacOS'],
    ['ChatGPT.exe', 'claude.exe', 'Copilot.exe', 'M365Copilot.exe', 'Perplexity.exe', 'Gemini.exe']],
  ['TAC_TU_AI', 'Tác tử AI điều khiển máy (Codex, ChatGPT Atlas / Agent, Comet, Claude Code…) & công cụ tự động (Python, Node, AutoHotkey)',
    ['com.openai.codex', 'com.openai.atlas', 'com.openai.chatgpt.atlas', 'ai.perplexity.comet', 'com.anthropic.claude-code', 'org.python.python', 'com.apple.ScriptEditor2',
      'com.apple.Automator', 'com.hegenberg.BetterTouchTool', 'com.stairways.keyboardmaestro.engine'],
    ['codex.exe', 'Codex.exe', 'ChatGPT Atlas.exe', 'Atlas.exe', 'Comet.exe', 'node.exe', 'python.exe', 'pythonw.exe', 'py.exe', 'pyw.exe',
      'AutoHotkey.exe', 'AutoHotkey64.exe', 'AutoHotkeyU64.exe', 'AutoIt3.exe', 'TinyTask.exe']],
  ['DIEU_KHIEN', 'Điều khiển từ xa & quay màn hình (UltraViewer, AnyDesk, TeamViewer, OBS…)',
    ['com.teamviewer.TeamViewer', 'com.philandro.anydesk', 'com.rustdesk.RustDesk', 'com.obsproject.obs-studio', 'com.parsec.www'],
    ['UltraViewer_Desktop.exe', 'UltraViewer_Service.exe', 'AnyDesk.exe', 'TeamViewer.exe', 'rustdesk.exe', 'ToDesk.exe', 'parsecd.exe', 'obs64.exe', 'obs32.exe',
      'quickassist.exe', 'mstsc.exe']],
  ['GAME', 'Game & nền tảng game (Liên Minh, Valorant, Steam, Epic, Roblox…)',
    ['com.riotgames.RiotGames.RiotClient', 'com.riotgames.LeagueofLegends.LeagueClient', 'com.valvesoftware.steam', 'com.epicgames.EpicGamesLauncher', 'com.roblox.RobloxPlayer'],
    ['LeagueClient.exe', 'LeagueClientUx.exe', 'League of Legends.exe', 'RiotClientServices.exe', 'RiotClientUx.exe', 'VALORANT.exe', 'Steam.exe',
      'steamwebhelper.exe', 'EpicGamesLauncher.exe', 'RobloxPlayerBeta.exe', 'Garena.exe', 'GarenaMessenger.exe']],
  ['LAP_TRINH', 'Công cụ lập trình & soạn thảo (VS Code, Cursor, JetBrains, Terminal…)',
    ['com.microsoft.VSCode', 'com.todesktop.230313mzl4w4u92', 'com.jetbrains.intellij', 'com.jetbrains.pycharm', 'com.jetbrains.pycharm.ce', 'com.apple.Terminal',
      'com.googlecode.iterm2', 'com.apple.dt.Xcode', 'com.sublimetext.4', 'com.exafunction.windsurf'],
    ['Code.exe', 'Cursor.exe', 'Windsurf.exe', 'idea64.exe', 'pycharm64.exe', 'devenv.exe', 'WindowsTerminal.exe', 'sublime_text.exe', 'notepad++.exe']],
  ['NHAC_VIDEO', 'Nghe nhạc & xem video (Spotify, VLC, Apple Music…)',
    ['com.spotify.client', 'com.apple.Music', 'org.videolan.vlc', 'com.apple.TV', 'com.apple.QuickTimePlayerX', 'com.apple.podcasts'],
    ['Spotify.exe', 'vlc.exe', 'wmplayer.exe', 'Microsoft.Media.Player.exe', 'PotPlayerMini64.exe', 'foobar2000.exe', 'Music.UI.exe', 'Video.UI.exe']]
];
/** Danh sách cấm cho file .seb. groups: mã nhóm (bỏ trống = tất cả); extra: chuỗi nhiều dòng do giám thị tự thêm */
function PK_blockedApps(groups, extra, force) {
  var want = groups && groups.length ? groups : PK_APP_GROUPS.map(function (g) { return g[0]; });
  var out = [], seen = {};
  function mac(id, name) { if (seen['m' + id]) return; seen['m' + id] = 1; out.push({ active: true, currentUser: true, description: name, executable: name, identifier: id, os: 0, strongKill: !!force }); }
  function win(exe, name) { var k = 'w' + exe.toLowerCase(); if (seen[k]) return; seen[k] = 1; out.push({ active: true, currentUser: true, description: name, executable: exe, identifier: '', originalName: exe, os: 1, strongKill: !!force }); }
  PK_APP_GROUPS.forEach(function (g) {
    if (want.indexOf(g[0]) < 0) return;
    g[2].forEach(function (id) { mac(id, id.split('.').pop()); });
    g[3].forEach(function (e) { win(e, e.replace(/\.exe$/i, '')); });
  });
  String(extra || '').split(/[\n,;]+/).map(function (x) { return x.trim(); }).filter(Boolean).forEach(function (x) {
    if (/\.exe$/i.test(x)) win(x, x.replace(/\.exe$/i, ''));
    else if (/^[\w-]+(\.[\w-]+){2,}$/.test(x)) mac(x, x.split('.').pop());           // dạng com.hang.UngDung → macOS
    else { win(x + '.exe', x); out.push({ active: true, currentUser: true, description: x, executable: x, identifier: '', os: 0, strongKill: !!force }); }
  });
  return out;
}

/** Byte[] (có thể âm như Apps Script trả về) → chuỗi hex */
function PK_hex(bytes) {
  return (bytes || []).map(function (b) { var v = (b + 256) % 256; return (v < 16 ? '0' : '') + v.toString(16); }).join('');
}

/* ======================= 19_RoomBundle.gs ======================= */
/**
 * 19_RoomBundle.gs — TỰ SINH bởi tools/bundle.js, đừng sửa tay.
 * Mã lõi phòng thi + giao diện thí sinh + bộ khởi động. Trung tâm đẩy sang file PhongThi_DuLieu (sheet MaNguon).
 */
var ROOM_BUNDLE = {
  version: "1.7.9",
  hash: "1.7.9-89bfab7c",
  bootVersion: "3",
  code: "/**\n * 26_Judge.gs — MÁY CHẤM LẬP TRÌNH (dùng chung cho Hệ thống Trung tâm VÀ phòng thi — tools/bundle.js nhúng tệp này vào mã phòng thi).\n *\n * Chạy code Python / C qua dịch vụ biên dịch trực tuyến (Apps Script không tự chạy được Python/C):\n *   - wandbox : miễn phí, không cần khoá (mặc định) — https://wandbox.org\n *   - judge0  : Judge0 CE (tự cài, RapidAPI, Sulu…) — url + khoá\n *   - piston  : Piston tự cài — url\n * Mỗi test là 1 lượt chạy, các test chạy SONG SONG (UrlFetchApp.fetchAll).\n * Giới hạn thời gian / bộ nhớ: Judge0 & Piston tự áp; Wandbox & Piston được chèn thêm 1 đoạn đầu chương trình\n * đặt giới hạn CPU (setrlimit) và in thời gian CPU + bộ nhớ ra stderr (dòng \"@@PT ms kb\"), máy chấm đọc rồi xoá đi.\n *\n * Chỉ dùng JS thuần + UrlFetchApp + Utilities → chạy được ở cả 2 dự án.\n */\n\nvar JD_VERDICT = {\n  AC: 'Đúng', WA: 'Sai kết quả', TLE: 'Quá thời gian', MLE: 'Quá bộ nhớ', RE: 'Lỗi khi chạy', CE: 'Lỗi biên dịch',\n  OK: 'Đã chạy', IE: 'Lỗi máy chấm'\n};\nvar JD_LANGS = { py: 'Python 3', c: 'C (GCC)' };\nvar JD_MAX_OUT = 65536;       // giữ tối đa 64 KB output mỗi test\nvar JD_MAX_CODE = 30000;      // code tối đa 30.000 ký tự\n\n/* ----------------------------------------------------------------- so sánh output */\n\nfunction JD_norm(s) { return String(s == null ? '' : s).replace(/\\r\\n?/g, '\\n'); }\nfunction JD_tokens(s) { return JD_norm(s).split(/\\s+/).filter(function (x) { return x !== ''; }); }\n/**\n * So sánh output.\n * mode: TOKEN (mặc định — bỏ qua khác biệt khoảng trắng/xuống dòng) · LINE (từng dòng, bỏ khoảng trắng cuối dòng & dòng trống cuối)\n *       EXACT (đúng từng ký tự) · FLOAT (như TOKEN, số thực sai số eps) · NOCASE (như TOKEN, không phân biệt hoa thường)\n */\nfunction JD_compare(expected, actual, mode, eps) {\n  mode = String(mode || 'TOKEN').toUpperCase();\n  if (mode === 'EXACT') return JD_norm(expected) === JD_norm(actual);\n  if (mode === 'LINE') {\n    var cut = function (s) { var a = JD_norm(s).split('\\n').map(function (x) { return x.replace(/[ \\t]+$/, ''); }); while (a.length && a[a.length - 1] === '') a.pop(); return a; };\n    var a = cut(expected), b = cut(actual);\n    if (a.length !== b.length) return false;\n    for (var i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;\n    return true;\n  }\n  var x = JD_tokens(expected), y = JD_tokens(actual);\n  if (x.length !== y.length) return false;\n  var e = Number(eps); if (!(e > 0)) e = 1e-6;\n  for (var j = 0; j < x.length; j++) {\n    if (x[j] === y[j]) continue;\n    if (mode === 'NOCASE' && x[j].toLowerCase() === y[j].toLowerCase()) continue;\n    if (mode === 'FLOAT') {\n      var p = Number(x[j]), q = Number(y[j]);\n      if (x[j] !== '' && y[j] !== '' && isFinite(p) && isFinite(q) && Math.abs(p - q) <= e * Math.max(1, Math.abs(p))) continue;\n    }\n    return false;\n  }\n  return true;\n}\n/** Vị trí khác đầu tiên (để hiển thị cho thí sinh với test mẫu) */\nfunction JD_firstDiff(expected, actual) {\n  var a = JD_norm(expected).split('\\n'), b = JD_norm(actual).split('\\n');\n  for (var i = 0; i < Math.max(a.length, b.length); i++) {\n    if ((a[i] || '').replace(/\\s+$/, '') !== (b[i] || '').replace(/\\s+$/, '')) return { line: i + 1, exp: a[i] === undefined ? '(hết)' : a[i], got: b[i] === undefined ? '(hết)' : b[i] };\n  }\n  return null;\n}\n\n/* ----------------------------------------------------------------- đoạn đầu chương trình (đo thời gian / bộ nhớ, giới hạn CPU) */\n\nfunction JD_wrap(lang, code, tl, mlMb, lib) {\n  var t = Math.max(1, Math.ceil(Number(tl) || 2));\n  if (lang === 'c') {\n    // đoạn đo / giới hạn đặt SAU code thí sinh → số dòng, cột và dòng code trích trong thông báo lỗi khớp đúng code thí sinh.\n    // Tên biến đều có tiền tố __pt_ để không đụng #define của thí sinh (VD #define m 1000000007).\n    var ml = Math.max(32, Number(mlMb) || 256) * 1048576;\n    return String(code).replace(/\\s*$/, '\\n') + '\\n#include <stdio.h>\\n#include <stdlib.h>\\n#include <unistd.h>\\n#include <sys/resource.h>\\n' +\n      'static void __pt_end(void){struct rusage __pt_u;getrusage(RUSAGE_SELF,&__pt_u);fflush(stdout);fprintf(stderr,\"\\\\n@@PT %ld %ld\\\\n\",' +\n      '(long)(__pt_u.ru_utime.tv_sec*1000+__pt_u.ru_utime.tv_usec/1000+__pt_u.ru_stime.tv_sec*1000+__pt_u.ru_stime.tv_usec/1000),(long)__pt_u.ru_maxrss);}\\n' +\n      '__attribute__((constructor)) static void __pt_init(void){struct rlimit __pt_c={' + t + ',' + (t + 1) + '};setrlimit(RLIMIT_CPU,&__pt_c);' +\n      'struct rlimit __pt_m={' + ml + 'UL,' + ml + 'UL};setrlimit(RLIMIT_AS,&__pt_m);alarm(' + (t * 3 + 2) + ');atexit(__pt_end);}\\n';\n  }\n  // Python: đúng 1 dòng đầu → lỗi báo \"line N\" được trừ lại 1\n  return 'import resource as __ptR,atexit as __ptA,sys as __ptS;__ptR.setrlimit(__ptR.RLIMIT_CPU,(' + t + ',' + (t + 1) + '));' +\n    '__ptA.register(lambda:(__ptS.stdout.flush(),__ptS.stderr.write(\"\\\\n@@PT %d %d\\\\n\"%(int((__ptR.getrusage(__ptR.RUSAGE_SELF).ru_utime+__ptR.getrusage(__ptR.RUSAGE_SELF).ru_stime)*1000),__ptR.getrusage(__ptR.RUSAGE_SELF).ru_maxrss))))' + JD_pyHook(lib) + '\\n' + code;\n}\n/* ----------------------------------------------------------------- KIỂM SOÁT THƯ VIỆN & HÀM CẤM */\n\n/**\n * Quy định thư viện của 1 bài: { py: null (không giới hạn) | ['math','sys'] (chỉ các module này; [] = không import gì),\n *                                c: null | ['stdio.h','math.h'], cam: ['sorted','qsort'] }\n * Chuỗi lưu trong sheet: \"TAT_CA\" / \"\" = không giới hạn · \"KHONG\" = không import gì · \"math, sys\" = danh sách.\n */\nfunction JD_libRules(py, c, cam) {\n  var list = function (s, lower) {\n    return String(s || '').split(/[\\s,;]+/).map(function (x) { x = x.trim(); return lower ? x.toLowerCase() : x; }).filter(Boolean)\n      .filter(function (x, i, a) { return a.indexOf(x) === i; });\n  };\n  var mode = function (s, isC) {\n    var u = String(s || '').trim().toUpperCase();\n    if (!u || u === 'TAT_CA' || u === '*') return null;\n    if (u === 'KHONG') return [];\n    return list(s, true).map(function (x) { return isC ? x.replace(/^[<\"]|[>\"]$/g, '') : x.replace(/\\..*$/, ''); });\n  };\n  var r = { py: mode(py, false), c: mode(c, true), cam: list(cam, false) };\n  return r.py === null && r.c === null && !r.cam.length ? null : r;\n}\n/** Xoá chú thích + nội dung chuỗi (giữ xuống dòng để tính số dòng). f-string giữ nguyên (biểu thức nằm trong ngoặc nhọn). */\nfunction JD_strip(lang, s) {\n  s = String(s || '').replace(/\\r\\n?/g, '\\n');\n  var out = '', i = 0, n = s.length;\n  var blank = function (t) { return t.replace(/[^\\n]/g, ' '); };\n  while (i < n) {\n    var ch = s[i];\n    if (lang === 'py') {\n      if (ch === '#') { var e = s.indexOf('\\n', i); if (e < 0) e = n; out += blank(s.substring(i, e)); i = e; continue; }\n      var m = /^([rRbBuUfF]{0,2})(\"\"\"|'''|\"|')/.exec(s.substring(i, i + 5));\n      if (m && (m[1] === '' || !/\\w/.test(s[i - 1] || ''))) {\n        var q = m[2], st = i + m[0].length, j = st;\n        while (j < n) {\n          if (s[j] === '\\\\') { j += 2; continue; }\n          if (s.substr(j, q.length) === q) break;\n          if (q.length === 1 && s[j] === '\\n') break;\n          j++;\n        }\n        var closed = j < n && s[j] !== '\\n', body = s.substring(st, Math.min(j, n));\n        out += s.substring(i, st) + (/f/i.test(m[1]) ? body : blank(body)) + (closed ? q : '');\n        i = closed ? j + q.length : j; continue;\n      }\n    } else {\n      if (s.substr(i, 2) === '//') { var e2 = s.indexOf('\\n', i); if (e2 < 0) e2 = n; out += blank(s.substring(i, e2)); i = e2; continue; }\n      if (s.substr(i, 2) === '/*') { var e3 = s.indexOf('*/', i + 2); e3 = e3 < 0 ? n : e3 + 2; out += blank(s.substring(i, e3)); i = e3; continue; }\n      if (ch === '\"' || ch === \"'\") {\n        var k = i + 1;\n        while (k < n && s[k] !== ch && s[k] !== '\\n') { if (s[k] === '\\\\') k++; k++; }\n        var cl = s[k] === ch;\n        out += ch + blank(s.substring(i + 1, Math.min(k, n))) + (cl ? ch : ''); i = cl ? k + 1 : k; continue;\n      }\n    }\n    out += ch; i++;\n  }\n  return out;\n}\n/** Python: các đường lách quy định (nạp thư viện gián tiếp, gọi hàm cấm qua chuỗi, lấy lại __import__ gốc…). Cấm khi bài có quy định thư viện / tên cấm. */\nvar JD_PY_DYN = ['__import__', '__builtins__', 'builtins', '__loader__', '__spec__', 'importlib', 'sys.modules', '_getframe', 'meta_path', 'path_hooks',\n  'path_importer_cache', 'load_module', 'exec_module', 'find_spec', 'find_module',\n  '__subclasses__', '__globals__', '__closure__', '__defaults__', '__kwdefaults__', '__code__', '__mro__', '__bases__', '__base__', '__class__', '__dict__',\n  '__getattribute__', '__self__', '__func__', '__reduce__', '__reduce_ex__', '__traceback__', 'f_globals', 'f_locals', 'f_builtins', 'f_back', 'tb_frame', 'gi_frame', 'cr_frame',\n  'getattr', 'eval', 'exec', 'compile', 'globals', 'locals', 'vars', 'breakpoint', 'attrgetter', 'methodcaller', 'get_field', 'pickle', 'marshal', 'ctypes', 'runpy', 'codeop'];\n/** C: hàm thư viện chuẩn thường gặp → header. Bài giới hạn header mà code gọi / tự khai báo hàm của header khác → vi phạm (chặn lách bằng prototype tự viết). */\nvar JD_PY_BARE = ['getattr', 'eval', 'exec', 'compile', 'globals', 'locals', 'vars', 'breakpoint'];   // hàm dựng sẵn: chỉ tính khi gọi trần (re.compile vẫn được)\nvar JD_C_STD = {\n  'stdio.h': 'printf scanf puts gets getchar putchar fgets fputs sprintf snprintf sscanf fprintf fscanf getc putc fopen fclose fread fwrite fflush perror vprintf',\n  'stdlib.h': 'qsort bsearch abs labs llabs div ldiv lldiv atoi atol atoll atof strtol strtoll strtoul strtoull strtod strtof malloc calloc realloc free rand srand exit abort system getenv',\n  'string.h': 'strlen strcpy strncpy strcat strncat strcmp strncmp strchr strrchr strstr strtok strspn strcspn strpbrk memset memcpy memmove memcmp memchr strdup strrev strupr strlwr',\n  'math.h': 'sqrt sqrtf sqrtl pow powf fabs floor ceil round lround llround trunc fmod log log10 log2 log1p exp exp2 sin cos tan asin acos atan atan2 sinh cosh tanh hypot cbrt fmin fmax rint',\n  'ctype.h': 'isdigit isalpha isalnum isspace isupper islower ispunct isxdigit isprint toupper tolower',\n  'time.h': 'time clock difftime mktime localtime gmtime strftime',\n  'search.h': 'lsearch lfind tsearch hsearch'\n};\n/** Kiểm tra code theo quy định thư viện → null (hợp lệ) hoặc {line, msg} */\nfunction JD_libCheck(lang, code, lib) {\n  if (!lib) return null;\n  var raw = String(code || '').replace(/\\r\\n?/g, '\\n'), s = JD_strip(lang, raw);\n  var lineOf = function (idx) { return raw.substring(0, idx).split('\\n').length; };\n  var bad = function (idx, msg) { return { line: lineOf(idx), msg: 'Dòng ' + lineOf(idx) + ': ' + msg }; };\n  var m, re;\n  var hasCam = !!(lib.cam && lib.cam.length);\n  if (lang === 'py' && lib.py) {\n    var ok = lib.py, okTxt = ok.length ? 'chỉ cho dùng ' + ok.join(', ') : 'không cho import thư viện nào';\n    re = /(^|[;\\n])([ \\t]*)import[ \\t]+([^\\n;]+)/g;\n    while ((m = re.exec(s))) {\n      var mods = m[3].replace(/[()\\\\]/g, ' ').split(',');\n      for (var a = 0; a < mods.length; a++) {\n        var root = mods[a].trim().split(/\\s+/)[0].split('.')[0];\n        if (root && ok.indexOf(root.toLowerCase()) < 0) return bad(m.index + m[1].length, 'dùng thư viện «' + root + '» — bài này ' + okTxt + '.');\n      }\n    }\n    re = /(^|[;\\n])([ \\t]*)from[ \\t]+([.\\w]+)[ \\t]+import\\b/g;\n    while ((m = re.exec(s))) {\n      var r2 = m[3].split('.')[0];\n      if (r2 === '__future__') continue;\n      if (!r2 || ok.indexOf(r2.toLowerCase()) < 0) return bad(m.index + m[1].length, 'dùng thư viện «' + (r2 || m[3]) + '» — bài này ' + okTxt + '.');\n    }\n  }\n  if (lang === 'py' && (lib.py || hasCam)) {\n    // các đường lách: nạp thư viện gián tiếp / gọi hàm cấm qua chuỗi / lấy lại hàm gốc — cấm khi bài có quy định\n    var okM = lib.py || [], sneaky = JD_PY_DYN.concat(['__pt']), first = null;\n    for (var b = 0; b < sneaky.length; b++) {\n      if (okM.indexOf(sneaky[b]) >= 0) continue;\n      re = sneaky[b] === '__pt' ? /\\b__pt\\w*/ : new RegExp('(^|[^\\\\w' + (JD_PY_BARE.indexOf(sneaky[b]) >= 0 ? '.' : '') + '])(' + sneaky[b].replace(/\\./g, '\\\\s*\\\\.\\\\s*') + ')(?!\\\\w)');\n      var mm = re.exec(s);\n      if (mm) {\n        var at0 = sneaky[b] === '__pt' ? mm.index : mm.index + mm[1].length;\n        if (!first || at0 < first.at) first = { at: at0, nm: (sneaky[b] === '__pt' ? mm[0] : mm[2]).replace(/\\s+/g, '') };   // báo chỗ xuất hiện sớm nhất\n      }\n    }\n    if (first) return bad(first.at, 'không được dùng «' + first.nm + '» — bài có quy định thư viện nên cấm các cách gọi gián tiếp (eval, exec, getattr, globals, __import__, __class__…).');\n  }\n  if (lang === 'c') {\n    re = /(^|\\n)[ \\t]*#[ \\t]*(include_next|include|import)\\b/g;\n    while ((m = re.exec(s))) {\n      var at = m.index + m[1].length, rest = raw.substring(m.index + m[0].length).split('\\n')[0];\n      if (m[2] !== 'include' && (lib.c || hasCam)) return bad(at, 'không được dùng #' + m[2] + ' — chỉ dùng #include <tên.h>.');\n      var inc = /^\\s*[<\"]([^>\"\\s]+)[>\"]/.exec(rest);\n      if (!inc) return bad(at, '#include phải viết dạng #include <tên.h>.');\n      if (lib.c && lib.c.indexOf(inc[1].toLowerCase()) < 0)\n        return bad(at, '#include <' + inc[1] + '> không được phép — bài này chỉ cho dùng: ' + (lib.c.join(', ') || '(không thư viện nào)') + '.');\n    }\n    if (lib.c || hasCam) {\n      // lách bằng ghép tên macro (a##b), hợp ngữ, nạp hàm động\n      var cTricks = [[/##/, '«##» (ghép tên bằng macro)'], [/(^|[^\\w])(asm|__asm__|__asm)(?!\\w)/, '«asm» (hợp ngữ)'], [/(^|[^\\w])(dlsym|dlopen|dlvsym)(?!\\w)/, '«dlsym / dlopen» (nạp hàm động)']];\n      if (lib.c) cTricks.push([/(^|[^\\w])(__builtin_\\w+)/, '«__builtin_…» (hàm dựng sẵn của trình biên dịch)']);\n      for (var ct = 0; ct < cTricks.length; ct++) {\n        var hm = cTricks[ct][0].exec(s);\n        if (hm) return bad(hm.index + (hm[2] !== undefined ? hm[1].length : 0), 'không được dùng ' + cTricks[ct][1] + ' trong bài có quy định thư viện.');\n      }\n    }\n    if (lib.c) {\n      // gọi / tự khai báo hàm của header không được phép (VD tự viết prototype của qsort khi chỉ cho stdio.h)\n      for (var h in JD_C_STD) {\n        if (lib.c.indexOf(h) >= 0) continue;\n        var fns = JD_C_STD[h].split(' ');\n        for (var q = 0; q < fns.length; q++) {\n          var fn = fns[q];\n          var use = new RegExp('(^|[^\\\\w.>])' + fn + '\\\\s*\\\\(').exec(s);   // gọi hoặc tự khai báo prototype\n          if (!use) continue;\n          if (new RegExp('(^|[^\\\\w])' + fn + '\\\\s*\\\\([^;{}]*\\\\)\\\\s*\\\\{').test(s)) continue;   // tự cài đặt hàm cùng tên → hợp lệ\n          var ui = use.index + use[1].length;\n          return bad(ui, 'dùng «' + fn + '» của <' + h + '> — bài này chỉ cho dùng: ' + (lib.c.join(', ') || '(không thư viện nào)') + '. Muốn dùng hãy tự viết hàm này.');\n        }\n      }\n    }\n  }\n  for (var c = 0; c < (lib.cam || []).length; c++) {\n    var w = lib.cam[c].replace(/^\\./, ''), rx = new RegExp('(^|[^\\\\w])' + w.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\\\$&') + '(?!\\\\w)');\n    var hit = rx.exec(s);\n    if (hit) return bad(hit.index + hit[1].length, 'không được dùng «' + w + '» trong bài này.');\n  }\n  return null;\n}\n/** Python bị giới hạn thư viện → chặn cả import động lúc chạy (exec / __import__ từ chuỗi…). Viết trên CÙNG dòng đầu (số dòng lỗi vẫn đúng). */\nfunction JD_pyHook(lib) {\n  if (!lib || !lib.py) return '';\n  var ok = lib.py.concat(['encodings', 'codecs']);\n  return ';import builtins as __ptB,os as __ptO;__ptOK={' + ok.map(function (x) { return JSON.stringify(x); }).join(',') + '}' +\n    ';__ptL=__ptO.path.dirname(__ptO.__file__);__ptI=__ptB.__import__;' +\n    '__ptB.__import__=lambda n,g=None,l=None,f=(),lv=0,__i=__ptI:__i(n,g,l,f,lv) if (lv or n.partition(\".\")[0] in __ptOK or n.startswith(\"_\") or ' +\n    '__ptS._getframe(1).f_code.co_filename.startswith((__ptL,\"<frozen\"))) else (_ for _ in ()).throw(ImportError(\"Thư viện \\'\"+n+\"\\' không được dùng trong bài này\"))';\n}\n/** Tách dòng \"@@PT ms kb\" khỏi stderr; sửa số dòng lỗi Python (do có 1 dòng chèn thêm) */\nfunction JD_unwrap(lang, err) {\n  err = JD_norm(err);\n  var m = err.match(/\\n?@@PT (\\d+) (\\d+)\\n?/), time = null, mem = null;\n  if (m) { time = Number(m[1]); mem = Number(m[2]); err = err.replace(m[0], ''); }\n  if (lang === 'py') err = err.replace(/(File \"[^\"]*\", line )(\\d+)/g, function (_, a, n) { return a + Math.max(1, Number(n) - 1); });\n  if (lang === 'c') err = err.replace(/prog\\.c:/g, 'main.c:');\n  return { err: err.replace(/\\s+$/, ''), time: time, mem: mem };\n}\nfunction JD_cut(s, n) { s = String(s == null ? '' : s); n = n || JD_MAX_OUT; return s.length > n ? s.substring(0, n) + '\\n…(đã cắt bớt)' : s; }\n\n/* ----------------------------------------------------------------- cấu hình máy chấm */\n\n/** cfg = {p:'wandbox'|'judge0'|'piston', url, key} */\nfunction JD_cfg(c) {\n  c = c || {};\n  var p = String(c.p || 'wandbox').toLowerCase();\n  var url = String(c.url || '').replace(/\\/+$/, '');\n  if (p === 'wandbox' && !url) url = 'https://wandbox.org';\n  if (p === 'judge0' && !url) url = 'https://ce.judge0.com';\n  return { p: p, url: url, key: String(c.key || '') };\n}\nfunction JD_headers(cfg) {\n  var h = {};\n  if (cfg.p === 'judge0' && cfg.key) {\n    if (/rapidapi\\.com/i.test(cfg.url)) { h['X-RapidAPI-Key'] = cfg.key; h['X-RapidAPI-Host'] = cfg.url.replace(/^https?:\\/\\//, '').split('/')[0]; }\n    else h['X-Auth-Token'] = cfg.key;\n  }\n  if (cfg.p === 'piston' && cfg.key) h.Authorization = cfg.key;\n  return h;\n}\nfunction JD_cacheGet(k) { try { var s = CacheService.getScriptCache().get(k); return s ? JSON.parse(s) : null; } catch (e) { return null; } }\nfunction JD_cachePut(k, v, sec) { try { CacheService.getScriptCache().put(k, JSON.stringify(v), sec || 21600); } catch (e) { } }\n\n/** Chọn trình biên dịch / ngôn ngữ của dịch vụ (dò 1 lần, đệm 6 giờ) */\nfunction JD_runtime(cfg, lang) {\n  var key = 'jdrt|' + cfg.p + '|' + cfg.url + '|' + lang, hit = JD_cacheGet(key);\n  if (hit) return hit;\n  var rt = null;\n  if (cfg.p === 'wandbox') {\n    var list = JSON.parse(UrlFetchApp.fetch(cfg.url + '/api/list.json', { muteHttpExceptions: true }).getContentText() || '[]');\n    var want = lang === 'c' ? /^gcc-(\\d+)\\.(\\d+)\\.(\\d+)-c$/ : /^cpython-(\\d+)\\.(\\d+)\\.(\\d+)$/;\n    var best = null, bv = -1;\n    list.forEach(function (x) {\n      var m = String(x.name || '').match(want);\n      if (!m) return;\n      var v = Number(m[1]) * 1e6 + Number(m[2]) * 1e3 + Number(m[3]);\n      if (v > bv) { bv = v; best = x; }\n    });\n    if (!best) throw new Error('Wandbox không có trình biên dịch ' + JD_LANGS[lang]);\n    rt = { name: best.name, ver: String(best.version || best.name) };\n  } else if (cfg.p === 'judge0') {\n    var res = UrlFetchApp.fetch(cfg.url + '/languages', { headers: JD_headers(cfg), muteHttpExceptions: true });\n    if (res.getResponseCode() !== 200) throw new Error('Judge0 trả lỗi ' + res.getResponseCode() + ' khi lấy danh sách ngôn ngữ (kiểm tra url / khoá)');\n    var langs = JSON.parse(res.getContentText() || '[]'), pick = null, pv = -1;\n    langs.forEach(function (x) {\n      var n = String(x.name || ''), m = lang === 'c' ? n.match(/^C \\(GCC (\\d+)\\.(\\d+)/) : n.match(/^Python \\((3)\\.(\\d+)/);\n      if (!m) return;\n      var v = Number(m[1]) * 1000 + Number(m[2]);\n      if (v > pv) { pv = v; pick = x; }\n    });\n    if (!pick) throw new Error('Judge0 không có ' + JD_LANGS[lang]);\n    rt = { id: pick.id, ver: pick.name };\n  } else {\n    rt = { name: lang === 'c' ? 'c' : 'python', ver: '*' };\n  }\n  JD_cachePut(key, rt);\n  return rt;\n}\n\n/* ----------------------------------------------------------------- chạy */\n\n/** Dựng yêu cầu HTTP cho 1 test */\nfunction JD_request(cfg, rt, lang, code, stdin, lim) {\n  var h = JD_headers(cfg);\n  if (cfg.p === 'wandbox') {\n    var body = { compiler: rt.name, code: JD_wrap(lang, code, lim.tl, lim.ml, lim.lib), stdin: stdin || '', save: false };\n    if (lang === 'c') body['compiler-option-raw'] = '-O2\\n-std=gnu11\\n-lm' + (lim.lib ? '\\n-Werror=implicit-function-declaration' : '');\n    return { url: cfg.url + '/api/compile.json', method: 'post', contentType: 'application/json', payload: JSON.stringify(body), headers: h, muteHttpExceptions: true };\n  }\n  if (cfg.p === 'judge0') {\n    var b64 = function (s) { return Utilities.base64Encode(String(s || ''), Utilities.Charset.UTF_8); };\n    var j = { language_id: rt.id, source_code: b64(lang === 'py' && lim.lib && lim.lib.py ? 'import sys as __ptS' + JD_pyHook(lim.lib) + '\\n' + code : code), stdin: b64(stdin), cpu_time_limit: Math.max(0.5, Number(lim.tl) || 2),\n      wall_time_limit: Math.max(2, (Number(lim.tl) || 2) * 3), memory_limit: Math.max(32, Number(lim.ml) || 256) * 1024 };\n    if (lang === 'c') j.compiler_options = '-O2 -lm' + (lim.lib ? ' -Werror=implicit-function-declaration' : '');\n    return { url: cfg.url + '/submissions?base64_encoded=true&wait=true', method: 'post', contentType: 'application/json', payload: JSON.stringify(j), headers: h, muteHttpExceptions: true };\n  }\n  var p = { language: rt.name, version: '*', files: [{ name: lang === 'c' ? 'main.c' : 'main.py', content: JD_wrap(lang, code, lim.tl, lim.ml, lim.lib) }],\n    stdin: stdin || '', compile_timeout: 10000, run_timeout: Math.round((Number(lim.tl) || 2) * 3000), run_memory_limit: -1 };\n  return { url: cfg.url + '/api/v2/execute', method: 'post', contentType: 'application/json', payload: JSON.stringify(p), headers: h, muteHttpExceptions: true };\n}\n\n/** Đọc kết quả HTTP → {kind:'CE'|'RUN'|'IE', out, err, exit, signal, time(ms), mem(KB), raw} */\nfunction JD_parse(cfg, lang, resp, lim) {\n  var code = resp.getResponseCode(), text = resp.getContentText() || '';\n  if (code === 429) return { kind: 'IE', err: 'Máy chấm đang quá tải (429) — thử lại sau vài giây.', busy: true };\n  if (code < 200 || code >= 300) return { kind: 'IE', err: 'Máy chấm trả lỗi HTTP ' + code + ': ' + text.substring(0, 300), busy: code >= 500 };\n  var j; try { j = JSON.parse(text); } catch (e) { return { kind: 'IE', err: 'Máy chấm trả dữ liệu không đọc được: ' + text.substring(0, 200) }; }\n  if (cfg.p === 'wandbox') {\n    var hasRun = j.program_output !== undefined || j.program_error !== undefined || /@@PT/.test(String(j.program_error || ''));\n    var cerr = String(j.compiler_error || '');\n    if (!hasRun && (lang === 'c' && /error/i.test(cerr) || String(j.status) !== '0' && cerr)) return { kind: 'CE', err: cerr.replace(/prog\\.c:/g, 'main.c:') };\n    var u = JD_unwrap(lang, j.program_error || '');\n    return { kind: 'RUN', out: String(j.program_output || ''), err: u.err, exit: Number(j.status || 0), signal: String(j.signal || ''), time: u.time, mem: u.mem };\n  }\n  if (cfg.p === 'judge0') {\n    var d = function (s) { try { return s ? Utilities.newBlob(Utilities.base64Decode(String(s).replace(/\\s/g, ''))).getDataAsString('UTF-8') : ''; } catch (e) { return String(s || ''); } };\n    var sid = j.status ? Number(j.status.id) : 0;\n    if (sid === 6) return { kind: 'CE', err: d(j.compile_output) };\n    if (sid === 13 || sid === 14 || sid === 1 || sid === 2) return { kind: 'IE', err: 'Judge0: ' + (j.status && j.status.description || 'lỗi') + ' ' + d(j.message) };\n    var e0 = d(j.stderr); if (lang === 'py' && lim && lim.lib && lim.lib.py) e0 = e0.replace(/(File \"[^\"]*\", line )(\\d+)/g, function (_, a, n) { return a + Math.max(1, Number(n) - 1); });\n    return { kind: 'RUN', out: d(j.stdout), err: e0, exit: sid === 3 || sid === 4 ? 0 : (j.exit_code == null ? 1 : Number(j.exit_code)),\n      signal: sid === 5 ? 'TLE' : (sid >= 7 && sid <= 12 ? String(j.status.description || 'RE') : ''), time: j.time == null ? null : Math.round(Number(j.time) * 1000), mem: j.memory == null ? null : Number(j.memory) };\n  }\n  if (j.compile && Number(j.compile.code) !== 0 && j.compile.code != null) return { kind: 'CE', err: String(j.compile.stderr || j.compile.output || '') };\n  var r = j.run || {}, w = JD_unwrap(lang, r.stderr || '');\n  if (!j.run && j.message) return { kind: 'IE', err: 'Piston: ' + j.message };\n  return { kind: 'RUN', out: String(r.stdout || ''), err: w.err, exit: Number(r.code == null ? 0 : r.code), signal: String(r.signal || ''), time: w.time, mem: w.mem };\n}\n\n/** Số test gửi cùng lúc tới mỗi loại máy chấm */\nvar JD_BATCH = { wandbox: 3, piston: 4, judge0: 6 };\n/** Lỗi do HẠ TẦNG máy chấm (không phải do code thí sinh) → chạy lại, không tính là \"Lỗi khi chạy\" */\nfunction JD_infraErr(r) {\n  if (!r) return true;\n  if (r.kind === 'IE') return !!r.busy;\n  if (r.kind !== 'RUN' || r.out) return false;\n  return /OCI runtime|crun:|runc:|clone:|Resource temporarily unavailable|cannot fork|fork: retry|failed to create (task|shim|container)|container .*(not running|failed)|Too many open files/i.test(String(r.err || ''));\n}\n\n/**\n * Chạy code trên nhiều test.\n * tests: [{in, out?}]  — out bỏ trống = chỉ chạy (không so sánh)\n * lim: {tl giây, ml MB, cmp, eps}\n * → {ok, rt, results:[{v, out, err, time, mem, msg}], ce?: thông báo biên dịch}\n */\nfunction JD_run(cfgIn, lang, code, tests, lim) {\n  lang = lang === 'c' ? 'c' : 'py';\n  lim = lim || {};\n  var cfg = JD_cfg(cfgIn);\n  if (!String(code || '').trim()) throw new Error('Chưa có code');\n  if (String(code).length > JD_MAX_CODE) throw new Error('Code dài quá ' + JD_MAX_CODE + ' ký tự');\n  // vi phạm quy định thư viện / hàm cấm → báo ngay, không gửi máy chấm\n  var lv = JD_libCheck(lang, code, lim.lib);\n  if (lv) return { ok: true, rt: '', lib: lv.msg, ce: lv.msg, busy: false, results: tests.map(function () { return { v: 'CE', err: lv.msg }; }) };\n  var rt = JD_runtime(cfg, lang);\n  // Gửi theo từng đợt nhỏ (máy chấm miễn phí như Wandbox từ chối khi nhận quá nhiều lượt cùng lúc:\n  // \"OCI runtime error: crun: clone: Resource temporarily unavailable\"), lỗi hạ tầng của máy chấm thì tự chạy lại test đó.\n  var batch = JD_BATCH[cfg.p] || 4, parsed = new Array(tests.length), todo = tests.map(function (_, i) { return i; });\n  for (var round = 0; round < 3 && todo.length; round++) {\n    if (round) Utilities.sleep(700 * round + Math.floor(Math.random() * 400));\n    var size = round ? Math.max(1, Math.floor(batch / 2)) : batch, again = [];\n    for (var s = 0; s < todo.length; s += size) {\n      var part = todo.slice(s, s + size), resps;\n      try { resps = UrlFetchApp.fetchAll(part.map(function (i) { return JD_request(cfg, rt, lang, code, tests[i].in, lim); })); }\n      catch (e) { if (round === 2) throw new Error('Không gọi được máy chấm (' + cfg.p + '): ' + (e.message || e)); again = again.concat(part); continue; }\n      resps.forEach(function (resp, k) {\n        var r = JD_parse(cfg, lang, resp, lim), i = part[k];\n        if (JD_infraErr(r)) { again.push(i); r = { kind: 'IE', err: 'Máy chấm ' + cfg.p + ' tạm thời quá tải: ' + JD_cut(r.err || '', 300), busy: true }; }\n        parsed[i] = r;\n      });\n    }\n    todo = again;\n  }\n  var tl = (Number(lim.tl) || 2) * 1000, mlKb = (Number(lim.ml) || 256) * 1024, ce = null, busy = false;\n  var results = tests.map(function (t, i) {\n    var r = parsed[i];\n    if (r.busy) busy = true;\n    if (r.kind === 'CE') { ce = ce || r.err; return { v: 'CE', err: JD_cut(r.err, 8000) }; }\n    if (r.kind === 'IE') return { v: 'IE', err: r.err };\n    var v;\n    // Python: lỗi cú pháp coi như lỗi biên dịch (giống các hệ thống chấm phổ biến)\n    if (lang === 'py' && !r.out && /^(\\s*File[^\\n]*\\n)?[\\s\\S]*?(SyntaxError|IndentationError|TabError)/.test(r.err) && r.exit !== 0) { ce = ce || r.err; return { v: 'CE', err: JD_cut(r.err, 8000) }; }\n    if (/TLE|CPU time|Alarm|SIGXCPU|SIGALRM|time limit/i.test(r.signal) || (r.time != null && r.time > tl)) v = 'TLE';\n    else if (r.mem != null && r.mem > mlKb) v = 'MLE';\n    else if (/Killed|SIGKILL/i.test(r.signal) && r.mem != null && r.mem > mlKb * 0.9) v = 'MLE';\n    else if (r.exit !== 0 || r.signal) v = /MemoryError|bad_alloc|Cannot allocate/i.test(r.err) ? 'MLE' : 'RE';\n    else if (t.out === undefined || t.out === null) v = 'OK';\n    else v = JD_compare(t.out, r.out, lim.cmp, lim.eps) ? 'AC' : 'WA';\n    return { v: v, out: JD_cut(r.out), err: JD_cut(r.err, 8000), time: r.time, mem: r.mem, signal: r.signal || '' };\n  });\n  return { ok: true, rt: rt.ver, results: results, ce: ce ? JD_cut(ce, 8000) : null, busy: busy };\n}\n\n/** Điểm 1 bài từ kết quả: cham = 'TUNG_TEST' (theo trọng số test) | 'TAT_CA' (đúng hết mới có điểm) */\nfunction JD_score(results, weights, diem, cham) {\n  var tot = 0, got = 0, all = true;\n  results.forEach(function (r, i) {\n    var w = Number(weights[i]); if (!(w >= 0)) w = 1;\n    tot += w;\n    if (r.v === 'AC') got += w; else all = false;\n  });\n  var max = Number(diem) || 0;\n  if (String(cham || '').toUpperCase() === 'TAT_CA') return all && results.length ? max : 0;\n  return tot > 0 ? Math.round(max * got / tot * 100) / 100 : (all && results.length ? max : 0);\n}\n\n/* ----------------------------------------------------------------- phát hiện code giống nhau */\n\n/** Chuẩn hoá code: bỏ chú thích, chuỗi → S, số → N, tên biến → V (giữ từ khoá) → dãy token */\nfunction JD_fingerprint(code, lang) {\n  var kw = lang === 'c'\n    ? 'int long short char float double void unsigned signed if else for while do return break continue switch case default struct typedef sizeof const static include define printf scanf malloc free'\n    : 'def return if elif else for while in and or not is import from as class try except finally with lambda yield pass break continue print input range len int str float list dict set True False None';\n  var K = {}; kw.split(' ').forEach(function (w) { K[w] = 1; });\n  var s = String(code || '').replace(/\\/\\*[\\s\\S]*?\\*\\//g, ' ').replace(/\\/\\/[^\\n]*/g, ' ');\n  if (lang !== 'c') s = s.replace(/#[^\\n]*/g, ' ');\n  s = s.replace(/\"(?:\\\\.|[^\"\\\\])*\"|'(?:\\\\.|[^'\\\\])*'/g, ' S ');\n  var toks = s.match(/[A-Za-z_]\\w*|\\d+(?:\\.\\d+)?|==|!=|<=|>=|\\+\\+|--|&&|\\|\\||[^\\s\\w]/g) || [];\n  return toks.map(function (t) { return /^\\d/.test(t) ? 'N' : /^[A-Za-z_]/.test(t) ? (K[t] ? t : 'V') : t; });\n}\n/** Độ giống (0..1) giữa 2 code: Jaccard của các dãy 5 token liên tiếp */\nfunction JD_similar(a, b, lang) {\n  var g = function (toks) { var m = {}; for (var i = 0; i + 5 <= toks.length; i++) m[toks.slice(i, i + 5).join(' ')] = 1; return m; };\n  var A = g(JD_fingerprint(a, lang)), B = g(JD_fingerprint(b, lang));\n  var ka = Object.keys(A), kb = Object.keys(B);\n  if (ka.length < 8 || kb.length < 8) return 0;\n  var inter = 0; ka.forEach(function (k) { if (B[k]) inter++; });\n  return inter / (ka.length + kb.length - inter);\n}\n\n/**\n * PhongThi_Core.js — MÃ LÕI PHÒNG THI (KHÔNG dán tay).\n * Hệ thống Trung tâm đóng gói tệp này + ThiSinh.html và tự đẩy sang file PhongThi_DuLieu (sheet \"MaNguon\").\n * Bộ khởi động PhongThi.gs (dán 1 lần) nạp & chạy mã này → mọi lần cập nhật sau không phải triển khai lại.\n * Được chạy bằng new Function('HTML_', mã) — HTML_() trả về giao diện thí sinh.\n *\n * Bảo mật: dự án phòng thi KHÔNG chứa ngân hàng câu hỏi hay đáp án; chỉ 2 hàm công khai (doGet, PT_api) nằm ở bộ khởi động.\n * Tải: mỗi thí sinh ~1 lượt gọi / 12–30 giây, dãn cách ngẫu nhiên; ghi bài bằng appendRow (nguyên tử), không khoá toàn cục.\n */\n\nvar PT_VERSION = '1.7.9';\nvar PT_GRACE_SAVE_ = 90 * 1000;          // còn nhận bản tự lưu 90 giây sau hết giờ\nvar PT_GRACE_SUBMIT_ = 5 * 60 * 1000;    // còn nhận nộp bài 5 phút sau hết giờ (mạng chậm) — đánh dấu nộp trễ nếu > 30 giây\nvar PT_LATE_MS_ = 30 * 1000;\nvar PT_SERIOUS_ = ['ROI_TAB', 'ROI_CUA_SO', 'THOAT_TOAN_MAN', 'MAN_HINH_PHU', 'CUA_SO_NHO', 'CHUP_MAN_HINH'];\n/** Chế độ nghiêm ngặt (thi bằng link, không SEB): 1 lần rời màn hình = khoá ngay, mở bằng mã giám thị tại máy */\n/* THI THỬ CỦA GIÁM THỊ: 1 dòng thí sinh ảo SBD \"GV-THU\" (trang quản trị tạo, kèm khoá bí mật dùng 1 lần trong link, hạn 12 giờ).\n   Vào được cả khi phòng chưa mở / đã đóng, không bị hẹn đóng, không tính vào kết quả / giám sát. GhiChu = \"THU|<hạn>|<chống gian lận 1/0>|<mã đề,…>\" */\nvar THU_SBD_ = 'GV-THU';\nfunction isThu_(st) { return !!st && up_(st.SBD) === THU_SBD_ && /^THU\\|/.test(str_(st.GhiChu)); }\nfunction thuInfo_(st) {\n  var p = str_(st.GhiChu).split('|');\n  return { exp: num_(p[1]), guard: p[2] === '1', des: (p[3] || '').split(',').filter(function (x) { return !!x; }) };\n}\nfunction strict_(ex, st) { return up_(ex.NghiemNgat) === 'CO' && up_(st.SEB) !== 'CO'; }\nfunction maxVp_(ex, st) { return strict_(ex, st) ? 1 : num_(ex.ViPhamToiDa); }\n\nvar RSH_ = { KY_THI: 'KyThi', THI_SINH: 'ThiSinh', GOI_DE: 'GoiDe', BAI_LAM: 'BaiLam', NHAT_KY: 'NhatKy', LT_TEST: 'LT_Test', LT_NOP: 'LT_Nop' };\n/** Phải khớp RHEADERS bên Hệ thống Trung tâm (18_Core_Package.gs) */\nvar RHEADERS_ = {\n  KyThi: ['MaKyThi', 'TenKyThi', 'DonVi', 'MaMon', 'TrangThai', 'ThoiGianPhut', 'TinhGio', 'MoLuc', 'DongLuc', 'HenDong',\n    'MaPhong', 'BatBuocSEB', 'KhoaUA', 'DangNhapLai', 'ViPhamToiDa', 'ThongBao', 'HuongDan', 'PhienBanGoi', 'SoCau', 'TongDiem',\n    'ThoatURL', 'SebXml', 'CapNhat', 'SebKeyChuan', 'SebXml2', 'SebXml3', 'SebXml4', 'HenCung', 'ClbTen', 'ClbKhau', 'ClbLogo', 'ClbMau', 'NghiemNgat', 'MaMoKhoa', 'LapTrinh', 'TinHieu', 'ChongAI'],\n  ThiSinh: ['MaKyThi', 'SBD', 'HoTen', 'Lop', 'MaDe', 'MaTruyCap',\n    'TrangThai', 'Token', 'BatDau', 'SoLanVao', 'TrinhDuyet', 'SEB', 'NopLuc', 'LanCuoi', 'DaLam', 'ViPham', 'ViPhamMoc', 'LenhDaXuLy', 'SebKey', 'SebVer', 'ManHinh', 'LtDiem', 'NghiTD', 'NghiMuc', 'NghiLyDo',\n    'ThemPhut', 'Lenh', 'LenhGiaTri', 'LenhId', 'GhiChu', 'CamThi', 'LyDoCam', 'DungLuc', 'DungMs', 'VuotHen'],\n  GoiDe: ['MaKyThi', 'MaDe', 'PhienBan', 'Manh', 'DuLieu'],\n  BaiLam: ['ThoiGian', 'MaKyThi', 'SBD', 'MaDe', 'Loai', 'Seq', 'SoCauDaLam', 'TraLoi', 'MaXacNhan', 'TraLoi2'],\n  LT_Test: ['MaKyThi', 'MaBai', 'STT', 'Input', 'Output', 'Mau', 'Diem'],\n  LT_Nop: ['ThoiGian', 'MaKyThi', 'SBD', 'MaBai', 'NgonNgu', 'Loai', 'Code', 'KetQua', 'Diem', 'DiemToiDa'],\n  NhatKy: ['ThoiGian', 'MaKyThi', 'SBD', 'SuKien', 'ChiTiet']\n};\n\n/* ============================================================ CỔNG VÀO */\n\nfunction doGet(e) {\n  var p = (e && e.parameter) || {};\n  if (p.seb) return sebFile_(String(p.seb));\n  if (p.p === 'thoat') {\n    return HtmlService.createHtmlOutput('<div style=\"font:16px system-ui,sans-serif;padding:48px;text-align:center;color:#234\">' +\n      '<h2>Đã kết thúc bài thi</h2><p>Bạn có thể rời khỏi máy.</p></div>').setTitle('Kết thúc bài thi');\n  }\n  // nhúng sẵn tên / khẩu hiệu / logo CLB vào trang → hiện ngay khi trang mở, không phải chờ gọi máy chủ lần nữa\n  var html = HTML_(), b = null, title = 'Phòng thi trực tuyến';\n  try { b = info_().brand; } catch (x) { b = null; }\n  if (b) {\n    var inj = '<script>window.PT_BRAND=' + JSON.stringify(b).replace(/</g, '\\\\u003c') + ';</script>\\n<script>\\n\\'use strict\\';';\n    html = html.replace('<script>\\n\\'use strict\\';', function () { return inj; });\n    if (b.ten) title = b.ten + ' — Phòng thi';\n  }\n  return HtmlService.createHtmlOutput(html).setTitle(title)\n    .addMetaTag('viewport', 'width=device-width, initial-scale=1');\n}\n\n/** Cổng API duy nhất cho trang thí sinh */\nfunction PT_api(name, args) {\n  try {\n    var fn = ROUTES_[name];\n    if (!fn) throw err_('BAD', 'Yêu cầu không hợp lệ');\n    var data = fn.apply(null, args || []);\n    return JSON.stringify({ ok: true, data: data === undefined ? null : data });\n  } catch (e) {\n    var msg = (e && e.message) ? e.message : String(e);\n    // lỗi tạm thời của Google (quá tải, hết thời gian, lỗi dịch vụ) → \"BUSY\" để máy thí sinh tự thử lại, không làm phiền thí sinh\n    var code = (e && e.code) || (/too many|quá nhiều|Service invoked|simultaneous|timed out|timeout|hết thời gian|Service error|Internal error|lỗi máy chủ|try again|thử lại|Lock|unavailable|Rate Limit|backend error/i.test(msg) ? 'BUSY' : 'ERR');\n    return JSON.stringify({ ok: false, code: code, error: code === 'BUSY' ? 'Máy chủ đang bận, hệ thống tự thử lại…' : msg });\n  }\n}\n\nvar ROUTES_ = {\n  info: function () { return info_(); },\n  login: function (sbd, code, room, client) { return login_(sbd, code, room, client || {}); },\n  wait: function (tok, ky, sbd) { return wait_(tok, ky, sbd); },\n  start: function (tok, ky, sbd) { return start_(tok, ky, sbd); },\n  save: function (tok, ky, sbd, p) { return save_(tok, ky, sbd, p || {}); },\n  poll: function (ky, sbd) { return poll_(ky, sbd); },\n  submit: function (tok, ky, sbd, p) { return submit_(tok, ky, sbd, p || {}); },\n  ask: function (tok, ky, sbd, text) { return ask_(tok, ky, sbd, text); },\n  resume: function (tok, ky, sbd) { return resume_(tok, ky, sbd); },\n  unlock: function (tok, ky, sbd, code, p) { return unlock_(tok, ky, sbd, code, p || {}); },\n  runCode: function (tok, ky, sbd, p) { return runCode_(tok, ky, sbd, p || {}); },\n  submitCode: function (tok, ky, sbd, p) { return submitCode_(tok, ky, sbd, p || {}); },\n  thuLogin: function (key, client) { return thuLogin_(key, client || {}); },\n  thuCtl: function (tok, ky, sbd, act, arg) { return thuCtl_(tok, ky, sbd, act, arg); }\n};\n\n/* ============================================================ TIỆN ÍCH */\n\nfunction err_(code, msg) { var e = new Error(msg); e.code = code; return e; }\nfunction str_(v) { return v === null || v === undefined ? '' : (v instanceof Date ? String(v.getTime()) : String(v).trim()); }\nfunction up_(v) { return str_(v).toUpperCase(); }\nfunction num_(v, d) { var n = Number(str_(v).replace(',', '.')); return str_(v) === '' || isNaN(n) ? (d === undefined ? 0 : d) : n; }\nfunction ss_() { return SpreadsheetApp.getActiveSpreadsheet(); }\nfunction cache_() { return CacheService.getScriptCache(); }\nfunction hash_(s) {\n  var h = 0x811c9dc5; s = String(s);\n  for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193); }\n  return h >>> 0;\n}\nfunction receipt_(s) { var h = ('00000000' + hash_(s).toString(16).toUpperCase()).slice(-8); return h.slice(0, 4) + '-' + h.slice(4); }\n\nvar _HEAD_ = {};\nfunction head_(sh) {\n  var n = sh.getName();\n  if (!_HEAD_[n]) _HEAD_[n] = sh.getRange(1, 1, 1, Math.max(1, sh.getLastColumn())).getValues()[0].map(str_);\n  return _HEAD_[n];\n}\nfunction sheet_(name) {\n  var sh = ss_().getSheetByName(name);\n  if (!sh) throw err_('SETUP', 'Phòng thi chưa được cài đặt (thiếu sheet ' + name + '). Báo giám thị.');\n  return sh;\n}\nfunction readAll_(name) {\n  var sh = sheet_(name), last = sh.getLastRow();\n  if (last < 2) return [];\n  var h = head_(sh), v = sh.getRange(2, 1, last - 1, h.length).getValues(), out = [];\n  for (var i = 0; i < v.length; i++) {\n    var o = { __row: i + 2 }, any = false;\n    for (var j = 0; j < h.length; j++) { if (h[j]) { o[h[j]] = v[i][j]; if (v[i][j] !== '' && v[i][j] !== null) any = true; } }\n    if (any) out.push(o);\n  }\n  return out;\n}\nfunction readRow_(sh, row) {\n  var h = head_(sh), v = sh.getRange(row, 1, 1, h.length).getValues()[0], o = { __row: row };\n  for (var j = 0; j < h.length; j++) if (h[j]) o[h[j]] = v[j];\n  return o;\n}\n/** Ghi các cột trong patch, gom cột liền nhau thành ít lần ghi nhất */\nfunction writeCols_(sh, row, patch) {\n  var h = head_(sh), idx = Object.keys(patch).map(function (k) { return h.indexOf(k); }).filter(function (i) { return i >= 0; }).sort(function (a, b) { return a - b; });\n  var i = 0;\n  while (i < idx.length) {\n    var j = i;\n    while (j + 1 < idx.length && idx[j + 1] === idx[j] + 1) j++;\n    var vals = [];\n    for (var k = idx[i]; k <= idx[j]; k++) { var v = patch[h[k]]; vals.push(v === undefined || v === null ? '' : String(v)); }\n    sh.getRange(row, idx[i] + 1, 1, vals.length).setValues([vals]);\n    i = j + 1;\n  }\n}\nfunction append_(name, obj) {\n  var sh = sheet_(name), h = head_(sh);\n  sh.appendRow(h.map(function (k) { var v = obj[k]; return v === undefined || v === null ? '' : String(v); }));\n}\nfunction safeCell_(s) { s = String(s == null ? '' : s); return /^[=+\\-@]/.test(s) ? ' ' + s : s; }   // chặn Sheets hiểu nhầm thành công thức\nfunction log_(ky, sbd, k, d) { try { append_(RSH_.NHAT_KY, { ThoiGian: Date.now(), MaKyThi: ky, SBD: sbd, SuKien: k, ChiTiet: safeCell_(d || '') }); } catch (e) { } }\n\n/** Dòng kỳ thi (đệm 10 giây để mở/đóng thi lan tới thí sinh nhanh mà vẫn nhẹ máy chủ) */\nfunction exam_(ky) {\n  var c = cache_(), key = 'ex|' + ky, s = c.get(key);\n  if (s) return JSON.parse(s);\n  var r = readAll_(RSH_.KY_THI).filter(function (x) { return str_(x.MaKyThi) === ky; })[0];\n  if (!r) throw err_('NO_EXAM', 'Kỳ thi không còn trên phòng thi');\n  var o = {};\n  Object.keys(r).forEach(function (k) { if (!/^SebXml/.test(k) && k !== '__row') o[k] = str_(r[k]); });\n  c.put(key, JSON.stringify(o), 5);\n  return o;\n}\n\n/**\n * TÍN HIỆU NHANH: máy thí sinh hỏi mỗi 6–20 giây \"giám thị có lệnh mới cho em không?\" — chỉ đọc dòng kỳ thi đã đệm 5 giây\n * (không mở sheet thí sinh, không khoá) → có lệnh thì máy thí sinh đồng bộ ngay, không phải chờ nhịp lưu bài 20–30 giây.\n * TinHieu = \"<mốc>|<SBD,SBD,…>\" hoặc \"<mốc>|*\" (cả phòng). Không trả danh sách SBD về máy thí sinh.\n */\nfunction poll_(ky, sbd) {\n  ky = str_(ky); sbd = up_(sbd);\n  var e = exam_(ky), s = str_(e.TinHieu), i = s.indexOf('|'), v = i > 0 ? s.substring(0, i) : s, who = i > 0 ? s.substring(i + 1) : '';\n  var n = 40; try { var m = cache_().get('rows|' + ky); if (m) n = Object.keys(JSON.parse(m)).length; } catch (x) { }\n  return { v: v, me: !!v && (who === '*' || (',' + who + ',').indexOf(',' + sbd + ',') >= 0), iv: Math.min(20, Math.max(6, Math.round(n / 6))), tt: str_(e.TrangThai) };\n}\n\n/** Tìm dòng thí sinh (bảng SBD → số dòng đệm 10 phút, luôn kiểm tra lại) */\nfunction findRow_(ky, sbd) {\n  var sh = sheet_(RSH_.THI_SINH), c = cache_(), key = 'rows|' + ky, map = null, s = c.get(key);\n  if (s) map = JSON.parse(s);\n  if (map && map[sbd]) {\n    var r = readRow_(sh, map[sbd]);\n    if (str_(r.MaKyThi) === ky && up_(r.SBD) === sbd) return r;\n  }\n  map = {};\n  var hit = null;\n  readAll_(RSH_.THI_SINH).forEach(function (x) {\n    if (str_(x.MaKyThi) !== ky) return;\n    map[up_(x.SBD)] = x.__row;\n    if (up_(x.SBD) === sbd) hit = x;\n  });\n  try { c.put(key, JSON.stringify(map), 600); } catch (e) { }\n  return hit;\n}\n\n/** Thời gian đã tạm dừng (ms) của thí sinh — giờ thi được bù đúng bằng thời gian này */\nfunction pausedMs_(st, now) { return num_(st.DungMs) + (num_(st.DungLuc) ? Math.max(0, (now || Date.now()) - num_(st.DungLuc)) : 0); }\nfunction deadline_(ex, st) {\n  var dur = (num_(ex.ThoiGianPhut) + num_(st.ThemPhut)) * 60000;\n  if (isThu_(st)) return dur > 0 && num_(st.BatDau) ? num_(st.BatDau) + dur + pausedMs_(st) : 0;   // thi thử: giờ riêng, không theo hẹn đóng / đóng phòng\n  // Tính giờ CHUNG: cả phòng tính từ lúc mở; riêng em được \"làm lại\" SAU lúc mở phòng thì tính từ lúc em bắt đầu lượt mới\n  var chung = up_(ex.TinhGio) === 'CHUNG', ra = resetAt_(st);\n  var base = chung && !(ra > num_(ex.MoLuc)) ? num_(ex.MoLuc) : num_(st.BatDau);\n  var d = dur > 0 && base ? base + dur + pausedMs_(st) : 0;\n  var cap = [];\n  // Hẹn đóng (mốc chung) + phần vượt riêng của em; HenCung=CO: mọi em kết thúc đúng mốc\n  if (num_(ex.HenDong)) {\n    var capH = num_(ex.HenDong) + num_(st.VuotHen) * 60000;\n    if (up_(ex.HenCung) === 'CO') d = capH; else cap.push(capH);\n  }\n  if (up_(ex.TrangThai) === 'DONG' && num_(ex.DongLuc)) cap.push(num_(ex.DongLuc));\n  cap.forEach(function (x) { d = d ? Math.min(d, x) : x; });\n  return d; // 0 = không giới hạn\n}\n\n/** Phiên hợp lệ? trả {ex, st, sh} */\nfunction session_(tok, ky, sbd) {\n  ky = str_(ky); sbd = up_(sbd);\n  var st = findRow_(ky, sbd);\n  if (!st) throw err_('NO_STUDENT', 'Không tìm thấy thí sinh');\n  if (up_(st.CamThi) === 'CO') throw err_('BANNED', banMsg_(st));\n  if (!tok || str_(st.Token) !== str_(tok)) {\n    if (!str_(st.Token) && resetAt_(st)) throw err_('RESET', 'Giám thị đã cho làm lại bài thi từ đầu. Bài cũ đã được huỷ.');\n    throw err_('REPLACED', 'Phiên làm bài này đã được mở ở máy/cửa sổ khác. Báo giám thị nếu không phải bạn.');\n  }\n  if (isThu_(st) && thuInfo_(st).exp < Date.now()) throw err_('THU_HET', 'Link thi thử đã hết hạn. Tạo link mới ở trang quản trị › ⑤ › Thi thử.');\n  return { ex: exam_(ky), st: st, sh: sheet_(RSH_.THI_SINH), ky: ky, sbd: sbd, thu: isThu_(st) };\n}\n\nfunction msgOf_(ex) { return str_(ex.ThongBao); }\nfunction banMsg_(st) { return 'Bạn đã bị ĐÌNH CHỈ THI' + (str_(st.LyDoCam) ? ': ' + str_(st.LyDoCam) : '') + '. Hãy làm theo hướng dẫn của giám thị.'; }\n/** Mốc \"cho làm lại\" gần nhất (GhiChu = RESET:<ms>) — dùng làm mã lượt thi */\nfunction resetAt_(st) { var m = str_(st.GhiChu).match(/^RESET:(\\d+)/); return m ? Number(m[1]) : 0; }\nfunction payload_(st, ex, tok, isSeb) {\n  return {\n    tok: tok, ky: str_(st.MaKyThi), sbd: up_(st.SBD), hoTen: str_(st.HoTen), lop: str_(st.Lop), maDe: str_(st.MaDe), now: Date.now(), seb: isSeb,\n    att: String(resetAt_(st)),\n    brand: brand_(ex),\n    exam: { ten: str_(ex.TenKyThi), donVi: str_(ex.DonVi), thoiGian: num_(ex.ThoiGianPhut), soCau: num_(ex.SoCau), tongDiem: num_(ex.TongDiem),\n      huongDan: str_(ex.HuongDan), mo: up_(ex.TrangThai) === 'MO', tinhGio: up_(ex.TinhGio) || 'RIENG', viPhamToiDa: num_(ex.ViPhamToiDa), nghiemNgat: up_(ex.NghiemNgat) === 'CO',\n      thongBao: msgOf_(ex), started: num_(st.BatDau) > 0 },\n    thu: isThu_(st) ? (function (i) { return { exp: i.exp, guard: i.guard, des: i.des, mo: up_(ex.TrangThai) }; })(thuInfo_(st)) : null\n  };\n}\n/** Tải lại trang (F5 / nút tải lại của SEB): vào tiếp bằng phiên cũ, không cần đăng nhập lại */\nfunction resume_(tok, ky, sbd) {\n  ky = str_(ky); sbd = up_(sbd);\n  var c = cache_(), pk = 'ptok|' + ky + '|' + sbd;\n  var st0 = findRow_(ky, sbd);\n  // lần tải lại trước đã cấp phiên mới nhưng phản hồi bị mất (mạng chập chờn) → vẫn nhận phiên cũ trong 2 phút\n  if (st0 && str_(tok) && str_(st0.Token) && str_(st0.Token) !== str_(tok) && c.get(pk) === str_(tok)) tok = str_(st0.Token);\n  var s = session_(tok, ky, sbd);\n  if (up_(s.st.TrangThai) === 'DA_NOP' && !s.thu) throw err_('DONE', 'Bạn đã nộp bài.');\n  if (up_(s.ex.TrangThai) === 'DONG' && !num_(s.st.BatDau) && !s.thu) throw err_('CLOSED', 'Kỳ thi đã kết thúc.');\n  // cấp phiên mới: nếu đường link bị mở ở tab/máy khác thì tab cũ bị thay thế (không thể 2 nơi cùng ghi bài)\n  var nt = Utilities.getUuid();\n  writeCols_(s.sh, s.st.__row, { LanCuoi: Date.now(), Token: nt });\n  try { c.put(pk, str_(tok), 120); } catch (e) { }\n  if (!s.thu) log_(s.ky, s.sbd, 'TAI_LAI', 'pt v' + PT_VERSION + ' · Tải lại trang');\n  var pl = payload_(s.st, s.ex, nt, up_(s.st.SEB) === 'CO');\n  if (s.thu) { pl.exam.mo = true; pl.thu.done = up_(s.st.TrangThai) === 'DA_NOP'; }\n  return pl;\n}\n\n/* ============================================================ API */\n\nfunction info_() {\n  var list = readAll_(RSH_.KY_THI).filter(function (r) { return up_(r.TrangThai) !== 'DONG'; })\n    .map(function (r) { return { ten: str_(r.TenKyThi), donVi: str_(r.DonVi), mo: up_(r.TrangThai) === 'MO', maPhong: !!str_(r.MaPhong) }; });\n  // nhận diện CLB: lấy từ kỳ thi đang mở (hoặc kỳ thi đầu tiên chưa đóng / bất kỳ)\n  var all = readAll_(RSH_.KY_THI), src = all.filter(function (r) { return up_(r.TrangThai) === 'MO'; })[0] || all.filter(function (r) { return up_(r.TrangThai) !== 'DONG'; })[0] || all[0];\n  return { now: Date.now(), exams: list, v: PT_VERSION, brand: brand_(src) };\n}\nfunction brand_(r) {\n  if (!r) return null;\n  var logo = str_(r.ClbLogo).replace(/^~|~$/g, '');\n  return { ten: str_(r.ClbTen), khau: str_(r.ClbKhau), mau: /^#[0-9a-fA-F]{6}$/.test(str_(r.ClbMau)) ? str_(r.ClbMau) : '', logo: /^data:image\\//.test(logo) || /^https:\\/\\//.test(logo) ? logo : '' };\n}\n\nfunction login_(sbd, code, room, client) {\n  sbd = up_(sbd).replace(/\\s+/g, ''); code = up_(code).replace(/\\s+/g, '');\n  if (!sbd || !code) throw err_('INPUT', 'Nhập Số báo danh và Mã truy cập');\n  var c = cache_(), failKey = 'fail|' + sbd, f = null;\n  try { f = JSON.parse(c.get(failKey) || 'null'); } catch (e) { }\n  f = f && typeof f === 'object' ? f : { n: 0, t: Date.now() };\n  var openEx = {};\n  readAll_(RSH_.KY_THI).forEach(function (r) { if (up_(r.TrangThai) !== 'DONG') openEx[str_(r.MaKyThi)] = true; });\n  var mine = readAll_(RSH_.THI_SINH).filter(function (x) { return up_(x.SBD) === sbd && openEx[str_(x.MaKyThi)] && !isThu_(x); });   // tài khoản thi thử chỉ vào bằng link\n  // Giám thị thao tác với thí sinh này (↺ Cho vào lại, ▶ Cho làm tiếp, ♻ Làm lại, gỡ đình chỉ, nhắn tin…) → bỏ khoá \"nhập sai mã\".\n  // So sánh MỐC bằng giá trị (mốc làm lại + mã lệnh giám thị), không so giờ giữa 2 máy chủ → luôn chính xác.\n  var resetAt = 0;\n  mine.forEach(function (x) { var m = str_(x.GhiChu).match(/^RESET:(\\d+)/); if (m) resetAt = Math.max(resetAt, Number(m[1])); });\n  var mark = String(resetAt) + '|' + mine.map(function (x) { return str_(x.LenhId); }).sort().join(',');\n  if (f.n && String(f.r == null ? '' : f.r) !== mark) { f = { n: 0, t: Date.now(), r: mark }; c.remove(failKey); }\n  if (f.n >= 8) {\n    if (mine[0]) log_(str_(mine[0].MaKyThi), sbd, 'DANG_NHAP_SAI', 'Bị chặn do nhập sai mã nhiều lần');\n    throw err_('LOCKED', 'Nhập sai mã quá nhiều lần. Báo giám thị bấm ↺ Cho vào lại (giữ nguyên bài) để mở ngay, hoặc chờ 10 phút.');\n  }\n  var st = mine.filter(function (x) { return up_(x.MaTruyCap) === code; })[0];\n  if (!st) {\n    c.put(failKey, JSON.stringify({ n: f.n + 1, t: f.n ? f.t : Date.now(), r: mark }), 600);\n    if (mine[0]) log_(str_(mine[0].MaKyThi), sbd, 'DANG_NHAP_SAI', 'Sai mã truy cập (nhập \"' + code.substring(0, 12) + '\") · lần ' + (f.n + 1) + '/8');\n    throw err_('BAD_LOGIN', mine.length ? 'Mã truy cập không đúng. Nếu giám thị vừa cấp mã mới, hãy dùng mã mới (hỏi giám thị). Còn ' + Math.max(0, 7 - f.n) + ' lần thử.'\n      : 'Không tìm thấy Số báo danh trong kỳ thi đang mở (kỳ thi có thể đã đóng — báo giám thị).');\n  }\n  var ky = str_(st.MaKyThi), ex = exam_(ky);\n  if (up_(st.CamThi) === 'CO') { log_(ky, sbd, 'DANG_NHAP_SAI', 'Đang bị đình chỉ thi'); throw err_('BANNED', banMsg_(st)); }\n  if (str_(ex.MaPhong) && up_(room).replace(/\\s+/g, '') !== up_(ex.MaPhong)) { log_(ky, sbd, 'DANG_NHAP_SAI', 'Sai mã phòng'); throw err_('BAD_ROOM', 'Mã phòng thi không đúng (giám thị sẽ đọc mã phòng).'); }\n  var ua = str_(client.ua).substring(0, 300);\n  var isSeb = /SEB\\//.test(ua) && (!str_(ex.KhoaUA) || ua.indexOf(str_(ex.KhoaUA)) >= 0);\n  if (up_(ex.BatBuocSEB) === 'CO' && !isSeb) { log_(ky, sbd, 'DANG_NHAP_SAI', (/SEB\\//.test(ua) ? 'SEB nhưng không mở từ file .seb của kỳ thi này' : 'Không dùng SEB') + ' · ' + ua.substring(0, 100)); throw err_('NEED_SEB', 'Kỳ thi này bắt buộc làm bài trong Safe Exam Browser, mở bằng file .seb MỚI NHẤT của kỳ thi do giám thị cung cấp.'); }\n  // LỚP 4 — mã cấu hình SEB (Config Key do chính SEB tính từ file .seb): khác \"máy chuẩn\" ⇒ file .seb bị sửa / SEB cấu hình khác\n  var ck = str_(client.ck).replace(/[^0-9a-fA-F]/g, '').substring(0, 128).toLowerCase(), chuan = str_(ex.SebKeyChuan).toLowerCase();\n  if (up_(ex.BatBuocSEB) === 'CO' && chuan && ck !== chuan) {\n    log_(ky, sbd, 'DANG_NHAP_SAI', 'Sai mã cấu hình SEB (' + (ck ? ck.substring(0, 8) : 'không có') + ' ≠ ' + chuan.substring(0, 8) + ')');\n    throw err_('NEED_SEB', 'Cấu hình Safe Exam Browser của máy này KHÔNG khớp file .seb của kỳ thi (file đã bị sửa hoặc SEB quá cũ). Báo giám thị để mở bằng file .seb mới nhất.');\n  }\n  var tt = up_(st.TrangThai) || 'CHUA_VAO';\n  if (tt === 'DA_NOP') { log_(ky, sbd, 'DANG_NHAP_SAI', 'Đã nộp bài trước đó'); throw err_('DONE', 'Bạn đã nộp bài lúc ' + Utilities.formatDate(new Date(num_(st.NopLuc)), 'Asia/Ho_Chi_Minh', 'HH:mm:ss') + '. Nếu cần sửa bài, giám thị bấm ▶ Cho làm tiếp (giữ bài) hoặc ♻ Làm lại từ đầu.'); }\n  var patch = {};\n  var pendingCmd = str_(st.LenhId) && str_(st.LenhId) !== str_(st.LenhDaXuLy) ? up_(st.Lenh) : '';\n  var hadSession = !!str_(st.Token) && num_(st.BatDau) > 0;\n  if (hadSession && up_(ex.DangNhapLai) === 'CAN_GIAM_THI' && str_(client.tok) !== str_(st.Token)) {\n    if (pendingCmd !== 'CHO_VAO_LAI') {\n      log_(ky, sbd, 'CHAN_VAO_LAI', ua.substring(0, 120));\n      throw err_('NEED_PROCTOR', 'Bạn đã vào thi trước đó. Hãy báo giám thị bấm \"Cho vào lại\" rồi đăng nhập lại.');\n    }\n    patch.LenhDaXuLy = str_(st.LenhId);\n  }\n  c.remove(failKey);\n  var tok = Utilities.getUuid();\n  var n = num_(st.SoLanVao) + 1;\n  patch.Token = tok; patch.SoLanVao = n; patch.TrinhDuyet = ua.substring(0, 180); patch.SEB = isSeb ? 'CO' : 'KHONG';\n  patch.SebKey = ck; patch.SebVer = str_(client.sv).substring(0, 60);\n  patch.LanCuoi = Date.now();\n  if (tt === 'CHUA_VAO') patch.TrangThai = 'CHO';\n  writeCols_(sheet_(RSH_.THI_SINH), st.__row, patch);\n  log_(ky, sbd, n > 1 ? 'VAO_LAI' : 'VAO', 'pt v' + PT_VERSION + ' · ' + (isSeb ? 'SEB · ' : '') + ua.substring(0, 120) + (client.scr ? ' · ' + client.scr : ''));\n  return payload_(st, ex, tok, isSeb);\n}\n\nfunction wait_(tok, ky, sbd) {\n  var s = session_(tok, ky, sbd);\n  writeCols_(s.sh, s.st.__row, { LanCuoi: Date.now() });\n  if (s.thu) return { mo: true, dong: false, now: Date.now(), msg: '' };\n  return { mo: up_(s.ex.TrangThai) === 'MO', dong: up_(s.ex.TrangThai) === 'DONG', now: Date.now(), msg: msgOf_(s.ex) };\n}\n\n/** Gói đề (đệm theo mảnh ≤ 30.000 ký tự / khoá) */\nfunction pkg_(ky, md, ver) {\n  var c = cache_(), base = 'pkg|' + ky + '|' + md + '|' + ver, n = c.get(base + '|n');\n  if (n) {\n    var keys = [];\n    for (var i = 0; i < Number(n); i++) keys.push(base + '|' + i);\n    var got = c.getAll(keys), parts = [], ok = true;\n    keys.forEach(function (k) { if (got[k] === undefined || got[k] === null) ok = false; else parts.push(got[k]); });\n    if (ok) return parts.join('');\n  }\n  var rows = readAll_(RSH_.GOI_DE).filter(function (r) { return str_(r.MaKyThi) === ky && str_(r.MaDe) === md && str_(r.PhienBan) === ver; })\n    .sort(function (a, b) { return num_(a.Manh) - num_(b.Manh); });\n  if (!rows.length) throw err_('NO_PKG', 'Chưa có đề cho mã đề ' + md + '. Báo giám thị.');\n  var json = rows.map(function (r) { return String(r.DuLieu).replace(/^~/, ''); }).join('');   // '~' chống Sheets hiểu nhầm '=' đầu mảnh là công thức\n  try {\n    var put = {}, k = 0;\n    for (var p = 0; p < json.length; p += 30000) put[base + '|' + (k++)] = json.substring(p, p + 30000);\n    put[base + '|n'] = String(k);\n    c.putAll(put, 21600);\n  } catch (e) { }\n  return json;\n}\n\n/** Bài làm đã lưu gần nhất (đệm; nếu mất đệm thì đọc sheet) */\nfunction saved_(ky, sbd, since) {\n  since = num_(since);\n  var s = cache_().get('ans|' + ky + '|' + sbd);\n  if (s) { var c = JSON.parse(s); if (num_(c.t) >= since) return c; }\n  var best = null;\n  readAll_(RSH_.BAI_LAM).forEach(function (r) {\n    if (str_(r.MaKyThi) !== ky || up_(r.SBD) !== sbd || /^HUY_/.test(up_(r.Loai)) || num_(r.ThoiGian) < since) return;\n    if (!best || num_(r.Seq) > best.seq || (num_(r.Seq) === best.seq && num_(r.ThoiGian) > best.t)) best = { seq: num_(r.Seq), t: num_(r.ThoiGian), raw: ansOf_(r) };\n  });\n  if (!best) return null;\n  try { return { seq: best.seq, t: best.t, a: JSON.parse(best.raw || '{}') }; } catch (e) { return null; }\n}\n\nfunction start_(tok, ky, sbd) {\n  var s = session_(tok, ky, sbd), ex = s.ex, st = s.st, now = Date.now();\n  var tt = s.thu ? 'MO' : up_(ex.TrangThai);\n  if (tt === 'CHUA_MO') throw err_('NOT_OPEN', 'Giám thị chưa mở đề.');\n  if (up_(st.TrangThai) === 'DA_NOP') throw err_('DONE', 'Bạn đã nộp bài.');\n  var patch = { LanCuoi: now }, fresh = false;\n  if (!num_(st.BatDau)) {\n    fresh = true;\n    if (tt === 'DONG') throw err_('CLOSED', 'Kỳ thi đã kết thúc.');\n    patch.BatDau = now; st.BatDau = now;\n    if (!s.thu) log_(s.ky, s.sbd, 'BAT_DAU', 'Mã đề ' + str_(st.MaDe));\n  }\n  if (up_(st.TrangThai) !== 'KHOA') patch.TrangThai = 'DANG_LAM';\n  writeCols_(s.sh, st.__row, patch);\n  var dl = deadline_(ex, st);\n  return {\n    pkg: pkg_(s.ky, str_(st.MaDe), str_(ex.PhienBanGoi)), saved: saved_(s.ky, s.sbd, st.BatDau), now: now, deadline: dl, lt: ltState_(st),\n    locked: up_(st.TrangThai) === 'KHOA', viPham: num_(st.ViPham) - num_(st.ViPhamMoc), viPhamToiDa: maxVp_(ex, st), nghiemNgat: strict_(ex, st), chongAI: ['BAO', 'KHOA', 'KHOA_HET'].indexOf(up_(ex.ChongAI)) >= 0 ? up_(ex.ChongAI) : 'KHOA',\n    msg: s.thu ? '' : msgOf_(ex), timeUp: !!dl && now > dl && !num_(st.DungLuc), fresh: fresh, att: String(resetAt_(st)), paused: !!num_(st.DungLuc)\n  };\n}\n\nfunction countEvents_(ev, inSeb) {\n  var n = 0, sum = {};\n  (ev || []).slice(0, 200).forEach(function (e) {\n    var k = up_(e && e.k).replace(/[^A-Z_]/g, '').substring(0, 20);\n    if (!k || k === 'TU_DONG') return;                         // dấu hiệu tác tử AI ghi riêng (botEv_)\n    // Trong SEB không thể rời sang ứng dụng khác: mất focus / ẩn trang / thoát toàn màn hình đều do thao tác với thanh công cụ,\n    // nút tải lại… của chính SEB → chỉ ghi nhận, KHÔNG tính vi phạm\n    if (inSeb && PT_SERIOUS_.indexOf(k) >= 0) k = 'SEB_' + k;\n    if (inSeb && k === 'SEB_ROI_CUA_SO') k = 'SEB_THANH_CC';\n    sum[k] = sum[k] || { n: 0, s: 0 };\n    sum[k].n++; sum[k].s += Math.max(0, Math.round(num_(e.d)));\n    if (e.x && !sum[k].x) sum[k].x = str_(e.x).replace(/[\\r\\n]/g, ' ').substring(0, 120);\n    if (PT_SERIOUS_.indexOf(k) >= 0) n++;\n  });\n  var text = Object.keys(sum).map(function (k) { return k + '×' + sum[k].n + (sum[k].s ? ' (' + sum[k].s + 's)' : '') + (sum[k].x ? ' [' + sum[k].x + ']' : ''); }).join(', ');\n  return { serious: n, text: text, bot: sum.TU_DONG ? sum.TU_DONG.n : 0 };\n}\n\n/** Ghi dấu hiệu tác tử AI / phần mềm điều khiển: mỗi dấu hiệu 1 dòng nhật ký NGHI_AI (mức + lý do + bằng chứng), cộng dồn cột NghiTD, mức cao nhất NghiMuc */\nvar BOT_LV_ = ['', 'Nghi', 'Nghi cao', 'Chắc chắn'];\nfunction botEv_(s, st, ev, patch) {\n  var n = 0, top = num_(st.NghiMuc), why = [];\n  (ev || []).slice(0, 100).forEach(function (e) {\n    if (up_(e && e.k) !== 'TU_DONG') return;\n    var lv = Math.max(1, Math.min(3, Math.round(num_(e.d)) || 1)), x = str_(e.x).replace(/[\\r\\n]+/g, ' ').substring(0, 300);\n    n++; if (lv > top) top = lv;\n    why.push(x || BOT_LV_[lv]);\n    log_(s.ky, s.sbd, 'NGHI_AI', x || BOT_LV_[lv]);\n  });\n  if (!n) return 0;\n  patch.NghiTD = num_(st.NghiTD) + n; patch.NghiMuc = top;\n  patch.NghiLyDo = why.concat(str_(st.NghiLyDo) ? [str_(st.NghiLyDo)] : []).join(' ‖ ').substring(0, 900);\n  return n;\n}\nfunction save_(tok, ky, sbd, p) {\n  var s = session_(tok, ky, sbd), ex = s.ex, st = s.st, now = Date.now();\n  var res = { ok: true, now: now, msg: s.thu ? '' : msgOf_(ex) };\n  var tt = s.thu ? 'MO' : up_(ex.TrangThai);\n  if (up_(st.TrangThai) === 'DA_NOP') { res.done = true; return res; }\n  var dl = deadline_(ex, st);\n  res.deadline = dl;\n  var patch = { LanCuoi: now };\n  var late = dl && now > dl + PT_GRACE_SAVE_ && !num_(st.DungLuc);\n  if (p.a && typeof p.a === 'object' && !late && tt !== 'CHUA_MO') {\n    var json = JSON.stringify(p.a);\n    if (json.length > 90000) throw err_('BIG', 'Bài làm quá dài (code quá dài) — hãy rút gọn code');\n    append_(RSH_.BAI_LAM, { ThoiGian: now, MaKyThi: s.ky, SBD: s.sbd, MaDe: str_(st.MaDe), Loai: 'LUU', Seq: num_(p.seq), SoCauDaLam: num_(p.n), TraLoi: json.substring(0, 45000), TraLoi2: json.length > 45000 ? '~' + json.substring(45000) + '~' : '' });\n    try { cache_().put('ans|' + s.ky + '|' + s.sbd, JSON.stringify({ seq: num_(p.seq), t: now, a: p.a }), 21600); } catch (e) { }\n    res.saved = num_(p.seq);\n  }\n  if (p.n !== undefined) patch.DaLam = num_(p.n);\n  if (p.env && typeof p.env === 'object') patch.ManHinh = (p.env.fs ? 'TOAN' : 'THUONG') + (p.env.ext ? '|2MH' : '') + (p.env.foc === 0 ? '|ROI' : '');\n  var evs = countEvents_(p.ev, up_(st.SEB) === 'CO');\n  var vp = num_(st.ViPham) + evs.serious, moc = num_(st.ViPhamMoc);\n  if (evs.serious) patch.ViPham = vp;\n  botEv_(s, st, p.ev, patch);                                     // dấu hiệu bị phần mềm / tác tử AI điều khiển\n  // máy thí sinh tự khoá (tạm dừng mà rời màn hình, chụp màn hình, phát hiện tác tử AI…) → khoá cả trên máy chủ: tải lại trang vẫn khoá\n  if (p.lk && up_(st.TrangThai) !== 'KHOA' && !(str_(st.LenhId) && str_(st.LenhId) !== str_(st.LenhDaXuLy) && up_(st.Lenh) === 'MO_KHOA')) {\n    patch.TrangThai = 'KHOA'; log_(s.ky, s.sbd, 'KHOA_BAI', str_(p.lk).substring(0, 200)); res.lockSaved = true;\n  }\n  if (evs.text) log_(s.ky, s.sbd, evs.serious ? 'VI_PHAM' : 'SU_KIEN', evs.text);\n  // lệnh giám thị\n  if (str_(st.LenhId) && str_(st.LenhId) !== str_(st.LenhDaXuLy)) {\n    var cmd = up_(st.Lenh);\n    patch.LenhDaXuLy = str_(st.LenhId);\n    if (cmd === 'MO_KHOA') { moc = vp; patch.ViPhamMoc = vp; res.unlock = true; if (up_(st.TrangThai) === 'KHOA') patch.TrangThai = 'DANG_LAM'; }\n    else if (cmd === 'THU_BAI') res.cmd = 'SUBMIT';\n    else if (cmd === 'TIN') res.pmsg = str_(st.LenhGiaTri);\n    if (cmd !== 'CHO_VAO_LAI') log_(s.ky, s.sbd, 'NHAN_LENH', cmd);\n  }\n  var max = maxVp_(ex, st);\n  res.viPham = vp - moc;\n  if (max > 0 && vp - moc >= max && !res.unlock) {\n    if (up_(st.TrangThai) !== 'KHOA') { patch.TrangThai = 'KHOA'; log_(s.ky, s.sbd, 'KHOA_BAI', 'Vi phạm ' + (vp - moc) + '/' + max); }\n    res.locked = true;\n  }\n  writeCols_(s.sh, st.__row, patch);\n  res.paused = !!num_(st.DungLuc);\n  if (tt === 'DONG') res.closed = true;\n  if (dl && now > dl && !res.paused) res.timeUp = true;\n  return res;\n}\n\n/** Giám thị gõ MÃ MỞ KHOÁ ngay tại máy thí sinh (chế độ nghiêm ngặt) */\nfunction unlock_(tok, ky, sbd, code, p) {\n  var s = session_(tok, ky, sbd), ex = s.ex, st = s.st, c = cache_(), k = 'unl|' + s.ky + '|' + s.sbd;\n  if (up_(ex.NghiemNgat) !== 'CO' || !str_(ex.MaMoKhoa)) throw err_('INPUT', 'Kỳ thi không dùng mã mở khoá — chờ giám thị mở từ xa.');\n  var n = num_(c.get(k));\n  if (n >= 5) throw err_('LOCKED', 'Nhập sai mã mở khoá quá nhiều lần. Chờ giám thị mở từ máy giám thị.');\n  if (up_(code).replace(/\\s+/g, '') !== up_(ex.MaMoKhoa)) { c.put(k, String(n + 1), 600); log_(s.ky, s.sbd, 'MO_KHOA_SAI', 'Sai mã mở khoá lần ' + (n + 1)); throw err_('INPUT', 'Mã mở khoá không đúng.'); }\n  c.remove(k);\n  var evs = countEvents_(p.ev, up_(st.SEB) === 'CO'), vp = num_(st.ViPham) + evs.serious;\n  if (evs.text) log_(s.ky, s.sbd, 'VI_PHAM', evs.text);\n  var patch = { ViPham: vp, ViPhamMoc: vp, LanCuoi: Date.now() };\n  botEv_(s, st, p.ev, patch);\n  if (up_(st.TrangThai) === 'KHOA') patch.TrangThai = 'DANG_LAM';\n  writeCols_(s.sh, st.__row, patch);\n  log_(s.ky, s.sbd, 'MO_KHOA_TAI_CHO', 'Giám thị mở khoá tại máy (vi phạm ' + vp + ')');\n  return { ok: true };\n}\n\n/** Bài làm JSON (ghép 2 ô nếu dài) */\nfunction ansOf_(r) { var b = String(r.TraLoi2 == null ? '' : r.TraLoi2); return str_(r.TraLoi) + b.replace(/^~/, '').replace(/~$/, ''); }\n\n/* ============================================================ LẬP TRÌNH (chạy thử / nộp code) */\nfunction ltCfg_(ex) { try { return JSON.parse(str_(ex.LapTrinh) || 'null'); } catch (e) { return null; } }\nfunction ltUn_(v) { var s = v === null || v === undefined ? '' : String(v); if (s.charAt(0) === '~') s = s.substring(1); if (s.charAt(s.length - 1) === '~') s = s.substring(0, s.length - 1); return s; }\nfunction ltState_(st) { try { return JSON.parse(str_(st.LtDiem) || '{}') || {}; } catch (e) { return {}; } }\n/** Bộ test của 1 bài (đệm 5 phút nếu nhỏ) */\nfunction ltTests_(ky, ma) {\n  var c = cache_(), key = 'ltt|' + ky + '|' + ma, s = c.get(key);\n  if (s) return JSON.parse(s);\n  var out = readAll_(RSH_.LT_TEST).filter(function (t) { return str_(t.MaKyThi) === ky && str_(t.MaBai) === ma; })\n    .sort(function (a, b) { return num_(a.STT) - num_(b.STT); })\n    .map(function (t) { return { in: ltUn_(t.Input), out: ltUn_(t.Output), mau: up_(t.Mau) === 'CO', w: str_(t.Diem) === '' ? 1 : num_(t.Diem) }; });\n  var js = JSON.stringify(out);\n  if (js.length < 90000) try { c.put(key, js, 300); } catch (e) { }\n  return out;\n}\n/** Kiểm tra được chạy/nộp code: đang làm bài, không khoá/tạm dừng, còn giờ, không bấm quá nhanh, máy chấm không quá tải */\nfunction ltGuard_(s, kind, gap) {\n  var ex = s.ex, st = s.st, now = Date.now(), cfg = ltCfg_(ex);\n  if (!cfg) throw err_('INPUT', 'Kỳ thi không có phần lập trình');\n  if (up_(ex.TrangThai) !== 'MO' && !s.thu) throw err_('CLOSED', 'Phòng thi không mở — không chạy code được.');\n  var tt = up_(st.TrangThai);\n  if (tt === 'DA_NOP') throw err_('DONE', 'Bạn đã nộp bài.');\n  if (tt === 'KHOA') throw err_('INPUT', 'Bài thi đang bị khoá.');\n  if (num_(st.DungLuc)) throw err_('INPUT', 'Bài thi đang tạm dừng.');\n  var dl = deadline_(ex, st);\n  if (dl && now > dl) throw err_('TIME_UP', 'Đã hết giờ làm bài.');\n  var c = cache_(), k = 'ltc|' + kind + '|' + s.ky + '|' + s.sbd, last = num_(c.get(k));\n  if (last && now - last < gap * 1000) throw err_('WAIT', 'Chờ ' + Math.ceil((gap * 1000 - (now - last)) / 1000) + ' giây rồi ' + (kind === 'NOP' ? 'nộp' : 'chạy') + ' lại.');\n  var busy = num_(c.get('ltbusy'));\n  if (busy >= 14) throw err_('JUDGE_BUSY', 'Máy chấm đang bận — hệ thống tự thử lại sau vài giây.');\n  c.put(k, String(now), Math.max(gap, 5) + 5);\n  c.put('ltbusy', String(busy + 1), 60);\n  return cfg;\n}\nfunction ltDone_() { try { var c = cache_(), b = num_(c.get('ltbusy')); c.put('ltbusy', String(Math.max(0, b - 1)), 60); } catch (e) { } }\nfunction ltProb_(cfg, p) {\n  var ma = str_(p.ma), pc = cfg.bai && cfg.bai[ma];\n  if (!pc) throw err_('INPUT', 'Bài lập trình không có trong kỳ thi');\n  if (p.lang !== 'c' && p.lang !== 'py') throw err_('INPUT', 'Ngôn ngữ không hợp lệ (chỉ Python hoặc C)');\n  var lang = p.lang;\n  if ((pc.nn || ['py', 'c']).indexOf(lang) < 0) throw err_('INPUT', 'Kỳ thi không cho dùng ngôn ngữ này cho bài ' + ma);\n  var code = String(p.code == null ? '' : p.code);\n  if (!code.trim()) throw err_('INPUT', 'Chưa có code');\n  if (code.length > 30000) throw err_('INPUT', 'Code dài quá 30.000 ký tự');\n  return { ma: ma, pc: pc, lang: lang, code: code };\n}\nfunction ltView_(x, t, show) {\n  var o = { v: x.v, time: x.time, mem: x.mem };\n  if (show) {\n    o.inp = JD_cut(t.in, 4000); o.exp = t.out === undefined ? undefined : JD_cut(t.out, 4000); o.out = JD_cut(x.out, 4000); o.err = JD_cut(x.err, 4000);\n    if (x.v === 'WA') o.diff = JD_firstDiff(t.out, x.out);\n  }\n  return o;\n}\n/** Chạy thử: test mẫu (+ input tự nhập). Không tính lượt, không tính điểm. */\nfunction runCode_(tok, ky, sbd, p) {\n  var s = session_(tok, ky, sbd), cfg = ltGuard_(s, 'CHAY', 0);\n  try {\n    if (cfg.chayThu === false) throw err_('INPUT', 'Kỳ thi này không cho chạy thử — chỉ được nộp.');\n    var q = ltProb_(cfg, p), samples = ltTests_(s.ky, q.ma).filter(function (t) { return t.mau; });\n    var gap = Math.max(2, num_(cfg.giayChay) || 5), c = cache_(), k = 'ltr|' + s.ky + '|' + s.sbd, last = num_(c.get(k)), now = Date.now();\n    if (last && now - last < gap * 1000) throw err_('WAIT', 'Chờ ' + Math.ceil((gap * 1000 - (now - last)) / 1000) + ' giây rồi chạy lại.');\n    c.put(k, String(now), gap + 5);\n    var list = p.onlyCustom ? [] : samples.map(function (t) { return { in: t.in, out: t.out }; });\n    var nS = list.length;\n    if (p.custom !== undefined && p.custom !== null) list.push({ in: String(p.custom).substring(0, 20000) });\n    if (!list.length) list.push({ in: '' });\n    var r = JD_run(cfg.may, q.lang, q.code, list, q.pc);\n    if (r.lib) { log_(s.ky, s.sbd, 'LT_THU_VIEN', q.ma + ' (chạy thử): ' + r.lib); return { lib: r.lib, ce: r.lib, results: [] }; }\n    log_(s.ky, s.sbd, 'LT_CHAY', q.ma + ' ' + q.lang + ' · ' + r.results.map(function (x) { return x.v; }).join(','));\n    return { ce: r.ce, rt: r.rt, results: r.results.map(function (x, i) { var o = ltView_(x, list[i], true); o.custom = i >= nS; return o; }) };\n  } finally { ltDone_(); }\n}\n/** Nộp code: chấm trên MỌI test (ẩn chỉ trả về kết quả, không trả input/output). Tính lượt + điểm. */\nfunction submitCode_(tok, ky, sbd, p) {\n  var s = session_(tok, ky, sbd), cfg = ltGuard_(s, 'NOP', 8);\n  try {\n    var q = ltProb_(cfg, p), st = s.st, stt = ltState_(st), me = stt[q.ma] || { d: 0, n: 0 };\n    var soLan = Math.max(1, num_(cfg.soLan) || 30);\n    if (me.n >= soLan) throw err_('INPUT', 'Bạn đã dùng hết ' + soLan + ' lượt nộp cho bài này.');\n    var tests = ltTests_(s.ky, q.ma);\n    if (!tests.length) throw err_('INPUT', 'Bài chưa có test — báo giám thị');\n    var r = JD_run(cfg.may, q.lang, q.code, tests.map(function (t) { return { in: t.in, out: t.out }; }), q.pc);\n    // vi phạm quy định thư viện: báo ngay, KHÔNG tính lượt nộp\n    if (r.lib) { log_(s.ky, s.sbd, 'LT_THU_VIEN', q.ma + ': ' + r.lib); return { lib: r.lib, ce: r.lib, results: [], n: me.n, left: soLan - me.n, best: num_(me.d), max: q.pc.diem }; }\n    if (r.results.some(function (x) { return x.v === 'IE'; })) {\n      log_(s.ky, s.sbd, 'LT_LOI_MAY_CHAM', q.ma + ': ' + (r.results.filter(function (x) { return x.v === 'IE'; })[0].err || '').substring(0, 200));\n      throw err_(r.busy ? 'JUDGE_BUSY' : 'JUDGE', 'Máy chấm gặp sự cố — lượt này KHÔNG bị tính. Hãy nộp lại sau vài giây.');\n    }\n    var score = JD_score(r.results, tests.map(function (t) { return t.w; }), q.pc.diem, q.pc.cham), now = Date.now();\n    var brief = r.results.map(function (x) { return [x.v, x.time == null ? '' : x.time, x.mem == null ? '' : x.mem]; });\n    append_(RSH_.LT_NOP, { ThoiGian: now, MaKyThi: s.ky, SBD: s.sbd, MaBai: q.ma, NgonNgu: q.lang, Loai: 'NOP', Code: '~' + q.code + '~', KetQua: JSON.stringify(brief), Diem: score, DiemToiDa: q.pc.diem });\n    if (score > num_(me.d) || !me.tb) me.tb = now;            // thời điểm đạt điểm cao nhất (bảng xếp hạng)\n    me.n++; me.last = score; me.t = now; me.lang = q.lang;\n    me.d = cfg.tinh === 'LAN_CUOI' ? score : Math.max(num_(me.d), score);\n    stt[q.ma] = me;\n    writeCols_(s.sh, st.__row, { LtDiem: JSON.stringify(stt), LanCuoi: now });\n    log_(s.ky, s.sbd, 'LT_NOP', q.ma + ' ' + q.lang + ' · ' + score + '/' + q.pc.diem + ' · ' + r.results.filter(function (x) { return x.v === 'AC'; }).length + '/' + tests.length);\n    return { score: score, max: q.pc.diem, best: me.d, n: me.n, left: soLan - me.n, ce: r.ce, rt: r.rt,\n      results: r.results.map(function (x, i) { var o = ltView_(x, tests[i], tests[i].mau || s.thu); o.mau = tests[i].mau; o.an = s.thu && !tests[i].mau ? 1 : undefined; o.w = tests[i].w; return o; }) };   // thi thử: giám thị xem được cả test ẩn\n  } finally { ltDone_(); }\n}\n\nfunction submit_(tok, ky, sbd, p) {\n  var s = session_(tok, ky, sbd), ex = s.ex, st = s.st, now = Date.now();\n  if (up_(st.TrangThai) === 'DA_NOP') {\n    return { receipt: cache_().get('rc|' + s.ky + '|' + s.sbd) || '', at: num_(st.NopLuc), again: true, quit: str_(ex.ThoatURL) };\n  }\n  var dl = deadline_(ex, st);\n  if (!s.thu && up_(ex.TrangThai) === 'DONG' && num_(ex.DongLuc) && now > num_(ex.DongLuc) + PT_GRACE_SUBMIT_) {\n    throw err_('CLOSED', 'Kỳ thi đã đóng. Bài làm tự lưu gần nhất của bạn vẫn được tính.');\n  }\n  if (dl && now > dl + PT_GRACE_SUBMIT_) throw err_('TIME_UP', 'Đã quá giờ nộp. Bài làm tự lưu gần nhất của bạn vẫn được tính.');\n  var a = p.a && typeof p.a === 'object' ? p.a : (saved_(s.ky, s.sbd, st.BatDau) || {}).a || {};\n  var json = JSON.stringify(a), rc = receipt_(s.sbd + '|' + json);\n  var loai = dl && now > dl + PT_LATE_MS_ ? 'NOP_TRE' : 'NOP';\n  if (json.length > 90000) throw err_('BIG', 'Bài làm quá dài (code quá dài) — hãy rút gọn code');\n  append_(RSH_.BAI_LAM, { ThoiGian: now, MaKyThi: s.ky, SBD: s.sbd, MaDe: str_(st.MaDe), Loai: loai, Seq: num_(p.seq), SoCauDaLam: num_(p.n), TraLoi: json.substring(0, 45000), TraLoi2: json.length > 45000 ? '~' + json.substring(45000) + '~' : '', MaXacNhan: rc });\n  var evs = countEvents_(p.ev, up_(st.SEB) === 'CO');\n  var patch = { TrangThai: 'DA_NOP', NopLuc: now, LanCuoi: now, DaLam: num_(p.n) };\n  botEv_(s, st, p.ev, patch);\n  if (evs.serious) patch.ViPham = num_(st.ViPham) + evs.serious;\n  writeCols_(s.sh, st.__row, patch);\n  if (evs.text) log_(s.ky, s.sbd, evs.serious ? 'VI_PHAM' : 'SU_KIEN', evs.text);\n  log_(s.ky, s.sbd, p.auto ? 'TU_NOP' : 'NOP', 'MXN ' + rc + ' · ' + num_(p.n) + ' câu' + (loai === 'NOP_TRE' ? ' · trễ' : ''));\n  try { cache_().putAll({ ['ans|' + s.ky + '|' + s.sbd]: JSON.stringify({ seq: num_(p.seq), t: now, a: a }), ['rc|' + s.ky + '|' + s.sbd]: rc }, 21600); } catch (e) { }\n  return { receipt: rc, at: now, quit: s.thu ? '' : str_(ex.ThoatURL), late: loai === 'NOP_TRE', thu: s.thu || undefined };\n}\n\n/* ============================================================ THI THỬ CỦA GIÁM THỊ */\n\n/** Mở link thi thử (?thu=<khoá>) — khoá 32 ký tự ngẫu nhiên do trang quản trị tạo, hạn 12 giờ */\nfunction thuLogin_(key, client) {\n  key = str_(key).replace(/[^0-9a-zA-Z]/g, '');\n  var c = cache_(), fk = 'thufail', nf = num_(c.get(fk));\n  if (nf >= 30) throw err_('LOCKED', 'Thử link sai quá nhiều lần. Chờ 10 phút.');\n  var st = key.length >= 24 ? readAll_(RSH_.THI_SINH).filter(function (x) { return isThu_(x) && str_(x.MaTruyCap) === key; })[0] : null;\n  if (!st) { c.put(fk, String(nf + 1), 600); throw err_('THU_SAI', 'Link thi thử không đúng hoặc đã được thay bằng link mới. Tạo lại ở trang quản trị › ⑤ › Thi thử.'); }\n  if (thuInfo_(st).exp < Date.now()) throw err_('THU_HET', 'Link thi thử đã hết hạn (12 giờ). Tạo link mới ở trang quản trị › ⑤ › Thi thử.');\n  var ky = str_(st.MaKyThi), ex = exam_(ky), tok = Utilities.getUuid(), ua = str_(client.ua).substring(0, 300);\n  var patch = { Token: tok, SoLanVao: num_(st.SoLanVao) + 1, TrinhDuyet: ua.substring(0, 180), SEB: /SEB\\//.test(ua) ? 'CO' : 'KHONG', LanCuoi: Date.now() };\n  if (!up_(st.TrangThai) || up_(st.TrangThai) === 'CHUA_VAO') patch.TrangThai = 'CHO';\n  writeCols_(sheet_(RSH_.THI_SINH), st.__row, patch);\n  var pl = payload_(st, ex, tok, patch.SEB === 'CO');\n  pl.exam.mo = true; pl.thu.done = up_(st.TrangThai) === 'DA_NOP';\n  return pl;\n}\n\n/** Thanh công cụ thi thử: làm lại · đổi mã đề · mở khoá */\nfunction thuCtl_(tok, ky, sbd, act, arg) {\n  var s = session_(tok, ky, sbd);\n  if (!s.thu) throw err_('BAD', 'Chỉ dùng được khi thi thử');\n  var st = s.st, info = thuInfo_(st), patch = { LanCuoi: Date.now() };\n  act = str_(act);\n  if (act === 'unlock') {\n    patch.ViPhamMoc = num_(st.ViPham); patch.LenhDaXuLy = str_(st.LenhId);\n    if (up_(st.TrangThai) === 'KHOA') patch.TrangThai = 'DANG_LAM';\n    writeCols_(s.sh, st.__row, patch);\n    return { ok: true };\n  }\n  if (act === 'de') {\n    var md = str_(arg);\n    if (info.des.indexOf(md) < 0) throw err_('INPUT', 'Mã đề ' + md + ' không có trong đề đã phát');\n    pkg_(s.ky, md, str_(s.ex.PhienBanGoi));                     // kiểm tra có gói đề\n    patch.MaDe = md;\n  } else if (act !== 'reset') throw err_('BAD', 'Thao tác không hợp lệ');\n  // làm lại từ đầu: bài cũ bị bỏ qua vì chỉ lấy bản lưu sau mốc bắt đầu mới\n  ['BatDau', 'NopLuc', 'DaLam', 'ViPham', 'ViPhamMoc', 'LtDiem', 'NghiTD', 'NghiMuc', 'NghiLyDo', 'DungLuc', 'DungMs', 'ThemPhut', 'VuotHen', 'ManHinh'].forEach(function (k) { patch[k] = ''; });\n  patch.TrangThai = 'CHO';\n  writeCols_(s.sh, st.__row, patch);\n  try { cache_().removeAll(['ans|' + s.ky + '|' + s.sbd, 'rc|' + s.ky + '|' + s.sbd]); } catch (e) { }\n  return { ok: true, maDe: patch.MaDe || str_(st.MaDe) };\n}\n\n/** Thí sinh gửi câu hỏi cho giám thị (trong trang thi — không phải rời màn hình) */\nfunction ask_(tok, ky, sbd, text) {\n  var s = session_(tok, ky, sbd);\n  text = str_(text).replace(/\\s+/g, ' ').substring(0, 300);\n  if (!text) throw err_('INPUT', 'Nhập nội dung câu hỏi');\n  var c = cache_(), k = 'ask|' + s.ky + '|' + s.sbd, n = num_(c.get(k));\n  if (n >= 10) throw err_('LIMIT', 'Bạn đã gửi nhiều câu hỏi. Hãy giơ tay báo giám thị.');\n  c.put(k, String(n + 1), 1800);\n  log_(s.ky, s.sbd, 'HOI', text);\n  return { ok: true, now: Date.now() };\n}\n\n/** sebs://…/exec?seb=MA_KY_THI → SEB tải cấu hình trực tiếp */\nfunction sebFile_(ky) {\n  var r = readAll_(RSH_.KY_THI).filter(function (x) { return str_(x.MaKyThi) === ky; })[0];\n  // file .seb dài (>50.000 ký tự/ô) được chia ra nhiều ô, mỗi mảnh có tiền tố '~'\n  var xml = r ? ['SebXml', 'SebXml2', 'SebXml3', 'SebXml4'].map(function (k) { return String(r[k] == null ? '' : r[k]).replace(/^~|~$/g, ''); }).join('') : '';\n  if (!xml) return ContentService.createTextOutput('Chưa có cấu hình SEB cho kỳ thi này').setMimeType(ContentService.MimeType.TEXT);\n  return ContentService.createTextOutput(xml).setMimeType(ContentService.MimeType.XML);\n}\n\n/* ============================================================ XUẤT CHO BỘ KHỞI ĐỘNG */\nreturn { doGet: doGet, PT_api: PT_api, version: PT_VERSION };\n",
  html: "<!DOCTYPE html>\n<html lang=\"vi\">\n<head>\n<base target=\"_top\">\n<meta charset=\"utf-8\">\n<title>Phòng thi trực tuyến</title>\n<link rel=\"preconnect\" href=\"https://fonts.googleapis.com\">\n<link rel=\"stylesheet\" href=\"https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;500;600;700&family=JetBrains+Mono:wght@500;700&display=swap\">\n<link rel=\"stylesheet\" href=\"https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.css\">\n<script defer src=\"https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.js\"></script>\n<script defer src=\"https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/contrib/auto-render.min.js\"></script>\n<style>\n  :root { --bg:#eef2f7; --card:#fff; --ink:#15212e; --mute:#5f6e7d; --line:#dbe2ea; --pri:#1d5fa8; --pri2:#e7f0fb; --pri3:#0f3a6b;\n          --ok:#13804a; --okb:#e3f5ea; --warn:#a15c00; --warnb:#fff3db; --err:#b42318; --errb:#fde8e6; --flag:#d97706; --r:12px; }\n  * { box-sizing:border-box; }\n  html, body { margin:0; height:100%; }\n  body { font:15px/1.55 \"Be Vietnam Pro\", system-ui, -apple-system, \"Segoe UI\", Roboto, Arial, sans-serif; color:var(--ink); background:var(--bg);\n         -webkit-user-select:none; user-select:none; }\n  input, textarea { -webkit-user-select:text; user-select:text; }\n  button { font:inherit; cursor:pointer; }\n  .scr { display:none; min-height:100%; } .scr.on { display:block; }\n  .hidden { display:none !important; }\n  .mute { color:var(--mute); font-size:13px; }\n  /* ---- nút ---- */\n  .btn { border:1px solid #c6d1dc; background:#fff; color:var(--ink); padding:9px 16px; border-radius:9px; font-weight:500; transition:.15s; }\n  .btn:hover { background:#f3f6fa; } .btn:disabled { opacity:.5; cursor:not-allowed; }\n  .btn.pri { background:var(--pri); border-color:var(--pri); color:#fff; } .btn.pri:hover { background:#174f8c; }\n  .btn.ok { background:var(--ok); border-color:var(--ok); color:#fff; }\n  .btn.big { padding:13px 26px; font-size:16px; font-weight:600; border-radius:11px; }\n  .btn.ghost { background:transparent; border-color:transparent; color:var(--pri); }\n  /* ---- màn đăng nhập ---- */\n  .hero { min-height:100vh; display:flex; align-items:center; justify-content:center; padding:24px;\n          background:radial-gradient(1200px 600px at 10% -10%, #2f7bd0 0, transparent 60%), radial-gradient(900px 500px at 110% 110%, #11a39a 0, transparent 55%), #0f2f55; }\n  .login { width:100%; max-width:430px; background:#fff; border-radius:18px; box-shadow:0 24px 60px rgba(4,20,40,.35); overflow:hidden; }\n  .login .top { padding:26px 28px 18px; background:linear-gradient(135deg,#f5f9ff,#eef7f6); border-bottom:1px solid var(--line); }\n  .login .logo { width:46px; height:46px; border-radius:12px; background:linear-gradient(135deg,#1d5fa8,#11a39a); color:#fff; display:flex; align-items:center; justify-content:center; font-size:24px; margin-bottom:10px; }\n  .login h1 { font-size:20px; margin:0 0 2px; } .login .sub { color:var(--mute); font-size:13px; }\n  .login form { padding:22px 28px 26px; display:flex; flex-direction:column; gap:14px; }\n  .fld label { display:block; font-size:13px; font-weight:600; margin-bottom:5px; color:#334354; }\n  .fld input { width:100%; font:inherit; font-size:17px; padding:11px 13px; border:1.5px solid #c9d4df; border-radius:10px; outline:none; letter-spacing:.5px; }\n  .fld input:focus { border-color:var(--pri); box-shadow:0 0 0 3px #d4e5f8; }\n  .chip { display:inline-flex; align-items:center; gap:6px; font-size:12px; padding:4px 10px; border-radius:999px; background:#eef2f6; color:#3c4b5a; }\n  .chip.ok { background:var(--okb); color:var(--ok); } .chip.warn { background:var(--warnb); color:var(--warn); }\n  .err { background:var(--errb); color:var(--err); padding:10px 12px; border-radius:9px; font-size:14px; }\n  /* ---- màn chờ ---- */\n  .wrap { max-width:860px; margin:0 auto; padding:28px 18px; }\n  .card { background:var(--card); border:1px solid var(--line); border-radius:var(--r); padding:20px 22px; box-shadow:0 1px 2px rgba(10,30,60,.04); }\n  .card + .card { margin-top:14px; }\n  .grid2 { display:grid; grid-template-columns:1fr 1fr; gap:10px 22px; }\n  .kv b { display:block; font-size:12px; color:var(--mute); font-weight:500; } .kv span { font-weight:600; font-size:16px; }\n  .rules li { margin:6px 0; }\n  .pulse { display:inline-block; width:10px; height:10px; border-radius:50%; background:#f59e0b; box-shadow:0 0 0 0 rgba(245,158,11,.6); animation:pl 1.6s infinite; margin-right:8px; vertical-align:middle; }\n  @keyframes pl { 70% { box-shadow:0 0 0 10px rgba(245,158,11,0); } 100% { box-shadow:0 0 0 0 rgba(245,158,11,0); } }\n  /* ---- màn thi ---- */\n  .bar { position:sticky; top:0; z-index:20; background:#0f2f55; color:#fff; display:flex; align-items:center; gap:14px; padding:9px 18px; box-shadow:0 2px 10px rgba(0,0,0,.15); }\n  .bar .ttl { font-weight:600; font-size:15px; line-height:1.25; } .bar .ttl small { display:block; font-weight:400; color:#b9cbe0; font-size:12px; }\n  .bar .sp { flex:1; }\n  .timer { font:700 22px/1 ui-monospace,\"SF Mono\",Consolas,monospace; background:#16406f; padding:8px 14px; border-radius:10px; min-width:118px; text-align:center; letter-spacing:1px; }\n  .timer.w { background:#b45309; } .timer.d { background:#b42318; animation:bl 1s infinite; }\n  @keyframes bl { 50% { opacity:.75; } }\n  .who { text-align:right; font-size:13px; line-height:1.3; } .who b { font-size:14px; } .who span { color:#b9cbe0; }\n  .sv { font-size:12px; color:#cfe0f2; display:flex; align-items:center; gap:6px; white-space:nowrap; }\n  .sv i { width:9px; height:9px; border-radius:50%; background:#34d399; display:inline-block; } .sv.busy i { background:#fbbf24; } .sv.bad i { background:#f87171; }\n  .layout { display:grid; grid-template-columns:minmax(0,1fr) 300px; gap:18px; max-width:1280px; margin:0 auto; padding:18px; }\n  @media (max-width:980px) { .layout { grid-template-columns:1fr; } .side { order:-1; } .who { display:none; } }\n  .qcard { background:#fff; border:1px solid var(--line); border-radius:14px; padding:22px 26px 18px; min-height:420px; box-shadow:0 1px 3px rgba(10,30,60,.05); }\n  .qhd { display:flex; align-items:center; gap:10px; flex-wrap:wrap; margin-bottom:12px; }\n  .qno { font-size:19px; font-weight:700; color:var(--pri3); }\n  .tag { font-size:12px; padding:3px 9px; border-radius:999px; background:#eef2f6; color:#3c4b5a; }\n  .tag.p { background:var(--pri2); color:var(--pri); } .tag.m { background:#f3e8ff; color:#6b21a8; }\n  .qhd .sp { flex:1; }\n  .flagbtn { border:1px solid #e5c38a; background:#fffaf0; color:#92400e; border-radius:8px; padding:5px 11px; font-size:13px; }\n  .flagbtn.on { background:var(--flag); color:#fff; border-color:var(--flag); }\n  .hint { font-size:13px; color:var(--mute); background:#f6f8fb; border-left:3px solid #9fb6cf; padding:6px 10px; border-radius:6px; margin:0 0 12px; }\n  .grp { background:#f6f3fd; border:1px solid #e2d8f6; border-left:4px solid #7c4fc4; border-radius:10px; padding:12px 14px; margin-bottom:14px; }\n  .grp .gh { font-size:12px; font-weight:600; color:#6b3fb0; margin-bottom:4px; text-transform:uppercase; letter-spacing:.4px; }\n  .stem { font-size:16.5px; line-height:1.65; white-space:pre-wrap; word-wrap:break-word; }\n  .en { color:var(--mute); font-style:italic; white-space:pre-wrap; margin-top:4px; font-size:14.5px; }\n  .disp { text-align:center; margin:10px 0; overflow-x:auto; }\n  .media img { max-width:100%; max-height:420px; border-radius:8px; border:1px solid var(--line); margin:8px 0; display:block; }\n  .media .bad { color:var(--err); font-size:13px; }\n  .media iframe { width:100%; max-width:640px; aspect-ratio:16/9; border:0; border-radius:8px; }\n  pre.code { font:14px/1.5 ui-monospace,\"SF Mono\",\"Cascadia Mono\",Consolas,\"Courier New\",monospace; background:#0f1b2b; color:#e6edf3; border-radius:10px;\n             padding:12px 14px; margin:10px 0; white-space:pre; overflow-x:auto; tab-size:4; position:relative; }\n  pre.code[data-lang]::before { content:attr(data-lang); position:absolute; top:6px; right:10px; font:10px sans-serif; color:#7d8da1; text-transform:uppercase; }\n  .tk-k { color:#ff7b72; } .tk-s { color:#a5d6ff; } .tk-c { color:#8b949e; font-style:italic; } .tk-n { color:#79c0ff; } .tk-b { color:#d2a8ff; } .tk-f { color:#ffa657; }\n  .opts { display:flex; flex-direction:column; gap:10px; margin-top:16px; }\n  .opt { display:flex; align-items:flex-start; gap:12px; text-align:left; width:100%; padding:12px 14px; border:1.5px solid #d3dce6; border-radius:11px; background:#fff; transition:.12s; }\n  .opt:hover { border-color:#9cb8d8; background:#f8fbff; }\n  .opt .L { flex:0 0 32px; height:32px; border-radius:50%; border:1.5px solid #a9b9ca; display:flex; align-items:center; justify-content:center; font-weight:700; color:#41566d; }\n  .opt.multi .L { border-radius:8px; }\n  .opt .T { flex:1; padding-top:4px; white-space:pre-wrap; word-wrap:break-word; }\n  .opt.on { border-color:var(--pri); background:var(--pri2); box-shadow:0 0 0 2px #cfe1f6 inset; }\n  .opt.on .L { background:var(--pri); border-color:var(--pri); color:#fff; }\n  table.ds { width:100%; border-collapse:separate; border-spacing:0 8px; margin-top:10px; }\n  table.ds td { padding:10px 12px; background:#f8fafc; border-top:1px solid var(--line); border-bottom:1px solid var(--line); vertical-align:middle; }\n  table.ds td:first-child { border-left:1px solid var(--line); border-radius:10px 0 0 10px; font-weight:700; color:#41566d; width:34px; }\n  table.ds td:last-child { border-right:1px solid var(--line); border-radius:0 10px 10px 0; width:190px; white-space:nowrap; text-align:right; }\n  .seg { display:inline-flex; border:1.5px solid #c6d1dc; border-radius:9px; overflow:hidden; }\n  .seg button { border:0; background:#fff; padding:7px 14px; font-weight:600; color:#41566d; }\n  .seg button + button { border-left:1.5px solid #c6d1dc; }\n  .seg button.on.t { background:var(--ok); color:#fff; } .seg button.on.f { background:var(--err); color:#fff; }\n  .match { display:grid; grid-template-columns:1fr 1fr; gap:16px; margin-top:12px; }\n  .match .it { display:flex; gap:10px; align-items:center; padding:9px 12px; border:1px solid var(--line); border-radius:10px; margin-bottom:8px; background:#f8fafc; }\n  .match select { font:inherit; padding:6px 8px; border-radius:8px; border:1.5px solid #c6d1dc; min-width:64px; }\n  .match .r { padding:8px 12px; border:1px dashed #c6d1dc; border-radius:10px; margin-bottom:8px; }\n  .short { margin-top:14px; } .short input { font:inherit; font-size:18px; padding:11px 14px; border:1.5px solid #c6d1dc; border-radius:10px; width:min(100%,360px); }\n  .short input:focus { outline:none; border-color:var(--pri); box-shadow:0 0 0 3px #d4e5f8; }\n  .qft { display:flex; justify-content:space-between; align-items:center; margin-top:22px; padding-top:14px; border-top:1px solid var(--line); gap:10px; }\n  .side .card { position:sticky; top:78px; padding:16px; }\n  .prog { height:8px; background:#e6ecf2; border-radius:9px; overflow:hidden; margin:8px 0 12px; } .prog i { display:block; height:100%; background:linear-gradient(90deg,#1d5fa8,#11a39a); transition:width .3s; }\n  .secl { font-size:12px; font-weight:600; color:var(--mute); margin:10px 0 6px; text-transform:uppercase; letter-spacing:.3px; }\n  .nav { display:grid; grid-template-columns:repeat(6,1fr); gap:6px; }\n  .nav button { position:relative; aspect-ratio:1/1; border-radius:8px; border:1.5px solid #ccd6e0; background:#fff; font-weight:600; font-size:13px; color:#3b4c5e; padding:0; }\n  .nav button.a { background:#dbeafe; border-color:#93c5fd; color:#1e3a8a; }\n  .nav button.c { outline:2.5px solid var(--pri); outline-offset:1px; }\n  .nav button small { display:block; font-size:10px; font-weight:700; line-height:1; color:#1d4ed8; margin-top:1px; }\n  .nav button { display:flex; flex-direction:column; align-items:center; justify-content:center; }\n  .timer.p { background:#475569; }\n  .fsz { display:inline-flex; border:1px solid #2b5c92; border-radius:8px; overflow:hidden; }\n  .fsz button { background:#16406f; color:#fff; border:0; padding:6px 9px; font-weight:700; }\n  .fsz button + button { border-left:1px solid #2b5c92; }\n  body.f1 .stem, body.f1 .opt .T { font-size:18.5px; } body.f2 .stem, body.f2 .opt .T { font-size:21px; }\n  body.f1 pre.code { font-size:15.5px; } body.f2 pre.code { font-size:17px; }\n  .rv { width:100%; border-collapse:collapse; margin:8px 0; font-size:13.5px; }\n  .rv td { border:1px solid var(--line); padding:4px 6px; text-align:center; cursor:pointer; }\n  .rv td.e { color:var(--err); font-weight:700; } .rv td.f { background:#fff7e6; }\n  .nav button.f::after { content:''; position:absolute; top:-4px; right:-4px; width:10px; height:10px; border-radius:50%; background:var(--flag); border:2px solid #fff; }\n  .legend { display:flex; gap:10px; flex-wrap:wrap; font-size:12px; color:var(--mute); margin-top:12px; }\n  .legend span::before { content:''; display:inline-block; width:11px; height:11px; border-radius:3px; margin-right:4px; vertical-align:-1px; border:1.5px solid #ccd6e0; }\n  .legend .la::before { background:#dbeafe; border-color:#93c5fd; } .legend .lf::before { background:var(--flag); border-color:var(--flag); border-radius:50%; }\n  /* ---- lớp phủ ---- */\n  .ov { position:fixed; inset:0; z-index:60; background:rgba(9,22,40,.72); display:flex; align-items:center; justify-content:center; padding:20px; }\n  .ov .box { background:#fff; border-radius:16px; padding:26px 28px; max-width:520px; width:100%; box-shadow:0 30px 80px rgba(0,0,0,.4); }\n  .ov h2 { margin:0 0 8px; font-size:20px; }\n  .ov .btns { display:flex; gap:10px; justify-content:flex-end; margin-top:18px; flex-wrap:wrap; }\n  .stat { display:grid; grid-template-columns:repeat(3,1fr); gap:10px; margin:14px 0; }\n  .stat div { background:#f5f8fb; border-radius:10px; padding:10px; text-align:center; } .stat b { display:block; font-size:22px; } .stat span { font-size:12px; color:var(--mute); }\n  .banner { position:fixed; left:50%; transform:translateX(-50%); top:64px; z-index:40; max-width:720px; width:calc(100% - 30px); padding:11px 16px; border-radius:11px;\n            box-shadow:0 10px 30px rgba(0,0,0,.18); font-size:14px; display:flex; gap:10px; align-items:center; }\n  .banner.info { background:#1d5fa8; color:#fff; } .banner.warn { background:#fff3db; color:#7c4a03; border:1px solid #f3cf8d; } .banner.err { background:#fde8e6; color:#8a1c12; border:1px solid #f3b2aa; }\n  .banner .x { margin-left:auto; background:transparent; border:0; color:inherit; font-size:18px; }\n  #toast { position:fixed; right:16px; bottom:16px; z-index:70; display:flex; flex-direction:column; gap:8px; max-width:380px; }\n  #toast div { background:#15212e; color:#fff; padding:10px 14px; border-radius:10px; font-size:14px; box-shadow:0 8px 24px rgba(0,0,0,.25); }\n  #toast div.w { background:#a15c00; } #toast div.e { background:#b42318; }\n  #wm { position:fixed; inset:0; pointer-events:none; z-index:5; opacity:.06; }\n  .done { text-align:center; } .done .ic { font-size:56px; } .rc { font:700 28px ui-monospace,Consolas,monospace; letter-spacing:3px; background:#f1f5f9; display:inline-block; padding:8px 18px; border-radius:10px; margin:8px 0; }\n  .ansStr { font:14px/1.6 ui-monospace,Consolas,monospace; background:#f8fafc; border:1px solid var(--line); border-radius:10px; padding:10px; text-align:left; word-break:break-word; -webkit-user-select:text; user-select:text; }\n  .spin { width:34px; height:34px; border:4px solid #d5e2f0; border-top-color:var(--pri); border-radius:50%; animation:sp 0.9s linear infinite; margin:0 auto 12px; }\n  @keyframes sp { to { transform:rotate(360deg); } }\n  kbd { font:12px ui-monospace,monospace; border:1px solid #c6d1dc; border-bottom-width:2px; border-radius:5px; padding:0 5px; background:#fff; }\n\n  /* ===================== GIAO DIỆN v1.7 — nhận diện CLB =====================\n     Bảng màu: --club (màu CLB, giám thị đặt) · ink #17202A · slate #5A6472 · fog #EDF0EE · paper #FFF · brass #B8862B (đánh dấu / sắp hết giờ)\n     Nguyên tắc: điểm nhấn duy nhất là khối thương hiệu ở màn đăng nhập + vạch thời gian dưới thanh trên; trong giờ thi mọi thứ yên tĩnh.\n     Hiệu năng: không blur, không bóng lớn động, chỉ transition màu/opacity; tôn trọng \"giảm chuyển động\". */\n  :root { --club:#14237A; --club-d:#0f1a5c; --club-t:#e3e5ef; --club-tt:#f4f5f9; --club-l:#7e86b6; --club-dt:#080d2e; --club-dtt:#04081b; --ink:#17202A; --mute:#5A6472; --line:#DCE1DE; --bg:#EDF0EE;\n          --brass:#B8862B; --brass-t:#FBF3E2; --pri:var(--club); --pri2:var(--club-t); --pri3:var(--club-d); --flag:var(--brass); }\n  body { background:var(--bg); font-feature-settings:\"tnum\" 0; }\n  .btn { border-radius:10px; border-color:var(--line); transition:background .12s, border-color .12s, color .12s; }\n  .btn.pri { background:var(--club); border-color:var(--club); } .btn.pri:hover { background:var(--club-d); }\n  .btn.ok { background:var(--club); border-color:var(--club); } .btn.ok:hover { background:var(--club-d); }\n  .btn.ghost { color:var(--club); }\n  :focus-visible { outline:3px solid color-mix(in srgb, var(--club) 45%, transparent); outline-offset:2px; }\n\n  /* ---------- đăng nhập: khối thương hiệu | biểu mẫu ---------- */\n  .lg { min-height:100vh; display:grid; grid-template-columns:minmax(320px, 46%) 1fr; }\n  .lg-brand { position:relative; overflow:hidden; background:var(--club); color:#fff; padding:56px 56px 40px; display:flex; flex-direction:column; }\n  .lg-brand::after { content:''; position:absolute; right:-14%; bottom:-18%; width:72%; aspect-ratio:1; border-radius:50%;\n    border:56px solid rgba(255,255,255,.06); box-shadow:0 0 0 70px rgba(255,255,255,.035); pointer-events:none; }\n  .lg-mark { display:flex; align-items:center; gap:16px; }\n  .lg-logo { width:72px; height:72px; border-radius:20px; background:#fff; display:flex; align-items:center; justify-content:center; overflow:hidden; flex:none;\n    box-shadow:0 10px 30px rgba(0,0,0,.18); color:var(--club); font:700 26px/1 \"Be Vietnam Pro\", system-ui, sans-serif; letter-spacing:-.5px; }\n  .lg-logo img { width:100%; height:100%; object-fit:contain; padding:8px; }\n  .lg-club { font-weight:700; font-size:19px; line-height:1.3; } .lg-khau { opacity:.78; font-size:14px; margin-top:2px; }\n  .lg-exam { margin-top:auto; padding-top:56px; position:relative; z-index:1; }\n  .lg-exam h1 { font-size:clamp(30px, 3.6vw, 46px); line-height:1.12; letter-spacing:-.8px; margin:0 0 12px; font-weight:700; max-width:14ch; }\n  .lg-exam p { margin:0; opacity:.8; font-size:15px; max-width:42ch; }\n  .lg-foot { margin-top:40px; display:flex; gap:10px; align-items:center; flex-wrap:wrap; font-size:12.5px; opacity:.85; position:relative; z-index:1; }\n  .lg-foot .chip { background:rgba(255,255,255,.14); color:#fff; } .lg-foot .chip.ok { background:rgba(255,255,255,.92); color:var(--club-d); }\n  .lg-form { display:flex; align-items:center; justify-content:center; padding:40px 24px; background:#fff; }\n  .lg-form .inner { width:100%; max-width:380px; }\n  .lg-form h2 { font-size:26px; letter-spacing:-.4px; margin:0 0 6px; } .lg-form .lead { color:var(--mute); margin:0 0 26px; font-size:14.5px; }\n  .lg-form form { display:flex; flex-direction:column; gap:16px; }\n  .fld label { color:var(--ink); font-size:13.5px; }\n  .fld input { border:1.5px solid var(--line); border-radius:12px; padding:13px 14px; font-size:18px; letter-spacing:1px; background:var(--club-tt); transition:border-color .12s, background .12s; }\n  .fld input:focus { border-color:var(--club); background:#fff; box-shadow:0 0 0 4px var(--club-t); }\n  #lgBtn { margin-top:6px; padding:15px; font-size:16.5px; border-radius:12px; }\n  @media (max-width:860px) { .lg { grid-template-columns:1fr; } .lg-brand { padding:28px 24px 26px; } .lg-exam { padding-top:26px; } .lg-exam h1 { font-size:28px; }\n    .lg-foot { margin-top:18px; } .lg-logo { width:56px; height:56px; border-radius:16px; } .lg-brand::after { display:none; } }\n  @media (prefers-reduced-motion:no-preference) {\n    .lg-logo, .lg-exam { animation:rise .5s cubic-bezier(.2,.7,.2,1) both; } .lg-exam { animation-delay:.08s; }\n    @keyframes rise { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:none; } } }\n\n  /* ---------- phòng chờ: phiếu dự thi ---------- */\n  .brandbar { display:flex; align-items:center; gap:12px; padding:14px 22px; background:#fff; border-bottom:1px solid var(--line); }\n  .brandbar .bl { width:38px; height:38px; border-radius:11px; background:var(--club); color:#fff; display:flex; align-items:center; justify-content:center; overflow:hidden; font-weight:700; font-size:14px; flex:none; }\n  .brandbar .bl img { width:100%; height:100%; object-fit:contain; background:#fff; padding:4px; }\n  .brandbar b { font-size:15px; } .brandbar span { color:var(--mute); font-size:13px; }\n  .ticket { position:relative; background:#fff; border-radius:18px; overflow:hidden; border:1px solid var(--line); }\n  .ticket .th { background:var(--club); color:#fff; padding:22px 26px; }\n  .ticket .th .mute { color:rgba(255,255,255,.75); } .ticket .th h2 { color:#fff; letter-spacing:-.3px; }\n  .ticket .th .chip { background:rgba(255,255,255,.16); color:#fff; } .ticket .th .chip.ok { background:#fff; color:var(--club-d); }\n  .ticket .tb { padding:22px 26px; border-top:2px dashed var(--line); position:relative; }\n  .ticket .tb::before, .ticket .tb::after { content:''; position:absolute; top:-13px; width:24px; height:24px; border-radius:50%; background:var(--bg); border:1px solid var(--line); }\n  .ticket .tb::before { left:-13px; } .ticket .tb::after { right:-13px; }\n  .kv b { font-size:12.5px; } .kv span { font-size:17px; }\n  #wtMd { color:var(--club); }\n  .card { border-radius:16px; border-color:var(--line); box-shadow:none; }\n  .pulse { background:var(--brass); }\n\n  /* ---------- trong giờ thi: yên tĩnh ---------- */\n  .bar { background:#fff; color:var(--ink); border-bottom:1px solid var(--line); box-shadow:none; padding:10px 20px; gap:16px; }\n  .bar .bl { width:34px; height:34px; border-radius:10px; background:var(--club); color:#fff; display:flex; align-items:center; justify-content:center; overflow:hidden; font-weight:700; font-size:13px; flex:none; }\n  .bar .bl img { width:100%; height:100%; object-fit:contain; background:#fff; padding:3px; }\n  .bar .ttl small { color:var(--mute); }\n  .who span { color:var(--mute); }\n  .sv { color:var(--mute); } .sv i { background:#2F9E6B; } .sv.busy i { background:var(--brass); } .sv.bad i { background:#C2413A; }\n  .timer { font:700 24px/1 \"Be Vietnam Pro\", system-ui, sans-serif; font-variant-numeric:tabular-nums; letter-spacing:.5px; background:var(--club-t); color:var(--club-d);\n    border:0; border-radius:12px; padding:9px 16px; min-width:120px; }\n  .timer.w { background:var(--brass-t); color:#7A5414; } .timer.d { background:#C2413A; color:#fff; } .timer.p { background:#E7E9EC; color:var(--mute); }\n  .tline { position:sticky; top:var(--barH, 58px); z-index:19; height:3px; background:transparent; }\n  .tline i { display:block; height:100%; width:100%; background:var(--club); transform-origin:left; transition:transform 1s linear, background .3s; }\n  .tline.w i { background:var(--brass); } .tline.d i { background:#C2413A; }\n  .fsz { border-color:var(--line); } .fsz button { background:#fff; color:var(--ink); } .fsz button + button { border-left-color:var(--line); }\n  .bar .ask { background:#fff; border-color:var(--line); color:var(--ink); }\n  .qcard { border:1px solid var(--line); border-radius:18px; box-shadow:none; padding:26px 30px 20px; }\n  .qcard.enter { animation:qin .16s ease-out; }\n  @keyframes qin { from { opacity:.35; } to { opacity:1; } }\n  .qno { color:var(--ink); display:inline-flex; align-items:baseline; gap:10px; font-size:15px; }\n  .qno::before { content:attr(data-n); font-size:30px; font-weight:700; letter-spacing:-1px; color:var(--club); line-height:1; }\n  .tag { background:var(--bg); color:var(--mute); } .tag.p { background:var(--club-t); color:var(--club-d); }\n  .flagbtn { border-color:#E6D3A8; background:#fff; color:#7A5414; } .flagbtn.on { background:var(--brass); border-color:var(--brass); color:#fff; }\n  .stem { font-size:17px; line-height:1.7; }\n  .opt { border:1.5px solid var(--line); border-radius:14px; padding:13px 15px; transition:border-color .12s, background .12s; }\n  .opt:hover { border-color:color-mix(in srgb, var(--club) 40%, var(--line)); background:var(--club-tt); }\n  .opt .L { border-color:#B9C2BE; color:var(--mute); transition:background .12s, color .12s, border-color .12s; }\n  .opt.on { border-color:var(--club); background:var(--club-tt); box-shadow:inset 4px 0 0 var(--club); }\n  .opt.on .L { background:var(--club); border-color:var(--club); color:#fff; }\n  .grp { background:var(--club-tt); border-color:var(--line); border-left:4px solid var(--club); border-radius:12px; }\n  .grp .gh { color:var(--club-d); text-transform:none; letter-spacing:0; font-size:13px; }\n  .hint { border-left-color:var(--club); background:var(--club-tt); }\n  .seg button.on.t { background:var(--club); } .seg button.on.f { background:#C2413A; }\n  .short input:focus, .match select:focus { border-color:var(--club); box-shadow:0 0 0 3px var(--club-t); }\n  .side .card { border-radius:18px; }\n  .prog { height:6px; background:var(--bg); } .prog i { background:var(--club); }\n  .secl { text-transform:none; letter-spacing:0; font-size:12.5px; }\n  .nav { gap:7px; }\n  .nav button { border-radius:10px; border:1.5px solid var(--line); color:var(--ink); transition:background .12s, border-color .12s; }\n  .nav button:hover { border-color:var(--club); }\n  .nav button.a { background:var(--club); border-color:var(--club); color:#fff; } .nav button.a small { color:rgba(255,255,255,.85); }\n  .nav button.c { outline:2.5px solid var(--ink); outline-offset:2px; }\n  .legend .la::before { background:var(--club); border-color:var(--club); } .legend .lf::before { background:var(--brass); border-color:var(--brass); }\n  .ov { background:rgba(15,22,28,.62); }\n  .ov .box { border-radius:20px; }\n  @media (prefers-reduced-motion:no-preference) { .ov .box { animation:pop .16s ease-out; } @keyframes pop { from { opacity:.5; transform:translateY(4px); } to { opacity:1; transform:none; } } }\n  .banner.info { background:var(--ink); }\n  #toast div { border-radius:12px; background:var(--ink); }\n  .spin { border-color:var(--club-t); border-top-color:var(--club); }\n  .done .ic { width:76px; height:76px; margin:0 auto 6px; border-radius:50%; background:var(--club); color:#fff; display:flex; align-items:center; justify-content:center; font-size:38px; }\n\n  /* ===================== GIAO DIỆN v1.8 — \"công nghệ\" =====================\n     Thêm: chữ số đơn cách JetBrains Mono cho đồng hồ / số câu / mã; nền lưới chấm; thanh trên tối; vòng thời gian; tiến độ chia đoạn theo câu;\n     phím chữ cái kiểu bàn phím; chế độ tối. Chỉ dùng transform/opacity cho chuyển động → mượt cả trên máy yếu. */\n  :root { --mono:\"JetBrains Mono\", ui-monospace, \"SF Mono\", Consolas, monospace; --card:#fff; --dot:rgba(23,32,42,.075); --bar:#0F151C; --bar-ink:#E8EDF1; --bar-mute:#8E9BA8; --bar-line:#222C36; }\n  body { background:radial-gradient(circle at 1px 1px, var(--dot) 1px, transparent 0) 0 0/22px 22px, var(--bg); }\n  /* đăng nhập: lưới chấm + một vệt sáng trôi chậm */\n  .lg-brand { background:radial-gradient(circle at 1px 1px, rgba(255,255,255,.10) 1px, transparent 0) 0 0/20px 20px, linear-gradient(160deg, var(--club) 0%, var(--club-d) 100%); }\n  .lg-brand::before { content:''; position:absolute; top:-25%; left:-15%; width:75%; aspect-ratio:1; border-radius:50%; pointer-events:none;\n    background:radial-gradient(circle, rgba(255,255,255,.16) 0%, rgba(255,255,255,0) 62%); }\n  @media (prefers-reduced-motion:no-preference) { .lg-brand::before { animation:drift 16s ease-in-out infinite alternate; will-change:transform; }\n    @keyframes drift { to { transform:translate(38%, 55%); } } }\n  .lg-foot #lgVer { font-family:var(--mono); font-size:11.5px; }\n  .lg-form h2 { font-size:28px; }\n  .fld input { font-family:var(--mono); font-weight:500; letter-spacing:2px; text-transform:uppercase; }\n  #lgBtn { position:relative; overflow:hidden; }\n  /* phòng chờ */\n  #wtSbd, #wtMd { font-family:var(--mono); letter-spacing:.5px; }\n  .ticket .th { background:radial-gradient(circle at 1px 1px, rgba(255,255,255,.12) 1px, transparent 0) 0 0/18px 18px, linear-gradient(120deg, var(--club), var(--club-d)); }\n  /* thanh trên tối */\n  .bar { background:var(--bar); color:var(--bar-ink); border-bottom:1px solid var(--bar-line); }\n  .bar .ttl small, .who span, .sv { color:var(--bar-mute); }\n  .bar .btn, .fsz { background:transparent; border-color:var(--bar-line); color:var(--bar-ink); }\n  .fsz button { background:transparent; color:var(--bar-ink); } .fsz button + button { border-left-color:var(--bar-line); }\n  .bar .btn:hover, .fsz button:hover { background:rgba(255,255,255,.07); }\n  .bar .btn.ok { background:var(--club); border-color:var(--club); color:#fff; } .bar .btn.ok:hover { background:var(--club-d); }\n  .bar .ico { width:38px; padding:8px 0; text-align:center; }\n  .tbox { display:flex; align-items:center; gap:10px; background:#18212B; border:1px solid var(--bar-line); border-radius:14px; padding:5px 14px 5px 6px; }\n  .ring { width:34px; height:34px; transform:rotate(-90deg); flex:none; }\n  .ring circle { fill:none; stroke-width:3.5; } .ring .trk { stroke:#26313C; } .ring .arc { stroke:var(--club-l, #4FD1C5); stroke-linecap:round; stroke-dasharray:97.4; transition:stroke-dashoffset 1s linear, stroke .3s; }\n  .tbox.w .arc { stroke:#E0B055; } .tbox.d .arc { stroke:#F06A63; }\n  .timer, .timer.w, .timer.p { background:transparent; color:#F3F6F8; font:700 23px/1 var(--mono); letter-spacing:1px; padding:0; min-width:0; border-radius:0; }\n  .timer.w { color:#F2C46D; } .timer.d { background:transparent; color:#FF8A82; } .timer.p { color:var(--bar-mute); }\n  .tline { height:2px; } .tline i { box-shadow:0 0 10px var(--club-l, #4FD1C5); background:var(--club-l, #4FD1C5); }\n  /* câu hỏi */\n  .qcard { background:var(--card); }\n  .qno::before { font-family:var(--mono); font-size:28px; letter-spacing:-.5px; }\n  .qno .mute { font-family:var(--mono); font-size:13px; }\n  .opt { background:var(--card); }\n  .opt:active { transform:scale(.995); }\n  .opt .L { font-family:var(--mono); font-size:14px; border-radius:9px; border-width:1.5px; border-bottom-width:3px; background:var(--card); }\n  .opt.multi .L { border-radius:9px; }\n  .opt.on .L { border-bottom-color:var(--club-d); }\n  .opt.on .T::after { content:'✓'; float:right; margin-left:10px; color:var(--club); font-weight:800; }\n  kbd { font-family:var(--mono); border-color:var(--line); background:var(--card); color:var(--ink); }\n  /* tiến độ chia đoạn */\n  .segs { display:flex; gap:2px; margin:10px 0 14px; } .segs i { flex:1; height:6px; border-radius:2px; background:var(--line); transition:background .2s; }\n  .segs i.a { background:var(--club); } .segs i.f { background:var(--brass); } .segs i.c { background:var(--ink); }\n  .nav button { font-family:var(--mono); background:var(--card); }\n  .nav button small { font-family:var(--mono); }\n  .nav button.c { outline:0; box-shadow:0 0 0 2px var(--card), 0 0 0 4px var(--club); }\n  .side .card { background:var(--card); }\n  #pgN { font-family:var(--mono); }\n  /* lớp phủ, cổng nghiêm ngặt */\n  .ov .box, .gate .box { background:var(--card); color:var(--ink); position:relative; overflow:hidden; }\n  .ov .box::before, .gate .box::before { content:''; position:absolute; left:0; top:0; right:0; height:3px; background:var(--club); }\n  .spin { border:0; background:conic-gradient(var(--club) 0 28%, var(--club-t) 0); -webkit-mask:radial-gradient(farthest-side, transparent calc(100% - 5px), #000 0); mask:radial-gradient(farthest-side, transparent calc(100% - 5px), #000 0); }\n  .gate.top { z-index:62; }\n  .gate { position:fixed; inset:0; z-index:58; background:var(--bar); display:flex; align-items:center; justify-content:center; padding:20px; }\n  .gate .box { max-width:520px; width:100%; border-radius:20px; padding:30px; text-align:center; }\n  .gate-ic { font:700 30px/1 var(--mono); color:var(--club); margin-bottom:10px; }\n  .lock-ic { font-size:44px; }\n  .ulrow { display:flex; gap:8px; margin-top:14px; } .ulrow input { flex:1; font:600 20px var(--mono); letter-spacing:4px; text-align:center; padding:11px; border:1.5px solid var(--line); border-radius:12px; background:var(--bg); color:var(--ink); }\n  .ulrow input:focus { outline:none; border-color:var(--club); }\n  .blurmsg { display:none; }\n  body.fsgrace #scrExam .layout, body.shield #scrExam .layout, body.shield #ov { visibility:hidden; }\n  body.shield::after { content:'Không chụp màn hình bài thi'; position:fixed; inset:0; display:flex; align-items:center; justify-content:center; background:var(--bg); color:var(--mute); font-weight:600; z-index:200; }\n  body.blurred #scrExam .layout { opacity:0; }\n  body.blurred .blurmsg { display:flex; position:fixed; inset:0; z-index:57; align-items:center; justify-content:center; font-weight:600; color:var(--mute); pointer-events:none; }\n  .rc { font-family:var(--mono); }\n  /* ---------- chế độ tối ---------- */\n  body.dark { --bg:#0D1217; --card:#141B22; --ink:#E4E9EE; --mute:#8D99A6; --line:#25303A; --dot:rgba(255,255,255,.045); --club-t:var(--club-dt); --club-tt:var(--club-dtt); }\n  body.dark .brandbar, body.dark .lg-form { background:var(--card); border-color:var(--line); }\n  body.dark .card, body.dark .ticket, body.dark .ticket .tb { background:var(--card); }\n  body.dark .ticket .tb::before, body.dark .ticket .tb::after { background:var(--bg); border-color:var(--line); }\n  body.dark .stem, body.dark .opt .T { color:var(--ink); }\n  body.dark .seg button, body.dark .match select, body.dark .short input, body.dark .fld input, body.dark textarea { background:var(--bg); color:var(--ink); border-color:var(--line); }\n  body.dark .match .it, body.dark table.ds td, body.dark .hint, body.dark .grp, body.dark .stat div, body.dark .ansStr, body.dark .rc { background:var(--club-tt); color:var(--ink); border-color:var(--line); }\n  body.dark .flagbtn { background:transparent; color:#E9C27A; border-color:#5A4A2A; }\n  body.dark .tag { background:#1E2731; color:var(--mute); } body.dark .tag.m { background:#2A2140; color:#C9B3F5; }\n  body.dark .btn:not(.pri):not(.ok) { background:var(--card); color:var(--ink); border-color:var(--line); }\n  body.dark #wm { filter:invert(1); }\n  body.dark .err { background:#3A1715; color:#FFB4AE; }\n  body.dark .qno::before, body.dark .grp .gh, body.dark #wtMd, body.dark .opt.on .T::after, body.dark .btn.ghost { color:var(--club-l); }\n  body.dark .opt.on { border-color:var(--club-l); box-shadow:inset 4px 0 0 var(--club-l); }\n  body.dark .segs i.c { background:var(--club-l); } body.dark .nav button.c { box-shadow:0 0 0 2px var(--card), 0 0 0 4px var(--club-l); }\n  #toast div { background:#1B2430; color:#F1F4F7; } body.dark #toast div { background:#26313D; }\n  #toast div.w { background:#8A6418; color:#fff; } #toast div.e { background:#C2413A; color:#fff; }\n  .ulrow input::placeholder { font:500 14px \"Be Vietnam Pro\", system-ui, sans-serif; letter-spacing:0; }\n  .sr { position:absolute; width:1px; height:1px; overflow:hidden; clip:rect(0 0 0 0); white-space:nowrap; }\n  #toast div.w { background:#8A6418; } #toast div.e { background:#C2413A; }\n  @media (prefers-reduced-motion:reduce) { *, *::before, *::after { animation:none !important; transition:none !important; } }\n  /* thanh tải: hiện khi máy chủ trả lời chậm → thí sinh biết trang đang tải, không phải bị treo */\n  #ldbar { position: fixed; left: 0; top: 0; height: 3px; width: 100%; z-index: 90; pointer-events: none; opacity: 0; transition: opacity .2s; overflow: hidden; }\n  #ldbar.on { opacity: 1; }\n  #ldbar::after { content: ''; position: absolute; top: 0; left: -40%; width: 40%; height: 100%; background: linear-gradient(90deg, transparent, var(--club), transparent); animation: ld 1.1s linear infinite; }\n  @keyframes ld { to { left: 100%; } }\n  .upd { text-align: center; } .upd .spin { width: 46px; height: 46px; border-width: 5px; }\n  .upd .pbar { height: 6px; background: var(--club-t); border-radius: 6px; overflow: hidden; margin: 14px auto 4px; max-width: 280px; }\n  .upd .pbar i { display: block; height: 100%; width: 0; background: var(--club); animation: pfill var(--d, 1.6s) linear forwards; }\n  @keyframes pfill { to { width: 100%; } }\n  #scrBoot { display: none; min-height: 100vh; align-items: center; justify-content: center; }\n  #scrBoot.on { display: flex; }\n\n  /* ===================== THI LẬP TRÌNH — giao diện cơ bản (đề trái · code phải · kết quả dưới) ===================== */\n  body.codeMode .layout { max-width:none; grid-template-columns:minmax(0,1fr); padding:12px 14px; }\n  body.codeMode .side { display:none; }\n  body.codeMode.navOpen .side { display:block; position:fixed; right:14px; top:calc(var(--barH, 58px) + 10px); width:300px; z-index:35; max-height:calc(100vh - var(--barH, 58px) - 24px); overflow:auto; border-radius:18px; box-shadow:0 18px 50px rgba(0,0,0,.25); }\n  body.codeMode.navOpen .side .card { position:static; }\n  body.codeMode .qcard { padding:12px 14px 10px; min-height:0; }\n  body.codeMode .qhd { margin-bottom:8px; }\n  body.codeMode .qft { margin-top:10px; padding-top:10px; }\n  .lt { display:grid; grid-template-columns:var(--ltL, 40%) 10px minmax(0, 1fr); gap:0; height:calc(100vh - var(--barH, 58px) - 160px); min-height:540px; }\n  .lt.nost { grid-template-columns:0 10px minmax(0, 1fr); } .lt.nost .lt-st { visibility:hidden; padding:0; border:0; }\n  .lt-vs { cursor:col-resize; position:relative; touch-action:none; } .lt-vs::after { content:''; position:absolute; left:3px; top:50%; width:4px; height:44px; margin-top:-22px; border-radius:3px; background:var(--line); }\n  .lt-vs:hover::after, .lt-hs:hover::after, body.dragging .lt-vs::after, body.dragging .lt-hs::after { background:var(--club); }\n  .lt-hs { flex:0 0 9px; cursor:row-resize; position:relative; touch-action:none; border-top:1px solid var(--line); } .lt-hs::after { content:''; position:absolute; left:50%; top:2px; width:48px; height:4px; margin-left:-24px; border-radius:3px; background:var(--line); }\n  body.drag-v, body.drag-v * { cursor:col-resize !important; } body.drag-h, body.drag-h * { cursor:row-resize !important; }\n  body.dragging, body.dragging * { -webkit-user-select:none !important; user-select:none !important; }\n  .lt-ed.noout .lt-out { height:36px !important; overflow:hidden; }\n  .lt-tabs .sp { flex:1; } .lt-tabs .tgl { color:var(--club); font-weight:500; }\n  .lt-tv { border:1px dashed var(--line); border-radius:10px; padding:8px 11px; margin-top:12px; font-size:14px; line-height:1.6; }\n  .lt-tv b { font-family:var(--mono, ui-monospace), monospace; font-size:13px; font-weight:600; }\n  .lt-lib { border:1px solid #f0b4ae; background:#fdecea; color:#8a1c12; border-radius:10px; padding:10px 12px; } body.dark .lt-lib { background:#3a1715; color:#ffb4ae; border-color:#6b2a24; }\n  .lt-st { overflow:auto; border:1px solid var(--line); border-radius:12px; padding:14px 16px; background:var(--card); -webkit-user-select:none; user-select:none; }\n  .lt-st h3 { margin:0 0 2px; font-size:19px; line-height:1.3; }\n  .lt-st h4 { margin:16px 0 4px; font-size:14px; }\n  .lt-st .stem { font-size:15.5px; line-height:1.65; }\n  .lt-meta { display:flex; flex-wrap:wrap; gap:6px; margin:8px 0 10px; }\n  .lt-ex { border:1px solid var(--line); border-radius:10px; padding:8px 10px; margin-top:8px; }\n  .lt-ex > b { font-size:13px; }\n  .lt-io { display:grid; grid-template-columns:1fr 1fr; gap:8px; margin-top:6px; }\n  .lt-io pre, .lt-res pre { margin:0; font:13px/1.45 var(--mono, ui-monospace), Consolas, monospace; background:var(--bg); color:var(--ink); border:1px solid var(--line); border-radius:8px;\n    padding:7px 9px; white-space:pre-wrap; word-break:break-all; max-height:220px; overflow:auto; -webkit-user-select:text; user-select:text; }\n  .cap { font-size:12px; color:var(--mute); margin:0 0 3px; display:flex; justify-content:space-between; gap:6px; }\n  .cap button { border:0; background:none; color:var(--club); font-size:12px; padding:0; }\n  .ic { font-family:var(--mono, ui-monospace), monospace; font-size:.9em; background:var(--bg); border:1px solid var(--line); border-radius:5px; padding:0 4px; }\n  .lt-ed { display:flex; flex-direction:column; min-width:0; min-height:0; border:1px solid var(--line); border-radius:12px; overflow:hidden; background:var(--card); }\n  .lt-tb { display:flex; align-items:center; gap:8px; padding:6px 10px; border-bottom:1px solid var(--line); flex-wrap:wrap; font-size:13px; }\n  .lt-tb select { font:inherit; font-size:13.5px; padding:5px 8px; border-radius:8px; border:1px solid var(--line); background:var(--card); color:var(--ink); }\n  .lt-tb .sp, .lt-act .sp { flex:1; }\n  .lt-tb .btn, .lt-act .btn { padding:6px 12px; font-size:13.5px; }\n  .cedit { flex:1 1 auto; min-height:180px; position:relative; }\n  .cedit .CodeMirror { position:absolute; inset:0; height:auto; font:14px/1.5 var(--mono, ui-monospace), Consolas, monospace; background:var(--card); color:var(--ink); }\n  .cedit .CodeMirror-gutters { background:var(--bg); border-right:1px solid var(--line); }\n  .cedit .CodeMirror-linenumber { color:var(--mute); }\n  .cedit .CodeMirror-cursor { border-left-color:var(--ink); }\n  .cedit .CodeMirror-activeline-background { background:color-mix(in srgb, var(--club) 6%, transparent); }\n  .cedit .CodeMirror-selected, .cedit .CodeMirror-focused .CodeMirror-selected { background:color-mix(in srgb, var(--club) 22%, transparent); }\n  .cedit .CodeMirror-matchingbracket { color:inherit !important; background:color-mix(in srgb, var(--club) 25%, transparent); }\n  .cedit textarea.cfb { position:absolute; inset:0; width:100%; height:100%; border:0; resize:none; outline:none; padding:8px 12px; font:14px/1.5 var(--mono, ui-monospace), Consolas, monospace;\n    tab-size:4; white-space:pre; overflow:auto; background:var(--card); color:var(--ink); }\n  body.f1 .cedit .CodeMirror, body.f1 .cedit textarea.cfb { font-size:15.5px; } body.f2 .cedit .CodeMirror, body.f2 .cedit textarea.cfb { font-size:17px; }\n  .cm-s-default .cm-keyword { color:#8a3ffc; } .cm-s-default .cm-def { color:#0f62fe; } .cm-s-default .cm-string { color:#198038; } .cm-s-default .cm-number { color:#b45309; }\n  .cm-s-default .cm-comment { color:#6f7a86; font-style:italic; } .cm-s-default .cm-builtin { color:#0072c3; } .cm-s-default .cm-meta { color:#a2191f; } .cm-s-default .cm-variable-2 { color:#005d5d; }\n  body.dark .cm-s-default .cm-keyword { color:#c4a2ff; } body.dark .cm-s-default .cm-def { color:#78a9ff; } body.dark .cm-s-default .cm-string { color:#6fdc8c; } body.dark .cm-s-default .cm-number { color:#f1c21b; }\n  body.dark .cm-s-default .cm-comment { color:#8d99a6; } body.dark .cm-s-default .cm-builtin { color:#82cfff; } body.dark .cm-s-default .cm-meta { color:#ff8389; } body.dark .cm-s-default .cm-variable-2 { color:#3ddbd9; }\n  body.dark .cm-s-default .cm-variable, body.dark .cm-s-default .cm-operator, body.dark .cm-s-default .cm-property { color:var(--ink); }\n  body.dark .cm-s-default .cm-atom, body.dark .cm-s-default .cm-type, body.dark .cm-s-default .cm-variable-3 { color:#78a9ff; } body.dark .cap button { color:var(--club-l); }\n  .lt-cin { padding:0 10px 8px; }\n  .lt-cin textarea { width:100%; height:76px; resize:vertical; font:13px/1.45 var(--mono, ui-monospace), monospace; border:1px solid var(--line); border-radius:8px; padding:6px 8px; background:var(--bg); color:var(--ink); }\n  .lt-act { display:flex; align-items:center; gap:8px; padding:7px 10px; border-top:1px solid var(--line); flex-wrap:wrap; font-size:13px; }\n  .lt-act label { display:inline-flex; align-items:center; gap:5px; cursor:pointer; }\n  .lt-out { flex:0 0 auto; height:38%; min-height:36px; overflow:auto; }\n  .lt-tabs { display:flex; gap:2px; padding:0 8px; border-bottom:1px solid var(--line); position:sticky; top:0; background:var(--card); z-index:1; }\n  .lt-tabs button { border:0; background:none; padding:7px 10px; font-size:13px; color:var(--mute); border-bottom:2px solid transparent; }\n  .lt-tabs button.on { color:var(--ink); font-weight:600; border-bottom-color:var(--club); }\n  .lt-res { padding:10px 12px; }\n  .lt-res .mute { font-size:13px; }\n  .vd { display:inline-block; font-weight:600; padding:1px 8px; border-radius:6px; font-size:12.5px; white-space:nowrap; }\n  .vd.AC { background:#E3F5EA; color:#13693E; } .vd.WA { background:#FDE8E6; color:#A01D14; } .vd.TLE, .vd.MLE { background:#FFF1D6; color:#8A5300; }\n  .vd.RE, .vd.CE { background:#F1E8FD; color:#5B2A9E; } .vd.OK { background:var(--club-t); color:var(--club-d); } .vd.IE { background:#E7E9EC; color:#475569; }\n  body.dark .vd.AC { background:#123524; color:#7EE2A8; } body.dark .vd.WA { background:#3A1715; color:#FFB4AE; } body.dark .vd.TLE, body.dark .vd.MLE { background:#3A2A0D; color:#F5C46B; }\n  body.dark .vd.RE, body.dark .vd.CE { background:#2A2140; color:#C9B3F5; } body.dark .vd.IE { background:#26313D; color:#AEB8C2; }\n  .lt-sum { display:flex; align-items:center; gap:10px; flex-wrap:wrap; margin-bottom:8px; }\n  .lt-sum .sc { font:700 20px var(--mono, ui-monospace), monospace; }\n  .lt-chips { display:flex; flex-wrap:wrap; gap:4px; margin:2px 0 8px; }\n  .lt-chips span { min-width:28px; height:24px; padding:0 5px; border-radius:6px; font:600 11.5px/24px var(--mono, ui-monospace), monospace; text-align:center; }\n  .lt-t { border:1px solid var(--line); border-radius:9px; margin-top:6px; }\n  .lt-t > summary { padding:6px 10px; cursor:pointer; display:flex; gap:8px; align-items:center; flex-wrap:wrap; font-size:13.5px; }\n  .lt-t .bd { padding:2px 10px 10px; display:grid; gap:8px; }\n  .lt-t .two { display:grid; grid-template-columns:1fr 1fr; gap:8px; }\n  .lt-diff { font-size:13px; background:var(--warnb, #FFF3DB); color:#6B4300; border-radius:8px; padding:6px 9px; }\n  body.dark .lt-diff { background:#3A2A0D; color:#F5C46B; }\n  pre.lt-err { color:#A01D14; } body.dark pre.lt-err { color:#FFB4AE; }\n  .lt-wait { display:flex; align-items:center; gap:10px; color:var(--mute); font-size:13.5px; }\n  .lt-wait .spin { width:20px; height:20px; margin:0; }\n  table.lt-h { width:100%; border-collapse:collapse; font-size:13px; }\n  table.lt-h td, table.lt-h th { padding:5px 8px; border-bottom:1px solid var(--line); text-align:left; }\n  table.lt-h th { color:var(--mute); font-weight:500; }\n  .lt-best { font-size:13px; padding:4px 10px; border-radius:8px; background:var(--club-t); color:var(--club-d); font-weight:600; }\n  body.dark .lt-best { color:var(--club-l); }\n  @media (max-width:980px) { .lt, .lt.nost { grid-template-columns:1fr; height:auto; } .lt-vs { display:none; } .lt-st { max-height:46vh; } .lt-ed { height:78vh; } }\n\n  /* Làm mờ đề phía sau mọi màn che (khoá, tạm dừng, bắt bật toàn màn hình, thông báo…): không đọc được đề lúc bị khoá, nhìn cũng gọn mắt */\n  #scrExam .layout, #banner { transition:filter .28s ease, opacity .28s ease; }\n  body.hold #scrExam .layout, body.hold #banner { filter:blur(24px) saturate(.5); opacity:.4; pointer-events:none; -webkit-user-select:none; user-select:none; }\n  body.hold .ov { background:rgba(9,22,40,.45); }\n  body.hold .gate { background:rgba(15,21,28,.55); }\n  /* THI THỬ CỦA GIÁM THỊ */\n  #thuBar { position:fixed; left:12px; bottom:12px; z-index:80; display:flex; align-items:center; gap:6px; flex-wrap:wrap; max-width:calc(100vw - 24px);\n    background:#3b1f5e; color:#fff; border-radius:14px; padding:7px 10px; box-shadow:0 10px 30px rgba(0,0,0,.3); font-size:13px; }\n  #thuBar.min .tb-more { display:none; }\n  #thuBar b.tb-t { letter-spacing:.2px; }\n  #thuBar button, #thuBar select { font:inherit; font-size:12.5px; border:0; border-radius:9px; padding:5px 9px; cursor:pointer; background:rgba(255,255,255,.14); color:#fff; }\n  #thuBar select option { color:#111; }\n  #thuBar button:hover { background:rgba(255,255,255,.26); }\n  #thuBar .tb-g.on { background:#c2410c; } #thuBar .tb-g.off { background:#15803d; }\n  #thuBar .tb-n { background:#f59e0b; color:#111; border-radius:9px; padding:1px 7px; font-weight:700; margin-left:3px; }\n  #thuLog { position:fixed; left:12px; bottom:64px; z-index:81; width:min(460px, calc(100vw - 24px)); max-height:46vh; overflow:auto; background:var(--card); color:var(--ink);\n    border:1px solid var(--line); border-radius:14px; box-shadow:0 18px 50px rgba(0,0,0,.28); padding:12px 14px; font-size:13px; }\n  #thuLog li { margin:4px 0; }\n  body.acoff, body.acoff .lt-st { -webkit-user-select:text; user-select:text; }\n  body.hold .ov, body.hold .gate { -webkit-backdrop-filter:blur(8px); backdrop-filter:blur(8px); }\n  body.dark.hold .ov { background:rgba(5,8,12,.55); }\n  @media (prefers-reduced-motion:reduce) { #scrExam .layout, #banner { transition:none; } }\n</style>\n</head>\n<body>\n<div id=\"wm\"></div>\n<div id=\"ldbar\"></div>\n<section class=\"scr on\" id=\"scrBoot\"><div class=\"upd\"><div class=\"spin\"></div><h2 style=\"margin:6px 0\">Đang kết nối phòng thi…</h2><p class=\"mute\">Vui lòng chờ trong giây lát</p></div></section>\n\n<!-- ============ ĐĂNG NHẬP ============ -->\n<section class=\"scr\" id=\"scrLogin\">\n  <div class=\"lg\">\n    <aside class=\"lg-brand\">\n      <div class=\"lg-mark\"><div class=\"lg-logo b-logo\"></div><div><div class=\"lg-club b-name\">Phòng thi trực tuyến</div><div class=\"lg-khau b-khau\"></div></div></div>\n      <div class=\"lg-exam\"><h1 id=\"lgTitle\">Phòng thi trực tuyến</h1><p id=\"lgSub\">Nhập thông tin trên phiếu đăng nhập do giám thị phát</p></div>\n      <div class=\"lg-foot\"><span id=\"lgSeb\" class=\"chip\">Đang kiểm tra trình duyệt…</span><span id=\"lgVer\"></span></div>\n    </aside>\n    <main class=\"lg-form\"><div class=\"inner\">\n      <h2>Đăng nhập</h2>\n      <p class=\"lead\">Dùng số báo danh và mã truy cập in trên phiếu của bạn.</p>\n      <form id=\"lgForm\" autocomplete=\"off\" onsubmit=\"return doLogin(event)\">\n        <div class=\"fld\"><label for=\"lgSbd\">Số báo danh</label><input id=\"lgSbd\" autocapitalize=\"characters\" spellcheck=\"false\" required></div>\n        <div class=\"fld\"><label for=\"lgCode\">Mã truy cập</label><input id=\"lgCode\" autocapitalize=\"characters\" spellcheck=\"false\" maxlength=\"12\" required></div>\n        <div class=\"fld hidden\" id=\"lgRoomBox\"><label for=\"lgRoom\">Mã phòng thi <span class=\"mute\">(giám thị đọc khi bắt đầu)</span></label><input id=\"lgRoom\" autocapitalize=\"characters\" spellcheck=\"false\"></div>\n        <div id=\"lgErr\" class=\"err hidden\"></div>\n        <button class=\"btn pri big\" id=\"lgBtn\" type=\"submit\">Vào phòng thi</button>\n      </form>\n    </div></main>\n  </div>\n</section>\n\n<!-- ============ PHÒNG CHỜ ============ -->\n<section class=\"scr\" id=\"scrWait\">\n  <div class=\"brandbar\"><div class=\"bl b-logo\"></div><div><b class=\"b-name\"></b><br><span class=\"b-khau\"></span></div></div>\n  <div class=\"wrap\">\n    <div class=\"ticket\">\n      <div class=\"th\">\n        <div style=\"display:flex;align-items:center;gap:12px;flex-wrap:wrap\">\n          <div style=\"flex:1;min-width:240px\"><div class=\"mute\" id=\"wtUnit\"></div><h2 style=\"margin:2px 0 0;font-size:24px\" id=\"wtExam\"></h2></div>\n          <span class=\"chip\" id=\"wtSeb\"></span>\n        </div>\n      </div>\n      <div class=\"tb\">\n        <div class=\"grid2\">\n          <div class=\"kv\"><b>Họ và tên</b><span id=\"wtName\"></span></div>\n          <div class=\"kv\"><b>Số báo danh</b><span id=\"wtSbd\"></span></div>\n          <div class=\"kv\"><b>Lớp</b><span id=\"wtLop\"></span></div>\n          <div class=\"kv\"><b>Mã đề</b><span id=\"wtMd\"></span></div>\n          <div class=\"kv\"><b>Thời gian làm bài</b><span id=\"wtTime\"></span></div>\n          <div class=\"kv\"><b>Số câu, thang điểm</b><span id=\"wtQ\"></span></div>\n        </div>\n        <p class=\"mute\" style=\"margin:14px 0 0\">Thông tin chưa đúng? Báo giám thị trước khi làm bài.</p>\n      </div>\n    </div>\n    <div class=\"card\" style=\"margin-top:14px\">\n      <h3 style=\"margin:0 0 6px\">Quy định làm bài</h3>\n      <ul class=\"rules\" id=\"wtRules\"></ul>\n      <div id=\"wtGuide\" class=\"hint hidden\" style=\"white-space:pre-wrap\"></div>\n      <label style=\"display:flex;gap:8px;align-items:center;margin-top:10px;font-weight:500\"><input type=\"checkbox\" id=\"wtAgree\" onchange=\"updWait()\"> Tôi đã đọc và cam kết thực hiện đúng quy định.</label>\n    </div>\n    <div class=\"card\" style=\"display:flex;align-items:center;gap:14px;flex-wrap:wrap\">\n      <div style=\"flex:1;min-width:220px\" id=\"wtState\"><span class=\"pulse\"></span>Đang chờ giám thị mở đề…</div>\n      <button class=\"btn ghost\" onclick=\"logout()\">Đăng xuất</button>\n      <button class=\"btn ok big\" id=\"wtStart\" disabled onclick=\"startExam()\">Bắt đầu làm bài</button>\n    </div>\n  </div>\n</section>\n\n<!-- ============ LÀM BÀI ============ -->\n<section class=\"scr\" id=\"scrExam\">\n  <div class=\"bar\" id=\"exBar\">\n    <div class=\"bl b-logo\"></div>\n    <div class=\"ttl\"><span id=\"exTitle\"></span><small id=\"exSub\"></small></div>\n    <div class=\"sp\"></div>\n    <div class=\"sv\" id=\"sv\"><i></i><span id=\"svText\">Đã sẵn sàng</span></div>\n    <div class=\"tbox\" id=\"tbox\"><svg class=\"ring\" viewBox=\"0 0 36 36\"><circle class=\"trk\" cx=\"18\" cy=\"18\" r=\"15.5\"/><circle class=\"arc\" id=\"ringArc\" cx=\"18\" cy=\"18\" r=\"15.5\"/></svg><div class=\"timer\" id=\"timer\">--:--</div></div>\n    <div class=\"who\"><b id=\"exName\"></b><br><span id=\"exWho\"></span></div>\n    <button class=\"btn ico\" onclick=\"toggleDark()\" title=\"Giao diện sáng / tối\" aria-label=\"Giao diện sáng / tối\"><svg viewBox=\"0 0 24 24\" width=\"17\" height=\"17\" style=\"vertical-align:-3px\"><circle cx=\"12\" cy=\"12\" r=\"8.5\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\"/><path d=\"M12 3.5a8.5 8.5 0 0 1 0 17z\" fill=\"currentColor\"/></svg></button>\n    <span class=\"fsz\" title=\"Cỡ chữ\"><button onclick=\"fontSize(-1)\">A−</button><button onclick=\"fontSize(1)\">A+</button></span>\n    <button class=\"btn ask\" onclick=\"askProctor()\" title=\"Gửi câu hỏi cho giám thị ngay trong trang thi\">💬 Hỏi giám thị</button>\n    <button class=\"btn ok\" onclick=\"askSubmit()\">Nộp bài</button>\n  </div>\n  <div class=\"tline\" id=\"tline\"><i></i></div>\n  <div class=\"layout\">\n    <main>\n      <div class=\"qcard\" id=\"qcard\"></div>\n    </main>\n    <aside class=\"side\">\n      <div class=\"card\">\n        <div style=\"display:flex;justify-content:space-between;align-items:baseline\"><b>Tiến độ</b><span class=\"mute\"><b id=\"pgN\">0</b>/<span id=\"pgT\">0</span> câu</span></div>\n        <div class=\"segs\" id=\"pgSeg\"></div><i id=\"pgBar\" class=\"hidden\"></i>\n        <div id=\"navBox\"></div>\n        <div class=\"legend\"><span>Chưa làm</span><span class=\"la\">Đã làm</span><span class=\"lf\">Đánh dấu</span></div>\n        <p class=\"mute\" style=\"margin:12px 0 0\">Phím tắt: <kbd>A</kbd>–<kbd>D</kbd> chọn đáp án · <kbd>←</kbd> <kbd>→</kbd> chuyển câu</p>\n      </div>\n    </aside>\n  </div>\n</section>\n\n<!-- ============ KẾT THÚC ============ -->\n<section class=\"scr\" id=\"scrDone\">\n  <div class=\"brandbar\"><div class=\"bl b-logo\"></div><div><b class=\"b-name\"></b><br><span class=\"b-khau\"></span></div></div>\n  <div class=\"wrap\" style=\"max-width:640px;padding-top:48px\">\n    <div class=\"card done\" id=\"doneBox\"></div>\n  </div>\n</section>\n\n<div id=\"gate\" class=\"gate hidden\"><div class=\"box\" id=\"gateBox\"></div></div>\n<div class=\"blurmsg\">Cửa sổ thi không còn được chọn — quay lại để tiếp tục</div>\n<div id=\"ov\" class=\"ov hidden\"><div class=\"box\" id=\"ovBox\"></div></div>\n<div id=\"banner\" class=\"banner hidden\"></div>\n<div id=\"toast\"></div>\n<div id=\"thuBar\" class=\"hidden\"></div><div id=\"thuLog\" class=\"hidden\"></div>\n\n<script>\n'use strict';\n/* =========================================================== TRẠNG THÁI */\nconst S = { tok: '', ky: '', sbd: '', me: null, exam: null, pkg: null, items: [], ans: {}, flags: {}, cur: 0, seq: 0, savedSeq: 0,\n  ev: [], off: 0, deadline: 0, inflight: false, fails: 0, phase: 'login', locked: false, vpLocal: 0, vpMax: 0, submitting: false,\n  saveTimer: null, waitTimer: null, tick: null, lastSaved: 0, fsOn: false, hideAt: 0, blurAt: 0, autoDone: false,\n  lt: {}, stash: {}, ltHist: {}, ltLast: {}, ltLang: 'py', clips: [], cm: null, cmTa: null };\nconst $ = (id) => document.getElementById(id);\n/** Thi thử của giám thị, đang TẮT chống gian lận → không ghi vi phạm, không khoá, không bắt toàn màn hình, cho sao chép / dán */\nconst ACOFF = () => !!(S.thu && !S.thu.guard);\nconst esc = (s) => String(s == null ? '' : s).replace(/[&<>\"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '\"': '&quot;', \"'\": '&#39;' }[c]));\nconst L = 'ABCDEFGHIJ';\nconst now = () => Date.now() + S.off;\nconst jitter = (a, b) => a + Math.random() * (b - a);\nconst sleep = (ms) => new Promise((r) => setTimeout(r, ms));\n\n/* =========================================================== GỌI MÁY CHỦ */\nS.calls = 0;\nfunction ldbar(d) {\n  S.calls = Math.max(0, S.calls + d);\n  clearTimeout(S.ldT);\n  if (S.calls > 0) S.ldT = setTimeout(() => { if (S.calls > 0) $('ldbar').classList.add('on'); }, 700);   // chỉ hiện khi chậm > 0,7 s\n  else $('ldbar').classList.remove('on');\n}\nfunction call(name, args, timeoutMs) {\n  ldbar(1);\n  return new Promise((res0, rej0) => {\n    const res = (v) => { ldbar(-1); res0(v); }, rej = (e) => { ldbar(-1); rej0(e); };\n    let done = false;\n    const t = setTimeout(() => { if (!done) { done = true; const e = new Error('Hết thời gian chờ máy chủ'); e.code = 'NET'; rej(e); } }, timeoutMs || 45000);\n    try {\n      google.script.run.withSuccessHandler((s) => {\n        if (done) return; done = true; clearTimeout(t);\n        let r; try { r = JSON.parse(s); } catch (x) { const e = new Error('Phản hồi lỗi'); e.code = 'NET'; return rej(e); }\n        if (r.ok) { if (r.data && r.data.now) S.off = r.data.now - Date.now(); res(r.data); }\n        else { const e = new Error(r.error); e.code = r.code; rej(e); }\n      }).withFailureHandler((x) => {\n        if (done) return; done = true; clearTimeout(t);\n        const e = new Error((x && x.message) || 'Mất kết nối'); e.code = /too many|simultaneous|invoked/i.test(e.message) ? 'BUSY' : 'NET'; rej(e);\n      }).PT_api(name, args);\n    } catch (x) { done = true; clearTimeout(t); const e = new Error('Không kết nối được máy chủ'); e.code = 'NET'; rej(e); }\n  });\n}\n/** Thử lại khi mạng/máy chủ bận (lùi dần + ngẫu nhiên để không dồn cục) */\nasync function callRetry(name, args, tries, onWait) {\n  let k = 0;\n  for (;;) {\n    try { return await call(name, args); }\n    catch (e) {\n      k++;\n      if (!['NET', 'BUSY'].includes(e.code) || k >= (tries || 6)) throw e;\n      const d = Math.min(30000, 1500 * Math.pow(1.8, k)) * jitter(0.7, 1.3);\n      if (onWait) onWait(k, d);\n      await sleep(d);\n    }\n  }\n}\n\n/* =========================================================== LƯU TRÊN MÁY (phòng tải lại trang / mất mạng) */\nconst LS = {\n  get(k) { try { return JSON.parse(localStorage.getItem(k) || 'null'); } catch (e) { return null; } },\n  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { } },\n  del(k) { try { localStorage.removeItem(k); } catch (e) { } }\n};\nconst lkey = () => 'pt:' + S.ky + ':' + S.sbd + ':' + (S.att || '0');\n/* Phiên được giữ trên ĐỊA CHỈ TRANG (?k=&s=&t=) — SEB/Safari không giữ bộ nhớ của khung Apps Script khi tải lại trang */\nfunction urlSet(p) { try { google.script.history.replace(null, p, ''); } catch (e) { } }\nfunction urlClear() { urlSet({}); }\nfunction urlGet() {\n  return new Promise((res) => {\n    let done = false; const fin = (v) => { if (!done) { done = true; res(v || {}); } };\n    try { google.script.url.getLocation((l) => fin(l && l.parameter)); } catch (e) { fin({}); }\n    setTimeout(() => fin({}), 2500);\n  });\n}\nfunction persist() { if (S.ky) LS.set(lkey(), { ans: S.ans, flags: S.flags, seq: S.seq, cur: S.cur, t: Date.now(), stash: S.stash, ltHist: S.ltHist }); }\n\n/* =========================================================== TIỆN ÍCH GIAO DIỆN */\nfunction show(id) { document.querySelectorAll('.scr').forEach((s) => s.classList.toggle('on', s.id === id)); window.scrollTo(0, 0); }\nfunction toast(t, kind, ms) { const d = document.createElement('div'); d.className = kind || ''; d.textContent = t; $('toast').appendChild(d); setTimeout(() => d.remove(), ms || 4500); }\nfunction banner(html, kind, closable) {\n  const b = $('banner');\n  if (!html) { b.classList.add('hidden'); return; }\n  b.className = 'banner ' + (kind || 'info'); b.innerHTML = html + (closable ? '<button class=\"x\" onclick=\"banner()\">×</button>' : '');\n}\nfunction overlay(html) {\n  if (!html) {\n    // đóng lớp phủ tạm (tin nhắn, hỏi giám thị…) → nếu bài đang tạm dừng / bị khoá thì hiện lại màn đó, thí sinh không bị \"kẹt\"\n    if (S.phase === 'exam' && (S.paused || S.locked)) { drawHold(); return; }\n    $('ov').classList.add('hidden'); return;\n  }\n  $('ovBox').innerHTML = html; $('ov').classList.remove('hidden');\n}\n/** Màn \"Đang cập nhật…\" (~1,5 giây) trước khi áp dụng thay đổi do giám thị thực hiện — thí sinh biết sắp có thay đổi, không phải lỗi/treo */\nfunction updating(title, sub, fn, ms) {\n  ms = ms || 1600;\n  $('ovBox').innerHTML = '<div class=\"upd\" style=\"--d:' + (ms / 1000) + 's\"><div class=\"spin\"></div><h2 style=\"margin:8px 0 4px\">' + esc(title) + '</h2><p class=\"mute\">' + esc(sub || 'Vui lòng chờ, không đóng cửa sổ.') + '</p><div class=\"pbar\"><i></i></div></div>';\n  $('ov').classList.remove('hidden');\n  setTimeout(fn, ms);\n}\nfunction drawHold() {\n  const html = S.paused\n    ? '<div style=\"text-align:center\"><div style=\"font-size:46px\">⏸</div><h2>Giám thị đã tạm dừng bài thi</h2><p>Đồng hồ <b>đang dừng</b> — thời gian dừng được bù lại đầy đủ. Bài làm của bạn được giữ nguyên.</p><p class=\"mute\">Ngồi yên tại chỗ. Trang sẽ tự tiếp tục khi giám thị cho phép.</p></div>'\n    : S.strict\n    ? '<div style=\"text-align:center\"><div class=\"lock-ic\">🔒</div><h2>Bài thi đã bị khoá</h2><p>Hệ thống ghi nhận bạn vừa <b>' + esc(S.lockWhy || 'rời khỏi màn hình thi') + '</b>. Giơ tay để giám thị tới máy và nhập mã mở khoá.</p>' +\n      '<div class=\"ulrow\"><input id=\"ulCode\" type=\"password\" inputmode=\"numeric\" autocomplete=\"off\" maxlength=\"12\" placeholder=\"Mã mở khoá của giám thị\" onkeydown=\"if(event.key===\\'Enter\\')doUnlock()\"><button class=\"btn pri\" id=\"ulBtn\" onclick=\"doUnlock()\">Mở khoá</button></div>' +\n      '<div id=\"ulErr\" class=\"err hidden\" style=\"margin-top:10px\"></div><p class=\"mute\" style=\"margin-top:12px\">Bài làm vẫn được giữ nguyên. Giám thị cũng có thể mở từ máy giám thị.</p></div>'\n    : '<div style=\"text-align:center\"><div class=\"lock-ic\">🔒</div><h2>Bài thi đang tạm khoá</h2><p>' + (S.lockWhy ? 'Hệ thống ghi nhận bạn vừa <b>' + esc(S.lockWhy) + '</b>.' : 'Bạn đã rời khỏi màn hình thi quá số lần cho phép.') + ' Hãy giơ tay báo giám thị để được mở khoá.</p><p class=\"mute\">Bài làm của bạn vẫn được giữ nguyên. Trang sẽ tự mở khi giám thị cho phép.</p></div>';\n  const fsBtn = !isSeb() && fsUsable() && !document.fullscreenElement\n    ? '<div style=\"text-align:center;margin-top:14px\"><button class=\"btn pri\" onclick=\"tryFullscreen()\">⛶ Bật lại toàn màn hình</button><p class=\"mute\" style=\"margin-top:6px\">Phải ở chế độ toàn màn hình trong suốt thời gian ' + (S.paused ? 'tạm dừng' : 'chờ mở khoá') + '. Thoát toàn màn hình, chuyển tab hay mở ứng dụng khác lúc này vẫn bị ghi lại' + (S.paused ? ' và <b>tính vi phạm</b>' : '') + '.</p></div>' : '';\n  $('ovBox').innerHTML = html + fsBtn; $('ov').classList.remove('hidden');\n}\nfunction fontSize(d) {\n  let f = Number(LS.get('pt:font') || 0); f = Math.max(0, Math.min(2, f + d)); LS.set('pt:font', f);\n  document.body.classList.remove('f1', 'f2'); if (f) document.body.classList.add('f' + f);\n  if (S.cm) setTimeout(() => S.cm.refresh(), 30);\n}\n(function () { const f = Number(LS.get('pt:font') || 0); if (f) document.body.classList.add('f' + f); })();\nfunction fmtT(ms) {\n  if (ms < 0) ms = 0; const s = Math.floor(ms / 1000), h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), x = s % 60, p = (n) => String(n).padStart(2, '0');\n  return (h ? h + ':' + p(m) : p(m)) + ':' + p(x);\n}\nfunction clock(t) { const d = new Date(t); return d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }); }\nfunction isSeb() { return /SEB\\//.test(navigator.userAgent); }\n/** Mã cấu hình (Config Key) mà SEB tính từ file .seb — qua SEB JavaScript API (SEB 3.4+ Windows, 3.0+ macOS) */\nasync function sebInfo() {\n  const o = {};\n  try {\n    const s = window.SafeExamBrowser;\n    if (!s) return o;\n    const sec = s.security || {};\n    if (!sec.configKey && typeof sec.updateKeys === 'function') {\n      await new Promise((r) => { let d = false; const f = () => { if (!d) { d = true; r(); } }; try { sec.updateKeys(f); } catch (e) { f(); } setTimeout(f, 1500); });\n    }\n    o.ck = String(sec.configKey || '').slice(0, 128);\n    o.sv = String(s.version || sec.appVersion || '').slice(0, 60);\n  } catch (e) { }\n  return o;\n}\nfunction math(el, n) {\n  n = n || 0;\n  if (!window.renderMathInElement) { if (n < 25) setTimeout(() => math(el, n + 1), 300); return; }\n  try { renderMathInElement(el, { delimiters: [{ left: '$$', right: '$$', display: true }, { left: '$', right: '$', display: false }], throwOnError: false, ignoredTags: ['script', 'noscript', 'style', 'textarea', 'pre', 'code', 'option', 'select'] }); } catch (e) { }\n}\n\n/* ---- tô màu code ---- */\nconst KW = { python: 'False None True and as assert async await break class continue def del elif else except finally for from global if import in is lambda nonlocal not or pass raise return try while with yield match case',\n  js: 'var let const function return if else for while do break continue new class extends import export from default try catch finally throw typeof instanceof in of this null undefined true false async await switch case',\n  c: 'int float double char void long short unsigned signed if else for while do return break continue struct switch case default const static include define sizeof typedef enum class public private protected new delete namespace using std true false bool' };\nconst BI = 'print len range list dict set tuple int float str bool input open enumerate zip map filter sum min max abs sorted reversed type isinstance super np pd plt self';\nfunction hl(code, lang) {\n  lang = String(lang || '').toLowerCase();\n  const kw = new Set((KW[lang] || (/^(py|python|python3)$/.test(lang) || !lang ? KW.python : /^(js|javascript|ts|java|c#|cs)$/.test(lang) ? KW.js : KW.c)).split(' '));\n  const bi = new Set(BI.split(' '));\n  const re = /(\"\"\"[\\s\\S]*?\"\"\"|'''[\\s\\S]*?'''|\"(?:\\\\.|[^\"\\\\\\n])*\"|'(?:\\\\.|[^'\\\\\\n])*'|#.*|\\/\\/.*|\\b\\d+(?:\\.\\d+)?(?:e[-+]?\\d+)?\\b|\\b[A-Za-z_]\\w*\\b)/g;\n  let out = '', last = 0, m;\n  while ((m = re.exec(code))) {\n    out += esc(code.slice(last, m.index)); const t = m[0]; last = m.index + t.length;\n    let c = '';\n    if (/^(\"\"\"|'''|\"|')/.test(t)) c = 'tk-s'; else if (/^(#|\\/\\/)/.test(t)) c = (t[0] === '#' && /^(c|cpp|c\\+\\+)$/.test(lang) && /^#\\s*(include|define)/.test(t)) ? 'tk-k' : 'tk-c';\n    else if (/^\\d/.test(t)) c = 'tk-n'; else if (kw.has(t)) c = 'tk-k'; else if (bi.has(t)) c = 'tk-b'; else if (code[last] === '(') c = 'tk-f';\n    out += c ? '<span class=\"' + c + '\">' + esc(t) + '</span>' : esc(t);\n  }\n  return out + esc(code.slice(last));\n}\nfunction rich(s) {\n  return String(s == null ? '' : s).replace(/\\r\\n?/g, '\\n').split(/(```[\\w+#.-]*[ \\t]*\\n[\\s\\S]*?\\n[ \\t]*```)/).map((p, i, arr) => {\n    if (i % 2 === 0) return esc(i > 0 ? p.replace(/^\\n/, '') : p).replace(/\\n$/, i < arr.length - 1 ? '' : '\\n');\n    const m = p.match(/^```([\\w+#.-]*)[ \\t]*\\n([\\s\\S]*?)\\n[ \\t]*```$/);\n    if (!m) return esc(p);\n    const code = m[2].replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');\n    return '<pre class=\"code\"' + (m[1] ? ' data-lang=\"' + esc(m[1]) + '\"' : '') + '><code>' + hl(code, m[1]) + '</code></pre>';\n  }).join('');\n}\nfunction media(list, video, audio) {\n  let h = '';\n  (list || []).forEach((m) => { h += m.src ? '<img src=\"' + m.src + '\" alt=\"Hình minh hoạ\" draggable=\"false\">' : '<div class=\"bad\">[Không tải được hình — báo giám thị]</div>'; });\n  if (video) {\n    const y = String(video).match(/(?:youtu\\.be\\/|v=|embed\\/)([\\w-]{11})/);\n    h += y ? '<iframe src=\"https://www.youtube-nocookie.com/embed/' + y[1] + '?rel=0\" allowfullscreen></iframe>' : '<div class=\"mute\">Video: ' + esc(video) + '</div>';\n  }\n  if (audio) h += /\\.(mp3|wav|ogg|m4a)(\\?|$)/i.test(audio) ? '<audio controls src=\"' + esc(audio) + '\"></audio>' : '<div class=\"mute\">🎧 Âm thanh: ' + esc(audio) + '</div>';\n  return h ? '<div class=\"media\">' + h + '</div>' : '';\n}\n\n/* =========================================================== ĐĂNG NHẬP */\n/* =========================================================== NHẬN DIỆN CLB */\nfunction mix(hex, w, t) {   // trộn màu hex với trắng/đen (t = 0..1)\n  const n = parseInt(hex.slice(1), 16), c = [n >> 16, (n >> 8) & 255, n & 255], o = w ? 255 : 0;\n  return '#' + c.map((v) => Math.round(v + (o - v) * t).toString(16).padStart(2, '0')).join('');\n}\nfunction initials(s) { const w = String(s || '').trim().split(/\\s+/).filter(Boolean); return (w.length > 1 ? w[0][0] + w[w.length - 1][0] : (w[0] || 'PT').slice(0, 2)).toUpperCase(); }\nfunction applyBrand(b) {\n  b = b || window.PT_BRAND || LS.get('pt:brand') || {};     // PT_BRAND: máy chủ nhúng sẵn vào trang → tên, logo hiện ngay từ giây đầu\n  if (b && (b.ten || b.logo || b.mau)) LS.set('pt:brand', b);\n  // màu cố định xanh navy (đặt sẵn trong CSS) → không còn chớp màu khi mở trang\n  const name = b.ten || 'Phòng thi trực tuyến';\n  document.querySelectorAll('.b-name').forEach((x) => { x.textContent = name; });\n  document.querySelectorAll('.b-khau').forEach((x) => { x.textContent = b.khau || ''; });\n  document.querySelectorAll('.b-logo').forEach((x) => {\n    x.textContent = '';\n    if (b.logo) { const im = new Image(); im.alt = name; im.decoding = 'async'; im.src = b.logo; x.appendChild(im); } else x.textContent = initials(b.ten || 'Phòng thi');\n  });\n  if (b.ten) document.title = b.ten + ' — Phòng thi';\n}\napplyBrand();\nfunction toggleDark() { const on = !document.body.classList.contains('dark'); document.body.classList.toggle('dark', on); LS.set('pt:dark', on ? 1 : 0); }\nif (LS.get('pt:dark')) document.body.classList.add('dark');\nasync function bootLogin() {\n  show('scrLogin');\n  $('lgSeb').className = 'chip ' + (isSeb() ? 'ok' : 'warn');\n  $('lgSeb').textContent = isSeb() ? '✓ Safe Exam Browser' : 'Trình duyệt thường';\n  try {\n    const r = await callRetry('info', [], 4);\n    $('lgVer').textContent = 'v' + r.v;\n    if (r.brand) applyBrand(r.brand);\n    const open = r.exams;\n    if (open.length === 1) { $('lgTitle').textContent = open[0].ten; $('lgSub').textContent = open[0].donVi || 'Nhập thông tin trên phiếu đăng nhập'; }\n    if (open.some((e) => e.maPhong)) $('lgRoomBox').classList.remove('hidden');\n    if (!open.length) { $('lgSub').textContent = 'Hiện chưa có kỳ thi nào được mở.'; }\n  } catch (e) { $('lgSub').textContent = 'Chưa kết nối được máy chủ — kiểm tra mạng.'; }\n  $('lgSbd').focus();\n}\n\nasync function doLogin(ev) {\n  ev.preventDefault();\n  const btn = $('lgBtn'); btn.disabled = true; btn.textContent = 'Đang kiểm tra…'; $('lgErr').classList.add('hidden');\n  try {\n    const last = LS.get('pt:last') || {};\n    const r = await callRetry('login', [$('lgSbd').value, $('lgCode').value, $('lgRoom').value,\n      Object.assign({ ua: navigator.userAgent, scr: screen.width + 'x' + screen.height, tok: last.tok || '' }, await sebInfo())], 5);\n    enter(r);\n  } catch (e) {\n    $('lgErr').textContent = e.message; $('lgErr').classList.remove('hidden');\n    if (e.code === 'BAD_ROOM') $('lgRoomBox').classList.remove('hidden');\n  } finally { btn.disabled = false; btn.textContent = 'Vào phòng thi'; }\n  return false;\n}\n\nfunction enter(r, fromResume) {\n  if (r.brand) applyBrand(r.brand);\n  S.tok = r.tok; S.ky = r.ky; S.sbd = r.sbd; S.me = r; S.exam = r.exam; S.vpMax = r.exam.viPhamToiDa || 0; S.att = r.att || '0';\n  S.thu = r.thu || null;\n  if (S.thu) { const g = LS.get('pt:thuG:' + r.ky); if (g === 0 || g === 1) S.thu.guard = !!g; thuBar(); }\n  LS.set('pt:last', { tok: r.tok, ky: r.ky, sbd: r.sbd, me: r });\n  urlSet({ k: r.ky, s: r.sbd, t: r.tok });\n  // Đăng nhập mới: bài lấy từ MÁY CHỦ (không tin bản cũ trên máy — có thể là lượt thi đã bị huỷ).\n  // Chỉ khi tải lại trang giữa giờ mới dùng bản trên máy (có thể mới hơn bản tự lưu vài giây).\n  const loc = fromResume ? LS.get(lkey()) : null;\n  if (!fromResume) { try { Object.keys(localStorage).filter((k) => k.indexOf('pt:' + r.ky + ':' + r.sbd + ':') === 0).forEach((k) => localStorage.removeItem(k)); } catch (e) { } }\n  S.ans = {}; S.flags = {}; S.seq = 0; S.cur = 0;\n  S.stash = {}; S.ltHist = {}; S.ltLast = {};\n  if (loc) { S.ans = loc.ans || {}; S.flags = loc.flags || {}; S.seq = loc.seq || 0; S.cur = loc.cur || 0; S.stash = loc.stash || {}; S.ltHist = loc.ltHist || {}; }\n  watermark();\n  showWait();\n}\n\nfunction logout() { LS.del('pt:last'); urlClear(); clearTimeout(S.waitTimer); setTimeout(() => location.reload(), 300); }\n\n/* =========================================================== PHÒNG CHỜ */\nfunction showWait() {\n  const r = S.me, e = S.exam;\n  if (S.thu && S.thu.done) { thuDone(); return; }\n  S.phase = 'wait';\n  $('wtUnit').textContent = e.donVi || ''; $('wtExam').textContent = e.ten;\n  $('wtName').textContent = r.hoTen; $('wtSbd').textContent = r.sbd; $('wtLop').textContent = r.lop || '—'; $('wtMd').textContent = r.maDe;\n  $('wtTime').textContent = e.thoiGian ? e.thoiGian + ' phút' + (e.tinhGio === 'CHUNG' ? ' (tính chung từ lúc mở đề)' : ' (tính từ lúc bạn bấm Bắt đầu)') : 'Không giới hạn';\n  $('wtQ').textContent = (e.soCau || '?') + ' câu · ' + (e.tongDiem || '?') + ' điểm';\n  $('wtSeb').className = 'chip ' + (r.seb ? 'ok' : ''); $('wtSeb').textContent = r.seb ? '✓ Safe Exam Browser' : 'Trình duyệt thường';\n  const rules = [\n    'Bài làm được <b>tự động lưu</b> lên máy chủ khoảng 15 giây/lần. Mất mạng, lỡ tải lại trang hay hỏng máy cũng không mất bài — tải lại trang hoặc đăng nhập máy khác để làm tiếp.',\n    'Có câu hỏi? Bấm <b>💬 Hỏi giám thị</b> ngay trên trang thi. Cần chữ to hơn: nút <b>A+</b>.',\n    'Đồng hồ do máy chủ tính. Hết giờ hệ thống <b>tự nộp bài</b>.',\n    'Không rời khỏi màn hình thi (chuyển tab, mở ứng dụng khác, thu nhỏ cửa sổ). Mọi lần rời màn hình đều được <b>ghi lại</b>' +\n      (S.vpMax ? '; rời quá <b>' + S.vpMax + ' lần</b> bài thi sẽ bị khoá cho tới khi giám thị mở.' : '.'),\n    'Không sao chép nội dung đề. Câu nhiều đáp án / Đúng–Sai phải đúng toàn bộ mới được điểm; sai không bị trừ điểm.',\n    'Có thể đánh dấu 🚩 câu cần xem lại và chuyển qua lại giữa các câu bất cứ lúc nào trước khi nộp.'\n  ];\n  if (e.nghiemNgat && !isSeb()) rules.unshift('<b>Chế độ nghiêm ngặt:</b> làm bài ở <b>toàn màn hình</b>, chỉ <b>1 màn hình</b>. Thoát toàn màn hình, chuyển tab, mở ứng dụng khác → bài <b>khoá ngay</b>, chỉ giám thị mở bằng mã tại máy. Hãy tắt mọi ứng dụng khác trước khi bắt đầu.');\n  $('wtRules').innerHTML = rules.map((x) => '<li>' + x + '</li>').join('');\n  if (e.huongDan) { $('wtGuide').textContent = e.huongDan; $('wtGuide').classList.remove('hidden'); }\n  show('scrWait');\n  if (e.thongBao) banner('📢 ' + esc(e.thongBao), 'info', true);\n  setOpen(e.mo);\n  if (e.mo && (e.started || e.tinhGio === 'CHUNG')) { $('wtAgree').checked = true; startExam(!!e.started); return; }\n  if (!e.mo) pollWait();\n}\nfunction setOpen(open) {\n  S.exam.mo = open;\n  $('wtState').innerHTML = open ? '<b style=\"color:var(--ok)\">● Đề đã mở.</b> Bấm \"Bắt đầu làm bài\" khi bạn sẵn sàng.' : '<span class=\"pulse\"></span>Đang chờ giám thị mở đề… (trang tự cập nhật)';\n  updWait();\n}\nfunction updWait() { $('wtStart').disabled = !(S.exam && S.exam.mo && $('wtAgree').checked); }\nasync function pollWait() {\n  clearTimeout(S.waitTimer);\n  if (S.phase !== 'wait') return;\n  try {\n    const r = await call('wait', [S.tok, S.ky, S.sbd]);\n    if (r.msg) banner('📢 ' + esc(r.msg), 'info', true);\n    if (r.dong) { overlay('<h2>Kỳ thi đã kết thúc</h2><p>Liên hệ giám thị nếu bạn chưa làm bài.</p>'); return; }\n    if (r.mo) {\n      setOpen(true); toast('Đề đã được mở!');\n      // tính giờ CHUNG: đồng hồ đã chạy cho cả phòng → tự vào bài để không mất giờ\n      if (S.exam.tinhGio === 'CHUNG') { $('wtAgree').checked = true; setTimeout(() => startExam(false), jitter(500, 4000)); }\n      return;\n    }\n  } catch (e) { if (handleFatal(e)) return; }\n  S.waitTimer = setTimeout(pollWait, jitter(7000, 11000));\n}\n\n/* =========================================================== BẮT ĐẦU */\nasync function startExam(resume) {\n  $('wtStart').disabled = true; $('wtStart').textContent = 'Đang tải đề…';\n  clearTimeout(S.waitTimer);\n  try {\n    if (!resume) await sleep(jitter(0, 1500));       // dàn đều yêu cầu khi cả phòng bấm cùng lúc\n    if (!resume && !ACOFF()) tryFullscreen();\n    const r = await callRetry('start', [S.tok, S.ky, S.sbd], 8, (k) => { $('wtStart').textContent = 'Máy chủ bận, thử lại lần ' + k + '…'; });\n    S.pkg = JSON.parse(r.pkg); S.items = S.pkg.items; S.deadline = r.deadline || 0; S.locked = !!r.locked; S.vpMax = r.viPhamToiDa || 0; S.strict = !!r.nghiemNgat && !isSeb(); S.chongAI = r.chongAI || 'KHOA'; document.body.classList.toggle('strict', S.strict);\n    S.vpLocal = r.viPham || 0;\n    if (r.att !== undefined && String(r.att) !== String(S.att)) { S.att = String(r.att); }\n    if (r.fresh) { LS.del(lkey()); S.ans = {}; S.flags = {}; S.seq = 0; S.cur = 0; S.stash = {}; S.ltHist = {}; S.ltLast = {}; }\n    S.lt = r.lt || {};\n    { const dk = 'pt:dc:' + S.ky + ':' + S.sbd, dc = LS.get(dk); if (dc && dc.length) { S.ev = (S.ev || []).concat(dc); LS.del(dk); } }\n    if (S.items.some(isLt)) loadCM();                   // bài lập trình: tải trình soạn code ngay   // lượt thi mới: không dùng bài cũ trên máy\n    if (r.saved && r.saved.a && (r.saved.seq || 0) > (S.seq || 0)) { S.ans = r.saved.a; S.seq = r.saved.seq; }\n    S.savedSeq = r.saved ? r.saved.seq || 0 : 0;\n    S.cur = Math.min(S.cur || 0, S.items.length - 1);\n    S.phase = 'exam';\n    S.exam.started = true; LS.set('pt:last', { tok: S.tok, ky: S.ky, sbd: S.sbd, me: S.me });\n    renderShell(); go(S.cur);\n    show('scrExam');\n    startTimers();\n    if (r.msg) banner('📢 ' + esc(r.msg), 'info', true);\n    if (S.locked) lockScreen();\n    if (r.paused) setPaused(true);\n    if (r.timeUp) onTimeUp();\n    if (S.seq > S.savedSeq) scheduleSave(2000);\n  } catch (e) {\n    if (handleFatal(e)) return;\n    toast(e.message, 'e', 7000);\n    $('wtStart').textContent = 'Bắt đầu làm bài'; updWait();\n    if (e.code === 'NOT_OPEN') { setOpen(false); pollWait(); }\n  }\n}\nfunction tryFullscreen() {\n  if (isSeb()) return;                                  // SEB đã khoá toàn màn hình\n  const el = document.documentElement;\n  try {\n    const p = el.requestFullscreen && el.requestFullscreen();\n    if (p && p.then) p.then(() => { S.fsOn = true; S.fsFail = 0; strictGate(); }).catch(() => { S.fsFail = (S.fsFail || 0) + 1; strictGate(); });\n    else if (!el.requestFullscreen) S.fsFail = 9;\n  } catch (e) { S.fsFail = (S.fsFail || 0) + 1; }\n}\n\n/* =========================================================== DỰNG GIAO DIỆN THI */\nfunction renderShell() {\n  const p = S.pkg, me = S.me;\n  $('exTitle').textContent = p.ten || S.exam.ten; $('exSub').textContent = 'Mã đề ' + p.maDe + ' · ' + p.soCau + ' câu · ' + p.tongDiem + ' điểm';\n  $('exName').textContent = me.hoTen; $('exWho').textContent = 'SBD ' + me.sbd + (me.lop ? ' · ' + me.lop : '');\n  $('pgT').textContent = S.items.length;\n  let h = '';\n  p.sections.forEach((s) => {\n    if (!S.items.some((it) => it.phan === s.phan)) return;      // phần không có câu (kỳ thi chỉ lập trình)\n    h += '<div class=\"secl\">Phần ' + esc(s.phan) + ' · ' + esc(s.ten) + '</div><div class=\"nav\">';\n    S.items.forEach((it, i) => { if (it.phan === s.phan) h += '<button id=\"nv' + i + '\" onclick=\"go(' + i + ')\">' + it.stt + '</button>'; });\n    h += '</div>';\n  });\n  $('navBox').innerHTML = h;\n  $('pgSeg').innerHTML = S.items.map((it, i) => '<i id=\"sg' + i + '\"></i>').join('');\n  updNav();\n}\nfunction answered(it) {\n  if (isLt(it)) { const st = ltSt(it); return !!(st && st.n) || ltWritten(it); }\n  const v = S.ans[it.k];\n  if (v == null || v === '') return false;\n  if (Array.isArray(v)) return it.dang === 'NHIEU_DA' ? v.length > 0 : v.some((x) => x != null && x !== '');\n  return true;\n}\nfunction complete(it) {\n  if (isLt(it)) { const st = ltSt(it); return !!(st && st.n); }\n  const v = S.ans[it.k];\n  if (!answered(it)) return false;\n  if (it.dang === 'DUNG_SAI' || it.dang === 'GHEP_NOI') return v.length === it.opts.length && v.every((x) => x != null && x !== '');\n  return true;\n}\n/** Đáp án đã chọn dạng ngắn để hiện dưới số câu */\nfunction shortAns(it) {\n  if (isLt(it)) { const st = ltSt(it); return st && st.n ? fmtSc(st.d) : '</>'; }\n  const v = S.ans[it.k];\n  if (it.dang === 'MOT_DA') return v;\n  if (it.dang === 'NHIEU_DA') return v.join('');\n  if (it.dang === 'DUNG_SAI') return v.map((x) => x || '·').join('');\n  if (it.dang === 'GHEP_NOI') return v.map((x) => x || '·').join('');\n  return '✎';\n}\nfunction updNav() {\n  let n = 0;\n  S.items.forEach((it, i) => {\n    const b = $('nv' + i); if (!b) return;\n    const a = answered(it); if (a) n++;\n    b.className = (a ? 'a ' : '') + (S.flags[it.k] ? 'f ' : '') + (i === S.cur ? 'c' : '');\n    const g = $('sg' + i); if (g) g.className = i === S.cur ? 'c' : S.flags[it.k] ? 'f' : a ? 'a' : '';\n    b.innerHTML = it.stt + (a ? '<small>' + esc(shortAns(it)) + '</small>' : '');\n    b.title = 'Câu ' + it.stt + (a ? (complete(it) ? ' · đã làm' : ' · làm chưa đủ ý') : ' · chưa làm') + (S.flags[it.k] ? ' · đánh dấu' : '');\n  });\n  $('pgN').textContent = n; $('pgBar').style.width = (S.items.length ? 100 * n / S.items.length : 0) + '%';\n}\nfunction go(i) {\n  if (i < 0 || i >= S.items.length) return;\n  ltFlush();                                            // lưu code của bài đang rời đi\n  S.cur = i; persist();\n  const it = S.items[i], p = S.pkg, sec = p.sections.find((s) => s.phan === it.phan) || {};\n  document.body.classList.toggle('codeMode', isLt(it)); document.body.classList.remove('navOpen');\n  S.cm = null; S.cmTa = null;\n  if (isLt(it)) {\n    S.ltLang = ltLangOf(it);\n    const box = $('qcard');\n    box.innerHTML = '<div class=\"qhd\"><span class=\"qno\" data-n=\"' + String(it.stt).padStart(2, '0') + '\"><span class=\"sr\">Câu ' + it.stt + '</span><span class=\"mute\" style=\"font-weight:500\">/ ' + S.items.length + '</span></span>' +\n      '<span class=\"tag m\">Bài lập trình</span><span class=\"tag p\">' + fmtSc(it.diem) + ' điểm</span><span class=\"sp\"></span>' +\n      '<button class=\"btn\" onclick=\"document.body.classList.toggle(\\'navOpen\\')\" title=\"Danh sách câu hỏi\">☰ Danh sách câu</button>' +\n      '<button class=\"flagbtn ' + (S.flags[it.k] ? 'on' : '') + '\" onclick=\"toggleFlag()\">🚩 ' + (S.flags[it.k] ? 'Đã đánh dấu' : 'Đánh dấu xem lại') + '</button></div>' +\n      ltHtml(it) +\n      '<div class=\"qft\"><button class=\"btn\" ' + (i === 0 ? 'disabled' : '') + ' onclick=\"go(' + (i - 1) + ')\">← Câu trước</button><span class=\"mute\" id=\"qState\"></span>' +\n      (i < S.items.length - 1 ? '<button class=\"btn pri\" onclick=\"go(' + (i + 1) + ')\">Câu tiếp →</button>' : '<button class=\"btn ok\" onclick=\"askSubmit()\">Xem lại & nộp bài</button>') + '</div>';\n    math(box); ltAfterRender(it); updNav(); updQState();\n    return;\n  }\n  const dangTen = { MOT_DA: '1 đáp án', NHIEU_DA: 'Nhiều đáp án', DUNG_SAI: 'Đúng / Sai', GHEP_NOI: 'Ghép nối', TRA_LOI_NGAN: 'Trả lời ngắn' }[it.dang] || it.dang;\n  let h = '<div class=\"qhd\"><span class=\"qno\" data-n=\"' + String(it.stt).padStart(2, '0') + '\"><span class=\"sr\">Câu ' + it.stt + '</span><span class=\"mute\" style=\"font-weight:500\">/ ' + S.items.length + '</span></span>' +\n    '<span class=\"tag p\">Phần ' + esc(it.phan) + ' · ' + sec.moiCau + ' điểm</span><span class=\"tag m\">' + dangTen + '</span><span class=\"sp\"></span>' +\n    '<button class=\"flagbtn ' + (S.flags[it.k] ? 'on' : '') + '\" onclick=\"toggleFlag()\">🚩 ' + (S.flags[it.k] ? 'Đã đánh dấu' : 'Đánh dấu xem lại') + '</button></div>';\n  if (it.dang !== 'MOT_DA') h += '<div class=\"hint\">' + esc(p.hints[it.dang] || '') + '</div>';\n  if (it.g && p.groups[it.g]) {\n    const g = p.groups[it.g];\n    h += '<div class=\"grp\"><div class=\"gh\">Dùng thông tin sau cho câu ' + g.from + (g.to !== g.from ? '–' + g.to : '') + '</div><div class=\"stem\">' + rich(g.vi) + '</div>' +\n      (g.en ? '<div class=\"en\">' + rich(g.en) + '</div>' : '') + (g.latex ? '<div class=\"disp\">$$' + esc(g.latex) + '$$</div>' : '') + media(g.media, g.video, g.audio) + '</div>';\n  }\n  h += '<div class=\"stem\">' + rich(it.vi) + '</div>' + (it.en ? '<div class=\"en\">' + rich(it.en) + '</div>' : '') +\n    (it.latex ? '<div class=\"disp\">$$' + esc(it.latex) + '$$</div>' : '') + media(it.media, it.video, it.audio);\n  h += '<div id=\"ansBox\">' + ansHtml(it) + '</div>';\n  h += '<div class=\"qft\"><button class=\"btn\" ' + (i === 0 ? 'disabled' : '') + ' onclick=\"go(' + (i - 1) + ')\">← Câu trước</button>' +\n    '<span class=\"mute\" id=\"qState\"></span>' +\n    (i < S.items.length - 1 ? '<button class=\"btn pri\" onclick=\"go(' + (i + 1) + ')\">Câu tiếp →</button>' : '<button class=\"btn ok\" onclick=\"askSubmit()\">Xem lại & nộp bài</button>') + '</div>';\n  const box = $('qcard'); box.innerHTML = h; math(box);\n  box.classList.remove('enter'); void box.offsetWidth; box.classList.add('enter');\n  updNav(); updQState();\n  const inp = box.querySelector('.short input'); if (inp) setTimeout(() => inp.focus(), 50);\n  box.scrollIntoView({ block: 'nearest' });\n}\nfunction updQState() {\n  const it = S.items[S.cur], q = $('qState'); if (!q) return;\n  if (isLt(it)) { const st = ltSt(it); q.textContent = st && st.n ? '✓ Đã nộp ' + st.n + ' lần · điểm ' + fmtSc(st.d) + '/' + fmtSc(it.diem) : ltWritten(it) ? '◐ Chưa nộp code — code được tự lưu' : 'Chưa làm'; return; }\n  q.textContent = answered(it) ? (complete(it) ? '✓ Đã trả lời' : '◐ Chưa đủ ý') : 'Chưa trả lời'; }\nfunction ansHtml(it) {\n  const v = S.ans[it.k];\n  if (it.dang === 'MOT_DA' || it.dang === 'NHIEU_DA') {\n    const multi = it.dang === 'NHIEU_DA', sel = multi ? (v || []) : [v];\n    return '<div class=\"opts\">' + it.opts.map((o, i) => '<button class=\"opt ' + (multi ? 'multi ' : '') + (sel.includes(L[i]) ? 'on' : '') + '\" onclick=\"pick(\\'' + L[i] + '\\')\">' +\n      '<span class=\"L\">' + L[i] + '</span><span class=\"T\">' + rich(o.vi) + (o.en ? '<span class=\"en\"> / ' + rich(o.en) + '</span>' : '') + '</span></button>').join('') + '</div>';\n  }\n  if (it.dang === 'DUNG_SAI') {\n    const a = v || [];\n    return '<table class=\"ds\">' + it.opts.map((o, i) => '<tr><td>' + String.fromCharCode(97 + i) + ')</td><td><div class=\"stem\" style=\"font-size:15.5px\">' + rich(o.vi) + '</div>' + (o.en ? '<div class=\"en\">' + rich(o.en) + '</div>' : '') +\n      '</td><td><span class=\"seg\"><button class=\"t ' + (a[i] === 'Đ' ? 'on' : '') + '\" onclick=\"tf(' + i + ',\\'Đ\\')\">Đúng</button><button class=\"f ' + (a[i] === 'S' ? 'on' : '') + '\" onclick=\"tf(' + i + ',\\'S\\')\">Sai</button></span></td></tr>').join('') + '</table>';\n  }\n  if (it.dang === 'GHEP_NOI') {\n    const a = v || [];\n    return '<div class=\"match\"><div>' + it.opts.map((o, i) => '<div class=\"it\"><b>' + L[i] + '.</b><div style=\"flex:1\">' + rich(o.vi) + '</div><select onchange=\"mt(' + i + ',this.value)\"><option value=\"\">—</option>' +\n      it.right.map((r, j) => '<option value=\"' + (j + 1) + '\"' + (a[i] === j + 1 ? ' selected' : '') + '>' + (j + 1) + '</option>').join('') + '</select></div>').join('') + '</div><div>' +\n      it.right.map((r, j) => '<div class=\"r\"><b>' + (j + 1) + '.</b> ' + rich(r.vi) + (r.en ? ' <span class=\"en\">/ ' + rich(r.en) + '</span>' : '') + '</div>').join('') + '</div></div>';\n  }\n  return '<div class=\"short\"><input type=\"text\" maxlength=\"120\" placeholder=\"Nhập câu trả lời…\" value=\"' + esc(v || '') + '\" oninput=\"typeShort(this.value)\" autocomplete=\"off\" spellcheck=\"false\"></div>';\n}\nfunction setAns(k, v) {\n  if (S.locked || S.paused || S.phase !== 'exam') return false;\n  if (JSON.stringify(S.ans[k]) !== JSON.stringify(v)) botCheckChange(k);\n  if (v == null || v === '' || (Array.isArray(v) && !v.some((x) => x != null && x !== ''))) delete S.ans[k]; else S.ans[k] = v;\n  S.seq++; persist(); updNav(); updQState(); scheduleSave();\n  return true;\n}\nfunction pick(Lt) {\n  const it = S.items[S.cur];\n  if (it.dang === 'MOT_DA') setAns(it.k, S.ans[it.k] === Lt ? null : Lt);\n  else { const a = (S.ans[it.k] || []).slice(); const j = a.indexOf(Lt); if (j >= 0) a.splice(j, 1); else a.push(Lt); a.sort(); setAns(it.k, a); }\n  $('ansBox').innerHTML = ansHtml(it); math($('ansBox'));\n}\nfunction tf(i, x) { const it = S.items[S.cur]; const a = (S.ans[it.k] || it.opts.map(() => null)).slice(); a[i] = a[i] === x ? null : x; setAns(it.k, a); $('ansBox').innerHTML = ansHtml(it); math($('ansBox')); }\nfunction mt(i, x) { const it = S.items[S.cur]; const a = (S.ans[it.k] || it.opts.map(() => null)).slice(); a[i] = x ? Number(x) : null; setAns(it.k, a); }\nlet shortT = null;\nfunction typeShort(x) { const it = S.items[S.cur]; clearTimeout(shortT); shortT = setTimeout(() => setAns(it.k, x.trim()), 250); }\n/* =========================================================== CHỐNG TÁC TỬ AI / PHẦN MỀM ĐIỀU KHIỂN MÁY THI HỘ\n   Trang web không thấy được phần mềm chạy trên máy (chỉ SEB chặn được), nhưng thao tác của máy KHÁC người ở nhiều điểm đo được.\n   Mỗi dấu hiệu có MỨC: 3 = Chắc chắn (người thật không thể tạo ra) · 2 = Nghi cao · 1 = Nghi; kèm BẰNG CHỨNG số đo cụ thể.\n   Chính sách của kỳ thi (giám thị chọn ở tab ⑤): KHOA = khoá bài khi \"Chắc chắn\" · KHOA_HET = khoá với mọi dấu hiệu · BAO = chỉ báo. */\nconst BOT_RULES = {\n  webdriver: [3, 'Trình duyệt đang bị phần mềm tự động điều khiển (WebDriver / Playwright / Selenium / tác tử AI)'],\n  gia_lap: [3, 'Có thao tác bấm / gõ do chương trình tạo ra — không phải chuột hay bàn phím thật'],\n  khong_tt: [3, 'Đáp án / code thay đổi trong khi không có cú bấm chuột hay phím nào'],\n  tro_nang: [2, 'Đáp án / nút được bấm mà không có cú nhấn chuột hay phím nào — cách tác tử AI điều khiển máy qua giao diện trợ năng'],\n  giu_phim: [2, 'Mỗi phím chỉ được giữ gần 0 mili-giây — phím do phần mềm gửi (tay người luôn giữ phím vài chục mili-giây)'],\n  go_it: [2, 'Code dài hơn hẳn số phím thật sự gõ — code được chèn vào bằng cách khác'],\n  chuot: [2, 'Con trỏ chuột nhảy thẳng tới chỗ bấm, không rê chuột'],\n  tam_diem: [1, 'Bấm trúng chính giữa nút / đáp án gần như mọi lần (máy tính toạ độ từ ảnh chụp màn hình)'],\n  go_deu: [1, 'Gõ phím nhanh và đều tăm tắp như máy'],\n  chen_code: [1, 'Một đoạn code dài xuất hiện trong một lần gõ'],\n  tien_ich: [1, 'Có tiện ích trình duyệt chèn nội dung lạ vào trang thi (tiện ích AI?)']\n};\nconst BOT_LV = ['', 'Nghi', 'Nghi cao', 'Chắc chắn'];\nconst BOT = { clicks: [], centers: [], keys: [], holds: [], down: {}, last: {}, human: -1e9, pDown: -1e9, kDown: -1e9, typed: {} };\nconst now_ = () => performance.now();\nfunction botFlag(kind, proof) {\n  if (S.phase !== 'exam') return;\n  const r = BOT_RULES[kind]; if (!r) return;\n  if (ACOFF()) { thuNote('🤖 ' + BOT_LV[r[0]] + ' — ' + r[1] + (proof ? ' (' + proof + ')' : '') + (r[0] >= 3 || S.chongAI === 'KHOA_HET' ? ' → thi thật sẽ KHOÁ BÀI' : ''), kind); return; }\n  const t = Date.now(); if (BOT.last[kind] && t - BOT.last[kind] < 180000) return;   // mỗi loại tối đa 1 lần / 3 phút\n  BOT.last[kind] = t;\n  const text = BOT_LV[r[0]] + ' — ' + r[1] + (proof ? '. Bằng chứng: ' + proof : '') + '.';\n  S.ev.push({ k: 'TU_DONG', d: r[0], x: text, t: t });\n  const pol = S.chongAI || 'KHOA';\n  if (!S.locked && ((pol === 'KHOA' && r[0] >= 3) || pol === 'KHOA_HET')) {\n    lockScreen('thao tác không phải của người (' + r[1].split(' — ')[0].toLowerCase() + ')');\n    scheduleSave(jitter(500, 1500));\n  } else scheduleSave(jitter(2000, 5000));\n}\nconst nonWs = (s) => String(s || '').replace(/\\s+/g, '').length;\nconst human = () => { BOT.human = now_(); };\n// --- thao tác thật / giả lập\n['pointerdown', 'mousedown', 'click', 'keydown', 'keyup', 'beforeinput', 'input', 'touchstart'].forEach((tp) => document.addEventListener(tp, (e) => {\n  if (S.phase !== 'exam') return;\n  if (!e.isTrusted) { botFlag('gia_lap', 'sự kiện \"' + tp + '\" không đến từ chuột / bàn phím thật'); return; }\n  if (tp === 'pointerdown' || tp === 'mousedown' || tp === 'touchstart') { BOT.pDown = now_(); human(); }\n  else if (tp === 'keydown') { BOT.kDown = now_(); human(); }\n}, true));\ndocument.addEventListener('wheel', (e) => { if (e.isTrusted) human(); }, { capture: true, passive: true });\n// --- bấm mà không có cú nhấn nào (giao diện trợ năng: AXPress / UIAutomation Invoke)\ndocument.addEventListener('click', (e) => {\n  if (S.phase !== 'exam' || !e.isTrusted || e.detail !== 0) return;\n  const t = now_();\n  if (t - BOT.pDown < 600 || t - BOT.kDown < 600) return;                  // Enter / Space trên nút, hoặc vừa bấm chuột → bình thường\n  const el = e.target && e.target.closest && e.target.closest('.opt, button, input, label, .nav button');\n  if (el && el.closest('#scrExam')) botFlag('tro_nang', 'bấm vào \"' + String(el.textContent || el.value || el.className).trim().slice(0, 40) + '\" không kèm cú nhấn chuột / phím');\n}, true);\n// --- chuột: nhảy thẳng tới chỗ bấm · bấm trúng tâm\ndocument.addEventListener('pointermove', (e) => { if (e.pointerType === 'mouse' && e.isTrusted) BOT.mvN = (BOT.mvN || 0) + 1; }, true);\ndocument.addEventListener('pointerdown', (e) => {\n  if (S.phase !== 'exam' || !e.isTrusted || e.pointerType !== 'mouse') return;\n  const p = BOT.down.p, jump = p ? Math.hypot(e.clientX - p.x, e.clientY - p.y) : 0, moves = BOT.mvN || 0;\n  BOT.down.p = { x: e.clientX, y: e.clientY }; BOT.mvN = 0;\n  if (p && jump >= 40) {\n    BOT.clicks.push(moves <= 1 ? 1 : 0); if (BOT.clicks.length > 10) BOT.clicks.shift();\n    const n = BOT.clicks.reduce((a, b) => a + b, 0);\n    if (BOT.clicks.length >= 8 && n >= 7) { botFlag('chuot', n + '/' + BOT.clicks.length + ' lần bấm con trỏ nhảy thẳng tới (xa ≥ 40 px) mà không có bước rê chuột nào'); BOT.clicks = []; }\n  }\n  const el = e.target && e.target.closest && e.target.closest('.opt, button');\n  if (el) {\n    const r = el.getBoundingClientRect();\n    if (r.width > 24 && r.height > 18) {\n      BOT.centers.push(Math.abs(e.clientX - (r.left + r.width / 2)) <= 1.5 && Math.abs(e.clientY - (r.top + r.height / 2)) <= 1.5 ? 1 : 0);\n      if (BOT.centers.length > 12) BOT.centers.shift();\n      const c = BOT.centers.reduce((a, b) => a + b, 0);\n      if (BOT.centers.length >= 10 && c >= 9) { botFlag('tam_diem', c + '/' + BOT.centers.length + ' lần bấm lệch tâm nút không quá 1,5 px'); BOT.centers = []; }\n    }\n  }\n}, true);\n// --- bàn phím: thời gian giữ phím · nhịp gõ\ndocument.addEventListener('keydown', (e) => {\n  if (S.phase !== 'exam' || !e.isTrusted || e.ctrlKey || e.metaKey || e.altKey || e.repeat) return;\n  BOT.down[e.code || e.key] = e.timeStamp;\n  if (e.key.length !== 1) return;\n  if (e.target && e.target.closest && e.target.closest('.cedit') && /\\S/.test(e.key)) { const k = ltTypedKey(); if (k) BOT.typed[k] = (BOT.typed[k] || 0) + 1; }\n  BOT.keys.push(e.timeStamp); if (BOT.keys.length > 41) BOT.keys.shift();\n  if (BOT.keys.length === 41) {\n    const d = BOT.keys.slice(1).map((t, i) => t - BOT.keys[i]), m = d.reduce((a, b) => a + b, 0) / d.length;\n    const sd = Math.sqrt(d.reduce((a, b) => a + (b - m) * (b - m), 0) / d.length);\n    if (m < 70 && sd < 12) { botFlag('go_deu', '40 phím liền, trung bình ' + Math.round(m) + ' ms/phím, chênh lệch chỉ ' + Math.round(sd) + ' ms (người gõ chênh hàng chục ms)'); BOT.keys = []; }\n  }\n}, true);\ndocument.addEventListener('keyup', (e) => {\n  if (S.phase !== 'exam' || !e.isTrusted || e.key.length !== 1) return;\n  const d0 = BOT.down[e.code || e.key]; if (d0 == null) return;\n  delete BOT.down[e.code || e.key];\n  BOT.holds.push(e.timeStamp - d0); if (BOT.holds.length > 30) BOT.holds.shift();\n  if (BOT.holds.length === 30) {\n    const s = BOT.holds.slice().sort((a, b) => a - b), med = s[15];\n    if (med < 12) { botFlag('giu_phim', '30 phím gần nhất, thời gian giữ phím trung vị ' + med.toFixed(1) + ' ms (người thật thường 60–150 ms)'); BOT.holds = []; }\n  }\n}, true);\n// --- nội dung lạ chèn vào trang (tiện ích AI, lớp phủ của tác tử)\n(function () {\n  const known = new Set(['SCRIPT', 'STYLE', 'LINK', 'META', 'NOSCRIPT', 'TEMPLATE']);\n  const mo = new MutationObserver((list) => {\n    if (S.phase !== 'exam') return;\n    for (const m of list) for (const n of m.addedNodes) {\n      if (n.nodeType !== 1 || known.has(n.tagName)) continue;\n      botFlag('tien_ich', 'phần tử <' + n.tagName.toLowerCase() + (n.id ? ' id=\"' + n.id + '\"' : '') + (n.className && typeof n.className === 'string' ? ' class=\"' + n.className.slice(0, 40) + '\"' : '') + '> được chèn vào trang');\n      return;\n    }\n  });\n  const start = () => { mo.observe(document.documentElement, { childList: true }); if (document.body) mo.observe(document.body, { childList: true }); };\n  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();\n})();\n/** Đáp án đổi mà không có thao tác thật nào trong 2,5 giây trước đó (gọi từ setAns) */\nfunction botCheckChange(k) {\n  if (S.phase !== 'exam') return;\n  if (now_() - BOT.human > 2500) { const it = S.items.find((x) => x.k === k); botFlag('khong_tt', (it && isLt(it) ? 'code bài ' : 'câu ') + (it ? it.stt : k) + ' đổi khi ' + (BOT.human < 0 ? 'chưa từng' : Math.round((now_() - BOT.human) / 1000) + ' giây không') + ' có thao tác chuột / phím'); }\n}\n/** Khung code: một lần gõ chèn ≥ 40 ký tự (không qua dán) */\nfunction botCmChange(cm, ch) {\n  if (!ch) return;\n  const n = (ch.text || []).join('\\n').length;\n  if (ch.origin === '+input' && n >= 40) botFlag('chen_code', 'một lần gõ chèn ' + n + ' ký tự');\n  if (ch.origin === 'setValue' || ch.origin === '+input' || ch.origin === 'paste') { if (now_() - BOT.human > 2500) botCheckChange((S.items[S.cur] || {}).k); }\n}\n/** Đếm phím gõ thật trong khung code (theo bài + ngôn ngữ) để so với độ dài code khi chạy / nộp */\nfunction ltTypedKey() { const it = S.items[S.cur]; return isLt(it) ? it.k + ':' + S.ltLang : ''; }\nfunction ltBase(code) { const k = ltTypedKey(); if (k && BOT.typed['b:' + k] == null) BOT.typed['b:' + k] = nonWs(code); }\nfunction ltPasted(n) { const k = ltTypedKey(); if (k) BOT.typed['p:' + k] = (BOT.typed['p:' + k] || 0) + n; }\nfunction botCodeCheck(code) {\n  const k = ltTypedKey(); if (!k) return;\n  const base = BOT.typed['b:' + k] || 0, typed = BOT.typed[k] || 0, pasted = BOT.typed['p:' + k] || 0, grow = nonWs(code) - base;\n  if (grow > 60 && grow > typed * 1.4 + pasted + 30) botFlag('go_it', 'code thêm ' + grow + ' ký tự (không tính dấu cách) nhưng chỉ gõ ' + typed + ' phím' + (pasted ? ' + dán ' + pasted + ' ký tự của chính mình' : ''));\n}\nfunction botStart() { if (navigator.webdriver) botFlag('webdriver', 'navigator.webdriver = true'); }\nfunction toggleFlag() { const it = S.items[S.cur]; if (S.flags[it.k]) delete S.flags[it.k]; else S.flags[it.k] = 1; persist(); go(S.cur); }\n\n/* =========================================================== THI LẬP TRÌNH (Python · C) */\nconst LT_NAME = { py: 'Python 3', c: 'C (GCC)' };\nconst LT_STARTER = { py: '# Đọc dữ liệu từ bàn phím (stdin) và in kết quả ra màn hình (stdout)\\n\\n', c: '#include <stdio.h>\\n\\nint main(void) {\\n    \\n    return 0;\\n}\\n' };\nconst VD = { AC: 'Đúng', WA: 'Sai kết quả', TLE: 'Quá thời gian', MLE: 'Quá bộ nhớ', RE: 'Lỗi khi chạy', CE: 'Lỗi biên dịch', OK: 'Đã chạy', IE: 'Lỗi máy chấm' };\nconst DOKHO = { DE: 'Dễ', TB: 'Trung bình', KHO: 'Khó' };\nconst isLt = (it) => !!it && it.dang === 'LAP_TRINH';\nconst ltSt = (it) => (S.lt || {})[it.ma] || null;\nfunction ltStarter(it, l) { const m = (it.mau || {})[l]; return m && String(m).trim() ? String(m) : LT_STARTER[l]; }\nfunction ltLangOf(it) { const v = S.ans[it.k]; if (v && it.nn.includes(v.l)) return v.l; const p = LS.get('pt:ltlang'); return it.nn.includes(p) ? p : it.nn[0]; }\nfunction ltCodeOf(it) { const v = S.ans[it.k]; return v && typeof v.c === 'string' && v.l === ltLangOf(it) ? v.c : ltStarter(it, ltLangOf(it)); }\nfunction ltWritten(it) { const v = S.ans[it.k]; return !!(v && v.c && v.c.trim() && v.c.trim() !== ltStarter(it, v.l).trim()); }\nconst fmtMs = (ms) => ms == null || ms === '' ? '' : ms < 1000 ? Math.round(ms) + ' ms' : (ms / 1000).toFixed(2) + ' s';\nconst fmtKb = (kb) => kb == null || kb === '' ? '' : kb < 1024 ? Math.round(kb) + ' KB' : (kb / 1024).toFixed(1) + ' MB';\nconst fmtSc = (x) => String(Math.round(Number(x || 0) * 100) / 100);\nconst vdHtml = (v) => '<span class=\"vd ' + esc(v) + '\">' + esc(VD[v] || v) + '</span>';\n/** Đề bài: như rich() + `code` và **đậm** */\nfunction ltRich(s) {\n  return rich(s).split(/(<pre[\\s\\S]*?<\\/pre>)/).map((p, i) => i % 2 ? p : p.replace(/`([^`\\n]+)`/g, '<code class=\"ic\">$1</code>').replace(/\\*\\*([^*\\n]+)\\*\\*/g, '<b>$1</b>')).join('');\n}\n\n/* ---- trình soạn code: CodeMirror 5 (tải khi đề có bài lập trình); không tải được → khung soạn đơn giản ---- */\nconst CMV = 'https://cdn.jsdelivr.net/npm/codemirror@5.65.16/';\nlet cmP = null;\nfunction loadCM() {\n  if (window.CodeMirror && window.CodeMirror.modes && window.CodeMirror.modes.python) return Promise.resolve(true);\n  if (cmP) return cmP;\n  const css = document.createElement('link'); css.rel = 'stylesheet'; css.href = CMV + 'lib/codemirror.min.css'; document.head.appendChild(css);\n  const js = (src) => new Promise((ok, no) => { const s = document.createElement('script'); s.src = CMV + src; s.onload = ok; s.onerror = no; document.head.appendChild(s); });\n  cmP = Promise.race([\n    js('lib/codemirror.min.js').then(() => Promise.all(['mode/python/python.min.js', 'mode/clike/clike.min.js', 'addon/edit/matchbrackets.min.js', 'addon/edit/closebrackets.min.js', 'addon/selection/active-line.min.js'].map(js))).then(() => true),\n    sleep(12000).then(() => false)\n  ]).catch(() => false).then((ok) => { if (!ok) cmP = null; return ok; });\n  return cmP;\n}\nconst ltRO = () => !!(S.locked || S.paused || S.phase !== 'exam');\nfunction ltCode() { return S.cm ? S.cm.getValue() : S.cmTa ? S.cmTa.value : ''; }\nfunction ltSetCode(c) { if (S.cm) S.cm.setValue(c); else if (S.cmTa) S.cmTa.value = c; }\nfunction ltMount(it) {\n  const box = $('cedit'); if (!box) return;\n  S.cm = null; S.cmTa = null;\n  const ta = document.createElement('textarea');\n  ta.className = 'cfb'; ta.spellcheck = false; ta.setAttribute('autocomplete', 'off'); ta.setAttribute('autocapitalize', 'off'); ta.setAttribute('aria-label', 'Khung soạn code');\n  ta.value = ltCodeOf(it); ta.readOnly = ltRO(); ltBase(ta.value);\n  ta.addEventListener('input', ltChanged); ta.addEventListener('keydown', taKey);\n  box.innerHTML = ''; box.appendChild(ta); S.cmTa = ta;\n  const up = (ok) => {\n    if (!ok || !window.CodeMirror || $('cedit') !== box || S.items[S.cur] !== it || !S.cmTa) return;\n    const val = S.cmTa.value, focus = document.activeElement === S.cmTa;\n    box.innerHTML = ''; S.cmTa = null;\n    const cm = CodeMirror(box, { value: val, mode: S.ltLang === 'c' ? 'text/x-csrc' : 'python', lineNumbers: true, indentUnit: 4, tabSize: 4, indentWithTabs: false,\n      matchBrackets: true, autoCloseBrackets: true, styleActiveLine: true, dragDrop: false, readOnly: ltRO(), spellcheck: false, autocorrect: false, autocapitalize: false,\n      extraKeys: { Tab: (c) => c.somethingSelected() ? c.indentSelection('add') : c.replaceSelection('    '), 'Shift-Tab': (c) => c.indentSelection('subtract') } });\n    cm.on('change', ltChanged); cm.on('change', botCmChange);\n    S.cm = cm; setTimeout(() => { cm.refresh(); if (focus) cm.focus(); }, 20);\n  };\n  if (window.CodeMirror && window.CodeMirror.modes && window.CodeMirror.modes.python) up(true); else loadCM().then(up);\n}\n/** Khung soạn dự phòng: Tab = 4 dấu cách, Enter giữ thụt lề */\nfunction taKey(e) {\n  const ta = e.target, s = ta.selectionStart, en = ta.selectionEnd, v = ta.value;\n  const put = (txt, a, b) => { ta.setRangeText(txt, a, b, 'end'); ltChanged(); e.preventDefault(); };\n  if (e.key === 'Tab' && !e.ctrlKey && !e.metaKey) {\n    if (e.shiftKey) { const ls = v.lastIndexOf('\\n', s - 1) + 1, m = v.slice(ls).match(/^ {1,4}/); if (m) { ta.setRangeText('', ls, ls + m[0].length, 'preserve'); ltChanged(); } e.preventDefault(); }\n    else put('    ', s, en);\n  } else if (e.key === 'Enter' && !e.ctrlKey && !e.metaKey && !e.shiftKey) {\n    const ls = v.lastIndexOf('\\n', s - 1) + 1, ind = (v.slice(ls, s).match(/^[ \\t]*/) || [''])[0], extra = /[:{]\\s*$/.test(v.slice(ls, s)) ? '    ' : '';\n    put('\\n' + ind + extra, s, en);\n  }\n}\nlet ltT = null;\nfunction ltChanged() { clearTimeout(ltT); ltT = setTimeout(ltFlush, 500); }\n/** Ghi code đang soạn vào bài làm (tự lưu cùng các câu khác) */\nfunction ltFlush() {\n  clearTimeout(ltT);\n  const it = S.items[S.cur];\n  if (!isLt(it) || (!S.cm && !S.cmTa) || S.phase !== 'exam') return;\n  const c = ltCode(), v = S.ans[it.k];\n  if (v && v.c === c && v.l === S.ltLang) return;\n  if (c.length > 30000) { if (!S.ltBigWarn || Date.now() - S.ltBigWarn > 15000) { S.ltBigWarn = Date.now(); toast('Code dài quá 30.000 ký tự — phần thay đổi mới không được lưu. Hãy rút gọn code.', 'w', 6000); } return; }\n  setAns(it.k, { l: S.ltLang, c: c });\n}\nfunction ltLang(l) {\n  const it = S.items[S.cur];\n  if (!isLt(it) || !it.nn.includes(l) || l === S.ltLang) return;\n  const st = (S.stash[it.k] = S.stash[it.k] || {});\n  st[S.ltLang] = ltCode();\n  const next = st[l] != null ? st[l] : ltStarter(it, l);\n  S.ltLang = l; LS.set('pt:ltlang', l);\n  if (S.cm) S.cm.setOption('mode', l === 'c' ? 'text/x-csrc' : 'python');\n  ltSetCode(next); ltBase(next); setAns(it.k, { l: l, c: next }); persist();\n  toast('Đã chuyển sang ' + LT_NAME[l] + '. Code ' + LT_NAME[l === 'c' ? 'py' : 'c'] + ' vẫn được giữ lại nếu bạn đổi lại.', '', 3500);\n}\nfunction ltReset() {\n  const it = S.items[S.cur]; if (!isLt(it) || ltRO()) return;\n  overlay('<h2>Đặt lại code mẫu?</h2><p>Code ' + LT_NAME[S.ltLang] + ' hiện tại của bài này sẽ bị thay bằng code khởi tạo.</p><div class=\"btns\"><button class=\"btn\" onclick=\"overlay()\">Huỷ</button>' +\n    '<button class=\"btn pri\" onclick=\"overlay();ltSetCode(ltStarter(S.items[S.cur],S.ltLang));ltFlush()\">Đặt lại</button></div>');\n}\nfunction ltCopyIn(i) {\n  const it = S.items[S.cur], s = it.samples[i]; if (!s) return;\n  $('ltUseC').checked = true; ltCustomToggle(); $('ltCin').value = s.in; S.ltCin = s.in;\n}\nfunction ltCustomToggle() { const on = $('ltUseC').checked; $('ltCinBox').classList.toggle('hidden', !on); S.ltUseC = on; if (on) setTimeout(() => $('ltCin').focus(), 30); }\nfunction ltBusy(kind) {\n  S.ltBusy = kind || false;\n  ['ltRunB', 'ltSubB'].forEach((id) => { const b = $(id); if (b) b.disabled = !!kind; });\n  if (kind) { ltOpenOut(); ltTab('res', '<div class=\"lt-wait\"><div class=\"spin\"></div><span id=\"ltWaitT\">' + (kind === 'run' ? 'Đang chạy code với test mẫu…' : 'Đang chấm trên toàn bộ test…') + '</span></div>'); }\n}\nconst ltWaitMsg = (t) => { const w = $('ltWaitT'); if (w) w.textContent = t; };\n/** Gọi máy chấm: tự chờ khi bấm quá nhanh, tự thử lại khi máy chấm bận (lượt lỗi máy chấm không bị tính) */\nasync function ltCall(name, p) {\n  let busy = 0, wait = 0;\n  for (;;) {\n    try { return await call(name, [S.tok, S.ky, S.sbd, p], 100000); }\n    catch (e) {\n      if ((e.code === 'JUDGE_BUSY' || e.code === 'BUSY') && busy < 4) { busy++; const d = jitter(3000, 6000) * busy; ltWaitMsg('Máy chấm đang bận — tự thử lại sau ' + Math.round(d / 1000) + ' giây (lần ' + busy + '/4)…'); await sleep(d); continue; }\n      if (e.code === 'WAIT' && wait < 3) { const s = Number((String(e.message).match(/(\\d+) giây/) || [])[1] || 3); if (s <= 15) { wait++; ltWaitMsg('Chờ ' + s + ' giây theo quy định của kỳ thi…'); await sleep(s * 1000 + 400); continue; } }\n      if (e.code === 'NET' && name === 'runCode' && busy < 1) { busy++; await sleep(2000); continue; }\n      throw e;\n    }\n  }\n}\nfunction ltFail(e) {\n  if (handleFatal(e)) return;\n  const msg = e.code === 'NET' && S.ltBusy === 'sub' ? 'Mất kết nối khi đang nộp. Lượt nộp có thể đã được ghi nhận — xem lại ở tab \"Lịch sử nộp\" sau khi tải lại trang, hoặc nộp lại.' : e.message;\n  ltTab('res', '<div class=\"err\">' + esc(msg) + '</div>');\n  if (e.code === 'TIME_UP' || e.code === 'CLOSED') onTimeUp();\n}\nasync function ltRun() {\n  const it = S.items[S.cur];\n  if (!isLt(it) || S.ltBusy || ltRO()) return;\n  if (it.chayThu === false) { toast('Kỳ thi này không cho chạy thử — chỉ được nộp code.', 'w'); return; }\n  ltFlush();\n  const code = ltCode(); if (!code.trim()) { toast('Chưa có code.', 'w'); return; }\n  botCodeCheck(code);\n  const cu = $('ltUseC') && $('ltUseC').checked, p = { ma: it.ma, lang: S.ltLang, code: code };\n  if (cu) { p.custom = $('ltCin').value; S.ltCin = p.custom; }\n  ltBusy('run');\n  try { const r = await ltCall('runCode', p); S.ltLast[it.k] = { kind: r.lib ? 'lib' : 'run', r: r, lang: p.lang }; if (S.items[S.cur] === it) ltTab('res'); }\n  catch (e) { ltFail(e); }\n  finally { ltBusy(false); if (S.items[S.cur] === it && !S.ltLast[it.k]) ltTab('res'); }\n}\nasync function ltSubmit() {\n  const it = S.items[S.cur];\n  if (!isLt(it) || S.ltBusy || ltRO()) return;\n  ltFlush();\n  const code = ltCode(); if (!code.trim()) { toast('Chưa có code.', 'w'); return; }\n  const st = ltSt(it) || { n: 0 }, left = (it.soLan || 30) - (st.n || 0);\n  if (left <= 0) { toast('Bạn đã dùng hết lượt nộp cho bài này.', 'w'); return; }\n  botCodeCheck(code);\n  const p = { ma: it.ma, lang: S.ltLang, code: code };\n  ltBusy('sub');\n  try {\n    const r = await ltCall('submitCode', p);\n    if (r.lib) { S.ltLast[it.k] = { kind: 'lib', r: r, lang: p.lang }; if (S.items[S.cur] === it) ltTab('res'); toast('Code vi phạm quy định thư viện — lượt này KHÔNG bị tính.', 'w', 5000); return; }\n    S.lt[it.ma] = { d: r.best, n: r.n, last: r.score, t: Date.now(), lang: p.lang };\n    const ac = r.results.filter((x) => x.v === 'AC').length;\n    (S.ltHist[it.k] = S.ltHist[it.k] || []).unshift({ t: Date.now(), l: p.lang, sc: r.score, max: r.max, ac: ac, tot: r.results.length, v: r.ce ? 'CE' : (r.results.find((x) => x.v !== 'AC') || { v: 'AC' }).v });\n    S.ltLast[it.k] = { kind: 'sub', r: r, lang: p.lang }; persist();\n    if (S.items[S.cur] === it) { ltTab('res'); ltBar(it); }\n    updNav(); updQState();\n    toast('Đã nộp bài ' + it.stt + ': ' + fmtSc(r.score) + '/' + fmtSc(r.max) + ' điểm (' + ac + '/' + r.results.length + ' test đúng).', '', 5000);\n  } catch (e) { ltFail(e); }\n  finally { ltBusy(false); }\n}\n/** Thanh dưới khung code: lượt nộp còn lại + điểm cao nhất */\nfunction ltBar(it) {\n  const st = ltSt(it) || { n: 0, d: 0 }, left = Math.max(0, (it.soLan || 30) - (st.n || 0)), b = $('ltSubB'), i = $('ltInfo');\n  if (b) b.textContent = '⬆ Nộp code' + (it.soLan ? ' (còn ' + left + ')' : '');\n  if (i) i.innerHTML = st.n ? '<span class=\"lt-best\">Điểm: ' + fmtSc(st.d) + '/' + fmtSc(it.diem) + '</span>' : '';\n}\nfunction ltTab(name, html) {\n  S.ltTabCur = name;\n  const it = S.items[S.cur], box = $('ltRes'); if (!box || !isLt(it)) return;\n  document.querySelectorAll('.lt-tabs button').forEach((b) => b.classList.toggle('on', b.dataset.t === name));\n  box.innerHTML = html != null ? html : name === 'hist' ? ltHistHtml(it) : ltResHtml(it);\n}\nfunction ltTestBox(x, i, label, open) {\n  const meta = [fmtMs(x.time), fmtKb(x.mem)].filter(Boolean).join(' · ');\n  const hidden = x.inp === undefined && !x.custom;\n  let body = '';\n  if (!hidden) {\n    body += '<div><div class=\"cap\">Input</div><pre>' + esc(x.inp || '(trống)') + '</pre></div>';\n    body += '<div class=\"two\">' + (x.custom ? '' : '<div><div class=\"cap\">Output mong đợi</div><pre>' + esc(x.exp == null ? '' : x.exp) + '</pre></div>') +\n      '<div' + (x.custom ? ' style=\"grid-column:1/-1\"' : '') + '><div class=\"cap\">Output của bạn</div><pre>' + esc(x.out || '') + '</pre></div></div>';\n    if (x.diff) body += '<div class=\"lt-diff\">Khác ở dòng ' + x.diff.line + ': mong đợi <code class=\"ic\">' + esc(String(x.diff.exp).slice(0, 120)) + '</code>, chương trình in <code class=\"ic\">' + esc(String(x.diff.got).slice(0, 120)) + '</code></div>';\n    if (x.err) body += '<div><div class=\"cap\">Thông báo lỗi (stderr)</div><pre class=\"lt-err\">' + esc(x.err) + '</pre></div>';\n  } else body = '<div class=\"mute\">Test ẩn — chỉ hiện kết quả, không hiện dữ liệu.</div>';\n  return '<details class=\"lt-t\"' + (open ? ' open' : '') + '><summary>' + vdHtml(x.v) + '<b>' + label + '</b>' + (meta ? '<span class=\"mute\">' + meta + '</span>' : '') + '</summary><div class=\"bd\">' + body + '</div></details>';\n}\nfunction ltResHtml(it) {\n  const L0 = S.ltLast[it.k];\n  if (!L0) return '<p class=\"mute\" style=\"margin:0\">' + (it.chayThu === false ? '' : '<b>▶ Chạy thử</b> chạy code với test ví dụ (hoặc input bạn tự nhập) — không tính điểm, không tính lượt.<br>') +\n    '<b>⬆ Nộp code</b> chấm trên toàn bộ ' + it.nTest + ' test (gồm test ẩn) và tính điểm' + (it.soLan ? ', tối đa ' + it.soLan + ' lượt' : '') + '. ' +\n    'Điểm của bài là <b>' + (S.pkg.ltTinh === 'LAN_CUOI' ? 'điểm lần nộp cuối' : 'điểm cao nhất trong các lần nộp') + '</b>.<br>Phím tắt: <kbd>Ctrl</kbd>+<kbd>Enter</kbd> chạy thử · <kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>Enter</kbd> nộp code.</p>';\n  const r = L0.r, res = r.results || [];\n  if (L0.kind === 'lib') return '<div class=\"lt-lib\"><b>⛔ Vi phạm quy định thư viện</b> <span class=\"mute\">— code chưa được chạy' + (r.left != null ? ', lượt nộp không bị tính' : '') + '</span><pre class=\"lt-err\" style=\"margin-top:6px;background:transparent;border:0;padding:0\">' + esc(r.lib) + '</pre></div>' + ltTvHtml(S.items[S.cur]);\n  if (r.ce) return '<div class=\"lt-sum\">' + vdHtml('CE') + '<span class=\"mute\">' + LT_NAME[L0.lang] + (L0.kind === 'sub' ? ' · lần nộp này 0 điểm' : '') + '</span></div><pre class=\"lt-err\">' + esc(res[0] && res[0].err || 'Lỗi biên dịch') + '</pre>';\n  let h = '';\n  if (L0.kind === 'run') {\n    const sm = res.filter((x) => !x.custom), ok = sm.filter((x) => x.v === 'AC').length;\n    h += '<div class=\"lt-sum\">' + (sm.length ? (ok === sm.length ? vdHtml('AC') : vdHtml((sm.find((x) => x.v !== 'AC') || {}).v || 'WA')) + '<b>Test ví dụ: ' + ok + '/' + sm.length + ' đúng</b>' : '<b>Chạy với input tự nhập</b>') +\n      '<span class=\"mute\">Chạy thử — không tính điểm</span></div>';\n    let first = true, si = 0;\n    res.forEach((x) => { const lab = x.custom ? 'Input tự nhập' : 'Ví dụ ' + (++si); h += ltTestBox(x, 0, lab, x.custom || (first && x.v !== 'AC')); if (!x.custom && x.v !== 'AC') first = false; });\n    return h;\n  }\n  const ac = res.filter((x) => x.v === 'AC').length;\n  h += '<div class=\"lt-sum\"><span class=\"sc\">' + fmtSc(r.score) + '/' + fmtSc(r.max) + '</span><b>' + ac + '/' + res.length + ' test đúng</b>' +\n    '<span class=\"mute\">Lần nộp ' + r.n + ' · điểm của bài: ' + fmtSc(r.best) + ' · còn ' + r.left + ' lượt</span></div>';\n  h += '<div class=\"lt-chips\">' + res.map((x, i) => '<span class=\"vd ' + esc(x.v) + '\" title=\"Test ' + (i + 1) + (x.mau ? ' (ví dụ)' : ' (ẩn)') + ': ' + esc(VD[x.v] || x.v) + '\">' + (i + 1) + (x.v === 'AC' ? '✓' : '✗') + '</span>').join('') + '</div>';\n  let first = true;\n  const wShow = it.cham !== 'TAT_CA' && new Set(res.filter((x) => x.w > 0).map((x) => x.w)).size > 1;   // chỉ hiện trọng số khi các test có trọng số khác nhau\n  res.forEach((x, i) => { const see = x.mau || x.an; h += ltTestBox(x, i, 'Test ' + (i + 1) + (x.mau ? ' · ví dụ' : x.an ? ' · ẩn (thi thử: giám thị xem được dữ liệu)' : ' · ẩn') + (wShow && x.w > 0 ? ' · trọng số ' + x.w : ''), first && x.v !== 'AC' && see); if (x.v !== 'AC' && see) first = false; });\n  return h;\n}\nfunction ltHistHtml(it) {\n  const st = ltSt(it), hs = S.ltHist[it.k] || [];\n  let h = st && st.n ? '<p style=\"margin:0 0 8px\">Đã nộp <b>' + st.n + '</b> lần · điểm của bài <b>' + fmtSc(st.d) + '/' + fmtSc(it.diem) + '</b>' + (st.t ? ' · lần cuối ' + clock(st.t) : '') + '</p>' : '<p class=\"mute\" style=\"margin:0\">Chưa nộp lần nào.</p>';\n  if (hs.length) h += '<table class=\"lt-h\"><tr><th>Lúc</th><th>Ngôn ngữ</th><th>Kết quả</th><th>Test đúng</th><th>Điểm</th></tr>' +\n    hs.map((x) => '<tr><td>' + clock(x.t) + '</td><td>' + LT_NAME[x.l] + '</td><td>' + vdHtml(x.v) + '</td><td>' + x.ac + '/' + x.tot + '</td><td><b>' + fmtSc(x.sc) + '</b>/' + fmtSc(x.max) + '</td></tr>').join('') + '</table>' +\n    (st && st.n > hs.length ? '<p class=\"mute\">Các lần nộp trước khi tải lại trang không hiện chi tiết ở đây.</p>' : '');\n  return h;\n}\n/** Giao diện 1 bài lập trình: đề bài | trình soạn code + kết quả */\nfunction ltHtml(it) {\n  const lim = 'Giới hạn: ' + fmtSc(it.tl) + ' giây · ' + it.ml + ' MB';\n  let st = '<div class=\"lt-st\"><h3>' + esc(it.tieuDe || it.ma) + '</h3><div class=\"lt-meta\"><span class=\"tag p\">' + fmtSc(it.diem) + ' điểm</span>' + (it.doKho ? '<span class=\"tag\">' + esc(DOKHO[String(it.doKho).toUpperCase()] || it.doKho) + '</span>' : '') +\n    '<span class=\"tag\">' + lim + '</span><span class=\"tag\">' + it.nTest + ' test</span></div>';\n  st += '<div class=\"stem\">' + ltRich(it.noiDung) + '</div>';\n  if (it.vao) st += '<h4>Dữ liệu vào</h4><div class=\"stem\">' + ltRich(it.vao) + '</div>';\n  if (it.ra) st += '<h4>Kết quả</h4><div class=\"stem\">' + ltRich(it.ra) + '</div>';\n  if (it.rangBuoc) st += '<h4>Ràng buộc</h4><div class=\"stem\">' + ltRich(it.rangBuoc) + '</div>';\n  st += ltTvHtml(it);\n  (it.samples || []).forEach((s, i) => {\n    st += '<div class=\"lt-ex\"><b>Ví dụ ' + (i + 1) + '</b><div class=\"lt-io\"><div><div class=\"cap\">Input' + (it.chayThu === false ? '' : '<button onclick=\"ltCopyIn(' + i + ')\" title=\"Dùng làm input tự nhập\">Dùng thử</button>') + '</div><pre>' + esc(s.in) + '</pre></div>' +\n      '<div><div class=\"cap\">Output</div><pre>' + esc(s.out) + '</pre></div></div>' + (s.gt ? '<div class=\"stem\" style=\"font-size:14px;margin-top:6px\">' + ltRich(s.gt) + '</div>' : '') + '</div>';\n  });\n  st += '</div>';\n  const langs = it.nn.length > 1 ? '<select id=\"ltLangS\" onchange=\"ltLang(this.value)\" aria-label=\"Ngôn ngữ\">' + it.nn.map((l) => '<option value=\"' + l + '\"' + (l === S.ltLang ? ' selected' : '') + '>' + LT_NAME[l] + '</option>').join('') + '</select>' : '<b>' + LT_NAME[it.nn[0]] + '</b>';\n  const ed = '<div class=\"lt-ed\"><div class=\"lt-tb\"><span>Ngôn ngữ</span>' + langs + '<span class=\"sp\"></span><span class=\"mute\">' + lim + '</span><button class=\"btn\" id=\"ltStB\" onclick=\"ltToggle(\\'st\\')\" title=\"Ẩn / hiện đề bài để khung code rộng hơn\">◧ Ẩn đề bài</button><button class=\"btn\" id=\"ltFocusB\" onclick=\"ltToggle(\\'focus\\')\" title=\"Ẩn đề bài và thu gọn kết quả — khung code to nhất\">⛶ Tập trung code</button><button class=\"btn\" onclick=\"ltReset()\" title=\"Thay bằng code khởi tạo\">↺ Code mẫu</button></div>' +\n    '<div class=\"cedit\" id=\"cedit\"></div>' +\n    '<div class=\"lt-cin hidden\" id=\"ltCinBox\"><div class=\"cap\">Input tự nhập (stdin)</div><textarea id=\"ltCin\" spellcheck=\"false\" oninput=\"S.ltCin=this.value\">' + esc(S.ltCin || '') + '</textarea></div>' +\n    '<div class=\"lt-act\">' + (it.chayThu === false ? '<span class=\"mute\">Kỳ thi không cho chạy thử</span>' : '<label><input type=\"checkbox\" id=\"ltUseC\" onchange=\"ltCustomToggle()\"' + (S.ltUseC ? ' checked' : '') + '> Input tự nhập</label>') +\n    '<span class=\"sp\"></span><span id=\"ltInfo\"></span>' + (it.chayThu === false ? '' : '<button class=\"btn\" id=\"ltRunB\" onclick=\"ltRun()\">▶ Chạy thử</button>') + '<button class=\"btn pri\" id=\"ltSubB\" onclick=\"ltSubmit()\">⬆ Nộp code</button></div>' +\n    '<div class=\"lt-hs\" title=\"Kéo lên / xuống để đổi chiều cao khung kết quả · bấm đúp: về mặc định\" onpointerdown=\"ltDrag(event,\\'h\\')\" ondblclick=\"ltSizeReset(\\'h\\')\"></div>' +\n    '<div class=\"lt-out\" id=\"ltOut\"><div class=\"lt-tabs\"><button data-t=\"res\" onclick=\"ltTab(\\'res\\')\">Kết quả</button><button data-t=\"hist\" onclick=\"ltTab(\\'hist\\')\">Lịch sử nộp</button><span class=\"sp\"></span><button class=\"tgl\" id=\"ltOutB\" onclick=\"ltToggle(\\'out\\')\"></button></div><div class=\"lt-res\" id=\"ltRes\"></div></div></div>';\n  return '<div class=\"lt' + (LS.get('pt:ltNoSt') ? ' nost' : '') + '\" id=\"ltBox\">' + st + '<div class=\"lt-vs\" title=\"Kéo sang trái / phải để đổi độ rộng · bấm đúp: về mặc định\" onpointerdown=\"ltDrag(event,\\'v\\')\" ondblclick=\"ltSizeReset(\\'v\\')\"></div>' + ed + '</div>';\n}\nfunction ltAfterRender(it) {\n  ltMount(it); ltBar(it); ltLayout();\n  if ($('ltUseC') && S.ltUseC) $('ltCinBox').classList.remove('hidden');\n  ltTab(S.ltTabCur === 'hist' ? 'hist' : 'res');\n  if (S.ltBusy) ltBusy(S.ltBusy);\n}\n/** Quy định thư viện của bài (hiện trong đề + khi vi phạm) */\nfunction ltTvHtml(it) {\n  const v = it && it.tv; if (!v) return '';\n  const lines = [];\n  if (it.nn.includes('py') && v.py !== 'TAT_CA') lines.push('Python: ' + (v.py === 'KHONG' ? '<b>không import thư viện nào</b>' : 'chỉ <b>' + esc(v.py) + '</b>'));\n  if (it.nn.includes('c') && v.c !== 'TAT_CA') lines.push('C: chỉ <b>' + esc(v.c.split(/,\\s*/).map((h) => '<' + h + '>').join(', ')) + '</b>');\n  if (v.cam) lines.push('Không được dùng: <b>' + esc(v.cam) + '</b>');\n  if (!lines.length) return '';\n  const xs = [];\n  if (it.nn.includes('py')) xs.push('Python: không dùng <code>eval</code>, <code>exec</code>, <code>getattr</code>, <code>globals</code>, <code>__import__</code>, <code>__class__</code>…');\n  if (it.nn.includes('c') && (v.c !== 'TAT_CA' || v.cam)) xs.push('C: không tự khai báo hàm của thư viện không được phép, không dùng <code>##</code>, <code>asm</code>' + (v.c !== 'TAT_CA' ? ', <code>__builtin_…</code>' : ''));\n  if (xs.length) lines.push('<span style=\"opacity:.75;font-size:.92em\">Cách gọi gián tiếp cũng bị chặn — ' + xs.join(' · ') + '</span>');\n  return '<div class=\"lt-tv\"><span style=\"font-weight:600\">📚 Thư viện được dùng</span><br>' + lines.join('<br>') + '</div>';\n}\n/* ---- bố cục khung code: kéo đổi độ rộng đề / chiều cao kết quả, ẩn đề, thu gọn kết quả, tập trung code (nhớ trên máy) ---- */\nfunction ltLayout() {\n  const box = $('ltBox'), out = $('ltOut'); if (!box || !out) return;\n  const L = Number(LS.get('pt:ltL')) || 0; if (L) box.style.setProperty('--ltL', L + '%');\n  const O = Number(LS.get('pt:ltO')) || 0; if (O) out.style.height = O + 'px';\n  box.classList.toggle('nost', !!LS.get('pt:ltNoSt'));\n  box.querySelector('.lt-ed').classList.toggle('noout', !!LS.get('pt:ltNoOut'));\n  ltLayoutBtns();\n}\nfunction ltLayoutBtns() {\n  const box = $('ltBox'); if (!box) return;\n  const noSt = box.classList.contains('nost'), noOut = box.querySelector('.lt-ed').classList.contains('noout');\n  if ($('ltOutB')) $('ltOutB').textContent = noOut ? '▴ Mở rộng kết quả' : '▾ Thu gọn';\n  if ($('ltStB')) $('ltStB').textContent = noSt ? '◨ Hiện đề bài' : '◧ Ẩn đề bài';\n  if ($('ltFocusB')) $('ltFocusB').textContent = noSt && noOut ? '⛶ Thoát tập trung' : '⛶ Tập trung code';\n  if (S.cm) requestAnimationFrame(() => S.cm && S.cm.refresh());\n}\nfunction ltToggle(what) {\n  const box = $('ltBox'); if (!box) return;\n  const ed = box.querySelector('.lt-ed');\n  if (what === 'st') box.classList.toggle('nost');\n  else if (what === 'out') ed.classList.toggle('noout');\n  else { const on = !(box.classList.contains('nost') && ed.classList.contains('noout')); box.classList.toggle('nost', on); ed.classList.toggle('noout', on); }\n  LS.set('pt:ltNoSt', box.classList.contains('nost') ? 1 : 0); LS.set('pt:ltNoOut', ed.classList.contains('noout') ? 1 : 0);\n  ltLayoutBtns();\n}\nfunction ltOpenOut() { const box = $('ltBox'); if (box && box.querySelector('.lt-ed').classList.contains('noout')) { box.querySelector('.lt-ed').classList.remove('noout'); LS.set('pt:ltNoOut', 0); ltLayoutBtns(); } }\nfunction ltSizeReset(kind) {\n  if (kind === 'v') { LS.del('pt:ltL'); $('ltBox').style.removeProperty('--ltL'); } else { LS.del('pt:ltO'); $('ltOut').style.height = ''; }\n  ltLayoutBtns();\n}\nfunction ltDrag(e, kind) {\n  if (e.button !== 0) return;\n  e.preventDefault();\n  const box = $('ltBox'), ed = box.querySelector('.lt-ed'), out = $('ltOut');\n  let raf = 0, val = 0;\n  const move = (ev) => {\n    if (kind === 'v') {\n      const r = box.getBoundingClientRect(); val = Math.max(18, Math.min(70, (ev.clientX - r.left) / r.width * 100));\n      box.classList.remove('nost'); box.style.setProperty('--ltL', val.toFixed(1) + '%');\n    } else {\n      const r = ed.getBoundingClientRect(); val = Math.max(36, Math.min(r.height - 150, r.bottom - ev.clientY));\n      ed.classList.remove('noout'); out.style.height = Math.round(val) + 'px';\n    }\n    if (!raf) raf = requestAnimationFrame(() => { raf = 0; if (S.cm) S.cm.refresh(); });\n  };\n  const up = () => {\n    document.removeEventListener('pointermove', move); document.removeEventListener('pointerup', up); document.body.classList.remove('dragging', 'drag-v', 'drag-h');\n    if (val) { if (kind === 'v') { LS.set('pt:ltL', Math.round(val * 10) / 10); LS.set('pt:ltNoSt', 0); } else { LS.set('pt:ltO', Math.round(val)); LS.set('pt:ltNoOut', val <= 40 ? 1 : 0); if (val <= 40) ed.classList.add('noout'); } }\n    ltLayoutBtns();\n  };\n  document.body.classList.add('dragging', kind === 'v' ? 'drag-v' : 'drag-h');\n  document.addEventListener('pointermove', move); document.addEventListener('pointerup', up);\n}\n/** Dán vào khung code: chỉ cho dán đoạn đã sao chép trong chính bài thi (code của mình, input ví dụ) */\nconst ltNorm = (s) => String(s || '').replace(/\\r\\n?/g, '\\n').replace(/[ \\t]+$/gm, '').trim();\nfunction ltClipOk(x) {\n  const n = ltNorm(x); if (!n) return true;\n  if ((S.clips || []).some((c) => ltNorm(c) === n)) return true;\n  const it = S.items[S.cur];\n  if (isLt(it) && (ltNorm(ltCode()).includes(n) || (it.samples || []).some((s) => ltNorm(s.in) === n || ltNorm(s.out) === n))) return true;\n  return Object.values(S.stash[(it || {}).k] || {}).some((c) => ltNorm(c).includes(n));\n}\nfunction ltRemember(txt) { if (!txt) return; S.clips = [txt].concat((S.clips || []).filter((c) => c !== txt)).slice(0, 8); }\nfunction ltSelText(e) {\n  const t = e.target;\n  if (S.cm && t.closest && t.closest('.cedit')) { const s = S.cm.getSelection(); return s || (S.cm.getLine(S.cm.getCursor().line) + '\\n'); }\n  if (t && (t.tagName === 'TEXTAREA' || t.tagName === 'INPUT')) return t.value.substring(t.selectionStart, t.selectionEnd);\n  return String(window.getSelection ? window.getSelection() : '');\n}\n\n/* =========================================================== ĐỒNG HỒ & TỰ LƯU */\nfunction startTimers() {\n  botStart();\n  S.sigV = undefined; schedulePoll(jitter(1500, 4000));\n  clearInterval(S.tick); S.tick = setInterval(tickTimer, 500); tickTimer();\n  scheduleSave(jitter(15000, 30000));\n}\nfunction tickTimer() {\n  const el = $('timer');\n  if (!S.deadline) { el.textContent = '∞'; el.className = 'timer'; return; }\n  if (S.paused) {                                   // đồng hồ đứng yên khi tạm dừng\n    if (S.pauseRem == null) S.pauseRem = S.deadline - now();\n    el.textContent = '⏸ ' + fmtT(S.pauseRem); el.className = 'timer p'; return;\n  }\n  S.pauseRem = null;\n  const rem = S.deadline - now();\n  el.textContent = fmtT(rem);\n  el.className = 'timer' + (rem <= 60000 ? ' d' : rem <= 5 * 60000 ? ' w' : '');\n  // vạch thời gian dưới thanh trên: dài = thời gian còn lại\n  S.durRef = Math.max(S.durRef || 0, rem, (S.exam && S.exam.thoiGian ? S.exam.thoiGian * 60000 : 0));\n  const tl = $('tline'), fr = Math.max(0, Math.min(1, rem / S.durRef));\n  const st = rem <= 60000 ? ' d' : rem <= 15 * 60000 ? ' w' : '';\n  $('tbox').className = 'tbox' + st; $('ringArc').style.strokeDashoffset = (97.4 * (1 - fr)).toFixed(2);\n  if (tl) { tl.className = 'tline' + st; tl.firstChild.style.transform = 'scaleX(' + fr.toFixed(4) + ')';\n    if (!S.barH) { S.barH = $('exBar').offsetHeight; document.documentElement.style.setProperty('--barH', S.barH + 'px'); } }\n  S.warned = S.warned || {};\n  [[15, 'Còn 15 phút.'], [5, 'Còn 5 phút — hãy kiểm tra lại bài.'], [1, 'Còn 1 phút! Hết giờ hệ thống tự nộp bài.']].forEach(([m, txt]) => {\n    if (rem <= m * 60000 && rem > (m * 60000 - 20000) && !S.warned[m]) { S.warned[m] = 1; toast('⏰ ' + txt, m <= 5 ? 'w' : '', 9000); }\n  });\n  if (rem <= 0 && S.phase === 'exam') onTimeUp();\n}\nfunction setSv(kind, text) { $('sv').className = 'sv ' + (kind || ''); $('svText').textContent = text; }\nfunction scheduleSave(ms) {\n  clearTimeout(S.saveTimer);\n  if (S.phase !== 'exam') return;\n  const dirty = S.seq > S.savedSeq;\n  const fast = S.fastUntil && Date.now() < S.fastUntil;   // vừa hỏi giám thị → nhận trả lời nhanh hơn\n  // nhịp tim đều đặn để lệnh giám thị tới máy trong ≤ ~30 giây (khoá / tạm dừng: ≤ ~10 giây)\n  const d = ms != null ? ms : (S.locked || S.paused) ? jitter(6000, 10000) : fast ? jitter(8000, 12000) : dirty ? jitter(12000, 20000) : jitter(20000, 30000);\n  S.saveTimer = setTimeout(save, d);\n}\n/* Tín hiệu nhanh: hỏi nhẹ mỗi 6–20 giây (tuỳ sĩ số phòng) xem giám thị có lệnh mới cho mình không → có thì đồng bộ ngay */\nfunction schedulePoll(ms) {\n  clearTimeout(S.pollT);\n  if (S.phase !== 'exam') return;\n  S.pollT = setTimeout(poll, ms != null ? ms : jitter((S.pollIv || 8) * 800, (S.pollIv || 8) * 1200));\n}\nasync function poll() {\n  if (S.phase !== 'exam') return;\n  try {\n    const r = await call('poll', [S.ky, S.sbd], 15000);\n    if (r) {\n      if (r.iv) S.pollIv = r.iv;\n      if (r.v && r.v !== S.sigV) { const first = S.sigV === undefined; S.sigV = r.v; if (!first && r.me && !S.inflight) scheduleSave(jitter(100, 1200)); }\n    }\n  } catch (e) { }\n  schedulePoll();\n}\nasync function save() {\n  if (S.inflight || S.phase !== 'exam') { scheduleSave(); return; }\n  S.inflight = true;\n  const dirty = S.seq > S.savedSeq, seq = S.seq, ev = S.ev.splice(0);\n  const n = S.items.filter(answered).length;\n  if (dirty) setSv('busy', 'Đang lưu…');\n  try {\n    const lk = S.locked && S.lockPend ? S.lockPend : undefined;\n    const r = await call('save', [S.tok, S.ky, S.sbd, { seq: seq, a: dirty ? S.ans : null, n: n, ev: ev, env: envState(), lk: lk }]);\n    if (lk && (r.lockSaved || r.locked)) S.lockPend = null;\n    S.fails = 0;\n    if (r.saved != null) S.savedSeq = Math.max(S.savedSeq, seq);\n    S.lastSync = Date.now(); if (r.saved != null) S.lastSaved = Date.now();\n    setSv('', S.seq > S.savedSeq ? (dirty && r.saved == null ? 'Máy chủ chưa nhận bài — sẽ gửi khi nộp' : 'Có thay đổi chưa lưu') : 'Đã lưu · đồng bộ ' + clock(Date.now()));\n    // Thay đổi do giám thị → gom lại, hiện \"Đang cập nhật…\" một lần rồi áp dụng theo thứ tự (không bỏ sót, không giật)\n    const upd = [];\n    if (r.paused !== undefined && !!r.paused !== !!S.paused) upd.push([r.paused ? 'Giám thị đang tạm dừng bài thi…' : 'Đang tiếp tục bài thi…', r.paused ? 'Đồng hồ sẽ dừng, bài làm được giữ nguyên.' : 'Thời gian tạm dừng được bù lại.', () => setPaused(r.paused)]);\n    // hạn nộp thay đổi: chỉ báo \"được cộng giờ\" khi giám thị cộng thật (không phải do đang tạm dừng / vừa bù giờ tạm dừng)\n    const wasPaused = !!S.paused;\n    if (r.deadline !== undefined && r.deadline !== S.deadline) {\n      if (S.deadline && r.deadline > S.deadline + 30000 && !wasPaused && !r.paused) toast('Bạn được cộng thêm thời gian.', '', 6000);\n      S.deadline = r.deadline;\n    }\n    if (r.msg && r.msg !== S.lastMsg) { S.lastMsg = r.msg; banner('📢 ' + esc(r.msg), 'info', true); toast('📢 Thông báo mới từ giám thị', '', 5000); }\n    if (!r.msg && S.lastMsg) { S.lastMsg = ''; banner(); }\n    if (r.unlock) upd.push(['Giám thị đang mở khoá bài thi…', 'Bạn sẽ làm bài tiếp ngay sau đây.', () => { S.locked = false; S.lockPend = null; S.vpLocal = 0; overlay(); ltRoSync(); strictGate(); toast('Giám thị đã mở khoá bài thi.', '', 6000); }]);\n    if (r.pmsg) upd.push(['Giám thị đang gửi tin nhắn cho bạn…', '', () => overlayMsg(r.pmsg)]);\n    if (r.locked && !S.locked && !r.unlock) lockScreen();\n    if (r.done) { finishedElsewhere(); return; }\n    if (r.cmd === 'SUBMIT') upd.push(['Giám thị đang thu bài…', 'Bài làm của bạn sẽ được nộp ngay.', () => doSubmit(true)]);\n    if (upd.length) {\n      S.updating = true;\n      const one = upd.length === 1 ? upd[0] : ['Giám thị đang cập nhật bài thi của bạn…', 'Vui lòng chờ trong giây lát.'];\n      updating(one[0], one[1], () => { S.updating = false; upd.forEach((u) => { try { if (S.phase === 'exam') u[2](); } catch (e) { } }); scheduleSave(); }, upd.length === 1 && r.pmsg ? 1100 : 1400);\n    }\n    if (r.closed || r.timeUp) { S.inflight = false; onTimeUp(); return; }\n  } catch (e) {\n    S.ev = ev.concat(S.ev);\n    if (handleFatal(e)) { S.inflight = false; return; }\n    S.fails++;\n    setSv('bad', 'Chưa lưu được — bài vẫn giữ trên máy, đang thử lại');\n    if (S.fails >= 3) banner('⚠ Mất kết nối tới máy chủ. Cứ tiếp tục làm bài — hệ thống tự gửi lại khi có mạng. Không đóng cửa sổ.', 'warn');\n  } finally { S.inflight = false; }\n  if (S.fails === 0 && $('banner').textContent.indexOf('Mất kết nối') >= 0) banner();\n  scheduleSave(S.fails ? Math.min(60000, 4000 * Math.pow(1.6, S.fails)) * jitter(0.7, 1.3) : null);\n}\nfunction overlayMsg(t) { S.fastUntil = 0; overlay('<h2>💬 Tin nhắn từ giám thị</h2><p style=\"white-space:pre-wrap\">' + esc(t) + '</p><div class=\"btns\"><button class=\"btn pri\" onclick=\"overlay()\">Đã hiểu</button></div>'); }\n\n/* =========================================================== CHỐNG GIAN LẬN */\nconst SERIOUS = ['ROI_TAB', 'ROI_CUA_SO', 'THOAT_TOAN_MAN', 'MAN_HINH_PHU', 'CUA_SO_NHO', 'CHUP_MAN_HINH'];\nconst EV_TXT = { ROI_TAB: 'rời khỏi trang thi', ROI_CUA_SO: 'chuyển sang cửa sổ khác', THOAT_TOAN_MAN: 'thoát chế độ toàn màn hình', MAN_HINH_PHU: 'dùng màn hình phụ', THOAT_TOAN_MAN_LO: 'lỡ tay thoát toàn màn hình (đã quay lại kịp)', CUA_SO_NHO: 'thu nhỏ / chia đôi cửa sổ thi', CHUP_MAN_HINH: 'bấm phím chụp màn hình' };\nfunction ev(k, d) {\n  if (S.phase === 'banned' && SERIOUS.includes(k) && S.ky) {          // đang bị đình chỉ: vẫn ghi lại, gửi lên khi được cho thi tiếp\n    const key = 'pt:dc:' + S.ky + ':' + S.sbd, a = LS.get(key) || [];\n    a.push({ k: 'DC_' + k, d: d || 0, t: Date.now() }); LS.set(key, a.slice(-50)); return;\n  }\n  if (S.phase !== 'exam') return;\n  if (ACOFF()) { if (SERIOUS.includes(k) || ['SAO_CHEP', 'DAN', 'PHIM_TAT'].includes(k)) thuNote('⚠ ' + (EV_TXT[k] || { SAO_CHEP: 'sao chép nội dung đề', DAN: 'dán từ ngoài vào', PHIM_TAT: 'bấm phím tắt bị cấm' }[k] || k) + (d ? ' (' + d + ' giây)' : '') + (SERIOUS.includes(k) ? ' → thi thật tính 1 vi phạm' + (S.strict || k === 'CHUP_MAN_HINH' ? ' và KHOÁ BÀI' : '') : ' → thi thật bị chặn + ghi nhật ký'), k); return; }\n  // Trong SEB không thể rời sang ứng dụng khác → thao tác với pin, đồng hồ, Wi-Fi, nút tải lại… của SEB chỉ được ghi nhận, không cảnh báo\n  if (isSeb() && SERIOUS.includes(k)) k = k === 'ROI_CUA_SO' ? 'SEB_THANH_CC' : 'SEB_' + k;\n  if (S.locked && SERIOUS.includes(k)) k = 'TD_' + k;                  // đã khoá rồi: chỉ ghi, không cộng thêm (TẠM DỪNG vẫn tính — không có lý do rời màn hình)\n  S.ev.push({ k: k, d: d || 0, t: Date.now() });\n  if (SERIOUS.includes(k)) {\n    S.vpLocal++;\n    // khoá ngay (giám thị nhập mã / mở từ máy giám thị): chế độ nghiêm ngặt · đang TẠM DỪNG (không có lý do rời màn hình) · chụp màn hình\n    if (S.strict || S.paused || k === 'CHUP_MAN_HINH') { lockScreen((EV_TXT[k] || 'rời khỏi màn hình thi') + (S.paused && !S.strict ? ' trong lúc tạm dừng' : '')); scheduleSave(jitter(800, 2000)); return; }\n    toast('⚠ Bạn vừa ' + (EV_TXT[k] || 'rời khỏi màn hình thi') + (d ? ' (' + d + ' giây)' : '') + '. Hành vi này đã được ghi lại' + (S.vpMax ? ' — lần ' + S.vpLocal + '/' + S.vpMax : '') + '.', 'w', 7000);\n    if (S.vpMax && S.vpLocal >= S.vpMax) lockScreen();\n    scheduleSave(jitter(2000, 6000));\n  }\n}\n/* ---------- CHẾ ĐỘ NGHIÊM NGẶT (thi bằng link): toàn màn hình bắt buộc, 1 màn hình, rời là khoá, mở bằng mã giám thị ---------- */\nfunction envState() { return { fs: document.fullscreenElement ? 1 : 0, ext: screen.isExtended ? 1 : 0, foc: document.hasFocus() ? 1 : 0 }; }\nfunction fsUsable() { return !!document.fullscreenEnabled && (S.fsFail || 0) < 3; }\nfunction strictGate() {\n  if (S.graceT) return;                                 // đang đếm 4 giây \"lỡ tay\" sau khi thoát toàn màn hình\n  if (S.phase !== 'exam' || isSeb() || ACOFF()) { $('gate').classList.add('hidden'); document.body.classList.remove('blurred'); return; }\n  document.body.classList.toggle('blurred', document.hidden || !document.hasFocus());\n  if (S.locked || S.paused || S.updating) { $('gate').classList.add('hidden'); return; }   // màn tạm dừng / khoá tự có nút bật lại toàn màn hình\n  let need = '';\n  // MỌI kỳ thi bằng link: đề chỉ hiện ở chế độ toàn màn hình. Nghiêm ngặt: thêm cấm màn hình phụ / cửa sổ nhỏ\n  if (S.strict && screen.isExtended) need = 'ext';\n  else if (fsUsable() && !document.fullscreenElement) need = 'fs';\n  else if (S.strict && !fsUsable() && (window.innerWidth < screen.availWidth * 0.9 || window.innerHeight < screen.availHeight * 0.75)) need = 'small';\n  if (need === 'ext' && !S.extLogged) { S.extLogged = 1; ev('MAN_HINH_PHU'); return; }\n  if (need !== 'ext') S.extLogged = 0;\n  if (need === 'small' && !S.smallLogged && S.gateSeen) { S.smallLogged = 1; ev('CUA_SO_NHO'); return; }\n  if (need !== 'small') S.smallLogged = 0;\n  const g = $('gate');\n  if (!need) { g.classList.add('hidden'); S.gateSeen = 1; return; }\n  const T = {\n    fs: ['Làm bài ở chế độ toàn màn hình', S.strict ? 'Kỳ thi này yêu cầu toàn màn hình. Rời khỏi toàn màn hình, chuyển tab hay mở ứng dụng khác sẽ <b>khoá bài ngay</b> — chỉ giám thị mở được.'\n      : 'Đề thi chỉ hiện ở chế độ toàn màn hình. Mỗi lần thoát toàn màn hình, chuyển tab hay mở ứng dụng khác đều được <b>ghi lại và tính vi phạm</b>' + (S.vpMax ? ' (quá ' + S.vpMax + ' lần sẽ bị khoá bài)' : '') + '.', '<button class=\"btn pri big\" onclick=\"tryFullscreen()\">Bật toàn màn hình</button>' + ((S.fsFail || 0) ? '<p class=\"mute\" style=\"margin-top:10px\">Không bật được? Bấm lại lần nữa hoặc báo giám thị.</p>' : '')],\n    ext: ['Ngắt màn hình phụ', 'Máy đang nối <b>2 màn hình</b>. Hãy rút cáp / tắt màn hình phụ (hoặc chọn \"Chỉ màn hình máy tính\") để tiếp tục.', '<button class=\"btn pri\" onclick=\"strictGate()\">Tôi đã ngắt, kiểm tra lại</button>'],\n    small: ['Phóng to cửa sổ thi', 'Cửa sổ thi phải chiếm toàn bộ màn hình. Hãy phóng to cửa sổ (nút □ hoặc nhấp đúp thanh tiêu đề).', '<button class=\"btn pri\" onclick=\"strictGate()\">Kiểm tra lại</button>']\n  }[need];\n  $('gateBox').innerHTML = '<div class=\"gate-ic\">' + (need === 'ext' ? '▣▣' : '⛶') + '</div><h2>' + T[0] + '</h2><p>' + T[1] + '</p>' + T[2];\n  g.classList.remove('hidden');\n}\nasync function doUnlock() {\n  const code = ($('ulCode').value || '').trim(); if (!code) return;\n  tryFullscreen();                                     // cú bấm của giám thị = thao tác người dùng → bật lại toàn màn hình được\n  const ev0 = S.ev.splice(0), b = $('ulBtn'); b.disabled = true;\n  try {\n    await callRetry('unlock', [S.tok, S.ky, S.sbd, code, { ev: ev0 }], 3);\n    S.lockPend = null; S.locked = false; S.vpLocal = 0; overlay(); toast('Đã mở khoá. Tiếp tục làm bài.', '', 5000); strictGate(); scheduleSave();\n  } catch (e) {\n    S.ev.unshift(...ev0);\n    if (handleFatal(e)) return;\n    $('ulErr').textContent = e.message; $('ulErr').classList.remove('hidden'); b.disabled = false; $('ulCode').select();\n  }\n}\nsetInterval(() => { if (S.phase === 'exam') strictGate(); }, 2000);\nwindow.addEventListener('resize', () => { clearTimeout(S.rzT); S.rzT = setTimeout(strictGate, 400); });\nif (screen.addEventListener) try { screen.addEventListener('change', strictGate); } catch (e) { }\nfunction lockScreen(why) {\n  S.lockWhy = why || (S.locked ? S.lockWhy : '');                    // lý do mới (hoặc giữ lý do cũ khi đang khoá); không lý do = khoá vì quá số lần vi phạm\n  if (!S.locked) S.lockPend = why || S.lockWhy || 'rời khỏi màn hình thi';      // báo máy chủ khoá luôn → tải lại trang vẫn khoá\n  ltFlush(); S.locked = true; drawHold(); ltRoSync(); if (S.thu) thuBar();\n  scheduleSave(jitter(5000, 9000));\n}\nfunction setPaused(p) {\n  if (!!p === !!S.paused) return;\n  S.paused = !!p;\n  if (S.paused) { drawHold(); toast('Giám thị đã tạm dừng bài thi.', 'w', 6000); }\n  else { overlay(); toast('Bài thi tiếp tục — thời gian dừng đã được bù.', '', 6000); strictGate(); }\n  ltRoSync(); tickTimer(); scheduleSave();\n}\nfunction ltRoSync() { if (S.cm) S.cm.setOption('readOnly', ltRO()); if (S.cmTa) S.cmTa.readOnly = ltRO(); }\ndocument.addEventListener('visibilitychange', () => {\n  if (document.hidden) { S.hideAt = Date.now(); }\n  else if (S.hideAt) { const s = Math.round((Date.now() - S.hideAt) / 1000); S.hideAt = 0; S.blurAt = 0; ev('ROI_TAB', s); }\n});\nwindow.addEventListener('blur', () => {\n  if (!document.hidden) S.blurAt = Date.now();\n  if (S.phase === 'exam' && !isSeb() && !ACOFF()) {\n    document.body.classList.add('blurred');\n    if (S.shieldAt && Date.now() - S.shieldAt < 2500) { S.shieldAt = 0; ev('CHUP_MAN_HINH'); }   // phím Windows rồi mở công cụ chụp\n  }\n});\nwindow.addEventListener('focus', () => {\n  if (!S.shieldAt) document.body.classList.remove('shield');\n  // Trong SEB không thể rời sang ứng dụng khác; mất focus là do bấm thanh công cụ của SEB (wifi, pin, đồng hồ…) → chỉ ghi nhận, KHÔNG tính vi phạm\n  if (S.blurAt && !S.hideAt) { const s = (Date.now() - S.blurAt) / 1000; if (s >= (S.strict || S.paused ? 1 : 3)) ev(isSeb() ? 'SEB_THANH_CC' : 'ROI_CUA_SO', Math.round(s)); }\n  S.blurAt = 0; strictGate();\n});\n/* ---- Thoát toàn màn hình (Esc): trình duyệt KHÔNG cho trang web chặn / trì hoãn phím Esc (trang Apps Script nằm trong khung của Google\n   nên cả \"giữ Esc\" của Chrome cũng không dùng được). Thay vào đó: thoát là che kín đề ngay, có FS_GRACE giây để bấm quay lại.\n   Quay lại kịp → chỉ ghi \"lỡ tay\" (tối đa FS_GRACE_MAX lần / bài); quá giờ hoặc quá số lần → tính vi phạm như cũ. ---- */\nconst FS_GRACE = 4, FS_GRACE_MAX = 2;\nfunction fsExitFinal() {\n  if (S.phase !== 'exam') return;\n  ev('THOAT_TOAN_MAN');\n  if (S.strict) { strictGate(); return; }\n  banner('Bạn đã thoát chế độ toàn màn hình. <button class=\"btn\" style=\"margin-left:8px\" onclick=\"tryFullscreen();banner()\">Vào lại toàn màn hình</button>', 'warn');\n}\nfunction fsGraceEnd(back) {\n  clearInterval(S.graceT); S.graceT = null; document.body.classList.remove('fsgrace'); $('gate').classList.add('hidden'); $('gate').classList.remove('top');\n  if (back) { ev('THOAT_TOAN_MAN_LO', S.graceN); toast('Đã quay lại toàn màn hình (lỡ tay ' + S.graceN + '/' + FS_GRACE_MAX + ' — lần sau sẽ tính vi phạm).', 'w', 5000); strictGate(); }\n  else fsExitFinal();\n}\nfunction fsGrace() {\n  S.graceN = (S.graceN || 0) + 1;\n  if (S.graceN > FS_GRACE_MAX) { fsExitFinal(); return; }\n  const end = Date.now() + FS_GRACE * 1000;\n  document.body.classList.add('fsgrace'); $('gate').classList.add('top');\n  $('gateBox').innerHTML = '<div class=\"gate-ic\">⛶</div><h2>Bạn vừa thoát toàn màn hình</h2><p>Bấm nút dưới trong <b id=\"fsLeft\">' + FS_GRACE + '</b> giây để quay lại — '\n    + 'sẽ chỉ ghi là <b>lỡ tay</b> (còn ' + (FS_GRACE_MAX - S.graceN) + ' lần). Quá thời gian sẽ bị tính <b>vi phạm</b>' + (S.strict ? ' và <b>khoá bài</b>' : '') + '.</p>'\n    + '<button class=\"btn pri big\" onclick=\"tryFullscreen()\">Quay lại toàn màn hình</button>';\n  $('gate').classList.remove('hidden');\n  clearInterval(S.graceT);\n  S.graceT = setInterval(() => {\n    const left = Math.ceil((end - Date.now()) / 1000), el = $('fsLeft');\n    if (el) el.textContent = Math.max(0, left);\n    if (left <= 0) fsGraceEnd(false);\n  }, 200);\n}\ndocument.addEventListener('fullscreenchange', () => {\n  if (document.fullscreenElement) { S.fsOn = true; banner(); if (S.graceT) { fsGraceEnd(true); return; } if (S.phase === 'exam' && (S.paused || S.locked) && !$('ov').classList.contains('hidden')) drawHold(); strictGate(); return; }\n  if (S.phase === 'banned') { ev('THOAT_TOAN_MAN'); return; }   // đang bị đình chỉ: ghi lại\n  if (ACOFF()) { if (S.fsOn && S.phase === 'exam') thuNote('⚠ thoát toàn màn hình → thi thật có ' + FS_GRACE + ' giây quay lại, quá giờ tính vi phạm' + (S.strict ? ' và KHOÁ BÀI' : ''), 'fs'); S.fsOn = false; return; }\n  if (S.graceT) return;                                 // đang đếm ngược rồi (trình duyệt có thể báo thoát 2 lần)\n  if (S.locked && S.phase === 'exam') { S.fsOn = false; ev('THOAT_TOAN_MAN'); drawHold(); return; }      // đã khoá: ghi lại + màn khoá có nút bật lại\n  if (S.fsOn && S.phase === 'exam' && !isSeb() && !S.submitting) { S.fsOn = false; fsGrace(); return; }   // fsOn=false: bỏ qua báo thoát lặp lại\n  if (S.fsOn && S.phase === 'exam' && S.strict) { ev('THOAT_TOAN_MAN'); strictGate(); return; }\n  if (S.fsOn && S.phase === 'exam') { ev('THOAT_TOAN_MAN'); banner('Bạn đã thoát chế độ toàn màn hình. <button class=\"btn\" style=\"margin-left:8px\" onclick=\"tryFullscreen();banner()\">Vào lại toàn màn hình</button>', 'warn'); }\n});\n// Sao chép / cắt: chặn, TRỪ trong khung code, ô input tự nhập và dữ liệu ví dụ của bài lập trình (ghi nhớ để cho dán lại)\nconst inCodeZone = (t) => !!(t && t.closest && t.closest('.cedit, .lt-cin, .lt-io'));\n['copy', 'cut'].forEach((t) => document.addEventListener(t, (e) => {\n  if (S.phase !== 'exam') return;\n  if (ACOFF()) { const tg0 = e.target && e.target.nodeType === 3 ? e.target.parentNode : e.target; if (inCodeZone(tg0)) ltRemember(ltSelText({ target: tg0 })); else thuNote('⚠ sao chép nội dung đề → thi thật bị chặn + ghi nhật ký', 'SAO_CHEP'); return; }\n  const tg = e.target && e.target.nodeType === 3 ? e.target.parentNode : e.target;\n  const an = window.getSelection && window.getSelection().anchorNode, ae = an && (an.nodeType === 3 ? an.parentNode : an);\n  if (inCodeZone(tg) || inCodeZone(ae)) { ltRemember(ltSelText({ target: tg })); return; }\n  e.preventDefault(); ev('SAO_CHEP');\n}));\n// Dán: chỉ ô trả lời ngắn; khung code chỉ nhận đoạn đã sao chép TRONG bài thi (không dán code từ nơi khác)\ndocument.addEventListener('paste', (e) => {\n  if (S.phase !== 'exam' || ACOFF()) return;\n  const tg = e.target;\n  if (tg && tg.closest && tg.closest('.short')) return;\n  if (tg && tg.closest && tg.closest('.cedit, .lt-cin')) {\n    const x = (e.clipboardData && e.clipboardData.getData('text')) || '';\n    if (ltClipOk(x)) { ltPasted(nonWs(x)); return; }\n    e.preventDefault(); e.stopPropagation(); ev('DAN'); toast('Chỉ dán được đoạn đã sao chép trong bài thi này.', 'w', 3500); return;\n  }\n  e.preventDefault(); ev('DAN');\n}, true);\ndocument.addEventListener('drop', (e) => { if (S.phase === 'exam' && !ACOFF()) { e.preventDefault(); e.stopPropagation(); } }, true);\ndocument.addEventListener('contextmenu', (e) => { if (S.phase === 'exam' && !ACOFF()) { e.preventDefault(); } });\ndocument.addEventListener('dragstart', (e) => e.preventDefault());\ndocument.addEventListener('keydown', (e) => {\n  if (S.phase !== 'exam') return;\n  const k = e.key, ctl = e.ctrlKey || e.metaKey;\n  const it0 = S.items[S.cur], inCode = isLt(it0) && e.target && e.target.closest && e.target.closest('.cedit, .lt-cin');\n  if (isLt(it0) && ctl && k === 'Enter' && $('ov').classList.contains('hidden')) { e.preventDefault(); if (e.shiftKey) ltSubmit(); else ltRun(); return; }\n  if (inCode) {\n    if (ctl && /^[cxavzy]$/i.test(k) && !e.shiftKey) return;                     // soạn code bình thường\n    if (ctl && /^s$/i.test(k)) { e.preventDefault(); ltFlush(); toast('Code đã được lưu.', '', 1800); return; }\n  }\n  if (ACOFF()) {                                                                   // thi thử tắt chống gian lận: không chặn phím, chỉ ghi chú\n    if (k === 'PrintScreen' || k === 'F12' || (ctl && e.shiftKey && /^[ijc]$/i.test(k))) thuNote('⚠ bấm ' + (k === 'PrintScreen' ? 'phím chụp màn hình' : 'phím mở công cụ nhà phát triển') + ' → thi thật bị chặn' + (k === 'PrintScreen' ? ', tính vi phạm và KHOÁ BÀI' : ' + ghi nhật ký'), 'k' + k);\n  } else {\n  if (k === 'PrintScreen' || (e.metaKey && e.shiftKey && /^[345s]$/i.test(k))) { e.preventDefault(); prtScr(); return; }\n  // Windows: phím Win (không dùng để làm bài) · Mac: Cmd+Shift (Cmd riêng dùng để Cmd+C/V/Z trong khung code nên không che)\n  if (!isSeb() && ((!IS_MAC && (k === 'Meta' || k === 'OS')) || (e.metaKey && e.shiftKey))) { shieldOn(); return; }\n  if (k === 'F12' || (ctl && /^[cpsuxa]$/i.test(k) && !(e.target.closest && e.target.closest('.short') && /^[cxa]$/i.test(k))) || (ctl && e.shiftKey && /^[ijc]$/i.test(k))) {\n    e.preventDefault(); ev('PHIM_TAT', 0); return;\n  }\n  }\n  if (k === 'F5' || (ctl && /^r$/i.test(k))) { ltFlush(); persist(); return; }\n  if (S.locked || S.paused || $('ov').classList.contains('hidden') === false) return;\n  if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT' || e.target.tagName === 'TEXTAREA')) return;\n  if (inCode || isLt(it0)) return;                                                  // bài lập trình: không dùng phím tắt chọn đáp án / chuyển câu\n  const it = S.items[S.cur];\n  if (k === 'ArrowRight') { go(S.cur + 1); e.preventDefault(); }\n  else if (k === 'ArrowLeft') { go(S.cur - 1); e.preventDefault(); }\n  else if ((it.dang === 'MOT_DA' || it.dang === 'NHIEU_DA') && !ctl) {\n    let idx = L.indexOf(k.toUpperCase()); if (idx < 0 && /^[1-9]$/.test(k)) idx = Number(k) - 1;\n    if (idx >= 0 && idx < it.opts.length) { pick(L[idx]); e.preventDefault(); }\n  }\n});\n/** Chụp màn hình: trình duyệt KHÔNG chặn được phím của hệ điều hành (chỉ SEB chặn được). Làm hết mức có thể:\n    che đề ngay, ghi đè clipboard (ảnh vừa chụp bằng PrtSc bị xoá), tính vi phạm. Snipping Tool / Win+Shift+S làm trang mất focus → bị tính \"chuyển cửa sổ\". */\nfunction prtScr() {\n  if (S.phase !== 'exam' || isSeb() || ACOFF() || Date.now() - (S.prtAt || 0) < 1500) return;\n  S.prtAt = Date.now();\n  document.body.classList.add('blurred'); setTimeout(() => { if (document.hasFocus()) document.body.classList.remove('blurred'); }, 1500);\n  try { if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText('Ảnh chụp màn hình bài thi đã bị xoá').catch(() => { }); } catch (x) { }\n  ev('CHUP_MAN_HINH');\n}\ndocument.addEventListener('keyup', (e) => {\n  if (e.key === 'PrintScreen' || e.code === 'PrintScreen') prtScr();\n  if (e.key === 'Meta' || e.key === 'OS') shieldOff(900);\n}, true);\n/* Chặn chụp màn hình: trình duyệt KHÔNG chặn được phím chụp của hệ điều hành, nên che kín đề NGAY khi vừa chạm phím Windows / Cmd+Shift\n   (Win+Shift+S, Win+PrtScn, Cmd+Shift+3/4/5 đều bắt đầu bằng phím này) → ảnh chụp chỉ thấy màn trắng. Chạm phím rồi cửa sổ mất tập trung ngay\n   (công cụ chụp mở ra) → tính \"chụp màn hình\" và khoá bài. */\nconst IS_MAC = /Mac|iPhone|iPad/i.test(navigator.platform || navigator.userAgent || '');\nfunction shieldOn() {\n  if (S.phase !== 'exam' || ACOFF()) return;\n  S.shieldAt = Date.now(); document.body.classList.add('shield'); clearTimeout(S.shieldT);\n  S.shieldT = setTimeout(() => shieldOff(0), 6000);\n}\nfunction shieldOff(ms) { clearTimeout(S.shieldT); S.shieldT = setTimeout(() => { S.shieldAt = 0; if (document.hasFocus()) document.body.classList.remove('shield'); }, ms || 0); }\nwindow.addEventListener('online', () => { toast('Đã có mạng trở lại.'); if (S.phase === 'exam') scheduleSave(jitter(1000, 4000)); });\nwindow.addEventListener('offline', () => { if (S.phase === 'exam') { setSv('bad', 'Mất mạng — bài vẫn giữ trên máy'); ev('MAT_MANG'); } });\nwindow.addEventListener('beforeunload', (e) => { ltFlush(); persist(); if (S.phase === 'exam') { e.preventDefault(); e.returnValue = ''; } });\n\nfunction watermark() {\n  const t = (S.thu ? 'THI THỬ · GIÁM THỊ · không tính kết quả' : S.sbd + ' · ' + (S.me ? S.me.hoTen : '')).replace(/[<&]/g, '');\n  const svg = '<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"360\" height=\"220\"><text x=\"10\" y=\"130\" transform=\"rotate(-24 180 110)\" font-family=\"Arial\" font-size=\"17\" fill=\"#0b2545\">' + t + '</text></svg>';\n  $('wm').style.backgroundImage = 'url(\"data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg) + '\")';\n}\n\n/* =========================================================== THI THỬ CỦA GIÁM THỊ */\nS.thuLog = [];\nfunction thuBar() {\n  const b = $('thuBar'), x = S.thu; if (!x) { b.classList.add('hidden'); return; }\n  document.body.classList.toggle('acoff', ACOFF());\n  const left = Math.max(0, Math.round((x.exp - Date.now()) / 3600000 * 10) / 10);\n  const des = (x.des || []).length > 1 ? '<select class=\"tb-more\" title=\"Đổi mã đề (làm lại từ đầu)\" onchange=\"thuDe(this.value)\">' + x.des.map((d) => '<option' + (S.me && d === S.me.maDe ? ' selected' : '') + '>' + esc(d) + '</option>').join('') + '</select>'\n    : '<span class=\"tb-more\">Mã đề ' + esc(S.me ? S.me.maDe : '') + '</span>';\n  b.className = (b.classList.contains('min') ? 'min' : '');\n  b.innerHTML = '<b class=\"tb-t\" title=\"Bài thử KHÔNG tính kết quả, không hiện trên bảng giám sát. Link còn hạn ' + left + ' giờ.\">🧪 THI THỬ</b>' + des +\n    '<button class=\"tb-g ' + (x.guard ? 'on' : 'off') + '\" onclick=\"thuGuard()\" title=\"' + (x.guard ? 'Đang chạy chống gian lận như thi thật (toàn màn hình, ghi vi phạm, khoá bài, phát hiện tác tử AI). Bấm để tắt.' : 'Chống gian lận đang TẮT: không khoá, không bắt toàn màn hình, được sao chép. Những gì thi thật sẽ bắt được ghi ở ô bên cạnh. Bấm để bật như thi thật.') + '\">🛡 Chống gian lận: ' + (x.guard ? 'BẬT' : 'TẮT') + '</button>' +\n    '<button class=\"tb-more\" onclick=\"thuLogToggle()\" title=\"Những gì hệ thống chống gian lận sẽ ghi nhận nếu là thi thật\">📋 Sẽ ghi nhận<span class=\"tb-n\">' + S.thuLog.length + '</span></button>' +\n    (S.locked ? '<button onclick=\"thuUnlock()\" style=\"background:#1d4ed8\">🔓 Mở khoá</button>' : '') +\n    '<button class=\"tb-more\" onclick=\"thuReset()\" title=\"Xoá bài thử, bắt đầu lại từ phòng chờ\">♻ Làm lại</button>' +\n    '<button class=\"tb-more\" onclick=\"thuExit()\" title=\"Thoát thi thử\">✕ Thoát</button>' +\n    '<button onclick=\"$(\\'thuBar\\').classList.toggle(\\'min\\');$(\\'thuLog\\').classList.add(\\'hidden\\')\" title=\"Thu gọn / mở rộng thanh thi thử\">' + (b.classList.contains('min') ? '»' : '«') + '</button>';\n}\nfunction thuNote(text, key) {\n  const t = Date.now(), last = S.thuLog[S.thuLog.length - 1];\n  if (last && last.key === key && t - last.t < 3000) return;               // gộp thao tác lặp liên tiếp\n  S.thuLog.push({ t: t, text: text, key: key }); if (S.thuLog.length > 200) S.thuLog.shift();\n  if (t - (S.thuToastAt || 0) > 4000) { S.thuToastAt = t; toast('🧪 ' + text, 'w', 4500); }\n  thuBar(); if (!$('thuLog').classList.contains('hidden')) thuLogToggle(true);\n}\nfunction thuLogToggle(keep) {\n  const el = $('thuLog');\n  if (!keep && !el.classList.contains('hidden')) { el.classList.add('hidden'); return; }\n  el.innerHTML = '<b>📋 Thi thật hệ thống sẽ ghi nhận</b> <span class=\"mute\">(chống gian lận đang ' + (S.thu.guard ? 'BẬT — ghi như thi thật' : 'TẮT') + ')</span>' +\n    (S.thuLog.length ? '<ol>' + S.thuLog.slice().reverse().map((x) => '<li><span class=\"mute\">' + clock(x.t) + '</span> ' + esc(x.text) + '</li>').join('') + '</ol>' : '<p class=\"mute\">Chưa có gì. Thử chuyển tab, thoát toàn màn hình, bấm PrintScreen, sao chép đề… để xem hệ thống phản ứng thế nào.</p>') +\n    '<div class=\"btns\"><button class=\"btn\" onclick=\"S.thuLog=[];thuBar();$(\\'thuLog\\').classList.add(\\'hidden\\')\">Xoá danh sách</button></div>';\n  el.classList.remove('hidden');\n}\nfunction thuGuard() {\n  S.thu.guard = !S.thu.guard; LS.set('pt:thuG:' + S.ky, S.thu.guard ? 1 : 0);\n  thuBar();\n  if (S.thu.guard) {\n    toast('🛡 Đã BẬT chống gian lận như thi thật: toàn màn hình, ghi vi phạm, khoá bài. Bị khoá → bấm 🔓 Mở khoá trên thanh thi thử.', '', 7000);\n    if (S.phase === 'exam') { tryFullscreen(); strictGate(); }\n  } else {\n    toast('Đã TẮT chống gian lận (chỉ ghi chú lại những gì thi thật sẽ bắt).', '', 5000);\n    S.vpLocal = 0; strictGate(); if (S.graceT) { clearInterval(S.graceT); S.graceT = null; document.body.classList.remove('fsgrace'); $('gate').classList.add('hidden'); $('gate').classList.remove('top'); }\n  }\n}\nasync function thuCtl(act, arg, msg) {\n  updating(msg || 'Đang xử lý…', '', () => { }, 600);\n  try { return await callRetry('thuCtl', [S.tok, S.ky, S.sbd, act, arg], 4); }\n  catch (e) { overlay(); if (!handleFatal(e)) toast(e.message, 'e', 6000); throw e; }\n}\nasync function thuUnlock() {\n  try { await thuCtl('unlock', '', 'Đang mở khoá bài thử…'); } catch (e) { return; }\n  S.locked = false; S.lockPend = null; S.vpLocal = 0; overlay(); ltRoSync(); thuBar(); if (!ACOFF()) { tryFullscreen(); strictGate(); } toast('Đã mở khoá bài thử.', '', 4000);\n}\nfunction thuClearLocal() { try { Object.keys(localStorage).filter((k) => k.indexOf('pt:' + S.ky + ':' + S.sbd + ':') === 0).forEach((k) => localStorage.removeItem(k)); } catch (e) { } }\nasync function thuReset(md) {\n  if (!md && !confirm('Xoá bài thử và làm lại từ đầu?')) return;\n  try { await thuCtl(md ? 'de' : 'reset', md || '', md ? 'Đang đổi sang mã đề ' + md + '…' : 'Đang xoá bài thử…'); } catch (e) { thuBar(); return; }\n  S.phase = 'reload'; clearInterval(S.tick); clearTimeout(S.saveTimer); thuClearLocal(); location.reload();\n}\nfunction thuDe(md) { if (S.me && md !== S.me.maDe && confirm('Đổi sang mã đề ' + md + '? Bài thử hiện tại sẽ bị xoá.')) thuReset(md); else thuBar(); }\nfunction thuExit() {\n  if (!confirm('Thoát thi thử? (Bài thử vẫn giữ để chấm ở trang quản trị cho tới khi tạo link mới.)')) return;\n  S.phase = 'exit'; clearInterval(S.tick); clearTimeout(S.saveTimer); clearTimeout(S.waitTimer);\n  try { if (document.fullscreenElement) document.exitFullscreen(); } catch (e) { }\n  LS.del('pt:last'); urlClear(); setTimeout(() => location.reload(), 200);\n}\nfunction thuDone(r, n) {\n  S.phase = 'done'; clearInterval(S.tick); clearTimeout(S.saveTimer); overlay(); banner();\n  try { if (document.fullscreenElement) document.exitFullscreen(); } catch (e) { }\n  S.thu.done = true; thuClearLocal(); thuBar();\n  const items = S.items || [];\n  $('doneBox').innerHTML = '<div class=\"ic\">🧪</div><h2 style=\"margin:6px 0\">Đã nộp bài thử</h2>' +\n    '<p>Mã đề <b>' + esc(S.me.maDe) + '</b>' + (r && r.at ? ' · nộp lúc <b>' + clock(r.at) + '</b>' : '') + (items.length ? ' · đã làm <b>' + (n != null ? n : items.filter(answered).length) + '/' + items.length + '</b> câu' : '') + '</p>' +\n    (r && r.receipt ? '<div class=\"mute\">Mã xác nhận (thí sinh thật sẽ thấy)</div><div class=\"rc\">' + esc(r.receipt) + '</div>' : '') +\n    '<p>Xem <b>điểm và đúng / sai từng câu</b> (chấm bằng đúng bộ chấm thật): trang quản trị › <b>⑤ Phòng thi web</b> › <b>👁 Thi thử</b> › <b>📊 Chấm bài thử</b>.</p>' +\n    '<p class=\"mute\">Bài thử không tính vào kết quả và không hiện trên bảng giám sát.</p>' +\n    '<div class=\"btns\" style=\"justify-content:center\"><button class=\"btn pri\" onclick=\"thuReset()\">♻ Làm lại bài thử</button><button class=\"btn\" onclick=\"thuExit()\">✕ Thoát</button></div>';\n  show('scrDone');\n}\nasync function thuBoot(key) {\n  show('scrLogin'); $('lgSub').textContent = 'Đang mở bài thi thử của giám thị…';\n  try {\n    const r = await callRetry('thuLogin', [key, { ua: navigator.userAgent }], 4);\n    try { Object.keys(localStorage).filter((k) => k.indexOf('pt:' + r.ky + ':' + r.sbd + ':') === 0).forEach((k) => localStorage.removeItem(k)); } catch (e) { }\n    enter(r);\n    toast('🧪 Chế độ THI THỬ của giám thị — bài làm không tính kết quả.', '', 6000);\n  } catch (e) {\n    if (handleFatal(e)) return;\n    bootLogin(); $('lgErr').textContent = e.message; $('lgErr').classList.remove('hidden');\n  }\n}\nsetInterval(() => { if (S.thu && S.thu.exp && Date.now() > S.thu.exp && S.phase === 'exam') handleFatal({ code: 'THU_HET', message: 'Link thi thử đã hết hạn (12 giờ).' }); }, 60000);\n\n/* =========================================================== HỎI GIÁM THỊ (không cần rời màn hình thi) */\nS.asks = [];\nfunction askProctor() {\n  if (S.phase !== 'exam') return;\n  const hist = S.asks.slice(-5).map((a) => '<div class=\"mute\" style=\"margin:4px 0\">• ' + clock(a.t) + ': ' + esc(a.text) + '</div>').join('');\n  overlay('<h2>💬 Hỏi giám thị</h2><p class=\"mute\">Câu hỏi được gửi tới máy giám thị. Câu trả lời sẽ hiện trên màn hình của bạn trong khoảng 15–30 giây. Không cần (và không được) dùng ứng dụng nhắn tin khác.</p>' +\n    '<textarea id=\"askT\" maxlength=\"300\" style=\"width:100%;min-height:90px;font:inherit;padding:10px;border:1.5px solid #c6d1dc;border-radius:10px\" placeholder=\"VD: Câu 12 hình bị mờ, em không đọc được…\"></textarea>' +\n    (hist ? '<div style=\"margin-top:8px\"><b style=\"font-size:13px\">Đã gửi:</b>' + hist + '</div>' : '') +\n    '<div class=\"btns\"><button class=\"btn\" onclick=\"overlay()\">Đóng</button><button class=\"btn pri\" id=\"askB\" onclick=\"sendAsk()\">Gửi</button></div>');\n  setTimeout(() => { const a = $('askT'); if (a) a.focus(); }, 50);\n}\nasync function sendAsk() {\n  const text = ($('askT').value || '').trim();\n  if (!text) return;\n  $('askB').disabled = true; $('askB').textContent = 'Đang gửi…';\n  try {\n    await callRetry('ask', [S.tok, S.ky, S.sbd, text], 4);\n    S.asks.push({ t: Date.now(), text: text }); S.fastUntil = Date.now() + 4 * 60000;\n    overlay(); toast('Đã gửi câu hỏi cho giám thị. Cứ tiếp tục làm bài.'); scheduleSave(jitter(8000, 12000));\n  } catch (e) { toast(e.message, 'e', 6000); $('askB').disabled = false; $('askB').textContent = 'Gửi'; }\n}\n\n/* =========================================================== NỘP BÀI */\nfunction askSubmit() {\n  if (S.phase !== 'exam' || S.locked || S.paused) return;\n  const n = S.items.filter(answered).length, part = S.items.filter((it) => !isLt(it) && answered(it) && !complete(it)), fl = S.items.filter((it) => S.flags[it.k]);\n  const miss = S.items.filter((it) => !answered(it)), ltNo = S.items.filter((it) => isLt(it) && answered(it) && !complete(it));\n  const list = (arr) => arr.slice(0, 40).map((it) => '<a href=\"#\" onclick=\"overlay();go(' + S.items.indexOf(it) + ');return false\" style=\"margin-right:6px\">' + it.stt + '</a>').join('');\n  overlay('<h2>Nộp bài?</h2><div class=\"stat\"><div><b>' + n + '</b><span>đã làm</span></div><div><b style=\"color:var(--err)\">' + miss.length + '</b><span>chưa làm</span></div><div><b style=\"color:var(--flag)\">' + fl.length + '</b><span>đánh dấu</span></div></div>' +\n    (miss.length ? '<p><b>Câu chưa làm:</b> ' + list(miss) + '</p>' : '') + (part.length ? '<p><b>Câu chưa đủ ý:</b> ' + list(part) + '</p>' : '') + (ltNo.length ? '<p><b>Bài lập trình chưa bấm Nộp code:</b> ' + list(ltNo) + '<br><span class=\"mute\">Code đã lưu vẫn được chấm nếu kỳ thi bật “tự chấm bản lưu”.</span></p>' : '') + (fl.length ? '<p><b>Câu đánh dấu:</b> ' + list(fl) + '</p>' : '') +\n    '<details><summary style=\"cursor:pointer;font-weight:600\">Xem lại toàn bộ đáp án đã chọn</summary>' + reviewTable() + '</details>' +\n    '<p class=\"mute\">Sau khi nộp bạn <b>không thể</b> sửa bài.</p><div class=\"btns\"><button class=\"btn\" onclick=\"overlay()\">Quay lại làm tiếp</button><button class=\"btn ok\" onclick=\"doSubmit(false)\">Tôi chắc chắn nộp bài</button></div>');\n}\nfunction reviewTable() {\n  let h = '<table class=\"rv\"><tr>';\n  S.items.forEach((it, i) => {\n    if (i && i % 10 === 0) h += '</tr><tr>';\n    const a = answered(it);\n    h += '<td class=\"' + (a ? '' : 'e ') + (S.flags[it.k] ? 'f' : '') + '\" onclick=\"overlay();go(' + i + ')\"><b>' + it.stt + '</b><br>' + (a ? esc(shortAns(it)) : '—') + '</td>';\n  });\n  return h + '</tr></table>';\n}\nfunction onTimeUp() {\n  if (S.autoDone || S.phase !== 'exam') return;\n  S.autoDone = true;\n  overlay('<div style=\"text-align:center\"><div class=\"spin\"></div><h2>Hết giờ làm bài</h2><p>Hệ thống đang nộp bài của bạn…</p></div>');\n  setTimeout(() => doSubmit(true), jitter(300, 7000)); // dàn đều khi cả phòng hết giờ cùng lúc\n}\nasync function doSubmit(auto) {\n  if (S.submitting) return;\n  ltFlush();\n  S.submitting = true; S.phase = 'submitting'; clearTimeout(S.saveTimer);\n  overlay('<div style=\"text-align:center\"><div class=\"spin\"></div><h2>Đang nộp bài…</h2><p id=\"subMsg\" class=\"mute\">Vui lòng không đóng cửa sổ.</p></div>');\n  const n = S.items.filter(answered).length;\n  try {\n    const r = await callRetry('submit', [S.tok, S.ky, S.sbd, { seq: S.seq, a: S.ans, n: n, ev: S.ev.splice(0), auto: !!auto }], 12,\n      (k) => { const m = $('subMsg'); if (m) m.textContent = 'Mạng chậm / máy chủ bận — đang thử lại lần ' + k + '…'; });\n    done(r, n);\n  } catch (e) {\n    if (e.code === 'CLOSED' || e.code === 'TIME_UP') { done({ at: Date.now(), receipt: '', note: e.message }, n); return; }\n    if (handleFatal(e)) return;\n    S.submitting = false; emergency(e.message, n);\n  }\n}\nfunction answerString() {\n  return S.items.map((it) => {\n    const v = S.ans[it.k], n = it.stt;\n    if (isLt(it)) { const st = ltSt(it); return n + '=' + (v && v.l ? v.l : '') + (st && st.n ? '(' + fmtSc(st.d) + 'đ)' : '(chưa nộp)'); }\n    if (!answered(it)) return n + '-';\n    if (it.dang === 'MOT_DA') return n + v;\n    if (it.dang === 'NHIEU_DA') return n + v.slice().sort().join('');\n    if (it.dang === 'DUNG_SAI') return n + v.map((x) => x || '_').join('');\n    if (it.dang === 'GHEP_NOI') return n + ':' + v.map((x) => x || 0).join('-');\n    return n + '=' + String(v).replace(/\\s+/g, '');\n  }).join(' ');\n}\nfunction emergency(msg, n) {\n  overlay('<h2 style=\"color:var(--err)\">Chưa gửi được bài nộp</h2><p>' + esc(msg) + '</p><p>Bài làm của bạn đã được <b>tự lưu</b> lần cuối lúc <b>' + (S.lastSaved ? clock(S.lastSaved) : '—') + '</b> và vẫn đang giữ trên máy này. <b>Không đóng cửa sổ.</b> Hãy báo giám thị.</p>' +\n    '<p class=\"mute\">Bản ghi bài làm (giám thị có thể nhập tay nếu cần):</p><div class=\"ansStr\">' + esc(answerString()) + '</div>' +\n    '<div class=\"btns\"><button class=\"btn pri\" onclick=\"S.phase=\\'exam\\';doSubmit(true)\">Thử nộp lại</button></div>');\n}\nfunction done(r, n) {\n  if (S.thu) { thuDone(r, n); return; }\n  S.phase = 'done'; clearInterval(S.tick); clearTimeout(S.saveTimer); overlay(); banner();\n  try { if (document.fullscreenElement) document.exitFullscreen(); } catch (e) { }\n  LS.del(lkey()); LS.del('pt:last'); urlClear();\n  const quit = r.quit && isSeb() ? '<p><a class=\"btn pri big\" href=\"' + esc(r.quit) + '\" target=\"_top\">Thoát Safe Exam Browser</a></p>' : '<p class=\"mute\">Bạn có thể rời khỏi máy theo hướng dẫn của giám thị.</p>';\n  $('doneBox').innerHTML = '<div class=\"ic\">✓</div><h2 style=\"margin:6px 0\">Đã nộp bài thành công</h2>' +\n    '<p>' + esc(S.me.hoTen) + ' · SBD <b>' + esc(S.sbd) + '</b> · Mã đề <b>' + esc(S.me.maDe) + '</b></p>' +\n    '<p>Thời điểm nộp: <b>' + clock(r.at || Date.now()) + '</b> · Đã làm <b>' + n + '/' + S.items.length + '</b> câu</p>' +\n    (r.receipt ? '<div class=\"mute\">Mã xác nhận bài nộp</div><div class=\"rc\">' + esc(r.receipt) + '</div>' : '') +\n    (r.note ? '<p class=\"mute\">' + esc(r.note) + '</p>' : '') + (r.late ? '<p class=\"mute\">Bài nộp sau giờ quy định — giám thị sẽ xem xét.</p>' : '') + quit;\n  show('scrDone');\n}\nfunction finishedElsewhere() { done({ at: Date.now(), receipt: '', note: 'Bài thi đã được nộp (từ máy khác hoặc do giám thị thu bài).' }, S.items.filter(answered).length); }\n\n/** Lỗi không thể tự khắc phục → hiển thị rõ ràng */\nfunction resetCountdown(msg) {\n  S.phase = 'reset'; clearInterval(S.tick); clearTimeout(S.saveTimer); clearTimeout(S.waitTimer);\n  try { Object.keys(localStorage).filter((k) => /^pt:/.test(k) && k !== 'pt:font').forEach((k) => localStorage.removeItem(k)); } catch (e) { }\n  LS.del(lkey()); LS.del('pt:last'); urlClear();\n  let n = 10;\n  const draw = () => overlay('<div style=\"text-align:center\"><div style=\"font-size:46px\">♻</div><h2>Làm lại bài thi từ đầu</h2><p>' + esc(msg) + '</p>' +\n    '<p>Trở về trang đăng nhập sau <b style=\"font-size:22px\">' + n + '</b> giây. Đăng nhập lại bằng mã truy cập giám thị cung cấp.</p>' +\n    '<div class=\"btns\" style=\"justify-content:center\"><button class=\"btn pri\" onclick=\"location.reload()\">Về trang đăng nhập ngay</button></div></div>');\n  draw();\n  const iv = setInterval(() => { n--; if (n <= 0) { clearInterval(iv); location.reload(); } else draw(); }, 1000);\n}\nfunction handleFatal(e) {\n  if (e.code === 'THU_HET' || e.code === 'THU_SAI') {\n    S.phase = 'thuend'; clearInterval(S.tick); clearTimeout(S.saveTimer); clearTimeout(S.waitTimer); LS.del('pt:last'); urlClear();\n    overlay('<div style=\"text-align:center\"><div style=\"font-size:46px\">🧪</div><h2>Thi thử đã kết thúc</h2><p>' + esc(e.message) + '</p><div class=\"btns\" style=\"justify-content:center\"><button class=\"btn\" onclick=\"location.reload()\">Về trang đăng nhập</button></div></div>');\n    return true;\n  }\n  if (e.code === 'RESET') {\n    const wasIn = S.phase === 'exam' || S.phase === 'wait';\n    S.phase = 'reset'; clearInterval(S.tick); clearTimeout(S.saveTimer); clearTimeout(S.waitTimer);\n    if (wasIn) updating('Giám thị đang cập nhật bài thi của bạn…', 'Bài thi sẽ được làm lại từ đầu (hoặc đổi đề).', () => resetCountdown(e.message), 1700);\n    else resetCountdown(e.message);\n    return true;\n  }\n  if (e.code === 'BANNED') {\n    const wasIn = S.phase === 'exam' || S.phase === 'wait';\n    S.phase = 'banned'; clearInterval(S.tick); clearTimeout(S.saveTimer); clearTimeout(S.waitTimer); LS.del('pt:last'); urlClear();\n    const fin = () => overlay('<div style=\"text-align:center\"><div style=\"font-size:46px\">⛔</div><h2 style=\"color:var(--err)\">Đình chỉ thi</h2><p>' + esc(e.message) + '</p><p class=\"mute\">Bài làm đến thời điểm này đã được lưu lại.</p>' +\n      '<div class=\"btns\" style=\"justify-content:center\"><button class=\"btn\" onclick=\"location.reload()\">Về trang đăng nhập</button></div></div>');\n    if (wasIn) updating('Giám thị đang cập nhật trạng thái của bạn…', 'Vui lòng chờ.', fin, 1600); else fin();\n    return true;\n  }\n  if (e.code === 'REPLACED') {\n    S.phase = 'replaced'; clearInterval(S.tick); clearTimeout(S.saveTimer); LS.del('pt:last');\n    overlay('<h2>Phiên làm bài đã chuyển sang nơi khác</h2><p>' + esc(e.message) + '</p><p class=\"mute\">Bài làm đã lưu trên máy chủ vẫn được giữ.</p><div class=\"btns\"><button class=\"btn pri\" onclick=\"location.reload()\">Đăng nhập lại</button></div>');\n    return true;\n  }\n  if (e.code === 'DONE') { finishedElsewhere(); return true; }\n  if (e.code === 'NO_EXAM' || e.code === 'NO_STUDENT' || e.code === 'SETUP') { overlay('<h2>Không thể tiếp tục</h2><p>' + esc(e.message) + '</p><div class=\"btns\"><button class=\"btn\" onclick=\"logout()\">Về trang đăng nhập</button></div>'); return true; }\n  return false;\n}\n\n/* =========================================================== KHỞI ĐỘNG */\n(async function boot() {\n  const p = await urlGet(), last = LS.get('pt:last') || {};\n  if (p.thu) { thuBoot(String(p.thu)); return; }                  // link thi thử của giám thị\n  const cand = p.t && p.k && p.s ? { tok: p.t, ky: p.k, sbd: p.s } : (last.tok ? last : null);\n  if (cand) {\n    try {\n S.ky = cand.ky; S.sbd = cand.sbd;\n      const r = await callRetry('resume', [cand.tok, cand.ky, cand.sbd], 5);\n      enter(r, true);                                        // tải lại trang giữa giờ → vào tiếp, bài đã tự lưu được khôi phục\n      return;\n    } catch (e) {\n      LS.del('pt:last'); urlClear();\n      if (e.code === 'RESET') { resetCountdown(e.message); return; }\n      if (e.code === 'DONE' || e.code === 'CLOSED') { bootLogin(); $('lgErr').textContent = e.message; $('lgErr').classList.remove('hidden'); return; }\n    }\n  }\n  bootLogin();\n})();\n\n/* Bật lớp làm mờ đề khi có màn che (#ov) hoặc màn bắt toàn màn hình (#gate) đang hiện */\n(function () {\n  const sync = () => {\n    const ov = document.getElementById('ov'), gt = document.getElementById('gate');\n    document.body.classList.toggle('hold', !!((ov && !ov.classList.contains('hidden')) || (gt && !gt.classList.contains('hidden'))));\n  };\n  const mo = new MutationObserver(sync);\n  ['ov', 'gate'].forEach((id) => { const el = document.getElementById(id); if (el) mo.observe(el, { attributes: true, attributeFilter: ['class'] }); });\n  sync();\n})();\n</script>\n</body>\n</html>\n",
  boot: "/**\n * PhongThi.gs — BỘ KHỞI ĐỘNG PHÒNG THI (dán MỘT LẦN DUY NHẤT vào dự án Apps Script của file PhongThi_DuLieu)\n * ==========================================================================================================\n *  Bộ khởi động này KHÔNG chứa logic thi. Mã xử lý + giao diện thí sinh được Hệ thống Trung tâm tự đẩy vào\n *  sheet \"MaNguon\" mỗi khi Phát đề / Mở phòng thi / bấm \"Đẩy mã phòng thi\" → máy thí sinh luôn chạy bản mới nhất,\n *  KHÔNG cần dán mã hay triển khai lại nữa.\n *\n *  Cài đặt (1 lần):\n *   1. Mở PhongThi_DuLieu › Tiện ích mở rộng › Apps Script. Xoá hết nội dung Code.gs, dán toàn bộ tệp này. Lưu.\n *      (Tệp HTML \"ThiSinh\" cũ nếu có thì xoá đi hoặc để nguyên — không còn dùng.)\n *   2. Lần đầu: Triển khai › Tùy chọn triển khai mới › Ứng dụng web · Thực thi: TÔI · Truy cập: BẤT KỲ AI.\n *      Đã có triển khai: Triển khai › Quản lý triển khai › ✎ (bút chì) › Phiên bản: MỚI › Triển khai  (link giữ nguyên).\n *   3. Lần đầu dùng v3 (thi lập trình): Google hỏi cấp quyền \"kết nối dịch vụ bên ngoài\" (để gửi code tới máy chấm) → Cho phép.\n *      Nếu không thấy hỏi: chọn hàm doGet ở thanh trên › ▶ Chạy › cấp quyền (báo lỗi sau đó là bình thường).\n *   4. Trung tâm › tab ⑤ › mục A › \"Kiểm tra kết nối phòng thi\" phải báo ✔ bộ khởi động v3.\n *\n *  Bảo mật: chỉ 2 hàm công khai doGet, PT_api. Mã lõi đọc từ file dữ liệu của chính chủ hệ thống (thí sinh không sửa được).\n */\n\nvar BOOT_VERSION = '3';\nvar SRC_SHEET_ = 'MaNguon';\n\nfunction doGet(e) {\n  var p = (e && e.parameter) || {};\n  if (p.ping) return ContentService.createTextOutput(JSON.stringify(bootInfo_())).setMimeType(ContentService.MimeType.JSON);\n  try {\n    return core_().doGet(e);\n  } catch (x) {\n    return HtmlService.createHtmlOutput('<div style=\"font:16px system-ui,sans-serif;padding:48px;text-align:center;color:#234\">' +\n      '<h2>Phòng thi chưa sẵn sàng</h2><p>' + String(x && x.message || x).replace(/^SETUP:/, '').replace(/</g, '&lt;') + '</p><p>Hãy báo giám thị. Trang dùng được sau khi giám thị bấm \"Đẩy mã phòng thi\".</p></div>')\n      .setTitle('Phòng thi');\n  }\n}\n\nfunction PT_api(name, args) {\n  var core;\n  try { core = core_(); }\n  catch (x) {\n    var m = String(x && x.message || x);\n    return JSON.stringify({ ok: false, code: /^SETUP:/.test(m) ? 'SETUP' : 'BUSY', error: /^SETUP:/.test(m) ? m.substring(6) : 'Máy chủ đang cập nhật, hệ thống tự thử lại…' });\n  }\n  return core.PT_api(name, args);\n}\n\n/** Không bao giờ được gọi — chỉ để Google biết dự án cần quyền gửi yêu cầu ra ngoài (máy chấm lập trình). */\nfunction scope_() { UrlFetchApp.fetchAll([]); UrlFetchApp.fetch('https://wandbox.org'); }\n\n/* ------------------------------------------------------------------ nạp mã lõi */\n\nvar _CORE_ = null;\nfunction core_() {\n  if (_CORE_) return _CORE_;\n  var code = srcPart_('CODE');\n  _CORE_ = (new Function('HTML_', code))(function () { return srcPart_('HTML'); });\n  return _CORE_;\n}\n\nfunction srcSheet_() {\n  var sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SRC_SHEET_);\n  if (!sh || sh.getLastRow() < 3) throw new Error('SETUP:Chưa có mã phòng thi. Giám thị: Trung tâm › tab ⑤ › \"Đẩy mã phòng thi\".');\n  return sh;\n}\n\n/** Dòng 2 của sheet MaNguon: VER | phiên bản | mã băm | | | độ dài mã/độ dài html  (đệm 20 giây) */\nfunction srcHead_() {\n  var c = CacheService.getScriptCache(), s = c.get('src|head');\n  if (s) return JSON.parse(s);\n  var r = srcSheet_().getRange(2, 1, 1, 6).getValues()[0];\n  var lens = String(r[5]).split('/');\n  var h = { ver: String(r[1]), hash: String(r[2]), cl: Number(lens[0]) || 0, hl: Number(lens[1]) || 0 };\n  if (String(r[0]) !== 'VER' || !h.hash) throw new Error('SETUP:Sheet MaNguon bị hỏng. Giám thị: bấm \"Đẩy mã phòng thi\".');\n  c.put('src|head', JSON.stringify(h), 20);\n  return h;\n}\n\n/** Ghép mã (CODE) hoặc giao diện (HTML) từ các mảnh; đệm 6 giờ theo mã băm; kiểm tra đủ độ dài */\nfunction srcPart_(kind) {\n  var h = srcHead_(), c = CacheService.getScriptCache(), base = 'src|' + h.hash + '|' + kind, want = kind === 'CODE' ? h.cl : h.hl;\n  var n = Number(c.get(base + '|n') || 0);\n  if (n) {\n    var keys = [];\n    for (var i = 0; i < n; i++) keys.push(base + '|' + i);\n    var got = c.getAll(keys), parts = [], ok = true;\n    keys.forEach(function (k) { if (got[k] === undefined || got[k] === null) ok = false; else parts.push(got[k]); });\n    var joined = parts.join('');\n    if (ok && joined.length === want) return joined;\n  }\n  var sh = srcSheet_(), last = sh.getLastRow();\n  var rows = sh.getRange(3, 1, last - 2, 5).getValues()\n    .filter(function (r) { return String(r[0]) === kind && String(r[2]) === h.hash; })\n    .sort(function (a, b) { return Number(a[3]) - Number(b[3]); });\n  var text = rows.map(function (r) { return String(r[4]).replace(/^~/, ''); }).join('');   // '~' = tiền tố chống hiểu nhầm công thức\n  if (text.length !== want) throw new Error('Mã phòng thi đang được cập nhật (' + kind + ' ' + text.length + '/' + want + ')');\n  try {\n    var put = {}, k = 0;\n    for (var p = 0; p < text.length; p += 30000) put[base + '|' + (k++)] = text.substring(p, p + 30000);\n    put[base + '|n'] = String(k);\n    c.putAll(put, 21600);\n  } catch (e) { }\n  return text;\n}\n\n/** ?ping=1 — Trung tâm kiểm tra bộ khởi động đã triển khai đúng & mã lõi đang chạy bản nào */\nfunction bootInfo_() {\n  var o = { ok: true, boot: BOOT_VERSION, now: Date.now(), core: '', hash: '', url: '' };\n  try { var h = srcHead_(); o.core = h.ver; o.hash = h.hash; } catch (e) { o.coreError = String(e.message || e).replace(/^SETUP:/, ''); }\n  try { o.url = ScriptApp.getService().getUrl(); } catch (e) { }\n  return o;\n}\n"
};

/* ======================= 20_Sheets.gs ======================= */
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

/* ======================= 21_Setup.gs ======================= */
/**
 * 21_Setup.gs — Khởi tạo file Trung tâm, tạo file Ngân hàng cho từng môn, nạp dữ liệu mẫu.
 */

var TEXT_SHEETS = [SH.MON_HOC, SH.MT_PHAN, SH.MT_CHITIET, SH.KY_THI, SH.MA_DE, SH.DE_THI, SH.THI_SINH, SH.PHUC_KHAO, SH.BAI_LAM, SH.LT_BAI, SH.LT_TEST, SH.LT_KQ];

/** Khởi tạo (chạy lại nhiều lần không mất dữ liệu) */
function Setup_init() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var props = S_props();
  if (!ss) {
    var id = props.getProperty(APP.PROP_HUB_ID);
    if (!id) throw new Error('Hãy chạy Khởi tạo từ menu trong file Google Sheets Trung tâm.');
    ss = S_open(id);
  }
  props.setProperty(APP.PROP_HUB_ID, ss.getId());
  _SS_CACHE[ss.getId()] = ss;

  Object.keys(SH).forEach(function (k) {
    var name = SH[k];
    if (name === SH.HUONG_DAN) return;
    var color = [SH.KET_QUA, SH.DIEM_PHAN, SH.KQ_CHU_DE].indexOf(name) >= 0 ? '#1b5e20' :
      ([SH.NHAT_KY].indexOf(name) >= 0 ? '#555555' : '#1f3b5b');
    S_ensureSheet(ss, name, HEADERS[name], { text: TEXT_SHEETS.indexOf(name) >= 0, color: color });
  });

  // cấu hình mặc định
  var cfg = S_read(ss, SH.CAU_HINH);
  var have = cfg.map(function (r) { return U_str(r.Khoa); });
  var add = DEFAULT_CONFIG.filter(function (r) { return have.indexOf(r[0]) < 0; })
    .map(function (r) { return { Khoa: r[0], GiaTri: r[1], MoTa: r[2] }; });
  S_append(ss, SH.CAU_HINH, add);
  var shCfg = ss.getSheetByName(SH.CAU_HINH);
  shCfg.setColumnWidth(1, 200).setColumnWidth(2, 420).setColumnWidth(3, 480);
  shCfg.getRange('B:B').setNumberFormat('@');

  // cột SBD / Mã đề ở các sheet kết quả giữ dạng văn bản (không mất số 0 đầu), cột điểm vẫn là số
  [SH.KET_QUA, SH.DIEM_PHAN, SH.KQ_CHU_DE].forEach(function (n) {
    var sh = ss.getSheetByName(n), head = S_headers(sh);
    ['SBD', 'MaDe', 'Phan', 'ResponseId'].forEach(function (c) {
      var i = head.indexOf(c);
      if (i >= 0) sh.getRange(1, i + 1, sh.getMaxRows(), 1).setNumberFormat('@');
    });
  });
  Setup_hubGuide(ss);
  // nâng cấp cấu trúc các file ngân hàng đã có (thêm cột lựa chọn F–J…)
  S_read(ss, SH.MON_HOC).forEach(function (m) {
    var id = U_str(m.FileNganHangId);
    if (!id) return;
    try { Setup_bankColumns(S_open(id)); } catch (e) { /* file có thể đã bị xoá */ }
  });
  // xoá sheet trống mặc định
  ['Sheet1', 'Trang tính1', 'Trang tính 1'].forEach(function (n) {
    var sh = ss.getSheetByName(n);
    if (sh && sh.getLastRow() === 0 && ss.getSheets().length > 1) ss.deleteSheet(sh);
  });
  Setup_formatHub(ss);

  var root = S_rootFolder();
  S_latexFolder(); S_examFolder();
  S_log('KHOI_TAO', 'Phiên bản ' + APP.VERSION);
  return { hubUrl: ss.getUrl(), folderUrl: root.getUrl() };
}

function Setup_formatHub(ss) {
  var widths = {};
  widths[SH.DE_THI] = [90, 60, 50, 50, 80, 70, 110, 80, 60, 70, 100, 110, 110, 60, 50, 100, 120];
  widths[SH.THI_SINH] = [90, 90, 200, 90, 200, 70, 320, 150];
  widths[SH.KET_QUA] = [90, 90, 200, 80, 60, 110, 80, 80, 80, 200, 150, 70, 260, 120, 140];
  Object.keys(widths).forEach(function (n) {
    var sh = ss.getSheetByName(n);
    if (!sh) return;
    widths[n].forEach(function (w, i) { sh.setColumnWidth(i + 1, w); });
  });
  var order = [SH.HUONG_DAN, SH.CAU_HINH, SH.MON_HOC, SH.MT_PHAN, SH.MT_CHITIET, SH.KY_THI, SH.THI_SINH, SH.MA_DE,
    SH.DE_THI, SH.BAI_LAM, SH.KET_QUA, SH.DIEM_PHAN, SH.KQ_CHU_DE, SH.PHUC_KHAO, SH.NHAT_KY];
  order.forEach(function (n, i) {
    var sh = ss.getSheetByName(n);
    if (sh) { ss.setActiveSheet(sh); ss.moveActiveSheet(i + 1); }
  });
  ss.setActiveSheet(ss.getSheetByName(SH.HUONG_DAN));
}

function Setup_hubGuide(ss) {
  var sh = ss.getSheetByName(SH.HUONG_DAN) || ss.insertSheet(SH.HUONG_DAN);
  sh.clear();
  var lines = [
    [APP.NAME + ' — v' + APP.VERSION],
    [''],
    ['QUY TRÌNH 1 KỲ THI (thao tác trên Bảng điều khiển: menu 🎓 Hệ thống thi › Mở bảng điều khiển)'],
    ['1. Ngân hàng: tạo môn → nhập câu hỏi vào file NganHang_<MaMon> (sheet CauHoi, Nhom, DanhMuc) → bấm "Kiểm tra ngân hàng".'],
    ['2. Ma trận: khai báo các Phần (điểm, số câu, dạng câu) và các ô (Chương × Chủ đề × Mức độ × Dạng → số câu hoặc %). Bấm "Kiểm tra khả thi".'],
    ['3. Kỳ thi: tạo kỳ thi, chọn chế độ A (cùng câu, trộn thứ tự) hoặc B (khác câu, cùng ma trận), số mã đề.'],
    ['4. Sinh đề nháp → xem từng mã đề, Đổi câu / Khoá câu → Sinh lại phần chưa khoá → Chốt đề.'],
    ['5. Thí sinh: dán danh sách (SBD, Họ tên, Lớp, Email) → Phân mã đề (ngẫu nhiên hoặc theo thứ tự).'],
    ['6. Xuất Google Form: mỗi mã đề 1 Form (đóng sẵn, chưa nhận bài). SBD trên Form chỉ chấp nhận thí sinh được phân mã đề đó.'],
    ['7. Điều hành thi: bấm MỞ THI đúng giờ, ĐÓNG THI khi hết giờ (hoặc hẹn giờ tự đóng). Theo dõi số bài đã nộp.'],
    ['8. Chấm điểm: Thu bài & chấm → xem phổ điểm, tỉ lệ đúng từng câu (phát hiện đáp án sai), thống kê theo chủ đề / lớp.'],
    ['9. Phúc khảo: thêm điều chỉnh (đổi đáp án, chấp nhận thêm đáp án, tặng điểm, loại câu) → Chấm lại. Mọi điều chỉnh được lưu vết.'],
    [''],
    ['CÁC SHEET'],
    ['CauHinh: tham số hệ thống (thang mức độ, song ngữ, độ nét công thức…).'],
    ['MonHoc: danh sách môn và file ngân hàng tương ứng (mỗi môn 1 file).'],
    ['MaTran_Phan / MaTran_ChiTiet: ma trận đặc tả.'],
    ['KyThi, MaDe, DeThi: kỳ thi, các mã đề (link Form) và chi tiết từng câu trong từng mã đề (đáp án theo mã đề ở cột DapAnMaDe).'],
    ['ThiSinh: danh sách thí sinh theo kỳ thi + mã đề được phân + link làm bài.'],
    ['BaiLam: từng lượt nộp (kể cả nộp nhiều lần); KetQua: kết quả chính thức mỗi thí sinh.'],
    ['KetQua_Phan, KetQua_ChuDe: dữ liệu dạng dài để phân tích / nối Looker Studio.'],
    ['PhucKhao: các điều chỉnh sau thi.  NhatKy: lịch sử thao tác.'],
    [''],
    ['LƯU Ý BẢO MẬT'],
    ['- Không chia sẻ file Trung tâm cho thí sinh: sheet DeThi chứa đáp án. Chia sẻ quyền Xem cho người xem điểm chỉ khi đã thi xong, hoặc tạo file kết quả riêng.'],
    ['- Form được tạo ở chế độ thường (không bật Quiz của Google) nên thí sinh không thấy điểm/đáp án sau khi nộp.'],
    ['- Đáp án dùng để chấm là bản chụp lúc xuất Form; sửa ngân hàng sau đó không làm đổi điểm (muốn đổi phải dùng Phúc khảo).']
  ];
  sh.getRange(1, 1, lines.length, 1).setValues(lines);
  sh.setColumnWidth(1, 1100);
  sh.getRange('A1').setFontSize(16).setFontWeight('bold');
  [3, 14, 24].forEach(function (r) { sh.getRange(r, 1).setFontWeight('bold').setBackground('#e8eef6'); });
  sh.getRange(1, 1, lines.length, 1).setWrap(true);
}

/**
 * Nâng cấp file ngân hàng cũ: bổ sung các cột còn thiếu (ví dụ lựa chọn F–J từ v1.1 — tối đa 10 lựa chọn).
 * Cột lựa chọn mới được chèn ngay sau cột lựa chọn cuối cùng (sau E) để dễ nhìn; cột khác thêm vào cuối.
 * @return {number} số cột đã thêm
 */
function Setup_bankColumns(ss) {
  var sh = ss.getSheetByName(BSH.CAU_HOI);
  if (!sh) return 0;
  var head = S_headers(sh), added = 0;
  var miss = APP.LETTERS.filter(function (L) { return head.indexOf(L) < 0; });
  var last = -1;
  APP.LETTERS.forEach(function (L) { last = Math.max(last, head.indexOf(L)); });
  if (miss.length && last >= 0) {
    sh.insertColumnsAfter(last + 1, miss.length);
    sh.getRange(1, last + 2, 1, miss.length).setValues([miss]).setFontWeight('bold').setBackground('#0d47a1').setFontColor('#ffffff');
    sh.getRange(2, last + 2, Math.max(1, sh.getMaxRows() - 1), miss.length).setNumberFormat('@').setWrap(true).setVerticalAlignment('top');
    for (var k = 0; k < miss.length; k++) sh.setColumnWidth(last + 2 + k, 160);
    added += miss.length;
    head = S_headers(sh);
  }
  var others = HEADERS[BSH.CAU_HOI].filter(function (h) { return head.indexOf(h) < 0; });
  if (others.length) {
    var c0 = head.length + 1;
    sh.getRange(1, c0, 1, others.length).setValues([others]).setFontWeight('bold').setBackground('#0d47a1').setFontColor('#ffffff');
    sh.getRange(2, c0, Math.max(1, sh.getMaxRows() - 1), others.length).setNumberFormat('@');
    added += others.length;
  }
  return added;
}

/** Tạo file ngân hàng cho một môn mới */
function Setup_createSubject(maMon, tenMon) {
  maMon = U_upper(maMon).replace(/[^A-Z0-9_]/g, '');
  if (!maMon) throw new Error('Mã môn chỉ gồm chữ không dấu, số, dấu _');
  var hub = S_hub();
  var exist = S_read(hub, SH.MON_HOC).filter(function (r) { return U_upper(r.MaMon) === maMon; })[0];
  if (exist) throw new Error('Môn ' + maMon + ' đã tồn tại');
  var ss = SpreadsheetApp.create('NganHang_' + maMon + ' — ' + (tenMon || maMon));
  var folder = S_folder('BANK_FOLDER_ID', 'NganHang');
  DriveApp.getFileById(ss.getId()).moveTo(folder);
  _SS_CACHE[ss.getId()] = ss;
  Setup_bankSheets(ss);
  S_append(hub, SH.MON_HOC, [{ MaMon: maMon, TenMon: tenMon || maMon, FileNganHangId: ss.getId(), LinkFile: ss.getUrl(),
    NgayTao: S_now() }]);
  S_log('TAO_MON', maMon);
  return { maMon: maMon, id: ss.getId(), url: ss.getUrl() };
}

function Setup_bankSheets(ss) {
  var levels = Repo_levels();
  var q = S_ensureSheet(ss, BSH.CAU_HOI, HEADERS[BSH.CAU_HOI], { text: true, color: '#0d47a1' });
  var g = S_ensureSheet(ss, BSH.NHOM, HEADERS[BSH.NHOM], { text: true, color: '#4a148c' });
  var t = S_ensureSheet(ss, BSH.DANH_MUC, HEADERS[BSH.DANH_MUC], { text: true, color: '#004d40' });
  var ds = S_ensureSheet(ss, BSH.DS, ['MucDo', 'DangCau', 'TrangThai']);
  var lv = levels.map(function (l) { return l.code; });
  var dg = Object.keys(DANG);
  var maxN = Math.max(lv.length, dg.length, 2);
  var vals = [];
  for (var i = 0; i < maxN; i++) vals.push([lv[i] || '', dg[i] || '', ['DUNG', 'AN'][i] || '']);
  ds.getRange(2, 1, Math.max(1, ds.getMaxRows() - 1), 3).clearContent();
  ds.getRange(2, 1, vals.length, 3).setValues(vals);
  ds.hideSheet();

  var head = S_headers(q);
  function col(name) { return head.indexOf(name) + 1; }
  var nRows = 2000;
  function listRule(rangeA1) {
    return SpreadsheetApp.newDataValidation().requireValueInRange(ss.getRange(rangeA1), true).setAllowInvalid(false).build();
  }
  q.getRange(2, col('MucDo'), nRows, 1).setDataValidation(listRule(BSH.DS + '!A2:A20'));
  q.getRange(2, col('DangCau'), nRows, 1).setDataValidation(listRule(BSH.DS + '!B2:B20'));
  q.getRange(2, col('TrangThai'), nRows, 1).setDataValidation(listRule(BSH.DS + '!C2:C3'));
  q.getRange(2, col('MaChuDe'), nRows, 1).setDataValidation(SpreadsheetApp.newDataValidation()
    .requireValueInRange(ss.getRange(BSH.DANH_MUC + '!A2:A1000'), true).setAllowInvalid(true).build());
  q.getRange(2, col('MaNhom'), nRows, 1).setDataValidation(SpreadsheetApp.newDataValidation()
    .requireValueInRange(ss.getRange(BSH.NHOM + '!A2:A1000'), true).setAllowInvalid(true).build());
  var gh = S_headers(g);
  g.getRange(2, gh.indexOf('MucDo') + 1, 500, 1).setDataValidation(listRule(BSH.DS + '!A2:A20'));
  g.getRange(2, gh.indexOf('DangCau') + 1, 500, 1).setDataValidation(listRule(BSH.DS + '!B2:B20'));
  g.getRange(2, gh.indexOf('TrangThai') + 1, 500, 1).setDataValidation(listRule(BSH.DS + '!C2:C3'));
  g.getRange(2, gh.indexOf('MaChuDe') + 1, 500, 1).setDataValidation(SpreadsheetApp.newDataValidation()
    .requireValueInRange(ss.getRange(BSH.DANH_MUC + '!A2:A1000'), true).setAllowInvalid(true).build());

  var notes = {
    MaCH: 'Mã câu hỏi duy nhất, ví dụ Q001, ML-001',
    MaChuDe: 'Mã chủ đề trong sheet DanhMuc (Môn → Khối/Cấp độ → Chương → Chủ đề → Yêu cầu cần đạt)',
    MucDo: 'Mức độ: ' + levels.map(function (l) { return l.code + '=' + l.name; }).join(', '),
    DangCau: 'MOT_DA (1 đáp án) | NHIEU_DA (nhiều đáp án) | DUNG_SAI (Đúng/Sai nhiều ý) | TRA_LOI_NGAN | GHEP_NOI',
    MaNhom: 'Câu hỏi chùm: ghi mã nhóm (sheet Nhom). Các câu cùng nhóm luôn đi liền nhau, theo thứ tự dòng.',
    NoiDung_VI: 'Nội dung tiếng Việt. Công thức trong dòng: $x^2$ ; công thức riêng dòng: $$\\int_0^1 x\\,dx$$',
    NoiDung_EN: 'Nội dung tiếng Anh (hiển thị bên dưới nếu bật song ngữ)',
    LaTeX: 'Công thức lớn (không cần $). Sẽ chuyển thành ẢNH chèn trước câu hỏi.',
    HinhAnh: 'ID hoặc link file ảnh trên Google Drive (hoặc link ảnh công khai). Nhiều ảnh: mỗi ảnh 1 dòng.',
    Video: 'Link YouTube (Google Form chỉ nhúng được YouTube). Bài nghe: đưa lên YouTube dạng không công khai.',
    AmThanh: 'Link file nghe (hiển thị dạng đường link; nhớ cho phép tên miền trong SEB).',
    A: 'Lựa chọn A (có tối đa 10 lựa chọn A–J, điền liên tiếp). Song ngữ: "Tiếng Việt || English". Với DUNG_SAI: các ý a,b,c,d… ở cột A, B, C, D…. GHEP_NOI: các ý bên trái.',
    CotGhep: 'Chỉ dùng cho GHEP_NOI: các mục bên phải, cách nhau bởi | (được đánh số 1, 2, 3…)',
    DapAn: 'MOT_DA: B | NHIEU_DA: A,C | DUNG_SAI: Đ,S,Đ,Đ | TRA_LOI_NGAN: 0.5 | 1/2 (sai số: 3.14~0.01) | GHEP_NOI: A-2,B-1,C-3',
    KhongTron: 'Trống = tự giữ cố định "Tất cả…/Cả A và B…". TAT_CA = không trộn đáp án câu này. D,E = cố định D và E. TRON_HET = trộn hết.',
    TrangThai: 'DUNG = đang dùng, AN = tạm ẩn (không bốc vào đề)'
  };
  head.forEach(function (h, i) { if (notes[h]) q.getRange(1, i + 1).setNote(notes[h]); });
  var w = { MaCH: 80, MaChuDe: 80, MucDo: 60, DangCau: 110, MaNhom: 70, NoiDung_VI: 380, NoiDung_EN: 300, LaTeX: 180,
    A: 160, B: 160, C: 160, D: 160, E: 160, F: 160, G: 160, H: 160, I: 160, J: 160, CotGhep: 200, DapAn: 110, LoiGiai_VI: 220, LoiGiai_EN: 200 };
  head.forEach(function (h, i) { if (w[h]) q.setColumnWidth(i + 1, w[h]); });
  q.getRange(2, 1, nRows, head.length).setWrap(true).setVerticalAlignment('top');
  t.setColumnWidth(3, 220); t.setColumnWidth(4, 300); t.setColumnWidth(5, 360);
  g.setColumnWidth(5, 420); g.setColumnWidth(6, 320);

  var gd = ss.getSheetByName(BSH.HUONG_DAN) || ss.insertSheet(BSH.HUONG_DAN);
  gd.clear();
  var guide = [['HƯỚNG DẪN NHẬP NGÂN HÀNG (di chuột lên tiêu đề cột trong sheet CauHoi để xem ghi chú)']];
  Object.keys(notes).forEach(function (k) { guide.push([k + ': ' + notes[k]]); });
  guide.push(['']);
  guide.push(['Luật chấm: sai/bỏ trống = 0 điểm (không trừ). NHIEU_DA, DUNG_SAI, GHEP_NOI phải đúng toàn bộ mới được điểm câu.']);
  guide.push(['Sau khi nhập: mở Bảng điều khiển › Ngân hàng › Kiểm tra để xem lỗi và xem trước câu hỏi (có hiển thị công thức).']);
  gd.getRange(1, 1, guide.length, 1).setValues(guide);
  gd.setColumnWidth(1, 1100);
  gd.getRange('A1').setFontWeight('bold').setFontSize(13);
  ['Sheet1', 'Trang tính1', 'Trang tính 1'].forEach(function (n) {
    var sh = ss.getSheetByName(n);
    if (sh && sh.getLastRow() === 0) ss.deleteSheet(sh);
  });
  ss.setActiveSheet(q); ss.moveActiveSheet(1);
}

/** Nạp dữ liệu mẫu: môn DEMO, ma trận MT_DEMO, kỳ thi KT_DEMO, 6 thí sinh */
function Setup_sample() {
  if (!S_isReady()) Setup_init();
  var hub = S_hub();
  var d = Sample_data();
  var mon = S_read(hub, SH.MON_HOC).filter(function (r) { return U_upper(r.MaMon) === 'DEMO'; })[0];
  var bankSs;
  if (!mon) {
    var c = Setup_createSubject('DEMO', 'Nhập môn AI, Python & Toán cơ sở (mẫu)');
    bankSs = S_open(c.id);
  } else bankSs = S_open(U_str(mon.FileNganHangId));
  var now = S_now();
  S_writeAll(bankSs, BSH.DANH_MUC, d.topics);
  S_writeAll(bankSs, BSH.NHOM, d.groups);
  S_writeAll(bankSs, BSH.CAU_HOI, d.questions.map(function (q) { q.NgayTao = now; return q; }));
  S_replaceWhere(hub, SH.MT_PHAN, function (r) { return U_str(r.MaMaTran) === 'MT_DEMO'; }, d.matrixPhan);
  S_replaceWhere(hub, SH.MT_CHITIET, function (r) { return U_str(r.MaMaTran) === 'MT_DEMO'; }, d.matrixCells);
  var ex = d.exam;
  ex.HatGiong = U_randomId(8); ex.LanSinh = 0; ex.NgayTao = now;
  S_replaceWhere(hub, SH.KY_THI, function (r) { return U_str(r.MaKyThi) === 'KT_DEMO'; }, [ex]);
  S_replaceWhere(hub, SH.THI_SINH, function (r) { return U_str(r.MaKyThi) === 'KT_DEMO'; }, d.students);
  [SH.MA_DE, SH.DE_THI, SH.BAI_LAM, SH.KET_QUA, SH.DIEM_PHAN, SH.KQ_CHU_DE, SH.PHUC_KHAO].forEach(function (n) {
    S_replaceWhere(hub, n, function (r) { return U_str(r.MaKyThi) === 'KT_DEMO'; }, []);
  });
  S_log('DU_LIEU_MAU', 'DEMO / MT_DEMO / KT_DEMO');
  return { bankUrl: bankSs.getUrl() };
}

/* ======================= 22_Repo.gs ======================= */
/**
 * 22_Repo.gs — Truy xuất dữ liệu (đọc sheet -> đối tượng nghiệp vụ)
 */

var _REPO = {};

function Repo_config() {
  if (_REPO.cfg) return _REPO.cfg;
  var m = {};
  DEFAULT_CONFIG.forEach(function (r) { m[r[0]] = r[1]; });
  try { S_read(S_hub(), SH.CAU_HINH).forEach(function (r) { if (U_str(r.Khoa)) m[U_str(r.Khoa)] = U_str(r.GiaTri); }); } catch (e) { }
  _REPO.cfg = m;
  return m;
}

function Repo_levels() { return U_parseLevels(Repo_config().MUC_DO); }

function Repo_subjects() {
  return S_read(S_hub(), SH.MON_HOC).map(function (r) {
    return { maMon: U_str(r.MaMon), ten: U_str(r.TenMon), id: U_str(r.FileNganHangId), url: U_str(r.LinkFile) };
  });
}

function Repo_subject(maMon) {
  var s = Repo_subjects().filter(function (x) { return x.maMon === U_str(maMon); })[0];
  if (!s) throw new Error('Không tìm thấy môn ' + maMon + ' trong sheet MonHoc');
  if (!s.id) throw new Error('Môn ' + maMon + ' chưa có FileNganHangId');
  return s;
}

/** Đọc & dựng ngân hàng của một môn */
function Repo_bank(maMon) {
  _REPO.bank = _REPO.bank || {};
  if (_REPO.bank[maMon]) return _REPO.bank[maMon];
  var s = Repo_subject(maMon);
  var ss = S_open(s.id);
  var bank = Bank_build(S_read(ss, BSH.CAU_HOI), S_read(ss, BSH.NHOM), S_read(ss, BSH.DANH_MUC), Repo_levels());
  bank.subject = s;
  _REPO.bank[maMon] = bank;
  return bank;
}

function Repo_matrixList() {
  var hub = S_hub();
  var rows = S_read(hub, SH.MT_PHAN);
  var m = {};
  rows.forEach(function (r) {
    var id = U_str(r.MaMaTran);
    if (!id) return;
    if (!m[id]) m[id] = { id: id, maMon: U_str(r.MaMon), ten: U_str(r.TenMaTran), phan: 0, diem: 0, soCau: 0 };
    m[id].phan++; m[id].diem += U_num(r.DiemPhan, 0); m[id].soCau += U_num(r.TongSoCau, 0);
  });
  return Object.keys(m).map(function (k) { return m[k]; });
}

function Repo_matrix(maMaTran) {
  var hub = S_hub();
  return Mx_build(U_str(maMaTran), S_read(hub, SH.MT_PHAN), S_read(hub, SH.MT_CHITIET));
}

function Repo_examRows() { return S_read(S_hub(), SH.KY_THI); }

function Repo_examRow(maKyThi) {
  var r = Repo_examRows().filter(function (x) { return U_str(x.MaKyThi) === U_str(maKyThi); })[0];
  if (!r) throw new Error('Không tìm thấy kỳ thi ' + maKyThi);
  return r;
}

function Repo_setExam(maKyThi, patch) {
  S_update(S_hub(), SH.KY_THI, function (o) { return U_str(o.MaKyThi) === U_str(maKyThi); }, patch);
}

function Repo_variantRows(maKyThi) {
  return S_read(S_hub(), SH.MA_DE).filter(function (r) { return U_str(r.MaKyThi) === U_str(maKyThi); })
    .sort(function (a, b) { return U_str(a.MaDe) < U_str(b.MaDe) ? -1 : 1; });
}

function Repo_items(maKyThi) {
  return S_read(S_hub(), SH.DE_THI).filter(function (r) { return U_str(r.MaKyThi) === U_str(maKyThi); })
    .map(function (r) { r.MaDe = U_str(r.MaDe); r.MaCH = U_str(r.MaCH); r.Phan = U_str(r.Phan); return r; });
}

function Repo_students(maKyThi) {
  return S_read(S_hub(), SH.THI_SINH).filter(function (r) { return U_str(r.MaKyThi) === U_str(maKyThi); })
    .map(function (r) { r.SBD = U_str(r.SBD); r.MaDe = U_str(r.MaDe); return r; });
}

function Repo_reviews(maKyThi) {
  return S_read(S_hub(), SH.PHUC_KHAO).filter(function (r) { return U_str(r.MaKyThi) === U_str(maKyThi); });
}

/** Danh sách phần {phan, ten, diem}: lấy bản chụp lưu lúc sinh đề (KyThi.CauTrucPhan), nếu chưa có thì đọc ma trận */
function Repo_sections(examRow) {
  var snap = U_str(examRow.CauTrucPhan);
  if (snap) { try { return JSON.parse(snap); } catch (e) { } }
  return Repo_matrix(U_str(examRow.MaMaTran)).sections.map(function (s) { return { phan: s.phan, ten: s.ten, diem: s.diem }; });
}

function Repo_clearCache() { _REPO = {}; _SS_CACHE = {}; }

/* ======================= 23_ExamService.gs ======================= */
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

/* ======================= 24_BankEditor.gs ======================= */
/**
 * 24_BankEditor.gs — Máy chủ cho trình "📝 Nhập câu hỏi nhanh" (NhapCau.html).
 *
 * Trình nhập ghi thẳng vào sheet CauHoi / Nhom của file NganHang_<MaMon> theo TÊN CỘT,
 * tự cấp mã câu (<MaChuDe>-001…), kiểm tra lỗi bằng chính bộ kiểm tra của ngân hàng (Bank_build),
 * tải ảnh dán từ bộ nhớ tạm lên Drive, dịch Việt ⇄ Anh bằng Google Dịch (LanguageApp, miễn phí),
 * và báo tiến độ so với ma trận đề (còn thiếu bao nhiêu câu ở ô nào).
 */

var BE_TEXT_FIELDS = HEADERS[BSH.CAU_HOI];

function BE_ctx(maMon) {
  Repo_clearCache();
  var s = Repo_subject(maMon);
  var ss = S_open(s.id);
  Setup_bankColumns(ss);
  return {
    subject: s, ss: ss, rows: S_read(ss, BSH.CAU_HOI), groups: S_read(ss, BSH.NHOM), topics: S_read(ss, BSH.DANH_MUC),
    levels: Repo_levels()
  };
}

/** Dữ liệu ban đầu cho trình nhập */
function BE_init(maMon) {
  var c = BE_ctx(maMon);
  var bank = Bank_build(c.rows, c.groups, c.topics, c.levels);
  var issues = {};
  bank.issues.forEach(function (x) {
    if (x.level !== 'LOI') return;
    (issues[x.ma] = issues[x.ma] || []).push(x.msg);
  });
  var today = S_now().substring(0, 10);
  return {
    subject: { maMon: c.subject.maMon, ten: c.subject.ten, url: c.subject.url },
    topics: c.topics.map(function (t) {
      return { code: U_str(t.MaChuDe), chuong: U_str(t.Chuong), chuDe: U_str(t.ChuDe), khoi: U_str(t.Khoi_CapDo) };
    }).filter(function (t) { return t.code; }),
    groups: c.groups.map(function (g) {
      return { id: U_str(g.MaNhom), maChuDe: U_str(g.MaChuDe), mucDo: U_str(g.MucDo), dang: U_str(g.DangCau),
        vi: U_str(g.NoiDung_VI), en: U_str(g.NoiDung_EN), n: (bank.groups[U_str(g.MaNhom)] || { children: [] }).children.length };
    }).filter(function (g) { return g.id; }),
    rows: c.rows.map(BE_rowOut),
    issues: issues,
    levels: c.levels,
    dangs: Object.keys(DANG).map(function (k) { return { code: k, name: DANG_TEN[k] }; }),
    songNgu: U_bool(Repo_config().SONG_NGU, true),
    matrices: Repo_matrixList().filter(function (m) { return m.maMon === c.subject.maMon; }),
    today: today,
    valid: bank.units.reduce(function (a, u) { return a + u.size; }, 0)
  };
}

function BE_rowOut(r) {
  var o = { _row: r.__row };
  BE_TEXT_FIELDS.forEach(function (h) {
    var v = r[h];
    if (v instanceof Date) v = Utilities.formatDate(v, APP.TZ, 'yyyy-MM-dd HH:mm:ss');
    o[h] = v === null || v === undefined ? '' : String(v);
  });
  return o;
}

/** Làm sạch bản ghi gửi lên: chỉ giữ cột hợp lệ, chuẩn hoá Unicode, chặn chuỗi bị hiểu là công thức */
function BE_clean(rec) {
  var r = {};
  BE_TEXT_FIELDS.forEach(function (h) {
    if (rec[h] === undefined || rec[h] === null) return;
    var v = String(rec[h]).normalize('NFC').replace(/\r\n?/g, '\n').replace(/[ \t]+$/gm, '').replace(/^\n+|\s+$/g, '');
    r[h] = v;
  });
  r.MaChuDe = U_str(r.MaChuDe);
  r.MucDo = U_upper(r.MucDo);
  r.DangCau = U_normDang(r.DangCau) || U_str(r.DangCau);
  if (r.DapAn && r.DangCau) {
    var nOpt = APP.LETTERS.filter(function (L) { return U_str(r[L]); }).length;
    var nRight = U_str(r.CotGhep) ? U_str(r.CotGhep).split('|').filter(function (x) { return x.trim(); }).length : 0;
    var pk = Bank_parseKey(r.DangCau, r.DapAn, { nOpt: r.DangCau === DANG.TRA_LOI_NGAN ? 0 : nOpt, nRight: nRight });
    if (pk.ok) r.DapAn = Bank_keyToString(r.DangCau, pk.key);
  }
  return r;
}

/** Ghi ra sheet: chuỗi bắt đầu bằng "=" được thêm dấu ' để Google Sheets không coi là công thức */
function BE_sheetSafe(r) {
  var o = {};
  Object.keys(r).forEach(function (k) {
    var v = r[k];
    o[k] = (typeof v === 'string' && /^[=]/.test(v)) ? "'" + v : v;
  });
  return o;
}

/** Mã câu kế tiếp: <MaChuDe>-001, <MaChuDe>-002… (hoặc <MaMon>-001 nếu chưa chọn chủ đề) */
function BE_nextId(ids, prefix) {
  var p = U_str(prefix).replace(/\s+/g, '') || 'CH';
  var re = new RegExp('^' + U_escapeRegex(p) + '-(\\d+)$');
  var max = 0;
  ids.forEach(function (id) { var m = U_str(id).match(re); if (m) max = Math.max(max, Number(m[1])); });
  var n = String(max + 1);
  while (n.length < 3) n = '0' + n;
  return p + '-' + n;
}

function BE_validate(ctx, r) {
  var probe = {};
  Object.keys(r).forEach(function (k) { probe[k] = r[k]; });
  probe.__row = 0;
  var b = Bank_build([probe], ctx.groups, ctx.topics, ctx.levels);
  var mine = b.issues.filter(function (x) { return x.ma === r.MaCH || x.ma === '(dòng 0)'; });
  return {
    errors: mine.filter(function (x) { return x.level === 'LOI'; }).map(function (x) { return x.msg; }),
    warnings: mine.filter(function (x) { return x.level !== 'LOI'; }).map(function (x) { return x.msg; })
  };
}

/**
 * Lưu một câu (thêm mới hoặc sửa).
 * @param {string} maMon
 * @param {Object} rec bản ghi theo tên cột sheet CauHoi
 * @param {string} origId mã câu đang sửa ('' = thêm mới)
 */
function BE_save(maMon, rec, origId) {
  return S_withLock(function () {
    var ctx = BE_ctx(maMon);
    var r = BE_clean(rec || {});
    var ids = ctx.rows.map(function (x) { return U_str(x.MaCH); });
    var existing = null;
    origId = U_str(origId);
    if (origId) {
      existing = ctx.rows.filter(function (x) { return U_str(x.MaCH) === origId; })[0];
      if (!existing) throw new Error('Không tìm thấy câu ' + origId + ' trong ngân hàng (có thể đã bị xoá).');
      r.MaCH = origId;
      r.NgayTao = U_str(existing.NgayTao) || S_now();
    } else {
      if (r.MaCH && ids.indexOf(r.MaCH) >= 0) return { ok: false, errors: ['Mã câu ' + r.MaCH + ' đã tồn tại'] };
      if (!r.MaCH) r.MaCH = BE_nextId(ids, r.MaChuDe || maMon);
      r.NgayTao = S_now();
    }
    if (!r.TrangThai) r.TrangThai = 'DUNG';
    var v = BE_validate(ctx, r);
    if (v.errors.length) return { ok: false, errors: v.errors, warnings: v.warnings };
    if (existing) {
      // xoá giá trị cột không gửi lên (ví dụ bỏ lựa chọn E) — ghi đè toàn bộ các cột đã biết
      var patch = {};
      BE_TEXT_FIELDS.forEach(function (h) { patch[h] = r[h] !== undefined ? r[h] : ''; });
      S_update(ctx.ss, BSH.CAU_HOI, function (o) { return U_str(o.MaCH) === origId; }, BE_sheetSafe(patch));
    } else {
      S_append(ctx.ss, BSH.CAU_HOI, [BE_sheetSafe(r)]);
    }
    S_log(existing ? 'SUA_CAU' : 'THEM_CAU', maMon + ' ' + r.MaCH);
    var out = {};
    BE_TEXT_FIELDS.forEach(function (h) { out[h] = r[h] !== undefined ? r[h] : ''; });
    return { ok: true, id: r.MaCH, row: out, warnings: v.warnings, created: !existing };
  });
}

/** Lưu nhiều câu một lần (chế độ Dán nhiều câu). Câu lỗi bị bỏ qua, câu đúng được ghi một lượt. */
function BE_saveMany(maMon, recs) {
  return S_withLock(function () {
    var ctx = BE_ctx(maMon);
    var ids = ctx.rows.map(function (x) { return U_str(x.MaCH); });
    var now = S_now(), good = [], results = [];
    (recs || []).forEach(function (rec, i) {
      var r = BE_clean(rec || {});
      if (r.MaCH && ids.indexOf(r.MaCH) >= 0) { results.push({ i: i, ok: false, errors: ['Mã câu ' + r.MaCH + ' đã tồn tại'] }); return; }
      if (!r.MaCH) r.MaCH = BE_nextId(ids, r.MaChuDe || maMon);
      r.NgayTao = now;
      if (!r.TrangThai) r.TrangThai = 'DUNG';
      var v = BE_validate(ctx, r);
      if (v.errors.length) { results.push({ i: i, ok: false, errors: v.errors, warnings: v.warnings }); return; }
      ids.push(r.MaCH);
      good.push(r);
      var out = {};
      BE_TEXT_FIELDS.forEach(function (h) { out[h] = r[h] !== undefined ? r[h] : ''; });
      results.push({ i: i, ok: true, id: r.MaCH, row: out, warnings: v.warnings });
    });
    if (good.length) S_append(ctx.ss, BSH.CAU_HOI, good.map(BE_sheetSafe));
    S_log('THEM_NHIEU_CAU', maMon + ': ' + good.length + ' câu');
    return { saved: good.length, results: results };
  });
}

/** Ẩn / dùng lại một câu */
function BE_setStatus(maMon, id, status) {
  var ctx = BE_ctx(maMon);
  var st = U_upper(status) === 'AN' ? 'AN' : 'DUNG';
  var n = S_update(ctx.ss, BSH.CAU_HOI, function (o) { return U_str(o.MaCH) === U_str(id); }, { TrangThai: st });
  if (!n) throw new Error('Không tìm thấy câu ' + id);
  return { id: id, TrangThai: st };
}

/** Xoá hẳn một câu — chỉ khi câu chưa từng nằm trong mã đề nào (nếu đã dùng thì chỉ cho Ẩn) */
function BE_delete(maMon, id) {
  return S_withLock(function () {
    id = U_str(id);
    var used = S_read(S_hub(), SH.DE_THI).filter(function (r) { return U_str(r.MaCH) === id; });
    if (used.length) throw new Error('Câu ' + id + ' đã nằm trong đề của kỳ thi ' + U_str(used[0].MaKyThi) + ' — chỉ có thể Ẩn, không xoá.');
    var ctx = BE_ctx(maMon);
    var row = ctx.rows.filter(function (o) { return U_str(o.MaCH) === id; })[0];
    if (!row) throw new Error('Không tìm thấy câu ' + id);
    ctx.ss.getSheetByName(BSH.CAU_HOI).deleteRow(row.__row);
    S_log('XOA_CAU', maMon + ' ' + id);
    return { id: id };
  });
}

/** Tạo / sửa nhóm câu chùm (đoạn dẫn chung) */
function BE_saveGroup(maMon, g) {
  return S_withLock(function () {
    var ctx = BE_ctx(maMon);
    var r = {
      MaNhom: U_str(g.MaNhom), MaChuDe: U_str(g.MaChuDe), MucDo: U_upper(g.MucDo), DangCau: U_normDang(g.DangCau) || '',
      NoiDung_VI: U_str(g.NoiDung_VI), NoiDung_EN: U_str(g.NoiDung_EN), LaTeX: U_str(g.LaTeX), HinhAnh: U_str(g.HinhAnh),
      TrangThai: 'DUNG'
    };
    if (!r.NoiDung_VI && !r.NoiDung_EN && !r.HinhAnh) throw new Error('Nhóm cần có đoạn dẫn chung (nội dung) hoặc hình ảnh');
    var ids = ctx.groups.map(function (x) { return U_str(x.MaNhom); });
    if (!r.MaNhom) r.MaNhom = BE_nextId(ids, 'N-' + (r.MaChuDe || maMon));
    S_upsert(ctx.ss, BSH.NHOM, function (o) { return U_str(o.MaNhom); }, BE_sheetSafe(r));
    return { id: r.MaNhom, vi: r.NoiDung_VI, en: r.NoiDung_EN, maChuDe: r.MaChuDe, mucDo: r.MucDo, dang: r.DangCau };
  });
}

/** Tải ảnh (dán từ bộ nhớ tạm / kéo thả) lên thư mục HinhAnh_<MaMon> trên Drive. Trả ID file. */
function BE_uploadImage(maMon, b64, mime, name) {
  if (!b64) throw new Error('Không có dữ liệu ảnh');
  if (b64.length > 14 * 1024 * 1024) throw new Error('Ảnh quá lớn (tối đa ~10 MB)');
  var folder = S_folder('IMG_FOLDER_' + U_upper(maMon), 'HinhAnh_' + U_upper(maMon));
  mime = mime || 'image/png';
  var ext = (mime.split('/')[1] || 'png').replace('jpeg', 'jpg');
  var fname = U_str(name) || (U_upper(maMon) + '_' + Utilities.formatDate(new Date(), APP.TZ, 'yyyyMMdd_HHmmss') + '.' + ext);
  var file = folder.createFile(Utilities.newBlob(Utilities.base64Decode(b64), mime, fname));
  return { id: file.getId(), name: fname };
}

/**
 * Dịch nhiều đoạn văn (giữ nguyên công thức $…$, $$…$$ và `mã`) bằng Google Dịch.
 * @param {Array<string>} texts
 * @param {string} from 'vi' | 'en'
 * @param {string} to   'en' | 'vi'
 */
function BE_translate(texts, from, to) {
  texts = (texts || []).map(U_str);
  function esc(s) { return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
  function protect(s) {
    var out = '', re = /\$\$[\s\S]+?\$\$|\$[^$\n]+?\$|`[^`]+`/g, last = 0, m;
    while ((m = re.exec(s))) {
      out += esc(s.substring(last, m.index)) + '<span class="notranslate" translate="no">' + esc(m[0]) + '</span>';
      last = m.index + m[0].length;
    }
    return (out + esc(s.substring(last))).replace(/\n/g, '<br>');
  }
  function unhtml(h) {
    return String(h).replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]+>/g, '').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"').replace(/&#39;|&#x27;/g, "'").replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&')
      .replace(/[ \t]+\n/g, '\n').trim();
  }
  var idx = [], parts = [];
  texts.forEach(function (t, i) { if (t) { idx.push(i); parts.push(protect(t)); } });
  var out = texts.map(function () { return ''; });
  if (!parts.length) return out;
  var joined = parts.map(function (p, k) { return '<div id="t' + k + '">' + p + '</div>'; }).join('');
  var res = LanguageApp.translate(joined, from, to, { contentType: 'html' });
  var pieces = [];
  var re2 = /<div id="?t(\d+)"?[^>]*>([\s\S]*?)<\/div>/gi, m2;
  while ((m2 = re2.exec(res))) pieces[Number(m2[1])] = unhtml(m2[2]);
  idx.forEach(function (i, k) {
    out[i] = pieces[k] !== undefined ? pieces[k] : unhtml(LanguageApp.translate(parts[k], from, to, { contentType: 'html' }));
  });
  return out;
}

/** Tiến độ ngân hàng so với ma trận: mỗi ô cần bao nhiêu (× số mã đề nếu khác câu), đang có bao nhiêu */
function BE_progress(maMon, maMaTran, nCodes) {
  Repo_clearCache();
  var bank = Repo_bank(maMon);
  var mx = Repo_matrix(maMaTran);
  var n = Math.max(1, U_num(nCodes, 1));
  var cells = [];
  mx.sections.forEach(function (sec) {
    sec.cells.forEach(function (cell) {
      var have = bank.units.filter(function (u) { return Mx_matches(u, cell, sec); })
        .reduce(function (a, u) { return a + u.size; }, 0);
      cells.push({
        phan: sec.phan, secTen: sec.ten, allowed: sec.allowed, chuong: cell.chuong, maChuDe: cell.maChuDe, mucDo: cell.mucDo,
        dang: cell.dang, need: cell.need, target: cell.need * n, have: have, label: Mx_cellLabel(sec, cell)
      });
    });
  });
  return { id: mx.id, ten: mx.ten, n: n, cells: cells, issues: mx.issues, totalQuestions: mx.totalQuestions };
}

/** Trang trình nhập (dùng cho menu và Web App ?p=nhap) */
function UI_editorHtml(maMon) {
  var t = HtmlService.createTemplateFromFile('NhapCau');
  t.appName = APP.NAME;
  t.mon = U_upper(maMon || '');
  t.parserSrc = PQ_clientSource();
  return t.evaluate().setTitle('Nhập câu hỏi nhanh').addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

function UI_openEditor() {
  SpreadsheetApp.getUi().showModelessDialog(UI_editorHtml('').setWidth(1480).setHeight(900), '📝 Nhập câu hỏi nhanh');
}

/* ======================= 26_Judge.gs ======================= */
/**
 * 26_Judge.gs — MÁY CHẤM LẬP TRÌNH (dùng chung cho Hệ thống Trung tâm VÀ phòng thi — tools/bundle.js nhúng tệp này vào mã phòng thi).
 *
 * Chạy code Python / C qua dịch vụ biên dịch trực tuyến (Apps Script không tự chạy được Python/C):
 *   - wandbox : miễn phí, không cần khoá (mặc định) — https://wandbox.org
 *   - judge0  : Judge0 CE (tự cài, RapidAPI, Sulu…) — url + khoá
 *   - piston  : Piston tự cài — url
 * Mỗi test là 1 lượt chạy, các test chạy SONG SONG (UrlFetchApp.fetchAll).
 * Giới hạn thời gian / bộ nhớ: Judge0 & Piston tự áp; Wandbox & Piston được chèn thêm 1 đoạn đầu chương trình
 * đặt giới hạn CPU (setrlimit) và in thời gian CPU + bộ nhớ ra stderr (dòng "@@PT ms kb"), máy chấm đọc rồi xoá đi.
 *
 * Chỉ dùng JS thuần + UrlFetchApp + Utilities → chạy được ở cả 2 dự án.
 */

var JD_VERDICT = {
  AC: 'Đúng', WA: 'Sai kết quả', TLE: 'Quá thời gian', MLE: 'Quá bộ nhớ', RE: 'Lỗi khi chạy', CE: 'Lỗi biên dịch',
  OK: 'Đã chạy', IE: 'Lỗi máy chấm'
};
var JD_LANGS = { py: 'Python 3', c: 'C (GCC)' };
var JD_MAX_OUT = 65536;       // giữ tối đa 64 KB output mỗi test
var JD_MAX_CODE = 30000;      // code tối đa 30.000 ký tự

/* ----------------------------------------------------------------- so sánh output */

function JD_norm(s) { return String(s == null ? '' : s).replace(/\r\n?/g, '\n'); }
function JD_tokens(s) { return JD_norm(s).split(/\s+/).filter(function (x) { return x !== ''; }); }
/**
 * So sánh output.
 * mode: TOKEN (mặc định — bỏ qua khác biệt khoảng trắng/xuống dòng) · LINE (từng dòng, bỏ khoảng trắng cuối dòng & dòng trống cuối)
 *       EXACT (đúng từng ký tự) · FLOAT (như TOKEN, số thực sai số eps) · NOCASE (như TOKEN, không phân biệt hoa thường)
 */
function JD_compare(expected, actual, mode, eps) {
  mode = String(mode || 'TOKEN').toUpperCase();
  if (mode === 'EXACT') return JD_norm(expected) === JD_norm(actual);
  if (mode === 'LINE') {
    var cut = function (s) { var a = JD_norm(s).split('\n').map(function (x) { return x.replace(/[ \t]+$/, ''); }); while (a.length && a[a.length - 1] === '') a.pop(); return a; };
    var a = cut(expected), b = cut(actual);
    if (a.length !== b.length) return false;
    for (var i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
    return true;
  }
  var x = JD_tokens(expected), y = JD_tokens(actual);
  if (x.length !== y.length) return false;
  var e = Number(eps); if (!(e > 0)) e = 1e-6;
  for (var j = 0; j < x.length; j++) {
    if (x[j] === y[j]) continue;
    if (mode === 'NOCASE' && x[j].toLowerCase() === y[j].toLowerCase()) continue;
    if (mode === 'FLOAT') {
      var p = Number(x[j]), q = Number(y[j]);
      if (x[j] !== '' && y[j] !== '' && isFinite(p) && isFinite(q) && Math.abs(p - q) <= e * Math.max(1, Math.abs(p))) continue;
    }
    return false;
  }
  return true;
}
/** Vị trí khác đầu tiên (để hiển thị cho thí sinh với test mẫu) */
function JD_firstDiff(expected, actual) {
  var a = JD_norm(expected).split('\n'), b = JD_norm(actual).split('\n');
  for (var i = 0; i < Math.max(a.length, b.length); i++) {
    if ((a[i] || '').replace(/\s+$/, '') !== (b[i] || '').replace(/\s+$/, '')) return { line: i + 1, exp: a[i] === undefined ? '(hết)' : a[i], got: b[i] === undefined ? '(hết)' : b[i] };
  }
  return null;
}

/* ----------------------------------------------------------------- đoạn đầu chương trình (đo thời gian / bộ nhớ, giới hạn CPU) */

function JD_wrap(lang, code, tl, mlMb, lib) {
  var t = Math.max(1, Math.ceil(Number(tl) || 2));
  if (lang === 'c') {
    // đoạn đo / giới hạn đặt SAU code thí sinh → số dòng, cột và dòng code trích trong thông báo lỗi khớp đúng code thí sinh.
    // Tên biến đều có tiền tố __pt_ để không đụng #define của thí sinh (VD #define m 1000000007).
    var ml = Math.max(32, Number(mlMb) || 256) * 1048576;
    return String(code).replace(/\s*$/, '\n') + '\n#include <stdio.h>\n#include <stdlib.h>\n#include <unistd.h>\n#include <sys/resource.h>\n' +
      'static void __pt_end(void){struct rusage __pt_u;getrusage(RUSAGE_SELF,&__pt_u);fflush(stdout);fprintf(stderr,"\\n@@PT %ld %ld\\n",' +
      '(long)(__pt_u.ru_utime.tv_sec*1000+__pt_u.ru_utime.tv_usec/1000+__pt_u.ru_stime.tv_sec*1000+__pt_u.ru_stime.tv_usec/1000),(long)__pt_u.ru_maxrss);}\n' +
      '__attribute__((constructor)) static void __pt_init(void){struct rlimit __pt_c={' + t + ',' + (t + 1) + '};setrlimit(RLIMIT_CPU,&__pt_c);' +
      'struct rlimit __pt_m={' + ml + 'UL,' + ml + 'UL};setrlimit(RLIMIT_AS,&__pt_m);alarm(' + (t * 3 + 2) + ');atexit(__pt_end);}\n';
  }
  // Python: đúng 1 dòng đầu → lỗi báo "line N" được trừ lại 1
  return 'import resource as __ptR,atexit as __ptA,sys as __ptS;__ptR.setrlimit(__ptR.RLIMIT_CPU,(' + t + ',' + (t + 1) + '));' +
    '__ptA.register(lambda:(__ptS.stdout.flush(),__ptS.stderr.write("\\n@@PT %d %d\\n"%(int((__ptR.getrusage(__ptR.RUSAGE_SELF).ru_utime+__ptR.getrusage(__ptR.RUSAGE_SELF).ru_stime)*1000),__ptR.getrusage(__ptR.RUSAGE_SELF).ru_maxrss))))' + JD_pyHook(lib) + '\n' + code;
}
/* ----------------------------------------------------------------- KIỂM SOÁT THƯ VIỆN & HÀM CẤM */

/**
 * Quy định thư viện của 1 bài: { py: null (không giới hạn) | ['math','sys'] (chỉ các module này; [] = không import gì),
 *                                c: null | ['stdio.h','math.h'], cam: ['sorted','qsort'] }
 * Chuỗi lưu trong sheet: "TAT_CA" / "" = không giới hạn · "KHONG" = không import gì · "math, sys" = danh sách.
 */
function JD_libRules(py, c, cam) {
  var list = function (s, lower) {
    return String(s || '').split(/[\s,;]+/).map(function (x) { x = x.trim(); return lower ? x.toLowerCase() : x; }).filter(Boolean)
      .filter(function (x, i, a) { return a.indexOf(x) === i; });
  };
  var mode = function (s, isC) {
    var u = String(s || '').trim().toUpperCase();
    if (!u || u === 'TAT_CA' || u === '*') return null;
    if (u === 'KHONG') return [];
    return list(s, true).map(function (x) { return isC ? x.replace(/^[<"]|[>"]$/g, '') : x.replace(/\..*$/, ''); });
  };
  var r = { py: mode(py, false), c: mode(c, true), cam: list(cam, false) };
  return r.py === null && r.c === null && !r.cam.length ? null : r;
}
/** Xoá chú thích + nội dung chuỗi (giữ xuống dòng để tính số dòng). f-string giữ nguyên (biểu thức nằm trong ngoặc nhọn). */
function JD_strip(lang, s) {
  s = String(s || '').replace(/\r\n?/g, '\n');
  var out = '', i = 0, n = s.length;
  var blank = function (t) { return t.replace(/[^\n]/g, ' '); };
  while (i < n) {
    var ch = s[i];
    if (lang === 'py') {
      if (ch === '#') { var e = s.indexOf('\n', i); if (e < 0) e = n; out += blank(s.substring(i, e)); i = e; continue; }
      var m = /^([rRbBuUfF]{0,2})("""|'''|"|')/.exec(s.substring(i, i + 5));
      if (m && (m[1] === '' || !/\w/.test(s[i - 1] || ''))) {
        var q = m[2], st = i + m[0].length, j = st;
        while (j < n) {
          if (s[j] === '\\') { j += 2; continue; }
          if (s.substr(j, q.length) === q) break;
          if (q.length === 1 && s[j] === '\n') break;
          j++;
        }
        var closed = j < n && s[j] !== '\n', body = s.substring(st, Math.min(j, n));
        out += s.substring(i, st) + (/f/i.test(m[1]) ? body : blank(body)) + (closed ? q : '');
        i = closed ? j + q.length : j; continue;
      }
    } else {
      if (s.substr(i, 2) === '//') { var e2 = s.indexOf('\n', i); if (e2 < 0) e2 = n; out += blank(s.substring(i, e2)); i = e2; continue; }
      if (s.substr(i, 2) === '/*') { var e3 = s.indexOf('*/', i + 2); e3 = e3 < 0 ? n : e3 + 2; out += blank(s.substring(i, e3)); i = e3; continue; }
      if (ch === '"' || ch === "'") {
        var k = i + 1;
        while (k < n && s[k] !== ch && s[k] !== '\n') { if (s[k] === '\\') k++; k++; }
        var cl = s[k] === ch;
        out += ch + blank(s.substring(i + 1, Math.min(k, n))) + (cl ? ch : ''); i = cl ? k + 1 : k; continue;
      }
    }
    out += ch; i++;
  }
  return out;
}
/** Python: các đường lách quy định (nạp thư viện gián tiếp, gọi hàm cấm qua chuỗi, lấy lại __import__ gốc…). Cấm khi bài có quy định thư viện / tên cấm. */
var JD_PY_DYN = ['__import__', '__builtins__', 'builtins', '__loader__', '__spec__', 'importlib', 'sys.modules', '_getframe', 'meta_path', 'path_hooks',
  'path_importer_cache', 'load_module', 'exec_module', 'find_spec', 'find_module',
  '__subclasses__', '__globals__', '__closure__', '__defaults__', '__kwdefaults__', '__code__', '__mro__', '__bases__', '__base__', '__class__', '__dict__',
  '__getattribute__', '__self__', '__func__', '__reduce__', '__reduce_ex__', '__traceback__', 'f_globals', 'f_locals', 'f_builtins', 'f_back', 'tb_frame', 'gi_frame', 'cr_frame',
  'getattr', 'eval', 'exec', 'compile', 'globals', 'locals', 'vars', 'breakpoint', 'attrgetter', 'methodcaller', 'get_field', 'pickle', 'marshal', 'ctypes', 'runpy', 'codeop'];
/** C: hàm thư viện chuẩn thường gặp → header. Bài giới hạn header mà code gọi / tự khai báo hàm của header khác → vi phạm (chặn lách bằng prototype tự viết). */
var JD_PY_BARE = ['getattr', 'eval', 'exec', 'compile', 'globals', 'locals', 'vars', 'breakpoint'];   // hàm dựng sẵn: chỉ tính khi gọi trần (re.compile vẫn được)
var JD_C_STD = {
  'stdio.h': 'printf scanf puts gets getchar putchar fgets fputs sprintf snprintf sscanf fprintf fscanf getc putc fopen fclose fread fwrite fflush perror vprintf',
  'stdlib.h': 'qsort bsearch abs labs llabs div ldiv lldiv atoi atol atoll atof strtol strtoll strtoul strtoull strtod strtof malloc calloc realloc free rand srand exit abort system getenv',
  'string.h': 'strlen strcpy strncpy strcat strncat strcmp strncmp strchr strrchr strstr strtok strspn strcspn strpbrk memset memcpy memmove memcmp memchr strdup strrev strupr strlwr',
  'math.h': 'sqrt sqrtf sqrtl pow powf fabs floor ceil round lround llround trunc fmod log log10 log2 log1p exp exp2 sin cos tan asin acos atan atan2 sinh cosh tanh hypot cbrt fmin fmax rint',
  'ctype.h': 'isdigit isalpha isalnum isspace isupper islower ispunct isxdigit isprint toupper tolower',
  'time.h': 'time clock difftime mktime localtime gmtime strftime',
  'search.h': 'lsearch lfind tsearch hsearch'
};
/** Kiểm tra code theo quy định thư viện → null (hợp lệ) hoặc {line, msg} */
function JD_libCheck(lang, code, lib) {
  if (!lib) return null;
  var raw = String(code || '').replace(/\r\n?/g, '\n'), s = JD_strip(lang, raw);
  var lineOf = function (idx) { return raw.substring(0, idx).split('\n').length; };
  var bad = function (idx, msg) { return { line: lineOf(idx), msg: 'Dòng ' + lineOf(idx) + ': ' + msg }; };
  var m, re;
  var hasCam = !!(lib.cam && lib.cam.length);
  if (lang === 'py' && lib.py) {
    var ok = lib.py, okTxt = ok.length ? 'chỉ cho dùng ' + ok.join(', ') : 'không cho import thư viện nào';
    re = /(^|[;\n])([ \t]*)import[ \t]+([^\n;]+)/g;
    while ((m = re.exec(s))) {
      var mods = m[3].replace(/[()\\]/g, ' ').split(',');
      for (var a = 0; a < mods.length; a++) {
        var root = mods[a].trim().split(/\s+/)[0].split('.')[0];
        if (root && ok.indexOf(root.toLowerCase()) < 0) return bad(m.index + m[1].length, 'dùng thư viện «' + root + '» — bài này ' + okTxt + '.');
      }
    }
    re = /(^|[;\n])([ \t]*)from[ \t]+([.\w]+)[ \t]+import\b/g;
    while ((m = re.exec(s))) {
      var r2 = m[3].split('.')[0];
      if (r2 === '__future__') continue;
      if (!r2 || ok.indexOf(r2.toLowerCase()) < 0) return bad(m.index + m[1].length, 'dùng thư viện «' + (r2 || m[3]) + '» — bài này ' + okTxt + '.');
    }
  }
  if (lang === 'py' && (lib.py || hasCam)) {
    // các đường lách: nạp thư viện gián tiếp / gọi hàm cấm qua chuỗi / lấy lại hàm gốc — cấm khi bài có quy định
    var okM = lib.py || [], sneaky = JD_PY_DYN.concat(['__pt']), first = null;
    for (var b = 0; b < sneaky.length; b++) {
      if (okM.indexOf(sneaky[b]) >= 0) continue;
      re = sneaky[b] === '__pt' ? /\b__pt\w*/ : new RegExp('(^|[^\\w' + (JD_PY_BARE.indexOf(sneaky[b]) >= 0 ? '.' : '') + '])(' + sneaky[b].replace(/\./g, '\\s*\\.\\s*') + ')(?!\\w)');
      var mm = re.exec(s);
      if (mm) {
        var at0 = sneaky[b] === '__pt' ? mm.index : mm.index + mm[1].length;
        if (!first || at0 < first.at) first = { at: at0, nm: (sneaky[b] === '__pt' ? mm[0] : mm[2]).replace(/\s+/g, '') };   // báo chỗ xuất hiện sớm nhất
      }
    }
    if (first) return bad(first.at, 'không được dùng «' + first.nm + '» — bài có quy định thư viện nên cấm các cách gọi gián tiếp (eval, exec, getattr, globals, __import__, __class__…).');
  }
  if (lang === 'c') {
    re = /(^|\n)[ \t]*#[ \t]*(include_next|include|import)\b/g;
    while ((m = re.exec(s))) {
      var at = m.index + m[1].length, rest = raw.substring(m.index + m[0].length).split('\n')[0];
      if (m[2] !== 'include' && (lib.c || hasCam)) return bad(at, 'không được dùng #' + m[2] + ' — chỉ dùng #include <tên.h>.');
      var inc = /^\s*[<"]([^>"\s]+)[>"]/.exec(rest);
      if (!inc) return bad(at, '#include phải viết dạng #include <tên.h>.');
      if (lib.c && lib.c.indexOf(inc[1].toLowerCase()) < 0)
        return bad(at, '#include <' + inc[1] + '> không được phép — bài này chỉ cho dùng: ' + (lib.c.join(', ') || '(không thư viện nào)') + '.');
    }
    if (lib.c || hasCam) {
      // lách bằng ghép tên macro (a##b), hợp ngữ, nạp hàm động
      var cTricks = [[/##/, '«##» (ghép tên bằng macro)'], [/(^|[^\w])(asm|__asm__|__asm)(?!\w)/, '«asm» (hợp ngữ)'], [/(^|[^\w])(dlsym|dlopen|dlvsym)(?!\w)/, '«dlsym / dlopen» (nạp hàm động)']];
      if (lib.c) cTricks.push([/(^|[^\w])(__builtin_\w+)/, '«__builtin_…» (hàm dựng sẵn của trình biên dịch)']);
      for (var ct = 0; ct < cTricks.length; ct++) {
        var hm = cTricks[ct][0].exec(s);
        if (hm) return bad(hm.index + (hm[2] !== undefined ? hm[1].length : 0), 'không được dùng ' + cTricks[ct][1] + ' trong bài có quy định thư viện.');
      }
    }
    if (lib.c) {
      // gọi / tự khai báo hàm của header không được phép (VD tự viết prototype của qsort khi chỉ cho stdio.h)
      for (var h in JD_C_STD) {
        if (lib.c.indexOf(h) >= 0) continue;
        var fns = JD_C_STD[h].split(' ');
        for (var q = 0; q < fns.length; q++) {
          var fn = fns[q];
          var use = new RegExp('(^|[^\\w.>])' + fn + '\\s*\\(').exec(s);   // gọi hoặc tự khai báo prototype
          if (!use) continue;
          if (new RegExp('(^|[^\\w])' + fn + '\\s*\\([^;{}]*\\)\\s*\\{').test(s)) continue;   // tự cài đặt hàm cùng tên → hợp lệ
          var ui = use.index + use[1].length;
          return bad(ui, 'dùng «' + fn + '» của <' + h + '> — bài này chỉ cho dùng: ' + (lib.c.join(', ') || '(không thư viện nào)') + '. Muốn dùng hãy tự viết hàm này.');
        }
      }
    }
  }
  for (var c = 0; c < (lib.cam || []).length; c++) {
    var w = lib.cam[c].replace(/^\./, ''), rx = new RegExp('(^|[^\\w])' + w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '(?!\\w)');
    var hit = rx.exec(s);
    if (hit) return bad(hit.index + hit[1].length, 'không được dùng «' + w + '» trong bài này.');
  }
  return null;
}
/** Python bị giới hạn thư viện → chặn cả import động lúc chạy (exec / __import__ từ chuỗi…). Viết trên CÙNG dòng đầu (số dòng lỗi vẫn đúng). */
function JD_pyHook(lib) {
  if (!lib || !lib.py) return '';
  var ok = lib.py.concat(['encodings', 'codecs']);
  return ';import builtins as __ptB,os as __ptO;__ptOK={' + ok.map(function (x) { return JSON.stringify(x); }).join(',') + '}' +
    ';__ptL=__ptO.path.dirname(__ptO.__file__);__ptI=__ptB.__import__;' +
    '__ptB.__import__=lambda n,g=None,l=None,f=(),lv=0,__i=__ptI:__i(n,g,l,f,lv) if (lv or n.partition(".")[0] in __ptOK or n.startswith("_") or ' +
    '__ptS._getframe(1).f_code.co_filename.startswith((__ptL,"<frozen"))) else (_ for _ in ()).throw(ImportError("Thư viện \'"+n+"\' không được dùng trong bài này"))';
}
/** Tách dòng "@@PT ms kb" khỏi stderr; sửa số dòng lỗi Python (do có 1 dòng chèn thêm) */
function JD_unwrap(lang, err) {
  err = JD_norm(err);
  var m = err.match(/\n?@@PT (\d+) (\d+)\n?/), time = null, mem = null;
  if (m) { time = Number(m[1]); mem = Number(m[2]); err = err.replace(m[0], ''); }
  if (lang === 'py') err = err.replace(/(File "[^"]*", line )(\d+)/g, function (_, a, n) { return a + Math.max(1, Number(n) - 1); });
  if (lang === 'c') err = err.replace(/prog\.c:/g, 'main.c:');
  return { err: err.replace(/\s+$/, ''), time: time, mem: mem };
}
function JD_cut(s, n) { s = String(s == null ? '' : s); n = n || JD_MAX_OUT; return s.length > n ? s.substring(0, n) + '\n…(đã cắt bớt)' : s; }

/* ----------------------------------------------------------------- cấu hình máy chấm */

/** cfg = {p:'wandbox'|'judge0'|'piston', url, key} */
function JD_cfg(c) {
  c = c || {};
  var p = String(c.p || 'wandbox').toLowerCase();
  var url = String(c.url || '').replace(/\/+$/, '');
  if (p === 'wandbox' && !url) url = 'https://wandbox.org';
  if (p === 'judge0' && !url) url = 'https://ce.judge0.com';
  return { p: p, url: url, key: String(c.key || '') };
}
function JD_headers(cfg) {
  var h = {};
  if (cfg.p === 'judge0' && cfg.key) {
    if (/rapidapi\.com/i.test(cfg.url)) { h['X-RapidAPI-Key'] = cfg.key; h['X-RapidAPI-Host'] = cfg.url.replace(/^https?:\/\//, '').split('/')[0]; }
    else h['X-Auth-Token'] = cfg.key;
  }
  if (cfg.p === 'piston' && cfg.key) h.Authorization = cfg.key;
  return h;
}
function JD_cacheGet(k) { try { var s = CacheService.getScriptCache().get(k); return s ? JSON.parse(s) : null; } catch (e) { return null; } }
function JD_cachePut(k, v, sec) { try { CacheService.getScriptCache().put(k, JSON.stringify(v), sec || 21600); } catch (e) { } }

/** Chọn trình biên dịch / ngôn ngữ của dịch vụ (dò 1 lần, đệm 6 giờ) */
function JD_runtime(cfg, lang) {
  var key = 'jdrt|' + cfg.p + '|' + cfg.url + '|' + lang, hit = JD_cacheGet(key);
  if (hit) return hit;
  var rt = null;
  if (cfg.p === 'wandbox') {
    var list = JSON.parse(UrlFetchApp.fetch(cfg.url + '/api/list.json', { muteHttpExceptions: true }).getContentText() || '[]');
    var want = lang === 'c' ? /^gcc-(\d+)\.(\d+)\.(\d+)-c$/ : /^cpython-(\d+)\.(\d+)\.(\d+)$/;
    var best = null, bv = -1;
    list.forEach(function (x) {
      var m = String(x.name || '').match(want);
      if (!m) return;
      var v = Number(m[1]) * 1e6 + Number(m[2]) * 1e3 + Number(m[3]);
      if (v > bv) { bv = v; best = x; }
    });
    if (!best) throw new Error('Wandbox không có trình biên dịch ' + JD_LANGS[lang]);
    rt = { name: best.name, ver: String(best.version || best.name) };
  } else if (cfg.p === 'judge0') {
    var res = UrlFetchApp.fetch(cfg.url + '/languages', { headers: JD_headers(cfg), muteHttpExceptions: true });
    if (res.getResponseCode() !== 200) throw new Error('Judge0 trả lỗi ' + res.getResponseCode() + ' khi lấy danh sách ngôn ngữ (kiểm tra url / khoá)');
    var langs = JSON.parse(res.getContentText() || '[]'), pick = null, pv = -1;
    langs.forEach(function (x) {
      var n = String(x.name || ''), m = lang === 'c' ? n.match(/^C \(GCC (\d+)\.(\d+)/) : n.match(/^Python \((3)\.(\d+)/);
      if (!m) return;
      var v = Number(m[1]) * 1000 + Number(m[2]);
      if (v > pv) { pv = v; pick = x; }
    });
    if (!pick) throw new Error('Judge0 không có ' + JD_LANGS[lang]);
    rt = { id: pick.id, ver: pick.name };
  } else {
    rt = { name: lang === 'c' ? 'c' : 'python', ver: '*' };
  }
  JD_cachePut(key, rt);
  return rt;
}

/* ----------------------------------------------------------------- chạy */

/** Dựng yêu cầu HTTP cho 1 test */
function JD_request(cfg, rt, lang, code, stdin, lim) {
  var h = JD_headers(cfg);
  if (cfg.p === 'wandbox') {
    var body = { compiler: rt.name, code: JD_wrap(lang, code, lim.tl, lim.ml, lim.lib), stdin: stdin || '', save: false };
    if (lang === 'c') body['compiler-option-raw'] = '-O2\n-std=gnu11\n-lm' + (lim.lib ? '\n-Werror=implicit-function-declaration' : '');
    return { url: cfg.url + '/api/compile.json', method: 'post', contentType: 'application/json', payload: JSON.stringify(body), headers: h, muteHttpExceptions: true };
  }
  if (cfg.p === 'judge0') {
    var b64 = function (s) { return Utilities.base64Encode(String(s || ''), Utilities.Charset.UTF_8); };
    var j = { language_id: rt.id, source_code: b64(lang === 'py' && lim.lib && lim.lib.py ? 'import sys as __ptS' + JD_pyHook(lim.lib) + '\n' + code : code), stdin: b64(stdin), cpu_time_limit: Math.max(0.5, Number(lim.tl) || 2),
      wall_time_limit: Math.max(2, (Number(lim.tl) || 2) * 3), memory_limit: Math.max(32, Number(lim.ml) || 256) * 1024 };
    if (lang === 'c') j.compiler_options = '-O2 -lm' + (lim.lib ? ' -Werror=implicit-function-declaration' : '');
    return { url: cfg.url + '/submissions?base64_encoded=true&wait=true', method: 'post', contentType: 'application/json', payload: JSON.stringify(j), headers: h, muteHttpExceptions: true };
  }
  var p = { language: rt.name, version: '*', files: [{ name: lang === 'c' ? 'main.c' : 'main.py', content: JD_wrap(lang, code, lim.tl, lim.ml, lim.lib) }],
    stdin: stdin || '', compile_timeout: 10000, run_timeout: Math.round((Number(lim.tl) || 2) * 3000), run_memory_limit: -1 };
  return { url: cfg.url + '/api/v2/execute', method: 'post', contentType: 'application/json', payload: JSON.stringify(p), headers: h, muteHttpExceptions: true };
}

/** Đọc kết quả HTTP → {kind:'CE'|'RUN'|'IE', out, err, exit, signal, time(ms), mem(KB), raw} */
function JD_parse(cfg, lang, resp, lim) {
  var code = resp.getResponseCode(), text = resp.getContentText() || '';
  if (code === 429) return { kind: 'IE', err: 'Máy chấm đang quá tải (429) — thử lại sau vài giây.', busy: true };
  if (code < 200 || code >= 300) return { kind: 'IE', err: 'Máy chấm trả lỗi HTTP ' + code + ': ' + text.substring(0, 300), busy: code >= 500 };
  var j; try { j = JSON.parse(text); } catch (e) { return { kind: 'IE', err: 'Máy chấm trả dữ liệu không đọc được: ' + text.substring(0, 200) }; }
  if (cfg.p === 'wandbox') {
    var hasRun = j.program_output !== undefined || j.program_error !== undefined || /@@PT/.test(String(j.program_error || ''));
    var cerr = String(j.compiler_error || '');
    if (!hasRun && (lang === 'c' && /error/i.test(cerr) || String(j.status) !== '0' && cerr)) return { kind: 'CE', err: cerr.replace(/prog\.c:/g, 'main.c:') };
    var u = JD_unwrap(lang, j.program_error || '');
    return { kind: 'RUN', out: String(j.program_output || ''), err: u.err, exit: Number(j.status || 0), signal: String(j.signal || ''), time: u.time, mem: u.mem };
  }
  if (cfg.p === 'judge0') {
    var d = function (s) { try { return s ? Utilities.newBlob(Utilities.base64Decode(String(s).replace(/\s/g, ''))).getDataAsString('UTF-8') : ''; } catch (e) { return String(s || ''); } };
    var sid = j.status ? Number(j.status.id) : 0;
    if (sid === 6) return { kind: 'CE', err: d(j.compile_output) };
    if (sid === 13 || sid === 14 || sid === 1 || sid === 2) return { kind: 'IE', err: 'Judge0: ' + (j.status && j.status.description || 'lỗi') + ' ' + d(j.message) };
    var e0 = d(j.stderr); if (lang === 'py' && lim && lim.lib && lim.lib.py) e0 = e0.replace(/(File "[^"]*", line )(\d+)/g, function (_, a, n) { return a + Math.max(1, Number(n) - 1); });
    return { kind: 'RUN', out: d(j.stdout), err: e0, exit: sid === 3 || sid === 4 ? 0 : (j.exit_code == null ? 1 : Number(j.exit_code)),
      signal: sid === 5 ? 'TLE' : (sid >= 7 && sid <= 12 ? String(j.status.description || 'RE') : ''), time: j.time == null ? null : Math.round(Number(j.time) * 1000), mem: j.memory == null ? null : Number(j.memory) };
  }
  if (j.compile && Number(j.compile.code) !== 0 && j.compile.code != null) return { kind: 'CE', err: String(j.compile.stderr || j.compile.output || '') };
  var r = j.run || {}, w = JD_unwrap(lang, r.stderr || '');
  if (!j.run && j.message) return { kind: 'IE', err: 'Piston: ' + j.message };
  return { kind: 'RUN', out: String(r.stdout || ''), err: w.err, exit: Number(r.code == null ? 0 : r.code), signal: String(r.signal || ''), time: w.time, mem: w.mem };
}

/** Số test gửi cùng lúc tới mỗi loại máy chấm */
var JD_BATCH = { wandbox: 3, piston: 4, judge0: 6 };
/** Lỗi do HẠ TẦNG máy chấm (không phải do code thí sinh) → chạy lại, không tính là "Lỗi khi chạy" */
function JD_infraErr(r) {
  if (!r) return true;
  if (r.kind === 'IE') return !!r.busy;
  if (r.kind !== 'RUN' || r.out) return false;
  return /OCI runtime|crun:|runc:|clone:|Resource temporarily unavailable|cannot fork|fork: retry|failed to create (task|shim|container)|container .*(not running|failed)|Too many open files/i.test(String(r.err || ''));
}

/**
 * Chạy code trên nhiều test.
 * tests: [{in, out?}]  — out bỏ trống = chỉ chạy (không so sánh)
 * lim: {tl giây, ml MB, cmp, eps}
 * → {ok, rt, results:[{v, out, err, time, mem, msg}], ce?: thông báo biên dịch}
 */
function JD_run(cfgIn, lang, code, tests, lim) {
  lang = lang === 'c' ? 'c' : 'py';
  lim = lim || {};
  var cfg = JD_cfg(cfgIn);
  if (!String(code || '').trim()) throw new Error('Chưa có code');
  if (String(code).length > JD_MAX_CODE) throw new Error('Code dài quá ' + JD_MAX_CODE + ' ký tự');
  // vi phạm quy định thư viện / hàm cấm → báo ngay, không gửi máy chấm
  var lv = JD_libCheck(lang, code, lim.lib);
  if (lv) return { ok: true, rt: '', lib: lv.msg, ce: lv.msg, busy: false, results: tests.map(function () { return { v: 'CE', err: lv.msg }; }) };
  var rt = JD_runtime(cfg, lang);
  // Gửi theo từng đợt nhỏ (máy chấm miễn phí như Wandbox từ chối khi nhận quá nhiều lượt cùng lúc:
  // "OCI runtime error: crun: clone: Resource temporarily unavailable"), lỗi hạ tầng của máy chấm thì tự chạy lại test đó.
  var batch = JD_BATCH[cfg.p] || 4, parsed = new Array(tests.length), todo = tests.map(function (_, i) { return i; });
  for (var round = 0; round < 3 && todo.length; round++) {
    if (round) Utilities.sleep(700 * round + Math.floor(Math.random() * 400));
    var size = round ? Math.max(1, Math.floor(batch / 2)) : batch, again = [];
    for (var s = 0; s < todo.length; s += size) {
      var part = todo.slice(s, s + size), resps;
      try { resps = UrlFetchApp.fetchAll(part.map(function (i) { return JD_request(cfg, rt, lang, code, tests[i].in, lim); })); }
      catch (e) { if (round === 2) throw new Error('Không gọi được máy chấm (' + cfg.p + '): ' + (e.message || e)); again = again.concat(part); continue; }
      resps.forEach(function (resp, k) {
        var r = JD_parse(cfg, lang, resp, lim), i = part[k];
        if (JD_infraErr(r)) { again.push(i); r = { kind: 'IE', err: 'Máy chấm ' + cfg.p + ' tạm thời quá tải: ' + JD_cut(r.err || '', 300), busy: true }; }
        parsed[i] = r;
      });
    }
    todo = again;
  }
  var tl = (Number(lim.tl) || 2) * 1000, mlKb = (Number(lim.ml) || 256) * 1024, ce = null, busy = false;
  var results = tests.map(function (t, i) {
    var r = parsed[i];
    if (r.busy) busy = true;
    if (r.kind === 'CE') { ce = ce || r.err; return { v: 'CE', err: JD_cut(r.err, 8000) }; }
    if (r.kind === 'IE') return { v: 'IE', err: r.err };
    var v;
    // Python: lỗi cú pháp coi như lỗi biên dịch (giống các hệ thống chấm phổ biến)
    if (lang === 'py' && !r.out && /^(\s*File[^\n]*\n)?[\s\S]*?(SyntaxError|IndentationError|TabError)/.test(r.err) && r.exit !== 0) { ce = ce || r.err; return { v: 'CE', err: JD_cut(r.err, 8000) }; }
    if (/TLE|CPU time|Alarm|SIGXCPU|SIGALRM|time limit/i.test(r.signal) || (r.time != null && r.time > tl)) v = 'TLE';
    else if (r.mem != null && r.mem > mlKb) v = 'MLE';
    else if (/Killed|SIGKILL/i.test(r.signal) && r.mem != null && r.mem > mlKb * 0.9) v = 'MLE';
    else if (r.exit !== 0 || r.signal) v = /MemoryError|bad_alloc|Cannot allocate/i.test(r.err) ? 'MLE' : 'RE';
    else if (t.out === undefined || t.out === null) v = 'OK';
    else v = JD_compare(t.out, r.out, lim.cmp, lim.eps) ? 'AC' : 'WA';
    return { v: v, out: JD_cut(r.out), err: JD_cut(r.err, 8000), time: r.time, mem: r.mem, signal: r.signal || '' };
  });
  return { ok: true, rt: rt.ver, results: results, ce: ce ? JD_cut(ce, 8000) : null, busy: busy };
}

/** Điểm 1 bài từ kết quả: cham = 'TUNG_TEST' (theo trọng số test) | 'TAT_CA' (đúng hết mới có điểm) */
function JD_score(results, weights, diem, cham) {
  var tot = 0, got = 0, all = true;
  results.forEach(function (r, i) {
    var w = Number(weights[i]); if (!(w >= 0)) w = 1;
    tot += w;
    if (r.v === 'AC') got += w; else all = false;
  });
  var max = Number(diem) || 0;
  if (String(cham || '').toUpperCase() === 'TAT_CA') return all && results.length ? max : 0;
  return tot > 0 ? Math.round(max * got / tot * 100) / 100 : (all && results.length ? max : 0);
}

/* ----------------------------------------------------------------- phát hiện code giống nhau */

/** Chuẩn hoá code: bỏ chú thích, chuỗi → S, số → N, tên biến → V (giữ từ khoá) → dãy token */
function JD_fingerprint(code, lang) {
  var kw = lang === 'c'
    ? 'int long short char float double void unsigned signed if else for while do return break continue switch case default struct typedef sizeof const static include define printf scanf malloc free'
    : 'def return if elif else for while in and or not is import from as class try except finally with lambda yield pass break continue print input range len int str float list dict set True False None';
  var K = {}; kw.split(' ').forEach(function (w) { K[w] = 1; });
  var s = String(code || '').replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/\/\/[^\n]*/g, ' ');
  if (lang !== 'c') s = s.replace(/#[^\n]*/g, ' ');
  s = s.replace(/"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'/g, ' S ');
  var toks = s.match(/[A-Za-z_]\w*|\d+(?:\.\d+)?|==|!=|<=|>=|\+\+|--|&&|\|\||[^\s\w]/g) || [];
  return toks.map(function (t) { return /^\d/.test(t) ? 'N' : /^[A-Za-z_]/.test(t) ? (K[t] ? t : 'V') : t; });
}
/** Độ giống (0..1) giữa 2 code: Jaccard của các dãy 5 token liên tiếp */
function JD_similar(a, b, lang) {
  var g = function (toks) { var m = {}; for (var i = 0; i + 5 <= toks.length; i++) m[toks.slice(i, i + 5).join(' ')] = 1; return m; };
  var A = g(JD_fingerprint(a, lang)), B = g(JD_fingerprint(b, lang));
  var ka = Object.keys(A), kb = Object.keys(B);
  if (ka.length < 8 || kb.length < 8) return 0;
  var inter = 0; ka.forEach(function (k) { if (B[k]) inter++; });
  return inter / (ka.length + kb.length - inter);
}

/* ======================= 27_LapTrinh.gs ======================= */
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

/* ======================= 28_DonDep.gs ======================= */
/**
 * 28_DonDep.gs — DỌN DẸP, THU GỌN & SAO LƯU DỮ LIỆU
 *
 *  - Thống kê dung lượng: số ô của từng sheet (giới hạn Google Sheets 10 triệu ô / file), dữ liệu từng kỳ thi.
 *  - Dọn nhật ký cũ (Trung tâm + phòng thi), dọn bản tự lưu thừa của kỳ thi đã đóng (giữ bài nộp + bản lưu cuối mỗi thí sinh).
 *  - Thu gọn: xoá dòng / cột trống thừa ở cuối mỗi sheet (giảm số ô, đọc ghi nhanh hơn).
 *  - Lưu trữ & xoá kỳ thi cũ: xuất toàn bộ dữ liệu kỳ thi ra 1 file Google Sheets lưu trữ rồi xoá khỏi hệ thống đang chạy.
 *  - Sao lưu toàn bộ: sao chép file Trung tâm, file phòng thi, các file ngân hàng vào thư mục SaoLuu/<thời điểm>.
 */

var DD_CELL_LIMIT = 10000000;

function DD_sheetStats(ss) {
  var out = [], cells = 0;
  ss.getSheets().forEach(function (sh) {
    var mr = sh.getMaxRows(), mc = sh.getMaxColumns ? sh.getMaxColumns() : Math.max(1, sh.getLastColumn());
    var lr = sh.getLastRow(), lc = sh.getLastColumn();
    out.push({ name: sh.getName(), rows: Math.max(0, lr - 1), maxRows: mr, cols: lc, maxCols: mc, cells: mr * mc, used: lr * lc });
    cells += mr * mc;
  });
  out.sort(function (a, b) { return b.cells - a.cells; });
  return { sheets: out, cells: cells, limit: DD_CELL_LIMIT, pct: Math.round(cells / DD_CELL_LIMIT * 1000) / 10 };
}
function DD_room() { try { return PTA_room(false); } catch (e) { return null; } }

/** Thống kê dung lượng + dữ liệu từng kỳ thi */
function DD_stats() {
  Repo_clearCache();
  var hub = S_hub(), room = DD_room();
  var res = { hub: DD_sheetStats(hub), room: room ? DD_sheetStats(room) : null, exams: [], logs: {} };
  var cnt = function (rows) { var m = {}; rows.forEach(function (r) { var k = U_str(r.MaKyThi); m[k] = (m[k] || 0) + 1; }); return m; };
  var hb = cnt(S_read(hub, SH.BAI_LAM)), hd = cnt(S_read(hub, SH.DE_THI)), hs = cnt(S_read(hub, SH.THI_SINH));
  var rb = {}, rl = {}, rLuu = {}, rn = {}, rg = {}, rState = {};
  if (room) {
    S_read(room, RSH.BAI_LAM).forEach(function (r) { var k = U_str(r.MaKyThi); rb[k] = (rb[k] || 0) + 1; if (U_upper(r.Loai) === 'LUU' || /^HUY_/.test(U_upper(r.Loai))) rLuu[k] = (rLuu[k] || 0) + 1; });
    rl = cnt(S_read(room, RSH.NHAT_KY)); rg = cnt(S_read(room, RSH.GOI_DE));
    if (room.getSheetByName(RSH.LT_NOP)) rn = cnt(S_read(room, RSH.LT_NOP));
    S_read(room, RSH.KY_THI).forEach(function (r) { rState[U_str(r.MaKyThi)] = U_str(r.TrangThai); });
  }
  Repo_examRows().forEach(function (e) {
    var k = U_str(e.MaKyThi);
    res.exams.push({ ma: k, ten: U_str(e.TenKyThi), stage: U_str(e.TrangThai), room: rState[k] || '', ngay: U_str(e.NgayThi) || U_str(e.NgayTao),
      hubRows: (hb[k] || 0) + (hd[k] || 0) + (hs[k] || 0), deThi: hd[k] || 0, thiSinh: hs[k] || 0, baiLamHub: hb[k] || 0,
      baiLamRoom: rb[k] || 0, tuLuu: rLuu[k] || 0, nhatKy: rl[k] || 0, goiDe: rg[k] || 0, nopCode: rn[k] || 0 });
  });
  var hl = S_read(hub, SH.NHAT_KY);
  res.logs.hub = { n: hl.length, oldest: hl.length ? U_str(hl[0].ThoiGian) : '' };
  if (room) { var rlog = S_read(room, RSH.NHAT_KY); res.logs.room = { n: rlog.length, oldest: rlog.length ? PTA_fmt(rlog[0].ThoiGian) : '' }; }
  return res;
}

/** Dọn nhật ký: o = {days (xoá cũ hơn N ngày), hub:true, room:true, exams:[MaKyThi] (xoá nhật ký phòng thi của các kỳ thi này)} */
function DD_cleanLogs(o) {
  return S_withLock(function () {
    var days = Math.max(0, U_num(o.days, 30)), cut = Date.now() - days * 86400000, cutStr = Utilities.formatDate(new Date(cut), APP.TZ, 'yyyy-MM-dd HH:mm:ss');
    var exams = {}; (o.exams || []).forEach(function (m) { exams[U_str(m)] = 1; });
    var out = { hub: 0, room: 0 }, room = DD_room();
    if (o.hub !== false) {
      var before = S_read(S_hub(), SH.NHAT_KY).length;
      S_replaceWhere(S_hub(), SH.NHAT_KY, function (r) { return U_str(r.ThoiGian) && U_str(r.ThoiGian) < cutStr; }, []);
      out.hub = before - S_read(S_hub(), SH.NHAT_KY).length;
    }
    if (o.room !== false && room) {
      var open = {}; S_read(room, RSH.KY_THI).forEach(function (r) { if (U_upper(r.TrangThai) === 'MO') open[U_str(r.MaKyThi)] = 1; });
      var b2 = S_read(room, RSH.NHAT_KY).length;
      S_replaceWhere(room, RSH.NHAT_KY, function (r) {
        var k = U_str(r.MaKyThi);
        if (open[k]) return false;                         // không đụng kỳ thi đang mở
        return exams[k] || U_num(r.ThoiGian, 0) < cut;
      }, []);
      out.room = b2 - S_read(room, RSH.NHAT_KY).length;
    }
    S_log('DON_NHAT_KY', JSON.stringify(out) + ' (cũ hơn ' + days + ' ngày)');
    return out;
  });
}

/**
 * Dọn bản tự lưu thừa ở phòng thi (kỳ thi KHÔNG đang mở): mỗi thí sinh giữ mọi bài NỘP / GIẤY + 1 bản LƯU mới nhất.
 * o = {exams:[...] (bỏ trống = mọi kỳ thi đã đóng), huy:true (xoá cả lượt thi đã huỷ HUY_*), lt:true (gọn lịch sử nộp code: giữ lần điểm cao nhất + lần cuối)}
 */
function DD_cleanAutosave(o) {
  return S_withLock(function () {
    var room = DD_room();
    if (!room) throw new Error('Chưa có file phòng thi');
    var st = {}; S_read(room, RSH.KY_THI).forEach(function (r) { st[U_str(r.MaKyThi)] = U_upper(r.TrangThai); });
    var want = {}; (o.exams || []).forEach(function (m) { want[U_str(m)] = 1; });
    var ok = function (k) { return st[k] !== 'MO' && (o.exams && o.exams.length ? want[k] : st[k] === 'DONG' || !st[k]); };
    var rows = S_read(room, RSH.BAI_LAM), latest = {};
    rows.forEach(function (r) {
      if (!ok(U_str(r.MaKyThi)) || U_upper(r.Loai) !== 'LUU') return;
      var k = U_str(r.MaKyThi) + '|' + U_upper(r.SBD), b = latest[k];
      if (!b || U_num(r.Seq, 0) > U_num(b.Seq, 0) || (U_num(r.Seq, 0) === U_num(b.Seq, 0) && U_num(r.ThoiGian, 0) > U_num(b.ThoiGian, 0))) latest[k] = r;
    });
    var del = 0;
    var keep = rows.filter(function (r) {
      var k = U_str(r.MaKyThi);
      if (!ok(k)) return true;
      var L = U_upper(r.Loai);
      if (L === 'LUU' && latest[k + '|' + U_upper(r.SBD)] !== r) { del++; return false; }
      if (o.huy && /^HUY_/.test(L)) { del++; return false; }
      return true;
    });
    if (del) S_writeAll(room, RSH.BAI_LAM, keep);
    var delLt = 0;
    if (o.lt && room.getSheetByName(RSH.LT_NOP)) {
      var nr = S_read(room, RSH.LT_NOP), best = {}, last = {};
      nr.forEach(function (r) {
        if (!ok(U_str(r.MaKyThi))) return;
        var k = U_str(r.MaKyThi) + '|' + U_upper(r.SBD) + '|' + U_str(r.MaBai);
        if (!best[k] || U_num(r.Diem, 0) > U_num(best[k].Diem, 0)) best[k] = r;
        if (!last[k] || U_num(r.ThoiGian, 0) > U_num(last[k].ThoiGian, 0)) last[k] = r;
      });
      var keep2 = nr.filter(function (r) {
        if (!ok(U_str(r.MaKyThi))) return true;
        var k = U_str(r.MaKyThi) + '|' + U_upper(r.SBD) + '|' + U_str(r.MaBai);
        if (best[k] === r || last[k] === r) return true;
        delLt++; return false;
      });
      if (delLt) S_writeAll(room, RSH.LT_NOP, keep2);
    }
    S_log('DON_TU_LUU', del + ' bản lưu, ' + delLt + ' lần nộp code');
    return { baiLam: del, nopCode: delLt };
  });
}

/** Thu gọn: xoá dòng/cột trống thừa ở cuối mọi sheet (giữ dự phòng) */
function DD_compact() {
  return S_withLock(function () {
    var spare = {}; spare[RSH.BAI_LAM] = 300; spare[RSH.NHAT_KY] = 300; spare[RSH.LT_NOP] = 200;
    var one = function (ss, isRoom) {
      var freed = 0;
      ss.getSheets().forEach(function (sh) {
        var mr = sh.getMaxRows(), lr = Math.max(1, sh.getLastRow()), keepR = lr + ((isRoom && spare[sh.getName()]) || 20);
        if (mr > keepR + 1 && sh.deleteRows) { var n = mr - keepR; sh.deleteRows(keepR + 1, n); freed += n * (sh.getMaxColumns ? sh.getMaxColumns() : 1); }
        if (sh.getMaxColumns && sh.deleteColumns) {
          var mc = sh.getMaxColumns(), lc = Math.max(1, sh.getLastColumn()), keepC = lc + 2;
          if (mc > keepC + 1) { sh.deleteColumns(keepC + 1, mc - keepC); freed += (mc - keepC) * sh.getMaxRows(); }
        }
      });
      return freed;
    };
    var out = { hub: one(S_hub(), false), room: 0 }, room = DD_room();
    if (room) out.room = one(room, true);
    S_log('THU_GON', JSON.stringify(out));
    return out;
  });
}

/** Lưu trữ (xuất file) & xoá 1 kỳ thi. o = {xacNhan: MaKyThi, luuTru:true, xoaPhongThi:true, xoaTrungTam:false, xoaTep:false} */
function DD_archiveExam(maKyThi, o) {
  maKyThi = U_str(maKyThi);
  if (U_str(o.xacNhan) !== maKyThi) throw new Error('Gõ đúng mã kỳ thi "' + maKyThi + '" để xác nhận.');
  return S_withLock(function () {
    Repo_clearCache();
    var hub = S_hub(), room = DD_room(), exRow = Repo_examRow(maKyThi);
    var rEx = room ? PTA_examRow(room, maKyThi) : null;
    if (rEx && U_upper(rEx.TrangThai) === 'MO') throw new Error('Kỳ thi đang MỞ trên phòng thi — đóng phòng thi trước.');
    var mine = function (r) { return U_str(r.MaKyThi) === maKyThi; };
    var hubSheets = [SH.KY_THI, SH.MA_DE, SH.DE_THI, SH.THI_SINH, SH.BAI_LAM, SH.KET_QUA, SH.DIEM_PHAN, SH.KQ_CHU_DE, SH.PHUC_KHAO, SH.LT_KQ];
    var roomSheets = [RSH.KY_THI, RSH.THI_SINH, RSH.GOI_DE, RSH.BAI_LAM, RSH.NHAT_KY, RSH.LT_TEST, RSH.LT_NOP];
    var out = { archive: '', removedHub: 0, removedRoom: 0, trashed: 0 };
    if (o.luuTru !== false) {
      var folder = S_folder('PROP_ARCHIVE_FOLDER', 'LuuTru');
      var ar = SpreadsheetApp.create('LuuTru_' + maKyThi + '_' + Utilities.formatDate(new Date(), APP.TZ, 'yyyyMMdd_HHmm'));
      var put = function (name, rows) {
        rows = rows.map(function (r) { var x = {}; Object.keys(r).forEach(function (k) { if (k !== '__row') x[k] = r[k]; }); return x; });
        if (!rows.length) return;
        var head = []; rows.forEach(function (r) { Object.keys(r).forEach(function (k) { if (head.indexOf(k) < 0) head.push(k); }); });
        var sh = ar.insertSheet(name);
        if (sh.getMaxRows() < rows.length + 1 && sh.insertRowsAfter) sh.insertRowsAfter(sh.getMaxRows(), rows.length + 1 - sh.getMaxRows());
        sh.getRange(1, 1, 1, head.length).setValues([head]);
        sh.getRange(2, 1, rows.length, head.length).setValues(rows.map(function (r) { return head.map(function (h) { var v = r[h]; v = v == null ? '' : String(v); return v.length > 49000 ? v.substring(0, 49000) : v; }); }));
      };
      hubSheets.forEach(function (n) { if (hub.getSheetByName(n)) put('TT_' + n, S_read(hub, n).filter(mine)); });
      if (room) roomSheets.forEach(function (n) { if (room.getSheetByName(n) && n !== RSH.GOI_DE) put('PT_' + n, S_read(room, n).filter(mine)); });
      try { var s1 = ar.getSheetByName('Sheet1') || ar.getSheetByName('Trang tính1'); if (s1 && ar.getSheets().length > 1) ar.deleteSheet(s1); } catch (e) { }
      try { DriveApp.getFileById(ar.getId()).moveTo(folder); } catch (e) { }
      out.archive = ar.getUrl();
    }
    if (o.xoaPhongThi !== false && room) {
      roomSheets.forEach(function (n) {
        if (!room.getSheetByName(n)) return;
        var b = S_read(room, n).length;
        S_replaceWhere(room, n, mine, []);
        out.removedRoom += b - S_read(room, n).length;
      });
      try { CacheService.getScriptCache().remove('ex|' + maKyThi); } catch (e) { }
    }
    if (o.xoaTrungTam) {
      if (o.xoaTep) {
        Repo_variantRows(maKyThi).forEach(function (v) { if (U_str(v.FormId)) { try { DriveApp.getFileById(U_str(v.FormId)).setTrashed(true); out.trashed++; } catch (e) { } } });
        if (U_str(exRow.ThuMucId)) { try { DriveApp.getFolderById(U_str(exRow.ThuMucId)).setTrashed(true); out.trashed++; } catch (e) { } }
      }
      hubSheets.forEach(function (n) {
        if (!hub.getSheetByName(n)) return;
        var b = S_read(hub, n).length;
        S_replaceWhere(hub, n, mine, []);
        out.removedHub += b - S_read(hub, n).length;
      });
    }
    S_log('LUU_TRU_KY_THI', maKyThi + ' ' + JSON.stringify(out));
    return out;
  });
}

/** Sao lưu toàn bộ: bản sao file Trung tâm, phòng thi, ngân hàng → thư mục SaoLuu/<thời điểm> */
function DD_backup() {
  var parent = S_folder('PROP_BACKUP_FOLDER', 'SaoLuu');
  var stamp = Utilities.formatDate(new Date(), APP.TZ, 'yyyy-MM-dd_HHmm');
  var folder = parent.createFolder(stamp), files = [];
  var copy = function (id, name) {
    try { var f = DriveApp.getFileById(id).makeCopy(name + '_' + stamp, folder); files.push({ name: name, url: f.getUrl() }); }
    catch (e) { files.push({ name: name, err: e.message }); }
  };
  copy(S_hub().getId(), 'TrungTam');
  var room = DD_room(); if (room) copy(room.getId(), 'PhongThi_DuLieu');
  Repo_subjects().forEach(function (s) { if (s.id) copy(s.id, 'NganHang_' + s.maMon); });
  // chỉ giữ N bản sao lưu gần nhất (mặc định 8) — bản cũ hơn chuyển vào Thùng rác
  var keep = Math.max(1, U_num(Repo_config().DD_GIU_SAO_LUU, 8)), list = [], trashed = 0;
  try { list = JSON.parse(S_props().getProperty('PROP_BACKUP_LIST') || '[]') || []; } catch (e) { list = []; }
  list.push({ id: folder.getId(), name: stamp });
  while (list.length > keep) { var old = list.shift(); try { DriveApp.getFolderById(old.id).setTrashed(true); trashed++; } catch (e) { } }
  S_props().setProperty('PROP_BACKUP_LIST', JSON.stringify(list));
  S_log('SAO_LUU', stamp + ' · ' + files.length + ' tệp' + (trashed ? ' · bỏ ' + trashed + ' bản cũ' : ''));
  return { folder: folder.getUrl(), name: stamp, files: files, kept: list.length, trashed: trashed };
}

/* ================================================================ BẢO TRÌ TỰ ĐỘNG (hằng tuần) */

var DD_AUTO_FN = 'DD_autoTick';
function DD_cfgSet(kv) {
  Object.keys(kv).forEach(function (k) { S_upsert(S_hub(), SH.CAU_HINH, function (x) { return U_str(x.Khoa); }, { Khoa: k, GiaTri: String(kv[k]), MoTa: 'Bảo trì tự động' }); });
  Repo_clearCache();
}
function DD_autoGet() {
  var c = Repo_config();
  var tr = ScriptApp.getProjectTriggers().filter(function (t) { return t.getHandlerFunction() === DD_AUTO_FN; });
  return { on: tr.length > 0, days: U_num(c.DD_TU_DONG_NGAY, 60), backup: U_str(c.DD_TU_DONG_SAO_LUU) !== 'KHONG', keep: U_num(c.DD_GIU_SAO_LUU, 8),
    last: U_str(c.DD_TU_DONG_LAN_CUOI), lastMsg: U_str(c.DD_TU_DONG_KET_QUA) };
}
/** Bật / tắt bảo trì tự động: 2 giờ sáng Chủ nhật hằng tuần → sao lưu, dọn nhật ký cũ, dọn bản tự lưu kỳ thi đã đóng, thu gọn */
function DD_autoSet(o) {
  ScriptApp.getProjectTriggers().forEach(function (t) { if (t.getHandlerFunction() === DD_AUTO_FN) ScriptApp.deleteTrigger(t); });
  DD_cfgSet({ DD_TU_DONG_NGAY: Math.max(7, U_num(o.days, 60)), DD_TU_DONG_SAO_LUU: o.backup === false ? 'KHONG' : 'CO', DD_GIU_SAO_LUU: Math.max(1, Math.min(52, U_num(o.keep, 8))) });
  if (o.on) ScriptApp.newTrigger(DD_AUTO_FN).timeBased().everyWeeks(1).onWeekDay(ScriptApp.WeekDay.SUNDAY).atHour(2).create();
  S_log('BAO_TRI_TU_DONG', o.on ? 'BẬT' : 'TẮT');
  return DD_autoGet();
}
function DD_autoTick() {
  var c = DD_autoGet(), parts = [];
  // đang có kỳ thi mở trên phòng thi → bỏ qua lần này (không làm chậm phòng thi)
  var room = DD_room();
  if (room && S_read(room, RSH.KY_THI).some(function (r) { return U_upper(r.TrangThai) === 'MO'; })) {
    DD_cfgSet({ DD_TU_DONG_LAN_CUOI: S_now(), DD_TU_DONG_KET_QUA: 'Bỏ qua: đang có kỳ thi mở' });
    return { skipped: true };
  }
  try {
    if (c.backup) { var b = DD_backup(); parts.push('sao lưu ' + b.files.length + ' tệp'); }
    var l = DD_cleanLogs({ days: c.days }); parts.push('nhật ký −' + (l.hub + l.room));
    if (room) { var a = DD_cleanAutosave({ huy: true, lt: true }); parts.push('tự lưu −' + a.baiLam + ', code −' + a.nopCode); }
    var k = DD_compact(); parts.push('thu gọn ' + (k.hub + k.room) + ' ô');
  } catch (e) { parts.push('LỖI: ' + e.message); }
  DD_cfgSet({ DD_TU_DONG_LAN_CUOI: S_now(), DD_TU_DONG_KET_QUA: parts.join(' · ') });
  return { done: parts };
}

/* ======================= 29_LtNhap.gs ======================= */
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

/* ======================= 30_FormExport.gs ======================= */
/**
 * 30_FormExport.gs — Xuất mỗi mã đề thành 1 Google Form
 *
 * - Trang 1: Số báo danh (chỉ chấp nhận SBD được phân mã đề này) + Họ tên.
 * - Mỗi Phần của đề là một trang (hoặc tiêu đề mục) ghi rõ số câu, điểm.
 * - MOT_DA -> trắc nghiệm 1 lựa chọn; NHIEU_DA -> hộp kiểm; DUNG_SAI -> lưới Đúng/Sai;
 *   GHEP_NOI -> lưới (hàng = ý trái, cột = số mục phải); TRA_LOI_NGAN -> ô văn bản ngắn.
 * - Công thức phức tạp / cột LaTeX -> ảnh PNG (lưu đệm trên Drive), hình ảnh Drive, video YouTube.
 * - Form KHÔNG bật Quiz -> thí sinh không thấy điểm/đáp án. Form được xuất ở trạng thái ĐÓNG.
 * - Xuất lại: dùng lại Form cũ (link không đổi) nếu chưa có bài nộp.
 */

function FX_exportVariant(maKyThi, maDe, force) {
  return S_withLock(function () {
    Repo_clearCache();
    maDe = String(maDe);
    var hub = S_hub(), cfg = Repo_config();
    var exRow = Repo_examRow(maKyThi), exam = Gen_examFromRow(exRow);
    var st = U_str(exRow.TrangThai);
    if ([TT_KY_THI.DA_CHOT, TT_KY_THI.DA_XUAT].indexOf(st) < 0) {
      throw new Error('Cần Chốt đề trước khi xuất Form (trạng thái hiện tại: ' + (st || TT_KY_THI.NHAP) + ')');
    }
    var bank = Repo_bank(exam.maMon);
    var sections = Repo_sections(exRow);
    var allItems = Repo_items(maKyThi);
    var items = allItems.filter(function (x) { return x.MaDe === maDe; })
      .sort(function (a, b) { return Number(a.STT) - Number(b.STT); });
    if (!items.length) throw new Error('Mã đề ' + maDe + ' chưa có câu hỏi');
    var vRow = Repo_variantRows(maKyThi).filter(function (v) { return U_str(v.MaDe) === maDe; })[0] || {};
    var warnings = [];

    // Cập nhật bản chụp đáp án theo ngân hàng hiện tại (trước khi Form được dùng để thi)
    FX_snapshot(items, bank, warnings);

    var form = null, reused = false;
    if (U_str(vRow.FormId)) {
      try { form = FormApp.openById(U_str(vRow.FormId)); } catch (e) { form = null; }
    }
    if (form) {
      var nResp = form.getResponses().length;
      if (nResp > 0 && !force) throw new Error('Form mã đề ' + maDe + ' đã có ' + nResp + ' bài nộp — không xuất lại để tránh mất dữ liệu.');
      form.getItems().forEach(function (i) { form.deleteItem(i); });
      reused = true;
    } else {
      form = FormApp.create(FX_title(exRow, maDe));
      try { DriveApp.getFileById(form.getId()).moveTo(FX_examFolder(exRow)); } catch (e) { warnings.push('Không chuyển được Form vào thư mục kỳ thi: ' + e.message); }
    }
    FX_configure(form, exRow, cfg, maDe, sections, items);

    var ctx = { form: form, cfg: cfg, bilingual: U_bool(cfg.SONG_NGU, true), required: U_bool(cfg.BAT_BUOC_TRA_LOI, false),
      warnings: warnings, bank: bank };
    var sbdItem = form.addTextItem().setTitle('Số báo danh / Student ID').setRequired(true)
      .setHelpText('Mã đề / Paper code: ' + maDe);
    var nameItem = form.addTextItem().setTitle('Họ và tên / Full name').setRequired(true);
    var pageBreak = U_bool(cfg.MOI_PHAN_MOT_TRANG, true);

    sections.forEach(function (sec) {
      var secItems = items.filter(function (x) { return x.Phan === String(sec.phan); });
      if (!secItems.length) return;
      var pts = sec.diem / secItems.length;
      var dangs = {};
      secItems.forEach(function (x) { dangs[x.DangCau] = true; });
      var head = 'PHẦN ' + sec.phan + '. ' + sec.ten;
      var help = secItems.length + ' câu · ' + sec.diem + ' điểm · mỗi câu ' + U_round(pts, 2) + ' điểm / ' +
        secItems.length + ' questions · ' + sec.diem + ' points';
      var hints = Object.keys(dangs).map(FX_hint).filter(String);
      if (hints.length) help += '\n' + hints.join('\n');
      if (pageBreak) form.addPageBreakItem().setTitle(head).setHelpText(help);
      else form.addSectionHeaderItem().setTitle(head).setHelpText(help);
      var lastGroup = null;
      secItems.forEach(function (it) {
        var q = bank.questions[it.MaCH];
        if (q.maNhom && q.maNhom !== lastGroup && bank.groups[q.maNhom]) FX_addGroup(ctx, bank.groups[q.maNhom], secItems);
        lastGroup = q.maNhom || null;
        var item = FX_addQuestion(ctx, it, q);
        it.FormItemId = String(item.getId());
      });
    });

    FX_publishClosed(form);
    var sbds = Repo_students(maKyThi).filter(function (s) { return s.MaDe === maDe; }).map(function (s) { return s.SBD; });
    FX_applySbdValidation(sbdItem, sbds);

    var clean = items.map(function (it) { var o = {}; HEADERS[SH.DE_THI].forEach(function (h) { o[h] = it[h]; }); return o; });
    S_replaceWhere(hub, SH.DE_THI, function (o) { return U_str(o.MaKyThi) === exam.maKyThi && U_str(o.MaDe) === maDe; }, clean);
    var pub = form.getPublishedUrl();
    S_upsert(hub, SH.MA_DE, function (o) { return U_str(o.MaKyThi) + '|' + U_str(o.MaDe); }, {
      MaKyThi: exam.maKyThi, MaDe: maDe, SoCau: items.length, TrangThai: 'DA_XUAT', FormId: form.getId(),
      LinkSua: form.getEditUrl(), LinkThi: pub, ItemIdSBD: String(sbdItem.getId()), ItemIdHoTen: String(nameItem.getId()),
      NgayXuat: S_now(), GhiChu: warnings.length ? warnings.length + ' cảnh báo' : ''
    });
    S_update(hub, SH.THI_SINH, function (o) { return U_str(o.MaKyThi) === exam.maKyThi && U_str(o.MaDe) === maDe; }, { LinkThi: pub });
    var allDone = Repo_variantRows(maKyThi).every(function (v) { return U_str(v.TrangThai) === 'DA_XUAT' && U_str(v.FormId); });
    if (allDone) Repo_setExam(maKyThi, { TrangThai: TT_KY_THI.DA_XUAT });
    S_log('XUAT_FORM', maKyThi + ' ' + maDe + (reused ? ' (dùng lại form)' : ''));
    return { maDe: maDe, formId: form.getId(), editUrl: form.getEditUrl(), url: pub, warnings: warnings, reused: reused,
      nCau: items.length, allDone: allDone, nSbd: sbds.length };
  });
}

/** Chụp thứ tự lựa chọn + đáp án theo ngân hàng hiện tại vào các dòng DeThi (dùng cho cả Form và phòng thi web) */
function FX_snapshot(items, bank, warnings) {
  items.forEach(function (it) {
    var q = bank.questions[it.MaCH];
    if (!q || !q.valid) throw new Error('Câu ' + it.MaCH + ' không còn hợp lệ trong ngân hàng — hãy sửa ngân hàng hoặc Mở chốt › Đổi câu');
    var perm = U_str(it.ThuTu) ? U_str(it.ThuTu).split(',') : [];
    var keys = q.options.map(function (o) { return o.key; });
    if (q.dang !== DANG.TRA_LOI_NGAN && (perm.length !== keys.length || perm.some(function (L) { return keys.indexOf(L) < 0; }))) {
      warnings.push('Câu ' + it.MaCH + ': số lựa chọn trong ngân hàng đã đổi — dùng thứ tự gốc');
      perm = keys;
    }
    it.ThuTu = perm.join(',');
    it.DapAnGoc = Bank_keyToString(q.dang, q.key);
    it.DapAnMaDe = Gen_displayKey(q.dang, q.key, perm);
  });
}

function FX_title(exRow, maDe) { return U_str(exRow.TenKyThi) + ' — Mã đề ' + maDe; }

function FX_examFolder(exRow) {
  var id = U_str(exRow.ThuMucId);
  if (id) { try { return DriveApp.getFolderById(id); } catch (e) { } }
  var f = S_examFolder().createFolder(U_str(exRow.MaKyThi) + ' — ' + U_str(exRow.TenKyThi));
  Repo_setExam(U_str(exRow.MaKyThi), { ThuMucId: f.getId() });
  return f;
}

function FX_try(fn) { try { fn(); } catch (e) { /* phương thức có thể không có ở mọi phiên bản */ } }

function FX_configure(form, exRow, cfg, maDe, sections, items) {
  form.setTitle(FX_title(exRow, maDe));
  var lines = [];
  if (U_str(cfg.TEN_DON_VI)) lines.push(U_str(cfg.TEN_DON_VI));
  lines.push('Kỳ thi / Exam: ' + U_str(exRow.TenKyThi));
  lines.push('Mã đề / Paper: ' + maDe + (U_num(exRow.ThoiGianPhut, 0) ? '   ·   Thời gian / Time: ' + U_num(exRow.ThoiGianPhut, 0) + ' phút / minutes' : ''));
  lines.push('Cấu trúc / Structure: ' + sections.map(function (s) {
    var n = items.filter(function (x) { return x.Phan === String(s.phan); }).length;
    return 'Phần ' + s.phan + ' (' + n + ' câu – ' + s.diem + ' điểm)';
  }).join('; ') + '. Tổng ' + sections.reduce(function (a, s) { return a + Number(s.diem); }, 0) + ' điểm.');
  lines.push('Quy tắc chấm: sai hoặc bỏ trống không bị trừ điểm; câu nhiều đáp án, Đúng/Sai và ghép nối phải đúng toàn bộ mới được điểm. ' +
    '/ No negative marking; multi-answer, true/false and matching items require all parts correct.');
  if (U_str(cfg.HUONG_DAN_DE)) lines.push(U_str(cfg.HUONG_DAN_DE));
  form.setDescription(lines.join('\n'));
  FX_try(function () { form.setIsQuiz(false); });
  FX_try(function () { form.setCollectEmail(false); });
  FX_try(function () { form.setAllowResponseEdits(false); });
  FX_try(function () { form.setLimitOneResponsePerUser(false); });
  FX_try(function () { form.setShowLinkToRespondAgain(false); });
  FX_try(function () { form.setPublishingSummary(false); });
  FX_try(function () { form.setProgressBar(true); });
  FX_try(function () { form.setShuffleQuestions(false); });
  FX_try(function () { form.setRequireLogin(false); });
  FX_try(function () { form.setConfirmationMessage(U_str(cfg.THONG_BAO_NOP_BAI)); });
  FX_try(function () { form.setCustomClosedFormMessage('Đề thi chưa mở hoặc đã kết thúc. / This exam is not open.'); });
}

function FX_publishClosed(form) {
  FX_try(function () { if (typeof form.isPublished === 'function' && !form.isPublished()) form.setPublished(true); });
  form.setAcceptingResponses(false);
}

function FX_hint(dang) {
  return {
    NHIEU_DA: '☑ Nhiều đáp án: chọn TẤT CẢ đáp án đúng. / Select ALL correct answers.',
    DUNG_SAI: '⚖ Đúng/Sai: chọn Đúng hoặc Sai cho TỪNG ý. / Mark EACH statement True or False.',
    GHEP_NOI: '🔗 Ghép nối: với mỗi ý bên trái chọn số của mục bên phải. / Match each item to a number.',
    TRA_LOI_NGAN: '✎ Trả lời ngắn: chỉ ghi kết quả; số thập phân dùng dấu chấm hoặc phẩy. / Write only the final answer.'
  }[dang] || '';
}

function FX_join() {
  return Array.prototype.slice.call(arguments).filter(function (x) { return U_str(x); }).join('\n');
}

/** Tiêu đề = dòng đầu; phần còn lại + tiếng Anh vào mô tả */
function FX_titleHelp(prefix, vi, en) {
  var lines = U_str(vi).split('\n');
  var first = lines.shift();
  return { title: prefix + first, help: FX_join(lines.join('\n'), en) };
}

function FX_isPureFormula(s) {
  var segs = LX_segments(s).filter(function (x) { return x.type !== 'text' || x.value.trim(); });
  return segs.length === 1 && segs[0].type !== 'text';
}

/** Chuẩn bị nhãn lựa chọn / ý theo thứ tự hiển thị */
function FX_options(ctx, it, q, imgs) {
  var perm = U_str(it.ThuTu) ? U_str(it.ThuTu).split(',') : [];
  var res = { labels: [], imageLatex: '', rightText: '', nRight: 0 };
  if (q.dang === DANG.TRA_LOI_NGAN) return res;
  var prefix = q.dang === DANG.DUNG_SAI ? function (L) { return L.toLowerCase() + ')'; } : function (L) { return L + '.'; };
  var rows = perm.map(function (L, i) { return { disp: APP.LETTERS[i], o: q.options[U_letterIndex(L)] }; });
  var failing = rows.filter(function (r) {
    return LX_segments(r.o.vi).some(LX_needsImage);
  });
  if (failing.length && rows.every(function (r) { return !/```/.test(r.o.vi); })) {
    res.imageLatex = LX_rowsLatex(rows.map(function (r) { return { label: prefix(r.disp), text: r.o.vi }; }));
    res.labels = rows.map(function (r) { return prefix(r.disp); });
  } else {
    res.labels = rows.map(function (r) {
      var t = LX_forForm(r.o.vi, imgs).text;
      if (ctx.bilingual && r.o.en) t += ' / ' + LX_forForm(r.o.en, imgs).text;
      return prefix(r.disp) + ' ' + t;
    });
  }
  if (q.dang === DANG.GHEP_NOI) {
    res.nRight = q.right.length;
    res.rightText = 'Cột phải / Right column:\n' + q.right.map(function (r, i) {
      var t = LX_forForm(r.vi, imgs).text;
      if (ctx.bilingual && r.en) t += ' / ' + LX_forForm(r.en, imgs).text;
      return (i + 1) + '. ' + t;
    }).join('\n');
  }
  return res;
}

function FX_ph(s) { return String(s).replace(/\[CT(\d+)\]/g, '(hình $1)'); }

function FX_addQuestion(ctx, it, q) {
  var form = ctx.form, stt = it.STT, imgs = [];
  var vi = FX_ph(LX_forForm(q.vi, imgs).text);
  var en = ctx.bilingual && q.en ? FX_ph(LX_forForm(q.en, imgs).text) : '';
  var opt = FX_options(ctx, it, q, imgs);
  var media = [];
  q.hinh.forEach(function (ref) { media.push({ kind: 'img', ref: ref }); });
  if (q.latex) media.push({ kind: 'latex', latex: q.latex });
  imgs.forEach(function (lt, i) { media.push(FX_imgMedia(lt, 'Hình ' + (i + 1))); });
  if (opt.imageLatex) media.push({ kind: 'latex', latex: opt.imageLatex, label: 'Các phương án / Options' });
  if (q.video) media.push({ kind: 'video', url: q.video });
  var parts = FX_titleHelp('Câu ' + stt + '. ', vi, en);
  var extra = q.amThanh ? '🎧 Nghe / Listen: ' + q.amThanh : '';
  var qTitle, qHelp;
  if (media.length) {
    media.forEach(function (m, idx) {
      var t = idx === 0 ? parts.title : 'Câu ' + stt + (m.label ? ' — ' + m.label : '');
      var h = idx === 0 ? FX_join(parts.help, extra) : '';
      if (idx > 0 && m.label === undefined && m.kind !== 'video') t = '';
      FX_addMedia(ctx, m, t, h);
    });
    qTitle = '↳ Trả lời câu ' + stt + ' / Answer ' + stt;
    qHelp = opt.rightText;
  } else {
    qTitle = parts.title;
    qHelp = FX_join(parts.help, extra, opt.rightText);
  }
  var item;
  switch (q.dang) {
    case DANG.MOT_DA:
      item = form.addMultipleChoiceItem().setTitle(qTitle).setChoiceValues(opt.labels);
      break;
    case DANG.NHIEU_DA:
      item = form.addCheckboxItem().setTitle(qTitle).setChoiceValues(opt.labels);
      break;
    case DANG.DUNG_SAI:
      item = form.addGridItem().setTitle(qTitle).setRows(opt.labels).setColumns([GR_TRUE_LABEL, GR_FALSE_LABEL]);
      break;
    case DANG.GHEP_NOI:
      var cols = [];
      for (var i = 1; i <= opt.nRight; i++) cols.push(String(i));
      item = form.addGridItem().setTitle(qTitle).setRows(opt.labels).setColumns(cols);
      break;
    case DANG.TRA_LOI_NGAN:
      item = form.addTextItem().setTitle(qTitle);
      break;
    default:
      throw new Error('Dạng câu không hỗ trợ: ' + q.dang);
  }
  if (qHelp) item.setHelpText(qHelp);
  item.setRequired(ctx.required);
  return item;
}

function FX_addGroup(ctx, g, secItems) {
  var members = secItems.filter(function (x) { return U_str(x.MaNhom) === g.id; });
  var a = members[0].STT, b = members[members.length - 1].STT;
  var imgs = [];
  var vi = FX_ph(LX_forForm(g.vi, imgs).text);
  var en = ctx.bilingual && g.en ? FX_ph(LX_forForm(g.en, imgs).text) : '';
  ctx.form.addSectionHeaderItem()
    .setTitle('Dùng thông tin sau để trả lời câu ' + a + (b !== a ? '–' + b : '') + ' / Use the following for questions ' + a + (b !== a ? '–' + b : ''))
    .setHelpText(FX_join(vi, en, g.amThanh ? '🎧 Nghe / Listen: ' + g.amThanh : ''));
  g.hinh.forEach(function (ref) { FX_addMedia(ctx, { kind: 'img', ref: ref }, '', ''); });
  if (g.latex) FX_addMedia(ctx, { kind: 'latex', latex: g.latex }, '', '');
  imgs.forEach(function (lt, i) { FX_addMedia(ctx, FX_imgMedia(lt), 'Hình ' + (i + 1), ''); });
  if (g.video) FX_addMedia(ctx, { kind: 'video', url: g.video }, '', '');
}

/** imgs[] chứa công thức LaTeX hoặc khối code (đánh dấu bằng LX_CODE_TAG) → mô tả media */
function FX_imgMedia(lt, label) {
  if (String(lt).indexOf(LX_CODE_TAG) === 0) {
    var code = String(lt).substring(LX_CODE_TAG.length);
    return { kind: 'latex', latex: LX_codeLatex(code), code: code, label: label };
  }
  return { kind: 'latex', latex: lt, label: label };
}

function FX_isYouTube(url) { return /(youtube\.com|youtu\.be)\//i.test(U_str(url)); }

function FX_addMedia(ctx, m, title, help) {
  try {
    if (m.kind === 'video') {
      if (!FX_isYouTube(m.url)) throw new Error('Google Form chỉ nhúng được video YouTube');
      var v = ctx.form.addVideoItem().setVideoUrl(m.url);
      if (title) v.setTitle(title);
      if (help) v.setHelpText(help);
      return true;
    }
    var blob = m.kind === 'latex' ? FX_latexBlob(m.latex, ctx.cfg) : FX_blobFromRef(m.ref);
    var img = ctx.form.addImageItem().setImage(blob);
    if (title) img.setTitle(title);
    if (help) img.setHelpText(help);
    FX_try(function () { img.setAlignment(FormApp.Alignment.LEFT); });
    return true;
  } catch (e) {
    var what = m.code ? 'code' : m.kind === 'latex' ? 'công thức' : (m.kind === 'video' ? 'video' : 'hình');
    ctx.warnings.push('Không chèn được ' + what + ' (' + (m.ref || m.url || m.latex) + '): ' + e.message);
    var fallback = m.code ? 'Code:\n' + m.code : m.kind === 'latex' ? 'Công thức (LaTeX): ' + m.latex : (m.kind === 'video' ? 'Video: ' + m.url : '[Không tải được hình]');
    ctx.form.addSectionHeaderItem().setTitle(title || ' ').setHelpText(FX_join(help, fallback));
    return false;
  }
}

/** Ảnh PNG cho công thức, lưu đệm trên Drive theo mã băm */
function FX_latexBlob(latex, cfg) {
  var dpi = U_num(cfg.LATEX_DPI, 160);
  var name = 'ct_' + U_hash32(dpi + '|' + latex).toString(16) + '_' + latex.length + '.png';
  var folder = S_latexFolder();
  var found = folder.getFilesByName(name);
  if (found.hasNext()) return found.next().getBlob();
  var url = LX_imageUrl(latex, dpi, U_str(cfg.LATEX_URL) || undefined);
  var res = UrlFetchApp.fetch(url, { muteHttpExceptions: true, followRedirects: true });
  if (res.getResponseCode() !== 200) throw new Error('Dịch vụ LaTeX trả mã ' + res.getResponseCode());
  var blob = res.getBlob();
  if (!/^image\//.test(blob.getContentType() || '')) throw new Error('Dịch vụ LaTeX không trả về ảnh (công thức có lỗi cú pháp?)');
  blob.setName(name);
  folder.createFile(blob);
  return blob;
}

function FX_driveId(ref) {
  var s = U_str(ref), m;
  if ((m = s.match(/\/d\/([-\w]{20,})/))) return m[1];
  if ((m = s.match(/[?&]id=([-\w]{20,})/))) return m[1];
  if (/^[-\w]{25,}$/.test(s)) return s;
  return '';
}

function FX_blobFromRef(ref) {
  var id = FX_driveId(ref);
  if (id) return DriveApp.getFileById(id).getBlob();
  if (/^https?:\/\//i.test(U_str(ref))) {
    var r = UrlFetchApp.fetch(U_str(ref), { muteHttpExceptions: true, followRedirects: true });
    if (r.getResponseCode() !== 200) throw new Error('Tải ảnh lỗi mã ' + r.getResponseCode());
    return r.getBlob();
  }
  throw new Error('Không nhận ra ID/đường dẫn ảnh');
}

/** Mẫu regex không phân biệt hoa/thường cho SBD */
function FX_ciPattern(s) {
  return Array.from(U_str(s)).map(function (c) {
    var up = c.toUpperCase(), lo = c.toLowerCase();
    if (up !== lo) return '[' + up + lo + ']';
    return U_escapeRegex(c);
  }).join('');
}

function FX_applySbdValidation(textItem, sbds) {
  if (!sbds.length) { FX_try(function () { textItem.clearValidation(); }); return; }
  var pattern = '^\\s*(' + sbds.map(FX_ciPattern).join('|') + ')\\s*$';
  var v = FormApp.createTextValidation()
    .setHelpText('SBD không thuộc danh sách của mã đề này — kiểm tra lại hoặc báo giám thị. / Student ID not registered for this paper.')
    .requireTextMatchesPattern(pattern).build();
  textItem.setValidation(v);
}

/* ======================= 31_ExamControl.gs ======================= */
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

/* ======================= 32_Grading.gs ======================= */
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

/* ======================= 40_WebApp.gs ======================= */
/**
 * 40_WebApp.gs — Menu trong Google Sheets, Web App (doGet) và cổng API cho giao diện
 */

function onOpen() {
  SpreadsheetApp.getUi().createMenu('🎓 Hệ thống thi')
    .addItem('Mở bảng điều khiển', 'UI_openDialog')
    .addItem('📝 Nhập câu hỏi nhanh', 'UI_openEditor')
    .addItem('Link Web App (mở ở tab riêng)', 'UI_webAppUrl')
    .addSeparator()
    .addItem('① Khởi tạo / sửa cấu trúc hệ thống', 'UI_setup')
    .addItem('② Tạo dữ liệu mẫu (môn DEMO, kỳ thi KT_DEMO)', 'UI_sample')
    .addItem('Tạo môn học mới…', 'UI_newSubject')
    .addToUi();
}

function UI_setup() {
  var r = Setup_init();
  SpreadsheetApp.getUi().alert('Đã khởi tạo.\n\nThư mục dữ liệu trên Drive:\n' + r.folderUrl +
    '\n\nTiếp theo: menu 🎓 Hệ thống thi › Mở bảng điều khiển.');
}

function UI_sample() {
  var r = Setup_sample();
  SpreadsheetApp.getUi().alert('Đã tạo dữ liệu mẫu.\nNgân hàng môn DEMO: ' + r.bankUrl +
    '\n\nMở bảng điều khiển › Kỳ thi › chọn KT_DEMO › Sinh đề nháp để chạy thử.');
}

function UI_newSubject() {
  var ui = SpreadsheetApp.getUi();
  var a = ui.prompt('Tạo môn mới', 'Nhập: MÃ_MÔN | Tên môn   (ví dụ: ML | Học máy cơ bản)', ui.ButtonSet.OK_CANCEL);
  if (a.getSelectedButton() !== ui.Button.OK) return;
  var parts = a.getResponseText().split('|');
  var r = Setup_createSubject(parts[0], (parts[1] || '').trim());
  ui.alert('Đã tạo file ngân hàng môn ' + r.maMon + ':\n' + r.url);
}

function UI_html() {
  var t = HtmlService.createTemplateFromFile('Index');
  t.appName = APP.NAME;
  t.version = APP.VERSION;
  return t.evaluate().setTitle(APP.NAME).addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

function UI_openDialog() {
  SpreadsheetApp.getUi().showModalDialog(UI_html().setWidth(1500).setHeight(900), APP.NAME);
}

function UI_webAppUrl() {
  var url = '';
  try { url = ScriptApp.getService().getUrl(); } catch (e) { }
  SpreadsheetApp.getUi().alert(url ? 'Link Web App:\n' + url :
    'Chưa triển khai Web App.\nTrong trình soạn Apps Script: Triển khai › Tùy chọn triển khai mới › Loại: Ứng dụng web › ' +
    'Thực thi với tư cách: Tôi › Người có quyền truy cập: Chỉ mình tôi.');
}

/** Web App: /exec → bảng điều khiển ; /exec?p=nhap&mon=AIG → trình nhập câu hỏi nhanh */
function doGet(e) {
  var p = (e && e.parameter) || {};
  if (p.p === 'nhap') return UI_editorHtml(p.mon || '');
  return UI_html();
}

/** Bảng định tuyến API — giao diện gọi google.script.run.API_call(tên, [tham số]) */
var API_ROUTES = {
  state: function () {
    var ready = S_isReady();
    var out = { ready: ready, app: APP.NAME, version: APP.VERSION };
    if (!ready) return out;
    var hub = S_hub();
    out.hubUrl = hub.getUrl();
    try { out.folderUrl = S_rootFolder().getUrl(); } catch (e) { }
    out.subjects = Repo_subjects();
    out.matrices = Repo_matrixList();
    out.exams = ES_examList();
    out.levels = Repo_levels();
    out.dangs = Object.keys(DANG).map(function (k) { return { code: k, name: DANG_TEN[k] }; });
    out.config = Repo_config();
    return out;
  },
  setup: function () { return Setup_init(); },
  sample: function () { return Setup_sample(); },
  createSubject: function (ma, ten) { return Setup_createSubject(ma, ten); },
  bank: function (maMon) {
    Repo_clearCache();
    var b = Repo_bank(maMon);
    var qs = Object.keys(b.questions).map(function (id) {
      var q = b.questions[id];
      return { id: id, maChuDe: q.maChuDe, mucDo: q.mucDo, dang: q.dang, maNhom: q.maNhom, vi: q.vi, en: q.en, latex: q.latex,
        hinh: q.hinh.length, video: q.video, amThanh: q.amThanh, options: q.options, right: q.right, dapAn: q.keyRaw,
        active: q.active, valid: q.valid, loiGiai: q.loiGiaiVi, fixed: q.shuffle.noShuffle ? 'TAT_CA' : q.shuffle.fixed.join(','), row: q.row };
    });
    var groups = Object.keys(b.groups).map(function (k) { var g = b.groups[k]; return { id: g.id, vi: g.vi, en: g.en, latex: g.latex, children: g.children }; });
    return { subject: b.subject, questions: qs, groups: groups, topics: b.topics, issues: b.issues, summary: Bank_summary(b),
      units: b.units.length, levels: b.levels };
  },
  matrix: function (id) { return ES_matrixRaw(id); },
  saveMatrix: function (id, maMon, ten, sections, cells) { return ES_saveMatrix(id, maMon, ten, sections, cells); },
  checkMatrix: function (id, maMon, n, cheDo) { return ES_checkMatrix(id, maMon, n, cheDo); },
  saveExam: function (o) { return ES_saveExam(o); },
  generate: function (ma) { return ES_generate(ma); },
  variants: function (ma) { return ES_variants(ma); },
  swap: function (ma, md, ch) { return ES_swap(ma, md, ch); },
  lock: function (ma, md, ch, v) { return ES_lock(ma, md, ch, v); },
  finalize: function (ma) { return ES_finalize(ma); },
  unfinalize: function (ma) { return ES_unfinalize(ma); },
  students: function (ma) { return EC_students(ma); },
  importStudents: function (ma, text, mode) { return EC_importStudents(ma, text, mode); },
  assign: function (ma, method) { return EC_assign(ma, method); },
  exportVariant: function (ma, md, force) { return FX_exportVariant(ma, md, force); },
  open: function (ma) { return EC_open(ma); },
  close: function (ma) { return EC_close(ma, false); },
  scheduleClose: function (ma, dt) { return EC_scheduleClose(ma, dt); },
  monitor: function (ma) { return EC_monitor(ma); },
  collect: function (ma, md) { return GR_collectVariant(ma, md); },
  regrade: function (ma) { return GR_regradeStored(ma); },
  compile: function (ma) { return GR_compile(ma); },
  report: function (ma) { return GR_report(ma); },
  addReview: function (ma, ch, act, val, why) { return GR_addReview(ma, ch, act, val, why); },
  toggleReview: function (ma, idx, on) { return GR_toggleReview(ma, idx, on); },
  // ---- trình nhập câu hỏi nhanh ----
  /** Từ bảng điều khiển: trong Sheets thì mở hộp thoại nhập; ở Web App thì trả link ?p=nhap */
  openEditor: function (maMon) {
    try { SpreadsheetApp.getUi(); } catch (e) {
      return { url: UI_safeUrl() + '?p=nhap&mon=' + encodeURIComponent(U_upper(maMon || '')) };
    }
    SpreadsheetApp.getUi().showModelessDialog(UI_editorHtml(maMon).setWidth(1480).setHeight(900), '📝 Nhập câu hỏi nhanh');
    return { opened: true };
  },
  subjects: function () { return { subjects: Repo_subjects(), webUrl: UI_safeUrl() }; },
  beInit: function (maMon) { return BE_init(maMon); },
  beSave: function (maMon, rec, origId) { return BE_save(maMon, rec, origId); },
  beSaveMany: function (maMon, recs) { return BE_saveMany(maMon, recs); },
  beStatus: function (maMon, id, st) { return BE_setStatus(maMon, id, st); },
  beDelete: function (maMon, id) { return BE_delete(maMon, id); },
  beGroup: function (maMon, g) { return BE_saveGroup(maMon, g); },
  beUpload: function (maMon, b64, mime, name) { return BE_uploadImage(maMon, b64, mime, name); },
  beTranslate: function (texts, from, to) { return BE_translate(texts, from, to); },
  beProgress: function (maMon, mt, n) { return BE_progress(maMon, mt, n); },
  // ---- phòng thi web ----
  ptState: function (ma) { return PTA_state(ma); },
  ptSetup: function () { return PTA_setupRoom(); },
  ptSetUrl: function (url) { return PTA_setUrl(url); },
  ptPublish: function (ma, o) { return PTA_publish(ma, o); },
  ptSettings: function (ma, o) { return PTA_saveSettings(ma, o); },
  ptOpen: function (ma, force) { return PTA_open(ma, force); },
  ptPush: function () { return PTA_pushCode(null, true); },
  ptPing: function () { return PTA_ping(true); },
  ptBoot: function () { return PTA_bootSource(); },
  ptClose: function (ma) { var r = PTA_close(ma); PTA_signal(ma, null); return r; },
  ptMonitor: function (ma) { return PTA_monitor(ma); },
  ptCommand: function (ma, sbds, cmd, v) { var r = PTA_command(ma, sbds, cmd, v); PTA_signal(ma, sbds); return r; },
  ptReset: function (ma, sbds, nc) { var r = PTA_reset(ma, sbds, nc); PTA_signal(ma, sbds); return r; },
  ptContinue: function (ma, sbds, m) { var r = PTA_continue(ma, sbds, m); PTA_signal(ma, sbds); return r; },
  ptResetExam: function (ma, nc) { var r = PTA_resetExam(ma, nc); PTA_signal(ma, null); return r; },
  ptBan: function (ma, sbds, why) { var r = PTA_ban(ma, sbds, why); PTA_signal(ma, sbds); return r; },
  ptUnban: function (ma, sbds, mode, o) { var r = PTA_unban(ma, sbds, mode, o); PTA_signal(ma, sbds); return r; },
  ptSebRef: function (ma, sbd) { return PTA_sebRef(ma, sbd || ''); },
  ptAppGroups: function () { return PTA_appGroups(); },
  ptPersonal: function (ma, sbds, kieu, nc) { var r = PTA_personal(ma, sbds, kieu === 'MOI' ? 'MOI' : 'TRON', !!nc); PTA_signal(ma, sbds); return r; },
  ptPause: function (ma, sbds, on) { var r = PTA_pause(ma, sbds, on); PTA_signal(ma, sbds); return r; },
  ptCloseIn: function (ma, m, o) { var r = PTA_closeIn(ma, m, o); PTA_signal(ma, null); return r; },
  ptUnlockCode: function (ma, renew) { return PTA_unlockCode(ma, !!renew); },
  ptBrand: function (o) { return PTA_brand(o || null); },
  ptSyncStudents: function (ma) { return PTA_syncStudents(ma); },
  ptCancelClose: function (ma) { var r = PTA_cancelClose(ma); PTA_signal(ma, null); return r; },
  ptPeek: function (ma, sbd) { return PTA_peek(ma, sbd); },
  ptThu: function (ma, o) { return PTA_preview(ma, o || {}); },
  ptThuEnd: function (ma) { return PTA_previewEnd(ma); },
  ptThuPeek: function (ma) { return PTA_previewPeek(ma); },
  ptCheck: function (ma) { return PTA_check(ma); },
  ptEvents: function (ma, sbd) { return PTA_events(ma, sbd); },
  ptCollect: function (ma) { return PTA_collect(ma); },
  // ---- lập trình
  ltList: function () { return LT_list(); },
  ltGet: function (ma) { return LT_get(ma); },
  ltSave: function (o) { return LT_save(o); },
  ltDelete: function (ma) { return LT_delete(ma); },
  ltCopy: function (ma) { return LT_copy(ma); },
  ltSample: function () { return LT_loadSample(); },
  ltJudge: function () { return LT_judgeView(); },
  ltSetJudge: function (o) { return LT_setJudge(o || {}); },
  ltTestJudge: function () { return LT_testJudge(); },
  ltValidate: function (ma, fill) { return LT_validate(ma, fill || ''); },
  ltTry: function (ma, lang, code, custom) { return LT_tryCode(ma, lang, code, custom); },
  ltImpPreview: function (txt) { return LT_importPreview(txt); },
  ltImport: function (txt, o) { return LT_import(txt, o || {}); },
  ltExport: function (mas) { return LT_exportText(mas || []); },
  ltTestFiles: function (files) { return LT_testFiles(files || []); },
  ltGenTests: function (lang, code, n) { return LT_genTests(lang, code, n); },
  ltExamGet: function (ma) { return LT_examGet(ma); },
  ltExamSave: function (ma, o) { return LT_examSave(ma, o || {}); },
  ltReport: function (ma) { return LT_report(ma); },
  ltHistory: function (ma, sbd) { return LT_history(ma, sbd); },
  // ---- dọn dẹp & sao lưu
  sysStats: function () { return DD_stats(); },
  sysCleanLogs: function (o) { return DD_cleanLogs(o || {}); },
  sysCleanAutosave: function (o) { return DD_cleanAutosave(o || {}); },
  sysCompact: function () { return DD_compact(); },
  sysArchive: function (ma, o) { return DD_archiveExam(ma, o || {}); },
  sysBackup: function () { return DD_backup(); },
  sysAutoGet: function () { return DD_autoGet(); },
  sysAutoSet: function (o) { return DD_autoSet(o || {}); },
  sysAutoRun: function () { return DD_autoTick(); },
  ltBoard: function (ma) { return LT_board(ma); },
  ptManual: function (ma, sbd, text, dry) { return PTA_manual(ma, sbd, text, dry); },
  ptSeb: function (ma, o) { return PTA_seb(ma, o); },
  ptCards: function (ma) { return PTA_cards(ma); },
  printData: function (ma, md) { return PTA_printData(ma, md); },
  pdf: function (ma, md, kind) { return PTA_pdf(ma, md, kind); }
};

/**
 * Chỉ chủ hệ thống (hoặc email trong CauHinh!QUAN_TRI_EMAIL) mới gọi được API quản trị.
 * Khách ẩn danh (Session.getActiveUser rỗng) bị chặn — phòng khi Web App quản trị bị triển khai nhầm "Bất kỳ ai".
 */
function API_isAdmin() {
  var a = '', e = '';
  try { a = Session.getActiveUser().getEmail() || ''; } catch (x) { }
  try { e = Session.getEffectiveUser().getEmail() || ''; } catch (x) { }
  if (!a) return false;
  if (a === e) return true;
  var extra = '';
  try { extra = U_str(Repo_config().QUAN_TRI_EMAIL); } catch (x) { }
  return U_splitList(extra).map(function (x) { return x.toLowerCase(); }).indexOf(a.toLowerCase()) >= 0;
}

function UI_safeUrl() { try { return ScriptApp.getService().getUrl() || ''; } catch (e) { return ''; } }

function API_call(name, args) {
  try {
    var fn = API_ROUTES[name];
    if (!fn) throw new Error('API không tồn tại: ' + name);
    if (!API_isAdmin()) throw new Error('Không có quyền quản trị. Hãy mở bằng tài khoản chủ hệ thống (Web App quản trị phải để "Chỉ mình tôi").');
    var data = fn.apply(null, args || []);
    return JSON.stringify({ ok: true, data: data === undefined ? null : data });
  } catch (e) {
    return JSON.stringify({ ok: false, error: (e && e.message) ? e.message : String(e) });
  }
}

function include(name) { return HtmlService.createHtmlOutputFromFile(name).getContent(); }

/* ======================= 50_PhongThi.gs ======================= */
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
