import { getUserByUsername, saveCheckin } from './bd.js';

const SESSION_KEY = 'evo_driver_session';

const loginCard = document.getElementById('login-card');
const checkinCard = document.getElementById('checkin-card');
const loginForm = document.getElementById('driver-login-form');
const loginMessage = document.getElementById('login-message');
const statusSelect = document.getElementById('driver-status');
const locationText = document.getElementById('location-text');
const statusMessage = document.getElementById('status-message');
const driverVideo = document.getElementById('driver-video');
const vehicleVideo = document.getElementById('vehicle-video');
const driverPhoto = document.getElementById('driver-photo');
const vehiclePhoto = document.getElementById('vehicle-photo');
const captureDriverBtn = document.getElementById('capture-driver-photo');
const captureVehicleBtn = document.getElementById('capture-vehicle-photo');
const clearDriverBtn = document.getElementById('clear-driver-photo');
const clearVehicleBtn = document.getElementById('clear-vehicle-photo');
const submitBtn = document.getElementById('submit-checkin');
const logoutBtn = document.getElementById('logout-btn');
const checkinForm = document.getElementById('checkin-form');

let currentDriver = null;
let driverStream = null;
let vehicleStream = null;
let driverPhotoData = '';
let vehiclePhotoData = '';
let geoCoords = null;

function showToast(message, type = 'success') {
  statusMessage.textContent = message;
  statusMessage.className = `rounded-xl border px-3 py-2 text-sm ${
    type === 'success'
      ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
      : 'border-red-200 bg-red-50 text-red-700'
  }`;
  statusMessage.classList.remove('hidden');
}

function updateGeoStatus() {
  if (!geoCoords) {
    locationText.textContent = 'Aguardando geolocalização...';
    locationText.className = 'inline-flex items-center gap-2 rounded-full bg-yellow-100 px-3 py-1 text-xs font-medium text-yellow-700';
    return;
  }

  const locationLabel = `Lat ${geoCoords.latitude.toFixed(5)} · Lng ${geoCoords.longitude.toFixed(5)}`;
  locationText.textContent = `Localização autorizada: ${locationLabel}`;
  locationText.className = 'inline-flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-700';
}

function startLocationTracking() {
  if (!navigator.geolocation) {
    showToast('Seu navegador não suporta geolocalização.', 'error');
    return;
  }

  navigator.geolocation.getCurrentPosition(
    (position) => {
      geoCoords = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
        timestamp: new Date().toISOString()
      };
      updateGeoStatus();
      showToast('Geolocalização capturada com sucesso.', 'success');
    },
    () => {
      geoCoords = null;
      updateGeoStatus();
      showToast('Não foi possível acessar a localização do dispositivo.', 'error');
    },
    { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 }
  );
}

function stopStream(stream) {
  if (!stream) return;
  stream.getTracks().forEach((track) => track.stop());
}

async function openCamera(type) {
  const constraints = {
    video: { facingMode: type === 'driver' ? 'user' : { ideal: 'environment' } },
    audio: false
  };

  try {
    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    if (type === 'driver') {
      stopStream(driverStream);
      driverStream = stream;
      driverVideo.srcObject = stream;
      driverVideo.classList.remove('hidden');
      driverVideo.classList.add('block');
      captureDriverBtn.textContent = 'Capturar selfie';
    } else {
      stopStream(vehicleStream);
      vehicleStream = stream;
      vehicleVideo.srcObject = stream;
      vehicleVideo.classList.remove('hidden');
      vehicleVideo.classList.add('block');
      captureVehicleBtn.textContent = 'Capturar veículo';
    }
  } catch (error) {
    showToast('Não foi possível acessar a câmera. Verifique as permissões do navegador.', 'error');
  }
}

function capturePhoto(type) {
  const video = type === 'driver' ? driverVideo : vehicleVideo;
  const stream = type === 'driver' ? driverStream : vehicleStream;

  if (!video || !video.videoWidth || !video.videoHeight) {
    showToast('Primeiro abra a câmera antes de capturar a foto.', 'error');
    return;
  }

  const canvas = document.createElement('canvas');
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;

  const context = canvas.getContext('2d');
  context.drawImage(video, 0, 0, canvas.width, canvas.height);

  const photoData = canvas.toDataURL('image/jpeg', 0.9);

  if (type === 'driver') {
    driverPhotoData = photoData;
    driverPhoto.src = photoData;
    driverPhoto.classList.remove('hidden');
    driverVideo.classList.add('hidden');
  } else {
    vehiclePhotoData = photoData;
    vehiclePhoto.src = photoData;
    vehiclePhoto.classList.remove('hidden');
    vehicleVideo.classList.add('hidden');
  }

  stopStream(stream);
  if (type === 'driver') driverStream = null;
  else vehicleStream = null;

  showToast('Foto capturada com sucesso.', 'success');
  validateForm();
}

function clearPhoto(type) {
  if (type === 'driver') {
    driverPhotoData = '';
    driverPhoto.src = '';
    driverPhoto.classList.add('hidden');
  } else {
    vehiclePhotoData = '';
    vehiclePhoto.src = '';
    vehiclePhoto.classList.add('hidden');
  }
  validateForm();
}

function validateForm() {
  const canSubmit = Boolean(driverPhotoData) && Boolean(vehiclePhotoData) && Boolean(geoCoords) && Boolean(currentDriver);
  submitBtn.disabled = !canSubmit;
  submitBtn.classList.toggle('opacity-50', !canSubmit);
}

function renderDriverScreen() {
  document.getElementById('welcome-name').textContent = currentDriver.name;
  document.getElementById('driver-badge').textContent = `@${currentDriver.username}`;
  loginCard.classList.add('hidden');
  checkinCard.classList.remove('hidden');
  startLocationTracking();
  validateForm();
}

loginForm.addEventListener('submit', async (event) => {
  event.preventDefault();

  const username = document.getElementById('driver-username').value.trim();
  const password = document.getElementById('driver-password').value.trim();

  const user = await getUserByUsername(username);

  if (!user || user.password !== password || user.role !== 'motorista') {
    loginMessage.classList.remove('hidden');
    loginMessage.textContent = 'Credenciais inválidas. Verifique usuário e senha.';
    return;
  }

  loginMessage.classList.add('hidden');
  currentDriver = user;
  localStorage.setItem(SESSION_KEY, JSON.stringify(user));
  renderDriverScreen();
});

checkinForm.addEventListener('submit', async (event) => {
  event.preventDefault();

  if (!currentDriver || !geoCoords) {
    showToast('Preencha os dados obrigatórios antes de enviar.', 'error');
    return;
  }

  if (!driverPhotoData || !vehiclePhotoData) {
    showToast('É necessário capturar as duas fotos para continuar.', 'error');
    return;
  }

  const registration = {
    id: Date.now().toString(),
    driverUsername: currentDriver.username,
    driverName: currentDriver.name,
    status: statusSelect.value,
    latitude: geoCoords.latitude,
    longitude: geoCoords.longitude,
    locationAuthorized: true,
    driverPhoto: driverPhotoData,
    vehiclePhoto: vehiclePhotoData,
    checkedAt: new Date().toISOString()
  };

  await saveCheckin(registration);

  showToast('Check-in enviado com sucesso para o painel administrativo.', 'success');
  checkinForm.reset();
  statusSelect.value = 'online';
  driverPhotoData = '';
  vehiclePhotoData = '';
  geoCoords = null;
  updateGeoStatus();
  driverPhoto.classList.add('hidden');
  vehiclePhoto.classList.add('hidden');
  validateForm();
});

captureDriverBtn.addEventListener('click', () => {
  if (driverStream) {
    capturePhoto('driver');
    return;
  }
  openCamera('driver');
});

captureVehicleBtn.addEventListener('click', () => {
  if (vehicleStream) {
    capturePhoto('vehicle');
    return;
  }
  openCamera('vehicle');
});

clearDriverBtn.addEventListener('click', () => clearPhoto('driver'));
clearVehicleBtn.addEventListener('click', () => clearPhoto('vehicle'));
logoutBtn.addEventListener('click', () => {
  localStorage.removeItem(SESSION_KEY);
  currentDriver = null;
  geoCoords = null;
  driverPhotoData = '';
  vehiclePhotoData = '';
  driverPhoto.classList.add('hidden');
  vehiclePhoto.classList.add('hidden');
  loginMessage.classList.add('hidden');
  statusMessage.classList.add('hidden');
  locationText.textContent = 'Aguardando geolocalização...';
  loginCard.classList.remove('hidden');
  checkinCard.classList.add('hidden');
  checkinForm.reset();
  document.getElementById('driver-login-form').reset();
  document.getElementById('driver-status').value = 'online';
});

const savedSession = JSON.parse(localStorage.getItem(SESSION_KEY) || 'null');
if (savedSession) {
  currentDriver = savedSession;
  renderDriverScreen();
}

statusSelect.addEventListener('change', validateForm);
startLocationTracking();
validateForm();
