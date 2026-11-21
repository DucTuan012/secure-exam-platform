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
