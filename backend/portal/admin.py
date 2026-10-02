from django.contrib import admin

from .models import Connection, ConnectionRequest, Message, Profile, Resume


@admin.register(Profile)
class ProfileAdmin(admin.ModelAdmin):
    list_display = ["name", "user", "is_professional", "professional_requested", "company", "deactivated"]
    list_filter = ["is_professional", "professional_requested", "deactivated"]
    search_fields = ["name", "company", "user__username"]
    ordering = ["-professional_requested_at"]
    fieldsets = [
        (None, {"fields": ["user", "name", "headline", "bio", "skills"]}),
        ("Education", {"fields": ["university", "major"]}),
        ("Professional", {
            "fields": ["professional_requested", "professional_requested_at", "is_professional", "company", "role", "industry", "location"],
            "description": "professional_requested is set by the member (\"please list me\"). "
                            "is_professional is the verified flag that actually controls Discover - "
                            "review their details below, then tick it yourself.",
        }),
        ("Availability", {"fields": ["mentor_available", "networking_available", "referrals_available"]}),
        ("Account", {"fields": ["deactivated", "email_notifications", "avatar"]}),
    ]
    readonly_fields = ["professional_requested_at"]


admin.site.register(ConnectionRequest)
admin.site.register(Connection)
admin.site.register(Message)
admin.site.register(Resume)
