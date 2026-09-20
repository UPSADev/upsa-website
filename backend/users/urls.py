from django.urls import path

from .views import (
    signup_view,
    login_view,
    logout_view,
    current_user,
)


urlpatterns = [
    path("sign-up/", signup_view, name="signup"),
    path("login/", login_view, name="login"),
    path("logout/", logout_view, name="logout"),
    path("me/", current_user, name="current-user"),
]