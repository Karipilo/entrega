// ====== DEMO DE AUTENTICACIÓN EN LOCALSTORAGE ======
const STORAGE_KEY = "datoUsuario";

function isValidEmail(raw) {
  const email = (raw || "").trim().toLowerCase();
  // Reglas: algo@algo.algo  (sin espacios)
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  return re.test(email);
}


function getUser() {
    try {
        return JSON.parse(localStorage.getItem(STORAGE_KEY));
    } catch (e) {
        return null;
    }
}

function saveUser(user) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
}

function logout() {
    const u = getUser();
    if (u) {
        u.estadoLogin = false;
        saveUser(u);
    }
    // Reset nav si existe
    const navLogin = document.getElementById("navLoginItem");
    const navLogout = document.getElementById("navLogoutItem");
    const cambio = document.getElementById("cambio");

    if (cambio) {
        cambio.textContent = "";
        cambio.classList.add("d-none"); // siempre oculto si no hay sesión
    }
    if (navLogin) navLogin.classList.remove("d-none");
    if (navLogout) navLogout.classList.add("d-none");

    window.location.href = "home.html";
}

// Muestra saludo solo si hay sesión; si no, lo oculta
function renderGreeting() {
    const cambio = document.getElementById("cambio");
    const navLogin = document.getElementById("navLoginItem");
    const navLogout = document.getElementById("navLogoutItem");
    const user = getUser();

    if (user && user.estadoLogin) {
        if (cambio) {
            cambio.textContent = "Bienvenido " + (user.usuario || user.email);
            cambio.classList.remove("d-none");   // mostrar saludo SOLO con sesión
        }
        if (navLogin) navLogin.classList.add("d-none");
        if (navLogout) navLogout.classList.remove("d-none");
    } else {
        if (cambio) {
            cambio.textContent = "";
            cambio.classList.add("d-none");      // ocultar si NO hay sesión
        }
        if (navLogin) navLogin.classList.remove("d-none");
        if (navLogout) navLogout.classList.add("d-none");
    }
}

// Protege páginas que requieren sesión (ej.: dashboard)
function protectPageForLoggedIn() {
    const path = window.location.pathname;
    const requiresAuth = path.endsWith("pantalla_prof.html");
    if (!requiresAuth) return;

    const user = getUser();
    if (!(user && user.estadoLogin)) {
        window.location.href = "ini_sesion.html";
    }
}

// ----- Registro -----
function setupRegistro() {
    const selectTipo = document.getElementById("tipoUsuario");
    const camposProfesional = document.getElementById("camposProfesional");
    const camposTutor = document.getElementById("camposTutor");
    const btnRegistro = document.getElementById("btnRegistro");

    if (selectTipo) {
        selectTipo.addEventListener("change", () => {
            const val = selectTipo.value;
            if (val === "PROFESIONAL") {
                camposProfesional?.classList.remove("d-none");
                camposTutor?.classList.add("d-none");
            } else if (val === "TUTOR") {
                camposTutor?.classList.remove("d-none");
                camposProfesional?.classList.add("d-none");
            } else {
                camposTutor?.classList.add("d-none");
                camposProfesional?.classList.add("d-none");
            }
        });
    }

    if (btnRegistro) {
        btnRegistro.addEventListener("click", () => {
            const usuario = document.getElementById("UsuarioInput")?.value?.trim();
            const email = document.getElementById("regEmail")?.value?.trim();
            const pass1 = document.getElementById("inputPassword5")?.value;
            const pass2 = document.getElementById("inputPassword")?.value;
            const tipo = document.getElementById("tipoUsuario")?.value;

            if (!usuario || !email || !pass1 || !pass2 || !tipo) {
                alert("Completa todos los campos obligatorios.");
                return;
            }
            if (!isValidEmail(email)){
                alert("Ingresa un correo válido (ej: usuario@dominio.com).");
                return;
            }
            if (pass1.length < 6){
                alert("La contraseña debe tener al menos 6 caracteres.");
                return;
            }
            if (pass1 !== pass2) {
                alert("Las contraseñas no coinciden.");
                return;
            }

            const nuevoUsuario = {
                usuario,
                email: email.toLowerCase(),
                password: pass1,
                tipo,
                estadoLogin: false,
                // Opcionales por rol
                profesion: document.getElementById("profesion")?.value?.trim() || null,
                numRegistro: document.getElementById("numRegistro")?.value?.trim() || null,
                parentesco: document.getElementById("parentesco")?.value?.trim() || null,
            };

            saveUser(nuevoUsuario);
            alert("Cuenta creada. Ahora inicia sesión.");
            window.location.href = "ini_sesion.html";
        });
    }
}

// ----- Login -----
function setupLogin() {
    const btnLogin = document.getElementById("btnLogin");
    if (!btnLogin) return;

    btnLogin.addEventListener("click", () => {
        const rawEmail = document.getElementById("loginEmail")?.value?.trim();
        const password = document.getElementById("loginPassword")?.value;

        if (!rawEmail || !password) {
            alert("Ingresa email y contraseña.");
            return;
        }

        if (!isValidEmail(rawEmail)){
            alert("Ingresa un correo válido (ej: usuario@dominio.com).");
            return;
        }

        const email = rawEmail.toLowerCase();

        const u = getUser();
        if (!u) {
            alert("No hay una cuenta registrada. Por favor, regístrate primero.");
            window.location.href = "registro.html";
            return;
        }

        if (u.email === email && u.password === password) {
            u.estadoLogin = true;
            saveUser(u);
            // Redirección simple según rol
            if (u.tipo === "PROFESIONAL") {
                window.location.href = "pantalla_prof.html";
            } else {
                window.location.href = "pantalla_tutor.html";
            }
        } else {
            alert("Credenciales inválidas.");
        }
    });
}

// Botones de logout en distintas pantallas
function setupLogoutButtons() {
    const btnLogout = document.getElementById("btnLogout");
    const btnLogoutDash = document.getElementById("btnLogoutDashboard");
    if (btnLogout) btnLogout.addEventListener("click", logout);
    if (btnLogoutDash) btnLogoutDash.addEventListener("click", logout);
}

// Mensaje en dashboard
function setupDashboardGreeting() {
    const saludo = document.getElementById("saludoProfesional");
    const mensaje = document.getElementById("mensajeBienvenida");
    if (!saludo && !mensaje) return;
    const u = getUser();
    if (u && u.estadoLogin) {
        if (saludo) saludo.textContent = `Conectado como: ${u.usuario || u.email} (${u.tipo})`;
        if (mensaje) mensaje.textContent = `Bienvenido ${u.usuario || u.email}. Aquí verás tu agenda, pacientes y notificaciones.`;
    }
}

// INIT
document.addEventListener("DOMContentLoaded", () => {
    renderGreeting();
    protectPageForLoggedIn();
    setupRegistro();
    setupLogin();
    setupLogoutButtons();
    setupDashboardGreeting();
});


