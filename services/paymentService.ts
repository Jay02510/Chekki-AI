
import * as PortOne from '@portone/browser-sdk/v2';

/**
 * PortOne V2 Payment Service
 * 
 * IMPORTANT: Replace the placeholders below with your actual V2 credentials
 * from the PortOne Console (https://console.portone.io).
 */
const PORTONE_STORE_ID = "store-ba2c42ce-ccb4-4ee9-a177-f452808c5a97"; // PLACEHOLDER: Update this if your Store ID is different
const PORTONE_CHANNEL_KEY = "channel-key-e95db6d0-99b7-4a87-ab63-96c25cbccd11";

export interface PaymentResponse {
    success: boolean;
    txId?: string;
    message?: string;
}

export const requestProSubscription = async (userEmail: string, userName: string): Promise<PaymentResponse> => {
    try {
        const paymentId = `payment-${crypto.randomUUID()}`;

        const response = await PortOne.requestPayment({
            storeId: PORTONE_STORE_ID,
            channelKey: PORTONE_CHANNEL_KEY,
            paymentId: paymentId,
            orderName: "Chekki AI Standard Pro (30 Days)",
            totalAmount: 9900,
            currency: "CURRENCY_KRW",
            payMethod: "CARD",
            customer: {
                fullName: userName,
                email: userEmail,
            },
            // PortOne V2 window type (optional)
            windowType: {
                pc: "IFRAME",
                mobile: "IFRAME"
            }
        });

        if (response && response.code !== undefined) {
            // response.code being present indicates an error in V2
            return {
                success: false,
                message: response.message || "Payment failed"
            };
        }

        // If no code, it's successful (or redirection happened for mobile)
        return {
            success: true,
            txId: response?.paymentId || paymentId
        };
    } catch (error: any) {
        console.error("PortOne Payment Error:", error);
        return {
            success: false,
            message: error.message || "An unexpected error occurred during payment"
        };
    }
};
