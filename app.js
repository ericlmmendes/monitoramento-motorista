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
const driverNameInput = document.querySelector('input[value="Motorista em operação"]');

let currentDriver = null;
let driverStream = null;
let vehicleStream = null;
let driverPhotoData = '';
let vehiclePhotoData = '';
let geoCoords = null;

function showToast(message, type = 'success') {
  statusMessage.textContent = message;
  statusMessage.className = `rounded-xl border px-3 py-2 text-sm animate-pulse ${
    type === 'success'
      ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
      : 'border-red-200 bg-red-50 text-red-700'
  }`;
  statusMessage.classList.remove('hidden');
  setTimeout(() => statusMessage.classList.remove('animate-pulse'), 3000);
}

function updateGeoStatus() {
  if (!geoCoords) {
    locationText.innerHTML = '<i class="fa-solid fa-spinner fa-spin mr-2"></i>Aguardando geolocalização...';
    locationText.className = 'inline-flex items-center gap-2 rounded-full bg-yellow-100 px-3 py-1 text-xs font-medium text-yellow-700';
    return;
  }

  const locationLabel = `Lat ${geoCoords.latitude.toFixed(5)} · Lng ${geoCoords.longitude.toFixed(5)}`;
  locationText.innerHTML = `<i class="fa-solid fa-check-circle mr-1"></i> Localização autorizada: ${locationLabel}`;
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
      validateForm();
    },
    () => {
      geoCoords = null;
      updateGeoStatus();
      showToast('Por favor, ative o GPS para prosseguir.', 'error');
    },
    { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 }
  );
}

function stopStream(stream) {
  if (!stream) return;
  stream.getTracks().forEach((track) => track.stop());
}

async function openCamera(type) {
  if (!navigator.mediaDevices?.getUserMedia) {
    showToast('A câmera exige HTTPS.', 'error');
    return;
  }

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
      await driverVideo.play();
      driverVideo.classList.remove('hidden');
      driverVideo.classList.add('block');
      captureDriverBtn.innerHTML = '<i class="fa-solid fa-camera mr-2"></i>Capturar selfie';
    } else {
      stopStream(vehicleStream);
      vehicleStream = stream;
      vehicleVideo.srcObject = stream;
      await vehicleVideo.play();
      vehicleVideo.classList.remove('hidden');
      vehicleVideo.classList.add('block');
      captureVehicleBtn.innerHTML = '<i class="fa-solid fa-truck-pickup mr-2"></i>Capturar veículo';
    }
  } catch (error) {
    showToast('Acesso à câmera negado.', 'error');
  }
}

function resizePhoto(video) {
  const maxSize = 1024;
  const scale = Math.min(1, maxSize / Math.max(video.videoWidth, video.videoHeight));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(video.videoWidth * scale);
  canvas.height = Math.round(video.videoHeight * scale);
  const context = canvas.getContext('2d');
  context.drawImage(video, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL('image/jpeg', 0.7);
}

function capturePhoto(type) {
  const video = type === 'driver' ? driverVideo : vehicleVideo;
  const stream = type === 'driver' ? driverStream : vehicleStream;

  if (!video || !video.videoWidth) {
    showToast('Aguarde a inicialização da câmera.', 'error');
    return;
  }

  const photoData = resizePhoto(video);

  if (type === 'driver') {
    driverPhotoData = photoData;
    driverPhoto.src = photoData;
    driverPhoto.classList.remove('hidden');
    driverVideo.classList.add('hidden');
    captureDriverBtn.textContent = 'Refazer selfie';
  } else {
    vehiclePhotoData = photoData;
    vehiclePhoto.src = photoData;
    vehiclePhoto.classList.remove('hidden');
    vehicleVideo.classList.add('hidden');
    captureVehicleBtn.textContent = 'Refazer veículo';
  }

  stopStream(stream);
  if (type === 'driver') driverStream = null;
  else vehicleStream = null;

  validateForm();
}

function clearPhoto(type) {
  if (type === 'driver') {
    driverPhotoData = '';
    driverPhoto.src = '';
    driverPhoto.classList.add('hidden');
    captureDriverBtn.textContent = 'Abrir câmera';
  } else {
    vehiclePhotoData = '';
    vehiclePhoto.src = '';
    vehiclePhoto.classList.add('hidden');
    captureVehicleBtn.textContent = 'Abrir câmera';
  }
  validateForm();
}

function validateForm() {
  const canSubmit = Boolean(driverPhotoData) && Boolean(vehiclePhotoData) && Boolean(geoCoords) && Boolean(currentDriver);
  submitBtn.disabled = !canSubmit;
  submitBtn.classList.toggle('opacity-50', !canSubmit);
  submitBtn.classList.toggle('cursor-not-allowed', !canSubmit);
}

function renderDriverScreen() {
  document.getElementById('welcome-name').textContent = currentDriver.name;
  document.getElementById('driver-badge').textContent = `@${currentDriver.username}`;
  if(driverNameInput) driverNameInput.value = currentDriver.name;
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
    return;
  }

  loginMessage.classList.add('hidden');
  currentDriver = user;
  localStorage.setItem(SESSION_KEY, JSON.stringify(user));
  renderDriverScreen();
});

checkinForm.addEventListener('submit', async (event) => {
  event.preventDefault();

  if (!currentDriver || !geoCoords || !driverPhotoData || !vehiclePhotoData) {
    showToast('Dados incompletos.', 'error');
    return;
  }

  const registration = {
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

  try {
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin mr-2"></i>Enviando...';
    await saveCheckin(registration);
    showToast('Check-in enviado com sucesso!', 'success');
    
    // Reset parciais (preservar login)
    driverPhotoData = '';
    vehiclePhotoData = '';
    driverPhoto.classList.add('hidden');
    vehiclePhoto.classList.add('hidden');
    captureDriverBtn.textContent = 'Abrir câmera';
    captureVehicleBtn.textContent = 'Abrir câmera';
    validateForm();
  } catch (error) {
    showToast('Erro ao salvar no banco.', 'error');
  } finally {
    submitBtn.innerHTML = 'Enviar dados para o painel';
    validateForm();
  }
});

captureDriverBtn.addEventListener('click', () => {
  if (driverStream) { capturePhoto('driver'); return; }
  openCamera('driver');
});

captureVehicleBtn.addEventListener('click', () => {
  if (vehicleStream) { capturePhoto('vehicle'); return; }
  openCamera('vehicle');
});

clearDriverBtn.addEventListener('click', () => clearPhoto('driver'));
clearVehicleBtn.addEventListener('click', () => clearPhoto('vehicle'));

logoutBtn.addEventListener('click', () => {
  localStorage.removeItem(SESSION_KEY);
  location.reload();
});

const savedSession = JSON.parse(localStorage.getItem(SESSION_KEY) || 'null');
if (savedSession) {
  currentDriver = savedSession;
  renderDriverScreen();
}

statusSelect.addEventListener('change', validateForm);
validateForm();
