/**
 * 13_Core_Matrix.gs — MA TRẬN ĐẶC TẢ (THUẦN)
 *
 * Sheet MaTran_Phan  : mỗi dòng = 1 Phần của đề (Phần I trắc nghiệm, Phần II Đúng/Sai, Phần III trả lời ngắn…)
 *     DiemPhan       : tổng điểm của phần (các câu trong phần chia đều)
 *     TongSoCau      : tổng số câu của phần (bắt buộc nếu dùng TiLe %)
 *     DangCauChoPhep : các dạng câu được phép trong phần, ví dụ MOT_DA,NHIEU_DA
 * Sheet MaTran_ChiTiet: mỗi dòng = 1 ô của ma trận (bộ lọc + số câu)
 *     Chuong / MaChuDe / MucDo / DangCau : để trống = không lọc; có thể ghi nhiều giá trị cách nhau bởi dấu phẩy
 *     SoCau          : số câu cần bốc cho ô này, HOẶC
 *     TiLe           : % số câu của phần (hệ thống tự làm tròn để tổng đúng bằng TongSoCau)
 */

function Mx_build(maMaTran, phanRows, cellRows) {
  var issues = [];
  var secs = phanRows.filter(function (r) { return U_str(r.MaMaTran) === maMaTran; });
  if (!secs.length) issues.push({ level: 'LOI', msg: 'Ma trận ' + maMaTran + ' chưa có Phần nào (sheet MaTran_Phan)' });
  var sections = secs.map(function (r, si) {
    var phan = U_str(r.Phan) || String(si + 1);
    var sec = {
      si: si, phan: phan, ten: U_str(r.TenPhan) || ('Phần ' + phan), diem: U_num(r.DiemPhan, 0),
      tongSoCau: U_num(r.TongSoCau, 0), allowed: U_splitList(r.DangCauChoPhep).map(U_normDang).filter(String),
      cells: [], maMon: U_str(r.MaMon), tenMaTran: U_str(r.TenMaTran)
    };
    var cRows = cellRows.filter(function (c) { return U_str(c.MaMaTran) === maMaTran && U_str(c.Phan) === phan; });
    sec.cells = cRows.map(function (c, ci) {
      return {
        ci: ci, chuong: U_splitList(c.Chuong), maChuDe: U_splitList(c.MaChuDe), mucDo: U_splitList(c.MucDo).map(U_upper),
        dang: U_splitList(c.DangCau).map(U_normDang).filter(String), soCau: U_num(c.SoCau, null), tiLe: U_num(c.TiLe, null),
        ghiChu: U_str(c.GhiChu), row: c.__row
      };
    });
    if (!sec.cells.length) {
      sec.cells = [{ ci: 0, chuong: [], maChuDe: [], mucDo: [], dang: [], soCau: sec.tongSoCau, tiLe: null, ghiChu: '(toàn bộ phần)' }];
    }
    Mx_computeCounts(sec, issues);
    sec.need = sec.cells.reduce(function (a, c) { return a + c.need; }, 0);
    if (sec.tongSoCau && sec.need !== sec.tongSoCau) {
      issues.push({ level: 'LOI', msg: sec.ten + ': tổng số câu các ô (' + sec.need + ') khác TongSoCau (' + sec.tongSoCau + ')' });
    }
    if (sec.diem <= 0) issues.push({ level: 'LOI', msg: sec.ten + ': chưa có DiemPhan' });
    return sec;
  });
  var totalPoints = sections.reduce(function (a, s) { return a + s.diem; }, 0);
  return {
    id: maMaTran, sections: sections, issues: issues, totalPoints: totalPoints,
    totalQuestions: sections.reduce(function (a, s) { return a + s.need; }, 0),
    maMon: sections.length ? sections[0].maMon : '', ten: sections.length ? sections[0].tenMaTran : ''
  };
}

/** Tính số câu từng ô: SoCau cố định, phần còn lại chia theo TiLe bằng phương pháp phần dư lớn nhất */
function Mx_computeCounts(sec, issues) {
  var fixed = 0, pctCells = [];
  sec.cells.forEach(function (c) {
    if (c.soCau !== null && c.soCau !== undefined && c.soCau !== '') { c.need = Math.max(0, Math.round(c.soCau)); fixed += c.need; }
    else if (c.tiLe !== null && c.tiLe !== undefined) pctCells.push(c);
    else { c.need = 0; issues.push({ level: 'CANH_BAO', msg: sec.ten + ': một ô chưa có SoCau hoặc TiLe (tính là 0 câu)' }); }
  });
  if (pctCells.length) {
    if (!sec.tongSoCau) {
      issues.push({ level: 'LOI', msg: sec.ten + ': dùng TiLe % thì phải có TongSoCau' });
      pctCells.forEach(function (c) { c.need = 0; });
      return;
    }
    var remain = sec.tongSoCau - fixed;
    var sumPct = pctCells.reduce(function (a, c) { return a + c.tiLe; }, 0) || 1;
    var raw = pctCells.map(function (c) { return remain * c.tiLe / sumPct; });
    var floors = raw.map(Math.floor);
    var left = remain - floors.reduce(function (a, b) { return a + b; }, 0);
    var order = raw.map(function (v, i) { return { i: i, frac: v - floors[i] }; }).sort(function (a, b) { return b.frac - a.frac; });
    for (var k = 0; k < left && k < order.length; k++) floors[order[k].i]++;
    pctCells.forEach(function (c, i) { c.need = floors[i]; });
    if (Math.abs(sumPct - 100) > 0.01) issues.push({ level: 'CANH_BAO', msg: sec.ten + ': tổng TiLe = ' + sumPct + '% (không phải 100%), đã chia theo tỉ lệ tương đối' });
  }
}

function Mx_norm(s) { return U_removeDiacritics(U_str(s)).toLowerCase().replace(/\s+/g, ' ').trim(); }

function Mx_chuongMatch(unitChuong, list) {
  if (!list.length) return true;
  var u = Mx_norm(unitChuong);
  return list.some(function (v) {
    var n = Mx_norm(v);
    return u === n || u.indexOf(n + '.') === 0 || u.indexOf(n + ' ') === 0 || u.indexOf(n + ':') === 0;
  });
}

function Mx_matches(unit, cell, sec) {
  if (sec.allowed.length && sec.allowed.indexOf(unit.dang) < 0) return false;
  if (cell.dang.length && cell.dang.indexOf(unit.dang) < 0) return false;
  if (cell.maChuDe.length && cell.maChuDe.indexOf(unit.maChuDe) < 0) return false;
  if (cell.mucDo.length && cell.mucDo.indexOf(unit.mucDo) < 0) return false;
  if (!Mx_chuongMatch(unit.chuong, cell.chuong)) return false;
  return true;
}

function Mx_specificity(cell) {
  return (cell.maChuDe.length ? 4 : 0) + (cell.chuong.length ? 2 : 0) + (cell.mucDo.length ? 2 : 0) + (cell.dang.length ? 1 : 0);
}

function Mx_cellLabel(sec, cell) {
  var parts = [];
  if (cell.chuong.length) parts.push('Chương ' + cell.chuong.join('/'));
  if (cell.maChuDe.length) parts.push('Chủ đề ' + cell.maChuDe.join('/'));
  if (cell.mucDo.length) parts.push('Mức ' + cell.mucDo.join('/'));
  if (cell.dang.length) parts.push(cell.dang.join('/'));
  return sec.ten + ' › ' + (parts.length ? parts.join(', ') : 'Bất kỳ');
}

/** Tập tổng kích thước có thể tạo được (subset-sum) đến giới hạn */
function Mx_reachable(sizes, limit) {
  var can = [true];
  for (var i = 1; i <= limit; i++) can[i] = false;
  sizes.forEach(function (s) {
    for (var t = limit; t >= s; t--) if (can[t - s]) can[t] = true;
  });
  return can;
}

/**
 * Kiểm tra khả thi từng ô ma trận.
 * @return {Array} [{label, need, supply, needAll, status, note}]
 */
function Mx_feasibility(matrix, bank, nVariants, cheDo) {
  var out = [];
  nVariants = Math.max(1, nVariants || 1);
  matrix.sections.forEach(function (sec) {
    sec.cells.forEach(function (cell) {
      var cands = bank.units.filter(function (u) { return Mx_matches(u, cell, sec); });
      var supply = cands.reduce(function (a, u) { return a + u.size; }, 0);
      var sizes = cands.map(function (u) { return u.size; });
      var reach = Mx_reachable(sizes, cell.need);
      var needAll = cheDo === CHE_DO.B_KHAC ? cell.need * nVariants : cell.need;
      var st = 'OK', note = '';
      if (cell.need === 0) { st = 'OK'; note = 'Ô 0 câu'; }
      else if (!reach[cell.need]) { st = 'THIEU'; note = supply < cell.need ? 'Thiếu ' + (cell.need - supply) + ' câu' : 'Không ghép đủ đúng ' + cell.need + ' câu (do câu chùm theo nhóm)'; }
      else if (cheDo === CHE_DO.B_KHAC && supply < needAll) {
        st = 'TRUNG';
        note = 'Đủ cho từng mã đề nhưng các mã đề sẽ dùng chung khoảng ' + (needAll - supply) + ' lượt câu';
      }
      out.push({ phan: sec.phan, label: Mx_cellLabel(sec, cell), need: cell.need, supply: supply, needAll: needAll, status: st, note: note });
    });
  });
  return out;
}
