const { default: axios } = require('axios');
const { Order, OrderRequest, Supply } = require('../models');
const OrderManagementService = require('../services/orders_system.service');
const orderManagement = new OrderManagementService();

const CoffeeshopService = require('../services/coffeeshop.service');
const coffeeshop = new CoffeeshopService();

const managementService = require('./management_controller');
const { or } = require('sequelize');


const getAllOrders = async (ctx) => {
    try {
        const orders = await Order.findAll({
            order: [['receivedAt', 'DESC']]
        });

        ctx.status = 200;
        ctx.body = orders;
    } catch (error) {
        ctx.status = 400;
        ctx.body = { error: error.message };
    }
};

const getAllOrderRequest = async (ctx) => {
    try {
        const OrderRequests = await OrderRequest.findAll({
            order: [['createdAt', 'DESC']]
        });

        ctx.status = 200;
        ctx.body = OrderRequests;
    } catch (error) {
        ctx.status = 400;
        ctx.body = { error: error.message };
    }
};

const createOrder = async (ctx) => {
    try {
        const token = await orderManagement.getOrderAuthToken();
        const { remaining, coffeeshopToken } = await coffeeshop.getRequestLimit();
        if (remaining <= 50) {
            ctx.status = 201;
            ctx.body = { status: 'rechazado' };
            return;
        }
        const { id, dueDate, order } = ctx.request.body;
        const { kitchen, buffer, checkOut, checkIn, cold } = await coffeeshop.getEachSpace(coffeeshopToken);
        const storeIds = [kitchen._id, buffer._id, checkIn._id, cold._id];
        const getAvailableProducts = await coffeeshop.getAvailableProducts(coffeeshopToken);

        const supplyData = await Supply.findAll();
            supplyData.forEach(async (supply) => {
            await coffeeshop.checkSupply(storeIds, coffeeshopToken, supply.sku, getAvailableProducts);
        });

        if (!id || !dueDate || !order) {
            ctx.status = 400;
            ctx.body = { error: 'Missing id, dueDate, or order information.' };
            return;
        }

        let acceptOrder = true;
        // Verificar cada producto en la orden
        for (const item of order) {
            const { sku, quantity } = item;
            const orderInfo = await coffeeshop.checkOrder(sku, quantity);
            console.log(orderInfo);
            if (!orderInfo.acceptOrder) {
                acceptOrder = false;  // Si algún producto no tiene inventario, no aceptamos el pedido
                break;
            }
        }

        console.log("VAMOS A PREPARAR LOS PRODUCTOS");

        let orderStatus;
        let orderStatus2;
        if (acceptOrder) {
            orderStatus = 'aceptado';
            orderStatus2 = 'aceptada'   
            console.log("ORDER bajo acceptOrder", order);
            await coffeeshop.prepareAndMoveProducts(token, order, id);
        } else {
            orderStatus = 'rechazado';
            orderStatus2 = 'rechazada';
        }
        // Actualizar el estado del pedido
        // await orderManagement.updateOrderStatus(token, {
        //      orderId: id,
        //      status: orderStatus2,
        //  });
        await Order.create({
            orderId: id,
            sku: JSON.stringify(order),
            status: orderStatus,
            receivedAt: new Date(),
            orderMaxDate: dueDate,
            quantity: order[0].quantity
        });
        // Devolver la respuesta dependiendo del resultado
        // Faltaría dispatch product y ver la wea de la bdd y preparar los productos cuando lleguen********************************
        ctx.status = 201;
        ctx.body = {
            status: `${orderStatus}`,
        };

    } catch (error) {
        console.error(error);
        ctx.status = 500;
        ctx.body = { error: 'An error occurred while creating the order.' };
    }
};


const getOrdersStatistics = async (ctx) => {
    try {
        const orderStatistics = await orderManagement.getOrdersStatistics();
        ctx.status = 200;
        ctx.body = orderStatistics;
    } catch (error) {
        ctx.status = 400;
        ctx.body = { error: error.message };
    }
}

const updateOrderStatus = async (ctx) => {
    try {
        const token = await orderManagement.getAuthToken();
        const { orderId, status } = ctx.request.body;
        if (!orderId || !status) {
            ctx.status = 400;
            ctx.body = { error: 'Missing orderId or status.' };
            return;
        }
        const data = {
            orderId: orderId,
            status: status
        };
        const orderStatus = await orderManagement.updateOrderStatus(token, data);
        ctx.status = 200;
        ctx.body = orderStatus;
    } catch (error) {
        ctx.status = 400;
        ctx.body = { error: error.message };
    }
}

const createPurchaseOrder = async (ctx) => {
    try {
        const token = await orderManagement.getOrderAuthToken();
        const { cliente, proveedor, sku, expiration } = ctx.request.body;

        const data = {
            client: cliente,
            provider: proveedor,
            sku: sku,
            expiration: expiration
        };
        const order = await orderManagement.createOrder(token, data);
        await OrderRequest.create({
            orderId: order.id,
            status: order.estado,
            sku: JSON.stringify(sku),
            quantity: 0,
            createdAt: new Date()
        });
        let datitos = {
            id: order.id,
            dueDate: expiration,
            order: sku
        }
        console.log(datitos);
        const sendOrderResponse = await axios.post(`https://granizo${proveedor}.ing.puc.cl/api/orders`, datitos, {
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        });
        console.log(sendOrderResponse.data);
        ctx .status = 201;
        ctx.body = sendOrderResponse.data;
    } catch (error) {
        ctx.status = 400;
        ctx.body = { error: error.message };
    }
}

const getOrder = async (ctx) => {
    try {
        const token = await orderManagement.getAuthToken();
        const { orderId } = ctx.params;
        if (!orderId) {
            ctx.status = 400;
            ctx.body = { error: 'Missing orderId.' };
            return;
        }
        const data = {
            orderId: orderId
        };
        const order = await orderManagement.getOrder(token, data);
        ctx.status = 200;
        ctx.body = order;
    } catch (error) {
        ctx.status = 400;
        ctx.body = { error: error.message };
    }
}





module.exports = { getAllOrders, getAllOrderRequest, createOrder, getOrdersStatistics, updateOrderStatus, createPurchaseOrder, getOrder };