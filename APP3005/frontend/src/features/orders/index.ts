// ============================================
// ORDERS FEATURE - EXPORTS
// ============================================

// Main Page
export { MyOrdersPage } from './MyOrdersPage';

// Components
export { StatusBadge } from './components/StatusBadge';
export { OrderTimeline } from './components/OrderTimeline';
export { OrderCard } from './components/OrderCard';
export { CancelOrderModal } from './components/CancelOrderModal';
export { ReturnOrderModal } from './components/ReturnOrderModal';
export { ReplaceOrderModal } from './components/ReplaceOrderModal';
export { Toast, ToastContainer } from './components/Toast';

// API
export { default as ordersApi } from './api/orders.api';

// Types
export type {
    Order,
    OrderItem,
    OrderStatus,
    PaymentStatus,
    PaymentMethod,
    RefundStatus,
    ReturnStatus,
    ReplacementStatus,
    OrderFilters,
    CancelOrderPayload,
    ReturnOrderPayload,
    ReplaceOrderPayload,
    OrderTimeline as OrderTimelineType,
} from './types/order.types';

// Utils
export * from './utils/order.utils';
