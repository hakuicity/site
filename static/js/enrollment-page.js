// enrollment-page.js — Admin enrollment panel
// Features: CSV/XLSX import, roster management, class management
'use strict';

(function waitForHk() {
  if (typeof window.hk === 'undefined') { setTimeout(waitForHk, 50); return; }

  const root = document.getElementById('hk-enrollment-page');
  if (!root) return;

  // ── State ─────────────────────────────────────────────────────────────────
  let _user = null, _profile = null;
  let _roster = [];
  let _activeTab    = 'import';
  let _parsedRows   = [];
  let _headers      = [];
  let _rawRows      = [];
  let _classFilter  = '';
  let _searchQuery  = '';
  let _selectedClass = null;
  let _xlsxLoaded   = false;

  // ── Styles ────────────────────────────────────────────────────────────────
  const style = document.createElement('style');
  style.textContent = `
    .enr { max-width:960px; margin:0 auto; padding:8px 0 60px; }
    .enr h1 { font-size:22px; font-weight:800; margin-bottom:4px; }
    .enr-header { display:flex; justify-content:space-between; align-items:center;
      flex-wrap:wrap; gap:12px; margin-bottom:24px; }
    .enr-tabs { display:flex; gap:0; border:1.5px solid #d1d5db; border-radius:9px;
      overflow:hidden; margin-bottom:20px; }
    .enr-tab { flex:1; padding:9px; background:#fff; border:none; cursor:pointer;
      font-size:13px; font-weight:600; color:#374151; transition:all .15s; font-family:inherit; }
    .enr-tab.active { background:#1565C0; color:#fff; }
    .enr-tab+.enr-tab { border-left:1.5px solid #d1d5db; }

    .enr-dropzone { border:2.5px dashed #d1d5db; border-radius:12px; padding:48px 24px;
      text-align:center; cursor:pointer; transition:all .2s; background:#fafafa; margin-bottom:20px; }
    .enr-dropzone:hover,.enr-dropzone.drag-over { border-color:#1565C0; background:#eff6ff; }
    .enr-dz-icon { font-size:36px; margin-bottom:12px; }
    .enr-dz-title { font-size:16px; font-weight:700; color:#374151; margin-bottom:6px; }
    .enr-dz-sub { font-size:13px; color:#6b7280; }

    .enr-mapping { display:grid; grid-template-columns:repeat(auto-fit,minmax(180px,1fr));
      gap:12px; margin-bottom:16px; }
    .enr-map-fld label { display:block; font-size:12px; font-weight:700; color:#374151; margin-bottom:4px; }
    .enr-map-fld select { width:100%; padding:8px 10px; border-radius:7px;
      border:1.5px solid #d1d5db; font-size:13px; background:#f9fafb; outline:none;
      box-sizing:border-box; }

    .enr-preview-wrap { overflow:auto; margin-bottom:16px; max-height:320px;
      border:1px solid #e5e7eb; border-radius:8px; }
    .enr-preview { width:100%; border-collapse:collapse; font-size:13px; }
    .enr-preview th { position:sticky; top:0; background:#f9fafb; padding:8px 10px;
      text-align:left; font-size:11px; color:#6b7280; border-bottom:1.5px solid #e5e7eb;
      font-weight:600; white-space:nowrap; }
    .enr-preview td { padding:8px 10px; border-bottom:1px solid #f3f4f6; white-space:nowrap; }
    .enr-preview tr.row-error td { background:#fef2f2; }
    .enr-preview tr.row-dup td { background:#fffbeb; }

    .enr-table { width:100%; border-collapse:collapse; font-size:13px; }
    .enr-table th { text-align:left; padding:8px 10px; font-size:11px; color:#9ca3af;
      border-bottom:1.5px solid #e5e7eb; font-weight:600; text-transform:uppercase;
      white-space:nowrap; }
    .enr-table td { padding:10px; border-bottom:1px solid #f3f4f6; }
    .enr-table tr:hover td { background:#f9fafb; }

    .enr-badge { display:inline-block; font-size:11px; font-weight:700; padding:2px 8px; border-radius:5px; }
    .enr-badge-linked  { background:#dcfce7; color:#166534; }
    .enr-badge-pending { background:#fef9c3; color:#a16207; }

    .enr-btn { padding:8px 18px; border-radius:8px; border:none; font-size:14px; font-weight:700;
      cursor:pointer; transition:all .15s; font-family:inherit; }
    .enr-btn-primary   { background:#1565C0; color:#fff; }
    .enr-btn-primary:hover { background:#0D47A1; }
    .enr-btn-primary:disabled { background:#93c5fd; cursor:default; }
    .enr-btn-secondary { background:#f3f4f6; color:#374151; border:1.5px solid #d1d5db; }
    .enr-btn-secondary:hover { border-color:#1565C0; color:#1565C0; }
    .enr-btn-sm { padding:5px 11px; font-size:12px; border-radius:6px;
      border:1.5px solid #d1d5db; background:transparent; cursor:pointer;
      font-weight:600; font-family:inherit; transition:all .15s; }
    .enr-btn-sm:hover { border-color:#1565C0; color:#1565C0; }
    .enr-btn-danger-sm { border-color:#fca5a5; color:#b91c1c; }
    .enr-btn-danger-sm:hover { background:#fef2f2; }

    .enr-filter-row { display:flex; gap:10px; flex-wrap:wrap; margin-bottom:14px; align-items:center; }
    .enr-search { padding:8px 12px; border-radius:8px; border:1.5px solid #d1d5db;
      font-size:13px; background:#f9fafb; outline:none; min-width:200px; box-sizing:border-box; }
    .enr-search:focus { border-color:#1565C0; }
    .enr-select { padding:8px 10px; border-radius:7px; border:1.5px solid #d1d5db;
      font-size:13px; background:#f9fafb; outline:none; }

    .enr-alert { padding:12px 16px; border-radius:8px; font-size:13px; margin-bottom:16px; }
    .enr-alert-info    { background:#eff6ff; border:1px solid #bfdbfe; color:#1e40af; }
    .enr-alert-success { background:#f0fdf4; border:1px solid #86efac; color:#166534; }

    .enr-section-title { font-size:13px; font-weight:700; color:#374151; text-transform:uppercase;
      letter-spacing:.5px; margin-bottom:12px; padding-bottom:8px; border-bottom:2px solid #e5e7eb; }

    .enr-stat-row { display:flex; gap:12px; flex-wrap:wrap; margin-bottom:16px; }
    .enr-stat { background:#fff; border:1px solid #e5e7eb; border-radius:10px;
      padding:14px 18px; text-align:center; min-width:90px; box-shadow:0 1px 3px rgba(0,0,0,.05); }
    .enr-stat-num { font-size:24px; font-weight:800; }
    .enr-stat-lbl { font-size:11px; color:#6b7280; }

    .enr-add-form { background:#f9fafb; border:1.5px solid #e5e7eb; border-radius:10px;
      padding:16px; margin-bottom:16px; }
    .enr-add-grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(150px,1fr));
      gap:10px; margin-bottom:12px; }
    .enr-add-fld label { display:block; font-size:12px; font-weight:700; margin-bottom:4px; color:#374151; }
    .enr-add-fld input { width:100%; padding:8px 10px; border-radius:7px;
      border:1.5px solid #d1d5db; font-size:13px; background:#fff; outline:none;
      box-sizing:border-box; }
    .enr-add-fld input:focus { border-color:#1565C0; }

    .enr-class-layout { display:grid; grid-template-columns:260px 1fr; gap:20px; }
    @media(max-width:640px){ .enr-class-layout { grid-template-columns:1fr; } }
    .enr-class-list-panel { border:1px solid #e5e7eb; border-radius:10px; overflow:hidden; }
    .enr-class-list-panel-title { padding:10px 14px; font-size:12px; font-weight:700;
      color:#6b7280; text-transform:uppercase; letter-spacing:.4px;
      background:#f9fafb; border-bottom:1px solid #e5e7eb; }
    .enr-class-item { padding:12px 16px; cursor:pointer; border-bottom:1px solid #f3f4f6;
      display:flex; justify-content:space-between; align-items:center; transition:background .1s; }
    .enr-class-item:last-child { border-bottom:none; }
    .enr-class-item:hover { background:#f9fafb; }
    .enr-class-item.active { background:#eff6ff; border-left:3px solid #1565C0; }
    .enr-class-item-name { font-weight:700; font-size:14px; }
    .enr-class-item-count { font-size:12px; color:#6b7280;
      background:#f3f4f6; padding:2px 8px; border-radius:10px; }

    .enr-inline-inp { padding:6px 10px; border-radius:6px; border:1.5px solid #d1d5db;
      font-size:13px; outline:none; background:#f9fafb; }
    .enr-inline-inp:focus { border-color:#1565C0; }

    .enr-empty { text-align:center; color:#9ca3af; padding:32px; font-size:14px; }

    .dark .enr-tab { background:#1e293b; color:#f1f5f9; }
    .dark .enr-tab.active { background:#1565C0; }
    .dark .enr-dropzone { background:#1e293b; border-color:#475569; }
    .dark .enr-dropzone:hover,.dark .enr-dropzone.drag-over { background:#1e3a5f; border-color:#1565C0; }
    .dark .enr-preview th { background:#0f172a; border-color:#334155; color:#64748b; }
    .dark .enr-preview td,.dark .enr-table td { border-color:#1e293b; }
    .dark .enr-table th { border-color:#334155; color:#64748b; }
    .dark .enr-stat,.dark .enr-class-list-panel { background:#1e293b; border-color:#334155; }
    .dark .enr-class-list-panel-title { background:#0f172a; border-color:#334155; }
    .dark .enr-class-item { border-color:#1e293b; }
    .dark .enr-class-item:hover { background:#0f172a; }
    .dark .enr-class-item.active { background:#1e3a5f; }
    .dark .enr-add-form { background:#1e293b; border-color:#334155; }
    .dark .enr-add-fld input,.dark .enr-search,.dark .enr-select,.dark .enr-inline-inp,.dark .enr-map-fld select {
      background:#0f172a; border-color:#475569; color:#f1f5f9; }
    .dark .enr-section-title { border-color:#334155; color:#94a3b8; }
    .dark .enr-table tr:hover td { background:#0f172a; }
  `;
  document.head.appendChild(style);

  // ── Init ──────────────────────────────────────────────────────────────────
  async function init() {
    root.innerHTML = '<p style="text-align:center;padding:40px;color:#6b7280">読み込み中...</p>';
    _user = await window.hk.getUser();
    if (!_user) {
      root.innerHTML = `<div style="text-align:center;padding:48px">
        <p style="font-size:16px;margin-bottom:16px">ログインが必要です。</p>
        <a href="/site/login/" style="display:inline-block;padding:11px 24px;background:#1565C0;
          color:#fff;border-radius:8px;font-weight:700;text-decoration:none">ログインする</a>
      </div>`; return;
    }
    _profile = await window.hk.getProfile(_user.id);
    if (!_profile || !['admin','teacher'].includes(_profile.role)) {
      root.innerHTML = `<div style="text-align:center;padding:48px">
        <p style="font-size:18px;margin-bottom:8px">⛔ アクセス権がありません</p>
        <p style="color:#6b7280;font-size:14px">このページは管理者・教員のみアクセス可能です。</p>
      </div>`; return;
    }
    await loadRoster();
    render();
  }

  async function loadRoster() {
    _roster = await window.hk.adminFetchRoster();
  }

  // ── Shell render ──────────────────────────────────────────────────────────
  function render() {
    const name = (_profile && _profile.display_name) || _user.email;
    root.innerHTML = `
      <div class="enr">
        <div class="enr-header">
          <div>
            <h1>生徒登録・管理</h1>
            <p style="font-size:13px;color:#6b7280">管理者パネル — ${esc(name)}</p>
          </div>
          <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">
            <a href="/site/admin/" style="text-decoration:none;padding:7px 14px;border-radius:7px;
              border:1.5px solid #d1d5db;font-size:13px;font-weight:600;color:#374151">← 管理者ページ</a>
            <button class="enr-btn enr-btn-secondary" id="enr-export-btn" style="font-size:13px">📤 CSVエクスポート</button>
          </div>
        </div>

        <div class="enr-tabs">
          <button class="enr-tab${_activeTab==='import'?' active':''}" data-tab="import">📥 一括登録</button>
          <button class="enr-tab${_activeTab==='roster'?' active':''}" data-tab="roster">📋 名簿一覧</button>
          <button class="enr-tab${_activeTab==='classes'?' active':''}" data-tab="classes">🏫 クラス管理</button>
          <button class="enr-tab${_activeTab==='passwords'?' active':''}" data-tab="passwords">🔑 パスワード管理</button>
        </div>

        <div id="enr-content"></div>
      </div>`;

    root.querySelectorAll('.enr-tab').forEach(btn => {
      btn.onclick = () => {
        _activeTab = btn.dataset.tab;
        root.querySelectorAll('.enr-tab').forEach(b => b.classList.toggle('active', b.dataset.tab === _activeTab));
        renderTab();
      };
    });
    document.getElementById('enr-export-btn').onclick = exportCSV;
    renderTab();
  }

  function renderTab() {
    const el = document.getElementById('enr-content');
    if (!el) return;
    if (_activeTab === 'import')    renderImportTab(el);
    else if (_activeTab === 'roster')    renderRosterTab(el);
    else if (_activeTab === 'classes')   renderClassesTab(el);
    else if (_activeTab === 'passwords') renderPasswordTab(el);
  }

  // ════════════════════════════════════════════════════════════════════════
  // IMPORT TAB
  // ════════════════════════════════════════════════════════════════════════
  function renderImportTab(el) {
    el.innerHTML = `
      <div class="enr-alert enr-alert-info">
        <strong>対応フォーマット：</strong> CSV (.csv) または Excel (.xlsx / .xls)<br>
        必須列：<strong>名前</strong>・<strong>学籍番号</strong> &nbsp;|&nbsp;
        任意列：クラス名・学校名 &nbsp;|&nbsp; 1行目はヘッダー行として扱われます。
      </div>

      <div class="enr-dropzone" id="enr-dz">
        <div class="enr-dz-icon">📂</div>
        <div class="enr-dz-title">ファイルをドロップ、またはクリックして選択</div>
        <div class="enr-dz-sub">CSV・XLSX・XLS に対応 · 最大 5MB</div>
        <input type="file" id="enr-file" accept=".csv,.xlsx,.xls" style="display:none">
      </div>

      <div id="enr-import-body" style="display:none">
        <div class="enr-section-title">列の対応付け</div>
        <div class="enr-mapping" id="enr-mapping"></div>

        <div class="enr-section-title">プレビュー（最大 50 行）</div>
        <p id="enr-preview-stats" style="font-size:13px;color:#6b7280;margin-bottom:8px"></p>
        <div class="enr-preview-wrap">
          <table class="enr-preview" id="enr-preview-tbl"></table>
        </div>

        <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap;margin-top:4px">
          <button class="enr-btn enr-btn-primary" id="enr-do-import">インポート実行</button>
          <button class="enr-btn enr-btn-secondary" id="enr-clear">キャンセル</button>
          <span id="enr-import-status" style="font-size:13px;color:#6b7280"></span>
        </div>
      </div>

      <div id="enr-import-result"></div>
    `;

    const dz   = document.getElementById('enr-dz');
    const fi   = document.getElementById('enr-file');
    dz.onclick      = () => fi.click();
    dz.ondragover   = e => { e.preventDefault(); dz.classList.add('drag-over'); };
    dz.ondragleave  = () => dz.classList.remove('drag-over');
    dz.ondrop       = e => { e.preventDefault(); dz.classList.remove('drag-over'); if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]); };
    fi.onchange     = e => { if (e.target.files[0]) handleFile(e.target.files[0]); };

    document.getElementById('enr-clear').onclick = () => {
      _parsedRows = []; _headers = []; _rawRows = [];
      document.getElementById('enr-import-body').style.display = 'none';
      document.getElementById('enr-import-result').innerHTML = '';
      fi.value = '';
    };
    document.getElementById('enr-do-import').onclick = doImport;
  }

  async function handleFile(file) {
    const ext = file.name.split('.').pop().toLowerCase();
    try {
      if (ext === 'csv') {
        const text = await readAsText(file);
        parseCSVText(text);
      } else if (ext === 'xlsx' || ext === 'xls') {
        await ensureXLSX();
        parseXLSX(await readAsBuffer(file));
      } else {
        alert('CSV または Excel ファイルを選択してください。');
      }
    } catch (e) {
      alert('ファイルの読み込みに失敗しました: ' + e.message);
    }
  }

  function readAsText(file) {
    return new Promise((res, rej) => {
      const r = new FileReader();
      r.onload = e => res(e.target.result);
      r.onerror = () => rej(new Error('Read failed'));
      r.readAsText(file, 'UTF-8');
    });
  }
  function readAsBuffer(file) {
    return new Promise((res, rej) => {
      const r = new FileReader();
      r.onload = e => res(e.target.result);
      r.onerror = () => rej(new Error('Read failed'));
      r.readAsArrayBuffer(file);
    });
  }
  function ensureXLSX() {
    if (_xlsxLoaded) return Promise.resolve();
    return new Promise((res, rej) => {
      const s = document.createElement('script');
      s.src = 'https://cdn.jsdelivr.net/npm/xlsx/dist/xlsx.full.min.js';
      s.onload  = () => { _xlsxLoaded = true; res(); };
      s.onerror = () => rej(new Error('XLSXライブラリの読み込みに失敗しました'));
      document.head.appendChild(s);
    });
  }

  function parseCSVText(text) {
    const lines = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').trim().split('\n');
    if (lines.length < 2) { alert('データが見つかりません。'); return; }
    function parseLine(line) {
      const out = []; let cur = '', q = false;
      for (let i = 0; i < line.length; i++) {
        const c = line[i];
        if (c === '"') { if (q && line[i+1]==='"') { cur+='"'; i++; } else q=!q; }
        else if (c === ',' && !q) { out.push(cur.trim()); cur=''; }
        else cur += c;
      }
      out.push(cur.trim()); return out;
    }
    _headers = parseLine(lines[0]);
    _rawRows = lines.slice(1).filter(l => l.trim()).map(l => parseLine(l));
    showImportPreview();
  }

  function parseXLSX(buf) {
    const wb   = window.XLSX.read(buf, { type: 'array' });
    const ws   = wb.Sheets[wb.SheetNames[0]];
    const rows = window.XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
    if (rows.length < 2) { alert('データが見つかりません。'); return; }
    _headers = rows[0].map(h => String(h).trim());
    _rawRows = rows.slice(1)
      .filter(r => r.some(c => String(c).trim()))
      .map(r => r.map(c => String(c).trim()));
    showImportPreview();
  }

  function showImportPreview() {
    document.getElementById('enr-import-body').style.display = '';

    function detect(keywords) {
      const i = _headers.findIndex(h => keywords.some(k => h.toLowerCase().includes(k)));
      return i >= 0 ? i : -1;
    }
    const auto = {
      name:           detect(['name','名前','氏名','生徒','姓名']),
      student_number: detect(['number','番号','学籍','学番','no','id','番']),
      class_name:     detect(['class','クラス','組','学年']),
      school:         detect(['school','学校','校'])
    };

    const opts = `<option value="-1">— 対応なし —</option>` +
      _headers.map((h,i) => `<option value="${i}">${esc(h)}</option>`).join('');

    const fields = [
      { key:'name',           label:'名前 *' },
      { key:'student_number', label:'学籍番号 *' },
      { key:'class_name',     label:'クラス名' },
      { key:'school',         label:'学校名' }
    ];

    document.getElementById('enr-mapping').innerHTML = fields.map(f =>
      `<div class="enr-map-fld">
        <label>${f.label}</label>
        <select id="mp-${f.key}">${opts}</select>
      </div>`
    ).join('');

    fields.forEach(f => {
      const sel = document.getElementById('mp-' + f.key);
      if (sel && auto[f.key] >= 0) sel.value = auto[f.key];
      if (sel) sel.onchange = refreshPreview;
    });
    refreshPreview();
  }

  function getMappedRows() {
    const col = k => parseInt(document.getElementById('mp-' + k)?.value ?? -1);
    const nc = col('name'), sc = col('student_number'),
          cc = col('class_name'), xc = col('school');

    return _rawRows.map((row, i) => {
      const name   = nc >= 0 ? (row[nc]  || '').trim() : '';
      const num    = sc >= 0 ? (row[sc]  || '').trim() : '';
      const cls    = cc >= 0 ? (row[cc]  || '').trim() : '';
      const school = xc >= 0 ? (row[xc]  || '').trim() : '';
      const errs   = [];
      if (!name) errs.push('名前が空');
      if (!num)  errs.push('学籍番号が空');
      const batchDup = _rawRows.slice(0,i).some(r => sc>=0 && (r[sc]||'').trim()===num && num);
      if (batchDup) errs.push('重複');
      const inRoster = !!num && _roster.some(r => r.student_number === num);
      return { name, student_number: num, class_name: cls, school, errors: errs, inRoster };
    });
  }

  function refreshPreview() {
    _parsedRows = getMappedRows();
    const valid  = _parsedRows.filter(r => r.errors.length===0 && !r.inRoster).length;
    const update = _parsedRows.filter(r => r.errors.length===0 &&  r.inRoster).length;
    const bad    = _parsedRows.filter(r => r.errors.length > 0).length;

    document.getElementById('enr-preview-stats').innerHTML =
      `<strong>${_parsedRows.length}</strong> 行 —
       ✅ 新規: <strong>${valid}</strong> ／
       🔄 更新: <strong>${update}</strong> ／
       ❌ エラー: <strong>${bad}</strong>`;

    document.getElementById('enr-preview-tbl').innerHTML = `
      <thead><tr>
        <th>#</th><th>名前</th><th>学籍番号</th><th>クラス</th><th>学校</th><th>状態</th>
      </tr></thead>
      <tbody>
        ${_parsedRows.slice(0,50).map((r,i) => {
          const cls = r.errors.length ? 'row-error' : r.inRoster ? 'row-dup' : '';
          const badge = r.errors.length
            ? `<span style="color:#b91c1c">❌ ${r.errors.join(', ')}</span>`
            : r.inRoster
              ? `<span style="color:#92400e">🔄 更新</span>`
              : `<span style="color:#166534">✅ 新規</span>`;
          return `<tr class="${cls}">
            <td style="color:#9ca3af">${i+1}</td>
            <td>${esc(r.name)}</td>
            <td style="font-family:monospace">${esc(r.student_number)}</td>
            <td>${esc(r.class_name)}</td>
            <td>${esc(r.school)}</td>
            <td>${badge}</td>
          </tr>`;
        }).join('')}
      </tbody>`;
  }

  async function doImport() {
    const valid = _parsedRows.filter(r => r.errors.length === 0);
    if (valid.length === 0) { alert('インポートできる行がありません。'); return; }

    const btn    = document.getElementById('enr-do-import');
    const status = document.getElementById('enr-import-status');
    btn.disabled = true;
    status.textContent = `${valid.length} 件を処理中...`;

    let imported = 0, updated = 0, failed = 0;
    const BATCH = 50;
    for (let i = 0; i < valid.length; i += BATCH) {
      const chunk = valid.slice(i, i + BATCH);
      const res = await window.hk.adminImportRoster(chunk);
      imported += res.imported; updated += res.updated; failed += res.failed;
      status.textContent = `${Math.min(i+BATCH, valid.length)} / ${valid.length} 件処理中...`;
    }

    btn.disabled = false; status.textContent = '';
    document.getElementById('enr-import-result').innerHTML = `
      <div class="enr-alert enr-alert-success" style="margin-top:16px">
        ✅ インポート完了 —
        新規追加: <strong>${imported}</strong> 件 ／
        更新: <strong>${updated}</strong> 件 ／
        エラー: <strong>${failed}</strong> 件
      </div>`;

    await loadRoster();
    _parsedRows = []; _headers = []; _rawRows = [];
    document.getElementById('enr-import-body').style.display = 'none';
  }

  // ════════════════════════════════════════════════════════════════════════
  // ROSTER TAB
  // ════════════════════════════════════════════════════════════════════════
  function renderRosterTab(el) {
    const classes = getClasses();
    let rows = _roster;
    if (_classFilter) rows = rows.filter(r => r.class_name === _classFilter);
    if (_searchQuery) {
      const q = _searchQuery.toLowerCase();
      rows = rows.filter(r =>
        (r.display_name||'').toLowerCase().includes(q) ||
        (r.student_number||'').toLowerCase().includes(q)
      );
    }

    el.innerHTML = `
      <div class="enr-stat-row">
        <div class="enr-stat">
          <div class="enr-stat-num" style="color:#1565C0">${_roster.length}</div>
          <div class="enr-stat-lbl">登録生徒数</div>
        </div>
        <div class="enr-stat">
          <div class="enr-stat-num" style="color:#2E7D32">${_roster.filter(r=>r.linked_user_id).length}</div>
          <div class="enr-stat-lbl">連携済み</div>
        </div>
        <div class="enr-stat">
          <div class="enr-stat-num" style="color:#E65100">${_roster.filter(r=>!r.linked_user_id).length}</div>
          <div class="enr-stat-lbl">未連携</div>
        </div>
        <div class="enr-stat">
          <div class="enr-stat-num" style="color:#6A1B9A">${classes.length}</div>
          <div class="enr-stat-lbl">クラス数</div>
        </div>
      </div>

      <div class="enr-filter-row">
        <input class="enr-search" id="enr-r-search" placeholder="名前・学籍番号で検索" value="${esc(_searchQuery)}">
        <select class="enr-select" id="enr-r-class">
          <option value="">すべてのクラス</option>
          ${classes.map(c=>`<option value="${esc(c)}"${_classFilter===c?' selected':''}>${esc(c)}</option>`).join('')}
        </select>
        <button class="enr-btn enr-btn-secondary" id="enr-add-one-btn" style="font-size:13px">+ 1名追加</button>
      </div>

      <div id="enr-add-one-form" style="display:none" class="enr-add-form">
        <div class="enr-add-grid">
          <div class="enr-add-fld">
            <label>名前 *</label>
            <input type="text" id="ao-name" placeholder="山田 太郎">
          </div>
          <div class="enr-add-fld">
            <label>学籍番号 *</label>
            <input type="text" id="ao-num" placeholder="S001">
          </div>
          <div class="enr-add-fld">
            <label>クラス</label>
            <input type="text" id="ao-class" placeholder="3年1組" list="ao-class-dl">
            <datalist id="ao-class-dl">${classes.map(c=>`<option value="${esc(c)}">`).join('')}</datalist>
          </div>
          <div class="enr-add-fld">
            <label>学校</label>
            <input type="text" id="ao-school" placeholder="羽咋中学校">
          </div>
        </div>
        <div style="display:flex;gap:8px;align-items:center">
          <button class="enr-btn enr-btn-primary" id="ao-save" style="font-size:13px">追加する</button>
          <button class="enr-btn enr-btn-secondary" id="ao-cancel" style="font-size:13px">キャンセル</button>
          <span id="ao-status" style="font-size:13px;color:#6b7280"></span>
        </div>
      </div>

      ${rows.length === 0
        ? '<p class="enr-empty">生徒が見つかりません。</p>'
        : `<div style="overflow-x:auto">
            <table class="enr-table">
              <thead><tr>
                <th>学籍番号</th><th>名前</th><th>クラス</th><th>学校</th>
                <th>アカウント</th><th>登録日</th><th></th>
              </tr></thead>
              <tbody id="enr-roster-body">
                ${rows.map(r => rosterRow(r, classes)).join('')}
              </tbody>
            </table>
          </div>`}
    `;

    document.getElementById('enr-r-search').oninput  = e => { _searchQuery = e.target.value; renderTab(); };
    document.getElementById('enr-r-class').onchange  = e => { _classFilter  = e.target.value; renderTab(); };
    document.getElementById('enr-add-one-btn').onclick = () => {
      document.getElementById('enr-add-one-form').style.display = '';
    };
    document.getElementById('ao-cancel').onclick = () => {
      document.getElementById('enr-add-one-form').style.display = 'none';
    };
    document.getElementById('ao-save').onclick = addOneStudent;

    wireRosterRows(el);
  }

  function rosterRow(r, classes) {
    return `<tr data-rid="${r.id}">
      <td style="font-family:monospace;font-size:12px">
        ${esc(r.student_number)}
        ${r.id ? `<button onclick="editStudentNumber('${r.id}','${esc(r.student_number||'')}')"
          style="margin-left:6px;background:none;border:none;cursor:pointer;font-size:11px;color:#9ca3af" title="学籍番号を変更">✎</button>` : ''}
      </td>
      <td><strong>${esc(r.display_name)}</strong></td>
      <td>
        <div id="cls-display-${r.id}" style="display:flex;align-items:center;gap:6px">
          <span>${esc(r.class_name||'—')}</span>
          <button class="enr-btn-sm enr-edit-cls-btn" data-rid="${r.id}" data-cls="${esc(r.class_name||'')}">編集</button>
        </div>
        <div id="cls-edit-${r.id}" style="display:none">
          <input class="enr-inline-inp" id="cls-inp-${r.id}" value="${esc(r.class_name||'')}" 
            list="cls-dl-${r.id}" style="width:110px">
          <datalist id="cls-dl-${r.id}">${classes.map(c=>`<option value="${esc(c)}">`).join('')}</datalist>
          <button class="enr-btn-sm" id="cls-save-${r.id}">保存</button>
          <button class="enr-btn-sm" id="cls-cancel-${r.id}">×</button>
        </div>
      </td>
      <td>${esc(r.school||'—')}</td>
      <td>
        ${r.linked_user_id
          ? '<span class="enr-badge enr-badge-linked">✓ 連携済</span>'
          : `<span class="enr-badge enr-badge-pending">未連携</span>
             <button class="enr-btn-sm enr-create-acct-btn"
               data-rid="${r.id}" data-num="${r.student_number}" data-name="${r.display_name}"
               style="margin-left:6px;font-size:11px">アカウント作成</button>`}
      </td>
      <td style="font-size:12px;color:#9ca3af">${new Date(r.enrolled_at).toLocaleDateString('ja-JP')}</td>
      <td>
        <button class="enr-btn-sm enr-btn-danger-sm enr-del-btn" data-rid="${r.id}">削除</button>
      </td>
    </tr>`;
  }

  function wireRosterRows(el) {
    el.querySelectorAll('.enr-edit-cls-btn').forEach(btn => {
      btn.onclick = () => {
        document.getElementById('cls-display-' + btn.dataset.rid).style.display = 'none';
        document.getElementById('cls-edit-'    + btn.dataset.rid).style.display = '';
      };
    });
    el.querySelectorAll('[id^="cls-cancel-"]').forEach(btn => {
      const rid = btn.id.replace('cls-cancel-','');
      btn.onclick = () => {
        document.getElementById('cls-display-' + rid).style.display = '';
        document.getElementById('cls-edit-'    + rid).style.display = 'none';
      };
    });
    el.querySelectorAll('[id^="cls-save-"]').forEach(btn => {
      const rid = btn.id.replace('cls-save-','');
      btn.onclick = async () => {
        const val = document.getElementById('cls-inp-' + rid).value.trim();
        await window.hk.adminUpdateRosterEntry(rid, { class_name: val || null });
        await loadRoster();
        renderTab();
      };
    });
    el.querySelectorAll('.enr-create-acct-btn').forEach(btn => {
      btn.onclick = () => showCreateAccountModal(btn.dataset.rid, btn.dataset.num, btn.dataset.name);
    });
    el.querySelectorAll('.enr-del-btn').forEach(btn => {
      btn.onclick = async () => {
        const r = _roster.find(x => x.id === btn.dataset.rid);
        if (!r) return;
        if (!confirm(`「${r.display_name}」を名簿から削除しますか？\n（アカウントは削除されません）`)) return;
        await window.hk.adminDeleteRosterEntry(btn.dataset.rid);
        await loadRoster();
        renderTab();
      };
    });
  }

  function showCreateAccountModal(rid, studentNumber, displayName) {
    // Remove any existing modal
    const existing = document.getElementById('enr-acct-modal');
    if (existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.id = 'enr-acct-modal';
    overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.45);display:flex;align-items:center;justify-content:center;z-index:1000;padding:16px';
    overlay.innerHTML = `
      <div style="background:#fff;border-radius:14px;padding:28px 24px;width:100%;max-width:360px;
                  box-shadow:0 8px 32px rgba(0,0,0,.18);position:relative">
        <h3 style="font-size:17px;font-weight:800;margin-bottom:4px">アカウント作成</h3>
        <p style="font-size:13px;color:#6b7280;margin-bottom:18px">
          <strong>${displayName}</strong>（学籍番号: ${studentNumber}）<br>
          ログイン用パスワードを設定してください。
        </p>
        <div style="margin-bottom:12px">
          <label style="display:block;font-size:12px;font-weight:700;margin-bottom:4px">パスワード（8文字以上）</label>
          <input type="password" id="enr-new-pass" placeholder="••••••••"
            style="width:100%;padding:10px 12px;border-radius:8px;border:1.5px solid #d1d5db;
                   font-size:14px;outline:none;box-sizing:border-box;background:#f9fafb">
        </div>
        <div style="margin-bottom:18px">
          <label style="display:block;font-size:12px;font-weight:700;margin-bottom:4px">パスワード確認</label>
          <input type="password" id="enr-new-pass2" placeholder="••••••••"
            style="width:100%;padding:10px 12px;border-radius:8px;border:1.5px solid #d1d5db;
                   font-size:14px;outline:none;box-sizing:border-box;background:#f9fafb">
        </div>
        <div id="enr-modal-err" style="display:none;background:#fef2f2;border:1px solid #fca5a5;
          border-radius:7px;padding:9px 12px;font-size:13px;color:#b91c1c;margin-bottom:12px"></div>
        <div style="display:flex;gap:10px">
          <button id="enr-modal-confirm" class="enr-btn enr-btn-primary" style="flex:1;font-size:14px">作成する</button>
          <button id="enr-modal-cancel"  class="enr-btn enr-btn-secondary" style="font-size:14px">キャンセル</button>
        </div>
        <p style="font-size:11px;color:#9ca3af;margin-top:12px;margin-bottom:0">
          生徒のログイン：学籍番号「${studentNumber}」とこのパスワードを使います。
        </p>
      </div>`;
    document.body.appendChild(overlay);

    const showErr = msg => {
      const el = document.getElementById('enr-modal-err');
      el.textContent = msg; el.style.display = 'block';
    };
    document.getElementById('enr-modal-cancel').onclick = () => overlay.remove();
    overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });

    document.getElementById('enr-modal-confirm').onclick = async () => {
      const pass1 = document.getElementById('enr-new-pass').value;
      const pass2 = document.getElementById('enr-new-pass2').value;
      if (!pass1 || pass1.length < 8) { showErr('パスワードは8文字以上で設定してください。'); return; }
      if (pass1 !== pass2) { showErr('パスワードが一致しません。'); return; }

      const btn = document.getElementById('enr-modal-confirm');
      btn.disabled = true; btn.textContent = '作成中...';

      try {
        await window.hk.createStudentAccount(studentNumber, pass1);
        overlay.remove();
        await loadRoster();
        renderTab();
      } catch (e) {
        btn.disabled = false; btn.textContent = '作成する';
        if (e.message && e.message.toLowerCase().includes('already registered')) {
          showErr('このアカウントはすでに作成されています。');
        } else {
          showErr('作成に失敗しました：' + (e.message || ''));
        }
      }
    };
  }

  async function addOneStudent() {
    const name   = document.getElementById('ao-name').value.trim();
    const num    = document.getElementById('ao-num').value.trim();
    const cls    = document.getElementById('ao-class').value.trim();
    const school = document.getElementById('ao-school').value.trim();
    const status = document.getElementById('ao-status');
    if (!name || !num) { status.textContent = '名前と学籍番号は必須です。'; return; }
    status.textContent = '追加中...';
    await window.hk.adminImportRoster([{ display_name: name, student_number: num, class_name: cls, school }]);
    status.textContent = '';
    await loadRoster();
    document.getElementById('enr-add-one-form').style.display = 'none';
    renderTab();
  }

  // ════════════════════════════════════════════════════════════════════════
  // CLASSES TAB
  // ════════════════════════════════════════════════════════════════════════
  function renderClassesTab(el) {
    const classes   = getClasses();
    const unclassed = _roster.filter(r => !r.class_name);

    el.innerHTML = `
      <div class="enr-class-layout">
        <div>
          <div class="enr-class-list-panel">
            <div class="enr-class-list-panel-title">クラス一覧</div>
            ${classes.map(cls => {
              const cnt = _roster.filter(r => r.class_name === cls).length;
              return `<div class="enr-class-item${_selectedClass===cls?' active':''}" data-cls="${esc(cls)}">
                <span class="enr-class-item-name">${esc(cls)}</span>
                <span class="enr-class-item-count">${cnt}名</span>
              </div>`;
            }).join('')}
            ${unclassed.length > 0 ? `
              <div class="enr-class-item${_selectedClass==='__none__'?' active':''}" data-cls="__none__">
                <span class="enr-class-item-name" style="color:#9ca3af">未割り当て</span>
                <span class="enr-class-item-count">${unclassed.length}名</span>
              </div>` : ''}
          </div>
        </div>
        <div id="enr-cls-detail">
          <p class="enr-empty" style="padding:48px">← クラスを選択してください</p>
        </div>
      </div>`;

    el.querySelectorAll('.enr-class-item').forEach(item => {
      item.onclick = () => {
        _selectedClass = item.dataset.cls;
        el.querySelectorAll('.enr-class-item').forEach(x => x.classList.toggle('active', x.dataset.cls===_selectedClass));
        renderClassDetail(document.getElementById('enr-cls-detail'));
      };
    });

    if (_selectedClass) renderClassDetail(document.getElementById('enr-cls-detail'));
  }

  function renderClassDetail(el) {
    if (!el || !_selectedClass) return;
    const isNone   = _selectedClass === '__none__';
    const students = isNone ? _roster.filter(r=>!r.class_name) : _roster.filter(r=>r.class_name===_selectedClass);
    const classes  = getClasses();

    el.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:12px;margin-bottom:20px">
        <div>
          <div style="font-size:20px;font-weight:800">${isNone ? '未割り当て' : esc(_selectedClass)}</div>
          <div style="font-size:13px;color:#6b7280">${students.length}名</div>
        </div>
        ${!isNone ? `
          <div style="display:flex;gap:8px;align-items:center">
            <input class="enr-inline-inp" id="rename-inp" value="${esc(_selectedClass)}" placeholder="新しいクラス名" style="width:140px">
            <button class="enr-btn enr-btn-secondary" id="rename-btn" style="font-size:13px">名前変更</button>
          </div>` : ''}
      </div>

      <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:16px">
        <span style="font-size:13px;font-weight:600">選択した生徒を移動:</span>
        <select class="enr-select" id="bulk-target">
          <option value="">— 移動先クラスを選択 —</option>
          ${classes.filter(c=>c!==_selectedClass).map(c=>`<option value="${esc(c)}">${esc(c)}</option>`).join('')}
          <option value="__new__">+ 新しいクラスへ...</option>
        </select>
        <button class="enr-btn enr-btn-secondary" id="bulk-move" style="font-size:13px">移動する</button>
        <button class="enr-btn-sm" id="sel-all" style="font-size:12px">全選択</button>
      </div>

      <table class="enr-table">
        <thead><tr>
          <th><input type="checkbox" id="cb-all"></th>
          <th>学籍番号</th><th>名前</th><th>アカウント</th>
        </tr></thead>
        <tbody>
          ${students.map(r => `
            <tr>
              <td><input type="checkbox" class="enr-scb" data-rid="${r.id}"></td>
              <td style="font-family:monospace;font-size:12px">
        ${esc(r.student_number)}
        ${r.id ? `<button onclick="editStudentNumber('${r.id}','${esc(r.student_number||'')}')"
          style="margin-left:6px;background:none;border:none;cursor:pointer;font-size:11px;color:#9ca3af" title="学籍番号を変更">✎</button>` : ''}
      </td>
              <td>${esc(r.display_name)}</td>
              <td>
                <span class="enr-badge ${r.linked_user_id ? 'enr-badge-linked' : 'enr-badge-pending'}">
                  ${r.linked_user_id ? '✓ 連携済' : '未連携'}
                </span>
              </td>
            </tr>`).join('')}
        </tbody>
      </table>
    `;

    document.getElementById('cb-all').onchange = e => {
      el.querySelectorAll('.enr-scb').forEach(cb => cb.checked = e.target.checked);
    };
    document.getElementById('sel-all').onclick = () => {
      el.querySelectorAll('.enr-scb').forEach(cb => cb.checked = true);
    };

    document.getElementById('bulk-move').onclick = async () => {
      const ids = [...el.querySelectorAll('.enr-scb:checked')].map(cb => cb.dataset.rid);
      if (ids.length === 0) { alert('生徒を選択してください。'); return; }
      let target = document.getElementById('bulk-target').value;
      if (!target) { alert('移動先クラスを選択してください。'); return; }
      if (target === '__new__') {
        target = prompt('新しいクラス名を入力してください:');
        if (!target || !target.trim()) return;
        target = target.trim();
      }
      for (const id of ids) await window.hk.adminUpdateRosterEntry(id, { class_name: target });
      await loadRoster();
      renderTab();
    };

    const renameBtn = document.getElementById('rename-btn');
    if (renameBtn) {
      renameBtn.onclick = async () => {
        const newName = document.getElementById('rename-inp').value.trim();
        if (!newName || newName === _selectedClass) return;
        if (!confirm(`「${_selectedClass}」を「${newName}」に変更しますか？\nこのクラスの全生徒が更新されます。`)) return;
        const toUpdate = _roster.filter(r => r.class_name === _selectedClass);
        for (const r of toUpdate) await window.hk.adminUpdateRosterEntry(r.id, { class_name: newName });
        _selectedClass = newName;
        await loadRoster();
        renderTab();
      };
    }
  }

  // ── CSV Export ────────────────────────────────────────────────────────────
  function exportCSV() {
    const hdrs = ['学籍番号','名前','クラス','学校','アカウント状態','登録日'];
    const data = _roster.map(r => [
      r.student_number||'',
      r.display_name||'',
      r.class_name||'',
      r.school||'',
      r.linked_user_id ? '連携済' : '未連携',
      new Date(r.enrolled_at).toLocaleDateString('ja-JP')
    ]);
    const csv = [hdrs, ...data]
      .map(row => row.map(c => `"${String(c).replace(/"/g,'""')}"`).join(','))
      .join('\n');
    const blob = new Blob(['\uFEFF'+csv], { type:'text/csv;charset=utf-8' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = `生徒名簿_${new Date().toISOString().slice(0,10)}.csv`;
    a.click(); URL.revokeObjectURL(url);
  }

  // ── Helpers ───────────────────────────────────────────────────────────────
  function getClasses() {
    return [...new Set(_roster.map(r=>r.class_name).filter(Boolean))].sort();
  }
  function esc(s) {
    return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }

  init();
  // ── Password management tab ───────────────────────────────────────────────
  const EDGE_BASE = 'https://rfntsrcguhldybddfgcl.supabase.co/functions/v1';

  async function getToken() {
    const session = await window.hk.getSession();
    return session?.access_token || '';
  }

  async function callManageStudent(body) {
    const token = await getToken();
    const res   = await fetch(EDGE_BASE + '/manage-student', {
      method: 'POST',
      headers: { 'Content-Type':'application/json', 'Authorization':'Bearer '+token },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Request failed');
    return data;
  }

  window.editStudentNumber = async function(rosterId, oldNumber) {
    const newNum = prompt('新しい学籍番号（現在：' + oldNumber + '）:', oldNumber);
    if (!newNum || newNum === oldNumber) return;
    try {
      await callManageStudent({ action:'change-student-number', roster_id:rosterId, old_number:oldNumber, new_number:newNum.trim() });
      alert('✅ 学籍番号を ' + newNum + ' に変更しました。');
      renderRoot();
    } catch(e) { alert('エラー: ' + e.message); }
  };

  function renderPasswordTab(el) {
    const classes = [...new Set(_roster.map(function(r){ return r.class_name; }).filter(Boolean))].sort();
    el.innerHTML =
      '<div style="max-width:600px">' +
      '<p style="font-size:13px;color:#6b7280;margin-bottom:20px">生徒のパスワードをクラス単位でリセットできます。CSVファイルで配布用一覧も出力できます。</p>' +
      '<div style="background:#fff;border:1.5px solid #e5e7eb;border-radius:12px;padding:20px;margin-bottom:16px">' +
      '<h3 style="font-size:14px;font-weight:800;margin-bottom:14px">🏫 クラス一括リセット</h3>' +
      '<div style="display:flex;flex-direction:column;gap:10px">' +
      '<div><label style="font-size:11px;font-weight:800;text-transform:uppercase;color:#6b7280;display:block;margin-bottom:4px">対象クラス</label>' +
      '<select id="pw-class" style="padding:8px 12px;border:1.5px solid #e5e7eb;border-radius:7px;font-size:13px;width:100%;max-width:280px">' +
      '<option value="">— クラスを選択 —</option>' +
      classes.map(function(c){ return '<option value="'+esc(c)+'">'+esc(c)+'</option>'; }).join('') +
      '</select></div>' +
      '<div><label style="font-size:11px;font-weight:800;text-transform:uppercase;color:#6b7280;display:block;margin-bottom:4px">新しいパスワード</label>' +
      '<div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">' +
      '<input type="text" id="pw-new" placeholder="例：Mizuho2025" maxlength="30" style="padding:8px 12px;border:1.5px solid #e5e7eb;border-radius:7px;font-size:13px;width:220px">' +
      '<button id="pw-gen-btn" style="padding:8px 12px;border:1.5px solid #e5e7eb;border-radius:7px;font-size:12px;font-weight:700;background:#f9fafb;cursor:pointer">🎲 ランダム生成</button>' +
      '</div><p style="font-size:11px;color:#9ca3af;margin-top:4px">6文字以上。</p></div>' +
      '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:4px">' +
      '<button id="pw-bulk-btn" style="padding:9px 20px;background:#dc2626;color:#fff;border:none;border-radius:8px;font-size:13px;font-weight:800;cursor:pointer">⚠️ 一括リセット実行</button>' +
      '</div><div id="pw-result" style="font-size:13px;color:#6b7280;margin-top:8px"></div></div></div>' +
      '<div style="background:#fff;border:1.5px solid #e5e7eb;border-radius:12px;padding:20px">' +
      '<h3 style="font-size:14px;font-weight:800;margin-bottom:8px">📄 配布用CSV出力</h3>' +
      '<button id="pw-csv-btn" style="padding:8px 16px;border:1.5px solid #e5e7eb;border-radius:8px;font-size:12px;font-weight:700;background:#f9fafb;cursor:pointer">⬇️ CSV ダウンロード</button>' +
      '</div></div>';

    var _lastResults = [];

    document.getElementById('pw-gen-btn').onclick = function() {
      var chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
      var pw = '';
      for (var i = 0; i < 8; i++) pw += chars[Math.floor(Math.random() * chars.length)];
      document.getElementById('pw-new').value = pw;
    };

    document.getElementById('pw-bulk-btn').onclick = async function() {
      var cls  = document.getElementById('pw-class').value;
      var pass = document.getElementById('pw-new').value.trim();
      var res  = document.getElementById('pw-result');
      if (!cls)           { res.textContent = '⚠️ クラスを選択してください。'; return; }
      if (pass.length < 6){ res.textContent = '⚠️ パスワードは6文字以上にしてください。'; return; }
      if (!confirm('「' + cls + '」の全生徒のパスワードを「' + pass + '」にリセットしますか？')) return;
      var btn = document.getElementById('pw-bulk-btn');
      btn.disabled = true; btn.textContent = '処理中...';
      res.textContent = '';
      try {
        var school = _roster.length ? _roster[0].school : undefined;
        var data = await callManageStudent({ action:'bulk-reset-password', class_name:cls, new_password:pass, school:school });
        _lastResults = (data.results || []).map(function(r){ return Object.assign({}, r, { password: pass }); });
        var created = data.created || 0;
        var updated = data.updated || 0;
        var failed  = data.failed  || 0;
        res.innerHTML =
          (created ? '<span style="color:#7c3aed;font-weight:800">🆕 ' + created + '名 新規作成</span>&nbsp; ' : '') +
          (updated ? '<span style="color:#2E7D32;font-weight:800">✅ ' + updated + '名 パスワード更新</span>' : '') +
          (failed  ? ' &nbsp;<span style="color:#dc2626">❌ ' + failed + '名 失敗</span>' : '') +
          '<br><small style="color:#9ca3af">CSV出力ボタンで配布用一覧をダウンロードできます。</small>';
      } catch(e) {
        res.innerHTML = '<span style="color:#dc2626">エラー: ' + esc(e.message) + '</span>';
      } finally {
        btn.disabled = false; btn.textContent = '⚠️ 一括リセット実行';
      }
    };

    document.getElementById('pw-csv-btn').onclick = function() {
      if (!_lastResults.length) { alert('先に一括リセットを実行してください。'); return; }
      var cls  = document.getElementById('pw-class').value || 'class';
      var rows = ['学籍番号,氏名,パスワード'];
      _lastResults.forEach(function(r){ rows.push(['"'+r.student_number+'"', '"'+(r.name||'')+'"', '"'+(r.password||'')+'"'].join(',')); });
      var blob = new Blob(['\uFEFF' + rows.join('\n')], { type:'text/csv;charset=utf-8' });
      var a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = cls + '_passwords.csv';
      a.click();
    };
  }

})();
