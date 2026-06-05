// auth-page.js — login / signup page for hakuicity.github.io/site/login/
// Renders into #hk-login-page. Redirects to /account/ on success.
'use strict';

(function waitForHk() {
  if (typeof window.hk === 'undefined') {
    setTimeout(waitForHk, 50);
    return;
  }
  const root = document.getElementById('hk-login-page');
  if (!root) return;

  // Redirect if already logged in
  window.hk.getUser().then(user => {
    if (user) window.location.href = '/site/account/';
  });

  root.innerHTML = `
    <style>
      .hk-page-card {
        max-width: 420px; margin: 32px auto; background: #fff;
        border-radius: 16px; padding: 36px 32px;
        box-shadow: 0 4px 24px rgba(0,0,0,.09);
        border: 1px solid #e5e7eb;
      }
      @media (prefers-color-scheme: dark) {
        .hk-page-card { background: #1e293b; border-color: #334155; }
        .hk-page-card h1 { color: #f1f5f9; }
        .hk-lbl { color: #94a3b8 !important; }
        .hk-inp { background: #0f172a !important; color: #f1f5f9 !important; border-color: #475569 !important; }
        .hk-sub { color: #94a3b8 !important; }
      }
      .hk-page-card h1 { font-size: 24px; font-weight: 800; margin-bottom: 4px; color: #111827; }
      .hk-sub { font-size: 14px; color: #6b7280; margin-bottom: 24px; }
      .hk-fld { margin-bottom: 14px; }
      .hk-lbl { display: block; font-size: 12px; font-weight: 700; color: #374151; margin-bottom: 5px; }
      .hk-inp {
        width: 100%; padding: 10px 13px; border-radius: 8px;
        border: 1.5px solid #d1d5db; font-size: 14px; outline: none;
        transition: border-color .15s; background: #f9fafb;
        box-sizing: border-box;
      }
      .hk-inp:focus { border-color: #1565C0; }
      .hk-btn-primary {
        width: 100%; padding: 12px; border-radius: 8px; border: none;
        background: #1565C0; color: #fff; font-size: 15px; font-weight: 700;
        cursor: pointer; margin-top: 6px; transition: background .15s;
      }
      .hk-btn-primary:hover { background: #0D47A1; }
      .hk-btn-primary:disabled { background: #93c5fd; cursor: default; }
      .hk-toggle { text-align: center; margin-top: 16px; font-size: 13px; color: #6b7280; }
      .hk-toggle button {
        background: none; border: none; color: #1565C0; font-weight: 700;
        cursor: pointer; font-size: 13px; padding: 0;
      }
      .hk-err { background: #fef2f2; border: 1px solid #fca5a5; border-radius: 8px;
        padding: 10px 13px; font-size: 13px; color: #b91c1c; margin-bottom: 12px; display:none; }
      .hk-ok  { background: #f0fdf4; border: 1px solid #86efac; border-radius: 8px;
        padding: 10px 13px; font-size: 13px; color: #166534; margin-bottom: 12px; display:none; }
      .hk-divider { display:flex; align-items:center; gap:10px; margin: 16px 0; color:#9ca3af; font-size:12px; }
      .hk-divider::before, .hk-divider::after { content:''; flex:1; border-top:1px solid #e5e7eb; }
      .hk-forgot { background:none; border:none; color:#6b7280; font-size:12px;
        cursor:pointer; padding:0; margin-top:6px; display:block; text-align:right; width:100%; }
      .hk-forgot:hover { color:#1565C0; }
    </style>

    <div class="hk-page-card">
      <h1 id="ap-title">ログイン</h1>
      <p class="hk-sub" id="ap-sub">羽咋市英語教育ポータル</p>
      <div class="hk-err" id="ap-err"></div>
      <div class="hk-ok"  id="ap-ok"></div>

      <!-- Login form -->
      <div id="ap-login">
        <div class="hk-fld">
          <label class="hk-lbl">メールアドレス</label>
          <input class="hk-inp" type="email" id="ap-lemail" placeholder="example@school.ed.jp" autocomplete="email">
        </div>
        <div class="hk-fld">
          <label class="hk-lbl">パスワード</label>
          <input class="hk-inp" type="password" id="ap-lpass" placeholder="••••••••" autocomplete="current-password">
        </div>
        <button class="hk-forgot" id="ap-forgot">パスワードをお忘れの場合</button>
        <button class="hk-btn-primary" id="ap-login-btn">ログイン</button>
        <div class="hk-toggle">
          アカウントをお持ちでない方は
          <button id="ap-to-signup">新規登録</button>
        </div>
      </div>

      <!-- Signup form -->
      <div id="ap-signup" style="display:none">
        <div class="hk-fld">
          <label class="hk-lbl">お名前（表示名）</label>
          <input class="hk-inp" type="text" id="ap-sname" placeholder="例：山田 太郎">
        </div>
        <div class="hk-fld">
          <label class="hk-lbl">メールアドレス</label>
          <input class="hk-inp" type="email" id="ap-semail" placeholder="example@school.ed.jp" autocomplete="email">
        </div>
        <div class="hk-fld">
          <label class="hk-lbl">パスワード（8文字以上）</label>
          <input class="hk-inp" type="password" id="ap-spass" placeholder="••••••••" autocomplete="new-password">
        </div>
        <button class="hk-btn-primary" id="ap-signup-btn">アカウントを作成</button>
        <div class="hk-toggle">
          すでにアカウントをお持ちの方は
          <button id="ap-to-login">ログイン</button>
        </div>
      </div>
    </div>
  `;

  // ── Helpers ────────────────────────────────────────────────────────────────
  const $ = id => document.getElementById(id);
  const err = msg => { $('ap-err').textContent = msg; $('ap-err').style.display = 'block'; $('ap-ok').style.display = 'none'; };
  const ok  = msg => { $('ap-ok').textContent  = msg; $('ap-ok').style.display  = 'block'; $('ap-err').style.display = 'none'; };
  const clearMsg = () => { $('ap-err').style.display = 'none'; $('ap-ok').style.display = 'none'; };

  function showForm(form) {
    clearMsg();
    $('ap-login').style.display  = form === 'login'  ? '' : 'none';
    $('ap-signup').style.display = form === 'signup' ? '' : 'none';
    $('ap-title').textContent = form === 'login' ? 'ログイン' : '新規登録';
    $('ap-sub').textContent   = form === 'login' ? '羽咋市英語教育ポータル' : '無料アカウントを作成します';
  }

  function setLoading(btnId, loading, labels) {
    const btn = $(btnId);
    btn.disabled = loading;
    btn.textContent = loading ? '処理中...' : labels[0];
  }

  // ── Actions ────────────────────────────────────────────────────────────────
  async function doLogin() {
    const email = $('ap-lemail').value.trim();
    const pass  = $('ap-lpass').value;
    if (!email || !pass) { err('メールアドレスとパスワードを入力してください。'); return; }
    setLoading('ap-login-btn', true, ['ログイン']);
    clearMsg();
    try {
      await window.hk.signIn(email, pass);
      window.location.href = '/site/account/';
    } catch (e) {
      err('ログインに失敗しました：' + (e.message || '入力内容をご確認ください。'));
    } finally {
      setLoading('ap-login-btn', false, ['ログイン']);
    }
  }

  async function doSignup() {
    const name  = $('ap-sname').value.trim();
    const email = $('ap-semail').value.trim();
    const pass  = $('ap-spass').value;
    if (!email || !pass) { err('すべての項目を入力してください。'); return; }
    if (pass.length < 8)  { err('パスワードは8文字以上で設定してください。'); return; }
    setLoading('ap-signup-btn', true, ['アカウントを作成']);
    clearMsg();
    try {
      await window.hk.signUp(email, pass, name);
      ok('登録が完了しました！確認メールをご確認の上、ログインしてください。');
      setTimeout(() => showForm('login'), 3500);
    } catch (e) {
      err('登録に失敗しました：' + (e.message || '入力内容をご確認ください。'));
    } finally {
      setLoading('ap-signup-btn', false, ['アカウントを作成']);
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

  // ── Event wiring ───────────────────────────────────────────────────────────
  $('ap-login-btn').onclick  = doLogin;
  $('ap-signup-btn').onclick = doSignup;
  $('ap-to-signup').onclick  = () => showForm('signup');
  $('ap-to-login').onclick   = () => showForm('login');
  $('ap-forgot').onclick     = doForgot;
  $('ap-lpass').addEventListener('keydown',  e => { if (e.key === 'Enter') doLogin(); });
  $('ap-spass').addEventListener('keydown',  e => { if (e.key === 'Enter') doSignup(); });
})();
