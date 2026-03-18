import { Purchases, LOG_LEVEL } from '@revenuecat/purchases-capacitor';
import { Capacitor } from '@capacitor/core';

// ─── RevenueCat Configuration ───────────────────────────────────────────────

/**
 * [IMPORTANT] RevenueCat API Keys
 * Since these are public-facing client keys, they can be stored in code or config.
 */
const RC_CONFIG = {
    apple: 'appl_RujbhRRnyckJEVHpaebeBxtSoTw', // Official Public SDK Key
    google: 'goog_placeholder_key', 
};

export const revenueCatService = {
    /**
     * Initializes the RevenueCat SDK.
     * Should be called as early as possible (e.g., in App.tsx).
     */
    async initialize(userId?: string) {
        const platform = Capacitor.getPlatform();
        let apiKey = '';

        if (platform === 'ios') {
            apiKey = RC_CONFIG.apple;
        } else if (platform === 'android') {
            apiKey = RC_CONFIG.google;
        }

        if (!apiKey || apiKey.includes('placeholder')) {
            console.warn('[RevenueCat] Initialization skipped: Missing or placeholder API key.');
            return;
        }

        try {
            await Purchases.setLogLevel({ level: LOG_LEVEL.DEBUG });
            await Purchases.configure({ 
                apiKey,
                appUserID: userId,
            });
            console.log('[RevenueCat] Successfully configured for platform:', platform);
        } catch (error) {
            console.error('[RevenueCat] Configuration error:', error);
        }
    },

    /**
     * Identifies a user in RevenueCat (e.g., after login).
     */
    async identify(userId: string) {
        try {
            await Purchases.logIn({ appUserID: userId });
            console.log('[RevenueCat] Identified user:', userId);
        } catch (error) {
            console.error('[RevenueCat] Login error:', error);
        }
    },

    /**
     * Resets the RevenueCat user (e.g., after logout).
     */
    async logout() {
        try {
            await Purchases.logOut();
            console.log('[RevenueCat] Logged out successfully.');
        } catch (error) {
            console.error('[RevenueCat] Logout error:', error);
        }
    },

    /**
     * Gets available products.
     */
    async getProducts(productIdentifiers: string[]) {
        try {
            const { products } = await Purchases.getProducts({ productIdentifiers });
            return products;
        } catch (error) {
            console.error('[RevenueCat] GetProducts error:', error);
            throw error;
        }
    },

    /**
     * Purchases a product.
     */
    async purchaseProduct(product: any) {
        try {
            const result = await Purchases.purchaseStoreProduct({ product });
            return result;
        } catch (error) {
            console.error('[RevenueCat] Purchase error:', error);
            throw error;
        }
    },

    /**
     * Restores purchases.
     */
    async restorePurchases() {
        try {
            const result = await Purchases.restorePurchases();
            return result;
        } catch (error) {
            console.error('[RevenueCat] Restore error:', error);
            throw error;
        }
    },

    /**
     * Gets current customer info.
     */
    async getCustomerInfo() {
        try {
            const info = await Purchases.getCustomerInfo();
            return info;
        } catch (error) {
            console.error('[RevenueCat] GetCustomerInfo error:', error);
            throw error;
        }
    }
};
