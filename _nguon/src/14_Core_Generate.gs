/**
 * 14_Core_Generate.gs — SINH MÃ ĐỀ theo ma trận (THUẦN)
 *
 * Chế độ A_TRON : bốc 1 bộ câu theo ma trận, mọi mã đề dùng chung bộ câu, chỉ trộn thứ tự câu và đáp án.
 * Chế độ B_KHAC : mỗi mã đề bốc riêng theo cùng ma trận (cùng số câu mỗi Chương × Mức độ × Dạng
 *                 => tương đương độ khó), ưu tiên câu ít được dùng nhất để các mã đề trùng nhau ít nhất.
 * Câu bị KHOÁ (cột Khoa = TRUE trong sheet DeThi) được giữ lại khi bấm "Sinh lại".
 */

/** Chọn tập đơn vị có tổng kích thước đúng bằng need. Ưu tiên theo thứ tự cands. */
function Gen_fill(cands, need) {
  if (need <= 0) return [];
  var pick = [], rem = need;
  for (var i = 0; i < cands.length && rem > 0; i++) {
    if (cands[i].size <= rem) { pick.push(cands[i]); rem -= cands[i].size; }
  }
  if (rem === 0) return pick;
  // quay lui (giới hạn số bước) khi có câu chùm làm lệch tổng
  var best = null, steps = 0;
  (function dfs(idx, r, acc) {
    if (best || steps++ > 50000) return;
    if (r === 0) { best = acc.slice(); return; }
    for (var j = idx; j < cands.length; j++) {
      if (cands[j].size <= r) { acc.push(cands[j]); dfs(j + 1, r - cands[j].size, acc); acc.pop(); if (best) return; }
    }
  })(0, need, []);
  return best;
}

/** Sắp ứng viên: trộn ngẫu nhiên rồi ưu tiên câu ít dùng */
function Gen_orderCands(cands, rnd, usage) {
  var sh = U_shuffle(cands, rnd);
  if (!usage) return sh;
  return sh.map(function (u, i) { return { u: u, i: i, n: usage[u.uid] || 0 }; })
    .sort(function (a, b) { return a.n - b.n || a.i - b.i; })
    .map(function (x) { return x.u; });
}

/**
 * Bốc câu cho một mã đề.
 * @param locked [{uid, si, ci}] các đơn vị bị khoá phải giữ
 * @return {{picks:Array<{si,ci,unit,locked}>, errors:Array<string>, warnings:Array<string>}}
 */
function Gen_select(matrix, bank, rnd, usage, locked) {
  var unitMap = {};
  bank.units.forEach(function (u) { unitMap[u.uid] = u; });
  var used = {}, picks = [], errors = [], warnings = [];
  var remain = matrix.sections.map(function (s) { return s.cells.map(function (c) { return c.need; }); });

  (locked || []).forEach(function (lk) {
    var u = unitMap[lk.uid];
    if (!u) { warnings.push('Câu khoá ' + lk.uid + ' không còn hợp lệ trong ngân hàng — bỏ khoá'); return; }
    if (used[u.uid]) return;
    var sec = matrix.sections[lk.si], cell = sec && sec.cells[lk.ci];
    if (!cell || !Mx_matches(u, cell, sec) || remain[lk.si][lk.ci] < u.size) {
      warnings.push('Câu khoá ' + lk.uid + ' không còn khớp ô ma trận — bỏ khoá'); return;
    }
    used[u.uid] = true; remain[lk.si][lk.ci] -= u.size;
    picks.push({ si: lk.si, ci: lk.ci, unit: u, locked: true });
  });

  var cellOrder = [];
  matrix.sections.forEach(function (sec) {
    sec.cells.forEach(function (cell) { cellOrder.push({ sec: sec, cell: cell, sp: Mx_specificity(cell) }); });
  });
  cellOrder.sort(function (a, b) { return b.sp - a.sp || a.sec.si - b.sec.si || a.cell.ci - b.cell.ci; });

  cellOrder.forEach(function (co) {
    var need = remain[co.sec.si][co.cell.ci];
    if (need <= 0) return;
    var cands = bank.units.filter(function (u) { return !used[u.uid] && Mx_matches(u, co.cell, co.sec); });
    var chosen = Gen_fill(Gen_orderCands(cands, rnd, usage), need);
    if (!chosen) {
      errors.push(Mx_cellLabel(co.sec, co.cell) + ': cần ' + need + ' câu nhưng ngân hàng không đủ (còn ' +
        cands.reduce(function (a, u) { return a + u.size; }, 0) + ' câu phù hợp chưa dùng)');
      return;
    }
    chosen.forEach(function (u) {
      used[u.uid] = true;
      picks.push({ si: co.sec.si, ci: co.cell.ci, unit: u, locked: false });
    });
  });
  return { picks: picks, errors: errors, warnings: warnings };
}

/** Hoán vị đáp án/ý: trả về mảng chữ cái GỐC theo thứ tự HIỂN THỊ */
function Gen_perm(q, exam, rnd) {
  if (q.dang === DANG.TRA_LOI_NGAN) return [];
  var keys = q.options.map(function (o) { return o.key; });
  var allow;
  if (q.dang === DANG.DUNG_SAI) allow = exam.tronYDungSai;
  else allow = exam.tronDapAn;
  if (!allow || q.shuffle.noShuffle || keys.length < 2) return keys;
  var fixed = (q.shuffle.fixed || []).filter(function (L) { return keys.indexOf(L) >= 0; });
  var movable = keys.filter(function (L) { return fixed.indexOf(L) < 0; });
  var sh = U_shuffle(movable, rnd), out = [], k = 0;
  keys.forEach(function (L) { out.push(fixed.indexOf(L) >= 0 ? L : sh[k++]); });
  return out;
}

/** Đáp án theo ký hiệu HIỂN THỊ của mã đề */
function Gen_displayKey(dang, key, perm) {
  if (!key) return '';
  switch (dang) {
    case DANG.MOT_DA: case DANG.NHIEU_DA:
      return key.letters.map(function (L) { return APP.LETTERS[perm.indexOf(L)]; }).sort().join(',');
    case DANG.DUNG_SAI:
      return perm.map(function (L) { return key.tf[U_letterIndex(L)] ? 'Đ' : 'S'; }).join(',');
    case DANG.GHEP_NOI:
      return perm.map(function (L, i) { return APP.LETTERS[i] + '-' + key.map[L]; }).join(',');
    case DANG.TRA_LOI_NGAN:
      return Bank_keyToString(dang, key);
  }
  return '';
}

/** Sắp thứ tự đơn vị trong một phần */
function Gen_orderUnits(entries, tronCau, rnd, levels) {
  if (tronCau) return U_shuffle(entries, rnd);
  var ord = {};
  levels.forEach(function (l) { ord[l.code] = l.order; });
  return entries.slice().sort(function (a, b) {
    return (ord[a.unit.mucDo] || 0) - (ord[b.unit.mucDo] || 0) || (a.unit.chuong < b.unit.chuong ? -1 : a.unit.chuong > b.unit.chuong ? 1 : 0) ||
      (a.unit.uid < b.unit.uid ? -1 : 1);
  });
}

/**
 * Chuyển "kế hoạch" (đơn vị đã sắp theo phần) thành các dòng DeThi.
 * plan = [{si, entries:[{unit, ci, locked}]}], perms = {MaCH: [..]}
 */
function Gen_planToItems(exam, matrix, bank, maDe, plan, perms) {
  var items = [], stt = 0;
  plan.forEach(function (p) {
    var sec = matrix.sections[p.si];
    var nQ = p.entries.reduce(function (a, e) { return a + e.unit.size; }, 0);
    var pts = nQ ? sec.diem / nQ : 0;
    p.entries.forEach(function (e) {
      e.unit.ids.forEach(function (qid) {
        var q = bank.questions[qid];
        var perm = perms[qid] || [];
        stt++;
        items.push({
          MaKyThi: exam.maKyThi, MaDe: maDe, Phan: sec.phan, STT: stt, MaCH: qid, MaNhom: q.maNhom || '',
          DangCau: q.dang, MaChuDe: q.maChuDe, MucDo: q.mucDo, OMaTran: p.si + ':' + e.ci, ThuTu: perm.join(','),
          DapAnGoc: Bank_keyToString(q.dang, q.key), DapAnMaDe: Gen_displayKey(q.dang, q.key, perm),
          Diem: U_round(pts, 4), Khoa: !!e.locked, FormItemId: '', GhiChu: ''
        });
      });
    });
  });
  return items;
}

function Gen_variantCodes(exam) {
  var start = U_str(exam.maDeBatDau) || '101';
  var n = Math.max(1, Math.round(exam.soMaDe || 1));
  var codes = [];
  if (/^\d+$/.test(start)) { for (var i = 0; i < n; i++) codes.push(String(Number(start) + i)); }
  else { for (var j = 0; j < n; j++) codes.push(start + (j + 1)); }
  return codes;
}

function Gen_uidOfItem(it) { return it.MaNhom ? 'G:' + it.MaNhom : 'Q:' + it.MaCH; }

/** Lấy danh sách đơn vị bị khoá từ các dòng DeThi cũ */
function Gen_lockedFromItems(items) {
  var out = {}, seen = {};
  items.forEach(function (it) {
    if (!U_bool(it.Khoa, false)) return;
    var uid = Gen_uidOfItem(it), md = U_str(it.MaDe);
    var k = md + '|' + uid;
    if (seen[k]) return; seen[k] = true;
    var sc = U_str(it.OMaTran).split(':');
    (out[md] = out[md] || []).push({ uid: uid, si: Number(sc[0]), ci: Number(sc[1]) });
  });
  return out;
}

/**
 * Sinh toàn bộ mã đề của kỳ thi.
 * @param exam {maKyThi, cheDo, soMaDe, maDeBatDau, tronCau, tronDapAn, tronYDungSai, seed}
 * @param prevItems các dòng DeThi hiện có của kỳ thi (để giữ câu khoá)
 */
function Gen_generate(exam, matrix, bank, prevItems) {
  var codes = Gen_variantCodes(exam);
  var lockedBy = Gen_lockedFromItems(prevItems || []);
  var result = { variants: [], errors: [], warnings: [] };
  matrix.issues.forEach(function (x) { if (x.level === 'LOI') result.errors.push('Ma trận: ' + x.msg); });
  if (result.errors.length) return result;

  var basePicks = null;
  if (exam.cheDo === CHE_DO.A_TRON) {
    var allLocked = [], seen = {};
    Object.keys(lockedBy).forEach(function (md) {
      lockedBy[md].forEach(function (lk) { if (!seen[lk.uid]) { seen[lk.uid] = true; allLocked.push(lk); } });
    });
    var sel = Gen_select(matrix, bank, U_rng(exam.seed + '|BASE'), null, allLocked);
    sel.errors.forEach(function (e) { result.errors.push(e); });
    sel.warnings.forEach(function (w) { result.warnings.push(w); });
    basePicks = sel.picks;
  }

  var usage = {};
  codes.forEach(function (md) {
    var rnd = U_rng(exam.seed + '|' + md);
    var picks;
    if (basePicks) picks = basePicks;
    else {
      var s = Gen_select(matrix, bank, rnd, usage, lockedBy[md]);
      s.errors.forEach(function (e) { result.errors.push('Mã ' + md + ': ' + e); });
      s.warnings.forEach(function (w) { result.warnings.push('Mã ' + md + ': ' + w); });
      picks = s.picks;
      picks.forEach(function (p) { usage[p.unit.uid] = (usage[p.unit.uid] || 0) + 1; });
    }
    var plan = matrix.sections.map(function (sec) {
      var entries = picks.filter(function (p) { return p.si === sec.si; }).map(function (p) { return { unit: p.unit, ci: p.ci, locked: p.locked }; });
      return { si: sec.si, entries: Gen_orderUnits(entries, exam.tronCau, rnd, bank.levels) };
    });
    var perms = {};
    plan.forEach(function (p) {
      p.entries.forEach(function (e) {
        e.unit.ids.forEach(function (qid) { perms[qid] = Gen_perm(bank.questions[qid], exam, rnd); });
      });
    });
    result.variants.push({ maDe: md, items: Gen_planToItems(exam, matrix, bank, md, plan, perms) });
  });
  result.stats = Gen_stats(result.variants, bank);
  return result;
}

/**
 * ĐỀ RIÊNG cho một thí sinh (sau khi đã chốt đề), mã đề mới `newCode`.
 *  mode TRON: cùng bộ câu của mã đề `baseMd`, trộn lại thứ tự câu + đáp án.
 *  mode MOI : rút bộ câu mới theo đúng ma trận, ưu tiên câu CHƯA xuất hiện trong các mã đề hiện có.
 */
function Gen_extraVariant(exam, matrix, bank, allItems, baseMd, newCode, mode, salt) {
  var rnd = U_rng(exam.seed + '|RIENG|' + newCode + '|' + (salt || ''));
  var ex2 = {}; Object.keys(exam).forEach(function (k) { ex2[k] = exam[k]; });
  ex2.tronCau = true; ex2.tronDapAn = true;
  var plan, out = { items: null, errors: [], warnings: [] };
  if (mode === 'MOI') {
    var usage = {};
    allItems.forEach(function (it) { var u = Gen_uidOfItem(it); usage[u] = (usage[u] || 0) + 1000; });
    var sel = Gen_select(matrix, bank, rnd, usage, null);
    sel.errors.forEach(function (e) { out.errors.push(e); });
    sel.warnings.forEach(function (w) { out.warnings.push(w); });
    if (out.errors.length) return out;
    var reused = sel.picks.filter(function (p) { return usage[p.unit.uid]; }).length;
    if (reused) out.warnings.push(reused + ' câu/nhóm phải dùng lại từ đề cũ vì ngân hàng không đủ câu mới cho ô ma trận');
    plan = matrix.sections.map(function (sec) {
      return { si: sec.si, entries: U_shuffle(sel.picks.filter(function (p) { return p.si === sec.si; }).map(function (p) { return { unit: p.unit, ci: p.ci, locked: false }; }), rnd) };
    });
  } else {
    var base = allItems.filter(function (x) { return U_str(x.MaDe) === String(baseMd); });
    if (!base.length) { out.errors.push('Không có mã đề gốc ' + baseMd); return out; }
    plan = Gen_planFromItems(matrix, bank, base).plan.map(function (p) { return { si: p.si, entries: U_shuffle(p.entries, rnd) }; });
  }
  var perms = {};
  plan.forEach(function (p) { p.entries.forEach(function (e) { e.unit.ids.forEach(function (qid) { if (bank.questions[qid]) perms[qid] = Gen_perm(bank.questions[qid], ex2, rnd); }); }); });
  out.items = Gen_planToItems(exam, matrix, bank, String(newCode), plan, perms);
  return out;
}

/** Dựng lại kế hoạch từ các dòng DeThi của một mã đề */
function Gen_planFromItems(matrix, bank, items) {
  var unitMap = {};
  bank.units.forEach(function (u) { unitMap[u.uid] = u; });
  var sorted = items.slice().sort(function (a, b) { return Number(a.STT) - Number(b.STT); });
  var plan = matrix.sections.map(function (s) { return { si: s.si, entries: [] }; });
  var perms = {}, lastUid = null;
  sorted.forEach(function (it) {
    var sc = U_str(it.OMaTran).split(':');
    var si = Number(sc[0]), ci = Number(sc[1]);
    var uid = Gen_uidOfItem(it);
    perms[U_str(it.MaCH)] = U_str(it.ThuTu) ? U_str(it.ThuTu).split(',') : [];
    if (uid === lastUid) return;
    lastUid = uid;
    var u = unitMap[uid] || { uid: uid, ids: [U_str(it.MaCH)], size: 1, missing: true };
    if (u.missing && it.MaNhom) {
      u.ids = sorted.filter(function (x) { return U_str(x.MaNhom) === U_str(it.MaNhom); }).map(function (x) { return U_str(x.MaCH); });
      u.size = u.ids.length;
    }
    if (plan[si]) plan[si].entries.push({ unit: u, ci: ci, locked: U_bool(it.Khoa, false) });
  });
  return { plan: plan, perms: perms };
}

/**
 * Đổi một câu (hoặc cả nhóm chứa câu đó) bằng câu khác cùng ô ma trận.
 * Chế độ A_TRON: đổi đồng loạt ở MỌI mã đề.
 * @param allItems tất cả dòng DeThi của kỳ thi
 * @return {{items:Array|null, error:string, oldUid, newUid}}
 */
function Gen_swap(exam, matrix, bank, allItems, maDe, maCH, salt) {
  var byVar = U_groupBy(allItems, function (x) { return U_str(x.MaDe); });
  var target = (byVar[maDe] || []).filter(function (x) { return U_str(x.MaCH) === maCH; })[0];
  if (!target) return { items: null, error: 'Không tìm thấy câu ' + maCH + ' trong mã đề ' + maDe };
  var oldUid = Gen_uidOfItem(target);
  var sc = U_str(target.OMaTran).split(':');
  var si = Number(sc[0]), ci = Number(sc[1]);
  var sec = matrix.sections[si], cell = sec && sec.cells[ci];
  if (!cell) return { items: null, error: 'Ô ma trận của câu không còn tồn tại — hãy Sinh lại đề' };
  var affected = exam.cheDo === CHE_DO.A_TRON ? Object.keys(byVar) : [maDe];
  var usedIn = {}, usage = {};
  allItems.forEach(function (it) {
    var u = Gen_uidOfItem(it);
    if (affected.indexOf(U_str(it.MaDe)) >= 0) usedIn[u] = true;
    usage[u] = (usage[u] || 0) + 1;
  });
  var oldSize = (byVar[maDe].filter(function (x) { return Gen_uidOfItem(x) === oldUid; })).length;
  var rnd = U_rng(exam.seed + '|swap|' + maDe + '|' + maCH + '|' + (salt || Date.now()));
  var cands = bank.units.filter(function (u) { return !usedIn[u.uid] && u.size === oldSize && Mx_matches(u, cell, sec); });
  if (!cands.length) return { items: null, error: 'Không còn câu nào khác cùng ô (' + Mx_cellLabel(sec, cell) + ') với cùng số câu để đổi' };
  var newUnit = Gen_orderCands(cands, rnd, usage)[0];
  var out = [];
  Object.keys(byVar).forEach(function (md) {
    if (affected.indexOf(md) < 0) { out = out.concat(byVar[md]); return; }
    var pf = Gen_planFromItems(matrix, bank, byVar[md]);
    var vr = U_rng(exam.seed + '|swapperm|' + md + '|' + newUnit.uid);
    pf.plan.forEach(function (p) {
      p.entries.forEach(function (e, idx) {
        if (e.unit.uid === oldUid) {
          p.entries[idx] = { unit: newUnit, ci: e.ci, locked: false };
          newUnit.ids.forEach(function (qid) { pf.perms[qid] = Gen_perm(bank.questions[qid], exam, vr); });
        }
      });
    });
    out = out.concat(Gen_planToItems(exam, matrix, bank, md, pf.plan, pf.perms));
  });
  return { items: out, error: '', oldUid: oldUid, newUid: newUnit.uid };
}

/** Thống kê mã đề: số câu theo mức độ, độ trùng giữa các cặp mã đề */
function Gen_stats(variants, bank) {
  var per = variants.map(function (v) {
    var lv = {};
    v.items.forEach(function (it) { lv[it.MucDo] = (lv[it.MucDo] || 0) + 1; });
    return { maDe: v.maDe, soCau: v.items.length, byLevel: lv };
  });
  var overlap = [];
  for (var i = 0; i < variants.length; i++) {
    for (var j = i + 1; j < variants.length; j++) {
      var a = {}, shared = 0;
      variants[i].items.forEach(function (x) { a[x.MaCH] = true; });
      variants[j].items.forEach(function (x) { if (a[x.MaCH]) shared++; });
      overlap.push({ a: variants[i].maDe, b: variants[j].maDe, shared: shared,
        pct: variants[i].items.length ? Math.round(100 * shared / variants[i].items.length) : 0 });
    }
  }
  return { perVariant: per, overlap: overlap };
}

/** Đọc dòng sheet KyThi thành đối tượng dùng cho bộ sinh đề */
function Gen_examFromRow(r) {
  var seedBase = U_str(r.HatGiong) || U_str(r.MaKyThi);
  return {
    maKyThi: U_str(r.MaKyThi), ten: U_str(r.TenKyThi), maMon: U_str(r.MaMon), maMaTran: U_str(r.MaMaTran),
    cheDo: U_upper(r.CheDo) === CHE_DO.A_TRON ? CHE_DO.A_TRON : CHE_DO.B_KHAC,
    soMaDe: Math.max(1, Math.round(U_num(r.SoMaDe, 1))), maDeBatDau: U_str(r.MaDeBatDau) || '101',
    tronCau: U_bool(r.TronCau, true), tronDapAn: U_bool(r.TronDapAn, true), tronYDungSai: U_bool(r.TronYDungSai, true),
    thoiGian: U_num(r.ThoiGianPhut, 0), seed: seedBase + ':' + (U_num(r.LanSinh, 0) || 0)
  };
}
