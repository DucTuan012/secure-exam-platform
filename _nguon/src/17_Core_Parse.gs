/**
 * 17_Core_Parse.gs — PHÂN TÍCH VĂN BẢN DÁN VÀO (THUẦN, tự chứa).
 *
 * Dùng cho trình "Nhập câu hỏi nhanh": người dùng copy câu hỏi từ web / Word / PDF rồi dán,
 * hệ thống tự tách: nội dung câu, các lựa chọn A–J, đáp án, lời giải, mức độ, dạng câu.
 *
 * Các hàm PQ_* KHÔNG gọi hàm nào khác ngoài PQ_* để có thể chép nguyên văn sang trình duyệt
 * (PQ_clientSource) — một mã nguồn duy nhất cho cả máy chủ và giao diện.
 *
 * Nhận diện được:
 *   - Nhiều câu: "Câu 1:", "Câu 2 (TH).", "Question 3:", "Bài 4)" hoặc đánh số 1. 2. 3. liên tiếp
 *   - Lựa chọn (tối đa 10, A–J): "A." "A)" "(A)" "[A]" mỗi dòng một lựa chọn hoặc nằm chung một dòng "A. 1  B. 2  C. 3  D. 4"
 *   - Đáp án: "Đáp án: B", "Đáp án đúng là C", "Answer: A, C", "Chọn B", dấu * trước/sau lựa chọn,
 *     chữ in đậm/gạch chân khi dán từ web (ký hiệu đánh dấu PQ_MARK), bảng đáp án cuối bài "1.A 2.C 3.B…"
 *   - Đúng/Sai: các ý a) b) c) d) + đáp án "Đ S Đ S" / "a) Đúng b) Sai…" / (Đ) (S) cuối mỗi ý
 *   - Trả lời ngắn: câu không có lựa chọn, đáp án là phần sau "Đáp án:"
 *   - Lời giải: "Lời giải:", "Giải:", "Hướng dẫn giải", "Giải thích", "Explanation", "Solution"
 *   - Mức độ trong ngoặc sau số câu: (NB) (TH) (VD) (VDC) (Nhận biết)…
 */

/** Ký hiệu nội bộ đánh dấu đoạn chữ được nhấn mạnh (in đậm / gạch chân / tô màu) khi dán từ HTML */
var PQ_MARK = '\uE000';

function PQ_clientSource() {
  var fns = [PQ_normalize, PQ_dedupMath, PQ_noMark, PQ_levelOf, PQ_labelRe, PQ_findQuestionStarts, PQ_extractKeyTable, PQ_splitInline,
    PQ_parseTF, PQ_parseLetters, PQ_parseBlock, PQ_codeExtract, PQ_codeRestore, PQ_parse, PQ_parseNoCode, PQ_lang, PQ_fold, PQ_shingles, PQ_similarity, PQ_toRecord,
    PQ_optionMarks];
  return 'var PQ_MARK = "\\uE000";\n' + fns.map(function (f) { return f.toString(); }).join('\n\n');
}

function PQ_normalize(s) {
  s = String(s === null || s === undefined ? '' : s);
  if (s.normalize) s = s.normalize('NFC');
  return s.replace(/\r\n?/g, '\n').replace(/[\u00a0\u2007\u202f\u3000]/g, ' ').replace(/[\u200b-\u200d\u2060\ufeff]/g, '')
    .replace(/\t/g, '    ').split('\n').map(PQ_dedupMath).join('\n').replace(/[ ]+\n/g, '\n').replace(/\n[ ]*\n([ ]*\n)+/g, '\n\n').replace(/^\n+|\s+$/g, '');
}

/**
 * Bỏ phần công thức bị lặp khi copy từ web dùng MathJax/KaTeX: "x∈Rx∈R" → "x∈R", "arccotx+1>0arccotx+1>0" → "arccotx+1>0".
 * Chỉ gộp khi đoạn lặp có ký hiệu toán học (tránh sửa nhầm chữ thường).
 */
function PQ_dedupMath(s) {
  return String(s || '').replace(/([^\s]{3,}?)\1(?![^\s])/g, function (m, a) {
    return /[=<>+\-−∈∉∞()\[\]^_\/√∑∫≤≥≠≈·×|{}]/.test(a) && !/^[\d.,]+$/.test(a) ? a : m;
  }).replace(/([^\s]{3,}?)\1/g, function (m, a) {
    return /[=<>∈∉∞√∑∫≤≥≠≈]/.test(a) && /[A-Za-z]/.test(a) ? a : m;
  });
}

function PQ_noMark(s) { return String(s || '').split('\uE000').join('').replace(/[ ]{2,}/g, ' ').trim(); }

/** Mức độ từ chữ viết tắt / tên đầy đủ (trả '' nếu không nhận ra) */
function PQ_levelOf(s) {
  var t = PQ_fold(s).replace(/[^a-z ]/g, ' ').replace(/\s+/g, ' ').trim();
  if (!t) return '';
  if (/^(vdc|van dung cao)$/.test(t)) return 'VDC';
  if (/^(vd|van dung|vdt|van dung thap)$/.test(t)) return 'VD';
  if (/^(th|thong hieu)$/.test(t)) return 'TH';
  if (/^(nb|nhan biet|biet)$/.test(t)) return 'NB';
  return '';
}

/** Bỏ dấu tiếng Việt + chữ thường */
function PQ_fold(s) {
  return String(s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase();
}

/** Nhãn câu hỏi ở đầu dòng: "Câu 12 (TH):" "Question 3." "Bài 2)" */
function PQ_labelRe() {
  return /^\s*(?:câu\s*hỏi|câu|cau\s*hoi|cau|question|bài|bai|q)\s*(\d{1,4})\s*(?:\(([^)]{1,40})\)|\[([^\]]{1,40})\])?\s*[:.)\-–]?\s*/i;
}

/** Vị trí các dòng bắt đầu câu hỏi */
function PQ_findQuestionStarts(lines) {
  var re = PQ_labelRe(), out = [];
  lines.forEach(function (ln, i) {
    var m = ln.replace(/^[\uE000\s]+/, '').match(re);
    if (m) out.push({ i: i, num: Number(m[1]) });
  });
  if (out.length) return out;
  // không có "Câu N": dùng dòng đánh số "1." "2)" nếu số tăng liên tiếp
  var cands = [];
  lines.forEach(function (ln, i) {
    var m = ln.replace(/^[\uE000\s]+/, '').match(/^\s*(\d{1,3})\s*[.)]\s+\S/);
    if (m) cands.push({ i: i, num: Number(m[1]) });
  });
  if (cands.length < 2) return [];
  var seq = [], expect = cands[0].num;
  cands.forEach(function (c) { if (c.num === expect) { seq.push(c); expect++; } });
  return seq.length >= 2 ? seq : [];
}

/**
 * Bảng đáp án ở cuối: "ĐÁP ÁN\n1.A 2.B 3.C" hoặc "1-A, 2-C, 3-B" (≥3 cặp nếu không có tiêu đề).
 * @return {{lines:Array, table:Object}} lines đã cắt bỏ phần bảng
 */
function PQ_extractKeyTable(lines) {
  var pairRe = /(\d{1,4})\s*[.\-:)]?\s*([A-Ja-j](?:\s*[,&]\s*[A-Ja-j])*)(?![A-Za-zÀ-ỹ])/g;
  function pairs(text) {
    var res = [], m;
    pairRe.lastIndex = 0;
    while ((m = pairRe.exec(text))) res.push({ num: Number(m[1]), key: m[2].toUpperCase().replace(/\s+/g, '') });
    return res;
  }
  function onlyPairs(text) { return !text.replace(pairRe, '').replace(/[\s|,;.:\-–]+/g, ''); }
  var headRe = /^\s*(?:bảng\s*)?(?:đáp\s*án|dap\s*an|answer\s*key|answers|key)\s*[:.]?\s*$/i;
  var cut = -1, table = {};
  for (var i = lines.length - 1; i >= 0; i--) {
    if (headRe.test(lines[i])) {
      var rest = lines.slice(i + 1).join('\n');
      var ps = pairs(rest);
      if (ps.length >= 1) { cut = i; ps.forEach(function (p) { table[p.num] = p.key; }); }
      break;
    }
  }
  if (cut < 0) {
    // không có tiêu đề: các dòng cuối toàn cặp số-chữ
    var j = lines.length;
    while (j > 0 && (!lines[j - 1].trim() || onlyPairs(lines[j - 1]))) j--;
    var tail = lines.slice(j).join('\n');
    var tp = pairs(tail);
    if (tp.length >= 3) { cut = j; tp.forEach(function (p) { table[p.num] = p.key; }); }
  }
  return { lines: cut >= 0 ? lines.slice(0, cut) : lines, table: table };
}

/**
 * Tách các lựa chọn nằm chung một dòng: "… A. 1   B. 2   C. 3   D. 4".
 * @param {string} line
 * @param {boolean} lower dùng a) b) c) d)
 * @return {{before:string, opts:Array<string>}|null}
 */
function PQ_splitInline(line, lower) {
  var L = lower ? 'abcdefghij' : 'ABCDEFGHIJ';
  var pos = [], from = 0;
  for (var k = 0; k < 10; k++) {
    var re = new RegExp('(^|[\\s\\uE000*(\\[])\\*?[(\\[]?' + L[k] + '\\s*[.):\\]](?=\\s|\\uE000|$)', 'g');
    re.lastIndex = from;
    var m = re.exec(line);
    if (!m) break;
    var start = m.index + m[1].length;
    pos.push({ start: start, end: m.index + m[0].length });
    from = m.index + m[0].length;
  }
  if (pos.length < 2) return null;
  var beforeTxt = line.substring(0, pos[0].start);
  if (beforeTxt.trim() && pos.length < 3) return null; // giữa dòng cần ≥3 lựa chọn để tránh nhầm
  var opts = pos.map(function (p, idx) {
    var raw = line.substring(p.start, idx + 1 < pos.length ? pos[idx + 1].start : line.length);
    var lead = /^\s*\*/.test(raw) ? '*' : '';
    return lead + raw.replace(/^\s*\*?[(\[]?[A-Ja-j]\s*[.):\]]/, '').trim();
  });
  return { before: beforeTxt.replace(/\s+$/, ''), opts: opts };
}

/** Đ/S → true/false; null nếu không nhận ra */
function PQ_parseTF(tok) {
  var t = PQ_fold(tok).replace(/[^a-z]/g, '');
  if (['d', 't', 'dung', 'true', 'y', 'yes'].indexOf(t) >= 0) return true;
  if (['s', 'f', 'sai', 'false', 'n', 'no'].indexOf(t) >= 0) return false;
  return null;
}

/** "B" "A, C" "A và D" "AC" → ['A','C'] ; trả [] nếu không phải danh sách chữ cái */
function PQ_parseLetters(s) {
  var t = String(s || '').trim().replace(/[.。]+$/, '');
  if (!/^[A-Ja-j](?:\s*(?:,|;|&|\/|\+|và|va|and|hoặc|\s)\s*[A-Ja-j])*$/i.test(t) && !/^[A-J]{2,10}$/.test(t)) return [];
  var out = [];
  t.toUpperCase().replace(/HOẶC|HOAC|V[AÀ]|AND|OR/g, ' ').replace(/[^A-J]/g, '').split('').forEach(function (x) { if (out.indexOf(x) < 0) out.push(x); });
  return out.sort();
}

/** Lựa chọn nào được đánh dấu đúng: dấu * ✓ (đúng) hoặc chữ nhấn mạnh khi dán HTML */
function PQ_optionMarks(text) {
  var t = String(text || '');
  var star = /^\s*\*|\*\s*$|\(\s*\*\s*\)|[✓✔]|\((?:đúng|dung|correct)\)\s*$/i.test(t);
  var clean = PQ_noMark(t).replace(/^\s*\*+\s*/, '').replace(/\s*\*+\s*$/, '').replace(/\(\s*\*\s*\)/g, '')
    .replace(/\s*[✓✔]\s*/g, ' ').replace(/\s*\((?:đúng|dung|correct)\)\s*$/i, '').trim();
  var emph = t.indexOf('\uE000') >= 0;
  return { text: clean, star: star, emph: emph };
}

/**
 * Phân tích một khối văn bản của MỘT câu hỏi.
 * @return {Object} {num, stem, options[], correct[], tf[], answerText, dang, mucDo, loiGiai, warnings[], lang}
 */
function PQ_parseBlock(text, num, keyFromTable) {
  var lines = String(text || '').split('\n');
  var q = { num: num || null, stem: '', options: [], correct: [], tf: [], answerText: '', dang: '', mucDo: '', loiGiai: '',
    warnings: [], lang: 'vi', hasImageHint: false };
  if (lines.length) lines[0] = lines[0].replace(/^[\uE000\s]+/, '');
  var lab = lines.length ? lines[0].match(PQ_labelRe()) : null;
  if (lab) {
    q.num = Number(lab[1]);
    q.mucDo = PQ_levelOf(lab[2] || lab[3] || '');
    lines[0] = lines[0].substring(lab[0].length);
  } else if (lines.length) {
    var nm = lines[0].match(/^\s*(\d{1,3})\s*[.)]\s+/);
    if (nm && num) lines[0] = lines[0].substring(nm[0].length);
  }
  // mức độ ghi ở cuối dòng đầu: "... (TH)"
  if (!q.mucDo && lines.length) {
    var lm = lines[0].match(/\s*[(\[]\s*(NB|TH|VDC|VD|Nhận biết|Thông hiểu|Vận dụng cao|Vận dụng)\s*[)\]]\s*$/i);
    if (lm) { q.mucDo = PQ_levelOf(lm[1]); lines[0] = lines[0].substring(0, lines[0].length - lm[0].length); }
  }

  // dòng đáp án: "Đáp án: B" / "Đáp án đúng là C" / "Answer: A" / "ĐS: 5"
  var ansRe = /^\s*(đáp\s*án(?:\s*đúng)?(?:\s*là)?|dap\s*an(?:\s*dung)?(?:\s*la)?|correct\s*answers?|answers?|ans|key|kết\s*quả|ket\s*qua|đáp\s*số|đs|đa)\s*([:.\-–]?)\s*(.*)$/i;
  var chonRe = /^\s*(?:[Cc]họn|[Cc]hon|CHỌN)\s*(?:đáp\s*án|phương\s*án|câu|phương án)?\s*([A-J](?:\s*(?:,|và|&)\s*[A-J])*)\s*[.:)]?\s*(.*)$/;
  var solRe = /^\s*(lời\s*giải|loi\s*giai|hướng\s*dẫn\s*giải|hướng\s*dẫn|huong\s*dan(?:\s*giai)?|giải\s*thích|giai\s*thich|giải\s*chi\s*tiết|giải|giai|explanation|solution)\s*(?:chi\s*tiết)?\s*([:.\-–]?)\s*(.*)$/i;
  var upRe = /^\s*(\*?)\s*[(\[]?([A-J])\s*[.):\]]\s*(.*)$/;
  var loRe = /^\s*(\*?)\s*[(\[]?([a-j])\s*[.):\]]\s*(.*)$/;

  var state = 'stem', stem = [], opts = [], optCase = '', sol = [], ansRaw = '', pendingEmpty = false;
  function nextLetter(cs) { return (cs === 'lo' ? 'abcdefghij' : 'ABCDEFGHIJ')[opts.length]; }
  function pushOpt(raw, cs) { opts.push(raw); optCase = cs; }

  for (var i = 0; i < lines.length; i++) {
    var ln = lines[i];
    var plain = PQ_noMark(ln);
    if (!plain && state !== 'sol') { pendingEmpty = false; continue; }
    if (state !== 'sol') {
      var am = plain.match(ansRe);
      if (am && (state === 'opts' || stem.length)) {
        var isVN = /^(đáp|dap)/i.test(am[1]);
        var okAns = am[2] === ':' || am[2] === '-' || am[2] === '–' ||
          (isVN && (state === 'opts' || PQ_parseLetters((am[3] || '').split(/[.:)\s]/)[0]).length > 0) && !/[?？]\s*$/.test(am[3]));
        if (okAns) { ansRaw = am[3]; state = 'sol'; continue; }
      }
      var cm = plain.match(chonRe);
      if (cm && (state === 'opts' || opts.length)) { ansRaw = cm[1] + (cm[2] ? '. ' + cm[2] : ''); state = 'sol'; continue; }
      var sm = plain.match(solRe);
      if (sm && (state === 'opts' || stem.length) && (sm[2] === ':' || (state === 'opts' && (sm[2] || !sm[3])))) {
        if (sm[3]) sol.push(sm[3]);
        state = 'sol'; continue;
      }
      // lựa chọn chung 1 dòng
      if (!opts.length) {
        var inl = PQ_splitInline(ln, false) || PQ_splitInline(ln, true);
        if (inl) {
          if (inl.before.trim()) stem.push(inl.before);
          var lower = /^\s*\*?\s*[(\[]?a\s*[.):\]]/.test(ln.substring(inl.before.length));
          inl.opts.forEach(function (o) { pushOpt(o, lower ? 'lo' : 'up'); });
          state = 'opts';
          continue;
        }
      } else if (opts.length < 10) {
        var inl2 = PQ_splitInline(ln, optCase === 'lo');
        if (inl2 && !inl2.before.trim()) {
          var firstL = ln.match(optCase === 'lo' ? loRe : upRe);
          if (firstL && firstL[2] === nextLetter(optCase)) {
            inl2.opts.forEach(function (o) { pushOpt(o, optCase); });
            continue;
          }
        }
      }
      var mUp = PQ_noMark(ln) ? ln.replace(/^\uE000+/, '').match(upRe) : null;
      var mLo = ln.replace(/^\uE000+/, '').match(loRe);
      var m = null, cs = '';
      if (mUp && mUp[2] === nextLetter(optCase || 'up') && (!optCase || optCase === 'up')) { m = mUp; cs = 'up'; }
      else if (mLo && mLo[2] === nextLetter(optCase || 'lo') && (!optCase || optCase === 'lo')) { m = mLo; cs = 'lo'; }
      if (m && (stem.length || opts.length)) {
        var lead = /^\uE000/.test(ln) ? '\uE000' : '';
        var content = (m[1] ? '*' : '') + lead + m[3];
        pushOpt(content, cs);
        pendingEmpty = !PQ_noMark(m[3]).replace(/^\*/, '');
        state = 'opts';
        continue;
      }
      if (state === 'opts') {
        if (pendingEmpty) { opts[opts.length - 1] += plain ? ' ' + ln.trim() : ''; pendingEmpty = false; }
        else opts[opts.length - 1] += '\n' + ln.trim();
        continue;
      }
      stem.push(ln);
    } else {
      var sh = plain.match(solRe);
      if (sh && (sh[2] === ':' || !sh[3]) && !sol.length) { if (sh[3]) sol.push(sh[3]); }
      else sol.push(ln);
    }
  }

  // ---- đáp án ----
  var optInfo = opts.map(PQ_optionMarks);
  q.options = optInfo.map(function (o) { return o.text; });
  q.stem = stem.map(function (s) { return s.split('\uE000').join('').replace(/\s+$/, ''); }).join('\n')
    .replace(/\n{3,}/g, '\n\n').replace(/^\s+|\s+$/g, '');
  ansRaw = PQ_noMark(ansRaw);
  var solText = sol.map(PQ_noMark).join('\n').trim();
  var stemFold = PQ_fold(q.stem);
  var isTFText = /dung hay sai|dung\s*\/\s*sai|dung, sai|true or false|true\/false|moi y|moi menh de|cac menh de sau/.test(stemFold);

  if (q.options.length >= 2 && (optCase === 'lo' || isTFText)) {
    // thử dạng Đúng/Sai
    var tf = [];
    var src = ansRaw || (keyFromTable || '');
    if (src) {
      var cleaned = PQ_fold(src).replace(/(^|[\s,;(])[a-j]\s*[).:\-]/g, ' ');
      var toks = cleaned.split(/[^a-z]+/).filter(String);
      tf = toks.map(PQ_parseTF).filter(function (x) { return x !== null; });
    }
    if (!tf.length) {
      // (Đ) / (S) / - Đúng ở cuối mỗi ý
      var perOpt = q.options.map(function (o) {
        var mm = o.match(/[\s(\[\-–]+(Đ|S|Đúng|Sai|T|F|True|False)\s*[)\]]?\s*$/i);
        return mm ? PQ_parseTF(mm[1]) : null;
      });
      if (perOpt.every(function (x) { return x !== null; })) {
        tf = perOpt;
        q.options = q.options.map(function (o) { return o.replace(/[\s(\[\-–]+(Đ|S|Đúng|Sai|T|F|True|False)\s*[)\]]?\s*$/i, '').trim(); });
      }
    }
    if (tf.length && tf.length === q.options.length) {
      q.dang = 'DUNG_SAI'; q.tf = tf; ansRaw = '';
    } else if (isTFText || (optCase === 'lo' && !PQ_parseLetters((src || '').split(/[.:\s]/)[0]).length)) {
      q.dang = 'DUNG_SAI'; q.tf = q.options.map(function () { return null; });
      if (src && tf.length) q.warnings.push('Số đáp án Đ/S (' + tf.length + ') khác số ý (' + q.options.length + ')');
      else q.warnings.push('Chưa nhận ra đáp án Đúng/Sai — hãy bấm chọn Đ/S cho từng ý');
    }
  }

  if (!q.dang && q.options.length >= 2) {
    var letters = [], tail = '';
    if (ansRaw) {
      var lm2 = ansRaw.match(/^\s*(?:là\s*)?(?:phương\s*án|đáp\s*án|câu)?\s*([A-Ja-j](?:\s*(?:,|;|&|\/|\+|và|and|hoặc)\s*[A-Ja-j])*)(?![A-Za-zÀ-ỹ])\s*[.:)\-–]?\s*([\s\S]*)$/);
      if (lm2) { letters = PQ_parseLetters(lm2[1]); tail = lm2[2]; }
      if (!letters.length) {
        // đáp án ghi bằng nội dung lựa chọn
        var hit = q.options.map(function (o, k) { return PQ_fold(o).trim() === PQ_fold(ansRaw).trim() ? 'ABCDEFGHIJ'[k] : ''; }).filter(String);
        if (hit.length === 1) letters = hit;
      }
    }
    if (!letters.length && keyFromTable) letters = PQ_parseLetters(keyFromTable);
    if (!letters.length) {
      var stars = optInfo.map(function (o, k) { return o.star ? 'ABCDEFGHIJ'[k] : ''; }).filter(String);
      if (stars.length && stars.length < q.options.length) letters = stars;
    }
    if (!letters.length) {
      var em = optInfo.map(function (o, k) { return o.emph ? 'ABCDEFGHIJ'[k] : ''; }).filter(String);
      if (em.length && em.length < q.options.length) { letters = em; q.warnings.push('Đáp án đoán từ chữ in đậm/tô màu khi dán — hãy kiểm tra lại'); }
    }
    letters = letters.filter(function (L) { return 'ABCDEFGHIJ'.indexOf(L) < q.options.length; });
    q.correct = letters.map(function (L) { return 'ABCDEFGHIJ'.indexOf(L); });
    var multiHint = /chon (tat ca|cac|hai|2|ba|3|nhung) (dap an|phuong an|y|cau)|(nhieu|cac) dap an dung|select all|choose (two|three|all)|all that apply/.test(stemFold);
    q.dang = (letters.length > 1 || (multiHint && letters.length !== 1)) ? 'NHIEU_DA' : 'MOT_DA';
    if (!letters.length) q.warnings.push('Chưa nhận ra đáp án đúng — hãy bấm chọn chữ cái đáp án');
    if (tail && tail.trim()) solText = (tail.trim() + (solText ? '\n' + solText : '')).trim();
    if (q.options.length > 10) q.warnings.push('Có hơn 10 lựa chọn — chỉ hỗ trợ A–J');
  }

  if (!q.dang) {
    q.dang = 'TRA_LOI_NGAN';
    var at = ansRaw || keyFromTable || '';
    q.answerText = at.replace(/[.。]\s*$/, '').trim();
    if (!q.options.length && !q.answerText) q.warnings.push('Không thấy lựa chọn A–D; coi là câu Trả lời ngắn — hãy nhập đáp án');
    if (q.options.length === 1) q.warnings.push('Chỉ tìm thấy 1 lựa chọn — kiểm tra lại định dạng A. B. C. D.');
  }
  q.loiGiai = solText;
  if (!q.stem) q.warnings.push('Không tách được nội dung câu hỏi');
  if (/hình\s*(vẽ|bên|dưới)|đồ\s*thị\s*(bên|dưới|sau)|figure|shown below|the graph/i.test(q.stem)) {
    q.hasImageHint = true;
    q.warnings.push('Câu có nhắc đến hình — nhớ dán ảnh kèm theo');
  }
  q.lang = PQ_lang(q.stem + ' ' + q.options.join(' '));
  return q;
}

/**
 * Khối code: dòng chứa ``` (có thể kèm tên ngôn ngữ) mở, dòng ``` đóng. Nội dung bên trong được giữ NGUYÊN VĂN
 * (không chuẩn hóa, không bị đọc thành đáp án/công thức). Thay bằng ký hiệu giữ chỗ 1 dòng "\uE001n\uE001" khi phân tích.
 * @return {{text:string, blocks:string[]}}
 */
function PQ_codeExtract(text) {
  var lines = String(text === null || text === undefined ? '' : text).replace(/\r\n?/g, '\n').split('\n');
  var out = [], blocks = [], i = 0;
  while (i < lines.length) {
    var m = lines[i].match(/^\s*```+\s*([\w+#.-]*)\s*$/);
    if (!m) { out.push(lines[i]); i++; continue; }
    var j = i + 1, body = [];
    while (j < lines.length && !/^\s*```+\s*$/.test(lines[j])) { body.push(lines[j]); j++; }
    if (j >= lines.length) { out.push(lines[i]); i++; continue; } // không có dòng đóng: coi là chữ thường
    var ind = Math.min.apply(null, body.filter(function (l) { return l.trim(); }).map(function (l) { return l.match(/^ */)[0].length; }).concat([1e9]));
    body = body.map(function (l) { return l.substring(ind === 1e9 ? 0 : ind).replace(/\t/g, '    ').replace(/\s+$/, ''); });
    while (body.length && !body[0]) body.shift();
    while (body.length && !body[body.length - 1]) body.pop();
    blocks.push('```' + (m[1] || '') + '\n' + body.join('\n') + '\n```');
    out.push('\uE001' + (blocks.length - 1) + '\uE001');
    i = j + 1;
  }
  return { text: out.join('\n'), blocks: blocks };
}

function PQ_codeRestore(s, blocks) {
  if (!blocks || !blocks.length || !s) return s;
  return String(s).replace(/\uE001(\d+)\uE001/g, function (m, n) { return blocks[Number(n)] !== undefined ? '\n' + blocks[Number(n)] + '\n' : m; })
    .replace(/\n{3,}/g, '\n\n').replace(/^\n+|\n+$/g, '');
}

/** Phân tích văn bản có thể chứa nhiều câu */
function PQ_parse(text) {
  var cx = PQ_codeExtract(text);
  var qs = PQ_parseNoCode(cx.text);
  if (!cx.blocks.length) return qs;
  qs.forEach(function (q) {
    q.stem = PQ_codeRestore(q.stem, cx.blocks);
    q.loiGiai = PQ_codeRestore(q.loiGiai, cx.blocks);
    q.options = q.options.map(function (o) { return PQ_codeRestore(o, cx.blocks); });
    q.hasCode = /```/.test(q.stem + q.options.join(''));
  });
  return qs;
}

function PQ_parseNoCode(text) {
  var norm = PQ_normalize(text);
  if (!norm) return [];
  var lines = norm.split('\n');
  var kt = PQ_extractKeyTable(lines);
  lines = kt.lines;
  var starts = PQ_findQuestionStarts(lines);
  var blocks = [];
  if (!starts.length) blocks.push({ text: lines.join('\n'), num: null });
  else {
    var pre = lines.slice(0, starts[0].i).join('\n').trim();
    starts.forEach(function (s, k) {
      var end = k + 1 < starts.length ? starts[k + 1].i : lines.length;
      blocks.push({ text: lines.slice(s.i, end).join('\n'), num: s.num });
    });
    if (pre && blocks.length) blocks[0].pre = pre; // phần dẫn chung trước câu đầu (bỏ qua)
  }
  return blocks.map(function (b) {
    var q = PQ_parseBlock(b.text, b.num, b.num !== null ? kt.table[b.num] : '');
    return q;
  }).filter(function (q) { return q.stem || q.options.length; });
}

/** Ngôn ngữ: 'vi' nếu có chữ có dấu tiếng Việt, 'en' nếu toàn chữ Latin không dấu */
function PQ_lang(text) {
  var t = String(text || '').replace(/\$[^$]*\$/g, ' ');
  var vn = (t.match(/[ăâđêôơưàáạảãằắặẳẵầấậẩẫèéẹẻẽềếệểễìíịỉĩòóọỏõồốộổỗờớợởỡùúụủũừứựửữỳýỵỷỹ]/gi) || []).length;
  var words = (t.match(/[A-Za-z]{2,}/g) || []).length;
  if (vn === 0 && words >= 3) return 'en';
  return 'vi';
}

/** Tập "bigram từ" để so độ giống (bỏ dấu, bỏ ký hiệu) */
function PQ_shingles(text) {
  var w = PQ_fold(text).replace(/\$/g, ' ').replace(/[^a-z0-9]+/g, ' ').trim().split(' ').filter(String);
  var set = {};
  if (w.length === 1) set[w[0]] = 1;
  for (var i = 0; i + 1 < w.length; i++) set[w[i] + ' ' + w[i + 1]] = 1;
  return set;
}

/** Hệ số giống nhau Jaccard 0..1 */
function PQ_similarity(a, b) {
  var ka = Object.keys(a), nb = Object.keys(b).length;
  if (!ka.length || !nb) return 0;
  var inter = 0;
  ka.forEach(function (k) { if (b[k]) inter++; });
  return inter / (ka.length + nb - inter);
}

/**
 * Chuyển kết quả phân tích -> bản ghi theo cột sheet CauHoi (chưa có MaCH / MaChuDe).
 * @param {Object} q kết quả PQ_parseBlock (có thể đã được người dùng sửa)
 */
function PQ_toRecord(q) {
  var r = { MucDo: q.mucDo || '', DangCau: q.dang, NoiDung_VI: '', NoiDung_EN: '', LoiGiai_VI: '', LoiGiai_EN: '', DapAn: '', CotGhep: '' };
  if (q.lang === 'en') { r.NoiDung_EN = q.stem; r.LoiGiai_EN = q.loiGiai || ''; }
  else { r.NoiDung_VI = q.stem; r.LoiGiai_VI = q.loiGiai || ''; }
  ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'].forEach(function (L, k) { r[L] = q.options[k] !== undefined ? q.options[k] : ''; });
  if (q.dang === 'MOT_DA' || q.dang === 'NHIEU_DA') r.DapAn = (q.correct || []).map(function (k) { return 'ABCDEFGHIJ'[k]; }).sort().join(',');
  else if (q.dang === 'DUNG_SAI') r.DapAn = (q.tf || []).every(function (x) { return x === true || x === false; }) && (q.tf || []).length ?
    q.tf.map(function (b) { return b ? 'Đ' : 'S'; }).join(',') : '';
  else if (q.dang === 'TRA_LOI_NGAN') { r.DapAn = q.answerText || ''; ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'].forEach(function (L) { r[L] = ''; }); }
  return r;
}
