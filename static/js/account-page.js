// account-page.js — student dashboard for hakuicity.github.io/site/account/
// Shows synced EikenApp stats, interview history, and profile settings.
'use strict';

(function waitForHk() {
  if (typeof window.hk === 'undefined') {
    setTimeout(waitForHk, 50);
    return;
  }
  const root = document.getElementById('hk-account-page');
  if (!root) return;

  const LEVEL_LABEL = { '5': '5級', '4': '4級', '3': '3級', 'P': '準2級' };
  const CAT_LABEL   = { ALL: 'すべて', VOCAB: '語い', GRAMMAR: '文法', CONVERSATION: '会話', ORDER: '語順' };
  const CAT_COLOR   = { ALL:'#37474F', VOCAB:'#2E7D32', GRAMMAR:'#1565C0', CONVERSATION:'#E65100', ORDER:'#6A1B9A' };

  // ── Styles ──────────────────────────────────────────────────────────────────
  const style = document.createElement('style');
  style.textContent = `
    .hk-dash { max-width: 760px; margin: 0 auto; padding: 8px 0 40px; }
    .hk-dash-header { display:flex; align-items:center; justify-content:space-between;
      flex-wrap:wrap; gap:12px; margin-bottom:24px; }
    .hk-dash-header h1 { font-size:22px; font-weight:800; }
    .hk-avatar { width:42px; height:42px; border-radius:50%; background:#1565C0;
      display:flex; align-items:center; justify-content:center;
      color:#fff; font-size:18px; font-weight:800; flex-shrink:0; }
    .hk-user-info { display:flex; align-items:center; gap:10px; }
    .hk-user-name { font-size:15px; font-weight:700; }
    .hk-user-email { font-size:12px; color:#6b7280; }
    .hk-btn-sm {
      padding:6px 14px; border-radius:7px; border:1.5px solid #d1d5db;
      background:transparent; font-size:13px; font-weight:600;
      cursor:pointer; transition:all .15s;
    }
    .hk-btn-sm:hover { border-color:#1565C0; color:#1565C0; }
    .hk-btn-danger { border-color:#fca5a5; color:#b91c1c; }
    .hk-btn-danger:hover { background:#fef2f2; }
    .hk-section { margin-bottom:28px; }
    .hk-section-title {
      font-size:14px; font-weight:700; color:#374151;
      text-transform:uppercase; letter-spacing:.5px;
      margin-bottom:12px; padding-bottom:8px;
      border-bottom:2px solid #e5e7eb;
    }
    .hk-stat-grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(140px,1fr)); gap:12px; }
    .hk-stat-card {
      background:#fff; border:1px solid #e5e7eb; border-radius:12px;
      padding:16px; text-align:center;
      box-shadow:0 1px 4px rgba(0,0,0,.05);
    }
    .hk-stat-num { font-size:28px; font-weight:800; }
    .hk-stat-lbl { font-size:12px; color:#6b7280; margin-top:2px; }
    .hk-level-tabs { display:flex; gap:6px; flex-wrap:wrap; margin-bottom:14px; }
    .hk-level-tab {
      padding:7px 16px; border-radius:8px; border:1.5px solid #d1d5db;
      background:#fff; cursor:pointer; font-size:13px; font-weight:700;
      color:#374151; transition:all .15s;
    }
    .hk-level-tab.active { background:#1565C0; border-color:#1565C0; color:#fff; }
    .hk-cat-table { width:100%; border-collapse:collapse; font-size:14px; }
    .hk-cat-table th { text-align:left; padding:8px 10px; font-size:12px; color:#6b7280;
      border-bottom:1px solid #e5e7eb; font-weight:600; }
    .hk-cat-table td { padding:10px; border-bottom:1px solid #f3f4f6; }
    .hk-cat-table tr:last-child td { border-bottom:none; }
    .hk-bar-wrap { background:#f3f4f6; border-radius:4px; height:8px; overflow:hidden; width:120px; }
    .hk-bar { height:100%; border-radius:4px; transition:width .4s; }
    .hk-badge { display:inline-block; font-size:11px; font-weight:700;
      padding:2px 9px; border-radius:5px; }
    .hk-history-table { width:100%; border-collapse:collapse; font-size:13px; }
    .hk-history-table th { text-align:left; padding:7px 10px; font-size:11px; color:#9ca3af;
      border-bottom:1px solid #e5e7eb; font-weight:600; text-transform:uppercase; }
    .hk-history-table td { padding:9px 10px; border-bottom:1px solid #f9fafb; }
    .hk-history-table tr:hover td { background:#f9fafb; }
    .hk-empty { text-align:center; color:#9ca3af; padding:32px; font-size:14px; }
    .hk-profile-form { display:grid; gap:12px; max-width:380px; }
    .hk-profile-fld label { display:block; font-size:12px; font-weight:700;
      color:#374151; margin-bottom:4px; }
    .hk-profile-fld input, .hk-profile-fld select {
      width:100%; padding:9px 12px; border-radius:8px; border:1.5px solid #d1d5db;
      font-size:14px; background:#f9fafb; outline:none; transition:border-color .15s;
      box-sizing:border-box;
    }
    .hk-profile-fld input:focus, .hk-profile-fld select:focus { border-color:#1565C0; }
    .hk-save-ok { color:#166534; font-size:13px; font-weight:600; display:none; }
    .dark .hk-stat-card,.dark .hk-page-card { background:#1e293b; border-color:#334155; }
    .dark .hk-cat-table th,.dark .hk-history-table th { color:#64748b; border-color:#334155; }
    .dark .hk-cat-table td,.dark .hk-history-table td { border-color:#1e293b; }
    .dark .hk-bar-wrap { background:#334155; }
    .dark .hk-level-tab { background:#1e293b; border-color:#475569; color:#f1f5f9; }
    .dark .hk-level-tab.active { background:#1565C0; border-color:#1565C0; }
    .dark .hk-profile-fld input,.dark .hk-profile-fld select { background:#0f172a; border-color:#475569; color:#f1f5f9; }
    .dark .hk-section-title { color:#94a3b8; border-color:#334155; }
    .dark .hk-user-email { color:#64748b; }
    .dark .hk-btn-sm { border-color:#475569; color:#94a3b8; }
  `;
  document.head.appendChild(style);

  // ── Init ────────────────────────────────────────────────────────────────────
  let _user = null, _profile = null;
  let _quizResults = [], _catStats = [], _ivScores = [];
  let _activeLevel = '5';

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
    'g5u1':'5年 Unit 1','g5u2':'5年 Unit 2','g5u3':'5年 Unit 3',
    'g5u4':'5年 Unit 4','g5u5':'5年 Unit 5','g5u6':'5年 Unit 6',
    'g5u7':'5年 Unit 7','g5u8':'5年 Unit 8',
    'g6u1':'6年 Unit 1','g6u2':'6年 Unit 2','g6u3':'6年 Unit 3',
    'g6u4':'6年 Unit 4','g6u5':'6年 Unit 5','g6u6':'6年 Unit 6',
    'g6u7':'6年 Unit 7','g6u8':'6年 Unit 8', all:'全Unit'
  };

  async function init() {
    root.innerHTML = '<p style="text-align:center;padding:40px;color:#6b7280">読み込み中...</p>';
    _user = await window.hk.getUser();
    if (!_user) {
      root.innerHTML = `
        <div style="text-align:center;padding:48px">
          <p style="font-size:16px;margin-bottom:16px">ダッシュボードを表示するにはログインが必要です。</p>
          <a href="/site/login/" style="display:inline-block;padding:11px 24px;background:#1565C0;
            color:#fff;border-radius:8px;font-weight:700;text-decoration:none">ログインする</a>
        </div>`;
      return;
    }
    [_profile, _quizResults, _catStats, _ivScores] = await Promise.all([
      window.hk.getProfile(_user.id),
      window.hk.fetchMyQuizResults(),
      window.hk.fetchMyCategoryStats(),
      window.hk.fetchMyInterviewScores()
    ]);
    render();
  }

  // ── Render ──────────────────────────────────────────────────────────────────
  function render() {
    const name    = (_profile && _profile.display_name) ? _profile.display_name : _user.email;
    const initial = name.charAt(0).toUpperCase();
    const totalSessions = [...new Set(_quizResults.map(r => r.created_at.slice(0,10)))].length;
    const totalQ        = _quizResults.filter(r => r.category === 'ALL').reduce((s,r) => s + r.total, 0);
    const totalCorrect  = _quizResults.filter(r => r.category === 'ALL').reduce((s,r) => s + r.correct, 0);
    const overallPct    = totalQ > 0 ? Math.round(totalCorrect / totalQ * 100) : 0;

    root.innerHTML = `
      <div class="hk-dash">
        <div class="hk-dash-header">
          <h1>マイページ</h1>
          <div class="hk-user-info">
            <div class="hk-avatar">${initial}</div>
            <div>
              <div class="hk-user-name">${escHtml(name)}</div>
              <div class="hk-user-email">${escHtml(_user.email)}</div>
            </div>
          </div>
        </div>

        <!-- Overview stats -->
        <div class="hk-section">
          <div class="hk-section-title">📊 成績の概要</div>
          <div class="hk-stat-grid">
            <div class="hk-stat-card">
              <div class="hk-stat-num" style="color:#1565C0">${_quizResults.filter(r=>r.category==='ALL').length}</div>
              <div class="hk-stat-lbl">セッション数</div>
            </div>
            <div class="hk-stat-card">
              <div class="hk-stat-num" style="color:#2E7D32">${totalQ}</div>
              <div class="hk-stat-lbl">回答数</div>
            </div>
            <div class="hk-stat-card">
              <div class="hk-stat-num" style="color:${overallPct >= 70 ? '#2E7D32' : overallPct >= 50 ? '#E65100' : '#B71C1C'}">${overallPct}%</div>
              <div class="hk-stat-lbl">正答率</div>
            </div>
            <div class="hk-stat-card">
              <div class="hk-stat-num" style="color:#6A1B9A">${_ivScores.length}</div>
              <div class="hk-stat-lbl">面接セッション</div>
            </div>
          </div>
        </div>

        <!-- Category breakdown by level -->
        <div class="hk-section">
          <div class="hk-section-title">📚 レベル別の成績</div>
          <div class="hk-level-tabs" id="hk-level-tabs">
            ${['5','4','3','P'].map(lv => `
              <button class="hk-level-tab${lv===_activeLevel?' active':''}" data-lv="${lv}">
                ${LEVEL_LABEL[lv]}
              </button>`).join('')}
          </div>
          <div id="hk-cat-breakdown"></div>
        </div>

        <!-- Recent quiz history -->
        <div class="hk-section">
          <div class="hk-section-title">📝 英検アプリ — 最近の履歴</div>
          <div id="hk-quiz-history"></div>
        </div>

        <!-- NH Vocab section -->
        <div class="hk-section">
          <div class="hk-section-title">📘 New Horizon — カテゴリー別成績</div>
          <div id="hk-nh-section"></div>
        </div>

        <!-- Interview history -->
        <div class="hk-section">
          <div class="hk-section-title">🎤 面接練習の履歴</div>
          <div id="hk-iv-history"></div>
        </div>

        <!-- Admin/teacher links -->
        ${(_profile && ['admin','teacher'].includes(_profile.role)) ? `
        <div class="hk-section">
          <div class="hk-section-title">🔐 管理者メニュー</div>
          <div style="display:flex;gap:10px;flex-wrap:wrap">
            ${['admin','teacher'].includes(_profile.role) ? `
            <a href="/site/admin/"
               style="display:inline-flex;align-items:center;gap:6px;padding:10px 18px;
                      background:#1565C0;color:#fff;border-radius:8px;font-weight:700;
                      font-size:14px;text-decoration:none;transition:background .15s"
               onmouseover="this.style.background='#0D47A1'"
               onmouseout="this.style.background='#1565C0'">
              📊 管理者ダッシュボード
            </a>
            <a href="/site/admin/enrollment/"
               style="display:inline-flex;align-items:center;gap:6px;padding:10px 18px;
                      background:#fff;color:#1565C0;border-radius:8px;font-weight:700;
                      font-size:14px;text-decoration:none;border:1.5px solid #1565C0;
                      transition:all .15s"
               onmouseover="this.style.background='#eff6ff'"
               onmouseout="this.style.background='#fff'">
              📋 生徒登録・管理
            </a>` : ''}
            <a href="/site/gradebook/"
               style="display:inline-flex;align-items:center;gap:6px;padding:10px 18px;
                      background:#fff;color:#2E7D32;border-radius:8px;font-weight:700;
                      font-size:14px;text-decoration:none;border:1.5px solid #2E7D32;
                      transition:all .15s"
               onmouseover="this.style.background='#f0fdf4'"
               onmouseout="this.style.background='#fff'">
              📒 成績管理（グレードブック）
            </a>
          </div>
        </div>` : ''}

        <!-- Profile settings (edit blocked for students) -->
        <div class="hk-section">
          <div class="hk-section-title">⚙️ プロフィール設定</div>
          ${(_profile && _profile.role === 'student') ? `
          <div style="font-size:13px;color:#6b7280;margin-bottom:12px">
            <strong>${escHtml(_profile.display_name||'')}</strong>
            &nbsp;•&nbsp; ${escHtml(_profile.class_name||'')}
            &nbsp;•&nbsp; ${escHtml(_profile.student_number||'')}
          </div>
          <button class="hk-btn-sm hk-btn-danger" id="hk-logout-dash">ログアウト</button>
          ` : `
          <div class="hk-profile-form" id="hk-profile-form">
            <div class="hk-profile-fld">
              <label>表示名</label>
              <input type="text" id="pf-name" value="${escHtml((_profile&&_profile.display_name)||'')}">
            </div>
            <div class="hk-profile-fld">
              <label>クラス名</label>
              <input type="text" id="pf-class" placeholder="例：3年1組"
                value="${escHtml((_profile&&_profile.class_name)||'')}">
            </div>
            <div class="hk-profile-fld">
              <label>学校名</label>
              <input type="text" id="pf-school" placeholder="例：羽咋中学校"
                value="${escHtml((_profile&&_profile.school)||'')}">
            </div>
            <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap">
              <button class="hk-btn-sm" id="hk-save-profile">保存する</button>
              <span class="hk-save-ok" id="hk-save-ok">✓ 保存しました</span>
              <button class="hk-btn-sm hk-btn-danger" id="hk-logout-dash">ログアウト</button>
            </div>
          </div>`}
        </div>
      </div>`;

    renderCatBreakdown();
    renderQuizHistory();
    renderIvHistory();
    renderNhSection();

    // Level tab clicks
    root.querySelectorAll('.hk-level-tab').forEach(btn => {
      btn.onclick = () => {
        _activeLevel = btn.dataset.lv;
        root.querySelectorAll('.hk-level-tab').forEach(b => b.classList.toggle('active', b.dataset.lv === _activeLevel));
        renderCatBreakdown();
      };
    });

    if (document.getElementById('hk-save-profile')) document.getElementById('hk-save-profile').onclick = saveProfile;
    document.getElementById('hk-logout-dash').onclick  = async () => {
      await window.hk.signOut();
      window.location.href = '/site/login/';
    };
  }

  function renderCatBreakdown() {
    const el = document.getElementById('hk-cat-breakdown');
    if (!el) return;
    const cats = ['VOCAB','GRAMMAR','CONVERSATION','ORDER'];
    const stats = _catStats.filter(s => s.level === _activeLevel);
    if (stats.length === 0) {
      el.innerHTML = '<p class="hk-empty">このレベルのデータはまだありません。</p>'; return;
    }
    const rows = cats.map(cat => {
      const s = stats.find(x => x.category === cat);
      if (!s || (s.right_count + s.wrong_count) === 0) return '';
      const tot = s.right_count + s.wrong_count;
      const pct = Math.round(s.right_count / tot * 100);
      const color = CAT_COLOR[cat];
      return `<tr>
        <td><span class="hk-badge" style="background:${color}22;color:${color}">${CAT_LABEL[cat]}</span></td>
        <td>${s.right_count} / ${tot}</td>
        <td>
          <div class="hk-bar-wrap">
            <div class="hk-bar" style="width:${pct}%;background:${color}"></div>
          </div>
        </td>
        <td style="font-weight:700;color:${pct>=70?'#166534':pct>=50?'#92400e':'#991b1b'}">${pct}%</td>
      </tr>`;
    }).join('');
    el.innerHTML = rows
      ? `<table class="hk-cat-table">
           <thead><tr><th>カテゴリー</th><th>正解 / 合計</th><th>進捗</th><th>正答率</th></tr></thead>
           <tbody>${rows}</tbody>
         </table>`
      : '<p class="hk-empty">このレベルのデータはまだありません。</p>';
  }

  function renderQuizHistory() {
    const el = document.getElementById('hk-quiz-history');
    if (!el) return;
    const recent = _quizResults.filter(r => r.category === 'ALL').slice(0, 20);
    if (recent.length === 0) { el.innerHTML = '<p class="hk-empty">クイズ履歴はまだありません。</p>'; return; }
    const rows = recent.map(r => {
      const d = new Date(r.created_at);
      const pct = r.score_pct;
      const color = pct >= 70 ? '#166534' : pct >= 50 ? '#92400e' : '#991b1b';
      return `<tr>
        <td>${d.toLocaleDateString('ja-JP')}</td>
        <td>${LEVEL_LABEL[r.level] || r.level}</td>
        <td>セット${r.set_id}</td>
        <td>${r.correct} / ${r.total}</td>
        <td style="font-weight:700;color:${color}">${pct}%</td>
      </tr>`;
    }).join('');
    el.innerHTML = `<table class="hk-history-table">
      <thead><tr><th>日付</th><th>レベル</th><th>セット</th><th>正解</th><th>正答率</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>`;
  }

  function renderIvHistory() {
    const el = document.getElementById('hk-iv-history');
    if (!el) return;
    const recent = _ivScores.slice(0, 20);
    if (recent.length === 0) { el.innerHTML = '<p class="hk-empty">面接練習の履歴はまだありません。</p>'; return; }
    const rows = recent.map(r => {
      const d = new Date(r.created_at);
      const color = r.avg_score >= 70 ? '#166534' : r.avg_score >= 50 ? '#92400e' : '#991b1b';
      return `<tr>
        <td>${d.toLocaleDateString('ja-JP')}</td>
        <td>${LEVEL_LABEL[r.level] || r.level}</td>
        <td>セッション ${r.session_id}</td>
        <td>${escHtml(r.topic)}</td>
        <td style="font-weight:700;color:${color}">${r.avg_score}%</td>
      </tr>`;
    }).join('');
    el.innerHTML = `<table class="hk-history-table">
      <thead><tr><th>日付</th><th>レベル</th><th>セッション</th><th>トピック</th><th>平均スコア</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>`;
  }

  function renderNhSection() {
    var el = document.getElementById('hk-nh-section');
    if (!el) return;
    var nhResults = _quizResults.filter(function(r) { return r.app_id === 'newhorizon'; });
    if (nhResults.length === 0) {
      el.innerHTML = '<p style="color:#9ca3af;font-size:13px">まだ記録がありません。</p>';
      return;
    }
    var groups = {};
    nhResults.forEach(function(r) {
      var key = r.level || 'other';
      if (!groups[key]) groups[key] = { correct:0, total:0, sessions:0 };
      groups[key].correct  += r.correct  || 0;
      groups[key].total    += r.total    || 0;
      groups[key].sessions += 1;
    });
    var rows = Object.entries(groups).sort(function(a,b){ return b[1].sessions - a[1].sessions; });
    var tbody = rows.map(function(entry) {
      var key = entry[0]; var s = entry[1];
      var pct = s.total > 0 ? Math.round(s.correct / s.total * 100) : 0;
      var label = NH_CAT_NAMES[key] || key;
      var color = pct>=80 ? '#166534' : pct>=60 ? '#d97706' : '#dc2626';
      return '<tr>' +
        '<td style="padding:9px 10px;border-bottom:1px solid #f3f4f6;font-weight:700">' + escHtml(label) + '</td>' +
        '<td style="padding:9px 10px;border-bottom:1px solid #f3f4f6;text-align:center;color:#6b7280">' + s.sessions + '</td>' +
        '<td style="padding:9px 10px;border-bottom:1px solid #f3f4f6;text-align:center;font-weight:800;color:' + color + '">' + pct + '%</td>' +
        '<td style="padding:9px 10px;border-bottom:1px solid #f3f4f6">' +
          '<div style="background:#f3f4f6;border-radius:4px;height:8px;overflow:hidden">' +
          '<div style="height:100%;width:' + pct + '%;background:' + color + ';border-radius:4px"></div></div>' +
        '</td>' +
        '</tr>';
    }).join('');
    el.innerHTML =
      '<div style="overflow-x:auto">' +
        '<table class="hk-cat-table" style="width:100%;border-collapse:collapse;font-size:13px">' +
          '<thead><tr>' +
            '<th style="text-align:left;padding:7px 10px;font-size:11px;color:#9ca3af;border-bottom:1.5px solid #e5e7eb;font-weight:700">カテゴリー</th>' +
            '<th style="padding:7px 10px;font-size:11px;color:#9ca3af;border-bottom:1.5px solid #e5e7eb;font-weight:700;text-align:center">回数</th>' +
            '<th style="padding:7px 10px;font-size:11px;color:#9ca3af;border-bottom:1.5px solid #e5e7eb;font-weight:700;text-align:center">正答率</th>' +
            '<th style="padding:7px 10px;font-size:11px;color:#9ca3af;border-bottom:1.5px solid #e5e7eb;font-weight:700;min-width:100px">スコア</th>' +
          '</tr></thead>' +
          '<tbody>' + tbody + '</tbody>' +
        '</table>' +
      '</div>';
  }

    async function saveProfile() {
    const btn = document.getElementById('hk-save-profile');
    btn.disabled = true; btn.textContent = '保存中...';
    try {
      await window.hk.updateProfile(_user.id, {
        display_name: document.getElementById('pf-name').value.trim(),
        class_name:   document.getElementById('pf-class').value.trim(),
        school:       document.getElementById('pf-school').value.trim()
      });
      const ok = document.getElementById('hk-save-ok');
      ok.style.display = 'inline';
      setTimeout(() => { ok.style.display = 'none'; }, 2500);
    } catch (e) {
      alert('保存に失敗しました：' + e.message);
    } finally {
      btn.disabled = false; btn.textContent = '保存する';
    }
  }

  function escHtml(s) {
    return String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }

  init();
})();
