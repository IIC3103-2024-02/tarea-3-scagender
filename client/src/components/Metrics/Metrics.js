import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './Metrics.css';

function Metrics() {
    const [ordersPerHour, setOrdersPerHour] = useState(0);
    const [ordersPerDay, setOrdersPerDay] = useState(0);
    const [expiringProducts, setExpiringProducts] = useState([]);
    const [cafeteriaSpaces, setCafeteriaSpaces] = useState([]);
    const [totalStockBySKU, setTotalStockBySKU] = useState({});

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch metrics data from the server
                const metricsEndpoints = [
                    'https://granizo13.ing.puc.cl/api/metrics/expiring-items',
                    'https://granizo13.ing.puc.cl/api/metrics/total-sku',
                    'https://granizo13.ing.puc.cl/api/metrics/available-storage',
                    'https://granizo13.ing.puc.cl/api/orders'
                ];

                const [expiringItemsResponse, skuResponse, storageResponse, ordersResponse] = await Promise.all(
                    metricsEndpoints.map(url => axios.get(url))
                );

                setExpiringProducts(expiringItemsResponse.data);
                setTotalStockBySKU(skuResponse.data);
                setCafeteriaSpaces(storageResponse.data.map(space => ({
                    ...space,
                    name: space.kitchen ? "Kitchen" : space.cold ? "Cold" : space.checkIn ? "Check In" : space.checkOut ? "Check Out" : space.buffer ? "Buffer" : "Unknown"
                })));

                const orders = ordersResponse.data;
                const totalOrders = orders.length;
                const totalDays = new Set(orders.map(order => new Date(order.receivedAt).toDateString())).size;
                const ordersPerDayCalc = totalDays > 0 ? totalOrders / totalDays : 0;
                const ordersPerHourCalc = ordersPerDayCalc / 24;

                setOrdersPerDay(ordersPerDayCalc.toFixed(2));
                setOrdersPerHour(ordersPerHourCalc.toFixed(2));

            } catch (error) {
                console.error('Error fetching data:', error);
            }
        };

        fetchData();
    }, []);

    return (
        <div className="metrics-container">
            <div className="metric">
                <h2>Orders per day</h2>
                <p>{ordersPerDay}</p>
            </div>
            <div className="metric">
                <h2>Orders per hour</h2>
                <p>{ordersPerHour}</p>
            </div>
            <div className="metric">
                <h2>Expiring products</h2>
                <ul>
                    {expiringProducts.map(product => (
                        <li key={product.sku}>
                            <p>{product.name}</p>
                            <p>Expira en: {product.expiration} horas</p>
                        </li>
                    ))}
                </ul>
            </div>
            <div className="metric">
                <h2>Cafeteria Spaces</h2>
                <ul>
                    {cafeteriaSpaces.map(space => (
                        <li key={space.id}>
                            <p>Space: {space.name}</p>
                            <p>Used Space: {space.usedSpace}</p>
                            <p>Details: {space.details}</p>
                        </li>
                    ))}
                </ul>
            </div>
            <div className="metric">
                <h2>Total Stock by SKU</h2>
                <ul>
                    {Object.entries(totalStockBySKU).map(([sku, quantity]) => (
                        <li key={sku}>
                            <p>SKU: {sku}</p>
                            <p>Quantity: {quantity}</p>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
}

export default Metrics;
