// Bấm thử trình "Nhập câu hỏi nhanh" bằng Chrome thật (Playwright) trên máy chủ mô phỏng (test/ui_server.js)
const { chromium } = require('playwright');
const path = require('path');
const assert = require('assert');
const BASE = 'http://localhost:8765';

(async () => {
  await fetch(BASE + '/seed-aig', { method: 'POST' });
  const browser = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox', '--disable-blink-features=AutomationControlled'] });
  const page = await browser.newPage({ viewport: { width: 1440, height: 880 } });
  const errors = [];
  page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
  page.on('console', (m) => { if (m.type() === 'error' && !/katex|jsdelivr|ERR_|Failed to load|thumbnail/i.test(m.text())) errors.push('console: ' + m.text()); });
  const shot = (n) => page.screenshot({ path: path.join(__dirname, 'shots', n + '.png') });
  const idle = async () => { await page.waitForTimeout(120); await page.waitForFunction(() => !document.getElementById('dot').classList.contains('busy'), null, { timeout: 15000 }); await page.waitForTimeout(80); };
  const rows = async () => (await fetch(BASE + '/bank-rows')).json();
  const paste = (sel, html, plain) => page.evaluate(([sel, html, plain]) => {
    const dt = new DataTransfer();
    if (html) dt.setData('text/html', html);
    dt.setData('text/plain', plain);
    const el = document.querySelector(sel); el.focus();
    el.dispatchEvent(new ClipboardEvent('paste', { clipboardData: dt, bubbles: true, cancelable: true }));
  }, [sel, html, plain]);
  const step = (t) => console.log('▶', t);

  await page.goto(BASE + '/nhap?mon=AIG');
  await page.waitForFunction(() => document.getElementById('cover').style.display === 'none', null, { timeout: 15000 });
  await idle();
  step('Khởi động: môn AIG, 6 chủ đề, ma trận MT_AIG1');
  assert.strictEqual(await page.inputValue('#mon'), 'AIG');
  assert.strictEqual(await page.$$eval('#topics .topic', (l) => l.length), 6);
  assert.strictEqual(await page.inputValue('#mt'), 'MT_AIG1');
  assert.ok((await page.textContent('#cellBox')).includes('Phần I'));
  await shot('n1_empty');

  step('Dán 1 câu từ web (HTML có KaTeX + đáp án in đậm) → tự tách các ô');
  const html1 = `<p><strong>Câu 5 (TH):</strong> Cho ma trận <span class="katex"><span class="katex-mathml"><math><semantics><mrow></mrow><annotation encoding="application/x-tex">A=\\begin{pmatrix}2&amp;0\\\\0&amp;3\\end{pmatrix}</annotation></semantics></math></span><span class="katex-html">A=…</span></span>. Trị riêng lớn nhất của A là</p>
    <p>A. 0</p><p>B. 2</p><p><b>C. 3</b></p><p>D. 5</p>`;
  await page.click('#topics .topic >> nth=0');
  await paste('#stemVi', html1, 'Câu 5 (TH): Cho ma trận A=… Trị riêng lớn nhất của A là\nA. 0\nB. 2\nC. 3\nD. 5');
  await page.waitForTimeout(400);
  const stem = await page.inputValue('#stemVi');
  assert.strictEqual(stem, 'Cho ma trận $A=\\begin{pmatrix}2&0\\\\0&3\\end{pmatrix}$. Trị riêng lớn nhất của A là');
  assert.deepStrictEqual(await page.$$eval('#opts textarea[data-l="vi"]', (l) => l.map((x) => x.value)), ['0', '2', '3', '5']);
  assert.deepStrictEqual(await page.$$eval('#opts .mk.on', (l) => l.map((x) => x.textContent)), ['C']);
  assert.strictEqual(await page.$eval('#levels .chip.on', (x) => x.dataset.v), 'TH');
  assert.ok((await page.textContent('#nextId')).includes('AIG-C1-001'));
  assert.ok((await page.textContent('#cellBox')).includes('▶'));
  await shot('n2_pasted');

  step('Ctrl+Enter lưu → câu mới, giữ chủ đề & mức');
  await page.keyboard.press('Control+Enter'); await idle();
  let r = await rows();
  assert.strictEqual(r.length, 1);
  assert.deepStrictEqual([r[0].MaCH, r[0].MucDo, r[0].DangCau, r[0].DapAn, r[0].C], ['AIG-C1-001', 'TH', 'MOT_DA', 'C', '3']);
  assert.strictEqual(await page.inputValue('#stemVi'), '');
  assert.strictEqual(await page.$eval('#topics .topic.on', (x) => x.dataset.v), 'AIG-C1');
  assert.ok((await page.textContent('#recent')).includes('AIG-C1-001'));
  assert.ok((await page.textContent('#bankInfo')).includes('1'));

  step('Nhập tay bằng bàn phím: Alt+↓ đổi chủ đề, Alt+1 mức NB, Alt+B chọn đáp án, Tab giữa các ô');
  await page.click('#stemVi');
  await page.keyboard.press('Alt+ArrowDown'); await page.keyboard.press('Alt+Digit1');
  await page.keyboard.type('Đạo hàm của $x^2$ là');
  await page.click('#opts textarea[data-o="0"][data-l="vi"]');
  await page.keyboard.type('$x$'); await page.keyboard.press('Tab'); await page.keyboard.type('$2x$'); await page.keyboard.press('Tab');
  await page.keyboard.type('$x^2$'); await page.keyboard.press('Tab'); await page.keyboard.type('$2$');
  await page.keyboard.press('Alt+KeyB');
  await page.waitForTimeout(300);
  assert.deepStrictEqual(await page.$$eval('#opts .mk.on', (l) => l.map((x) => x.textContent)), ['B']);
  assert.ok((await page.textContent('#pv')).includes('Đạo hàm'));
  await page.keyboard.press('Control+Enter'); await idle();
  r = await rows();
  assert.deepStrictEqual([r[1].MaCH, r[1].MucDo, r[1].DapAn, r[1].A, r[1].B, r[1].C, r[1].D], ['AIG-C2-001', 'NB', 'B', '$x$', '$2x$', '$x^2$', '$2$']);

  step('Báo trùng khi nhập câu gần giống');
  await page.fill('#stemVi', 'Đạo hàm của $x^2$ là gì');
  await page.waitForTimeout(500);
  assert.ok((await page.textContent('#sim')).includes('AIG-C2-001'));
  await page.click('#btnNew');

  step('Dán ảnh từ bộ nhớ tạm → tải lên Drive');
  await page.evaluate(async () => {
    const c = document.createElement('canvas'); c.width = 40; c.height = 20; c.getContext('2d').fillRect(0, 0, 20, 20);
    const blob = await new Promise((res) => c.toBlob(res, 'image/png'));
    const dt = new DataTransfer(); dt.items.add(new File([blob], 'a.png', { type: 'image/png' }));
    document.getElementById('stemVi').focus();
    document.getElementById('stemVi').dispatchEvent(new ClipboardEvent('paste', { clipboardData: dt, bubbles: true, cancelable: true }));
  });
  await page.waitForTimeout(500); await idle();
  assert.strictEqual(await page.$$eval('#thumbs .thumb', (l) => l.length), 1);
  assert.strictEqual(await page.$$eval('#thumbs .up', (l) => l.length), 0);
  await page.click('#thumbs [data-rm]');

  step('Câu Đúng/Sai và Trả lời ngắn');
  await page.click('#dangs .chip[data-v="DUNG_SAI"]');
  await page.fill('#stemVi', 'Xét tính đúng sai:');
  for (const [i, t] of ['E[X+Y]=E[X]+E[Y]', 'Var(2X)=2Var(X)', 'Var(X) ≥ 0', 'E[c]=c'].entries()) await page.fill(`#opts textarea[data-o="${i}"][data-l="vi"]`, t);
  for (const [i, v] of [1, 0, 1, 1].entries()) await page.click(`#opts [data-tf="${i}"][data-v="${v}"]`);
  await shot('n3_dungsai');
  await page.click('#btnSave'); await idle();
  await page.click('#dangs .chip[data-v="TRA_LOI_NGAN"]');
  await page.fill('#stemVi', 'Tính $\\int_0^1 2x\\,dx$');
  await page.fill('#tln', '1');
  await page.click('#levels .chip[data-v="VD"]');
  await page.click('#btnSave'); await idle();
  r = await rows();
  assert.strictEqual(r.length, 4);
  assert.deepStrictEqual([r[2].DangCau, r[2].DapAn, r[3].DangCau, r[3].DapAn], ['DUNG_SAI', 'Đ,S,Đ,Đ', 'TRA_LOI_NGAN', '1']);

  step('Lỗi được báo, không lưu');
  await page.click('#dangs .chip[data-v="MOT_DA"]');
  await page.fill('#stemVi', 'Câu chưa có đáp án');
  await page.fill('#opts textarea[data-o="0"][data-l="vi"]', '1'); await page.fill('#opts textarea[data-o="1"][data-l="vi"]', '2');
  await page.click('#btnSave'); await page.waitForTimeout(300);
  assert.ok((await page.textContent('#msgs')).includes('Chưa chọn đáp án'));
  assert.strictEqual((await rows()).length, 4);
  await page.click('#btnNew');

  step('Dán nhiều câu vào ô Nội dung → tự chuyển sang thẻ Dán nhiều câu');
  const many = `Câu 1 (NB): Thư viện nào dùng để xử lý mảng số trong Python?
A. NumPy
B. Flask
C. Django
D. Requests
Câu 2 (TH): Kết quả của len([1, [2, 3]]) là
A. 1   B. 2   C. 3   D. Lỗi
Câu 3: Các phát biểu sau đúng hay sai?
a) list là kiểu bất biến
b) tuple là kiểu bất biến
c) dict lưu cặp khóa–giá trị
d) set cho phép phần tử trùng
Đáp án: S Đ Đ S
Câu 4 (VD): Which of the following are supervised learning methods?
A. Linear regression
B. K-means
C. Decision tree
D. PCA
Answer: A, C
Câu 5: Câu thiếu đáp án
A. x
B. y
ĐÁP ÁN
1.A 2.B`;
  await page.click('#stemVi');
  await paste('#stemVi', '', many);
  await page.waitForTimeout(600);
  assert.strictEqual(await page.$eval('nav button.on', (x) => x.dataset.tab), 'batch');
  assert.strictEqual(await page.$$eval('#bCards .card', (l) => l.length), 5);
  await page.selectOption('#bTopic', 'AIG-C4');
  await page.waitForTimeout(200);
  assert.ok((await page.textContent('#bSummary')).includes('3 sẵn sàng'), await page.textContent('#bSummary'));
  // câu 3 thiếu mức → chọn; câu 5 thiếu đáp án → bấm lựa chọn A
  await page.selectOption('#bCards .card >> nth=2 >> select[data-bl]', 'TH');
  await page.click('#bCards .card >> nth=4 >> li[data-i="0"]');
  await page.selectOption('#bCards .card >> nth=4 >> select[data-bl]', 'NB');
  await page.waitForTimeout(200);
  assert.ok((await page.textContent('#bSummary')).includes('5 sẵn sàng'), await page.textContent('#bSummary'));
  await shot('n4_batch');
  await page.keyboard.press('Control+Enter'); await idle();
  r = await rows();
  assert.strictEqual(r.length, 9);
  const c4 = r.filter((x) => x.MaChuDe === 'AIG-C4');
  assert.deepStrictEqual(c4.map((x) => x.MaCH), ['AIG-C4-001', 'AIG-C4-002', 'AIG-C4-003', 'AIG-C4-004', 'AIG-C4-005']);
  assert.deepStrictEqual(c4.map((x) => x.DapAn), ['A', 'B', 'S,Đ,Đ,S', 'A,C', 'A']);
  assert.strictEqual(c4[3].NoiDung_EN, 'Which of the following are supervised learning methods?');
  assert.strictEqual(await page.$$eval('#bCards .card', (l) => l.length), 0);

  step('Dịch hàng loạt (giả lập Google Dịch)');
  await page.fill('#bText', 'Câu 1 (NB): Giá trị của $\\pi$ xấp xỉ\nA. 3.14\nB. 2.71\nĐáp án: A');
  await page.waitForTimeout(700);
  await page.click('#bTrans'); await idle();
  assert.ok((await page.textContent('#bCards')).includes('[en]'));
  await page.click('#bCards [data-bedit="0"]');
  assert.strictEqual(await page.$eval('nav button.on', (x) => x.dataset.tab), 'one');
  assert.ok((await page.inputValue('#stemEn')).includes('$\\pi$'));
  await page.click('#topics .topic >> nth=5');
  await page.keyboard.press('Control+Enter'); await idle();
  r = await rows();
  assert.strictEqual(r[r.length - 1].MaCH, 'AIG-C6-001');
  assert.strictEqual(r[r.length - 1].A, '3.14', 'số/công thức không cần dịch');
  assert.ok(r[r.length - 1].NoiDung_EN.startsWith('[en]'));
  assert.strictEqual(await page.$$eval('#bCards .card', (l) => l.length), 0, 'câu đã lưu phải rời danh sách dán');

  step('Danh sách: tìm, xem, sửa, ẩn');
  await page.click('nav button[data-tab="list"]');
  await page.fill('#lQ', 'tuple'); await page.waitForTimeout(350);
  assert.strictEqual(await page.$$eval('#lBody tr', (l) => l.length), 1);
  await page.click('#lBody tr'); await page.waitForTimeout(100);
  await page.click('#lHide'); await idle();
  assert.strictEqual((await rows()).find((x) => x.MaCH === 'AIG-C4-003').TrangThai, 'AN');
  await page.click('#lEdit');
  assert.ok((await page.textContent('#editBanner')).includes('AIG-C4-003'));
  await page.fill('#stemVi', 'Các phát biểu sau về Python đúng hay sai?');
  await page.keyboard.press('Control+Enter'); await idle();
  r = await rows();
  assert.strictEqual(r.length, 10);
  assert.strictEqual(r.find((x) => x.MaCH === 'AIG-C4-003').NoiDung_VI, 'Các phát biểu sau về Python đúng hay sai?');
  assert.strictEqual(r.find((x) => x.MaCH === 'AIG-C4-003').TrangThai, 'AN', 'sửa không được làm mất trạng thái ẩn');
  await page.click('nav button[data-tab="list"]'); await page.fill('#lQ', ''); await page.waitForTimeout(300);
  await page.click('#lBody tr >> nth=0');
  await shot('n5_list');

  step('Tiến độ theo ma trận');
  await page.click('nav button[data-tab="prog"]'); await idle();
  assert.strictEqual(await page.$$eval('#pgBox tbody tr', (l) => l.length), 28);
  assert.ok((await page.textContent('#pgBox')).includes('còn thiếu'));
  await shot('n6_progress');
  await page.click('#pgBox [data-goc="0"]');
  assert.strictEqual(await page.$eval('nav button.on', (x) => x.dataset.tab), 'one');

  step('Câu 10 lựa chọn A–J: dán, Alt+J, nút ＋ thêm bị khoá ở 10');
  await page.click('#btnNew');
  await page.click('#dangs .chip[data-v="NHIEU_DA"]');
  await paste('#stemVi', '', 'Hàm nào tuần hoàn?\nA. sin x\nB. x^2\nC. cos 2x\nD. e^x\nE. tan x\nF. arcsin(sin x)\nG. ln x\nH. |x|\nI. sin x + cos x\nJ. x sin x\nĐáp án: A, C, E, F');
  await page.waitForTimeout(300);
  assert.strictEqual(await page.$$eval('#opts textarea[data-l="vi"]', (l) => l.length), 10);
  assert.ok(await page.$eval('#optAdd', (b) => b.disabled));
  await page.click('#stemVi'); await page.keyboard.press('Alt+KeyI');
  assert.deepStrictEqual(await page.$$eval('#opts .mk.on', (l) => l.map((x) => x.textContent)), ['A', 'C', 'E', 'F', 'I']);
  await page.keyboard.press('Control+Enter'); await idle();
  r = await rows();
  const ten = r[r.length - 1];
  assert.deepStrictEqual([ten.DangCau, ten.DapAn, ten.F, ten.J], ['NHIEU_DA', 'A,C,E,F,I', 'arcsin(sin x)', 'x sin x']);
  await shot('n7_ten_options');

  step('Bản nháp được giữ khi tải lại trang');
  await page.fill('#stemVi', 'Bản nháp chưa lưu');
  await page.waitForTimeout(800);
  await page.reload();
  await page.waitForFunction(() => document.getElementById('cover').style.display === 'none', null, { timeout: 15000 });
  await page.click('#toast button:text("Khôi phục")');
  assert.strictEqual(await page.inputValue('#stemVi'), 'Bản nháp chưa lưu');

  assert.deepStrictEqual(errors, []);
  await browser.close();
  console.log('✅ Giao diện Nhập câu hỏi nhanh: mọi bước đều đạt.');
})().catch((e) => { console.error(e); process.exit(1); });
