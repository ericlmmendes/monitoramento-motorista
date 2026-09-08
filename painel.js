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
  return `<span class="inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${config.className}">${config.label}</span>`;
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

  const lat = Number(item.latitude);
  const lng = Number(item.longitude);
  const mapUrl = `https://www.google.com/maps?q=${lat},${lng}&z=15&output=embed`;
  
  if (mapFrame.src !== mapUrl) mapFrame.src = mapUrl;

  driverDetailName.textContent = item.driverName;
  driverDetailStatus.innerHTML = renderStatusBadge(item.status);
  driverDetailPhoto.src = item.driverPhoto || 'https://placehold.co/200x120?text=Sem+Foto';
  vehicleDetailPhoto.src = item.vehiclePhoto || 'https://placehold.co/200x120?text=Sem+Foto';
  detailCoords.textContent = `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
  
  const dateObj = new Date(item.checkedAt || item.createdAt);
  detailTime.textContent = dateObj.toLocaleString('pt-BR');
}

function loadDashboard() {
  // Ordenar check-ins por data decrescente (mais recente primeiro)
  const items = (Array.isArray(checkins) ? checkins : []).sort((a, b) => {
    return new Date(b.checkedAt || b.createdAt) - new Date(a.checkedAt || a.createdAt);
  });

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
    tableBody.innerHTML = `<tr><td colspan="6" class="px-4 py-8 text-center text-sm text-slate-400 italic">Nenhum registro encontrado.</td></tr>`;
    return;
  }

  tableBody.innerHTML = filtered
    .map((item) => `
      <tr class="group cursor-pointer border-b border-slate-100 transition hover:bg-indigo-50/30" data-id="${item.id}">
        <td class="px-4 py-4">
          <div class="flex items-center gap-3">
            <div class="relative">
              <img src="${item.driverPhoto}" alt="" class="h-10 w-10 rounded-full object-cover ring-2 ring-slate-100 group-hover:ring-indigo-200" />
              <span class="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white ${item.status === 'em_deslocamento' ? 'bg-emerald-500' : 'bg-slate-300'}"></span>
            </div>
            <div>
              <div class="text-sm font-bold text-slate-800">${item.driverName}</div>
              <div class="text-[10px] font-medium text-slate-400">@${item.driverUsername}</div>
            </div>
          </div>
        </td>
        <td class="px-4 py-4 text-xs font-mono text-slate-500">${Number(item.latitude).toFixed(4)}, ${Number(item.longitude).toFixed(4)}</td>
        <td class="px-4 py-4">${renderStatusBadge(item.status)}</td>
        <td class="px-4 py-4 text-xs text-slate-600 font-medium">${new Date(item.checkedAt || item.createdAt).toLocaleTimeString('pt-BR')}</td>
        <td class="px-4 py-4">
          <div class="flex -space-x-2">
            <img src="${item.driverPhoto}" class="h-8 w-8 rounded-md object-cover border-2 border-white shadow-sm" />
            <img src="${item.vehiclePhoto}" class="h-8 w-8 rounded-md object-cover border-2 border-white shadow-sm" />
          </div>
        </td>
        <td class="px-4 py-4">
          <span class="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-bold ${item.locationAuthorized ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}">
            <span class="h-1.5 w-1.5 rounded-full ${item.locationAuthorized ? 'bg-emerald-500' : 'bg-red-500'}"></span>
            ${item.locationAuthorized ? 'GPS OK' : 'SEM GPS'}
          </span>
        </td>
      </tr>
    `)
    .join('');

  tableBody.querySelectorAll('tr[data-id]').forEach((row) => {
    row.addEventListener('click', () => {
      const selected = items.find((item) => item.id === row.dataset.id);
      setDetailPanel(selected);
      // Highlight visual
      tableBody.querySelectorAll('tr').forEach(r => r.classList.remove('bg-indigo-50', 'ring-1', 'ring-indigo-200'));
      row.classList.add('bg-indigo-50', 'ring-1', 'ring-indigo-200');
    });
  });

  if (items.length && !document.querySelector('.bg-indigo-50')) {
    setDetailPanel(items[0]);
  }
}

statusFilter.addEventListener('change', () => loadDashboard());

async function resolveAdminLogin(username, password) {
  const dbUser = await getUserByUsername(username);
  if (dbUser && String(dbUser.password) === password && dbUser.role === 'admin') return dbUser;

  return LEGACY_ADMIN_USERS.find(u => u.username.toLowerCase() === username.toLowerCase() && u.password === password) || null;
}

loginForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const username = document.getElementById('admin-username').value.trim();
  const password = document.getElementById('admin-password').value.trim();
  const user = await resolveAdminLogin(username, password);

  if (!user) {
    const errorBox = document.getElementById('admin-error');
    errorBox.classList.remove('hidden');
    return;
  }

  adminSession = user;
  localStorage.setItem(SESSION_KEY, JSON.stringify(user));
  showDashboard();
});

logoutBtn.addEventListener('click', () => {
  localStorage.removeItem(SESSION_KEY);
  location.reload();
});

const savedSession = JSON.parse(localStorage.getItem(SESSION_KEY) || 'null');
if (savedSession) {
  adminSession = savedSession;
  showDashboard();
}

subscribeCheckins((items) => {
  checkins = items;
  if (adminSession) loadDashboard();
});
