// Thêm thí sinh MUỘN khi kỳ thi đã mở & có người đang làm (đúng thao tác của giám thị)
const assert = require('assert'); const fs = require('fs'); const path = require('path');
const { load } = require('./load'); const { makeEnv } = require('./mocks');
require('../tools/bundle')();
const env = makeEnv();
const G = load(fs.readdirSync(path.join(__dirname, '..', 'src')).filter((f) => f.endsWith('.gs')).sort(), env);
env._newHub();
const call = (n, ...a) => { const r = JSON.parse(G.API_call(n, a)); if (!r.ok) throw new Error(n + ': ' + r.error); return r.data; };
call('setup'); call('sample'); call('generate', 'KT_DEMO'); call('finalize', 'KT_DEMO'); call('assign', 'KT_DEMO', 'NGAU_NHIEN');
const pr = call('ptSetup'); const room = env.SpreadsheetApp.openById(pr.id);
call('ptSetUrl', 'https://script.google.com/macros/s/AKfycbX/exec');
call('ptPublish', 'KT_DEMO', {}); call('ptOpen', 'KT_DEMO', true);
const n0 = G.S_read(room, 'ThiSinh').length;
G.S_update(room, 'ThiSinh', (x, i) => true, { BatDau: String(Date.now()), TrangThai: 'DANG_LAM' });
console.log('room trước', n0);
console.log('import', JSON.stringify(call('importStudents', 'KT_DEMO', 'SV903, Nguyễn Đình Minh, minh@gmail.com', 'THEM')).slice(0, 300));
console.log('assign', JSON.stringify(call('assign', 'KT_DEMO', 'NGAU_NHIEN')).slice(0, 300));
console.log('hub', call('students', 'KT_DEMO').length || JSON.stringify(call('students', 'KT_DEMO')).slice(0, 200));
call('ptClose', 'KT_DEMO');
try { console.log('publish', JSON.stringify(call('ptPublish', 'KT_DEMO', {})).slice(0, 300)); } catch (e) { console.log('LỖI publish:', e.message); }
console.log('room sau', G.S_read(room, 'ThiSinh').length, G.S_read(room, 'ThiSinh').map((x) => x.SBD + ':' + x.TrangThai).join(' '));
const mon = call('ptMonitor', 'KT_DEMO'); console.log('monitor', mon.students.length);
// Đang MỞ + có người làm: thêm thí sinh → phân → đưa lên KHÔNG cần đóng
call('ptOpen', 'KT_DEMO', true);
call('importStudents', 'KT_DEMO', 'SV904, Trần B, 12A1, b@gmail.com', 'THEM'); call('assign', 'KT_DEMO', 'NGAU_NHIEN');
const before = G.S_read(room, 'ThiSinh').filter((x) => x.TrangThai === 'DANG_LAM').map((x) => x.SBD + x.MaTruyCap + x.BatDau).join();
const sy = call('ptSyncStudents', 'KT_DEMO');
assert.strictEqual(sy.added.length, 1); assert.strictEqual(sy.added[0].sbd, 'SV904'); assert.ok(sy.open);
assert.strictEqual(G.S_read(room, 'ThiSinh').filter((x) => x.TrangThai === 'DANG_LAM').map((x) => x.SBD + x.MaTruyCap + x.BatDau).join(), before, 'người đang thi không bị đụng');
assert.strictEqual(call('ptSyncStudents', 'KT_DEMO').added.length, 0, 'gọi lại không thêm trùng');
assert.strictEqual(call('ptMonitor', 'KT_DEMO').students.length, 8);
console.log('✅ Thêm thí sinh muộn: phát lại khi đóng phòng + đưa lên ngay khi phòng đang mở đều đúng.');
