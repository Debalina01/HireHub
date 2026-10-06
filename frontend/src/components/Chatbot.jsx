import React, { useState, useRef, useEffect } from 'react';

export default function Chatbot({ user }) {
  const [isOpen, setIsOpen] = useState(false);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const suggestions = [
    'My interviews this week',
    'My applications',
    'My progress',
    'My reminders'
  ];

  const getActiveUserEmail = () => {
    if (user?.email) return user.email;
    try {
      const saved = localStorage.getItem('hirehubAuth') || sessionStorage.getItem('hirehubAuth');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed?.email) return parsed.email;
      }
    } catch {
    }
    return 'debalina@example.com';
  };

  const activeEmail = getActiveUserEmail();

  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'bot',
      text: "Hi! I'm your HireHub Assistant 👋\nI can help you check your applications, interviews, reminders, and progress."
    }
  ]);

  useEffect(() => {
    setMessages([
      {
        id: Date.now(),
        sender: 'bot',
        text: "Hi! I'm your HireHub Assistant 👋\nI can help you check your applications, interviews, reminders, and progress."
      }
    ]);
    setInputText('');
    setIsLoading(false);
  }, [activeEmail]);

  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, isLoading]);

  const handleSend = async (textToSend) => {
    const query = (typeof textToSend === 'string' ? textToSend : inputText).trim();
    if (!query || isLoading) return;

    const userMessage = {
      id: Date.now(),
      sender: 'user',
      text: query
    };

    const currentHistory = [...messages, userMessage];
    setMessages(currentHistory);
    setInputText('');
    setIsLoading(true);

    const historyPayload = messages
      .slice(-8)
      .map((m) => ({
        sender: m.sender,
        text: m.text
      }));

    const endpoint = `${import.meta.env.VITE_API_BASE_URL}/api/chat`;
    let replyText = "I'm having trouble connecting right now. Please try again in a moment.";

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-User-Email': activeEmail
        },
        body: JSON.stringify({
          message: query,
          history: historyPayload,
          user_email: activeEmail
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data && data.reply) {
          replyText = data.reply;
        }
      }
    } catch {
    }

    const botMessage = {
      id: Date.now() + 1,
      sender: 'bot',
      text: replyText
    };

    setMessages((prev) => [...prev, botMessage]);
    setIsLoading(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    handleSend();
  };

  return (
    <>
      <button
        className="chatbot-toggle-btn"
        onClick={() => setIsOpen(!isOpen)}
        aria-label={isOpen ? 'Close Chatbot' : 'Open Chatbot'}
      >
        {isOpen ? (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        ) : (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
          </svg>
        )}
      </button>

      {isOpen && (
        <div className="chatbot-window">
          <div className="chatbot-header">
            <div className="chatbot-header-info">
              <div className="chatbot-avatar">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2 2 2 0 0 1-2-2V4a2 2 0 0 1 2-2z"></path>
                  <rect x="4" y="8" width="16" height="12" rx="2"></rect>
                  <circle cx="9" cy="13" r="1"></circle>
                  <circle cx="15" cy="13" r="1"></circle>
                </svg>
              </div>
              <div>
                <h3 className="chatbot-title">HireHub Assistant</h3>
                <div className="chatbot-status">
                  <span className="status-dot"></span>
                  <span>Online</span>
                </div>
              </div>
            </div>
            <button
              className="chatbot-close-btn"
              onClick={() => setIsOpen(false)}
              aria-label="Close chat window"
            >
              &times;
            </button>
          </div>

          <div className="chatbot-body">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`chatbot-message-row ${msg.sender === 'user' ? 'user-row' : 'bot-row'}`}
              >
                <div className={`chatbot-bubble ${msg.sender === 'user' ? 'user-bubble' : 'bot-bubble'}`}>
                  <p className="chatbot-text">{msg.text}</p>
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="chatbot-message-row bot-row">
                <div className="chatbot-bubble bot-bubble chatbot-loading-bubble" role="status" aria-label="Thinking...">
                  <span className="chatbot-loading-dot"></span>
                  <span className="chatbot-loading-dot"></span>
                  <span className="chatbot-loading-dot"></span>
                  <span className="chatbot-loading-text">Thinking...</span>
                </div>
              </div>
            )}

            {messages.length === 1 && !isLoading && (
              <div className="chatbot-suggestions">
                <p className="suggestions-label">Suggested questions:</p>
                <div className="suggestions-list">
                  {suggestions.map((item, index) => (
                    <button
                      key={index}
                      type="button"
                      className="suggestion-chip"
                      onClick={() => handleSend(item)}
                      disabled={isLoading}
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          <form className="chatbot-footer" onSubmit={handleSubmit}>
            <input
              type="text"
              placeholder={isLoading ? "Thinking..." : "Ask about interviews, applications..."}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              className="chatbot-input"
              disabled={isLoading}
            />
            <button
              type="submit"
              className="chatbot-send-btn"
              aria-label="Send message"
              disabled={!inputText.trim() || isLoading}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13"></line>
                <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
              </svg>
            </button>
          </form>
        </div>
      )}
    </>
  );
}
