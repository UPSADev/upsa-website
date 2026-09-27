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
            )
        except jwt.PyJWTError as exc:
            raise AuthenticationFailed(f"Invalid Clerk token: {exc}") from exc

        return (self._get_or_create_user(claims["sub"]), claims)

    def _get_or_create_user(self, clerk_user_id):
        try:
            return ClerkIdentity.objects.select_related("user").get(clerk_id=clerk_user_id).user
        except ClerkIdentity.DoesNotExist:
            user = get_user_model().objects.create(username=f"clerk:{clerk_user_id}")
            ClerkIdentity.objects.create(clerk_id=clerk_user_id, user=user)
            return user
