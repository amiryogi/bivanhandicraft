import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
// import { BASE_URL } from '../api/axios'; // Accessing BASE_URL if image paths are relative

// Note: Ensure image URLs are full URLs (http including IP/host) from backend
// If backend returns relative paths, we need to prepend BASE_URL properly.
// Assuming backend returns full URL or handled by a utility.

const ProductCard = ({ product, onPress }) => {
    // Helper to handle image source
    const imageSource = product.images && product.images.length > 0
        ? { uri: product.images[0].url || product.images[0] }
        : { uri: 'https://via.placeholder.com/150' };

    return (
        <TouchableOpacity style={styles.card} onPress={onPress}>
            <Image source={imageSource} style={styles.image} resizeMode="cover" />
            <View style={styles.details}>
                <Text style={styles.name} numberOfLines={2}>{product.name}</Text>
                <Text style={styles.price}>Rs. {product.price}</Text>
            </View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    card: {
        width: '48%',
        backgroundColor: '#fff',
        borderRadius: 16, // More rounded
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08, // Softer shadow
        shadowRadius: 8,
        elevation: 2,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#F0F0F0',
    },
    image: {
        width: '100%',
        height: 160, // Slightly taller
        backgroundColor: '#FAFAFA',
    },
    details: {
        padding: 12,
    },
    name: {
        fontSize: 14,
        fontWeight: '600',
        color: '#4A4A4A', // Soft dark gray
        marginBottom: 6,
        lineHeight: 20,
    },
    price: {
        fontSize: 15,
        color: '#FF9999', // Soft pink accent
        fontWeight: '700',
    },
});

export default ProductCard;
