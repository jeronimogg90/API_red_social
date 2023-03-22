// Importar modulos
const jwt = require("jwt-simple")
const moment = require("moment")

// Importar clave secreta
const libjwt = require("../services/jwt")
const secret = libjwt.secret

// Funcion de autenticación
exports.auth = (req,res, next) => {

    // comprobar si me llega la cavecera de auth
    if(!req.headers.authorization){
        return res.status(403).send({
            status: "Error",
            message: "La petición no tiene la cabecera de autenticación"
        })
    }

    // limpiar el token
    let token = req.headers.authorization.replace(/['"]+/g,'')

    // Decodificar token
    try{
        let payload = jwt.decode(token, secret)

        // Comprobar expiración del token
        if(payload.exp <= moment().unix()){
            return res.status(401).send({
                status: "Error",
                message: "Token expirado"
            })
        }

        
        // Agregar datos de usuario a request
        req.user = payload

    }catch(error){
        return res.status(404).send({
            status: "Error",
            message: "Token no valido"
        })
    }

    // Pasar a ejecución de accion
    next()

}
