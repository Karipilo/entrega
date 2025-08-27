let datoUsuarioAdmin = {
    "nombreCompleto": "Karina Pimentel",
    "usuario": "karina",
    "email": "kari@gmail.com",
    "password": "karina",
    "estado": true
}

// Al cargar la página, muestra el nombre en home.html si el usuario está logueado
window.onload = function () {
    const path = window.location.pathname;
    if (path.endsWith("registro.html") || path.endsWith("welcome.html")) {
        let usuarioLogin = JSON.parse(localStorage.getItem("datoUsuario"))
        if (usuarioLogin && usuarioLogin.estadoLogin) {
            document.getElementById("cambio").textContent = "Bienvenido " + usuarioLogin.usuario
        } else {
            // Si no está logueado, redirige al login
            window.location.href = "ini_sesion.html"
        }
    }
}

// Función de validación y login
function datoUsuario() {
    let usuario = document.getElementById("UsuarioInput").value
    let password = document.getElementById("inputPassword5").value
    if (usuario == "" || password == "") {
        alert("Usuario y contraseña no deben estar vacíos")
        return
    } else if (usuario.length < 3 || password.length < 3) {
        alert("Debe tener más de 3 caracteres")
        return
    } else if (usuario == datoUsuarioAdmin.usuario && password == datoUsuarioAdmin.password) {
        // Guardar datos en localStorage
        let usuarioLogeado = {
            "usuario": datoUsuarioAdmin.nombreCompleto,
            "estadoLogin": datoUsuarioAdmin.estado
        }
        localStorage.setItem("datoUsuario", JSON.stringify(usuarioLogeado))
        window.location.href = "registro.html"
    } else {
        // Verificar usuarios registrados
        let usuarios = JSON.parse(localStorage.getItem("usuarios")) || [];
        let usuarioEncontrado = usuarios.find(u => (u.nombre === usuario || u.email === usuario) && u.contrasena === password);
        if (usuarioEncontrado) {
            let usuarioLogeado = {
                "usuario": usuarioEncontrado.nombre,
                "estadoLogin": true
            }
            localStorage.setItem("datoUsuario", JSON.stringify(usuarioLogeado))
            window.location.href = "registro.html"
        } else {
            alert("Usuario o contraseña incorrctos")
            return
        }
    }
}

function registroUsuario() {
    let nombre = document.getElementById("UsuarioInput").value
    let email = document.getElementById("regEmail").value
    let contrasena = document.getElementById("inputPassword5").value
    let repetirContrasena = document.getElementById("inputPassword").value
    //es una variable que me dice si el usuario ya existe
    let existe = false;
    //usuarios es un array que contiene los usuarios registrados en el localStorage
    let usuarios = JSON.parse(localStorage.getItem("usuarios")) || [];

    for (let i = 0; i < usuarios.length; i++) {
        if (usuarios[i].email === email) {     // === valores y tipos de datos
            existe = true;
            break;
        }
    }
    if (email == "" || nombre == "" || contrasena == "" || repetirContrasena == "") {
        alert("Todos los campos son obligatorios");
    } else if (contrasena !== repetirContrasena) {
        alert("Las contraseñas no coinciden");
    } else if (existe) {
        alert("El email ya existe");
    } else {
        usuarios.push({ nombre, email, contrasena });
        localStorage.setItem("usuarios", JSON.stringify(usuarios));
        alert("Registro exitoso. Ahora puedes iniciar sesión.");
        window.location.href = "ini_sesion.html";
    }
}