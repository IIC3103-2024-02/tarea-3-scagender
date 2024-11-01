const Router = require('@koa/router');
const axios = require('axios');
const router = new Router();

const URL = process.env.URL_CAFETERIA;
const CoffeeshopService = require('../services/coffeeshop.service');
const coffeeshop = new CoffeeshopService();

const {
    getExpiringItems,
    getAvailableStorage,
    getTotalStockBySKU,
} = require('../controllers/metrics_controller');
// Function token

// Productos que expirarán
router.get('/expiring-items', getExpiringItems);

// total stock counts by SKU
router.get('/total-sku', getTotalStockBySKU);

// available storage
router.get('/available-storage', getAvailableStorage);

module.exports = router;
