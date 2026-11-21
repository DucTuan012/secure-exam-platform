// Kiểm soát rời màn hình trong lúc TẠM DỪNG / KHOÁ / ĐÌNH CHỈ + chặn chụp màn hình (Chrome thật, chế độ thường — không nghiêm ngặt)
const { chromium } = require('playwright');
const PORT = process.env.PORT || 8795, BASE = 'http://localhost:' + PORT;
(async () => {
  const errors = [], ok = (c, m) => { if (!c) errors.push(m); };
  await fetch(BASE + '/seed-lt', { method: 'POST' });
  const codes = await fetch(BASE + '/room-codes').then((r) => r.json());
  const admin = async (n, ...a) => { const r = await fetch(BASE + '/api', { method: 'POST', body: JSON.stringify({ fn: 'API_call', args: [n, a] }) }).then((x) => x.json()); const d = typeof r === 'string' ? JSON.parse(r) : r.ok !== undefined && r.data !== undefined && typeof r.data === 'string' ? JSON.parse(r.data) : r; if (!d.ok) throw new Error(n + ': ' + d.error); return d.data; };
  const browser = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox', '--disable-blink-features=AutomationControlled'] });
  await admin('ptSettings', 'KT_DEMO', { chongAI: 'KHOA' });
  const login = async (me) => {
    const p = await browser.newPage({ viewport: { width: 1300, height: 850 } });
    await p.route(/katex|fonts\.|jsdelivr/, (r) => r.abort());
    p.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
    await p.goto(BASE + '/thi');
    await p.fill('#lgSbd', me.sbd); await p.fill('#lgCode', me.code); await p.click('#lgBtn');
    await p.waitForSelector('#wtAgree', { timeout: 15000 }); await p.check('#wtAgree');
    await p.waitForFunction(() => !document.getElementById('wtStart').disabled, null, { timeout: 15000 });
    await p.click('#wtStart'); await p.waitForSelector('#scrExam.on', { timeout: 20000 }); await p.waitForTimeout(400);
    return p;
  };
  const st = (p) => p.evaluate(() => ({ fs: !!document.fullscreenElement, paused: !!S.paused, locked: !!S.locked, vp: S.vpLocal, ev: S.ev.map((e) => e.k).join(','),
    gate: !document.getElementById('gate').classList.contains('hidden'), shield: document.body.classList.contains('shield') }));
  const sync = async (p) => { await p.evaluate(() => save()); await p.waitForTimeout(2600); };

  // ---- 1. tạm dừng → thoát toàn màn hình → quá 4 giây → KHOÁ bài (cả chế độ thường) → tiếp tục vẫn khoá → mở khoá → phải bật lại toàn màn hình
  const A = codes[0], p = await login(A);
  ok((await st(p)).fs, 'đang toàn màn hình');
  await admin('ptPause', 'KT_DEMO', [A.sbd], true); await sync(p);
  ok((await st(p)).paused, 'đã tạm dừng');
  await p.evaluate(() => document.exitFullscreen()); await p.waitForTimeout(5000);
  let s = await st(p);
  ok(s.locked && s.vp >= 1, 'thoát toàn màn hình lúc tạm dừng → khoá bài: ' + JSON.stringify(s));
  ok(/trong lúc tạm dừng/.test(await p.evaluate(() => S.lockWhy || '')), 'lý do khoá ghi rõ "trong lúc tạm dừng"');
  await p.waitForTimeout(400);
  ok(await p.evaluate(() => /blur/.test(getComputedStyle(document.querySelector('#scrExam .layout')).filter)), 'đề phía sau bị làm mờ khi khoá');
  await p.screenshot({ path: require('path').join(__dirname, 'shots', 'g1_locked_blur.png') });
  await admin('ptPause', 'KT_DEMO', [A.sbd], false); await sync(p);
  s = await st(p); ok(!s.paused && s.locked, 'bỏ tạm dừng nhưng vẫn khoá: ' + JSON.stringify(s));
  await admin('ptCommand', 'KT_DEMO', [A.sbd], 'MO_KHOA'); await sync(p); await p.waitForTimeout(3000);
  s = await st(p); ok(!s.locked && s.gate && !s.fs, 'mở khoá → phải bật lại toàn màn hình mới thấy đề: ' + JSON.stringify(s));
  ok(await p.evaluate(() => /blur/.test(getComputedStyle(document.querySelector('#scrExam .layout')).filter)), 'màn bắt toàn màn hình cũng làm mờ đề');
  await p.screenshot({ path: require('path').join(__dirname, 'shots', 'g2_gate_blur.png') });
  await p.click('#gate button'); await p.waitForTimeout(600);
  ok(await p.evaluate(() => getComputedStyle(document.querySelector('#scrExam .layout')).filter === 'none'), 'vào lại toàn màn hình → đề rõ lại');
  // rời tab lúc tạm dừng cũng khoá
  await admin('ptPause', 'KT_DEMO', [A.sbd], true); await sync(p);
  await p.evaluate(() => { window.dispatchEvent(new Event('blur')); }); await p.waitForTimeout(1300);
  await p.evaluate(() => { Object.defineProperty(document, 'hasFocus', { value: () => true, configurable: true }); window.dispatchEvent(new Event('focus')); });
  s = await st(p); ok(s.locked && /ROI_CUA_SO/.test(s.ev) === false || s.locked, 'chuyển cửa sổ lúc tạm dừng → khoá: ' + JSON.stringify(s));
  await admin('ptPause', 'KT_DEMO', [A.sbd], false); await admin('ptCommand', 'KT_DEMO', [A.sbd], 'MO_KHOA'); await sync(p); await p.waitForTimeout(3000);
  await p.close();

  // ---- 2. chụp màn hình: chạm phím Windows → che đề ngay; mở công cụ chụp (mất tập trung) → khoá; PrintScreen → khoá
  const B = codes[1], q = await login(B);
  // tín hiệu nhanh: gửi tin nhắn, KHÔNG gọi save() thủ công → tin phải tới trong ≤ 20 giây (trước đây chờ nhịp lưu 20–30 giây)
  await q.waitForTimeout(4500);
  const t0 = Date.now(); await admin('ptCommand', 'KT_DEMO', [B.sbd], 'TIN', 'Kiểm tra tín hiệu nhanh');
  await q.waitForFunction(() => /Kiểm tra tín hiệu nhanh/.test(document.getElementById('ovBox').textContent), null, { timeout: 25000 }).catch(() => { });
  const dt = (Date.now() - t0) / 1000;
  ok(/Kiểm tra tín hiệu nhanh/.test(await q.textContent('#ovBox')) && dt < 20, 'lệnh tới nhanh: ' + dt.toFixed(1) + ' giây');
  console.log('Tin nhắn tới máy thí sinh sau ' + dt.toFixed(1) + ' giây');
  await q.evaluate(() => overlay());
  await q.keyboard.down('Meta');
  s = await st(q); ok(s.shield, 'chạm phím Windows → che đề ngay');
  ok(await q.evaluate(() => getComputedStyle(document.querySelector('#scrExam .layout')).visibility === 'hidden'), 'đề bị ẩn');
  await q.evaluate(() => window.dispatchEvent(new Event('blur')));
  await q.keyboard.up('Meta'); await q.waitForTimeout(300);
  s = await st(q); ok(s.locked && s.vp >= 1, 'Win + công cụ chụp → khoá bài: ' + JSON.stringify(s));
  await admin('ptCommand', 'KT_DEMO', [B.sbd], 'MO_KHOA'); await sync(q); await q.waitForTimeout(3000);
  ok(!(await st(q)).locked, 'mở khoá được');
  await q.evaluate(() => { S.prtAt = 0; document.dispatchEvent(new KeyboardEvent('keyup', { key: 'PrintScreen', code: 'PrintScreen', bubbles: true })); });
  s = await st(q); ok(s.locked, 'phím PrintScreen → khoá bài: ' + JSON.stringify(s));
  await q.close();

  // ---- 3. đình chỉ: rời màn hình lúc bị đình chỉ vẫn được ghi; cho thi tiếp → nhật ký có sự kiện DC_
  const C = codes[2], r = await login(C);
  await admin('ptBan', 'KT_DEMO', [C.sbd], 'Thử đình chỉ'); await sync(r); await r.waitForTimeout(2500);
  ok(await r.evaluate(() => S.phase === 'banned'), 'đã bị đình chỉ');
  await r.evaluate(() => document.exitFullscreen().catch(() => { })); await r.waitForTimeout(600);
  const held = await r.evaluate((k) => JSON.parse(localStorage.getItem(k) || '[]'), 'pt:dc:KT_DEMO:' + C.sbd);
  ok(held.some((x) => x.k === 'DC_THOAT_TOAN_MAN'), 'ghi lại thoát toàn màn hình lúc bị đình chỉ: ' + JSON.stringify(held));
  await admin('ptUnban', 'KT_DEMO', [C.sbd], 'TIEP', { phut: 10 });
  await r.goto(BASE + '/thi'); await r.waitForTimeout(1500);
  const c2 = (await fetch(BASE + '/room-codes').then((x) => x.json())).find((x) => x.sbd === C.sbd);
  if (await r.isVisible('#lgSbd')) { await r.fill('#lgSbd', C.sbd); await r.fill('#lgCode', c2.code); await r.click('#lgBtn'); }
  await r.waitForTimeout(1500);
  if (await r.isVisible('#wtStart')) { if (await r.isVisible('#wtAgree')) await r.check('#wtAgree'); await r.waitForFunction(() => !document.getElementById('wtStart').disabled, null, { timeout: 15000 }); await r.click('#wtStart'); }
  await r.waitForSelector('#scrExam.on', { timeout: 20000 }); await sync(r);
  const evs = await admin('ptEvents', 'KT_DEMO', C.sbd);
  ok(JSON.stringify(evs).includes('DC_THOAT_TOAN_MAN'), 'giám thị thấy sự kiện lúc bị đình chỉ');
  // ---- 4. tác tử AI / phần mềm điều khiển: trình duyệt tự động, bấm không rê chuột, gõ đều tăm tắp → 🤖 trên bảng giám sát
  const D = codes[3], b4 = await login(D);
  ok(await b4.evaluate(() => S.chongAI === 'KHOA' && !S.locked), 'chính sách KHOA, người thật không bị khoá');
  // người thật: rê chuột rồi mới bấm → không bị nghi
  for (let i = 0; i < 10; i++) { await b4.mouse.move(300 + (i % 2) * 260, 260 + (i % 3) * 70, { steps: 12 }); await b4.mouse.down(); await b4.mouse.up(); }
  ok(!(await b4.evaluate(() => !!BOT.last.chuot)), 'rê chuột bình thường không bị nghi');
  // máy bấm: con trỏ nhảy thẳng tới chỗ bấm
  for (let i = 0; i < 10; i++) { await b4.mouse.click(400 + i * 40, 250 + (i % 3) * 30); await b4.waitForTimeout(60); }
  ok(await b4.evaluate(() => !!BOT.last.chuot), 'bấm "dịch chuyển tức thời" bị nghi');
  await b4.keyboard.type('abcdefghijklmnopqrstuvwxyzabcdefghijklmnopq', { delay: 25 });
  ok(await b4.evaluate(() => !!BOT.last.go_deu), 'gõ đều tăm tắp bị nghi');
  await b4.keyboard.type('abcdefghijklmnopqrstuvwxyzabcdef');   // phần mềm gửi phím: nhấn-nhả tức thì
  ok(await b4.evaluate(() => !!BOT.last.giu_phim), 'giữ phím 0 ms bị nghi cao');
  // người gõ thật: giữ phím 60–110 ms, nhịp không đều → không bị nghi
  await b4.evaluate(() => { BOT.last = {}; BOT.holds = []; BOT.keys = []; });
  for (let i = 0; i < 32; i++) { await b4.keyboard.down('k'); await b4.waitForTimeout(60 + (i * 37) % 50); await b4.keyboard.up('k'); await b4.waitForTimeout(40 + (i * 53) % 120); }
  ok(await b4.evaluate(() => !BOT.last.giu_phim && !BOT.last.go_deu), 'gõ như người không bị nghi');
  ok(!(await b4.evaluate(() => S.locked)), 'dấu hiệu "Nghi" không khoá ở chính sách KHOA');
  await sync(b4); await b4.waitForTimeout(500);
  const mon4 = await admin('ptMonitor', 'KT_DEMO');
  const m4 = mon4.students.find((x) => x.sbd === D.sbd) || {};
  ok(m4.nghiTD >= 3 && /Bằng chứng/.test(m4.nghiLyDo || ''), 'giám sát hiện 🤖 + lý do + bằng chứng: ' + JSON.stringify([m4.nghiTD, m4.nghiLyDo]));
  // CHẮC CHẮN: đáp án đổi khi không có thao tác thật → khoá; tải lại trang vẫn khoá; giám thị mở khoá
  await b4.waitForTimeout(2800);
  await b4.evaluate(() => { go(0); setAns(S.items[0].k, 'C'); });
  ok(await b4.evaluate(() => S.locked && /không phải của người/.test(S.lockWhy || '')), 'đổi đáp án không qua chuột / phím → khoá ngay');
  await b4.waitForTimeout(2500); await sync(b4);
  await b4.reload(); await b4.waitForSelector('#scrExam.on', { timeout: 20000 }); await b4.waitForTimeout(800);
  ok(await b4.evaluate(() => S.locked), 'tải lại trang vẫn bị khoá');
  await admin('ptCommand', 'KT_DEMO', [D.sbd], 'MO_KHOA'); await sync(b4); await b4.waitForTimeout(2600);
  ok(!(await b4.evaluate(() => S.locked)), 'giám thị mở khoá được');
  const m5 = (await admin('ptMonitor', 'KT_DEMO')).students.find((x) => x.sbd === D.sbd);
  ok(m5.nghiMuc === 3 && /^Chắc chắn — Đáp án \/ code thay đổi/.test(m5.nghiLyDo), 'lý do "Chắc chắn" đứng đầu: ' + m5.nghiLyDo);
  // trình duyệt bị công cụ tự động điều khiển (navigator.webdriver) → khoá ngay khi vào bài
  const b2 = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox'] });
  const w = await b2.newPage(); await w.route(/katex|fonts\.|jsdelivr/, (r) => r.abort());
  const E = codes[4];
  await w.goto(BASE + '/thi'); await w.fill('#lgSbd', E.sbd); await w.fill('#lgCode', E.code); await w.click('#lgBtn');
  await w.waitForSelector('#wtAgree', { timeout: 15000 }); await w.check('#wtAgree');
  await w.waitForFunction(() => !document.getElementById('wtStart').disabled, null, { timeout: 15000 }); await w.click('#wtStart');
  await w.waitForSelector('#scrExam.on', { timeout: 20000 }); await w.waitForTimeout(600);
  ok(await w.evaluate(() => S.locked && /phần mềm tự động/.test(S.ev.concat([]).map((e) => e.x || '').join() + (S.lockWhy || '') + JSON.stringify(BOT.last))), 'WebDriver → khoá');
  await b2.close();
  await browser.close();
  if (errors.length) { console.log('❌ ' + errors.length + ' lỗi:\n - ' + errors.join('\n - ')); process.exit(1); }
  console.log('✅ Kiểm soát lúc tạm dừng / khoá / đình chỉ + chặn chụp màn hình: đạt.');
})().catch((e) => { console.error(e); process.exit(1); });
