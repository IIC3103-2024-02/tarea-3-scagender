import React, { useState } from 'react';

function ChatPage() {
  const [messages, setMessages] = useState([]); // Estado para el historial de mensajes
  const [newMessage, setNewMessage] = useState(''); // Estado para el mensaje actual

  // Función para enviar el mensaje
  const sendMessage = async () => {
    if (newMessage.trim() === '') return;

    // Agrega el mensaje del usuario al historial
    const userMessage = {
      sender: 'Usuario',
      content: newMessage,
      date: new Date().toLocaleString(),
    };
    setMessages((prevMessages) => [...prevMessages, userMessage]);

    try {
      // Realizar la solicitud a la API
      console.log('Enviando mensaje a la API:', newMessage);
      const response = await fetch('https://tarea-3-scagender.onrender.com/api/guiones/ask-question', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json', // Asegúrate de establecer el tipo de contenido
        },
        body: JSON.stringify({ query: newMessage }), // Asegúrate de que el cuerpo tenga el formato correcto
      });
      console.log(response);
      // Procesar la respuesta de la API
      if (response.ok) {
        const data = await response.json();
        const aiMessage = {
          sender: 'IA',
          content: data.response || 'Respuesta de la IA no disponible.',
          date: new Date().toLocaleString(),
        };
        setMessages((prevMessages) => [...prevMessages, aiMessage]);
      } else {
        const errorMessage = {
          sender: 'IA',
          content: 'Error al procesar la pregunta. Inténtalo de nuevo más tarde.',
          date: new Date().toLocaleString(),
        };
        setMessages((prevMessages) => [...prevMessages, errorMessage]);
      }
    } catch (error) {
      const errorMessage = {
        sender: 'IA',
        content: 'No se pudo conectar con el servidor.',
        date: new Date().toLocaleString(),
      };
      setMessages((prevMessages) => [...prevMessages, errorMessage]);
    }

    setNewMessage(''); // Limpia el campo de entrada
  };

  return (
    <div className="flex flex-col w-1/3 p-4">
      {/* Panel de chat */}
      <div className="chat-panel bg-white rounded-lg shadow flex-1 overflow-y-scroll mb-4">
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`message-item ${msg.sender === 'Usuario' ? 'text-right' : 'text-left'}`}
          >
            <p className="text-black">
              <strong>{msg.sender}</strong> [{msg.date}]: {msg.content}
            </p>
          </div>
        ))}
      </div>

      {/* Campo de entrada y botón de envío */}
      <div className="flex items-center">
        <input
          type="text"
          className="flex-1 p-2 border border-gray-400 rounded"
          placeholder="Escribe tu mensaje..."
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyPress={(e) => {
            if (e.key === 'Enter') sendMessage(); // Enviar mensaje al presionar Enter
          }}
        />
        <button
          className="bg-blue-500 text-white p-2 ml-2 rounded"
          onClick={sendMessage}
        >
          Enviar
        </button>
      </div>
    </div>
  );
}

export default ChatPage;
