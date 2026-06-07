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

  function renderStudentDetail() {
    const el = document.getElementById('adm-student-detail');
    if (!el) return;
    if (!_selectedStudent) { el.innerHTML = ''; return; }
    const p = _selectedStudent;
    const quiz = _allQuiz.filter(r => r.user_id === p.id && r.category === 'ALL');
    const catStats = _allQuiz.filter(r => r.user_id === p.id && r.category !== 'ALL');
    const iv = _allIv.filter(r => r.user_id === p.id);

    const levelRows = ['5','4','3','P'].map(lv => {
      const lvQuiz = quiz.filter(r => r.level === lv);
      if (!lvQuiz.length) return '';
      const totalQ = lvQuiz.reduce((s,r) => s+r.total, 0);
      const totalC = lvQuiz.reduce((s,r) => s+r.correct, 0);
      const pct = Math.round(totalC/totalQ*100);
      const color = pct>=70?'#166534':pct>=50?'#92400e':'#991b1b';
      return `<tr>
        <td>${LEVEL_LABEL[lv]}</td>
        <td>${lvQuiz.length}回</td>
        <td style="font-weight:700;color:${color}">${pct}%</td>
      </tr>`;
    }).join('');

    const catRows = Object.entries(CAT_COLOR).map(([cat,color]) => {
      const cs = catStats.filter(r => r.category === cat && r.level);
      if (!cs.length) return '';
      const totalQ = cs.reduce((s,r) => s+r.total, 0);
      const totalC = cs.reduce((s,r) => s+r.correct, 0);
      const pct = Math.round(totalC/totalQ*100);
      return `<tr>
        <td><span style="font-weight:700;color:${color}">${CAT_LABEL[cat]}</span></td>
        <td style="font-weight:700">${pct}%</td>
      </tr>`;
    }).join('');

    const ivRows = iv.slice(0,8).map(r => {
      const color = r.avg_score>=70?'#166534':r.avg_score>=50?'#92400e':'#991b1b';
      return `<tr>
        <td>${LEVEL_LABEL[r.level]||r.level}</td>
        <td>${escHtml(r.topic)}</td>
        <td style="font-weight:700;color:${color}">${r.avg_score}%</td>
      </tr>`;
    }).join('');

    const totalQ = quiz.reduce((s,r) => s+r.total, 0);
    const totalC = quiz.reduce((s,r) => s+r.correct, 0);

    el.innerHTML = `
      <div class="adm-detail">
        <button class="adm-close-detail" id="adm-close-detail">×</button>
        <h3>${escHtml(p.display_name||'—')}</h3>
        <p class="adm-detail-sub">${escHtml(p.class_name||'')} ${escHtml(p.school||'')} · 登録日：${new Date(p.created_at).toLocaleDateString('ja-JP')}</p>
        <div style="display:flex;gap:24px;margin-bottom:16px;flex-wrap:wrap">
          <div><strong style="font-size:20px;color:#1565C0">${quiz.length}</strong><span style="color:#6b7280;font-size:12px"> セッション</span></div>
          <div><strong style="font-size:20px;color:#2E7D32">${totalQ}</strong><span style="color:#6b7280;font-size:12px"> 回答</span></div>
          <div><strong style="font-size:20px;color:#E65100">${totalQ>0?Math.round(totalC/totalQ*100):0}%</strong><span style="color:#6b7280;font-size:12px"> 全体正答率</span></div>
        </div>
        <div class="adm-detail-grid">
          <div class="adm-detail-col">
            <h4>レベル別</h4>
            ${levelRows ? `<table class="adm-mini-table"><thead><tr><th>レベル</th><th>回数</th><th>正答率</th></tr></thead><tbody>${levelRows}</tbody></table>` : '<p style="color:#9ca3af;font-size:12px">データなし</p>'}
          </div>
          <div class="adm-detail-col">
            <h4>カテゴリー別</h4>
            ${catRows ? `<table class="adm-mini-table"><thead><tr><th>カテゴリー</th><th>正答率</th></tr></thead><tbody>${catRows}</tbody></table>` : '<p style="color:#9ca3af;font-size:12px">データなし</p>'}
          </div>
          <div class="adm-detail-col">
            <h4>面接練習</h4>
            ${ivRows ? `<table class="adm-mini-table"><thead><tr><th>レベル</th><th>トピック</th><th>スコア</th></tr></thead><tbody>${ivRows}</tbody></table>` : '<p style="color:#9ca3af;font-size:12px">データなし</p>'}
          </div>
        </div>
      </div>`;

    document.getElementById('adm-close-detail').onclick = () => {
      _selectedStudent = null;
      renderStudentTable();
    };
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
    const rows = _profiles.map(p => {
      const roleClass = `adm-role-${p.role}`;
      const roleLabel = p.role === 'admin' ? '管理者' : p.role === 'teacher' ? '教員' : '生徒';
      return `<tr>
        <td>${escHtml(p.display_name||'—')}</td>
        <td>${escHtml(p.class_name||'—')}</td>
        <td>${escHtml(p.school||'—')}</td>
        <td><span class="adm-role-badge ${roleClass}">${roleLabel}</span></td>
        <td>${new Date(p.created_at).toLocaleDateString('ja-JP')}</td>
      </tr>`;
    }).join('');

    el.innerHTML = `
      <div class="adm-section">
        <div class="adm-section-title">全ユーザー一覧</div>
        <p style="font-size:13px;color:#6b7280;margin-bottom:12px">
          ロール変更はSupabase管理画面の <code>profiles</code> テーブルから行ってください。
        </p>
        <table class="adm-table">
          <thead><tr><th>名前</th><th>クラス</th><th>学校</th><th>ロール</th><th>登録日</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>`;
  }

  function escHtml(s) {
    return String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }

  init();
})();
