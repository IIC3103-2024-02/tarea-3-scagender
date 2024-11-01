const CoffeeshopService = require('../services/coffeeshop.service');
const coffeeshop = new CoffeeshopService();

const getSpaces = async (ctx) => {
    try {
        const token = await coffeeshop.getAuthToken();
        const spaces = await coffeeshop.getSpaces(token);
        ctx.status = 200;
        ctx.body = spaces;
    } catch (error) {
        ctx.status = 400;
        ctx.body = { error: error.message };
    }
};

const getSpaceProduct = async (ctx) => {
    try {
        const token = await coffeeshop.getAuthToken();
        const data = {
            storeId: ctx.params.storeId,
            sku: ctx.query.sku,
        };
        const product = await coffeeshop.getSpaceProduct(token, data);
        ctx.status = 200;
        ctx.body = product;
    } catch (error) {
        ctx.status = 400;
        ctx.body = { error: error.message };
    }
};

const getSpaceInventory = async (ctx) => {
    try {
        const token = await coffeeshop.getAuthToken();
        const data = {
            storeId: ctx.params.storeId,
        };
        const inventory = await coffeeshop.getSpaceInventory(token, data);
        ctx.status = 200;
        ctx.body = inventory;
    } catch (error) {
        ctx.status = 400;
        ctx.body = { error: error.message };
    }
}

const requestProduct = async (ctx) => {
    try {
        console.log("Empezando")
        const token = await coffeeshop.getAuthToken();
        console.log("Pasó")
        if (!ctx.request.body.sku || !ctx.request.body.quantity) {
            ctx.status = 400;
            ctx.body = { error: 'Missing sku or quantity.' };
            return;
        }
        if (ctx.request.body.quantity <= 0 || ctx.request.body.quantity > 5000) {
            ctx.status = 400;
            ctx.body = { error: 'Quantity must be integer between 1 and 5000' };
            return;
        }
        const data = {
            sku: ctx.request.body.sku,
            quantity: ctx.request.body.quantity,
        };
        const product = await coffeeshop.requestProduct(token, data);
        console.log(product);
        ctx.status = 201;
        ctx.body = product;
    } catch (error) {
        ctx.status = 400;
        ctx.body = { error: error.message };
    }
};

const moveProduct = async (ctx) => {
    try {
        const token = await coffeeshop.getAuthToken();
        const { productId, storeId } = ctx.request.body;
        if (!productId || !storeId) {
            ctx.status = 400;
            ctx.body = { error: 'Missing productId or storeId.' };
            return;
        }

        const data = {
            productId: productId,
            storeId: storeId
        };

        const moveResponse = await coffeeshop.moveProduct(token, data);
        ctx.status = 200;
        ctx.body = { message: 'Producto movido exitosamente.', moveResponse };
    } catch (error) {
        console.error('Error al mover el producto:', error.message);
        ctx.status = 400;
        ctx.body = { error: error.message };
    }
};

const sendProduct = async (ctx) => {    
    try {
        const token = await coffeeshop.getAuthToken();
        const { productId } = ctx.params;
        const { group } = ctx.request.body;
        if (!group || group < 1) {
            ctx.status = 400;
            ctx.body = { error: 'Group number must be greater than or equal to 1.' };
            return;
        }
        const data = {
            productId,
            group
        };
        const productToGroupResponse = await coffeeshop.groupProduct(token, data);
        ctx.status = 200;
        ctx.body = productToGroupResponse;
    } catch (error) {
        console.error('Error grouping product:', error.message);
        ctx.status = 500;
        ctx.body = { error: 'An error occurred while grouping the product.' };
    }
}

const deliverProduct = async (ctx) => {
    try {
        const token = await coffeeshop.getAuthToken();
        const { productId, orderId } = ctx.request.body;
        if (!productId || !orderId) {
            ctx.status = 400;
            ctx.body = { error: 'productId and orderId are required.' };
            return;
        }
        const data = {
            productId,
            orderId
        };
        const dispatchResponse = await coffeeshop.deliverProduct(token, data);
        ctx.status = 200;
        ctx.body = { message: 'Product dispatched successfully.', dispatchResponse };
    } catch (error) {
        console.error('Error delivering product:', error.message);
        ctx.status = 500;
        ctx.body = { error: 'An error occurred while delivering the product.' };
    }
};


module.exports = {
    getSpaces,
    getSpaceProduct,
    getSpaceInventory,
    requestProduct,
    moveProduct,
    sendProduct,
    deliverProduct,
};