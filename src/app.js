const Koa = require('koa');
const cors = require('@koa/cors');
const bodyParser = require('koa-bodyparser');
const router = require('./routes');

router.prefix('/api');

const PORT = process.env.PORT || 8080;

const app = new Koa();

// Definir rutas
// router.get('/', async ctx => {
//   ctx.body = 'Ruta principal de la API';
// });

router.get('/saludo', async ctx => {
  ctx.body = '¡Hola desde la API Koa!';
});

app.use(cors());
app.use(bodyParser());



// Usar el router en la app
app.use(router.routes())
app.use(router.allowedMethods());

const server = app.listen(PORT, () => {
  console.log(`Servidor Koa corriendo en http://localhost:${PORT}`);
});

module.exports = { app, server };
