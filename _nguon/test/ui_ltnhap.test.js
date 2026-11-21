// Bấm thử NHẬP NHANH BÀI LẬP TRÌNH trên Chrome: chép prompt AI, chèn mẫu, bảng kiểm tra, nhập (tự sinh output + kiểm thử), mở file, kéo thả,
// xuất ↔ nhập lại, trùng mã, test từ ZIP (Themis), sinh test bằng code.
const { chromium } = require('playwright');
const path = require('path'), fs = require('fs'), os = require('os'), { execFileSync } = require('child_process');
const PORT = process.env.PORT || 8775, BASE = 'http://localhost:' + PORT;
(async () => {
  const errors = [], ok = (c, m) => { if (!c) errors.push(m); };
  await fetch(BASE + '/seed-lt', { method: 'POST' }).then((r) => r.text()).then((t) => { if (t !== 'ok') throw new Error('seed: ' + t); });
  const browser = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox', '--disable-blink-features=AutomationControlled'] });
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 950 }, acceptDownloads: true });
  await ctx.grantPermissions(['clipboard-read', 'clipboard-write'], { origin: BASE });
  const a = await ctx.newPage();
  await a.route(/katex|fonts\./, (r) => r.abort());
  a.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
  const shot = (n, sel) => (sel ? a.locator(sel) : a).screenshot({ path: path.join(__dirname, 'shots', n + '.png') });
  const idle = async () => { await a.waitForTimeout(150); await a.waitForFunction(() => getComputedStyle(document.getElementById('busy')).display === 'none', null, { timeout: 90000 }); };
  const txt = (s) => a.textContent(s);
  const api = (n, ...args) => a.evaluate(([n, args]) => api(n, ...args), [n, args]);
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'uiltn-'));

  await a.goto(BASE + '/'); await idle();
  await a.click('nav >> text=⑧ Lập trình'); await idle();
  await a.click('text=📥 Nhập nhanh');
  ok(await a.isVisible('#ltImp'), 'mở khung nhập nhanh');

  // ---- prompt cho AI
  await a.click('#ltImp button:has-text("Sao chép prompt")'); await a.waitForFunction(() => /Đã sao chép prompt/.test(document.getElementById('toast').textContent) || document.getElementById('modal').style.display === 'flex', null, { timeout: 5000 });
  const clip = await a.evaluate(() => navigator.clipboard.readText());
  ok(/### BÀI:/.test(clip) && /### HẾT/.test(clip) && /ĐỀ BÀI CẦN SOẠN/.test(clip), 'prompt AI đã chép: ' + clip.slice(0, 80));

  // ---- chèn mẫu → bảng kiểm tra → nhập (sinh output + kiểm thử)
  await a.click('text=📄 Chèn mẫu'); await a.waitForSelector('#liPrev table'); await a.waitForTimeout(200);
  let pv = await txt('#liPrev');
  ok(/LT_TONG_CHAN/.test(pv) && /2 thiếu output/.test(pv) && /2 \/ 2/.test(pv), 'bảng kiểm tra: ' + pv.slice(0, 200));
  ok(/Nhập 1 bài/.test(await txt('#liGo')), 'nút nhập: ' + await txt('#liGo'));
  await shot('ln1_prev', '#ltImp');
  await a.click('#liGo'); await idle();
  await a.waitForFunction(() => /✅|❌|⛔/.test((document.getElementById('liV0') || {}).textContent || ''), null, { timeout: 60000 });
  const v0 = await txt('#liV0');
  ok(/✅ 4\/4 test đúng/.test(v0) && /đã sinh 2 output/.test(v0), 'nhập xong tự sinh output + kiểm thử: ' + v0);
  await a.waitForTimeout(600); await idle();
  ok(/LT_TONG_CHAN/.test(await txt('#ltTbl')), 'bài mới vào bảng ngân hàng');
  await shot('ln2_done', '#ltImp');

  // ---- văn bản AI 2 bài (1 bài lỗi) + bọc ```markdown + lời chào
  const AI = '```markdown\n### BÀI: LT_BINH_PHUONG | Bình phương | Dễ | Số học\n### ĐỀ BÀI\nIn $n^2$.\n### INPUT\nSố $n$.\n### OUTPUT\n$n^2$\n### LỜI GIẢI: Python\n```python\nn = int(input())\nprint(n * n)\n```\n' +
    '### TEST MẪU | 0 | 3 x 3\n3\n===\n9\n### TEST\n-12\n===\n144\n### TEST\n100000\n### HẾT\n\n### BÀI: | Bài thiếu tên\n### TÊN:\n### TEST\n1\n### HẾT\n```\nChúc thầy cô dạy tốt!';
  await a.fill('#liTxt', ''); await a.fill('#liTxt', AI); await a.waitForTimeout(1200); await a.waitForSelector('#liPrev table');
  pv = await txt('#liPrev');
  ok(/LT_BINH_PHUONG/.test(pv) && /thiếu đề bài/.test(pv) && /Đọc được 2 bài · nhập được 1/.test(pv), 'bài lỗi được đánh dấu ⛔: ' + pv.slice(0, 260));
  await a.click('#liGo'); await idle();
  await a.waitForFunction(() => /✅|❌|⛔/.test((document.getElementById('liV0') || {}).textContent || ''), null, { timeout: 60000 });
  ok(/✅ 3\/3/.test(await txt('#liV0')) && /lỗi 1/.test(await txt('#liRes')), 'nhập bài đúng, báo bài lỗi: ' + (await txt('#liRes')).slice(0, 200));

  // ---- xuất ngân hàng → tải file → nhập lại (trùng mã → mã mới / bỏ qua)
  await a.waitForTimeout(500); await idle();
  await a.fill('#ltFind', 'LT_'); await a.waitForTimeout(200);
  const [dl] = await Promise.all([a.waitForEvent('download'), a.click('#t-lt >> text=⬇ Xuất >> nth=0')]); await idle();
  const exPath = path.join(dir, await dl.suggestedFilename()); await dl.saveAs(exPath);
  const ex = fs.readFileSync(exPath, 'utf8');
  ok(/^bai_lap_trinh_\d+_bai_/.test(path.basename(exPath)) && /### BÀI: LT_TONG_CHAN/.test(ex) && /### BÀI: LT_BINH_PHUONG/.test(ex), 'xuất ngân hàng ra .txt');
  const nEx = (ex.match(/^### BÀI:/gm) || []).length;
  await a.fill('#ltFind', '');
  await a.click('text=🗑 Xoá');
  await a.selectOption('#liDup', 'BO_QUA');
  await a.setInputFiles('#liFile', exPath); await a.waitForSelector('#liPrev table'); await a.waitForTimeout(800);
  pv = await txt('#liPrev');
  ok(new RegExp('Đọc được ' + nEx + ' bài · nhập được 0').test(pv) && /trùng → bỏ qua/.test(pv), 'mở file xuất: mọi bài trùng → bỏ qua: ' + pv.slice(0, 120));
  ok(await a.isDisabled('#liGo'), 'không có bài để nhập → nút khoá');
  await a.selectOption('#liDup', 'DOI_MA'); await a.waitForTimeout(800);
  ok(new RegExp('Nhập ' + nEx + ' bài').test(await txt('#liGo')), 'đổi sang tạo mã mới');
  // kéo thả 1 file JSON vào ô
  await a.click('text=🗑 Xoá');
  await a.evaluate(async () => {
    const dt = new DataTransfer();
    dt.items.add(new File([JSON.stringify({ code: 'LT_KEO_THA', title: 'Kéo thả', statement: 'In 1.', solution: 'print(1)', tests: [{ input: '', output: '1', sample: true }, { input: '' }] })], 'bai.json', { type: 'application/json' }));
    const el = document.getElementById('liTxt');
    el.dispatchEvent(new DragEvent('dragover', { dataTransfer: dt, bubbles: true, cancelable: true }));
    el.dispatchEvent(new DragEvent('drop', { dataTransfer: dt, bubbles: true, cancelable: true }));
  });
  await a.waitForTimeout(1500);
  ok(/LT_KEO_THA/.test(await txt('#liPrev')), 'kéo thả file JSON vào ô: ' + (await txt('#liPrev')).slice(0, 120));
  await a.click('#ltImp >> button:has-text("Đóng")');

  // ---- trình soạn: test từ ZIP (Themis) + sinh test bằng code
  await a.click('#ltTbl tr:has-text("LT_TONG_CHAN") >> text=Sửa'); await idle();
  await a.click('#ltEdTabs >> text=2. Test cases');
  const n0 = await a.evaluate(() => S.ltCur.tests.length);
  const zip = path.join(dir, 'themis.zip');
  execFileSync('python3', ['-I', '-c', `
import zipfile, sys
z = zipfile.ZipFile(sys.argv[1], 'w', zipfile.ZIP_DEFLATED)
for i in range(1, 6):
    z.writestr('TONGCHAN/Test%02d/TONGCHAN.INP' % i, '%d\\n%s\\n' % (i, ' '.join(str(k) for k in range(i))))
z.writestr('TONGCHAN/Test01/TONGCHAN.OUT', '0\\n')
z.close()`, zip]);
  await a.setInputFiles('#ltTf', zip); await idle();
  await a.waitForSelector('#modal', { state: 'visible' });
  const mz = await txt('#modalText');
  ok(/Ghép được 5 test/.test(mz) && /4 test chưa có output/.test(mz), 'ghép test ZIP Themis: ' + mz.slice(0, 120));
  await shot('ln3_zip', '#modal .box');
  await a.click('#modalYes'); await idle();
  await a.waitForFunction(() => /Kết quả kiểm thử đề/.test(document.getElementById('ltVal').textContent), null, { timeout: 60000 }); await idle();
  let ts = await a.evaluate(() => S.ltCur.tests.map((t) => [t.in, t.out]));
  ok(ts.length === n0 + 5 && ts.slice(-5).every((x) => x[1].trim()), 'thêm 5 test ZIP + sinh output: ' + JSON.stringify(ts.slice(-2)));
  ok(/✅ Kiểm thử đạt/.test(await txt('#ltVal')), 'kiểm thử đạt sau khi nhập ZIP');
  await a.click('text=🎲 Sinh test bằng code');
  await a.waitForSelector('#modal', { state: 'visible' });
  ok(/random.seed\(t\)/.test(await a.inputValue('#gnC')), 'có code mẫu sinh test');
  await a.fill('#gnN', '6'); await a.check('#gnRep');
  await a.click('#modalYes'); await idle();
  await a.waitForFunction(() => /Kết quả kiểm thử đề/.test(document.getElementById('ltVal').textContent) && !/⏳/.test(document.getElementById('ltVal').textContent), null, { timeout: 90000 }); await idle();
  ts = await a.evaluate(() => S.ltCur.tests.map((t) => [t.mau, t.in.length, t.out]));
  ok(ts.filter((x) => !x[0]).length === 6 && ts.filter((x) => x[0]).length === 2 && ts.every((x) => x[2].trim()), 'sinh 6 test ẩn (thay test ẩn cũ, giữ 2 test mẫu) + output: ' + JSON.stringify(ts.map((x) => [x[0], x[1]])));
  ok(/✅ Kiểm thử đạt: 8\/8/.test(await txt('#ltVal')), 'kiểm thử 8/8: ' + (await txt('#ltVal')).slice(0, 100));
  await shot('ln4_gen');
  // xuất 1 bài
  const [dl2] = await Promise.all([a.waitForEvent('download'), a.click('#ltEd >> text=⬇ Xuất')]); await idle();
  const one = fs.readFileSync(await dl2.path(), 'utf8');
  ok(/^### BÀI: LT_TONG_CHAN/.test(one) && (one.match(/^### TEST/gm) || []).length === 8, 'xuất 1 bài có đủ 8 test');

  await browser.close();
  if (errors.length) { console.log('❌ ' + errors.length + ' lỗi:\n - ' + errors.join('\n - ')); process.exit(1); }
  console.log('✅ Nhập nhanh bài lập trình (Chrome): prompt AI, chèn mẫu, kiểm tra, nhập + tự sinh output + kiểm thử, file / kéo thả, xuất ↔ nhập, trùng mã, ZIP Themis, sinh test bằng code đều đạt.');
})().catch((e) => { console.error(e); process.exit(1); });
