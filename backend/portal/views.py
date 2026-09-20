from django.shortcuts import render

# Create your views here.
from django.http import JsonResponse


def home(request):
    return JsonResponse({
        "success": True,
        "message": "UPSA Django backend is running!"
    })