import React, { useState, useRef, useEffect } from 'react';
import { useStore } from '@/store';
import { exportToPNG, exportToFile, importFromFile } from '@/lib/utils/exportImport';
import socketClient from '@/lib/collaboration/socket';
import UserList from './UserList';
import { User, DrawboardSessionInfo } from '@/types/types';

interface HeaderProps {
  canvasRef?: React.RefObject<HTMLCanvasElement>;
}

const Header: React.FC<HeaderProps> = ({ canvasRef }) => {
  // Use useState with client-side only rendering for values that might cause hydration mismatch
  const [isClient, setIsClient] = useState(false);
  const [showSessionModal, setShowSessionModal] = useState(false);
  const [showUserModal, setShowUserModal] = useState(false);
  const [sessionId, setSessionId] = useState('');
  const [userName, setUserName] = useState('');
  
  const shapes = useStore(state => state.shapes);
  const setShapes = useStore(state => state.setShapes);
  const currentUser = useStore(state => state.currentUser);
  const setCurrentUser = useStore(state => state.setCurrentUser);
  const session = useStore(state => state.session);
  const addUser = useStore(state => state.addUser);
  const removeUser = useStore(state => state.removeUser);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Set isClient to true when component mounts on client side
  useEffect(() => {
    setIsClient(true);
  }, []);
  
  // Generate a random session ID
  const generateSessionId = () => {
    return Math.random().toString(36).substring(2, 10);
  };
  
  // Generate a random user color
  const generateUserColor = () => {
    const colors = [
      '#0891b2', '#2196F3', '#03A9F4', '#00BCD4',
      '#009688', '#4CAF50', '#8BC34A', '#CDDC39',
      '#FFEB3B', '#FFC107', '#FF9800', '#FF5722',
      '#F44336', '#E91E63', '#9C27B0', '#673AB7'
    ];
    // Use a consistent index to avoid hydration mismatch
    return colors[0];
  };
  
  // Create or join a session
  const handleJoinSession = () => {
    // Generate ID if not provided
    const finalSessionId = sessionId || generateSessionId();
    
    // Validate username
    if (!userName.trim()) {
      alert('Please enter your name');
      return;
    }
    
    // Create user object with deterministic ID for first render
    const user: User = {
      id: Math.random().toString(36).substring(2, 15),
      name: userName.trim(),
      color: generateUserColor(),
      isActive: true,
      lastActive: Date.now()
    };
    
    // Set user and session data
    setCurrentUser(user);
    addUser(user);
    
    // Connect to socket and join session
    socketClient.connect();
    socketClient.joinSession(finalSessionId, user);
    
    // Close modal
    setShowSessionModal(false);
  };
  
  // Leave the current session
  const handleLeaveSession = () => {
    // Disconnect from socket
    socketClient.disconnect();
    
    // Create a default user to reset to (rather than null)
    const defaultUser: User = {
      id: `default_${Math.random().toString(36).substring(2, 9)}`,
      name: `User ${Math.floor(Math.random() * 1000)}`,
      color: generateUserColor(),
      isActive: true,
      lastActive: Date.now()
    };
    
    // Reset to default user
    setCurrentUser(defaultUser);
    
    // Remove previous user if it exists
    if (currentUser) {
      removeUser(currentUser.id);
    }
  };
  
  // Handle file import
  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    try {
      const importedShapes = await importFromFile(file);
      setShapes(importedShapes);
    } catch (error) {
      console.error('Failed to import file:', error);
      alert('Failed to import file. Please make sure it is a valid Drawboard file.');
    }
    
    // Reset input value to allow re-importing the same file
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  
  // Handle PNG export
  const handleExportPNG = () => {
    if (canvasRef?.current) {
      exportToPNG(canvasRef.current);
    }
  };
  
  // Handle Drawboard file export
  const handleExportFile = () => {
    exportToFile(shapes);
  };

  // Create a consistent placeholder user for SSR
  const placeholderUser = {
    name: "User 586", 
    color: "#0891b2"
  };

  return (
    <header className="bg-white border-b px-4 py-2 flex items-center justify-between">
      <div className="flex items-center space-x-2">
        <h1 className="text-xl font-semibold text-blue-600">Drawboard</h1>
        
        <div className="h-6 border-r mx-2"></div>
        
        {/* Session controls */}
        {!isClient || !currentUser ? (
          <button 
            className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
            onClick={() => setShowSessionModal(true)}
          >
            Create/Join Session
          </button>
        ) : (
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600">
              Session: <span className="font-medium">{session.sessionId}</span>
            </span>
            <button
              className="px-2 py-1 text-xs text-red-500 hover:text-red-600"
              onClick={handleLeaveSession}
            >
              Leave
            </button>
          </div>
        )}
      </div>
      
      <div className="flex items-center space-x-3">
        {/* File operations */}
        <div className="flex space-x-1">
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept=".drawboard.json"
            onChange={handleImport}
          />
          <button 
            className="px-3 py-1 bg-gray-100 text-gray-700 rounded text-sm hover:bg-gray-200"
            onClick={() => fileInputRef.current?.click()}
            title="Import"
          >
            Import
          </button>
          <button 
            className="px-3 py-1 bg-gray-100 text-gray-700 rounded text-sm hover:bg-gray-200"
            onClick={handleExportFile}
            title="Export as Drawboard file"
          >
            Export
          </button>
          <button 
            className="px-3 py-1 bg-gray-100 text-gray-700 rounded text-sm hover:bg-gray-200"
            onClick={handleExportPNG}
            title="Export as PNG"
          >
            Export PNG
          </button>
        </div>
        
        {/* User info - using static values for initial render to prevent hydration mismatch */}
        {!isClient ? (
          <div className="flex items-center space-x-2">
            <button
              className="flex items-center space-x-1 px-3 py-1 border rounded hover:bg-gray-50"
            >
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: placeholderUser.color }}
              />
              <span>{placeholderUser.name}</span>
            </button>
          </div>
        ) : currentUser && (
          <div className="flex items-center space-x-2">
            <button
              className="flex items-center space-x-1 px-3 py-1 border rounded hover:bg-gray-50"
              onClick={() => setShowUserModal(!showUserModal)}
            >
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: currentUser.color }}
              />
              <span>{currentUser.name}</span>
            </button>
            
            {/* User popup */}
            {showUserModal && (
              <div className="absolute top-12 right-4 z-10">
                <UserList />
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* Session modal - only render on client side */}
      {isClient && showSessionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-96">
            <h2 className="text-xl font-semibold mb-4">Create or Join Session</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Your Name
                </label>
                <input 
                  type="text"
                  className="w-full border rounded px-3 py-2"
                  value={userName}
                  onChange={e => setUserName(e.target.value)}
                  placeholder="Enter your name"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Session ID (optional)
                </label>
                <input 
                  type="text"
                  className="w-full border rounded px-3 py-2"
                  value={sessionId}
                  onChange={e => setSessionId(e.target.value)}
                  placeholder="Leave empty to create a new session"
                />
              </div>
              
              <div className="flex justify-end space-x-2 pt-4">
                <button
                  className="px-4 py-2 border rounded hover:bg-gray-50"
                  onClick={() => setShowSessionModal(false)}
                >
                  Cancel
                </button>
                <button
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                  onClick={handleJoinSession}
                >
                  Join
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;