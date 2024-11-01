import React, { useEffect, useState } from 'react';
import './OrderTable.css';

function OrderTable() {
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    fetch('https://granizo13.ing.puc.cl/api/orders')
      .then(response => response.json())
      .then(data => setOrders(data))
      .catch(error => console.error('Error:', error));
  }, []);

  return (
    <div className="data-table-container">
      <h1>Tabla de Pedidos</h1>
      <table className="data-table">
        <thead>
          <tr>
            <th>Fecha y hora del pedido</th>
            <th>ID del pedido</th>
            <th>SKU/Cantidad</th>
            <th>Estado</th>
            <th>Más información</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((order, index) => (
            <tr key={index}>
              <td>{new Date(order.receivedAt).toLocaleString()}</td>
              <td>{order.orderId}</td>
              <td>{`${order.sku} - ${order.quantity}`}</td>
              <td>{order.status}</td>
              <td><button onClick={() => handleMoreInfo(order.orderId)}>Más...</button></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function handleMoreInfo(orderId) {
  // Implementa la función para manejar "más información"
  console.log('Mostrar más información para', orderId);
}

export default OrderTable;