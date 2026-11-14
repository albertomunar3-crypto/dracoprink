class ErrorHttp extends Error {
    constructor(status, mensaje) {
        super(mensaje);
        this.status = status;
    }
}

function texto(valor, campo, max, { requerido = true } = {}) {
    if (valor === undefined || valor === null || valor === '') {
        if (requerido) throw new ErrorHttp(400, `El campo ${campo} es obligatorio`);
        return null;
    }
    if (typeof valor !== 'string') throw new ErrorHttp(400, `El campo ${campo} no es válido`);
    const limpio = valor.trim();
    if (!limpio) {
        if (requerido) throw new ErrorHttp(400, `El campo ${campo} es obligatorio`);
        return null;
    }
    if (limpio.length > max) throw new ErrorHttp(400, `El campo ${campo} admite máximo ${max} caracteres`);
    return limpio;
}

function entero(valor, campo, { min = 0, requerido = true } = {}) {
    if (valor === undefined || valor === null || valor === '') {
        if (requerido) throw new ErrorHttp(400, `El campo ${campo} es obligatorio`);
        return null;
    }
    const numero = Number(valor);
    if (!Number.isInteger(numero) || numero < min || numero > 2147483647) {
        throw new ErrorHttp(400, `El campo ${campo} debe ser un número entero mayor o igual a ${min}`);
    }
    return numero;
}

function dinero(valor, campo, { min = 0 } = {}) {
    const numero = Number(valor);
    if (valor === '' || valor === null || typeof valor === 'boolean' || !Number.isFinite(numero) ||
        numero < min || numero > 99999999.99 || Math.abs(Math.round(numero * 100) - numero * 100) > 1e-6) {
        throw new ErrorHttp(400, `El campo ${campo} debe ser un valor mayor o igual a ${min} con máximo 2 decimales`);
    }
    return numero;
}

function opcion(valor, campo, opciones) {
    if (!opciones.includes(valor)) {
        throw new ErrorHttp(400, `El campo ${campo} debe ser uno de: ${opciones.join(', ')}`);
    }
    return valor;
}

function idParam(req) {
    return entero(req.params.id, 'id', { min: 1 });
}

module.exports = { ErrorHttp, texto, entero, dinero, opcion, idParam };
