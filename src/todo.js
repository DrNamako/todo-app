import {
  collection,
  addDoc,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  query,
  where,
  writeBatch,
} from 'firebase/firestore';

import { onAuthStateChanged, signOut } from 'firebase/auth';

import { db, auth } from './firebase.js';

// HTMLの部品を取得
const userEmail = document.getElementById('user-email');
const signOutButton = document.getElementById('sign-out-button');
const todoInput = document.getElementById('todo-input');
const addButton = document.getElementById('add-button');
const todoList = document.getElementById('todo-list');
const messageElement = document.getElementById('message');
const filterButtons = document.querySelectorAll('.filter-button');

// 追加したHTMLの部品
const todoCount = document.getElementById('todo-count');
const deleteAllButton = document.getElementById('delete-all-button');

// ログインユーザーの情報
let currentUser = null;

// TODOを保存するコレクション
let todosCollectionRef = null;

// 現在の表示条件
let currentFilter = 'all';

// ログイン状態を確認
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    location.href = './index.html';
    return;
  }

  currentUser = user;

  // ログインしたユーザーのメールアドレスを表示
  userEmail.textContent = user.email;

  // ユーザーごとのTODO保存場所を指定
  todosCollectionRef = collection(db, 'users', user.uid, 'todos');

  // TODOを表示
  await displayTodos();
});

// TODOを画面に表示する関数
async function displayTodos() {
  try {
    // ユーザーのTODOをすべて取得して件数を更新
    const allTodosSnapshot = await getDocs(todosCollectionRef);
    todoCount.textContent = allTodosSnapshot.size;

    let todosQuery;

    // 表示条件に応じてFirestoreのクエリを作る
    if (currentFilter === 'incomplete') {
      todosQuery = query(todosCollectionRef, where('completed', '==', false));
    } else if (currentFilter === 'completed') {
      todosQuery = query(todosCollectionRef, where('completed', '==', true));
    } else {
      todosQuery = query(todosCollectionRef);
    }

    // Firestoreからデータを取得
    const querySnapshot = await getDocs(todosQuery);

    // 画面を一度空にする
    todoList.innerHTML = '';

    // 取得したTODOを1件ずつ表示
    querySnapshot.forEach((todoSnapshot) => {
      const todoData = todoSnapshot.data();
      const todoId = todoSnapshot.id;

      const listItem = document.createElement('li');

      // チェックボックスを作成
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.checked = todoData.completed;

      // TODOのタイトルを編集できるようにする
      const titleInput = document.createElement('input');
      titleInput.type = 'text';
      titleInput.value = todoData.title;

      if (todoData.completed) {
        titleInput.style.textDecoration = 'line-through';
      }

      // チェックボックスが変更されたとき
      checkbox.addEventListener('change', async () => {
        try {
          const todoDocRef = doc(todosCollectionRef, todoId);

          await updateDoc(todoDocRef, {
            completed: checkbox.checked,
          });

          await displayTodos();
        } catch (error) {
          console.error('TODOの更新に失敗しました:', error);
          messageElement.textContent = '更新に失敗しました。';
        }
      });

      // タイトルの編集が終わったとき
      titleInput.addEventListener('change', async () => {
        const newTitle = titleInput.value.trim();

        if (newTitle === '') {
          messageElement.textContent = 'タイトルを入力してください。';
          titleInput.value = todoData.title;
          return;
        }

        try {
          const todoDocRef = doc(todosCollectionRef, todoId);

          await updateDoc(todoDocRef, {
            title: newTitle,
          });

          messageElement.textContent = 'TODOを更新しました。';
        } catch (error) {
          console.error('タイトルの更新に失敗しました:', error);
          messageElement.textContent = '更新に失敗しました。';
        }
      });

      // 削除ボタンを作成
      const deleteButton = document.createElement('button');
      deleteButton.textContent = '×';

      // 削除ボタンが押されたとき
      deleteButton.addEventListener('click', async () => {
        try {
          const todoDocRef = doc(todosCollectionRef, todoId);

          await deleteDoc(todoDocRef);

          await displayTodos();

          messageElement.textContent = 'TODOを削除しました。';
        } catch (error) {
          console.error('TODOの削除に失敗しました:', error);
          messageElement.textContent = '削除に失敗しました。';
        }
      });

      // HTMLに追加
      listItem.appendChild(checkbox);
      listItem.appendChild(titleInput);
      listItem.appendChild(deleteButton);

      todoList.appendChild(listItem);
    });

    if (querySnapshot.empty) {
      todoList.innerHTML = '<li>TODOはありません。</li>';
    }
  } catch (error) {
    console.error('TODOの取得に失敗しました:', error);
    messageElement.textContent = 'TODOの取得に失敗しました。';
  }
}

// 追加ボタンが押されたとき
addButton.addEventListener('click', async () => {
  const title = todoInput.value.trim();

  if (!title) {
    messageElement.textContent = 'TODOを入力してください。';
    return;
  }

  if (!todosCollectionRef) {
    return;
  }

  try {
    await addDoc(todosCollectionRef, {
      title: title,
      completed: false,
    });

    todoInput.value = '';

    messageElement.textContent = 'TODOを追加しました。';

    await displayTodos();
  } catch (error) {
    console.error('TODOの追加に失敗しました:', error);
    messageElement.textContent = '追加に失敗しました。';
  }
});

// 表示切り替えボタン
filterButtons.forEach((button) => {
  button.addEventListener('click', async () => {
    currentFilter = button.dataset.filter;

    await displayTodos();
  });
});

// TODOをすべて削除する処理
deleteAllButton.addEventListener('click', async () => {
  if (!todosCollectionRef) {
    return;
  }

  // 削除前に確認する
  const result = confirm('登録されているTODOをすべて削除しますか？');

  if (!result) {
    return;
  }

  try {
    // ユーザーのTODOをすべて取得
    const querySnapshot = await getDocs(todosCollectionRef);

    if (querySnapshot.empty) {
      messageElement.textContent = '削除するTODOはありません。';
      return;
    }

    // Firestoreのバッチ処理を作成
    // 1回のバッチに追加できるのは最大500件
    const docs = querySnapshot.docs;

    for (let i = 0; i < docs.length; i += 500) {
      const batch = writeBatch(db);

      const targetDocs = docs.slice(i, i + 500);

      for (const todoSnapshot of targetDocs) {
        batch.delete(todoSnapshot.ref);
      }

      await batch.commit();
    }

    messageElement.textContent = 'すべてのTODOを削除しました。';

    // 件数と一覧を更新
    await displayTodos();
  } catch (error) {
    console.error('一括削除に失敗しました:', error);
    messageElement.textContent = '一括削除に失敗しました。';
  }
});

// サインアウトボタン
signOutButton.addEventListener('click', async () => {
  try {
    await signOut(auth);

    location.href = './index.html';
  } catch (error) {
    console.error('サインアウトに失敗しました:', error);
    messageElement.textContent = 'サインアウトに失敗しました。';
  }
});
