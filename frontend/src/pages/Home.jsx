/**
 * Home Page
 * Landing page with hero, featured products, and categories
 */
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { productsAPI, categoriesAPI } from '../api';
import { formatPrice, calculateDiscount } from '../utils/helpers';
import { ArrowRight, Truck, Shield, Headphones, Loader2 } from 'lucide-react';

const Home = () => {
    const [featuredProducts, setFeaturedProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [productsRes, categoriesRes] = await Promise.all([
                    productsAPI.getFeatured(8),
                    categoriesAPI.getCategories(),
                ]);
                setFeaturedProducts(productsRes.data.products);
                setCategories(categoriesRes.data.categories.slice(0, 6));
            } catch (error) {
                console.error('Failed to fetch home data:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    return (
        <div>
            {/* Hero Section */}
            <section className="relative bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-dark)] text-white overflow-hidden">
                <div className="absolute inset-0 opacity-10">
                    <div className="absolute inset-0" style={{
                        backgroundImage: 'url("data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23ffffff" fill-opacity="0.4"%3E%3Cpath d="M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
                    }} />
                </div>

                <div className="container-app py-20 md:py-32 relative z-10">
                    <div className="max-w-2xl">
                        <span className="inline-block px-4 py-1 bg-white/20 rounded-full text-sm mb-6">
                            ✨ Handcrafted in Nepal
                        </span>
                        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
                            Authentic Nepali Handicrafts
                        </h1>
                        <p className="text-lg md:text-xl text-white/80 mb-8">
                            Discover the beauty of traditional Nepali craftsmanship. Each piece tells a story of heritage, skill, and dedication.
                        </p>
                        <div className="flex flex-wrap gap-4">
                            <Link to="/products" className="btn bg-white text-[var(--color-primary)] hover:bg-white/90">
                                Shop Now
                                <ArrowRight className="w-4 h-4" />
                            </Link>
                            <Link to="/categories" className="btn border border-white/30 hover:bg-white/10">
                                Explore Categories
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features */}
            <section className="py-12 bg-[var(--color-surface)] border-b border-[var(--color-border)]">
                <div className="container-app">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-[var(--color-primary)]/10 rounded-lg flex items-center justify-center">
                                <Truck className="w-6 h-6 text-[var(--color-primary)]" />
                            </div>
                            <div>
                                <h3 className="font-semibold">Free Shipping</h3>
                                <p className="text-sm text-[var(--color-text-muted)]">On orders above NPR 5,000</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-[var(--color-primary)]/10 rounded-lg flex items-center justify-center">
                                <Shield className="w-6 h-6 text-[var(--color-primary)]" />
                            </div>
                            <div>
                                <h3 className="font-semibold">Secure Payment</h3>
                                <p className="text-sm text-[var(--color-text-muted)]">eSewa, Khalti & COD</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-[var(--color-primary)]/10 rounded-lg flex items-center justify-center">
                                <Headphones className="w-6 h-6 text-[var(--color-primary)]" />
                            </div>
                            <div>
                                <h3 className="font-semibold">24/7 Support</h3>
                                <p className="text-sm text-[var(--color-text-muted)]">Always here to help</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Featured Products */}
            <section className="py-16">
                <div className="container-app">
                    <div className="flex justify-between items-center mb-8">
                        <div>
                            <h2 className="text-2xl md:text-3xl font-bold">Featured Products</h2>
                            <p className="text-[var(--color-text-muted)] mt-1">Our most popular handicrafts</p>
                        </div>
                        <Link to="/products?featured=true" className="btn btn-secondary text-sm">
                            View All
                            <ArrowRight className="w-4 h-4" />
                        </Link>
                    </div>

                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="w-8 h-8 animate-spin text-[var(--color-primary)]" />
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                            {featuredProducts.map((product) => (
                                <Link
                                    key={product._id}
                                    to={`/products/${product.slug}`}
                                    className="card group"
                                >
                                    <div className="relative aspect-square overflow-hidden">
                                        <img
                                            src={product.images[0]?.url || '/placeholder.jpg'}
                                            alt={product.name}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                        />
                                        {product.comparePrice > product.price && (
                                            <span className="absolute top-2 left-2 bg-[var(--color-error)] text-white text-xs px-2 py-1 rounded">
                                                -{calculateDiscount(product.comparePrice, product.price)}%
                                            </span>
                                        )}
                                    </div>
                                    <div className="p-4">
                                        <p className="text-xs text-[var(--color-text-muted)] mb-1">
                                            {product.category?.name}
                                        </p>
                                        <h3 className="font-medium mb-2 line-clamp-2 group-hover:text-[var(--color-primary)]">
                                            {product.name}
                                        </h3>
                                        <div className="flex items-center gap-2">
                                            <span className="font-bold text-[var(--color-primary)]">
                                                {formatPrice(product.price)}
                                            </span>
                                            {product.comparePrice > product.price && (
                                                <span className="text-sm text-[var(--color-text-muted)] line-through">
                                                    {formatPrice(product.comparePrice)}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
            </section>

            {/* Categories */}
            <section className="py-16 bg-[var(--color-bg)]">
                <div className="container-app">
                    <div className="text-center mb-12">
                        <h2 className="text-2xl md:text-3xl font-bold">Shop by Category</h2>
                        <p className="text-[var(--color-text-muted)] mt-2">
                            Find the perfect handicraft for every occasion
                        </p>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                        {categories.map((category) => (
                            <Link
                                key={category._id}
                                to={`/products?category=${category.slug}`}
                                className="group relative aspect-[4/3] rounded-xl overflow-hidden"
                            >
                                <img
                                    src={category.image?.url || '/placeholder-category.jpg'}
                                    alt={category.name}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                                <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                                    <h3 className="font-semibold text-lg">{category.name}</h3>
                                    {category.productCount && (
                                        <p className="text-sm text-white/70">{category.productCount} Products</p>
                                    )}
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-16 bg-[var(--color-accent)]">
                <div className="container-app text-center">
                    <h2 className="text-2xl md:text-3xl font-bold text-[var(--color-primary-dark)] mb-4">
                        Join Our Newsletter
                    </h2>
                    <p className="text-[var(--color-text)] mb-6 max-w-md mx-auto">
                        Subscribe to get exclusive offers, new arrivals, and handicraft stories from Nepal.
                    </p>
                    <form className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
                        <input
                            type="email"
                            placeholder="Enter your email"
                            className="input flex-1"
                        />
                        <button type="submit" className="btn btn-primary">
                            Subscribe
                        </button>
                    </form>
                </div>
            </section>
        </div>
    );
};

export default Home;
