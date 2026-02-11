// ============================================================================
// Address Constants and Types
// ============================================================================

// Address Types
export const ADDRESS_TYPES = ['HOME', 'WORK', 'OTHER'] as const;
export type AddressType = (typeof ADDRESS_TYPES)[number];

// Indian States List
export const INDIAN_STATES = [
    'Andhra Pradesh',
    'Arunachal Pradesh',
    'Assam',
    'Bihar',
    'Chhattisgarh',
    'Goa',
    'Gujarat',
    'Haryana',
    'Himachal Pradesh',
    'Jharkhand',
    'Karnataka',
    'Kerala',
    'Madhya Pradesh',
    'Maharashtra',
    'Manipur',
    'Meghalaya',
    'Mizoram',
    'Nagaland',
    'Odisha',
    'Punjab',
    'Rajasthan',
    'Sikkim',
    'Tamil Nadu',
    'Telangana',
    'Tripura',
    'Uttar Pradesh',
    'Uttarakhand',
    'West Bengal',
    'Delhi',
    'Jammu and Kashmir',
    'Ladakh',
] as const;

export type IndianState = (typeof INDIAN_STATES)[number];

// Validation Patterns
export const ADDRESS_VALIDATION = {
    PHONE_REGEX: /^[6-9]\d{9}$/,
    PINCODE_REGEX: /^\d{6}$/,
    PHONE_MESSAGE: 'Phone must be a valid 10-digit Indian mobile number',
    PINCODE_MESSAGE: 'Pincode must be 6 digits',
    NAME_MIN_LENGTH: 2,
    NAME_MAX_LENGTH: 100,
    ADDRESS_LINE_MIN_LENGTH: 5,
    ADDRESS_LINE_MAX_LENGTH: 200,
} as const;

// API Endpoints
export const ADDRESS_ENDPOINTS = {
    BASE: '/addresses',
    GET_ALL: '/addresses',
    GET_DEFAULT: '/addresses/default',
    GET_ONE: (id: string) => `/addresses/${id}`,
    CREATE: '/addresses',
    UPDATE: (id: string) => `/addresses/${id}`,
    DELETE: (id: string) => `/addresses/${id}`,
    SET_DEFAULT: (id: string) => `/addresses/${id}/set-default`,
} as const;

// User-facing Messages
export const ADDRESS_MESSAGES = {
    ADD_SUCCESS: 'Address added successfully',
    UPDATE_SUCCESS: 'Address updated successfully',
    DELETE_SUCCESS: 'Address deleted',
    SET_DEFAULT_SUCCESS: 'Default address updated',
    FETCH_ERROR: 'Failed to load addresses',
    ADD_ERROR: 'Failed to add address',
    UPDATE_ERROR: 'Failed to update address',
    DELETE_ERROR: 'Failed to delete address',
    DELETE_CONFIRM: 'Are you sure you want to delete this address?',
    NO_ADDRESSES: 'No addresses saved yet',
    NO_ADDRESSES_SUBTITLE: 'Add your first delivery address',
} as const;

// Address Type Labels & Colors
export const ADDRESS_TYPE_CONFIG = {
    HOME: {
        label: 'Home',
        color: 'bg-blue-100 text-blue-700',
    },
    WORK: {
        label: 'Work',
        color: 'bg-purple-100 text-purple-700',
    },
    OTHER: {
        label: 'Other',
        color: 'bg-gray-100 text-gray-700',
    },
} as const;

// ============================================================================
// Address Interfaces
// ============================================================================

export interface Address {
    address_id: string;
    user_id: string;
    full_name: string;
    phone: string;
    pincode: string;
    address_line1: string;
    address_line2?: string;
    city: string;
    state: string;
    landmark?: string;
    address_type: AddressType;
    is_default: boolean;
    created_at: string;
    updated_at: string;
}

export interface CreateAddressParams {
    full_name: string;
    phone: string;
    pincode: string;
    address_line1: string;
    address_line2?: string;
    city: string;
    state: string;
    landmark?: string;
    address_type?: AddressType;
    is_default?: boolean;
}

export type UpdateAddressParams = Partial<CreateAddressParams>;
