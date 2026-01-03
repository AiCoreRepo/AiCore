import React from "react";
import { ChevronRight } from "lucide-react";
import { UploadItem } from "../../types/dashboard";

interface UploadsTableProps {
  uploads: UploadItem[];
  loading?: boolean;
  onUpdate?: (productId: string) => void;
  onDelete?: (productId: string) => void;
}

const StatusBadge: React.FC<{ status: "Active" | "Pending" }> = ({ status }) => {
  const color = status === "Active" ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800";
  return <span className={`px-2 py-1 rounded-full text-sm text-2xl font-bold text-luxury-black ${color}`}>{status}</span>;
};

const UploadsTable: React.FC<UploadsTableProps> = ({ uploads, loading, onUpdate, onDelete }) => {
  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="text-center py-10 text-stone-500">Loading products...</div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {uploads.length === 0 ? (
              <div className="col-span-full text-center py-10 text-stone-500">
                No products uploaded yet.
              </div>
            ) : (
              uploads.map((upload, index) => (
                <div key={upload.product_id || index} className="bg-gradient-to-br from-white to-luxury-cream rounded-2xl shadow-xl p-6 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
                  <div className="flex flex-col items-center mb-4">
                    <img
                      src={upload.image}
                      alt={upload.name}
                      className="w-32 h-32 rounded-full object-cover border border-gray-200 mb-2"
                    />
                    <h3 className="font-semibold text-luxury-charcoal text-xl tracking-tight">{upload.name}</h3>
                  </div>
                  <div className="flex gap-2 flex-wrap justify-center mb-4">
                    {upload.tags.map((t) => (
                      <span key={t} className="px-3 py-1 text-xs rounded-full bg-luxury-gold/10 text-luxury-gold font-medium">
                        {t}
                      </span>
                    ))}
                  </div>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-sm text-luxury-charcoal font-medium uppercase tracking-wide">Likes</p>
                      <p className="font-medium">{Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 }).format(upload.stats.likes)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-stone-500">Tries</p>
                      <p className="font-medium">{Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 }).format(upload.stats.tries)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-stone-500">CR</p>
                      <p className="font-medium">{upload.stats.conversionRate}</p>
                    </div>
                    <div>
                      <p className="text-sm text-stone-500">Status</p>
                      <StatusBadge status={upload.status} />
                    </div>
                  </div>
                  <div className="flex justify-center space-x-4">
                    {upload.product_id && (
                      <>
                        <button
                          onClick={() => onUpdate && upload.product_id && onUpdate(upload.product_id)}
                          className="px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors text-sm font-medium"
                        >
                          Update
                        </button>
                        <button
                          onClick={() => onDelete && upload.product_id && onDelete(upload.product_id)}
                          className="px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors text-sm font-medium"
                        >
                          Delete
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
    </div>
  );
};

export default UploadsTable;
