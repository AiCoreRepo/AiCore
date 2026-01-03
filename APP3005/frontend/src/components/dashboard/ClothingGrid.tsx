
import { MoreHorizontal } from "lucide-react";
// Helper for stat icons (can be replaced with real icons if available)
const StatIcon = ({ children }: { children: React.ReactNode }) => (
  <span className="inline-block align-middle mr-1 text-[#B8860B]">{children}</span>
);

interface ClothingCardProps {
  item: any;
  onEdit: (item: any) => void;
  onDelete: (item: any) => void;
}

const ClothingCard: React.FC<ClothingCardProps> = ({ item, onEdit, onDelete }) => (
  <div className="bg-[#FDFBF7] rounded-2xl shadow-[0_8px_24px_-10px_rgba(200,180,150,0.3)] overflow-hidden flex flex-col h-full border border-[#F0EAD6] relative">
    {/* NEW badge */}
    {item.isNew && (
      <span className="absolute top-3 left-3 bg-gradient-to-r from-[#D4AF37] to-[#B8860B] text-white text-xs font-bold px-3 py-1 rounded-full z-10 shadow">NEW</span>
    )}
    {/* Image Section */}
    <div className="aspect-[3/4] w-full bg-[#F5F2EB]">
      <img
        src={item.image_url || 'https://placehold.co/400x600/F5F2EB/8B7355?text=No+Image'}
        alt={item.name}
        className="object-cover w-full h-full"
      />
    </div>
    {/* Content Section */}
    <div className="flex-1 flex flex-col px-5 pt-4 pb-3">
      <h3 className="font-serif text-lg text-gray-800 font-semibold mb-2 truncate">{item.name}</h3>
      <div className="flex gap-2 mb-2">
        {(item.tags && item.tags.length > 0 ? item.tags.slice(0, 3) : ["Dress", "Casual"]).map((tag: string, i: number) => (
          <span key={tag + i} className="text-xs bg-[#F0EAD6] text-[#8B7355] px-2 py-1 rounded-full font-medium">
            {tag}
          </span>
        ))}
      </div>
      {/* Stats Row */}
      <div className="flex items-center justify-between text-xs text-[#8B7355] mt-2">
        <div className="flex gap-4">
          <span className="flex items-center gap-1">
            <StatIcon>♡</StatIcon>{item.stats?.likes_count ?? 0} Likes
          </span>
          <span className="flex items-center gap-1">
            <StatIcon>👁️</StatIcon>{item.stats?.tries_count ?? 0} Tries
          </span>
          <span className="flex items-center gap-1">
            <StatIcon>⇄</StatIcon>{item.stats?.shares_count ?? 0} Shares
          </span>
        </div>
        <span className="font-semibold">{item.price || "$0"}</span>
      </div>
      {/* Footer */}
      <div className="flex items-center justify-between mt-4">
        {/* Status badge */}
        <span className="bg-[#D4AF37]/20 text-[#9A7D0A] text-sm px-3 py-1 rounded-full font-semibold">
          {item.status}
        </span>
        {/* Meatball menu icon */}
        <button
          className="p-2 rounded-full hover:bg-[#F0EAD6] text-[#B8860B] transition"
          title="More actions"
          onClick={() => onEdit(item)}
        >
          <MoreHorizontal size={22} />
        </button>
      </div>
    </div>
  </div>
);

interface ClothingGridProps {
  uploads: any[];
  loading: boolean;
  onEdit: (item: any) => void;
  onDelete: (item: any) => void;
}

const ClothingGrid: React.FC<ClothingGridProps> = ({ uploads, loading, onEdit, onDelete }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    {loading ? (
      <div className="col-span-full text-center py-10 text-stone-500">Loading products...</div>
    ) : uploads.length === 0 ? (
      <div className="col-span-full text-center py-10 text-stone-500">No products uploaded yet.</div>
    ) : (
      uploads.map((item, idx) => (
        <ClothingCard
          key={item.product_id || idx}
          item={item}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))
    )}
  </div>
);

export default ClothingGrid;
