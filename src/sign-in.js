import { signInWithEmailAndPassword, onAuthStateChanged } from 'firebase/auth';

import { auth } from './firebase.js';

// HTMLの部品を取得
const signInForm = document.getElementById('sign-in-form');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const messageElement = document.getElementById('message');

// すでにログインしている場合はTODO画面へ移動
onAuthStateChanged(auth, (user) => {
  if (user) {
    location.href = './todo.html';
  }
});

// サインインボタンが押されたとき
signInForm.addEventListener('submit', async (event) => {
  event.preventDefault();

  const email = emailInput.value;
  const password = passwordInput.value;

  try {
    await signInWithEmailAndPassword(auth, email, password);

    messageElement.textContent = 'サインインしました。';
    location.href = './todo.html';
  } catch (error) {
    console.error('サインインに失敗しました:', error);
    messageElement.textContent =
      'サインインに失敗しました。メールアドレスとパスワードを確認してください。';
  }
});
