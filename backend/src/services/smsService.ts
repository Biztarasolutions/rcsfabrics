import { config } from '@/config';

export interface SMSResponse {
  success: boolean;
  messageId?: string;
  error?: string;
}

export interface OTPData {
  phone: string;
  code: string;
}

const isProduction = (): boolean => (process.env.NODE_ENV || config.NODE_ENV) === 'production';

/**
 * Only in local development with the mock provider may the OTP be returned
 * in the API response (so you can test without SMS). Never in production.
 */
export const shouldExposeOtp = (): boolean =>
  !isProduction() && (config.SMS_PROVIDER || 'mock') === 'mock';

/**
 * Send OTP via SMS
 * Integration point for Twilio, AWS SNS, or other SMS providers
 */
export const sendOTP = async (data: OTPData): Promise<SMSResponse> => {
  try {
    const provider = config.SMS_PROVIDER;

    // The mock provider only logs the code — useless (and unsafe) in production.
    if (provider === 'mock' && isProduction()) {
      console.error('[SMS OTP] SMS_PROVIDER is "mock" in production — refusing to send OTP.');
      return { success: false, error: 'SMS verification is temporarily unavailable. Please try again later.' };
    }

    if (provider === 'twilio') {
      if (!config.TWILIO_ACCOUNT_SID || !config.TWILIO_AUTH_TOKEN || !config.TWILIO_PHONE_NUMBER) {
        throw new Error('Twilio credentials are not fully configured in environment variables');
      }
      try {
        const twilio = require('twilio');
        const client = twilio(config.TWILIO_ACCOUNT_SID, config.TWILIO_AUTH_TOKEN);
        const message = await client.messages.create({
          body: `Your RCS Fabrics verification code is: ${data.code}. Valid for 10 minutes.`,
          from: config.TWILIO_PHONE_NUMBER,
          to: data.phone,
        });
        console.log(`[SMS OTP] Sent via Twilio. Message SID: ${message.sid}`);
        return { success: true, messageId: message.sid };
      } catch (err: any) {
        console.error('Twilio sending failed:', err);
        throw new Error(`Twilio error: ${err.message || err}`);
      }
    }

    if (provider !== 'mock') {
      throw new Error(`Unsupported SMS_PROVIDER "${provider}"`);
    }

    // Mock implementation - logs OTP to console for local development only
    console.log(`[SMS OTP] Sending OTP to ${data.phone}`);
    console.log(`[SMS OTP] Code: ${data.code}`);

    // For development, return success
    return {
      success: true,
      messageId: `mock-${Date.now()}`,
    };
  } catch (error: any) {
    console.error('Error sending OTP:', error);
    return {
      success: false,
      error: error.message || 'Failed to send OTP. Please try again.',
    };
  }
};

/**
 * Generate a random 6-digit OTP
 */
export const generateOTP = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * Validate OTP format
 */
export const validateOTPFormat = (otp: string): boolean => {
  return /^\d{6}$/.test(otp);
};
