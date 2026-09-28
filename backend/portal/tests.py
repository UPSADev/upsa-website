import tempfile

from django.contrib.auth import get_user_model
from django.core.files.storage import FileSystemStorage
from django.test import SimpleTestCase, override_settings
from django.urls import reverse
from rest_framework.test import APITestCase

from .models import Connection, ConnectionRequest, Resume
from .storage import avatar_storage, resume_storage

User = get_user_model()


@override_settings(MEDIA_ROOT=tempfile.mkdtemp())
class PortalApiTests(APITestCase):
    def setUp(self):
        self.student = User.objects.create(username="clerk:student")
        self.mentor = User.objects.create(username="clerk:mentor")

    def as_(self, user):
        self.client.force_authenticate(user=user)

    # --- profile ---------------------------------------------------------

    def test_profile_created_lazily_and_patchable(self):
        self.as_(self.student)
        res = self.client.get(reverse("my-profile"))
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.data["id"], self.student.id)

        res = self.client.patch(
            reverse("my-profile"),
            {"bio": "Backend curious junior", "availability": {"mentor": False, "networking": True, "referrals": False}},
            format="json",
        )
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.data["bio"], "Backend curious junior")
        self.assertEqual(res.data["availability"], {"mentor": False, "networking": True, "referrals": False})

    def test_avatar_upload_validation(self):
        self.as_(self.student)

        wrong_type = _fake_file(b"not an image", "photo.txt", "text/plain")
        res = self.client.post(reverse("upload-avatar"), {"file": wrong_type}, format="multipart")
        self.assertEqual(res.status_code, 400)

        too_big = _fake_image(mb=6)
        res = self.client.post(reverse("upload-avatar"), {"file": too_big}, format="multipart")
        self.assertEqual(res.status_code, 400)

        good = _fake_image()
        res = self.client.post(reverse("upload-avatar"), {"file": good}, format="multipart")
        self.assertEqual(res.status_code, 201)
        self.assertTrue(res.data["hasAvatar"])
        self.assertIsNotNone(res.data["avatarUrl"])

    def test_avatar_can_be_removed(self):
        self.as_(self.student)
        self.client.post(reverse("upload-avatar"), {"file": _fake_image()}, format="multipart")

        res = self.client.delete(reverse("upload-avatar"))
        self.assertEqual(res.status_code, 200)
        self.assertFalse(res.data["hasAvatar"])
        self.assertIsNone(res.data["avatarUrl"])

        # removing when there's nothing to remove is a harmless no-op
        res = self.client.delete(reverse("upload-avatar"))
        self.assertEqual(res.status_code, 200)
        self.assertFalse(res.data["hasAvatar"])

    # --- discover ----------------------------------------------------------

    def test_discover_only_shows_opted_in_professionals(self):
        self.as_(self.mentor)
        self.client.patch(
            reverse("my-profile"),
            {
                "isProfessional": True,
                "company": "Microsoft",
                "availability": {"mentor": True, "networking": False, "referrals": False},
            },
            format="json",
        )

        hidden = User.objects.create(username="clerk:hidden-pro")
        self.as_(hidden)
        self.client.patch(
            reverse("my-profile"),
            {"isProfessional": True, "availability": {"mentor": False, "networking": False, "referrals": False}},
            format="json",
        )

        self.as_(self.student)
        res = self.client.get(reverse("professionals"))
        self.assertEqual(res.status_code, 200)
        ids = [m["id"] for m in res.data["results"]]
        self.assertIn(self.mentor.id, ids)
        self.assertNotIn(hidden.id, ids)

    def test_discover_search_matches_name_and_skills(self):
        self.as_(self.mentor)
        self.client.patch(
            reverse("my-profile"),
            {
                "name": "Mentor Mia",
                "isProfessional": True,
                "skills": ["Distributed Systems", "Go"],
                "availability": {"mentor": True, "networking": False, "referrals": False},
            },
            format="json",
        )
        self.as_(self.student)

        def found(term):
            res = self.client.get(reverse("professionals"), {"search": term})
            return [m["id"] for m in res.data["results"]]

        self.assertEqual(found("mia"), [self.mentor.id])
        self.assertEqual(found("distributed"), [self.mentor.id])
        self.assertEqual(found("nobody-has-this"), [])

    def test_discover_is_paginated_at_twenty(self):
        for i in range(25):
            pro = User.objects.create(username=f"clerk:pro{i}")
            self.as_(pro)
            self.client.patch(
                reverse("my-profile"),
                {"name": f"Pro {i:02d}", "isProfessional": True, "availability": {"mentor": True, "networking": False, "referrals": False}},
                format="json",
            )
        self.as_(self.student)
        page1 = self.client.get(reverse("professionals"))
        self.assertEqual(len(page1.data["results"]), 20)
        self.assertIsNotNone(page1.data["next"])
        page2 = self.client.get(reverse("professionals"), {"page": 2})
        self.assertEqual(len(page2.data["results"]), 5)
        self.assertIsNone(page2.data["next"])

    # --- requests / connections / messages ----------------------------------

    def test_full_request_to_message_flow(self):
        self.as_(self.student)
        res = self.client.post(
            reverse("requests"),
            {"toId": self.mentor.id, "requestType": "mentorship", "message": "hi!"},
            format="json",
        )
        self.assertEqual(res.status_code, 201)
        request_id = res.data["id"]

        # can't open a second request while one's already pending
        dupe = self.client.post(
            reverse("requests"),
            {"toId": self.mentor.id, "requestType": "networking", "message": "again"},
            format="json",
        )
        self.assertEqual(dupe.status_code, 400)

        # mentor sees it as incoming
        self.as_(self.mentor)
        incoming = self.client.get(reverse("requests"))
        self.assertEqual(len(incoming.data), 1)

        accept = self.client.post(reverse("request-accept", args=[request_id]))
        self.assertEqual(accept.status_code, 201)
        connection_id = accept.data["id"]
        self.assertEqual(set(accept.data["memberIds"]), {self.student.id, self.mentor.id})

        # a stranger can't touch this connection
        stranger = User.objects.create(username="clerk:stranger")
        self.as_(stranger)
        blocked = self.client.get(reverse("connection-messages", args=[connection_id]))
        self.assertEqual(blocked.status_code, 404)

        self.as_(self.student)
        sent = self.client.post(reverse("connection-messages", args=[connection_id]), {"text": "thanks!"}, format="json")
        self.assertEqual(sent.status_code, 201)

        self.as_(self.mentor)
        thread = self.client.get(reverse("connection-messages", args=[connection_id]))
        self.assertEqual(len(thread.data), 1)
        self.assertEqual(thread.data[0]["text"], "thanks!")

        cancel = self.client.post(reverse("connection-cancel", args=[connection_id]))
        self.assertEqual(cancel.data["status"], "cancelled")

        blocked_msg = self.client.post(reverse("connection-messages", args=[connection_id]), {"text": "still there?"}, format="json")
        self.assertEqual(blocked_msg.status_code, 400)

    # --- resume --------------------------------------------------------------

    def test_resume_upload_validation_and_sharing(self):
        self.as_(self.student)

        too_big = _fake_file(b"x" * (6 * 1024 * 1024), "resume.pdf", "application/pdf")
        res = self.client.post(reverse("resume"), {"file": too_big}, format="multipart")
        self.assertEqual(res.status_code, 400)

        wrong_type = _fake_file(b"not a resume", "resume.exe", "application/octet-stream")
        res = self.client.post(reverse("resume"), {"file": wrong_type}, format="multipart")
        self.assertEqual(res.status_code, 400)

        good = _fake_file(b"%PDF-1.4 fake resume", "resume.pdf", "application/pdf")
        res = self.client.post(reverse("resume"), {"file": good}, format="multipart")
        self.assertEqual(res.status_code, 201)
        self.assertEqual(res.data["fileName"], "resume.pdf")

        # not shared yet, mentor can't get it
        req = ConnectionRequest.objects.create(from_user=self.student, to_user=self.mentor, request_type="mentorship")
        connection = Connection.objects.create(request=req, member_a=self.student, member_b=self.mentor)
        resume_id = Resume.objects.get(user=self.student).id

        self.as_(self.mentor)
        denied = self.client.get(reverse("resume-download", args=[resume_id]))
        self.assertEqual(denied.status_code, 404)

        self.as_(self.student)
        self.client.post(reverse("connection-share-resume", args=[connection.id]))

        self.as_(self.mentor)
        allowed = self.client.get(reverse("resume-download", args=[resume_id]))
        self.assertEqual(allowed.status_code, 200)


def _fake_file(content, name, content_type):
    from django.core.files.uploadedfile import SimpleUploadedFile

    return SimpleUploadedFile(name, content, content_type=content_type)


def _fake_image(mb=None):
    import io

    from PIL import Image

    buffer = io.BytesIO()
    Image.new("RGB", (10, 10), color="green").save(buffer, format="PNG")
    content = buffer.getvalue()
    if mb:
        content += b"\0" * (mb * 1024 * 1024)
    return _fake_file(content, "photo.png", "image/png")


R2_TEST_SETTINGS = dict(
    R2_ENABLED=True,
    R2_ACCOUNT_ID="acct",
    R2_ACCESS_KEY_ID="key",
    R2_SECRET_ACCESS_KEY="secret",
    R2_PRIVATE_BUCKET="private-bkt",
    R2_PUBLIC_BUCKET="public-bkt",
    R2_PUBLIC_BASE_URL="https://photos.example.org",
)


class StorageSelectionTests(SimpleTestCase):
    @override_settings(**R2_TEST_SETTINGS)
    def test_photos_use_the_public_bucket_with_plain_urls(self):
        storage = avatar_storage()
        self.assertEqual(storage.bucket_name, "public-bkt")
        self.assertEqual(storage.url("avatars/1/me.png"), "https://photos.example.org/avatars/1/me.png")

    @override_settings(**R2_TEST_SETTINGS)
    def test_resumes_use_the_private_bucket_with_signed_urls(self):
        storage = resume_storage()
        self.assertEqual(storage.bucket_name, "private-bkt")
        url = storage.url("resumes/1/cv.pdf")
        self.assertIn("acct.r2.cloudflarestorage.com", url)
        self.assertIn("X-Amz-Signature", url)

    @override_settings(R2_ENABLED=False)
    def test_falls_back_to_local_disk_when_r2_is_not_configured(self):
        self.assertIsInstance(avatar_storage(), FileSystemStorage)
        self.assertIsInstance(resume_storage(), FileSystemStorage)
