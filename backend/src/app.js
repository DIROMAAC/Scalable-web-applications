
const Server = require("./config/server");
require("dotenv").config();

console.log(" Configuración cargada:");
console.log("PORT:", process.env.PORT || 8080);
console.log("SECRET_KEY:", process.env.SECRET_KEY ? " Configurada" : " Falta");

const server = new Server();
server.listen();