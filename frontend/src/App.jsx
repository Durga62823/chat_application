import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, useParams, Navigate } from 'react-router-dom';
import ChatList from './components/ChatList';
import { SocketProvider } from './contexts/SocketContext';
import ChatWindow from './components/ChatWindow';
import { Login, Register, Logout } from './components/Auth';
import { getCurrentUser, fetchChats, testConnection, pingServer } from './api';
 
function ProtectedRoute({ children }) {
  const token = localStorage.getItem('token');
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

function ChatPage({ chats, currentUser }) {
  const { chatId } = useParams();
  const activeChat = chats.find((chat) => chat.id === chatId);

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  return activeChat ? (
    <ChatWindow activeChat={activeChat} currentUser={currentUser} />
  ) : (
    <div className="flex-1 flex items-center justify-center bg-gray-100">
      <div className="text-center p-6 max-w-sm mx-auto">
        <div className="text-red-500 text-5xl mb-4">🤔</div>
        <h3 className="text-xl font-semibold text-gray-700 mb-2">Chat not found</h3>
        <p className="text-gray-500">The chat you're looking for doesn't exist or has been removed.</p>
      </div>
    </div>
  );
}

function ChatLayout({ chats, currentUser, onUpdateAvatar }) {
  if (!currentUser) return null;
  
  return (
    <div className="flex flex-1 h-screen overflow-hidden">
      <ChatList chats={chats} currentUser={currentUser} onUpdateAvatar={onUpdateAvatar} />
      <Routes>
        <Route 
          path="/chat/:chatId" 
          element={<ChatPage chats={chats} currentUser={currentUser} />}
        />
        <Route 
          path="/" 
          element={
            <div className="flex-1 flex items-center justify-center bg-gray-50">
              <div className="text-center p-6">
                <div className="text-blue-500 text-6xl mb-4">👋</div>
                <h2 className="text-2xl font-semibold text-gray-700 mb-2">Welcome, {currentUser.name}!</h2>
                <p className="text-gray-500 mb-6">Select a chat to start messaging or create a new conversation</p>
              </div>
            </div>
          } 
        />
      </Routes>
    </div>
  );
}

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [backendConnected, setBackendConnected] = useState(null);
  const [connectionTestDetails, setConnectionTestDetails] = useState({
    ping: { tried: false, success: false },
    test: { tried: false, success: false }
  });

  // Test backend connection on startup using simple ping first
  useEffect(() => {
    async function checkBackendConnection() {
      console.log("Testing backend connectivity...");

      // First try a simple ping endpoint that doesn't use DB
      setConnectionTestDetails(prev => ({ ...prev, ping: { tried: true, success: false }}));
      const pingSuccess = await pingServer();
      setConnectionTestDetails(prev => ({ ...prev, ping: { tried: true, success: pingSuccess }}));
      
      if (pingSuccess) {
        // If ping works, try the more complex test endpoint
        setConnectionTestDetails(prev => ({ ...prev, test: { tried: true, success: false }}));
        const testSuccess = await testConnection();
        setConnectionTestDetails(prev => ({ ...prev, test: { tried: true, success: testSuccess }}));
        
        setBackendConnected(pingSuccess);
      } else {
        setBackendConnected(false);
        setError('Cannot connect to the server. Please make sure the backend is running.');
      }
    }
    
    checkBackendConnection();
  }, []);

  // Load user data and chats
  useEffect(() => {
    const loadUserAndChats = async () => {
      setLoading(true);
      setError(null);
      
      // Skip if backend is not connected
      if (backendConnected === false) {
        setLoading(false);
        return;
      }
      
      // Check if we have a token
      const token = localStorage.getItem('token');
      if (!token) {
        setLoading(false);
        return;
      }
      
      try {
        // Try to load user data from localStorage first for faster UI rendering
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          try {
            const parsedUser = JSON.parse(storedUser);
            setCurrentUser(parsedUser);
          } catch (e) {
            // Invalid JSON in localStorage
            localStorage.removeItem('user');
          }
        }
        
        // Then verify with the server
        const userData = await getCurrentUser();
        
        // Update user in state with data from server
        const updatedUser = {
          id: userData.id,
          name: userData.username,
          username: userData.username,
          avatar: userData.avatar || 'https://i.pravatar.cc/150?img=1',
          phoneNumber: userData.phoneNumber
        };mj
        
        setCurrentUser(updatedUser);
        
        // Update stored user with latest data
        localStorage.setItem('user', JSON.stringify(updatedUser));
        
        // Load chats
        try {
          const chatList = await fetchChats();
          setChats(chatList);
        } catch (chatError) {
          console.error('Failed to load chats:', chatError);
          // Fallback to default chats
          setChats([
            {
              id: '1',
              name: 'John Doe',
              avatar: 'https://i.pravatar.cc/150?img=3',
              lastMessage: 'Hey, how are you?',
              lastMessageTime: '10:30 AM',
              online: true,
            }
          ]);
        }
      } catch (error) {
        console.error('Authentication error:', error);
        // Invalid or expired token
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setError('Your session has expired. Please login again.');
        setCurrentUser(null);
      } finally {
        setLoading(false);
      }
    };
    
    // Only load user data if we know backend is connected
    if (backendConnected !== null) {
      loadUserAndChats();
    }
  }, [backendConnected]);

  const handleUpdateAvatar = async (newAvatarUrl) => {
    try {
      // Update user in state
      setCurrentUser(prev => ({
        ...prev,
        avatar: newAvatarUrl
      }));
      
      // Update stored user
      const storedUser = JSON.parse(localStorage.getItem('user'));
      storedUser.avatar = newAvatarUrl;
      localStorage.setItem('user', JSON.stringify(storedUser));
      
      // TODO: Add API call to update avatar in backend
      // await updateUserAvatar(newAvatarUrl);
    } catch (error) {
      console.error('Failed to update avatar:', error);
      // Revert changes if update fails
      const storedUser = JSON.parse(localStorage.getItem('user'));
      setCurrentUser(prev => ({
        ...prev,
        avatar: storedUser.avatar
      }));
    }
  };

  // Show loading indicator while checking authentication
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500 mb-4"></div>
        <p className="text-gray-600 font-medium">Loading your chat app...</p>
      </div>
    );
  }

  // Show connection error if backend is not available
  if (backendConnected === false) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-50 p-4">
        <div className="bg-red-100 text-red-700 p-6 rounded-lg shadow-md max-w-md w-full text-center">
          <div className="text-5xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold mb-4">Connection Error</h2>
          <p className="mb-4">Cannot connect to the server. Please make sure the backend is running.</p>
          
          <div className="bg-white p-4 rounded text-left mb-4">
            <p className="font-semibold mb-2">Connection Tests:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>
                Ping test: {connectionTestDetails.ping.tried 
                  ? (connectionTestDetails.ping.success ? '✅ Success' : '❌ Failed')
                  : '⏳ Not tried'}
              </li>
              <li>
                API test: {connectionTestDetails.test.tried
                  ? (connectionTestDetails.test.success ? '✅ Success' : '❌ Failed')
                  : '⏳ Not tried'}
              </li>
            </ul>
          </div>
          
          <div className="bg-white p-4 rounded text-left">
            <p className="font-semibold mb-2">Troubleshooting:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Check if the backend server is running on port 5000</li>
              <li>Make sure your network connection is working</li>
              <li>Check for any firewall or security software blocking the connection</li>
              <li>Try using a different browser</li>
              <li>Check the browser console for more specific error messages</li>
            </ul>
          </div>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-6 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded transition-colors"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  return (
    <SocketProvider>
      <Router>
        <div className="h-screen flex flex-col">
          <Routes>
            <Route
              path="/login"
              element={!currentUser ? <Login /> : <Navigate to="/" replace />}
            />
            <Route
              path="/register"
              element={!currentUser ? <Register /> : <Navigate to="/" replace />}
            />
            <Route
              path="/*"
              element={
                <ProtectedRoute>
                  <div className="flex flex-col h-screen">
                    <header className="bg-white border-b border-gray-200 py-3 px-6 shadow-sm">
                      <div className="container mx-auto flex justify-between items-center">
                        <h1 className="text-2xl font-bold text-blue-600">Chat App</h1>
                        {currentUser && (
                          <div className="flex items-center gap-4">
                            <div className="flex items-center">
                              <img
                                src={currentUser.avatar}
                                alt={currentUser.name}
                                className="w-10 h-10 rounded-full object-cover border-2 border-blue-100"
                              />
                              <span className="ml-3 font-medium text-gray-700">{currentUser.name}</span>
                            </div>
                            <Logout />
                          </div>
                        )}
                      </div>
                    </header>
                    {error && (
                      <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4">
                        <p>{error}</p>
                      </div>
                    )}
                    <ChatLayout 
                      chats={chats} 
                      currentUser={currentUser} 
                      onUpdateAvatar={handleUpdateAvatar}
                    />
                  </div>
                </ProtectedRoute>
              }
            />
          </Routes>
        </div>
      </Router>
    </SocketProvider>
  );
}
