const axios = require('axios');
const URL = process.env.ORDER_MANAGEMENT_URL;
const secretToken = process.env.ORDER_MANAGEMENT_TOKEN;

class OrderManagementService {
    async getOrderAuthToken() {
        try {
            const authResponse = await axios.post(`${URL}/ordenes-compra/autenticar`, {
                group: 13,
                secret: `${secretToken}`
            });
            return authResponse.data.token;
        } catch (error) {
            console.error('Error getting order auth token:', error.message);
            throw new Error('Failed to get order auth token');
        }
    }

    async getOrdersStatistics() {
        try {
            const orderStatisticsResponse = await axios.get(`${URL}/ordenes-compra/stats`);
            const data = orderStatisticsResponse.data;
            const proveedorAceptadasGrupo1 = data.proveedor.aceptadas.filter(entry => entry.grupo === 13);
            const proveedorCumplidasGrupo1 = data.proveedor.cumplidas.filter(entry => entry.grupo === 13);
            const clienteAceptadasGrupo1 = data.cliente.aceptadas.filter(entry => entry.grupo === 13);
            const clienteCumplidasGrupo1 = data.cliente.cumplidas.filter(entry => entry.grupo === 13);
            const result = {
                proveedor: {
                    aceptadas: proveedorAceptadasGrupo1,
                    cumplidas: proveedorCumplidasGrupo1
                },
                cliente: {
                    aceptadas: clienteAceptadasGrupo1,
                    cumplidas: clienteCumplidasGrupo1
                }
            };
    
            return data;
        } catch (error) {
            console.error('Error getting order statistics:', error.message);
            throw new Error('Failed to get order statistics');
        }
    }

    async updateOrderStatus(token, data) {
        try {
            const {orderId, status} = data;
            const orderStatusResponse = await axios.post(`${URL}/ordenes-compra/ordenes/${orderId}/estado`, 
                {estado: status},
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                }
            );
            return orderStatusResponse.data;
        } catch (error) {
            console.error('Error updating order status:', error.message);
            throw new Error('Failed to update order status');
        }
    }

    async createOrder(token, data) {
        try {
            const currentDate = new Date();
            const threeHoursLater = new Date(currentDate.getTime() + 12 * 60 * 60 * 1000);
            const orderResponse = await axios.post(`${URL}/ordenes-compra/ordenes`, {
                cliente: data.client,
                proveedor: data.provider,
                sku: data.sku[0].sku,
                cantidad: data.sku[0].quantity,
                vencimiento: threeHoursLater.toISOString(),
            }, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });
            return orderResponse.data;
        } catch (error) {
            console.error('Error creating order:', error.message);
            throw new Error('Failed to create order');
        }
    }

    async getOrder(token, data) {
        try {
            const orderResponse = await axios.get(`${URL}/ordenes-compra/ordenes/${data.orderId}`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            return orderResponse.data;
        } catch (error) {
            console.error('Error getting order:', error.message);
            throw new Error('Failed to get order');
        }
    }

    async getPubSubKey() {
        return;
    }

    async createWebhook(token, data) {
        return;
    }

    async getWebhooks(token) {
        return;
    }

    async testWebhook(token, data) {
        return;
    }
}

module.exports = OrderManagementService;