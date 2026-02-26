import { NativePurchases, Product, Transaction } from '@capgo/native-purchases';
import { Capacitor } from '@capacitor/core';
import { SubscriptionRecord, SubscriptionStatus, SubscriptionPlatform } from '../types';
import { API_BASE_URL } from '../config';

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
    } catch { }
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
    try { localStorage.removeItem(CACHE_KEY); } catch { }
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
                const purchases = await NativePurchases.getPurchases();
                const hasActiveSub = purchases?.purchases?.length > 0;
                if (hasActiveSub) {
                    // Has a local StoreKit purchase — sync it to backend
                    const latest = purchases.purchases[purchases.purchases.length - 1];
                    // We'll validate the receipt server-side when the user purchases
                    // For session start, trust StoreKit locally
                    const localRecord: SubscriptionRecord = {
                        user_id: userId,
                        subscription_status: 'active',
                        subscription_platform: 'apple',
                        subscription_expiry_date: null,
                    };
                    cacheRecord(localRecord);
                    return localRecord;
                }
            } catch {
                // StoreKit unavailable (simulator, etc.) — fall through to backend
            }
        }

        // Fetch from backend
        try {
            const response = await fetch(`${BACKEND_BASE}/api/subscription/status`, {
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
        } catch {
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

    /**
     * Check if the user currently has premium access.
     * Uses cached status for performance — call initialize() first.
     */
    isPremium(): boolean {
        const cached = getCachedRecord();
        return cached?.subscription_status === 'active';
    },

    /**
     * Get the cached subscription record.
     */
    getStatus(): SubscriptionRecord | null {
        return getCachedRecord();
    },

    /**
     * Initiate a native purchase. Platform-aware.
     */
    async purchase(productId: string, userId: string, idToken: string): Promise<{ success: boolean; transaction?: Transaction; error?: any }> {
        const platform = Capacitor.getPlatform();

        if (platform === 'ios') {
            return this._purchaseApple(productId, userId, idToken);
        } else if (platform === 'android') {
            return { success: false, error: { message: 'Android billing coming soon.' } };
        } else {
            // Web: redirect to subscribe page
            window.location.href = '/subscribe';
            return { success: false, error: { message: 'Redirecting to subscribe page.' } };
        }
    },

    async _purchaseApple(productId: string, userId: string, idToken: string): Promise<{ success: boolean; transaction?: Transaction; error?: any }> {
        try {
            const transaction = await NativePurchases.purchaseProduct({ productIdentifier: productId });

            // Send receipt to backend for validation + Firestore update
            const receiptData = (transaction as any).receipt || '';
            if (receiptData) {
                try {
                    const validationResp = await fetch(`${BACKEND_BASE}/api/subscription/validate/apple`, {
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
                    // Backend validation failed — still treat as success locally (StoreKit confirmed)
                    cacheRecord({
                        user_id: userId,
                        subscription_status: 'active',
                        subscription_platform: 'apple',
                        subscription_expiry_date: null,
                    });
                }
            } else {
                // No receipt in transaction — still mark active from StoreKit confirmation
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

    /**
     * Restore purchases — iOS only.
     */
    async restorePurchases(userId: string): Promise<{ success: boolean; message?: string }> {
        const platform = Capacitor.getPlatform();
        if (platform !== 'ios') {
            return { success: false, message: 'Restore is only available on iOS.' };
        }

        try {
            await NativePurchases.restorePurchases();
            const { purchases } = await NativePurchases.getPurchases();
            const hasActiveSub = purchases && purchases.length > 0;

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

    /**
     * Fetch Apple products dynamically from StoreKit.
     */
    async fetchAppleProducts(): Promise<Product[]> {
        try {
            const { products } = await NativePurchases.getProducts({
                productIdentifiers: [AppleProducts.MONTHLY, AppleProducts.YEARLY],
            });
            return products;
        } catch (error) {
            console.error('[subscriptionService] Error fetching Apple products:', error);
            return [];
        }
    },

    /**
     * Clear cached subscription data (on logout).
     */
    clearCache,
};
