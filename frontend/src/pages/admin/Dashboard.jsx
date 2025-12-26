/**
 * Admin Dashboard
 * Overview with stats and recent orders
 */
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api';
import { formatPrice, formatDate } from '../../utils/helpers';
import {
    DollarSign,
    ShoppingCart,
    Users,
    Package,
    TrendingUp,
    ArrowRight,
    Loader2,
} from 'lucide-react';

const Dashboard = () => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDashboard = async () => {
            try {
                const response = await api.get('/admin/dashboard');
                setStats(response.data.data);
            } catch (error) {
                console.error('Failed to fetch dashboard:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchDashboard();
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-[var(--color-primary)]" />
            </div>
        );
    }

    const statCards = [
        {
            label: 'Total Revenue',
            value: formatPrice(stats?.totalRevenue || 0),
            icon: DollarSign,
            color: 'text-green-500',
            bg: 'bg-green-50',
        },
        {
            label: 'Total Orders',
            value: stats?.totalOrders || 0,
            icon: ShoppingCart,
            color: 'text-blue-500',
            bg: 'bg-blue-50',
        },
        {
            label: 'Total Users',
            value: stats?.totalUsers || 0,
            icon: Users,
            color: 'text-purple-500',
            bg: 'bg-purple-50',
        },
        {
            label: 'Total Products',
            value: stats?.totalProducts || 0,
            icon: Package,
            color: 'text-orange-500',
            bg: 'bg-orange-50',
        },
    ];

    return (
        <div>
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-2xl font-bold">Dashboard</h1>
                <div className="flex items-center gap-2 text-sm text-[var(--color-text-muted)]">
                    <TrendingUp className="w-4 h-4" />
                    Last 30 days
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {statCards.map((stat) => (
                    <div key={stat.label} className="card p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-[var(--color-text-muted)]">{stat.label}</p>
                                <p className="text-2xl font-bold mt-1">{stat.value}</p>
                            </div>
                            <div className={`w-12 h-12 ${stat.bg} rounded-lg flex items-center justify-center`}>
                                <stat.icon className={`w-6 h-6 ${stat.color}`} />
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Recent Orders */}
            <div className="card">
                <div className="p-4 border-b border-[var(--color-border)] flex justify-between items-center">
                    <h2 className="font-semibold">Recent Orders</h2>
                    <Link to="/admin/orders" className="text-sm text-[var(--color-primary)] flex items-center gap-1">
                        View All
                        <ArrowRight className="w-4 h-4" />
                    </Link>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-[var(--color-border)]">
                                <th className="text-left p-4 text-sm font-medium text-[var(--color-text-muted)]">Order</th>
                                <th className="text-left p-4 text-sm font-medium text-[var(--color-text-muted)]">Customer</th>
                                <th className="text-left p-4 text-sm font-medium text-[var(--color-text-muted)]">Date</th>
                                <th className="text-left p-4 text-sm font-medium text-[var(--color-text-muted)]">Status</th>
                                <th className="text-right p-4 text-sm font-medium text-[var(--color-text-muted)]">Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            {stats?.recentOrders?.length > 0 ? (
                                stats.recentOrders.map((order) => (
                                    <tr key={order._id} className="border-b border-[var(--color-border)] last:border-0">
                                        <td className="p-4">
                                            <Link to={`/admin/orders/${order._id}`} className="font-medium hover:text-[var(--color-primary)]">
                                                #{order.orderNumber}
                                            </Link>
                                        </td>
                                        <td className="p-4">{order.user?.name || 'Guest'}</td>
                                        <td className="p-4 text-sm text-[var(--color-text-muted)]">
                                            {formatDate(order.createdAt)}
                                        </td>
                                        <td className="p-4">
                                            <span className={`badge badge-${order.status === 'delivered' ? 'success' : order.status === 'cancelled' ? 'error' : 'warning'}`}>
                                                {order.status}
                                            </span>
                                        </td>
                                        <td className="p-4 text-right font-medium">
                                            {formatPrice(order.pricing.total)}
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={5} className="p-8 text-center text-[var(--color-text-muted)]">
                                        No orders yet
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
