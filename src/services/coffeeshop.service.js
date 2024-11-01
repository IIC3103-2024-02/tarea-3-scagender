const axios = require('axios');
const secretToken = process.env.TOKEN;
const URL = process.env.URL_CAFETERIA;
const { Supply }  = require('../models');

class CoffeeshopService {

    async getAuthToken() {
        try {
            const authResponse = await axios.post(`${URL}/auth`, {
                group: 13,
                secret: `${secretToken}`
            });
            return authResponse.data.token;
        } catch (error) {
            console.error('Error getting auth token:', error.message);
            throw new Error('Failed to get auth token');
        }
    }

    async getRequestLimit() {
        try {
            const authResponse = await axios.post(`${URL}/auth`, {
                group: 13,
                secret: `${secretToken}`
            });
            // Extraer el encabezado 'ratelimit'
            const rateLimitHeader = authResponse.headers['ratelimit'];
            const coffeeshopToken = authResponse.data.token;
            // Usar una expresión regular para capturar el valor de 'remaining'
            const remainingMatch = rateLimitHeader.match(/remaining=(\d+)/);
            const remaining = remainingMatch ? parseInt(remainingMatch[1], 10) : null;

            console.log("Remaining requests:", remaining);
            return { remaining, coffeeshopToken }; 
        } catch (error) {
            console.error('Error getting auth token:', error.message);
            throw new Error('Failed to get auth token');
        }
    }

    async getSpaces(token) {
        const spacesResponse = await axios.get(`${URL}/spaces`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
        return spacesResponse.data;
    }

    async getProductData(token, data) {
        try {
            const products = await this.getAvailableProducts(token);
            const product = products.find(item => item.sku === data.sku);
            return product;
        } catch (error) {
            console.error('Error getting product data:', error.message);
            throw new Error('Failed to get product data');
        }
    }

    async getSpaceProduct(token, data) {
        const inventoryResponse = await axios.get(`${URL}/spaces/${data.storeId}/products?sku=${data.sku}`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
        return inventoryResponse.data;
    }

    async getSpaceInventory(token, data) {
        const inventoryResponse = await axios.get(`${URL}/spaces/${data.storeId}/inventory`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
        return inventoryResponse.data;
    }

    async getEachSpace(token) {
        try {
            const storesData = await this.getSpaces(token);
            const kitchen = storesData.find(store => store.kitchen === true);
            const buffer = storesData.find(store => store.buffer === true);
            const checkOut = storesData.find(store => store.checkOut === true);
            const checkIn = storesData.find(store => store.checkIn === true);
            const cold = storesData.find(store => store.cold === true);
            return { kitchen, buffer, checkOut, checkIn, cold };
        } catch (error) {
            console.error('Error checking if product is available:', error.message);
            throw new Error('Failed to check if product is available');
        }
    }

    async getProductForSupply(availalaProducts, sku) {
        try {
            const batch = availalaProducts.find(item => item.sku === sku).production.batch;
            return batch;
        } catch (error) {
            console.error('Error getting product for supply:', error.message);
            throw new Error('Failed to get product for supply');
        }
    }

    async checkSupply(spaces, token, sku, availableProducts) {
        try {
            const supplyRecord = await Supply.findOne({ where: { sku } });
            if (!supplyRecord) {
                return;
            }
            const quantityInfo = await this.checkProductAmount(token, sku, spaces);
            const productInfoBatch = await this.getProductForSupply(availableProducts, sku);
            console.log("INFOBATCH", productInfoBatch);
            if (quantityInfo.maxQuantity < supplyRecord.minimum && supplyRecord.status === 'NO') {
                const quantityToRequest = productInfoBatch;
                await this.requestProduct(token, { sku, quantity: quantityToRequest });
                await Supply.update(
                    { status: 'SI' },
                    { where: { sku } }
                );
            } else if (quantityInfo.maxQuantity >= supplyRecord.maximum && supplyRecord.status === 'SI') {
                await Supply.update(
                    { status: 'NO' },
                    { where: { sku } }
                );
            }
        } catch (error) {
            console.error('Error checking supply:', error.message);
            throw new Error('Failed to check supply');
        }
    }

    async checkIfProductIsAvailableForDelivery(token, sku, quantity) {
        try {
            const { kitchen, buffer, checkOut, checkIn, cold } = await this.getEachSpace(token);
            const storeIds = [buffer._id, checkIn._id, cold._id];
            const quantityInfo = await this.checkProductAmount(token, sku, storeIds);
            if (quantityInfo.maxQuantity >= quantity) {
                return true;
            }
            return false;
        } catch (error) {
            console.error('Error checking if product is available:', error.message);
            throw new Error('Failed to check if product is available');
        }
    }

    async checkIfIngredientIsAvailable(token, sku, quantity) {
        try {
            const { kitchen, buffer, checkOut, checkIn, cold } = await this.getEachSpace(token);
            const storeIds = [kitchen._id, buffer._id, checkIn._id, cold._id];
            const quantityInfo = await this.checkProductAmount(token, sku, storeIds);
            if (quantityInfo.maxQuantity >= quantity) {
                return true;
            }
            return false;
        } catch (error) {
            console.error('Error checking if ingredient is available:', error.message);
            throw new Error('Failed to check if ingredient is available');
        }
    }

    async newProductCanBePrepared(token, sku, quantity) {
        try {
            const { kitchen, buffer, checkOut, checkIn, cold } = await this.getEachSpace(token);
            console.log("Paso 2");
            const storeIds = [kitchen._id, buffer._id, checkIn._id, cold._id];
            const recipe = (await this.getProductData(token, { sku })).recipe;
            console.log("Paso 3");
            if (recipe.length === 0) {
                console.log("Paso 4");
                const quantityInfo = await this.checkProductAmount(token, sku, storeIds);
                console.log("Paso 5");
                console.log("INFO", quantityInfo);
                if (quantityInfo.maxQuantity >= quantity) {
                    return true;
                } else {
                    return false;
                }
            } else {
                const ingredientAvailable = await this.checkIfIngredientIsAvailable(token, sku, quantity);
                console.log("Paso ingredientAvailable", ingredientAvailable);
                if (ingredientAvailable) {
                    return true;
                } else {
                    for (const ingredient of recipe) {
                        console.log("Paso ingredietn", ingredient);
                        const ingredientAvailable = await this.checkIfIngredientIsAvailable(token, ingredient.sku, ingredient.req);
                        if (!ingredientAvailable) {
                            const ingredienteCanBePrepared = await this.newProductCanBePrepared(token, ingredient.sku, ingredient.req);
                            if (!ingredienteCanBePrepared) {
                                return false;
                            }
                        }
                    }
                    return true;
                }
            }
        } catch (error) {
            console.error('Error checking if product can be prepared:', error.message);
            throw new Error('Failed to check if product can be prepared');
        }
    }

    async checkOrder(sku, quantity) {
        // TODO: Hacerlo variable
        const storeIds = [
            "66f203ced3f26274cc8b50f2", // checkIn
            "66f203ced3f26274cc8b5111", // buffer
            "66f203ced3f26274cc8b5117", // checkOut
            "66f203ced3f26274cc8b5131", // kitchen
            "66f203ced3f26274cc8b514d"  // cold
        ];
    
        try {
            const token = await this.getAuthToken();
            if (!sku || !quantity || quantity <= 0) {
                return 'rechazado';
            }
            // Usar checkProductAmount para calcular la cantidad total disponible en los almacenes
            const quantityInfo = await this.checkProductAmount(token, sku, storeIds);
            let acceptOrder = false;
            let productId = null;
    
            // Si hay suficiente cantidad en los almacenes, mover el producto al checkOut
            if (quantityInfo.maxQuantity >= quantity) {
                // Se acepta la orden
                acceptOrder = true;
                const storeId = quantityInfo.storeId;
                const data = {storeId: storeId, sku: sku};
                // Se obtienen los productos en el espacio identifiado para obtener el ID del producto
                const getProductsInSpace = await this.getSpaceProduct(token, data)
                const product = getProductsInSpace.find(item => item.sku === sku);
                // Se mueve el producto al checkOut
                const moveData = {productId: product._id, storeId: "66f203ced3f26274cc8b5117"}
                const moveInfo = await this.moveProduct(token, moveData)
                console.log("moviendo producto");
                console.log(moveInfo)
                // *** FALTARÍA DISPATCH ***
            } else {
                // Si no hay suficiente producto, verificar si tiene receta
                const productWasMadeInfo = await this.newProductCanBePrepared(token, sku, quantity);
                acceptOrder = productWasMadeInfo;
            }
            console.log("estado de la orden", acceptOrder);
            // Responder con el resultado
            return { acceptOrder, productId };
    
        } catch (error) {
            console.error('Error retrieving products:', error.message);
            throw new Error('Failed to retrieve products');
        }
    };

    async requestProduct(token, data) {
        try {
            const productsResponse = await axios.post(`${URL}/products`, {
                sku: data.sku,
                quantity: data.quantity,
            }, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });
            console.log('Response from coffeeshop API:', productsResponse.status);
            return productsResponse.data;
        } catch (error) {
            console.error('Error making product request:', error.message);
            throw new Error('Failed to request product');
        }
    }

    async moveProduct(token, data) {
        const moveProduct = await axios.patch(`${URL}/products/${data.productId}`, {
            store: data.storeId,
        }, {
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        });
        return moveProduct.data;
    }

    async sendProduct(token, data) {    
        try {
            const productToGroupResponse = await axios.post(`${URL}/products/${data.productId}/group`, {
                group: data.group
            }, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            return productToGroupResponse.data;
        } catch (error) {
            console.error('Error grouping product:', error.message);
            throw new Error('Failed to group product');
        }
    }

    async deliverProduct(token, data) {
        try {
            const dispatchResponse = await axios.post(`${URL}/dispatch`, {
                productId: data.productId,
                orderId: data.orderId,
            }, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });
            return dispatchResponse.data;
        } catch (error) {
            console.error('Error dispatching product:', error.message);
            throw new Error('Failed to dispatch product');
        }
    }

    async getAvailableProducts(token) {
        const productsResponse = await axios.get(`${URL}/products/available`);
        return productsResponse.data;
    }

    // USADA
    async checkProductAmount(token, sku, storeIds) {
        let maxQuantity = 0;
        let storeIdWhereIs = null;
        try {
            // Iterar sobre cada almacén
            for (const storeId of storeIds) {
                const inventory = await this.getSpaceInventory(token, { storeId });
    
                // Buscar el producto en el inventario
                const item = inventory.find(item => item.sku === sku);
                if (item) {
                    // Comparar y actualizar la cantidad máxima
                    if (item.quantity > maxQuantity) {
                        maxQuantity = item.quantity;
                        storeIdWhereIs = storeId;
                    }
                }
            }
            const data = { maxQuantity: maxQuantity, storeId: storeIdWhereIs };
            return data; // Retornar la cantidad máxima encontrada
        } catch (error) {
            console.error('Error checking product amount:', error.message);
            throw new Error('Failed to check product amount');
        }
    }

    

    async checkIfProductCanBeMade(token, data) {
        const storeIds = [
            "66f203ced3f26274cc8b50f2", // checkIn
            "66f203ced3f26274cc8b5111", // buffer
            "66f203ced3f26274cc8b5117", // checkOut
            "66f203ced3f26274cc8b5131", // kitchen
            "66f203ced3f26274cc8b514d"  // cold
        ];
        try {
            const { sku, quantity } = data;
            const recipe = await this.getProductRecipe(token, { sku });
            let acceptOrder = true; // Para iniciar se asume que se puede hacer el producto
            if (!recipe.baseProduct) {
                // *** FLUJO PRODUCTO NO BASE (CON INGREDIENTES) ***
                for (const ingredient of recipe.recipe) {
                    const quantityInfo = await this.checkProductAmount(token, ingredient.sku, storeIds);
                    const supplyRecord = await Supply.findOne({ where: { sku: ingredient.sku } });
                    // Si hay suficiente cantidad del INGREDIENTE en los almacenes, mover el producto al checkOut
                    if (quantityInfo.maxQuantity >= ingredient.req) {
                        // COMO SE TIENE LA CANTIDAD PARA REALIZAR EL PEDIDO SE PERMITE PEDIR MÁS
                        if (recipe.baseProduct === true){
                            if (supplyRecord.status === 'SI'){
                                await Supply.update(
                                    { status: 'NO' },
                                    { where: { sku: ingredient.sku } }
                                );
                            }
                        }
                        const storeId = quantityInfo.storeId;
                        // Se obtienen los ingredientes en el espacio y se filtra por el sku que buscamos
                        const ingredientSku = ingredient.sku;
                        const productIds = await this.getSpaceProduct(token, {storeId: storeId, sku: ingredientSku});
                        const product = (await productIds.find(item => item.sku === ingredientSku));
                        // Se mueve el producto a la cocina
                        console.log("moviendo a la cocina", product);
                        await this.moveProduct(token, {productId: product._id, storeId: "66f203ced3f26274cc8b5131"});
                        console.log("PRODUCTO MOVIDO");
                    } else {
                        const ingredientRecipe = await this.getProductRecipe(token, { sku: ingredient.sku });
                        if (!ingredientRecipe.baseProduct) {
                            // Recursively check if this ingredient can be made <--------------------
                            const result = await this.checkIfProductCanBeMade(token, { sku: ingredient.sku, quantity: ingredient.req });

                            if (!result.accepted) {
                                acceptOrder = false;
                            }
                        } else {
                            // Si el ingrediente no tiene receta, hay que pedirlo si no se pidió anteriormente
                            if (recipe.baseProduct === true){
                                if (supplyRecord.status === 'NO' && recipe.baseProduct === true){
                                    await Supply.update(
                                        { status: 'SI' },
                                        { where: { sku: ingredient.sku } }
                                    );
                                    const ingredientInfo = await this.getProductInfo(token, { sku: ingredient.sku });
                                    const quantityToRequest = Math.ceil(supplyRecord.minimum / ingredientInfo.batch) * ingredientInfo.batch;
                                    await this.requestProduct(token, { sku: ingredient.sku, quantity: quantityToRequest });
                                    acceptOrder = false;
                                }
                            }
                        }
                    }
                }
            }

            if (acceptOrder) {
                return { accepted: true, message: `Product ${sku} is being prepared.` };
            } else {
                return { accepted: false, message: `Not all ingredients are ready for ${sku}.` };
            }
        } catch (error) {
            console.error('Error checking if product can be delivered:', error.message);
            throw new Error('Failed to check if product can be delivered');
        }
        
    }

    // TODO: MEJORAR CON AT: KITCHEN Y DISTRIBUTOR
    async getProductRecipe(token, data) {
        try {
            // Obtener los productos disponibles desde el sistema
            const products = await this.getAvailableProducts(token);
            // Buscar el producto específico por SKU para encontrar su receta
            const product = products.find(item => item.sku === data.sku);
            if (product) {
                if (product.recipe.length > 0) {
                    // Retornar la receta si el producto tiene almenos 1 ingrediente
                    return { baseProduct: false, recipe: product.recipe};
                } else {
                    // Retornar un objeto distintivo para indicar que es un producto base
                    return { baseProduct: true, recipe: 'This product does not require preparation.' };
                }
            } else {
                throw new Error('Product not found.');
            }
        } catch (error) {
            console.error('Error getting product recipe:', error.message);
            throw new Error('Failed to get product recipe');
        }
    }


    async getProductInfo(token, data) {
        try {
            // Obtener los productos disponibles desde el sistema
            const products = await this.getAvailableProducts(token);
            // Buscar el producto específico por SKU para encontrar su receta
            const product = products.find(item => item.sku === data.sku);
            if (product) {
                return product.production;
            } else {
                throw new Error('Product not found.');
            }
        } catch (error) {
            console.error('Error getting product recipe:', error.message);
            throw new Error('Failed to get product recipe');
        }
    }

    async getProductBatch(token, data) {
        try {
            const products = await this.getAvailableProducts(token);
            const product = products.find(item => item.sku === data.sku);
            if (product) {
                return product.production.batch;
            } else {
                throw new Error('Product not found.');
            }
        } catch (error) {
            console.error('Error getting product batch:', error.message);
            throw new Error('Failed to get product batch');
        }
    }

    async prepareProductRecursively(sku, quantity) {
        try {
            // Obtener la receta del producto (o ingrediente)
            const tokenNew = await this.getAuthToken();
            const recipe = await this.getProductRecipe(tokenNew, { sku });
            
            console.log("RECETA", recipe);
            const productionInfo = await this.getProductInfo(tokenNew, { sku });

            // Si el producto tiene ingredientes
            if (!recipe.baseProduct) {
                for (const ingredient of recipe.recipe) {
                    console.log("Revisando si el ingrediente", ingredient.sku, "ya está en el kitchen...");
                    const data = { storeId: "66f203ced3f26274cc8b5131", sku: ingredient.sku }; // kitchen
                    const tokenNew = await this.getAuthToken();
                    const getProductsInSpace = await this.getSpaceProduct(tokenNew, data);
                    const product = await getProductsInSpace.find(item => item.sku === ingredient.sku);
                    if (product) {
                        console.log(`Ingrediente ${ingredient.sku} encontrado en el kitchen.`);
                        continue;
                    } else {
                        console.log(`Ingrediente ${ingredient.sku} no encontrado en el kitchen.`);
                        await this.prepareProductRecursively(ingredient.sku, ingredient.req);
                    }
                }
                const productionBatch = await this.getProductBatch(tokenNew, { sku });
                const requestProductResponse = await this.requestProduct(tokenNew, { sku, quantity: productionBatch });
                console.log(requestProductResponse);
                const waitTimeInMinutes = productionInfo.time;
                const waitTimeInMilliseconds = waitTimeInMinutes * 60 * 1000;
                await new Promise(resolve => setTimeout(resolve, waitTimeInMilliseconds));
                console.log(`El producto ya fue preparado ${sku}`);
            } else {
                // 
                console.log(`El producto ${sku} NO REQUIERE PREPARACION.`);
                const productInSpace = await this.getSpaceProduct(tokenNew, { storeId: "66f203ced3f26274cc8b5131", sku });
                if (productInSpace.length > 0) {
                    console.log(`El producto BASE ${sku} ya está en el kitchen.`);
                } else {
                    console.log(`El producto BASE ${sku} NO está en el kitchen.`);
                    const spaces = await this.getEachSpace(tokenNew);   
                    const { kitchen, buffer, checkOut, checkIn, cold } = spaces;
                    const spacesIds = [buffer._id, cold._id, checkIn._id];
                    const quantityInfo = await this.checkProductAmount(tokenNew, sku, spacesIds);

                    const product = await this.getSpaceProduct(tokenNew, { storeId: quantityInfo.storeId, sku });
                    const moveData = { productId: product[0]._id, storeId: "66f203ced3f26274cc8b5131" };
                    const moveInfo = await this.moveProduct(tokenNew, moveData);
                    console.log(`Producto BASE ${sku} movido al kitchen.`);
                }
            }
        } catch (error) {
            console.error(`Error en la preparación del producto ${sku}:`, error.message);
            throw new Error(`Fallo en la preparación del producto ${sku}`);
        }
    }

    async prepareAndMoveProducts(token, order, orderId) {
        try {
            console.log("ORDEN", order)
            const token = await this.getAuthToken();
            for (const item of order) {
                const { sku, quantity } = item;
                for (let i = 0; i < quantity; i++) {
                    const productInSpace = await this.getSpaceProduct(token, { storeId: "66f203ced3f26274cc8b5131", sku });
                    if (!productInSpace.length > 0) {
                        await this.prepareProductRecursively(sku, quantity);
                    }
                    const data = { storeId: "66f203ced3f26274cc8b5131", sku: sku }; // kitchen
                    const getProductsInSpace = await this.getSpaceProduct(token, data);
                    const product = await getProductsInSpace.find(item => item.sku === sku);

                    console.log("Todo listo hay q moverlo");
        
                    if (product) {
                        const moveResponse = await this.moveProduct(token, { productId: product._id, storeId: "66f203ced3f26274cc8b5117" }); // checkOut
                        console.log(`Producto ${sku} movido al checkOut.`, orderId, product._id);
                        const deliverResponse = await this.deliverProduct(token, { productId: product._id, orderId: orderId });
                        console.log(deliverResponse);
                    }
                }
            }
        } catch (error) {
            console.error(`Error en la preparación de productos para la orden ${orderId}:`, error);
        }
    };
}

module.exports = CoffeeshopService;