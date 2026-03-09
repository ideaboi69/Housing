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

# Password reset email
def send_password_reset_email(to_email: str, first_name: str, token: str):
    reset_url = f"{settings.FRONTEND_URL}/reset-password?token={token}"
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
                                    Reset your password
                                </h2>
                                <p style="margin: 0 0 24px; color: #52525b; font-size: 15px; line-height: 1.6;">
                                    Hey {first_name}, we received a request to reset your password. Click the button below to choose a new one.
                                </p>

                                <!-- Button -->
                                <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                                    <tr>
                                        <td align="center" style="padding: 4px 0 24px;">
                                            <a href="{reset_url}"
                                               style="display: inline-block; background-color: #18181b; color: #ffffff; text-decoration: none; font-size: 15px; font-weight: 600; padding: 14px 32px; border-radius: 8px;">
                                                Reset Password
                                            </a>
                                        </td>
                                    </tr>
                                </table>

                                <p style="margin: 0 0 16px; color: #71717a; font-size: 13px; line-height: 1.6;">
                                    Or copy and paste this link into your browser:
                                </p>
                                <p style="margin: 0 0 24px; color: #3b82f6; font-size: 13px; line-height: 1.6; word-break: break-all;">
                                    {reset_url}
                                </p>

                                <hr style="border: none; border-top: 1px solid #e4e4e7; margin: 24px 0;">

                                <p style="margin: 0; color: #a1a1aa; font-size: 12px; line-height: 1.6;">
                                    This link expires in 1 hour. If you didn't request a password reset, you can safely ignore this email — your password won't be changed.
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
        "from": "FindYourCribb <no-reply@findyourcribb.com>",
        "to": [to_email],
        "subject": "Reset your password — FindYourCribb",
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

# Approval email
def send_approval_email(to_email: str, name: str, account_type: str):
    """Send approval notification to user or writer."""

    if account_type == "writer":
        message = "Your writer application has been approved! You can now log in and start creating posts."
        cta_text = "Start Writing"
        cta_url = f"{settings.FRONTEND_URL}/writers/login"
    else:
        message = "Your request for write access has been approved! You can now create posts on FindYourCribb."
        cta_text = "Create a Post"
        cta_url = f"{settings.FRONTEND_URL}/posts/new"

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

                        <tr>
                            <td style="background-color: #18181b; padding: 24px 40px; text-align: center;">
                                <h1 style="margin: 0; color: #ffffff; font-size: 22px; font-weight: 700;">FindYourCribb</h1>
                            </td>
                        </tr>

                        <tr>
                            <td style="padding: 40px;">
                                <div style="text-align: center; margin-bottom: 24px;">
                                    <span style="display: inline-block; background-color: #dcfce7; color: #166534; font-size: 14px; font-weight: 600; padding: 6px 16px; border-radius: 20px;">
                                        Approved
                                    </span>
                                </div>

                                <h2 style="margin: 0 0 8px; color: #18181b; font-size: 20px; font-weight: 600; text-align: center;">
                                    You're in, {name}!
                                </h2>
                                <p style="margin: 0 0 24px; color: #52525b; font-size: 15px; line-height: 1.6; text-align: center;">
                                    {message}
                                </p>

                                <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                                    <tr>
                                        <td align="center" style="padding: 4px 0 24px;">
                                            <a href="{cta_url}"
                                               style="display: inline-block; background-color: #18181b; color: #ffffff; text-decoration: none; font-size: 15px; font-weight: 600; padding: 14px 32px; border-radius: 8px;">
                                                {cta_text}
                                            </a>
                                        </td>
                                    </tr>
                                </table>

                                <hr style="border: none; border-top: 1px solid #e4e4e7; margin: 24px 0;">
                                <p style="margin: 0; color: #a1a1aa; font-size: 12px; line-height: 1.6; text-align: center;">
                                    If you have any questions, reply to this email or reach out at support@findyourcribb.com
                                </p>
                            </td>
                        </tr>

                        <tr>
                            <td style="background-color: #fafafa; padding: 24px 40px; text-align: center; border-top: 1px solid #e4e4e7;">
                                <p style="margin: 0; color: #a1a1aa; font-size: 12px;">&copy; 2025 FindYourCribb. All rights reserved.</p>
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
        "subject": f"You've been approved — FindYourCribb",
        "html": html_content,
    })

# Rejection email
def send_rejection_email(to_email: str, name: str, account_type: str):
    """Send rejection notification to user or writer."""

    if account_type == "writer":
        message = "Unfortunately, your writer application was not approved at this time. This could be due to incomplete information or a mismatch with our content guidelines."
    else:
        message = "Unfortunately, your request for write access was not approved at this time."

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

                        <tr>
                            <td style="background-color: #18181b; padding: 24px 40px; text-align: center;">
                                <h1 style="margin: 0; color: #ffffff; font-size: 22px; font-weight: 700;">FindYourCribb</h1>
                            </td>
                        </tr>

                        <tr>
                            <td style="padding: 40px;">
                                <div style="text-align: center; margin-bottom: 24px;">
                                    <span style="display: inline-block; background-color: #fee2e2; color: #991b1b; font-size: 14px; font-weight: 600; padding: 6px 16px; border-radius: 20px;">
                                        Not Approved
                                    </span>
                                </div>

                                <h2 style="margin: 0 0 8px; color: #18181b; font-size: 20px; font-weight: 600; text-align: center;">
                                    Hi {name},
                                </h2>
                                <p style="margin: 0 0 24px; color: #52525b; font-size: 15px; line-height: 1.6; text-align: center;">
                                    {message}
                                </p>

                                <p style="margin: 0 0 24px; color: #52525b; font-size: 15px; line-height: 1.6; text-align: center;">
                                    You're welcome to reapply in the future. If you think this was a mistake, feel free to reach out to us.
                                </p>

                                <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                                    <tr>
                                        <td align="center" style="padding: 4px 0 24px;">
                                            <a href="mailto:support@findyourcribb.com"
                                               style="display: inline-block; background-color: #18181b; color: #ffffff; text-decoration: none; font-size: 15px; font-weight: 600; padding: 14px 32px; border-radius: 8px;">
                                                Contact Support
                                            </a>
                                        </td>
                                    </tr>
                                </table>

                                <hr style="border: none; border-top: 1px solid #e4e4e7; margin: 24px 0;">
                                <p style="margin: 0; color: #a1a1aa; font-size: 12px; line-height: 1.6; text-align: center;">
                                    This is an automated message. Please do not reply directly to this email.
                                </p>
                            </td>
                        </tr>

                        <tr>
                            <td style="background-color: #fafafa; padding: 24px 40px; text-align: center; border-top: 1px solid #e4e4e7;">
                                <p style="margin: 0; color: #a1a1aa; font-size: 12px;">&copy; 2025 FindYourCribb. All rights reserved.</p>
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
        "subject": "Update on your application — FindYourCribb",
        "html": html_content,
    })

# Revoked email
def send_revoked_email(to_email: str, name: str, account_type: str):
    """Send revocation notification to user or writer."""

    if account_type == "writer":
        message = "Your writer access on FindYourCribb has been revoked. You will no longer be able to create or publish posts."
    else:
        message = "Your write access on FindYourCribb has been revoked. You will no longer be able to create or publish posts."

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

                        <tr>
                            <td style="background-color: #18181b; padding: 24px 40px; text-align: center;">
                                <h1 style="margin: 0; color: #ffffff; font-size: 22px; font-weight: 700;">FindYourCribb</h1>
                            </td>
                        </tr>

                        <tr>
                            <td style="padding: 40px;">
                                <div style="text-align: center; margin-bottom: 24px;">
                                    <span style="display: inline-block; background-color: #fef3c7; color: #92400e; font-size: 14px; font-weight: 600; padding: 6px 16px; border-radius: 20px;">
                                        Access Revoked
                                    </span>
                                </div>

                                <h2 style="margin: 0 0 8px; color: #18181b; font-size: 20px; font-weight: 600; text-align: center;">
                                    Hi {name},
                                </h2>
                                <p style="margin: 0 0 24px; color: #52525b; font-size: 15px; line-height: 1.6; text-align: center;">
                                    {message}
                                </p>

                                <p style="margin: 0 0 24px; color: #52525b; font-size: 15px; line-height: 1.6; text-align: center;">
                                    If you believe this was a mistake, please contact our support team.
                                </p>

                                <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                                    <tr>
                                        <td align="center" style="padding: 4px 0 24px;">
                                            <a href="mailto:support@findyourcribb.com"
                                               style="display: inline-block; background-color: #18181b; color: #ffffff; text-decoration: none; font-size: 15px; font-weight: 600; padding: 14px 32px; border-radius: 8px;">
                                                Contact Support
                                            </a>
                                        </td>
                                    </tr>
                                </table>

                                <hr style="border: none; border-top: 1px solid #e4e4e7; margin: 24px 0;">
                                <p style="margin: 0; color: #a1a1aa; font-size: 12px; line-height: 1.6; text-align: center;">
                                    This is an automated message. Please do not reply directly to this email.
                                </p>
                            </td>
                        </tr>

                        <tr>
                            <td style="background-color: #fafafa; padding: 24px 40px; text-align: center; border-top: 1px solid #e4e4e7;">
                                <p style="margin: 0; color: #a1a1aa; font-size: 12px;">&copy; 2025 FindYourCribb. All rights reserved.</p>
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
        "subject": "Your write access has been revoked — FindYourCribb",
        "html": html_content,
    })

# Booking confirmation
def send_booking_confirmed_email(to_email: str, name: str, role: str, booking_details: dict):
    """Notify both parties when a viewing is booked."""

    if role == "student":
        intro = "Your viewing has been confirmed! Here are the details:"
    else:
        intro = "A student has booked a viewing at your property. Here are the details:"

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

                        <tr>
                            <td style="background-color: #18181b; padding: 24px 40px; text-align: center;">
                                <h1 style="margin: 0; color: #ffffff; font-size: 22px; font-weight: 700;">FindYourCribb</h1>
                            </td>
                        </tr>

                        <tr>
                            <td style="padding: 40px;">
                                <div style="text-align: center; margin-bottom: 24px;">
                                    <span style="display: inline-block; background-color: #dcfce7; color: #166534; font-size: 14px; font-weight: 600; padding: 6px 16px; border-radius: 20px;">
                                        Viewing Confirmed
                                    </span>
                                </div>

                                <h2 style="margin: 0 0 8px; color: #18181b; font-size: 20px; font-weight: 600; text-align: center;">
                                    Hi {name},
                                </h2>
                                <p style="margin: 0 0 24px; color: #52525b; font-size: 15px; line-height: 1.6; text-align: center;">
                                    {intro}
                                </p>

                                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f9fafb; border-radius: 8px; margin-bottom: 24px;">
                                    <tr>
                                        <td style="padding: 12px 16px; color: #71717a; font-size: 13px; border-bottom: 1px solid #e4e4e7;">Property</td>
                                        <td style="padding: 12px 16px; color: #18181b; font-size: 14px; font-weight: 600; border-bottom: 1px solid #e4e4e7;">{booking_details['listing_title']}</td>
                                    </tr>
                                    <tr>
                                        <td style="padding: 12px 16px; color: #71717a; font-size: 13px; border-bottom: 1px solid #e4e4e7;">Address</td>
                                        <td style="padding: 12px 16px; color: #18181b; font-size: 14px; border-bottom: 1px solid #e4e4e7;">{booking_details['address']}</td>
                                    </tr>
                                    <tr>
                                        <td style="padding: 12px 16px; color: #71717a; font-size: 13px; border-bottom: 1px solid #e4e4e7;">Date</td>
                                        <td style="padding: 12px 16px; color: #18181b; font-size: 14px; font-weight: 600; border-bottom: 1px solid #e4e4e7;">{booking_details['date']}</td>
                                    </tr>
                                    <tr>
                                        <td style="padding: 12px 16px; color: #71717a; font-size: 13px; border-bottom: 1px solid #e4e4e7;">Time</td>
                                        <td style="padding: 12px 16px; color: #18181b; font-size: 14px; font-weight: 600; border-bottom: 1px solid #e4e4e7;">{booking_details['start_time']} - {booking_details['end_time']}</td>
                                    </tr>
                                    <tr>
                                        <td style="padding: 12px 16px; color: #71717a; font-size: 13px;">{'Landlord' if role == 'student' else 'Student'}</td>
                                        <td style="padding: 12px 16px; color: #18181b; font-size: 14px;">{booking_details['other_party_name']}</td>
                                    </tr>
                                </table>

                                <p style="margin: 0 0 24px; color: #52525b; font-size: 13px; line-height: 1.6; text-align: center;">
                                    Cancellations must be made at least 24 hours before the viewing.
                                </p>

                                <hr style="border: none; border-top: 1px solid #e4e4e7; margin: 24px 0;">
                                <p style="margin: 0; color: #a1a1aa; font-size: 12px; line-height: 1.6; text-align: center;">
                                    If you have any questions, reach out at support@findyourcribb.com
                                </p>
                            </td>
                        </tr>

                        <tr>
                            <td style="background-color: #fafafa; padding: 24px 40px; text-align: center; border-top: 1px solid #e4e4e7;">
                                <p style="margin: 0; color: #a1a1aa; font-size: 12px;">&copy; 2025 FindYourCribb. All rights reserved.</p>
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
        "subject": f"Viewing Confirmed — {booking_details['listing_title']}",
        "html": html_content,
    })

# Booking cancellation
def send_booking_cancelled_email(to_email: str, name: str, cancelled_by: str, booking_details: dict):
    """Notify both parties when a viewing is cancelled."""

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

                        <tr>
                            <td style="background-color: #18181b; padding: 24px 40px; text-align: center;">
                                <h1 style="margin: 0; color: #ffffff; font-size: 22px; font-weight: 700;">FindYourCribb</h1>
                            </td>
                        </tr>

                        <tr>
                            <td style="padding: 40px;">
                                <div style="text-align: center; margin-bottom: 24px;">
                                    <span style="display: inline-block; background-color: #fee2e2; color: #991b1b; font-size: 14px; font-weight: 600; padding: 6px 16px; border-radius: 20px;">
                                        Viewing Cancelled
                                    </span>
                                </div>

                                <h2 style="margin: 0 0 8px; color: #18181b; font-size: 20px; font-weight: 600; text-align: center;">
                                    Hi {name},
                                </h2>
                                <p style="margin: 0 0 24px; color: #52525b; font-size: 15px; line-height: 1.6; text-align: center;">
                                    A viewing has been cancelled by the {cancelled_by}. Here were the details:
                                </p>

                                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f9fafb; border-radius: 8px; margin-bottom: 24px;">
                                    <tr>
                                        <td style="padding: 12px 16px; color: #71717a; font-size: 13px; border-bottom: 1px solid #e4e4e7;">Property</td>
                                        <td style="padding: 12px 16px; color: #18181b; font-size: 14px; font-weight: 600; border-bottom: 1px solid #e4e4e7;">{booking_details['listing_title']}</td>
                                    </tr>
                                    <tr>
                                        <td style="padding: 12px 16px; color: #71717a; font-size: 13px; border-bottom: 1px solid #e4e4e7;">Date</td>
                                        <td style="padding: 12px 16px; color: #18181b; font-size: 14px; border-bottom: 1px solid #e4e4e7;">{booking_details['date']}</td>
                                    </tr>
                                    <tr>
                                        <td style="padding: 12px 16px; color: #71717a; font-size: 13px;">Time</td>
                                        <td style="padding: 12px 16px; color: #18181b; font-size: 14px;">{booking_details['start_time']} - {booking_details['end_time']}</td>
                                    </tr>
                                </table>

                                <hr style="border: none; border-top: 1px solid #e4e4e7; margin: 24px 0;">
                                <p style="margin: 0; color: #a1a1aa; font-size: 12px; line-height: 1.6; text-align: center;">
                                    If you have any questions, reach out at support@findyourcribb.com
                                </p>
                            </td>
                        </tr>

                        <tr>
                            <td style="background-color: #fafafa; padding: 24px 40px; text-align: center; border-top: 1px solid #e4e4e7;">
                                <p style="margin: 0; color: #a1a1aa; font-size: 12px;">&copy; 2025 FindYourCribb. All rights reserved.</p>
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
        "subject": f"Viewing Cancelled — {booking_details['listing_title']}",
        "html": html_content,
    })

def send_booking_reminder_email(to_email: str, name: str, role: str, booking_details: dict):
    """Remind both parties 24hrs before a viewing."""

    if role == "student":
        intro = "Just a reminder — you have a viewing tomorrow!"
    else:
        intro = "Just a reminder — a student is coming for a viewing tomorrow!"

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

                        <tr>
                            <td style="background-color: #18181b; padding: 24px 40px; text-align: center;">
                                <h1 style="margin: 0; color: #ffffff; font-size: 22px; font-weight: 700;">FindYourCribb</h1>
                            </td>
                        </tr>

                        <tr>
                            <td style="padding: 40px;">
                                <div style="text-align: center; margin-bottom: 24px;">
                                    <span style="display: inline-block; background-color: #dbeafe; color: #1e40af; font-size: 14px; font-weight: 600; padding: 6px 16px; border-radius: 20px;">
                                        Viewing Tomorrow
                                    </span>
                                </div>

                                <h2 style="margin: 0 0 8px; color: #18181b; font-size: 20px; font-weight: 600; text-align: center;">
                                    Hi {name},
                                </h2>
                                <p style="margin: 0 0 24px; color: #52525b; font-size: 15px; line-height: 1.6; text-align: center;">
                                    {intro}
                                </p>

                                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f9fafb; border-radius: 8px; margin-bottom: 24px;">
                                    <tr>
                                        <td style="padding: 12px 16px; color: #71717a; font-size: 13px; border-bottom: 1px solid #e4e4e7;">Property</td>
                                        <td style="padding: 12px 16px; color: #18181b; font-size: 14px; font-weight: 600; border-bottom: 1px solid #e4e4e7;">{booking_details['listing_title']}</td>
                                    </tr>
                                    <tr>
                                        <td style="padding: 12px 16px; color: #71717a; font-size: 13px; border-bottom: 1px solid #e4e4e7;">Address</td>
                                        <td style="padding: 12px 16px; color: #18181b; font-size: 14px; border-bottom: 1px solid #e4e4e7;">{booking_details['address']}</td>
                                    </tr>
                                    <tr>
                                        <td style="padding: 12px 16px; color: #71717a; font-size: 13px; border-bottom: 1px solid #e4e4e7;">Date</td>
                                        <td style="padding: 12px 16px; color: #18181b; font-size: 14px; font-weight: 600; border-bottom: 1px solid #e4e4e7;">{booking_details['date']}</td>
                                    </tr>
                                    <tr>
                                        <td style="padding: 12px 16px; color: #71717a; font-size: 13px; border-bottom: 1px solid #e4e4e7;">Time</td>
                                        <td style="padding: 12px 16px; color: #18181b; font-size: 14px; font-weight: 600; border-bottom: 1px solid #e4e4e7;">{booking_details['start_time']} - {booking_details['end_time']}</td>
                                    </tr>
                                    <tr>
                                        <td style="padding: 12px 16px; color: #71717a; font-size: 13px;">{'Landlord' if role == 'student' else 'Student'}</td>
                                        <td style="padding: 12px 16px; color: #18181b; font-size: 14px;">{booking_details['other_party_name']}</td>
                                    </tr>
                                </table>

                                <p style="margin: 0 0 24px; color: #52525b; font-size: 13px; line-height: 1.6; text-align: center;">
                                    Note: This viewing can no longer be cancelled as it is within 24 hours.
                                </p>

                                <hr style="border: none; border-top: 1px solid #e4e4e7; margin: 24px 0;">
                                <p style="margin: 0; color: #a1a1aa; font-size: 12px; line-height: 1.6; text-align: center;">
                                    If you have any questions, reach out at support@findyourcribb.com
                                </p>
                            </td>
                        </tr>

                        <tr>
                            <td style="background-color: #fafafa; padding: 24px 40px; text-align: center; border-top: 1px solid #e4e4e7;">
                                <p style="margin: 0; color: #a1a1aa; font-size: 12px;">&copy; 2025 FindYourCribb. All rights reserved.</p>
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
        "subject": f"Reminder: Viewing Tomorrow — {booking_details['listing_title']}",
        "html": html_content,
    })