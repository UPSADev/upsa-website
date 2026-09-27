from rest_framework.decorators import api_view
from rest_framework.response import Response


@api_view(["GET"])
def current_user(request):
    return Response(
        {
            "id": request.user.id,
            "clerk_id": request.auth.get("sub"),
        }
    )
