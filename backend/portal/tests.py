import tempfile
from unittest import mock

from django.contrib.auth import get_user_model
from django.core import mail
from django.core.cache import cache
from django.core.files.storage import FileSystemStorage
from django.test import SimpleTestCase, override_settings
from django.urls import reverse
from rest_framework.settings import api_settings
from rest_framework.test import APITestCase
from rest_framework.throttling import SimpleRateThrottle

from .models import Connection, ConnectionRequest, Message, Profile, Resume
from users.models import ClerkIdentity

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


@override_settings(MEDIA_ROOT=tempfile.mkdtemp())
class UploadCleanupTests(APITestCase):
    """Files must not outlive the database rows that point at them."""

    def setUp(self):
        self.user = User.objects.create(username="clerk:cleanup")
        self.client.force_authenticate(user=self.user)

    def resume_named(self, name):
        from django.core.files.uploadedfile import SimpleUploadedFile

        return SimpleUploadedFile(name, b"%PDF-1.4 resume", content_type="application/pdf")

    def upload_resume(self, name="cv.pdf"):
        with self.captureOnCommitCallbacks(execute=True):
            res = self.client.post(reverse("resume"), {"file": self.resume_named(name)}, format="multipart")
        self.assertEqual(res.status_code, 201)
        return Resume.objects.get(user=self.user)

    def test_replacing_a_resume_deletes_the_old_file(self):
        first = self.upload_resume("first.pdf")
        old_name, storage = first.file.name, first.file.storage
        self.assertTrue(storage.exists(old_name))

        second = self.upload_resume("second.pdf")
        self.assertNotEqual(second.file.name, old_name)
        self.assertFalse(storage.exists(old_name))
        self.assertTrue(storage.exists(second.file.name))

    def test_deleting_a_resume_deletes_its_file(self):
        resume = self.upload_resume()
        name, storage = resume.file.name, resume.file.storage
        with self.captureOnCommitCallbacks(execute=True):
            res = self.client.delete(reverse("resume"))
        self.assertEqual(res.status_code, 204)
        self.assertFalse(storage.exists(name))

    def test_replacing_and_removing_a_photo_deletes_the_file(self):
        with self.captureOnCommitCallbacks(execute=True):
            self.client.post(reverse("upload-avatar"), {"file": _fake_image()}, format="multipart")
        profile = Profile.objects.get(user=self.user)
        first, storage = profile.avatar.name, profile.avatar.storage
        self.assertTrue(storage.exists(first))

        with self.captureOnCommitCallbacks(execute=True):
            self.client.post(reverse("upload-avatar"), {"file": _fake_image()}, format="multipart")
        profile.refresh_from_db()
        second = profile.avatar.name
        self.assertNotEqual(first, second)
        self.assertFalse(storage.exists(first))
        self.assertTrue(storage.exists(second))

        with self.captureOnCommitCallbacks(execute=True):
            self.client.delete(reverse("upload-avatar"))
        self.assertFalse(storage.exists(second))

    def test_deleting_a_user_deletes_their_files(self):
        resume = self.upload_resume()
        with self.captureOnCommitCallbacks(execute=True):
            self.client.post(reverse("upload-avatar"), {"file": _fake_image()}, format="multipart")
        storage = resume.file.storage
        resume_name = resume.file.name
        avatar_name = Profile.objects.get(user=self.user).avatar.name
        self.assertTrue(storage.exists(resume_name) and storage.exists(avatar_name))

        with self.captureOnCommitCallbacks(execute=True):
            self.user.delete()
        self.assertFalse(storage.exists(resume_name))
        self.assertFalse(storage.exists(avatar_name))

    def test_a_rolled_back_change_keeps_the_file(self):
        from django.db import transaction

        resume = self.upload_resume()
        name, storage = resume.file.name, resume.file.storage
        with self.captureOnCommitCallbacks(execute=True):
            try:
                with transaction.atomic():
                    Resume.objects.get(pk=resume.pk).delete()
                    raise RuntimeError("boom")
            except RuntimeError:
                pass
        self.assertTrue(storage.exists(name))


class RateLimitTests(APITestCase):
    def setUp(self):
        cache.clear()
        self.addCleanup(cache.clear)
        tight = {**api_settings.DEFAULT_THROTTLE_RATES, "requests": "2/day", "messages": "2/min"}
        patcher = mock.patch.object(SimpleRateThrottle, "THROTTLE_RATES", tight)
        patcher.start()
        self.addCleanup(patcher.stop)
        self.user = User.objects.create(username="clerk:limited")
        self.client.force_authenticate(user=self.user)

    def test_sending_requests_is_limited_but_reading_them_is_not(self):
        targets = [User.objects.create(username=f"clerk:target{i}") for i in range(3)]

        def send(target):
            return self.client.post(
                reverse("requests"), {"toId": target.id, "requestType": "networking", "message": "hi"}, format="json"
            )

        self.assertEqual(send(targets[0]).status_code, 201)
        self.assertEqual(send(targets[1]).status_code, 201)
        self.assertEqual(send(targets[2]).status_code, 429)
        for _ in range(10):
            self.assertEqual(self.client.get(reverse("requests")).status_code, 200)

    def test_sending_messages_is_limited_but_the_refresh_is_not(self):
        other = User.objects.create(username="clerk:friend")
        req = ConnectionRequest.objects.create(from_user=self.user, to_user=other, request_type="networking")
        connection = Connection.objects.create(request=req, member_a=self.user, member_b=other)
        url = reverse("connection-messages", args=[connection.id])

        self.assertEqual(self.client.post(url, {"text": "one"}, format="json").status_code, 201)
        self.assertEqual(self.client.post(url, {"text": "two"}, format="json").status_code, 201)
        self.assertEqual(self.client.post(url, {"text": "three"}, format="json").status_code, 429)
        for _ in range(10):
            self.assertEqual(self.client.get(url).status_code, 200)

    def test_one_users_limit_does_not_affect_another(self):
        first, second = User.objects.create(username="clerk:t1"), User.objects.create(username="clerk:t2")
        body = {"toId": first.id, "requestType": "networking", "message": "hi"}
        self.client.post(reverse("requests"), body, format="json")
        self.client.post(reverse("requests"), {**body, "toId": second.id}, format="json")
        self.assertEqual(self.client.post(reverse("requests"), body, format="json").status_code, 429)

        someone_else = User.objects.create(username="clerk:someone-else")
        self.client.force_authenticate(user=someone_else)
        res = self.client.post(reverse("requests"), body, format="json")
        self.assertNotEqual(res.status_code, 429)


@override_settings(NOTIFICATIONS_ENABLED=True, NOTIFICATIONS_ASYNC=False, PORTAL_BASE_URL="https://portal.example.org")
class NotificationTests(APITestCase):
    def setUp(self):
        cache.clear()
        self.addCleanup(cache.clear)
        patcher = mock.patch("portal.notifications._clerk_email", side_effect=lambda clerk_id: f"{clerk_id}@example.com")
        self.clerk_email = patcher.start()
        self.addCleanup(patcher.stop)
        self.sender = self.member("sender", "Sam Sender")
        self.recipient = self.member("recipient", "Rita Recipient")

    def member(self, key, name):
        user = User.objects.create(username=f"clerk:{key}")
        ClerkIdentity.objects.create(clerk_id=key, user=user)
        Profile.objects.create(user=user, name=name)
        return user

    def send_request(self, message="secret details"):
        self.client.force_authenticate(user=self.sender)
        with self.captureOnCommitCallbacks(execute=True):
            return self.client.post(
                reverse("requests"), {"toId": self.recipient.id, "requestType": "mentorship", "message": message}, format="json"
            )

    def connect(self):
        req = ConnectionRequest.objects.create(from_user=self.sender, to_user=self.recipient, request_type="networking", status="accepted")
        return Connection.objects.create(request=req, member_a=self.sender, member_b=self.recipient)

    def test_a_new_request_emails_the_recipient_without_leaking_the_message(self):
        self.assertEqual(self.send_request("my private pitch").status_code, 201)
        self.assertEqual(len(mail.outbox), 1)
        email = mail.outbox[0]
        self.assertEqual(email.to, ["recipient@example.com"])
        self.assertIn("Sam Sender", email.subject)
        self.assertIn("https://portal.example.org/portal/requests", email.body)
        self.assertNotIn("my private pitch", email.subject + email.body)

    def test_members_can_opt_out(self):
        Profile.objects.filter(user=self.recipient).update(email_notifications=False)
        self.send_request()
        self.assertEqual(mail.outbox, [])

    def test_accepting_emails_the_requester(self):
        self.send_request()
        mail.outbox.clear()
        req = ConnectionRequest.objects.get()
        self.client.force_authenticate(user=self.recipient)
        with self.captureOnCommitCallbacks(execute=True):
            res = self.client.post(reverse("request-accept", args=[req.id]))
        self.assertEqual(res.status_code, 201)
        self.assertEqual([m.to for m in mail.outbox], [["sender@example.com"]])
        self.assertIn("accepted", mail.outbox[0].subject)

    def test_a_burst_of_messages_sends_one_email(self):
        connection = self.connect()
        url = reverse("connection-messages", args=[connection.id])
        self.client.force_authenticate(user=self.sender)
        for text in ("one", "two", "three"):
            with self.captureOnCommitCallbacks(execute=True):
                self.assertEqual(self.client.post(url, {"text": text}, format="json").status_code, 201)
        self.assertEqual(len(mail.outbox), 1)
        self.assertEqual(mail.outbox[0].to, ["recipient@example.com"])
        self.assertNotIn("one", mail.outbox[0].body.replace("Open it here", ""))

    def test_a_mail_failure_never_breaks_the_request(self):
        with mock.patch("portal.notifications.send_mail", side_effect=RuntimeError("smtp is down")):
            res = self.send_request()
        self.assertEqual(res.status_code, 201)
        self.assertEqual(ConnectionRequest.objects.count(), 1)

    def test_a_multiline_name_cannot_inject_email_headers(self):
        Profile.objects.filter(user=self.sender).update(name="Sam" + chr(10) + "Bcc: attacker@example.com")
        self.send_request()
        self.assertEqual(len(mail.outbox), 1)
        self.assertNotIn(chr(10), mail.outbox[0].subject)
        self.assertEqual(mail.outbox[0].bcc, [])

    @override_settings(NOTIFICATIONS_ENABLED=False)
    def test_nothing_is_sent_or_looked_up_when_disabled(self):
        self.send_request()
        self.assertEqual(mail.outbox, [])
        self.clerk_email.assert_not_called()

    def test_the_preference_is_private_to_its_owner(self):
        self.client.force_authenticate(user=self.sender)
        own = self.client.get(reverse("my-profile"))
        self.assertIs(own.data["emailNotifications"], True)
        others = self.client.get(reverse("member-profile", args=[self.recipient.id]))
        self.assertNotIn("emailNotifications", others.data)

        res = self.client.patch(reverse("my-profile"), {"emailNotifications": False}, format="json")
        self.assertEqual(res.status_code, 200)
        self.assertIs(res.data["emailNotifications"], False)
        self.assertFalse(Profile.objects.get(user=self.sender).email_notifications)


@override_settings(MEDIA_ROOT=tempfile.mkdtemp())
class ScalingTests(APITestCase):
    """The guarantees that keep the portal fast with many members."""

    def setUp(self):
        cache.clear()
        self.addCleanup(cache.clear)
        self.me = User.objects.create(username="clerk:me")
        self.friend = User.objects.create(username="clerk:friend")
        self.client.force_authenticate(user=self.me)

    def connect(self, other=None):
        other = other or self.friend
        req = ConnectionRequest.objects.create(from_user=self.me, to_user=other, request_type="networking", status="accepted")
        return Connection.objects.create(request=req, member_a=self.me, member_b=other)

    def image_upload(self, size, mode="RGB", name="photo.png", content_type="image/png"):
        import io

        from django.core.files.uploadedfile import SimpleUploadedFile
        from PIL import Image

        buffer = io.BytesIO()
        Image.new(mode, size, "green" if mode == "RGB" else 128).save(buffer, "PNG")
        return SimpleUploadedFile(name, buffer.getvalue(), content_type=content_type)

    # --- the cheap "has anything changed?" check -----------------------------

    def test_sync_is_two_queries_however_much_data_there_is(self):
        connection = self.connect()
        Message.objects.bulk_create([Message(connection=connection, sender=self.me, text=f"m{i}") for i in range(50)])
        with self.assertNumQueries(2):
            res = self.client.get(reverse("sync"))
        self.assertEqual(res.status_code, 200)

    def test_sync_version_moves_when_something_changes(self):
        empty = self.client.get(reverse("sync")).data["version"]
        self.assertEqual(empty, "0")

        self.client.force_authenticate(user=self.friend)
        self.client.post(reverse("requests"), {"toId": self.me.id, "requestType": "networking", "message": "hi"}, format="json")
        self.client.force_authenticate(user=self.me)
        after_request = self.client.get(reverse("sync")).data["version"]
        self.assertNotEqual(after_request, empty)

        request_id = ConnectionRequest.objects.get().id
        self.client.post(reverse("request-accept", args=[request_id]))
        after_accept = self.client.get(reverse("sync")).data["version"]
        self.assertNotEqual(after_accept, after_request)

        connection = Connection.objects.get()
        self.client.post(reverse("connection-messages", args=[connection.id]), {"text": "hello"}, format="json")
        after_message = self.client.get(reverse("sync")).data["version"]
        self.assertNotEqual(after_message, after_accept)

        # nothing changed since: same version, so the portal downloads nothing
        self.assertEqual(self.client.get(reverse("sync")).data["version"], after_message)

    def test_sync_ignores_other_peoples_activity(self):
        a, b = User.objects.create(username="clerk:a"), User.objects.create(username="clerk:b")
        before = self.client.get(reverse("sync")).data["version"]
        req = ConnectionRequest.objects.create(from_user=a, to_user=b, request_type="networking")
        Connection.objects.create(request=req, member_a=a, member_b=b)
        self.assertEqual(self.client.get(reverse("sync")).data["version"], before)

    def test_sync_requires_a_signed_in_member(self):
        self.client.force_authenticate(user=None)
        self.assertIn(self.client.get(reverse("sync")).status_code, (401, 403))

    # --- conversation previews and bounded threads -----------------------------

    def test_connection_list_carries_the_latest_message_preview(self):
        connection = self.connect()
        first = self.client.get(reverse("connections")).data[0]
        self.assertIsNone(first["lastMessage"])

        self.client.post(reverse("connection-messages", args=[connection.id]), {"text": "x" * 300}, format="json")
        preview = self.client.get(reverse("connections")).data[0]["lastMessage"]
        self.assertEqual(preview["senderId"], self.me.id)
        self.assertEqual(len(preview["text"]), 140)

    def test_connection_list_needs_no_query_per_connection(self):
        for i in range(10):
            self.connect(User.objects.create(username=f"clerk:c{i}"))
        with self.assertNumQueries(1):
            res = self.client.get(reverse("connections"))
        self.assertEqual(len(res.data), 10)

    def test_a_long_conversation_returns_only_the_latest_messages(self):
        connection = self.connect()
        Message.objects.bulk_create([Message(connection=connection, sender=self.me, text=f"m{i}") for i in range(250)])
        res = self.client.get(reverse("connection-messages", args=[connection.id]))
        self.assertEqual(len(res.data), 200)
        self.assertEqual(res.data[0]["text"], "m50")
        self.assertEqual(res.data[-1]["text"], "m249")

    # --- profile photos --------------------------------------------------------

    def test_photos_are_shrunk_to_a_small_webp(self):
        res = self.client.post(reverse("upload-avatar"), {"file": self.image_upload((1600, 900))}, format="multipart")
        self.assertEqual(res.status_code, 201)

        from PIL import Image

        profile = Profile.objects.get(user=self.me)
        self.assertTrue(profile.avatar.name.endswith(".webp"))
        with profile.avatar.open("rb") as stored:
            image = Image.open(stored)
            self.assertEqual(image.format, "WEBP")
            self.assertLessEqual(max(image.size), 256)
            self.assertAlmostEqual(image.size[0] / image.size[1], 1600 / 900, places=1)
        self.assertLess(profile.avatar.size, 20_000)

    def test_a_file_that_is_not_really_an_image_is_refused(self):
        from django.core.files.uploadedfile import SimpleUploadedFile

        fake = SimpleUploadedFile("photo.png", b"this is not an image at all", content_type="image/png")
        res = self.client.post(reverse("upload-avatar"), {"file": fake}, format="multipart")
        self.assertEqual(res.status_code, 400)
        self.assertFalse(Profile.objects.filter(user=self.me).exclude(avatar="").exists())

    def test_absurdly_large_dimensions_are_refused(self):
        res = self.client.post(reverse("upload-avatar"), {"file": self.image_upload((6000, 5000), mode="L")}, format="multipart")
        self.assertEqual(res.status_code, 400)


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
        self.assertIn("immutable", storage.object_parameters["CacheControl"])

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
