// KIỂM TRA KỸ MỌI KỊCH BẢN LÀM LẠI trên Chrome thật (trang thí sinh nạp qua bộ khởi động, như thật):
//  thi lại toàn bộ kỳ thi · làm lại 1 em đang làm bài · đình chỉ → làm tiếp / làm lại / đổi đề riêng
//  Có cố ý cài bài cũ vào bộ nhớ trình duyệt thí sinh để chắc chắn không bao giờ hiện lại bài cũ.
const { chromium } = require('playwright');
const shot9 = (p, n) => p.screenshot({ path: __dirname + '/shots/' + n + '.png' });
const BASE = 'http://localhost:' + (process.env.PORT || 8767);
(async () => {
  const browser = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox', '--disable-blink-features=AutomationControlled'] });
  const errors = [], log = (m) => console.log('  ·', m);
  const admin = await browser.newPage({ viewport: { width: 1300, height: 900 } });
  admin.on('pageerror', (e) => errors.push('admin: ' + e.message));
  const idle = async () => { await admin.waitForTimeout(120); await admin.waitForFunction(() => getComputedStyle(document.getElementById('busy')).display === 'none', null, { timeout: 30000 }); };
  const A = (fn, ...args) => admin.evaluate(([fn, args]) => api(fn, ...args), [fn, args]);
  await admin.goto(BASE + '/'); await idle();
  await A('setup'); await A('sample');
  await admin.evaluate(() => { S.examId = 'KT_DEMO'; });
  await A('generate', 'KT_DEMO'); await A('finalize', 'KT_DEMO'); await A('assign', 'KT_DEMO', 'THU_TU');
  await A('ptSetup'); await A('ptSetUrl', 'https://script.google.com/macros/s/AKfycbRESET/exec');
  await A('ptPublish', 'KT_DEMO', {}); await A('ptOpen', 'KT_DEMO');
  const codes = () => admin.request.get(BASE + '/room-codes').then((r) => r.json());
  let c0 = (await codes())[0];

  const stu = await browser.newPage({ viewport: { width: 1300, height: 850 } });
  stu.on('pageerror', (e) => errors.push('thí sinh: ' + e.message));
  const prog = async () => Number(await stu.textContent('#pgN'));
  const login = async (code) => {
    await stu.waitForSelector('#scrLogin.on', { timeout: 15000 });
    await stu.fill('#lgSbd', c0.sbd); await stu.fill('#lgCode', code); await stu.click('#lgBtn');
    await stu.waitForSelector('#scrWait.on, #scrExam.on', { timeout: 15000 });
  };
  const start = async () => {
    if (await stu.isVisible('#scrExam.on')) return;
    for (let i = 0; i < 30 && await stu.isDisabled('#wtStart'); i++) { await stu.check('#wtAgree'); await stu.evaluate(() => pollWait()); await stu.waitForTimeout(400); }
    await stu.click('#wtStart'); await stu.waitForSelector('#scrExam.on', { timeout: 15000 }); await stu.waitForTimeout(300);
  };
  const answer = async (n) => { for (let i = 0; i < n; i++) { await stu.evaluate((i) => go(i), i); if (!(await stu.$('#qcard .opt.on'))) await stu.click('.opt >> nth=0').catch(() => { }); } await stu.evaluate(() => save()); await stu.waitForTimeout(500); };
  const plantStale = () => stu.evaluate((sbd) => {   // giả lập máy thí sinh còn bài cũ trong bộ nhớ (như bản cũ để lại)
    const fake = { ans: { S1: 'A', S2: 'B', S3: 'C', S4: 'D', S5: 'A' }, flags: {}, seq: 999, cur: 4, t: Date.now() };
    const keys = ['0', '1', '2', '3', '123'].map((a) => 'pt:KT_DEMO:' + sbd + ':' + a);
    try { if (S.ky) keys.push(lkey()); } catch (e) { }
    keys.forEach((k) => localStorage.setItem(k, JSON.stringify(fake)));
  }, c0.sbd);
  const reopen = async () => { await stu.goto(BASE + '/thi'); };   // như mở lại file .seb (trang mới)

  log('1. Thi lần đầu: làm 5 câu rồi nộp');
  await stu.goto(BASE + '/thi'); await login(c0.code); await start(); await answer(5);
  if (await prog() !== 5) errors.push('lần đầu: ' + await prog());
  await stu.click('.bar >> text=Nộp bài'); await stu.click('text=Tôi chắc chắn nộp bài'); await stu.waitForSelector('#scrDone.on', { timeout: 15000 });

  log('2. ♻ THI LẠI TOÀN BỘ KỲ THI → mở lại trang (có bài cũ cài sẵn) → đăng nhập mã cũ → phòng chờ → mở → bài phải TRẮNG');
  await A('ptResetExam', 'KT_DEMO', false);
  await plantStale(); await reopen(); await login(c0.code);
  if (!(await stu.isVisible('#scrWait.on'))) errors.push('thi lại toàn bộ: phải về phòng chờ (phòng chưa mở)');
  await A('ptOpen', 'KT_DEMO'); await start();
  if (await prog() !== 0) errors.push('THI LẠI TOÀN BỘ nhưng còn ' + await prog() + ' câu cũ');
  const nav1 = await stu.textContent('#navBox'); if (/\d[A-D]/.test(nav1.replace(/\s/g, ''))) errors.push('lưới câu còn đáp án cũ');

  log('3. Đang làm bài (3 câu) → giám thị ♻ Làm lại từ đầu → máy thí sinh: đang cập nhật → đếm ngược → đăng nhập → bài TRẮNG');
  await answer(3);
  const r3 = await A('ptReset', 'KT_DEMO', [c0.sbd], false);
  await plantStale();
  await stu.evaluate(() => save()); await stu.waitForTimeout(500);
  if (!/đang cập nhật bài thi/i.test(await stu.textContent('#ovBox'))) errors.push('làm lại: không hiện "đang cập nhật"');
  await stu.waitForTimeout(1800);
  if (!/Trở về trang đăng nhập sau/.test(await stu.textContent('#ovBox'))) errors.push('làm lại: không có đếm ngược');
  await stu.click('text=Về trang đăng nhập ngay'); await login(r3.codes[0].code); await start();
  if (await prog() !== 0) errors.push('LÀM LẠI TỪ ĐẦU nhưng còn ' + await prog() + ' câu cũ');

  log('3b. Đang làm bài → làm lại → thí sinh BẤM TẢI LẠI TRANG (bài cũ đúng khoá hiện tại cài sẵn) → đếm ngược → đăng nhập → TRẮNG');
  await answer(2);
  await A('ptReset', 'KT_DEMO', [c0.sbd], false);
  await plantStale(); await stu.reload();
  await stu.waitForFunction(() => /Trở về trang đăng nhập sau/.test(document.getElementById('ovBox').textContent), null, { timeout: 15000 }).catch(() => errors.push('tải lại sau làm lại: không có đếm ngược'));
  await stu.click('text=Về trang đăng nhập ngay'); await login(c0.code); await start();
  if (await prog() !== 0) errors.push('TẢI LẠI sau làm lại nhưng còn ' + await prog() + ' câu cũ');

  log('3c. Thí sinh tải lại trang giữa giờ (không có làm lại) → giữ đúng bài');
  await answer(3); await stu.reload();
  await stu.waitForSelector('#scrExam.on', { timeout: 15000 }).catch(() => errors.push('tải lại giữa giờ: không vào lại bài'));
  await stu.waitForTimeout(400);
  if (await prog() !== 3) errors.push('tải lại giữa giờ: ' + await prog() + '/3 câu');

  log('4. Đình chỉ → gỡ cấm "làm tiếp bài dở" → giữ đúng 4 câu');
  await answer(4);
  await A('ptBan', 'KT_DEMO', [c0.sbd], 'Thử');
  await stu.evaluate(() => save()); await stu.waitForTimeout(2400);
  if (!/Đình chỉ thi/.test(await stu.textContent('#ovBox'))) errors.push('đình chỉ: không hiện màn đình chỉ');
  await A('ptUnban', 'KT_DEMO', [c0.sbd], 'TIEP', { phut: 10 });
  await reopen(); await login(c0.code); await start();
  if (await prog() !== 4) errors.push('LÀM TIẾP nhưng có ' + await prog() + '/4 câu');

  log('5. Đình chỉ → gỡ cấm "làm lại từ đầu" (cài bài cũ) → bài TRẮNG');
  await A('ptBan', 'KT_DEMO', [c0.sbd], 'Thử 2');
  await stu.evaluate(() => save()); await stu.waitForTimeout(2400);
  const u5 = await A('ptUnban', 'KT_DEMO', [c0.sbd], 'LAI', { newCode: true });
  await plantStale(); await reopen(); await login(u5.codes[0].code); await start();
  if (await prog() !== 0) errors.push('GỠ CẤM + LÀM LẠI nhưng còn ' + await prog() + ' câu cũ');

  log('6. Đình chỉ → gỡ cấm "đổi đề riêng" → mã đề mới, bài TRẮNG');
  await answer(2);
  await A('ptBan', 'KT_DEMO', [c0.sbd], 'Thử 3');
  await stu.evaluate(() => save()); await stu.waitForTimeout(2400);
  const u6 = await A('ptUnban', 'KT_DEMO', [c0.sbd], 'DE_MOI', { kieu: 'TRON' });
  await plantStale(); await reopen(); await login(u6.codes[0].code); await start();
  const sub = await stu.textContent('#exSub');
  if (!/-R1/.test(sub)) errors.push('đổi đề riêng: không thấy mã đề mới (' + sub + ')');
  if (await prog() !== 0) errors.push('ĐỔI ĐỀ RIÊNG nhưng còn ' + await prog() + ' câu cũ');

  log('7. Tin nhắn + mở khoá: luôn có màn "đang cập nhật" trước');
  await A('ptCommand', 'KT_DEMO', [c0.sbd], 'TIN', 'Xin chào');
  await stu.evaluate(() => save()); await stu.waitForTimeout(400);
  if (!/đang gửi tin nhắn/.test(await stu.textContent('#ovBox'))) errors.push('tin nhắn: không có "đang cập nhật"');
  await stu.waitForTimeout(1400);
  if (!/Xin chào/.test(await stu.textContent('#ovBox'))) errors.push('tin nhắn: không hiện nội dung');

  log('8. Kỳ thi tính giờ CHUNG đã ĐÓNG (giờ hẹn đóng đã qua) → làm lại 1 em → mở lại → bài trắng, ĐỦ 30 phút');
  await stu.evaluate(() => overlay()).catch(() => { });
  await answer(2);
  await A('ptSettings', 'KT_DEMO', { tinhGio: 'CHUNG' });
  await A('ptClose', 'KT_DEMO');
  const r8 = await A('ptReset', 'KT_DEMO', [c0.sbd], false);
  await admin.request.get(BASE + '/room-codes');   // (không đổi mã)
  const op = await A('ptOpen', 'KT_DEMO');
  await plantStale(); await reopen(); await login(r8.codes[0].code);
  await stu.waitForSelector('#scrExam.on', { timeout: 20000 }).catch(() => errors.push('CHUNG: không tự vào bài'));
  await stu.waitForTimeout(800);
  const tm = (await stu.textContent('#timer')).replace(/\s/g, ''), mins = Number(tm.split(':')[0]);
  if (!(mins >= 28)) errors.push('CHUNG + làm lại: chỉ còn ' + tm + ' (phải ~30 phút)');
  if (await prog() !== 0) errors.push('CHUNG + làm lại: còn ' + await prog() + ' câu cũ');

  log('9. Chế độ nghiêm ngặt: cổng toàn màn hình, thoát → khoá ngay, giám thị nhập mã tại máy → làm tiếp');
  await A('ptSettings', 'KT_DEMO', { nghiemNgat: true, tinhGio: 'RIENG' });
  const code9 = (await A('ptUnlockCode', 'KT_DEMO', false)).code;
  await stu.reload();
  await stu.waitForSelector('#scrExam.on', { timeout: 20000 });
  await stu.waitForTimeout(800);
  const strict = await stu.evaluate(() => S.strict);
  if (!strict) errors.push('nghiêm ngặt: trang thí sinh không bật chế độ');
  await stu.evaluate(() => { if (document.fullscreenElement) document.exitFullscreen(); });
  await stu.waitForTimeout(600);
  await stu.evaluate(() => { if (!S.locked) ev('THOAT_TOAN_MAN'); });
  await stu.waitForTimeout(300);
  if (!(await stu.isVisible('#ulCode'))) errors.push('nghiêm ngặt: không hiện ô mã mở khoá');
  await shot9(stu, 'w11_strict_lock');
  await stu.fill('#ulCode', '999999'); await stu.click('#ulBtn'); await stu.waitForTimeout(1200);
  if (!/không đúng/.test(await stu.textContent('#ulErr'))) errors.push('nghiêm ngặt: mã sai không báo lỗi');
  await stu.fill('#ulCode', code9); await stu.click('#ulBtn'); await stu.waitForTimeout(1500);
  if (await stu.evaluate(() => S.locked)) errors.push('nghiêm ngặt: mã đúng nhưng không mở khoá');
  await stu.evaluate(() => { S.fsFail = 0; if (document.fullscreenElement) document.exitFullscreen(); });
  await stu.waitForTimeout(500); await stu.evaluate(() => { S.locked = false; overlay(); strictGate(); });
  await shot9(stu, 'w12_strict_gate');
  await A('ptSettings', 'KT_DEMO', { nghiemNgat: false });

  await browser.close();
  if (errors.length) { console.log('❌ Kịch bản làm lại lỗi:\n' + errors.join('\n')); process.exit(1); }
  console.log('✅ Mọi kịch bản làm lại / thi lại / đình chỉ / đổi đề đều cho bài TRẮNG đúng (kể cả khi máy còn bài cũ), làm tiếp giữ đúng bài.');
})().catch((e) => { console.error(e); process.exit(1); });
