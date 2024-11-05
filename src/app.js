const Koa = require('koa');
const cors = require('@koa/cors');
const bodyParser = require('koa-bodyparser');
const router = require('./routes');
const { downloadAllScripts } = require('./routes/guiones');
const { pool, initializeDatabase } = require('./db');

router.prefix('/api');

const PORT = process.env.PORT || 8080;

const app = new Koa();

// Definir rutas
// router.get('/', async ctx => {
//   ctx.body = 'Ruta principal de la API';
// });

app.use(cors({
  origin: '*', // Allows all origins; change this to a specific origin if needed
  allowMethods: ['GET', 'POST', 'OPTIONS'],
  allowHeaders: ['Content-Type'],
}));

router.get('/saludo', async ctx => {
  ctx.body = '¡Hola desde la API Koa!';
});

app.use(cors());
app.use(bodyParser());


// Usar el router en la app
app.use(router.routes())
app.use(router.allowedMethods());

const server = app.listen(PORT, async () => {
  console.log(`Servidor Koa corriendo en http://localhost:${PORT}`);
  
  // Llama a initializeDatabase al iniciar el servidor
  await initializeDatabase();
  console.log("Inicialización de la base de datos completada.");
  
  // Llama a la función de descarga de guiones al iniciar
  await downloadAllScripts();
});

module.exports = { app, server };
