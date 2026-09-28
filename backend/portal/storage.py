"""Where uploads live.

Local disk in development. With the R2_* settings configured, uploads go to
Cloudflare R2 instead, split across two buckets on purpose:

- profile photos: a public bucket, so an <img> tag can load them by URL
- resumes: a private bucket with no public access; they are only ever served
  through the API after an ownership/sharing check
"""
from urllib.parse import urlparse

from django.conf import settings
from django.core.files.storage import FileSystemStorage


def _r2_storage(bucket, public):
    from storages.backends.s3 import S3Storage

    options = {
        "bucket_name": bucket,
        "endpoint_url": f"https://{settings.R2_ACCOUNT_ID}.r2.cloudflarestorage.com",
        "access_key": settings.R2_ACCESS_KEY_ID,
        "secret_key": settings.R2_SECRET_ACCESS_KEY,
        "region_name": "auto",
        "signature_version": "s3v4",
        "file_overwrite": False,
    }
    if public:
        base = urlparse(settings.R2_PUBLIC_BASE_URL)
        options.update(
            querystring_auth=False,
            custom_domain=base.netloc,
            url_protocol=f"{base.scheme}:",
            # Every upload is stored under a new name, so browsers and the CDN
            # can keep a photo for a year without ever serving a stale one.
            object_parameters={"CacheControl": "public, max-age=31536000, immutable"},
        )
    return S3Storage(**options)


def avatar_storage():
    if settings.R2_ENABLED:
        return _r2_storage(settings.R2_PUBLIC_BUCKET, public=True)
    return FileSystemStorage()


def resume_storage():
    if settings.R2_ENABLED:
        return _r2_storage(settings.R2_PRIVATE_BUCKET, public=False)
    return FileSystemStorage()
