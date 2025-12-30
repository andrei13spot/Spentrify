const crypto = require('crypto');

// basic AES-256-GCM helper
// this file is kept small so it is easy to study

// key must come from .env so it is not hard-coded here
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;

if (!ENCRYPTION_KEY) {
  throw new Error('ENCRYPTION_KEY environment variable is not set');
}

// we expect the key to be stored as hex text in .env
// 32 bytes = 256 bits, which is what AES-256 needs
let keyBuffer;
try {
  keyBuffer = Buffer.from(ENCRYPTION_KEY, 'hex');
  if (keyBuffer.length !== 32) {
    throw new Error('ENCRYPTION_KEY must be exactly 32 bytes (64 hex characters)');
  }
} catch (error) {
  throw new Error(`Invalid ENCRYPTION_KEY format: ${error.message}`);
}

const AUTH_TAG_LENGTH = 16;
const IV_LENGTH = 12;

function encrypt(data) {
  if (!data) {
    throw new Error('Data to encrypt cannot be empty');
  }

  try {
    // random IV so same value encrypted twice will look different
    const iv = crypto.randomBytes(IV_LENGTH);

    const cipher = crypto.createCipheriv('aes-256-gcm', keyBuffer, iv);

    let encrypted = cipher.update(data, 'utf8', 'base64');
    encrypted += cipher.final('base64');

    const authTag = cipher.getAuthTag();

    // we just join them with colons, this is simple but clear
    const result = `${iv.toString('base64')}:${encrypted}:${authTag.toString('base64')}`;

    return result;
  } catch (error) {
    throw new Error(`Encryption failed: ${error.message}`);
  }
}

function decrypt(encryptedData) {
  if (!encryptedData) {
    throw new Error('Encrypted data cannot be empty');
  }

  try {
    const parts = encryptedData.split(':');
    if (parts.length !== 3) {
      throw new Error('Invalid encrypted data format');
    }
    
    const [ivBase64, encrypted, authTagBase64] = parts;

    const iv = Buffer.from(ivBase64, 'base64');
    const authTag = Buffer.from(authTagBase64, 'base64');

    if (iv.length !== IV_LENGTH) {
      throw new Error('Invalid IV length');
    }

    if (authTag.length !== AUTH_TAG_LENGTH) {
      throw new Error('Invalid authentication tag length');
    }

    const decipher = crypto.createDecipheriv('aes-256-gcm', keyBuffer, iv);

    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encrypted, 'base64', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  } catch (error) {
    if (error.message.includes('Unsupported state') || error.message.includes('bad decrypt')) {
      throw new Error('Decryption failed: Data may be corrupted or tampered');
    }
    throw new Error(`Decryption failed: ${error.message}`);
  }
}

module.exports = {
  encrypt,
  decrypt
};

