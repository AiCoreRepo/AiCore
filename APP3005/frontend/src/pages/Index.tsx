import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ShoppingCart, User } from "lucide-react";
import heroMain from "@/assets/hero-main.jpeg";
import collectionShowcase from "@/assets/collection-showcase.jpeg";

const Index = () => {
  return (
    <div className="min-h-screen bg-luxury-cream">
      {/* Navigation */}
      <nav className="flex items-center justify-between px-8 py-6 bg-luxury-cream/95 backdrop-blur-sm sticky top-0 z-50">
        <Link to="/" className="text-3xl font-serif text-luxury-black">
          AiVestire
        </Link>
        <div className="hidden md:flex items-center gap-8 text-sm font-medium">
          <Link to="/" className="text-luxury-black hover:text-luxury-gold transition-colors">Home</Link>
          <Link to="#" className="text-luxury-black hover:text-luxury-gold transition-colors">Collection</Link>
          <Link to="#" className="text-luxury-black hover:text-luxury-gold transition-colors">About</Link>
          <Link to="#" className="text-luxury-black hover:text-luxury-gold transition-colors">Lookbook</Link>
          <Link to="/signup" className="text-luxury-black hover:text-luxury-gold transition-colors">Join Us</Link>
        </div>
        <div className="flex items-center gap-4">
          <Link to="/login">
            <Button variant="outline" className="mr-2">Creator Login</Button>
          </Link>
          <Link to="/signup">
            <Button variant="luxury" className="mr-2">AI Try-On</Button>
          </Link>
          <button className="text-luxury-gold hover:text-luxury-gold/80 transition-colors">
            <ShoppingCart className="h-6 w-6" />
          </button>
          <Link to="/login">
            <button className="text-luxury-gold hover:text-luxury-gold/80 transition-colors">
              <User className="h-6 w-6" />
            </button>
          </Link>
        </div>
      </nav>

      {/* Hero Section Hidden */}
      {/* <div className="relative min-h-screen overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover"
          style={{ backgroundImage: `url(${heroMain})`, backgroundPosition: '80% top', maskImage: 'linear-gradient(to bottom, transparent 0%, black 20%, black 100%)', WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 20%, black 100%)' }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-luxury-black/80 via-luxury-black/30 to-luxury-cream/60" />
      </div> */}

      {/* Collection Section */}
      <section className="py-20 bg-luxury-cream">
        <div className="container mx-auto px-4">
          {/* Only one heading retained */}
          <h2 className="text-4xl md:text-5xl font-serif text-luxury-black text-center mb-12">
            AI VESTIRE COLLECTION
          </h2>
          <div className="max-w-7xl mx-auto">
            <img 
              src={collectionShowcase} 
              alt="AiVestire Collection Showcase" 
              className="w-full h-auto rounded-lg shadow-2xl"
            />
          </div>
          <div className="text-center mt-12">
            <Link to="/signup">
              <Button variant="luxury" size="lg" className="px-12 text-lg">
                Explore Collection
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-luxury-black text-luxury-cream py-12 px-8">
        <div className="max-w-6xl mx-auto text-center">
          <h3 className="text-2xl font-serif text-luxury-gold mb-4">AiVestire</h3>
          <p className="text-sm text-muted-foreground">
            Where Vision Meets Innovation in Haute Couture
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
