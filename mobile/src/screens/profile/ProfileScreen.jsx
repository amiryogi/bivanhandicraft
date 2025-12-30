import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../../store/authSlice';

const ProfileScreen = ({ navigation }) => {
    const dispatch = useDispatch();
    const { isAuthenticated, user } = useSelector((state) => state.auth);

    const handleLogout = () => {
        dispatch(logout());
    };

    if (!isAuthenticated) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.content}>
                    <Text style={styles.text}>Connect with Nevan</Text>
                    <Text style={styles.subText}>Sign in to view your orders, wishlist and more.</Text>
                    <TouchableOpacity 
                        style={styles.loginButton} 
                        onPress={() => navigation.navigate('Auth', { screen: 'Login' })}
                    >
                        <Text style={styles.loginText}>Sign In / Register</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.content}>
                <Text style={styles.text}>Welcome, {user?.name || 'User'}</Text>
                <Text style={styles.email}>{user?.email}</Text>
                <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                    <Text style={styles.logoutText}>Logout</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    text: {
        fontSize: 22,
        fontWeight: 'bold',
        marginBottom: 10,
    },
    subText: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
        marginBottom: 30,
    },
    email: {
        fontSize: 16,
        color: '#666',
        marginBottom: 30,
    },
    loginButton: {
        padding: 16,
        backgroundColor: '#000',
        borderRadius: 8,
        width: '100%',
        alignItems: 'center',
    },
    loginText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
    },
    logoutButton: {
        padding: 12,
        backgroundColor: '#f44336',
        borderRadius: 8,
        width: 120,
        alignItems: 'center',
    },
    logoutText: {
        color: '#fff',
        fontWeight: 'bold',
    },
});

export default ProfileScreen;
