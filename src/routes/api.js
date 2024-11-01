const Router = require('@koa/router');
const router = new Router();
const axios = require('axios');

const URL = process.env.URL_CAFETERIA || 'http://localhost:3000';
const secretToken = process.env.TOKEN;

async function getAuthToken() {
    const URL = process.env.URL_CAFETERIA; // Asumiendo que tienes esta variable en tu .env
    try {
        const authResponse = await axios.post(`${URL}/auth`, {
            group: 13,
            secret: `${secretToken}`
        });
        return authResponse.data.token;
    } catch (error) {
        console.error('Error getting auth token:', error);
        throw error; // Maneja el error según tus necesidades
    }
}

// Ruta para manejar la obtención del token y espacios desde la API externa
router.get('/spaces', async (ctx) => {
  try {
    // Petición POST para autenticación
    const token = await getAuthToken();

    // Petición GET para obtener los espacios usando el token
    const spacesResponse = await axios.get(`${URL}/spaces`, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });

    const formattedSpaces = spacesResponse.data.map(space => ({
        id: space._id,
        cold: space.cold,
        kitchen: space.kitchen,
        checkIn: space.checkIn,
        checkOut: space.checkOut,
        buffer: space.buffer,
        totalSpace: space.totalSpace,
        usedSpace: space.usedSpace,
      }));
  
      ctx.status = 200;
      ctx.body = formattedSpaces; // Devolver los espacios formateados
      console.log(formattedSpaces[0]);
      console.log(formattedSpaces[1]);
      console.log(formattedSpaces[2]);
      console.log(formattedSpaces[3]);
  } catch (error) {
    ctx.status = 400;
    ctx.body = { error: error.message };
  }
});



// Definimos la ruta con un parámetro {storeId}
router.get('/:storeId/products', async (ctx) => {
    try {
        const storeId = ctx.params.storeId; // Obtenemos el storeId de los parámetros de la ruta

        // Petición POST para autenticación
        const token = await getAuthToken();

        const sku = "CAFEGRANO";

        // Petición GET para obtener los productos de la tienda usando el token
        const productResponse = await axios.get(`${URL}/spaces/${storeId}/products?sku=${sku}`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        const product = productResponse.data;

        const productAttributes = {
            id: product._id,
            sku: product.sku,
            store: product.store,
            expiresAt: product.expiresAt,
            audit: product.audit,
        };

        ctx.status = 200;
        ctx.body = product;
    } catch (error) {
        console.error('Error details:', {
            message: error.message,
            response: error.response ? error.response.data : 'No response received',
            status: error.response ? error.response.status : 'No status',
            a: error.response.data.errors
        });
        ctx.status = error.response ? error.response.status : 500; // Manejo de errores
        ctx.body = { error: 'An error occurred while fetching products.' };
    }
});

router.post('/:storeId/inventory', async (ctx) => {
    try {
        const storeId = ctx.params.storeId; // Obtenemos el storeId de los parámetros de la ruta

        // Petición POST para autenticación
        const token = await getAuthToken();

        // Petición GET para obtener el inventario de la tienda usando el token
        const inventoryResponse = await axios.get(`${URL}/spaces/${storeId}/inventory`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        // Suponiendo que la respuesta es un arreglo de objetos de inventario
        const inventory = inventoryResponse.data; // Este sería el arreglo del inventario


        const inventoryAttributes = {
            sku: inventory.sku,
            quantity: inventory.quantity,
        };

        // Devolver los atributos del inventario
        ctx.status = 200;
        ctx.body = inventoryAttributes; // Devolver los atributos del inventario
    } catch (error) {
        console.error(error);
        ctx.status = error.response ? error.response.status : 500; // Manejo de errores
        ctx.body = { error: 'An error occurred while fetching the inventory.' };
    }
});



router.post('/coffeshop/products', async (ctx) => {
    const { sku, quantity, orderId } = ctx.request.body; // Obtenemos sku y quantity del cuerpo de la solicitud

    const checkIn = "66f203ced3f26274cc8b50f2"
    const buffer = "66f203ced3f26274cc8b5111"
    const checkOut = "66f203ced3f26274cc8b5117"
    const kitchen = "66f203ced3f26274cc8b5131"
    const cold = "66f203ced3f26274cc8b514d"

    console.log('Reiceiving product creation request:', {sku, quantity, orderId });

    // Validación de quantity
    if (quantity < 1 || quantity > 5000) {
        ctx.status = 400; // Bad Request
        ctx.body = { error: 'Quantity must be an integer between 1 and 5000 and a multiple of the SKU batch.' };
        return;
    }

    try {
        // Petición POST para autenticación
        const token = await getAuthToken();
        console.log("Pidiendo recetas...")

        const RecipesResponse = await axios.get(`${URL}/products/available`);
          
        const Recipes = RecipesResponse.data;
        const product = Recipes.find(item => item.sku === sku);
        const skuNecesary = product.recipe.map(ingredient => ({
            sku: ingredient.sku,
            required: ingredient.req // Guarda la cantidad requerida
        }));
        for (const ingredient of skuNecesary) {
            const skuNecesaryProduct = Recipes.find(item => item.sku === ingredient.sku);
            if (skuNecesaryProduct) {
                console.log({
                    sku: skuNecesaryProduct.sku,
                    batch: skuNecesaryProduct.production.batch,
                    time: skuNecesaryProduct.production.time, // Incluye la cantidad requerida
                    place: skuNecesaryProduct.production.at
                });
            }
            const skuName = skuNecesaryProduct.sku;
            console.log("PRODUCTO:", skuName)
            const requiredIngredient = skuNecesary.find(ingredient => ingredient.sku === skuNecesaryProduct.sku);
            console.log("AAAAAAAAA", requiredIngredient)
            const skuQuantity = skuNecesaryProduct.production.batch * requiredIngredient.required;
            console.log("Cantidad de sku necesaria:", skuQuantity);


            //const productsInKitchen = await axios.get(`${URL}/spaces/${kitchen}/products?sku=${skuName}`,{
                //headers: { Authorization: `Bearer ${token}` },
            //});
            //console.log("Products in space: ", productsInKitchen.data)

            const productResponse = await axios.post(`${URL}/products`, {
                sku: sku,
                quantity: quantity
            }, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            console.log("Se creó el producto con id: ", productResponse.data._id)


            const productsInSpace = await axios.get(`${URL}/spaces/${checkIn}/products?sku=${skuName}`,{
                headers: { Authorization: `Bearer ${token}` },
            });

            console.log("Products in space: ", productsInSpace.data)

            const productId = productsInSpace.data[0]._id //productResponse.data._id;
            console.log(productId)

            // Petición POST para crear un producto

            const moveResponse = await axios.patch(`${URL}/products/${productId}`,{
                store: kitchen
            },{
                headers: { Authorization: `Bearer ${token}`, 'Content-Type': `application/json` },
            });
            console.log("Se movio: ", moveResponse.data)

        }

        console.log(product.production.batch)
        const aPedir = quantity*product.production.batch

        const productResponse = await axios.post(`${URL}/products`, {
            sku,
            quantity: aPedir
        }, {
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        });


        // Devolver los atributos desglosados
        ctx.status = 201; // Created
        ctx.body = productResponse.data;
    } catch (error) {
        console.error('Error details:', {
            message: error.message,
            response: error.response ? error.response.data : 'No response received',
            status: error.response ? error.response.status : 'No status',
            headers: error.response ? error.response.headers : 'No headers',
            config: error.config,
            a: error.response.data.errors
        });
        ctx.status = error.response ? error.response.status : 500; // Manejo de errores
        ctx.body = { error: 'An error occurred while creating the product.' };
    }
});



router.get('/products/:productId', async (ctx) => {
    const { productId } = ctx.params; // Obtenemos el productId de los parámetros de la ruta
    const { store } = ctx.request.body; // Obtenemos el ID de la tienda del cuerpo de la solicitud

    if (!store) {
        ctx.status = 400; // Bad Request
        ctx.body = { error: 'Store ID is required in the request body.' };
        return;
    }

    try {
        // Petición POST para autenticación
        const token = await getAuthToken();

        // Petición GET para obtener los detalles del producto
        const productResponse = await axios.patch(`${URL}/products/${productId}`, {
                store, // Enviar el ID de la tienda en el cuerpo
            }, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                }
        });

        // Suponiendo que la respuesta tiene el formato proporcionado
        const product = productResponse.data;

        // Desglosar los atributos necesarios
        const productAttributes = {
            _id: product._id,            // ID del producto
            sku: product.sku,            // SKU del producto
            store: product.store,        // ID de la tienda
            expiresAt: product.expiresAt, // Fecha de expiración
            audit: product.audit,        // Auditoría (objeto) .fabricItem
        };

        // Devolver los atributos desglosados
        ctx.status = 200; // OK
        ctx.body = productAttributes; // Devolver los atributos desglosados
    } catch (error) {
        console.error(error);
        ctx.status = error.response ? error.response.status : 500; // Manejo de errores
        ctx.body = { error: 'An error occurred while fetching the product details.' };
    }
});



router.post('/products/:productId/group', async (ctx) => {
    const { productId } = ctx.params; // Obtenemos el productId de los parámetros de la ruta
    const group = 13; // El número del grupo es siempre 13

    try {
        // Petición POST para autenticación
        const token = await getAuthToken();

        // Petición POST para obtener detalles del grupo del producto
        const groupResponse = await axios.post(`${URL}/products/${productId}/group`, {
            group // Enviar el número del grupo en el cuerpo
        }, {
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        });

        // Suponiendo que la respuesta tiene el formato proporcionado
        const groupDetails = groupResponse.data;

        // Desglosar los atributos necesarios
        const groupAttributes = {
            _id: groupDetails._id,           // ID del producto
            sku: groupDetails.sku,           // SKU del producto
            store: groupDetails.store,       // ID de la tienda
            checkedOut: groupDetails.checkedOut, // Estado de checkout
            checkedOutAt: groupDetails.checkedOutAt, // Fecha de checkout
        };

        // Devolver los atributos desglosados
        ctx.status = 200; // OK
        ctx.body = groupAttributes; // Devolver los atributos desglosados
    } catch (error) {
        console.error(error);
        ctx.status = error.response ? error.response.status : 500; // Manejo de errores
        ctx.body = { error: 'An error occurred while fetching the product group details.' };
    }
});




// Definimos la ruta para obtener el grupo de un producto
router.post('/products/:productId/group', async (ctx) => {
    const { productId } = ctx.params; // Obtenemos el productId de los parámetros de la ruta
    const group = 13; // El número del grupo es siempre 13

    try {
        // Petición POST para autenticación
        const token = await getAuthToken();

        // Petición POST para obtener el grupo del producto
        const groupResponse = await axios.post(`${URL}/products/${productId}/group`, {
            group // Enviar el número del grupo en el cuerpo
        }, {
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        });

        // Suponiendo que la respuesta tiene el formato proporcionado
        const groupDetails = groupResponse.data;

        // Desglosar los atributos necesarios
        const groupAttributes = {
            _id: groupDetails._id,           // ID del producto
            sku: groupDetails.sku,           // SKU del producto
            store: groupDetails.store,       // ID de la tienda
            checkedOut: groupDetails.checkedOut, // Estado de checkout
            checkedOutAt: groupDetails.checkedOutAt, // Fecha de checkout
        };

        // Devolver los atributos desglosados
        ctx.status = 200; // OK
        ctx.body = groupAttributes; // Devolver los atributos desglosados
    } catch (error) {
        console.error(error);
        ctx.status = error.response ? error.response.status : 500; // Manejo de errores
        ctx.body = { error: 'An error occurred while fetching the product group details.' };
    }
});



// Definimos la ruta para despachar un producto
router.post('/dispatch', async (ctx) => {
    const { productId, orderId } = ctx.request.body; // Obtener productId y orderId del cuerpo de la solicitud

    // Validar que ambos IDs sean válidos
    if (!productId || !orderId) {
        ctx.status = 400; // Bad Request
        ctx.body = { error: 'productId and orderId are required.' };
        return;
    }

    try {
        // Petición POST para autenticación
        const token = await getAuthToken();

        // Petición POST para despachar el producto
        await axios.post(`${URL}/dispatch`, {
            productId, // ID del producto a despachar
            orderId,   // ID de la orden de compra asociada
        }, {
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        });

        // No se recibe respuesta, pero podemos devolver un estado de éxito
        ctx.status = 200; // OK
        ctx.body = { message: 'Product dispatched successfully.' };
    } catch (error) {
        console.error(error);
        ctx.status = error.response ? error.response.status : 500; // Manejo de errores
        ctx.body = { error: 'An error occurred while dispatching the product.' };
    }
});


// Definimos la ruta para obtener productos disponibles
router.get('/products/available', async (ctx) => {
    try {
        // Petición GET para obtener productos disponibles
        const response = await axios.get(`${URL}/products/available`);

        const products = response.data; // Obtener los productos de la respuesta

        // Desglosar cada producto
        const availableProducts = products.map(product => ({
            sku: product.sku, // SKU del producto
            name: product.name, // Nombre del producto
            recipe: product.recipe, // Receta del producto (puede ser un array)
            production: product.production, // Información de producción
            sellable: product.sellable, // Indica si el producto se puede vender
            expiration: product.expiration, // Tiempo de expiración en días
            cost: product.cost, // Costo del producto
            price: product.price, // Precio de venta
        }));

        // Devolver los productos disponibles
        ctx.status = 200; // OK
        ctx.body = availableProducts; // Devolver los productos desglosados
    } catch (error) {
        console.error(error);
        ctx.status = error.response ? error.response.status : 500; // Manejo de errores
        ctx.body = { error: 'An error occurred while fetching available products.' };
    }
});

router.get('/test_inventory', async (ctx) => {
    try {
        const authResponse = await axios.post(`${URL}/auth`, {
            group: 13,
            secret: 'tw9fzC!*n6&PgydV%u8N3LXAe_H?JYQ+',
        });
    
        const token = authResponse.data.token;

        const spacesResponse = await axios.get(`${URL}/spaces`, {
            headers: { Authorization: `Bearer ${token}` },
        });

        kitchen = spacesResponse.data.find(space => space.kitchen === true);
        console.log(kitchen);

        const inventoryResponse = await axios.get(`${URL}/spaces/${kitchen._id}/inventory`, {
            headers: { Authorization: `Bearer ${token}` },
        });

        const productsInSpace = await axios.get(`${URL}/spaces/${kitchen._id}/products?sku=CAFEMOLIDOPORCION&limit=150`,{
            headers: { Authorization: `Bearer ${token}` },
        });
        
        ctx.status = 200;
        ctx.body = productsInSpace.data;
    } catch (error) {
        ctx.status = 400;
        ctx
    }
});

router.get('/mover', async (ctx) => {
    try {
        const authResponse = await axios.post(`${URL}/auth`, {
            group: 13,
            secret
        });

        const token = authResponse.data.token;

        productId = "66f4b59b1022bda7ed7b23fe";

        const moveProduct = await axios.patch(`${URL}/products/${productId}`, {
            store: "66f203ced3f26274cc8b5131",
        }, {
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        });

        ctx.status = 200;
        ctx.body = moveProduct.data;
    } catch (error) {
        ctx.status = 400;
        ctx
    }
});

module.exports = router;