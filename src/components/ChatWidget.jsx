import React, { useState, useRef, useEffect } from 'react';

const ChatWidget = () => {
  const [isWidgetOpen, setIsWidgetOpen] = useState(true);
  const [currentMessage, setCurrentMessage] = useState('');
  const [messages, setMessages] = useState([
    { sender: 'bot', text: 'Welcome to Matalai!' },
    { sender: 'bot', text: 'How can I help you today?' }
  ]);

  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = () => {
    const trimmedMessage = currentMessage.trim();
    if (trimmedMessage) {
      setMessages(prevMessages => [...prevMessages, { sender: 'user', text: trimmedMessage }]);
      setCurrentMessage('');
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSendMessage();
    }
  };

  if (!isWidgetOpen) {
    return (
      <button
        onClick={() => setIsWidgetOpen(true)}
        className="fixed bottom-4 right-4 bg-[rgb(233,228,217)] text-black px-6 py-3 rounded-full shadow-lg hover:bg-[rgb(213,208,196)] transition-colors z-50 font-medium"
      >
        Chat
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 w-96 max-h-[500px] bg-white rounded-xl shadow-xl border border-gray-200 flex flex-col z-50">
      <button
        onClick={() => setIsWidgetOpen(false)}
        className="absolute top-2 right-3 text-gray-400 hover:text-gray-600 transition-colors"
        aria-label="Close chat"
      >
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </button>

      <div className="flex flex-col min-h-0 max-h-full">
        <div className="min-h-0 overflow-y-auto">
          <div className="p-4 space-y-2">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${
                  message.sender === 'bot'
                    ? 'justify-start'
                    : 'justify-end'
                }`}
              >
                <div className={`max-w-[80%] px-4 py-2 rounded-2xl ${
                  message.sender === 'bot'
                    ? 'bg-gray-100 text-gray-800'
                    : 'bg-blue-600 text-white'
                }`}>
                  {message.text}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        </div>

        <div className="flex-none p-4 border-t border-gray-200">
          <div className="flex gap-2 items-center">
            <input
              type="text"
              value={currentMessage}
              onChange={(e) => setCurrentMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your message..."
              className="flex-grow px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[rgb(233,228,217)] focus:border-transparent transition-all"
            />
            <button
              onClick={handleSendMessage}
              className="px-6 py-2 bg-[rgb(233,228,217)] text-black rounded-xl hover:bg-[rgb(213,208,196)] transition-colors flex-shrink-0 font-medium"
            >
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatWidget;