import { Capacitor } from '@capacitor/core';
import { SubscriptionRecord, SubscriptionStatus, SubscriptionPlatform } from '../types';
import { API_BASE_URL } from '../config';
import { revenueCatService } from './revenueCatService';

// ─── Constants ──────────────────────────────────────────────────────────────
export const AppleProducts = {
    MONTHLY: 'com.chekkiai.app.monthly',
    YEARLY: 'com.chekkiai.app.yearly',
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

        // On iOS: also check StoreKit directly for real-time accuracy
        if (platform === 'ios') {
            try {
                const customerInfo = await revenueCatService.getCustomerInfo();
                const hasActiveSub = Object.keys(customerInfo.customerInfo.entitlements.active).length > 0;
                if (hasActiveSub) {
                    const localRecord: SubscriptionRecord = {
                        user_id: userId,
                        subscription_status: 'active',
                        subscription_platform: 'apple',
                        subscription_expiry_date: null,
                    };
                    cacheRecord(localRecord);
                    return localRecord;
                }
            } catch (e) { console.error("StoreKit err", e);
                // StoreKit unavailable (simulator, etc.) — fall through to backend
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
        } catch (e) { console.error("Net err", e);
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

    async purchase(product: any, userId: string, idToken: string): Promise<{ success: boolean; transaction?: any; error?: any }> {
        const platform = Capacitor.getPlatform();

        if (platform === 'ios') {
            return this._purchaseApple(product, userId, idToken);
        } else if (platform === 'android') {
            return this._purchaseAndroid(product, userId, idToken);
        } else {
            window.location.href = '/subscribe';
            return { success: false, error: { message: 'Redirecting to subscribe page.' } };
        }
    },

    async _purchaseApple(product: any, userId: string, idToken: string): Promise<{ success: boolean; transaction?: any; error?: any }> {
        try {
            const result = await revenueCatService.purchaseProduct(product);
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

            return { success: true, transaction };
        } catch (error: any) {
            console.error('[subscriptionService] Apple purchase error:', error);
            return { success: false, error };
        }
    },

    async restorePurchases(userId: string): Promise<{ success: boolean; message?: string }> {
        const platform = Capacitor.getPlatform();
        if (platform !== 'ios') {
            return { success: false, message: 'Restore is only available on iOS.' };
        }

        try {
            const { customerInfo } = await revenueCatService.restorePurchases();
            const hasActiveSub = Object.keys(customerInfo.entitlements.active).length > 0;

            if (hasActiveSub) {
                cacheRecord({
                    user_id: userId,
                    subscription_status: 'active',
                    subscription_platform: 'apple',
                    subscription_expiry_date: null,
                });
                return { success: true };
            }

            return { success: false, message: 'No active subscriptions found to restore.' };
        } catch (error: any) {
            console.error('[subscriptionService] Restore error:', error);
            return { success: false, message: error.message || 'Failed to restore purchases.' };
        }
    },

    async _purchaseAndroid(product: any, userId: string, idToken: string): Promise<{ success: boolean; transaction?: any; error?: any }> {
        try {
            const result = await revenueCatService.purchaseProduct(product);
            return { success: true, transaction: result.transaction };
        } catch (error: any) {
            console.error('[subscriptionService] Android purchase error:', error);
            return { success: false, error };
        }
    },

    async fetchAppleProducts(): Promise<any[]> {
        try {
            const products = await revenueCatService.getProducts([AppleProducts.MONTHLY, AppleProducts.YEARLY]);
            return products;
        } catch (error) {
            console.error('[subscriptionService] Error fetching Apple products:', error);
            return [];
        }
    },

    clearCache,
};
