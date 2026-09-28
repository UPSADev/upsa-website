"""Email members about activity on their account.

Deliberately minimal and private:
- Addresses are never stored here. They live in Clerk, and are looked up only
  at the moment of sending, only to email that person themselves.
- Emails say *that* something happened and link to the portal. They never
  contain the text of a request or message.
- Members can turn them off (Profile.email_notifications).
- Sending happens after the database change commits, in a background thread,
  and can never make the API request that triggered it fail.
"""
import json
import logging
import threading
import urllib.request

from django.conf import settings
from django.core.cache import cache
from django.core.mail import send_mail
from django.db import connections, transaction

from users.models import ClerkIdentity

from .models import Profile

logger = logging.getLogger(__name__)

# A busy conversation shouldn't send an email per message.
MESSAGE_EMAIL_COOLDOWN_SECONDS = 15 * 60

REQUEST_TYPE_PHRASES = {
    "networking": "professional networking",
    "mentorship": "mentorship",
    "referral": "a referral conversation",
}


def _clerk_email(clerk_id):
    """A Clerk user's primary email address, or None."""
    request = urllib.request.Request(
        f"https://api.clerk.com/v1/users/{clerk_id}",
        headers={"Authorization": f"Bearer {settings.CLERK_SECRET_KEY}", "User-Agent": "upsa-portal/1.0"},
    )
    with urllib.request.urlopen(request, timeout=10) as response:
        data = json.load(response)
    addresses = data.get("email_addresses") or []
    primary_id = data.get("primary_email_address_id")
    for address in addresses:
        if address.get("id") == primary_id:
            return address.get("email_address")
    return addresses[0].get("email_address") if addresses else None


def _display_name(user_id):
    name = Profile.objects.filter(user_id=user_id).values_list("name", flat=True).first() or ""
    # One line only: the name ends up in an email subject.
    return " ".join(name.split())[:60] or "A UPSA member"


def _deliver(recipient_id, subject, body):
    """Send one email. Never raises: a notification must not break anything."""
    try:
        profile = Profile.objects.filter(user_id=recipient_id).first()
        if profile is not None and not profile.email_notifications:
            return
        identity = ClerkIdentity.objects.filter(user_id=recipient_id).first()
        if identity is None:
            return
        address = _clerk_email(identity.clerk_id)
        if address:
            send_mail(subject, body, None, [address])
    except Exception:
        logger.exception("Could not send notification email to user %s", recipient_id)


def _send_after_commit(recipient_id, subject, body):
    if not settings.NOTIFICATIONS_ENABLED:
        return

    def run():
        if not settings.NOTIFICATIONS_ASYNC:
            _deliver(recipient_id, subject, body)
            return

        def in_thread():
            try:
                _deliver(recipient_id, subject, body)
            finally:
                connections.close_all()

        threading.Thread(target=in_thread, daemon=True).start()

    transaction.on_commit(run)


def _footer(path):
    return (
        f"\nOpen it here: {settings.PORTAL_BASE_URL}{path}\n\n"
        "You can turn these emails off any time in Settings on the UPSA Portal.\n"
    )


def request_received(connection_request):
    sender = _display_name(connection_request.from_user_id)
    kind = REQUEST_TYPE_PHRASES.get(connection_request.request_type, "connecting")
    _send_after_commit(
        connection_request.to_user_id,
        f"{sender} sent you a connection request on the UPSA Portal",
        f"{sender} would like to connect with you about {kind}." + "\n" + _footer("/portal/requests"),
    )


def request_accepted(connection_request):
    accepter = _display_name(connection_request.to_user_id)
    _send_after_commit(
        connection_request.from_user_id,
        f"{accepter} accepted your connection request on the UPSA Portal",
        f"Good news: {accepter} accepted your request. You can message them now." + "\n" + _footer("/portal/connections"),
    )


def message_received(message):
    connection = message.connection
    recipient_id = connection.member_b_id if message.sender_id == connection.member_a_id else connection.member_a_id
    # cache.add only succeeds if the key isn't already set, i.e. no email was
    # sent for this conversation in the last cooldown window.
    if not cache.add(f"notify-message:{connection.id}:{recipient_id}", 1, MESSAGE_EMAIL_COOLDOWN_SECONDS):
        return
    sender = _display_name(message.sender_id)
    _send_after_commit(
        recipient_id,
        f"{sender} sent you a message on the UPSA Portal",
        f"{sender} sent you a new message." + "\n" + _footer(f"/portal/messages/{connection.id}"),
    )
