import { getUserByUsername, loadCheckins, subscribeCheckins } from './bd.js';

const SESSION_KEY = 'evo_admin_session';
const LEGACY_ADMIN_USERS = [
  { username: 'admin', password: 'admin123', role: 'admin', name: 'Administrador' },
  { username: 'EricLM', password: 'Evo@537361', role: 'admin', name: 'Eric LM' }
];

const loginShell = document.getElementById('admin-login-shell');
const dashboardShell = document.getElementById('admin-dashboard-shell');
const loginForm = document.getElementById('admin-login-form');
const logoutBtn = document.getElementById('logout-admin');
const statsCards = {
  online: document.getElementById('stat-online'),
  waiting: document.getElementById('stat-waiting'),
  offline: document.getElementById('stat-offline'),
  unloading: document.getElementById('stat-descarregando'),
  total: document.getElementById('stat-total')
};
const tableBody = document.getElementById('drivers-table-body');
const statusFilter = document.getElementById('status-filter');
const mapFrame = document.getElementById('map-frame');
const driverDetailName = document.getElementById('driver-detail-name');
const driverDetailStatus = document.getElementById('driver-detail-status');
const driverDetailPhoto = document.getElementById('driver-detail-photo');
const vehicleDetailPhoto = document.getElementById('vehicle-detail-photo');
const detailCoords = document.getElementById('detail-coords');
const detailTime = document.getElementById('detail-time');

let adminSession = null;
let checkins = [];

function showDashboard() {
  loginShell.classList.add('hidden');
  dashboardShell.classList.remove('hidden');
  loadDashboard();
}

function showLogin() {
  loginShell.classList.remove('hidden');
  dashboardShell.classList.add('hidden');
}

function renderStatusBadge(status) {
  const statusMap = {
    em_deslocamento: { label: 'Em deslocamento', className: 'bg-emerald-100 text-emerald-700' },
    no_local: { label: 'No local', className: 'bg-yellow-100 text-yellow-700' },
    carregando: { label: 'Carregando', className: 'bg-indigo-100 text-indigo-700' },
    descarregando: { label: 'Descarregando', className: 'bg-violet-100 text-violet-700' }
  };

  const config = statusMap[status] || { label: status, className: 'bg-gray-100 text-gray-700' };
  return `<span class="inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${config.className}">${config.label}</span>`;
}

function getStatusCounts(items) {
  return {
    online: items.filter((item) => item.status === 'em_deslocamento').length,
    waiting: items.filter((item) => item.status === 'no_local').length,
    offline: items.filter((item) => item.status === 'carregando').length,
    unloading: items.filter((item) => item.status === 'descarregando').length,
    total: items.length
  };
}

function setDetailPanel(item) {
  if (!item) return;

  const mapUrl = `https://www.google.com/maps?q=${item.latitude},${item.longitude}&z=15&output=embed`;
  mapFrame.src = mapUrl;

  driverDetailName.textContent = item.driverName;
  driverDetailStatus.innerHTML = renderStatusBadge(item.status);
  driverDetailPhoto.src = item.driverPhoto || 'https://placehold.co/200x120/EEF2FF/4338CA?text=Motorista';
  vehicleDetailPhoto.src = item.vehiclePhoto || 'https://placehold.co/200x120/FEF3C7/92400E?text=Veículo';
  detailCoords.textContent = `${Number(item.latitude).toFixed(5)}, ${Number(item.longitude).toFixed(5)}`;
  detailTime.textContent = new Date(item.checkedAt || item.createdAt || Date.now()).toLocaleString('pt-BR');
}

function loadDashboard() {
  const items = Array.isArray(checkins) ? checkins : [];
  const counts = getStatusCounts(items);
  statsCards.online.textContent = counts.online;
  statsCards.waiting.textContent = counts.waiting;
  statsCards.offline.textContent = counts.offline;
  statsCards.unloading.textContent = counts.unloading;
  statsCards.total.textContent = counts.total;

  const selectedFilter = statusFilter.value;
  const filtered = selectedFilter === 'all'
    ? items
    : items.filter((item) => item.status === selectedFilter);

  if (!filtered.length) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="6" class="px-4 py-8 text-center text-sm text-slate-500">Nenhum motorista encontrado para este filtro.</td>
      </tr>
    `;
    return;
  }

  tableBody.innerHTML = filtered
    .map((item) => `
      <tr class="cursor-pointer border-b border-slate-100 hover:bg-slate-50" data-id="${item.id}">
        <td class="px-4 py-3">
          <div class="flex items-center gap-3">
            <img src="${item.driverPhoto || 'https://placehold.co/40x40/EEF2FF/4338CA?text=M'}" alt="Motorista" class="h-10 w-10 rounded-full object-cover border border-slate-200" />
            <div>
              <div class="text-sm font-semibold text-slate-800">${item.driverName}</div>
              <div class="text-xs text-slate-500">@${item.driverUsername}</div>
            </div>
          </div>
        </td>
        <td class="px-4 py-3 text-sm text-slate-700">${Number(item.latitude).toFixed(5)}, ${Number(item.longitude).toFixed(5)}</td>
        <td class="px-4 py-3">${renderStatusBadge(item.status)}</td>
        <td class="px-4 py-3 text-sm text-slate-700">${new Date(item.checkedAt || item.createdAt || Date.now()).toLocaleString('pt-BR')}</td>
        <td class="px-4 py-3">
          <div class="flex gap-2">
            <img src="${item.driverPhoto || 'https://placehold.co/40x40/EEF2FF/4338CA?text=Foto'}" class="h-10 w-10 rounded-lg object-cover border border-slate-200" />
            <img src="${item.vehiclePhoto || 'https://placehold.co/40x40/FEF3C7/92400E?text=Veículo'}" class="h-10 w-10 rounded-lg object-cover border border-slate-200" />
          </div>
        </td>
        <td class="px-4 py-3">
          <span class="inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${item.locationAuthorized ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}">
            ${item.locationAuthorized ? 'Autorizada' : 'Não autorizada'}
          </span>
        </td>
      </tr>
    `)
    .join('');

  tableBody.querySelectorAll('tr[data-id]').forEach((row) => {
    row.addEventListener('click', () => {
      const selected = items.find((item) => item.id === row.dataset.id);
      setDetailPanel(selected);
    });
  });

  if (items.length) {
    setDetailPanel(items[0]);
  }
}

statusFilter.addEventListener('change', () => loadDashboard());

async function resolveAdminLogin(username, password) {
  const cleanUsername = String(username || '').trim();
  const cleanPassword = String(password || '').trim();

  if (!cleanUsername || !cleanPassword) return null;

  const dbUser = await getUserByUsername(cleanUsername);
  if (dbUser && String(dbUser.password) === cleanPassword && String(dbUser.role).toLowerCase() === 'admin') {
    return dbUser;
  }

  const legacyUser = LEGACY_ADMIN_USERS.find((item) => {
    return item.username.toLowerCase() === cleanUsername.toLowerCase() && item.password === cleanPassword;
  });

  return legacyUser || null;
}

loginForm.addEventListener('submit', async (event) => {
  event.preventDefault();

  const username = document.getElementById('admin-username').value.trim();
  const password = document.getElementById('admin-password').value.trim();
  const user = await resolveAdminLogin(username, password);

  if (!user) {
    const errorBox = document.getElementById('admin-error');
    errorBox.textContent = 'Credenciais inválidas. Tente: admin / admin123 ou EricLM / Evo@537361.';
    errorBox.classList.remove('hidden');
    return;
  }

  adminSession = user;
  localStorage.setItem(SESSION_KEY, JSON.stringify(user));
  document.getElementById('admin-error').classList.add('hidden');
  showDashboard();
});

logoutBtn.addEventListener('click', () => {
  localStorage.removeItem(SESSION_KEY);
  adminSession = null;
  loginForm.reset();
  showLogin();
});

async function hydrateCheckins() {
  checkins = await loadCheckins();
  if (adminSession) {
    loadDashboard();
  }
}

const savedSession = JSON.parse(localStorage.getItem(SESSION_KEY) || 'null');
if (savedSession) {
  adminSession = savedSession;
  showDashboard();
} else {
  showLogin();
}

subscribeCheckins((items) => {
  checkins = items;
  if (adminSession) {
    loadDashboard();
  }
});

hydrateCheckins();
