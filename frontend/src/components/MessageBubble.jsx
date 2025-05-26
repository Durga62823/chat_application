import React from 'react';
import { BsThreeDotsVertical } from 'react-icons/bs';

export default function MessageBubble({ message, isCurrentUser }) {
  return (
    <div className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'} mb-4`}>
      <div className={`relative max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
        isCurrentUser 
          ? 'bg-blue-500 text-white' 
          : 'bg-gray-100 text-gray-800'
      }`}>
        <p>{message.text}</p>
        <div className="flex items-center justify-end mt-1 space-x-1">
          <span className="text-xs opacity-70">{message.time}</span>
          {isCurrentUser && (
            <BsThreeDotsVertical className="text-xs cursor-pointer hover:opacity-80" />
          )}
        </div>
      </div>
    </div>
  );
}