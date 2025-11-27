import React from "react";
import { Link, useLocation } from "react-router-dom";
import { LuxeColors } from "@/lib/luxe-theme";

const LuxeSidebar: React.FC<{
  user: { name: string; avatar: string; role: string };
  navLinks: { label: string; icon: React.ReactNode; href: string }[];
}> = ({ user, navLinks }) => {
  const location = useLocation();
  return (
    <aside
      className="fixed left-0 top-0 h-full w-[300px] bg-[#F5F2EB] bg-opacity-80 backdrop-blur-lg border-r border-[#E5E0D8] flex flex-col shadow-[0_4px_20px_-5px_rgba(212,175,55,0.10)]"
    >
      <div className="flex flex-col items-center py-10 border-b border-[#E5E0D8]">
        <div className="h-20 w-20 rounded-full border-2 border-[#D4AF37] p-1 mb-3 shadow-sm">
          <img src={user.avatar} className="h-full w-full rounded-full object-cover" alt={user.name} />
        </div>
        <h2 className="font-serif text-2xl text-[#2D2D2D] font-bold">{user.name}</h2>
        <span className="text-xs font-sans text-[#8B7355] uppercase tracking-wider mt-1">{user.role}</span>
      </div>
      <nav className="flex-1 mt-10 space-y-2 px-6">
        {navLinks.map((link) => {
          const isActive = location.pathname === link.href;
          return (
            <Link
              key={link.label}
              to={link.href}
              className={
                `flex items-center gap-3 py-2 px-4 rounded-lg font-sans text-[#2D2D2D] hover:bg-[#FDFBF7] transition relative group` +
                (isActive ? ' font-semibold text-[#D4AF37]' : '')
              }
            >
              {isActive && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-1 rounded bg-gradient-to-b from-[#D4AF37] to-[#B8860B]" />
              )}
              {link.icon}
              <span>{link.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
};
// ...existing code...

export default LuxeSidebar;
