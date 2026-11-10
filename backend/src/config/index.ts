import dotenv from 'dotenv';

dotenv.config();

export const config = {
  // App
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT || '5000', 10),
  
  // Database
  DATABASE_URL: process.env.DATABASE_URL || 'postgresql://user:password@localhost:5432/rcsfabrics',
  
  // JWT
  JWT_SECRET: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
  JWT_EXPIRE: process.env.JWT_EXPIRE || '7d',
  
  // Frontend
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:3000',
  
  // AWS S3
  AWS_REGION: process.env.AWS_REGION || 'us-east-1',
  AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID || '',
  AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY || '',
  AWS_S3_BUCKET: process.env.AWS_S3_BUCKET || '',
  
  // Stripe
  STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY || '',
  STRIPE_PUBLIC_KEY: process.env.STRIPE_PUBLIC_KEY || '',
  
  // Email
  SMTP_HOST: process.env.SMTP_HOST || 'smtp.gmail.com',
  SMTP_PORT: parseInt(process.env.SMTP_PORT || '587', 10),
  SMTP_USER: process.env.SMTP_USER || '',
  SMTP_PASSWORD: process.env.SMTP_PASSWORD || '',
  SMTP_FROM_EMAIL: process.env.SMTP_FROM_EMAIL || 'noreply@rcsfabrics.com',
  
  // SMS Service (Twilio or other provider)
  SMS_PROVIDER: process.env.SMS_PROVIDER || 'mock', // 'twilio', 'aws', or 'mock'
  TWILIO_ACCOUNT_SID: process.env.TWILIO_ACCOUNT_SID || '',
  TWILIO_AUTH_TOKEN: process.env.TWILIO_AUTH_TOKEN || '',
  TWILIO_PHONE_NUMBER: process.env.TWILIO_PHONE_NUMBER || '',
  
  // Admin
  ADMIN_EMAIL: process.env.ADMIN_EMAIL || 'admin@rcsfabrics.com',
  ADMIN_PASSWORD: process.env.ADMIN_PASSWORD, // no default — never ship a known admin password
};

// Validate required env vars
const requiredEnvVars = ['DATABASE_URL', 'JWT_SECRET'];
const missingEnvVars = requiredEnvVars.filter((envVar) => !process.env[envVar]);

if (missingEnvVars.length > 0) {
  console.warn(
    `Warning: Missing environment variables: ${missingEnvVars.join(', ')}`
  );
}

// Secrets that were committed to the repo or used as defaults — never valid in production.
const LEAKED_JWT_SECRETS = [
  'rcs_fabrics_secret_key_2024',
  'your-secret-key-change-in-production',
  'rcs-secret-key-change-in-production',
];

if (config.NODE_ENV === 'production') {
  const secret = process.env.JWT_SECRET || '';
  if (secret.length < 32 || LEAKED_JWT_SECRETS.includes(secret)) {
    throw new Error(
      'JWT_SECRET must be set to a random value of at least 32 characters in production ' +
        '(the committed/default secrets are not allowed). Set it in the Render dashboard.'
    );
  }
}
