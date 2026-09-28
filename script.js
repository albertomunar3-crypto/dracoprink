function iniciarSesion(){

let usuario=document.getElementById("usuario").value;
let password=document.getElementById("password").value;

if(usuario==="" || password===""){

    alert("Debe completar todos los campos");

    return;

}

window.location.href="dashboard.html";

}
