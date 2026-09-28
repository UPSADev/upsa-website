import time
from types import SimpleNamespace
from unittest import mock

import jwt
from cryptography.hazmat.primitives.asymmetric import rsa
from django.contrib.auth import get_user_model
from django.test import RequestFactory, TestCase, override_settings
from rest_framework.exceptions import AuthenticationFailed

from .clerk_auth import ClerkJWTAuthentication
from .models import ClerkIdentity

User = get_user_model()

ISSUER = "https://test.clerk.example"


@override_settings(CLERK_ISSUER=ISSUER)
class ClerkTokenVerificationTests(TestCase):
    def setUp(self):
        self.private_key = rsa.generate_private_key(public_exponent=65537, key_size=2048)
        signing_key = SimpleNamespace(key=self.private_key.public_key())
        jwks = SimpleNamespace(get_signing_key_from_jwt=lambda token: signing_key)
        patcher = mock.patch("users.clerk_auth._get_jwks_client", return_value=jwks)
        patcher.start()
        self.addCleanup(patcher.stop)

    def authenticate(self, iat_offset=0, **extra_claims):
        now = int(time.time())
        token = jwt.encode(
            {"sub": "user_clock", "iss": ISSUER, "iat": now + iat_offset, "exp": now + 300, **extra_claims},
            self.private_key,
            algorithm="RS256",
        )
        request = RequestFactory().get("/", HTTP_AUTHORIZATION=f"Bearer {token}")
        return ClerkJWTAuthentication().authenticate(request)

    def test_token_from_a_slightly_fast_clock_is_accepted(self):
        user, claims = self.authenticate(iat_offset=3)
        self.assertEqual(claims["sub"], "user_clock")

    def test_token_from_far_in_the_future_is_still_rejected(self):
        with self.assertRaises(AuthenticationFailed):
            self.authenticate(iat_offset=60)

    @override_settings(CLERK_AUTHORIZED_PARTIES=["https://unitedpsa.org"])
    def test_token_issued_for_another_site_is_rejected(self):
        with self.assertRaises(AuthenticationFailed):
            self.authenticate(azp="https://evil.example")

    @override_settings(CLERK_AUTHORIZED_PARTIES=["https://unitedpsa.org"])
    def test_token_issued_for_our_site_is_accepted(self):
        user, claims = self.authenticate(azp="https://unitedpsa.org")
        self.assertEqual(claims["sub"], "user_clock")

    @override_settings(CLERK_AUTHORIZED_PARTIES=["https://unitedpsa.org"])
    def test_token_without_azp_is_still_accepted(self):
        user, claims = self.authenticate()
        self.assertEqual(claims["sub"], "user_clock")


class ClerkUserMappingTests(TestCase):
    def setUp(self):
        self.auth = ClerkJWTAuthentication()

    def test_same_clerk_id_always_maps_to_one_user(self):
        first = self.auth._get_or_create_user("user_abc")
        second = self.auth._get_or_create_user("user_abc")
        self.assertEqual(first.id, second.id)
        self.assertEqual(User.objects.filter(username="clerk:user_abc").count(), 1)
        self.assertEqual(ClerkIdentity.objects.filter(clerk_id="user_abc").count(), 1)

    def test_recovers_from_user_without_identity(self):
        # what a crashed concurrent first-load request could leave behind
        orphan = User.objects.create(username="clerk:user_orphan")
        user = self.auth._get_or_create_user("user_orphan")
        self.assertEqual(user.id, orphan.id)
        self.assertTrue(ClerkIdentity.objects.filter(clerk_id="user_orphan", user=orphan).exists())
