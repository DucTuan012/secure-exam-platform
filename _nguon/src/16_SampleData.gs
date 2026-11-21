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
