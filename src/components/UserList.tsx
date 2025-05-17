import React from 'react';
import { useStore } from '@/store';
import { User } from '@/types/types';

const UserList: React.FC = () => {
  const session = useStore(state => state.session);
  const currentUser = useStore(state => state.currentUser);

  // Filter out inactive users that haven't been active for more than 5 minutes
  const activeUsers = session.users.filter(user => 
    user.isActive || (Date.now() - user.lastActive < 5 * 60 * 1000)
  );
  
  // Sort users with current user first, then active users, then by name
  const sortedUsers = [...activeUsers].sort((a, b) => {
    if (a.id === currentUser?.id) return -1;
    if (b.id === currentUser?.id) return 1;
    if (a.isActive !== b.isActive) return a.isActive ? -1 : 1;
    return a.name.localeCompare(b.name);
  });

  return (
    <div className="bg-white rounded-md shadow-md p-3">
      <h3 className="text-sm font-medium text-gray-700 mb-2">Collaborators</h3>
      
      {sortedUsers.length === 0 ? (
        <p className="text-xs text-gray-500">No active collaborators</p>
      ) : (
        <ul className="space-y-2">
          {sortedUsers.map(user => (
            <UserItem 
              key={user.id} 
              user={user} 
              isCurrentUser={user.id === currentUser?.id} 
            />
          ))}
        </ul>
      )}
    </div>
  );
};

interface UserItemProps {
  user: User;
  isCurrentUser: boolean;
}

const UserItem: React.FC<UserItemProps> = ({ user, isCurrentUser }) => {
  return (
    <li className="flex items-center space-x-2">
      {/* Color indicator */}
      <div 
        className="w-3 h-3 rounded-full" 
        style={{ backgroundColor: user.color }}
      />
      
      {/* Status indicator */}
      <div 
        className={`w-2 h-2 rounded-full ${
          user.isActive ? 'bg-green-500' : 'bg-gray-300'
        }`}
      />
      
      {/* User name */}
      <span className="text-sm">
        {user.name} {isCurrentUser && '(You)'}
      </span>
    </li>
  );
};

export default UserList;