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
