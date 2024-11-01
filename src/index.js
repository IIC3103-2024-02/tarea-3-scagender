const db = require('./models');
const { server }  = require('./app');

db.sequelize
    .authenticate()
    .then(() => {
        console.log(
            `Connection with database has been established successfully.`);
    })
    .catch((err) => { console.error('No se puede conectar a la base de datos', err) });