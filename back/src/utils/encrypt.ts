import { createCipheriv, randomBytes, createHash } from 'crypto';

const ALGORITHM = 'aes-256-cbc';

function getKey(): Buffer {
  const secret = process.env.SMTP_SECRET_KEY;
  if (!secret) {
    throw new Error('SMTP_SECRET_KEY environment variable is required');
  }
  return createHash('sha256').update(secret).digest();
}

export function encrypt(text: string): string {
  const iv = randomBytes(16);
  const key = getKey();
  const cipher = createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  return `${iv.toString('hex')}:${encrypted}`;
}
