// SMS Service - Can be integrated with Twilio, AWS SNS, or other SMS providers
// For now, using a mock implementation that logs OTP to console

export interface SMSResponse {
  success: boolean;
  messageId?: string;
  error?: string;
}

export interface OTPData {
  phone: string;
  code: string;
}

/**
 * Send OTP via SMS
 * Integration point for Twilio, AWS SNS, or other SMS providers
 */
export const sendOTP = async (data: OTPData): Promise<SMSResponse> => {
  try {
    // Mock implementation - logs OTP to console for development
    console.log(`[SMS OTP] Sending OTP to ${data.phone}`);
    console.log(`[SMS OTP] Code: ${data.code}`);

    // In production, integrate with actual SMS service:
    // Example with Twilio:
    // const twilio = require('twilio');
    // const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
    // const message = await client.messages.create({
    //   body: `Your OTP is: ${data.code}. Valid for 10 minutes.`,
    //   from: process.env.TWILIO_PHONE_NUMBER,
    //   to: data.phone
    // });
    // return { success: true, messageId: message.sid };

    // For development, return success
    return {
      success: true,
      messageId: `mock-${Date.now()}`,
    };
  } catch (error) {
    console.error('Error sending OTP:', error);
    return {
      success: false,
      error: 'Failed to send OTP. Please try again.',
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
