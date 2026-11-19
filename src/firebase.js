import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'AIzaSyAd6SAjT4nA1xFdxC-xYsSWaeqx3zn7nro',
  authDomain: 'cloudcomputing6-57cde.firebaseapp.com',
  projectId: 'cloudcomputing6-57cde',
  storageBucket: 'cloudcomputing6-57cde.firebasestorage.app',
  messagingSenderId: '9168547701',
  appId: '1:9168547701:web:a098f20e9505f82911ed3c',
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
