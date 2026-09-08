// BD.js
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.14.0/firebase-app.js';
import { getDatabase, ref, push, update, onValue, remove, set, get } from 'https://www.gstatic.com/firebasejs/10.14.0/firebase-database.js';

// Configuração do Firebase
const firebaseConfig = {
  apiKey: "AIzaSyCRiN9bG96FJdOslh_nx3Apmwb8VqdXrsU",
  authDomain: "evocortes-dfa04.firebaseapp.com",
  databaseURL: "https://evocortes-dfa04-default-rtdb.firebaseio.com",
  projectId: "evocortes-dfa04",
  storageBucket: "evocortes-dfa04.firebasestorage.app",
  messagingSenderId: "431410895933",
  appId: "1:431410895933:web:cbe3d898e471e183bf5e54",
  measurementId: "G-KEMS99F9L3"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

// Exportar
export { database, ref, push, update, onValue, remove, set, get };
