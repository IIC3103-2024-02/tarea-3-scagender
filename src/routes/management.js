const Router = require('@koa/router');
const router = new Router();
const {
    getSpaces,
    getSpaceProduct,
    getSpaceInventory,
    requestProduct,
    moveProduct,
    sendProduct,
    deliverProduct
} = require('../controllers/management_controller');

router.get('/spaces', getSpaces);

router.get('/spaces/:storeId/product', getSpaceProduct);

router.get('/spaces/:storeId/inventory', getSpaceInventory);

router.post('/requestProduct', requestProduct);

router.post('/moveProduct', moveProduct);

router.post('/sendProduct', sendProduct);

router.post('/deliverProduct', deliverProduct);

module.exports = router;

