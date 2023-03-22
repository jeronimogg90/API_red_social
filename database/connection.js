const mongoose = require("mongoose");

const connection = async() => {
    try{
        mongoose.set('strictQuery', false)
        await mongoose.connect("mongodb+srv://root:root@cluster0.rirelou.mongodb.net/mi_redSocial");

        console.log("Conectado correctamente a bd: mi_redSocial")
    } catch(error){
        console.log(error)
        throw new Error("No se ha podido conectar a la base de datos !!")
    }
}

module.exports = {
    connection
}