import React from 'react';
import { Home, Briefcase, MapPin, Trash2, Edit2 } from 'lucide-react';
import { Address, ADDRESS_TYPE_CONFIG } from '@/constants/address.constants';

// Brand Colors
const GOLD = '#D4AF37';

interface AddressCardProps {
    address: Address;
    isSelected?: boolean;
    onSelect?: (address: Address) => void;
    onEdit?: (address: Address) => void;
    onDelete?: (address: Address) => void;
    showActions?: boolean;
}

export const AddressCard: React.FC<AddressCardProps> = ({
    address,
    isSelected = false,
    onSelect,
    onEdit,
    onDelete,
    showActions = true,
}) => {
    const typeConfig = ADDRESS_TYPE_CONFIG[address.address_type as keyof typeof ADDRESS_TYPE_CONFIG] || ADDRESS_TYPE_CONFIG.OTHER;

    const TypeIcon = address.address_type === 'HOME' ? Home :
        address.address_type === 'WORK' ? Briefcase : MapPin;

    return (
        <div
            className={`border rounded-sm p-4 transition-all ${isSelected
                    ? 'border-2'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
            style={{ borderColor: isSelected ? GOLD : undefined }}
        >
            <div className="flex items-start gap-3">
                {/* Radio Button */}
                {onSelect && (
                    <div className="pt-1">
                        <button
                            onClick={() => onSelect(address)}
                            className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${isSelected ? 'border-2' : 'border-gray-300'
                                }`}
                            style={{ borderColor: isSelected ? GOLD : undefined }}
                        >
                            {isSelected && (
                                <div
                                    className="w-2.5 h-2.5 rounded-full"
                                    style={{ backgroundColor: GOLD }}
                                />
                            )}
                        </button>
                    </div>
                )}

                {/* Address Details */}
                <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                        <span className="font-semibold text-sm">{address.full_name}</span>
                        <span
                            className="px-2 py-0.5 text-xs font-medium rounded-sm border"
                            style={{
                                color: typeConfig.color,
                                borderColor: typeConfig.color,
                                backgroundColor: `${typeConfig.color}10`
                            }}
                        >
                            {address.address_type}
                        </span>
                        {address.is_default && (
                            <span className="px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-600 rounded-sm">
                                DEFAULT
                            </span>
                        )}
                    </div>

                    <p className="text-sm text-gray-700 leading-relaxed">
                        {address.address_line1}
                        {address.address_line2 && `, ${address.address_line2}`}
                        {address.landmark && `, ${address.landmark}`}
                    </p>
                    <p className="text-sm text-gray-700">
                        {address.city}, {address.state} - {address.pincode}
                    </p>
                    <p className="text-sm text-gray-600 mt-2">
                        Mobile: <span className="font-medium">{address.phone}</span>
                    </p>

                    {/* Cash on Delivery info */}
                    {isSelected && (
                        <p className="text-xs text-green-600 mt-2">
                            • Cash on Delivery available
                        </p>
                    )}

                    {/* Action Buttons - Only show for selected address */}
                    {showActions && isSelected && (onEdit || onDelete) && (
                        <div className="flex gap-3 mt-4">
                            {onDelete && (
                                <button
                                    onClick={() => onDelete(address)}
                                    className="px-4 py-2 border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors rounded-sm flex items-center gap-2"
                                >
                                    REMOVE
                                </button>
                            )}
                            {onEdit && (
                                <button
                                    onClick={() => onEdit(address)}
                                    className="px-4 py-2 border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors rounded-sm flex items-center gap-2"
                                >
                                    EDIT
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AddressCard;
