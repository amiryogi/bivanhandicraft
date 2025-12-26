/**
 * Placeholder Pages
 * Simple placeholder components for remaining pages
 */

// Categories Page
export const Categories = () => (
    <div className="container-app py-12 text-center">
        <h1 className="text-3xl font-bold mb-4">Categories</h1>
        <p className="text-[var(--color-text-muted)]">Browse our product categories</p>
    </div>
);

// Profile Page
export const Profile = () => (
    <div className="container-app py-12 text-center">
        <h1 className="text-3xl font-bold mb-4">My Profile</h1>
        <p className="text-[var(--color-text-muted)]">Manage your account settings</p>
    </div>
);

// Orders Page
export const Orders = () => (
    <div className="container-app py-12 text-center">
        <h1 className="text-3xl font-bold mb-4">My Orders</h1>
        <p className="text-[var(--color-text-muted)]">View your order history</p>
    </div>
);

// Order Detail Page
export const OrderDetail = () => (
    <div className="container-app py-12 text-center">
        <h1 className="text-3xl font-bold mb-4">Order Details</h1>
        <p className="text-[var(--color-text-muted)]">Track your order</p>
    </div>
);

// Not Found Page
export const NotFound = () => (
    <div className="container-app py-20 text-center">
        <h1 className="text-6xl font-bold text-[var(--color-primary)] mb-4">404</h1>
        <p className="text-xl text-[var(--color-text-muted)] mb-6">Page not found</p>
        <a href="/" className="btn btn-primary">Go Home</a>
    </div>
);

export default {
    Categories,
    Profile,
    Orders,
    OrderDetail,
    NotFound,
};

