import React, { useState, useEffect, useRef } from 'react';
import './Metrics.css'; // Ensure you have this CSS file

function ChatPage() {
  const [messages, setMessages] = useState([]); // State for chat history
  const [newMessage, setNewMessage] = useState(''); // State for the current message
  const chatEndRef = useRef(null); // Reference for auto-scrolling

  // Movie scripts array
  const scripts = [
    { title: "Kung Fu Panda", url: "https://imsdb.com/scripts/Kung-Fu-Panda.html" },
    { title: "Aladdin", url: "https://imsdb.com/scripts/Aladdin.html" },
    { title: "Beauty and the Beast", url: "https://imsdb.com/scripts/Beauty-and-the-Beast.html" },
    { title: "Coco", url: "https://imsdb.com/scripts/Coco.html" },
    { title: "Happy Feet", url: "https://imsdb.com/scripts/Happy-Feet.html" },
    { title: "Little Mermaid", url: "https://imsdb.com/scripts/Little-Mermaid,-The.html" },
    { title: "Shrek the Third", url: "https://imsdb.com/scripts/Shrek-the-Third.html" },
    { title: "Wall-E", url: "https://imsdb.com/scripts/Wall-E.html" },
    { title: "Zootopia", url: "https://imsdb.com/scripts/Zootopia.html" },
    { title: "The Incredibles", url: "https://imsdb.com/scripts/Incredibles,-The.html" },
  ];

  // Function to send the message
  const sendMessage = async () => {
    if (newMessage.trim() === '') return;

    const userMessage = {
      sender: 'Usuario',
      content: newMessage,
      date: new Date().toLocaleString(),
    };
    setMessages((prevMessages) => [...prevMessages, userMessage]);

    try {
      // Send the message to the API
      const response = await fetch('https://tarea-3-scagender.onrender.com/api/guiones/ask-question', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: newMessage }),
      });

      // Process the API response
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

    setNewMessage(''); // Clear the input field
  };

  // Scroll to the bottom of the chat panel whenever messages change
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="chat-container">
      {/* Introductory message */}
      <div className="intro-message">
        <p>Hola soy un experto en las siguientes películas:</p>
        <ul>
          {scripts.map((script, index) => (
            <li key={index}>
              <a href={script.url} target="_blank" rel="noopener noreferrer">{script.title}</a>
            </li>
          ))}
        </ul>
        <p>Para obtener una mejor respuesta, explícita el nombre de la película en tu prompt (Protip: Mejores respuestas si el título está en inglés).</p>
      </div>

      {/* Chat panel */}
      <div className="chat-panel">
        {messages.map((msg, index) => (
          <div key={index} className={`message-item ${msg.sender === 'Usuario' ? 'user-message' : 'ai-message'}`}>
            <p className="message-text">
              <strong>{msg.sender}</strong> [{msg.date}]: {msg.content}
            </p>
          </div>
        ))}
        {/* Scroll to the bottom marker */}
        <div ref={chatEndRef} />
      </div>

      {/* Input field and send button */}
      <div className="input-container">
        <input
          type="text"
          className="input-field"
          placeholder="Escribe tu mensaje..."
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyPress={(e) => {
            if (e.key === 'Enter') sendMessage(); // Send message on Enter key
          }}
        />
        <button className="send-button" onClick={sendMessage}>
          Enviar
        </button>
      </div>
    </div>
  );
}

export default ChatPage;
