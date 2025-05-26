// ChatWindow.jsx
import { useEffect,useState } from 'react';

import { useSocket } from '../contexts/SocketContext'; // Correct import path
import { fetchMessages, searchUsers } from '../api';
import { FiArrowLeft, FiSend, FiMoreVertical } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';

export default function ChatWindow({ activeChat, currentUser }) {
  const socket = useSocket();
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (!socket || !activeChat?.id) return;
    socket.emit('join_channel', activeChat.id);
    return () => {
      socket.emit('leave_channel', activeChat.id);
    };
  }, [socket, activeChat?.id]);

  // Fetch message history on mount
  useEffect(() => {
    const loadMessages = async () => {
      const data = await fetchMessages(activeChat.id);
      setMessages(data);
    };
    loadMessages();
  }, [activeChat.id]);

  // Socket.IO: Listen for new messages
  useEffect(() => {
    if (!socket) return;

    socket.on('receive_message', (message) => {
      setMessages((prev) => [...prev, message]);
    });

    socket.on('user_status_change', ({ userId, online }) => {
      // Update user status in real-time
      if (activeChat.userId === userId) {
        activeChat.online = online;
      }
    });

    return () => {
      socket.off('receive_message');
      socket.off('user_status_change');
    };
  }, [socket, activeChat]);

  // Handle user search
  useEffect(() => {
    const searchTimeout = setTimeout(async () => {
      if (searchQuery) {
        const users = await searchUsers(searchQuery);
        setSearchResults(users);
      } else {
        setSearchResults([]);
      }
    }, 300);

    return () => clearTimeout(searchTimeout);
  }, [searchQuery]);

  // Send message via Socket.IO
  const handleSend = () => {
    if (newMessage.trim()) {
      const messageData = {
        content: newMessage,
        userId: currentUser.id,
        channelId: activeChat.id,
      };

      // Emit to backend
      socket.emit('send_message', messageData);

      // Optimistic UI update
      setMessages((prev) => [
        ...prev,
        {
          ...messageData,
          id: Date.now(),
          createdAt: new Date().toISOString(),
          User: { username: currentUser.name },
        },
      ]);
      setNewMessage('');
    }
  };

  const handleStartChat = async (user) => {
    // Emit event to create a new chat channel
    socket.emit('create_channel', {
      userId: currentUser.id,
      targetUserId: user.id
    });
    setIsSearching(false);
    setSearchQuery('');
  };
  
  return (
    <div className="flex-1 flex flex-col h-screen bg-gray-50">
      {/* Chat header */}
      <div className="bg-white p-4 border-b border-gray-200 flex items-center justify-between">
        <div className="flex items-center">
          <button
            onClick={() => navigate('/')}
            className="md:hidden mr-4 text-gray-600 hover:text-gray-800"
          >
            <FiArrowLeft size={24} />
          </button>
          <img
            src={activeChat.avatar}
            className="w-10 h-10 rounded-full object-cover"
            alt={activeChat.name}
          />
          <div className="ml-4">
            <h3 className="font-semibold">{activeChat.name}</h3>
            <p className="text-xs text-gray-500">
              {activeChat.online ? 'Online' : 'Offline'}
            </p>
          </div>
        </div>
        <button className="text-gray-600 hover:text-gray-800">
          <FiMoreVertical size={20} />
        </button>
      </div>
      
      {/* Messages container */}
      <div className="flex-1 p-4 overflow-y-auto bg-gray-50">
        {messages.map((message) => (
          <div 
            key={message.id}
            className={`mb-4 flex ${message.userId === currentUser.id ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`max-w-[80%] md:max-w-xs p-3 rounded-lg ${
              message.userId === currentUser.id 
                ? 'bg-blue-500 text-white' 
                : 'bg-white border border-gray-200'
            }`}>
              <p className="text-sm break-words">{message.content}</p>
              <span className="text-xs opacity-75 mt-1 block">
                {new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </div>
        ))}
      </div>
      
      {/* Message input */}
      <div className="bg-white p-4 border-t border-gray-200">
        <div className="flex items-center space-x-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Type a message..."
            className="flex-1 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={handleSend}
            className="bg-blue-500 text-white p-3 rounded-lg hover:bg-blue-600 flex items-center justify-center"
          >
            <FiSend size={20} />
          </button>
        </div>
      </div>

      {/* User search modal */}
      {isSearching && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center pt-20 px-4 z-50">
          <div className="bg-white rounded-lg w-full max-w-md">
            <div className="p-4 border-b border-gray-200">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search users by phone number..."
                className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="max-h-96 overflow-y-auto">
              {searchResults.map((user) => (
                <div
                  key={user.id}
                  className="p-4 border-b border-gray-200 flex items-center hover:bg-gray-50 cursor-pointer"
                  onClick={() => handleStartChat(user)}
                >
                  <img
                    src={user.avatar}
                    alt={user.username}
                    className="w-12 h-12 rounded-full"
                  />
                  <div className="ml-4">
                    <h4 className="font-medium">{user.username}</h4>
                    <p className="text-sm text-gray-500">{user.phoneNumber}</p>
                  </div>
                </div>
              ))}
              {searchQuery && searchResults.length === 0 && (
                <div className="p-4 text-center text-gray-500">
                  No users found
                </div>
              )}
            </div>
            <div className="p-4 border-t border-gray-200">
              <button
                onClick={() => setIsSearching(false)}
                className="w-full p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}