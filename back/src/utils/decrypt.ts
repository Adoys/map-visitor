import { createDecipheriv, createHash } from 'crypto';

const ALGORITHM = 'aes-256-cbc';

function getKey(): Buffer {
  const secret = process.env.SMTP_SECRET_KEY;
  if (!secret) {
    throw new Error('SMTP_SECRET_KEY environment variable is required');
  }
  return createHash('sha256').update(secret).digest();
}

export function decrypt(encryptedText: string): string {
  if (!encryptedText || typeof encryptedText !== 'string') {
    return encryptedText;
  }

  const [ivHex, encrypted] = encryptedText.split(':');

  if (!ivHex || !encrypted) {
    // Already plain text (old format), devuelve tal cual.
    return encryptedText;
  }

  try {
    const iv = Buffer.from(ivHex, 'hex');
    const key = getKey();
    const decipher = createDecipheriv(ALGORITHM, key, iv);

    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  } catch {
    // En caso de fallo de descifrado, devolver valor original y evitar crash.
    return encryptedText;
  }
}
