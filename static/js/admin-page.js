// admin-page.js — admin dashboard for hakuicity.github.io/site/admin/
// Only accessible to users with role='admin' or role='teacher'.
// Reads all student data via Supabase (RLS allows this for elevated roles).
'use strict';

(function waitForHk() {
  if (typeof window.hk === 'undefined') {
    setTimeout(waitForHk, 50);
    return;
  }
  const root = document.getElementById('hk-admin-page');
  if (!root) return;

  const LEVEL_LABEL = { '5':'5級','4':'4級','3':'3級','P':'準2級' };
  const CAT_LABEL   = { ALL:'すべて',VOCAB:'語い',GRAMMAR:'文法',CONVERSATION:'会話',ORDER:'語順' };
  const CAT_COLOR   = { VOCAB:'#2E7D32',GRAMMAR:'#1565C0',CONVERSATION:'#E65100',ORDER:'#6A1B9A' };

  const style = document.createElement('style');
  style.textContent = `
    .adm { max-width: 960px; margin: 0 auto; padding: 8px 0 60px; }
    .adm h1 { font-size:22px; font-weight:800; margin-bottom:4px; }
    .adm-header { display:flex; justify-content:space-between; align-items:flex-start;
      flex-wrap:wrap; gap:12px; margin-bottom:24px; }
    .adm-subtitle { font-size:13px; color:#6b7280; }
    .adm-tabs { display:flex; gap:0; border:1.5px solid #d1d5db; border-radius:9px;
      overflow:hidden; margin-bottom:20px; }
    .adm-tab { flex:1; padding:9px; background:#fff; border:none; cursor:pointer;
      font-size:13px; font-weight:600; color:#374151; transition:all .15s; }
    .adm-tab.active { background:#1565C0; color:#fff; }
    .adm-tab + .adm-tab { border-left:1.5px solid #d1d5db; }
    .adm-section { margin-bottom:28px; }
    .adm-section-title { font-size:13px; font-weight:700; color:#374151; text-transform:uppercase;
      letter-spacing:.5px; margin-bottom:12px; padding-bottom:8px; border-bottom:2px solid #e5e7eb; }
    .adm-stat-grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(140px,1fr)); gap:12px; margin-bottom:20px; }
    .adm-stat-card { background:#fff; border:1px solid #e5e7eb; border-radius:12px;
      padding:16px; text-align:center; box-shadow:0 1px 4px rgba(0,0,0,.05); }
    .adm-stat-num { font-size:28px; font-weight:800; }
    .adm-stat-lbl { font-size:12px; color:#6b7280; margin-top:2px; }
    .adm-search { width:100%; max-width:320px; padding:9px 13px; border-radius:8px;
      border:1.5px solid #d1d5db; font-size:14px; margin-bottom:14px;
      background:#f9fafb; outline:none; box-sizing:border-box; }
    .adm-search:focus { border-color:#1565C0; }
    .adm-table { width:100%; border-collapse:collapse; font-size:13px; }
    .adm-table th { text-align:left; padding:8px 10px; font-size:11px; color:#9ca3af;
      border-bottom:1.5px solid #e5e7eb; font-weight:600; text-transform:uppercase; cursor:pointer; user-select:none; }
    .adm-table th:hover { color:#374151; }
    .adm-table td { padding:10px; border-bottom:1px solid #f3f4f6; }
    .adm-table tr:hover td { background:#f9fafb; }
    .adm-table tr.selected td { background:#eff6ff; }
    .adm-role-badge { display:inline-block; font-size:10px; font-weight:700; padding:2px 7px;
      border-radius:4px; }
    .adm-role-student { background:#e0f2fe; color:#0369a1; }
    .adm-role-teacher { background:#dcfce7; color:#15803d; }
    .adm-role-admin   { background:#fef9c3; color:#a16207; }
    .adm-btn-sm { padding:5px 12px; border-radius:6px; border:1.5px solid #d1d5db;
      background:transparent; font-size:12px; font-weight:600; cursor:pointer; transition:all .15s; }
    .adm-btn-sm:hover { border-color:#1565C0; color:#1565C0; }
    .adm-btn-primary { background:#1565C0; color:#fff; border-color:#1565C0; }
    .adm-btn-primary:hover { background:#0D47A1; }
    .adm-empty { text-align:center; color:#9ca3af; padding:32px; font-size:14px; }
    .adm-bar-wrap { background:#f3f4f6; border-radius:4px; height:7px; overflow:hidden; width:80px; display:inline-block; }
    .adm-bar { height:100%; border-radius:4px; }
    .adm-filter-row { display:flex; gap:10px; flex-wrap:wrap; margin-bottom:12px; align-items:center; }
    .adm-select { padding:7px 10px; border-radius:7px; border:1.5px solid #d1d5db;
      font-size:13px; background:#f9fafb; outline:none; }
    /* Student detail panel */
    .adm-detail { border:1.5px solid #e5e7eb; border-radius:12px; padding:20px;
      margin-top:16px; background:#fff; }
    .adm-detail h3 { font-size:16px; font-weight:800; margin-bottom:4px; }
    .adm-detail-sub { font-size:12px; color:#6b7280; margin-bottom:16px; }
    .adm-detail-grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(220px,1fr)); gap:16px; }
    .adm-detail-col h4 { font-size:12px; font-weight:700; color:#6b7280; text-transform:uppercase;
      margin-bottom:8px; padding-bottom:4px; border-bottom:1px solid #e5e7eb; }
    .adm-mini-table { width:100%; font-size:12px; border-collapse:collapse; }
    .adm-mini-table td { padding:5px 4px; border-bottom:1px solid #f3f4f6; }
    .adm-close-detail { float:right; background:none; border:none; font-size:18px;
      cursor:pointer; color:#9ca3af; }
    .adm-close-detail:hover { color:#374151; }
    .dark .adm-stat-card,.dark .adm-detail { background:#1e293b; border-color:#334155; }
    .dark .adm-table th,.dark .adm-mini-table td { border-color:#334155; color:#64748b; }
    .dark .adm-table td { border-color:#1e293b; }
    .dark .adm-table tr:hover td { background:#0f172a; }
    .dark .adm-table tr.selected td { background:#1e3a5f; }
    .dark .adm-section-title { color:#94a3b8; border-color:#334155; }
    .dark .adm-tab { background:#1e293b; color:#f1f5f9; }
    .dark .adm-tab.active { background:#1565C0; }
    .dark .adm-bar-wrap { background:#334155; }
    .dark .adm-search,.dark .adm-select { background:#0f172a; border-color:#475569; color:#f1f5f9; }
  `;
  document.head.appendChild(style);

  let _user = null, _profile = null;
  let _profiles = [], _allQuiz = [], _allIv = [];
  let _activeTab = 'students';

  const SUBJECTS = [
    { id:'english',     ja:'英語',       active:true  },
    { id:'calligraphy', ja:'書道',       active:true  },
    { id:'japanese',    ja:'国語',       active:false },
    { id:'math',        ja:'算数・数学', active:false },
    { id:'science',     ja:'理科',       active:false },
    { id:'social',      ja:'社会',       active:false },
    { id:'pe',          ja:'体育',       active:false },
    { id:'music',       ja:'音楽',       active:false },
    { id:'art',         ja:'図工・美術', active:false },
    { id:'home_ec',     ja:'家庭科',     active:false },
    { id:'moral',       ja:'道徳',       active:false },
    { id:'integrated',  ja:'総合',       active:false },
    { id:'homeroom',    ja:'担任',       active:false },
  ];
  let _selectedStudent = null;
  let _classFilter = '', _searchQuery = '';

  async function init() {
    root.innerHTML = '<p style="text-align:center;padding:40px;color:#6b7280">読み込み中...</p>';
    _user = await window.hk.getUser();
    if (!_user) {
      root.innerHTML = `<div style="text-align:center;padding:48px">
        <p style="font-size:16px;margin-bottom:16px">管理者ページにアクセスするにはログインが必要です。</p>
        <a href="/site/login/" style="display:inline-block;padding:11px 24px;background:#1565C0;
          color:#fff;border-radius:8px;font-weight:700;text-decoration:none">ログインする</a>
      </div>`;
      return;
    }
    _profile = await window.hk.getProfile(_user.id);
    if (!_profile || !['admin','teacher'].includes(_profile.role)) {
      root.innerHTML = `<div style="text-align:center;padding:48px">
        <p style="font-size:18px;margin-bottom:8px">⛔ アクセス権がありません</p>
        <p style="color:#6b7280;font-size:14px">このページは管理者・教員のみアクセス可能です。</p>
        <p style="color:#6b7280;font-size:12px;margin-top:8px">現在のロール：${escHtml(_profile ? _profile.role : 'なし')}</p>
      </div>`;
      return;
    }
    // Load all data in parallel
    [_profiles, _allQuiz, _allIv] = await Promise.all([
      window.hk.adminFetchAllProfiles(),
      window.hk.adminFetchAllQuizResults(),
      window.hk.adminFetchAllInterviewScores()
    ]);
    render();
  }

  function render() {
    const studentProfiles = _profiles.filter(p => p.role === 'student');
    const classes = [...new Set(studentProfiles.map(p => p.class_name).filter(Boolean))].sort();
    const totalQ  = _allQuiz.filter(r => r.category === 'ALL').reduce((s,r) => s + r.total, 0);
    const totalC  = _allQuiz.filter(r => r.category === 'ALL').reduce((s,r) => s + r.correct, 0);

    root.innerHTML = `
      <div class="adm">
        <div class="adm-header">
          <div>
            <h1>管理者ダッシュボード</h1>
            <p class="adm-subtitle">羽咋市英語教育ポータル — ようこそ、${escHtml((_profile&&_profile.display_name)||_user.email)} さん</p>
          </div>
          <button class="adm-btn-sm" id="adm-logout">ログアウト</button>
        </div>

        <!-- Top stats -->
        <div class="adm-stat-grid">
          <div class="adm-stat-card">
            <div class="adm-stat-num" style="color:#1565C0">${studentProfiles.length}</div>
            <div class="adm-stat-lbl">登録生徒数</div>
          </div>
          <div class="adm-stat-card">
            <div class="adm-stat-num" style="color:#2E7D32">${_allQuiz.filter(r=>r.category==='ALL').length}</div>
            <div class="adm-stat-lbl">クイズセッション総数</div>
          </div>
          <div class="adm-stat-card">
            <div class="adm-stat-num" style="color:#E65100">${totalQ > 0 ? Math.round(totalC/totalQ*100) : 0}%</div>
            <div class="adm-stat-lbl">全体の平均正答率</div>
          </div>
          <div class="adm-stat-card">
            <div class="adm-stat-num" style="color:#6A1B9A">${_allIv.length}</div>
            <div class="adm-stat-lbl">面接セッション総数</div>
          </div>
        </div>

        <!-- Tabs -->
        <div class="adm-tabs">
          <button class="adm-tab${_activeTab==='students'?' active':''}" data-tab="students">生徒一覧</button>
          <button class="adm-tab${_activeTab==='class'?' active':''}"    data-tab="class">クラス別</button>
          <button class="adm-tab${_activeTab==='users'?' active':''}"    data-tab="users">ユーザー管理</button>
        </div>

        <div id="adm-tab-content"></div>
      </div>`;

    document.getElementById('adm-logout').onclick = async () => {
      await window.hk.signOut(); window.location.href = '/site/login/';
    };
    root.querySelectorAll('.adm-tab').forEach(btn => {
      btn.onclick = () => {
        _activeTab = btn.dataset.tab;
        root.querySelectorAll('.adm-tab').forEach(b => b.classList.toggle('active', b.dataset.tab === _activeTab));
        renderTabContent();
      };
    });
    renderTabContent();
  }

  function renderTabContent() {
    const el = document.getElementById('adm-tab-content');
    if (!el) return;
    if (_activeTab === 'students') renderStudentsTab(el);
    else if (_activeTab === 'class') renderClassTab(el);
    else if (_activeTab === 'users') renderUsersTab(el);
  }

  // ── Students tab ──────────────────────────────────────────────────────────
  function renderStudentsTab(el) {
    const students = _profiles.filter(p => p.role === 'student');
    const classes  = [...new Set(students.map(p => p.class_name).filter(Boolean))].sort();

    el.innerHTML = `
      <div class="adm-filter-row">
        <input class="adm-search" id="adm-search" placeholder="名前・メールで検索" value="${escHtml(_searchQuery)}">
        <select class="adm-select" id="adm-class-filter">
          <option value="">すべてのクラス</option>
          ${classes.map(c => `<option value="${escHtml(c)}"${_classFilter===c?' selected':''}>${escHtml(c)}</option>`).join('')}
        </select>
      </div>
      <div id="adm-students-table"></div>
      <div id="adm-student-detail"></div>`;

    document.getElementById('adm-search').oninput = e => { _searchQuery = e.target.value; renderStudentTable(); };
    document.getElementById('adm-class-filter').onchange = e => { _classFilter = e.target.value; renderStudentTable(); };
    renderStudentTable();
  }

  function renderStudentTable() {
    const el = document.getElementById('adm-students-table');
    if (!el) return;
    let students = _profiles.filter(p => p.role === 'student');
    if (_classFilter) students = students.filter(p => p.class_name === _classFilter);
    if (_searchQuery) {
      const q = _searchQuery.toLowerCase();
      students = students.filter(p =>
        (p.display_name||'').toLowerCase().includes(q)
      );
    }

    if (students.length === 0) { el.innerHTML = '<p class="adm-empty">生徒が見つかりません。</p>'; return; }

    const rows = students.map(p => {
      const quiz = _allQuiz.filter(r => r.user_id === p.id && r.category === 'ALL');
      const totalQ = quiz.reduce((s,r) => s + r.total, 0);
      const totalC = quiz.reduce((s,r) => s + r.correct, 0);
      const pct = totalQ > 0 ? Math.round(totalC/totalQ*100) : null;
      const ivCount = _allIv.filter(r => r.user_id === p.id).length;
      const color = pct === null ? '#9ca3af' : pct >= 70 ? '#166534' : pct >= 50 ? '#92400e' : '#991b1b';
      const isSelected = _selectedStudent && _selectedStudent.id === p.id;
      return `<tr class="${isSelected?'selected':''}" data-uid="${p.id}" style="cursor:pointer">
        <td><strong>${escHtml(p.display_name||'—')}</strong></td>
        <td>${escHtml(p.class_name||'—')}</td>
        <td>${escHtml(p.school||'—')}</td>
        <td>${quiz.length}回</td>
        <td>
          ${pct !== null
            ? `<span style="font-weight:700;color:${color}">${pct}%</span>
               <div class="adm-bar-wrap" style="margin-left:6px">
                 <div class="adm-bar" style="width:${pct}%;background:${color}"></div>
               </div>`
            : '<span style="color:#9ca3af">なし</span>'}
        </td>
        <td>${ivCount > 0 ? ivCount+'回' : '—'}</td>
        <td>${new Date(p.created_at).toLocaleDateString('ja-JP')}</td>
      </tr>`;
    }).join('');

    el.innerHTML = `<table class="adm-table">
      <thead><tr>
        <th>名前</th><th>クラス</th><th>学校</th>
        <th>セッション数</th><th>正答率</th><th>面接回数</th><th>登録日</th>
      </tr></thead>
      <tbody>${rows}</tbody>
    </table>`;

    el.querySelectorAll('tr[data-uid]').forEach(tr => {
      tr.onclick = () => {
        const uid = tr.dataset.uid;
        const p = _profiles.find(x => x.id === uid);
        _selectedStudent = (_selectedStudent && _selectedStudent.id === uid) ? null : p;
        renderStudentTable();
        renderStudentDetail();
      };
    });
    renderStudentDetail();
  }

  const NH_CAT_NAMES = {
    feelings:'気持ち', numbers:'数', colors:'色', shapes:'形',
    sports:'スポーツ', food:'食べ物', drinks:'飲み物', desserts:'デザート',
    fruit:'果物', vegetables:'野菜', ingredients:'食材', tastes:'味',
    animals:'動物', 'sea-animals':'海の生き物', bugs:'虫', nature:'自然',
    time:'月・曜日・季節', weather:'天気', people:'人', family:'家族',
    personalities:'性格', actions:'動作', daily:'一日の生活',
    clothes:'服装', body:'からだ', town:'町', school:'学校',
    stationery:'文房具', instruments:'楽器', things:'身の回りのもの',
    events:'行事', descriptions:'様子', jobs:'職業', clubs:'部活動',
    g5u1:'5年 Unit 1',g5u2:'5年 Unit 2',g5u3:'5年 Unit 3',g5u4:'5年 Unit 4',
    g5u5:'5年 Unit 5',g5u6:'5年 Unit 6',g5u7:'5年 Unit 7',g5u8:'5年 Unit 8',
    g6u1:'6年 Unit 1',g6u2:'6年 Unit 2',g6u3:'6年 Unit 3',g6u4:'6年 Unit 4',
    g6u5:'6年 Unit 5',g6u6:'6年 Unit 6',g6u7:'6年 Unit 7',g6u8:'6年 Unit 8', all:'全Unit'
  };

  // Global tab switch for student detail (called inline from HTML)
  window.admDetailTab = function(tab) {
    const eiken = document.getElementById('adm-panel-eiken');
    const nh    = document.getElementById('adm-panel-nh');
    const btnE  = document.getElementById('adm-tab-eiken');
    const btnN  = document.getElementById('adm-tab-nh');
    if (!eiken || !nh) return;
    eiken.style.display = tab === 'eiken' ? '' : 'none';
    nh.style.display    = tab === 'nh'    ? '' : 'none';
    if (btnE) { btnE.style.background = tab==='eiken'?'#1565C0':'#f9fafb'; btnE.style.color = tab==='eiken'?'#fff':'#374151'; }
    if (btnN) { btnN.style.background = tab==='nh'?'#1565C0':'#f9fafb';   btnN.style.color = tab==='nh'?'#fff':'#374151'; }
  };

  function renderStudentDetail() {
    const el = document.getElementById('adm-student-detail');
    if (!el) return;
    if (!_selectedStudent) { el.innerHTML = ''; return; }
    const p = _selectedStudent;

    const eikenQuiz = _allQuiz.filter(r => r.user_id === p.id && r.app_id !== 'newhorizon' && r.category === 'ALL');
    const eikenCat  = _allQuiz.filter(r => r.user_id === p.id && r.app_id !== 'newhorizon' && r.category !== 'ALL');
    const iv        = _allIv.filter(r => r.user_id === p.id);
    const totalQ    = eikenQuiz.reduce((s,r) => s+r.total, 0);
    const totalC    = eikenQuiz.reduce((s,r) => s+r.correct, 0);

    const levelRows = ['5','4','3','P'].map(lv => {
      const lvQ = eikenQuiz.filter(r => r.level === lv);
      if (!lvQ.length) return '';
      const tQ = lvQ.reduce((s,r) => s+r.total, 0);
      const tC = lvQ.reduce((s,r) => s+r.correct, 0);
      const pct = Math.round(tC/tQ*100);
      const col = pct>=70?'#166534':pct>=50?'#92400e':'#991b1b';
      return '<tr><td>'+LEVEL_LABEL[lv]+'</td><td>'+lvQ.length+'回</td><td style="font-weight:700;color:'+col+'">'+pct+'%</td></tr>';
    }).join('');

    const catRows = Object.entries(CAT_COLOR).map(([cat,col]) => {
      const cs = eikenCat.filter(r => r.category === cat && r.level);
      if (!cs.length) return '';
      const tQ = cs.reduce((s,r) => s+r.total, 0);
      const tC = cs.reduce((s,r) => s+r.correct, 0);
      const pct = Math.round(tC/tQ*100);
      return '<tr><td><span style="font-weight:700;color:'+col+'">'+CAT_LABEL[cat]+'</span></td><td style="font-weight:700">'+pct+'%</td></tr>';
    }).join('');

    const ivRows = iv.slice(0,8).map(r => {
      const col = r.avg_score>=70?'#166534':r.avg_score>=50?'#92400e':'#991b1b';
      return '<tr><td>'+(LEVEL_LABEL[r.level]||r.level)+'</td><td>'+escHtml(r.topic)+'</td><td style="font-weight:700;color:'+col+'">'+r.avg_score+'%</td></tr>';
    }).join('');

    const nhQuiz = _allQuiz.filter(r => r.user_id === p.id && r.app_id === 'newhorizon');
    const nhGroups = {};
    nhQuiz.forEach(r => {
      const key = r.level || 'other';
      if (!nhGroups[key]) nhGroups[key] = { correct:0, total:0, sessions:0 };
      nhGroups[key].correct  += r.correct  || 0;
      nhGroups[key].total    += r.total    || 0;
      nhGroups[key].sessions += 1;
    });
    const nhRows = Object.entries(nhGroups)
      .sort((a,b) => b[1].sessions - a[1].sessions)
      .map(([key, s]) => {
        const pct = s.total > 0 ? Math.round(s.correct / s.total * 100) : 0;
        const label = NH_CAT_NAMES[key] || key;
        const col = pct>=80?'#166534':pct>=60?'#92400e':'#991b1b';
        return '<tr>' +
          '<td style="font-weight:700">'+escHtml(label)+'</td>' +
          '<td style="text-align:center;color:#6b7280">'+s.sessions+'</td>' +
          '<td style="font-weight:800;color:'+col+';text-align:center">'+pct+'%</td>' +
          '<td style="min-width:80px"><div style="background:#f3f4f6;border-radius:3px;height:6px"><div style="width:'+pct+'%;height:100%;background:'+col+';border-radius:3px"></div></div></td>' +
          '</tr>';
      }).join('');

    el.innerHTML =
      '<div class="adm-detail">' +
        '<button class="adm-close-detail" id="adm-close-detail">×</button>' +
        '<h3>'+escHtml(p.display_name||'—')+'</h3>' +
        '<p class="adm-detail-sub">'+escHtml(p.class_name||'')+' '+escHtml(p.school||'')+' · 登録日：'+new Date(p.created_at).toLocaleDateString('ja-JP')+'</p>' +
        '<div style="display:flex;gap:0;border:1.5px solid #e5e7eb;border-radius:8px;overflow:hidden;margin-bottom:16px">' +
          '<button id="adm-tab-eiken" data-adm-tab="eiken" style="flex:1;padding:8px;background:#1565C0;color:#fff;border:none;font-size:12px;font-weight:800;cursor:pointer">🎓 英検アプリ</button>' +
          '<button id="adm-tab-nh" data-adm-tab="nh" style="flex:1;padding:8px;background:#f9fafb;color:#374151;border:none;border-left:1.5px solid #e5e7eb;font-size:12px;font-weight:800;cursor:pointer">📘 New Horizon</button>' +
        '</div>' +
        '<div id="adm-panel-eiken">' +
          '<div style="display:flex;gap:20px;margin-bottom:14px;flex-wrap:wrap">' +
            '<div><strong style="font-size:18px;color:#1565C0">'+eikenQuiz.length+'</strong><span style="color:#6b7280;font-size:12px"> セッション</span></div>' +
            '<div><strong style="font-size:18px;color:#2E7D32">'+totalQ+'</strong><span style="color:#6b7280;font-size:12px"> 回答</span></div>' +
            '<div><strong style="font-size:18px;color:#E65100">'+(totalQ>0?Math.round(totalC/totalQ*100):0)+'%</strong><span style="color:#6b7280;font-size:12px"> 正答率</span></div>' +
          '</div>' +
          '<div class="adm-detail-grid">' +
            '<div class="adm-detail-col"><h4>レベル別</h4>'+(levelRows?'<table class="adm-mini-table"><thead><tr><th>レベル</th><th>回数</th><th>正答率</th></tr></thead><tbody>'+levelRows+'</tbody></table>':'<p style="color:#9ca3af;font-size:12px">データなし</p>')+'</div>' +
            '<div class="adm-detail-col"><h4>カテゴリー別</h4>'+(catRows?'<table class="adm-mini-table"><thead><tr><th>カテゴリー</th><th>正答率</th></tr></thead><tbody>'+catRows+'</tbody></table>':'<p style="color:#9ca3af;font-size:12px">データなし</p>')+'</div>' +
            '<div class="adm-detail-col"><h4>面接練習</h4>'+(ivRows?'<table class="adm-mini-table"><thead><tr><th>レベル</th><th>トピック</th><th>スコア</th></tr></thead><tbody>'+ivRows+'</tbody></table>':'<p style="color:#9ca3af;font-size:12px">データなし</p>')+'</div>' +
          '</div>' +
        '</div>' +
        '<div id="adm-panel-nh" style="display:none">' +
          (nhRows ?
            '<div style="margin-bottom:12px;font-size:13px;color:#6b7280"><strong style="color:#1565C0">'+nhQuiz.length+'</strong> セッション合計</div>' +
            '<table class="adm-mini-table" style="width:100%"><thead><tr><th>カテゴリー / Unit</th><th style="text-align:center">回数</th><th style="text-align:center">正答率</th><th>スコア</th></tr></thead><tbody>'+nhRows+'</tbody></table>'
            : '<p style="color:#9ca3af;font-size:12px">New Horizonのデータはまだありません。</p>') +
        '</div>' +
        ((_profile && ['admin','teacher'].includes(_profile.role)) ?
          '<div style="margin-top:18px;padding-top:14px;border-top:1.5px solid #f3f4f6">' +
          '<div style="font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:.5px;color:#9ca3af;margin-bottom:8px">🔐 アカウント管理</div>' +
          '<div style="display:flex;gap:8px;flex-wrap:wrap">' +
          '<button id="adm-reset-pw-btn" style="padding:7px 14px;border-radius:7px;border:1.5px solid #fca5a5;background:#fff;color:#dc2626;font-size:12px;font-weight:800;cursor:pointer">🔑 パスワードをリセット</button>' +
          '</div></div>'
          : '') +
      '</div>';

    document.querySelectorAll('[data-adm-tab]').forEach(function(btn) {
      btn.onclick = function() { admDetailTab(btn.getAttribute('data-adm-tab')); };
    });
    document.getElementById('adm-close-detail').onclick = () => {
      _selectedStudent = null;
      renderStudentTable();
    };

    // Password reset button (admin/teacher only)
    const pwBtn = document.getElementById('adm-reset-pw-btn');
    if (pwBtn) {
      pwBtn.onclick = () => resetStudentPassword(p);
    }
  }

  // ── Class tab ──────────────────────────────────────────────────────────────
  function renderClassTab(el) {
    const students = _profiles.filter(p => p.role === 'student');
    const classes  = [...new Set(students.map(p => p.class_name).filter(Boolean))].sort();
    if (classes.length === 0) {
      el.innerHTML = '<p class="adm-empty">クラス情報が登録された生徒はまだいません。</p>'; return;
    }
    const rows = classes.map(cls => {
      const members = students.filter(p => p.class_name === cls);
      const uids    = members.map(p => p.id);
      const quiz    = _allQuiz.filter(r => uids.includes(r.user_id) && r.category === 'ALL');
      const totalQ  = quiz.reduce((s,r) => s+r.total, 0);
      const totalC  = quiz.reduce((s,r) => s+r.correct, 0);
      const pct     = totalQ > 0 ? Math.round(totalC/totalQ*100) : null;
      const color   = pct === null ? '#9ca3af' : pct>=70?'#166534':pct>=50?'#92400e':'#991b1b';
      return `<tr>
        <td><strong>${escHtml(cls)}</strong></td>
        <td>${members.length}名</td>
        <td>${quiz.length}回</td>
        <td>${totalQ}</td>
        <td style="font-weight:700;color:${color}">${pct !== null ? pct+'%' : '—'}</td>
      </tr>`;
    }).join('');

    el.innerHTML = `
      <div class="adm-section">
        <div class="adm-section-title">クラス別の成績まとめ</div>
        <table class="adm-table">
          <thead><tr><th>クラス</th><th>生徒数</th><th>セッション数</th><th>回答数</th><th>平均正答率</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>`;
  }

  // ── Users tab ──────────────────────────────────────────────────────────────
  function renderUsersTab(el) {
    const isAdmin   = _profile && _profile.role === 'admin';
    const staffList = _profiles.filter(p => p.role !== 'student');

    const ROLE_LABELS = { admin:'管理者', teacher:'教員' };
    const ROLE_COLORS = { admin:'#a16207', teacher:'#15803d' };
    const schools = [...new Set(_profiles.map(p=>p.school).filter(Boolean))].sort();

    const rows = staffList.map(p => {
      const isMe        = p.id === (_profile && _profile.id);
      const isProtected = p.role === 'admin';
      const label       = ROLE_LABELS[p.role] || p.role;
      const color       = ROLE_COLORS[p.role] || '#374151';
      const subjLabel   = p.subject ? ((SUBJECTS.find(s=>s.id===p.subject)||{}).ja || p.subject) : '—';
      const classes     = (p.assigned_classes || []).join(', ') || '—';
      return '<tr>' +
        '<td><strong>' + escHtml(p.display_name||'—') + '</strong>' +
          (isMe ? ' <span style="font-size:10px;color:#9ca3af">(自分)</span>' : '') + '</td>' +
        '<td style="font-size:12px;color:#6b7280">' + escHtml(p.school||'—') + '</td>' +
        '<td style="font-size:12px">' + escHtml(subjLabel) + '</td>' +
        '<td style="font-size:11px;color:#6b7280;max-width:120px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis" title="' + escHtml(classes) + '">' + escHtml(classes) + '</td>' +
        '<td><span style="font-weight:700;color:' + color + '">' + label + '</span></td>' +
        '<td style="white-space:nowrap">' +
          (isAdmin
            ? '<button class="edit-btn" data-uid="' + p.id + '" ' +
              'style="padding:4px 10px;border:1.5px solid #e5e7eb;border-radius:6px;font-size:11px;font-weight:700;background:#fff;color:#374151;cursor:pointer;margin-right:4px">✎ 編集</button>'
            : '') +
          (isAdmin
            ? '<button class="assign-btn" data-uid="' + p.id + '" ' +
              'style="padding:4px 10px;border:1.5px solid #a7f3d0;border-radius:6px;font-size:11px;font-weight:700;background:#fff;color:#065f46;cursor:pointer;margin-right:4px">担当設定</button>'
            : '') +
          (isAdmin && !isProtected && !isMe
            ? '<button class="revoke-btn" data-uid="' + p.id + '" data-name="' + escHtml(p.display_name||'') + '" ' +
              'style="padding:4px 10px;border:1.5px solid #fca5a5;border-radius:6px;font-size:11px;font-weight:700;background:#fff;color:#dc2626;cursor:pointer">削除</button>'
            : '') +
        '</td>' +
        '<td style="font-size:12px;color:#9ca3af">' + new Date(p.created_at).toLocaleDateString('ja-JP') + '</td>' +
        '</tr>';
    }).join('');

    el.innerHTML =
      '<div class="adm-section">' +

      '<div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px;margin-bottom:14px">' +
      '<div class="adm-section-title" style="margin:0">👥 スタッフ管理</div>' +
      (isAdmin
        ? '<button id="add-staff-btn" style="padding:8px 16px;background:#1565C0;color:#fff;border:none;border-radius:8px;font-size:13px;font-weight:800;cursor:pointer">＋ スタッフを追加</button>'
        : '') +
      '</div>' +
      (isAdmin
        ? '<p style="font-size:12px;color:#6b7280;margin-bottom:12px">ロールの変更と新規スタッフの追加ができます。管理者アカウントはここでは変更できません。</p>'
        : '<p style="font-size:12px;color:#6b7280;margin-bottom:12px">スタッフ一覧です（閲覧のみ）。</p>') +
      '<table class="adm-table"><thead><tr>' +
      '<th>名前</th><th>学校</th><th>担当教科</th><th>担当クラス</th><th>ロール</th><th></th><th>登録日</th>' +
      '</tr></thead><tbody>' + rows + '</tbody></table>' +
      '</div>';

    // Role change dropdowns
    el.querySelectorAll('.role-select').forEach(sel => {
      sel.onchange = async function() {
        const uid  = this.dataset.uid;
        const name = this.dataset.name;
        const role = this.value;
        if (!confirm('「' + name + '」のロールを「' + ROLE_LABELS[role] + '」に変更しますか？')) {
          // Revert visually
          const p = _profiles.find(x => x.id === uid);
          if (p) this.value = p.role;
          return;
        }
        try {
          await callManageStudent({ action: 'set-role', user_id: uid, new_role: role });
          const p = _profiles.find(x => x.id === uid);
          if (p) p.role = role;
          this.style.color = ROLE_COLORS[role] || '#374151';
        } catch(e) { alert('エラー: ' + e.message); this.value = (_profiles.find(x=>x.id===uid)||{}).role || 'teacher'; }
      };
    });

    // Edit buttons
    el.querySelectorAll('.edit-btn').forEach(btn => {
      btn.onclick = function() {
        const p = _profiles.find(x => x.id === this.dataset.uid);
        if (p) showEditStaffModal(p);
      };
    });

    // Assignment buttons
    el.querySelectorAll('.assign-btn').forEach(btn => {
      btn.onclick = function() {
        const p = _profiles.find(x => x.id === this.dataset.uid);
        if (p) showAssignModal(p, schools);
      };
    });

    // Revoke buttons
    el.querySelectorAll('.revoke-btn').forEach(btn => {
      btn.onclick = async function() {
        const uid  = this.dataset.uid;
        const name = this.dataset.name;
        if (!confirm('「' + name + '」のスタッフアクセスを削除し、アカウントを無効化しますか？\nこの操作は取り消せません。')) return;
        try {
          await callManageStudent({ action: 'revoke-staff', user_id: uid });
          _profiles = _profiles.filter(p => p.id !== uid);
          renderRoot();
        } catch(e) { alert('エラー: ' + e.message); }
      };
    });

    // Add staff button
    if (isAdmin && document.getElementById('add-staff-btn')) {
      document.getElementById('add-staff-btn').onclick = () => showAddStaffModal();
    }
  }

  function showEditStaffModal(p) {
    const existing = document.getElementById('edit-staff-modal');
    if (existing) existing.remove();
    const isProtected = p.role === 'admin';

    const modal = document.createElement('div');
    modal.id = 'edit-staff-modal';
    modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.45);display:flex;align-items:center;justify-content:center;z-index:200;padding:16px;backdrop-filter:blur(4px)';
    modal.innerHTML =
      '<div style="background:#fff;border-radius:16px;padding:24px 22px;width:100%;max-width:400px;box-shadow:0 12px 40px rgba(0,0,0,.2)">' +
      '<h2 style="font-size:18px;font-weight:900;margin-bottom:16px">✎ スタッフ編集</h2>' +

      '<div style="margin-bottom:12px">' +
      '<label style="font-size:11px;font-weight:800;text-transform:uppercase;color:#6b7280;display:block;margin-bottom:4px">表示名</label>' +
      '<input type="text" id="es-name" value="' + escHtml(p.display_name||'') + '" style="width:100%;padding:9px 12px;border:1.5px solid #e5e7eb;border-radius:8px;font-size:13px"></div>' +

      (!isProtected ?
      '<div style="margin-bottom:12px">' +
      '<label style="font-size:11px;font-weight:800;text-transform:uppercase;color:#6b7280;display:block;margin-bottom:4px">ロール</label>' +
      '<select id="es-role" style="width:100%;padding:9px 12px;border:1.5px solid #e5e7eb;border-radius:8px;font-size:13px">' +
      '<option value="teacher"' + (p.role==='teacher'?' selected':'') + '>教員</option>' +
      '</select></div>' : '') +

      '<div style="margin-bottom:16px;padding:12px;background:#f9fafb;border-radius:8px;border:1.5px solid #e5e7eb">' +
      '<p style="font-size:12px;font-weight:700;margin-bottom:8px">🔑 パスワードリセット</p>' +
      '<div style="display:flex;gap:6px">' +
      '<input type="text" id="es-pass" placeholder="新しいパスワード（8文字以上）" style="flex:1;padding:8px 10px;border:1.5px solid #e5e7eb;border-radius:7px;font-size:12px">' +
      '<button id="es-gen" style="padding:8px 10px;border:1.5px solid #e5e7eb;border-radius:7px;font-size:12px;background:#fff;cursor:pointer">🎲</button>' +
      '</div></div>' +

      '<div id="es-err" style="margin-bottom:10px;padding:8px 12px;background:#fff5f5;border:1px solid #fca5a5;color:#dc2626;border-radius:7px;font-size:12px;display:none"></div>' +
      '<div id="es-ok"  style="margin-bottom:10px;padding:8px 12px;background:#f0fdf4;border:1px solid #86efac;color:#166534;border-radius:7px;font-size:12px;display:none"></div>' +
      '<div style="display:flex;gap:8px;justify-content:flex-end">' +
      '<button id="es-cancel" style="padding:9px 18px;border:1.5px solid #e5e7eb;border-radius:8px;background:#fff;font-size:13px;font-weight:700;cursor:pointer">閉じる</button>' +
      '<button id="es-save" style="padding:9px 18px;background:#1565C0;color:#fff;border:none;border-radius:8px;font-size:13px;font-weight:800;cursor:pointer">保存する</button>' +
      '</div></div>';

    document.body.appendChild(modal);
    modal.onclick = e => { if(e.target===modal) modal.remove(); };
    modal.querySelector('#es-cancel').onclick = () => modal.remove();

    modal.querySelector('#es-gen').onclick = () => {
      const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#';
      let pw = '';
      for (let i = 0; i < 10; i++) pw += chars[Math.floor(Math.random()*chars.length)];
      modal.querySelector('#es-pass').value = pw;
    };

    modal.querySelector('#es-save').onclick = async () => {
      const name    = modal.querySelector('#es-name').value.trim();
      const roleEl  = modal.querySelector('#es-role');
      const role    = roleEl ? roleEl.value : p.role;
      const pass    = modal.querySelector('#es-pass').value.trim();
      const errEl   = modal.querySelector('#es-err');
      const okEl    = modal.querySelector('#es-ok');
      const btn     = modal.querySelector('#es-save');
      errEl.style.display = 'none'; okEl.style.display = 'none';
      if (!name) { errEl.textContent = '表示名を入力してください。'; errEl.style.display=''; return; }
      if (pass && pass.length < 8) { errEl.textContent = 'パスワードは8文字以上にしてください。'; errEl.style.display=''; return; }

      btn.disabled = true; btn.textContent = '保存中...';
      try {
        // Update profile fields
        await window.hk.updateProfile(p.id, { display_name: name, role });

        // Reset password if provided
        if (pass) {
          await callManageStudent({ action:'reset-password', user_id: p.id, new_password: pass });
        }

        // Update local cache
        const lp = _profiles.find(x=>x.id===p.id);
        if (lp) { lp.display_name = name; lp.role = role; }
        okEl.textContent = '✅ 保存しました。' + (pass ? ' パスワードもリセットしました。' : '');
        okEl.style.display = '';
        btn.disabled = false; btn.textContent = '保存する';
        renderRoot();
      } catch(e) {
        errEl.textContent = 'エラー: ' + e.message;
        errEl.style.display = '';
        btn.disabled = false; btn.textContent = '保存する';
      }
    };
  }

  function showAssignModal(p, schools) {
    const existing = document.getElementById('assign-modal');
    if (existing) existing.remove();

    // Parse current assigned_classes
    const currentClasses = (p.assigned_classes || []).join(', ');
    // All classes from student roster
    const allClasses = [...new Set(_profiles.filter(x=>x.role==='student').map(x=>x.class_name).filter(Boolean))].sort();
    const schoolList = schools.length ? schools : (p.school ? [p.school] : []);

    const modal = document.createElement('div');
    modal.id = 'assign-modal';
    modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.45);display:flex;align-items:center;justify-content:center;z-index:200;padding:16px;backdrop-filter:blur(4px)';
    modal.innerHTML =
      '<div style="background:#fff;border-radius:16px;padding:24px 22px;width:100%;max-width:420px;box-shadow:0 12px 40px rgba(0,0,0,.2)">' +
      '<h2 style="font-size:18px;font-weight:900;margin-bottom:4px">担当設定</h2>' +
      '<p style="font-size:12px;color:#6b7280;margin-bottom:16px">' + escHtml(p.display_name||'') + '</p>' +

      '<div style="margin-bottom:12px">' +
      '<label style="font-size:11px;font-weight:800;text-transform:uppercase;color:#6b7280;display:block;margin-bottom:4px">担当学校</label>' +
      '<div style="display:flex;gap:6px">' +
      '<select id="as-school" style="flex:1;padding:8px 10px;border:1.5px solid #e5e7eb;border-radius:7px;font-size:13px">' +
      '<option value="">指定なし（全校）</option>' +
      schoolList.map(s=>'<option value="'+escHtml(s)+'"'+(s===p.school?' selected':'')+'>'+escHtml(s)+'</option>').join('') +
      '</select>' +
      '<input type="text" id="as-school-new" placeholder="新しい学校名" style="flex:1;padding:8px 10px;border:1.5px solid #e5e7eb;border-radius:7px;font-size:13px">' +
      '</div>' +
      '<p style="font-size:10px;color:#9ca3af;margin-top:3px">学校名を選択するか、新しい名前を入力してください</p>' +
      '</div>' +

      '<div style="margin-bottom:12px">' +
      '<label style="font-size:11px;font-weight:800;text-transform:uppercase;color:#6b7280;display:block;margin-bottom:4px">担当教科</label>' +
      '<select id="as-subject" style="width:100%;padding:8px 10px;border:1.5px solid #e5e7eb;border-radius:7px;font-size:13px">' +
      '<option value="">指定なし</option>' +
      SUBJECTS.map(s=>'<option value="'+s.id+'"'+(s.id===p.subject?' selected':'')+'>'+s.ja+(s.active?' ★':'')+'</option>').join('') +
      '</select>' +
      '</div>' +

      '<div style="margin-bottom:16px">' +
      '<label style="font-size:11px;font-weight:800;text-transform:uppercase;color:#6b7280;display:block;margin-bottom:6px">担当クラス</label>' +
      (allClasses.length
        ? '<div style="display:flex;flex-wrap:wrap;gap:6px" id="as-classes-check">' +
          allClasses.map(c =>
            '<label style="display:flex;align-items:center;gap:4px;font-size:12px;cursor:pointer;padding:3px 8px;border:1.5px solid #e5e7eb;border-radius:6px;'+
            ((p.assigned_classes||[]).includes(c)?'background:#eff6ff;border-color:#93c5fd;':'background:#f9fafb;')+ '">' +
            '<input type="checkbox" value="'+escHtml(c)+'"'+((p.assigned_classes||[]).includes(c)?' checked':'')+' style="accent-color:#1565C0"> '+escHtml(c)+
            '</label>'
          ).join('') +
          '</div>'
        : '<input type="text" id="as-classes-text" value="'+escHtml(currentClasses)+'" placeholder="例: 3年生, 4年生" style="width:100%;padding:8px 10px;border:1.5px solid #e5e7eb;border-radius:7px;font-size:13px">'+
          '<p style="font-size:10px;color:#9ca3af;margin-top:3px">カンマ区切りで複数クラスを入力</p>') +
      '</div>' +

      '<div id="as-err" style="margin-bottom:10px;padding:8px 12px;background:#fff5f5;border:1px solid #fca5a5;color:#dc2626;border-radius:7px;font-size:12px;display:none"></div>' +
      '<div style="display:flex;gap:8px;justify-content:flex-end">' +
      '<button id="as-cancel" style="padding:9px 18px;border:1.5px solid #e5e7eb;border-radius:8px;background:#fff;font-size:13px;font-weight:700;cursor:pointer">キャンセル</button>' +
      '<button id="as-save" style="padding:9px 18px;background:#1565C0;color:#fff;border:none;border-radius:8px;font-size:13px;font-weight:800;cursor:pointer">保存する</button>' +
      '</div></div>';

    document.body.appendChild(modal);
    modal.onclick = e => { if(e.target===modal) modal.remove(); };
    modal.querySelector('#as-cancel').onclick = () => modal.remove();

    modal.querySelector('#as-save').onclick = async () => {
      const schoolDrop  = modal.querySelector('#as-school').value;
      const schoolNew   = modal.querySelector('#as-school-new').value.trim();
      const school      = schoolNew || schoolDrop || '';
      const subject     = modal.querySelector('#as-subject').value || null;

      // Collect classes
      let assignedClasses = [];
      const checkboxes = modal.querySelectorAll('#as-classes-check input[type=checkbox]');
      const textInput  = modal.querySelector('#as-classes-text');
      if (checkboxes.length) {
        checkboxes.forEach(cb => { if (cb.checked) assignedClasses.push(cb.value); });
      } else if (textInput) {
        assignedClasses = textInput.value.split(',').map(s=>s.trim()).filter(Boolean);
      }

      const errEl = modal.querySelector('#as-err');
      const btn   = modal.querySelector('#as-save');
      btn.disabled = true; btn.textContent = '保存中...';
      errEl.style.display = 'none';

      try {
        await window.hk.updateProfile(p.id, {
          school:           school || null,
          subject,
          assigned_classes: assignedClasses.length ? assignedClasses : null,
        });

        // Update local cache
        const lp = _profiles.find(x=>x.id===p.id);
        if (lp) { lp.school = school||null; lp.subject = subject; lp.assigned_classes = assignedClasses.length ? assignedClasses : null; }
        modal.remove();
        renderRoot();
      } catch(e) {
        errEl.textContent = 'エラー: ' + e.message;
        errEl.style.display = '';
        btn.disabled = false; btn.textContent = '保存する';
      }
    };
  }

  function showAddStaffModal() {
    const existing = document.getElementById('add-staff-modal');
    if (existing) existing.remove();

    const modal = document.createElement('div');
    modal.id = 'add-staff-modal';
    modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.45);display:flex;align-items:center;justify-content:center;z-index:200;padding:16px;backdrop-filter:blur(4px)';
    modal.innerHTML =
      '<div style="background:#fff;border-radius:16px;padding:24px 22px;width:100%;max-width:400px;box-shadow:0 12px 40px rgba(0,0,0,.2)">' +
      '<h2 style="font-size:18px;font-weight:900;margin-bottom:16px">👥 スタッフを追加</h2>' +
      '<div style="display:flex;flex-direction:column;gap:11px">' +
      '<div><label style="font-size:11px;font-weight:800;text-transform:uppercase;color:#6b7280;display:block;margin-bottom:3px">表示名 *</label>' +
      '<input type="text" id="ns-name" placeholder="例：鈴木 花子先生" style="width:100%;padding:9px 12px;border:1.5px solid #e5e7eb;border-radius:8px;font-size:13px"></div>' +
      '<div><label style="font-size:11px;font-weight:800;text-transform:uppercase;color:#6b7280;display:block;margin-bottom:3px">メールアドレス *</label>' +
      '<input type="email" id="ns-email" placeholder="teacher@school.ed.jp" style="width:100%;padding:9px 12px;border:1.5px solid #e5e7eb;border-radius:8px;font-size:13px"></div>' +
      '<div><label style="font-size:11px;font-weight:800;text-transform:uppercase;color:#6b7280;display:block;margin-bottom:3px">ロール *</label>' +
      '<select id="ns-role" style="width:100%;padding:9px 12px;border:1.5px solid #e5e7eb;border-radius:8px;font-size:13px">' +
      '<option value="teacher">教員</option>' +
      '' +
      '</select></div>' +
      '<div><label style="font-size:11px;font-weight:800;text-transform:uppercase;color:#6b7280;display:block;margin-bottom:3px">初期パスワード *</label>' +
      '<div style="display:flex;gap:6px">' +
      '<input type="text" id="ns-pass" placeholder="8文字以上" style="flex:1;padding:9px 12px;border:1.5px solid #e5e7eb;border-radius:8px;font-size:13px">' +
      '<button id="ns-gen" style="padding:9px 12px;border:1.5px solid #e5e7eb;border-radius:8px;font-size:12px;background:#f9fafb;cursor:pointer">🎲</button>' +
      '</div></div>' +
      '</div>' +
      '<div id="ns-err" style="margin-top:10px;padding:8px 12px;background:#fff5f5;border:1px solid #fca5a5;color:#dc2626;border-radius:7px;font-size:12px;display:none"></div>' +
      '<div style="display:flex;gap:8px;justify-content:flex-end;margin-top:16px">' +
      '<button id="ns-cancel" style="padding:9px 18px;border:1.5px solid #e5e7eb;border-radius:8px;background:#fff;font-size:13px;font-weight:700;cursor:pointer">キャンセル</button>' +
      '<button id="ns-save" style="padding:9px 18px;background:#1565C0;color:#fff;border:none;border-radius:8px;font-size:13px;font-weight:800;cursor:pointer">追加する</button>' +
      '</div></div>';

    document.body.appendChild(modal);
    modal.onclick = e => { if (e.target === modal) modal.remove(); };
    document.getElementById('ns-cancel').onclick = () => modal.remove();

    document.getElementById('ns-gen').onclick = () => {
      const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#';
      let pw = '';
      for (let i = 0; i < 10; i++) pw += chars[Math.floor(Math.random() * chars.length)];
      document.getElementById('ns-pass').value = pw;
    };

    document.getElementById('ns-save').onclick = async () => {
      const name  = document.getElementById('ns-name').value.trim();
      const email = document.getElementById('ns-email').value.trim();
      const role  = document.getElementById('ns-role').value;
      const pass  = document.getElementById('ns-pass').value;
      const errEl = document.getElementById('ns-err');
      errEl.style.display = 'none';

      if (!name || !email || !pass) { errEl.textContent = 'すべての項目を入力してください。'; errEl.style.display = ''; return; }
      if (pass.length < 8) { errEl.textContent = 'パスワードは8文字以上にしてください。'; errEl.style.display = ''; return; }

      const btn = document.getElementById('ns-save');
      btn.disabled = true; btn.textContent = '処理中...';
      try {
        const data = await callManageStudent({ action:'create-staff', display_name:name, email, role, password:pass });
        modal.remove();
        // Add to local profiles list so it shows immediately
        _profiles.push({ id:data.user_id, display_name:name, role, school:null, created_at:new Date().toISOString() });
        renderRoot();
      } catch(e) {
        errEl.textContent = 'エラー: ' + e.message;
        errEl.style.display = '';
        btn.disabled = false; btn.textContent = '追加する';
      }
    };
  }

  async function callManageStudent(body) {
    const EDGE_URL = 'https://rfntsrcguhldybddfgcl.supabase.co/functions/v1/manage-student';
    const session  = await window.hk.getSession();
    const token    = session && session.access_token;
    const res = await fetch(EDGE_URL, {
      method: 'POST',
      headers: { 'Content-Type':'application/json', 'Authorization':'Bearer ' + token },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Request failed');
    return data;
  }

  // ── Password management ──────────────────────────────────────────────────
  async function resetStudentPassword(student) {
    const newPass = prompt('「' + student.display_name + '」の新しいパスワードを入力してください（6文字以上）:', '');
    if (!newPass) return;
    if (newPass.length < 6) { alert('パスワードは6文字以上にしてください。'); return; }
    try {
      await callManageStudent({ action:'reset-password', user_id: student.id, new_password: newPass });
      alert('✅ 「' + student.display_name + '」のパスワードをリセットしました。');
    } catch(e) { alert('エラー: ' + e.message); }
  }

  function escHtml(s) {
    return String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }

  init();
})();
