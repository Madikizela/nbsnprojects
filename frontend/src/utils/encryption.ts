import CryptoJS from 'crypto-js';

// This should match the backend encryption key
const ENCRYPTION_KEY = 'GQbHycf1uFOsWncLBQokFZD2yKJHlwl1MmxvxXkNx2I=';

export const encryptData = (data: any): string => {
  try {
    const jsonString = JSON.stringify(data);
    
    // Convert base64 key to WordArray for CryptoJS
    const key = CryptoJS.enc.Base64.parse(ENCRYPTION_KEY);
    
    // Generate random IV (16 bytes for AES)
    const iv = CryptoJS.lib.WordArray.random(16);
    
    // Encrypt with AES-CBC
    const encrypted = CryptoJS.AES.encrypt(jsonString, key, {
      iv: iv,
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7
    });
    
    // Combine IV + encrypted data and convert to base64
    const combined = iv.concat(encrypted.ciphertext);
    return CryptoJS.enc.Base64.stringify(combined);
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error('Failed to encrypt data');
  }
};

export const decryptData = (encryptedData: string): any => {
  try {
    // Convert base64 key to WordArray for CryptoJS
    const key = CryptoJS.enc.Base64.parse(ENCRYPTION_KEY);
    
    // Parse the base64 encrypted data
    const combined = CryptoJS.enc.Base64.parse(encryptedData);
    
    // Extract IV (first 16 bytes) and ciphertext
    const iv = CryptoJS.lib.WordArray.create(combined.words.slice(0, 4));
    const ciphertext = CryptoJS.lib.WordArray.create(combined.words.slice(4));
    
    // Decrypt
    const decrypted = CryptoJS.AES.decrypt(
      CryptoJS.lib.CipherParams.create({ ciphertext: ciphertext }),
      key,
      {
        iv: iv,
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7
      }
    );
    
    const decryptedString = decrypted.toString(CryptoJS.enc.Utf8);
    return JSON.parse(decryptedString);
  } catch (error) {
    console.error('Decryption error:', error);
    throw new Error('Failed to decrypt data');
  }
};

export const generateRandomString = (length: number): string => {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
};