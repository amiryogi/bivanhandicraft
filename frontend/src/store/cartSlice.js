/**
 * Cart Slice
 * Redux slice for shopping cart state management
 */
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { cartAPI } from '../api';

// Async thunks
export const fetchCart = createAsyncThunk(
    'cart/fetchCart',
    async (_, { rejectWithValue }) => {
        try {
            const response = await cartAPI.getCart();
            return response.data.cart;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Failed to fetch cart');
        }
    }
);

export const addToCart = createAsyncThunk(
    'cart/addToCart',
    async ({ productId, quantity, variantId, variantDetails }, { rejectWithValue }) => {
        try {
            const response = await cartAPI.addToCart(productId, quantity, variantId, variantDetails);
            return response.data.cart;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Failed to add to cart');
        }
    }
);

export const updateCartItem = createAsyncThunk(
    'cart/updateCartItem',
    async ({ itemId, quantity }, { rejectWithValue }) => {
        try {
            const response = await cartAPI.updateCartItem(itemId, quantity);
            return response.data.cart;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Failed to update cart');
        }
    }
);

export const removeFromCart = createAsyncThunk(
    'cart/removeFromCart',
    async (itemId, { rejectWithValue }) => {
        try {
            const response = await cartAPI.removeFromCart(itemId);
            return response.data.cart;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Failed to remove from cart');
        }
    }
);

export const clearCart = createAsyncThunk(
    'cart/clearCart',
    async (_, { rejectWithValue }) => {
        try {
            const response = await cartAPI.clearCart();
            return response.data.cart;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Failed to clear cart');
        }
    }
);

const initialState = {
    items: [],
    subtotal: 0,
    itemCount: 0,
    loading: false,
    error: null,
};

const cartSlice = createSlice({
    name: 'cart',
    initialState,
    reducers: {
        resetCart: () => initialState,
        clearError: (state) => {
            state.error = null;
        },
    },
    extraReducers: (builder) => {
        builder
            // Fetch cart
            .addCase(fetchCart.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchCart.fulfilled, (state, action) => {
                state.loading = false;
                state.items = action.payload.items || [];
                state.subtotal = action.payload.subtotal || 0;
                state.itemCount = action.payload.itemCount || 0;
            })
            .addCase(fetchCart.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            // Add to cart
            .addCase(addToCart.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(addToCart.fulfilled, (state, action) => {
                state.loading = false;
                state.items = action.payload.items || [];
                state.subtotal = action.payload.subtotal || 0;
                state.itemCount = action.payload.itemCount || 0;
            })
            .addCase(addToCart.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            // Update cart item
            .addCase(updateCartItem.fulfilled, (state, action) => {
                state.items = action.payload.items || [];
                state.subtotal = action.payload.subtotal || 0;
                state.itemCount = action.payload.itemCount || 0;
            })
            // Remove from cart
            .addCase(removeFromCart.fulfilled, (state, action) => {
                state.items = action.payload.items || [];
                state.subtotal = action.payload.subtotal || 0;
                state.itemCount = action.payload.itemCount || 0;
            })
            // Clear cart
            .addCase(clearCart.fulfilled, () => initialState);
    },
});

export const { resetCart, clearError } = cartSlice.actions;

// Selectors
export const selectCart = (state) => state.cart;
export const selectCartItems = (state) => state.cart.items;
export const selectCartTotal = (state) => state.cart.subtotal;
export const selectCartCount = (state) => state.cart.itemCount;
export const selectCartLoading = (state) => state.cart.loading;

export default cartSlice.reducer;
