import { useState, useCallback } from 'react';

/**
 * Custom hook for managing modal/dialog state with data passing
 * 
 * @example
 * const modal = useDisclosure<Product>();
 * modal.open(productData);
 * // In modal: modal.data contains the product
 */
export function useDisclosure<T = any>() {
    const [isOpen, setIsOpen] = useState(false);
    const [data, setData] = useState<T | null>(null);

    const open = useCallback((itemData?: T) => {
        if (itemData) {
            setData(itemData);
        }
        setIsOpen(true);
    }, []);

    const close = useCallback(() => {
        setIsOpen(false);
        // Clear data after animation completes
        setTimeout(() => setData(null), 300);
    }, []);

    const toggle = useCallback(() => {
        setIsOpen((prev) => !prev);
    }, []);

    return {
        isOpen,
        data,
        open,
        close,
        toggle,
    };
}
