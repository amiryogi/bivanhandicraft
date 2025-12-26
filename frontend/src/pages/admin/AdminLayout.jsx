/**
 * Admin Layout
 * Sidebar navigation for admin pages
 */
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
    LayoutDashboard,
    Package,
    FolderTree,
    ShoppingCart,
    Users,
    Settings,
    LogOut,
    ChevronLeft,
} from 'lucide-react';

const AdminLayout = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const navItems = [
        { to: '/admin', icon: LayoutDashboard, label: 'Dashboard', end: true },
        { to: '/admin/products', icon: Package, label: 'Products' },
        { to: '/admin/categories', icon: FolderTree, label: 'Categories' },
        { to: '/admin/orders', icon: ShoppingCart, label: 'Orders' },
        { to: '/admin/users', icon: Users, label: 'Users' },
    ];

    return (
        <div className="min-h-screen flex bg-[var(--color-bg)]">
            {/* Sidebar */}
            <aside className="w-64 bg-[var(--color-surface)] border-r border-[var(--color-border)] fixed h-full flex flex-col">
                <div className="p-4 border-b border-[var(--color-border)]">
                    <Link to="/" className="flex items-center gap-2 text-sm text-[var(--color-text-muted)] hover:text-[var(--color-primary)]">
                        <ChevronLeft className="w-4 h-4" />
                        Back to Store
                    </Link>
                    <h1 className="text-xl font-bold text-[var(--color-primary)] mt-2">Admin Panel</h1>
                </div>

                <nav className="flex-1 p-4 space-y-1">
                    {navItems.map((item) => (
                        <NavLink
                            key={item.to}
                            to={item.to}
                            end={item.end}
                            className={({ isActive }) =>
                                `flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${isActive
                                    ? 'bg-[var(--color-primary)] text-white'
                                    : 'hover:bg-[var(--color-bg)]'
                                }`
                            }
                        >
                            <item.icon className="w-5 h-5" />
                            {item.label}
                        </NavLink>
                    ))}
                </nav>

                <div className="p-4 border-t border-[var(--color-border)]">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 bg-[var(--color-primary)] rounded-full flex items-center justify-center text-white font-medium">
                            {user?.name?.charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <p className="font-medium text-sm">{user?.name}</p>
                            <p className="text-xs text-[var(--color-text-muted)]">Admin</p>
                        </div>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-2 px-3 py-2 w-full text-left rounded-lg hover:bg-[var(--color-bg)] text-[var(--color-error)]"
                    >
                        <LogOut className="w-4 h-4" />
                        Logout
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 ml-64 p-8">
                <Outlet />
            </main>
        </div>
    );
};

export default AdminLayout;
