import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { LuxeColors } from "@/lib/luxe-theme";
import { LogOut } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const LuxeSidebar: React.FC<{
  user: { name: string; avatar: string; role: string };
  navLinks: { label: string; icon: React.ReactNode; href: string }[];
}> = ({ user, navLinks }) => {
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    navigate("/login");
  };

  return (
    <aside
      className="fixed left-0 top-0 h-full w-[300px] bg-[#F5F2EB] bg-opacity-80 backdrop-blur-lg border-r border-[#E5E0D8] flex flex-col shadow-[0_4px_20px_-5px_rgba(212,175,55,0.10)]"
    >
      <div className="flex flex-col items-center py-10 border-b border-[#E5E0D8]">
        <h1 className="font-serif text-3xl font-bold text-gold tracking-wider">AiVestire</h1>
        <span className="text-[10px] font-sans text-muted-foreground uppercase tracking-[0.2em] mt-2">Luxury Fashion AI</span>
      </div>
      <nav className="flex-1 mt-10 space-y-2 px-6">
        {navLinks.map((link) => {
          const isActive = location.pathname === link.href;
          return (
            <Link
              key={link.label}
              to={link.href}
              className={
                `flex items-center gap-3 py-2 px-4 rounded-lg font-sans transition-all duration-300 relative group ` +
                (isActive
                  ? 'bg-gold/10 text-gold font-semibold'
                  : 'text-muted-foreground hover:bg-gold/5 hover:text-foreground')
              }
            >
              {isActive && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-1 rounded bg-gold" />
              )}
              {link.icon}
              <span>{link.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-6 border-t border-[#E5E0D8]">
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <button className="flex items-center gap-3 w-full py-2 px-4 rounded-lg font-sans text-red-500 hover-danger group">
              <LogOut size={20} />
              <span className="font-medium">Logout</span>
            </button>
          </AlertDialogTrigger>
          <AlertDialogContent className="dashboard-theme bg-foreground text-primary-foreground border-gold/20">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-primary-foreground">Are you sure you want to logout?</AlertDialogTitle>
              <AlertDialogDescription className="text-muted-foreground">
                You will be redirected to the login page.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="bg-transparent border-muted-foreground/30 text-primary-foreground hover:bg-muted-foreground/10 hover:text-primary-foreground">Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleLogout} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Logout</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </aside>
  );
};
// ...existing code...

export default LuxeSidebar;
