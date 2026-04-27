/// <reference types="vite/client" />
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

const getBaseUrl = () => {
    if (typeof window !== 'undefined') {
        const hostname = window.location.hostname;
        // In local development or when served statically from same host
        if (hostname === 'localhost' || hostname === '127.0.0.1' || !hostname.includes('run.app')) {
            // Wait, if it runs as an APK, the hostname might be localhost. 
            // Better to use import.meta.env.VITE_APP_URL if defined
        }
    }
    
    // We prioritize the APP URL provided by the platform
    return import.meta.env.VITE_APP_URL || '';
};

export const API_URL = getBaseUrl();
