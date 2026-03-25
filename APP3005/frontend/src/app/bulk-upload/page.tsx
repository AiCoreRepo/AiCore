import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, ArrowLeft } from 'lucide-react';

/**
 * The old flat bulk-upload form has been replaced.
 * Creators now use the "Upload Product" button on the dashboard
 * which opens the guided Product → Pattern → Color Variant flow.
 */
const BulkUploadPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-6 gap-6">
      <div className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg"
        style={{ background: 'linear-gradient(135deg, #C9A75F, #D4B76E)' }}>
        <Sparkles size={28} className="text-white" />
      </div>

      <div>
        <h2 className="text-2xl font-serif font-bold mb-2" style={{ color: '#2C2416' }}>
          Upload Products from Dashboard
        </h2>
        <p className="text-sm max-w-sm" style={{ color: 'rgba(44,36,22,0.55)', lineHeight: 1.7 }}>
          Product uploads now use a guided flow — <strong>Product → Pattern → Color Variant</strong>.
          Go to your dashboard and click <strong>"Upload New Outfit"</strong> to get started.
        </p>
      </div>

      <button
        onClick={() => navigate('/creator-dashboard')}
        className="flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm transition-all"
        style={{
          background: 'linear-gradient(135deg, #C9A75F, #D4B76E)',
          color: '#2C2416',
          boxShadow: '0 4px 16px rgba(201,165,95,0.35)',
        }}
      >
        <ArrowLeft size={15} /> Go to Dashboard
      </button>
    </div>
  );
};

export default BulkUploadPage;
