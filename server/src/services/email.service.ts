export const createEmailService = (
  email: SendEmail | undefined,
  from: string,
  environment: 'development' | 'production',
) => ({
  sendOtp: async (to: string, code: string): Promise<void> => {
    if (environment === 'development') {
      console.info(JSON.stringify({
        event: 'auth.otp.development_code',
        email: to,
        code,
        warning: 'Development only. This code is never logged in production.',
      }));
      return;
    }

    if (!email) throw new Error('Cloudflare Email Service binding is not configured.');
    await email.send({
      to,
      from,
      subject: 'Your Cravio sign-in code',
      text: `Your Cravio sign-in code is ${code}. It expires in 10 minutes. If you did not request it, you can ignore this email.`,
      html: `<h1>${code}</h1><p>Your Cravio sign-in code expires in 10 minutes.</p><p>If you did not request it, you can ignore this email.</p>`,
    });
  },
});

export type EmailService = ReturnType<typeof createEmailService>;
