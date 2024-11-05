const Router = require('@koa/router');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { pool, initializeDatabase } = require('../db'); // Asegúrate de importar el pool

const router = new Router();

const scripts = [
    { title: "Kung Fu Panda", url: "https://imsdb.com/scripts/Kung-Fu-Panda.html" },
    { title: "Aladdin", url: "https://imsdb.com/scripts/Aladdin.html" },
    { title: "Beauty and the Beast", url: "https://imsdb.com/scripts/Beauty-and-the-Beast.html" },
    { title: "Coco", url: "https://imsdb.com/scripts/Coco.html" },
    { title: "Happy Feet", url: "https://imsdb.com/scripts/Happy-Feet.html" },
    { title: "Little Mermaid", url: "https://imsdb.com/scripts/Little-Mermaid,-The.html" },
    { title: "Shrek the Third", url: "https://imsdb.com/scripts/Shrek-the-Third.html" },
    { title: "Wall-E", url: "https://imsdb.com/scripts/Wall-E.html" },
    { title: "Zootopia", url: "https://imsdb.com/scripts/Zootopia.html" },
    { title: "The Incredibles", url: "https://imsdb.com/scripts/Incredibles,-The.html"}
  ];

  function cleanScriptContent(content, title) {
    // Eliminar etiquetas HTML y otros metadatos
    let cleanedContent = content
        .replace(/<\/?[^>]+(>|$)/g, '')         // Elimina etiquetas HTML
        .replace(/(\s*The Internet Movie Script Database[^\n]*\n|\s*IMSDb)/g, '') // Remueve metadatos de IMSDb
        .replace(/\s{2,}/g, ' ')                // Reduce múltiples espacios a uno solo
        .replace(/^[\s\n]+|[\s\n]+$/g, '')      // Elimina espacios y saltos de línea al inicio y al final
        .replace(/\(CONT'D\)/g, '');            // Opcional: elimina notaciones de continuidad en guiones

    // Normalizar el título
    const normalizedTitle = title.trim();
    const titleRegex = new RegExp(normalizedTitle, 'gi'); // Búsqueda sin distinción de mayúsculas

    // Encontrar la primera mención del título en el contenido limpio
    const firstMatch = cleanedContent.search(titleRegex);
    if (firstMatch === -1) {
        console.warn(`No se encontró el título "${title}" en el contenido.`);
        return '';
    }

    // Cortar todo lo que venga antes de la primera mención del título
    cleanedContent = cleanedContent.substring(firstMatch + title.length);

    // Encontrar la última mención del título en el contenido ya recortado
    const lastMatch = cleanedContent.lastIndexOf(title);
    if (lastMatch !== -1) {
        // Cortar todo lo que venga después de la última mención del título (incluyendo el título)
        cleanedContent = cleanedContent.substring(0, lastMatch);
    }

    return cleanedContent.trim();
}

function extractTitle(query) {
  const lowerCaseQuery = query.toLowerCase();
  for (const script of scripts) {
      const regex = new RegExp(script.title.toLowerCase(), 'i'); // 'i' para ignorar mayúsculas
      if (regex.test(lowerCaseQuery)) {
        console.log("Titulo encontrado: ", script.title);
          return script.title; // Devuelve el título que coincide
      }
  }
  return null; // Devuelve null si no se encuentra ningún título
}

async function generateEmbeddings(fragment) {
  try {
      const response = await axios.post('http://tormenta.ing.puc.cl/api/embed', {
          model: "nomic-embed-text",
          input: fragment
      });
      return response.data.embeddings[0]; // Devuelve el embedding generado
  } catch (error) {
      console.error('Error generando embedding:', error);
      return null;
  }
}

// Función para almacenar embeddings y realizar consultas
async function storeAndQueryEmbeddings(fragmentos) {
  const embeddings = await Promise.all(fragmentos.map(getEmbeddings));
  // Almacena los embeddings en tu base de datos con PGVector o una configuración similar.
  // Realiza consultas usando `similarity_search` para responder preguntas.
}


function splitIntoFragments(content) {
  const maxFragmentLength = 128;
  const overlap = 20;
  const fragments = [];
  
  for (let i = 0; i < content.length; i += maxFragmentLength - overlap) {
      const fragment = content.slice(i, i + maxFragmentLength);
      fragments.push(fragment);
  }

  return fragments;
}


async function saveEmbeddingToDB(movieTitle, fragment, embedding) {
  const client = await pool.connect();
  try {
      // Convierte el embedding a la representación adecuada para un vector
      const embeddingString = `[${embedding.join(',')}]`;
      await client.query(
          `INSERT INTO embeddings (movie_title, fragment, embedding)
           VALUES ($1, $2, $3::vector)`,
          [movieTitle, fragment, embeddingString]
      );
  } finally {
      client.release();
  }
}

async function checkEmbeddingExists(movieTitle, fragment) {
  const client = await pool.connect();
  try {
      const result = await client.query(
          `SELECT COUNT(*) FROM embeddings WHERE movie_title = $1 AND fragment = $2`,
          [movieTitle, fragment]
      );
      return parseInt(result.rows[0].count) > 0; // Devuelve true si existe
  } finally {
      client.release();
  }
}



async function downloadScript(script) {
  try {
      const response = await axios.get(script.url);
      const cleanedScript = cleanScriptContent(response.data, script.title);
      const fragments = splitIntoFragments(cleanedScript);

      for (const fragment of fragments) {
          // Verifica si ya existe un embedding para este fragmento
          const exists = await checkEmbeddingExists(script.title, fragment);
          if (exists) {
              console.log(`El embedding ya existe para ${script.title}: "${fragment.slice(0, 30)}..."`);
              continue; // Si ya existe, pasa al siguiente fragmento
          }

          const embedding = await generateEmbeddings(fragment);
          if (embedding) {
              await saveEmbeddingToDB(script.title, fragment, embedding);
          }
      }

      const filePath = path.join(__dirname, '..', 'guiones', `${script.title}.txt`);
      fs.writeFileSync(filePath, cleanedScript, 'utf8');
      console.log(`Guion de ${script.title} guardado en ${filePath}`);
  } catch (error) {
      console.error(`Error descargando el guion de ${script.title}:`, error);
  }
}


async function retrieveRelevantFragments(query) {
  const client = await pool.connect();
  try {
      // Extraer el título de la consulta
      const title = extractTitle(query);
      
      // Verifica si se encontró un título
      if (!title) {
          console.log(`No se encontró un título para la consulta: "${query}"`);
          return []; // Retorna un array vacío si no se encuentra un título
      }
      const embedding = await generateEmbeddings(query);
      const queryEmbedding = `[${embedding.join(',')}]`;



      const result = await client.query(
        `SELECT fragment 
        FROM embeddings 
        WHERE movie_title = $1
        ORDER BY embedding <=> $2 
        LIMIT 10`,
        [title, queryEmbedding]
    );

      console.log(`Fragmentos recuperados para el título "${title}":`, result.rows);
      return result.rows.map(row => row.fragment);
  } catch (error) {
      console.error('Error al recuperar fragmentos relevantes:', error);
      return [];
  } finally {
      client.release();
  }
}

async function sendQueryToLLM(prompt) {
  const url = 'http://tormenta.ing.puc.cl/api/generate'; // Asegúrate de usar el endpoint correcto
  const payload = {
      model: "llama3.2",
      prompt: prompt,
      stream: false
      
  };

  try {
      console.log('Enviando consulta al LLM:', payload);
      const response = await axios.post(url, payload);
      return response.data; // Devuelve la respuesta generada
  } catch (error) {
      console.error('Error al enviar consulta al LLM:', error);
      throw new Error('Error al comunicarse con la API del LLM');
  }
}

router.post('/ask-question', async (ctx) => {
  try{
    console.log('Procesando pregunta...');
    const { query } = ctx.request.body; // Se espera que la consulta venga en el cuerpo de la solicitud
    if (!query) {
        ctx.status = 400;
        ctx.body = 'Por favor, incluye una consulta en el cuerpo de la solicitud.';
        return;
    }
    // Recuperar fragmentos relevantes de la base de datos
    const fragments = await retrieveRelevantFragments(query);
    const context = fragments.join('\n'); // Concatenar los fragmentos

    // Preparar el prompt con el contexto
    const prompt = `
    Eres un asistente experto en películas. Una persona te va a hacer una pregunta sobre una película en específico y tú debes responderla en base al siguiente contexto:
    Contexto: 
    ${context}
    Para responder la siguiente pregunta usa el contexto que te acabamos de pasar. Puede que el contexto esté un poco desordenado, pero confiamos en que podrás responder:
    Pregunta: ${query}
    `;

    // Enviar la consulta al LLM
    const llmResponse = await sendQueryToLLM(prompt);
    console.log("Contexto:", context);
    console.log('Respuesta generada por el LLM:', llmResponse.response);

    ctx.body = {
        response: llmResponse.response,
    };
  } catch (error) {
    console.error('Error al procesar la pregunta:', error);
    ctx.status = 500;
    ctx.body = 'Ocurrió un error al procesar la pregunta';
  }
});

// Función que descarga todos los guiones
async function downloadAllScripts() {
  for (const script of scripts) {
    await downloadScript(script);
  }
}

// Endpoint para descargar todos los guiones
router.get('/download-scripts', async (ctx) => {
  await downloadAllScripts();
  ctx.body = 'Guiones descargados y guardados en la carpeta "guiones".';
});

// Exporta la función de descarga
module.exports = { router, downloadAllScripts };
