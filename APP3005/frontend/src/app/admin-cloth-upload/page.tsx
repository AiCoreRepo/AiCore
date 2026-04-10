import { useMemo, useState } from 'react';
import axios from 'axios';
import { FolderSync, CheckCircle2, AlertTriangle, Loader2 } from 'lucide-react';
import { Sidebar } from '@/components/admin/Sidebar';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

interface SyncDetail {
  file: string;
  status: string;
  reason?: string;
}

interface SyncResponse {
  success: boolean;
  folder_path: string;
  cloudinary_folder: string;
  total: number;
  processed: number;
  queued: number;
  imported: number;
  skipped_duplicates: number;
  details: SyncDetail[];
  message: string;
}

const AdminClothUploadPage = () => {
  const [folderPath, setFolderPath] = useState('admin-cloth-upload/incoming');
  const [cloudinaryFolder, setCloudinaryFolder] = useState('aivestire/collection');
  const [defaultCategory, setDefaultCategory] = useState('Clothing');
  const [autoApprove, setAutoApprove] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<SyncResponse | null>(null);

  const topErrors = useMemo(() => {
    if (!result?.details?.length) {
      return [];
    }

    return result.details.filter((item) => item.status === 'error').slice(0, 10);
  }, [result]);

  const handleSync = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await axios.post<SyncResponse>(
        `${API_URL}/admin-cloth-upload/sync-folder`,
        {
          folder_path: folderPath,
          cloudinary_folder: cloudinaryFolder,
          default_category: defaultCategory,
          auto_approve: autoApprove,
        },
        {
          withCredentials: true,
        },
      );

      setResult(response.data);
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          'Failed to sync cloth folder',
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-900 flex">
      <Sidebar />

      <main className="flex-1 ml-0 md:ml-[280px] p-4 md:p-8 max-w-full overflow-x-hidden transition-all">
        <div className="max-w-6xl mx-auto space-y-6 md:space-y-8 pb-24 text-neutral-200">
          <div className="bg-neutral-900 border border-neutral-800 p-6 md:p-8 rounded-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#D4AF37]/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
            <div className="relative z-10">
              <h1 className="text-3xl md:text-4xl font-serif text-white mb-2 tracking-wide font-light">
                Admin Cloth Upload
              </h1>
              <p className="text-neutral-400 text-sm md:text-lg">
                Sync JPG, JPEG, and WEBP files from server folder to Cloudinary and collection products.
              </p>
            </div>
          </div>

          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 md:p-6 space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-neutral-300 mb-2">Folder Path</label>
                <input
                  value={folderPath}
                  onChange={(e) => setFolderPath(e.target.value)}
                  placeholder="admin-cloth-upload/incoming"
                  className="w-full bg-neutral-950 border border-neutral-700 rounded-lg px-3 py-2 text-neutral-200 focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/40"
                />
              </div>

              <div>
                <label className="block text-sm text-neutral-300 mb-2">Cloudinary Folder</label>
                <input
                  value={cloudinaryFolder}
                  onChange={(e) => setCloudinaryFolder(e.target.value)}
                  placeholder="aivestire/collection"
                  className="w-full bg-neutral-950 border border-neutral-700 rounded-lg px-3 py-2 text-neutral-200 focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/40"
                />
              </div>

              <div>
                <label className="block text-sm text-neutral-300 mb-2">Default Category</label>
                <input
                  value={defaultCategory}
                  onChange={(e) => setDefaultCategory(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-700 rounded-lg px-3 py-2 text-neutral-200 focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/40"
                />
              </div>

              <div className="flex items-end">
                <label className="inline-flex items-center gap-3 text-sm text-neutral-300 select-none">
                  <input
                    type="checkbox"
                    checked={autoApprove}
                    onChange={(e) => setAutoApprove(e.target.checked)}
                    className="h-4 w-4 rounded border-neutral-600 bg-neutral-950 text-[#D4AF37] focus:ring-[#D4AF37]/40"
                  />
                  Auto approve imported products
                </label>
              </div>
            </div>

            <button
              onClick={handleSync}
              disabled={loading}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#D4AF37] hover:bg-[#F3E5AB] text-neutral-950 rounded-xl font-semibold transition disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <FolderSync className="w-4 h-4" />}
              Sync Folder
            </button>

            {error && (
              <div className="rounded-lg border border-red-700/40 bg-red-950/40 p-3 text-red-300 text-sm">
                {error}
              </div>
            )}
          </div>

          {result && (
            <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 md:p-6 space-y-5">
              <div className="flex items-center gap-2 text-green-300">
                <CheckCircle2 className="w-5 h-5" />
                <span className="font-medium">{result.message}</span>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                <div className="bg-neutral-950 border border-neutral-800 rounded-lg p-3">
                  <p className="text-neutral-400 text-xs">Total</p>
                  <p className="text-neutral-100 text-xl font-semibold">{result.total}</p>
                </div>
                <div className="bg-neutral-950 border border-neutral-800 rounded-lg p-3">
                  <p className="text-neutral-400 text-xs">Processed</p>
                  <p className="text-neutral-100 text-xl font-semibold">{result.processed}</p>
                </div>
                <div className="bg-green-950/30 border border-green-700/30 rounded-lg p-3">
                  <p className="text-green-300 text-xs">Imported</p>
                  <p className="text-green-200 text-xl font-semibold">{result.imported}</p>
                </div>
                <div className="bg-blue-950/30 border border-blue-700/30 rounded-lg p-3">
                  <p className="text-blue-300 text-xs">Skipped Duplicates</p>
                  <p className="text-blue-200 text-xl font-semibold">{result.skipped_duplicates}</p>
                </div>
                <div className="bg-amber-950/30 border border-amber-700/30 rounded-lg p-3">
                  <p className="text-amber-300 text-xs">Queued</p>
                  <p className="text-amber-200 text-xl font-semibold">{result.queued}</p>
                </div>
              </div>

              {topErrors.length > 0 && (
                <div className="rounded-xl border border-red-700/30 bg-red-950/25 p-4">
                  <div className="flex items-center gap-2 mb-3 text-red-300">
                    <AlertTriangle className="w-4 h-4" />
                    <span className="font-medium text-sm">Top Errors</span>
                  </div>
                  <div className="space-y-2 text-sm text-red-200">
                    {topErrors.map((item, idx) => (
                      <p key={`${item.file}-${idx}`}>
                        {item.file}: {item.reason || 'Unknown error'}
                      </p>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default AdminClothUploadPage;
