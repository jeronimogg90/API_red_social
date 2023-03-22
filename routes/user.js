const express = require("express")
const router = express.Router()
const UserController = require("../controllers/user");
const auth = require("../middlewares/auth")
const multer = require("multer")

// Configuración de subida
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "./uploads/avatars/")
    },
    filename: (req, file, cb) => {
        cb(null, "avatar-"+Date.now()+"-"+file.originalname)
    }
})

const uploads = multer({storage})

// Definir las rutas
router.get("/prueba-usuario", auth.auth, UserController.pruebaUser)
router.post("/register", UserController.register)
router.post("/login", UserController.login)
router.get("/profile/:id", auth.auth, UserController.profile)
router.get("/list/:page?", auth.auth, UserController.list)
router.put("/update", auth.auth, UserController.update)
router.post("/upload", [auth.auth, uploads.single("file0")], UserController.upload)
router.get("/avatar/:file", auth.auth, UserController.avatar)

// Exportar router
module.exports = router