// Bấm thử giao diện bằng trình duyệt thật (Playwright) trên máy chủ mô phỏng
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const browser = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox', '--disable-blink-features=AutomationControlled'] });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const errors = [];
  page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
  page.on('console', (m) => { if (m.type() === 'error' && !/katex|jsdelivr|ERR_|Failed to load/i.test(m.text())) errors.push('console: ' + m.text()); });
  const shot = (n) => page.screenshot({ path: path.join(__dirname, 'shots', n + '.png'), fullPage: false });
  const idle = async () => { await page.waitForTimeout(150); await page.waitForFunction(() => getComputedStyle(document.getElementById('busy')).display === 'none', null, { timeout: 20000 }); };
  const yes = async () => { await page.waitForSelector('#modal', { state: 'visible' }); await page.click('#modalYes'); };
  const toastText = () => page.$$eval('#toast .msg', (l) => l.map((x) => x.className + ':' + x.textContent));

  await page.goto('http://localhost:8765/'); await idle();
  await page.click('text=① Khởi tạo hệ thống'); await idle();
  await page.click('text=② Tạo dữ liệu mẫu'); await yes(); await idle(); await page.waitForTimeout(300); await idle();
  await shot('1_home');

  await page.click('nav >> text=① Ngân hàng'); await page.click('text=Tải & kiểm tra ngân hàng'); await idle();
  await shot('2_bank');
  await page.selectOption('#bfD', 'DUNG_SAI'); await page.waitForTimeout(100);
  const nDS = await page.$$eval('#bankList .q', (l) => l.length);
  if (nDS !== 3) errors.push('bank filter DUNG_SAI expected 3, got ' + nDS);

  await page.click('nav >> text=② Ma trận'); await idle();
  await page.selectOption('#mxSel', 'MT_DEMO'); await idle();
  await page.fill('#mxN', '2'); await page.click('#t-matrix button:text-is("Kiểm tra")'); await idle();
  await shot('3_matrix');
  const mxTxt = await page.textContent('#mxCheck');
  if (!/thành công/.test(mxTxt)) errors.push('matrix check: ' + mxTxt.slice(0, 200));

  await page.click('nav >> text=③ Kỳ thi'); await idle();
  await page.click('#btnGen'); await idle(); await page.waitForTimeout(300); await idle();
  await shot('4_variants');
  const nQ = await page.$$eval('#varBox .q', (l) => l.length);
  if (nQ !== 12) errors.push('variant preview expected 12 questions, got ' + nQ);
  // đổi câu đầu tiên
  // (ô ma trận nào đã dùng hết câu thì hệ thống báo "Không còn câu nào khác" — đúng; thử câu kế tiếp)
  for (let qi = 0; qi < 8; qi++) {
    const before = errors.length;
    await page.click('#varBox .q >> nth=' + qi + ' >> text=Đổi câu'); await idle(); await page.waitForTimeout(200); await idle();
    const extra = errors.splice(before);
    if (!extra.length) break;
    if (!extra.every((e) => /Không còn câu nào khác/.test(e))) { errors.push(...extra); break; }
  }
  await page.click('#varBox .q >> nth=1 >> text=Khoá'); await idle(); await page.waitForTimeout(200); await idle();
  await page.click('#btnFin'); await yes(); await idle(); await page.waitForTimeout(300); await idle();

  await page.click('nav >> text=④ Thí sinh'); await idle();
  await page.click('text=🎲 Phân ngẫu nhiên'); await idle(); await page.waitForTimeout(200); await idle();
  await shot('5_students');

  await page.click('nav >> text=③ Kỳ thi'); await idle();
  await page.click('#btnExp'); await yes(); await idle(); await page.waitForTimeout(500); await idle(); await page.waitForTimeout(500); await idle();
  const exTxt = await page.textContent('#exMsg');
  if (!/✔ Mã 101/.test(exTxt) || !/✔ Mã 102/.test(exTxt)) errors.push('export: ' + exTxt);

  await page.click('nav >> text=⑥ Thi bằng Google Form'); await idle();
  await page.click('text=▶ MỞ THI'); await yes(); await idle(); await page.waitForTimeout(300); await idle();
  await page.evaluate(() => fetch('/submit', { method: 'POST' }));
  await page.click('#t-run >> text=⟳ Làm mới'); await idle();
  await shot('6_run');
  const runTxt = await page.textContent('#runBox');
  if (!/5\/6/.test(runTxt)) errors.push('monitor expected 5/6: ' + runTxt.slice(0, 300));
  await page.click('text=■ ĐÓNG THI'); await yes(); await idle(); await page.waitForTimeout(300); await idle();

  await page.click('nav >> text=⑦ Chấm điểm'); await idle();
  await page.click('text=📥 Thu bài từ Form & chấm'); await idle(); await page.waitForTimeout(800); await idle(); await page.waitForTimeout(500); await idle();
  await shot('7_grade');
  const grTxt = await page.textContent('#grBox');
  if (!/Bảng điểm/.test(grTxt)) errors.push('report not rendered');
  // phúc khảo
  await page.fill('#pkR', 'Thử phúc khảo'); await page.selectOption('#pkA', 'TANG_DIEM'); await page.click('text=+ Thêm điều chỉnh'); await idle(); await page.waitForTimeout(300); await idle();
  await page.click('text=↻ Chấm lại'); await idle(); await page.waitForTimeout(500); await idle();
  await page.evaluate(() => window.scrollTo(0, 900));
  await shot('8_review');
  const t = await toastText();
  // "Không còn câu nào khác cùng ô" là phản hồi ĐÚNG khi ngân hàng mẫu (nhỏ) hết câu thay thế cho ô ma trận đó
  const errToasts = t.filter((x) => x.includes('err') && !/Không còn câu nào khác cùng ô/.test(x));
  if (errToasts.length) errors.push('error toasts: ' + errToasts.join(' | '));
  await browser.close();
  if (errors.length) { console.log('❌ UI lỗi:\n' + errors.join('\n')); process.exit(1); }
  console.log('✅ Giao diện: bấm thử toàn bộ quy trình không lỗi.');
})().catch((e) => { console.error(e); process.exit(1); });
