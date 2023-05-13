import { configureStore } from '@reduxjs/toolkit';
import productsReducer from '../features/ProductView/productsSlice';
export const store = configureStore({
    reducer: {
        products: productsReducer,
    },
    middleware: getDefaultMiddleware =>
        getDefaultMiddleware({
            serializableCheck: false,
    }),
});
