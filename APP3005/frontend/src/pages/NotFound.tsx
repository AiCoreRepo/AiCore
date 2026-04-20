import { useLocation, useNavigate, Link } from "react-router-dom";
import { useEffect } from "react";
import { Home, ArrowLeft, Search, ShoppingBag, Sparkles, User } from "lucide-react";
import { Navbar } from "@/components/Navbar";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    console.warn(`404 Error: Attempted to access non-existent route: ${location.pathname}`);
  }, [location.pathname]);

  const quickLinks = [
    { name: "Shop Collection", icon: ShoppingBag, path: "/collection", desc: "Browse our latest arrivals" },
    { name: "AI Try-On", icon: Sparkles, path: "/ai-try-on", desc: "Experience virtual fitting" },
    { name: "Your Aura", icon: User, path: "/aura-profile", desc: "View your personal profile" },
  ];

  return (
    <div className="min-h-screen bg-[#FDFBF7] flex flex-col font-sans relative overflow-hidden">
      <Navbar />
      
      {/* Background Watermark */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none select-none opacity-[0.03] z-0 flex items-center justify-center w-full overflow-hidden">
        <span className="text-[30vw] font-bold font-serif text-[#C9A55C] leading-none tracking-tighter" style={{ fontFamily: 'Playfair Display, serif' }}>
          404
        </span>
      </div>
      
      <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-12 z-10">
        <div className="max-w-3xl w-full flex flex-col md:flex-row items-center md:items-start gap-12 md:gap-20">
          
          {/* Left Content */}
          <div className="flex-1 text-center md:text-left space-y-8">
            <div className="space-y-4">
              <div className="inline-flex items-center justify-center px-4 py-1.5 rounded-full bg-[#C9A55C]/10 border border-[#C9A55C]/20 mb-2">
                <span className="text-[#C9A55C] text-sm font-semibold tracking-wider uppercase">Page Not Found</span>
              </div>
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-[#2C2416] leading-tight" style={{ fontFamily: 'Playfair Display, serif' }}>
                Lost in style?
              </h1>
              <p className="text-[#6B6B6B] text-base sm:text-lg leading-relaxed max-w-md mx-auto md:mx-0" style={{ fontFamily: 'DM Sans, sans-serif' }}>
                We couldn't find the page you're looking for. It might have been moved, or it simply doesn't exist anymore.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center md:justify-start gap-4 pt-2">
              <button
                onClick={() => navigate("/")}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3.5 bg-[#C9A55C] text-white font-semibold rounded-lg hover:bg-[#b08d4b] transition-all transform hover:scale-[1.02] shadow-lg shadow-[#C9A55C]/20"
              >
                <Home className="w-4 h-4" />
                Back to Home
              </button>
              <button
                onClick={() => navigate(-1)}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3.5 border-2 border-[#E0E0D8] text-[#4A4A4A] font-semibold rounded-lg hover:border-[#C9A55C] hover:text-[#C9A55C] hover:bg-[#C9A55C]/5 transition-all"
              >
                <ArrowLeft className="w-4 h-4" />
                Go Back
              </button>
            </div>
          </div>

          {/* Right Content - Quick Links */}
          <div className="w-full md:w-80 bg-white rounded-2xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-[#E0E0D8]">
            <h3 className="text-lg font-semibold text-[#2C2416] mb-5 font-serif" style={{ fontFamily: 'Playfair Display, serif' }}>
              Helpful Links
            </h3>
            <div className="space-y-4">
              {quickLinks.map((link, idx) => {
                const Icon = link.icon;
                return (
                  <Link 
                    key={idx} 
                    to={link.path}
                    className="flex items-start gap-4 p-3 rounded-xl hover:bg-[#FDFBF7] transition-colors group"
                  >
                    <div className="w-10 h-10 rounded-full bg-[#FDFBF7] border border-[#E0E0D8] flex items-center justify-center flex-shrink-0 group-hover:border-[#C9A55C] group-hover:bg-[#C9A55C]/10 transition-colors">
                      <Icon className="w-4 h-4 text-[#C9A55C]" />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-[#2C2416] group-hover:text-[#C9A55C] transition-colors">
                        {link.name}
                      </h4>
                      <p className="text-xs text-[#999999] mt-0.5">
                        {link.desc}
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>

            <div className="mt-6 pt-5 border-t border-[#E0E0D8]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#999999]" />
                <input 
                  type="text" 
                  placeholder="Search Aivestire..." 
                  className="w-full pl-9 pr-4 py-2.5 bg-[#FDFBF7] border border-[#E0E0D8] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#C9A55C]/50 focus:border-[#C9A55C] transition-all"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      navigate(`/collection?search=${(e.target as HTMLInputElement).value}`);
                    }
                  }}
                />
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default NotFound;
