import React, { createContext, useContext, useState, useEffect } from 'react';

interface SidebarContextType {
    isCollapsed: boolean;
    toggleSidebar: () => void;
    sidebarWidth: string;
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export const useSidebar = () => {
    const context = useContext(SidebarContext);
    if (!context) {
        throw new Error('useSidebar must be used within a SidebarProvider');
    }
    return context;
};

export const SidebarProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [isCollapsed, setIsCollapsed] = useState(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('sidebarCollapsed');
            return saved === 'true';
        }
        return false;
    });

    useEffect(() => {
        localStorage.setItem('sidebarCollapsed', String(isCollapsed));
    }, [isCollapsed]);

    const toggleSidebar = () => {
        setIsCollapsed((prev) => !prev);
    };

    const sidebarWidth = isCollapsed ? '80px' : '300px';

    return (
        <SidebarContext.Provider value={{ isCollapsed, toggleSidebar, sidebarWidth }}>
            {children}
        </SidebarContext.Provider>
    );
};
