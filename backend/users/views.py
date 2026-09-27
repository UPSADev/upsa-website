from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .clerk_auth import ClerkJWTAuthentication


@api_view(["GET"])
@authentication_classes([ClerkJWTAuthentication])
@permission_classes([IsAuthenticated])
def current_user(request):
    return Response(
        {
            "id": request.user.id,
            "clerk_id": request.auth.get("sub"),
        }
    )
