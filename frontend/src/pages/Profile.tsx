import React from 'react';
import UserProfile from '../components/Auth/UserProfile';

const Profile: React.FC = () => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">My Profile</h1>
      <UserProfile />
    </div>
  );
};

export default Profile;