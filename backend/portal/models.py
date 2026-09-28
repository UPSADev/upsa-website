from django.conf import settings
from django.db import models

from .storage import avatar_storage, resume_storage

REQUEST_TYPE_CHOICES = [
    ("networking", "Networking"),
    ("mentorship", "Mentorship"),
    ("referral", "Referral"),
]

REQUEST_STATUS_CHOICES = [
    ("pending", "Pending"),
    ("accepted", "Accepted"),
    ("declined", "Declined"),
    ("cancelled", "Cancelled"),
]

CONNECTION_STATUS_CHOICES = [
    ("active", "Active"),
    ("completed", "Completed"),
    ("cancelled", "Cancelled"),
]


def avatar_upload_path(instance, filename):
    return f"avatars/{instance.user_id}/{filename}"


class Profile(models.Model):
    """A member's portal profile. One per Django user, created on first
    touch of /api/members/me/ rather than at sign-up time."""

    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="profile")
    avatar = models.ImageField(upload_to=avatar_upload_path, storage=avatar_storage, blank=True, null=True)
    name = models.CharField(max_length=150, blank=True)
    headline = models.CharField(max_length=200, blank=True)
    university = models.CharField(max_length=200, blank=True)
    major = models.CharField(max_length=200, blank=True)
    company = models.CharField(max_length=200, blank=True)
    role = models.CharField(max_length=200, blank=True)
    industry = models.CharField(max_length=200, blank=True)
    location = models.CharField(max_length=200, blank=True)
    bio = models.TextField(blank=True)
    skills = models.JSONField(default=list, blank=True)
    mentor_available = models.BooleanField(default=False)
    networking_available = models.BooleanField(default=False)
    referrals_available = models.BooleanField(default=False)
    is_professional = models.BooleanField(default=False)
    deactivated = models.BooleanField(default=False)

    def __str__(self):
        return self.name or f"profile:{self.user_id}"

    @property
    def availability(self):
        return {
            "mentor": self.mentor_available,
            "networking": self.networking_available,
            "referrals": self.referrals_available,
        }


class ConnectionRequest(models.Model):
    from_user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="sent_requests")
    to_user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="received_requests")
    request_type = models.CharField(max_length=20, choices=REQUEST_TYPE_CHOICES)
    message = models.TextField(blank=True)
    status = models.CharField(max_length=20, choices=REQUEST_STATUS_CHOICES, default="pending")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.from_user_id} -> {self.to_user_id} ({self.request_type}, {self.status})"


class Connection(models.Model):
    request = models.OneToOneField(ConnectionRequest, on_delete=models.CASCADE, related_name="connection")
    member_a = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="connections_as_a")
    member_b = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="connections_as_b")
    status = models.CharField(max_length=20, choices=CONNECTION_STATUS_CHOICES, default="active")
    since = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-since"]

    def includes(self, user_id):
        return user_id in (self.member_a_id, self.member_b_id)


class Message(models.Model):
    connection = models.ForeignKey(Connection, on_delete=models.CASCADE, related_name="messages")
    sender = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="sent_messages")
    text = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["created_at"]


def resume_upload_path(instance, filename):
    return f"resumes/{instance.user_id}/{filename}"


class Resume(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="resume")
    file = models.FileField(upload_to=resume_upload_path, storage=resume_storage)
    uploaded_at = models.DateTimeField(auto_now_add=True)
    shared_with = models.ManyToManyField(Connection, blank=True, related_name="shared_resumes")
