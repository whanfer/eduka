
const FIREBASE_CONFIG = {
    apiKey:            "AIzaSyBGu1IppDuR3kjxzZGPbH2fKNWDVM-Oq6Y",
    authDomain:        "eduka-714a5.firebaseapp.com",
    projectId:         "eduka-714a5",
    storageBucket:     "eduka-714a5.firebasestorage.app",
    messagingSenderId: "199320773966",
    appId:             "1:199320773966:web:06e5dab9dfebd8c87daa1f",
    measurementId:     "G-7R9MYKNE8W"
};

// WhatsApp de la profe
const WHATSAPP_NUMBER = '573107102757';

// Credenciales de administración
const ADMIN_CREDENTIALS = {
    user: 'profe',
    pass: 'eduka2024'
};

// Ubicación
const LOCATION_CONFIG = {
    direccion:        'Calle 100A #58-14, Apartadó, Antioquia',
    telefono:         '310 710 2757',
    email:            'profe@eduka.com',
    latitud:          7.8760,
    longitud:         -76.6118,
    googleMapsApiKey: ''
};

// ============================================
// FIREBASE - INICIALIZACIÓN
// ============================================

import { initializeApp }                                          from 'https://www.gstatic.com/firebasejs/12.10.0/firebase-app.js';
import { getFirestore, collection, doc, addDoc,
         getDocs, updateDoc, deleteDoc, onSnapshot,
         query, orderBy }                                         from 'https://www.gstatic.com/firebasejs/12.10.0/firebase-firestore.js';

let db;
let unsubscribeStudents = null;

function initFirebase() {
    if (FIREBASE_CONFIG.apiKey === 'TU_API_KEY') {
        console.warn('⚠️ Firebase no configurado. Usando modo local (localStorage).');
        return false;
    }
    try {
        const app = initializeApp(FIREBASE_CONFIG);
        db = getFirestore(app);
        console.log('✅ Firebase conectado correctamente.');
        return true;
    } catch (e) {
        console.error('❌ Error iniciando Firebase:', e);
        return false;
    }
}

const FIREBASE_ACTIVO = initFirebase();

// ============================================
// ESTADO GLOBAL
// ============================================

let students = [];
let isLoading = false;

// ============================================
// MENÚ HAMBURGUESA
// ============================================

const hamburger  = document.getElementById('hamburger');
const navMenu    = document.getElementById('navMenu');
const navOverlay = document.getElementById('navOverlay');
const navLinks   = document.querySelectorAll('.nav-menu a');

function toggleMenu() {
    hamburger.classList.toggle('active');
    navMenu.classList.toggle('active');
    navOverlay.classList.toggle('active');
    document.body.style.overflow = navMenu.classList.contains('active') ? 'hidden' : '';
}

function closeMenu() {
    hamburger.classList.remove('active');
    navMenu.classList.remove('active');
    navOverlay.classList.remove('active');
    document.body.style.overflow = '';
}

hamburger.addEventListener('click', toggleMenu);
navOverlay.addEventListener('click', closeMenu);
navLinks.forEach(link => link.addEventListener('click', closeMenu));

// ============================================
// FIREBASE - CRUD ESTUDIANTES
// ============================================

async function loadStudentsFromDB() {
    if (!FIREBASE_ACTIVO) {
        students = JSON.parse(localStorage.getItem('edukaStudents')) || [];
        return;
    }
    try {
        isLoading = true;
        const snap = await getDocs(query(collection(db, 'students'), orderBy('fechaRegistro', 'desc')));
        students = snap.docs.map(d => ({ _docId: d.id, ...d.data() }));
        localStorage.setItem('edukaStudents', JSON.stringify(students));
    } catch (e) {
        console.error('Error cargando desde Firebase:', e);
        students = JSON.parse(localStorage.getItem('edukaStudents')) || [];
    } finally {
        isLoading = false;
    }
}

function suscribirEstudiantesEnTiempoReal() {
    if (!FIREBASE_ACTIVO) return;
    if (unsubscribeStudents) unsubscribeStudents();
    const q = query(collection(db, 'students'), orderBy('fechaRegistro', 'desc'));
    unsubscribeStudents = onSnapshot(q, (snap) => {
        students = snap.docs.map(d => ({ _docId: d.id, ...d.data() }));
        localStorage.setItem('edukaStudents', JSON.stringify(students));
        loadStudents();
    }, (err) => {
        console.error('Error en listener en tiempo real:', err);
    });
}

async function saveStudentToDB(student) {
    if (!FIREBASE_ACTIVO) {
        students.push(student);
        localStorage.setItem('edukaStudents', JSON.stringify(students));
        return student;
    }
    try {
        const docRef = await addDoc(collection(db, 'students'), student);
        student._docId = docRef.id;
        return student;
    } catch (e) {
        console.error('Error guardando en Firebase:', e);
        students.push(student);
        localStorage.setItem('edukaStudents', JSON.stringify(students));
        return student;
    }
}

async function updateStudentInDB(id, updates) {
    const student = students.find(s => s.id === id);
    if (!student) return;
    Object.assign(student, updates);
    if (!FIREBASE_ACTIVO || !student._docId) {
        localStorage.setItem('edukaStudents', JSON.stringify(students));
        return;
    }
    try {
        await updateDoc(doc(db, 'students', student._docId), updates);
    } catch (e) {
        console.error('Error actualizando en Firebase:', e);
        localStorage.setItem('edukaStudents', JSON.stringify(students));
    }
}

async function deleteStudentFromDB(id) {
    const student = students.find(s => s.id === id);
    if (!student) return;
    students = students.filter(s => s.id !== id);
    if (!FIREBASE_ACTIVO || !student._docId) {
        localStorage.setItem('edukaStudents', JSON.stringify(students));
        return;
    }
    try {
        await deleteDoc(doc(db, 'students', student._docId));
    } catch (e) {
        console.error('Error eliminando de Firebase:', e);
        localStorage.setItem('edukaStudents', JSON.stringify(students));
    }
}

// ============================================
// FORMULARIO DE REGISTRO
// ============================================

document.getElementById('registrationForm').addEventListener('submit', async function(e) {
    e.preventDefault();

    const planSeleccionado = this.querySelector('input[name="plan"]:checked');
    if (!planSeleccionado) {
        alert('⚠️ Por favor selecciona un plan de pago.');
        return;
    }
    const planValor  = planSeleccionado.value;
    const planPrecio = planValor === 'quincenal' ? '$50.000/quincenal' : '$100.000/mes';

    const studentData = {
        id:              Date.now(),
        nombre:          this.querySelector('input[type="text"]').value,
        edad:            this.querySelector('input[type="number"]').value,
        padre:           this.querySelectorAll('input[type="text"]')[1].value,
        telefono:        this.querySelector('input[type="tel"]').value,
        email:           this.querySelector('input[type="email"]').value,
        plan:            planValor,
        planPrecio:      planPrecio,
        dificultades:    document.getElementById('dificultades').value.trim() || 'Ninguna indicada',
        status:          'pending',
        fechaRegistro:   new Date().toLocaleDateString('es-ES'),
        fechaActivacion: '',
        clasesAsistidas: 0
    };

    const submitBtn    = this.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '⏳ Enviando...';
    submitBtn.disabled  = true;

    await saveStudentToDB(studentData);

    const mensaje =
`¡Hola Profe Jennifer! 👋

Nueva inscripción en EDUKA:

👤 *Estudiante:* ${studentData.nombre}
🎂 *Edad:* ${studentData.edad} años
👨‍👩‍👧 *Padre/Madre:* ${studentData.padre}
📱 *Teléfono:* ${studentData.telefono}
📧 *Email:* ${studentData.email}
💰 *Plan elegido:* ${planValor.charAt(0).toUpperCase() + planValor.slice(1)} — ${planPrecio}
💬 *Dificultades:* ${studentData.dificultades}
📅 *Fecha de registro:* ${studentData.fechaRegistro}

¿Me podrías confirmar disponibilidad? 🙏`;

    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(mensaje)}`, '_blank');
    alert('✅ ¡Registro exitoso!\n\nTu información ha sido enviada.\nEl estudiante quedará pendiente hasta confirmar el pago.');

    this.reset();
    document.querySelectorAll('.plan-option-box').forEach(b => b.classList.remove('selected'));
    submitBtn.innerHTML = originalText;
    submitBtn.disabled  = false;

    if (!FIREBASE_ACTIVO) loadStudents();
});

// ============================================
// PANEL DE ADMINISTRACIÓN
// ============================================

function adminLogin() {
    const user = document.getElementById('adminUser').value;
    const pass = document.getElementById('adminPass').value;

    if (user === ADMIN_CREDENTIALS.user && pass === ADMIN_CREDENTIALS.pass) {
        document.getElementById('adminLogin').style.display = 'none';
        document.getElementById('adminPanel').classList.add('active');
        mostrarIndicadorFirebase();
        if (FIREBASE_ACTIVO) {
            suscribirEstudiantesEnTiempoReal();
        } else {
            loadStudentsFromDB().then(() => { loadStudents(); renderDashboard(); });
        }
    } else {
        alert('❌ Usuario o contraseña incorrectos');
    }
}

function adminLogout() {
    if (unsubscribeStudents) { unsubscribeStudents(); unsubscribeStudents = null; }
    document.getElementById('adminLogin').style.display = 'block';
    document.getElementById('adminPanel').classList.remove('active');
    document.getElementById('adminUser').value = '';
    document.getElementById('adminPass').value = '';
}

function mostrarIndicadorFirebase() {
    if (document.getElementById('firebaseIndicador')) return;
    const indicador = document.createElement('div');
    indicador.id        = 'firebaseIndicador';
    indicador.className = FIREBASE_ACTIVO ? 'fb-indicador fb-activo' : 'fb-indicador fb-local';
    indicador.innerHTML = FIREBASE_ACTIVO
        ? '🔥 Firebase activo — datos en tiempo real en todos los dispositivos'
        : '💾 Modo local — configura Firebase para sincronizar entre dispositivos';
    document.getElementById('adminPanel').insertBefore(indicador, document.getElementById('adminPanel').firstChild);
}

function showTab(tab) {
    document.querySelectorAll('.admin-tab').forEach(t => t.classList.remove('active'));
    event.target.classList.add('active');
    document.querySelectorAll('.admin-content').forEach(c => c.classList.remove('active'));
    if      (tab === 'dashboard') { document.getElementById('dashboardContent').classList.add('active'); renderDashboard(); }
    else if (tab === 'pending')   { document.getElementById('pendingContent').classList.add('active'); }
    else if (tab === 'active')    { document.getElementById('activeContent').classList.add('active'); }
    else if (tab === 'lista')     { document.getElementById('listaContent').classList.add('active'); renderLista(); }
}

// ============================================
// UTILIDADES DE PAGO
// ============================================

function parseFechaES(fechaStr) {
    // Convierte "dd/mm/yyyy" a Date
    if (!fechaStr) return null;
    const [d, m, y] = fechaStr.split('/');
    return new Date(+y, +m - 1, +d);
}

function calcularProximoPago(student) {
    const fechaActivacion = parseFechaES(student.fechaActivacion);
    if (!fechaActivacion) return null;

    const ciclo     = student.plan === 'quincenal' ? 15 : 30;
    const hoy       = new Date();
    hoy.setHours(0, 0, 0, 0);

    // Avanzar ciclos hasta encontrar el próximo pago futuro o de hoy
    let proximoPago = new Date(fechaActivacion);
    while (proximoPago <= hoy) {
        proximoPago = new Date(proximoPago.getTime() + ciclo * 24 * 60 * 60 * 1000);
    }

    const diasRestantes = Math.round((proximoPago - hoy) / (1000 * 60 * 60 * 24));
    return { proximoPago, diasRestantes };
}

function badgePago(student) {
    const info = calcularProximoPago(student);
    if (!info) return '';
    const { diasRestantes, proximoPago } = info;
    const fechaStr = proximoPago.toLocaleDateString('es-ES', { day:'2-digit', month:'2-digit', year:'numeric' });

    if (diasRestantes <= 0) {
        return `<div class="pago-badge pago-vencido">🚨 Pago vencido — ${fechaStr}</div>`;
    } else if (diasRestantes <= 2) {
        return `<div class="pago-badge pago-urgente">⚠️ Paga en ${diasRestantes} día${diasRestantes>1?'s':''} — ${fechaStr}</div>`;
    } else if (diasRestantes <= 5) {
        return `<div class="pago-badge pago-proximo">📅 Paga en ${diasRestantes} días — ${fechaStr}</div>`;
    } else {
        return `<div class="pago-badge pago-ok">✅ Próximo pago en ${diasRestantes} días — ${fechaStr}</div>`;
    }
}

function cardUrgente(student) {
    const info = calcularProximoPago(student);
    if (!info) return false;
    return info.diasRestantes <= 2;
}

// ============================================
// DASHBOARD
// ============================================

function renderDashboard() {
    const activos   = students.filter(s => s.status === 'active');
    const pendientes = students.filter(s => s.status === 'pending');
    const grid      = document.getElementById('dashboardGrid');

    // ── Calcular ganancias del mes actual ─────────────────────────
    const hoy     = new Date();
    const mesNom  = hoy.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
    const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
    const finMes    = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0);

    let gananciasMes   = 0;
    let estudiantesPagan = 0;
    let urgentes       = 0;
    let vencidos       = 0;

    const pagosMes = []; // lista de estudiantes que pagan este mes

    activos.forEach(s => {
        const fechaAct = parseFechaES(s.fechaActivacion);
        if (!fechaAct) return;

        const ciclo   = s.plan === 'quincenal' ? 15 : 30;
        const precio  = s.plan === 'quincenal' ? 50000 : 100000;

        // Contar cuántos pagos caen en este mes
        let fecha = new Date(fechaAct);
        let pagosEsteMes = 0;
        // Avanzar hasta inicio del mes
        while (fecha < inicioMes) fecha = new Date(fecha.getTime() + ciclo * 24*60*60*1000);
        // Contar pagos dentro del mes
        let fechaCopia = new Date(fecha);
        while (fechaCopia <= finMes) {
            pagosEsteMes++;
            fechaCopia = new Date(fechaCopia.getTime() + ciclo * 24*60*60*1000);
        }

        if (pagosEsteMes > 0) {
            gananciasMes += pagosEsteMes * precio;
            estudiantesPagan++;
            pagosMes.push({ student: s, pagos: pagosEsteMes, subtotal: pagosEsteMes * precio });
        }

        // Urgentes
        const info = calcularProximoPago(s);
        if (info) {
            if (info.diasRestantes <= 0)  vencidos++;
            else if (info.diasRestantes <= 2) urgentes++;
        }
    });

    // ── Render ────────────────────────────────────────────────────
    grid.innerHTML = `
        <!-- Tarjetas resumen -->
        <div class="dash-cards">
            <div class="dash-card dash-green">
                <div class="dash-card-icon">💰</div>
                <div class="dash-card-info">
                    <div class="dash-card-valor">$${gananciasMes.toLocaleString('es-CO')}</div>
                    <div class="dash-card-label">Ganancias estimadas ${mesNom}</div>
                </div>
            </div>
            <div class="dash-card dash-blue">
                <div class="dash-card-icon">👧</div>
                <div class="dash-card-info">
                    <div class="dash-card-valor">${activos.length}</div>
                    <div class="dash-card-label">Estudiantes activos</div>
                </div>
            </div>
            <div class="dash-card dash-orange">
                <div class="dash-card-icon">⏳</div>
                <div class="dash-card-info">
                    <div class="dash-card-valor">${pendientes.length}</div>
                    <div class="dash-card-label">Pendientes de activar</div>
                </div>
            </div>
            <div class="dash-card ${urgentes + vencidos > 0 ? 'dash-red' : 'dash-gray'}">
                <div class="dash-card-icon">${vencidos > 0 ? '🚨' : urgentes > 0 ? '⚠️' : '✅'}</div>
                <div class="dash-card-info">
                    <div class="dash-card-valor">${urgentes + vencidos}</div>
                    <div class="dash-card-label">${vencidos > 0 ? 'Pagos vencidos' : 'Pagan en ≤2 días'}</div>
                </div>
            </div>
        </div>

        <!-- Detalle pagos del mes -->
        <div class="dash-seccion">
            <h3 class="dash-titulo">📅 Pagos esperados en ${mesNom}</h3>
            ${pagosMes.length === 0
                ? `<div class="empty-state"><div class="empty-state-icon">📭</div><p>No hay pagos proyectados este mes.</p></div>`
                : `<div class="dash-tabla-wrapper">
                    <table class="dash-tabla">
                        <thead>
                            <tr>
                                <th>Estudiante</th>
                                <th>Plan</th>
                                <th>Pagos en el mes</th>
                                <th>Subtotal</th>
                                <th>Próximo pago</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${pagosMes.map(({ student: s, pagos, subtotal }) => {
                                const info = calcularProximoPago(s);
                                const diasR = info ? info.diasRestantes : '—';
                                const urgClass = diasR <= 0 ? 'dash-fila-vencida' : diasR <= 2 ? 'dash-fila-urgente' : '';
                                return `<tr class="${urgClass}">
                                    <td><strong>${s.nombre}</strong></td>
                                    <td>${s.plan === 'quincenal' ? '📅 Quincenal' : '⭐ Mensual'}</td>
                                    <td style="text-align:center">${pagos}x</td>
                                    <td><strong>$${subtotal.toLocaleString('es-CO')}</strong></td>
                                    <td>${diasR <= 0 ? '<span style="color:#C62828;font-weight:700">🚨 Vencido</span>'
                                           : diasR <= 2 ? `<span style="color:#E65100;font-weight:700">⚠️ En ${diasR} día${diasR>1?'s':''}</span>`
                                           : `En ${diasR} días`}</td>
                                </tr>`;
                            }).join('')}
                        </tbody>
                        <tfoot>
                            <tr class="dash-total-row">
                                <td colspan="3"><strong>TOTAL ESTIMADO</strong></td>
                                <td colspan="2"><strong>$${gananciasMes.toLocaleString('es-CO')}</strong></td>
                            </tr>
                        </tfoot>
                    </table>
                </div>`
            }
        </div>

        <!-- Alertas de cobro -->
        ${urgentes + vencidos > 0 ? `
        <div class="dash-seccion">
            <h3 class="dash-titulo alerta-titulo">🚨 Cobros urgentes</h3>
            <div class="dash-alertas">
                ${activos.filter(s => {
                    const i = calcularProximoPago(s);
                    return i && i.diasRestantes <= 2;
                }).map(s => {
                    const info = calcularProximoPago(s);
                    return `<div class="alerta-card">
                        <div class="alerta-nombre">👤 ${s.nombre}</div>
                        <div class="alerta-info">${s.plan === 'quincenal' ? '📅 Quincenal $50.000' : '⭐ Mensual $100.000'}</div>
                        <div class="alerta-dias ${info.diasRestantes <= 0 ? 'alerta-vencida' : 'alerta-urgente'}">
                            ${info.diasRestantes <= 0 ? '🚨 VENCIDO' : `⏰ Vence en ${info.diasRestantes} día${info.diasRestantes>1?'s':''}`}
                        </div>
                        <button class="action-btn btn-whatsapp" style="margin-top:10px;width:100%" onclick="contactWhatsApp('${s.telefono}','${s.nombre}')">
                            💬 Cobrar por WhatsApp
                        </button>
                    </div>`;
                }).join('')}
            </div>
        </div>` : ''}
    `;
}

// ============================================
// CARGA DE ESTUDIANTES
// ============================================

function loadStudents() {
    const pendingGrid      = document.getElementById('pendingStudentsGrid');
    const activeAdminGrid  = document.getElementById('activeStudentsAdminGrid');
    const activePublicGrid = document.getElementById('activeStudentsGrid');

    const pendingStudents = students.filter(s => s.status === 'pending');
    const activeStudents  = students.filter(s => s.status === 'active');

    // ── Pendientes ─────────────────────────────────────────────────
    pendingGrid.innerHTML = pendingStudents.length === 0
        ? `<div class="empty-state"><div class="empty-state-icon">⏳</div><p>No hay estudiantes pendientes.</p></div>`
        : pendingStudents.map(s => `
            <div class="student-card">
                <div class="student-header">
                    <div class="student-info">
                        <h3>👤 ${s.nombre}</h3>
                        <p>🎂 ${s.edad} años &nbsp;|&nbsp; 👨‍👩‍👧 ${s.padre}</p>
                        <p>📱 ${s.telefono} &nbsp;|&nbsp; 📧 ${s.email}</p>
                        <p>💰 <strong>${s.plan ? s.plan.charAt(0).toUpperCase()+s.plan.slice(1) : '—'}</strong> ${s.planPrecio ? '· '+s.planPrecio : ''}</p>
                        ${s.dificultades && s.dificultades !== 'Ninguna indicada'
                            ? `<div class="dificultad-box">💬 <strong>Dificultades:</strong> ${s.dificultades}</div>` : ''}
                        <p>📅 ${s.fechaRegistro}</p>
                    </div>
                    <span class="status-badge status-pending">⏳ Pendiente</span>
                </div>
                <div class="student-actions">
                    <button class="action-btn btn-whatsapp" onclick="contactWhatsApp('${s.telefono}','${s.nombre}')">💬 WhatsApp</button>
                    <button class="action-btn btn-activate" onclick="activateStudent(${s.id})">✅ Activar Plan</button>
                    <button class="action-btn btn-delete" onclick="deleteStudent(${s.id})">🗑️ Eliminar</button>
                </div>
            </div>`).join('');

    // ── Activos (admin) ─────────────────────────────────────────────
    activeAdminGrid.innerHTML = activeStudents.length === 0
        ? `<div class="empty-state"><div class="empty-state-icon">✅</div><p>No hay estudiantes activos.</p></div>`
        : activeStudents.map(s => {
            const urgente = cardUrgente(s);
            return `
            <div class="student-card ${urgente ? 'card-pago-urgente' : ''}">
                <div class="student-header">
                    <div class="student-info">
                        <h3>👤 ${s.nombre} ${urgente ? '🔴' : ''}</h3>
                        <p>🎂 ${s.edad} años &nbsp;|&nbsp; 👨‍👩‍👧 ${s.padre}</p>
                        <p>📱 ${s.telefono} &nbsp;|&nbsp; 📧 ${s.email}</p>
                        <p>💰 <strong>${s.plan ? s.plan.charAt(0).toUpperCase()+s.plan.slice(1) : '—'}</strong> ${s.planPrecio ? '· '+s.planPrecio : ''}</p>
                        ${s.dificultades && s.dificultades !== 'Ninguna indicada'
                            ? `<div class="dificultad-box">💬 <strong>Dificultades:</strong> ${s.dificultades}</div>` : ''}
                        <p>📅 Activado: ${s.fechaActivacion} &nbsp;|&nbsp; 🏫 Clases: <strong>${s.clasesAsistidas || 0}</strong></p>
                    </div>
                    <span class="status-badge status-active">✅ Activo</span>
                </div>
                ${badgePago(s)}
                <div class="student-actions">
                    <button class="action-btn btn-whatsapp" onclick="contactWhatsApp('${s.telefono}','${s.nombre}')">💬 WhatsApp</button>
                    <button class="action-btn btn-delete" onclick="deleteStudent(${s.id})">🗑️ Eliminar</button>
                </div>
            </div>`;
        }).join('');

    // ── Activos (público) ───────────────────────────────────────────
    activePublicGrid.innerHTML = activeStudents.length === 0
        ? `<div class="empty-state"><div class="empty-state-icon">📚</div><p>Aún no hay estudiantes activos.</p></div>`
        : activeStudents.map(s => `
            <div class="student-card">
                <div class="student-header">
                    <div class="student-info">
                        <h3>🌟 ${s.nombre}</h3>
                        <p>🎂 ${s.edad} años</p>
                        <p>📅 Estudiante desde: ${s.fechaActivacion}</p>
                    </div>
                    <span class="status-badge status-active">✅ Activo</span>
                </div>
            </div>`).join('');

    updateCounts();

    // Refrescar dashboard si está visible
    const dashContent = document.getElementById('dashboardContent');
    if (dashContent && dashContent.classList.contains('active')) renderDashboard();
}

function updateCounts() {
    document.getElementById('pendingCount').textContent = students.filter(s => s.status === 'pending').length;
    document.getElementById('activeCount').textContent  = students.filter(s => s.status === 'active').length;
}

async function activateStudent(id) {
    if (confirm('¿Confirmar que el pago fue realizado y activar el plan del estudiante?')) {
        await updateStudentInDB(id, { status: 'active', fechaActivacion: new Date().toLocaleDateString('es-ES') });
        if (!FIREBASE_ACTIVO) loadStudents();
        alert('✅ ¡Estudiante activado exitosamente!');
    }
}

async function deleteStudent(id) {
    if (confirm('¿Estás segura de que quieres eliminar este estudiante?')) {
        await deleteStudentFromDB(id);
        if (!FIREBASE_ACTIVO) loadStudents();
    }
}

function contactWhatsApp(phone, name) {
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(`Hola, me comunico respecto a la inscripción de *${name}* en EDUKA.`)}`, '_blank');
}

// ============================================
// LLAMADO A LISTA
// ============================================

function renderLista() {
    const activos = students.filter(s => s.status === 'active');
    const tbody   = document.getElementById('listaCuerpo');
    const vacia   = document.getElementById('listaVacia');
    const wrapper = document.getElementById('listaTablaWrapper');

    const hoy = new Date().toLocaleDateString('es-ES', { weekday:'long', year:'numeric', month:'long', day:'numeric' });
    document.getElementById('listaFechaHoy').textContent = hoy;

    if (activos.length === 0) {
        vacia.style.display   = 'block';
        wrapper.style.display = 'none';
        return;
    }
    vacia.style.display   = 'none';
    wrapper.style.display = 'block';

    const fechaKey    = new Date().toLocaleDateString('es-ES');
    const historial   = JSON.parse(localStorage.getItem('edukaListaHistorial')) || {};
    const hoyRegistro = historial[fechaKey] || {};

    const notaOpts = (val) => ['Excelente','Muy Bueno','Bueno','Regular','Necesita Mejorar']
        .map(n => `<option value="${n}" ${val===n?'selected':''}>${n}</option>`).join('');

    tbody.innerHTML = activos.map(s => {
        const reg   = hoyRegistro[s.id] || {};
        const asist = reg.asistio !== undefined ? reg.asistio : false;
        return `
        <tr class="lista-fila ${asist?'fila-presente':'fila-ausente'}" id="fila-${s.id}">
            <td class="col-nombre">
                <div class="lista-nombre">
                    <span class="lista-avatar">🌟</span>
                    <div><strong>${s.nombre}</strong><small>${s.edad} años</small></div>
                </div>
            </td>
            <td class="col-asistencia">
                <label class="toggle-asistencia">
                    <input type="checkbox" id="asist-${s.id}" ${asist?'checked':''}
                        onchange="toggleAsistencia(${s.id}, this.checked)">
                    <span class="toggle-slider"></span>
                </label>
                <span class="asist-label" id="asist-label-${s.id}">${asist?'✅ Presente':'❌ Ausente'}</span>
            </td>
            <td class="col-nota">
                <select class="nota-select nota-comportamiento" id="comp-${s.id}">
                    <option value="">-- Nota --</option>${notaOpts(reg.comportamiento||'')}
                </select>
            </td>
            <td class="col-nota">
                <select class="nota-select nota-actividades" id="activ-${s.id}">
                    <option value="">-- Nota --</option>${notaOpts(reg.actividades||'')}
                </select>
            </td>
            <td class="col-clases">
                <div class="clases-badge">
                    <span class="clases-numero" id="clases-${s.id}">${s.clasesAsistidas||0}</span>
                    <span class="clases-texto">clases</span>
                </div>
            </td>
        </tr>`;
    }).join('');
}

function toggleAsistencia(id, presente) {
    document.getElementById(`fila-${id}`).classList.toggle('fila-presente', presente);
    document.getElementById(`fila-${id}`).classList.toggle('fila-ausente', !presente);
    document.getElementById(`asist-label-${id}`).textContent = presente ? '✅ Presente' : '❌ Ausente';
}

async function guardarLista() {
    const activos = students.filter(s => s.status === 'active');
    if (activos.length === 0) return;

    const fechaKey  = new Date().toLocaleDateString('es-ES');
    const historial = JSON.parse(localStorage.getItem('edukaListaHistorial')) || {};
    const hoyReg    = historial[fechaKey] || {};

    for (const s of activos) {
        const asistio        = document.getElementById(`asist-${s.id}`)?.checked || false;
        const comportamiento = document.getElementById(`comp-${s.id}`)?.value || '';
        const actividades    = document.getElementById(`activ-${s.id}`)?.value || '';
        const yaContado      = hoyReg[s.id]?._contado;

        hoyReg[s.id] = { asistio, comportamiento, actividades, _contado: yaContado || asistio };

        if (asistio && !yaContado) {
            s.clasesAsistidas = (s.clasesAsistidas || 0) + 1;
            const el = document.getElementById(`clases-${s.id}`);
            if (el) el.textContent = s.clasesAsistidas;
            await updateStudentInDB(s.id, { clasesAsistidas: s.clasesAsistidas });
        }
    }

    historial[fechaKey] = hoyReg;
    localStorage.setItem('edukaListaHistorial', JSON.stringify(historial));

    const btn = document.querySelector('.btn-guardar-lista');
    const orig = btn.innerHTML;
    btn.innerHTML = '✅ ¡Lista Guardada!';
    btn.style.background = 'linear-gradient(135deg,#4CAF50,#388E3C)';
    setTimeout(() => { btn.innerHTML = orig; btn.style.background = ''; }, 2000);

    if (document.getElementById('historialPanel').style.display !== 'none') renderHistorial();
}

function toggleHistorial() {
    const panel = document.getElementById('historialPanel');
    panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
    if (panel.style.display === 'block') renderHistorial();
}

function renderHistorial() {
    const historial = JSON.parse(localStorage.getItem('edukaListaHistorial')) || {};
    const contenido = document.getElementById('historialContenido');
    const fechas    = Object.keys(historial).reverse();

    if (fechas.length === 0) {
        contenido.innerHTML = '<p style="color:#78909C;text-align:center;padding:20px;">Aún no hay registros guardados.</p>';
        return;
    }

    contenido.innerHTML = fechas.map(fecha => {
        const filas = Object.entries(historial[fecha]).map(([sid, datos]) => {
            const s = students.find(s => s.id == sid);
            if (!s) return '';
            return `<tr>
                <td>${s.nombre}</td>
                <td>${datos.asistio ? '✅ Presente' : '❌ Ausente'}</td>
                <td><span class="nota-chip ${notaColor(datos.comportamiento)}">${datos.comportamiento||'—'}</span></td>
                <td><span class="nota-chip ${notaColor(datos.actividades)}">${datos.actividades||'—'}</span></td>
                <td>${s.clasesAsistidas||0} clases</td>
            </tr>`;
        }).join('');
        return `
        <div class="historial-dia">
            <div class="historial-dia-header">📅 ${fecha}</div>
            <table class="historial-tabla">
                <thead><tr><th>Estudiante</th><th>Asistencia</th><th>Comportamiento</th><th>Actividades</th><th>Total Clases</th></tr></thead>
                <tbody>${filas}</tbody>
            </table>
        </div>`;
    }).join('');
}

function notaColor(nota) {
    return {'Excelente':'nota-excelente','Muy Bueno':'nota-muybueno','Bueno':'nota-bueno','Regular':'nota-regular','Necesita Mejorar':'nota-mejorar'}[nota]||'';
}

// ============================================
// ANIMACIONES Y EFECTOS
// ============================================

function createFloatingStars() {
    document.querySelectorAll('section').forEach(section => {
        for (let i = 0; i < 3; i++) {
            const star = document.createElement('span');
            star.className   = 'star-decoration';
            star.textContent = ['⭐','✨','🌟','💫'][Math.floor(Math.random()*4)];
            star.style.top   = Math.random()*100+'%';
            star.style.left  = Math.random()*100+'%';
            star.style.animationDelay = Math.random()*2+'s';
            section.appendChild(star);
        }
    });
}
createFloatingStars();

document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
});

const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity   = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, { threshold: 0.1, rootMargin: '0px 0px -100px 0px' });

document.querySelectorAll('.subject-card, .feature-card').forEach(card => {
    card.style.opacity    = '0';
    card.style.transform  = 'translateY(20px)';
    card.style.transition = 'all 0.6s ease-out';
    observer.observe(card);
});

window.addEventListener('resize', () => {
    if (window.innerWidth > 768 && navMenu.classList.contains('active')) closeMenu();
});

// ============================================
// UBICACIÓN
// ============================================

function initializeLocation() {
    const el = document.getElementById('direccion');
    if (el) el.innerHTML = LOCATION_CONFIG.direccion;
    const btn = document.getElementById('btnGoogleMaps');
    if (btn) btn.href = `https://www.google.com/maps/search/?api=1&query=${LOCATION_CONFIG.latitud},${LOCATION_CONFIG.longitud}`;
    if (LOCATION_CONFIG.googleMapsApiKey) initGoogleMaps();
}

function initGoogleMaps() {
    const s = document.createElement('script');
    s.src   = `https://maps.googleapis.com/maps/api/js?key=${LOCATION_CONFIG.googleMapsApiKey}&callback=displayMap`;
    s.async = s.defer = true;
    document.head.appendChild(s);
}

function displayMap() {
    const mapEl = document.getElementById('map');
    if (!mapEl) return;
    mapEl.innerHTML = '';
    mapEl.classList.remove('map-placeholder');
    const loc = { lat: LOCATION_CONFIG.latitud, lng: LOCATION_CONFIG.longitud };
    const map = new google.maps.Map(mapEl, { zoom: 16, center: loc });
    const marker = new google.maps.Marker({ position: loc, map, title: 'EDUKA - Profe Jennifer', animation: google.maps.Animation.DROP });
    const info = new google.maps.InfoWindow({ content: `<div style="padding:10px"><h3 style="color:#4CAF50">📚 EDUKA</h3><p>${LOCATION_CONFIG.direccion}</p><p>📱 ${LOCATION_CONFIG.telefono}</p></div>` });
    marker.addListener('click', () => info.open(map, marker));
    info.open(map, marker);
}

// ============================================
// INICIALIZACIÓN
// ============================================

window.addEventListener('load', async function() {
    await loadStudentsFromDB();
    loadStudents();
    updateCounts();
    initializeLocation();
});

// ============================================
// EXPONER FUNCIONES GLOBALES (requerido por type="module")
// ============================================

window.adminLogin        = adminLogin;
window.adminLogout       = adminLogout;
window.showTab           = showTab;
window.activateStudent   = activateStudent;
window.deleteStudent     = deleteStudent;
window.contactWhatsApp   = contactWhatsApp;
window.guardarLista      = guardarLista;
window.toggleHistorial   = toggleHistorial;
window.toggleAsistencia  = toggleAsistencia;
window.displayMap        = displayMap;
window.renderDashboard   = renderDashboard;

// ============================================
// EXPONER FUNCIONES AL SCOPE GLOBAL
// (necesario porque el script usa type="module")
// ============================================

window.adminLogin        = adminLogin;
window.adminLogout       = adminLogout;
window.showTab           = showTab;
window.activateStudent   = activateStudent;
window.deleteStudent     = deleteStudent;
window.contactWhatsApp   = contactWhatsApp;
window.cambiarDeficit    = cambiarDeficit;
window.ajustarDeficit    = ajustarDeficit;
window.toggleAsistencia  = toggleAsistencia;
window.guardarLista      = guardarLista;
window.toggleHistorial   = toggleHistorial;
window.displayMap        = displayMap;