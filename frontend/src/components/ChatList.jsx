import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { FiSearch, FiPlus, FiUsers, FiMenu, FiX } from 'react-icons/fi';
import { searchUsers } from '../api';
import { useSocket } from '../contexts/SocketContext';
import UserProfile from './UserProfile';

export default function ChatList({ chats, currentUser, onUpdateAvatar, onNewChat }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState('');
  const socket = useSocket();
  const location = useLocation();
  const navigate = useNavigate();

  // Authenticate socket connection when component mounts
  useEffect(() => {
    if (socket && currentUser) {
      const token = localStorage.getItem('token');
      if (token) {
        socket.emit('authenticate', token);
      }
    }
  }, [socket, currentUser]);

  const handleSearch = async (query) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setSearching(true);
    setError('');
    
    try {
      const results = await searchUsers(query);
      // Filter out current user and existing chats
      const filteredResults = results.filter(user => 
        user.id !== currentUser.id && 
        !chats.some(chat => 
          chat.userId === user.id || 
          chat.user1Id === user.id || 
          chat.user2Id === user.id
        )
      );
      setSearchResults(filteredResults);
    } catch (err) {
      console.error('Search error:', err);
      setError('Failed to search users');
    } finally {
      setSearching(false);
    }
  };

  const handleStartChat = async (user) => {
    try {
      setError('');

      // Remove any existing listeners first
      socket.off('channel_created');
      socket.off('channel_error');

      // Set up listeners before emitting
      socket.on('channel_created', (channel) => {
        console.log('Channel created:', channel);
        setShowNewChatModal(false);
        setSearchQuery('');
        setSearchResults([]);
        if (onNewChat) onNewChat(channel);
        navigate(`/chat/${channel.id}`);
      });

      socket.on('channel_error', (error) => {
        console.error('Channel error:', error);
        setError(error.error || 'Failed to create chat');
      });

      // Emit create_channel event
      socket.emit('create_channel', {
        userId: currentUser.id,
        targetUserId: user.id
      });
    } catch (err) {
      console.error('Start chat error:', err);
      setError('Failed to start chat');
    }
  };

  return (
    <div className={`bg-white border-r border-gray-200 h-full flex flex-col transition-all duration-300 ease-in-out ${
      location.pathname.includes('/chat/') ? 'hidden md:flex md:w-80' : 'w-full md:w-80'
    }`}>
      {/* Header */}
      <div className="p-4 bg-white border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <span className="font-semibold text-lg text-gray-800">Chats</span>
          </div>
          <button 
            onClick={() => setShowNewChatModal(true)}
            className="p-2 text-gray-500 hover:text-blue-500 hover:bg-blue-50 rounded-full transition-colors"
          >
            <FiPlus size={20} />
          </button>
        </div>
        <div className="relative">
          <input
            type="text"
            placeholder="Search conversations"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 border border-gray-200"
          />
          <FiSearch className="absolute left-3 top-3 text-gray-400" />
        </div>
      </div>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto">
        {chats.length > 0 ? (
          chats.map((chat) => {
            const isActive = location.pathname === `/chat/${chat.id}`;
            
            return (
              <Link
                to={`/chat/${chat.id}`}
                key={chat.id}
                className={`flex items-center p-4 hover:bg-gray-50 border-b border-gray-100 transition-colors ${
                  isActive ? 'bg-blue-50' : ''
                }`}
              >
                <div className="relative">
                  <img
                    src={chat.avatar}
                    className="w-12 h-12 rounded-full object-cover border border-gray-200"
                    alt={chat.name}
                  />
                  {chat.online && (
                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                  )}
                </div>
                <div className="ml-4 flex-1">
                  <div className="flex justify-between items-center">
                    <h3 className={`font-semibold ${isActive ? 'text-blue-600' : 'text-gray-800'}`}>
                      {chat.name}
                    </h3>
                    {chat.lastMessageTime && (
                      <span className="text-xs text-gray-500">
                        {new Date(chat.lastMessageTime).toLocaleTimeString([], { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 truncate">{chat.lastMessage}</p>
                </div>
              </Link>
            );
          })
        ) : (
          <div className="flex flex-col items-center justify-center py-10 px-4 text-center text-gray-500">
            <FiUsers className="text-gray-400 mb-2" size={40} />
            <p className="font-medium">No conversations yet</p>
            <p className="text-sm mt-1">Start a new chat to begin messaging</p>
            <button 
              onClick={() => setShowNewChatModal(true)}
              className="mt-4 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center text-sm transition-colors"
            >
              <FiPlus className="mr-1" />
              New Conversation
            </button>
          </div>
        )}
      </div>

      {/* User Profile Section */}
      <UserProfile currentUser={currentUser} onUpdateAvatar={onUpdateAvatar} />

      {/* New Chat Modal */}
      {showNewChatModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Start New Chat</h2>
              <button
                onClick={() => {
                  setShowNewChatModal(false);
                  setSearchQuery('');
                  setSearchResults([]);
                  setError('');
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <FiX size={24} />
              </button>
            </div>

            <div className="mb-4">
              <input
                type="text"
                placeholder="Search by phone number"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  handleSearch(e.target.value);
                }}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg">
                {error}
              </div>
            )}

            <div className="max-h-64 overflow-y-auto">
              {searching ? (
                <div className="text-center py-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                  <p className="text-gray-500 mt-2">Searching...</p>
                </div>
              ) : searchResults.length > 0 ? (
                searchResults.map((user) => (
                  <button
                    key={user.id}
                    onClick={() => handleStartChat(user)}
                    className="w-full flex items-center p-3 hover:bg-gray-50 rounded-lg transition-colors"
                  >
                    <img
                      src={user.avatar}
                      alt={user.username}
                      className="w-12 h-12 rounded-full object-cover border border-gray-200"
                    />
                    <div className="ml-3 text-left">
                      <h3 className="font-medium text-gray-900">{user.username}</h3>
                      <p className="text-sm text-gray-500">{user.phoneNumber}</p>
                    </div>
                  </button>
                ))
              ) : searchQuery ? (
                <p className="text-center py-4 text-gray-500">No users found</p>
              ) : null}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}