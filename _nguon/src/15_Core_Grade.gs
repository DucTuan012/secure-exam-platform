/**
 * 15_Core_Grade.gs — CHẤM ĐIỂM (THUẦN)
 *
 * Luật chấm (theo yêu cầu):
 *  - Mỗi Phần có tổng điểm riêng; các câu trong phần chia đều điểm.
 *  - Sai hoặc bỏ trống: 0 điểm câu đó, KHÔNG trừ điểm.
 *  - NHIEU_DA: chọn đủ và đúng toàn bộ mới được điểm.
 *  - DUNG_SAI: đúng TẤT CẢ các ý mới được điểm cả câu.
 *  - GHEP_NOI: đúng tất cả các cặp mới được điểm.
 *  - Phúc khảo (sheet PhucKhao): DOI_DAP_AN, THEM_DAP_AN, TANG_DIEM, LOAI_CAU.
 *  Đáp án dùng để chấm là bản CHỤP lúc xuất đề (cột DapAnGoc trong DeThi) + điều chỉnh phúc khảo,
 *  nên sửa ngân hàng sau khi thi không làm thay đổi điểm một cách ngầm.
 */

var GR_TRUE_LABEL = 'Đúng / True';
var GR_FALSE_LABEL = 'Sai / False';

/** Đọc chữ cái ở đầu nhãn lựa chọn "B. nội dung" */
function Grade_letterOf(label) {
  var m = U_str(label).match(/^([A-J])(?:[.)]|\s|$)/);
  return m ? m[1] : '';
}

function Grade_toArray(raw) {
  if (raw === null || raw === undefined || raw === '') return [];
  if (Array.isArray(raw)) return raw;
  return [raw];
}

/**
 * Chuyển câu trả lời trên Form (ký hiệu HIỂN THỊ) về ký hiệu GỐC của ngân hàng.
 * @param {string} dang
 * @param {Array<string>} perm chữ cái gốc theo thứ tự hiển thị
 * @param {*} raw giá trị lấy từ ItemResponse.getResponse()
 */
function Grade_toOriginal(dang, perm, raw) {
  var mapL = function (dispL) {
    var i = U_letterIndex(dispL);
    if (i < 0) return '';
    return perm && perm.length ? (perm[i] || '') : dispL;
  };
  switch (dang) {
    case DANG.MOT_DA:
    case DANG.NHIEU_DA:
      var letters = Grade_toArray(raw).map(Grade_letterOf).filter(String).map(mapL).filter(String);
      return { letters: letters.filter(function (x, i) { return letters.indexOf(x) === i; }).sort() };
    case DANG.DUNG_SAI:
      var arr = Grade_toArray(raw);
      var n = perm.length;
      var tf = [];
      for (var k = 0; k < n; k++) tf.push(null);
      for (var r = 0; r < n; r++) {
        var v = U_str(arr[r]);
        var val = v === '' ? null : (v === GR_TRUE_LABEL || /^(Đúng|Dung|True|Đ)/i.test(v) ? true :
          (v === GR_FALSE_LABEL || /^(Sai|False|S)/i.test(v) ? false : null));
        var orig = U_letterIndex(perm[r]);
        if (orig >= 0) tf[orig] = val;
      }
      return { tf: tf };
    case DANG.GHEP_NOI:
      var arr2 = Grade_toArray(raw), map = {};
      for (var j = 0; j < perm.length; j++) {
        var c = U_str(arr2[j]);
        var num = parseInt(c, 10);
        if (!isNaN(num)) map[perm[j]] = num;
      }
      return { map: map };
    case DANG.TRA_LOI_NGAN:
      return { text: U_str(Grade_toArray(raw).join(' ')) };
  }
  return {};
}

/** So khớp câu trả lời (ký hiệu gốc) với một đáp án */
function Grade_match(dang, key, ans) {
  if (!key || !ans) return false;
  switch (dang) {
    case DANG.MOT_DA:
    case DANG.NHIEU_DA:
      return ans.letters.length > 0 && ans.letters.join(',') === key.letters.slice().sort().join(',');
    case DANG.DUNG_SAI:
      if (!ans.tf || ans.tf.length !== key.tf.length) return false;
      for (var i = 0; i < key.tf.length; i++) if (ans.tf[i] !== key.tf[i]) return false;
      return true;
    case DANG.GHEP_NOI:
      var ks = Object.keys(key.map);
      return ks.length > 0 && ks.every(function (k) { return ans.map[k] === key.map[k]; });
    case DANG.TRA_LOI_NGAN:
      var t = U_str(ans.text);
      if (!t) return false;
      var n = U_parseNumber(t), nt = U_normText(t);
      return key.answers.some(function (a) {
        if (a.num !== null && a.num !== undefined && n !== null) {
          var tol = Math.max(a.tol || 0, 1e-9 * Math.max(1, Math.abs(a.num)));
          return Math.abs(n - a.num) <= tol;
        }
        return a.norm === nt;
      });
  }
  return false;
}

/** Gom các điều chỉnh phúc khảo theo MaCH */
function Grade_reviewMap(reviewRows, maKyThi) {
  var m = {};
  (reviewRows || []).forEach(function (r) {
    if (U_str(r.MaKyThi) !== maKyThi) return;
    if (U_str(r.ApDung) && !U_bool(r.ApDung, true)) return;
    var id = U_str(r.MaCH);
    (m[id] = m[id] || []).push({ action: U_upper(r.HanhDong), value: U_str(r.GiaTri) });
  });
  return m;
}

/**
 * Chấm một bài làm.
 * @param items dòng DeThi của mã đề (có DangCau, ThuTu, DapAnGoc, Phan, MaCH, FormItemId…)
 * @param answers {FormItemId: rawResponse}
 * @param sections [{phan, ten, diem}]
 * @param reviews kết quả Grade_reviewMap
 */
function Grade_submission(items, answers, sections, reviews, roundDigits) {
  reviews = reviews || {};
  var secMap = {};
  sections.forEach(function (s) { secMap[s.phan] = { phan: s.phan, ten: s.ten, max: s.diem, diem: 0, n: 0, dung: 0, removed: 0 }; });
  // đếm số câu còn hiệu lực trong từng phần
  items.forEach(function (it) {
    var sm = secMap[U_str(it.Phan)];
    if (!sm) return;
    var rv = reviews[U_str(it.MaCH)] || [];
    if (rv.some(function (x) { return x.action === PK.LOAI_CAU; })) sm.removed++;
    else sm.n++;
  });
  var per = [], total = 0, soDung = 0, counted = 0, raw = {};
  items.slice().sort(function (a, b) { return Number(a.STT) - Number(b.STT); }).forEach(function (it) {
    var dang = U_str(it.DangCau), maCH = U_str(it.MaCH);
    var perm = U_str(it.ThuTu) ? U_str(it.ThuTu).split(',') : [];
    var rv = reviews[maCH] || [];
    var sm = secMap[U_str(it.Phan)];
    var resp = answers[U_str(it.FormItemId)];
    raw[maCH] = resp === undefined ? null : resp;
    var removed = rv.some(function (x) { return x.action === PK.LOAI_CAU; });
    if (removed || !sm) { per.push({ maCH: maCH, stt: it.STT, ok: null, pts: 0, removed: true }); return; }
    var keyStr = U_str(it.DapAnGoc);
    rv.forEach(function (x) { if (x.action === PK.DOI_DAP_AN) keyStr = x.value; });
    var nOpt = perm.length || 0;
    var keys = [];
    var k0 = Bank_parseKey(dang, keyStr, {});
    if (k0.ok) keys.push(k0.key);
    rv.forEach(function (x) {
      if (x.action === PK.THEM_DAP_AN) { var kx = Bank_parseKey(dang, x.value, {}); if (kx.ok) keys.push(kx.key); }
    });
    var ans = Grade_toOriginal(dang, perm, resp);
    var ok = rv.some(function (x) { return x.action === PK.TANG_DIEM; }) ||
      keys.some(function (k) { return Grade_match(dang, k, ans); });
    var pts = ok ? sm.max / Math.max(1, sm.n) : 0;
    if (ok) { sm.diem += pts; sm.dung++; soDung++; }
    total += pts; counted++;
    per.push({ maCH: maCH, stt: it.STT, ok: ok, pts: pts, blank: resp === undefined || resp === null || resp === '' || nOpt < 0 });
  });
  var d = roundDigits === undefined ? 2 : roundDigits;
  Object.keys(secMap).forEach(function (k) { secMap[k].diem = U_round(secMap[k].diem, d); });
  return { total: U_round(total, d), soDung: soDung, tongSoCau: counted, sections: secMap, perItem: per, raw: raw };
}

/** Chuỗi tóm tắt điểm từng phần: "I: 45/50; II: 20/30" */
function Grade_sectionSummary(sections, order) {
  return order.map(function (p) {
    var s = sections[p];
    return s && (Number(s.max) > 0 || Number(s.diem) > 0) ? (p + ': ' + s.diem + '/' + s.max) : '';   // bỏ phần 0 điểm (kỳ thi chỉ lập trình)
  }).filter(String).join('; ');
}

/** Phổ điểm theo khoảng 10 điểm trên thang max */
function Grade_histogram(scores, max) {
  max = max || 100;
  var step = max / 10, bins = [];
  for (var i = 0; i < 10; i++) bins.push({ from: U_round(i * step, 2), to: U_round((i + 1) * step, 2), n: 0 });
  scores.forEach(function (s) {
    var idx = Math.min(9, Math.floor(s / step));
    if (idx >= 0) bins[idx].n++;
  });
  return bins;
}

function Grade_describe(scores) {
  if (!scores.length) return { n: 0 };
  var a = scores.slice().sort(function (x, y) { return x - y; });
  var sum = a.reduce(function (p, c) { return p + c; }, 0), mean = sum / a.length;
  var sd = Math.sqrt(a.reduce(function (p, c) { return p + (c - mean) * (c - mean); }, 0) / a.length);
  var med = a.length % 2 ? a[(a.length - 1) / 2] : (a[a.length / 2 - 1] + a[a.length / 2]) / 2;
  return { n: a.length, mean: U_round(mean, 2), sd: U_round(sd, 2), min: a[0], max: a[a.length - 1], median: U_round(med, 2) };
}
