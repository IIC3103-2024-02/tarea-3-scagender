const Client = require('ssh2-sftp-client');
const fs = require('fs');
const path = require('path');
const xml2js = require('xml2js');
const { createOrder } = require('./orders_controller');
const sftp = new Client();

// Credenciales del servidor sFTP
const sftpConfig = {
  host: 'granizo15.ing.puc.cl', 
  port: '22', 
  username: 'grupo13_desarrollo', 
  password: 'x49QYfR2c4PSWnpQyN' 
};

const pedidosDir = '/pedidos'; // Ruta del directorio de pedidos en el servidor
const localDir = path.join(__dirname, 'pedidos'); // Carpeta local donde guardarás los pedidos

// Asegúrate de que la carpeta local existe
if (!fs.existsSync(localDir)){
    fs.mkdirSync(localDir, { recursive: true });
}

// Función para limpiar la carpeta local
function cleanLocalDir() {
  fs.readdir(localDir, (err, files) => {
    if (err) {
      console.error('Error leyendo la carpeta local:', err);
      return;
    }
    for (const file of files) {
      const filePath = path.join(localDir, file);
      fs.unlink(filePath, (err) => {
        if (err) {
          console.error('Error eliminando el archivo:', err);
        } else {
          console.log(`Archivo ${file} eliminado.`);
        }
      });
    }
  });
}

// Función para descargar los pedidos
async function getPedidos() {
  try {
    cleanLocalDir(); // Limpiar la carpeta local antes de descargar
    await sftp.connect(sftpConfig);
    console.log('Conectado al servidor sFTP');

    // Listar archivos en la carpeta de pedidos
    const files = await sftp.list(pedidosDir);

    // Descargar cada archivo de pedidos
    for (const file of files) {
      if (file.type === 'd') {
        // Ignorar directorios, si es necesario
        continue;
      }

      const localPath = path.join(localDir, file.name);
      const remoteFilePath = path.join(pedidosDir, file.name);
      
      await sftp.get(remoteFilePath, localPath);

      // Procesar el archivo XML
      const orderXml = fs.readFileSync(localPath, 'utf8');
      const orderData = await parseXmlToOrder(orderXml);

      // Llamar a la función para crear la orden
      await createOrderFromXml(orderData);
    }
  } catch (err) {
    console.error('Error conectando al servidor sFTP:', err);
  } finally {
    await sftp.end();
    console.log('Conexión sFTP cerrada');
  }
}

// Función para parsear XML a objeto de orden
async function parseXmlToOrder(xml) {
    return new Promise((resolve, reject) => {
      xml2js.parseString(xml, { explicitArray: false }, (err, result) => {
        if (err) {
          return reject(err);
        }
  
        // El XML tiene 'id', 'sku', y 'qty', que se debe mapear a 'orderId', 'orderItems', y 'quantity'
        const order = result.order;
        const orderData = {
          orderId: order.id || null, // Mapeo de 'id' a 'orderId'
          dueDate: new Date().toISOString(), // No hay dueDate en el XML, puedes generarlo o ajustarlo según sea necesario
          order: [
            {
              sku: order.sku || null,   // 'sku' del XML
              quantity: order.qty || null  // 'qty' del XML
            }
          ]
        };
  
        resolve(orderData);  // Devuelve el objeto orderData mapeado correctamente
      });
    });
  }


// Función para crear la orden a partir de los datos del XML
async function createOrderFromXml(orderData) {
  const ctx = { request: { body: orderData } }; // Simular contexto

  console.log('Datos de la orden enviados a createOrder:', orderData);  // Verifica qué se está enviando

  // Llamar a la función existente para crear la orden
  await createOrder(ctx);
}

function startCleaningLocalDir() {
    setInterval(cleanLocalDir, 300000); // 5 minutos = 300000 ms
  }

// Función para iniciar la descarga periódica cada 5 minutos (300000 ms)
function startOrderDownload() {
    getPedidos();
    startCleaningLocalDir();
  }

module.exports = {
  getPedidos,
  startOrderDownload,
};