import crypto from "crypto";

const INTERNAL_SECRET = 'kelmid-ai-vault-2026';
const keyBuffer = Buffer.from(INTERNAL_SECRET.padEnd(32, '0'), 'utf8');

// Mimic what the browser does, but in Node
const text = "my-secret-key-123";
const iv = crypto.randomBytes(12);
const cipher = crypto.createCipheriv('aes-256-gcm', keyBuffer, iv);
let encrypted = cipher.update(text, 'utf8');
encrypted = Buffer.concat([encrypted, cipher.final()]);
const authTag = cipher.getAuthTag();

// Combined as done in browser
const combined = Buffer.concat([iv, encrypted, authTag]);
const encryptedHex = combined.toString('hex');

console.log("Encrypted Hex:", encryptedHex);

// Decrypt exactly as server.ts does
const combined2 = Buffer.from(encryptedHex, 'hex');
const iv2 = combined2.slice(0, 12);
const authTag2 = combined2.slice(combined2.length - 16);
const encrypted2 = combined2.slice(12, combined2.length - 16);

const decipher = crypto.createDecipheriv('aes-256-gcm', keyBuffer, iv2);
decipher.setAuthTag(authTag2);

let decrypted = decipher.update(encrypted2, undefined, 'utf8');
decrypted += decipher.final('utf8');

console.log("Decrypted Text:", decrypted);
