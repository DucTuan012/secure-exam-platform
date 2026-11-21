# 📘 CẨM NANG SỬ DỤNG — Hệ thống Ngân hàng đề & Phòng thi web (v1.7.9)

Cẩm nang dành cho **quản trị viên / giám thị** (Phần A–H) và **thí sinh** (Phần I — có thể in riêng phát cho thí sinh).
Mỗi tình huống đều ghi rõ: bấm nút nào, máy thí sinh thấy gì, sau bao lâu.

---

## Mục lục

- [Có gì mới ở v1.7 & cách cập nhật](#có-gì-mới-ở-v17--cách-cập-nhật)
- [0. Đọc trước — cập nhật lên v1.6 (bắt buộc, làm 1 lần)](#0-đọc-trước--cập-nhật-lên-v16-bắt-buộc-làm-1-lần)
- [A. Hệ thống gồm những gì](#a-hệ-thống-gồm-những-gì)
- [B. Cài đặt lần đầu](#b-cài-đặt-lần-đầu)
- [C. Chuẩn bị đề thi (tab ①–④)](#c-chuẩn-bị-đề-thi-tab-)
- [D. Tab ⑤ Phòng thi web — từng mục](#d-tab--phòng-thi-web--từng-mục)
- [E. Quy trình một buổi thi (bảng việc theo giờ)](#e-quy-trình-một-buổi-thi)
- [F. Điều khiển trong giờ thi — mọi tình huống](#f-điều-khiển-trong-giờ-thi--mọi-tình-huống)
- [G. Sau buổi thi: chấm, phúc khảo, dùng lại đề](#g-sau-buổi-thi-chấm-phúc-khảo-dùng-lại-đề)
- [H. Xử lý sự cố — tra cứu nhanh](#h-xử-lý-sự-cố--tra-cứu-nhanh)
- [M. Thi lập trình Python · C (tab ⑧)](#m-thi-lập-trình-python--c-tab-)
- [N. Dọn dẹp, lưu trữ & sao lưu (tab ⚙ Hệ thống)](#n-dọn-dẹp-lưu-trữ--sao-lưu-tab--hệ-thống)
- [I. HƯỚNG DẪN DÀNH CHO THÍ SINH](#i-hướng-dẫn-dành-cho-thí-sinh)
- [K. Giới hạn & mẹo vận hành](#k-giới-hạn--mẹo-vận-hành)
- [L. Câu hỏi thường gặp](#l-câu-hỏi-thường-gặp)

---

## Có gì mới ở v1.7 & cách cập nhật

**Mới ở v1.7.9:**
- **📥 Nhập nhanh bài lập trình** (tab ⑧): sao chép **prompt cho AI** → dán câu trả lời của AI (nhiều bài một lần) → xem bảng kiểm tra → **Nhập**.
  Hệ thống tự **sinh output còn thiếu** bằng lời giải mẫu và **▶ kiểm thử** từng bài. Mở được file .txt / .md / .json, kéo thả file vào ô.
- **⬇ Xuất** bài / cả ngân hàng ra file .txt cùng định dạng — sao lưu, chia sẻ giữa các trung tâm, sửa hàng loạt rồi nhập lại.
- Thẻ **2. Test cases**: **📦 Test từ file / ZIP** (kiểu Themis `Test01/BAI.INP`, `1.in/1.out`, `.inp/.out`, `.in/.ans`, `input01.txt/output01.txt`, Codeforces)
  và **🎲 Sinh test bằng code** (viết vài dòng sinh input ngẫu nhiên, output lấy từ lời giải mẫu). Xem M2b.

**Mới ở v1.7.8:**
- **👁 Thi thử như thí sinh** (tab ⑤, mục mới ngay trên *D. Điều hành*): bấm 1 nút là vào **đúng giao diện thi** — không cần SBD / mã truy cập, vào được cả khi phòng
  chưa mở hoặc đã đóng. Bài thử **không tính kết quả**, không hiện trên giám sát. Có **thanh thi thử** ngay trong trang thi (kể cả khi toàn màn hình / bị khoá):
  bật / tắt chống gian lận, xem *những gì thi thật sẽ ghi nhận*, 🔓 mở khoá tại chỗ, làm lại, đổi mã đề. Nộp code thấy được **dữ liệu cả test ẩn**.
  **📊 Chấm bài thử** ở trang quản trị cho điểm + đúng / sai từng câu bằng đúng bộ chấm thật. Xem mục D › *👁 Thi thử như thí sinh*.
- Sửa: màn khoá ở chế độ thường giờ ghi **đúng lý do** (chụp màn hình, tác tử AI, rời màn hình lúc tạm dừng…) thay vì luôn ghi "rời màn hình quá số lần".

**Mới ở v1.7.7:**
- **Chống tác tử AI làm bài hộ** chặt hơn: mỗi lần nghi đều ghi **mức độ** (*Chắc chắn / Nghi cao / Nghi*) kèm **lý do và bằng chứng cụ thể**; giám thị chọn
  cách xử lý ở ⑤ mục B › **Chống tác tử AI** (mặc định: *Khoá bài khi chắc chắn*). Khoá được ghi lên máy chủ — thí sinh tải lại trang vẫn bị khoá. Xem mục D › *🤖 Chống tác tử AI*.
- **Quy định thư viện được dùng** cho từng bài lập trình (tab ⑧ › trình soạn › thẻ 4): Python *mọi thư viện chuẩn / chỉ các thư viện liệt kê / không được import*,
  C *chỉ các header liệt kê*, và danh sách **hàm / lệnh không được dùng** (VD `sorted`, `eval`, `qsort`). Thí sinh thấy khung **📚 Thư viện được dùng** ngay trong đề;
  code vi phạm bị từ chối **trước khi chạy**, **không tính lượt nộp**. Xem M2 › *Thư viện được dùng*.
- **Giao diện thi lập trình**: kéo thanh ngăn **lên / xuống** giữa khung code và kết quả, kéo **trái / phải** giữa đề bài và code; nút **Ẩn đề bài**, **Tập trung code**
  (code chiếm gần cả màn hình), **Thu gọn / Mở rộng kết quả**. Trang nhớ cách chia của từng thí sinh. Xem I3b.

**Mới ở v1.7:**
- **Thi lập trình Python · C** (tab ⑧): soạn bài kiểu HackerRank (đề, test mẫu / test ẩn có trọng số, lời giải mẫu, code khởi tạo), **kiểm thử đề** bằng lời giải, sinh output tự động,
  gắn bài vào kỳ thi (chọn Python, C hoặc cả hai — thí sinh tự chọn), thí sinh **chạy thử / nộp code** ngay trong trang thi, chấm trên máy chấm thật,
  bảng xếp hạng trực tiếp, lịch sử nộp, phát hiện code giống nhau. Xem **mục M**.
- **Dọn dẹp & sao lưu** (tab ⚙ Hệ thống): xem dung lượng, dọn nhật ký, dọn bản tự lưu, thu gọn bảng tính, **lưu trữ & xoá kỳ thi cũ**, sao lưu 1 chạm,
  **bảo trì tự động hằng tuần**. Xem **mục N**.
- Giám sát (⑤): cột **</> điểm code · số lần nộp**; bảng điều khiển thí sinh có phần lập trình (code đang lưu, lịch sử nộp, xem code từng lần).
- Kiểm tra trước giờ thi: thêm các dòng về bài lập trình, máy chấm, bộ khởi động.
- Kỳ thi **chỉ có lập trình** (không trắc nghiệm): dùng ma trận `MT_CHI_LT`.

**Cập nhật (5 phút):**
1. Hệ thống chính: dán đè `HeThongThi.gs`, `Index.html`, `NhapCau.html` như mọi lần › 💾 Lưu › tải lại Sheets. Mã phòng thi **tự đẩy** sang, không phải dán.
2. **Chỉ khi dùng thi lập trình** — cập nhật Bộ khởi động phòng thi lên **v3** (bản v2 không có quyền gửi code tới máy chấm):
   - ⑤ › mục A › bước 2 › **📋 Sao chép Bộ khởi động** → mở `PhongThi_DuLieu` › Tiện ích mở rộng › Apps Script › xoá hết `Mã.gs`, dán › 💾 Lưu.
   - Ở thanh trên của trình soạn Apps Script chọn hàm **doGet** › **▶ Chạy** › Xem xét quyền › chọn tài khoản › Nâng cao › Đi tới… › **Cho phép**
     (quyền mới: *"Kết nối với dịch vụ bên ngoài"*). Báo lỗi sau khi chạy là bình thường.
   - **Triển khai › Quản lý triển khai › ✎ › Phiên bản: Phiên bản mới › Triển khai** (giữ nguyên link, không phải tạo lại file .seb).
   - ⑤ › mục A › bước 4 › **🔍 Kiểm tra kết nối** → *"Bộ khởi động v3"*.
   > Bộ khởi động v2 vẫn chạy tốt mọi kỳ thi trắc nghiệm. Hệ thống chỉ **chặn mở phòng** khi kỳ thi có bài lập trình mà phòng thi còn v2, và nói rõ phải làm gì.
3. Tab ⑧ › **🔍 Kiểm tra máy chấm** → phải thấy ✅ Python 3 và ✅ C (GCC).

---

## 0. Đọc trước — cập nhật lên v1.6 (bắt buộc, làm 1 lần)

### Vì sao trước đây "Làm lại từ đầu / Thi lại toàn bộ" mà thí sinh vẫn thấy bài cũ?

Ảnh chụp màn hình thí sinh bạn gửi là **giao diện của bản cũ**. Tức là dự án Apps Script của **phòng thi** (file `PhongThi_DuLieu`)
vẫn đang phục vụ mã cũ, dù hệ thống chính đã được cập nhật nhiều lần. Nguyên nhân: Web App của Google **chỉ chạy đúng "phiên bản" đã triển khai**;
dán mã mới rồi bấm Lưu thì **chưa đủ**, mà còn phải vào *Quản lý triển khai › ✎ › Phiên bản mới*. Nếu bước này bị sót
(hoặc lỡ bấm "Triển khai mới" làm đổi link, còn file `.seb` vẫn trỏ link cũ), mọi bản sửa lỗi làm lại chỉ nằm ở hệ thống chính, còn máy thí sinh vẫn chạy mã cũ.
Bạn **không thao tác sai** nút làm lại. Lỗi nằm ở chỗ quy trình cập nhật bắt bạn triển khai lại bằng tay, rất dễ sót.

**Từ v1.6 bỏ hẳn bước dễ sót đó:**
- Dự án phòng thi chỉ còn một **Bộ khởi động** nhỏ, **dán 1 lần duy nhất**.
- Mã phòng thi và trang thí sinh nằm trong hệ thống chính. Hệ thống **tự đẩy** chúng sang sheet `MaNguon` của file phòng thi
  mỗi khi bạn Phát đề / Mở phòng / Kiểm tra (hoặc bấm ⟳ Đẩy mã mới). Bộ khởi động nạp mã mới nhất từ sheet đó.
- **▶ MỞ PHÒNG THI** tự gọi thử link phòng thi. Nếu máy thí sinh sẽ chạy mã cũ thì **không cho mở** và nói rõ phải sửa gì.
- **Kiểm tra trước giờ thi** báo thêm: bộ khởi động, mã đang chạy, file .seb có trỏ đúng link không, có thí sinh nào vừa đăng nhập bằng mã cũ không.

### Các bước cập nhật (khoảng 5 phút)

1. **Hệ thống chính**: mở `HeThongThi_TrungTam` › Tiện ích mở rộng › Apps Script → dán đè `HeThongThi.gs` (vào Mã.gs), `Index.html`, `NhapCau.html` → 💾 Lưu.
   Nếu bạn mở bảng điều khiển bằng link Web App riêng: *Triển khai › Quản lý triển khai › ✎ › Phiên bản mới › Triển khai*. Tải lại trang Sheets (F5).
2. Bảng điều khiển › **⑤ Phòng thi web** › mục **A** › bước 1: bấm **Kiểm tra / sửa cấu trúc** (tạo sheet `MaNguon` và đẩy mã mới sang).
3. Mục A › bước 2: bấm **📋 Sao chép Bộ khởi động**. Hoặc mở file `PhongThi/PhongThi.gs` trong gói tải về.
4. Mở file **`PhongThi_DuLieu`** › Tiện ích mở rộng › Apps Script (dự án phòng thi):
   - Mở `Mã.gs`, **xoá hết** nội dung cũ, dán Bộ khởi động. **Xoá tệp `ThiSinh.html`** (bản mới không dùng nữa). 💾 Lưu.
   - *Triển khai › **Quản lý triển khai*** › chọn triển khai đang dùng › ✎ › Phiên bản: **Phiên bản mới** › **Triển khai**.
     ⚠ **Không** bấm "Triển khai mới", vì làm thế sẽ đổi link và các file .seb đã phát sẽ trỏ về mã cũ.
5. Quay lại mục A › bước 4: bấm **🔍 Kiểm tra kết nối**. Phải thấy dòng xanh:
   `✓ Bộ khởi động v2 · mã phòng thi v1.6.1 (mới nhất). Máy thí sinh sẽ chạy đúng mã mới.`
6. Mục D › **Kiểm tra ngay**. Nếu báo *"File .seb đang trỏ link KHÁC"*, vào mục C tạo lại file `.seb` và chép lại cho các máy thi.
7. Máy thí sinh đang mở trang thi từ trước: **tải lại trang** (nút ⟳ của SEB hoặc F5). Bài đã lưu không mất.

> **Từ nay:** mỗi lần nhận bản cập nhật, bạn chỉ làm **bước 1**. Mã phòng thi tự sang, không phải dán hay triển khai lại dự án phòng thi.
> Nếu sau này Bộ khởi động có phiên bản mới, mục A sẽ báo đỏ và hướng dẫn. Việc này rất hiếm.

---

## A. Hệ thống gồm những gì

| Thành phần | Ở đâu | Ai dùng | Ghi chú |
|---|---|---|---|
| `HeThongThi_TrungTam` (Google Sheets + Apps Script) | Drive của bạn | Chỉ quản trị | Bảng điều khiển 8 tab. Chứa **đáp án**: không chia sẻ cho ai |
| `NganHang_<MÔN>` | Thư mục `HeThongThi_DuLieu` | Quản trị | Ngân hàng câu hỏi từng môn |
| `PhongThi_DuLieu` (Sheets + dự án Apps Script riêng) | Thư mục `HeThongThi_DuLieu` | Máy chủ phòng thi | Gói đề **không có đáp án**, danh sách thí sinh, bài làm, nhật ký, mã nguồn phòng thi (`MaNguon`) |
| Link phòng thi `…/exec` | Web App "Bất kỳ ai" | Thí sinh | Mở bằng file `.seb` (khuyến nghị) hoặc trình duyệt |
| File `.seb` | Tải ở mục C | Máy thi | Mở Safe Exam Browser thẳng vào phòng thi |
| Máy chấm code (Wandbox / Judge0 / Piston) | Máy chủ ngoài | Phòng thi gọi tới | Chạy code Python / C của thí sinh. Chỉ nhận code + input của test, **không** nhận tên / SBD |
| Thư mục `SaoLuu`, `LuuTru` | Thư mục `HeThongThi_DuLieu` | Quản trị | Bản sao lưu các file; file lưu trữ kỳ thi cũ |

**Các tab của bảng điều khiển:** Tổng quan · ① Ngân hàng · ② Ma trận · ③ Kỳ thi & Sinh đề · ④ Thí sinh & Phân đề ·
**⑤ Phòng thi web** · ⑥ Thi bằng Google Form (cách cũ, vẫn dùng được) · ⑦ Chấm điểm & Phúc khảo · **⑧ Lập trình** · **⚙ Hệ thống** (dọn dẹp, lưu trữ, sao lưu).

**Vì sao có 2 dự án Apps Script?** Web App mở cho "Bất kỳ ai" thì trình duyệt gọi được mọi hàm công khai của dự án đó.
Dự án phòng thi chỉ có 2 hàm công khai và **không chứa đáp án**, nên thí sinh có cố gọi gì cũng không lấy được đáp án. Bảng điều khiển vẫn để "Chỉ mình tôi".

---

## B. Cài đặt lần đầu

> Nên dùng **Gmail cá nhân** làm chủ hệ thống. Tài khoản `.edu` thường bị quản trị trường chặn một số dịch vụ.

1. Drive › Mới › Google Trang tính, đặt tên `HeThongThi_TrungTam` › Tiện ích mở rộng › Apps Script:
   - `Mã.gs`: dán **HeThongThi.gs** · ＋ › HTML tên **Index**: dán **Index.html** · ＋ › HTML tên **NhapCau**: dán **NhapCau.html**.
   - (Khuyến nghị) ⚙ Cài đặt dự án › Hiện tệp `appsscript.json` › dán nội dung cùng tên (múi giờ Việt Nam). 💾 Lưu.
2. Tải lại Sheets › menu **🎓 Hệ thống thi › ① Khởi tạo** › cấp quyền (Nâng cao › Đi tới… › Cho phép).
3. (Tuỳ chọn) **② Tạo dữ liệu mẫu** để có kỳ thi `KT_DEMO` chạy thử.
4. **Mở bảng điều khiển** (menu). Muốn mở ở tab riêng: Triển khai › Ứng dụng web › Thực thi: Tôi · Truy cập: **Chỉ mình tôi**.
5. Tab **⑤ Phòng thi web** › mục A:
   - Bước 1 **Tạo file dữ liệu phòng thi**.
   - Bước 2 **📋 Sao chép Bộ khởi động** → mở `PhongThi_DuLieu` › Tiện ích mở rộng › Apps Script → dán vào `Mã.gs` › Lưu ›
     **Triển khai › Tùy chọn triển khai mới › Ứng dụng web** · Thực thi với tư cách: **Tôi** · Người có quyền truy cập: **Bất kỳ ai** › Triển khai › cấp quyền.
   - Bước 3: dán link `…/exec` › **Lưu link**.
   - Bước 4: **🔍 Kiểm tra kết nối** → phải ✓ xanh.

---

## C. Chuẩn bị đề thi (tab ①–④)

| Tab | Việc chính |
|---|---|
| ① Ngân hàng | Chọn môn › **Tải & kiểm tra ngân hàng**; **+ Tạo môn**; **📝 Nhập câu hỏi nhanh**: dán câu từ web, tự tách đáp án, công thức, ảnh, dịch, xem trước như trên đề, báo câu gần giống. Chi tiết: README mục 3a |
| ② Ma trận | Các phần (điểm, dạng câu) + các ô `Phần × Chương × Chủ đề × Mức độ × Dạng` → số câu hoặc tỉ lệ. **Kiểm tra** báo ô thiếu câu |
| ③ Kỳ thi & Sinh đề | Tạo kỳ thi (môn, ma trận, **thời gian làm bài**, số mã đề, chế độ A cùng câu trộn thứ tự / B khác câu cùng ma trận) › **⚙ Sinh đề nháp** › xem từng mã đề, **⇄ Đổi câu**, **🔒 Khoá** › **✔ Chốt đề**. **↺ Mở chốt** để sửa lại (khi chưa thi) |
| ④ Thí sinh & Phân đề | Dán danh sách `SBD · Họ tên · Lớp · Email` › **Thêm / cập nhật** hoặc **Thay toàn bộ** › **🎲 Phân ngẫu nhiên** / **Phân theo thứ tự**. Thêm thí sinh muộn: chỉ người mới được phân, người cũ giữ mã đề |

Công thức LaTeX `$…$`, `$$…$$`, đoạn code ```` ``` ````, ảnh, câu chùm, song ngữ đều hiển thị **đúng như soạn** trên phòng thi web (KaTeX, tô màu code).

---

## D. Tab ⑤ Phòng thi web — từng mục

### Mục A — Cài đặt phòng thi
Bốn bước (xem phần B). Thẻ xanh là xong, thẻ viền xanh dương là bước cần làm tiếp.

| Nút | Dùng khi |
|---|---|
| Kiểm tra / sửa cấu trúc | Sau mỗi lần cập nhật hệ thống, hoặc nghi file phòng thi bị sửa nhầm |
| 📋 Sao chép Bộ khởi động | Cài lần đầu, hoặc khi mục A báo Bộ khởi động cũ |
| 🔍 Kiểm tra kết nối | Bất cứ lúc nào: biết ngay máy thí sinh sẽ chạy mã nào |
| ⟳ Đẩy mã mới | Ép đẩy lại mã phòng thi (thường không cần, hệ thống tự làm) |

### Mục B — Phát đề & quy định phòng thi

| Thiết lập | Ý nghĩa |
|---|---|
| **Tính giờ** | *Riêng*: mỗi em tính giờ từ lúc bấm "Bắt đầu" (vào muộn vẫn đủ giờ). *Chung*: cả phòng tính từ lúc MỞ PHÒNG; máy tự vào bài khi mở |
| **Hẹn tự đóng phòng lúc** | Tới giờ này phòng tự đóng, máy tự nộp. Để trống = đóng bằng tay. Khi **mở lại** phòng mà giờ hẹn đã qua, hệ thống tự bỏ hẹn (có báo) |
| **Mã phòng** | Tuỳ chọn. Giám thị đọc to lúc bắt đầu, thí sinh phải nhập, chống làm bài từ nơi khác |
| **Đăng nhập lại** | *Cho phép*: đăng nhập máy khác thì máy cũ bị thay thế (có ghi nhật ký). *Cần giám thị cho phép*: phải chờ giám thị bấm ↺ Cho vào lại |
| **Khoá bài sau N lần rời màn hình** | 0 = không khoá. Đủ N lần thì bài bị khoá đến khi giám thị 🔓 mở |
| **Bắt buộc dùng SEB** | Chỉ SEB mở từ file .seb **của kỳ thi này** mới đăng nhập được |
| **Chống tác tử AI** | Cách xử lý khi trang thi phát hiện thao tác không phải của người (xem mục D › 🤖): *Khoá bài khi chắc chắn* (mặc định) · *Khoá bài khi có bất kỳ dấu hiệu* · *Chỉ báo cáo, không khoá* |
| **Tạo mã truy cập mới khi phát lại** | Mọi thí sinh nhận mã mới, phiếu cũ hết hiệu lực (phải in lại phiếu) |
| **Hướng dẫn riêng** | Hiện trong phòng chờ |

- **📤 Phát đề lên phòng thi**: đóng gói đề (không có đáp án) và danh sách thí sinh. Phát lại được nhiều lần; bài đã làm không mất.
- **💾 Lưu cài đặt**: đổi quy định giữa chừng, máy thí sinh nhận trong ≤ 10 giây.

### 🔒 Chế độ nghiêm ngặt (thi bằng link, không SEB)
Mục B › tích **🔒 Chế độ nghiêm ngặt** › 💾 Lưu cài đặt. Hệ thống tạo **mã mở khoá giám thị** (6 số, hiện cạnh ô tích và trên bảng giám sát; **Đổi mã** để tạo mã mới).
- Thí sinh phải bật **toàn màn hình** mới thấy đề. Trình duyệt không cho trang web chặn phím **Esc** (kể cả kiểu "giữ Esc" của Chrome — không dùng được trong trang Apps Script). Vì vậy khi thí sinh thoát toàn màn hình, đề bị **che ngay** và có **4 giây** để bấm quay lại: kịp thì chỉ ghi "lỡ tay" (tối đa 2 lần mỗi bài), quá 4 giây hoặc từ lần thứ 3 thì tính vi phạm (chế độ nghiêm ngặt: khoá bài).
- Máy nối **2 màn hình** hoặc cửa sổ bị thu nhỏ / chia đôi thì không làm bài được.
- Cửa sổ thi mất tập trung (Zalo, ứng dụng khác bật đè lên) thì **đề bị ẩn ngay**.
- **Một lần** thoát toàn màn hình / chuyển tab / mở ứng dụng khác là **khoá bài ngay**. Giám thị đến máy, gõ **mã mở khoá** (sai 5 lần thì chặn 10 phút), hoặc bấm 🔓 trên máy giám thị.
- Cột SEB trên bảng giám sát hiện **⛶ toàn MH** / **không toàn MH** / **2 màn hình** / **rời cửa sổ**.
- Máy dùng SEB thì chế độ này tự bỏ qua (SEB đã khoá máy).
- Giới hạn của trình duyệt (không vượt được): **không đóng được ứng dụng khác, không tắt được tiếng máy, không thấy điện thoại / máy thứ hai**. Thi quan trọng vẫn nên dùng SEB.
- Nếu trình duyệt không cho bật toàn màn hình (ví dụ một số trình duyệt / máy quản lý), trang chuyển sang yêu cầu **phóng to tối đa cửa sổ**.

### Nhận diện trên trang thi (tên, logo)
Khung **Nhận diện trên trang thi** (giữa mục B và C): nhập **tên câu lạc bộ**, **khẩu hiệu**, chọn **logo** (PNG/JPG/SVG; hệ thống tự thu nhỏ cho nhẹ),
xem trước bên phải › **💾 Lưu nhận diện** › **📤 Phát đề lên phòng thi** (hoặc mở lại phòng). Áp dụng cho mọi kỳ thi.
Màu trang thi **cố định xanh navy** (từ v1.7.1). Tên, khẩu hiệu, logo được **nhúng sẵn vào trang** ngay khi máy thí sinh mở link,
nên không còn cảnh mấy giây đầu hiện màu xanh lá rồi mới đổi. Không có logo thì trang dùng chữ viết tắt của tên CLB.

### Mục C — Safe Exam Browser & phiếu đăng nhập

| Tuỳ chọn | Ý nghĩa |
|---|---|
| Mật khẩu thoát SEB | Giám thị giữ. Thí sinh không tự thoát giữa giờ được. Sau khi nộp có nút "Thoát SEB" |
| Lọc địa chỉ web | Chỉ cho vào Google + KaTeX (chặn mọi trang khác) |
| macOS: hiện thanh menu | Cho thấy biểu tượng Wi-Fi, pin trên máy Mac (một số máy không hiện Wi-Fi nếu tắt) |

#### 🛡 Chặn ứng dụng — 4 lớp (khung "Chặn ứng dụng khi mở SEB")

| Lớp | Tuỳ chọn | Tác dụng |
|---|---|---|
| **1. Khoá máy** | luôn bật cho Windows · **macOS: bắt buộc Assessment Mode** (mặc định bật) | **Windows**: SEB chạy trên *màn hình làm việc riêng*. Không nhìn thấy, không chuyển sang được cửa sổ nào khác. Cửa sổ ứng dụng không được phép bị ẩn, không ẩn được thì bị đóng. **macOS** (10.15.4 trở lên): chế độ thi của Apple. Mọi ứng dụng khác **mất mạng** và không quay / chia sẻ được màn hình. Ứng dụng có quyền Trợ năng (điều khiển máy) bị đóng |
| **2. Buộc đóng** | **Buộc đóng ngay (không hỏi)** (mặc định bật) + 7 nhóm ứng dụng + ô **Chặn thêm** | Ứng dụng trong danh sách bị **đóng ngay** khi mở SEB, và bị đóng lại nếu mở ra trong giờ. 7 nhóm (khoảng 120 ứng dụng): trình duyệt khác (kể cả tab nghe nhạc, Meet trên web) · nhắn tin & gọi video · trợ lý AI · điều khiển từ xa & quay màn hình (UltraViewer, AnyDesk…) · **game** (Liên Minh, Valorant, Steam…) · **lập trình** (VS Code, Cursor, JetBrains, Terminal…) · nhạc & video. Bỏ tích nhóm nào thì nhóm đó không bị chặn |
| **3. Âm thanh** | 🔇 **Tự động** (mặc định) / Luôn tắt / Luôn giữ | *Tự động*: đề **không** có câu nghe thì **tắt tiếng** khi vào thi và ẩn nút âm lượng (tab / ứng dụng còn sót cũng im). Đề **có** câu nghe thì giữ tiếng, đặt âm lượng 60%, cho chỉnh âm lượng |
| **4. Kiểm tra cấu hình** | ⚙ Điều khiển 1 máy › **📌 Lấy cấu hình SEB làm chuẩn** | SEB tự tính một *mã cấu hình* từ file .seb. Lấy mã của 1 máy mở đúng file mới làm chuẩn. Từ đó máy nào có mã khác (file .seb bị sửa, file cũ, SEB quá cũ) **bị chặn đăng nhập** (cần bật "Bắt buộc dùng SEB"). Bảng giám sát: cột SEB hiện **SEB ✓** (khớp) / **SEB ⚠** (khác) |

**Cách dùng lớp 4 (2 phút, trước giờ thi):** tạo file .seb › mở trên **1 máy thi** › đăng nhập bằng 1 SBD bất kỳ ›
⚙ Điều khiển SBD đó › **📌 Lấy cấu hình SEB làm chuẩn**. Mỗi lần **tạo lại file .seb**, máy chuẩn tự bị bỏ, nên phải làm lại bước này.
Nếu máy không báo mã cấu hình (SEB cũ, hoặc SEB không cho đọc mã trong trang Google), nút sẽ báo lỗi. Khi đó lớp 4 không dùng được, 3 lớp còn lại vẫn chạy.

> ⚠ **Buộc đóng không hỏi**: tài liệu chưa lưu trong các ứng dụng đó sẽ **mất**. Dặn thí sinh lưu và đóng mọi thứ trước khi mở file .seb.
> Giám sát bằng Google Meet thì dùng điện thoại hoặc máy khác, vì trình duyệt trên máy thi bị đóng.
> **Không có cách nào "đóng 100% mọi tiến trình"** (máy cần tiến trình hệ thống để chạy Wi-Fi, âm thanh, bàn phím). Ba lớp đầu bảo đảm không ứng dụng nào khác **hiện lên, dùng mạng, phát tiếng** hay **quay màn hình** được.
> **Nên thử trước 1 máy Windows và 1 máy Mac:** mở sẵn Chrome đang phát nhạc, VS Code, Liên Minh, rồi bấm đúp file .seb. Ứng dụng nào còn sót thì thêm tên vào ô *Chặn thêm*
> (Windows: xem tên ở Task Manager › Chi tiết; macOS: Activity Monitor › chọn ứng dụng › ⓘ).
> Máy thi nên dùng SEB bản mới (Windows 3.4 trở lên, macOS 3.7 trở lên).

- **⬇ Tạo & tải file .seb**: chép file này vào máy thi, thí sinh bấm đúp để mở. **Đổi link phòng thi thì phải tạo lại file .seb.**
- **🖨 In phiếu đăng nhập**: mỗi thí sinh 1 phiếu (SBD, họ tên, **mã truy cập**, mã phòng). **📋 Sao chép SBD + mã**: dán vào Zalo / Excel cho giám thị.
- Trong SEB, các thao tác với **thanh công cụ của SEB** (Wi-Fi, pin, đồng hồ, nút tải lại…) **không tính là rời màn hình**, chỉ ghi nhật ký.

### 👁 Thi thử như thí sinh (dành cho giám thị / giáo viên)

Dùng để **xem trước đề đúng như thí sinh nhận** (đề, hình, công thức, bài lập trình), **tự kiểm tra đáp án**, và **thử hệ thống chống gian lận** — trước giờ thi hoặc sau khi đã đóng phòng.

1. Phát đề (mục B) như bình thường. Ở khung **👁 Thi thử như thí sinh**: chọn **Mã đề**, tích / bỏ tích **Bật chống gian lận như thi thật**, bấm **👁 Mở trang thi thử**.
   Một tab mới mở ra phòng chờ của tài khoản ảo **GV-THU — Giám thị (thi thử)**. Không cần SBD, mã truy cập, mã phòng; phòng đóng / chưa mở vẫn vào được.
2. **Thanh thi thử** (góc dưới trái, nổi trên mọi màn kể cả màn khoá / toàn màn hình):

   | Nút | Tác dụng |
   |---|---|
   | **Mã đề ▾** | Đổi sang mã đề khác (bài thử làm lại từ đầu) |
   | **🛡 Chống gian lận: TẮT / BẬT** | **TẮT**: xem đề thoải mái — không bắt toàn màn hình, không khoá, được bôi đen / sao chép, chuyển tab. **BẬT**: chạy y như thi thật (toàn màn hình, tính vi phạm, khoá bài, phát hiện tác tử AI, chế độ nghiêm ngặt nếu kỳ thi bật) |
   | **📋 Sẽ ghi nhận (n)** | Khi TẮT: danh sách những gì **thi thật sẽ bắt** (VD *"bấm phím chụp màn hình → thi thật bị chặn, tính vi phạm và KHOÁ BÀI"*) — để giáo viên hiểu hệ thống phản ứng thế nào mà không bị khoá |
   | **🔓 Mở khoá** | Hiện khi bài thử bị khoá — mở ngay tại chỗ, không cần mã |
   | **♻ Làm lại** · **✕ Thoát** · **«** | Xoá bài thử làm lại từ phòng chờ · về trang đăng nhập · thu gọn thanh |

3. Làm bài, chạy thử / nộp code như thí sinh. Khi thi thử, kết quả **Nộp code** hiện cả **input / output của test ẩn** (thí sinh thật không thấy) — tiện soát test sai.
4. Nộp bài → màn *Đã nộp bài thử*. Quay lại trang quản trị bấm **📊 Chấm bài thử**: điểm, đúng / sai từng câu (kèm đáp án đúng), điểm từng bài lập trình — chấm bằng **đúng bộ chấm thật**.
   Bấm được cả khi đang làm dở (chấm bản tự lưu mới nhất).

- Bài thử **không** hiện trên bảng giám sát, **không** vào kết quả / báo cáo, **không** nhận lệnh cả phòng (tạm dừng, thu bài, thông báo…).
- Link có **hạn 12 giờ**. Tạo link mới = link cũ hết hiệu lực + bài thử làm lại từ đầu. **✖ Huỷ link thi thử** xoá tài khoản thử ngay. **Phát lại đề** cũng xoá tài khoản thử.
- ⚠ Link mở được **toàn bộ đề** — không gửi cho thí sinh. Muốn thử trên máy phòng thi (SEB, toàn màn hình…) thì **📋 Sao chép link** sang máy đó.
- Không thể đăng nhập tài khoản **GV-THU** bằng ô SBD / mã truy cập — chỉ vào được bằng link.

### Mục D — Điều hành & giám sát

- **✅ Kiểm tra trước giờ thi › Kiểm tra ngay**: dòng ✔ là đạt, ⚠ là nên xem, ⛔ là phải sửa. Danh sách kiểm tra gồm:
  file phòng thi, link, **bộ khởi động & mã mới nhất**, đề đã phát, số thí sinh, thí sinh mới chưa phát, mã truy cập & mã đề, gói đề đủ, thời gian làm bài,
  giờ hẹn đóng, file .seb (có chưa, **trỏ đúng link** không), bắt buộc SEB, **lượt đăng nhập chạy mã cũ**, trạng thái phòng.
- **▶ MỞ PHÒNG THI / ■ ĐÓNG PHÒNG THI**, **⏸ Tạm dừng cả phòng / ▶ Tiếp tục cả phòng**, **⏏ Thu bài cả phòng**,
  **⏱ Hẹn đóng** sau N phút, **♻ Thi lại toàn bộ kỳ thi**, **📢 Thông báo cho cả phòng**, **+ Cộng phút (tất cả)**.
- **Bảng giám sát** (tự làm mới 10 giây): ô đếm theo trạng thái (bấm vào ô để lọc), ô tìm thí sinh, 🔔 Báo động (tiếng bíp + thông báo
  khi có câu hỏi mới, rời màn hình, mất kết nối, bị khoá; dòng tô vàng).
  Cột: SBD · Họ tên · Lớp · Mã đề · Mã truy cập · Trạng thái · Đã làm · Còn lại · Rời MH (bấm số để xem nhật ký) · SEB · Vào (số lần đăng nhập) · Tín hiệu (lần cuối máy liên lạc) · Thao tác.
- **Trạng thái thí sinh:** Chưa vào · Phòng chờ · Đang làm · Mất kết nối (không có tín hiệu quá 2,5 phút) · Bị khoá · ⏸ Tạm dừng · ⛔ Đình chỉ · Đã nộp.
  Có thẻ ⏳ bên cạnh nghĩa là lệnh đang chờ máy thí sinh nhận.
- **Chọn nhiều thí sinh** (ô vuông đầu dòng) rồi: 🔓 Mở khoá · ⏱ Cộng phút · ▶ Cho làm tiếp · ♻ Làm lại từ đầu · ⏸ Tạm dừng · ▶ Tiếp tục · 💬 Nhắn · ⛔ Đình chỉ · ⏏ Thu bài.
- **💬 Câu hỏi của thí sinh**: hiện ngay trên bảng, nút **Trả lời**.
- **📜 Nhật ký cả phòng**: mọi sự kiện theo thời gian.

**⚙ Điều khiển (bảng riêng từng thí sinh):** thông tin (mã đề, mã truy cập, còn lại, rời màn hình, số lần vào, SEB),
mọi nút thao tác, **ô nhắn riêng** (Enter để gửi), **bài đang làm** (đáp án từng câu, đúng/sai, điểm tạm tính, chỉ giám thị thấy), nhật ký riêng.

#### 🤖 Chống tác tử AI làm bài hộ (v1.7.7)

Tác tử AI (Codex, ChatGPT Agent / Atlas, Comet, Claude…) hoặc phần mềm điều khiển máy làm bài bằng cách **chụp màn hình rồi tự bấm / gõ**, hoặc
**điều khiển thẳng trình duyệt**. Trang thi theo dõi *cách* thao tác (không ghi nội dung gõ, không quay màn hình) và chấm 3 mức:

| Mức | Dấu hiệu (lý do hiện cho giám thị) | Vì sao tin được |
|---|---|---|
| **Chắc chắn** | Trình duyệt đang bị phần mềm tự động điều khiển (WebDriver / Playwright / Selenium / tác tử AI) | Trình duyệt tự khai báo cờ này |
| **Chắc chắn** | Có thao tác bấm / gõ do chương trình tạo ra, không phải chuột hay bàn phím thật | Trình duyệt đánh dấu sự kiện "không thật" |
| **Chắc chắn** | Đáp án / code thay đổi trong khi không có cú bấm chuột hay phím nào | Người thật không thể đổi đáp án mà không chạm chuột / phím |
| **Nghi cao** | Đáp án / nút được bấm mà không có cú nhấn chuột hay phím nào (cách tác tử điều khiển qua *trợ năng*) | Cú bấm không có nhấn – nhả |
| **Nghi cao** | Mỗi phím chỉ được giữ gần 0 mili-giây | Tay người giữ phím vài chục mili-giây |
| **Nghi cao** | Code dài hơn hẳn số phím thật sự gõ | Code được chèn vào bằng cách khác |
| **Nghi cao** | Con trỏ chuột nhảy thẳng tới chỗ bấm, không rê chuột | Người luôn rê chuột tới đích |
| **Nghi** | Bấm trúng chính giữa nút / đáp án gần như mọi lần | Máy tính toạ độ từ ảnh chụp màn hình |
| **Nghi** | Gõ phím nhanh và đều tăm tắp như máy | Nhịp gõ của người luôn lệch nhau |
| **Nghi** | Một đoạn code dài xuất hiện trong một lần gõ | Có thể do dán / chèn |
| **Nghi** | Có tiện ích trình duyệt chèn nội dung lạ vào trang thi | Tiện ích AI thường làm vậy |

Mỗi lần nghi kèm **bằng chứng đo được** (VD *"12/14 lần bấm không rê chuột, nhảy trung bình 380px"*, *"giữ phím trung vị 0 ms trên 40 phím"*).

- **Bảng giám sát**: nhãn **🤖 Chắc chắn / Nghi cao / Nghi · n** cạnh tên thí sinh (rê chuột xem lý do); thông báo đỏ nêu lý do đầu tiên.
  **⚙ Điều khiển** thí sinh có khung **🤖 Dấu hiệu tác tử AI** liệt kê từng lần: giờ, mức, lý do, bằng chứng. Nhật ký ghi *NGHI_AI*.
- **Cách xử lý** (⑤ mục B › *Chống tác tử AI*, đổi được giữa giờ bằng 💾 Lưu cài đặt):
  - *Khoá bài khi chắc chắn* (mặc định): mức **Chắc chắn** → khoá bài ngay; mức thấp hơn chỉ báo cho giám thị.
  - *Khoá bài khi có bất kỳ dấu hiệu*: dùng cho kỳ thi quan trọng — khoá cả khi chỉ *Nghi*. Có thể khoá oan người gõ rất nhanh / dùng phần mềm hỗ trợ, nên có giám thị trực để mở.
  - *Chỉ báo cáo, không khoá*: chỉ ghi lại và báo.
- Bài bị khoá được **ghi lên máy chủ** — tải lại trang, đổi máy vẫn khoá, đến khi giám thị **🔓 Mở khoá**. Khi mở khoá: tới máy kiểm tra, hỏi miệng thí sinh về bài / code.
- **Giới hạn thật:** thi bằng link không đọc được danh sách phần mềm trên máy. Tác tử tinh vi có thể bắt chước người (rê chuột, gõ chậm) và lọt qua.
  Chặn hẳn chỉ có **SEB** với nhóm cấm *"Tác tử AI điều khiển máy"* + *"Điều khiển từ xa"* — dùng SEB cho kỳ thi quan trọng.

### Mục E — Dự phòng: in đề & làm trên giấy
- **🖨 In đề + phiếu trả lời** (1 mã đề) · **🖨 In tất cả mã đề** · **🖨 In đáp án (giáo viên)**. Mở bản in A4 rồi Ctrl/⌘+P › Lưu dưới dạng PDF.
- **📄 Lưu PDF đề / đáp án lên Drive**: tạo sẵn Google Docs + PDF trong thư mục kỳ thi. **Nên làm trước buổi thi** vì việc này nặng.

---

## E. Quy trình một buổi thi

| Khi nào | Việc | Ghi chú |
|---|---|---|
| **Hôm trước** | ③ Chốt đề · ④ Phân mã đề · ⑤B **Phát đề** · **👁 Thi thử** từng mã đề (xem đề, nộp, **📊 Chấm bài thử** để soát đáp án) · ⑤C **Tạo file .seb** + **In phiếu đăng nhập** · ⑤E In / lưu PDF dự phòng | Chép file .seb vào các máy thi, mở thử 1 máy |
| **30 phút trước** | ⑤A **🔍 Kiểm tra kết nối** · ⑤D **Kiểm tra ngay** (sửa hết dòng ⛔) | Các máy thi tắt Meet / Zalo… (SEB cũng tự chặn) |
| **Đầu giờ** | Phát phiếu. Thí sinh mở .seb › nhập SBD + mã truy cập (+ mã phòng) › **phòng chờ**, đọc quy định, tích "Tôi cam kết" | Bảng giám sát: "Phòng chờ" tăng dần. Ai chưa vào thì xem cột Tín hiệu |
| **Bắt đầu** | **▶ MỞ PHÒNG THI** | Phòng chờ thấy nút "Bắt đầu làm bài" trong ≤ ~15 giây (tính giờ Chung: tự vào bài) |
| **Trong giờ** | Theo dõi bảng giám sát, trả lời câu hỏi, xử lý theo phần F | 🔔 Báo động bật sẵn |
| **15 / 5 / 1 phút cuối** | Máy thí sinh tự nhắc | Có thể **⏱ Hẹn đóng** sau N phút hoặc **+ Cộng phút** |
| **Hết giờ** | Máy tự nộp. Bấm **■ ĐÓNG PHÒNG THI** | Bài chưa nộp được lấy bản tự lưu mới nhất |
| **Chấm** | ⑦ **📥 Thu bài phòng thi web & chấm** | Bảng điểm + cảnh báo |

---

## F. Điều khiển trong giờ thi — mọi tình huống

> **Kiểm soát trong lúc tạm dừng / khoá / đình chỉ (từ v1.7.3):** đang **tạm dừng** mà thí sinh thoát toàn màn hình (quá 4 giây), chuyển tab hay sang cửa sổ khác ≥ 1 giây → **khoá bài** ngay (cả khi không bật chế độ nghiêm ngặt); tiếp tục rồi vẫn khoá đến khi giám thị 🔓 mở. Mở khoá xong thí sinh phải bật lại toàn màn hình mới thấy đề. Đang **bị đình chỉ** mà rời màn hình → ghi lại trên máy, khi giám thị cho thi tiếp nhật ký hiện *"⚠ … lúc bị đình chỉ"*.
> **Chụp màn hình:** trình duyệt không chặn được phím chụp của Windows / macOS. Hệ thống **che kín đề ngay khi chạm phím Windows** (Mac: Cmd+Shift) — Win+Shift+S, Win+PrtScn, Cmd+Shift+3/4/5 chỉ chụp được màn trắng; chạm phím rồi mở công cụ chụp, hoặc bấm PrintScreen → ghi *chụp màn hình* và **khoá bài**. Phím PrintScreen đơn trên Windows 11 có thể kịp chụp trước khi trang biết → vẫn bị ghi và khoá, nhưng ảnh có thể đã chụp được.
> **Tác tử AI / phần mềm điều khiển máy (Codex, ChatGPT Agent, UltraViewer, script…) — từ v1.7.6:** thi bằng link không chặn được phần mềm chạy trên máy, nhưng trang thi nhận ra thao tác "không phải người": trình duyệt bị công cụ tự động điều khiển, bấm/gõ giả lập, con trỏ nhảy thẳng tới chỗ bấm không rê chuột, gõ phím đều tăm tắp, chèn cả đoạn code một lần. Từ v1.7.7 mỗi lần nghi có **mức độ + lý do + bằng chứng**, và mặc định **khoá bài khi chắc chắn** (đổi ở ⑤ mục B › *Chống tác tử AI*) — xem mục D › 🤖. **Chặn hẳn: dùng SEB** với nhóm cấm *"Tác tử AI điều khiển máy"* (Codex, ChatGPT Atlas, Comet, Claude Code, Python, Node, AutoHotkey…) + *"Điều khiển từ xa"* (UltraViewer, AnyDesk, TeamViewer…).
> **Google Meet / chia sẻ màn hình:** trang web không phát hiện được việc máy đang bị chia sẻ màn hình. Chỉ **SEB** chặn được (SEB không cho chạy Meet / Zoom / Zalo). Thi bằng link: muốn mở Meet giữa giờ phải rời trang → bị ghi và (nghiêm ngặt) khoá; nhưng nếu đã chia sẻ **trước khi vào thi** thì không biết được — kiểm tra máy trước giờ thi hoặc dùng SEB.
> **Độ trễ (từ v1.7.4):** máy thí sinh hỏi "có lệnh mới cho em không?" mỗi 6–20 giây (phòng càng đông hỏi càng thưa để không quá tải Google) — lệnh thường tới trong **~5–15 giây**, kể cả tạm dừng, khoá, nhắn tin, cộng giờ, thu bài, đình chỉ. Nếu vẫn thấy chậm > 30 giây: xem mục *Lệnh tới chậm* ở phần Xử lý sự cố.
> Khi nhận lệnh, máy thí sinh **luôn hiện màn "Đang cập nhật…" khoảng 1,5 giây** (vòng xoay + thanh tiến trình, ví dụ
> *"Giám thị đang tạm dừng bài thi…"*, *"Giám thị đang gửi tin nhắn cho bạn…"*), rồi mới áp dụng thay đổi.
> Nhờ vậy thí sinh biết sắp có thay đổi, không nghĩ là máy bị treo. Khi máy chủ trả lời chậm, đầu trang có **thanh tải** chạy.

### F1. Bảng tình huống

| Tình huống | Bấm | Máy thí sinh thấy |
|---|---|---|
| Thí sinh hỏi (nút 💬 Hỏi giám thị) | Bảng "Câu hỏi của thí sinh" › **Trả lời**, hoặc ⚙ Điều khiển › ô nhắn | "Đang gửi tin nhắn…" → hộp **💬 Tin nhắn từ giám thị** |
| Nhắc riêng 1 em | ⚙ › ô nhắn / **💬 Nhắn riêng** | Như trên |
| Thông báo cả phòng | Mục D › **📢 Gửi** (Xoá thông báo để gỡ) | Dải thông báo 📢 trên đầu trang |
| Đề lỗi, cần cho thêm giờ | **+ Cộng phút** (tất cả) hoặc chọn thí sinh › ⏱ (số âm để bớt) | Đồng hồ tăng, có báo "Bạn được cộng thêm thời gian" |
| Mất điện / mất mạng cả phòng | **⏸ Tạm dừng cả phòng**, xong thì **▶ Tiếp tục cả phòng** | Màn ⏸ "Giám thị đã tạm dừng": đồng hồ đứng, không chọn được đáp án, rời màn hình không tính. Tiếp tục thì **bù đủ** thời gian đã dừng ("Hẹn tự đóng" cũng lùi tương ứng) |
| Sự cố 1 em (đau, đổi chỗ…) | ⚙ › **⏸ Tạm dừng** / **▶ Tiếp tục** | Như trên, chỉ máy đó |
| Bị khoá do rời màn hình nhiều lần | 🔓 trên dòng, hoặc ⚙ › **🔓 Mở khoá** | "Giám thị đang mở khoá…" → làm tiếp |
| Máy hỏng / hết pin, đổi sang máy khác | Thí sinh đăng nhập máy khác **cùng mã**. Nếu đặt "Cần giám thị cho phép": ⚙ › **↺ Cho vào lại máy khác** | Bài đã lưu được khôi phục, đồng hồ chạy tiếp (không bù thời gian máy hỏng; muốn bù thì cộng phút) |
| Nhập sai mã 8 lần, bị chặn | ⚙ › **↺ Cho vào lại** (bất kỳ thao tác nào của giám thị với em đó cũng gỡ chặn) | Đăng nhập được ngay, **giữ nguyên bài** |
| Lỡ nộp sớm / hết giờ oan / cần sửa tiếp | ⚙ › **▶ Cho làm tiếp** (đảm bảo còn ít nhất N phút) | Đăng nhập lại cùng mã, bài **giữ nguyên**, làm tiếp; lần nộp mới mới được tính |
| Cho làm lại từ đầu | ⚙ › **♻ Làm lại từ đầu** (tuỳ chọn cấp mã mới) | Đang làm bài: "Đang cập nhật bài thi…" → thông báo **đếm ngược 10 giây** → về trang đăng nhập → vào lại thấy **bài trắng**, đồng hồ tính lại |
| Nghi lộ đề / cần đề khác cho 1 em | ⚙ › **🔀 Đổi đề riêng** (cùng câu trộn lại, hoặc bộ câu MỚI theo ma trận) | Như "làm lại", nhưng **mã đề mới** (dạng `101-R1`) |
| Gian lận | ⚙ › **⛔ Đình chỉ** (ghi lý do) | "Đang cập nhật trạng thái…" → màn **⛔ Đình chỉ thi** + lý do, không đăng nhập lại được. Bài giữ làm bằng chứng, khi chấm **0 điểm** |
| Gỡ đình chỉ | **Gỡ cấm…** (dòng thí sinh hoặc ⚙) → chọn 1 trong 3 | Xem F2 |
| Thu bài 1 em / cả phòng | ⚙ › **⏏ Thu bài** / mục D **⏏ Thu bài cả phòng** | "Giám thị đang thu bài…" → tự nộp |
| Sắp hết giờ, muốn đóng gọn | **⏱ Hẹn đóng** sau N phút hoặc lúc HH:mm (xem F4) | Cả phòng nhận thông báo, đúng giờ máy tự nộp |
| Toàn bộ kỳ thi hỏng, thi lại | **♻ Thi lại toàn bộ kỳ thi** | Mọi máy đang mở: đếm ngược về đăng nhập. Phòng về "Chưa mở". Khi sẵn sàng, bấm ▶ MỞ |

### F2. So sánh các kiểu "cho thi lại"

| | ▶ Cho làm tiếp | ♻ Làm lại từ đầu | 🔀 Đổi đề riêng | ♻ Thi lại toàn bộ kỳ thi |
|---|---|---|---|---|
| Áp dụng cho | 1 / nhiều em | 1 / nhiều em / cả phòng | 1 / nhiều em | Mọi thí sinh |
| Câu trả lời | **Giữ nguyên** | **Xoá trắng** | **Xoá trắng** | **Xoá trắng** |
| Mã đề | Giữ | Giữ | **Mã đề mới** | Giữ |
| Đồng hồ | Chạy tiếp, tự cộng để còn ≥ N phút | Tính lại đủ giờ từ lúc em bấm Bắt đầu lượt mới (kể cả kỳ thi tính giờ Chung) | Như trái | Tính lại từ đầu (Chung: từ lúc mở lại phòng) |
| Mã truy cập | Giữ | Giữ hoặc cấp mới (tuỳ chọn) | Giữ hoặc cấp mới | Giữ hoặc cấp mới |
| Bài cũ | Bài nộp cũ thành bản lưu | Huỷ (vẫn lưu `HUY_…` để đối chiếu) | Huỷ | Huỷ |
| Điểm cũ trong bảng điểm | Bỏ, chờ lần nộp mới | Bỏ | Bỏ | Bỏ hết |
| Phòng thi | Đang đóng thì phải **▶ MỞ** lại | Như trái | Như trái | Về "Chưa mở" |
| Máy đang mở bài | Làm tiếp bình thường | Đang cập nhật → đếm ngược 10 s → đăng nhập | Như trái | Như trái |

**Gỡ đình chỉ** cho chọn 1 trong 3: *Làm tiếp bài đang dở* (= Cho làm tiếp) · *Làm lại từ đầu, cùng mã đề* · *Đổi đề riêng rồi làm lại*. Có thể cấp mã truy cập mới.

**Bảo đảm bài trắng:** khi làm lại / đổi đề / thi lại toàn bộ, máy chủ tạo **lượt thi mới**. Trang thí sinh xoá mọi bài cũ lưu trong trình duyệt,
dù thí sinh mở lại file .seb cũ, tải lại trang hay dùng mã cũ. Mọi kịch bản này đều được kiểm thử tự động trên Chrome thật (`test/ui_reset.test.js`).

### F4. Hẹn đóng & cộng giờ — quy tắc thời gian

**Hạn nộp của mỗi em** = mốc sớm hơn trong 2 mốc sau:
- **Giờ riêng** = lúc bắt đầu + thời gian làm bài + phút được cộng + thời gian tạm dừng.
- **Mốc hẹn đóng** (nếu có) + phần **vượt hẹn riêng** của em.

| Muốn | Bấm |
|---|---|
| Cả phòng dừng chậm nhất lúc X (ai hết giờ trước thì nộp trước) | Nhập phút hoặc giờ (`lúc`) › **⏱ Hẹn đóng** (không tích đồng bộ) |
| **Mọi em kết thúc ĐÚNG lúc X** (rút về hoặc kéo dài cho bằng nhau, VD sang lượt khác) | Tích **Đồng bộ mọi thí sinh về đúng mốc** › **⏱ Hẹn đóng** |
| 1 vài em cần thêm giờ, **vượt** cả giờ hẹn | Chọn em › **⏱ Cộng phút**: em đó được vượt mốc đúng số phút cộng, các em khác vẫn đóng đúng mốc (cột Còn lại hiện thẻ *⏱+N′ vượt hẹn*). **+ Cộng (tất cả)** thì cả phòng cùng vượt |
| Dời / đặt lại mốc | Bấm **⏱ Hẹn đóng** lần nữa với giờ mới. Mốc mới thay mốc cũ, phần vượt mốc cũ của từng em bị bỏ (cộng lại nếu cần) |
| Huỷ hẹn | **✖ Bỏ hẹn**: mọi em quay về giờ riêng (gồm cả phút đã cộng) |

- **▶ Cho làm tiếp** khi đang có hẹn: em đó tự được vượt mốc để còn đủ N phút. Hẹn của cả phòng giữ nguyên.
- **Tạm dừng riêng 1 em** khi đang có hẹn: lúc tiếp tục, mốc hẹn của em lùi đúng bằng thời gian dừng. **Tạm dừng cả phòng**: mốc hẹn chung lùi tương ứng.
- **♻ Thi lại toàn bộ** và **mở lại phòng khi mốc đã qua**: hẹn đóng tự bỏ.

### F3. Dùng lại đề cho 1 em sau khi kỳ thi đã đóng / đã chấm
1. ⚙ Điều khiển em đó › **♻ Làm lại từ đầu** (hoặc **▶ Cho làm tiếp** nếu chỉ cho sửa tiếp).
2. **▶ MỞ PHÒNG THI** (người đã nộp không vào lại được, nên chỉ em đó vào thi). Em đó có **đủ thời gian làm bài** tính từ lúc bắt đầu lại,
   kể cả kỳ thi tính giờ Chung. Giờ "Hẹn tự đóng" cũ đã qua thì tự được bỏ.
3. Em đó đăng nhập (mã cũ, hoặc mã mới nếu đã cấp) và làm bài. Xong thì **■ ĐÓNG** › ⑦ **↻ Chấm lại**.

### F5. Quên một thí sinh — thêm giữa giờ thi (không cần đóng phòng)
1. Tab ④ › dán dòng `SBD, Họ tên, Lớp, Email` › **Thêm / cập nhật**.
2. **🎲 Phân ngẫu nhiên** (hoặc theo thứ tự). Kỳ thi đã mở thì chỉ người mới được phân, người cũ giữ mã đề.
   Hệ thống **tự đưa ngay** thí sinh mới lên phòng thi và hiện **mã truy cập** của em đó. Phòng đang mở thì em vào thi được luôn; người đang làm bài không bị ảnh hưởng.
3. Nếu bước 2 báo lỗi, ở tab ⑤ › mục D bấm **➕ Đưa thí sinh mới lên phòng**. Báo *"mã đề chưa có trên phòng thi"* nghĩa là em được phân một mã đề chưa phát; khi đó ĐÓNG phòng rồi 📤 Phát đề lại.

> Không cần tạo lại danh sách hay phát lại đề. Bài của người khác không đổi.

---

## G. Sau buổi thi: chấm, phúc khảo, dùng lại đề

- ⑦ **📥 Thu bài phòng thi web & chấm**: lấy bài từ phòng thi, chấm, ra **bảng điểm**, phổ điểm, tỉ lệ đúng từng câu / chủ đề / lớp.
  Ưu tiên khi một thí sinh có nhiều bài: **bài giấy** > **bài nộp** > **bản tự lưu** > trống.
  Cảnh báo kèm theo: rời màn hình, nộp trễ, bị thu bài, đăng nhập nhiều lần, không dùng SEB, **bị đình chỉ (0 điểm)**.
- **Nhập bài làm trên giấy** (khi chuyển sang thi giấy, hoặc máy không nộp được): dạng `1A 2BD 3ĐSSĐ 4:2-1-3 5=3,14 6-`
  (`2BD` nhiều đáp án, `3ĐSSĐ` đúng/sai từng ý, `4:2-1-3` ghép nối, `5=3,14` trả lời ngắn, `6-` bỏ trống). Bấm **Kiểm tra** xem hệ thống hiểu đúng chưa › **Lưu & chấm**.
- **↻ Chấm lại**: tự thu bài web mới nhất và áp dụng phúc khảo. Dùng sau mỗi lần cho làm lại / làm tiếp / nhập giấy.
- **Phúc khảo** (+ Thêm điều chỉnh): Đổi đáp án · Chấp nhận thêm đáp án · Tặng điểm · Loại câu. Ghi theo **đáp án gốc trong ngân hàng**, hệ thống tự quy đổi cho từng mã đề.
- **Dùng lại cả đề cho đợt sau**: ♻ Thi lại toàn bộ kỳ thi (cùng đề). Hoặc tạo kỳ thi mới ở ③ để có đề mới.

---

## H. Xử lý sự cố — tra cứu nhanh

### H1. Thông báo thí sinh nhìn thấy

| Thí sinh thấy | Nguyên nhân | Giám thị làm |
|---|---|---|
| "Mã truy cập không đúng… Còn N lần thử" | Gõ sai, hoặc giám thị vừa cấp mã mới | Đọc lại mã trên phiếu / bảng giám sát |
| "Không tìm thấy Số báo danh trong kỳ thi đang mở" | Sai SBD, phòng thi đã **ĐÓNG**, hoặc em chưa có trên phòng thi | Kiểm tra SBD. ▶ MỞ phòng. Thí sinh mới: ④ thêm + phân, ⑤ Phát đề lại |
| "Nhập sai mã quá nhiều lần…" | Sai 8 lần trong 10 phút | ⚙ › **↺ Cho vào lại** (giữ bài) |
| "Mã phòng thi không đúng" | Sai / chưa nhập mã phòng | Đọc lại mã phòng |
| "Kỳ thi này bắt buộc làm bài trong Safe Exam Browser…" | Mở bằng trình duyệt thường, hoặc **file .seb cũ** của kỳ thi khác | Phát file .seb mới nhất (mục C) |
| "Cấu hình Safe Exam Browser của máy này KHÔNG khớp…" | Máy mở file .seb cũ / đã bị sửa, hoặc SEB quá cũ (lớp 4) | Phát file .seb mới nhất. Chắc chắn máy đúng thì chọn lại máy chuẩn (📌) |
| Mở .seb thì SEB báo phải đóng ứng dụng / tự đóng ứng dụng | Lớp 2 đang hoạt động | Bình thường. Lưu tài liệu trước khi mở SEB |
| "Bạn đã vào thi trước đó. Hãy báo giám thị…" | Chế độ "Cần giám thị cho phép" | ⚙ › ↺ Cho vào lại máy khác |
| "Phiên làm bài này đã được mở ở máy/cửa sổ khác" | Em đăng nhập ở máy / tab khác (tab cũ bị thay thế) | Bình thường nếu chính em đổi máy. Nếu không phải, xem nhật ký |
| "Bạn đã nộp bài lúc …" | Đã nộp | Cần sửa: ▶ Cho làm tiếp. Làm lại: ♻ |
| "Giám thị chưa mở đề" | Phòng chưa MỞ | ▶ MỞ PHÒNG THI |
| "Đã quá giờ nộp…" / "Kỳ thi đã đóng…" | Hết giờ / đã đóng. Bài tự lưu vẫn được tính | Cần thêm giờ: ▶ Cho làm tiếp |
| Màn "Phòng thi chưa sẵn sàng" | Bộ khởi động chưa có mã, hoặc file phòng thi lỗi | ⑤A › Kiểm tra / sửa cấu trúc › 🔍 Kiểm tra kết nối |
| "Máy chủ bận, thử lại lần …" | Nhiều người bấm cùng lúc. Trang tự thử lại | Chờ vài giây |
| "⚠ Mất kết nối tới máy chủ…" | Mạng chập chờn | Bảo em cứ làm tiếp, **không đóng cửa sổ**. Bài giữ trên máy, tự gửi lại khi có mạng |
| Màn hình hiện **chuỗi bài làm** khi nộp | Không nộp được (mất mạng lúc nộp) | Chép chuỗi đó › ⑦ Nhập bài làm trên giấy |

### H2. Sự cố phía quản trị

| Hiện tượng | Xử lý |
|---|---|
| Mở phòng báo "⛔ Chưa mở phòng thi vì máy thí sinh sẽ chạy MÃ CŨ…" | Làm theo đúng nội dung báo: dán Bộ khởi động (⑤A bước 2) · *Quản lý triển khai › ✎ › Phiên bản mới* · quyền truy cập "Bất kỳ ai". Bấm 🔍 Kiểm tra kết nối tới khi ✓. (Trường hợp gấp vẫn có thể chọn "mở bằng mã hiện tại", nhưng không khuyến nghị) |
| "Phòng thi đang yêu cầu đăng nhập Google" | Triển khai phòng thi đang để "Chỉ mình tôi" / "Người dùng Google": sửa thành **Bất kỳ ai** (Quản lý triển khai › ✎) |
| Kiểm tra báo "File .seb đang trỏ link KHÁC…" | Tạo lại file .seb (mục C), chép lại cho các máy thi |
| Kiểm tra báo "N lượt đăng nhập gần đây chạy mã CŨ" | Các máy đó đang mở trang từ trước khi cập nhật: tải lại trang (⟳). Nếu vẫn còn: 🔍 Kiểm tra kết nối |
| Bảng giám sát báo "Có máy thí sinh đăng nhập bằng mã phòng thi v…" | Như trên |
| Có em "Mất kết nối" | Máy tắt / mất mạng / đóng cửa sổ. Em mở lại .seb và đăng nhập, bài được khôi phục |
| Đã nộp mà bảng điểm không có | ⑦ **↻ Chấm lại** (tự thu bài web mới nhất). Em bị làm lại thì bài cũ đã huỷ |
| Cần biết em làm gì lúc nào | ⚙ Điều khiển › Nhật ký, hoặc 📜 Nhật ký cả phòng |
| **Lệnh tới thí sinh chậm** (> 30 giây) | Kiểm tra: (1) đã ⟳ Đẩy mã mới và thí sinh đã tải lại trang (bản cũ chỉ nhận lệnh theo nhịp lưu 20–30 giây); (2) mạng phòng máy; (3) máy thí sinh mở **ẩn / thu nhỏ** cửa sổ — trình duyệt làm chậm trang bị ẩn; (4) file Phòng thi quá nặng → tab ⚙ Dọn bản tự lưu + Thu gọn | Lệnh không mất — chỉ tới muộn |
| Phòng thi web hỏng hẳn | ⏸ Tạm dừng cả phòng → phát đề giấy đúng mã đề (mục E) → thu phiếu → ⑦ Nhập bài làm trên giấy |


---

## M. Thi lập trình Python · C (tab ⑧)

Bài lập trình được **nối sau phần trắc nghiệm** của kỳ thi (mọi mã đề đều có), chỉ dùng với **Phòng thi web**. Thí sinh viết code trong trang thi,
**▶ Chạy thử** với test ví dụ, **⬆ Nộp code** để chấm trên toàn bộ test. Điểm lập trình cộng vào tổng điểm khi Thu bài & chấm (tab ⑦).

### M1. Máy chấm — cài 1 lần

Apps Script không tự chạy được code Python / C, nên phòng thi gửi code tới một **máy chấm**:

| Máy chấm | Khi nào dùng | Cài đặt |
|---|---|---|
| **Wandbox** (mặc định) | Lớp học, CLB, ≤ 50 thí sinh | Không cần gì. Miễn phí, không cần khoá |
| **Judge0** | Muốn dùng dịch vụ có hạn mức rõ ràng | Để trống địa chỉ = `ce.judge0.com` (công khai, giới hạn lượt) · hoặc RapidAPI: địa chỉ `https://judge0-ce.p.rapidapi.com` + khoá RapidAPI · hoặc máy chủ Judge0 tự cài (+ khoá X-Auth-Token nếu có) |
| **Piston** | Trường có máy chủ riêng | Nhập địa chỉ máy chủ Piston tự cài. Máy chủ công khai emkc.org đã ngừng cho dùng tự do |

Bấm **💾 Lưu** rồi **🔍 Kiểm tra máy chấm**: hệ thống chạy thử "tổng 2 số" bằng Python và C, phải ra ✅ cả hai.
Ô khoá API: để trống = giữ khoá đã lưu, gõ `-` = xoá khoá. Đổi máy chấm khi kỳ thi đã phát → bấm **📤 Phát đề lên phòng thi** lại.

> Wandbox là dịch vụ cộng đồng miễn phí: hãy **🔍 Kiểm tra máy chấm** trước mỗi buổi thi. Nếu cả phòng nộp cùng lúc, phòng thi tự xếp hàng
> (tối đa 14 lượt chấm đồng thời) và trang thí sinh tự thử lại. Lượt nộp gặp lỗi máy chấm **không bị tính** vào số lần nộp.

### M2. Ngân hàng bài — soạn bài kiểu HackerRank

**＋ Bài mới** (hoặc **Sửa** một bài) mở trình soạn 5 thẻ. Muốn có bài để xem cách soạn: **Nạp 3 bài mẫu** (Tổng hai số, Đếm số nguyên tố, Đảo từ trong câu).

1. **Đề bài** — Mã bài (chữ không dấu, số, `_`), tên, độ khó, chủ đề; Đề bài / Dữ liệu vào / Kết quả / Ràng buộc.
   Viết tự do, xuống dòng giữ nguyên; công thức `$n \le 10^5$`; `` `code` ``; `**đậm**`; khối ```` ```python … ``` ````.
   Khung bên phải **xem trước** đúng như thí sinh thấy (kèm các ví dụ từ test mẫu).
2. **Test cases** — mỗi test có Input, Output mong đợi, **Test mẫu** (hiện trong đề, dùng cho Chạy thử, thường trọng số 0) và **Trọng số**.
   Test không đánh dấu mẫu là **test ẩn**: khi nộp, thí sinh chỉ thấy *Đúng / Sai kết quả / Quá thời gian…*, không thấy dữ liệu.
   - **⇪ Nhập nhiều test**: dán nhiều test một lần — các test cách nhau bởi dòng `---`, trong mỗi test input và output cách nhau bởi dòng `===`
     (không có `===` thì để output trống, sinh sau bằng lời giải).
   - **⚙ Điền output trống từ lời giải** / **⚙ Sinh lại mọi output**: chạy lời giải mẫu để tạo output — chỉ cần soạn input.
   - ↑ ↓ đổi thứ tự, ⧉ nhân đôi, ✕ xoá.
3. **Lời giải & code khởi tạo** — lời giải mẫu (Python hoặc C, **không** gửi tới thí sinh) và code khởi tạo Python / C mà thí sinh thấy sẵn trong khung code
   (để trống = mẫu mặc định).
4. **Chấm điểm & giới hạn** — ngôn ngữ cho phép (Python, C hoặc cả hai), giới hạn thời gian (giây / test) và bộ nhớ (MB), cách so sánh output:

   | Cách so sánh | Coi là đúng khi |
   |---|---|
   | Theo từ (khuyên dùng) | Cùng dãy từ / số, bỏ qua khoảng trắng & dòng trống thừa |
   | Theo dòng | Từng dòng giống nhau (bỏ khoảng trắng cuối dòng) |
   | Chính xác | Giống từng ký tự |
   | Số thực có sai số | Các số lệch nhau không quá *sai số* (VD `1e-6`), chữ phải giống |
   | Không phân biệt hoa thường | Như "theo từ" nhưng `YES` = `yes` |

   Cách tính điểm: **Từng test** = (tổng trọng số test đúng ÷ tổng trọng số) × điểm của bài · **Đúng hết mới có điểm**.
5. **Thử code** — chạy một đoạn code bất kỳ (VD lời giải sai cố ý, bài giải bằng C) trên test mẫu + input tự nhập, giống nút Chạy thử của thí sinh.

**📚 Thư viện được dùng** (thẻ 4, khung dưới phần giới hạn) — quy định cho từng bài, thí sinh thấy ngay trong đề:

| Ô | Chọn | Ý nghĩa |
|---|---|---|
| **Python** | *Mọi thư viện chuẩn* (mặc định) | Như trước: được `import` mọi thư viện có sẵn của Python |
| | *Chỉ các thư viện liệt kê* | Gõ tên cách nhau dấu phẩy, VD `math, sys` hoặc bấm chip **+ math**, **+ collections**… Import thư viện khác → bị từ chối |
| | *Không được import* | Mọi `import` / `from … import` đều bị từ chối |
| **C** | *Mọi header chuẩn* (mặc định) / *Chỉ các header liệt kê* | VD `stdio.h, math.h` — `#include` header khác bị từ chối |
| **Không được dùng** | danh sách tên | Hàm / lệnh cấm, VD `sorted, sort, eval` (Python) hoặc `qsort, strrev` (C) — dùng để ra bài "tự cài đặt thuật toán" |

- Khung **xem trước** hiện đúng câu thí sinh đọc (VD *"Python: chỉ math, sys · Không được dùng: sorted"*), đề xem trước cũng có khung này.
- **Cách thực thi (nhiều lớp):**
  1. Máy chủ đọc code (bỏ chú thích, nội dung chuỗi) tìm `import`, `#include`, tên cấm.
  2. **Chặn mọi đường lách** — bài có quy định thì tự động cấm thêm:
     Python `eval`, `exec`, `compile`, `getattr`, `globals`, `vars`, `__import__`, `__builtins__`, `importlib`, `__class__ / __subclasses__ / __globals__…`, `sys._getframe`, `sys.modules`, `pickle`…
     (đây là các cách gọi hàm cấm qua chuỗi như `eval("sor"+"ted")` hay nạp thư viện ngầm); C: **tự viết prototype** của hàm thuộc header không được phép
     (VD khai báo `void qsort(...)` khi chỉ cho `stdio.h`), ghép tên macro `##`, `asm`, `#import`, `__builtin_…`. Tự cài đặt hàm cùng tên (VD tự viết `int abs(int x){…}`) vẫn hợp lệ.
  3. Python lúc chạy còn có **chốt chặn import** — thư viện ngoài danh sách bị chặn kể cả khi lọt qua lớp 1–2.
  4. C: gọi hàm mà chưa `#include` header của nó là **lỗi biên dịch**.
- Code vi phạm **không được gửi tới máy chấm**: thí sinh thấy *⛔ Vi phạm quy định thư viện* kèm dòng vi phạm, **lượt nộp không bị tính**; nhật ký ghi *LT_THU_VIEN*.
- Sửa quy định thư viện → bài chuyển **CẦN KIỂM THỬ LẠI**; ▶ Kiểm thử đề báo nếu chính lời giải mẫu vi phạm. Đổi sau khi đã phát đề thì phát lại.
- Prompt nhờ AI soạn bài: thêm dòng *"Thư viện được dùng: Python …, C …, Không được dùng: …"* để AI điền luôn thẻ 4.

**▶ Kiểm thử đề** (luôn làm trước khi thi): lưu bài, chạy lời giải mẫu trên **mọi** test và so với output. Kết quả hiện từng test (Đúng / Sai, thời gian, bộ nhớ,
chỗ khác nhau) và cảnh báo khi: lời giải chạy gần giới hạn thời gian, chưa có test mẫu, mọi test đều là test mẫu. Bảng ngân hàng ghi **ĐẠT** / **LỖI** / **CẦN KIỂM THỬ LẠI**
(khi đã sửa test hoặc lời giải sau lần kiểm thử).

### M2b. Nhập nhanh — dán đề do AI soạn, nhiều bài một lần

**Cách nhanh nhất (2 phút / bài):**
1. Tab ⑧ › **📥 Nhập nhanh** › **📋 Sao chép prompt cho AI**.
2. Mở ChatGPT / Gemini / Claude, dán prompt, rồi dán **đề bài** ngay dưới (chữ, ảnh chụp đề, file PDF đều được; xin nhiều bài một lần cũng được).
3. Sao chép **nguyên câu trả lời** của AI → dán vào ô Nhập nhanh. Bảng kiểm tra bên phải hiện ngay: mã, tên, số test mẫu / ẩn, test thiếu output, lời giải, thư viện,
   ⛔ lỗi (thiếu tên, thiếu đề…) và ⚠ cảnh báo (chưa có test mẫu, lời giải vi phạm quy định thư viện…).
4. Bấm **📥 Nhập N bài vào ngân hàng**. Với bài có lời giải mẫu, hệ thống **tự tính output cho test còn trống** và **▶ kiểm thử** — cột *Kiểm thử* hiện ✅ / ❌ từng bài.
5. Bấm **Mở** để xem lại đề trước khi dùng (AI có thể hiểu sai đề — luôn đọc lại đề và test mẫu).

- **Trùng mã bài**: *Tạo bài mới thêm đuôi _2* (mặc định) · *Ghi đè bài cũ* (sửa hàng loạt) · *Bỏ qua*.
- Không có AI? Bấm **📄 Chèn mẫu** và gõ theo mẫu. Dạng tối thiểu:

```
### BÀI: LT_TONG | Tổng hai số | Dễ | Nhập xuất
### ĐỀ BÀI
Cho hai số nguyên $a, b$. In $a + b$.
### LỜI GIẢI: Python
a, b = map(int, input().split())
print(a + b)
### TEST MẪU
1 2
=== OUTPUT ===
3
### TEST
-5 7
### HẾT
```

  Test chỉ có input (không có dòng `=== OUTPUT ===`; viết `===` trơn cũng được) → output được tính bằng lời giải mẫu. Các mục khác (INPUT, OUTPUT, RÀNG BUỘC, NGÔN NGỮ, GIỚI HẠN, SO SÁNH, CHẤM,
  THƯ VIỆN PYTHON / C, KHÔNG ĐƯỢC DÙNG, CODE KHỞI TẠO PYTHON / C) không ghi thì lấy mặc định. Tiêu đề mục viết có dấu hay không dấu, `##` hay `###` đều được.
  `### TEST MẪU | 0 | giải thích` = test mẫu trọng số 0 có giải thích; `### TEST | 2` = test ẩn trọng số 2.
- **JSON** cũng nhập được (1 bài, mảng, hoặc `{"bai": [...]}`), tên trường tiếng Việt hoặc tiếng Anh (`title`, `statement`, `solution`, `tests[{input, output, sample}]`…).
- **⬇ Xuất** (cạnh ＋ Bài mới: các bài đang lọc trong bảng; trong trình soạn: bài đang mở) → file .txt cùng định dạng. Nhập lại giữ nguyên mọi thứ.
  Dùng để sao lưu, gửi bài cho trung tâm khác, hoặc sửa hàng loạt trong Notepad rồi nhập lại với *Ghi đè bài cũ*.

**Thêm test nhanh trong trình soạn (thẻ 2. Test cases):**
- **📦 Test từ file / ZIP** — chọn 1 file .zip hoặc nhiều file. Tự ghép cặp theo tên: `1.in` + `1.out`, `BAI.INP` + `BAI.OUT` trong thư mục `Test01`, `Test02`… (Themis),
  `01.in` + `01.ans`, `input01.txt` + `output01.txt`, Codeforces `01` + `01.a`. Sắp xếp tự nhiên (test2 trước test10). Chọn: thay test ẩn cũ, đánh dấu k test đầu là mẫu,
  sinh output còn thiếu bằng lời giải.
- **🎲 Sinh test bằng code** — viết vài dòng Python / C: chương trình nhận **số thứ tự test `t`** ở input và **in ra input của test thứ t** (code mẫu có sẵn).
  Chạy n lần (≤ 50) trên máy chấm, rồi lời giải mẫu tính output. Dùng `random.seed(t)` nên sinh lại vẫn ra đúng test cũ; code được nhớ theo từng bài.
  Mỗi test tối đa 45 000 ký tự (giới hạn 1 ô Google Sheets) — test quá dài bị báo và bỏ qua.

### M3. Gắn bài vào kỳ thi

Chọn kỳ thi ở thanh trên › tab ⑧ › khung **🧩 Bài lập trình trong kỳ thi**:
- **＋ Thêm** bài (hoặc nút **＋ Kỳ thi** ở bảng ngân hàng), đặt **điểm** từng bài, ↑ ↓ đổi thứ tự.
- **Ngôn ngữ kỳ thi cho phép**: Python, C hoặc cả hai. Thí sinh **tự chọn** trong các ngôn ngữ vừa được kỳ thi vừa được bài cho phép, đổi qua lại được
  (code mỗi ngôn ngữ được giữ riêng).
- **Số lần nộp tối đa / bài** · **Điểm của bài** = lần nộp cao nhất *hoặc* lần nộp cuối · **Giãn cách chạy thử** (giây, chống bấm liên tục) ·
  **Cho chạy thử** (tắt = chỉ được nộp) · **Tự chấm bản code đã lưu** (thí sinh viết code mà quên bấm Nộp code → khi thu bài hệ thống tự chấm bản lưu cuối).
- **💾 Lưu cấu hình** → sinh / chốt đề, phân đề như thường → **📤 Phát đề lên phòng thi**. Đổi cấu hình sau khi đã phát thì phát lại.

**Kỳ thi chỉ có lập trình:** ở tab ③ chọn ma trận **`MT_CHI_LT`** (được tạo khi bấm *Nạp 3 bài mẫu*; là ma trận 0 câu trắc nghiệm), sinh đề → chốt → gắn bài ở tab ⑧.

**Bảo mật:** gói đề gửi tới máy thí sinh chỉ có đề bài + test mẫu. Test ẩn nằm ở sheet `LT_Test` của phòng thi (máy chủ đọc, trình duyệt không đọc được);
lời giải mẫu không bao giờ rời Trung tâm.

### M4. Trong giờ thi

- **⑤ Giám sát**: cột "Đã làm" có thêm **</> điểm · số lần nộp** của mỗi thí sinh.
- **⚙ Điều khiển** một thí sinh: phần **Lập trình** — điểm từng bài, **Code đang lưu**, **📜 Lịch sử nộp code** (giờ, ngôn ngữ, điểm, kết quả từng test, xem code từng lần).
  Nhật ký ghi *▶ Chạy thử code*, *⬆ Nộp code*, *⚠ Lỗi máy chấm*.
- Tab ⑧ › **🏆 Bảng xếp hạng — trực tiếp**: điểm cao nhất hiện tại từng bài, tổng, hạng (bằng điểm: ai đạt sớm hơn đứng trước), số thí sinh đạt tối đa / đã nộp mỗi bài.
  Tích **Tự cập nhật 20 giây** để chiếu lên màn hình cho giám khảo. Thí sinh **không** thấy bảng này.
- **Kiểm tra trước giờ thi** (⑤ mục D) báo: bài đã có trên phòng thi, bài đã kiểm thử đạt, máy chấm chạy được, bộ khởi động v3.

### M5. Sau giờ thi

1. Tab ⑦ › **📥 Thu bài phòng thi web & chấm**: điểm lập trình = điểm theo cách tính đã chọn; bài chỉ lưu code (chưa nộp) được **tự chấm** nếu bật.
   Hệ thống so code các thí sinh cùng bài (bỏ tên biến, chú thích, khoảng trắng) và đánh dấu cặp **giống ≥ 85%** trong cột Cảnh báo.
2. Kết quả (`KetQua`) có thêm cột **DiemLapTrinh**, **ChiTietLapTrinh**; *ChiTietPhan* có dòng `LT: x/y`.
3. Tab ⑧ › **📊 Kết quả lập trình** › **Tải kết quả**: điểm, số lần nộp, ngôn ngữ, nguồn điểm (nộp / tự chấm), **nghi giống**, nút **Xem code**.
   Tích *Chỉ bài nghi giống nhau* để rà soát nhanh.

### M6. Giới hạn cần biết
- Code tối đa **30.000 ký tự** / bài; input / output mỗi test tối đa **45.000 ký tự** (giới hạn 1 ô Google Sheets). Bài cần test rất lớn: chia thành nhiều test vừa.
- Mỗi lần nộp chấm mọi test **song song**, thường xong trong vài giây (tuỳ tốc độ máy chấm và số test).
- Đề nghị ≤ 15 test / bài, giới hạn thời gian 1–2 giây. Máy chấm công cộng có thể chậm hơn máy bạn: kiểm thử đề sẽ cảnh báo khi lời giải mẫu dùng > 50% giới hạn.
- Máy chấm miễn phí (Wandbox) từ chối khi nhận quá nhiều lượt một lúc (báo `OCI runtime error … Resource temporarily unavailable`). Từ v1.7.2 hệ thống gửi test theo từng đợt 3 lượt và tự chạy lại các test gặp lỗi này; nếu vẫn lỗi thì báo **Lỗi máy chấm** (không tính lượt), không còn báo nhầm "Lỗi khi chạy".
- Thời gian / bộ nhớ hiển thị là số đo của máy chấm; máy chấm không cho đo thì để trống, kết quả Đúng / Sai vẫn chính xác.

---

## N. Dọn dẹp, lưu trữ & sao lưu (tab ⚙ Hệ thống)

Google Sheets giới hạn **10 triệu ô / file**, và file càng nhiều hàng thì phòng thi đọc ghi càng chậm. Sau mỗi đợt thi nên dọn.

| Khung | Làm gì | Ghi chú |
|---|---|---|
| 💽 **Dung lượng dữ liệu** | % đã dùng của file Trung tâm và Phòng thi, các sheet lớn nhất, số dòng nhật ký | Thanh chuyển vàng > 40%, đỏ > 70% |
| 🧾 **Dọn nhật ký** | Xoá nhật ký cũ hơn N ngày (Trung tâm / Phòng thi) | Không đụng kỳ thi **đang mở** |
| 💾 **Dọn bản tự lưu** | Mỗi thí sinh chỉ giữ **bản lưu cuối** + bài nộp; tuỳ chọn xoá bài của lượt thi đã bị làm lại, xoá lần nộp code trung gian (giữ lần cao nhất & lần cuối) | Áp dụng cho kỳ thi **đã đóng**, hoặc các kỳ thi đánh dấu ở bảng dưới |
| 🗜 **Thu gọn** | Xoá hàng / cột trống thừa (Google vẫn tính chúng vào giới hạn ô) | Nên bấm sau khi dọn |
| 🗂 **Kỳ thi cũ — lưu trữ & xoá** | Bảng mọi kỳ thi: số thí sinh, câu, bài làm, bản tự lưu, nhật ký, lần nộp code. **Lưu trữ & xoá…** | Xem dưới |
| 💾 **Sao lưu ngay** | Tạo bản sao file Trung tâm, Phòng thi, các ngân hàng vào `SaoLuu/<ngày giờ>` | Giữ N bản gần nhất, bản cũ hơn vào Thùng rác |
| 🤖 **Bảo trì tự động** | 2 giờ sáng Chủ nhật hằng tuần: sao lưu → dọn nhật ký → dọn tự lưu → thu gọn | Tự **bỏ qua** nếu lúc đó có kỳ thi mở. "Chạy ngay 1 lần" để thử |

**Lưu trữ & xoá một kỳ thi** (phòng thi phải **đóng**):
- ☑ *Xuất file lưu trữ*: toàn bộ dữ liệu kỳ thi (đề, thí sinh, bài làm, kết quả, phúc khảo, nhật ký, code) ra **1 file Google Sheets** trong thư mục `LuuTru`.
- ☑ *Xoá trên Phòng thi*: thí sinh, gói đề, bài làm, nhật ký, test & code — phòng thi nhẹ lại ngay.
- ☐ *Xoá khỏi Trung tâm*: đề, thí sinh, kết quả… (kỳ thi biến mất khỏi danh sách). ☐ *và chuyển Google Form + thư mục kỳ thi vào Thùng rác*.
- Phải **gõ đúng mã kỳ thi** để xác nhận. Bỏ chọn *Xuất file lưu trữ* thì hệ thống hỏi lại vì dữ liệu sẽ mất hẳn.

> Gợi ý: kỳ thi đã chấm xong & đã xuất điểm → *Lưu trữ & xoá* với 2 ô mặc định (giữ kỳ thi ở Trung tâm để tra cứu, phòng thi sạch cho đợt sau).

---

## I. HƯỚNG DẪN DÀNH CHO THÍ SINH

> Phần này có thể in phát cho thí sinh hoặc chiếu lên màn hình trước giờ thi.

### I1. Trước giờ thi
- Nhận **phiếu đăng nhập** gồm Số báo danh (SBD) và **Mã truy cập**. Giữ kín mã truy cập.
- Máy thi đã cài **Safe Exam Browser (SEB)**. Bấm đúp **file .seb** giám thị cung cấp, SEB tự mở phòng thi toàn màn hình.
- **Lưu và đóng mọi ứng dụng** trước khi mở file .seb. Khi mở, SEB **tự đóng ngay** trình duyệt khác, Zalo / Messenger / Meet / Zoom, game, VS Code, Spotify, ứng dụng điều khiển từ xa… mà **không hỏi**, nên tài liệu chưa lưu sẽ mất.
- Khi vào thi, máy có thể **tự tắt tiếng** (đề không có câu nghe). Đề có câu nghe thì mang tai nghe có dây theo hướng dẫn của giám thị.

### I2. Đăng nhập & phòng chờ
1. Nhập **SBD**, **Mã truy cập** (không phân biệt hoa thường), **Mã phòng** nếu giám thị đọc. Bấm **Vào phòng thi**.
2. Phòng chờ hiện họ tên, kỳ thi, thời gian, quy định. Đọc kỹ, tích **"Tôi đã đọc và cam kết…"**.
3. Khi giám thị mở đề, nút **Bắt đầu làm bài →** sáng lên (kỳ thi tính giờ chung thì tự vào bài).

### I3. Làm bài
- **Thanh trên cùng:** tên kỳ thi, mã đề · trạng thái lưu (*Đã lưu · đồng bộ hh:mm*) · **đồng hồ** đếm ngược (chuyển cam / đỏ khi sắp hết) ·
  họ tên · **A− / A+** đổi cỡ chữ · **💬 Hỏi giám thị** · **Nộp bài**.
- **Thẻ câu hỏi:** số câu, phần & điểm, dạng câu. Câu chùm có khung "Dùng thông tin sau cho câu …". Công thức, code, ảnh hiển thị như đề in.
- **Cách trả lời:**
  - *Một đáp án*: bấm vào lựa chọn (ô chọn có dấu ✓). Bấm lựa chọn khác để đổi.
  - *Nhiều đáp án*: bấm từng lựa chọn đúng (bấm lại để bỏ).
  - *Đúng / Sai*: bấm **Đ** hoặc **S** cho từng ý a, b, c, d.
  - *Trả lời ngắn*: gõ đáp án vào ô (dùng dấu phẩy hay chấm thập phân đều được, ví dụ `2,5`).
  - *Ghép nối*: chọn số tương ứng cho từng mục.
- **🚩 Đánh dấu xem lại**: đánh dấu câu còn phân vân (chấm cam trên lưới câu).
- **Lưới câu bên phải:** ô xanh = đã làm (kèm chữ đáp án), ô trắng = chưa làm, viền đậm = câu đang xem. Bấm số để chuyển câu.
  Thanh **Tiến độ** cho biết đã làm bao nhiêu câu.
- **Phím tắt:** `A`–`D` chọn đáp án · `←` `→` chuyển câu.
- **◐** trên thanh trên: đổi giao diện **sáng / tối** (máy nhớ lựa chọn).
- **Kỳ thi nghiêm ngặt** (thi bằng link): bấm **Bật toàn màn hình** để làm bài. Thoát toàn màn hình, chuyển tab, mở ứng dụng khác là **bị khoá ngay**; giơ tay để giám thị nhập mã mở khoá.
- Bài **tự lưu** liên tục lên máy chủ và vào máy. **Tải lại trang** (nút ⟳ của SEB) thì vào thẳng lại bài, không mất gì.
- Máy nhắc khi **còn 15, 5 và 1 phút**. Hết giờ, máy **tự nộp**.

### I3b. Bài lập trình (Python · C)

Câu lập trình nằm cuối đề, trang chia đôi: **đề bài** bên trái, **khung code** bên phải, **kết quả** bên dưới. Nút **☰ Danh sách câu** mở lưới câu hỏi.

**Chỉnh chỗ viết code cho rộng** (trang nhớ cách chia của bạn, tải lại không mất):
- Kéo **thanh ngăn ngang** (vạch xám giữa khung code và kết quả) **lên / xuống**; kéo **thanh ngăn dọc** giữa đề bài và code **trái / phải**. Nhấp đúp thanh ngăn = về mặc định.
- **◧ Ẩn đề bài / Hiện đề bài** · **⛶ Tập trung code / Thoát tập trung** (ẩn đề bài + thu gọn kết quả, code chiếm gần cả màn hình) ·
  **▾ Thu gọn / ▴ Mở rộng kết quả**. Khi bấm Chạy thử / Nộp code, khung kết quả tự mở ra.
- Đề bài có khung **📚 Thư viện được dùng** (nếu bài có quy định): chỉ `import` / `#include` những gì được ghi, không dùng hàm trong mục *Không được dùng*.
  Vi phạm → trang báo **⛔ Vi phạm quy định thư viện** kèm dòng sai, code không được chạy, **lượt nộp không bị tính** — sửa rồi nộp lại.

1. Chọn **Ngôn ngữ** (nếu kỳ thi cho chọn). Code mỗi ngôn ngữ được giữ riêng — đổi qua lại không mất. **↺ Code mẫu** đưa về code khởi tạo.
2. Viết chương trình **đọc dữ liệu từ bàn phím** (`input()` / `scanf`) và **in kết quả ra màn hình** (`print` / `printf`), đúng định dạng trong đề, **không in thêm lời nhắc**
   như "Nhập n:". Khung code có tô màu, tự thụt lề, `Tab` = 4 dấu cách.
3. **▶ Chạy thử** (`Ctrl`+`Enter`): chạy với các ví dụ trong đề — không tính điểm, không tính lượt. Tích **Input tự nhập** để chạy với dữ liệu của bạn
   (nút **Dùng thử** ở ví dụ chép sẵn input vào đó). Kết quả mỗi test: Input · Output mong đợi · Output của bạn, chỉ ra **dòng đầu tiên khác nhau**, thông báo lỗi.
4. **⬆ Nộp code** (`Ctrl`+`Shift`+`Enter`): chấm trên **mọi** test, kể cả **test ẩn** (chỉ thấy Đúng / Sai). Hiện điểm lần nộp, số test đúng, **số lượt còn lại**.
   Điểm của bài là lần cao nhất (hoặc lần cuối — trang thi ghi rõ). Tab **Lịch sử nộp** liệt kê các lần nộp.

| Kết quả | Nghĩa |
|---|---|
| **Đúng** | Output khớp |
| **Sai kết quả** | Output khác (xem dòng khác nhau) |
| **Quá thời gian** | Chạy lâu hơn giới hạn — thuật toán chậm hoặc vòng lặp vô hạn, hoặc chương trình đang chờ nhập thêm |
| **Quá bộ nhớ** | Dùng quá giới hạn bộ nhớ |
| **Lỗi khi chạy** | Chương trình dừng do lỗi (chia 0, truy cập mảng sai, `ValueError`…) — xem thông báo lỗi |
| **Lỗi biên dịch** | Code C sai cú pháp / Python lỗi cú pháp — lần nộp này 0 điểm |
| **Lỗi máy chấm** | Máy chấm bận / sự cố — **không tính lượt**, trang tự thử lại; nếu vẫn lỗi hãy nộp lại sau ít giây |

- Code được **tự lưu** như các câu khác (tải lại trang không mất). Quên bấm Nộp code: nếu kỳ thi bật *tự chấm bản lưu*, code lưu cuối vẫn được chấm khi thu bài.
- Trong khung code được **sao chép / dán code của chính mình** và dữ liệu ví dụ của đề; **không dán được** nội dung chép từ nơi khác.
- Bị báo *"Chờ … giây"*: kỳ thi giới hạn khoảng cách giữa các lần chạy — trang tự chờ rồi chạy.

### I4. Các màn hình đặc biệt — đừng lo, hãy đọc kỹ

| Màn hình | Ý nghĩa | Bạn làm gì |
|---|---|---|
| ⏳ **"Đang cập nhật…" / "Giám thị đang …"** (vòng xoay + thanh chạy ~1–2 giây) | Giám thị vừa thay đổi gì đó cho bạn. **Không phải máy treo** | Chờ vài giây |
| Thanh mảnh chạy trên đầu trang | Máy chủ đang trả lời hơi chậm | Cứ làm bài |
| 💬 **Tin nhắn từ giám thị** | Giám thị trả lời / nhắc bạn | Đọc, bấm **Đã hiểu** |
| 📢 Dải thông báo trên đầu trang | Thông báo chung cho cả phòng | Đọc |
| ⏸ **Giám thị đã tạm dừng bài thi** | Đồng hồ **dừng**, thời gian được bù đủ | Ngồi yên, giữ toàn màn hình. Thoát toàn màn hình / chuyển tab / mở ứng dụng khác lúc này = **khoá bài**, phải chờ giám thị mở |
| 🔒 **Bài thi đang tạm khoá** | Bạn đã rời màn hình thi quá số lần cho phép | Giơ tay báo giám thị mở khoá. Bài vẫn giữ nguyên |
| ♻ **Giám thị đã cho làm lại bài thi từ đầu** + đếm ngược | Bài cũ bị huỷ, bạn làm lại từ đầu (có thể đề khác) | Chờ về trang đăng nhập (hoặc bấm *Về trang đăng nhập ngay*), đăng nhập lại (**dùng mã mới** nếu giám thị đưa) |
| ⛔ **Đình chỉ thi** | Giám thị đình chỉ bạn | Làm theo hướng dẫn của giám thị |
| ⚠ **Bạn vừa rời khỏi màn hình thi…** | Bạn đã chuyển tab / cửa sổ / thoát toàn màn hình. **Đã bị ghi lại** | Quay lại làm bài, không lặp lại |
| ⚠ **Mất kết nối tới máy chủ** | Mạng chập chờn | **Cứ làm bài, không đóng cửa sổ.** Máy tự gửi lại khi có mạng |

> Trong SEB, bấm vào biểu tượng Wi-Fi, pin, đồng hồ, nút tải lại của SEB **không bị tính** là rời màn hình.

### I5. Hỏi giám thị
Bấm **💬 Hỏi giám thị**, gõ câu hỏi, gửi. Câu trả lời hiện trên màn hình trong khoảng 15–30 giây. **Không** dùng điện thoại / ứng dụng nhắn tin.

### I6. Nộp bài
1. Bấm **Nộp bài** (góc trên phải). Bảng xem lại hiện **các câu chưa làm / đã đánh dấu**. Bấm vào câu để quay lại sửa.
2. Bấm **Tôi chắc chắn nộp bài**. Sau khi nộp **không sửa được** nữa.
3. Màn "Đã nộp bài" hiện giờ nộp. Dùng SEB: bấm **Thoát SEB** (hoặc chờ giám thị).
   Nếu màn hình hiện **chuỗi bài làm** (do không gửi được), **giữ nguyên màn hình** và báo giám thị chép lại.

### I7. Gặp sự cố?

| Sự cố | Làm gì |
|---|---|
| Máy treo / tắt / hết pin | Báo giám thị. Đăng nhập máy khác **cùng SBD + mã**: bài đã lưu còn nguyên |
| Lỡ đóng SEB / trang thi | Mở lại file .seb, đăng nhập lại, vào tiếp bài |
| Báo sai mã / không vào được | Kiểm tra lại SBD, mã (số 0 hay chữ O…). Sai nhiều lần sẽ bị chặn tạm thời: báo giám thị |
| Báo "bắt buộc Safe Exam Browser" | Bạn đang mở bằng trình duyệt thường hoặc file .seb cũ. Xin giám thị file .seb mới nhất |
| Báo "đã mở ở máy/cửa sổ khác" | Bạn vừa đăng nhập ở nơi khác. Dùng 1 máy duy nhất, báo giám thị nếu không phải bạn |

### I8. Những việc bị cấm / bị ghi lại
Chuyển tab, rời cửa sổ, thoát toàn màn hình, sao chép / dán (trừ code của chính mình trong khung code), chuột phải, chụp / in màn hình, dùng ứng dụng nhắn tin, gọi video.
Nền trang có **hình mờ SBD + họ tên** của bạn. Vi phạm nhiều lần có thể bị **khoá bài** hoặc **đình chỉ (0 điểm)**.
Dùng **tác tử AI / phần mềm điều khiển máy / điều khiển từ xa** để làm bài hộ: trang thi nhận ra thao tác không phải của người, **khoá bài** và báo giám thị kèm bằng chứng.

---

## K. Giới hạn & mẹo vận hành

- **Sức tải:** thiết kế cho 40–50 thí sinh/phòng. Mỗi máy ~1,5–2 lượt gọi/phút, có dãn cách ngẫu nhiên. Mô phỏng 50 thí sinh × 60 phút: đỉnh ≈ 5 lượt chạy đồng thời,
  trong khi giới hạn của Google là 30.
- **Không chạy việc nặng trong giờ thi** (xuất Google Form, tạo PDF lên Drive, sinh đề lớn), vì dùng chung hạn mức của tài khoản.
- **Không sửa tay** các sheet trong `PhongThi_DuLieu` (đặc biệt `MaNguon`, `ThiSinh`, `BaiLam`). Mọi thao tác hãy làm qua bảng điều khiển.
- **Không chia sẻ** file Trung tâm và file ngân hàng (chứa đáp án). File phòng thi không có đáp án nhưng cũng không cần chia sẻ.
- Đổi link phòng thi (do tạo triển khai mới) thì **phải tạo lại file .seb**. Tốt nhất luôn dùng *Quản lý triển khai › Phiên bản mới* để giữ link.
- Trước mỗi buổi thi: **🔍 Kiểm tra kết nối** + **Kiểm tra ngay**. Hai thao tác này mất 10 giây và phát hiện gần như mọi lỗi cấu hình.
- Bản cập nhật mới: dán vào hệ thống chính là đủ. Mã phòng thi tự đẩy sang, máy thí sinh nhận khi tải trang (≤ 30 giây).
- **Thi lập trình:** trước buổi thi bấm **🔍 Kiểm tra máy chấm** và **▶ Kiểm thử đề** cho từng bài. 40–50 thí sinh nộp code cùng lúc vẫn ổn (phòng thi xếp hàng, tự thử lại),
  nhưng nên đặt *giãn cách chạy thử* 5–10 giây và *số lần nộp* 10–30 để tránh bấm liên tục.
- Sau mỗi đợt thi: tab ⚙ › **Dọn bản tự lưu** + **Thu gọn**, hoặc bật **Bảo trì tự động** hằng tuần.

---

## L. Câu hỏi thường gặp

**Một kỳ thi chứa được bao nhiêu người?** Khuyến nghị ≤ 50 thí sinh/phòng thi cùng lúc (giới hạn đồng thời của Google). Nhiều phòng hơn thì chia ca.

**Thí sinh có xem được đáp án không?** Không. Gói đề trên phòng thi không chứa đáp án. Chấm điểm thực hiện ở hệ thống chính.

**"Làm lại" khác "Làm tiếp" thế nào?** Xem bảng F2. Tóm lại: *làm tiếp* giữ bài, *làm lại* xoá trắng.

**Đã đóng / đã chấm rồi có cho 1 em thi lại được không?** Được, xem F3. Không cần tạo lại danh sách hay phát lại đề.

**Bị đình chỉ rồi có cho thi tiếp được không?** Được: *Gỡ cấm…* › chọn làm tiếp bài dở / làm lại / đổi đề riêng.

**Vì sao máy thí sinh hiện "Đang cập nhật…"?** Vì giám thị vừa thao tác với máy đó (tạm dừng, nhắn tin, mở khoá, thu bài, đình chỉ, làm lại…). Màn này báo trước để thí sinh không tưởng máy lag.

**Thí sinh tải lại trang có mất bài không?** Không. Bài vào thẳng lại, kể cả trong SEB.

**Cập nhật phiên bản sau này có phải dán lại mã phòng thi không?** Không (từ v1.6). Chỉ dán hệ thống chính.

**Thi lập trình có tốn phí không?** Không, với máy chấm Wandbox (mặc định). Judge0 / Piston tự cài cũng miễn phí; RapidAPI có gói miễn phí giới hạn lượt.

**Máy chấm có thấy tên thí sinh không?** Không. Phòng thi chỉ gửi code + input của test (+ giới hạn thời gian / bộ nhớ).

**Thí sinh xem được test ẩn không?** Không. Test ẩn không có trong gói đề gửi tới trình duyệt; khi nộp, kết quả test ẩn chỉ có Đúng / Sai, thời gian, bộ nhớ.

**Chỉ muốn thi lập trình, không trắc nghiệm?** Tab ③ chọn ma trận `MT_CHI_LT` (có sau khi bấm *Nạp 3 bài mẫu* ở tab ⑧), rồi gắn bài ở tab ⑧. Xem M3.

**File phòng thi ngày càng nặng?** Tab ⚙: Dọn bản tự lưu + Thu gọn, hoặc *Lưu trữ & xoá* các kỳ thi đã xong. Bật *Bảo trì tự động* để khỏi phải nhớ.

**Làm sao biết chắc máy thí sinh đang chạy mã mới?** ⑤A › 🔍 Kiểm tra kết nối phải báo *"mã phòng thi v… (mới nhất)"*. Kiểm tra trước giờ thi cũng báo nếu có máy đăng nhập bằng mã cũ.
