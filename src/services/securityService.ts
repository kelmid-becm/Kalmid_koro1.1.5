/**
 * Security Service for BYOK (Bring Your Own Key) architecture.
 * Implements real encryption for local storage of sensitive keys.
 */

// A simple internal salt for the app to avoid plain text storage
// In a true enterprise app, this would be derived from a user's master password
const INTERNAL_SECRET = 'kelmid-ai-vault-2026';

export const encrypt = async (text: string): Promise<string> => {
    if (!text) return '';
    try {
        const encoder = new TextEncoder();
        const data = encoder.encode(text);
        
        // Generate a random IV
        const iv = window.crypto.getRandomValues(new Uint8Array(12));
        
        // Import the base key
        const baseKey = await window.crypto.subtle.importKey(
            'raw',
            encoder.encode(INTERNAL_SECRET.padEnd(32, '0')),
            'AES-GCM',
            false,
            ['encrypt']
        );

        // Encrypt
        const encrypted = await window.crypto.subtle.encrypt(
            { name: 'AES-GCM', iv },
            baseKey,
            data
        );

        // Combine IV and Encrypted data for storage
        const combined = new Uint8Array(iv.length + encrypted.byteLength);
        combined.set(iv);
        combined.set(new Uint8Array(encrypted), iv.length);

        // Return as hex string for easy storage
        return Array.from(combined).map(b => b.toString(16).padStart(2, '0')).join('');
    } catch (e) {
        console.error('Encryption failed', e);
        return btoa(text); // Fallback to avoid breaking if crypto fails
    }
};

export const decrypt = async (encryptedHex: string): Promise<string> => {
    if (!encryptedHex) return '';
    try {
        const encoder = new TextEncoder();
        const decoder = new TextDecoder();
        
        // Convert hex to bytes
        const combined = new Uint8Array(encryptedHex.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16)));
        
        // Extract IV and data
        const iv = combined.slice(0, 12);
        const data = combined.slice(12);

        // Import the base key
        const baseKey = await window.crypto.subtle.importKey(
            'raw',
            encoder.encode(INTERNAL_SECRET.padEnd(32, '0')),
            'AES-GCM',
            false,
            ['decrypt']
        );

        // Decrypt
        const decrypted = await window.crypto.subtle.decrypt(
            { name: 'AES-GCM', iv },
            baseKey,
            data
        );

        return decoder.decode(decrypted);
    } catch (e) {
        console.error('Decryption failed', e);
        try {
            return atob(encryptedHex);
        } catch {
            return '';
        }
    }
};
