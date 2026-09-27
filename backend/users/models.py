from django.conf import settings
from django.db import models


class ClerkIdentity(models.Model):
    """Links a Clerk user id to the local Django user used for foreign keys.

    Clerk owns sign-up/sign-in on the frontend; Django never sees a password.
    The first time a Clerk-verified request comes in for a given user, we
    create a bare Django user here so other backend models have something to
    point a ForeignKey at.
    """

    clerk_id = models.CharField(max_length=64, unique=True)
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="clerk_identity")

    def __str__(self):
        return self.clerk_id
