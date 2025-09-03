// ========= CONFIG =========
const PACIENTES_KEY = "pacientes";
const STORAGE_KEY = "datoUsuario";

// ========= UTILS =========
const byId = (id) => document.getElementById(id);
const qs = (sel, ctx = document) => ctx.querySelector(sel);
const qsa = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

function uuid() {
    return crypto.randomUUID ? crypto.randomUUID()
        : 'xxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
            const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
}

function getPacientes() {
    try { return JSON.parse(localStorage.getItem(PACIENTES_KEY)) || []; }
    catch { return []; }
}
function savePacientes(arr) { localStorage.setItem(PACIENTES_KEY, JSON.stringify(arr)); }

function edadDesde(fechaStr) {
    if (!fechaStr) return null;
    const f = new Date(fechaStr);
    if (Number.isNaN(f.getTime())) return null;
    const hoy = new Date();
    let edad = hoy.getFullYear() - f.getFullYear();
    const m = hoy.getMonth() - f.getMonth();
    if (m < 0 || (m === 0 && hoy.getDate() < f.getDate())) edad--;
    return edad;
}
function edadTexto(fechaStr) {
    const e = edadDesde(fechaStr);
    return e == null ? "—" : `${e} años`;
}

function normalizaLista(str) {
    return (str || "")
        .split(",")
        .map(s => s.trim())
        .filter(Boolean);
}

function showToast(msg, type = "success") {
    const alert = document.createElement("div");
    alert.className = `alert alert-${type} position-fixed top-0 start-50 translate-middle-x mt-3 shadow`;
    alert.style.zIndex = 2000;
    alert.textContent = msg;
    document.body.appendChild(alert);
    setTimeout(() => alert.remove(), 2400);
}

// ========= VALIDACIÓN RUT (simple con DV) =========
function validaRut(rut) {
    if (!rut) return false;
    let clean = rut.replace(/\./g, "").replace(/-/g, "").toUpperCase();
    if (clean.length < 8) return false;
    const cuerpo = clean.slice(0, -1);
    const dv = clean.slice(-1);
    let suma = 0, multiplo = 2;
    for (let i = cuerpo.length - 1; i >= 0; i--) {
        suma += multiplo * parseInt(cuerpo[i], 10);
        multiplo = multiplo === 7 ? 2 : multiplo + 1;
    }
    const dvEsperado = 11 - (suma % 11);
    const dvCalculado = dvEsperado === 11 ? "0" : dvEsperado === 10 ? "K" : String(dvEsperado);
    return dvCalculado === dv;
}

// ========= RENDER TABLA =========
const tbody = qs("#tblPacientes tbody");
const lblTotal = byId("lblTotal");

function renderTabla(filtro = "") {
    if (!tbody) return; // por si aún no estamos en la pestaña Pacientes
    const data = getPacientes();
    const q = filtro.trim().toLowerCase();
    const filtrados = q
        ? data.filter(p => p.rut.toLowerCase().includes(q) || p.nombre.toLowerCase().includes(q))
        : data;

    tbody.innerHTML = "";
    for (const p of filtrados) {
        const tr = document.createElement("tr");
        const tDiagn = (p.diagnosticos || []).slice(0, 3).map(d => `<span class="badge rounded-pill tag">${d}</span>`).join(" ");
        tr.innerHTML = `
      <td>${p.rut}</td>
      <td>${p.nombre}</td>
      <td>${edadTexto(p.fechaNac)}</td>
      <td>${tDiagn || "<span class='text-muted'>—</span>"}</td>
      <td>${p.tutor || "<span class='text-muted'>—</span>"}</td>
      <td class="text-end">
        <button class="btn btn-sm btn-outline-primary me-1" data-accion="ver" data-id="${p.id}"><i class="bi bi-eye"></i></button>
        <button class="btn btn-sm btn-outline-warning me-1" data-accion="editar" data-id="${p.id}"><i class="bi bi-pencil"></i></button>
        <button class="btn btn-sm btn-outline-danger" data-accion="eliminar" data-id="${p.id}"><i class="bi bi-trash"></i></button>
      </td>
    `;
        tbody.appendChild(tr);
    }
    if (lblTotal) lblTotal.textContent = `${filtrados.length} de ${data.length} pacientes`;

    // Actualiza dashboard cuando cambie la tabla
    actualizarKPIsyCharts();
}

// ========= FORM CREAR =========
const frmPaciente = byId("frmPaciente");
if (frmPaciente) {
    frmPaciente.addEventListener("submit", (ev) => {
        ev.preventDefault();
        const f = ev.currentTarget;
        const rut = f.rut.value.trim();
        const nombre = f.nombre.value.trim();
        const fechaNac = f.fechaNac.value;

        if (!validaRut(rut)) { f.rut.classList.add("is-invalid"); return; }
        f.rut.classList.remove("is-invalid");

        if (!nombre) { f.nombre.classList.add("is-invalid"); return; }
        f.nombre.classList.remove("is-invalid");

        if (!fechaNac) { f.fechaNac.classList.add("is-invalid"); return; }
        f.fechaNac.classList.remove("is-invalid");

        const nuevo = {
            id: uuid(),
            rut,
            nombre,
            fechaNac,
            sexo: f.sexo.value || "",
            tutor: (f.tutor.value || "").trim(),
            contactoTutor: (f.contactoTutor.value || "").trim(),
            diagnosticos: normalizaLista(f.diagnosticos.value),
            alergias: normalizaLista(f.alergias.value),
            medicamentos: normalizaLista(f.medicamentos.value),
            notas: (f.notas.value || "").trim(),
            creadoEn: new Date().toISOString(),
            actualizadoEn: new Date().toISOString()
        };

        const lista = getPacientes();
        if (lista.some(p => p.rut.toLowerCase() === nuevo.rut.toLowerCase())) {
            showToast("Ya existe un paciente con ese RUT.", "warning");
            return;
        }

        lista.push(nuevo);
        savePacientes(lista);
        renderTabla(byId("txtBuscar")?.value || "");
        f.reset();
        showToast("Paciente agregado correctamente.");
    });

    byId("btnCancelarForm").addEventListener("click", () => {
        frmPaciente.querySelectorAll(".is-invalid").forEach(el => el.classList.remove("is-invalid"));
    });
}

// ========= BUSCAR =========
byId("txtBuscar")?.addEventListener("input", (e) => {
    renderTabla(e.target.value);
});

// ========= VER / EDITAR / ELIMINAR =========
const modalVer = new bootstrap.Modal('#modalVer');
const modalEditar = new bootstrap.Modal('#modalEditar');
let ultimoPacienteVisto = null;

tbody?.addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-accion]");
    if (!btn) return;
    const id = btn.dataset.id;
    const accion = btn.dataset.accion;
    const lista = getPacientes();
    const pac = lista.find(p => p.id === id);
    if (!pac) return;

    if (accion === "ver") {
        ultimoPacienteVisto = pac;
        renderVer(pac);
        modalVer.show();
    }

    if (accion === "editar") {
        cargarEditar(pac);
        modalEditar.show();
    }

    if (accion === "eliminar") {
        if (confirm(`¿Eliminar a ${pac.nombre} (${pac.rut})? Esta acción no se puede deshacer.`)) {
            const nueva = lista.filter(p => p.id !== id);
            savePacientes(nueva);
            renderTabla(byId("txtBuscar")?.value || "");
            showToast("Paciente eliminado.", "success");
        }
    }
});

const verContenido = byId("verContenido");
byId("btnEditarDesdeVer")?.addEventListener("click", () => {
    if (!ultimoPacienteVisto) return;
    modalVer.hide();
    setTimeout(() => { cargarEditar(ultimoPacienteVisto); modalEditar.show(); }, 200);
});

function renderVer(p) {
    const fmtLista = (arr) => (arr && arr.length)
        ? arr.map(x => `<span class="badge rounded-pill tag">${x}</span>`).join(" ")
        : "<span class='text-muted'>—</span>";

    verContenido.innerHTML = `
    <div class="row g-3">
      <div class="col-md-6">
        <div class="p-3 border rounded-3">
          <h6 class="mb-2 text-muted">Identificación</h6>
          <p class="mb-1"><strong>RUT:</strong> ${p.rut}</p>
          <p class="mb-1"><strong>Nombre:</strong> ${p.nombre}</p>
          <p class="mb-1"><strong>Fecha Nac.:</strong> ${p.fechaNac} (${edadTexto(p.fechaNac)})</p>
          <p class="mb-0"><strong>Sexo:</strong> ${p.sexo || "—"}</p>
        </div>
      </div>
      <div class="col-md-6">
        <div class="p-3 border rounded-3">
          <h6 class="mb-2 text-muted">Tutor</h6>
          <p class="mb-1"><strong>Nombre:</strong> ${p.tutor || "—"}</p>
          <p class="mb-0"><strong>Contacto:</strong> ${p.contactoTutor || "—"}</p>
        </div>
      </div>
      <div class="col-12">
        <div class="p-3 border rounded-3">
          <h6 class="mb-2 text-muted">Información médica</h6>
          <p class="mb-2"><strong>Diagnósticos:</strong> ${fmtLista(p.diagnosticos)}</p>
          <p class="mb-2"><strong>Alergias:</strong> ${fmtLista(p.alergias)}</p>
          <p class="mb-2"><strong>Medicamentos:</strong> ${fmtLista(p.medicamentos)}</p>
          <p class="mb-0"><strong>Notas:</strong><br>${p.notas ? p.notas.replaceAll("\n", "<br>") : "—"}</p>
        </div>
      </div>
    </div>
    <p class="text-muted small mt-3 mb-0">
      Creado: ${new Date(p.creadoEn).toLocaleString()} | Actualizado: ${new Date(p.actualizadoEn).toLocaleString()}
    </p>
  `;
}

// ========= EDITAR =========
const frmEditar = byId("frmEditar");
function cargarEditar(p) {
    frmEditar.id.value = p.id;
    frmEditar.rut.value = p.rut;
    frmEditar.nombre.value = p.nombre;
    frmEditar.fechaNac.value = p.fechaNac || "";
    frmEditar.sexo.value = p.sexo || "";
    frmEditar.tutor.value = p.tutor || "";
    frmEditar.contactoTutor.value = p.contactoTutor || "";
    frmEditar.diagnosticos.value = (p.diagnosticos || []).join(", ");
    frmEditar.alergias.value = (p.alergias || []).join(", ");
    frmEditar.medicamentos.value = (p.medicamentos || []).join(", ");
    frmEditar.notas.value = p.notas || "";
}
frmEditar?.addEventListener("submit", (ev) => {
    ev.preventDefault();
    const lista = getPacientes();
    const id = frmEditar.id.value;

    if (!validaRut(frmEditar.rut.value.trim())) { frmEditar.rut.classList.add("is-invalid"); return; }
    frmEditar.rut.classList.remove("is-invalid");

    if (!frmEditar.nombre.value.trim()) { frmEditar.nombre.classList.add("is-invalid"); return; }
    frmEditar.nombre.classList.remove("is-invalid");

    if (!frmEditar.fechaNac.value) { frmEditar.fechaNac.classList.add("is-invalid"); return; }
    frmEditar.fechaNac.classList.remove("is-invalid");

    const idx = lista.findIndex(p => p.id === id);
    if (idx === -1) return;

    const actualizado = {
        ...lista[idx],
        rut: frmEditar.rut.value.trim(),
        nombre: frmEditar.nombre.value.trim(),
        fechaNac: frmEditar.fechaNac.value,
        sexo: frmEditar.sexo.value,
        tutor: frmEditar.tutor.value.trim(),
        contactoTutor: frmEditar.contactoTutor.value.trim(),
        diagnosticos: normalizaLista(frmEditar.diagnosticos.value),
        alergias: normalizaLista(frmEditar.alergias.value),
        medicamentos: normalizaLista(frmEditar.medicamentos.value),
        notas: frmEditar.notas.value.trim(),
        actualizadoEn: new Date().toISOString()
    };

    const rutEnUso = lista.some(p => p.id !== id && p.rut.toLowerCase() === actualizado.rut.toLowerCase());
    if (rutEnUso) { showToast("Ese RUT ya está en otro paciente.", "warning"); return; }

    lista[idx] = actualizado;
    savePacientes(lista);
    renderTabla(byId("txtBuscar")?.value || "");
    modalEditar.hide();
    showToast("Cambios guardados.");
});

// ========= SESIÓN (opcional) =========
(function bootSesion() {
    try {
        const u = JSON.parse(localStorage.getItem(STORAGE_KEY));
        if (u && u.estadoLogin) {
            const chip = byId("chipUsuario");
            chip.textContent = u.nombre ? `Conectado: ${u.nombre}` : "Sesión activa";
            chip.classList.remove("d-none");

            const btnLogout = byId("btnLogout");
            btnLogout.classList.remove("d-none");
            btnLogout.addEventListener("click", () => {
                if (confirm("¿Cerrar sesión?")) {
                    u.estadoLogin = false;
                    localStorage.setItem(STORAGE_KEY, JSON.stringify(u));
                    location.href = "home.html";
                }
            });
        }
    } catch { }
})();

// ========= DASHBOARD: KPIs + Charts =========
let chartEdades, chartDiagnosticos;

function actualizarKPIsyCharts(filtro = "todos") {
    const data = getPacientes();
    const hoy = new Date().toDateString();
    const nuevosHoy = data.filter(p => new Date(p.creadoEn).toDateString() === hoy).length;

    // KPIs
    const total = data.length;
    const alergicos = data.filter(p => (p.alergias || []).length > 0).length;
    const conMeds = data.filter(p => (p.medicamentos || []).length > 0).length;
    const edadesValidas = data.map(p => edadDesde(p.fechaNac)).filter(e => e != null && e >= 0);
    const promEdad = edadesValidas.length ? Math.round(edadesValidas.reduce((a, b) => a + b, 0) / edadesValidas.length) : "—";

    byId("kpiTotalPac").textContent = total;
    byId("kpiNuevosHoy").textContent = nuevosHoy;
    byId("kpiAlergicos").textContent = alergicos;
    byId("kpiAlergias").textContent = total ? Math.round(alergicos * 100 / total) + "%" : "0%";
    byId("kpiConMeds").textContent = conMeds;
    byId("kpiEdadProm").textContent = promEdad;

    // Filtro rápido (afecta charts y tabla de controles demo)
    let dataFiltrada = [...data];
    if (filtro === "alergias") dataFiltrada = dataFiltrada.filter(p => (p.alergias || []).length > 0);
    if (filtro === "medicamentos") dataFiltrada = dataFiltrada.filter(p => (p.medicamentos || []).length > 0);
    if (filtro === "adultoMayor") dataFiltrada = dataFiltrada.filter(p => (edadDesde(p.fechaNac) || 0) >= 60);

    // Chart Edades (grupos)
    const grupos = { "0-17": 0, "18-39": 0, "40-59": 0, "60-79": 0, "80+": 0 };
    dataFiltrada.forEach(p => {
        const e = edadDesde(p.fechaNac);
        if (e == null) return;
        if (e <= 17) grupos["0-17"]++;
        else if (e <= 39) grupos["18-39"]++;
        else if (e <= 59) grupos["40-59"]++;
        else if (e <= 79) grupos["60-79"]++;
        else grupos["80+"]++;
    });

    const ctxE = byId("chartEdades")?.getContext("2d");
    if (ctxE) {
        if (chartEdades) chartEdades.destroy();
        chartEdades = new Chart(ctxE, {
            type: "bar",
            data: {
                labels: Object.keys(grupos),
                datasets: [{ label: "Pacientes", data: Object.values(grupos) }]
            },
            options: { responsive: true, maintainAspectRatio: false }
        });
    }

    // Chart Diagnósticos (top 5)
    const freq = {};
    dataFiltrada.forEach(p => (p.diagnosticos || []).forEach(d => {
        const k = d.trim().toLowerCase();
        if (!k) return;
        freq[k] = (freq[k] || 0) + 1;
    }));
    const top5 = Object.entries(freq).sort((a, b) => b[1] - a[1]).slice(0, 5);
    const ctxD = byId("chartDiagnosticos")?.getContext("2d");
    if (ctxD) {
        if (chartDiagnosticos) chartDiagnosticos.destroy();
        chartDiagnosticos = new Chart(ctxD, {
            type: "doughnut",
            data: {
                labels: top5.map(([k]) => k.toUpperCase()),
                datasets: [{ data: top5.map(([, v]) => v) }]
            },
            options: { responsive: true, maintainAspectRatio: false }
        });
    }

    // Controles próximos (demo con datos derivados)
    renderControlesDemo(dataFiltrada);
}

byId("btnAplicarFiltro")?.addEventListener("click", () => {
    const filtro = byId("filtroRapido").value;
    actualizarKPIsyCharts(filtro);
});

// Datos demo / limpieza
byId("btnDemoSeed")?.addEventListener("click", () => {
    if (getPacientes().length && !confirm("Esto añadirá pacientes de ejemplo a los existentes. ¿Continuar?")) return;
    const demo = [
        { rut: "12.345.678-5", nombre: "Ana Rojas", fechaNac: "1955-04-10", sexo: "Femenino", tutor: "Marcela Rojas", contactoTutor: "+56 9 1111 1111", diagnosticos: ["HTA", "DM2"], alergias: ["Penicilina"], medicamentos: ["Metformina 500 mg"], notas: "Control mensual", creadoEn: new Date().toISOString(), actualizadoEn: new Date().toISOString(), id: uuid() },
        { rut: "9.876.543-2", nombre: "Luis Pérez", fechaNac: "1988-09-22", sexo: "Masculino", tutor: "—", contactoTutor: "", diagnosticos: ["Asma"], alergias: [], medicamentos: ["Salbutamol"], notas: "Plan de acción", creadoEn: new Date().toISOString(), actualizadoEn: new Date().toISOString(), id: uuid() },
        { rut: "7.654.321-K", nombre: "Marta Díaz", fechaNac: "1940-01-05", sexo: "Femenino", tutor: "Héctor Díaz", contactoTutor: "+56 9 2222 2222", diagnosticos: ["EPOC", "HTA"], alergias: ["AAS"], medicamentos: ["Losartán"], notas: "Saturación basal 92%", creadoEn: new Date().toISOString(), actualizadoEn: new Date().toISOString(), id: uuid() },
        { rut: "16.111.222-3", nombre: "Carlos Soto", fechaNac: "2006-07-30", sexo: "Masculino", tutor: "Paula Soto", contactoTutor: "+56 9 3333 3333", diagnosticos: ["TDAH"], alergias: [], medicamentos: [], notas: "Apoyo escolar", creadoEn: new Date().toISOString(), actualizadoEn: new Date().toISOString(), id: uuid() }
    ];
    const lista = getPacientes();
    savePacientes(lista.concat(demo));
    renderTabla(byId("txtBuscar")?.value || "");
    showToast("Datos demo cargados.");
});

byId("btnLimpiarDatos")?.addEventListener("click", () => {
    if (confirm("Esto eliminará todos los pacientes guardados en este navegador.")) {
        savePacientes([]);
        renderTabla(byId("txtBuscar")?.value || "");
        showToast("Datos eliminados.", "warning");
    }
});

// ========= Controles Próximos (demo) =========
function renderControlesDemo(data) {
    const tbodyC = byId("tbodyControles");
    if (!tbodyC) return;
    const tipos = ["Control crónico", "Curación", "Toma de exámenes", "Vacunación"];
    const filas = (data.slice(0, 6).length ? data.slice(0, 6) : getPacientes().slice(0, 6))
        .map((p, i) => ({
            fecha: proxFecha(i),
            nombre: p?.nombre || `Paciente ${i + 1}`,
            tipo: tipos[i % tipos.length],
            notas: (p?.diagnosticos || [])[0] || "—"
        }));

    tbodyC.innerHTML = filas.map(f => `
    <tr>
      <td>${f.fecha}</td>
      <td>${f.nombre}</td>
      <td>${f.tipo}</td>
      <td>${f.notas}</td>
      <td class="text-end">
        <button class="btn btn-sm btn-outline-primary"><i class="bi bi-calendar-check"></i></button>
        <button class="btn btn-sm btn-outline-secondary"><i class="bi bi-chat-dots"></i></button>
      </td>
    </tr>
  `).join("");
}
function proxFecha(offsetDias) {
    const d = new Date();
    d.setDate(d.getDate() + (offsetDias + 1));
    return d.toLocaleDateString();
}

// ========= Inicial =========
function init() {
    // Render inicial
    renderTabla();
    actualizarKPIsyCharts("todos");
}
document.addEventListener("DOMContentLoaded", init);
