from django.db.models.signals import post_save
from django.dispatch import receiver
from django.contrib.auth import get_user_model
from .models import ProfessionalProfile

User = get_user_model()


@receiver(post_save, sender=User)
def create_professional_profile(sender, instance, created, **kwargs):
    """
    Crea automáticamente un perfil profesional cuando se crea un usuario con rol 'professional'.
    """
    if created and instance.role == 'professional':
        if not hasattr(instance, 'professional_profile'):
            ProfessionalProfile.objects.create(user=instance)


@receiver(post_save, sender=User)
def save_professional_profile(sender, instance, **kwargs):
    """
    Actualiza el perfil profesional cuando se actualiza un usuario con rol 'professional'.
    """
    if instance.role == 'professional':
        if hasattr(instance, 'professional_profile'):
            instance.professional_profile.save()
        else:
            ProfessionalProfile.objects.create(user=instance)
