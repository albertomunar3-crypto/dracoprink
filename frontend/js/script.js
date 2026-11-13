async function iniciarSesion(){

let usuario=document.getElementById("usuario").value.trim();
let password=document.getElementById("password").value;

if(usuario==="" || password===""){

    alert("Debe completar todos los campos");

    return;

}

const boton=document.querySelector(".login button");
boton.disabled=true;

try{

    const respuesta=await fetch(`${API_URL}/api/auth/login`,{
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({usuario,password})
    });

    const datos=await respuesta.json();

    if(!respuesta.ok){
        alert(datos.mensaje || "No se pudo iniciar sesión");
        return;
    }

    localStorage.setItem(CLAVE_SESION,JSON.stringify({token:datos.token,usuario:datos.usuario}));
    window.location.href="dashboard.html";

}catch(error){

    alert("No se pudo conectar con el servidor");

}finally{

    boton.disabled=false;

}

}

document.querySelectorAll("#usuario, #password").forEach((campo)=>{
    campo.addEventListener("keydown",(evento)=>{
        if(evento.key==="Enter"){
            iniciarSesion();
        }
    });
});
