/**
 * Admin Pages - Placeholders
 * Simple placeholder components for admin pages
 */

// Products Management
export const Products = () => (
    <div>
        <h1 className="text-2xl font-bold mb-8">Products</h1>
        <div className="card p-8 text-center text-[var(--color-text-muted)]">
            Manage your products here
        </div>
    </div>
);

// Categories Management
export const Categories = () => (
    <div>
        <h1 className="text-2xl font-bold mb-8">Categories</h1>
        <div className="card p-8 text-center text-[var(--color-text-muted)]">
            Manage your categories here
        </div>
    </div>
);

// Orders Management
export const Orders = () => (
    <div>
        <h1 className="text-2xl font-bold mb-8">Orders</h1>
        <div className="card p-8 text-center text-[var(--color-text-muted)]">
            View and manage orders here
        </div>
    </div>
);

// Users Management
export const Users = () => (
    <div>
        <h1 className="text-2xl font-bold mb-8">Users</h1>
        <div className="card p-8 text-center text-[var(--color-text-muted)]">
            Manage users here
        </div>
    </div>
);

export default { Products, Categories, Orders, Users };
