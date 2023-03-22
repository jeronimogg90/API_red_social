const express = require("express")
const router = express.Router()
const PublicationController = require("../controllers/publication");

// Definir las rutas
router.get("/prueba-publication", PublicationController.pruebaPublication)

// Exportar router
module.exports = router