// Bấm thử PHÒNG THI WEB bằng Chrome thật: tab quản trị ⑤ + trang thí sinh (đăng nhập → làm bài → nộp) + giám sát + thu bài
const { chromium } = require('playwright');
const path = require('path');
const BASE = 'http://localhost:' + (process.env.PORT || 8766);
(async () => {
  const browser = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox', '--disable-blink-features=AutomationControlled'] });
  const errors = [];
  const watch = (p, tag) => {
    p.on('pageerror', (e) => errors.push(tag + ' pageerror: ' + e.message));
    p.on('console', (m) => { if (m.type() === 'error' && !/katex|jsdelivr|fonts|ERR_|Failed to load/i.test(m.text())) errors.push(tag + ' console: ' + m.text()); });
  };
  const admin = await browser.newPage({ viewport: { width: 1440, height: 950 } }); watch(admin, 'admin');
  const shot = (p, n) => p.screenshot({ path: path.join(__dirname, 'shots', n + '.png') });
  const idle = async (p) => { p = p || admin; await p.waitForTimeout(150); await p.waitForFunction(() => getComputedStyle(document.getElementById('busy')).display === 'none', null, { timeout: 20000 }); };
  const yes = async () => { await admin.waitForSelector('#modal', { state: 'visible' }); await admin.click('#modalYes'); };

  await admin.goto(BASE + '/'); await idle();
  await admin.click('text=① Khởi tạo hệ thống'); await idle();
  await admin.click('text=② Tạo dữ liệu mẫu'); await yes(); await idle(); await admin.waitForTimeout(300); await idle();
  await admin.click('nav >> text=③ Kỳ thi'); await idle();
  await admin.click('#btnGen'); await idle(); await admin.waitForTimeout(300); await idle();
  await admin.click('#btnFin'); await yes(); await idle(); await admin.waitForTimeout(300); await idle();
  await admin.click('nav >> text=④ Thí sinh'); await idle();
  await admin.click('text=🎲 Phân ngẫu nhiên'); await idle(); await admin.waitForTimeout(200); await idle();

  await admin.click('nav >> text=⑤ Phòng thi web'); await idle(); await admin.waitForTimeout(300); await idle();
  await admin.click('text=Tạo file dữ liệu phòng thi'); await idle(); await admin.waitForTimeout(300); await idle();
  await admin.fill('#ptUrl', 'https://script.google.com/macros/s/AKfycbUITEST/exec'); await admin.click('text=Lưu link'); await idle(); await admin.waitForTimeout(300); await idle();
  await admin.click('text=🔍 Kiểm tra kết nối'); await idle(); await admin.waitForTimeout(300);
  const conn = await admin.textContent('#ptConnStep');
  if (!/Bộ khởi động v3/.test(conn) || !/mới nhất/.test(conn)) errors.push('mục A bước 4 không báo kết nối đúng: ' + conn);
  await admin.click('text=⟳ Đẩy mã mới'); await idle(); await admin.waitForTimeout(300); await idle();
  if (!/✓/.test(await admin.textContent('#ptConnStep'))) errors.push('sau khi đẩy mã: không có ✓');
  await admin.fill('#ptMaxVp', '3'); await admin.fill('#ptRoom', 'P203');
  // bài kiểm thử luồng thi: Playwright điền đáp án bằng lệnh (không có phím/chuột thật) → để chế độ «chỉ báo cáo» rồi kiểm tra giám sát có ghi nhận
  if (await admin.inputValue('#ptChongAI') !== 'KHOA') errors.push('mặc định chống tác tử AI phải là KHOA');
  await admin.selectOption('#ptChongAI', 'BAO');
  await admin.click('text=📤 Phát đề lên phòng thi'); await yes(); await idle(); await admin.waitForTimeout(400); await idle();
  await admin.fill('#brTen', 'CLB Trí tuệ nhân tạo AIG'); await admin.fill('#brKhau', 'Học thật, thi thật');
  await admin.evaluate((l) => { S.brand = Object.assign(S.brand || {}, { logo: l }); $('brMau').value = '#1F3A93'; brPreview(); }, 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA2NCA2NCI+PHJlY3Qgd2lkdGg9IjY0IiBoZWlnaHQ9IjY0IiByeD0iMTQiIGZpbGw9IiMxRjNBOTMiLz48cGF0aCBkPSJNMTQgNDYgTDMyIDE0IEw1MCA0NiBaIiBmaWxsPSJub25lIiBzdHJva2U9IiNGMkMxNEUiIHN0cm9rZS13aWR0aD0iNSIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIvPjxjaXJjbGUgY3g9IjMyIiBjeT0iMzYiIHI9IjUiIGZpbGw9IiNmZmYiLz48L3N2Zz4=');
  await admin.click('text=💾 Lưu nhận diện'); await idle(); await admin.waitForTimeout(200);
  await admin.locator('#brPrev').scrollIntoViewIfNeeded(); await shot(admin, 'w1d_brand');
  await admin.waitForFunction(() => document.querySelectorAll('#ptAppGroups input').length === 8, null, { timeout: 10000 }).catch(() => errors.push('thiếu 8 nhóm ứng dụng chặn'));
  await admin.uncheck('#ptAppGroups input[value="GAME"]'); await admin.fill('#ptExtraApps', 'Notion.exe');
  await admin.click('text=⬇ Tạo & tải file .seb'); await idle(); await admin.waitForTimeout(300);
  const sm = await admin.textContent('#ptSebMsg');
  if (!/Lớp 1/.test(sm) || !/buộc đóng ngay/.test(sm) || !/7 nhóm/.test(sm) || !/tắt tiếng/.test(sm)) errors.push('thông báo .seb 4 lớp sai: ' + sm.slice(0, 300));
  await admin.locator('#ptAppGroups').scrollIntoViewIfNeeded(); await shot(admin, 'w1c_seb');
  const pubTxt = await admin.textContent('#ptPubMsg');
  if (!/Đã phát 2 mã đề cho 6 thí sinh/.test(pubTxt)) errors.push('publish: ' + pubTxt);
  await shot(admin, 'w1_admin_setup');

  // ---- trang thí sinh ----
  const codes = await (await admin.request.get(BASE + '/room-codes')).json();
  const keys = await (await admin.request.get(BASE + '/room-answers')).json();
  const stu = await browser.newPage({ viewport: { width: 1366, height: 860 } }); watch(stu, 'thi');
  await stu.goto(BASE + '/thi'); await stu.waitForTimeout(600);
  await shot(stu, 'w2_login');
  const c0 = codes[0];
  await stu.fill('#lgSbd', c0.sbd); await stu.fill('#lgCode', 'SAIMA1'); await stu.click('#lgBtn'); await stu.waitForTimeout(500);
  const e1 = await stu.textContent('#lgErr'); if (!/Mã phòng|Mã truy cập/.test(e1)) errors.push('wrong login msg: ' + e1);
  await stu.fill('#lgCode', c0.code); await stu.fill('#lgRoom', 'P203'); await stu.click('#lgBtn');
  await stu.waitForSelector('#scrWait.on', { timeout: 8000 });
  await stu.check('#wtAgree');
  if (!(await stu.isDisabled('#wtStart'))) errors.push('start enabled before open');
  await shot(stu, 'w3_wait');

  await admin.click('text=▶ MỞ PHÒNG THI'); await yes(); await idle(); await admin.waitForTimeout(400); await idle();
  await stu.evaluate(() => pollWait()); await stu.waitForTimeout(800);
  await stu.click('#wtStart'); await stu.waitForSelector('#scrExam.on', { timeout: 10000 });
  await stu.waitForTimeout(400);
  await shot(stu, 'w4_exam');
  // trả lời đúng mọi câu
  const mine = keys.filter((k) => String(k.md) === String(c0.md)).sort((a, b) => a.stt - b.stt);
  for (let i = 0; i < mine.length; i++) {
    const k = mine[i];
    await stu.evaluate((i) => go(i), i); await stu.waitForTimeout(60);
    if (k.dang === 'MOT_DA') await stu.click('.opt >> nth=' + 'ABCDEFGHIJ'.indexOf(k.key));
    if (k.dang === 'NHIEU_DA') for (const L of k.key.split(',')) await stu.click('.opt >> nth=' + 'ABCDEFGHIJ'.indexOf(L));
    if (k.dang === 'DUNG_SAI') { const arr = k.key.split(','); for (let j = 0; j < arr.length; j++) await stu.click('table.ds tr >> nth=' + j + ' >> button.' + (arr[j] === 'Đ' ? 't' : 'f')); }
    if (k.dang === 'GHEP_NOI') { const arr = k.key.split(','); for (let j = 0; j < arr.length; j++) await stu.selectOption('.match select >> nth=' + j, arr[j].split('-')[1]); }
    if (k.dang === 'TRA_LOI_NGAN') { await stu.fill('.short input', k.key.split('|')[0].trim()); await stu.waitForTimeout(350); }
    if (i === 1) await stu.click('.flagbtn');
    if (i === 3) await shot(stu, 'w5_question');
    if (i === 3) { await stu.evaluate(() => toggleDark()); await stu.waitForTimeout(250); await shot(stu, 'w5b_dark'); await stu.evaluate(() => toggleDark()); }
  }
  const prog = await stu.textContent('#pgN'); if (Number(prog) !== mine.length) errors.push('progress ' + prog + '/' + mine.length);
  // tải lại trang giữa giờ (nút ⟳ của SEB) — xoá bộ nhớ trình duyệt như WebKit/SEB để chắc chắn khôi phục qua địa chỉ trang + máy chủ
  await stu.evaluate(() => save()); await stu.waitForTimeout(400);
  await stu.evaluate(() => { localStorage.clear(); S.phase = 'x'; }); await stu.reload();
  await stu.waitForSelector('#scrExam.on', { timeout: 10000 }).catch(() => errors.push('reload: không vào lại bài thi (về trang ' + 'đăng nhập)'));
  await stu.waitForTimeout(300);
  const prog2 = await stu.textContent('#pgN'); if (Number(prog2) !== mine.length) errors.push('reload: mất bài ' + prog2 + '/' + mine.length);
  // giả lập rời màn hình 1 lần + tự lưu
  await stu.evaluate(() => { ev('ROI_TAB', 7); return save(); }); await stu.waitForTimeout(500);
  const sv = await stu.textContent('#svText'); if (!/Đã lưu/.test(sv)) errors.push('save status: ' + sv);

  // hỏi giám thị ngay trong trang thi
  await stu.click('.bar >> text=💬 Hỏi giám thị'); await stu.fill('#askT', 'Câu 3 hình mờ ạ'); await stu.click('#askB'); await stu.waitForTimeout(500);
  if (await stu.isVisible('#askT')) errors.push('ask overlay still open');
  // giám sát
  await admin.click('#t-web >> text=⟳ Làm mới'); await idle();
  if (!/Câu 3 hình mờ ạ/.test(await admin.textContent('#ptMon'))) errors.push('question not shown on monitor');
  await admin.evaluate(() => document.getElementById('ptMon').scrollIntoView());
  await shot(admin, 'w6_monitor');
  const monTxt = await admin.textContent('#ptMon');
  if (!/Đang làm/.test(monTxt)) errors.push('monitor: no "Đang làm"');
  if (!/🤖/.test(monTxt)) errors.push('monitor: chế độ BAO phải hiện nhãn 🤖 nghi tác tử AI');

  // bảng điều khiển thí sinh + kiểm tra trước giờ thi
  await admin.click('text=Kiểm tra ngay'); await admin.waitForTimeout(600);
  if (!/✔/.test(await admin.textContent('#ptCheckList'))) errors.push('checklist trống');
  await admin.click('#ptMon >> text=⚙ Điều khiển >> nth=0'); await idle(); await admin.waitForTimeout(300);
  const panel = await admin.textContent('#modalText');
  if (!/Bài đang làm/.test(panel) || !/tạm tính/.test(panel)) errors.push('panel thiếu bài đang làm');
  if (!/Đổi đề riêng/.test(panel)) errors.push('panel thiếu nút Đổi đề riêng');
  await shot(admin, 'w6b_panel');
  await admin.fill('#pnMsg', 'Em kiểm tra lại câu 3'); await admin.press('#pnMsg', 'Enter'); await idle(); await admin.waitForTimeout(200);
  await admin.click('#modalYes');
  await stu.evaluate(() => save()); await stu.waitForTimeout(1900);
  if (!/Em kiểm tra lại câu 3/.test(await stu.textContent('#ovBox'))) errors.push('tin nhắn từ bảng điều khiển không tới thí sinh');
  await stu.evaluate(() => overlay()).catch(() => { });
  // tạm dừng cả phòng → máy thí sinh hiện màn Tạm dừng, không chọn được đáp án; tiếp tục → bình thường
  await admin.evaluate(() => api('ptPause', S.examId, [], true));
  await stu.evaluate(() => save()); await stu.waitForTimeout(500);
  if (!/Giám thị đang tạm dừng/.test(await stu.textContent('#ovBox'))) errors.push('không hiện màn "đang cập nhật" trước khi tạm dừng');
  await shot(stu, 'w6d_updating');
  await stu.waitForTimeout(1600);
  if (!/tạm dừng/i.test(await stu.textContent('#ovBox'))) errors.push('không hiện màn tạm dừng');
  if (!/⏸/.test(await stu.textContent('#timer'))) errors.push('đồng hồ không dừng');
  await shot(stu, 'w6c_paused');
  await admin.evaluate(() => api('ptPause', S.examId, [], false));
  await stu.evaluate(() => save()); await stu.waitForTimeout(2200);
  if (!(await stu.isHidden('#ov'))) errors.push('màn tạm dừng không tự đóng');
  // tin nhắn khi đang bị khoá: đóng tin nhắn phải hiện lại màn khoá (lỗi "kẹt" cũ)
  await stu.evaluate(() => { lockScreen(); overlayMsg('Chú ý'); }); await stu.click('text=Đã hiểu'); await stu.waitForTimeout(100);
  if (!/tạm khoá/.test(await stu.textContent('#ovBox')) || await stu.isHidden('#ov')) errors.push('đóng tin nhắn làm mất màn khoá');
  await stu.evaluate(() => { S.locked = false; overlay(); });
  // (trình duyệt thử nghiệm chuyển tập trung sang trang giám thị → máy thí sinh rời toàn màn hình) → bật lại toàn màn hình như thí sinh thật
  if (await stu.isVisible('#gate')) { await stu.click('#gate button'); await stu.waitForTimeout(400); }
  // nộp bài
  await stu.click('.bar >> text=Nộp bài'); await stu.waitForTimeout(200);
  await shot(stu, 'w7_confirm');
  await stu.click('text=Tôi chắc chắn nộp bài'); await stu.waitForSelector('#scrDone.on', { timeout: 10000 });
  await shot(stu, 'w8_done');
  const rc = await stu.textContent('.rc'); if (!/^[0-9A-F]{4}-[0-9A-F]{4}$/.test(rc.trim())) errors.push('receipt: ' + rc);

  // ♻ Làm lại từ đầu + mã mới → thí sinh mở lại trang, đăng nhập mã mới → bài phải TRẮNG (lỗi người dùng báo)
  const rs = await admin.evaluate((sbd) => api('ptReset', S.examId, [sbd], true), c0.sbd);
  const newCode = rs.codes[0].code;
  await stu.reload(); await stu.waitForSelector('#scrLogin.on', { timeout: 8000 });
  await stu.fill('#lgSbd', c0.sbd); await stu.fill('#lgCode', newCode); await stu.fill('#lgRoom', 'P203'); await stu.click('#lgBtn');
  await stu.waitForSelector('#scrWait.on', { timeout: 8000 }); await stu.check('#wtAgree'); await stu.click('#wtStart');
  await stu.waitForSelector('#scrExam.on', { timeout: 10000 }); await stu.waitForTimeout(300);
  const p3 = await stu.textContent('#pgN'); if (Number(p3) !== 0) errors.push('làm lại từ đầu nhưng vẫn còn ' + p3 + ' câu cũ');
  await stu.click('.opt >> nth=0'); await stu.evaluate(() => save()); await stu.waitForTimeout(400);
  // ⛔ đình chỉ → máy thí sinh bị đẩy ra
  await admin.evaluate((sbd) => api('ptBan', S.examId, [sbd], 'Thử đình chỉ'), c0.sbd);
  await stu.evaluate(() => save()); await stu.waitForTimeout(500);
  if (!/đang cập nhật trạng thái/.test(await stu.textContent('#ovBox'))) errors.push('không hiện "đang cập nhật" trước khi đình chỉ');
  await stu.waitForTimeout(2000);
  if (!/Đình chỉ thi/.test(await stu.textContent('#ovBox'))) errors.push('không hiện màn hình đình chỉ');
  await shot(stu, 'w8b_banned');
  await admin.evaluate((sbd) => api('ptUnban', S.examId, [sbd], 'TIEP', { phut: 10 }), c0.sbd);

  // đóng & thu bài
  await admin.click('text=■ ĐÓNG PHÒNG THI'); await yes(); await idle(); await admin.waitForTimeout(300); await idle();
  await admin.click('nav >> text=⑦ Chấm điểm'); await idle(); await admin.waitForTimeout(300); await idle();
  await admin.click('text=📥 Thu bài phòng thi web & chấm'); await idle(); await admin.waitForTimeout(600); await idle(); await admin.waitForTimeout(400); await idle();
  const grTxt = await admin.textContent('#grBox');
  if (!new RegExp(c0.sbd).test(grTxt)) errors.push('grade table missing ' + c0.sbd);
  const row = await admin.$eval('#rsT', (el, sbd) => [...el.querySelectorAll('tr')].map((r) => r.textContent).find((t) => t.startsWith(sbd)) || '', c0.sbd);
  if (!/Không bấm nộp/.test(row)) errors.push('score row (bài làm lại, tự thu): ' + row);
  // bài giấy
  await admin.fill('#mnSbd', codes[1].sbd); await admin.fill('#mnText', '1A 2B'); await admin.click('#t-grade >> text=Kiểm tra'); await idle();
  await shot(admin, 'w9_grade');

  // bản in (cửa sổ mới)
  const [pp] = await Promise.all([admin.context().waitForEvent('page'), admin.evaluate(() => printExam('', 'de'))]);
  await pp.waitForLoadState(); await pp.waitForTimeout(500);
  const ptxt = await pp.textContent('body');
  if (!/PHIẾU TRẢ LỜI/.test(ptxt) || !/Mã đề/.test(ptxt)) errors.push('print page incomplete');
  await pp.setViewportSize({ width: 900, height: 1200 }); await pp.screenshot({ path: path.join(__dirname, 'shots', 'w10_print.png') });

  await browser.close();
  if (errors.length) { console.log('❌ UI phòng thi lỗi:\n' + errors.join('\n')); process.exit(1); }
  console.log('✅ Giao diện phòng thi web: quản trị + thí sinh + in đề chạy thông.');
})().catch((e) => { console.error(e); process.exit(1); });
