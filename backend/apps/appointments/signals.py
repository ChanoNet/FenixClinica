from django.db.models.signals import post_save, pre_save
from django.dispatch import receiver
from django.core.mail import send_mail
from django.conf import settings
from django.template.loader import render_to_string
from django.utils import timezone

from .models import Appointment


@receiver(post_save, sender=Appointment)
def send_appointment_notification(sender, instance, created, **kwargs):
    """
    Envía notificaciones por correo cuando se crea o actualiza una cita.
    """
    # Solo enviar notificaciones si el envío de correos está configurado
    if not settings.EMAIL_HOST_USER:
        return
        
    patient_email = instance.patient.email
    professional_email = instance.professional.email
    
    # Preparar datos para el correo
    context = {
        'patient_name': instance.patient.get_full_name(),
        'professional_name': instance.professional.get_full_name(),
        'appointment_date': instance.start_time.strftime('%d/%m/%Y'),
        'appointment_time': instance.start_time.strftime('%H:%M'),
        'appointment_status': instance.get_status_display(),
    }
    
    # Si es una nueva cita
    if created:
        # Notificación al paciente
        patient_subject = "Confirmación de cita en FenixClinicas"
        patient_message = render_to_string('emails/appointment_created_patient.html', context)
        
        # Notificación al profesional
        professional_subject = "Nueva cita programada en FenixClinicas"
        professional_message = render_to_string('emails/appointment_created_professional.html', context)
        
        try:
            # Enviar al paciente
            send_mail(
                patient_subject,
                patient_message,
                settings.DEFAULT_FROM_EMAIL,
                [patient_email],
                html_message=patient_message,
                fail_silently=True,
            )
            
            # Enviar al profesional
            send_mail(
                professional_subject,
                professional_message,
                settings.DEFAULT_FROM_EMAIL,
                [professional_email],
                html_message=professional_message,
                fail_silently=True,
            )
        except Exception:
            # Capturar cualquier error en el envío para que no afecte la operación principal
            pass
    
    # Si se cambió el estado de la cita
    elif instance.tracker.has_changed('status'):
        old_status = instance.tracker.previous('status')
        new_status = instance.status
        
        # Definir el asunto según el cambio de estado
        if new_status == 'confirmed':
            subject = "Cita confirmada en FenixClinicas"
        elif new_status == 'cancelled':
            subject = "Cita cancelada en FenixClinicas"
        elif new_status == 'completed':
            subject = "Cita completada en FenixClinicas"
        else:
            subject = "Actualización de cita en FenixClinicas"
        
        # Agregar información adicional al contexto
        context['old_status'] = dict(Appointment.STATUS_CHOICES).get(old_status)
        context['new_status'] = dict(Appointment.STATUS_CHOICES).get(new_status)
        
        # Mensaje para el paciente
        patient_message = render_to_string('emails/appointment_status_changed.html', context)
        
        try:
            # Enviar notificación al paciente
            send_mail(
                subject,
                patient_message,
                settings.DEFAULT_FROM_EMAIL,
                [patient_email],
                html_message=patient_message,
                fail_silently=True,
            )
        except Exception:
            pass


@receiver(pre_save, sender=Appointment)
def setup_appointment_tracking(sender, instance, **kwargs):
    """
    Configura el seguimiento de cambios para la cita.
    """
    if not hasattr(instance, 'tracker'):
        from model_utils.tracker import FieldTracker
        instance.tracker = FieldTracker(fields=['status'])
