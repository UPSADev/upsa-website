from django.contrib import admin

from .models import Connection, ConnectionRequest, Message, Profile, Resume

admin.site.register(Profile)
admin.site.register(ConnectionRequest)
admin.site.register(Connection)
admin.site.register(Message)
admin.site.register(Resume)
