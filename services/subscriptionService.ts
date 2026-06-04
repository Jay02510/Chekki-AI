import { Capacitor } from '@capacitor/core';
import { SubscriptionRecord, SubscriptionStatus, SubscriptionPlatform } from '../types';
import { API_BASE_URL } from '../config';
import { revenueCatService } from './revenueCatService';

// ─── Constants ──────────────────────────────────────────────────────────────
export const AppleProducts = {
    MONTHLY: 'com.chekkiai.app.monthly',
    YEARLY: 'com.chekkiai.app.yearly',
};

export const GoogleProducts = {
    MONTHLY: 'chekki_premium:monthly',
    YEARLY: 'chekki_premium:annually',
};

const CACHE_KEY = 'chekki_subscription_cache';
const BACKEND_BASE = API_BASE_URL; // Uses centralized config

// ─── Local Cache Helpers ─────────────────────────────────────────────────────
function cacheRecord(record: SubscriptionRecord) {
    try {
        localStorage.setItem(CACHE_KEY, JSON.stringify(record));
    } catch (e) { console.error("Cache write error", e); }
}

function getCachedRecord(): SubscriptionRecord | null {
    try {
        const raw = localStorage.getItem(CACHE_KEY);
        return raw ? JSON.parse(raw) : null;
    } catch {
        return null;
    }
}

function clearCache() {
    try { localStorage.removeItem(CACHE_KEY); } catch (e) { console.error(e); }
}

// ─── Subscription Service ────────────────────────────────────────────────────
export const subscriptionService = {
    /**
     * Called on every app launch + login.
     * Fetches the latest status from the backend and caches it locally.
     */
    async initialize(userId: string, idToken: string): Promise<SubscriptionRecord> {
        const platform = Capacitor.getPlatform();

        // On iOS or Android: check RevenueCat entitlements first for real-time accuracy
        if (platform === 'ios' || platform === 'android') {
            try {
                const info = await revenueCatService.getCustomerInfo();
                // Depending on SDK version, info might be a wrapper or the object itself
                const customerInfo = (info as any).customerInfo || info;
                const hasActiveSub = customerInfo?.entitlements?.active && Object.keys(customerInfo.entitlements.active).length > 0;
                
                if (hasActiveSub) {
                    const localRecord: SubscriptionRecord = {
                        user_id: userId,
                        subscription_status: 'active',
                        subscription_platform: platform === 'ios' ? 'apple' : 'android',
                        subscription_expiry_date: customerInfo.entitlements.active[Object.keys(customerInfo.entitlements.active)[0]].expirationDate,
                    };
                    cacheRecord(localRecord);
                    return localRecord;
                }
            } catch (e) { 
                // console.warn("[SubscriptionService] RevenueCat check failed, falling back to backend:", e);
            }
        }

        // Fetch from backend
        try {
            const response = await fetch(`${BACKEND_BASE}/api/subscription-status`, {
                headers: { Authorization: `Bearer ${idToken}` },
            });
            if (response.ok) {
                const data = await response.json();
                const record: SubscriptionRecord = {
                    user_id: userId,
                    subscription_status: data.subscription_status as SubscriptionStatus,
                    subscription_platform: data.subscription_platform as SubscriptionPlatform,
                    subscription_expiry_date: data.subscription_expiry_date,
                };
                cacheRecord(record);
                return record;
            }
        } catch (e) { // console.error("Net err", e);
            // Network failure — fall back to cache
        }

        // Fallback: use cached record
        const cached = getCachedRecord();
        if (cached) return cached;

        // Default: no subscription
        const none: SubscriptionRecord = {
            user_id: userId,
            subscription_status: 'none',
            subscription_platform: 'none',
            subscription_expiry_date: null,
        };
        return none;
    },

    isPremium(): boolean {
        const cached = getCachedRecord();
        return cached?.subscription_status === 'active';
    },

    getStatus(): SubscriptionRecord | null {
        return getCachedRecord();
    },

    async purchase(packageOrProduct: any, userId: string, idToken: string): Promise<{ success: boolean; transaction?: any; error?: any; userCancelled?: boolean }> {
        const platform = Capacitor.getPlatform();

        if (platform === 'ios') {
            return this._purchaseApple(packageOrProduct, userId, idToken);
        } else if (platform === 'android') {
            return this._purchaseAndroid(packageOrProduct, userId, idToken);
        } else {
            window.location.href = '/subscribe';
            return { success: false, error: { message: 'Redirecting to subscribe page.' } };
        }
    },

    async _purchaseApple(packageOrProduct: any, userId: string, idToken: string): Promise<{ success: boolean; transaction?: any; error?: any; userCancelled?: boolean }> {
        try {
            let targetToPurchase = packageOrProduct;
            if (typeof packageOrProduct === 'string') {
                const fetchedProducts = await revenueCatService.getProducts([packageOrProduct]);
                if (fetchedProducts && fetchedProducts.length > 0) {
                    targetToPurchase = fetchedProducts[0];
                } else {
                    throw new Error(`Product ${packageOrProduct} not found in RevenueCat.`);
                }
            }

            // Check if it's a package or a raw product (packages have a 'product' field)
            const result = targetToPurchase.product
                ? await revenueCatService.purchasePackage(targetToPurchase)
                : await revenueCatService.purchaseProduct(targetToPurchase);

            const transaction = result.transaction;

            const receiptData = (transaction as any).receipt || '';
            if (receiptData) {
                try {
                    const validationResp = await fetch(`${BACKEND_BASE}/api/subscription-validate-apple`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${idToken}`
                        },
                        body: JSON.stringify({ receipt_data: receiptData, user_id: userId }),
                    });
                    const validation = await validationResp.json();
                    if (validation.success) {
                        cacheRecord({
                            user_id: userId,
                            subscription_status: 'active',
                            subscription_platform: 'apple',
                            subscription_expiry_date: validation.subscription_expiry_date,
                        });
                    }
                } catch {
                    cacheRecord({
                        user_id: userId,
                        subscription_status: 'active',
                        subscription_platform: 'apple',
                        subscription_expiry_date: null,
                    });
                }
            } else {
                cacheRecord({
                    user_id: userId,
                    subscription_status: 'active',
                    subscription_platform: 'apple',
                    subscription_expiry_date: null,
                });
            }

            // Trigger manual backend sync in the background to align DB immediately
            fetch(`${BACKEND_BASE}/api/subscription-status`, {
                headers: { Authorization: `Bearer ${idToken}` },
            }).catch(err => {/* console.error('[subscriptionService] Backend status sync error:', err) */});

            return { success: true, transaction };
        } catch (error: any) {
            // console.error('[subscriptionService] Apple purchase error:', error);
            
            // Enhance the message with more detail if available
            let enhancedMessage = error.message;
            if (error.underlyingErrorMessage) {
                enhancedMessage = `${error.message} (${error.underlyingErrorMessage})`;
            } else if (error.readableErrorCode) {
                enhancedMessage = `${error.message} (Code: ${error.readableErrorCode})`;
            }

            return { 
                success: false, 
                error: {
                    ...error,
                    message: enhancedMessage
                }, 
                userCancelled: error.userCancelled 
            };
        }
    },

    async restorePurchases(userId: string): Promise<{ success: boolean; message?: string }> {
        const platform = Capacitor.getPlatform();
        if (platform !== 'ios' && platform !== 'android') {
            return { success: false, message: 'Restore is only available on mobile devices.' };
        }

        try {
            const { customerInfo } = await revenueCatService.restorePurchases();
            const hasActiveSub = Object.keys(customerInfo.entitlements.active).length > 0;

            if (hasActiveSub) {
                cacheRecord({
                    user_id: userId,
                    subscription_status: 'active',
                    subscription_platform: platform === 'ios' ? 'apple' : 'android',
                    subscription_expiry_date: customerInfo.entitlements.active[Object.keys(customerInfo.entitlements.active)[0]].expirationDate,
                });
                return { success: true };
            }

            return { success: false, message: 'No active subscriptions found to restore.' };
        } catch (error: any) {
            // console.error('[subscriptionService] Restore error:', error);
            
            // Enhance the message with more detail if available
            let enhancedMessage = error.message;
            if (error.underlyingErrorMessage) {
                enhancedMessage = `${error.message} (${error.underlyingErrorMessage})`;
            } else if (error.readableErrorCode) {
                enhancedMessage = `${error.message} (Code: ${error.readableErrorCode})`;
            }

            return { success: false, message: enhancedMessage || 'Failed to restore purchases.' };
        }
    },

    async _purchaseAndroid(packageOrProduct: any, userId: string, idToken: string): Promise<{ success: boolean; transaction?: any; error?: any; userCancelled?: boolean }> {
        try {
            let targetToPurchase = packageOrProduct;
            if (typeof packageOrProduct === 'string') {
                const fetchedProducts = await revenueCatService.getProducts([packageOrProduct]);
                if (fetchedProducts && fetchedProducts.length > 0) {
                    targetToPurchase = fetchedProducts[0];
                } else {
                    throw new Error(`Product ${packageOrProduct} not found in RevenueCat.`);
                }
            }

            // Check if it's a package or a raw product (packages have a 'product' field)
            const result = targetToPurchase.product
                ? await revenueCatService.purchasePackage(targetToPurchase)
                : await revenueCatService.purchaseProduct(targetToPurchase);

            // Extract expiry date from CustomerInfo if available
            const customerInfo = result.customerInfo;
            const activeEntitlement = customerInfo?.entitlements?.active
                ? Object.values(customerInfo.entitlements.active)[0]
                : null;

            cacheRecord({
                user_id: userId,
                subscription_status: 'active',
                subscription_platform: 'android',
                subscription_expiry_date: (activeEntitlement as any)?.expirationDate || null,
            });

            // Trigger manual backend sync in the background to align DB immediately
            fetch(`${BACKEND_BASE}/api/subscription-status`, {
                headers: { Authorization: `Bearer ${idToken}` },
            }).catch(err => {/* console.error('[subscriptionService] Backend status sync error:', err) */});

            return { success: true, transaction: result.transaction };
        } catch (error: any) {
            /*
            console.error('[subscriptionService] Android purchase error details:', {
                message: error.message,
                code: error.code,
                underlyingErrorMessage: error.underlyingErrorMessage,
                readableErrorCode: error.readableErrorCode,
                userCancelled: error.userCancelled
            });
            */

            // Surface more detail for StoreProblemError to help diagnose testing track issues
            const enhancedMessage = error.code === '2' && error.underlyingErrorMessage
                ? `${error.message} (${error.underlyingErrorMessage})`
                : error.message;

            return {
                success: false,
                error: { ...error, message: enhancedMessage },
                userCancelled: error.userCancelled
            };
        }
    },

    async fetchAppleProducts(): Promise<any[]> {
        try {
            const offerings = await revenueCatService.getOfferings();
            if (offerings.current) {
                return offerings.current.availablePackages;
            }
            // Fallback to direct products if no offerings configured
            const products = await revenueCatService.getProducts([AppleProducts.MONTHLY, AppleProducts.YEARLY]);
            return products;
        } catch (error) {
            // console.error('[subscriptionService] Error fetching Apple products:', error);
            return [];
        }
    },

    async fetchAndroidProducts(): Promise<any[]> {
        try {
            // console.log('[subscriptionService] Fetching Android products...');
            await revenueCatService.initialize(); // Ensure RC is ready
            const offerings = await revenueCatService.getOfferings();
            // console.log('[subscriptionService] Offerings received:', offerings);

            if (offerings.current && offerings.current.availablePackages.length > 0) {
                return offerings.current.availablePackages;
            }

            // Fallback to direct products if no offerings configured
            // console.warn('[subscriptionService] No current offerings found, fetching direct products');
            const products = await revenueCatService.getProducts([GoogleProducts.MONTHLY, GoogleProducts.YEARLY]);

            if (!products || products.length === 0) {
                // console.error('[subscriptionService] No products found. Check Play Console and RevenueCat configuration.');
            }
            return products;
        } catch (error: any) {
            /*
            console.error('[subscriptionService] Error fetching Android products:', {
                message: error.message,
                code: error.code,
                underlyingErrorMessage: error.underlyingErrorMessage,
                readableErrorCode: error.readableErrorCode
            });
            */
            return [];
        }
    },

    clearCache,
};
