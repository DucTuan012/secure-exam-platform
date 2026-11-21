// Bấm thử THI THỬ CỦA GIÁM THỊ trên Chrome thật: tạo link ở tab ⑤ → vào giao diện thi không cần SBD (phòng đang ĐÓNG) →
// chống gian lận TẮT (không khoá, không bắt toàn màn hình, chỉ ghi chú) → BẬT ngay trên thanh thi thử (khoá như thật) → 🔓 mở khoá →
// nộp code thấy cả test ẩn → nộp bài → chấm bài thử ở trang quản trị → làm lại / đổi mã đề / thoát. Giám sát không thấy bài thử.
const { chromium } = require('playwright');
const path = require('path'), fs = require('fs');
const PORT = process.env.PORT || 8774, BASE = 'http://localhost:' + PORT;
const CM = process.env.CM_DIR || '/tmp/cmpkg/node_modules/codemirror';
(async () => {
  const errors = [], ok = (c, m) => { if (!c) errors.push(m); };
  await fetch(BASE + '/seed-lt', { method: 'POST' }).then((r) => r.text()).then((t) => { if (t !== 'ok') throw new Error('seed: ' + t); });
  const adminApi = async (n, ...a) => { const r = await fetch(BASE + '/api', { method: 'POST', body: JSON.stringify({ fn: 'API_call', args: [n, a] }) }).then((x) => x.json()); const d = typeof r === 'string' ? JSON.parse(r) : r; if (!d.ok) throw new Error(n + ': ' + d.error); return d.data; };
  await adminApi('ptClose', 'KT_DEMO');                         // phòng đã ĐÓNG — thi thử vẫn vào được
  const browser = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox', '--disable-blink-features=AutomationControlled'] });
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  await ctx.route('https://cdn.jsdelivr.net/npm/codemirror@5.65.16/**', (route) => {
    const rel = new URL(route.request().url()).pathname.replace('/npm/codemirror@5.65.16/', '').replace(/\.min\.(js|css)$/, '.$1');
    const f = path.join(CM, rel);
    if (fs.existsSync(f)) route.fulfill({ path: f, contentType: /\.css$/.test(f) ? 'text/css' : 'application/javascript' }); else route.abort();
  });
  await ctx.route(/fonts\.(googleapis|gstatic)\.com|katex|script\.google\.com/, (r) => r.abort());
  const a = await ctx.newPage();
  a.on('pageerror', (e) => errors.push('admin pageerror: ' + e.message));
  const idle = async () => { await a.waitForTimeout(150); await a.waitForFunction(() => getComputedStyle(document.getElementById('busy')).display === 'none', null, { timeout: 30000 }); };
  const shot = (p, n) => p.screenshot({ path: path.join(__dirname, 'shots', n + '.png') });

  // ---- trang quản trị: tạo link thi thử
  await a.goto(BASE + '/'); await idle();
  await a.click('nav >> text=⑤ Phòng thi web'); await idle(); await a.waitForTimeout(400); await idle();
  ok(await a.isVisible('#ptThuCard'), 'có mục Thi thử ở tab ⑤');
  const mds = await a.$$eval('#ptThuMd option', (o) => o.map((x) => x.value));
  ok(mds.length >= 2, 'chọn được mã đề: ' + mds.join(','));
  ok(!(await a.isChecked('#ptThuGuard')), 'mặc định tắt chống gian lận');
  const [pop] = await Promise.all([ctx.waitForEvent('page', { timeout: 10000 }).catch(() => null), a.click('text=👁 Mở trang thi thử')]);
  await idle();
  ok(!!pop, 'bấm là mở cửa sổ mới ngay');
  if (pop) await pop.close().catch(() => { });
  const href = await a.getAttribute('#ptThuMsg a', 'href');
  ok(/\?thu=[0-9a-f]{32}$/.test(href || ''), 'link thi thử: ' + href);
  ok(/không gửi cho thí sinh/.test(await a.textContent('#ptThuMsg')) && /đóng/.test(await a.textContent('#ptThuMsg')), 'cảnh báo + báo phòng đang đóng');
  await shot(a, 'thu0_admin');
  const key = href.split('thu=')[1];

  // ---- trang thi thử
  const p = await ctx.newPage();
  p.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
  p.on('dialog', (d) => d.accept());
  await p.goto(BASE + '/thi?thu=' + key);
  await p.waitForSelector('#scrWait.on', { timeout: 20000 });
  ok(await p.isVisible('#thuBar') && /THI THỬ/.test(await p.textContent('#thuBar')), 'thanh thi thử');
  ok(!/thu=/.test(p.url()), 'khoá bí mật bị xoá khỏi thanh địa chỉ: ' + p.url());
  ok(/Đề đã mở/.test(await p.textContent('#wtState')), 'phòng đóng nhưng thi thử thấy "đề đã mở"');
  ok((await p.textContent('#wtName')) === 'Giám thị (thi thử)', 'tên tài khoản thi thử');
  await shot(p, 'thu1_wait');
  await p.check('#wtAgree'); await p.click('#wtStart');
  await p.waitForSelector('#scrExam.on', { timeout: 20000 }); await p.waitForTimeout(500);
  const st = () => p.evaluate(() => ({ fs: !!document.fullscreenElement, locked: !!S.locked, vp: S.vpLocal, ev: S.ev.map((e) => e.k).join(','), gate: !document.getElementById('gate').classList.contains('hidden'),
    blur: document.body.classList.contains('blurred'), log: S.thuLog.length, sel: getComputedStyle(document.body).userSelect }));
  let s = await st();
  ok(!s.fs && !s.gate && !s.locked, 'tắt chống gian lận: không bắt toàn màn hình: ' + JSON.stringify(s));
  ok(s.sel === 'text', 'được bôi đen / sao chép đề');
  // rời trang, PrintScreen, sao chép → không khoá, không ghi vi phạm, chỉ ghi chú "thi thật sẽ…"
  await p.keyboard.press('PrintScreen');
  await p.evaluate(() => { Object.defineProperty(document, 'hidden', { value: true, configurable: true }); document.dispatchEvent(new Event('visibilitychange')); });
  await p.waitForTimeout(1200);
  await p.evaluate(() => { Object.defineProperty(document, 'hidden', { value: false, configurable: true }); document.dispatchEvent(new Event('visibilitychange')); });
  await p.waitForTimeout(3500);
  await p.evaluate(() => { const r = document.createRange(); r.selectNodeContents(document.querySelector('#scrExam .layout')); getSelection().removeAllRanges(); getSelection().addRange(r); });
  await p.keyboard.press('Control+c');
  await p.waitForTimeout(300);
  s = await st();
  ok(!s.locked && !s.vp && !/ROI_TAB|CHUP/.test(s.ev) && s.log >= 3, 'không khoá, không ghi vi phạm, có ghi chú: ' + JSON.stringify(s));
  await p.click('#thuBar >> text=📋 Sẽ ghi nhận');
  const lg = await p.textContent('#thuLog');
  ok(/chụp màn hình/.test(lg) && /rời khỏi trang thi/.test(lg) && /sao chép/.test(lg), 'danh sách "thi thật sẽ ghi nhận": ' + lg.slice(0, 200));
  await shot(p, 'thu2_log');
  await p.click('#thuBar >> text=📋 Sẽ ghi nhận');
  // trả lời câu 1
  await p.click('.opt >> nth=0'); await p.waitForTimeout(300);

  // ---- BẬT chống gian lận ngay trên thanh → như thi thật: toàn màn hình, PrintScreen → khoá → 🔓 Mở khoá trên thanh
  await p.click('#thuBar .tb-g'); await p.waitForTimeout(900);
  s = await st();
  ok(s.fs && !s.gate, 'bật chống gian lận → vào toàn màn hình: ' + JSON.stringify(s));
  ok(s.sel === 'none', 'bật lại chặn bôi đen');
  await p.keyboard.press('PrintScreen'); await p.waitForTimeout(800);
  s = await st();
  ok(s.locked, 'bật chống gian lận: PrintScreen → khoá như thi thật: ' + JSON.stringify(s));
  await p.evaluate(() => save()); await p.waitForTimeout(1500);
  ok(await p.isVisible('#thuBar >> text=🔓 Mở khoá'), 'thanh thi thử nổi trên màn khoá, có nút mở khoá');
  await shot(p, 'thu3_locked');
  await p.click('#thuBar >> text=🔓 Mở khoá'); await p.waitForTimeout(1500);
  s = await st();
  ok(!s.locked && !s.gate, 'mở khoá ngay trên máy: ' + JSON.stringify(s));
  await p.click('#thuBar .tb-g'); await p.waitForTimeout(400);
  ok((await st()).sel === 'text', 'tắt lại');

  // ---- bài lập trình: nộp code → thấy dữ liệu cả test ẩn
  const g = await adminApi('ltGet', 'LT_TONG');
  const lt1 = await p.evaluate(() => S.items.findIndex((x) => x.dang === 'LAP_TRINH'));
  await p.evaluate((i) => go(i), lt1);
  await p.waitForFunction(() => document.body.classList.contains('codeMode') && !!S.cm, null, { timeout: 15000 });
  await p.evaluate(([l, c]) => { ltLang(l); S.cm.setValue(c); ltFlush(); }, [g.nnLoiGiai, g.loiGiai]);
  await p.click('#ltSubB');
  await p.waitForFunction(() => /test đúng/.test((document.getElementById('ltRes') || {}).textContent || ''), null, { timeout: 30000 });
  const res = await p.textContent('#ltRes');
  ok(/giám thị xem được dữ liệu/.test(res), 'thi thử thấy dữ liệu test ẩn: ' + res.slice(0, 200));
  ok((await p.$$('#ltRes details.lt-t pre')).length > 2, 'có input / output của test');

  // ---- nộp bài → màn "Đã nộp bài thử"
  await p.evaluate(() => askSubmit()); await p.click('#ovBox >> button.ok');
  await p.waitForSelector('#scrDone.on', { timeout: 20000 });
  ok(/Đã nộp bài thử/.test(await p.textContent('#doneBox')) && /Chấm bài thử/.test(await p.textContent('#doneBox')), 'màn nộp thi thử');
  await shot(p, 'thu4_done');

  // ---- quản trị: chấm bài thử; giám sát không có bài thử
  await adminApi('ptOpen', 'KT_DEMO', true);
  await a.click('text=📊 Chấm bài thử'); await idle();
  const pk = await a.textContent('#ptThuMsg');
  ok(/Bài thử mã đề/.test(pk) && /đã nộp/.test(pk) && /\d+(\.\d+)?\/\d+ điểm/.test(pk) && /LT_TONG/.test(pk), 'chấm bài thử: ' + pk.slice(0, 220));
  await a.locator('#ptThuCard').scrollIntoViewIfNeeded(); await shot(a, 'thu5_peek');
  await a.click('#t-pt >> text=⟳ Làm mới').catch(() => { }); await idle();
  ok(!/GV-THU/.test(await a.textContent('#ptMon')), 'giám sát không hiện bài thử');

  // ---- làm lại · đổi mã đề · thoát
  await p.click('#doneBox >> text=♻ Làm lại bài thử');
  await p.waitForSelector('#scrWait.on', { timeout: 20000 });
  ok(await p.isVisible('#thuBar'), 'làm lại: về phòng chờ, vẫn ở chế độ thi thử');
  const md0 = await p.textContent('#wtMd'), other = mds.find((m) => m !== md0);
  await p.selectOption('#thuBar select', other);
  await p.waitForSelector('#scrWait.on', { timeout: 20000 }); await p.waitForTimeout(500);
  ok((await p.textContent('#wtMd')) === other, 'đổi mã đề: ' + md0 + ' → ' + (await p.textContent('#wtMd')));
  await p.click('#thuBar >> text=✕ Thoát');
  await p.waitForSelector('#scrLogin.on', { timeout: 15000 });
  ok(await p.isHidden('#thuBar'), 'thoát về trang đăng nhập');
  // huỷ link → mở lại link báo hết hiệu lực
  await a.click('text=✖ Huỷ link thi thử'); await idle();
  await p.goto(BASE + '/thi?thu=' + key); await p.waitForTimeout(2500);
  ok(/Thi thử đã kết thúc|không đúng/.test(await p.textContent('body')), 'link đã huỷ không vào được');

  await browser.close();
  if (errors.length) { console.log('❌ ' + errors.length + ' lỗi:\n - ' + errors.join('\n - ')); process.exit(1); }
  console.log('✅ Thi thử của giám thị (Chrome): tạo link, vào khi phòng đóng, tắt / bật chống gian lận, mở khoá tại chỗ, xem test ẩn, nộp, chấm bài thử, làm lại, đổi mã đề, huỷ link đều đạt.');
})().catch((e) => { console.error(e); process.exit(1); });
