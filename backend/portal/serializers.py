from rest_framework import serializers

from .models import (
    REQUEST_TYPE_CHOICES,
    Connection,
    ConnectionRequest,
    Message,
    Profile,
    Resume,
)

MAX_RESUME_SIZE = 5 * 1024 * 1024
ALLOWED_RESUME_CONTENT_TYPES = {
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
}

MAX_AVATAR_SIZE = 5 * 1024 * 1024
ALLOWED_AVATAR_CONTENT_TYPES = {"image/jpeg", "image/png", "image/webp"}


class AvailabilitySerializer(serializers.Serializer):
    mentor = serializers.BooleanField()
    networking = serializers.BooleanField()
    referrals = serializers.BooleanField()


class ProfileSerializer(serializers.ModelSerializer):
    id = serializers.IntegerField(source="user_id", read_only=True)
    availability = AvailabilitySerializer()
    isProfessional = serializers.BooleanField(source="is_professional")
    avatarUrl = serializers.SerializerMethodField()
    hasAvatar = serializers.SerializerMethodField()
    emailNotifications = serializers.BooleanField(source="email_notifications", required=False)

    class Meta:
        model = Profile
        fields = [
            "id",
            "name",
            "headline",
            "university",
            "major",
            "company",
            "role",
            "industry",
            "location",
            "bio",
            "skills",
            "availability",
            "isProfessional",
            "deactivated",
            "avatarUrl",
            "hasAvatar",
            "emailNotifications",
        ]

    def to_representation(self, instance):
        data = super().to_representation(instance)
        # A private preference: only the owner ever sees it.
        request = self.context.get("request")
        if request is None or request.user.id != instance.user_id:
            data.pop("emailNotifications", None)
        return data

    def get_avatarUrl(self, obj):
        return obj.avatar.url if obj.avatar else None

    def get_hasAvatar(self, obj):
        return bool(obj.avatar)

    def update(self, instance, validated_data):
        availability = validated_data.pop("availability", None)
        if availability is not None:
            instance.mentor_available = availability["mentor"]
            instance.networking_available = availability["networking"]
            instance.referrals_available = availability["referrals"]
        for field, value in validated_data.items():
            setattr(instance, field, value)
        instance.save()
        return instance


class ConnectionRequestSerializer(serializers.ModelSerializer):
    fromId = serializers.IntegerField(source="from_user_id", read_only=True)
    toId = serializers.IntegerField(source="to_user_id")
    requestType = serializers.ChoiceField(source="request_type", choices=REQUEST_TYPE_CHOICES)
    createdAt = serializers.DateTimeField(source="created_at", read_only=True)

    class Meta:
        model = ConnectionRequest
        fields = ["id", "fromId", "toId", "requestType", "message", "status", "createdAt"]
        read_only_fields = ["id", "status"]


class ConnectionSerializer(serializers.ModelSerializer):
    requestId = serializers.IntegerField(source="request_id", read_only=True)
    memberIds = serializers.SerializerMethodField()
    lastMessage = serializers.SerializerMethodField()

    class Meta:
        model = Connection
        fields = ["id", "requestId", "memberIds", "status", "since", "lastMessage"]

    def get_lastMessage(self, obj):
        if obj.last_message_at is None:
            return None
        return {"text": obj.last_message_text, "senderId": obj.last_message_sender_id, "createdAt": obj.last_message_at}

    def get_memberIds(self, obj):
        return [obj.member_a_id, obj.member_b_id]


class MessageSerializer(serializers.ModelSerializer):
    connectionId = serializers.IntegerField(source="connection_id", read_only=True)
    senderId = serializers.IntegerField(source="sender_id", read_only=True)
    createdAt = serializers.DateTimeField(source="created_at", read_only=True)

    class Meta:
        model = Message
        fields = ["id", "connectionId", "senderId", "text", "createdAt"]


class ResumeSerializer(serializers.ModelSerializer):
    fileName = serializers.SerializerMethodField()
    sizeLabel = serializers.SerializerMethodField()
    uploadedAt = serializers.DateTimeField(source="uploaded_at", read_only=True)
    sharedWith = serializers.PrimaryKeyRelatedField(source="shared_with", many=True, read_only=True)

    class Meta:
        model = Resume
        fields = ["id", "fileName", "sizeLabel", "uploadedAt", "sharedWith"]

    def get_fileName(self, obj):
        return obj.file.name.rsplit("/", 1)[-1]

    def get_sizeLabel(self, obj):
        size = obj.file.size
        if size < 1024:
            return f"{size} B"
        if size < 1024 * 1024:
            return f"{size // 1024} KB"
        return f"{size / (1024 * 1024):.1f} MB"
