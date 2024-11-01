const CoffeeshopService = require('../services/coffeeshop.service');
const coffeeshop = new CoffeeshopService();

const getExpiringItems = async (ctx) => {
    try {
        const token = await coffeeshop.getAuthToken();
        const response = await coffeeshop.getAvailableProducts(token);

        const expiringItems = response.filter(product => product.expiration <= 3);
        ctx.body = expiringItems.map(product => ({
            sku: product.sku,
            name: product.name,
            expiration: product.expiration
        }));
        ctx.status = 200;
    } catch (error) {
        ctx.status = 400;
        ctx.body = { error: error.message };
    }
}

const getTotalStockBySKU = async (ctx) => {
    try {
        const token = await coffeeshop.getAuthToken();
        const spacesResponse = await coffeeshop.getSpaces(token);

        const inventoryCounts = {};
        await Promise.all(spacesResponse.map(async (space) => {
            const inventoryResponse = await coffeeshop.getSpaceInventory(token, { storeId: space._id });

            inventoryResponse.forEach(item => {
                inventoryCounts[item.sku] = (inventoryCounts[item.sku] || 0) + item.quantity;
            });
        }));
        ctx.body = inventoryCounts;
        ctx.status = 200;
    } catch (error) {
        ctx.status = 400;
        ctx.body = { error: error.message };
    }
}

const getAvailableStorage = async (ctx) => {
    try {
        const token = await coffeeshop.getAuthToken();
        const spacesResponse = await coffeeshop.getSpaces(token);

        const formattedSpaces = spacesResponse.map(space => ({
            id: space._id,
            cold: space.cold,
            kitchen: space.kitchen,
            checkIn: space.checkIn,
            checkOut: space.checkOut,
            buffer: space.buffer,
            totalSpace: space.totalSpace,
            usedSpace: space.usedSpace,
        }));

        // Calculate and format used space
        const spacesWithUsage = formattedSpaces.map(space => ({
            ...space,
            usedSpace: `${space.usedSpace}/${space.totalSpace} (${((space.usedSpace / space.totalSpace) * 100).toFixed(2)}%)`
        }));

        ctx.body = spacesWithUsage;
        ctx.status = 200;
    } catch (error) {
        ctx.status = 400;
        ctx.body = { error: error.message };
    }
}

module.exports = { getExpiringItems, getAvailableStorage, getTotalStockBySKU };