// auth-page.js — login page for hakuicity.github.io/site/login/
// Signup is admin-only via Supabase dashboard. This page is login-only.
'use strict';

(function waitForHk() {
  if (typeof window.hk === 'undefined') { setTimeout(waitForHk, 50); return; }

  const root = document.getElementById('hk-login-page');
  if (!root) return;

  // Redirect if already logged in
  window.hk.getUser().then(user => {
    if (user) window.location.href = '/site/account/';
  });

  root.innerHTML = `
    <style>
      .hk-page-card {
        max-width: 400px; margin: 48px auto; background: #fff;
        border-radius: 16px; padding: 36px 32px;
        box-shadow: 0 4px 24px rgba(0,0,0,.09); border: 1px solid #e5e7eb;
      }
      @media (prefers-color-scheme: dark) {
        .hk-page-card { background: #1e293b; border-color: #334155; }
        .hk-page-card h1 { color: #f1f5f9; }
        .hk-lbl { color: #94a3b8 !important; }
        .hk-inp { background: #0f172a !important; color: #f1f5f9 !important; border-color: #475569 !important; }
        .hk-sub { color: #94a3b8 !important; }
      }
      .hk-page-card h1 { font-size: 22px; font-weight: 800; margin-bottom: 4px; color: #111827; }
      .hk-sub  { font-size: 13px; color: #6b7280; margin-bottom: 24px; }
      .hk-fld  { margin-bottom: 14px; }
      .hk-lbl  { display:block; font-size:12px; font-weight:700; color:#374151; margin-bottom:5px; }
      .hk-inp  {
        width:100%; padding:10px 13px; border-radius:8px;
        border:1.5px solid #d1d5db; font-size:14px; outline:none;
        transition:border-color .15s; background:#f9fafb; box-sizing:border-box;
      }
      .hk-inp:focus { border-color:#1565C0; }
      .hk-btn-primary {
        width:100%; padding:12px; border-radius:8px; border:none;
        background:#1565C0; color:#fff; font-size:15px; font-weight:700;
        cursor:pointer; margin-top:6px; transition:background .15s;
      }
      .hk-btn-primary:hover { background:#0D47A1; }
      .hk-btn-primary:disabled { background:#93c5fd; cursor:default; }
      .hk-err { background:#fef2f2; border:1px solid #fca5a5; border-radius:8px;
        padding:10px 13px; font-size:13px; color:#b91c1c; margin-bottom:12px; display:none; }
      .hk-ok  { background:#f0fdf4; border:1px solid #86efac; border-radius:8px;
        padding:10px 13px; font-size:13px; color:#166534; margin-bottom:12px; display:none; }
      .hk-tabs { display:flex; gap:0; border:1.5px solid #d1d5db; border-radius:8px;
        overflow:hidden; margin-bottom:18px; }
      .hk-tab { flex:1; padding:8px; border:none; font-size:12px; font-weight:700;
        cursor:pointer; font-family:inherit; transition:all .15s; }
      .hk-tab-active   { background:#1565C0; color:#fff; }
      .hk-tab-inactive { background:#fff; color:#374151; }
      .hk-forgot { background:none; border:none; color:#9ca3af; font-size:12px;
        cursor:pointer; padding:0; margin-top:4px; display:block;
        text-align:right; width:100%; }
      .hk-forgot:hover { color:#1565C0; }
    </style>

    <div class="hk-page-card">
      <h1>ログイン</h1>
      <p class="hk-sub">羽咋市英語教育ポータル</p>
      <div class="hk-err" id="ap-err"></div>
      <div class="hk-ok"  id="ap-ok"></div>

      <!-- Login type tabs -->
      <div class="hk-tabs">
        <button class="hk-tab hk-tab-active"   id="ap-tab-email" onclick="apTab('email')">📧 メール</button>
        <button class="hk-tab hk-tab-inactive" id="ap-tab-sid"   onclick="apTab('sid')">🎓 学籍番号</button>
      </div>

      <!-- Email login -->
      <div id="ap-email-fields">
        <div class="hk-fld">
          <label class="hk-lbl">メールアドレス</label>
          <input class="hk-inp" type="email" id="ap-lemail"
            placeholder="example@school.ed.jp" autocomplete="email">
        </div>
        <div class="hk-fld">
          <label class="hk-lbl">パスワード</label>
          <input class="hk-inp" type="password" id="ap-lpass"
            placeholder="••••••••" autocomplete="current-password">
        </div>
        <button class="hk-forgot" id="ap-forgot">パスワードをお忘れの場合</button>
      </div>

      <!-- Student ID login -->
      <div id="ap-sid-fields" style="display:none">
        <div class="hk-fld">
          <label class="hk-lbl">学籍番号</label>
          <input class="hk-inp" type="text" id="ap-lsid"
            placeholder="例：S001" autocomplete="username">
        </div>
        <div class="hk-fld">
          <label class="hk-lbl">パスワード</label>
          <input class="hk-inp" type="password" id="ap-lsidpass"
            placeholder="••••••••" autocomplete="current-password">
        </div>
      </div>

      <button class="hk-btn-primary" id="ap-login-btn">ログイン</button>
    </div>
  `;

  const $ = id => document.getElementById(id);
  const err = msg => { $('ap-err').textContent = msg; $('ap-err').style.display = 'block'; $('ap-ok').style.display = 'none'; };
  const ok  = msg => { $('ap-ok').textContent  = msg; $('ap-ok').style.display  = 'block'; $('ap-err').style.display = 'none'; };
  const clearMsg = () => { $('ap-err').style.display = 'none'; $('ap-ok').style.display = 'none'; };

  let _tab = 'email';
  window.apTab = function(tab) {
    _tab = tab;
    $('ap-tab-email').className = 'hk-tab ' + (tab==='email' ? 'hk-tab-active' : 'hk-tab-inactive');
    $('ap-tab-sid').className   = 'hk-tab ' + (tab==='sid'   ? 'hk-tab-active' : 'hk-tab-inactive');
    $('ap-email-fields').style.display = tab === 'email' ? '' : 'none';
    $('ap-sid-fields').style.display   = tab === 'sid'   ? '' : 'none';
    clearMsg();
  };

  async function doLogin() {
    clearMsg();
    const btn = $('ap-login-btn');
    btn.disabled = true; btn.textContent = '処理中...';
    try {
      if (_tab === 'sid') {
        const sid  = $('ap-lsid').value.trim();
        const pass = $('ap-lsidpass').value;
        if (!sid || !pass) { err('学籍番号とパスワードを入力してください。'); return; }
        await window.hk.signInWithStudentId(sid, pass);
      } else {
        const email = $('ap-lemail').value.trim();
        const pass  = $('ap-lpass').value;
        if (!email || !pass) { err('メールアドレスとパスワードを入力してください。'); return; }
        await window.hk.signIn(email, pass);
      }
      window.location.href = '/site/account/';
    } catch (e) {
      err('ログインに失敗しました：' + (e.message || '入力内容をご確認ください。'));
    } finally {
      btn.disabled = false; btn.textContent = 'ログイン';
    }
  }

  async function doForgot() {
    const email = $('ap-lemail').value.trim();
    if (!email) { err('メールアドレスを入力してください。'); return; }
    try {
      await window.hk.resetPassword(email);
      ok('パスワードリセットメールを送信しました。');
    } catch (e) {
      err('送信に失敗しました：' + (e.message || ''));
    }
  }

  $('ap-login-btn').onclick = doLogin;
  $('ap-forgot').onclick    = doForgot;
  $('ap-lpass').addEventListener('keydown',    e => { if (e.key === 'Enter') doLogin(); });
  $('ap-lsidpass').addEventListener('keydown', e => { if (e.key === 'Enter') doLogin(); });
})();
