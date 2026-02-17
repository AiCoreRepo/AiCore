import React, { createContext, useContext, useState, ReactNode } from 'react';

interface ProfileSidebarContextType {
    isOpen: boolean;
    openSidebar: () => void;
    closeSidebar: () => void;
    toggleSidebar: () => void;
}

const ProfileSidebarContext = createContext<ProfileSidebarContextType | undefined>(undefined);

export const ProfileSidebarProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [isOpen, setIsOpen] = useState(false);

    const openSidebar = () => setIsOpen(true);
    const closeSidebar = () => setIsOpen(false);
    const toggleSidebar = () => setIsOpen(!isOpen);

    return (
        <ProfileSidebarContext.Provider value={{ isOpen, openSidebar, closeSidebar, toggleSidebar }}>
            {children}
        </ProfileSidebarContext.Provider>
    );
};

export const useProfileSidebar = () => {
    const context = useContext(ProfileSidebarContext);
    if (!context) {
        throw new Error('useProfileSidebar must be used within ProfileSidebarProvider');
    }
    return context;
};
