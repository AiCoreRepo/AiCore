import React, { createContext, useContext, useState, useEffect } from 'react';

interface SidebarContextType {
    isCollapsed: boolean;
    toggleSidebar: () => void;
    sidebarWidth: string;
    isMobile: boolean;
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

const getIsMobileViewport = () =>
    typeof window !== 'undefined' ? window.innerWidth < 768 : false;

const getStoredDesktopCollapsed = () => {
    if (typeof window === 'undefined') {
        return false;
    }

    const saved = localStorage.getItem('sidebarCollapsed');
    return saved === 'true';
};

export const useSidebar = () => {
    const context = useContext(SidebarContext);
    if (!context) {
        throw new Error('useSidebar must be used within a SidebarProvider');
    }
    return context;
};

export const SidebarProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [isMobile, setIsMobile] = useState(getIsMobileViewport);
    const [isCollapsed, setIsCollapsed] = useState(() =>
        getIsMobileViewport() ? true : getStoredDesktopCollapsed()
    );

    useEffect(() => {
        const checkMobile = () => {
            const mobile = getIsMobileViewport();
            setIsMobile(mobile);

            if (mobile) {
                setIsCollapsed(true);
            } else {
                setIsCollapsed(getStoredDesktopCollapsed());
            }
        };

        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    useEffect(() => {
        if (!isMobile) {
            localStorage.setItem('sidebarCollapsed', String(isCollapsed));
        }
    }, [isCollapsed, isMobile]);

    const toggleSidebar = () => {
        setIsCollapsed((prev) => !prev);
    };

    const sidebarWidth = isMobile ? '0px' : (isCollapsed ? '80px' : '300px');

    return (
        <SidebarContext.Provider value={{ isCollapsed, toggleSidebar, sidebarWidth, isMobile }}>
            {children}
        </SidebarContext.Provider>
    );
};
