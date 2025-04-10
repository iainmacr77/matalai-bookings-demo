import React, { useState, useRef, useEffect } from 'react';
import { supabase } from '../supabaseClient'; // <-- Import Supabase client

const ChatWidget = () => {
  const [isWidgetOpen, setIsWidgetOpen] = useState(true);
  const [currentMessage, setCurrentMessage] = useState('');
  const [messages, setMessages] = useState([
    { sender: 'bot', text: 'Welcome to Matalai!' },
    { sender: 'bot', text: 'Ask me anything, including about booking your stay with us?' }
  ]);

  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    // Scroll to bottom when messages array changes, but only if widget is open
    if (isWidgetOpen) {
      scrollToBottom();
    }
  }, [messages, isWidgetOpen]); // Add isWidgetOpen as dependency

  // --- UPDATED handleSendMessage function ---
  const handleSendMessage = async () => { // Make the function async
    const trimmedMessage = currentMessage.trim();
    if (trimmedMessage && isWidgetOpen) { // Only send if widget is open
      const userMessageObject = { sender: 'user', text: trimmedMessage }; // Renamed variable for clarity
      // Add user message immediately
      setMessages(prevMessages => [...prevMessages, userMessageObject]);
      const messageToSend = trimmedMessage; // Store message before clearing input
      setCurrentMessage(''); // Clear input immediately

      // Add a thinking indicator (optional, creates visual feedback)
      const thinkingMessageId = Date.now(); // Temporary unique ID
      setMessages(prevMessages => [...prevMessages, { id: thinkingMessageId, sender: 'bot', text: '...' }]);


      try {
        // Call the Edge Function
        console.log(`Invoking function 'process-chat' with body:`, { userMessage: messageToSend }); // Log uses the NEW key
        const { data, error } = await supabase.functions.invoke('process-chat', {
          // ====> THIS LINE WAS CHANGED <====
          body: { userMessage: messageToSend }, // Changed 'message' key to 'userMessage'
          // ================================
        });

        // Remove thinking indicator
         setMessages(prevMessages => prevMessages.filter(msg => msg.id !== thinkingMessageId));

        if (error) {
          console.error("Edge function invocation error:", error); // More specific log
          setMessages(prevMessages => [...prevMessages, { sender: 'bot', text: `Error: Failed to send a request to the Edge Function` }]); // User-friendly error
        } else if (data && data.reply) {
          console.log("Received reply:", data.reply);
          setMessages(prevMessages => [...prevMessages, { sender: 'bot', text: data.reply }]);
        } else if (data && data.error){ // Handle errors reported by the function itself
           console.error("Edge function returned application error:", data.error);
           setMessages(prevMessages => [...prevMessages, { sender: 'bot', text: `Sorry, an error occurred: ${data.error}` }]);
        }
         else {
           console.warn("Unexpected response structure:", data);
           setMessages(prevMessages => [...prevMessages, { sender: 'bot', text: "Sorry, I received an unexpected response." }]);
        }

      } catch (invokeError) {
        console.error("Network/fetch error invoking edge function:", invokeError); // More specific log
        setMessages(prevMessages => prevMessages.filter(msg => msg.id !== thinkingMessageId));
        setMessages(prevMessages => [...prevMessages, { sender: 'bot', text: `Network error calling function.` }]);
      }
    }
  };
  // --- END UPDATED handleSendMessage function ---


  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSendMessage();
    }
  };

  // --- Render Minimized Button ---
  if (!isWidgetOpen) {
    return (
      <button
        onClick={() => setIsWidgetOpen(true)}
        className="fixed bottom-4 right-4 bg-[rgb(233,228,217)] text-black px-6 py-3 rounded-full shadow-lg hover:bg-[rgb(213,208,196)] transition-colors z-50 font-medium animate-pulse" // Added subtle pulse
      >
        Chat
      </button>
    );
  }

  // --- Render Full Chat Widget ---
  return (
    <div className="fixed bottom-4 right-4 w-96 max-h-[500px] bg-white rounded-xl shadow-xl border border-gray-200 flex flex-col z-50">
      {/* Header with Close Button */}
      <div className="flex justify-between items-center p-3 border-b border-gray-200 flex-shrink-0">
         <h3 className="font-semibold text-gray-700 text-sm">Matalai Assistant</h3>
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
      <div className="flex-1 overflow-y-auto min-h-0"> {/* Ensure min-h-0 for flex-1 */}
          <div className="p-4 space-y-2">
            {messages.map((message, index) => (
              <div
                key={message.id || index} // Prefer unique ID if available
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
                  {/* Render simple text, handle potential newlines later if needed */}
                  {message.text.split('\n').map((line, i) => (
                     <span key={i} style={{ display: 'block' }}>{line}</span>
                  ))}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
      </div>

      {/* Input Area */}
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
            disabled={!currentMessage.trim()} // Disable button if input is empty
            className={`px-6 py-2 bg-[rgb(233,228,217)] text-black rounded-xl hover:bg-[rgb(213,208,196)] transition-colors flex-shrink-0 font-medium ${!currentMessage.trim() ? 'opacity-50 cursor-not-allowed' : ''}`} // Style disabled button
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatWidget;