from django.db.models import Q
from django.http import FileResponse, Http404, JsonResponse
from django.shortcuts import get_object_or_404
from rest_framework import generics, status
from rest_framework.decorators import api_view
from rest_framework.exceptions import ValidationError
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Connection, ConnectionRequest, Message, Profile, Resume
from .serializers import (
    ALLOWED_RESUME_CONTENT_TYPES,
    MAX_RESUME_SIZE,
    ConnectionRequestSerializer,
    ConnectionSerializer,
    MessageSerializer,
    ProfileSerializer,
    ResumeSerializer,
)


def health(request):
    return JsonResponse({"success": True, "message": "UPSA Django backend is running!"})


def _connection_or_404(request, pk):
    connection = get_object_or_404(Connection, pk=pk)
    if not connection.includes(request.user.id):
        raise Http404
    return connection


# --- Member / profile ---------------------------------------------------


class MyProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = ProfileSerializer

    def get_object(self):
        profile, _ = Profile.objects.get_or_create(user=self.request.user)
        return profile


class MemberProfileView(generics.RetrieveAPIView):
    serializer_class = ProfileSerializer
    queryset = Profile.objects.filter(deactivated=False)
    lookup_url_kwarg = "user_id"
    lookup_field = "user_id"


# --- Discover -------------------------------------------------------------


class ProfessionalListView(generics.ListAPIView):
    serializer_class = ProfileSerializer

    def get_queryset(self):
        qs = Profile.objects.filter(is_professional=True, deactivated=False).filter(
            Q(mentor_available=True) | Q(networking_available=True)
        )
        params = self.request.query_params
        if company := params.get("company"):
            qs = qs.filter(company__iexact=company)
        if industry := params.get("industry"):
            qs = qs.filter(industry__iexact=industry)
        if university := params.get("university"):
            qs = qs.filter(university__iexact=university)
        if params.get("availability.mentor") == "true":
            qs = qs.filter(mentor_available=True)
        if params.get("availability.networking") == "true":
            qs = qs.filter(networking_available=True)
        return qs.order_by("name")


# --- Connection requests ----------------------------------------------------


class ConnectionRequestListCreateView(generics.ListCreateAPIView):
    serializer_class = ConnectionRequestSerializer
    pagination_class = None

    def get_queryset(self):
        user = self.request.user
        if self.request.query_params.get("direction") == "outgoing":
            return ConnectionRequest.objects.filter(from_user=user)
        return ConnectionRequest.objects.filter(to_user=user)

    def perform_create(self, serializer):
        user = self.request.user
        to_user_id = serializer.validated_data["to_user_id"]
        if to_user_id == user.id:
            raise ValidationError("You can't send a request to yourself.")

        open_between = ConnectionRequest.objects.filter(status="pending").filter(
            Q(from_user=user, to_user_id=to_user_id) | Q(from_user_id=to_user_id, to_user=user)
        )
        if open_between.exists():
            raise ValidationError("There's already an open request between you two.")

        serializer.save(from_user=user)


@api_view(["POST"])
def accept_request(request, pk):
    req = get_object_or_404(ConnectionRequest, pk=pk, to_user=request.user, status="pending")
    req.status = "accepted"
    req.save(update_fields=["status"])
    connection = Connection.objects.create(request=req, member_a=req.from_user, member_b=req.to_user)
    return Response(ConnectionSerializer(connection).data, status=status.HTTP_201_CREATED)


@api_view(["POST"])
def decline_request(request, pk):
    req = get_object_or_404(ConnectionRequest, pk=pk, to_user=request.user, status="pending")
    req.status = "declined"
    req.save(update_fields=["status"])
    return Response(ConnectionRequestSerializer(req).data)


@api_view(["POST"])
def cancel_request(request, pk):
    req = get_object_or_404(ConnectionRequest, pk=pk, from_user=request.user, status="pending")
    req.status = "cancelled"
    req.save(update_fields=["status"])
    return Response(ConnectionRequestSerializer(req).data)


# --- Connections ------------------------------------------------------------


class ConnectionListView(generics.ListAPIView):
    serializer_class = ConnectionSerializer
    pagination_class = None

    def get_queryset(self):
        user = self.request.user
        return Connection.objects.filter(Q(member_a=user) | Q(member_b=user))


@api_view(["POST"])
def complete_connection(request, pk):
    connection = _connection_or_404(request, pk)
    connection.status = "completed"
    connection.save(update_fields=["status"])
    return Response(ConnectionSerializer(connection).data)


@api_view(["POST"])
def cancel_connection(request, pk):
    connection = _connection_or_404(request, pk)
    connection.status = "cancelled"
    connection.save(update_fields=["status"])
    return Response(ConnectionSerializer(connection).data)


# --- Messages ---------------------------------------------------------------


class ConnectionMessagesView(generics.ListCreateAPIView):
    serializer_class = MessageSerializer
    pagination_class = None

    def _connection(self):
        return _connection_or_404(self.request, self.kwargs["pk"])

    def get_queryset(self):
        return Message.objects.filter(connection=self._connection())

    def perform_create(self, serializer):
        connection = self._connection()
        if connection.status == "cancelled":
            raise ValidationError("This connection is cancelled, no new messages.")
        serializer.save(connection=connection, sender=self.request.user)


# --- Resume -------------------------------------------------------------


class ResumeView(APIView):
    def get(self, request):
        resume = Resume.objects.filter(user=request.user).first()
        if resume is None:
            return Response(None)
        return Response(ResumeSerializer(resume).data)

    def post(self, request):
        file = request.FILES.get("file")
        if not file:
            raise ValidationError("No file uploaded.")
        if file.content_type not in ALLOWED_RESUME_CONTENT_TYPES:
            raise ValidationError("Resume must be a PDF, DOC, or DOCX file.")
        if file.size > MAX_RESUME_SIZE:
            raise ValidationError("Resume must be under 5MB.")

        resume, _ = Resume.objects.update_or_create(user=request.user, defaults={"file": file})
        return Response(ResumeSerializer(resume).data, status=status.HTTP_201_CREATED)

    def delete(self, request):
        Resume.objects.filter(user=request.user).delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


@api_view(["POST"])
def share_resume(request, pk):
    connection = _connection_or_404(request, pk)
    resume = get_object_or_404(Resume, user=request.user)
    resume.shared_with.add(connection)
    return Response(status=status.HTTP_204_NO_CONTENT)


@api_view(["GET"])
def download_resume(request, pk):
    # Local dev storage only for now: streamed straight from disk with an
    # ownership/sharing check on every request. Once resumes move to R2,
    # swap this for handing back a short-lived signed URL instead.
    resume = get_object_or_404(Resume, pk=pk)
    is_owner = resume.user_id == request.user.id
    is_shared_with_me = resume.shared_with.filter(Q(member_a=request.user) | Q(member_b=request.user)).exists()
    if not (is_owner or is_shared_with_me):
        raise Http404

    filename = resume.file.name.rsplit("/", 1)[-1]
    return FileResponse(resume.file.open("rb"), as_attachment=True, filename=filename)
