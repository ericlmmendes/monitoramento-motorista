import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js';
import { getDatabase, ref, get, set, child, push, onValue, update, remove, serverTimestamp } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js';

const firebaseConfig = {
  apiKey: 'AIzaSyC_mckTsGtRfH1FavUjzMLwt-eSD-zIaC4',
  authDomain: 'test-98b9a.firebaseapp.com',
  databaseURL: 'https://test-98b9a-default-rtdb.firebaseio.com',
  projectId: 'test-98b9a',
  storageBucket: 'test-98b9a.firebasestorage.app',
  messagingSenderId: '183537338072',
  appId: '1:183537338072:web:518f92cf564a000b0779ad',
  measurementId: 'G-31QE3XRGL2'
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

const defaultUsers = [
  {
    username: 'EricLM',
    password: 'Evo@537361',
    name: 'Eric LM',
    role: 'admin',
    avatar: 'https://ui-avatars.com/api/?name=Eric+LM&background=4f46e5&color=fff'
  },
  {
    username: 'motorista01',
    password: '123456',
    name: 'João Silva',
    role: 'motorista',
    avatar: 'https://ui-avatars.com/api/?name=Joao+Silva&background=0ea5e9&color=fff'
  },
  {
    username: 'motorista02',
    password: '123456',
    name: 'Maria Souza',
    role: 'motorista',
    avatar: 'https://ui-avatars.com/api/?name=Maria+Souza&background=10b981&color=fff'
  },
  {
    username: 'motorista03',
    password: '123456',
    name: 'Pedro Lima',
    role: 'motorista',
    avatar: 'https://ui-avatars.com/api/?name=Pedro+Lima&background=f59e0b&color=fff'
  }
];

const initDatabase = async () => {
  const dbRef = ref(db);

  try {
    for (const user of defaultUsers) {
      const snapshot = await get(child(dbRef, `users/${user.username}`));
      if (!snapshot.exists()) {
        await set(ref(db, `users/${user.username}`), {
          ...user,
          createdAt: serverTimestamp()
        });
      }
    }
  } catch (error) {
    console.error('Erro ao inicializar o banco:', error);
  }
};

export async function getUserByUsername(username) {
  const snapshot = await get(child(ref(db), `users/${username}`));
  return snapshot.exists() ? snapshot.val() : null;
}

export async function saveCheckin(data) {
  const checkinRef = data.id ? ref(db, `checkins/${data.id}`) : push(ref(db, 'checkins'));
  const id = checkinRef.key;
  const payload = {
    ...data,
    id,
    createdAt: serverTimestamp()
  };

  try {
    await set(checkinRef, payload);
  } catch (error) {
    const reason = error?.code ? ` (${error.code})` : '';
    throw new Error(`Falha ao salvar o check-in${reason}.`, { cause: error });
  }

  return id;
}

export async function loadCheckins() {
  const snapshot = await get(ref(db, 'checkins'));
  return snapshot.exists() ? Object.values(snapshot.val()) : [];
}

export function subscribeCheckins(callback) {
  return onValue(ref(db, 'checkins'), (snapshot) => {
    const items = snapshot.exists() ? Object.values(snapshot.val()) : [];
    callback(items);
  });
}

initDatabase();

export { db, ref, get, set, child, push, onValue, update, remove, serverTimestamp };
