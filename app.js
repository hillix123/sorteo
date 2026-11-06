// ====== Sorteo RepsolPeru - app.js ======
// Guarda los participantes en localStorage del navegador.

const CLAVE_STORAGE = 'sorteo_repsolperu_participantes';

// ---------- Utilidades ----------
function obtenerParticipantes() {
  const datos = localStorage.getItem(CLAVE_STORAGE);
  return datos ? JSON.parse(datos) : [];
}

function guardarParticipantes(lista) {
  localStorage.setItem(CLAVE_STORAGE, JSON.stringify(lista));
}

function generarCodigo() {
  const letras = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let codigo = '';
  for (let i = 0; i < 6; i++) {
    codigo += letras[Math.floor(Math.random() * letras.length)];
  }
  return codigo;
}

function escaparHTML(texto) {
  const div = document.createElement('div');
  div.textContent = texto ?? '';
  return div.innerHTML;
}

// ---------- Cambio de vista (registro / admin) ----------
function mostrarVista() {
  const esAdmin = location.hash === '#admin';
  document.getElementById('vista-registro').classList.toggle('oculto', esAdmin);
  document.getElementById('vista-admin').classList.toggle('oculto', !esAdmin);
  if (esAdmin) {
    actualizarPanelAdmin();
  }
}

window.addEventListener('hashchange', mostrarVista);

// ---------- Formulario de registro ----------
const formulario = document.getElementById('formulario');
const mensaje = document.getElementById('mensaje');
const exito = document.getElementById('exito');
const codigoEl = document.getElementById('codigo');

formulario.addEventListener('submit', function (e) {
  e.preventDefault();

  const datos = new FormData(formulario);
  const nombre = (datos.get('nombre') || '').trim();
  const telefono = (datos.get('telefono') || '').trim();
  const correo = (datos.get('correo') || '').trim();
  const acepto = datos.get('acepto');

  if (!nombre || !telefono || !correo) {
    mensaje.textContent = 'Por favor completa los campos obligatorios (*).';
    mensaje.style.color = '#e05d5d';
    return;
  }
  if (!acepto) {
    mensaje.textContent = 'Debes aceptar el uso de tus datos para participar.';
    mensaje.style.color = '#e05d5d';
    return;
  }

  const participante = {
    codigo: generarCodigo(),
    fecha: new Date().toLocaleString('es-PE'),
    nombre,
    telefono,
    correo,
    distrito: (datos.get('distrito') || '').trim(),
    edad: (datos.get('edad') || '').trim(),
    producto: (datos.get('producto') || '').trim(),
    compra: (datos.get('compra') || '').trim(),
    comentarios: (datos.get('comentarios') || '').trim()
  };

  const lista = obtenerParticipantes();
  lista.push(participante);
  guardarParticipantes(lista);

  codigoEl.textContent = participante.codigo;
  formulario.classList.add('oculto');
  exito.classList.remove('oculto');
  mensaje.textContent = '';
});

document.getElementById('otra').addEventListener('click', function () {
  formulario.reset();
  formulario.classList.remove('oculto');
  exito.classList.add('oculto');
});

// ---------- Panel admin ----------
function actualizarPanelAdmin() {
  const lista = obtenerParticipantes();
  document.getElementById('total').textContent = lista.length;

  const filas = document.getElementById('filas');
  filas.innerHTML = '';

  lista.forEach(function (p) {
    const fila = document.createElement('tr');
    fila.innerHTML =
      '<td>' + escaparHTML(p.codigo) + '</td>' +
      '<td>' + escaparHTML(p.fecha) + '</td>' +
      '<td>' + escaparHTML(p.nombre) + '</td>' +
      '<td>' + escaparHTML(p.telefono) + '</td>' +
      '<td>' + escaparHTML(p.correo) + '</td>' +
      '<td>' + escaparHTML(p.distrito) + '</td>' +
      '<td>' + escaparHTML(p.edad) + '</td>' +
      '<td>' + escaparHTML(p.producto) + '</td>' +
      '<td>' + escaparHTML(p.compra) + '</td>' +
      '<td></td>' +
      '<td>' + escaparHTML(p.comentarios) + '</td>';
    filas.appendChild(fila);
  });
}

document.getElementById('volver').addEventListener('click', function (e) {
  e.preventDefault();
  location.hash = '';
});

// ---------- Descargar CSV ----------
document.getElementById('btn-csv').addEventListener('click', function () {
  const lista = obtenerParticipantes();
  if (lista.length === 0) {
    alert('No hay participantes todavía.');
    return;
  }

  const encabezados = ['Código', 'Fecha', 'Nombre', 'Teléfono', 'Correo', 'Distrito', 'Edad', 'Producto', 'Frecuencia de compra', 'Comentarios'];
  const filasCSV = lista.map(function (p) {
    return [p.codigo, p.fecha, p.nombre, p.telefono, p.correo, p.distrito, p.edad, p.producto, p.compra, p.comentarios]
      .map(function (valor) {
        const texto = String(valor ?? '').replace(/"/g, '""');
        return '"' + texto + '"';
      })
      .join(',');
  });

  const contenido = [encabezados.join(','), ...filasCSV].join('\n');
  const blob = new Blob(['\uFEFF' + contenido], { type: 'text/csv;charset=utf-8;' });
  descargarArchivo(blob, 'participantes_sorteo.csv');
});

// ---------- Respaldo JSON ----------
document.getElementById('btn-json').addEventListener('click', function () {
  const lista = obtenerParticipantes();
  const blob = new Blob([JSON.stringify(lista, null, 2)], { type: 'application/json' });
  descargarArchivo(blob, 'respaldo_sorteo.json');
});

function descargarArchivo(blob, nombreArchivo) {
  const url = URL.createObjectURL(blob);
  const enlace = document.createElement('a');
  enlace.href = url;
  enlace.download = nombreArchivo;
  document.body.appendChild(enlace);
  enlace.click();
  document.body.removeChild(enlace);
  URL.revokeObjectURL(url);
}

// ---------- Restaurar respaldo ----------
document.getElementById('btn-importar').addEventListener('click', function () {
  document.getElementById('archivo').click();
});

document.getElementById('archivo').addEventListener('change', function (e) {
  const archivo = e.target.files[0];
  if (!archivo) return;

  const lector = new FileReader();
  lector.onload = function (evento) {
    try {
      const lista = JSON.parse(evento.target.result);
      if (!Array.isArray(lista)) throw new Error('Formato inválido');
      guardarParticipantes(lista);
      actualizarPanelAdmin();
      alert('Respaldo restaurado correctamente.');
    } catch (error) {
      alert('El archivo no es un respaldo válido.');
    }
  };
  lector.readAsText(archivo);
  e.target.value = '';
});

// ---------- Borrar todo ----------
document.getElementById('btn-borrar').addEventListener('click', function () {
  if (confirm('¿Seguro que quieres borrar a todos los participantes? Esta acción no se puede deshacer.')) {
    localStorage.removeItem(CLAVE_STORAGE);
    actualizarPanelAdmin();
  }
});

// ---------- Sorteo de ganadores ----------
document.getElementById('btn-sortear').addEventListener('click', function () {
  const lista = obtenerParticipantes();
  const cantidad = parseInt(document.getElementById('cuantos').value, 10) || 1;

  if (lista.length === 0) {
    alert('No hay participantes para sortear.');
    return;
  }

  const copia = [...lista];
  const ganadores = [];
  const total = Math.min(cantidad, copia.length);

  for (let i = 0; i < total; i++) {
    const indice = Math.floor(Math.random() * copia.length);
    ganadores.push(copia[indice]);
    copia.splice(indice, 1);
  }

  const listaGanadores = document.getElementById('ganadores');
  listaGanadores.innerHTML = '';
  ganadores.forEach(function (g) {
    const li = document.createElement('li');
    li.textContent = g.nombre + ' — código ' + g.codigo + ' (' + g.telefono + ')';
    listaGanadores.appendChild(li);
  });
});

// ---------- Inicio ----------
mostrarVista();