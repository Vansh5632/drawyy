import React, { useState, useRef, useEffect } from 'react';
import { useStore } from '@/store';
import socketClient from '@/lib/collaboration/socket';

interface ChatMessage {
  id: string;
  userId: string;
  userName: string;
  userColor: string;
  content: string;
  timestamp: number;
}

const Chat: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const session = useStore(state => state.session);
  const currentUser = useStore(state => state.currentUser);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Register message handler when component mounts
  useEffect(() => {
    const handleChatMessage = (message: any) => {
      if (message.type === 'chat') {
        const chatMessage: ChatMessage = message.payload;
        setMessages(prev => [...prev, chatMessage]);
      }
    };
    
    socketClient.on('chat', handleChatMessage);
    
    return () => {
      socketClient.off('chat', handleChatMessage);
    };
  }, []);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Send a chat message
  const sendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newMessage.trim() || !currentUser) return;
    
    const chatMessage: ChatMessage = {
      id: Math.random().toString(36).substring(2, 15),
      userId: currentUser.id,
      userName: currentUser.name,
      userColor: currentUser.color,
      content: newMessage.trim(),
      timestamp: Date.now()
    };
    
    // Add message locally
    setMessages(prev => [...prev, chatMessage]);
    
    // Send to server
    socketClient.emit('chat', {
      type: 'chat',
      payload: chatMessage,
      sender: currentUser.id
    });
    
    // Clear input
    setNewMessage('');
  };

  // Format timestamp
  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed bottom-4 right-4 z-10">
      {/* Chat toggle button */}
      <button
        className="bg-blue-600 text-white p-3 rounded-full shadow-lg mb-2 ml-auto block"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="text-lg">{isOpen ? '×' : '💬'}</span>
        {!isOpen && messages.length > 0 && (
          <span className="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
            {messages.length}
          </span>
        )}
      </button>
      
      {/* Chat panel */}
      {isOpen && (
        <div className="bg-white rounded-lg shadow-lg w-80 h-96 flex flex-col">
          {/* Header */}
          <div className="bg-blue-600 text-white px-4 py-2 rounded-t-lg flex justify-between items-center">
            <h3>Chat</h3>
            <div className="text-xs">
              {session.users.filter(u => u.isActive).length} active users
            </div>
          </div>
          
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.length === 0 ? (
              <p className="text-gray-400 text-center text-sm italic">
                No messages yet. Start the conversation!
              </p>
            ) : (
              messages.map(msg => {
                const isOwnMessage = msg.userId === currentUser?.id;
                return (
                  <div 
                    key={msg.id}
                    className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                  >
                    <div 
                      className={`max-w-[80%] rounded-lg px-3 py-2 ${
                        isOwnMessage 
                          ? 'bg-blue-600 text-white rounded-tr-none' 
                          : 'bg-gray-100 text-gray-800 rounded-tl-none'
                      }`}
                    >
                      {!isOwnMessage && (
                        <div className="text-xs font-semibold mb-1" style={{ color: msg.userColor }}>
                          {msg.userName}
                        </div>
                      )}
                      <p>{msg.content}</p>
                      <div className={`text-xs ${isOwnMessage ? 'text-blue-100' : 'text-gray-500'} text-right`}>
                        {formatTime(msg.timestamp)}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>
          
          {/* Input */}
          <form 
            className="border-t p-2 flex"
            onSubmit={sendMessage}
          >
            <input
              type="text"
              value={newMessage}
              onChange={e => setNewMessage(e.target.value)}
              placeholder="Type a message..."
              className="flex-1 border rounded-l-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
              disabled={!currentUser}
            />
            <button
              type="submit"
              className="bg-blue-600 text-white px-4 py-2 rounded-r-md hover:bg-blue-700 disabled:bg-gray-300"
              disabled={!newMessage.trim() || !currentUser}
            >
              Send
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default Chat;