import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { loginUser, registerUser, logoutUser } from '../api';

export function Login() {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    // Basic validation
    if (!phoneNumber.trim()) {
      setError('Phone number is required');
      return;
    }
    
    if (!password) {
      setError('Password is required');
      return;
    }
    
    setLoading(true);
    
    try {
      const response = await loginUser({ phoneNumber, password });
      localStorage.setItem('token', response.token);
      localStorage.setItem('user', JSON.stringify(response.user));
      navigate('/');
    } catch (error) {
      console.error('Login error:', error);
      if (error.code === 'ERR_NETWORK') {
        setError('Cannot connect to server. Please make sure the backend server is running.');
      } else {
        setError(error.response?.data?.error || 'Login failed. Please check your credentials.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-blue-500 to-indigo-600 p-4">
      <div className="max-w-md w-full space-y-6 p-8 bg-white rounded-xl shadow-2xl">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">Chat App</h1>
          <h2 className="text-xl font-semibold text-gray-700">
            Sign in to your account
          </h2>
          <p className="mt-2 text-gray-500">Enter your phone number and password to access your account</p>
        </div>
        
        {error && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded" role="alert">
            <p>{error}</p>
          </div>
        )}
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="phone-number" className="block text-sm font-medium text-gray-700 mb-1">
                Phone Number
              </label>
              <input
                id="phone-number"
                name="phoneNumber"
                type="text"
                required
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className="appearance-none relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Enter your phone number"
              />
            </div>
            
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="appearance-none relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Enter your password"
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Signing in...
                </>
              ) : (
                'Sign in'
              )}
            </button>
          </div>
          
          <div className="text-sm text-center">
            <p>
              Don't have an account?{' '}
              <Link to="/register" className="font-medium text-blue-600 hover:text-blue-500 transition-colors">
                Create an account
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}

export function Register() {
  const [username, setUsername] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Function to validate phone number format
  const validatePhoneNumber = (phoneNumber) => {
    // Basic regex for phone number validation (adjust as needed)
    const phoneRegex = /^\d{10,15}$/;
    return phoneRegex.test(phoneNumber.replace(/[-()\s]/g, ''));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    // Enhanced validation
    if (!username.trim()) {
      setError('Username is required');
      return;
    }
    
    if (!phoneNumber.trim()) {
      setError('Phone number is required');
      return;
    }

    // Validate phone number format
    if (!validatePhoneNumber(phoneNumber)) {
      setError('Please enter a valid phone number (10-15 digits)');
      return;
    }
    
    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }
    
    if (password !== confirmPassword) {
      setError("Passwords don't match");
      return;
    }
    
    setLoading(true);
    try {
      // Format phone number to remove any non-digit characters
      const formattedPhoneNumber = phoneNumber.replace(/[-()\s]/g, '');
      
      console.log('Attempting to register with:', {
        username,
        phoneNumber: formattedPhoneNumber
      });
      
      const response = await registerUser({ 
        username, 
        phoneNumber: formattedPhoneNumber, 
        password 
      });
      
      console.log('Registration response:', response);
      
      localStorage.setItem('token', response.token);
      localStorage.setItem('user', JSON.stringify({
        id: response.id,
        username: response.username,
        name: response.username, // Adding name to match App.jsx expectations
        phoneNumber: response.phoneNumber,
        avatar: 'https://i.pravatar.cc/150?img=1' // Default avatar
      }));
      navigate('/');
    } catch (error) {
      console.error('Registration error details:', error);
      
      // Check specific error types
      if (error.code === 'ERR_NETWORK') {
        setError('Cannot connect to server. Please make sure the backend server is running and accessible.');
      } else if (error.response?.status === 400 && error.response?.data?.error === 'Phone number already registered') {
        setError('This phone number is already registered. Please use another number or login.');
      } else if (error.response?.data?.error) {
        setError(error.response.data.error);
      } else if (error.message) {
        setError(error.message);
      } else {
        setError('Registration failed. Please try again later.');
      }
      
      // Try to log more specific information
      if (error.response) {
        console.log('Status:', error.response.status);
        console.log('Data:', error.response.data);
        console.log('Headers:', error.response.headers);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-blue-500 to-indigo-600 p-4">
      <div className="max-w-md w-full space-y-6 p-8 bg-white rounded-xl shadow-2xl">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">Chat App</h1>
          <h2 className="text-xl font-semibold text-gray-700">
            Create your account
          </h2>
          <p className="mt-2 text-gray-500">Join our community and start chatting</p>
        </div>
        
        {error && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded" role="alert">
            <p>{error}</p>
            {error.includes('Cannot connect to server') && (
              <div className="mt-2 text-sm">
                <p>Troubleshooting tips:</p>
                <ul className="list-disc pl-5 mt-1">
                  <li>Make sure your backend server is running</li>
                  <li>Check if the backend URL is correct: http://localhost:5000</li>
                  <li>Verify you don't have network restrictions or firewall blocking connections</li>
                </ul>
              </div>
            )}
          </div>
        )}
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
                Username
              </label>
              <input
                id="username"
                name="username"
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="appearance-none relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Choose a username"
              />
            </div>
            
            <div>
              <label htmlFor="phone-number" className="block text-sm font-medium text-gray-700 mb-1">
                Phone Number
              </label>
      <input
                id="phone-number"
                name="phoneNumber"
                type="text"
                required
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className="appearance-none relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Enter your phone number (e.g., 1234567890)"
              />
              <p className="mt-1 text-sm text-gray-500">Use numbers only, no spaces or special characters</p>
            </div>
            
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
      <input
                id="password"
                name="password"
        type="password"
                required
        value={password}
        onChange={(e) => setPassword(e.target.value)}
                className="appearance-none relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Create a password (min. 6 characters)"
              />
            </div>
            
            <div>
              <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-700 mb-1">
                Confirm Password
              </label>
              <input
                id="confirm-password"
                name="confirmPassword"
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="appearance-none relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Confirm your password"
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Creating account...
                </>
              ) : (
                'Create account'
              )}
            </button>
          </div>
          
          <div className="text-sm text-center">
            <p>
              Already have an account?{' '}
              <Link to="/login" className="font-medium text-blue-600 hover:text-blue-500 transition-colors">
                Sign in
              </Link>
            </p>
          </div>
    </form>
      </div>
    </div>
  );
}

export function Logout() {
  const navigate = useNavigate();
  
  const handleLogout = async () => {
    try {
      await logoutUser();
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
      // Still clear local storage even if server call fails
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      navigate('/login');
    }
  };
  
  return (
    <button
      onClick={handleLogout}
      className="bg-red-50 text-red-600 hover:bg-red-100 font-medium py-2 px-4 rounded-lg transition-colors duration-200 flex items-center"
    >
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
      </svg>
      Logout
    </button>
  );
}