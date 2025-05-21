from django.db import models
from django.conf import settings
from django.utils.translation import gettext_lazy as _
from django.core.exceptions import ValidationError
from django.utils import timezone


class ProfessionalAvailability(models.Model):
    """
    Modelo para gestionar la disponibilidad de los profesionales.
    Define los bloques de tiempo en los que un profesional está disponible para citas.
    """
    DAY_CHOICES = (
        (0, _('Lunes')),
        (1, _('Martes')),
        (2, _('Miércoles')),
        (3, _('Jueves')),
        (4, _('Viernes')),
        (5, _('Sábado')),
        (6, _('Domingo')),
    )
    
    professional = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.CASCADE,
        related_name='availabilities',
        limit_choices_to={'role': 'professional'}
    )
    day_of_week = models.IntegerField(_('día de la semana'), choices=DAY_CHOICES)
    start_time = models.TimeField(_('hora de inicio'))
    end_time = models.TimeField(_('hora de fin'))
    is_available = models.BooleanField(_('disponible'), default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = _('disponibilidad del profesional')
        verbose_name_plural = _('disponibilidades de los profesionales')
        ordering = ['day_of_week', 'start_time']
        unique_together = ('professional', 'day_of_week', 'start_time', 'end_time')

    def __str__(self):
        return f"{self.professional.get_full_name()} - {self.get_day_of_week_display()} {self.start_time} - {self.end_time}"
    
    def clean(self):
        """Validar que la hora de inicio sea anterior a la hora de fin."""
        if self.start_time and self.end_time and self.start_time >= self.end_time:
            raise ValidationError(_('La hora de inicio debe ser anterior a la hora de fin.'))
        
        # Verificar que no se superponga con otras disponibilidades existentes del mismo profesional en el mismo día
        overlapping = ProfessionalAvailability.objects.filter(
            professional=self.professional,
            day_of_week=self.day_of_week,
            is_available=True
        ).exclude(id=self.id)
        
        for availability in overlapping:
            if (self.start_time < availability.end_time and 
                self.end_time > availability.start_time):
                raise ValidationError(_(
                    'Este horario se superpone con otro horario disponible para este profesional en el mismo día.'
                ))


class Appointment(models.Model):
    """
    Modelo para las citas médicas.
    """
    STATUS_CHOICES = (
        ('scheduled', _('Programada')),
        ('confirmed', _('Confirmada')),
        ('completed', _('Completada')),
        ('cancelled', _('Cancelada')),
        ('no_show', _('No asistió')),
    )
    
    patient = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.CASCADE,
        related_name='patient_appointments',
        limit_choices_to={'role': 'patient'}
    )
    professional = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.CASCADE,
        related_name='professional_appointments',
        limit_choices_to={'role': 'professional'}
    )
    start_time = models.DateTimeField(_('hora de inicio'))
    end_time = models.DateTimeField(_('hora de fin'))
    status = models.CharField(_('estado'), max_length=20, choices=STATUS_CHOICES, default='scheduled')
    reason = models.TextField(_('motivo de la consulta'), blank=True)
    notes = models.TextField(_('notas'), blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    # Campos adicionales
    payment_status = models.CharField(_('estado de pago'), max_length=20, choices=(
        ('pending', _('Pendiente')),
        ('paid', _('Pagado')),
        ('refunded', _('Reembolsado')),
    ), default='pending')
    payment_amount = models.DecimalField(_('monto'), max_digits=10, decimal_places=2, null=True, blank=True)
    reminder_sent = models.BooleanField(_('recordatorio enviado'), default=False)
    
    class Meta:
        verbose_name = _('cita')
        verbose_name_plural = _('citas')
        ordering = ['-start_time']

    def __str__(self):
        return f"Cita: {self.patient.get_full_name()} con {self.professional.get_full_name()} - {self.start_time.strftime('%d/%m/%Y %H:%M')}"
    
    def clean(self):
        """Validar las fechas y disponibilidad."""
        if self.start_time and self.end_time:
            # Validar que la fecha de inicio sea anterior a la fecha de fin
            if self.start_time >= self.end_time:
                raise ValidationError(_('La hora de inicio debe ser anterior a la hora de fin.'))
            
            # Validar que la cita sea en el futuro (para creación, no para actualización)
            if not self.pk and self.start_time <= timezone.now():
                raise ValidationError(_('La cita debe programarse para un momento futuro.'))
            
            # Verificar que no se superponga con otras citas del mismo profesional
            overlapping = Appointment.objects.filter(
                professional=self.professional,
                status__in=['scheduled', 'confirmed'],
                start_time__lt=self.end_time,
                end_time__gt=self.start_time
            ).exclude(id=self.id)
            
            if overlapping.exists():
                raise ValidationError(_('El profesional ya tiene una cita programada en este horario.'))
            
            # Verificar que el horario esté dentro de la disponibilidad del profesional
            day_of_week = self.start_time.weekday()
            start_time = self.start_time.time()
            end_time = self.end_time.time()
            
            availability = ProfessionalAvailability.objects.filter(
                professional=self.professional,
                day_of_week=day_of_week,
                start_time__lte=start_time,
                end_time__gte=end_time,
                is_available=True
            )
            
            if not availability.exists():
                raise ValidationError(_('El profesional no está disponible en este horario.'))
    
    @property
    def duration_minutes(self):
        """Calcular la duración de la cita en minutos."""
        if self.start_time and self.end_time:
            delta = self.end_time - self.start_time
            return delta.seconds // 60
        return 0
    
    def cancel(self):
        """Cancelar la cita."""
        self.status = 'cancelled'
        self.save()
    
    def mark_as_completed(self):
        """Marcar la cita como completada."""
        self.status = 'completed'
        self.save()
        
    def mark_as_no_show(self):
        """Marcar al paciente como ausente."""
        self.status = 'no_show'
        self.save()


class AppointmentAttachment(models.Model):
    """
    Modelo para adjuntos a las citas (archivos, resultados, etc.)
    """
    appointment = models.ForeignKey(Appointment, on_delete=models.CASCADE, related_name='attachments')
    title = models.CharField(_('título'), max_length=255)
    file = models.FileField(_('archivo'), upload_to='appointment_attachments/')
    uploaded_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    uploaded_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        verbose_name = _('adjunto de cita')
        verbose_name_plural = _('adjuntos de citas')
        
    def __str__(self):
        return f"{self.title} - {self.appointment}"
