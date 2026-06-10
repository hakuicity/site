// portal-page.js — auth-gated tool portal for hakuicity.github.io/site/portal/
// Redirects to login if not signed in; shows tool cards when authenticated.
'use strict';

(function waitForHk() {
  if (typeof window.hk === 'undefined') { setTimeout(waitForHk, 50); return; }

  const root = document.getElementById('hk-portal-page');
  if (!root) return;

  const LOGIN_URL = '/site/login/?next=/site/portal/';

  // ── Styles ────────────────────────────────────────────────────────────────
  const style = document.createElement('style');
  style.textContent = `
    .portal-wrap { max-width: 860px; margin: 0 auto; padding: 24px 16px 64px; }
    .portal-greeting { margin-bottom: 28px; }
    .portal-greeting h1 { font-size: 24px; font-weight: 900; margin-bottom: 4px; }
    .portal-greeting p  { font-size: 14px; color: #6b7280; }
    .portal-section-title {
      font-size: 11px; font-weight: 800; text-transform: uppercase;
      letter-spacing: .6px; color: #9ca3af; margin-bottom: 12px;
    }
    .portal-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
      gap: 14px; margin-bottom: 32px;
    }
    .portal-card {
      display: flex; flex-direction: column;
      background: #fff; border: 1.5px solid #e5e7eb;
      border-radius: 14px; padding: 20px 18px;
      text-decoration: none; color: inherit;
      box-shadow: 0 2px 8px rgba(0,0,0,.06);
      transition: all .18s; position: relative; overflow: hidden;
    }
    .portal-card::before {
      content: ''; position: absolute; top: 0; left: 0; right: 0; height: 4px;
    }
    .portal-card:hover { transform: translateY(-3px); box-shadow: 0 8px 20px rgba(0,0,0,.1); border-color: #d1d5db; }
    .portal-card-icon  { font-size: 36px; margin-bottom: 10px; }
    .portal-card-title { font-size: 16px; font-weight: 800; margin-bottom: 4px; }
    .portal-card-desc  { font-size: 12px; color: #6b7280; font-weight: 600; line-height: 1.5; }
    .portal-card-badge {
      display: inline-block; font-size: 10px; font-weight: 700;
      padding: 2px 8px; border-radius: 4px; margin-top: 10px;
      background: #eff6ff; color: #1d4ed8;
    }
    .portal-card--eiken::before  { background: #2563eb; }
    .portal-card--nh::before     { background: #16a34a; }
    .portal-card--account::before{ background: #7c3aed; }
    .portal-card--gradebook::before{ background: #2E7D32; }
    .portal-card--admin::before  { background: #dc2626; }
    .portal-logout-row {
      display: flex; align-items: center; justify-content: space-between;
      flex-wrap: wrap; gap: 12px;
      padding: 14px 16px; border-radius: 10px;
      background: #f9fafb; border: 1.5px solid #e5e7eb;
      font-size: 13px; color: #6b7280;
    }
    .portal-logout-btn {
      padding: 7px 16px; border-radius: 7px; border: 1.5px solid #e5e7eb;
      background: #fff; color: #374151; font-size: 13px; font-weight: 700;
      cursor: pointer; transition: all .15s;
    }
    .portal-logout-btn:hover { border-color: #dc2626; color: #dc2626; }

    .dark .portal-card       { background: #1e293b; border-color: #334155; }
    .dark .portal-card:hover { border-color: #475569; }
    .dark .portal-card-desc  { color: #94a3b8; }
    .dark .portal-card-badge { background: #1e3a5f; color: #93c5fd; }
    .dark .portal-logout-row { background: #1e293b; border-color: #334155; }
    .dark .portal-logout-btn { background: #1e293b; border-color: #334155; color: #94a3b8; }
    .portal-card--lentrance::before { background: #f59e0b; }
    .portal-card--letstry::before   { background: #16a34a; }
    .dark .portal-greeting p { color: #94a3b8; }
  `;
  document.head.appendChild(style);

  // ── Auth check ────────────────────────────────────────────────────────────
  async function init() {
    root.innerHTML = '<p style="text-align:center;padding:48px;color:#9ca3af">読み込み中...</p>';

    const user = await window.hk.getUser();
    if (!user) {
      // Not logged in — redirect to login with return URL
      window.location.href = LOGIN_URL;
      return;
    }

    const profile = await window.hk.getProfile(user.id);
    render(user, profile);
  }

  // ── Render portal ─────────────────────────────────────────────────────────
  function render(user, profile) {
    const name    = (profile && profile.display_name) ? profile.display_name : user.email;
    const isAdmin    = profile && ['admin', 'teacher'].includes(profile.role);
    

    // Get the school year from class_name e.g. "5年生" → "5年生"
    const grade = (profile && profile.class_name) ? profile.class_name : '';

    root.innerHTML = `
      <div class="portal-wrap">
        <div class="portal-greeting">
          <h1>こんにちは、${esc(name.split(' ')[0])}さん 👋</h1>
          <p>${esc(grade)} &nbsp;·&nbsp; 羽咋市立瑞穂小学校</p>
        </div>

        <div class="portal-section-title">アプリ・ツール</div>
        <div class="portal-grid">

          <a class="portal-card portal-card--eiken"
             href="https://hakuicity.github.io/EikenApp/" target="_blank" rel="noopener">
            <div class="portal-card-icon">🎓</div>
            <div class="portal-card-title">英検アプリ</div>
            <div class="portal-card-desc">英検の単語・面接練習。レベル5〜3に対応。</div>
            <span class="portal-card-badge">EikenApp</span>
          </a>

          <a class="portal-card portal-card--nh"
             href="https://hakuicity.github.io/TangoApp/" target="_blank" rel="noopener">
            <div class="portal-card-icon">📘</div>
            <div class="portal-card-title">NH ボキャブラリー</div>
            <div class="portal-card-desc">New Horizon 絵辞典の単語練習。カテゴリー・Unit別に練習できる。</div>
            <span class="portal-card-badge">New Horizon</span>
          </a>

          <a class="portal-card portal-card--account" href="/site/account/">
            <div class="portal-card-icon">📊</div>
            <div class="portal-card-title">マイページ</div>
            <div class="portal-card-desc">自分の成績・練習記録を確認する。</div>
            <span class="portal-card-badge">成績確認</span>
          </a>

          <a class="portal-card portal-card--lentrance"
             href="https://lentrance.com/login/lentrance" target="_blank" rel="noopener">
            <div class="portal-card-icon">🔑</div>
            <div class="portal-card-title">lentrance</div>
            <div class="portal-card-desc">デジタル教科書・学習コンテンツのログインページ。</div>
            <span class="portal-card-badge" style="background:#fef9c3;color:#a16207">lentrance</span>
          </a>

          <a class="portal-card portal-card--letstry"
             href="https://hakuicity.github.io/LetsTry2Utility/" target="_blank" rel="noopener">
            <div class="portal-card-icon">🛠️</div>
            <div class="portal-card-title">LetsTry2 Utility</div>
            <div class="portal-card-desc">LetsTry2 関連のユーティリティツール。</div>
            <span class="portal-card-badge" style="background:#f0fdf4;color:#166534">ユーティリティ</span>
          </a>

          ${isAdmin ? `
          <a class="portal-card portal-card--gradebook" href="/site/gradebook/">
            <div class="portal-card-icon">📒</div>
            <div class="portal-card-title">グレードブック</div>
            <div class="portal-card-desc">課題の作成・提出状況・クラス成績の確認。</div>
            <span class="portal-card-badge" style="background:#f0fdf4;color:#166534">教師・管理者</span>
          </a>` : ''}

          ${isAdmin ? `
          <a class="portal-card portal-card--admin" href="/site/admin/">
            <div class="portal-card-icon">🔐</div>
            <div class="portal-card-title">管理者ダッシュボード</div>
            <div class="portal-card-desc">生徒の成績確認・クラス管理・名簿登録。</div>
            <span class="portal-card-badge" style="background:#fef2f2;color:#dc2626">管理者のみ</span>
          </a>` : ''}

        </div>

        <div class="portal-logout-row">
          <span>ログイン中: <strong>${esc(name)}</strong> &nbsp;(${esc(user.email)})</span>
          <button class="portal-logout-btn" id="portal-logout">ログアウト</button>
        </div>
      </div>`;

    document.getElementById('portal-logout').onclick = async () => {
      await window.hk.signOut();
      window.location.href = LOGIN_URL;
    };
  }

  function esc(s) {
    return String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }

  init();
})();
