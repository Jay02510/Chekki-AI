import { Capacitor } from '@capacitor/core';

/**
 * Centralized API Configuration
 */

// If you are testing on a physical device or simulator and want to connect to your local machine:
// 1. Find your local IP (e.g., 192.168.1.5)
// 2. Change DEVELOPER_LOCAL_IP to that value
// 3. Set USE_LOCAL_BACKEND to true
const DEVELOPER_LOCAL_IP = 'localhost';
const USE_LOCAL_BACKEND = false;

// If you want to bypass the network entirely and use mock data (great for screenshots):
export const MOCK_MODE = false;
export const MOCK_DELAY = 1500;
export const SCREENSHOT_MODE = false;

const getApiBaseUrl = () => {
    const platform = Capacitor.getPlatform();

    if (platform === 'web') {
        return ''; // Relative URLs work fine on web (Vercel/Localhost)
    }

    if (USE_LOCAL_BACKEND) {
        return `http://${DEVELOPER_LOCAL_IP}:3000`;
    }

    // Default production URL for native platforms
    return 'https://chekki-ai.vercel.app';
};

export const API_BASE_URL = getApiBaseUrl();
export const PUBLIC_APP_URL = 'https://chekki-ai.vercel.app';

console.log(`[Config] API Base URL: ${API_BASE_URL || '(relative)'}`);
