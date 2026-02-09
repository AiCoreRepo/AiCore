import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
    CreateAddressParams,
    INDIAN_STATES,
    ADDRESS_VALIDATION,
    ADDRESS_MESSAGES,
} from '@/constants/address.constants';

// Brand Colors
const GOLD = '#D4AF37';
const GOLD_HOVER = '#C5A028';

interface AddressFormProps {
    onSubmit: (data: CreateAddressParams) => void;
    onCancel: () => void;
    initialData?: Partial<CreateAddressParams> | null;
    isLoading?: boolean;
}

export const AddressForm: React.FC<AddressFormProps> = ({
    onSubmit,
    onCancel,
    initialData,
    isLoading = false,
}) => {
    const [formData, setFormData] = useState<CreateAddressParams>({
        full_name: initialData?.full_name || '',
        phone: initialData?.phone || '',
        pincode: initialData?.pincode || '',
        address_line1: initialData?.address_line1 || '',
        address_line2: initialData?.address_line2 || '',
        city: initialData?.city || '',
        state: initialData?.state || '',
        landmark: initialData?.landmark || '',
        address_type: initialData?.address_type || 'HOME',
        is_default: initialData?.is_default || false,
    });

    const [errors, setErrors] = useState<Record<string, string>>({});

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        const checked = (e.target as HTMLInputElement).checked;

        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value,
        }));

        // Clear error on change
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const validate = (): boolean => {
        const newErrors: Record<string, string> = {};

        if (!formData.full_name.trim()) {
            newErrors.full_name = 'Name is required';
        } else if (formData.full_name.length < 2) {
            newErrors.full_name = 'Name must be at least 2 characters';
        }

        if (!formData.phone.trim()) {
            newErrors.phone = 'Mobile number is required';
        } else if (!ADDRESS_VALIDATION.PHONE_REGEX.test(formData.phone)) {
            newErrors.phone = 'Enter a valid 10-digit mobile number';
        }

        if (!formData.pincode.trim()) {
            newErrors.pincode = 'Pincode is required';
        } else if (!ADDRESS_VALIDATION.PINCODE_REGEX.test(formData.pincode)) {
            newErrors.pincode = 'Enter a valid 6-digit pincode';
        }

        if (!formData.city.trim()) {
            newErrors.city = 'City is required';
        }

        if (!formData.address_line1.trim()) {
            newErrors.address_line1 = 'Address is required';
        } else if (formData.address_line1.length < 5) {
            newErrors.address_line1 = 'Please enter complete address';
        }

        if (!formData.state) {
            newErrors.state = 'State is required';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (validate()) {
            onSubmit(formData);
        }
    };

    const addressTypes = ['HOME', 'WORK', 'OTHER'] as const;

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {/* Row 1: Full Name & Mobile */}
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
                        Full Name <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="text"
                        name="full_name"
                        value={formData.full_name}
                        onChange={handleChange}
                        placeholder="Enter your full name"
                        className={`w-full px-4 py-3 border rounded-sm text-sm focus:outline-none transition-colors ${errors.full_name ? 'border-red-400 bg-red-50' : 'border-gray-300 focus:border-gray-500'
                            }`}
                    />
                    {errors.full_name && (
                        <p className="text-red-500 text-xs mt-1">{errors.full_name}</p>
                    )}
                </div>
                <div>
                    <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
                        Mobile Number <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        placeholder="10-digit mobile number"
                        maxLength={10}
                        className={`w-full px-4 py-3 border rounded-sm text-sm focus:outline-none transition-colors ${errors.phone ? 'border-red-400 bg-red-50' : 'border-gray-300 focus:border-gray-500'
                            }`}
                    />
                    {errors.phone && (
                        <p className="text-red-500 text-xs mt-1">{errors.phone}</p>
                    )}
                </div>
            </div>

            {/* Row 2: Pincode & City */}
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
                        Pincode <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="text"
                        name="pincode"
                        value={formData.pincode}
                        onChange={handleChange}
                        placeholder="6-digit pincode"
                        maxLength={6}
                        className={`w-full px-4 py-3 border rounded-sm text-sm focus:outline-none transition-colors ${errors.pincode ? 'border-red-400 bg-red-50' : 'border-gray-300 focus:border-gray-500'
                            }`}
                    />
                    {errors.pincode && (
                        <p className="text-red-500 text-xs mt-1">{errors.pincode}</p>
                    )}
                </div>
                <div>
                    <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
                        City <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="text"
                        name="city"
                        value={formData.city}
                        onChange={handleChange}
                        placeholder="City name"
                        className={`w-full px-4 py-3 border rounded-sm text-sm focus:outline-none transition-colors ${errors.city ? 'border-red-400 bg-red-50' : 'border-gray-300 focus:border-gray-500'
                            }`}
                    />
                    {errors.city && (
                        <p className="text-red-500 text-xs mt-1">{errors.city}</p>
                    )}
                </div>
            </div>

            {/* Row 3: Address Line 1 (Full Width) */}
            <div>
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
                    Address (House No, Building, Street) <span className="text-red-500">*</span>
                </label>
                <input
                    type="text"
                    name="address_line1"
                    value={formData.address_line1}
                    onChange={handleChange}
                    placeholder="House No, Building Name, Street"
                    className={`w-full px-4 py-3 border rounded-sm text-sm focus:outline-none transition-colors ${errors.address_line1 ? 'border-red-400 bg-red-50' : 'border-gray-300 focus:border-gray-500'
                        }`}
                />
                {errors.address_line1 && (
                    <p className="text-red-500 text-xs mt-1">{errors.address_line1}</p>
                )}
            </div>

            {/* Row 4: Locality / Area (Full Width) */}
            <div>
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
                    Locality / Area
                </label>
                <input
                    type="text"
                    name="address_line2"
                    value={formData.address_line2}
                    onChange={handleChange}
                    placeholder="Locality, Area (Optional)"
                    className="w-full px-4 py-3 border border-gray-300 rounded-sm text-sm focus:outline-none focus:border-gray-500 transition-colors"
                />
            </div>

            {/* Row 5: State & Landmark */}
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
                        State <span className="text-red-500">*</span>
                    </label>
                    <select
                        name="state"
                        value={formData.state}
                        onChange={handleChange}
                        className={`w-full px-4 py-3 border rounded-sm text-sm focus:outline-none transition-colors appearance-none bg-white ${errors.state ? 'border-red-400 bg-red-50' : 'border-gray-300 focus:border-gray-500'
                            }`}
                    >
                        <option value="">Select State</option>
                        {INDIAN_STATES.map(state => (
                            <option key={state} value={state}>{state}</option>
                        ))}
                    </select>
                    {errors.state && (
                        <p className="text-red-500 text-xs mt-1">{errors.state}</p>
                    )}
                </div>
                <div>
                    <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
                        Landmark
                    </label>
                    <input
                        type="text"
                        name="landmark"
                        value={formData.landmark}
                        onChange={handleChange}
                        placeholder="Near School, Temple, etc."
                        className="w-full px-4 py-3 border border-gray-300 rounded-sm text-sm focus:outline-none focus:border-gray-500 transition-colors"
                    />
                </div>
            </div>

            {/* Address Type Selection */}
            <div>
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">
                    Save Address As
                </label>
                <div className="flex gap-3">
                    {addressTypes.map(type => (
                        <button
                            key={type}
                            type="button"
                            onClick={() => setFormData(prev => ({ ...prev, address_type: type }))}
                            className={`px-6 py-2 border rounded-sm text-sm font-medium transition-colors ${formData.address_type === type
                                ? 'bg-gray-900 text-white border-gray-900'
                                : 'bg-white text-gray-700 border-gray-300 hover:border-gray-500'
                                }`}
                        >
                            {type}
                        </button>
                    ))}
                </div>
            </div>

            {/* Default Address Checkbox */}
            <div className="flex items-center gap-2">
                <input
                    type="checkbox"
                    id="is_default"
                    name="is_default"
                    checked={formData.is_default}
                    onChange={handleChange}
                    className="w-4 h-4 cursor-pointer"
                    style={{ accentColor: GOLD }}
                />
                <label htmlFor="is_default" className="text-sm text-gray-700 cursor-pointer">
                    Make this my default address
                </label>
            </div>

            {/* Action Buttons - Fixed at bottom */}
            <div className="fixed bottom-0 left-0 right-0 max-w-xl flex gap-3 p-4 bg-white border-t border-gray-200 shadow-lg">
                <button
                    type="button"
                    onClick={onCancel}
                    className="flex-1 py-3 border border-gray-300 text-gray-700 font-medium uppercase text-sm tracking-wide hover:bg-gray-50 transition-colors rounded-sm"
                >
                    Cancel
                </button>
                <motion.button
                    type="submit"
                    disabled={isLoading}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    className="flex-1 py-3 text-white font-medium uppercase text-sm tracking-wide transition-colors disabled:opacity-50 disabled:cursor-not-allowed rounded-sm"
                    style={{ backgroundColor: GOLD }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = GOLD_HOVER}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = GOLD}
                >
                    {isLoading ? 'Saving...' : (initialData ? 'Update Address' : 'Save Address')}
                </motion.button>
            </div>
        </form>
    );
};

export default AddressForm;
