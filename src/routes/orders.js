const Router = require('@koa/router');
const router = new Router();
const {
        getAllOrders,
        createOrder,
        getOrdersStatistics,
        updateOrderStatus,
        createPurchaseOrder,
        getOrder,
        getAllOrderRequest,
    } = require('../controllers/orders_controller');

router.get('/', getAllOrders);

router.get('/orderRequest', getAllOrderRequest);

router.post('/', createOrder);

router.get('/stats', getOrdersStatistics);

router.post('/:orderId/status', updateOrderStatus);

router.post('/purchase', createPurchaseOrder);

router.get('/:orderId', getOrder);



module.exports = router;