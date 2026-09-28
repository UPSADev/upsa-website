"""Keep uploaded files in step with their database rows.

Django deletes rows but never the files they point at, so replacing a resume
or photo, removing it, or deleting a user (which cascades) would leave the
old file behind forever - on R2 that's stored data nobody can reach anymore.
Deletion waits for the transaction to commit, so a rolled-back change can
never destroy a file that is still in use.
"""
from django.db import transaction
from django.db.models.signals import post_delete, pre_save
from django.dispatch import receiver

from .models import Profile, Resume


def _delete_after_commit(storage, name):
    if name:
        transaction.on_commit(lambda: storage.delete(name))


def _delete_replaced_file(model, instance, field_name, update_fields):
    if not instance.pk or (update_fields is not None and field_name not in update_fields):
        return
    old_name = model.objects.filter(pk=instance.pk).values_list(field_name, flat=True).first()
    new_file = getattr(instance, field_name)
    if old_name and old_name != (new_file.name if new_file else ""):
        _delete_after_commit(model._meta.get_field(field_name).storage, old_name)


@receiver(pre_save, sender=Resume)
def delete_replaced_resume(sender, instance, update_fields=None, **kwargs):
    _delete_replaced_file(Resume, instance, "file", update_fields)


@receiver(pre_save, sender=Profile)
def delete_replaced_avatar(sender, instance, update_fields=None, **kwargs):
    _delete_replaced_file(Profile, instance, "avatar", update_fields)


@receiver(post_delete, sender=Resume)
def delete_resume_file(sender, instance, **kwargs):
    if instance.file:
        _delete_after_commit(instance.file.storage, instance.file.name)


@receiver(post_delete, sender=Profile)
def delete_avatar_file(sender, instance, **kwargs):
    if instance.avatar:
        _delete_after_commit(instance.avatar.storage, instance.avatar.name)
