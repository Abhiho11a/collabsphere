const { BrevoClient } = require("@getbrevo/brevo");

const brevo = new BrevoClient({
  apiKey: process.env.BREVO_API_KEY,
});

const sender = {
  name: process.env.EMAIL_FROM_NAME || "COLLABSPHERE",
  email: process.env.EMAIL_FROM,
};

const sendVerificationEmail = async (
  email,
  name,
  verificationUrl
) => {
  await brevo.transactionalEmails.sendTransacEmail({
    sender,

    to: [
      {
        email,
        name,
      },
    ],

    subject: "Verify your COLLABSPHERE account",

    textContent: `
Hello ${name},

Welcome to COLLABSPHERE.

Please verify your email address using the following link:

${verificationUrl}

This link expires in 24 hours.

If you did not create this account, you can ignore this email.
`,

    htmlContent: `
      <div style="font-family: Arial, sans-serif;">
        <h2>Welcome to COLLABSPHERE</h2>

        <p>Hello ${name},</p>

        <p>
          Please verify your email address to activate your account.
        </p>

        <p>
          <a
            href="${verificationUrl}"
            style="
              display:inline-block;
              padding:12px 20px;
              background:#111827;
              color:white;
              text-decoration:none;
              border-radius:6px;
            "
          >
            Verify Email
          </a>
        </p>

        <p>
          This link expires in 24 hours.
        </p>

        <p>
          If you did not create this account, you can ignore this email.
        </p>
      </div>
    `,
  });
};

const sendPasswordResetEmail = async (
  email,
  name,
  resetUrl
) => {
  await brevo.transactionalEmails.sendTransacEmail({
    sender,

    to: [
      {
        email,
        name,
      },
    ],

    subject: "Reset your COLLABSPHERE password",

    textContent: `
Hello ${name},

We received a request to reset your COLLABSPHERE password.

Use the following link to create a new password:

${resetUrl}

This link expires in 15 minutes.

If you did not request a password reset, you can safely ignore this email.
`,

    htmlContent: `
      <div style="font-family: Arial, sans-serif;">
        <h2>Reset your COLLABSPHERE password</h2>

        <p>Hello ${name},</p>

        <p>
          We received a request to reset your password.
        </p>

        <p>
          <a
            href="${resetUrl}"
            style="
              display:inline-block;
              padding:12px 20px;
              background:#111827;
              color:white;
              text-decoration:none;
              border-radius:6px;
            "
          >
            Reset Password
          </a>
        </p>

        <p>
          This link expires in 15 minutes.
        </p>

        <p>
          If you did not request a password reset,
          you can safely ignore this email.
        </p>
      </div>
    `,
  });
};

module.exports = {
  sendVerificationEmail,
  sendPasswordResetEmail,
};