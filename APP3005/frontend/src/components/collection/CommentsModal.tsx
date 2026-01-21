import { X, Send, Trash2, MessageCircle, Image as ImageIcon } from "lucide-react";
import { useState, useEffect } from "react";
import { getProductComments, addComment, deleteComment } from "../../lib/api";
import { useToast } from "@/hooks/use-toast";
import { ImageGallery } from "@/components/common/ImageGallery";

interface Comment {
    comment_id: string;
    comment_text: string;
    image_urls?: string[];
    created_at: string;
    user: {
        user_id: string;
        email: string;
    };
}

interface CommentsModalProps {
    productId: string;
    productTitle: string;
    isOpen: boolean;
    onClose: () => void;
    onCommentCountChange?: (count: number) => void;
}

export const CommentsModal = ({ productId, productTitle, isOpen, onClose, onCommentCountChange }: CommentsModalProps) => {
    const { toast } = useToast();
    const [comments, setComments] = useState<Comment[]>([]);
    const [newComment, setNewComment] = useState("");
    const [selectedImages, setSelectedImages] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Get current user ID from localStorage
    const getCurrentUserId = () => {
        const token = localStorage.getItem('access_token');
        if (!token) return null;
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            return payload.userId;
        } catch {
            return null;
        }
    };

    const currentUserId = getCurrentUserId();

    // Fetch comments when modal opens
    useEffect(() => {
        if (isOpen) {
            fetchComments();
        }
    }, [isOpen, productId]);

    const fetchComments = async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await getProductComments(productId);
            setComments(Array.isArray(data) ? data : []);
            // Update parent component's count
            if (onCommentCountChange) {
                onCommentCountChange(Array.isArray(data) ? data.length : 0);
            }
        } catch (err) {
            console.error('Error fetching comments:', err);
            const errorMessage = err instanceof Error ? err.message : 'Failed to load comments';
            setError(errorMessage);
            setComments([]);
        } finally {
            setLoading(false);
        }
    };

    // Handle image selection
    const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files) return;

        const maxImages = 5;
        const maxSize = 5 * 1024 * 1024; // 5MB
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

        const newImages: string[] = [];
        let errorCount = 0;

        Array.from(files).forEach((file) => {
            if (selectedImages.length + newImages.length >= maxImages) {
                return;
            }

            if (!allowedTypes.includes(file.type)) {
                errorCount++;
                return;
            }

            if (file.size > maxSize) {
                toast({
                    variant: "destructive",
                    title: "File too large",
                    description: `${file.name} exceeds 5MB limit`,
                    duration: 3000,
                });
                return;
            }

            const reader = new FileReader();
            reader.onloadend = () => {
                if (reader.result && typeof reader.result === 'string') {
                    setSelectedImages(prev => [...prev, reader.result as string]);
                }
            };
            reader.readAsDataURL(file);
        });

        if (errorCount > 0) {
            toast({
                variant: "destructive",
                title: "Invalid file type",
                description: "Only JPG, PNG, and WebP images are allowed",
                duration: 3000,
            });
        }

        // Reset input
        e.target.value = '';
    };

    const removeImage = (index: number) => {
        setSelectedImages(prev => prev.filter((_, i) => i !== index));
    };

    const handleSubmitComment = async () => {
        if (!newComment.trim()) {
            toast({
                variant: "destructive",
                title: "Comment is empty",
                description: "Please write something before posting",
                duration: 2000,
            });
            return;
        }

        setSubmitting(true);
        setError(null);
        try {
            const comment = await addComment(productId, newComment.trim(), selectedImages);

            // Use functional setState to ensure we're working with the latest state
            setComments(prevComments => {
                const updatedComments = [comment, ...prevComments];
                // Update parent component's count with the new length
                if (onCommentCountChange) {
                    onCommentCountChange(updatedComments.length);
                }
                return updatedComments;
            });

            setNewComment("");
            setSelectedImages([]);

            // Success toast
            toast({
                title: "Comment posted!",
                description: "Your review has been added successfully",
                duration: 2000,
            });
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to add comment';
            setError(errorMessage);

            // Error toast
            toast({
                variant: "destructive",
                title: "Failed to post comment",
                description: errorMessage,
                duration: 3000,
            });
        } finally {
            setSubmitting(false);
        }
    };

    const handleDeleteComment = async (commentId: string) => {
        try {
            await deleteComment(commentId);

            // Use functional setState to ensure we're working with the latest state
            setComments(prevComments => {
                const updatedComments = prevComments.filter(c => c.comment_id !== commentId);
                // Update parent component's count with the new length
                if (onCommentCountChange) {
                    onCommentCountChange(updatedComments.length);
                }
                return updatedComments;
            });

            // Success toast
            toast({
                title: "Comment deleted",
                description: "Your comment has been removed",
                duration: 2000,
            });
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to delete comment';
            setError(errorMessage);

            // Error toast
            toast({
                variant: "destructive",
                title: "Failed to delete comment",
                description: errorMessage,
                duration: 3000,
            });
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        return date.toLocaleDateString();
    };

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(0, 0, 0, 0.7)' }}
            onClick={onClose}
        >
            <div
                className="relative w-full max-w-2xl max-h-[80vh] rounded-2xl overflow-hidden"
                style={{ background: '#FFFFFF' }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div
                    className="sticky top-0 z-10 px-6 py-4 border-b"
                    style={{
                        background: 'linear-gradient(135deg, #F8F4EC 0%, #FFFFFF 100%)',
                        borderColor: 'rgba(212, 175, 55, 0.2)',
                    }}
                >
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <MessageCircle className="w-6 h-6" style={{ color: '#D4AF37' }} />
                            <div>
                                <h2 className="text-xl font-semibold flex items-center gap-2" style={{ color: '#2C2C2C' }}>
                                    Reviews & Comments
                                    <span className="px-2 py-0.5 rounded-full text-xs font-medium" style={{ background: 'rgba(212, 175, 55, 0.2)', color: '#D4AF37' }}>
                                        {comments.length}
                                    </span>
                                </h2>
                                <p className="text-sm text-gray-600">{productTitle}</p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110"
                            style={{
                                background: 'rgba(255, 255, 255, 0.9)',
                                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                            }}
                        >
                            <X className="w-5 h-5" style={{ color: '#2C2C2C' }} />
                        </button>
                    </div>
                </div>

                {/* Comment Input */}
                <div className="px-6 py-4 border-b" style={{ borderColor: 'rgba(0, 0, 0, 0.1)' }}>
                    <textarea
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder="Write your review or comment..."
                        className="w-full px-4 py-3 rounded-xl resize-none focus:outline-none focus:ring-2 transition-all"
                        style={{
                            background: '#F8F4EC',
                            border: '1px solid rgba(212, 175, 55, 0.2)',
                            minHeight: '100px',
                        }}
                        onFocus={(e) => {
                            e.target.style.borderColor = '#D4AF37';
                            e.target.style.boxShadow = '0 0 0 3px rgba(212, 175, 55, 0.1)';
                        }}
                        onBlur={(e) => {
                            e.target.style.borderColor = 'rgba(212, 175, 55, 0.2)';
                            e.target.style.boxShadow = 'none';
                        }}
                        maxLength={1000}
                    />

                    {/* Image Previews */}
                    {selectedImages.length > 0 && (
                        <div className="mt-3 grid grid-cols-5 gap-3">
                            {selectedImages.map((img, index) => (
                                <div key={index} className="relative w-full aspect-square rounded-lg overflow-hidden border-2 border-gold/30 shadow-sm hover:shadow-md transition-all">
                                    <img src={img} alt={`Preview ${index + 1}`} className="w-full h-full object-cover" />
                                    <button
                                        onClick={() => removeImage(index)}
                                        className="absolute top-1 right-1 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center text-sm font-bold hover:bg-red-600 transition-all hover:scale-110 shadow-md"
                                    >
                                        ×
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}

                    <div className="flex items-center justify-between mt-3">
                        <div className="flex items-center gap-3">
                            <span className="text-xs text-gray-500">
                                {newComment.length}/1000 characters
                            </span>

                            {/* Image Upload Button */}
                            <label
                                className="cursor-pointer flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all hover:scale-105 disabled:opacity-50"
                                style={{
                                    background: selectedImages.length >= 5 ? 'rgba(200, 200, 200, 0.3)' : 'rgba(212, 175, 55, 0.1)',
                                    color: selectedImages.length >= 5 ? '#999' : '#D4AF37',
                                    border: `1px solid ${selectedImages.length >= 5 ? 'rgba(200, 200, 200, 0.3)' : 'rgba(212, 175, 55, 0.3)'}`,
                                    cursor: selectedImages.length >= 5 ? 'not-allowed' : 'pointer'
                                }}
                            >
                                <input
                                    type="file"
                                    accept="image/jpeg,image/jpg,image/png,image/webp"
                                    multiple
                                    onChange={handleImageSelect}
                                    className="hidden"
                                    disabled={selectedImages.length >= 5}
                                />
                                <ImageIcon className="w-4 h-4" />
                                <span>{selectedImages.length}/5 images</span>
                            </label>

                            {/* Loading indicator during upload */}
                            {submitting && selectedImages.length > 0 && (
                                <div className="text-xs text-gray-500 flex items-center gap-1">
                                    <div className="animate-spin h-3 w-3 border-2 rounded-full" style={{ borderColor: '#D4AF37', borderTopColor: 'transparent' }} />
                                    Uploading {selectedImages.length} image{selectedImages.length > 1 ? 's' : ''}...
                                </div>
                            )}
                        </div>
                        <button
                            onClick={handleSubmitComment}
                            disabled={!newComment.trim() || submitting}
                            className="px-6 py-2.5 rounded-lg font-medium text-sm flex items-center gap-2 transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                            style={{
                                background: newComment.trim() && !submitting
                                    ? 'linear-gradient(135deg, #D4AF37 0%, #C9A55C 100%)'
                                    : '#E5E5E5',
                                color: newComment.trim() && !submitting ? '#1a1a1a' : '#999',
                                boxShadow: newComment.trim() && !submitting
                                    ? '0 4px 12px rgba(212, 175, 55, 0.3)'
                                    : 'none',
                            }}
                        >
                            <Send className="w-4 h-4" />
                            {submitting ? 'Posting...' : 'Post Comment'}
                        </button>
                    </div>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="mx-6 mt-4 px-4 py-3 rounded-lg" style={{ background: '#FEE2E2', color: '#991B1B' }}>
                        {error}
                    </div>
                )}

                {/* Comments List */}
                <div className="overflow-y-auto" style={{ maxHeight: 'calc(80vh - 300px)' }}>
                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <div className="animate-spin rounded-full h-10 w-10 border-4 border-gray-200" style={{ borderTopColor: '#D4AF37' }} />
                        </div>
                    ) : comments.length === 0 ? (
                        <div className="text-center py-12">
                            <MessageCircle className="w-16 h-16 mx-auto mb-4 opacity-20" style={{ color: '#D4AF37' }} />
                            <p className="text-gray-500">No comments yet. Be the first to review!</p>
                        </div>
                    ) : (
                        <div className="divide-y" style={{ borderColor: 'rgba(0, 0, 0, 0.1)' }}>
                            {comments.map((comment) => (
                                <div key={comment.comment_id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-2">
                                                <div
                                                    className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold"
                                                    style={{
                                                        background: 'linear-gradient(135deg, #D4AF37 0%, #C9A55C 100%)',
                                                        color: '#1a1a1a',
                                                    }}
                                                >
                                                    {comment.user.email.charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium" style={{ color: '#2C2C2C' }}>
                                                        {comment.user.email.split('@')[0]}
                                                    </p>
                                                    <p className="text-xs text-gray-500">
                                                        {formatDate(comment.created_at)}
                                                    </p>
                                                </div>
                                            </div>
                                            <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                                                {comment.comment_text}
                                            </p>

                                            {/* Display Review Images */}
                                            {comment.image_urls && comment.image_urls.length > 0 && (
                                                <ImageGallery images={comment.image_urls} className="mt-3" />
                                            )}
                                        </div>
                                        {currentUserId === comment.user.user_id && (
                                            <button
                                                onClick={() => handleDeleteComment(comment.comment_id)}
                                                className="p-2 rounded-lg transition-all duration-300 hover:bg-red-50"
                                                title="Delete comment"
                                            >
                                                <Trash2 className="w-4 h-4 text-red-500" />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
