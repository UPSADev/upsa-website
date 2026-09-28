from rest_framework.throttling import ScopedRateThrottle


class WriteScopedThrottle(ScopedRateThrottle):
    """Applies a view's `throttle_scope` limit to writes only.

    Reading and the portal's background refresh must never eat into the limit
    on sending requests or messages, so GET/HEAD/OPTIONS are always let through.
    """

    def allow_request(self, request, view):
        if request.method in ("GET", "HEAD", "OPTIONS"):
            return True
        return super().allow_request(request, view)
