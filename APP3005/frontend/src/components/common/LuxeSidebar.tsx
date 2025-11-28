import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { LuxeColors } from "@/lib/luxe-theme";
import { LogOut, ChevronLeft, ChevronRight } from "lucide-react";
import { LuxeAlertDialog } from "@/components/common/dialog/LuxeAlertDialog";
import { useSidebar } from "@/context/SidebarContext";

const LuxeSidebar: React.FC<{
  user: { name: string; avatar: string; role: string };
  navLinks: { label: string; icon: React.ReactNode; href: string }[];
}> = ({ user, navLinks }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isCollapsed, toggleSidebar } = useSidebar();

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    navigate("/login");
  };

  return (
    <aside
      className={`fixed left-0 top-0 h-full bg-stone-900 border-r border-stone-800 flex flex-col shadow-2xl z-50 transition-all duration-300 ease-in-out ${isCollapsed ? "w-[80px]" : "w-[300px]"
        }`}
    >
      <div className="flex flex-col items-center py-8 border-b border-stone-800 bg-stone-950/50 backdrop-blur-sm relative">
        <button
          onClick={toggleSidebar}
          className="absolute -right-4 top-8 h-8 w-8 bg-luxury-gold text-luxury-black rounded-full flex items-center justify-center shadow-[0_4px_12px_rgba(0,0,0,0.3)] hover:scale-110 hover:bg-white transition-all duration-300 z-50 border-[3px] border-stone-900 group"
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {isCollapsed ? (
            <ChevronRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
          ) : (
            <ChevronLeft size={14} className="group-hover:-translate-x-0.5 transition-transform" />
          )}
        </button>

        {isCollapsed ? (
          <h1 className="font-serif text-xl font-bold text-luxury-gold tracking-widest drop-shadow-sm">AV</h1>
        ) : (
          <>
            <h1 className="font-serif text-3xl font-bold text-luxury-gold tracking-widest drop-shadow-sm">AIVESTIRE</h1>
            <span className="text-[10px] font-sans text-stone-400 uppercase tracking-[0.3em] mt-3 font-medium">Luxury Fashion AI</span>
          </>
        )}
      </div>

      <nav className="flex-1 mt-10 space-y-2 px-4">
        {navLinks.map((link) => {
          const isActive = location.pathname === link.href;
          return (
            <Link
              key={link.label}
              to={link.href}
              className={
                `flex items-center gap-4 py-3.5 px-4 rounded-xl font-sans text-sm transition-all duration-300 relative group ` +
                (isActive
                  ? 'bg-luxury-gold/10 text-luxury-gold font-medium border border-luxury-gold/20 shadow-[0_0_15px_-3px_rgba(212,175,55,0.15)]'
                  : 'text-stone-400 hover:bg-stone-900 hover:text-stone-200 border border-transparent') +
                (isCollapsed ? ' justify-center' : '')
              }
            >
              {isActive && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 h-8 w-1 rounded-r-full bg-luxury-gold shadow-[0_0_10px_rgba(212,175,55,0.5)]" />
              )}
              <span className={`transition-transform duration-300 group-hover:scale-110 ${isActive ? 'text-luxury-gold' : 'text-stone-500 group-hover:text-stone-300'}`}>
                {link.icon}
              </span>
              {!isCollapsed && <span className="tracking-wide whitespace-nowrap overflow-hidden">{link.label}</span>}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-stone-800 bg-stone-950/50">
        <LuxeAlertDialog
          trigger={
            <button className={`flex items-center gap-4 w-full py-3.5 px-4 rounded-xl font-sans text-sm text-stone-400 hover:bg-red-950/20 hover:text-red-400 hover:border-red-900/30 border border-transparent transition-all duration-300 group ${isCollapsed ? 'justify-center' : ''}`}>
              <LogOut size={18} className="group-hover:scale-110 transition-transform duration-300" />
              {!isCollapsed && <span className="font-medium tracking-wide">Logout</span>}
            </button>
          }
          title="Sign out of AiVestire?"
          description="You will be returned to the login screen."
          actionLabel="Logout"
          onAction={handleLogout}
        />
      </div>
    </aside>
  );
};
// ...existing code...

export default LuxeSidebar;
