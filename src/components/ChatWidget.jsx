import React, { useState, useRef, useEffect } from 'react';
import { supabase } from '../supabaseClient'; // <-- Import Supabase client

const ChatWidget = () => {
  // --- State Hooks ---
  const [isWidgetOpen, setIsWidgetOpen] = useState(true);
  const [currentMessage, setCurrentMessage] = useState('');
  const [messages, setMessages] = useState([
    { sender: 'bot', text: 'Welcome to Nyoka!' },
    { sender: 'bot', text: 'How can I help you plan your safari?' }
  ]);
  const [isLoading, setIsLoading] = useState(false);

  // --- Refs ---
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // --- Constants ---
  const HISTORY_LENGTH = 8;

  // --- Helper Functions ---
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // --- Effects ---

  // Effect #1: Scroll messages to bottom when they update
  useEffect(() => {
    if (isWidgetOpen) {
      scrollToBottom();
    }
  }, [messages, isWidgetOpen]);

  // Effect #2: Focus the input field when the widget is opened
  useEffect(() => {
    if (isWidgetOpen && inputRef.current) {
      setTimeout(() => inputRef.current.focus(), 100);
    }
  }, [isWidgetOpen]);

  // Effect #3: Re-focus the input field after a message response is received
  useEffect(() => {
    if (isWidgetOpen && !isLoading && inputRef.current) {
      if (document.activeElement !== inputRef.current) {
         setTimeout(() => {
            inputRef.current?.focus();
         }, 50);
      }
    }
  }, [isLoading, isWidgetOpen]);

  // --- Core Logic: Sending a Message ---
  const handleSendMessage = async () => { // <<< SINGLE DEFINITION STARTS HERE
    const trimmedMessage = currentMessage.trim();
    if (!trimmedMessage || !isWidgetOpen || isLoading) return;

    setIsLoading(true);
    const userMessageObject = { sender: 'user', text: trimmedMessage };
    const messagesBeforeSending = [...messages, userMessageObject];

    setMessages(messagesBeforeSending);
    const messageToSend = trimmedMessage;
    setCurrentMessage('');

    // Prepare history
    const recentMessages = messagesBeforeSending.slice(-HISTORY_LENGTH);
    const chatHistoryForBackend = recentMessages
      .filter(msg => msg.text)
      .map(msg => ({
        role: msg.sender === 'user' ? 'user' : 'model',
        parts: [{ text: msg.text }]
      }));
    if (chatHistoryForBackend.length > 0) {
      chatHistoryForBackend.pop();
    }

    try {
      console.log(`Invoking 'process-chat' with userMessage and ${chatHistoryForBackend.length} history turns.`);
      const { data, error } = await supabase.functions.invoke('process-chat', {
        body: {
          userMessage: messageToSend,
          chatHistory: chatHistoryForBackend
        },
      });

      // Handle response
      if (error) {
        console.error("Edge function invocation error:", error);
        setMessages(prev => [...prev, { sender: 'bot', text: `Sorry, there was an issue sending your message. Please try again.` }]);
      } else if (data && data.reply) {
        console.log("Received reply:", data.reply);
        setMessages(prev => [...prev, { sender: 'bot', text: data.reply }]);
      } else if (data && data.error) {
        console.error("Edge function returned application error:", data.error);
        setMessages(prev => [...prev, { sender: 'bot', text: `Sorry, an error occurred: ${data.error}` }]);
      } else {
        console.warn("Unexpected response structure:", data);
        setMessages(prev => [...prev, { sender: 'bot', text: "Sorry, I received an unexpected response." }]);
      }

    } catch (invokeError) {
      console.error("Network/fetch error invoking edge function:", invokeError);
      setMessages(prev => [...prev, { sender: 'bot', text: `Network error connecting to the assistant.` }]);
    } finally {
      setIsLoading(false);
      // Focus logic is now handled by Effect #3
    }
  }; // <<< SINGLE DEFINITION ENDS HERE

  // Handle Enter key press in the input field
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !isLoading) {
      handleSendMessage();
    }
  };

  // --- Render Logic ---

  // Minimized Button
  if (!isWidgetOpen) {
    return (
      <button
        onClick={() => setIsWidgetOpen(true)}
        className="fixed bottom-4 right-4 bg-[rgb(233,228,217)] text-black px-6 py-3 rounded-full shadow-lg hover:bg-[rgb(213,208,196)] transition-colors z-50 font-medium animate-pulse"
      >
        Chat
      </button>
    );
  }

  // Full Chat Widget
  return (
    <div className="fixed bottom-4 right-4 w-96 max-h-[500px] bg-white rounded-xl shadow-xl border border-gray-200 flex flex-col z-50">
      {/* Header */}
      <div className="flex justify-between items-center p-3 border-b border-gray-200 flex-shrink-0">
         <h3 className="font-semibold text-gray-700 text-sm">Nyoka Assistant</h3>
         <button
            onClick={() => setIsWidgetOpen(false)}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Close chat"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto min-h-0">
          <div className="p-4 space-y-2">
            {messages.map((message, index) => (
              <div
                key={message.id || index}
                className={`flex ${
                  message.sender === 'bot' ? 'justify-start' : 'justify-end'
                }`}
              >
                <div className={`max-w-[80%] px-4 py-2 rounded-2xl ${
                  message.sender === 'bot' ? 'bg-gray-100 text-gray-800' : 'bg-blue-600 text-white'
                }`}>
                  {message.text.split('\n').map((line, i) => (
                     <span key={i} style={{ display: 'block' }}>{line || '\u00A0'}</span>
                  ))}
                </div>
              </div>
            ))}
            {isLoading && (
                <div className="flex justify-start">
                    <div className="max-w-[80%] px-4 py-2 rounded-2xl bg-gray-100 text-gray-500 italic">
                        <span>Thinking...</span>
                    </div>
                </div>
            )}
            <div ref={messagesEndRef} />
          </div>
      </div>

      {/* Input Area */}
      <div className="flex-none p-4 border-t border-gray-200">
        <div className="flex gap-2 items-center">
          <input
            ref={inputRef}
            type="text"
            value={currentMessage}
            onChange={(e) => setCurrentMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your message..."
            disabled={isLoading}
            className={`flex-grow px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[rgb(233,228,217)] focus:border-transparent transition-all ${isLoading ? 'opacity-50' : ''}`}
          />
          <button
            onClick={handleSendMessage}
            disabled={!currentMessage.trim() || isLoading}
            className={`px-6 py-2 bg-[rgb(233,228,217)] text-black rounded-xl hover:bg-[rgb(213,208,196)] transition-colors flex-shrink-0 font-medium ${(!currentMessage.trim() || isLoading) ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatWidget;