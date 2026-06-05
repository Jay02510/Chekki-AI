import { Purchases, LOG_LEVEL } from '@revenuecat/purchases-capacitor';
import { Capacitor } from '@capacitor/core';

// ─── RevenueCat Configuration ───────────────────────────────────────────────

/**
 * [IMPORTANT] RevenueCat API Keys
 * Since these are public-facing client keys, they can be stored in code or config.
 */
const RC_CONFIG = {
  apple: 'appl_RujbhRRnyckJEVHpaebeBxtSoTw', // Official Public SDK Key
  google: 'goog_wMcgsVNAtqtCDqtEQqzkFxlcofv', // Official Public SDK Key (Play Store)
};

let initPromise: Promise<void> | null = null;

export const revenueCatService = {
  /**
   * Initializes the RevenueCat SDK.
   * Should be called as early as possible (e.g., in App.tsx).
   */
  async initialize(userId?: string) {
    if (Capacitor.getPlatform() === 'web') return;
    if (initPromise) return initPromise;

    initPromise = (async () => {
      const platform = Capacitor.getPlatform();
      let apiKey = '';

      if (platform === 'ios') {
        apiKey = RC_CONFIG.apple;
      } else if (platform === 'android') {
        apiKey = RC_CONFIG.google;
      }

      if (!apiKey || apiKey.includes('placeholder')) {
        // console.warn(`[RevenueCat] Initialization skipped for ${platform}: API key is missing or placeholder.`);
        return;
      }

      try {
        // Check if system clock is wildly off (common cause for Code 2)
        const currentYear = new Date().getFullYear();
        if (currentYear < 2026 || currentYear > 2035) {
          // console.error('[RevenueCat] CRITICAL: System clock is set to ' + currentYear + '. Google Play Billing will FAIL.');
        }

        // Enable SDK logs to see exact bridge exceptions
        await Purchases.setLogLevel({ level: LOG_LEVEL.DEBUG });

        const configureParams: any = {
          apiKey,
        };
        if (userId && userId.trim() !== '') {
          configureParams.appUserID = userId;
        }

        await Purchases.configure(configureParams);

        // [NOTE] Calling restorePurchases() on startup is a RevenueCat anti-pattern.
        // It can trigger login prompts or throw errors (like Code 2) if Google Play Services
        // are not ready or if the test account is not set up yet. We rely on the SDK's automatic background sync.
        /*
                if (platform === 'android') {
                    try {
                        await Purchases.restorePurchases();
                        console.log('[RevenueCat] Initial sync (restore) completed on Android');
                    } catch (e) {
                        console.warn('[RevenueCat] Background sync failed:', e);
                    }
                }
                */

        // console.log('[RevenueCat] Successfully configured for platform:', platform);
      } catch (error) {
        console.error('[RevenueCat] Configuration error:', error);
        initPromise = null; // Allow retry on failure
      }
    })();

    return initPromise;
  },

  /**
   * Identifies a user in RevenueCat (e.g., after login).
   */
  async identify(userId: string) {
    try {
      await this.initialize();
      if (initPromise) await initPromise;
      await Purchases.logIn({ appUserID: userId });
      // console.log('[RevenueCat] Identified user:', userId);
    } catch (error) {
      console.error('[RevenueCat] Login error:', error);
    }
  },

  /**
   * Resets the RevenueCat user (e.g., after logout).
   */
  async logout() {
    try {
      await this.initialize();
      if (initPromise) await initPromise;
      await Purchases.logOut();
      // console.log('[RevenueCat] Logged out successfully.');
    } catch (error) {
      console.error('[RevenueCat] Logout error:', error);
    }
  },

  /**
   * Gets available offerings.
   */
  async getOfferings() {
    try {
      await this.initialize();
      if (initPromise) await initPromise;
      const offerings = await Purchases.getOfferings();
      return offerings;
    } catch (error) {
      console.error('[RevenueCat] GetOfferings error:', error);
      throw error;
    }
  },

  /**
   * Gets available products.
   */
  async getProducts(productIdentifiers: string[]) {
    try {
      await this.initialize();
      if (initPromise) await initPromise;
      const { products } = await Purchases.getProducts({ productIdentifiers });
      return products;
    } catch (error) {
      console.error('[RevenueCat] GetProducts error:', error);
      throw error;
    }
  },

  /**
   * Purchases a package.
   */
  async purchasePackage(pack: any) {
    try {
      await this.initialize();
      if (initPromise) await initPromise;

      // Debug log to check if the offer metadata is actually present
      const subscriptionOptions = (pack.product as any).subscriptionOptions;
      /*
            console.log('[RevenueCat] Package Details:', {
                identifier: pack.identifier,
                productID: pack.product?.identifier,
                hasSubscriptionOptions: !!subscriptionOptions,
                optionsCount: subscriptionOptions?.length || 0,
                presentedOffer: pack.product?.presentedOfferingContext?.offeringIdentifier
            });
            */

      const result = await Purchases.purchasePackage({ aPackage: pack });
      return result;
    } catch (error: any) {
      console.error('[RevenueCat] Purchase package error details:', {
        code: error.code,
        message: error.message,
        readableErrorCode: error.readableErrorCode,
        underlyingErrorMessage: error.underlyingErrorMessage,
        userCancelled: error.userCancelled,
      });
      throw error;
    }
  },

  /**
   * Purchases a product.
   */
  async purchaseProduct(product: any) {
    try {
      await this.initialize();
      if (initPromise) await initPromise;
      // console.log('[RevenueCat] Initiating purchase for product:', product.identifier);
      const result = await Purchases.purchaseStoreProduct({ product });
      return result;
    } catch (error: any) {
      console.error('[RevenueCat] Purchase error details:', {
        code: error.code,
        message: error.message,
        readableErrorCode: error.readableErrorCode,
        underlyingErrorMessage: error.underlyingErrorMessage,
        userCancelled: error.userCancelled,
      });
      throw error;
    }
  },

  /**
   * Restores purchases.
   */
  async restorePurchases() {
    try {
      await this.initialize();
      if (initPromise) await initPromise;
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
      await this.initialize();
      if (initPromise) await initPromise;
      const info = await Purchases.getCustomerInfo();
      return info;
    } catch (error) {
      console.error('[RevenueCat] GetCustomerInfo error:', error);
      throw error;
    }
  },
};
