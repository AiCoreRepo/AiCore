import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, MapPin, ArrowLeft, Check } from 'lucide-react';
import {
    Address,
    CreateAddressParams,
    ADDRESS_MESSAGES,
} from '@/constants/address.constants';
import { AddressForm } from './AddressForm';
import { AddressCard } from './AddressCard';
import { getAddresses, createAddress, updateAddress, deleteAddress } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

// Brand Colors
const GOLD = '#D4AF37';
const GOLD_HOVER = '#C5A028';

interface AddressSelectorProps {
    isOpen: boolean;
    onClose: () => void;
    onSelectAddress: (address: Address) => void;
    selectedAddressId?: string;
}

// Success Popup Component
const SuccessPopup: React.FC<{ message: string; onClose: () => void }> = ({ message, onClose }) => {
    useEffect(() => {
        const timer = setTimeout(onClose, 2500);
        return () => clearTimeout(timer);
    }, [onClose]);

    return (
        <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-2"
        >
            <div className="w-5 h-5 bg-white rounded-full flex items-center justify-center">
                <Check className="w-3 h-3 text-green-600" />
            </div>
            <span className="font-medium">{message}</span>
        </motion.div>
    );
};

export const AddressSelector: React.FC<AddressSelectorProps> = ({
    isOpen,
    onClose,
    onSelectAddress,
    selectedAddressId,
}) => {
    const { toast } = useToast();
    const [addresses, setAddresses] = useState<Address[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingAddress, setEditingAddress] = useState<Address | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [localSelectedId, setLocalSelectedId] = useState<string | undefined>(selectedAddressId);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen) {
            fetchAddresses();
            setLocalSelectedId(selectedAddressId);
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [isOpen, selectedAddressId]);

    const fetchAddresses = async () => {
        try {
            setIsLoading(true);
            const data = await getAddresses();
            setAddresses(data);
            // Auto-select default address if none selected
            if (!localSelectedId && data.length > 0) {
                const defaultAddr = data.find(a => a.is_default) || data[0];
                setLocalSelectedId(defaultAddr.address_id);
            }
        } catch (error) {
            console.error('Failed to fetch addresses:', error);
            toast({
                variant: 'destructive',
                title: ADDRESS_MESSAGES.FETCH_ERROR,
                duration: 3000,
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreateAddress = async (data: CreateAddressParams) => {
        try {
            setIsSaving(true);
            const newAddress = await createAddress(data);
            setAddresses(prev => [newAddress, ...prev]);
            setLocalSelectedId(newAddress.address_id);
            setShowForm(false);
            setSuccessMessage('Address added successfully!');
        } catch (error: any) {
            toast({
                variant: 'destructive',
                title: error.message || ADDRESS_MESSAGES.ADD_ERROR,
                duration: 3000,
            });
        } finally {
            setIsSaving(false);
        }
    };

    const handleUpdateAddress = async (data: CreateAddressParams) => {
        if (!editingAddress) return;

        try {
            setIsSaving(true);
            const updatedAddress = await updateAddress(editingAddress.address_id, data);
            setAddresses(prev =>
                prev.map(addr => addr.address_id === updatedAddress.address_id ? updatedAddress : addr)
            );
            setEditingAddress(null);
            setShowForm(false);
            setSuccessMessage('Address updated successfully!');
        } catch (error: any) {
            toast({
                variant: 'destructive',
                title: error.message || ADDRESS_MESSAGES.UPDATE_ERROR,
                duration: 3000,
            });
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteAddress = async (address: Address) => {
        if (!confirm(ADDRESS_MESSAGES.DELETE_CONFIRM)) return;

        try {
            await deleteAddress(address.address_id);
            setAddresses(prev => prev.filter(addr => addr.address_id !== address.address_id));
            // Select another address if deleted one was selected
            if (localSelectedId === address.address_id) {
                const remaining = addresses.filter(a => a.address_id !== address.address_id);
                if (remaining.length > 0) {
                    setLocalSelectedId(remaining[0].address_id);
                } else {
                    setLocalSelectedId(undefined);
                }
            }
            setSuccessMessage('Address removed successfully!');
        } catch (error: any) {
            toast({
                variant: 'destructive',
                title: error.message || ADDRESS_MESSAGES.DELETE_ERROR,
                duration: 3000,
            });
        }
    };

    const handleContinue = () => {
        const selected = addresses.find(a => a.address_id === localSelectedId);
        if (selected) {
            onSelectAddress(selected);
            onClose();
        }
    };

    const handleBack = () => {
        if (showForm) {
            setShowForm(false);
            setEditingAddress(null);
        } else {
            onClose();
        }
    };

    // Separate default and other addresses
    const defaultAddress = addresses.find(a => a.is_default);
    const otherAddresses = addresses.filter(a => !a.is_default);

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Success Popup */}
                    <AnimatePresence>
                        {successMessage && (
                            <SuccessPopup
                                message={successMessage}
                                onClose={() => setSuccessMessage(null)}
                            />
                        )}
                    </AnimatePresence>

                    {/* Backdrop with blur */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
                        onClick={onClose}
                    />

                    {/* Slide-in Panel from Left */}
                    <motion.div
                        initial={{ x: '-100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '-100%' }}
                        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                        className="fixed inset-y-0 left-0 z-50 w-full max-w-xl bg-gray-50 shadow-2xl flex flex-col"
                    >
                        {/* Header */}
                        <div className="flex items-center gap-3 p-4 border-b border-gray-200 bg-white">
                            <button
                                onClick={handleBack}
                                className="p-2 -ml-2 hover:bg-gray-100 rounded-full transition-colors"
                            >
                                <ArrowLeft className="w-5 h-5" />
                            </button>
                            <div className="flex-1">
                                <h2 className="font-semibold text-lg">
                                    {showForm
                                        ? (editingAddress ? 'Edit Address' : 'Add New Address')
                                        : 'Select Delivery Address'
                                    }
                                </h2>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-y-auto">
                            <AnimatePresence mode="wait">
                                {showForm ? (
                                    <motion.div
                                        key="form"
                                        initial={{ opacity: 0, x: 50 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -50 }}
                                        transition={{ duration: 0.2 }}
                                        className="p-6 pb-32 bg-white min-h-full"
                                    >
                                        <AddressForm
                                            onSubmit={editingAddress ? handleUpdateAddress : handleCreateAddress}
                                            onCancel={() => {
                                                setShowForm(false);
                                                setEditingAddress(null);
                                            }}
                                            initialData={editingAddress}
                                            isLoading={isSaving}
                                        />
                                    </motion.div>
                                ) : (
                                    <motion.div
                                        key="list"
                                        initial={{ opacity: 0, x: -50 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: 50 }}
                                        transition={{ duration: 0.2 }}
                                        className="p-4"
                                    >
                                        {/* Add New Address Button - Top */}
                                        <div className="flex justify-end mb-4">
                                            <button
                                                onClick={() => setShowForm(true)}
                                                className="px-4 py-2 border text-sm font-medium uppercase tracking-wide rounded-sm flex items-center gap-2 transition-colors"
                                                style={{
                                                    borderColor: GOLD,
                                                    color: GOLD,
                                                }}
                                                onMouseEnter={(e) => {
                                                    e.currentTarget.style.backgroundColor = `${GOLD}10`;
                                                }}
                                                onMouseLeave={(e) => {
                                                    e.currentTarget.style.backgroundColor = 'transparent';
                                                }}
                                            >
                                                <Plus className="w-4 h-4" />
                                                Add New Address
                                            </button>
                                        </div>

                                        {isLoading ? (
                                            <div className="py-12 text-center bg-white rounded">
                                                <div className="animate-spin w-8 h-8 border-2 border-gray-300 border-t-gray-600 rounded-full mx-auto mb-3" />
                                                <p className="text-gray-500">Loading addresses...</p>
                                            </div>
                                        ) : addresses.length === 0 ? (
                                            <div className="py-12 text-center bg-white rounded">
                                                <div
                                                    className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center"
                                                    style={{ backgroundColor: `${GOLD}20` }}
                                                >
                                                    <MapPin className="w-8 h-8" style={{ color: GOLD }} />
                                                </div>
                                                <p className="text-gray-600 font-medium">{ADDRESS_MESSAGES.NO_ADDRESSES}</p>
                                                <p className="text-sm text-gray-400 mt-1">{ADDRESS_MESSAGES.NO_ADDRESSES_SUBTITLE}</p>
                                                <button
                                                    onClick={() => setShowForm(true)}
                                                    className="mt-4 px-6 py-2 text-white text-sm font-medium uppercase rounded-sm"
                                                    style={{ backgroundColor: GOLD }}
                                                >
                                                    Add Address
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="space-y-4">
                                                {/* Default Address Section */}
                                                {defaultAddress && (
                                                    <div className="bg-white rounded">
                                                        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 pt-4 pb-2">
                                                            Default Address
                                                        </h3>
                                                        <div className="px-4 pb-4">
                                                            <AddressCard
                                                                address={defaultAddress}
                                                                isSelected={localSelectedId === defaultAddress.address_id}
                                                                onSelect={(addr) => setLocalSelectedId(addr.address_id)}
                                                                onEdit={(addr) => {
                                                                    setEditingAddress(addr);
                                                                    setShowForm(true);
                                                                }}
                                                                onDelete={handleDeleteAddress}
                                                            />
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Other Addresses Section */}
                                                {otherAddresses.length > 0 && (
                                                    <div className="bg-white rounded">
                                                        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 pt-4 pb-2">
                                                            Other Address
                                                        </h3>
                                                        <div className="px-4 pb-4 space-y-3">
                                                            {otherAddresses.map((address, index) => (
                                                                <motion.div
                                                                    key={address.address_id}
                                                                    initial={{ opacity: 0, y: 10 }}
                                                                    animate={{ opacity: 1, y: 0 }}
                                                                    transition={{ delay: index * 0.05 }}
                                                                >
                                                                    <AddressCard
                                                                        address={address}
                                                                        isSelected={localSelectedId === address.address_id}
                                                                        onSelect={(addr) => setLocalSelectedId(addr.address_id)}
                                                                        onEdit={(addr) => {
                                                                            setEditingAddress(addr);
                                                                            setShowForm(true);
                                                                        }}
                                                                        onDelete={handleDeleteAddress}
                                                                    />
                                                                </motion.div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Add New Address Button - Bottom */}
                                                <button
                                                    onClick={() => setShowForm(true)}
                                                    className="w-full py-4 text-sm font-medium flex items-center justify-center gap-2 bg-white rounded hover:bg-gray-50 transition-colors"
                                                    style={{ color: GOLD }}
                                                >
                                                    <Plus className="w-4 h-4" />
                                                    Add New Address
                                                </button>
                                            </div>
                                        )}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* Footer - Continue Button */}
                        {!showForm && addresses.length > 0 && localSelectedId && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="p-4 border-t border-gray-200 bg-white"
                            >
                                <motion.button
                                    onClick={handleContinue}
                                    whileHover={{ scale: 1.01 }}
                                    whileTap={{ scale: 0.99 }}
                                    className="w-full py-4 text-white font-semibold uppercase tracking-wide transition-colors rounded-sm"
                                    style={{ backgroundColor: GOLD }}
                                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = GOLD_HOVER}
                                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = GOLD}
                                >
                                    Continue
                                </motion.button>
                            </motion.div>
                        )}
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

export default AddressSelector;
