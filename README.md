# Hệ thống Ngân hàng đề & Thi trắc nghiệm — v1.7 (Phòng thi web + Google Forms + Thi lập trình)

> 📘 **Cẩm nang đầy đủ cho giám thị & thí sinh (mọi tính năng, mọi tình huống): [`HUONG_DAN_SU_DUNG.md`](HUONG_DAN_SU_DUNG.md).**
> README này là tài liệu kỹ thuật / cài đặt nhanh.

Toàn bộ hệ thống chạy 100% miễn phí trong hệ sinh thái Google: **Google Sheets** chứa dữ liệu, **Apps Script** xử lý, **Google Forms** để thi, giao diện là **Bảng điều khiển** dạng trang web (mở ngay trong Sheets hoặc triển khai thành Web App).

Giai đoạn 1 gồm: ngân hàng câu hỏi, ma trận đặc tả, sinh mã đề (chế độ A/B, có duyệt trước), xuất Google Form, mở/đóng thi, chấm theo luật riêng, thống kê, phúc khảo.
Giai đoạn 2 (làm sau): cổng vào thi kiểm tra SEB + file cấu hình `.seb`, gửi điểm PDF qua email, cờ gian lận (nộp quá nhanh, bài giống nhau), dashboard Looker Studio.

---

## 1. Cài đặt (khoảng 10 phút)

> **Nên dùng tài khoản Gmail cá nhân làm chủ hệ thống.** Tài khoản `.edu` của học viện thường bị quản trị viên giới hạn: Form tạo ra có thể bị buộc đăng nhập trong tên miền trường, Apps Script hoặc việc gọi dịch vụ ngoài (ảnh công thức) có thể bị chặn. Nếu muốn dùng `.edu`, hãy chạy thử dữ liệu mẫu trước.

1. Vào Google Drive → **Mới › Google Trang tính**, đặt tên `HeThongThi_TrungTam`.
2. Trong file đó: **Tiện ích mở rộng › Apps Script**.
3. Trong trình soạn Apps Script:
   - Mở file `Code.gs` (hoặc `Mã.gs`), xoá hết nội dung, dán toàn bộ nội dung file **`HeThongThi.gs`**.
   - Bấm **＋ › HTML**, đặt tên đúng là **`Index`**, xoá nội dung mặc định, dán toàn bộ **`Index.html`**.
   - Bấm **＋ › HTML** lần nữa, đặt tên đúng là **`NhapCau`**, dán toàn bộ **`NhapCau.html`** (trình nhập câu hỏi nhanh, từ v1.1).
   - (Khuyến nghị) **Cài đặt dự án (⚙) › Hiển thị tệp kê khai "appsscript.json"**, quay lại trình soạn, mở `appsscript.json`, dán nội dung file cùng tên (đặt múi giờ Việt Nam).
   - Bấm **💾 Lưu**.
4. Quay lại Google Sheets, **tải lại trang (F5)**. Trên thanh menu xuất hiện **🎓 Hệ thống thi**.
5. Chọn **🎓 Hệ thống thi › ① Khởi tạo / sửa cấu trúc hệ thống**. Google hỏi cấp quyền: chọn tài khoản → *Nâng cao* → *Đi tới … (không an toàn)* → *Cho phép*. (Cảnh báo này xuất hiện vì đây là mã của chính bạn, chưa qua kiểm duyệt của Google.)
6. Chọn **② Tạo dữ liệu mẫu** để có môn DEMO + kỳ thi KT_DEMO chạy thử.
7. Chọn **Mở bảng điều khiển**.

**Mở bảng điều khiển ở tab riêng (tuỳ chọn):** trong Apps Script → **Triển khai › Tuỳ chọn triển khai mới › Loại: Ứng dụng web** → *Thực thi với tư cách: Tôi*, *Người có quyền truy cập: Chỉ mình tôi* → Triển khai → dùng link `/exec`. Mỗi lần sửa mã cần **Quản lý tuỳ chọn triển khai › Sửa › Phiên bản mới**.

---

## 2. Chạy thử nhanh với dữ liệu mẫu (15 phút)

| Bước | Tab | Thao tác |
|---|---|---|
| 1 | ① Ngân hàng | Chọn DEMO → *Tải & kiểm tra*. Xem phân bố câu, xem trước câu hỏi (có hiển thị công thức). |
| 2 | ② Ma trận | Chọn MT_DEMO → Số mã đề 2 → *Kiểm tra*. |
| 3 | ③ Kỳ thi | Kỳ thi KT_DEMO → *Sinh đề nháp* → xem từng mã đề, thử *Đổi câu*, *Khoá* → *Chốt đề*. |
| 4 | ④ Thí sinh | *Phân ngẫu nhiên* (6 thí sinh mẫu). |
| 5 | ③ Kỳ thi | *Xuất Google Form* (mỗi mã đề 10–60 giây). Mở link "làm bài" để xem Form. |
| 6 | ⑤ Điều hành | *MỞ THI* → mở link làm bài, nộp thử với SBD `SV001`… (đúng mã đề được phân) → *ĐÓNG THI*. |
| 7 | ⑥ Chấm điểm | *Thu bài & chấm* → xem phổ điểm, tỉ lệ đúng từng câu, theo chủ đề, theo lớp, bảng điểm. |

---

## 3. Nhập ngân hàng câu hỏi

Mỗi môn có 1 file `NganHang_<MÃ MÔN>` (tạo ở tab ① hoặc menu *Tạo môn học mới*). File gồm:

**DanhMuc** — phân cấp nội dung: `MaChuDe | Khoi_CapDo | Chuong | ChuDe | YeuCauCanDat`.
Ví dụ: `CD04 | Cơ bản | C3. Đại số tuyến tính | Ma trận & định thức | Tính toán với ma trận cỡ nhỏ`.

**CauHoi** — mỗi dòng 1 câu (di chuột lên tiêu đề cột để xem ghi chú):

| Cột | Ý nghĩa |
|---|---|
| MaCH | Mã duy nhất (Q001, LA-012…) |
| MaChuDe, MucDo | Liên kết DanhMuc; mức độ theo thang ở `CauHinh › MUC_DO` (mặc định NB/TH/VD/VDC) |
| DangCau | `MOT_DA`, `NHIEU_DA`, `DUNG_SAI`, `TRA_LOI_NGAN`, `GHEP_NOI` |
| MaNhom | Câu hỏi chùm (đoạn văn/tình huống ở sheet **Nhom**); các câu cùng nhóm luôn đi liền nhau |
| NoiDung_VI / NoiDung_EN | Song ngữ: EN hiện ngay dưới VI trên Form |
| LaTeX | Công thức lớn → ảnh chèn trước câu hỏi |
| HinhAnh | ID/link file ảnh trên Drive (mỗi ảnh 1 dòng) |
| Video / AmThanh | Link YouTube (nhúng được) / link file nghe (hiện dạng đường link) |
| A … E | Lựa chọn. Song ngữ: `Hàm mất mát \|\| Loss function`. DUNG_SAI: các ý a–d ở A–D. GHEP_NOI: ý bên trái |
| CotGhep | GHEP_NOI: mục bên phải, cách nhau `\|` (đánh số 1, 2, 3…) |
| DapAn | `B` · `A,C,D` · `Đ,S,Đ,Đ` · `0.5 \| 1/2` (sai số `3.14~0.01`) · `A-2,B-1,C-3` |
| KhongTron | Trống = tự giữ cố định "Tất cả…/Cả A và B…"; `TAT_CA` = không trộn; `D,E` = cố định D, E; `TRON_HET` |
| LoiGiai_VI / EN | Lời giải (lưu sẵn cho giai đoạn gửi kết quả) |
| TrangThai | `DUNG` / `AN` (ẩn thì không được bốc vào đề) |

**Công thức:** `$x^2 + \frac{1}{2}$` trong dòng được đổi thành chữ Unicode (x² + 1/2) để hiện thẳng trên Form; công thức phức tạp (ma trận, `\begin{…}`, `\binom`) và `$$…$$` tự chuyển thành **ảnh PNG** (qua dịch vụ CodeCogs, lưu đệm trong thư mục Drive `AnhCongThuc_Cache`). Nếu tất cả lựa chọn đều là công thức phức tạp, hệ thống ghép thành 1 ảnh "A. … B. …".

**Luật chấm:** sai hoặc bỏ trống được 0 điểm, không trừ điểm. NHIEU_DA, DUNG_SAI, GHEP_NOI phải đúng toàn bộ mới được điểm. Trả lời ngắn chấp nhận `2,1` = `2.1` = `21/10`, không phân biệt hoa/thường và khoảng trắng thừa.

---

## 3a. 📝 Nhập câu hỏi nhanh (v1.1)

Mở bằng menu **🎓 Hệ thống thi › 📝 Nhập câu hỏi nhanh**, hoặc nút cùng tên ở tab ① Ngân hàng. Cửa sổ này **không chặn** bảng tính, có thể để mở cạnh trang web đang tìm câu hỏi; xong thì đóng. Mọi thao tác ghi thẳng vào sheet `CauHoi` của file ngân hàng, không cần sửa ô.
Muốn mở ở tab trình duyệt riêng: triển khai Web App (mục 1) rồi dùng link `…/exec?p=nhap&mon=AIG` (lưu vào dấu trang).

**Thẻ ✏️ Nhập từng câu** (3 cột, không phải cuộn ngang):
- Trái: chọn **Chủ đề**, **Mức độ**, **Dạng câu**, nhóm câu chùm; bên dưới hiện các **ô ma trận** của chủ đề, có / cần bao nhiêu câu, ô nào câu đang nhập sẽ được tính vào (▶).
- Giữa: **copy cả câu trên web rồi dán vào ô Nội dung**, hệ thống tự tách nội dung, A–J, đáp án (dòng "Đáp án: B", dấu `*`, chữ in đậm/đỏ trên trang web), lời giải, mức độ "(TH)". Công thức hiển thị bằng KaTeX/MathJax/Wikipedia được đổi về LaTeX `$…$`. Dán nhiều câu một lúc thì tự chuyển sang thẻ *Dán nhiều câu*. Có nút **Hoàn tác** nếu tách sai.
- Mỗi câu tối đa **10 lựa chọn (A–J)**, bấm ＋ thêm / − bớt. Bấm chữ cái để chọn đáp án đúng; câu Đúng/Sai bấm Đ/S từng ý; trả lời ngắn gõ đáp án; ghép nối chọn số.
- **Ảnh**: dán thẳng (Ctrl/⌘+V) hoặc kéo thả, ảnh được thu nhỏ và tải lên Drive (`HeThongThi_DuLieu/HinhAnh_<MÔN>`).
- **🌐 Dịch**: dùng Google Dịch (miễn phí, có hạn mức theo ngày) điền phần tiếng Anh hoặc tiếng Việt còn trống, giữ nguyên công thức và `mã`.
- Thanh công thức: chèn nhanh phân số, căn, tổng, tích phân, ma trận, kí hiệu xác suất…; tự bọc `$…$` khi cần.
- Phải: **xem trước như trên đề** (có công thức), cảnh báo **câu gần giống** đã có trong ngân hàng, danh sách câu vừa lưu (bấm để sửa lại).
- **Ctrl/⌘+Enter** lưu và mở câu mới. Chủ đề, mức, dạng, nhóm, nguồn, tag được giữ cho câu sau. Mã câu tự cấp: `<MaChuDe>-001, -002…`.
- Bản nháp chưa lưu được giữ lại nếu lỡ đóng cửa sổ.

**Thẻ 📋 Dán nhiều câu**: dán cả trang đề (Câu 1:, Câu 2:… hoặc 1. 2. 3.; có thể kèm **bảng đáp án** cuối bài "1.A 2.C 3.B"). Mỗi câu thành một thẻ để sửa nhanh (chủ đề, mức, dạng, bấm chọn đáp án), "Sửa chi tiết" để mở trong thẻ nhập từng câu, rồi **Lưu các câu sẵn sàng** một lần.

**Thẻ 📚 Danh sách**: tìm theo nội dung/mã/tag, lọc chủ đề/mức/dạng/trạng thái/lỗi/nhập hôm nay; xem, **Sửa**, **Nhân bản** (làm câu tương tự), **Ẩn** (không bốc vào đề), **Xoá** (chỉ khi câu chưa nằm trong đề nào).

**Thẻ 📊 Tiến độ theo ma trận**: chọn ma trận và số mã đề khác câu, xem từng ô còn thiếu bao nhiêu câu; nút "Nhập cho ô này" đặt sẵn chủ đề, mức, dạng.

Phím tắt: `Alt/⌥+A…J` đáp án · `Alt+1…4` mức độ · `Alt+↑/↓` chủ đề · `Alt+X` dạng câu · `Alt+M` bọc công thức · `Alt+T` dịch · `Alt+S` hiện ô tiếng Anh · `Alt+N` câu mới.

---

## 4. Ma trận đề

- **MaTran_Phan**: mỗi dòng 1 phần, ví dụ Phần I trắc nghiệm 50 điểm 20 câu (`MOT_DA,NHIEU_DA`), Phần II Đúng/Sai 30 điểm, Phần III trả lời ngắn 20 điểm. Câu trong phần **chia đều điểm**.
- **MaTran_ChiTiet**: các ô `Phần × Chương × MaChuDe × MucDo × DangCau` → `SoCau` **hoặc** `TiLe` (% của TongSoCau, tự làm tròn để tổng khớp). Để trống là không lọc; nhiều giá trị cách nhau dấu phẩy (`C3, C5`). Chương ghi ngắn `C3` sẽ khớp `C3. Đại số tuyến tính`.
- Nút **Kiểm tra** báo ô nào thiếu câu, ô nào buộc các mã đề phải dùng chung câu, và chạy thử sinh đề thật.

## 5. Chế độ mã đề

- **A — cùng câu, trộn thứ tự**: một bộ câu cho mọi mã đề; mỗi mã đề trộn thứ tự câu trong từng phần, trộn đáp án, (tuỳ chọn) trộn ý Đúng/Sai.
- **B — khác câu, cùng ma trận**: mỗi mã đề bốc riêng với cùng số câu ở từng ô (tương đương độ khó), ưu tiên câu ít dùng để các mã đề trùng nhau ít nhất.
- **Mỗi thí sinh một mã đề**: đặt Số mã đề = số thí sinh.
- Duyệt trước khi phát: *Sinh đề nháp* → xem → *Đổi câu* (lấy câu khác cùng ô) / *Khoá* (giữ khi sinh lại) → *Chốt đề* → *Xuất Form*. Hạt giống ngẫu nhiên được lưu nên mọi mã đề tái lập được.

## 6. Ngày thi

1. ④ Thí sinh: dán danh sách `SBD · Họ tên · Lớp · Email` → *Phân ngẫu nhiên*. Ô SBD trên mỗi Form **chỉ chấp nhận SBD được phân mã đề đó**.
2. ⑤ Điều hành: *MỞ THI* đúng giờ → theo dõi số bài nộp (tự làm mới 20 giây) → *ĐÓNG THI* hoặc hẹn giờ tự đóng (*Đóng sau thời gian làm bài*). Form không bật chế độ Quiz nên thí sinh không thấy điểm hay đáp án.
3. ⑥ Chấm điểm: *Thu bài & chấm*. Mỗi thí sinh tính **bài nộp đầu tiên**; cảnh báo: nộp nhiều lần, sai mã đề, họ tên khác danh sách, SBD ngoài danh sách, nộp sau giờ đóng.

## 7. Phúc khảo / sửa đáp án

Tab ⑥ → *Phúc khảo*: `Đổi đáp án` · `Chấp nhận thêm đáp án` · `Tặng điểm` · `Loại câu` (chia lại điểm phần) + lý do → **Chấm lại**.
Đáp án ghi theo **ký hiệu gốc trong ngân hàng**; hệ thống tự quy đổi sang từng mã đề. Mọi điều chỉnh lưu ở sheet `PhucKhao` (bật/tắt được) và `NhatKy`. Đáp án dùng để chấm là bản chụp lúc xuất Form, nên sửa ngân hàng sau khi thi **không** tự làm đổi điểm.

## 8. Dữ liệu để phân tích / Looker Studio (giai đoạn 2)

`KetQua` (1 dòng/thí sinh), `KetQua_Phan` (điểm từng phần), `KetQua_ChuDe` (số câu/đúng theo chủ đề × mức độ) đều ở dạng bảng dài, nối thẳng vào Looker Studio được.

## 9. Lưu ý vận hành & giới hạn

- **Bảo mật:** không chia sẻ file Trung tâm cho thí sinh (sheet `DeThi` chứa đáp án). Form nằm trong thư mục `HeThongThi_DuLieu/KyThi/…` trên Drive của bạn.
- **SEB (chuẩn bị cho giai đoạn 2):** cấu hình SEB cần cho phép `docs.google.com`, `*.gstatic.com`, `*.googleusercontent.com` (ảnh trong Form), thêm `youtube.com` nếu có video. Form không yêu cầu đăng nhập Google nên tránh được việc đăng nhập trong SEB.
- Google Form không hiển thị LaTeX (đã xử lý bằng Unicode + ảnh), không nhúng được file âm thanh (dùng YouTube không công khai hoặc link), và có thể không giữ thụt lề của mã nguồn (đoạn code dài nên chụp ảnh).
- Giới hạn Apps Script: mỗi lần chạy tối đa 6 phút → giao diện xuất/thu bài **từng mã đề một**, nên 50 mã đề vẫn chạy được. Tài khoản Gmail: 100 email/ngày (đủ cho 50 thí sinh ở giai đoạn 2).
- Ảnh công thức dùng dịch vụ CodeCogs (miễn phí cho mục đích phi thương mại). Ảnh đã tạo được lưu đệm trên Drive và nhúng hẳn vào Form, nên lúc thi không phụ thuộc dịch vụ này.

## 10. Cấu trúc mã (cho người bảo trì)

```
src/00_Config.gs        hằng số, tên sheet, cột
src/10–17_Core_*.gs     logic THUẦN (không gọi Google): tiện ích, LaTeX, ngân hàng, ma trận, sinh đề, chấm, dữ liệu mẫu,
                        17 = bộ tách câu hỏi dán vào (dùng chung cho máy chủ và trình duyệt)
src/20_Sheets.gs        đọc/ghi Sheets theo tên cột
src/21_Setup.gs         khởi tạo, tạo file ngân hàng, dữ liệu mẫu
src/22_Repo.gs          truy xuất dữ liệu
src/23_ExamService.gs   kỳ thi, sinh đề, đổi/khoá, chốt, ma trận
src/24_BankEditor.gs    máy chủ của trình Nhập câu hỏi nhanh (lưu, cấp mã, ảnh, dịch, tiến độ)
src/30_FormExport.gs    xuất Google Form
src/31_ExamControl.gs   thí sinh, phân đề, mở/đóng, hẹn giờ
src/32_Grading.gs       thu bài, chấm, tổng hợp, báo cáo, phúc khảo
src/26_Judge.gs         máy chấm code (dùng chung Trung tâm + Phòng thi): Wandbox / Judge0 / Piston, so sánh output, điểm, độ giống code
src/27_LapTrinh.gs      ngân hàng bài lập trình, test, kiểm thử đề, gắn kỳ thi, thu & chấm code, bảng xếp hạng
src/28_DonDep.gs        thống kê dung lượng, dọn nhật ký / bản tự lưu, thu gọn, lưu trữ & xoá kỳ thi, sao lưu, bảo trì tự động
src/40_WebApp.gs        menu, Web App, API cho giao diện
src/Index.html          giao diện bảng điều khiển
src/NhapCau.html        giao diện Nhập câu hỏi nhanh
test/                   kiểm thử: core · e2e · parse · editor (node test/<tên>.test.js) ;
                        giao diện: node test/ui_server.js rồi node test/ui.test.js / ui_nhap.test.js
```
`HeThongThi.gs` là bản gộp tất cả file `src/*.gs` để dán một lần. Có thể dùng [clasp](https://github.com/google/clasp) để đẩy thư mục `src/` lên dự án Apps Script.


---

## Phụ lục: câu hỏi có đoạn code (từ v1.3)

Khi nhập câu hỏi (tab Nhập hàng loạt / nhập từng câu), đặt đoạn code giữa hai dòng chứa ba dấu huyền:

````
Câu 5 (NB): Kết quả của đoạn code là gì?
```python
for i in range(1, 6):
    print(i)
    break
```
A. 1 2 3 4 5 6
B. 0
C. 1
D. 1 2 3 4 5
Đáp án: C
````

- Nội dung trong khối code được giữ nguyên văn (thụt lề, dòng trống, ký tự `$`, `A.`…), không bị đọc nhầm thành lựa chọn hay công thức.
- Trên bảng điều khiển: hiển thị khung nền xám, chữ đều.
- Khi xuất Google Form: mỗi khối code được chèn thành **ảnh** (dùng chung dịch vụ ảnh công thức); nếu không tạo được ảnh, code được chèn dạng chữ thường và có cảnh báo trong báo cáo xuất.


## 11. 🖥 Phòng thi web (từ v1.4) — thay Google Form

Thí sinh làm bài trên trang web riêng: công thức LaTeX hiển thị thật (KaTeX), code có tô màu và giữ thụt lề,
đồng hồ do máy chủ tính, tự lưu bài ~30 giây/lần, chống gian lận, chạy trong Safe Exam Browser.
Ngân hàng, ma trận, sinh đề, trộn đề, chấm điểm, phúc khảo, báo cáo **dùng lại nguyên vẹn**.

### 11.1 Cài đặt (1 lần, ~10 phút) — từ v1.6 phòng thi TỰ CẬP NHẬT
1. Dán `HeThongThi.gs` + `Index.html` + `NhapCau.html` mới vào dự án Apps Script của file Trung tâm (như mọi lần cập nhật).
2. Bảng điều khiển › tab **⑤ Phòng thi web** › mục A › **Tạo file dữ liệu phòng thi** (đã có thì **Kiểm tra / sửa cấu trúc**) →
   hệ thống tạo `PhongThi_DuLieu` và **tự ghi mã phòng thi + trang thí sinh vào sheet `MaNguon`**.
3. Mở `PhongThi_DuLieu` › Tiện ích mở rộng › Apps Script (đây là **dự án riêng**):
   - Xoá hết mã cũ trong `Mã.gs`, dán **Bộ khởi động** `PhongThi/PhongThi.gs` (hoặc nút **📋 Sao chép Bộ khởi động** ở mục A). Xoá tệp `ThiSinh.html` cũ nếu có. Lưu.
   - Lần đầu: Triển khai › Tùy chọn triển khai mới › **Ứng dụng web** › Thực thi: **Tôi** · Truy cập: **Bất kỳ ai** › Triển khai › cấp quyền.
     Đã có triển khai từ bản cũ: Triển khai › **Quản lý triển khai** › ✎ › Phiên bản: **Phiên bản mới** › Triển khai (link giữ nguyên).
   - Sao chép URL `…/exec` dán vào ô **Link phòng thi** › Lưu link › **🔍 Kiểm tra kết nối** phải báo ✓.
4. **Từ nay không phải dán mã phòng thi nữa**: mỗi khi cập nhật hệ thống chính, mã mới được tự đẩy sang phòng thi khi Phát đề / Mở phòng / Kiểm tra
   (hoặc bấm **⟳ Đẩy mã mới**). **▶ MỞ PHÒNG THI** tự gọi thử link phòng thi và **không cho mở** nếu máy thí sinh sẽ chạy mã cũ.

> Vì sao 2 dự án? Web App "Bất kỳ ai" cho phép trình duyệt gọi **mọi** hàm công khai của dự án. Dự án Phòng thi chỉ có
> 2 hàm công khai và **không chứa đáp án**, nên thí sinh có cố gọi gì cũng không lấy được đáp án. Web App quản trị vẫn để "Chỉ mình tôi"
> (thêm nữa, mọi API quản trị đều kiểm tra tài khoản chủ hệ thống).

### 11.2 Quy trình một buổi thi
| Khi nào | Việc |
|---|---|
| Trước buổi thi | ③ Sinh đề › Chốt · ④ Nhập & phân mã đề · ⑤ **Phát đề lên phòng thi** · **In phiếu đăng nhập** · **Tạo file .seb** · In sẵn đề giấy/PDF dự phòng (mục E) |
| Đầu giờ | Phát phiếu đăng nhập, thí sinh mở file .seb (hoặc link) › nhập SBD + mã truy cập › vào phòng chờ · giám thị đọc **mã phòng** (nếu đặt) |
| Bắt đầu | ⑤ **▶ MỞ PHÒNG THI** → thí sinh bấm "Bắt đầu làm bài" (≤ 20 giây) |
| Trong giờ | Bảng giám sát tự làm mới 15 giây: đang làm / mất kết nối / bị khoá / rời màn hình / đã nộp · mở khoá, cộng phút, cho vào lại máy khác, nhắn riêng, thông báo cả phòng, thu bài |
| Hết giờ | Máy thí sinh tự nộp. Bấm **■ ĐÓNG PHÒNG THI** (thí sinh chưa nộp được lấy bản tự lưu mới nhất) |
| Chấm | ⑦ **Thu bài phòng thi web & chấm** → bảng điểm, cảnh báo (rời màn hình, nộp trễ, tự thu, đăng nhập nhiều lần, không dùng SEB) |

### 11.3 Chống gian lận & SEB
- **File .seb** (mục C): mở SEB toàn màn hình thẳng vào phòng thi; chặn chuyển ứng dụng, chụp màn hình, chuột phải, công cụ nhà phát triển,
  màn hình thứ 2, máy ảo. Đặt **mật khẩu thoát** để thí sinh không tự thoát giữa giờ; sau khi nộp có nút "Thoát SEB".
- **Bắt buộc SEB**: chỉ trình duyệt SEB mở từ file .seb của kỳ thi (nhận diện qua chuỗi riêng trong User-Agent) mới đăng nhập được.
  (Apps Script không đọc được header Browser Exam Key, nên đây là mức kiểm tra phía trình duyệt + giám thị quan sát.)
- Ngoài SEB, trang thi tự ghi lại: chuyển tab / rời cửa sổ (kèm số giây), thoát toàn màn hình, cố sao chép/dán, phím chụp màn hình/in.
  Đặt "Khoá bài sau N lần rời màn hình" để bài bị khoá đến khi giám thị mở. Nền trang có hình mờ SBD + họ tên.
- Mỗi thí sinh có mã truy cập riêng; sai 8 lần bị chặn 10 phút. Đăng nhập máy khác sẽ đá phiên cũ (hoặc cần giám thị cho phép).
- Gói đề gửi về máy thí sinh **không có đáp án**; đồng hồ và hạn nộp tính trên máy chủ.

### 11.4 Sức tải (40–50 thí sinh)
- Mỗi thí sinh ~1,5–2 lượt gọi/phút (tự lưu khi có thay đổi, nhịp tim khi không), có dãn cách ngẫu nhiên; bắt đầu và hết giờ cũng được
  dàn đều vài giây. Ghi bài làm bằng `appendRow` (nguyên tử), không khoá toàn cục.
- Mô phỏng 50 thí sinh × 60 phút (`node test/load.test.js`): trung bình < 1 lượt chạy đồng thời, đỉnh lúc hết giờ ≈ 5 — giới hạn của Google là 30/tài khoản.
- Mất mạng: bài vẫn giữ trên máy (bộ nhớ trình duyệt) và tự gửi lại khi có mạng; máy hỏng: đăng nhập máy khác, bài đã lưu được khôi phục.
- Tránh chạy việc nặng (xuất Form, tạo PDF) **trong lúc đang thi** vì dùng chung hạn mức của tài khoản.

### 11.5 Dự phòng sự cố: in đề / PDF / bài giấy
- **🖨 In đề + phiếu trả lời** (mục E hoặc tab ③): mở bản in A4 (công thức KaTeX, code khung đều chữ, phương án tự xếp 1/2/4 cột,
  phiếu trả lời tô tròn ở trang cuối) → Ctrl+P › **Lưu dưới dạng PDF**. Có **In đáp án** riêng cho giáo viên.
- **📄 Lưu PDF lên Drive**: tạo Google Docs (sửa được) + PDF trong thư mục kỳ thi — nên làm trước buổi thi.
- Nếu phải chuyển sang giấy: phát đề đúng mã đề từng thí sinh → thu phiếu → ⑦ **Nhập bài làm trên giấy**
  (`1A 2BD 3ĐSSĐ 4:2-1-3 5=3,14 6-`; bấm "Kiểm tra" xem hệ thống hiểu đúng chưa) → **Chấm lại**. Bài giấy được ưu tiên hơn bài trực tuyến của cùng thí sinh.
- Khi không nộp được, màn hình thí sinh hiện **chuỗi bài làm** dạng trên để giám thị chép lại nhập tay.

### 11.6 Kiểm thử
`node test/web.test.js` (toàn quy trình phòng thi 2 dự án) · `node test/load.test.js` (50 thí sinh) ·
`PORT=8766 node test/ui_server.js` + `node test/ui_web.test.js` (Chrome thật: quản trị + thí sinh + in đề) ·
`PORT=8767 node test/ui_server.js` + `PORT=8767 node test/ui_reset.test.js` (mọi kịch bản làm lại / đình chỉ).
Mã phòng thi nằm ở `phongthi/PhongThi_Core.js` + `phongthi/ThiSinh.html`; `node tools/bundle.js` (tự chạy trong `node build.js`) nhúng chúng vào `src/19_RoomBundle.gs`.

Thi lập trình: `node test/judge.test.js` (máy chấm — chạy python3 / gcc thật qua máy chấm giả lập 3 định dạng Wandbox / Judge0 / Piston) ·
`node test/lt.test.js` (toàn trình: soạn bài → kiểm thử đề → phát đề → chạy thử / nộp code → giám sát → thu bài, tự chấm, code giống nhau → dọn dẹp, lưu trữ, bảo trì) ·
`PORT=8771 node test/ui_server.js` + `PORT=8771 node test/ui_lt.test.js` (trang thí sinh: CodeMirror, chạy thử, nộp, đổi ngôn ngữ, chặn dán) ·
`PORT=8772 node test/ui_server.js` + `PORT=8772 node test/ui_lt_admin.test.js` (tab ⑧ + ⚙). Thử giao diện cần CodeMirror 5 cục bộ: `npm i codemirror@5.65.16` rồi đặt `CM_DIR`.

### 11.7 Điều khiển giám thị (từ v1.5)
| Tình huống | Làm gì |
|---|---|
| Trước giờ thi | Mục D › **Kiểm tra ngay** — liệt kê mọi điểm còn thiếu (link, gói đề, mã truy cập, giờ hẹn đóng, SEB, phiên bản dự án Phòng thi…) |
| Sự cố chung (mất điện, mất mạng cả phòng) | **⏸ Tạm dừng cả phòng** → mọi máy hiện màn "Tạm dừng", đồng hồ đứng, không tính rời màn hình. **▶ Tiếp tục cả phòng** → giờ được bù đúng thời gian dừng, "Hẹn tự đóng" lùi tương ứng |
| Sự cố 1 thí sinh | ⚙ Điều khiển › Tạm dừng / Tiếp tục, Cộng phút, Cho vào lại máy khác, Cho làm tiếp, Làm lại từ đầu, Thu bài, Đình chỉ |
| Muốn xem em đang làm tới đâu | ⚙ Điều khiển › **Bài đang làm**: đáp án đã chọn từng câu, đúng/sai, điểm tạm tính (chỉ giám thị thấy) |
| Sắp hết giờ | **⏱ Hẹn đóng** sau N phút (thông báo cho cả phòng, máy tự nộp đúng giờ) hoặc **⏏ Thu bài cả phòng** |
| Cần biết ngay khi có chuyện | 🔔 Báo động: tiếng bíp + thông báo khi có câu hỏi mới, rời màn hình, mất kết nối, bị khoá; dòng thí sinh được tô vàng |

Độ trễ: bảng giám sát tự làm mới 10 giây; lệnh tới máy thí sinh ≤ ~30 giây (đang khoá / tạm dừng ≤ ~10 giây); mở đề tới phòng chờ ≤ ~15 giây.
Tải lại trang (F5 / nút ⟳ của SEB) vào thẳng bài thi; mở cùng link ở tab khác thì tab cũ bị thay thế (không thể 2 nơi cùng ghi bài).

### 11.8 Có gì mới ở v1.6
- **SEB chặn ứng dụng 4 lớp** (mục C): Windows màn hình làm việc riêng + macOS Assessment Mode bắt buộc · **buộc đóng không hỏi** khoảng 120 ứng dụng theo 7 nhóm
  (trình duyệt, nhắn tin / gọi video, AI, điều khiển từ xa, game, lập trình, nhạc / video) + ô tự thêm · **tắt tiếng tự động** (giữ tiếng nếu đề có câu nghe) ·
  **kiểm tra mã cấu hình SEB** (Config Key qua SEB JavaScript API) so với "máy chuẩn" (📌 trong ⚙ Điều khiển). Bản trước để tên .exe thiếu đuôi và chỉ *hỏi* đóng, nên nhiều ứng dụng còn chạy.
- **Phòng thi tự cập nhật** (Bộ khởi động + sheet `MaNguon`): hết tình trạng sửa mã nhưng phòng thi vẫn chạy bản cũ (nguyên nhân thật của lỗi
  "đã làm lại / thi lại toàn bộ nhưng thí sinh vẫn thấy bài cũ" — máy thí sinh đang chạy trang thi của bản cũ). Kiểm tra trước giờ thi báo:
  bộ khởi động, mã đang chạy, file .seb trỏ đúng link, lượt đăng nhập chạy mã cũ.
- Máy thí sinh luôn hiện **"Đang cập nhật…"** (~1,5 giây) trước khi áp dụng thay đổi của giám thị: tạm dừng / tiếp tục, mở khoá, tin nhắn,
  thu bài, đình chỉ, làm lại / đổi đề; **thanh tải** khi máy chủ trả lời chậm; màn khởi động; giao diện mới (thẻ câu hỏi, lựa chọn, lưới câu).
- ⚙ Điều khiển: **🔀 Đổi đề riêng** cho bất kỳ thí sinh nào, **ô nhắn riêng / trả lời câu hỏi** ngay trong bảng.
- Khoá "nhập sai mã 8 lần" được gỡ ngay khi giám thị thao tác với thí sinh đó (↺ Cho vào lại — **giữ nguyên bài**), không phải làm lại.
- Kiểm thử trình duyệt mới `test/ui_reset.test.js`: thi lại toàn bộ, làm lại khi đang thi, tải lại trang sau làm lại, đình chỉ → làm tiếp / làm lại /
  đổi đề — kể cả khi máy thí sinh còn bài cũ trong bộ nhớ.

### 11.9 Có gì mới ở v1.7
- **Thi lập trình Python · C** (tab ⑧, chi tiết: cẩm nang mục M): ngân hàng bài; trình soạn kiểu HackerRank (đề + xem trước, test mẫu / ẩn có trọng số, nhập nhiều test,
  lời giải mẫu, code khởi tạo, giới hạn thời gian / bộ nhớ, 5 cách so sánh output, chấm từng test / đúng hết); **kiểm thử đề** & sinh output bằng lời giải; thử code.
  Gắn bài vào kỳ thi: điểm, ngôn ngữ cho phép (thí sinh tự chọn), số lần nộp, cao nhất / lần cuối, giãn cách chạy thử, cho chạy thử, tự chấm bản lưu. Kỳ thi chỉ lập trình: ma trận `MT_CHI_LT`.
- Trang thí sinh: đề | khung code CodeMirror (tô màu, thụt lề, ngoặc) | kết quả; chạy thử với ví dụ / input tự nhập, nộp code, chi tiết từng test (dòng khác nhau, stderr, lỗi biên dịch),
  lịch sử nộp, lượt còn lại; code tự lưu; chỉ dán được code chép trong bài thi; tự chờ / thử lại khi máy chấm bận (lượt lỗi máy chấm không tính).
- Máy chấm: Wandbox (mặc định, miễn phí) · Judge0 · Piston; giới hạn CPU / bộ nhớ, đo thời gian & bộ nhớ, sửa số dòng báo lỗi; chấm song song mọi test; hàng đợi ≤ 14 lượt đồng thời.
- Giám sát: điểm code + số lần nộp; lịch sử nộp & code từng lần; **bảng xếp hạng trực tiếp**; thu bài: tự chấm bản lưu, phát hiện code giống nhau (≥ 85%), `DiemLapTrinh` trong `KetQua`.
- **Tab ⚙ Hệ thống**: dung lượng (giới hạn 10 triệu ô), dọn nhật ký, dọn bản tự lưu, thu gọn, **lưu trữ & xoá kỳ thi** (xuất file trong `LuuTru`), sao lưu 1 chạm (giữ N bản),
  **bảo trì tự động hằng tuần**.
- Bộ khởi động phòng thi **v3** (thêm quyền gửi yêu cầu ra ngoài cho máy chấm). Bản v2 vẫn chạy mọi kỳ thi trắc nghiệm; chỉ kỳ thi có bài lập trình mới bắt buộc v3.
- Bài làm dài (code) được tách 2 ô (`TraLoi` + `TraLoi2`) để không vượt giới hạn 50.000 ký tự / ô.

