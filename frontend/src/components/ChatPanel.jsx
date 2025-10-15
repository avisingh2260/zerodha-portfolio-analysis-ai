import { useState, useRef, useEffect } from 'react';
import './ChatPanel.css';

export default function ChatPanel({ portfolioId, chatApi }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState(null);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput('');

    // Add user message to chat
    setMessages(prev => [...prev, {
      role: 'user',
      content: userMessage,
      timestamp: new Date().toISOString()
    }]);

    setLoading(true);

    try {
      const response = await chatApi.sendMessage(portfolioId, userMessage, conversationId);

      if (!conversationId && response.conversationId) {
        setConversationId(response.conversationId);
      }

      // Add assistant message to chat
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: response.message,
        timestamp: response.timestamp
      }]);
    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => [...prev, {
        role: 'error',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date().toISOString()
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleClearChat = () => {
    setMessages([]);
    setConversationId(null);
  };

  const suggestedQuestions = [
    "What's the overall performance of my portfolio?",
    "Which sectors am I most exposed to?",
    "What are the biggest winners and losers?",
    "Should I rebalance my portfolio?",
    "What's the latest news affecting my holdings?"
  ];

  const handleSuggestionClick = async (question) => {
    setInput(question);

    // Automatically send the question
    setMessages(prev => [...prev, {
      role: 'user',
      content: question,
      timestamp: new Date().toISOString()
    }]);

    setLoading(true);

    try {
      const response = await chatApi.sendMessage(portfolioId, question, conversationId);

      if (!conversationId && response.conversationId) {
        setConversationId(response.conversationId);
      }

      // Add assistant message to chat
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: response.message,
        timestamp: response.timestamp
      }]);
    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => [...prev, {
        role: 'error',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date().toISOString()
      }]);
    } finally {
      setLoading(false);
      setInput(''); // Clear input after sending
    }
  };

  return (
    <div className="chat-panel">
      <div className="chat-header">
        <h3>Portfolio Assistant</h3>
        <p>Ask questions about your portfolio using AI-powered insights</p>
        {messages.length > 0 && (
          <button className="btn-clear" onClick={handleClearChat}>
            Clear Chat
          </button>
        )}
      </div>

      {messages.length === 0 ? (
        <div className="chat-welcome">
          <div className="welcome-icon">💬</div>
          <h4>Ask me anything about your portfolio</h4>
          <p>Get AI-powered insights using live market data from Perplexity Finance</p>

          <div className="suggested-questions">
            <h5>Try asking:</h5>
            {suggestedQuestions.map((question, idx) => (
              <button
                key={idx}
                className="suggestion-btn"
                onClick={() => handleSuggestionClick(question)}
              >
                {question}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="chat-messages">
          {messages.map((msg, idx) => (
            <div key={idx} className={`chat-message ${msg.role}`}>
              <div className="message-header">
                <span className="message-role">
                  {msg.role === 'user' ? 'You' : msg.role === 'assistant' ? 'Assistant' : 'Error'}
                </span>
                <span className="message-time">
                  {new Date(msg.timestamp).toLocaleTimeString()}
                </span>
              </div>
              <div className="message-content">
                {msg.content}
              </div>
            </div>
          ))}
          {loading && (
            <div className="chat-message assistant loading-message">
              <div className="message-header">
                <span className="message-role">Assistant</span>
              </div>
              <div className="message-content">
                <div className="typing-indicator">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      )}

      <div className="chat-input-container">
        <textarea
          className="chat-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Ask a question about your portfolio..."
          rows={2}
          disabled={loading}
        />
        <button
          className="chat-send-btn"
          onClick={handleSend}
          disabled={!input.trim() || loading}
        >
          {loading ? 'Sending...' : 'Send'}
        </button>
      </div>
    </div>
  );
}
