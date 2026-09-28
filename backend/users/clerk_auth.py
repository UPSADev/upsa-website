"""Verifies Clerk session tokens and maps them to Django users.

Clerk handles sign-up/sign-in/sign-out entirely on the frontend. Django's only
job is to check that a request carries a genuine Clerk session token and
figure out which local user it belongs to - no passwords, no login views here.
"""
import jwt
from django.conf import settings
from django.contrib.auth import get_user_model
from jwt import PyJWKClient
from rest_framework.authentication import BaseAuthentication
from rest_framework.exceptions import AuthenticationFailed

from .models import ClerkIdentity

_jwks_client = None

CLOCK_SKEW_LEEWAY_SECONDS = 10


def _get_jwks_client():
    global _jwks_client
    if not settings.CLERK_ISSUER:
        raise AuthenticationFailed("CLERK_ISSUER is not configured on the server.")
    if _jwks_client is None:
        _jwks_client = PyJWKClient(f"{settings.CLERK_ISSUER}/.well-known/jwks.json")
    return _jwks_client


class ClerkJWTAuthentication(BaseAuthentication):
    """DRF authentication backed by a Clerk session token.

    Expects `Authorization: Bearer <clerk session token>` (the token the
    frontend gets from Clerk's `getToken()`). On success, `request.user` is
    the matching Django user and `request.auth` is the decoded token claims.
    """

    keyword = "Bearer"

    def authenticate(self, request):
        header = request.META.get("HTTP_AUTHORIZATION", "")
        if not header.startswith(f"{self.keyword} "):
            return None

        token = header[len(self.keyword) + 1 :]

        try:
            signing_key = _get_jwks_client().get_signing_key_from_jwt(token)
            claims = jwt.decode(
                token,
                signing_key.key,
                algorithms=["RS256"],
                issuer=settings.CLERK_ISSUER,
                options={"require": ["exp", "iat", "sub"]},
                # Server clocks drift by a second or two; without this a token
                # issued "just now" gets rejected as not yet valid (iat).
                leeway=CLOCK_SKEW_LEEWAY_SECONDS,
            )
        except jwt.PyJWTError as exc:
            raise AuthenticationFailed(f"Invalid Clerk token: {exc}") from exc

        # "azp" is the site the token was issued to. Reject tokens minted for
        # some other site; tokens without the claim are still accepted.
        authorized_party = claims.get("azp")
        allowed = settings.CLERK_AUTHORIZED_PARTIES
        if authorized_party and allowed and authorized_party not in allowed:
            raise AuthenticationFailed("Token was issued for a different site.")

        return (self._get_or_create_user(claims["sub"]), claims)

    def _get_or_create_user(self, clerk_user_id):
        # The portal fires several requests at once on first load, so a brand
        # new user hits this concurrently - get_or_create keeps that safe.
        user, _ = get_user_model().objects.get_or_create(username=f"clerk:{clerk_user_id}")
        identity, _ = ClerkIdentity.objects.get_or_create(clerk_id=clerk_user_id, defaults={"user": user})
        return identity.user
