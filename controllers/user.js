const User = require("../models/user");
const bcrypt = require("bcrypt")
const jwt = require("../services/jwt")
const mongoosePagination = require("mongoose-pagination")
const path = require("path")
const fs = require("fs")
const followService = require("../services/followUserIds")

// Acciones de prueba
const pruebaUser = (req, res) => {
    return res.status(200).send({
        message: "Mensaje enviado desde: controllers/user.js",
        usuario: req.user
    })
}

// Registro de usuarios
const register = (req, res) => {
    // Recoger los datos de la petición
    let params = req.body;

    // Comprobar que me llegan bien
    if (!params.name || !params.email || !params.password || !params.nick) {
        return res.status(500).json({
            status: "Error",
            message: "Faltan datos por enviar"
        })
    }

    // Control de usuarios duplicados
    User.find({
        $or: [
            { email: params.email.toLowerCase() },
            { nick: params.nick.toLowerCase() },

        ]
    }).exec(async (error, users) => {
        if (error) return res.status(500).json({
            status: "error",
            mensaje: "Error en la consulta de ususarios"
        })

        if (users && users.length >= 1) {
            return res.status(200).send({
                status: "Success",
                message: "El usuario ya existe"
            })
        }

        // Cifrar la contraseña
        let pwd = await bcrypt.hash(params.password, 10)
        params.password = pwd

        // Crear objeto de usuario
        let user_to_save = new User(params)

        // Guardar usuario en la bbdd
        user_to_save.save((error, userStored) => {
            if (error) {
                return res.status(500).send({
                    status: "Error",
                    message: "Error al guardar el usuario"
                })
            }

            if (!userStored) {
                return res.status(500).send({
                    status: "Error",
                    message: "Error devolver el ususario"
                })
            }

            return res.status(200).json({
                status: "Success",
                message: "Accion de registro de usuarios",
                user: userStored
            })
        })
    })
}

const login = (req, res) => {
    // Recoger parametros del body
    let params = req.body

    // Comprobamos parametros
    if (!params.email || !params.password) {
        return res.tatus(404).send({
            status: "Error",
            message: "Faltan datos por enviar"
        })
    }

    // Buscar en la bbdd si existe
    User.findOne({ email: params.email })
        .exec((error, user) => {
            if (error || !user) {
                return res.status(404).send({
                    status: "error",
                    message: "No existe el usuario"
                })
            }
            // Comprobar su contraseña
            const pwd = bcrypt.compareSync(params.password, user.password)

            if (!pwd) {
                return res.status(400).send({
                    status: "Error",
                    message: "No te has identificado correctamente"
                })
            }

            // Devolver Token
            const token = jwt.createToken(user)

            // Devolver datos del ususario
            return res.status(200).send({
                status: "success",
                message: "Te has identificado correctamente",
                user: {
                    id: user._id,
                    name: user.name,
                    nick: user.nick

                },
                token
            })
        })
}

const profile = (req, res) => {
    // Recibir el parametro del id del usuario por la url
    const id = req.params.id

    // consulta para sacar los datos del usuario
    User.findById(id)
        .select({ password: 0, role: 0 })
        .exec( async(error, userProfile) => {
            if (error || !userProfile) {
                return res.status(404).send({
                    status: "Error",
                    message: "El usuario no existe o hay algun error"
                })
            }
            // Info de seguimiento
            const followInfo = await followService.followThisUser(req.user.id, id)

            // Devolver el resultado
            return res.status(200).send({
                status: "Success",
                user: userProfile,
                followInfo
            })

        })

}

const list = (req, res) => {
    // Controlar en que pagina estamos
    let page = 1;
    if (req.params.page) {
        page = parseInt(req.params.page)
    }

    // Consulta con mongoose paginate
    let itemsPerPage = 5

    User.find().sort('_id').paginate(page, itemsPerPage, (error, users, total) => {

        if (error || !users) {
            return res.status(404).send({
                status: "Error",
                message: "No hay usuarios disponibles",
                error
            })
        }

        // Devolver el resultado (posteriormente info de follow)
        return res.status(200).send({
            status: "Success",
            page,
            itemsPerPage,
            users,
            total,
            pages: Math.ceil(total / itemsPerPage)
        })
    })

}

const update = (req, res) => {
    // Recoger info del usuario a actualizar
    let userIdentity = req.user
    let userToUpdate = req.body

    // Eliminar campos sobrantes
    delete userToUpdate.iat
    delete userToUpdate.exp
    delete userToUpdate.role
    delete userToUpdate.image

    // Comprobar si el usuario ya existe
    User.find({
        $or: [
            { email: userToUpdate.email.toLowerCase() },
            { nick: userToUpdate.nick.toLowerCase() },

        ]
    }).exec(async (error, users) => {
        if (error) return res.status(500).json({
            status: "error",
            mensaje: "Error en la consulta de ususarios"
        })

        let userIsset = false;
        users.forEach(user => {
            if (user && user._id != userIdentity.id) userIsset = true
        })

        if (userIsset) {
            return res.status(200).send({
                status: "Success",
                message: "El usuario ya existe"
            })
        }

        // Cifrar la contraseña
        if (userToUpdate.password) {
            let pwd = await bcrypt.hash(userToUpdate.password, 10)
            userToUpdate.password = pwd
        }

        // Buscar y actualizar
        User.findByIdAndUpdate({_id: userIdentity.id}, userToUpdate, { new: true }, (error, userUpdate) => {

            if (error || !userUpdate) {
                return res.status(500).json({
                    status: "Error",
                    message: "Error al actualizar"
                })
            }
            //Devolver respuesta
            return res.status(200).send({
                status: "success",
                message: "Metodo de actualizar usuario",
                user: userUpdate
            })
        })

    })
}

const upload = (req, res) => {

    // Recoger el fichero de imagen y comprobar que existe
    if (!req.file) {
        return res.status(404).send({
            status: "error",
            message: "Imagen no adjuntada"
        })
    }

    // Conseguir el nombre del archivo
    let image = req.file.originalname

    // Sacar la extension del archivo
    let imageSplit = image.split("\.")
    let extension = imageSplit[1]

    // Comprobar extension
    if (extension != "png" && extension != "jpg" && extension != "jpeg" && extension != "gif") {

        // Borrar archivo
        const filePath = req.file.path
        fs.unlinkSync(filePath)

        // Devolver respuesta negativa
        return res.status(400).send({
            status: "error",
            message: "Fichero borrado, extensión incorrecta"
        })
    }
    // Si si lo es, guarda imagen en bdd
    User.findByIdAndUpdate({_id: req.user.id}, { image: req.file.filename }, { new: true }, (error, userUpdated) => {
        if (error || !userUpdated) {
            return res.status(500).send({
                status: "error",
                message: "Error al subir el avatar"
            })
        }
        //Devolver respuesta
        return res.status(200).send({
            status: "Success",
            user: userUpdated,
            file: req.file
        })
    })
}

const avatar = (req, res) => {
    // Sacar el paramtero de la url
    const file = req.params.file

    // Montar el path real de la imagen
    const filePath = "./uploads/avatars/" + file

    // comprobar que el archivo existe
    fs.stat(filePath, (error, exists) => {
        if (!exists) return res.status(404).send({
            status: "error",
            message: "No existe la imagen"
        })

        //Devolver el file
        return res.sendFile(path.resolve(filePath))
    })
}

// Exportar acciones
module.exports = {
    pruebaUser,
    register,
    login,
    profile,
    list,
    update,
    upload,
    avatar
}