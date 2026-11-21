/**
 * 28_DonDep.gs — DỌN DẸP, THU GỌN & SAO LƯU DỮ LIỆU
 *
 *  - Thống kê dung lượng: số ô của từng sheet (giới hạn Google Sheets 10 triệu ô / file), dữ liệu từng kỳ thi.
 *  - Dọn nhật ký cũ (Trung tâm + phòng thi), dọn bản tự lưu thừa của kỳ thi đã đóng (giữ bài nộp + bản lưu cuối mỗi thí sinh).
 *  - Thu gọn: xoá dòng / cột trống thừa ở cuối mỗi sheet (giảm số ô, đọc ghi nhanh hơn).
 *  - Lưu trữ & xoá kỳ thi cũ: xuất toàn bộ dữ liệu kỳ thi ra 1 file Google Sheets lưu trữ rồi xoá khỏi hệ thống đang chạy.
 *  - Sao lưu toàn bộ: sao chép file Trung tâm, file phòng thi, các file ngân hàng vào thư mục SaoLuu/<thời điểm>.
 */

var DD_CELL_LIMIT = 10000000;

function DD_sheetStats(ss) {
  var out = [], cells = 0;
  ss.getSheets().forEach(function (sh) {
    var mr = sh.getMaxRows(), mc = sh.getMaxColumns ? sh.getMaxColumns() : Math.max(1, sh.getLastColumn());
    var lr = sh.getLastRow(), lc = sh.getLastColumn();
    out.push({ name: sh.getName(), rows: Math.max(0, lr - 1), maxRows: mr, cols: lc, maxCols: mc, cells: mr * mc, used: lr * lc });
    cells += mr * mc;
  });
  out.sort(function (a, b) { return b.cells - a.cells; });
  return { sheets: out, cells: cells, limit: DD_CELL_LIMIT, pct: Math.round(cells / DD_CELL_LIMIT * 1000) / 10 };
}
function DD_room() { try { return PTA_room(false); } catch (e) { return null; } }

/** Thống kê dung lượng + dữ liệu từng kỳ thi */
function DD_stats() {
  Repo_clearCache();
  var hub = S_hub(), room = DD_room();
  var res = { hub: DD_sheetStats(hub), room: room ? DD_sheetStats(room) : null, exams: [], logs: {} };
  var cnt = function (rows) { var m = {}; rows.forEach(function (r) { var k = U_str(r.MaKyThi); m[k] = (m[k] || 0) + 1; }); return m; };
  var hb = cnt(S_read(hub, SH.BAI_LAM)), hd = cnt(S_read(hub, SH.DE_THI)), hs = cnt(S_read(hub, SH.THI_SINH));
  var rb = {}, rl = {}, rLuu = {}, rn = {}, rg = {}, rState = {};
  if (room) {
    S_read(room, RSH.BAI_LAM).forEach(function (r) { var k = U_str(r.MaKyThi); rb[k] = (rb[k] || 0) + 1; if (U_upper(r.Loai) === 'LUU' || /^HUY_/.test(U_upper(r.Loai))) rLuu[k] = (rLuu[k] || 0) + 1; });
    rl = cnt(S_read(room, RSH.NHAT_KY)); rg = cnt(S_read(room, RSH.GOI_DE));
    if (room.getSheetByName(RSH.LT_NOP)) rn = cnt(S_read(room, RSH.LT_NOP));
    S_read(room, RSH.KY_THI).forEach(function (r) { rState[U_str(r.MaKyThi)] = U_str(r.TrangThai); });
  }
  Repo_examRows().forEach(function (e) {
    var k = U_str(e.MaKyThi);
    res.exams.push({ ma: k, ten: U_str(e.TenKyThi), stage: U_str(e.TrangThai), room: rState[k] || '', ngay: U_str(e.NgayThi) || U_str(e.NgayTao),
      hubRows: (hb[k] || 0) + (hd[k] || 0) + (hs[k] || 0), deThi: hd[k] || 0, thiSinh: hs[k] || 0, baiLamHub: hb[k] || 0,
      baiLamRoom: rb[k] || 0, tuLuu: rLuu[k] || 0, nhatKy: rl[k] || 0, goiDe: rg[k] || 0, nopCode: rn[k] || 0 });
  });
  var hl = S_read(hub, SH.NHAT_KY);
  res.logs.hub = { n: hl.length, oldest: hl.length ? U_str(hl[0].ThoiGian) : '' };
  if (room) { var rlog = S_read(room, RSH.NHAT_KY); res.logs.room = { n: rlog.length, oldest: rlog.length ? PTA_fmt(rlog[0].ThoiGian) : '' }; }
  return res;
}

/** Dọn nhật ký: o = {days (xoá cũ hơn N ngày), hub:true, room:true, exams:[MaKyThi] (xoá nhật ký phòng thi của các kỳ thi này)} */
function DD_cleanLogs(o) {
  return S_withLock(function () {
    var days = Math.max(0, U_num(o.days, 30)), cut = Date.now() - days * 86400000, cutStr = Utilities.formatDate(new Date(cut), APP.TZ, 'yyyy-MM-dd HH:mm:ss');
    var exams = {}; (o.exams || []).forEach(function (m) { exams[U_str(m)] = 1; });
    var out = { hub: 0, room: 0 }, room = DD_room();
    if (o.hub !== false) {
      var before = S_read(S_hub(), SH.NHAT_KY).length;
      S_replaceWhere(S_hub(), SH.NHAT_KY, function (r) { return U_str(r.ThoiGian) && U_str(r.ThoiGian) < cutStr; }, []);
      out.hub = before - S_read(S_hub(), SH.NHAT_KY).length;
    }
    if (o.room !== false && room) {
      var open = {}; S_read(room, RSH.KY_THI).forEach(function (r) { if (U_upper(r.TrangThai) === 'MO') open[U_str(r.MaKyThi)] = 1; });
      var b2 = S_read(room, RSH.NHAT_KY).length;
      S_replaceWhere(room, RSH.NHAT_KY, function (r) {
        var k = U_str(r.MaKyThi);
        if (open[k]) return false;                         // không đụng kỳ thi đang mở
        return exams[k] || U_num(r.ThoiGian, 0) < cut;
      }, []);
      out.room = b2 - S_read(room, RSH.NHAT_KY).length;
    }
    S_log('DON_NHAT_KY', JSON.stringify(out) + ' (cũ hơn ' + days + ' ngày)');
    return out;
  });
}

/**
 * Dọn bản tự lưu thừa ở phòng thi (kỳ thi KHÔNG đang mở): mỗi thí sinh giữ mọi bài NỘP / GIẤY + 1 bản LƯU mới nhất.
 * o = {exams:[...] (bỏ trống = mọi kỳ thi đã đóng), huy:true (xoá cả lượt thi đã huỷ HUY_*), lt:true (gọn lịch sử nộp code: giữ lần điểm cao nhất + lần cuối)}
 */
function DD_cleanAutosave(o) {
  return S_withLock(function () {
    var room = DD_room();
    if (!room) throw new Error('Chưa có file phòng thi');
    var st = {}; S_read(room, RSH.KY_THI).forEach(function (r) { st[U_str(r.MaKyThi)] = U_upper(r.TrangThai); });
    var want = {}; (o.exams || []).forEach(function (m) { want[U_str(m)] = 1; });
    var ok = function (k) { return st[k] !== 'MO' && (o.exams && o.exams.length ? want[k] : st[k] === 'DONG' || !st[k]); };
    var rows = S_read(room, RSH.BAI_LAM), latest = {};
    rows.forEach(function (r) {
      if (!ok(U_str(r.MaKyThi)) || U_upper(r.Loai) !== 'LUU') return;
      var k = U_str(r.MaKyThi) + '|' + U_upper(r.SBD), b = latest[k];
      if (!b || U_num(r.Seq, 0) > U_num(b.Seq, 0) || (U_num(r.Seq, 0) === U_num(b.Seq, 0) && U_num(r.ThoiGian, 0) > U_num(b.ThoiGian, 0))) latest[k] = r;
    });
    var del = 0;
    var keep = rows.filter(function (r) {
      var k = U_str(r.MaKyThi);
      if (!ok(k)) return true;
      var L = U_upper(r.Loai);
      if (L === 'LUU' && latest[k + '|' + U_upper(r.SBD)] !== r) { del++; return false; }
      if (o.huy && /^HUY_/.test(L)) { del++; return false; }
      return true;
    });
    if (del) S_writeAll(room, RSH.BAI_LAM, keep);
    var delLt = 0;
    if (o.lt && room.getSheetByName(RSH.LT_NOP)) {
      var nr = S_read(room, RSH.LT_NOP), best = {}, last = {};
      nr.forEach(function (r) {
        if (!ok(U_str(r.MaKyThi))) return;
        var k = U_str(r.MaKyThi) + '|' + U_upper(r.SBD) + '|' + U_str(r.MaBai);
        if (!best[k] || U_num(r.Diem, 0) > U_num(best[k].Diem, 0)) best[k] = r;
        if (!last[k] || U_num(r.ThoiGian, 0) > U_num(last[k].ThoiGian, 0)) last[k] = r;
      });
      var keep2 = nr.filter(function (r) {
        if (!ok(U_str(r.MaKyThi))) return true;
        var k = U_str(r.MaKyThi) + '|' + U_upper(r.SBD) + '|' + U_str(r.MaBai);
        if (best[k] === r || last[k] === r) return true;
        delLt++; return false;
      });
      if (delLt) S_writeAll(room, RSH.LT_NOP, keep2);
    }
    S_log('DON_TU_LUU', del + ' bản lưu, ' + delLt + ' lần nộp code');
    return { baiLam: del, nopCode: delLt };
  });
}

/** Thu gọn: xoá dòng/cột trống thừa ở cuối mọi sheet (giữ dự phòng) */
function DD_compact() {
  return S_withLock(function () {
    var spare = {}; spare[RSH.BAI_LAM] = 300; spare[RSH.NHAT_KY] = 300; spare[RSH.LT_NOP] = 200;
    var one = function (ss, isRoom) {
      var freed = 0;
      ss.getSheets().forEach(function (sh) {
        var mr = sh.getMaxRows(), lr = Math.max(1, sh.getLastRow()), keepR = lr + ((isRoom && spare[sh.getName()]) || 20);
        if (mr > keepR + 1 && sh.deleteRows) { var n = mr - keepR; sh.deleteRows(keepR + 1, n); freed += n * (sh.getMaxColumns ? sh.getMaxColumns() : 1); }
        if (sh.getMaxColumns && sh.deleteColumns) {
          var mc = sh.getMaxColumns(), lc = Math.max(1, sh.getLastColumn()), keepC = lc + 2;
          if (mc > keepC + 1) { sh.deleteColumns(keepC + 1, mc - keepC); freed += (mc - keepC) * sh.getMaxRows(); }
        }
      });
      return freed;
    };
    var out = { hub: one(S_hub(), false), room: 0 }, room = DD_room();
    if (room) out.room = one(room, true);
    S_log('THU_GON', JSON.stringify(out));
    return out;
  });
}

/** Lưu trữ (xuất file) & xoá 1 kỳ thi. o = {xacNhan: MaKyThi, luuTru:true, xoaPhongThi:true, xoaTrungTam:false, xoaTep:false} */
function DD_archiveExam(maKyThi, o) {
  maKyThi = U_str(maKyThi);
  if (U_str(o.xacNhan) !== maKyThi) throw new Error('Gõ đúng mã kỳ thi "' + maKyThi + '" để xác nhận.');
  return S_withLock(function () {
    Repo_clearCache();
    var hub = S_hub(), room = DD_room(), exRow = Repo_examRow(maKyThi);
    var rEx = room ? PTA_examRow(room, maKyThi) : null;
    if (rEx && U_upper(rEx.TrangThai) === 'MO') throw new Error('Kỳ thi đang MỞ trên phòng thi — đóng phòng thi trước.');
    var mine = function (r) { return U_str(r.MaKyThi) === maKyThi; };
    var hubSheets = [SH.KY_THI, SH.MA_DE, SH.DE_THI, SH.THI_SINH, SH.BAI_LAM, SH.KET_QUA, SH.DIEM_PHAN, SH.KQ_CHU_DE, SH.PHUC_KHAO, SH.LT_KQ];
    var roomSheets = [RSH.KY_THI, RSH.THI_SINH, RSH.GOI_DE, RSH.BAI_LAM, RSH.NHAT_KY, RSH.LT_TEST, RSH.LT_NOP];
    var out = { archive: '', removedHub: 0, removedRoom: 0, trashed: 0 };
    if (o.luuTru !== false) {
      var folder = S_folder('PROP_ARCHIVE_FOLDER', 'LuuTru');
      var ar = SpreadsheetApp.create('LuuTru_' + maKyThi + '_' + Utilities.formatDate(new Date(), APP.TZ, 'yyyyMMdd_HHmm'));
      var put = function (name, rows) {
        rows = rows.map(function (r) { var x = {}; Object.keys(r).forEach(function (k) { if (k !== '__row') x[k] = r[k]; }); return x; });
        if (!rows.length) return;
        var head = []; rows.forEach(function (r) { Object.keys(r).forEach(function (k) { if (head.indexOf(k) < 0) head.push(k); }); });
        var sh = ar.insertSheet(name);
        if (sh.getMaxRows() < rows.length + 1 && sh.insertRowsAfter) sh.insertRowsAfter(sh.getMaxRows(), rows.length + 1 - sh.getMaxRows());
        sh.getRange(1, 1, 1, head.length).setValues([head]);
        sh.getRange(2, 1, rows.length, head.length).setValues(rows.map(function (r) { return head.map(function (h) { var v = r[h]; v = v == null ? '' : String(v); return v.length > 49000 ? v.substring(0, 49000) : v; }); }));
      };
      hubSheets.forEach(function (n) { if (hub.getSheetByName(n)) put('TT_' + n, S_read(hub, n).filter(mine)); });
      if (room) roomSheets.forEach(function (n) { if (room.getSheetByName(n) && n !== RSH.GOI_DE) put('PT_' + n, S_read(room, n).filter(mine)); });
      try { var s1 = ar.getSheetByName('Sheet1') || ar.getSheetByName('Trang tính1'); if (s1 && ar.getSheets().length > 1) ar.deleteSheet(s1); } catch (e) { }
      try { DriveApp.getFileById(ar.getId()).moveTo(folder); } catch (e) { }
      out.archive = ar.getUrl();
    }
    if (o.xoaPhongThi !== false && room) {
      roomSheets.forEach(function (n) {
        if (!room.getSheetByName(n)) return;
        var b = S_read(room, n).length;
        S_replaceWhere(room, n, mine, []);
        out.removedRoom += b - S_read(room, n).length;
      });
      try { CacheService.getScriptCache().remove('ex|' + maKyThi); } catch (e) { }
    }
    if (o.xoaTrungTam) {
      if (o.xoaTep) {
        Repo_variantRows(maKyThi).forEach(function (v) { if (U_str(v.FormId)) { try { DriveApp.getFileById(U_str(v.FormId)).setTrashed(true); out.trashed++; } catch (e) { } } });
        if (U_str(exRow.ThuMucId)) { try { DriveApp.getFolderById(U_str(exRow.ThuMucId)).setTrashed(true); out.trashed++; } catch (e) { } }
      }
      hubSheets.forEach(function (n) {
        if (!hub.getSheetByName(n)) return;
        var b = S_read(hub, n).length;
        S_replaceWhere(hub, n, mine, []);
        out.removedHub += b - S_read(hub, n).length;
      });
    }
    S_log('LUU_TRU_KY_THI', maKyThi + ' ' + JSON.stringify(out));
    return out;
  });
}

/** Sao lưu toàn bộ: bản sao file Trung tâm, phòng thi, ngân hàng → thư mục SaoLuu/<thời điểm> */
function DD_backup() {
  var parent = S_folder('PROP_BACKUP_FOLDER', 'SaoLuu');
  var stamp = Utilities.formatDate(new Date(), APP.TZ, 'yyyy-MM-dd_HHmm');
  var folder = parent.createFolder(stamp), files = [];
  var copy = function (id, name) {
    try { var f = DriveApp.getFileById(id).makeCopy(name + '_' + stamp, folder); files.push({ name: name, url: f.getUrl() }); }
    catch (e) { files.push({ name: name, err: e.message }); }
  };
  copy(S_hub().getId(), 'TrungTam');
  var room = DD_room(); if (room) copy(room.getId(), 'PhongThi_DuLieu');
  Repo_subjects().forEach(function (s) { if (s.id) copy(s.id, 'NganHang_' + s.maMon); });
  // chỉ giữ N bản sao lưu gần nhất (mặc định 8) — bản cũ hơn chuyển vào Thùng rác
  var keep = Math.max(1, U_num(Repo_config().DD_GIU_SAO_LUU, 8)), list = [], trashed = 0;
  try { list = JSON.parse(S_props().getProperty('PROP_BACKUP_LIST') || '[]') || []; } catch (e) { list = []; }
  list.push({ id: folder.getId(), name: stamp });
  while (list.length > keep) { var old = list.shift(); try { DriveApp.getFolderById(old.id).setTrashed(true); trashed++; } catch (e) { } }
  S_props().setProperty('PROP_BACKUP_LIST', JSON.stringify(list));
  S_log('SAO_LUU', stamp + ' · ' + files.length + ' tệp' + (trashed ? ' · bỏ ' + trashed + ' bản cũ' : ''));
  return { folder: folder.getUrl(), name: stamp, files: files, kept: list.length, trashed: trashed };
}

/* ================================================================ BẢO TRÌ TỰ ĐỘNG (hằng tuần) */

var DD_AUTO_FN = 'DD_autoTick';
function DD_cfgSet(kv) {
  Object.keys(kv).forEach(function (k) { S_upsert(S_hub(), SH.CAU_HINH, function (x) { return U_str(x.Khoa); }, { Khoa: k, GiaTri: String(kv[k]), MoTa: 'Bảo trì tự động' }); });
  Repo_clearCache();
}
function DD_autoGet() {
  var c = Repo_config();
  var tr = ScriptApp.getProjectTriggers().filter(function (t) { return t.getHandlerFunction() === DD_AUTO_FN; });
  return { on: tr.length > 0, days: U_num(c.DD_TU_DONG_NGAY, 60), backup: U_str(c.DD_TU_DONG_SAO_LUU) !== 'KHONG', keep: U_num(c.DD_GIU_SAO_LUU, 8),
    last: U_str(c.DD_TU_DONG_LAN_CUOI), lastMsg: U_str(c.DD_TU_DONG_KET_QUA) };
}
/** Bật / tắt bảo trì tự động: 2 giờ sáng Chủ nhật hằng tuần → sao lưu, dọn nhật ký cũ, dọn bản tự lưu kỳ thi đã đóng, thu gọn */
function DD_autoSet(o) {
  ScriptApp.getProjectTriggers().forEach(function (t) { if (t.getHandlerFunction() === DD_AUTO_FN) ScriptApp.deleteTrigger(t); });
  DD_cfgSet({ DD_TU_DONG_NGAY: Math.max(7, U_num(o.days, 60)), DD_TU_DONG_SAO_LUU: o.backup === false ? 'KHONG' : 'CO', DD_GIU_SAO_LUU: Math.max(1, Math.min(52, U_num(o.keep, 8))) });
  if (o.on) ScriptApp.newTrigger(DD_AUTO_FN).timeBased().everyWeeks(1).onWeekDay(ScriptApp.WeekDay.SUNDAY).atHour(2).create();
  S_log('BAO_TRI_TU_DONG', o.on ? 'BẬT' : 'TẮT');
  return DD_autoGet();
}
function DD_autoTick() {
  var c = DD_autoGet(), parts = [];
  // đang có kỳ thi mở trên phòng thi → bỏ qua lần này (không làm chậm phòng thi)
  var room = DD_room();
  if (room && S_read(room, RSH.KY_THI).some(function (r) { return U_upper(r.TrangThai) === 'MO'; })) {
    DD_cfgSet({ DD_TU_DONG_LAN_CUOI: S_now(), DD_TU_DONG_KET_QUA: 'Bỏ qua: đang có kỳ thi mở' });
    return { skipped: true };
  }
  try {
    if (c.backup) { var b = DD_backup(); parts.push('sao lưu ' + b.files.length + ' tệp'); }
    var l = DD_cleanLogs({ days: c.days }); parts.push('nhật ký −' + (l.hub + l.room));
    if (room) { var a = DD_cleanAutosave({ huy: true, lt: true }); parts.push('tự lưu −' + a.baiLam + ', code −' + a.nopCode); }
    var k = DD_compact(); parts.push('thu gọn ' + (k.hub + k.room) + ' ô');
  } catch (e) { parts.push('LỖI: ' + e.message); }
  DD_cfgSet({ DD_TU_DONG_LAN_CUOI: S_now(), DD_TU_DONG_KET_QUA: parts.join(' · ') });
  return { done: parts };
}
