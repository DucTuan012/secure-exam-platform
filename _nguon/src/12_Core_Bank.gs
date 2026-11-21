/**
 * 12_Core_Bank.gs — Đọc, chuẩn hoá và kiểm tra NGÂN HÀNG câu hỏi (THUẦN).
 *
 * Cách ghi cột DapAn theo dạng câu:
 *   MOT_DA       : B
 *   NHIEU_DA     : A,C,D          (thí sinh phải chọn ĐỦ và ĐÚNG mới được điểm)
 *   DUNG_SAI     : Đ,S,Đ,Đ        (theo thứ tự ý A,B,C,D; chấp nhận Đ/D/T/S/F) — phải đúng hết mới được điểm
 *   TRA_LOI_NGAN : 0.5 | 1/2      (nhiều đáp án chấp nhận cách nhau bởi |; số có sai số: 3.14~0.01)
 *   GHEP_NOI     : A-2,B-1,C-3    (ý bên trái ở cột A..E, danh sách bên phải ở cột CotGhep cách nhau bởi |)
 *
 * Cột KhongTron (không trộn đáp án):
 *   (trống)      tự phát hiện: "Tất cả đều đúng", "Cả A và B"… sẽ được giữ cố định
 *   TAT_CA       giữ nguyên thứ tự mọi đáp án của câu này
 *   D,E          giữ cố định vị trí các đáp án D và E
 *   TRON_HET     trộn tất cả, bỏ qua tự phát hiện
 */

var BANK_FIXED_RE = /(tất cả|tat ca|cả hai|ca hai|cả\s+[A-J]\b|không có (đáp án|phương án|ý) nào|đều đúng|đều sai|all of the (above|these)|none of the (above|these)|both|neither)/i;
var BANK_LETTER_REF_RE = /\b[A-J]\b\s*(,|và|va|and|&|hoặc|hoac|or)\s*\b[A-J]\b/;

function Bank_parseTF(tok) {
  var t = U_removeDiacritics(U_str(tok)).toUpperCase();
  if (['D', 'T', 'DUNG', 'TRUE', '1', 'Y'].indexOf(t) >= 0) return true;
  if (['S', 'F', 'SAI', 'FALSE', '0', 'N'].indexOf(t) >= 0) return false;
  return null;
}

/**
 * Phân tích đáp án theo dạng câu.
 * @param {string} dang
 * @param {string} raw
 * @param {{nOpt:number, nRight:number}} ctx số lựa chọn / số mục cột phải (để kiểm tra)
 * @return {{ok:boolean, key:Object, err:string}}
 */
function Bank_parseKey(dang, raw, ctx) {
  ctx = ctx || {};
  var s = U_str(raw);
  if (!s) return { ok: false, err: 'Chưa có đáp án (cột DapAn)' };
  var letters, toks;
  switch (dang) {
    case DANG.MOT_DA:
    case DANG.NHIEU_DA:
      letters = U_upper(s).replace(/HOẶC|HOAC|V[AÀ]|AND|OR/g, ' ').replace(/[^A-J]/g, '').split('');
      letters = letters.filter(function (x, i) { return letters.indexOf(x) === i; }).sort();
      if (!letters.length) return { ok: false, err: 'Đáp án phải là chữ cái A–J' };
      if (dang === DANG.MOT_DA && letters.length !== 1) return { ok: false, err: 'Dạng MOT_DA chỉ có 1 đáp án đúng' };
      if (ctx.nOpt) {
        for (var i = 0; i < letters.length; i++) {
          if (U_letterIndex(letters[i]) >= ctx.nOpt) return { ok: false, err: 'Đáp án ' + letters[i] + ' không có nội dung lựa chọn' };
        }
      }
      return { ok: true, key: { letters: letters } };
    case DANG.DUNG_SAI:
      toks = /[,;|\s]/.test(s) ? s.split(/[,;|\s]+/).filter(String) : Array.from(s);
      var tf = toks.map(Bank_parseTF);
      if (tf.some(function (x) { return x === null; })) return { ok: false, err: 'Đáp án Đúng/Sai chỉ gồm Đ hoặc S, ví dụ: Đ,S,Đ,Đ' };
      if (ctx.nOpt && tf.length !== ctx.nOpt) return { ok: false, err: 'Số đáp án Đ/S (' + tf.length + ') khác số ý (' + ctx.nOpt + ')' };
      return { ok: true, key: { tf: tf } };
    case DANG.TRA_LOI_NGAN:
      var answers = s.split('|').map(function (x) { return x.trim(); }).filter(String).map(function (a) {
        var tol = 0, v = a;
        var m = a.match(/^(.*?)~\s*([0-9.,]+)$/);
        if (m) { v = m[1].trim(); tol = U_parseNumber(m[2]) || 0; }
        return { text: v, norm: U_normText(v), num: U_parseNumber(v), tol: tol };
      });
      if (!answers.length) return { ok: false, err: 'Chưa có đáp án' };
      return { ok: true, key: { answers: answers } };
    case DANG.GHEP_NOI:
      var map = {}, bad = false;
      U_upper(s).split(/[,;|\s]+/).filter(String).forEach(function (p) {
        var m2 = p.match(/^([A-J])\s*[-:=>]*\s*(\d+)$/);
        if (!m2) { bad = true; return; }
        map[m2[1]] = Number(m2[2]);
      });
      if (bad || !Object.keys(map).length) return { ok: false, err: 'Đáp án ghép nối dạng A-2,B-1,C-3' };
      if (ctx.nOpt) {
        for (var k = 0; k < ctx.nOpt; k++) {
          if (!map[APP.LETTERS[k]]) return { ok: false, err: 'Thiếu cặp ghép cho ý ' + APP.LETTERS[k] };
        }
      }
      if (ctx.nRight) {
        for (var kk in map) if (map[kk] < 1 || map[kk] > ctx.nRight) return { ok: false, err: 'Cặp ' + kk + '-' + map[kk] + ' vượt số mục cột phải' };
      }
      return { ok: true, key: { map: map } };
  }
  return { ok: false, err: 'Dạng câu không hợp lệ' };
}

/** Ghi đáp án về dạng chuỗi chuẩn */
function Bank_keyToString(dang, key) {
  if (!key) return '';
  switch (dang) {
    case DANG.MOT_DA: case DANG.NHIEU_DA: return key.letters.join(',');
    case DANG.DUNG_SAI: return key.tf.map(function (b) { return b ? 'Đ' : 'S'; }).join(',');
    case DANG.TRA_LOI_NGAN: return key.answers.map(function (a) { return a.text + (a.tol ? '~' + a.tol : ''); }).join(' | ');
    case DANG.GHEP_NOI: return Object.keys(key.map).sort().map(function (k) { return k + '-' + key.map[k]; }).join(',');
  }
  return '';
}

function Bank_isActive(v) {
  var s = U_removeDiacritics(U_str(v)).toUpperCase();
  return !(s === 'AN' || s === 'HIDE' || s === 'NGUNG' || s === 'KHONG' || s === 'NO' || s === 'X_AN');
}

/** Chuẩn hoá cột KhongTron cho một câu */
function Bank_shuffleRule(raw, options) {
  var s = U_removeDiacritics(U_str(raw)).toUpperCase().replace(/\s+/g, '_');
  if (s === 'TAT_CA' || s === 'ALL' || s === 'CO' || s === 'X' || s === 'GIU_NGUYEN') return { noShuffle: true, fixed: [], auto: false };
  if (s === 'TRON_HET' || s === 'TRON') return { noShuffle: false, fixed: [], auto: false };
  if (s) {
    var fixed = s.replace(/[^A-J]/g, '').split('');
    return { noShuffle: false, fixed: fixed, auto: false };
  }
  // tự phát hiện
  var res = { noShuffle: false, fixed: [], auto: true };
  options.forEach(function (o) {
    var txt = o.vi + ' ' + o.en;
    if (BANK_LETTER_REF_RE.test(txt)) res.noShuffle = true;
    else if (BANK_FIXED_RE.test(txt)) res.fixed.push(o.key);
  });
  return res;
}

function Bank_splitRefs(v) {
  return U_str(v).split(/[\n;]+/).map(function (x) { return x.trim(); }).filter(String);
}

/**
 * Xây dựng ngân hàng từ dữ liệu sheet.
 * @param {Array<Object>} qRows dòng sheet CauHoi (đối tượng theo tên cột, có __row)
 * @param {Array<Object>} gRows dòng sheet Nhom
 * @param {Array<Object>} tRows dòng sheet DanhMuc
 * @param {Array} levels thang mức độ U_parseLevels
 */
function Bank_build(qRows, gRows, tRows, levels) {
  var issues = [];
  var levelCodes = levels.map(function (l) { return l.code; });
  function issue(lv, ma, row, msg) { issues.push({ level: lv, ma: ma, row: row, msg: msg }); }

  var topics = {};
  (tRows || []).forEach(function (r) {
    var code = U_str(r.MaChuDe);
    if (!code) return;
    if (topics[code]) issue('LOI', code, r.__row, 'Mã chủ đề bị trùng trong DanhMuc');
    topics[code] = { code: code, khoi: U_str(r.Khoi_CapDo), chuong: U_str(r.Chuong), chuDe: U_str(r.ChuDe), yccd: U_str(r.YeuCauCanDat) };
  });

  var groups = {};
  (gRows || []).forEach(function (r) {
    var id = U_str(r.MaNhom);
    if (!id) return;
    if (groups[id]) issue('LOI', id, r.__row, 'Mã nhóm bị trùng');
    groups[id] = {
      id: id, maChuDe: U_str(r.MaChuDe), mucDo: U_upper(r.MucDo), dang: U_normDang(r.DangCau),
      vi: U_str(r.NoiDung_VI), en: U_str(r.NoiDung_EN), latex: U_str(r.LaTeX), hinh: Bank_splitRefs(r.HinhAnh),
      video: U_str(r.Video), amThanh: U_str(r.AmThanh), active: Bank_isActive(r.TrangThai), row: r.__row, children: []
    };
  });

  var questions = {};
  (qRows || []).forEach(function (r) {
    var id = U_str(r.MaCH);
    var hasContent = U_str(r.NoiDung_VI) || U_str(r.NoiDung_EN) || U_str(r.A);
    if (!id) { if (hasContent) issue('LOI', '(dòng ' + r.__row + ')', r.__row, 'Thiếu mã câu hỏi MaCH'); return; }
    if (questions[id]) { issue('LOI', id, r.__row, 'Mã câu hỏi bị trùng — dòng sau bị bỏ qua'); return; }
    var q = {
      id: id, maChuDe: U_str(r.MaChuDe), mucDo: U_upper(r.MucDo), dang: U_normDang(r.DangCau), maNhom: U_str(r.MaNhom),
      vi: U_str(r.NoiDung_VI), en: U_str(r.NoiDung_EN), latex: U_str(r.LaTeX), hinh: Bank_splitRefs(r.HinhAnh),
      video: U_str(r.Video), amThanh: U_str(r.AmThanh), loiGiaiVi: U_str(r.LoiGiai_VI), loiGiaiEn: U_str(r.LoiGiai_EN),
      tag: U_str(r.Tag), active: Bank_isActive(r.TrangThai), row: r.__row, keyRaw: U_str(r.DapAn), options: [], right: []
    };
    var g = q.maNhom ? groups[q.maNhom] : null;
    if (q.maNhom && !g) issue('LOI', id, r.__row, 'Mã nhóm ' + q.maNhom + ' không có trong sheet Nhom');
    if (g) {
      if (!q.maChuDe) q.maChuDe = g.maChuDe;
      if (!q.mucDo) q.mucDo = g.mucDo;
      if (!q.dang) q.dang = g.dang;
    }
    APP.LETTERS.forEach(function (L) {
      var raw = U_str(r[L]);
      if (raw) { var b = U_bilingual(raw); q.options.push({ key: L, vi: b.vi, en: b.en, raw: raw }); }
    });
    // lựa chọn phải liền nhau A,B,C… không bỏ trống ở giữa
    q.options.forEach(function (o, idx) {
      if (o.key !== APP.LETTERS[idx]) issue('LOI', id, r.__row, 'Các lựa chọn phải điền liên tiếp từ cột A (đang trống ở giữa)');
    });
    if (U_str(r.CotGhep)) {
      q.right = U_str(r.CotGhep).split('|').map(function (x) { return U_bilingual(x.trim()); }).filter(function (x) { return x.vi || x.en; });
    }
    if (!q.dang) issue('LOI', id, r.__row, 'DangCau không hợp lệ (MOT_DA, NHIEU_DA, DUNG_SAI, TRA_LOI_NGAN, GHEP_NOI)');
    if (!q.mucDo) issue('LOI', id, r.__row, 'Thiếu mức độ MucDo');
    else if (levelCodes.indexOf(q.mucDo) < 0) issue('LOI', id, r.__row, 'Mức độ ' + q.mucDo + ' không có trong thang CauHinh!MUC_DO');
    if (!q.maChuDe) issue('LOI', id, r.__row, 'Thiếu mã chủ đề MaChuDe');
    else if (!topics[q.maChuDe]) issue('CANH_BAO', id, r.__row, 'Mã chủ đề ' + q.maChuDe + ' chưa khai báo trong DanhMuc');
    if (!q.vi && !q.en && !q.latex && !q.hinh.length) issue('LOI', id, r.__row, 'Câu hỏi chưa có nội dung');

    var nOpt = q.options.length;
    if (q.dang === DANG.MOT_DA || q.dang === DANG.NHIEU_DA) {
      if (nOpt < 2) issue('LOI', id, r.__row, 'Cần ít nhất 2 lựa chọn');
    } else if (q.dang === DANG.DUNG_SAI) {
      if (nOpt < 2) issue('LOI', id, r.__row, 'Câu Đúng/Sai cần các ý ở cột A, B, C, D');
      else if (nOpt !== 4) issue('CANH_BAO', id, r.__row, 'Câu Đúng/Sai có ' + nOpt + ' ý (chuẩn là 4)');
    } else if (q.dang === DANG.GHEP_NOI) {
      if (nOpt < 2) issue('LOI', id, r.__row, 'Câu ghép nối cần ít nhất 2 ý bên trái (cột A, B, …)');
      if (q.right.length < 2) issue('LOI', id, r.__row, 'Câu ghép nối cần cột CotGhep (các mục bên phải cách nhau bởi |)');
    }
    if (q.dang) {
      var pk = Bank_parseKey(q.dang, q.keyRaw, { nOpt: (q.dang === DANG.TRA_LOI_NGAN ? 0 : nOpt), nRight: q.right.length });
      if (!pk.ok) issue('LOI', id, r.__row, pk.err);
      else q.key = pk.key;
    }
    q.shuffle = Bank_shuffleRule(r.KhongTron, q.options);
    if (LX_segments(q.vi).some(function (x) { return x.type === 'inline' && !LX_toUnicode(x.value).ok; })) {
      issue('CANH_BAO', id, r.__row, 'Có công thức $…$ phức tạp — sẽ chuyển thành ảnh [CT]');
    }
    q.valid = !!(q.dang && q.key && q.mucDo && q.maChuDe && levelCodes.indexOf(q.mucDo) >= 0 &&
      !issues.some(function (x) { return x.ma === id && x.level === 'LOI'; }));
    questions[id] = q;
    if (g) g.children.push(id);
  });

  // Đơn vị bốc đề: câu đơn hoặc cả nhóm (câu chùm luôn đi liền nhau)
  var units = [];
  Object.keys(questions).forEach(function (id) {
    var q = questions[id];
    if (q.maNhom || !q.active || !q.valid) return;
    units.push(Bank_unit('Q:' + id, 'Q', [id], q, topics));
  });
  Object.keys(groups).forEach(function (gid) {
    var g = groups[gid];
    var kids = g.children.filter(function (cid) { return questions[cid].active; });
    if (!g.active) return;
    if (!kids.length) { issue('CANH_BAO', gid, g.row, 'Nhóm chưa có câu hỏi con nào đang dùng'); return; }
    var invalid = kids.filter(function (cid) { return !questions[cid].valid; });
    if (invalid.length) { issue('LOI', gid, g.row, 'Nhóm có câu con lỗi: ' + invalid.join(', ') + ' — nhóm tạm không được bốc'); return; }
    var dangs = kids.map(function (cid) { return questions[cid].dang; });
    if (dangs.some(function (d) { return d !== dangs[0]; })) {
      issue('LOI', gid, g.row, 'Các câu trong một nhóm phải cùng dạng câu (để nằm cùng một Phần)'); return;
    }
    var first = questions[kids[0]];
    var meta = { maChuDe: g.maChuDe || first.maChuDe, mucDo: g.mucDo || first.mucDo, dang: dangs[0] };
    units.push(Bank_unit('G:' + gid, 'G', kids, meta, topics));
  });

  return { questions: questions, groups: groups, topics: topics, units: units, issues: issues, levels: levels };
}

function Bank_unit(uid, kind, ids, meta, topics) {
  var t = topics[meta.maChuDe] || {};
  return {
    uid: uid, kind: kind, ids: ids, size: ids.length, maChuDe: meta.maChuDe, chuong: t.chuong || '',
    mucDo: meta.mucDo, dang: meta.dang
  };
}

/** Thống kê số câu theo Chương/Chủ đề × Mức độ × Dạng (chỉ câu hợp lệ, đang dùng) */
function Bank_summary(bank) {
  var rows = {};
  bank.units.forEach(function (u) {
    var k = u.maChuDe + '|' + u.dang;
    if (!rows[k]) rows[k] = { maChuDe: u.maChuDe, chuong: u.chuong, chuDe: (bank.topics[u.maChuDe] || {}).chuDe || '', dang: u.dang, byLevel: {}, total: 0 };
    rows[k].byLevel[u.mucDo] = (rows[k].byLevel[u.mucDo] || 0) + u.size;
    rows[k].total += u.size;
  });
  return Object.keys(rows).sort().map(function (k) { return rows[k]; });
}
