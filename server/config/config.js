//Configuracion Predeterminada
const { verificaToken } = require("../middlewares/autenticacion");

process.env.PORT = process.env.PORT || 3000;

// Entorno
process.env.NODE_ENV = process.env.NODE_ENV || 'dev';

// Base de Datos
process.env.URLDB = process.env.URLDB || 'mongodb+srv://LeticaMtz:12345678Aa@integradora.bjekd.mongodb.net/VISITAGS?authSource=admin&replicaSet=atlas-ms3wp5-shard-0&readPreference=primary&appname=MongoDB%20Compass&ssl=true';
process.log = (process.env.NODE_ENV === 'dev');
process.env.DB_CONEXION = process.env.DB_CONEXION || false;

// Vencimiento del Token
process.env.CADUCIDAD_TOKEN = process.env.CADUCIDAD_TOKEN || '12h';

// SEED de Autenticación
process.env.SEED = process.env.SEED || 'Frima-super-secreta';

// URL del servidor del FrontEnd
process.env.URL_FRONT = process.env.URL_FRONT || 'http://localhost:4200/#/';

// Credenciales del correo electrónico.
process.env.STRCORREO = process.env.STRCORREO || 'notificaciones.desarrollo@utags.edu.mx';
process.env.STRPASSWORD = process.env.STRPASSWORD || `!9,G\\qEqU8p==>jE`;

process.middlewares = [verificaToken];
