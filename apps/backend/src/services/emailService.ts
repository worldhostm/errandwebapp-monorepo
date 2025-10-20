import nodemailer from 'nodemailer';

// Create reusable transporter
const createTransporter = () => {
  // For development: use ethereal.email or console logging
  // For production: use real SMTP service (Gmail, SendGrid, etc.)

  if (process.env.NODE_ENV === 'production' && process.env.SMTP_HOST) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD
      }
    });
  } else {
    // Development: log to console
    return nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      auth: {
        user: process.env.EMAIL_USER || 'ethereal.user@ethereal.email',
        pass: process.env.EMAIL_PASSWORD || 'ethereal-password'
      }
    });
  }
};

export const sendVerificationEmail = async (email: string, code: string): Promise<void> => {
  const transporter = createTransporter();

  const mailOptions = {
    from: process.env.EMAIL_FROM || '"부름이" <noreply@burum.com>',
    to: email,
    subject: '[부름이] 이메일 인증 코드',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>이메일 인증</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px;">부름이</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">간편한 심부름 서비스</p>
          </div>

          <div style="background: white; padding: 40px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">
            <h2 style="color: #1f2937; margin: 0 0 20px 0; font-size: 24px;">이메일 인증</h2>

            <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
              부름이 회원가입을 환영합니다! 아래의 인증 코드를 입력하여 이메일 인증을 완료해주세요.
            </p>

            <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; text-align: center; margin: 0 0 30px 0;">
              <p style="color: #6b7280; font-size: 14px; margin: 0 0 10px 0;">인증 코드</p>
              <div style="font-size: 36px; font-weight: bold; color: #667eea; letter-spacing: 8px; font-family: 'Courier New', monospace;">
                ${code}
              </div>
            </div>

            <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; border-radius: 4px; margin: 0 0 20px 0;">
              <p style="color: #92400e; margin: 0; font-size: 14px;">
                ⚠️ 이 인증 코드는 <strong>10분간</strong> 유효합니다.
              </p>
            </div>

            <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 0;">
              이 이메일을 요청하지 않으셨다면 무시하셔도 됩니다.<br>
              궁금한 점이 있으시면 언제든 문의해 주세요.
            </p>
          </div>

          <div style="text-align: center; padding: 20px; color: #9ca3af; font-size: 12px;">
            <p style="margin: 0 0 5px 0;">© 2024 부름이. All rights reserved.</p>
            <p style="margin: 0;">이웃과 함께하는 스마트한 심부름 플랫폼</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
부름이 이메일 인증

회원가입을 환영합니다!
아래의 인증 코드를 입력하여 이메일 인증을 완료해주세요.

인증 코드: ${code}

이 인증 코드는 10분간 유효합니다.
이 이메일을 요청하지 않으셨다면 무시하셔도 됩니다.

© 2024 부름이. All rights reserved.
    `
  };

  try {
    // In development, just log the code to console instead of sending email
    if (process.env.NODE_ENV !== 'production') {
      console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('📧 이메일 인증 코드 (개발 모드)');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log(`   받는 사람: ${email}`);
      console.log(`   인증 코드: ${code}`);
      console.log(`   유효 시간: 10분`);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
      return;
    }

    const info = await transporter.sendMail(mailOptions);
    console.log('Message sent: %s', info.messageId);
    console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
    console.log('Verification code for', email, ':', code);
  } catch (error) {
    console.error('Error sending verification email:', error);
    // In development, don't throw error, just log the code
    if (process.env.NODE_ENV !== 'production') {
      console.log('\n⚠️  이메일 전송 실패 (개발 모드 - 코드 로그로 대체)');
      console.log(`   받는 사람: ${email}`);
      console.log(`   인증 코드: ${code}\n`);
      return;
    }
    throw new Error('Failed to send verification email');
  }
};

export const sendWelcomeEmail = async (email: string, name: string): Promise<void> => {
  const transporter = createTransporter();

  const mailOptions = {
    from: process.env.EMAIL_FROM || '"부름이" <noreply@burum.com>',
    to: email,
    subject: '[부름이] 환영합니다!',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>환영합니다</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px;">🤝 부름이</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">간편한 심부름 서비스</p>
          </div>

          <div style="background: white; padding: 40px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">
            <h2 style="color: #1f2937; margin: 0 0 20px 0; font-size: 24px;">환영합니다, ${name}님!</h2>

            <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
              부름이에 가입해 주셔서 감사합니다. 이제 주변 사람들과 간편하게 심부름을 주고받을 수 있습니다.
            </p>

            <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 0 0 20px 0;">
              <h3 style="color: #1f2937; margin: 0 0 15px 0; font-size: 18px;">시작하기</h3>
              <ul style="color: #4b5563; line-height: 2; margin: 0; padding-left: 20px;">
                <li>지도에서 내 주변 심부름 확인하기</li>
                <li>필요한 심부름 등록하기</li>
                <li>간단한 심부름으로 부수입 얻기</li>
                <li>실시간 채팅으로 소통하기</li>
              </ul>
            </div>

            <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 0;">
              궁금한 점이 있으시면 언제든 문의해 주세요.<br>
              즐거운 부름이 생활 되세요!
            </p>
          </div>

          <div style="text-align: center; padding: 20px; color: #9ca3af; font-size: 12px;">
            <p style="margin: 0 0 5px 0;">© 2024 부름이. All rights reserved.</p>
            <p style="margin: 0;">이웃과 함께하는 스마트한 심부름 플랫폼</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
환영합니다, ${name}님!

부름이에 가입해 주셔서 감사합니다.
이제 주변 사람들과 간편하게 심부름을 주고받을 수 있습니다.

시작하기:
- 지도에서 내 주변 심부름 확인하기
- 필요한 심부름 등록하기
- 간단한 심부름으로 부수입 얻기
- 실시간 채팅으로 소통하기

즐거운 부름이 생활 되세요!

© 2024 부름이. All rights reserved.
    `
  };

  try {
    const info = await transporter.sendMail(mailOptions);

    if (process.env.NODE_ENV !== 'production') {
      console.log('Welcome email sent: %s', info.messageId);
      console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
    }
  } catch (error) {
    console.error('Error sending welcome email:', error);
    // Don't throw error for welcome email - it's not critical
  }
};
