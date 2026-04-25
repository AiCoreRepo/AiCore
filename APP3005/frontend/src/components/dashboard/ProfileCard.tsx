import React from "react";
import { cloudinaryImages } from "@/constants/cloudinaryImages";
import { useAuth } from "../../context/AuthContext";

const ProfileCard: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div>Loading profile...</div>;
  }

  if (!user) {
    return <div>No user data available.</div>;
  }

  return (
    <div className="rounded-xl bg-white p-6 shadow-lg flex items-center justify-between">
      <div className="flex items-center">
        <img src={cloudinaryImages.avatars.placeholder} alt={user.email} className="w-20 h-20 rounded-full mr-4 border-2 border-luxury-gold" />
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-2xl font-semibold text-luxury-black">{user.store_name || user.email}</h2>
          </div>
          <p className="text-stone-500 text-sm mb-1">{user.role}</p>
        </div>
      </div>
    </div>
  );
};

export default ProfileCard;
