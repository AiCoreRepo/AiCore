import React from "react";

interface DashboardHeaderProps {
  onUploadClick: () => void;
}

const DashboardHeader: React.FC<DashboardHeaderProps> = ({ onUploadClick }) => {
  return (
    <div className="flex flex-col md:flex-row md:items-center md:justify-between pb-8 border-b border-[#d8d2c4]/60">

      {/* Left Section */}
      <div>
        <h1 className="text-3xl md:text-4xl font-serif text-luxury-black font-semibold tracking-wide">
          Creator Dashboard
        </h1>

        <p className="text-stone-500 mt-1 text-sm md:text-base tracking-wide">
          Manage your outfits, track analytics, and grow your audience.
        </p>
      </div>

      {/* Upload Button */}
      <button
        onClick={onUploadClick}
        className="
        mt-5 md:mt-0
        px-6 py-3 
        rounded-full 
        bg-luxury-gold 
        text-luxury-black 
        hover:bg-[#e2c670] 
        transition-all duration-200 ease-in-out 
        shadow-md hover:shadow-lg 
        flex items-center gap-2 font-medium
      ">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
          className="w-5 h-5"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 4.5v15m7.5-7.5h-15"
          />
        </svg>
        Upload New Outfit
      </button>
    </div>
  );
};

export default DashboardHeader;
