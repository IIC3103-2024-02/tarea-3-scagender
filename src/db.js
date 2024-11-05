const { Pool } = require('pg');

const pool = new Pool({
  user: 'movie_embeddings_user',
  host: 'dpg-cskl3bqj1k6c73bj8f50-a',
  database: 'movie_embeddings',
  password: 'xLGbIP7xtHD0mFg7AHg4ioFYLyd9l7O7',  // Ajusta si tu contraseña es diferente
  port: 5432,
});

async function initializeDatabase() {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS embeddings (
        id SERIAL PRIMARY KEY,
        movie_title TEXT NOT NULL,
        fragment TEXT NOT NULL,
        embedding VECTOR(768) NOT NULL
      );
    `);
    console.log("Tabla 'embeddings' verificada o creada.");
  } catch (error) {
    console.error("Error al inicializar la base de datos:", error);
  } finally {
    client.release();
  }
}

// Llama a esta función cuando inicie tu aplicación
initializeDatabase();

module.exports = pool;