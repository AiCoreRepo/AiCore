import { useState } from 'react';
import { Upload, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

interface ImportResult {
    success: boolean;
    total?: number;
    imported?: number;
    skipped?: number;
    errors?: number;
    errorDetails?: Array<{ row: number; product: string; error: string }>;
    error?: string;
}

import { Sidebar } from '../components/admin/Sidebar';

export default function AdminCSVUploadPage() {
    const [file, setFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [result, setResult] = useState<ImportResult | null>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
            setResult(null);
        }
    };

    const handleUpload = async () => {
        if (!file) return;

        setUploading(true);
        setResult(null);

        try {
            const formData = new FormData();
            formData.append('file', file);

            const response = await axios.post<ImportResult>(
                `${API_URL}/admin/upload-csv`,
                formData,
                {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                    },
                    withCredentials: true,
                }
            );

            setResult(response.data);
        } catch (error: any) {
            setResult({
                success: false,
                error: error.response?.data?.message || error.message || 'Upload failed',
            });
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="flex min-h-screen bg-neutral-950 text-neutral-200 font-sans">
            <Sidebar />
            <div className="flex-1 ml-[280px]">
                <div className="p-8 max-w-5xl mx-auto">
                    {/* Header */}
                    <div className="mb-8">
                        <h1 className="text-3xl font-serif font-bold text-neutral-100 mb-2">
                            Import Products
                        </h1>
                        <p className="text-neutral-400">
                            Upload a CSV file to bulk import products into the collection
                        </p>
                    </div>

                    {/* Upload Card */}
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-8 mb-6 backdrop-blur-sm">
                        <div className="flex flex-col items-center justify-center space-y-6">
                            {/* File Input */}
                            <div className="w-full">
                                <label
                                    htmlFor="csv-upload"
                                    className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed border-white/20 rounded-xl cursor-pointer hover:border-[#D4AF37] transition-colors bg-white/5"
                                >
                                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                        <Upload className="w-12 h-12 text-neutral-500 mb-4" />
                                        <p className="mb-2 text-sm text-neutral-300">
                                            <span className="font-semibold text-[#D4AF37]">Click to upload</span> or drag and drop
                                        </p>
                                        <p className="text-xs text-neutral-500">CSV file (main_train_data.csv)</p>
                                        {file && (
                                            <p className="mt-4 text-sm font-medium text-[#D4AF37] bg-[#D4AF37]/10 px-3 py-1 rounded-full border border-[#D4AF37]/20">
                                                Selected: {file.name}
                                            </p>
                                        )}
                                    </div>
                                    <input
                                        id="csv-upload"
                                        type="file"
                                        accept=".csv"
                                        className="hidden"
                                        onChange={handleFileChange}
                                        disabled={uploading}
                                    />
                                </label>
                            </div>

                            {/* Upload Button */}
                            <button
                                onClick={handleUpload}
                                disabled={!file || uploading}
                                className="bg-[#D4AF37] hover:bg-[#B5952F] text-black px-8 py-3 rounded-xl font-bold disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-all"
                            >
                                {uploading ? (
                                    <>
                                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-black"></div>
                                        Importing...
                                    </>
                                ) : (
                                    <>
                                        <Upload className="w-5 h-5" />
                                        Import Products
                                    </>
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Results */}
                    {result && (
                        <div className="bg-white/5 border border-white/10 rounded-2xl p-8 backdrop-blur-sm">
                            {result.success ? (
                                <div className="space-y-6">
                                    {/* All Skipped Case - Simple Message */}
                                    {result.total === result.skipped ? (
                                        <div className="flex flex-col items-center justify-center text-center py-4">
                                            <CheckCircle className="w-12 h-12 text-[#D4AF37] mb-4" />
                                            <h2 className="text-2xl font-serif font-bold text-neutral-100 mb-2">
                                                All Products Up to Date
                                            </h2>
                                            <p className="text-neutral-400">
                                                These products have already been imported. No new changes were made.
                                            </p>
                                        </div>
                                    ) : (
                                        /* Normal Stats Case */
                                        <>
                                            {/* Success Header */}
                                            <div className="flex items-center gap-3">
                                                <CheckCircle className="w-8 h-8 text-green-500" />
                                                <h2 className="text-2xl font-serif font-bold text-neutral-100">
                                                    Import Completed
                                                </h2>
                                            </div>

                                            {/* Stats */}
                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                                <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                                                    <div className="text-2xl font-bold text-neutral-200">{result.total}</div>
                                                    <div className="text-sm text-neutral-500">Total Products</div>
                                                </div>
                                                <div className="bg-green-500/10 rounded-xl p-4 border border-green-500/20">
                                                    <div className="text-2xl font-bold text-green-500">{result.imported}</div>
                                                    <div className="text-sm text-green-400">Imported</div>
                                                </div>
                                                <div className="bg-blue-500/10 rounded-xl p-4 border border-blue-500/20">
                                                    <div className="text-2xl font-bold text-blue-500">{result.skipped}</div>
                                                    <div className="text-sm text-blue-400">Skipped (Exists)</div>
                                                </div>
                                                <div className="bg-red-500/10 rounded-xl p-4 border border-red-500/20">
                                                    <div className="text-2xl font-bold text-red-500">{result.errors}</div>
                                                    <div className="text-sm text-red-400">Errors</div>
                                                </div>
                                            </div>

                                            {/* Error Details */}
                                            {result.errorDetails && result.errorDetails.length > 0 && (
                                                <div className="mt-6">
                                                    <div className="flex items-center gap-2 mb-3">
                                                        <AlertCircle className="w-5 h-5 text-red-500" />
                                                        <h3 className="font-semibold text-neutral-300">Error Details</h3>
                                                    </div>
                                                    <div className="bg-red-950/30 border border-red-500/20 rounded-xl p-4 max-h-64 overflow-y-auto">
                                                        {result.errorDetails.map((err, idx) => (
                                                            <div key={idx} className="text-sm text-red-400 mb-2 font-mono">
                                                                <span className="font-bold">Row {err.row}:</span> {err.error}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <div className="flex items-center gap-3">
                                        <XCircle className="w-8 h-8 text-red-500" />
                                        <h2 className="text-2xl font-serif font-bold text-neutral-100">
                                            Import Failed
                                        </h2>
                                    </div>
                                    <div className="bg-red-950/30 border border-red-500/20 rounded-xl p-4">
                                        <p className="text-red-400">{result.error}</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Instructions */}
                    <div className="mt-8 bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-sm">
                        <h3 className="font-serif font-bold text-neutral-200 mb-4">Instructions</h3>
                        <ul className="space-y-2 text-sm text-neutral-400">
                            <li className="flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37]"></span>
                                Upload the <code className="bg-white/10 px-2 py-0.5 rounded text-neutral-300">main_train_data.csv</code> file
                            </li>
                            <li className="flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37]"></span>
                                Products will be imported with <span className="text-green-400 font-medium">APPROVED</span> status
                            </li>
                            <li className="flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37]"></span>
                                Duplicate products (same cloth_id) will be skipped automatically
                            </li>
                            <li className="flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37]"></span>
                                A creator account will be auto-created if it doesn't exist
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
}
