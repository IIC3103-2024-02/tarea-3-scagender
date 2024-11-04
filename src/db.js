const { Pool } = require('pg');

const pool = new Pool({
  user: 'movie_embeddings_user',
  host: 'dpg-cskl3bqj1k6c73bj8f50-a',
  database: 'movie_embeddings',
  password: 'xLGbIP7xtHD0mFg7AHg4ioFYLyd9l7O7',  // Ajusta si tu contraseña es diferente
  port: 5432,
});

module.exports = pool;