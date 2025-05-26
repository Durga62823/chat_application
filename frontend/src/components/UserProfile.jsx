import React, { useState, useRef } from 'react';
import { Logout } from './Auth';
import { FiCamera, FiImage } from 'react-icons/fi';

export default function UserProfile({ currentUser, onUpdateAvatar, onImageUpload }) {
  const [isOpen, setIsOpen] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState(currentUser?.avatar || 'https://i.pravatar.cc/150?img=1');
  const fileInputRef = useRef(null);

  const handleAvatarChange = (newUrl) => {
    setAvatarUrl(newUrl);
    onUpdateAvatar(newUrl);
    setIsOpen(false);
  };

  const handleFileUpload = () => {
    fileInputRef.current.click();
  };

  const avatarOptions = [
    'https://i.pravatar.cc/150?img=1',
    'https://i.pravatar.cc/150?img=2',
    'https://i.pravatar.cc/150?img=3',
    'https://i.pravatar.cc/150?img=4',
    'https://i.pravatar.cc/150?img=5',
    'https://i.pravatar.cc/150?img=6',
    'https://i.pravatar.cc/150?img=7',
    'https://i.pravatar.cc/150?img=8',
  ];

  return (
    <div className="p-4 bg-white border-t border-gray-200">
      <div className="flex items-center space-x-4">
        <div className="relative">
          <img
            src={currentUser?.avatar}
            alt={currentUser?.username}
            className="w-12 h-12 rounded-full cursor-pointer border-2 border-gray-200 hover:border-blue-500"
            onClick={() => setIsOpen(!isOpen)}
          />
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="absolute bottom-0 right-0 bg-blue-500 text-white p-1 rounded-full text-xs"
          >
            <FiCamera size={12} />
          </button>
          {isOpen && (
            <div className="absolute bottom-full left-0 mb-2 p-3 bg-white rounded-lg shadow-xl border border-gray-200 w-64 z-50">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Choose Avatar</h4>
              <div className="grid grid-cols-4 gap-2 mb-3">
                {avatarOptions.map((url, index) => (
                  <img
                    key={index}
                    src={url}
                    alt={`Avatar option ${index + 1}`}
                    className={`w-12 h-12 rounded-full cursor-pointer hover:ring-2 hover:ring-blue-500 ${
                      avatarUrl === url ? 'ring-2 ring-blue-500' : ''
                    }`}
                    onClick={() => handleAvatarChange(url)}
                  />
                ))}
              </div>
              <div className="border-t border-gray-200 pt-2">
                <button
                  onClick={handleFileUpload}
                  className="w-full flex items-center justify-center space-x-2 text-sm text-blue-500 hover:bg-blue-50 p-2 rounded-lg transition-colors"
                >
                  <FiImage size={16} />
                  <span>Upload from Gallery</span>
                </button>
              </div>
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-gray-800 truncate">{currentUser?.username}</h3>
          <p className="text-sm text-gray-500 truncate">{currentUser?.phoneNumber}</p>
        </div>
        <Logout />
      </div>
    </div>
  );
} 