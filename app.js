const FIREBASE_URL = 'https://app-store-88307-default-rtdb.firebaseio.com';

const CAMPOS = [
  { id: 'nombre', label: 'Nombre completo', type: 'text', required: true },
  { id: 'correo', label: 'Correo electrónico', type: 'email', required: true },
  { id: 'telefono', label: 'Teléfono', type: 'tel', required: false },
  { id: 'mensaje', label: 'Mensaje', type: 'textarea', required: false }
];

function $(sel) { return document.querySelector(sel); }

function fechaLocal() {
  return new Date().toLocaleString('es-CO', {
    timeZone: 'America/Bogota',
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit'
  });
}

async function fbPut(path, data) {
  const r = await fetch(`${FIREBASE_URL}${path}.json`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  return r.json();
}

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

function mostrarResultado(timestamp) {
  const card = $('#resultCard');
  $('#resultMsg').textContent = `Registrado el ${timestamp}`;
  $('#formDatos').reset();
  card.classList.remove('hidden');
  card.scrollIntoView({ behavior: 'smooth' });
}

$('#formDatos').addEventListener('submit', async (e) => {
  e.preventDefault();

  const params = new URLSearchParams(window.location.search);
  const id = params.get('id');

  if (!id) {
    alert('Error: ID no encontrado en la URL.');
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
  mostrarResultado(timestamp);
});

renderForm();
