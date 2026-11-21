// Bấm thử BÀI LẬP TRÌNH trên Chrome thật: soạn code (CodeMirror), chạy thử, input tự nhập, nộp code, đổi ngôn ngữ, chặn dán code ngoài,
// tải lại trang giữ code + điểm, chế độ tối, nộp bài. CodeMirror lấy từ bản cài cục bộ (thay cho jsDelivr trong môi trường thử).
const { chromium } = require('playwright');
const path = require('path'), fs = require('fs');
const PORT = process.env.PORT || 8771, BASE = 'http://localhost:' + PORT;
const CM = process.env.CM_DIR || '/tmp/cmpkg/node_modules/codemirror';
(async () => {
  const errors = [];
  const ok = (c, m) => { if (!c) errors.push(m); };
  await fetch(BASE + '/seed-lt', { method: 'POST' }).then((r) => r.text()).then((t) => { if (t !== 'ok') throw new Error('seed: ' + t); });
  const codes = await fetch(BASE + '/room-codes').then((r) => r.json());
  const browser = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox', '--disable-blink-features=AutomationControlled'] });
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  await ctx.route('https://cdn.jsdelivr.net/npm/codemirror@5.65.16/**', (route) => {
    const rel = new URL(route.request().url()).pathname.replace('/npm/codemirror@5.65.16/', '').replace(/\.min\.(js|css)$/, '.$1');
    const f = path.join(CM, rel);
    if (fs.existsSync(f)) route.fulfill({ path: f, contentType: /\.css$/.test(f) ? 'text/css' : 'application/javascript' }); else route.abort();
  });
  await ctx.route(/fonts\.(googleapis|gstatic)\.com|katex/, (r) => r.abort());
  const p = await ctx.newPage();
  p.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
  p.on('dialog', (d) => d.accept());
  const shot = (n) => p.screenshot({ path: path.join(__dirname, 'shots', n + '.png') });
  const waitRes = async (re, ms) => { await p.waitForFunction((s) => new RegExp(s).test((document.getElementById('ltRes') || {}).textContent || ''), re.source, { timeout: ms || 30000 }); };

  const me = codes[0];
  await p.goto(BASE + '/thi');
  await p.fill('#lgSbd', me.sbd); await p.fill('#lgCode', me.code); await p.click('#lgBtn');
  await p.waitForSelector('#wtAgree', { timeout: 15000 }); await p.check('#wtAgree');
  await p.waitForFunction(() => !document.getElementById('wtStart').disabled, null, { timeout: 15000 });
  await p.click('#wtStart');
  await p.waitForSelector('#scrExam.on', { timeout: 20000 });
  const n = await p.evaluate(() => S.items.length), lt1 = await p.evaluate(() => S.items.findIndex((x) => x.dang === 'LAP_TRINH'));
  ok(lt1 > 0 && n === lt1 + 2, 'gói đề phải có 2 bài lập trình ở cuối: ' + n + '/' + lt1);
  // trắc nghiệm vẫn dùng phím tắt A–D bình thường
  await p.keyboard.press('b');
  ok(await p.evaluate(() => S.ans[S.items[0].k] === 'B' || Array.isArray(S.ans[S.items[0].k])), 'phím B ở câu trắc nghiệm');
  await p.evaluate((i) => go(i), lt1);
  await p.waitForFunction(() => document.body.classList.contains('codeMode') && !!S.cm, null, { timeout: 15000 });
  ok(await p.evaluate(() => getComputedStyle(document.querySelector('.side')).display === 'none'), 'chế độ code ẩn cột câu hỏi');
  ok(/Tổng hai số/.test(await p.textContent('.lt-st')), 'đề bài hiện tiêu đề');
  ok(await p.evaluate(() => S.cm.getValue().includes('stdin') || S.cm.getValue().length > 0), 'có code khởi tạo');
  await shot('lt1_editor');

  // quy định thư viện hiện trong đề (LT_TONG: Python không import, C chỉ stdio.h, cấm eval)
  ok(/Thư viện được dùng/.test(await p.textContent('.lt-st')) && /không import thư viện nào/.test(await p.textContent('.lt-st')) && /eval/.test(await p.textContent('.lt-st')), 'đề hiện thư viện được dùng');
  // bố cục: kéo thanh ngăn kết quả lên → khung kết quả cao hơn; ẩn đề; tập trung code; nhớ sau khi tải lại
  const h0 = await p.evaluate(() => document.getElementById('ltOut').getBoundingClientRect().height);
  const hs = await p.locator('.lt-hs').boundingBox();
  await p.mouse.move(hs.x + hs.width / 2, hs.y + 4); await p.mouse.down(); await p.mouse.move(hs.x + hs.width / 2, hs.y - 160, { steps: 8 }); await p.mouse.up();
  const h1 = await p.evaluate(() => document.getElementById('ltOut').getBoundingClientRect().height);
  ok(h1 > h0 + 120, 'kéo thanh ngăn: khung kết quả ' + Math.round(h0) + ' → ' + Math.round(h1) + ' px');
  const vs = await p.locator('.lt-vs').boundingBox(), w0 = await p.evaluate(() => document.querySelector('.lt-st').getBoundingClientRect().width);
  await p.mouse.move(vs.x + 4, vs.y + 200); await p.mouse.down(); await p.mouse.move(vs.x - 180, vs.y + 200, { steps: 8 }); await p.mouse.up();
  const w1 = await p.evaluate(() => document.querySelector('.lt-st').getBoundingClientRect().width);
  ok(w1 < w0 - 120, 'kéo thanh dọc: đề ' + Math.round(w0) + ' → ' + Math.round(w1) + ' px');
  const cmH0 = await p.evaluate(() => document.querySelector('.cedit').getBoundingClientRect().height);
  await p.click('#ltFocusB');
  const foc = await p.evaluate(() => ({ st: getComputedStyle(document.querySelector('.lt-st')).visibility, out: document.getElementById('ltOut').getBoundingClientRect().height, cm: document.querySelector('.cedit').getBoundingClientRect().height, w: document.querySelector('.cedit').getBoundingClientRect().width }));
  ok(foc.st === 'hidden' && foc.out <= 40 && foc.cm > cmH0 + 100, 'tập trung code: ' + JSON.stringify(foc));
  await shot('lt0_focus');
  await p.click('#ltFocusB');
  ok(await p.evaluate(() => getComputedStyle(document.querySelector('.lt-st')).visibility === 'visible'), 'thoát tập trung');
  await p.evaluate(() => { localStorage.removeItem('pt:ltL'); localStorage.removeItem('pt:ltO'); ltLayout(); document.getElementById('ltBox').style.removeProperty('--ltL'); document.getElementById('ltOut').style.height = ''; });
  // gõ code thật bằng bàn phím (phím chữ a/b/c không bị bắt làm đáp án, mũi tên không chuyển câu)
  await p.evaluate(() => { S.cm.setValue(''); S.cm.focus(); });
  await p.keyboard.type('a, b = map(int, input().split())\nprint(a + b');
  await p.keyboard.press('ArrowLeft'); await p.keyboard.press('ArrowRight');
  const typed = await p.evaluate(() => S.cm.getValue());
  ok(typed === 'a, b = map(int, input().split())\nprint(a + b)', 'gõ code: ' + JSON.stringify(typed));
  ok(await p.evaluate(() => document.body.classList.contains('codeMode')), 'mũi tên trong khung code không chuyển câu');
  // chạy thử
  await p.click('#ltRunB'); await waitRes(/2\/2 đúng/);
  await shot('lt2_run_ok');
  // input tự nhập
  await p.check('#ltUseC'); await p.fill('#ltCin', '40 2\n'); await p.click('#ltRunB'); await waitRes(/Input tự nhập/);
  ok(/42/.test(await p.textContent('#ltRes')), 'chạy input tự nhập ra 42');
  await p.uncheck('#ltUseC');
  // sai kết quả → chỉ ra dòng khác
  await p.evaluate(() => S.cm.setValue('a, b = map(int, input().split())\nprint(a - b)\n'));
  await p.click('#ltRunB'); await waitRes(/Khác ở dòng 1/);
  // dán code từ ngoài bị chặn; dán đoạn đã sao chép trong khung code được phép
  const pasted = await p.evaluate(() => {
    const ta = document.querySelector('.cedit .CodeMirror textarea'); S.cm.focus();
    const dt = new DataTransfer(); dt.setData('text/plain', 'import os\nprint(os.listdir())');
    const ev1 = new ClipboardEvent('paste', { clipboardData: dt, bubbles: true, cancelable: true }); ta.dispatchEvent(ev1);
    return { blocked: ev1.defaultPrevented && !S.cm.getValue().includes('listdir') };
  });
  ok(pasted.blocked, 'dán code từ ngoài phải bị chặn');
  await p.evaluate(() => { S.cm.setSelection({ line: 1, ch: 0 }, { line: 1, ch: 5 }); });
  await p.keyboard.press('Control+c');
  const okPaste = await p.evaluate(() => {
    const ta = document.querySelector('.cedit .CodeMirror textarea'); S.cm.setCursor({ line: 2, ch: 0 });
    const dt = new DataTransfer(); dt.setData('text/plain', 'print');
    const e2 = new ClipboardEvent('paste', { clipboardData: dt, bubbles: true, cancelable: true }); ta.dispatchEvent(e2);
    return S.cm.getValue();
  });
  ok(/\nprint$/.test(okPaste.trimEnd()), 'dán đoạn sao chép trong khung code: ' + JSON.stringify(okPaste));
  // nộp code đúng
  await p.evaluate(() => S.cm.setValue('a, b = map(int, input().split())\nprint(a + b)\n'));
  await p.click('#ltSubB'); await waitRes(/test đúng/, 40000);
  const resTxt = await p.textContent('#ltRes');
  ok(/5\/5/.test(resTxt) && /ẩn/.test(resTxt), 'nộp code: ' + resTxt.slice(0, 200));
  ok(/còn 4/.test(await p.textContent('#ltSubB')), 'nút nộp hiện lượt còn lại');
  ok(/Đã nộp 1 lần/.test(await p.textContent('#qState')), 'trạng thái câu: đã nộp');
  await shot('lt3_submit');
  await p.click('.lt-tabs button[data-t="hist"]');
  ok(/Python 3/.test(await p.textContent('#ltRes')), 'lịch sử nộp');
  // vi phạm thư viện: báo ngay, không tính lượt
  await p.click('.lt-tabs button[data-t="res"]');
  await p.evaluate(() => S.cm.setValue('a, b = map(int, input().split())\nprint(eval("a+b"))\n'));
  await p.click('#ltSubB'); await waitRes(/Vi phạm quy định thư viện/);
  ok(/«eval»/.test(await p.textContent('#ltRes')) && /còn 4/.test(await p.textContent('#ltSubB')), 'vi phạm thư viện không mất lượt');
  await shot('lt3b_lib');
  await p.evaluate(() => S.cm.setValue('a, b = map(int, input().split())\nprint(a + b)\n'));
  await p.click('.lt-tabs button[data-t="hist"]');
  // đổi sang C: code C khởi tạo; đổi lại Python: giữ code cũ
  await p.selectOption('#ltLangS', 'c');
  ok(await p.evaluate(() => /#include/.test(S.cm.getValue()) && S.cm.getOption('mode') === 'text/x-csrc'), 'đổi sang C');
  await p.evaluate(() => S.cm.setValue('#include <stdio.h>\nint main(){ long a,b; scanf("%ld %ld",&a,&b) printf("%ld\\n",a+b); }\n'));
  await p.click('.lt-tabs button[data-t="res"]');
  await p.click('#ltRunB'); await waitRes(/Lỗi biên dịch/);
  ok(/expected|error/i.test(await p.textContent('#ltRes')), 'hiện thông báo lỗi biên dịch');
  await shot('lt4_ce');
  await p.selectOption('#ltLangS', 'py');
  ok(await p.evaluate(() => /print\(a \+ b\)/.test(S.cm.getValue())), 'đổi lại Python giữ code cũ');
  // bài 2 (đảo từ): C
  await p.evaluate((i) => go(i), lt1 + 1);
  await p.waitForFunction(() => !!S.cm, null, { timeout: 10000 });
  await p.selectOption('#ltLangS', 'c');
  await p.evaluate(() => S.cm.setValue('#include <stdio.h>\n#include <string.h>\nint main(void){ char s[2000], *w[1000]; int n=0; if(!fgets(s,sizeof s,stdin)) return 0; s[strcspn(s,"\\r\\n")]=0;\n for(char *t=strtok(s," "); t; t=strtok(NULL," ")) w[n++]=t;\n for(int i=n-1;i>=0;i--) printf("%s%s", w[i], i? " ":"\\n"); return 0; }\n'));
  await p.click('#ltSubB'); await waitRes(/test đúng/, 40000);
  ok(/5\/5|test đúng/.test(await p.textContent('#ltRes')), 'nộp bài C');
  // chế độ tối + danh sách câu
  await p.evaluate(() => toggleDark()); await p.click('text=☰ Danh sách câu'); await p.waitForTimeout(150);
  await shot('lt5_dark_nav');
  ok(await p.evaluate(() => getComputedStyle(document.querySelector('.side')).display !== 'none'), 'mở danh sách câu');
  await p.evaluate(() => { toggleDark(); document.body.classList.remove('navOpen'); });
  // tải lại trang: code + điểm còn nguyên
  await p.waitForTimeout(2500); await p.evaluate(() => save());
  await p.waitForTimeout(800);
  await p.reload(); await p.waitForSelector('#scrExam.on', { timeout: 20000 });
  await p.waitForFunction(() => !!S.cm || !!S.cmTa || S.cur >= 0, null, { timeout: 10000 });
  const after = await p.evaluate((i) => ({ sc: S.lt[S.items[i].ma], code: S.ans[S.items[i].k], code2: S.ans[S.items[i + 1].k] }), lt1);
  ok(after.sc && after.sc.d === 5 && after.sc.n === 1, 'điểm bài 1 sau tải lại: ' + JSON.stringify(after.sc));
  ok(after.code && /print\(a \+ b\)/.test(after.code.c) && after.code.l === 'py', 'code bài 1 sau tải lại');
  ok(after.code2 && after.code2.l === 'c' && /strtok/.test(after.code2.c), 'code bài 2 sau tải lại');
  // thoát toàn màn hình (Esc): che đề ngay, 4 giây để quay lại = "lỡ tay" (tối đa 2 lần), quá giờ / quá số lần = vi phạm
  await p.evaluate(() => { const b = document.createElement('button'); b.id = 'fsT'; b.textContent = 'fs'; b.style.cssText = 'position:fixed;left:0;bottom:0;z-index:99'; b.onclick = tryFullscreen; document.body.appendChild(b); });
  const fsOn = async () => { await p.click('#fsT'); await p.waitForFunction(() => !!document.fullscreenElement, null, { timeout: 5000 }); };
  const fsOff = async () => { await p.evaluate(() => document.exitFullscreen()); await p.waitForFunction(() => !document.fullscreenElement && document.body.classList.contains('fsgrace') || S.vpLocal > 0, null, { timeout: 5000 }); };
  await fsOn(); const vp0 = await p.evaluate(() => S.vpLocal);
  await fsOff();
  ok(await p.evaluate(() => !document.getElementById('gate').classList.contains('hidden') && getComputedStyle(document.querySelector('#scrExam .layout')).visibility === 'hidden'), 'thoát toàn màn hình → che đề + đếm ngược');
  await shot('lt6_fs_grace');
  await p.click('#gate >> text=Quay lại toàn màn hình'); await p.waitForTimeout(300);
  ok(await p.evaluate((v) => !!document.fullscreenElement && S.vpLocal === v && S.ev.concat([]).length >= 0 && document.getElementById('gate').classList.contains('hidden'), vp0), 'quay lại kịp → không tính vi phạm');
  await fsOff(); await p.waitForTimeout(4600);
  ok(await p.evaluate((v) => S.vpLocal === v + 1 && !document.body.classList.contains('fsgrace'), vp0), 'quá 4 giây → tính vi phạm');
  await fsOn(); await fsOff(); await p.waitForTimeout(200);
  const dbg = await p.evaluate(() => ({ vp: S.vpLocal, max: S.vpMax, locked: S.locked, n: S.graceN, ev: S.ev.map((e) => e.k).join(',') }));
  ok(dbg.vp === vp0 + 2 || (dbg.locked && dbg.vp >= vp0 + 2), 'hết số lần lỡ tay → tính vi phạm ngay: ' + JSON.stringify(dbg) + ' vp0=' + vp0);
  await p.evaluate(() => { banner(); document.getElementById('fsT').remove(); });
  // nộp bài
  await p.evaluate(() => askSubmit());
  ok(/Bài lập trình chưa bấm Nộp code/.test(await p.textContent('#ovBox')) === false, 'hai bài đã nộp code — không cảnh báo');
  await p.click('text=Tôi chắc chắn nộp bài');
  await p.waitForSelector('#scrDone.on', { timeout: 20000 });
  await browser.close();
  if (errors.length) { console.log('❌ ' + errors.length + ' lỗi:\n - ' + errors.join('\n - ')); process.exit(1); }
  console.log('✅ Giao diện thi lập trình (Chrome): soạn code, chạy thử, input tự nhập, nộp, đổi ngôn ngữ, chặn dán, tải lại, nộp bài đều đạt.');
})().catch((e) => { console.error(e); process.exit(1); });
