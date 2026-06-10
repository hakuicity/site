// gradebook-page.js — グレードブック
// Accessible to: admin, teacher, moderator
'use strict';
(function () {

const root = document.getElementById('hk-gradebook');
if (!root) return;

const EDGE_BASE = 'https://rfntsrcguhldybddfgcl.supabase.co/functions/v1';
const APP_LABELS = { eiken:'🎓 英検アプリ', nh6:'📗 NH6 練習', newhorizon:'📘 NH Vocab' };

const APP_LEVELS = {
  eiken:      ['5','4','3','P'],
  nh6:        ['u1','u2','u3','u4','u5','u6','u7','u8'],
  newhorizon: ['colors','sports','animals','food','daily','time','weather','nature',
               'actions','descriptions','events','jobs','clubs','things','stationery',
               'clothes','family','people','feelings','numbers','shapes'],
};

const LEVEL_LABELS = {
  eiken: { '5':'5級','4':'4級','3':'3級','P':'準2級' },
  nh6:   { u1:'Unit 1',u2:'Unit 2',u3:'Unit 3',u4:'Unit 4',u5:'Unit 5',u6:'Unit 6',u7:'Unit 7',u8:'Unit 8' },
};

let _user, _profile;
let _students = [], _quiz = [], _assignments = [];
let _selApp = 'nh6', _selLevel = 'u1', _selCategory = null, _selClass = '';
let _tab = 'grades';  // 'grades' | 'assignments'
let _dateFrom = '', _dateTo = '';

const $ = id => document.getElementById(id);
const esc = s => String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
const fmt = d => d ? new Date(d).toLocaleDateString('ja-JP',{month:'numeric',day:'numeric'}) : '—';
const pct = (c,t) => t > 0 ? Math.round(c/t*100) : null;

// ── Styles ────────────────────────────────────────────────────────────────
const style = document.createElement('style');
style.textContent = `
  .gb-wrap { max-width:960px; margin:0 auto; padding:16px 14px 60px; font-family:inherit; }
  .gb-header { display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:10px; margin-bottom:20px; }
  .gb-title  { font-size:22px; font-weight:900; }
  .gb-tabs   { display:flex; gap:0; border:1.5px solid #e5e7eb; border-radius:8px; overflow:hidden; margin-bottom:18px; }
  .gb-tab    { flex:1; padding:9px 14px; background:#f9fafb; color:#6b7280; border:none; font-size:13px; font-weight:800;
               cursor:pointer; transition:all .15s; border-right:1.5px solid #e5e7eb; }
  .gb-tab:last-child { border-right:none; }
  .gb-tab.active { background:#1565C0; color:#fff; }
  .gb-filters { display:flex; flex-wrap:wrap; gap:8px; align-items:flex-end; margin-bottom:16px;
                padding:14px; background:#f9fafb; border:1.5px solid #e5e7eb; border-radius:10px; }
  .gb-filter-group label { display:block; font-size:10px; font-weight:800; text-transform:uppercase;
                           letter-spacing:.4px; color:#9ca3af; margin-bottom:3px; }
  .gb-filter-group select, .gb-filter-group input {
    padding:7px 10px; border:1.5px solid #e5e7eb; border-radius:7px; font-size:13px;
    background:#fff; min-width:120px; }
  .gb-btn { padding:8px 16px; border-radius:8px; border:none; font-size:13px; font-weight:800;
            cursor:pointer; transition:all .15s; }
  .gb-btn-primary { background:#1565C0; color:#fff; }
  .gb-btn-primary:hover { background:#0D47A1; }
  .gb-btn-sm { padding:5px 12px; font-size:12px; }
  .gb-btn-outline { background:#fff; border:1.5px solid #e5e7eb; color:#374151; }
  .gb-table { width:100%; border-collapse:collapse; font-size:13px; }
  .gb-table th { padding:9px 12px; text-align:left; font-size:10px; font-weight:800; text-transform:uppercase;
                 letter-spacing:.4px; color:#9ca3af; border-bottom:2px solid #e5e7eb; }
  .gb-table td { padding:10px 12px; border-bottom:1px solid #f3f4f6; vertical-align:middle; }
  .gb-table tr:hover td { background:#f9fafb; }
  .gb-score-bar { height:8px; background:#f3f4f6; border-radius:4px; overflow:hidden; min-width:60px; }
  .gb-score-fill { height:100%; border-radius:4px; transition:width .4s; }
  .gb-score-green  { background:#16a34a; }
  .gb-score-amber  { background:#d97706; }
  .gb-score-red    { background:#dc2626; }
  .gb-badge  { display:inline-block; padding:2px 8px; border-radius:5px; font-size:11px; font-weight:700; }
  .gb-badge-none { background:#f3f4f6; color:#9ca3af; }
  .gb-empty { text-align:center; padding:48px 20px; color:#9ca3af; font-size:14px; }
  .asgn-card { background:#fff; border:1.5px solid #e5e7eb; border-radius:12px; padding:16px;
               margin-bottom:10px; cursor:pointer; transition:all .15s; }
  .asgn-card:hover { border-color:#1565C0; }
  .asgn-card.selected { border-color:#1565C0; background:#eff6ff; }
  .asgn-create { background:#fff; border:1.5px dashed #d1d5db; border-radius:12px;
                 padding:20px; text-align:center; cursor:pointer; transition:all .15s; }
  .asgn-create:hover { border-color:#1565C0; background:#f8faff; }
  .modal-back { position:fixed; inset:0; background:rgba(0,0,0,.4); z-index:100;
                display:flex; align-items:center; justify-content:center; padding:16px; }
  .modal-box { background:#fff; border-radius:16px; padding:24px; width:100%; max-width:440px;
               box-shadow:0 12px 40px rgba(0,0,0,.15); max-height:90vh; overflow-y:auto; }
  .modal-title { font-size:18px; font-weight:900; margin-bottom:16px; }
  .modal-field { margin-bottom:12px; }
  .modal-field label { display:block; font-size:11px; font-weight:800; text-transform:uppercase;
                       color:#6b7280; margin-bottom:4px; }
  .modal-field input, .modal-field select {
    width:100%; padding:9px 12px; border:1.5px solid #e5e7eb; border-radius:8px;
    font-size:13px; outline:none; }
  .modal-field input:focus, .modal-field select:focus { border-color:#1565C0; }
  .dark .gb-table th { color:#9ca3af; border-bottom-color:#374151; }
  .dark .gb-table td { border-bottom-color:#1f2937; }
  .dark .gb-table tr:hover td { background:#1f2937; }
  .dark .gb-filters { background:#1e293b; border-color:#334155; }
  .dark .gb-filter-group select, .dark .gb-filter-group input { background:#1e293b; border-color:#374151; color:#e2e8f0; }
  .dark .asgn-card, .dark .modal-box { background:#1e293b; border-color:#334155; }
  .dark .asgn-card.selected { background:#1e3a5f; }
  .dark .gb-score-bar { background:#374151; }
`;
document.head.appendChild(style);

// ── Boot ──────────────────────────────────────────────────────────────────
function waitHk() {
  if (typeof window.hk === 'undefined') { setTimeout(waitHk, 60); return; }
  window.hk.getUser().then(async u => {
    if (!u) { root.innerHTML = '<p style="text-align:center;padding:40px;color:#9ca3af">ログインが必要です。<a href="/site/login/?next=/site/gradebook/">ログイン</a></p>'; return; }
    _user = u;
    _profile = await window.hk.getProfile(u.id);
    if (!_profile || !['admin','teacher','moderator'].includes(_profile.role)) {
      root.innerHTML = '<p style="text-align:center;padding:40px;color:#dc2626">アクセス権限がありません。</p>';
      return;
    }
    await loadData();
    render();
  });
}
waitHk();

// ── Data loading ──────────────────────────────────────────────────────────
async function loadData() {
  const client = window.hk._client || window.hkClient;
  // Profiles (students only)
  const { data: pf } = await window.hk._client
    .from('profiles').select('id,display_name,class_name,school,student_number,role')
    .eq('role','student').order('class_name').order('display_name');
  _students = pf || [];

  // Assignments
  const { data: ag } = await window.hk._client
    .from('assignments').select('*').order('created_at', { ascending: false });
  _assignments = ag || [];
}

async function loadQuizForSection(appId, level, category, classN, dateFrom, dateTo) {
  let q = window.hk._client.from('quiz_results').select('user_id,correct,total,score_pct,created_at,level,category,app_id').eq('app_id', appId);
  if (level)    q = q.eq('level', level);
  if (category) q = q.eq('category', category);
  if (dateFrom) q = q.gte('created_at', dateFrom);
  if (dateTo)   q = q.lte('created_at', dateTo + 'T23:59:59');
  const { data } = await q.order('created_at', { ascending: false });
  _quiz = data || [];
}

// ── Render ────────────────────────────────────────────────────────────────
function render() {
  const classes = [...new Set(_students.map(s => s.class_name).filter(Boolean))].sort();
  const canEdit = _profile && ['admin','teacher'].includes(_profile.role);

  root.innerHTML =
    '<div class="gb-wrap">' +
    '<div class="gb-header">' +
    '<div class="gb-title">📒 グレードブック</div>' +
    (canEdit ? '<button class="gb-btn gb-btn-primary gb-btn-sm" id="gb-new-asgn">＋ 課題を作成</button>' : '') +
    '</div>' +
    '<div class="gb-tabs">' +
    '<button class="gb-tab' + (_tab==='grades'?' active':'') + '" id="gb-tab-grades">📊 成績表</button>' +
    '<button class="gb-tab' + (_tab==='assignments'?' active':'') + '" id="gb-tab-asgn">📋 課題一覧 (' + _assignments.length + ')</button>' +
    '</div>' +
    '<div id="gb-body"></div>' +
    '</div>';

  $('gb-tab-grades').onclick = () => { _tab = 'grades'; render(); };
  $('gb-tab-asgn').onclick   = () => { _tab = 'assignments'; render(); };
  if (canEdit && $('gb-new-asgn')) $('gb-new-asgn').onclick = () => showAssignmentModal();

  const body = $('gb-body');
  if (_tab === 'grades')      renderGradesTab(body, classes);
  else                        renderAssignmentsTab(body, classes, canEdit);
}

// ── Grades tab ────────────────────────────────────────────────────────────
function renderGradesTab(el, classes) {
  const levels = APP_LEVELS[_selApp] || [];
  const categories = _selApp === 'nh6' ? ['grammar','response','writing'] : _selApp === 'eiken' ? ['ALL','READING','LISTENING','VOCABULARY'] : null;

  el.innerHTML =
    '<div class="gb-filters">' +
    '<div class="gb-filter-group"><label>アプリ</label>' +
    '<select id="gb-app">' +
    Object.entries(APP_LABELS).map(([k,v]) => '<option value="'+k+'"'+(k===_selApp?' selected':'')+'>'+v+'</option>').join('') +
    '</select></div>' +
    '<div class="gb-filter-group"><label>レベル / Unit</label>' +
    '<select id="gb-level">' +
    levels.map(lv => {
      const label = (LEVEL_LABELS[_selApp]||{})[lv] || lv;
      return '<option value="'+lv+'"'+(lv===_selLevel?' selected':'')+'>'+esc(label)+'</option>';
    }).join('') +
    '</select></div>' +
    (categories ? '<div class="gb-filter-group"><label>カテゴリー</label>' +
    '<select id="gb-cat"><option value="">すべて</option>' +
    categories.map(c => '<option value="'+c+'"'+(c===_selCategory?' selected':'')+'>'+esc(c)+'</option>').join('') +
    '</select></div>' : '') +
    '<div class="gb-filter-group"><label>クラス</label>' +
    '<select id="gb-class"><option value="">全クラス</option>' +
    classes.map(c => '<option value="'+esc(c)+'"'+(c===_selClass?' selected':'')+'>'+esc(c)+'</option>').join('') +
    '</select></div>' +
    '<div class="gb-filter-group"><label>開始日</label><input type="date" id="gb-from" value="'+esc(_dateFrom)+'"></div>' +
    '<div class="gb-filter-group"><label>終了日</label><input type="date" id="gb-to" value="'+esc(_dateTo)+'"></div>' +
    '<div class="gb-filter-group" style="align-self:flex-end">' +
    '<button class="gb-btn gb-btn-primary" id="gb-load-btn">表示する</button></div>' +
    '<div class="gb-filter-group" style="align-self:flex-end">' +
    '<button class="gb-btn gb-btn-outline" id="gb-csv-btn">CSV出力</button></div>' +
    '</div>' +
    '<div id="gb-table-area"><div class="gb-empty">フィルターを設定して「表示する」をクリックしてください。</div></div>';

  $('gb-load-btn').onclick = async () => {
    _selApp      = $('gb-app').value;
    _selLevel    = $('gb-level').value;
    _selCategory = $('gb-cat') ? $('gb-cat').value || null : null;
    _selClass    = $('gb-class').value;
    _dateFrom    = $('gb-from').value;
    _dateTo      = $('gb-to').value;
    $('gb-table-area').innerHTML = '<div class="gb-empty">読み込み中...</div>';
    await loadQuizForSection(_selApp, _selLevel, _selCategory, _selClass, _dateFrom, _dateTo);
    renderGradeTable($('gb-table-area'));
  };

  $('gb-csv-btn').onclick = () => exportCSV();
}

function renderGradeTable(el) {
  const students = _selClass ? _students.filter(s => s.class_name === _selClass) : _students;
  if (!students.length) { el.innerHTML = '<div class="gb-empty">生徒データがありません。</div>'; return; }

  const rows = students.map(s => {
    const sessions = _quiz.filter(q => q.user_id === s.id);
    if (!sessions.length) return { student:s, sessions:0, best:null, avg:null, last:null };
    const best = Math.max(...sessions.map(q => q.score_pct||0));
    const avgC = sessions.reduce((a,q)=>a+(q.correct||0),0);
    const avgT = sessions.reduce((a,q)=>a+(q.total||0),0);
    const avg  = pct(avgC, avgT);
    const last = sessions.map(q=>q.created_at).sort().pop();
    return { student:s, sessions:sessions.length, best, avg, last };
  });

  const scored = rows.filter(r => r.sessions > 0);
  const avg = scored.length ? Math.round(scored.reduce((a,r)=>a+r.best,0)/scored.length) : null;
  const lvLabel = (LEVEL_LABELS[_selApp]||{})[_selLevel] || _selLevel;

  el.innerHTML =
    '<div style="margin-bottom:10px;font-size:13px;color:#6b7280">' +
    'アプリ: <strong>' + esc(APP_LABELS[_selApp]||_selApp) + '</strong> &nbsp;|&nbsp; ' +
    'セクション: <strong>' + esc(lvLabel) + '</strong>' +
    (_selCategory ? ' / <strong>' + esc(_selCategory) + '</strong>' : '') +
    ' &nbsp;|&nbsp; 提出: <strong>' + scored.length + '</strong>/' + students.length + '名' +
    (avg !== null ? ' &nbsp;|&nbsp; クラス平均: <strong>' + avg + '%</strong>' : '') +
    '</div>' +
    '<div style="overflow-x:auto"><table class="gb-table">' +
    '<thead><tr><th>氏名</th><th>クラス</th><th>回数</th><th>最高点</th><th>平均</th><th>スコア</th><th>最終提出</th></tr></thead>' +
    '<tbody>' +
    rows.map(r => {
      if (!r.sessions) return (
        '<tr><td><strong>' + esc(r.student.display_name||'') + '</strong></td>' +
        '<td style="color:#9ca3af">' + esc(r.student.class_name||'') + '</td>' +
        '<td><span class="gb-badge gb-badge-none">未提出</span></td>' +
        '<td>—</td><td>—</td><td>—</td><td>—</td></tr>'
      );
      const colClass = r.best >= 80 ? 'gb-score-green' : r.best >= 60 ? 'gb-score-amber' : 'gb-score-red';
      const textCol  = r.best >= 80 ? '#16a34a' : r.best >= 60 ? '#d97706' : '#dc2626';
      return (
        '<tr><td><strong>' + esc(r.student.display_name||'') + '</strong></td>' +
        '<td style="color:#9ca3af">' + esc(r.student.class_name||'') + '</td>' +
        '<td style="text-align:center">' + r.sessions + '</td>' +
        '<td style="font-weight:800;color:' + textCol + '">' + r.best + '%</td>' +
        '<td style="color:#6b7280">' + (r.avg !== null ? r.avg + '%' : '—') + '</td>' +
        '<td style="min-width:80px"><div class="gb-score-bar"><div class="gb-score-fill ' + colClass + '" style="width:' + r.best + '%"></div></div></td>' +
        '<td style="color:#9ca3af;font-size:12px">' + fmt(r.last) + '</td>' +
        '</tr>'
      );
    }).join('') +
    '</tbody></table></div>';
}

// ── Assignments tab ───────────────────────────────────────────────────────
function renderAssignmentsTab(el, classes, canEdit) {
  if (!_assignments.length) {
    el.innerHTML = '<div class="gb-empty">' +
      '課題がまだありません。' +
      (canEdit ? '<br><br><button class="gb-btn gb-btn-primary" onclick="document.getElementById(\'gb-new-asgn\').click()">＋ 最初の課題を作成する</button>' : '') +
      '</div>';
    return;
  }

  el.innerHTML = _assignments.map(ag => {
    const lvLabel = (LEVEL_LABELS[ag.app_id]||{})[ag.level] || ag.level || '全Unit';
    return '<div class="asgn-card" data-id="' + ag.id + '">' +
      '<div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:8px">' +
      '<div>' +
      '<div style="font-size:15px;font-weight:800">' + esc(ag.title) + '</div>' +
      '<div style="font-size:12px;color:#6b7280;margin-top:3px">' +
      esc(APP_LABELS[ag.app_id]||ag.app_id) + ' &nbsp;·&nbsp; ' + esc(lvLabel) +
      (ag.category ? ' / ' + esc(ag.category) : '') +
      (ag.class_name ? ' &nbsp;·&nbsp; 対象：' + esc(ag.class_name) : ' &nbsp;·&nbsp; 全クラス') +
      '</div>' +
      (ag.description ? '<div style="font-size:12px;color:#6b7280;margin-top:4px">' + esc(ag.description) + '</div>' : '') +
      '</div>' +
      '<div style="text-align:right;flex-shrink:0">' +
      (ag.due_date ? '<div style="font-size:12px;font-weight:700;color:#e65100">締切: ' + esc(ag.due_date) + '</div>' : '') +
      '<div style="font-size:11px;color:#9ca3af;margin-top:4px">作成: ' + fmt(ag.created_at) + '</div>' +
      '</div></div>' +
      '<div style="margin-top:12px;display:flex;gap:8px;flex-wrap:wrap">' +
      '<button class="gb-btn gb-btn-primary gb-btn-sm" data-view="' + ag.id + '">📊 成績を表示</button>' +
      (canEdit ? '<button class="gb-btn gb-btn-outline gb-btn-sm" data-del="' + ag.id + '">🗑 削除</button>' : '') +
      '</div></div>';
  }).join('');

  el.querySelectorAll('[data-view]').forEach(btn => {
    btn.onclick = () => viewAssignmentGrades(btn.dataset.view);
  });
  el.querySelectorAll('[data-del]').forEach(btn => {
    btn.onclick = () => deleteAssignment(btn.dataset.del);
  });
}

async function viewAssignmentGrades(agId) {
  const ag = _assignments.find(a => a.id === agId);
  if (!ag) return;

  const students = ag.class_name
    ? _students.filter(s => s.class_name === ag.class_name)
    : _students;

  const due = ag.due_date ? ag.due_date + 'T23:59:59' : null;
  let q = window.hk._client.from('quiz_results')
    .select('user_id,correct,total,score_pct,created_at')
    .eq('app_id', ag.app_id);
  if (ag.level)    q = q.eq('level', ag.level);
  if (ag.category) q = q.eq('category', ag.category);
  if (due)         q = q.lte('created_at', due);
  const { data: results } = await q;
  const quiz = results || [];

  const backdrop = document.createElement('div');
  backdrop.className = 'modal-back';

  const rows = students.map(s => {
    const sessions = quiz.filter(r => r.user_id === s.id);
    if (!sessions.length) return { student:s, sessions:0, best:null };
    const best = Math.max(...sessions.map(r => r.score_pct||0));
    return { student:s, sessions:sessions.length, best };
  });
  const done = rows.filter(r => r.sessions > 0).length;
  const avg  = done ? Math.round(rows.filter(r=>r.sessions>0).reduce((a,r)=>a+r.best,0)/done) : null;
  const lvLabel = (LEVEL_LABELS[ag.app_id]||{})[ag.level] || ag.level || '';

  backdrop.innerHTML =
    '<div class="modal-box" style="max-width:560px">' +
    '<div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:14px">' +
    '<div class="modal-title">' + esc(ag.title) + '</div>' +
    '<button id="gb-modal-close" style="background:none;border:none;font-size:20px;cursor:pointer;color:#9ca3af">×</button>' +
    '</div>' +
    '<div style="font-size:12px;color:#6b7280;margin-bottom:14px">' +
    esc(APP_LABELS[ag.app_id]||ag.app_id) + ' · ' + esc(lvLabel) +
    (ag.class_name ? ' · 対象クラス: ' + esc(ag.class_name) : '') +
    (ag.due_date ? ' · 締切: ' + esc(ag.due_date) : '') +
    '</div>' +
    '<div style="margin-bottom:12px;font-size:13px">' +
    '提出: <strong>' + done + '</strong>/' + students.length + '名' +
    (avg !== null ? ' &nbsp;·&nbsp; 平均: <strong>' + avg + '%</strong>' : '') +
    '</div>' +
    '<div style="max-height:50vh;overflow-y:auto">' +
    '<table class="gb-table"><thead><tr><th>氏名</th><th>クラス</th><th>最高点</th><th>状態</th></tr></thead><tbody>' +
    rows.map(r => {
      if (!r.sessions) return '<tr><td>' + esc(r.student.display_name||'') + '</td><td>' + esc(r.student.class_name||'') + '</td><td>—</td><td><span class="gb-badge gb-badge-none">未提出</span></td></tr>';
      const col = r.best>=80?'#16a34a':r.best>=60?'#d97706':'#dc2626';
      return '<tr><td>' + esc(r.student.display_name||'') + '</td><td>' + esc(r.student.class_name||'') + '</td><td style="font-weight:800;color:'+col+'">' + r.best + '%</td><td><span class="gb-badge" style="background:#dcfce7;color:#166534">提出済み</span></td></tr>';
    }).join('') +
    '</tbody></table></div>' +
    '<div style="margin-top:14px;display:flex;gap:8px;justify-content:flex-end">' +
    '<button class="gb-btn gb-btn-outline gb-btn-sm" id="gb-asgn-csv">CSV出力</button>' +
    '<button class="gb-btn gb-btn-primary gb-btn-sm" id="gb-modal-close2">閉じる</button>' +
    '</div></div>';

  document.body.appendChild(backdrop);
  backdrop.querySelector('#gb-modal-close').onclick  = () => backdrop.remove();
  backdrop.querySelector('#gb-modal-close2').onclick = () => backdrop.remove();
  backdrop.onclick = e => { if(e.target===backdrop) backdrop.remove(); };

  backdrop.querySelector('#gb-asgn-csv').onclick = () => {
    const csvRows = ['氏名,クラス,最高点,状態', ...rows.map(r =>
      ['"'+(r.student.display_name||'')+'"', '"'+(r.student.class_name||'')+'"',
       r.sessions ? r.best+'%' : '', r.sessions ? '提出済み' : '未提出'].join(','))];
    const blob = new Blob(['\uFEFF'+csvRows.join('\n')], {type:'text/csv'});
    const a = document.createElement('a'); a.href=URL.createObjectURL(blob);
    a.download = (ag.title||'assignment')+'.csv'; a.click();
  };
}

// ── Assignment creation modal ─────────────────────────────────────────────
function showAssignmentModal(existing) {
  const classes = [...new Set(_students.map(s=>s.class_name).filter(Boolean))].sort();
  const backdrop = document.createElement('div');
  backdrop.className = 'modal-back';
  const ag = existing || {};

  backdrop.innerHTML =
    '<div class="modal-box">' +
    '<div class="modal-title">' + (existing ? '課題を編集' : '新しい課題') + '</div>' +
    '<div class="modal-field"><label>課題タイトル *</label>' +
    '<input type="text" id="ag-title" placeholder="例：Unit 3 文法テスト" value="' + esc(ag.title||'') + '"></div>' +
    '<div class="modal-field"><label>説明（任意）</label>' +
    '<input type="text" id="ag-desc" placeholder="任意のメモ" value="' + esc(ag.description||'') + '"></div>' +
    '<div class="modal-field"><label>アプリ *</label>' +
    '<select id="ag-app">' + Object.entries(APP_LABELS).map(([k,v])=>'<option value="'+k+'"'+(k===(ag.app_id||'nh6')?' selected':'')+'>'+v+'</option>').join('') + '</select></div>' +
    '<div class="modal-field"><label>レベル / Unit</label>' +
    '<select id="ag-level"><option value="">指定なし（全体）</option>' +
    (APP_LEVELS['nh6']||[]).map(lv=>'<option value="'+lv+'"'+(lv===ag.level?' selected':'')+'>'+esc((LEVEL_LABELS['nh6']||{})[lv]||lv)+'</option>').join('') +
    '</select></div>' +
    '<div class="modal-field"><label>対象クラス</label>' +
    '<select id="ag-class"><option value="">全クラス</option>' + classes.map(c=>'<option value="'+esc(c)+'"'+(c===ag.class_name?' selected':'')+'>'+esc(c)+'</option>').join('') + '</select></div>' +
    '<div class="modal-field"><label>締め切り日</label>' +
    '<input type="date" id="ag-due" value="' + esc(ag.due_date||'') + '"></div>' +
    '<div style="display:flex;gap:8px;justify-content:flex-end;margin-top:16px">' +
    '<button class="gb-btn gb-btn-outline" id="ag-cancel">キャンセル</button>' +
    '<button class="gb-btn gb-btn-primary" id="ag-save">保存する</button>' +
    '</div></div>';

  document.body.appendChild(backdrop);
  backdrop.querySelector('#ag-cancel').onclick = () => backdrop.remove();
  backdrop.onclick = e => { if(e.target===backdrop) backdrop.remove(); };

  // Update level options when app changes
  backdrop.querySelector('#ag-app').onchange = function() {
    const lv = backdrop.querySelector('#ag-level');
    const levels = APP_LEVELS[this.value] || [];
    lv.innerHTML = '<option value="">指定なし（全体）</option>' +
      levels.map(l=>'<option value="'+l+'">'+esc((LEVEL_LABELS[this.value]||{})[l]||l)+'</option>').join('');
  };

  backdrop.querySelector('#ag-save').onclick = async () => {
    const title = backdrop.querySelector('#ag-title').value.trim();
    if (!title) { alert('タイトルを入力してください。'); return; }
    const payload = {
      title,
      description: backdrop.querySelector('#ag-desc').value.trim() || null,
      app_id:      backdrop.querySelector('#ag-app').value,
      level:       backdrop.querySelector('#ag-level').value || null,
      class_name:  backdrop.querySelector('#ag-class').value || null,
      due_date:    backdrop.querySelector('#ag-due').value || null,
      created_by:  _user.id,
    };
    const { error } = existing
      ? await window.hk._client.from('assignments').update(payload).eq('id', existing.id)
      : await window.hk._client.from('assignments').insert(payload);
    if (error) { alert('エラー: ' + error.message); return; }
    backdrop.remove();
    const { data } = await window.hk._client.from('assignments').select('*').order('created_at',{ascending:false});
    _assignments = data || [];
    _tab = 'assignments';
    render();
  };
}

async function deleteAssignment(id) {
  if (!confirm('この課題を削除しますか？')) return;
  await window.hk._client.from('assignments').delete().eq('id', id);
  _assignments = _assignments.filter(a => a.id !== id);
  render();
}

// ── CSV export (grades tab) ───────────────────────────────────────────────
function exportCSV() {
  if (!_quiz.length && !_students.length) { alert('先にデータを表示してください。'); return; }
  const students = _selClass ? _students.filter(s=>s.class_name===_selClass) : _students;
  const rows = ['氏名,クラス,学籍番号,回数,最高点,平均'];
  students.forEach(s => {
    const sessions = _quiz.filter(q => q.user_id === s.id);
    if (!sessions.length) { rows.push(['"'+s.display_name+'"', '"'+(s.class_name||'')+'"', '"'+(s.student_number||'')+'"','0','未提出','未提出'].join(',')); return; }
    const best = Math.max(...sessions.map(q=>q.score_pct||0));
    const avgC = sessions.reduce((a,q)=>a+(q.correct||0),0);
    const avgT = sessions.reduce((a,q)=>a+(q.total||0),0);
    const avg  = pct(avgC,avgT);
    rows.push(['"'+s.display_name+'"', '"'+(s.class_name||'')+'"', '"'+(s.student_number||'')+'"',sessions.length,best+'%',(avg!==null?avg+'%':'—')].join(','));
  });
  const blob = new Blob(['\uFEFF'+rows.join('\n')], {type:'text/csv'});
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
  a.download = (_selApp+'_'+_selLevel+'_grades.csv'); a.click();
}

})();
