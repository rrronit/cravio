export const createEmailService = (email: SendEmail, from: string) => ({
  sendOtp: async (to: string, code: string): Promise<void> => {
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
