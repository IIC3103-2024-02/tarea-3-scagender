const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'movie_embeddings',
  password: 'postgres',  // Ajusta si tu contraseña es diferente
  port: 5432,
});

module.exports = pool;