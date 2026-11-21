/**
 * 22_Repo.gs — Truy xuất dữ liệu (đọc sheet -> đối tượng nghiệp vụ)
 */

var _REPO = {};

function Repo_config() {
  if (_REPO.cfg) return _REPO.cfg;
  var m = {};
  DEFAULT_CONFIG.forEach(function (r) { m[r[0]] = r[1]; });
  try { S_read(S_hub(), SH.CAU_HINH).forEach(function (r) { if (U_str(r.Khoa)) m[U_str(r.Khoa)] = U_str(r.GiaTri); }); } catch (e) { }
  _REPO.cfg = m;
  return m;
}

function Repo_levels() { return U_parseLevels(Repo_config().MUC_DO); }

function Repo_subjects() {
  return S_read(S_hub(), SH.MON_HOC).map(function (r) {
    return { maMon: U_str(r.MaMon), ten: U_str(r.TenMon), id: U_str(r.FileNganHangId), url: U_str(r.LinkFile) };
  });
}

function Repo_subject(maMon) {
  var s = Repo_subjects().filter(function (x) { return x.maMon === U_str(maMon); })[0];
  if (!s) throw new Error('Không tìm thấy môn ' + maMon + ' trong sheet MonHoc');
  if (!s.id) throw new Error('Môn ' + maMon + ' chưa có FileNganHangId');
  return s;
}

/** Đọc & dựng ngân hàng của một môn */
function Repo_bank(maMon) {
  _REPO.bank = _REPO.bank || {};
  if (_REPO.bank[maMon]) return _REPO.bank[maMon];
  var s = Repo_subject(maMon);
  var ss = S_open(s.id);
  var bank = Bank_build(S_read(ss, BSH.CAU_HOI), S_read(ss, BSH.NHOM), S_read(ss, BSH.DANH_MUC), Repo_levels());
  bank.subject = s;
  _REPO.bank[maMon] = bank;
  return bank;
}

function Repo_matrixList() {
  var hub = S_hub();
  var rows = S_read(hub, SH.MT_PHAN);
  var m = {};
  rows.forEach(function (r) {
    var id = U_str(r.MaMaTran);
    if (!id) return;
    if (!m[id]) m[id] = { id: id, maMon: U_str(r.MaMon), ten: U_str(r.TenMaTran), phan: 0, diem: 0, soCau: 0 };
    m[id].phan++; m[id].diem += U_num(r.DiemPhan, 0); m[id].soCau += U_num(r.TongSoCau, 0);
  });
  return Object.keys(m).map(function (k) { return m[k]; });
}

function Repo_matrix(maMaTran) {
  var hub = S_hub();
  return Mx_build(U_str(maMaTran), S_read(hub, SH.MT_PHAN), S_read(hub, SH.MT_CHITIET));
}

function Repo_examRows() { return S_read(S_hub(), SH.KY_THI); }

function Repo_examRow(maKyThi) {
  var r = Repo_examRows().filter(function (x) { return U_str(x.MaKyThi) === U_str(maKyThi); })[0];
  if (!r) throw new Error('Không tìm thấy kỳ thi ' + maKyThi);
  return r;
}

function Repo_setExam(maKyThi, patch) {
  S_update(S_hub(), SH.KY_THI, function (o) { return U_str(o.MaKyThi) === U_str(maKyThi); }, patch);
}

function Repo_variantRows(maKyThi) {
  return S_read(S_hub(), SH.MA_DE).filter(function (r) { return U_str(r.MaKyThi) === U_str(maKyThi); })
    .sort(function (a, b) { return U_str(a.MaDe) < U_str(b.MaDe) ? -1 : 1; });
}

function Repo_items(maKyThi) {
  return S_read(S_hub(), SH.DE_THI).filter(function (r) { return U_str(r.MaKyThi) === U_str(maKyThi); })
    .map(function (r) { r.MaDe = U_str(r.MaDe); r.MaCH = U_str(r.MaCH); r.Phan = U_str(r.Phan); return r; });
}

function Repo_students(maKyThi) {
  return S_read(S_hub(), SH.THI_SINH).filter(function (r) { return U_str(r.MaKyThi) === U_str(maKyThi); })
    .map(function (r) { r.SBD = U_str(r.SBD); r.MaDe = U_str(r.MaDe); return r; });
}

function Repo_reviews(maKyThi) {
  return S_read(S_hub(), SH.PHUC_KHAO).filter(function (r) { return U_str(r.MaKyThi) === U_str(maKyThi); });
}

/** Danh sách phần {phan, ten, diem}: lấy bản chụp lưu lúc sinh đề (KyThi.CauTrucPhan), nếu chưa có thì đọc ma trận */
function Repo_sections(examRow) {
  var snap = U_str(examRow.CauTrucPhan);
  if (snap) { try { return JSON.parse(snap); } catch (e) { } }
  return Repo_matrix(U_str(examRow.MaMaTran)).sections.map(function (s) { return { phan: s.phan, ten: s.ten, diem: s.diem }; });
}

function Repo_clearCache() { _REPO = {}; _SS_CACHE = {}; }
