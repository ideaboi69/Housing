import resend
from config import settings

resend.api_key = settings.CRIBB_RESEND_API

# Verification email
def send_verification_email(to_email: str, first_name: str, token: str):
    verification_url = f"{settings.FRONTEND_URL}/verify-email?token={token}"
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; background-color: #f4f4f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f4f4f5; padding: 40px 20px;">
            <tr>
                <td align="center">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 480px; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">

                        <!-- Header -->
                        <tr>
                            <td style="background-color: #18181b; padding: 32px 40px; text-align: center;">
                                <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 700; letter-spacing: -0.5px;">
                                    FindYourCribb
                                </h1>
                            </td>
                        </tr>

                        <!-- Body -->
                        <tr>
                            <td style="padding: 40px;">
                                <h2 style="margin: 0 0 8px; color: #18181b; font-size: 20px; font-weight: 600;">
                                    Verify your email
                                </h2>
                                <p style="margin: 0 0 24px; color: #52525b; font-size: 15px; line-height: 1.6;">
                                    Hey {first_name}, thanks for signing up! Please confirm your email address by clicking the button below.
                                </p>

                                <!-- Button -->
                                <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                                    <tr>
                                        <td align="center" style="padding: 4px 0 24px;">
                                            <a href="{verification_url}"
                                               style="display: inline-block; background-color: #18181b; color: #ffffff; text-decoration: none; font-size: 15px; font-weight: 600; padding: 14px 32px; border-radius: 8px;">
                                                Verify Email Address
                                            </a>
                                        </td>
                                    </tr>
                                </table>

                                <p style="margin: 0 0 16px; color: #71717a; font-size: 13px; line-height: 1.6;">
                                    Or copy and paste this link into your browser:
                                </p>
                                <p style="margin: 0 0 24px; color: #3b82f6; font-size: 13px; line-height: 1.6; word-break: break-all;">
                                    {verification_url}
                                </p>

                                <hr style="border: none; border-top: 1px solid #e4e4e7; margin: 24px 0;">

                                <p style="margin: 0; color: #a1a1aa; font-size: 12px; line-height: 1.6;">
                                    This link expires in {settings.EMAIL_VERIFY_EXPIRE_MINUTES} minutes. If you didn't create an account, you can safely ignore this email.
                                </p>
                            </td>
                        </tr>

                        <!-- Footer -->
                        <tr>
                            <td style="background-color: #fafafa; padding: 24px 40px; text-align: center; border-top: 1px solid #e4e4e7;">
                                <p style="margin: 0; color: #a1a1aa; font-size: 12px;">
                                    &copy; 2025 FindYourCribb. All rights reserved.
                                </p>
                            </td>
                        </tr>

                    </table>
                </td>
            </tr>
        </table>
    </body>
    </html>
    """

    resend.Emails.send({
        "from": "FindYourCribb <no-reply@findyourcribb.com>",  # must be a verified domain in Resend
        "to": [to_email],
        "subject": "Verify your email — FindYourCribb",
        "html": html_content,
    })

# Messsages notification
def send_message_notification(
    to_email: str,
    recipient_name: str,
    sender_name: str,
    message_preview: str,
    conversation_id: int,
    property_title: str,
):
    conversation_url = f"{settings.FRONTEND_URL}/messages/{conversation_id}"

    # Truncate preview
    preview = message_preview[:150] + "..." if len(message_preview) > 150 else message_preview

    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; background-color: #f4f4f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f4f4f5; padding: 40px 20px;">
            <tr>
                <td align="center">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 480px; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">

                        <!-- Header -->
                        <tr>
                            <td style="background-color: #18181b; padding: 24px 40px; text-align: center;">
                                <h1 style="margin: 0; color: #ffffff; font-size: 22px; font-weight: 700;">
                                    FindYourCribb
                                </h1>
                            </td>
                        </tr>

                        <!-- Body -->
                        <tr>
                            <td style="padding: 36px 40px;">
                                <h2 style="margin: 0 0 8px; color: #18181b; font-size: 18px; font-weight: 600;">
                                    New message from {sender_name}
                                </h2>
                                <p style="margin: 0 0 4px; color: #71717a; font-size: 13px;">
                                    Re: {property_title}
                                </p>

                                <!-- Message bubble -->
                                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin: 20px 0;">
                                    <tr>
                                        <td style="background-color: #f4f4f5; border-radius: 8px; padding: 16px 20px;">
                                            <p style="margin: 0; color: #27272a; font-size: 14px; line-height: 1.6; font-style: italic;">
                                                "{preview}"
                                            </p>
                                        </td>
                                    </tr>
                                </table>

                                <!-- Button -->
                                <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                                    <tr>
                                        <td align="center" style="padding: 8px 0 16px;">
                                            <a href="{conversation_url}"
                                               style="display: inline-block; background-color: #18181b; color: #ffffff; text-decoration: none; font-size: 14px; font-weight: 600; padding: 12px 28px; border-radius: 8px;">
                                                View Conversation
                                            </a>
                                        </td>
                                    </tr>
                                </table>
                            </td>
                        </tr>

                        <!-- Footer -->
                        <tr>
                            <td style="background-color: #fafafa; padding: 20px 40px; text-align: center; border-top: 1px solid #e4e4e7;">
                                <p style="margin: 0; color: #a1a1aa; font-size: 11px;">
                                    You're receiving this because you have an active conversation on FindYourCribb.
                                </p>
                            </td>
                        </tr>

                    </table>
                </td>
            </tr>
        </table>
    </body>
    </html>
    """

    resend.Emails.send({
        "from": "FindYourCribb <no-reply@findyourcribb.com>",
        "reply_to": "support@findyourcribb.com",
        "to": [to_email],
        "subject": f"New message from {sender_name} — {property_title}",
        "html": html_content,
    })