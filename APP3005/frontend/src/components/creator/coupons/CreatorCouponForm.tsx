import React, { useState, useEffect } from 'react';
import { RefreshCw, Tag, AlignLeft, Percent, IndianRupee, Calendar, Hash, Package } from 'lucide-react';
import { createCreatorCouponApi, CreateCreatorCouponParams, CreatorCoupon, updateCreatorCouponApi } from '../../../api/creator-coupons.api';
import { toast } from 'sonner';
import { getCreatorProducts } from '../../../lib/api';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

interface CreatorCouponFormProps {
    initialData?: CreatorCoupon | null;
    onSuccess: () => void;
    onCancel: () => void;
}

interface CreatorProductSummary {
    product_id: string;
    name?: string;
    title?: string;
    price_cents?: number;
    status?: string;
}

interface CreatorCouponFormState {
    productId: string;
    title: string;
    code: string;
    description: string;
    discountType: CreateCreatorCouponParams['discountType'];
    discountValue: string; // keep as string for UX, convert on submit
    minOrderAmount: string; // string to avoid forcing 0
    maxUsage: string; // string to avoid forcing 0
    startDate: string;
    endDate: string;
}

export const CreatorCouponForm: React.FC<CreatorCouponFormProps> = ({ initialData, onSuccess, onCancel }) => {
    const [loading, setLoading] = useState(false);
    const [products, setProducts] = useState<CreatorProductSummary[]>([]);
    const [fetchingProducts, setFetchingProducts] = useState(true);

    const [formData, setFormData] = useState<CreatorCouponFormState>({
        productId: '',
        title: '',
        code: '',
        description: '',
        discountType: 'PERCENTAGE',
        discountValue: '',
        minOrderAmount: '',
        maxUsage: '100',
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    });

    const isEditing = !!initialData;

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                // Fetch creator's products (paginated API)
                const response = await getCreatorProducts(1, 200);

                let data: CreatorProductSummary[] = [];
                if (Array.isArray(response)) {
                    data = response as CreatorProductSummary[];
                } else {
                    data = (response.data || []) as CreatorProductSummary[];
                }

                // Let backend enforce approval rules; show all creator products here
                setProducts(data);
            } catch (error) {
                const message = error instanceof Error ? error.message : 'Failed to load your products';
                toast.error(message);
            } finally {
                setFetchingProducts(false);
            }
        };
        fetchProducts();
    }, []);

    // Populate form when editing or reset when creating new
    useEffect(() => {
        if (initialData) {
            setFormData({
                productId: initialData.product.product_id,
                title: initialData.title,
                code: initialData.code,
                description: initialData.description || '',
                discountType: initialData.discount_type,
                discountValue: String(initialData.discount_value),
                minOrderAmount: String(initialData.min_order_amount),
                maxUsage: String(initialData.max_usage),
                startDate: initialData.start_date.split('T')[0],
                endDate: initialData.end_date.split('T')[0],
            });
        } else {
            setFormData({
                productId: '',
                title: '',
                code: '',
                description: '',
                discountType: 'PERCENTAGE',
                discountValue: '',
                minOrderAmount: '',
                maxUsage: '100',
                startDate: new Date().toISOString().split('T')[0],
                endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            });
        }
    }, [initialData]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;

        // Auto uppercase coupon code
        if (name === 'code') {
            const upper = String(value).toUpperCase().replace(/\s+/g, '');
            setFormData(prev => ({ ...prev, [name]: upper }));
            return;
        }

        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const generateCode = () => {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let code = '';
        for (let i = 0; i < 8; i++) {
            code += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        setFormData(prev => ({ ...prev, code }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.productId) {
            toast.error("Please select a product");
            return;
        }

        const discountValueNum = Number(formData.discountValue);
        if (Number.isNaN(discountValueNum) || discountValueNum <= 0) {
            toast.error('Please enter a valid discount value greater than 0');
            return;
        }

        const minOrderAmountNum = formData.minOrderAmount === '' ? 0 : Number(formData.minOrderAmount);
        if (Number.isNaN(minOrderAmountNum) || minOrderAmountNum < 0) {
            toast.error('Please enter a valid minimum order amount (0 or more)');
            return;
        }

        const maxUsageNum = Number(formData.maxUsage);
        if (Number.isNaN(maxUsageNum) || maxUsageNum < 1) {
            toast.error('Please enter a valid total usage limit (at least 1)');
            return;
        }

        try {
            setLoading(true);
            if (isEditing && initialData) {
                await updateCreatorCouponApi(initialData.creator_coupon_id, {
                    title: formData.title,
                    description: formData.description,
                    minOrderAmount: minOrderAmountNum,
                    maxUsage: maxUsageNum,
                    startDate: new Date(formData.startDate).toISOString(),
                    endDate: new Date(formData.endDate).toISOString(),
                });
                toast.success('Coupon updated and resubmitted for approval!');
            } else {
                await createCreatorCouponApi({
                    productId: formData.productId,
                    title: formData.title,
                    code: formData.code,
                    description: formData.description,
                    discountType: formData.discountType,
                    discountValue: discountValueNum,
                    minOrderAmount: minOrderAmountNum,
                    maxUsage: maxUsageNum,
                    startDate: new Date(formData.startDate).toISOString(),
                    endDate: new Date(formData.endDate).toISOString(),
                });
                toast.success('Coupon submitted for approval!');
            }
            onSuccess();
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to create coupon';
            toast.error(message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                {/* Product Selection */}
                <div className="md:col-span-2 space-y-2">
                    <Label className="text-sm font-medium text-luxury-cream flex items-center gap-2">
                        <Package size={16} className="text-emerald-400" />
                        Select Product for Coupon
                    </Label>
                    <select
                        name="productId"
                        value={formData.productId}
                        onChange={handleChange}
                        disabled={fetchingProducts || loading || isEditing}
                        required
                        className="w-full bg-luxury-charcoal border border-luxury-charcoal rounded-xl px-4 py-3 text-luxury-cream placeholder:text-muted-foreground focus:outline-none focus:border-luxury-gold focus:ring-1 focus:ring-luxury-gold appearance-none"
                    >
                        <option value="" disabled className="bg-neutral-900 text-luxury-cream/50">
                            {fetchingProducts ? 'Loading your products...' : 'Select a published product...'}
                        </option>
                        {products.map(p => (
                            <option key={p.product_id} value={p.product_id} className="bg-neutral-900 text-luxury-cream">
                                {(p.name || p.title || 'Unnamed Product')} {typeof p.price_cents === 'number' ? `- ₹${p.price_cents / 100}` : ''}
                            </option>
                        ))}
                    </select>
                    {products.length === 0 && !fetchingProducts && (
                        <p className="text-xs text-red-400 mt-1">You must have at least one approved product to create a coupon.</p>
                    )}
                </div>

                {/* Title */}
                <div className="space-y-2">
                    <Label htmlFor="title" className="text-sm font-medium text-luxury-cream flex items-center gap-2">
                        <Tag size={16} className="text-emerald-400" />
                        Coupon Title
                    </Label>
                    <Input
                        id="title"
                        type="text"
                        name="title"
                        required
                        placeholder="e.g. Summer Special 20%"
                        value={formData.title}
                        onChange={handleChange}
                        className="bg-luxury-charcoal border-luxury-charcoal text-luxury-cream placeholder:text-muted-foreground focus:border-luxury-gold focus:ring-luxury-gold"
                    />
                </div>

                {/* Code */}
                <div className="space-y-2">
                    <Label className="text-sm font-medium text-luxury-cream flex items-center justify-between">
                        <span className="flex items-center gap-2">
                            <Hash size={16} className="text-purple-400" />
                            Coupon Code
                        </span>
                        <button
                            type="button"
                            onClick={generateCode}
                            disabled={isEditing}
                            className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                            <RefreshCw size={12} /> Generate
                        </button>
                    </Label>
                    <Input
                        type="text"
                        name="code"
                        required
                        placeholder="e.g. SUMMER20"
                        value={formData.code}
                        onChange={handleChange}
                        disabled={isEditing}
                        className="bg-luxury-charcoal border-luxury-charcoal text-luxury-cream uppercase placeholder:text-muted-foreground focus:border-luxury-gold focus:ring-luxury-gold font-mono tracking-wider disabled:opacity-60 disabled:cursor-not-allowed"
                    />
                </div>

                {/* Description */}
                <div className="md:col-span-2 space-y-2">
                    <Label htmlFor="description" className="text-sm font-medium text-luxury-cream flex items-center gap-2">
                        <AlignLeft size={16} className="text-luxury-cream/60" />
                        Description (Optional)
                    </Label>
                    <Textarea
                        id="description"
                        name="description"
                        rows={2}
                        placeholder="Brief description for internal/admin reference..."
                        value={formData.description}
                        onChange={handleChange}
                        className="bg-luxury-charcoal border-luxury-charcoal text-luxury-cream placeholder:text-muted-foreground focus:border-luxury-gold focus:ring-luxury-gold resize-none"
                    />
                </div>

                {/* Discount Type */}
                <div className="space-y-2">
                    <Label className="text-sm font-medium text-luxury-cream flex items-center gap-2">
                        <Percent size={16} className="text-emerald-400" />
                        Discount Type
                    </Label>
                    <select
                        name="discountType"
                        value={formData.discountType}
                        onChange={handleChange}
                        disabled={isEditing}
                        className="w-full bg-luxury-charcoal border border-luxury-charcoal rounded-xl px-4 py-3 text-luxury-cream placeholder:text-muted-foreground focus:outline-none focus:border-luxury-gold focus:ring-1 focus:ring-luxury-gold appearance-none disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                        <option value="PERCENTAGE" className="bg-neutral-900 text-luxury-cream">Percentage (%)</option>
                        <option value="FLAT" className="bg-neutral-900 text-luxury-cream">Flat Amount (₹)</option>
                    </select>
                </div>

                {/* Discount Value */}
                <div className="space-y-2">
                    <Label className="text-sm font-medium text-luxury-cream flex items-center gap-2">
                        {formData.discountType === 'FLAT' ? (
                            <IndianRupee size={16} className="text-emerald-400" />
                        ) : (
                            <Percent size={16} className="text-emerald-400" />
                        )}
                        Discount Value
                    </Label>
                    <Input
                        type="number"
                        name="discountValue"
                        min="1"
                        step={formData.discountType === 'FLAT' ? "1" : "0.1"}
                        required
                        value={formData.discountValue}
                        onChange={handleChange}
                        disabled={isEditing}
                        className="bg-luxury-charcoal border-luxury-charcoal text-luxury-cream placeholder:text-muted-foreground focus:border-luxury-gold focus:ring-luxury-gold disabled:opacity-60 disabled:cursor-not-allowed"
                    />
                </div>

                {/* Min Order Amount */}
                <div className="space-y-2">
                    <Label className="text-sm font-medium text-luxury-cream flex items-center gap-2">
                        <IndianRupee size={16} className="text-luxury-cream/70" />
                        Min. Order Amount
                    </Label>
                    <Input
                        type="number"
                        name="minOrderAmount"
                        min="0"
                        required
                        value={formData.minOrderAmount}
                        onChange={handleChange}
                        className="bg-luxury-charcoal border-luxury-charcoal text-luxury-cream placeholder:text-muted-foreground focus:border-luxury-gold focus:ring-luxury-gold"
                    />
                </div>

                {/* Max Usage */}
                <div className="space-y-2">
                    <Label className="text-sm font-medium text-luxury-cream flex items-center gap-2">
                        Total Usage Limit
                    </Label>
                    <Input
                        type="number"
                        name="maxUsage"
                        min="1"
                        required
                        value={formData.maxUsage}
                        onChange={handleChange}
                        className="bg-luxury-charcoal border-luxury-charcoal text-luxury-cream placeholder:text-muted-foreground focus:border-luxury-gold focus:ring-luxury-gold"
                    />
                </div>

                {/* Validity Dates */}
                <div className="space-y-2">
                    <Label className="text-sm font-medium text-luxury-cream flex items-center gap-2">
                        <Calendar size={16} className="text-orange-400" />
                        Start Date
                    </Label>
                    <Input
                        type="date"
                        name="startDate"
                        required
                        value={formData.startDate}
                        onChange={handleChange}
                        className="bg-luxury-charcoal border-luxury-charcoal text-luxury-cream placeholder:text-muted-foreground focus:border-luxury-gold focus:ring-luxury-gold [color-scheme:dark]"
                        style={{ color: '#F5F2EB' }}
                    />
                </div>

                <div className="space-y-2">
                    <Label className="text-sm font-medium text-luxury-cream flex items-center gap-2">
                        <Calendar size={16} className="text-red-400" />
                        End Date
                    </Label>
                    <Input
                        type="date"
                        name="endDate"
                        required
                        min={formData.startDate}
                        value={formData.endDate}
                        onChange={handleChange}
                        className="bg-luxury-charcoal border-luxury-charcoal text-luxury-cream placeholder:text-muted-foreground focus:border-luxury-gold focus:ring-luxury-gold [color-scheme:dark]"
                        style={{ color: '#f5f2eb84' }}
                    />

                </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4 pt-4 border-t border-white/10">
                <button
                    type="button"
                    onClick={onCancel}
                    disabled={loading}
                    className="flex-1 py-3 px-4 rounded-xl font-medium text-white/70 hover:text-white bg-white/5 hover:bg-white/10 transition-all disabled:opacity-50"
                >
                    Cancel
                </button>
                <button
                    type="submit"
                    disabled={loading || products.length === 0}
                    className="flex-1 py-3 px-4 rounded-xl font-medium text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 transition-all shadow-lg shadow-blue-500/25 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                    {loading ? (
                        <div className="h-5 w-5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                    ) : (
                        'Submit for Approval'
                    )}
                </button>
            </div>

            <p className="text-xs text-center text-white/40 pt-2">
                Note: Your coupon will require admin approval before it becomes visible to users.
            </p>
        </form>
    );
};
