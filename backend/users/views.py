from django.shortcuts import render

# Create your views here.
from django.contrib.auth import authenticate, login, logout
from django.http import JsonResponse
from django.views.decorators.http import require_POST
import json


@require_POST
def login_view(request):
    data = json.loads(request.body)

    username = data.get("username")
    password = data.get("password")

    user = authenticate(
        request,
        username=username,
        password=password
    )

    if user is None:
        return JsonResponse(
            {"error": "Invalid username or password"},
            status=401
        )

    login(request, user)

    return JsonResponse({
        "success": True,
        "user": {
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "first_name": user.first_name,
            "last_name": user.last_name,
        }
    })

@require_POST
def logout_view(request):
    logout(request)

    return JsonResponse({
        "success": True
    })


def current_user(request):
    if not request.user.is_authenticated:
        return JsonResponse(
            {"authenticated": False},
            status=401
        )

    return JsonResponse({
        "authenticated": True,
        "user": {
            "id": request.user.id,
            "username": request.user.username,
            "email": request.user.email,
            "first_name": request.user.first_name,
            "last_name": request.user.last_name,
        }
    })


def current_user(request):
    if not request.user.is_authenticated:
        return JsonResponse(
            {"authenticated": False},
            status=401
        )

    return JsonResponse({
        "authenticated": True,
        "user": {
            "id": request.user.id,
            "username": request.user.username,
            "email": request.user.email,
            "first_name": request.user.first_name,
            "last_name": request.user.last_name,
        }
    })


import json

from django.contrib.auth.models import User
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST


@csrf_exempt
@require_POST
def signup_view(request):

    try:
        data = json.loads(request.body)
    except json.JSONDecodeError:
        return JsonResponse(
            {"error": "Invalid request data."},
            status=400
        )

    first_name = data.get("first_name", "").strip()
    last_name = data.get("last_name", "").strip()
    email = data.get("email", "").strip().lower()
    password = data.get("password", "")

    if not first_name:
        return JsonResponse({"error": "First name is required."}, status=400)

    if not last_name:
        return JsonResponse({"error": "Last name is required."}, status=400)

    if not email:
        return JsonResponse({"error": "Email is required."}, status=400)

    if not password:
        return JsonResponse({"error": "Password is required."}, status=400)

    if len(password) < 8:
        return JsonResponse(
            {"error": "Password must be at least 8 characters."},
            status=400
        )

    if User.objects.filter(email=email).exists():
        return JsonResponse(
            {"error": "An account with this email already exists."},
            status=400
        )

    user = User.objects.create_user(
        username=email,
        email=email,
        password=password,
        first_name=first_name,
        last_name=last_name,
    )

    return JsonResponse({
        "success": True,
        "message": "Account created successfully.",
        "user": {
            "id": user.id,
            "email": user.email,
            "first_name": user.first_name,
            "last_name": user.last_name,
        }
    }, status=201)