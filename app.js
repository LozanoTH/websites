const FIREBASE_URL = 'https://app-store-88307-default-rtdb.firebaseio.com';

const CAMPOS = [
  { id: 'nombre', label: 'Nombre completo', type: 'text', required: true },
  { id: 'correo', label: 'Correo electrónico', type: 'email', required: true },
  { id: 'telefono', label: 'Teléfono', type: 'tel', required: false },
  { id: 'mensaje', label: 'Mensaje', type: 'textarea', required: false }
];

/* ---------- UTILS ---------- */
function $(sel) { return document.querySelector(sel); }
function $$(sel) { return document.querySelectorAll(sel); }

function obtenerId() {
  const params = new URLSearchParams(window.location.search);
  return params.get('id') || '';
}

function fechaLocal() {
  return new Date().toLocaleString('es-CO', {
    timeZone: 'America/Bogota',
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit'
  });
}

/* ---------- FIREBASE ---------- */
async function fbGet(path) {
  const r = await fetch(`${FIREBASE_URL}${path}.json`);
  return r.json();
}

async function fbPut(path, data) {
  const r = await fetch(`${FIREBASE_URL}${path}.json`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  return r.json();
}

async function fbDelete(path) {
  await fetch(`${FIREBASE_URL}${path}.json`, { method: 'DELETE' });
}

/* ---------- RENDER ---------- */
function renderForm() {
  const cont = $('#camposDinamicos');
  cont.innerHTML = '';

  CAMPOS.forEach(c => {
    const div = document.createElement('div');
    div.className = 'form-group';

    const label = document.createElement('label');
    label.htmlFor = c.id;
    label.textContent = c.label + (c.required ? ' *' : '');

    let input;
    if (c.type === 'textarea') {
      input = document.createElement('textarea');
      input.rows = 3;
    } else {
      input = document.createElement('input');
      input.type = c.type;
    }
    input.id = c.id;
    input.name = c.id;
    input.required = c.required;

    div.appendChild(label);
    div.appendChild(input);
    cont.appendChild(div);
  });
}

function mostrarResultado(id, data, timestamp) {
  const card = $('#resultCard');
  const msg = $('#resultMsg');

  msg.textContent = `Registrado el ${timestamp}`;
  $('#formDatos').reset();
  card.classList.remove('hidden');
  card.scrollIntoView({ behavior: 'smooth' });
}

/* ---------- ADMIN ---------- */
async function cargarAdmin() {
  const content = $('#adminContent');
  content.innerHTML = '<div class="spinner"></div>';

  const data = await fbGet('/mensajes');
  content.innerHTML = '';

  if (!data) {
    content.innerHTML = '<p class="muted">No hay datos registrados.</p>';
    return;
  }

  const search = $('#searchId').value.trim().toLowerCase();
  const entries = Object.entries(data);

  const filtradas = search
    ? entries.filter(([id]) => id.includes(search))
    : entries;

  if (filtradas.length === 0) {
    content.innerHTML = '<p class="muted">No se encontraron resultados.</p>';
    return;
  }

  filtradas.forEach(([id, registros]) => {
    const card = document.createElement('div');
    card.className = 'admin-card';

    const idEl = document.createElement('div');
    idEl.className = 'admin-id';
    idEl.textContent = `🆔 ${id}`;

    const regs = Object.entries(registros);
    card.appendChild(idEl);

    regs.forEach(([key, vals]) => {
      const r = document.createElement('div');
      r.className = 'admin-registro';
      r.textContent = `📄 ${key}: ${CAMPOS.map(c => `${c.label}=${vals[c.id] || '—'}`).join(', ')}`;
      card.appendChild(r);
    });

    const actions = document.createElement('div');
    actions.className = 'admin-actions';

    const waBtn = document.createElement('button');
    waBtn.className = 'btn btn-small';
    waBtn.textContent = 'Enviar WhatsApp';
    waBtn.onclick = () => {
      const ultimo = regs[regs.length - 1][1];
      const lineas = CAMPOS.map(c => `${c.label}: ${ultimo[c.id] || '(sin dato)'}`).join('\n');
      const url = `https://wa.me/${id}?text=${encodeURIComponent('Tus datos:\n' + lineas)}`;
      window.open(url, '_blank');
    };

    const delBtn = document.createElement('button');
    delBtn.className = 'btn btn-danger';
    delBtn.textContent = 'Eliminar todo';
    delBtn.onclick = async () => {
      if (!confirm(`¿Eliminar todos los datos de ${id}?`)) return;
      await fbDelete(`/mensajes/${id}`);
      cargarAdmin();
    };

    actions.appendChild(waBtn);
    actions.appendChild(delBtn);
    card.appendChild(actions);
    content.appendChild(card);
  });
}

/* ---------- EVENTOS ---------- */
$('#formDatos').addEventListener('submit', async (e) => {
  e.preventDefault();
  const id = obtenerId();

  if (!id) {
    alert('No se encontró el parámetro "id" en la URL.');
    return;
  }

  const data = {};
  CAMPOS.forEach(c => {
    const el = document.getElementById(c.id);
    data[c.id] = el.value.trim();
  });

  const timestamp = fechaLocal();
  data.fecha = timestamp;

  const key = `registro_${Date.now()}`;
  await fbPut(`/mensajes/${id}/${key}`, data);
  mostrarResultado(id, data, timestamp);
});

$('#toggleAdmin').addEventListener('click', () => {
  const main = $('#mainView');
  const admin = $('#adminView');
  const toggle = main.classList.toggle('hidden');
  admin.classList.toggle('hidden', !toggle);
  if (!admin.classList.contains('hidden')) cargarAdmin();
});

$('#refreshAdmin').addEventListener('click', cargarAdmin);

$('#searchId').addEventListener('input', (e) => {
  clearTimeout(window._searchTimer);
  window._searchTimer = setTimeout(cargarAdmin, 400);
});

/* ---------- INIT ---------- */
function init() {
  const id = obtenerId();
  const banner = $('#idBanner');

  if (id) {
    banner.textContent = `📨 ID: ${id}`;
    banner.classList.remove('empty');
  } else {
    banner.textContent = '⚠️ No se recibió ID. Agrega ?id=573001234567 a la URL.';
    banner.classList.add('empty');
  }

  renderForm();
}

init();
