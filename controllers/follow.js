// Importar modelos
const Follow = require("../models/follow")
const User = require("../models/user")

// Importar servicio
const followService = require("../services/followUserIds")

// Importar dependencias
const mongoosePaginate = require("mongoose-pagination")

// Acciones de prueba
const pruebaFollow = (req, res) => {
    return res.status(200).send({
        message: "Mensaje enviado desde: controllers/follow.js"
    })
}

// Accion de guardar un follow (accion seguir)
const save = (req, res) => {
    // Conseguir datos del body
    const params = req.body

    // Sacar id del usuario identificado
    const identity = req.user

    // Crear objeto con modelo follow
    let userToFollow = new Follow({
      user: identity.id,
      followed: params.followed  
    })

    // Guardar el objeto
    userToFollow.save((error, followStored) => {

        if(error || !followStored){
            return res.status(500).send({
                status: "error",
                message: "Error al seguir al usuario"
            })
        }
        
        return res.status(200).send({
            status: "success",
            message: "Metodo Follow",
            identity: req.user,
            followStored
        })
    })
}

// Accion de borrar un follow (accion dejar de seguir)
const unfollow = (req,res) =>{
    // Recoger el id del ususario identificado
    const userId = req.user.id

    // Recober el id el usuario que sigo y quiero dejar de seguir
    const followedId = req.params.id

    // Find de las coincidencias y hacer remove
    Follow.find({
        "user": userId,
        "followed": followedId
    }).remove((error, followDeleted) => {
        if(error || !followDeleted){
            return res.status(500).send({
                status: "error",
                message: "No has dejado de seguir a nadie"
            })
        }
        return res.status(200).send({
            status: "succeess",
            message: "Fllow eliminado corerctamente"
        })
    })
}
// Accion listado de usuarios que cualquier usuario está siguiendo
const following = (req, res) => {
    // Sacar el id del usuario identificado
    let userId = req.user.id;

    // Comprobar si me llega el id por parametro url
    if(req.params.id) userId = req.params.id;

    // Comprobar si me llega la pagina, si no llega será la 1
    let page = 1;

    if(req.params.page) page = req.params.page

    // Usuarios por pagina quiero mostrar
    const itemsPerPage = 5

    // Find a follow, popular datos de los usuarios, y paginar con mongoose pagination
    Follow.find({user: userId})
        .populate("user followed", "-password -role -__v")
        .paginate(page, itemsPerPage, async (error, follows, total) => {
            if(error){
                return res.status(500).send({
                    status: "error",
                    message: "Error al buscar los follows"
                })
            }
            // Listado de usuarios de xxxx que me siguen 
            // Sacar un array de ids de los usuarios que me siguen y los que sigo
            let followUserIds = await followService.followUserIds(req.user.id)

            return res.status(200).send({
                status: "succeess",
                message: "Listado de usuarios que está siguiendo el usuario",
                follows,
                pagina: page,
                total,
                pages: Math.ceil(total/itemsPerPage),
                user_following: followUserIds.following,
                user_follow_me: followUserIds.followers
            })
        })
}

// Accion listado de usuarios que me siguen a cualquier otro ususario
const followers = (req, res) => {
    return res.status(200).send({
        status: "succeess",
        message: "Listado de usuarios que me siguen"
    })
}

// Exportar acciones
module.exports = {
    pruebaFollow,
    save,
    unfollow,
    following,
    followers
}