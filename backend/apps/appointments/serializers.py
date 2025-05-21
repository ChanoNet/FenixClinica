from rest_framework import serializers
from django.utils import timezone
from django.db.models import Q
from datetime import datetime, timedelta

from .models import ProfessionalAvailability, Appointment, AppointmentAttachment
from apps.users.serializers import UserSerializer


class ProfessionalAvailabilitySerializer(serializers.ModelSerializer):
    """Serializer para el modelo ProfessionalAvailability."""
    day_name = serializers.CharField(source='get_day_of_week_display', read_only=True)
    
    class Meta:
        model = ProfessionalAvailability
        fields = ('id', 'professional', 'day_of_week', 'day_name', 'start_time', 'end_time', 'is_available')
        read_only_fields = ('id',)
        

class AppointmentAttachmentSerializer(serializers.ModelSerializer):
    """Serializer para el modelo AppointmentAttachment."""
    uploaded_by_name = serializers.CharField(source='uploaded_by.get_full_name', read_only=True)
    
    class Meta:
        model = AppointmentAttachment
        fields = ('id', 'appointment', 'title', 'file', 'uploaded_by', 'uploaded_by_name', 'uploaded_at')
        read_only_fields = ('id', 'uploaded_at')


class AppointmentSerializer(serializers.ModelSerializer):
    """Serializer para el modelo Appointment."""
    patient_details = UserSerializer(source='patient', read_only=True)
    professional_details = UserSerializer(source='professional', read_only=True)
    attachments = AppointmentAttachmentSerializer(many=True, read_only=True)
    duration_minutes = serializers.IntegerField(read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    payment_status_display = serializers.CharField(source='get_payment_status_display', read_only=True)
    
    class Meta:
        model = Appointment
        fields = ('id', 'patient', 'professional', 'patient_details', 'professional_details',
                  'start_time', 'end_time', 'status', 'status_display', 'reason', 'notes',
                  'payment_status', 'payment_status_display', 'payment_amount', 'reminder_sent',
                  'created_at', 'updated_at', 'duration_minutes', 'attachments')
        read_only_fields = ('id', 'created_at', 'updated_at')

    def validate(self, attrs):
        """Validación personalizada para el modelo Appointment."""
        # Verificar que el usuario paciente tenga rol 'patient'
        patient = attrs.get('patient')
        if patient and not patient.is_patient:
            raise serializers.ValidationError({"patient": "El usuario seleccionado no es un paciente."})
        
        # Verificar que el usuario profesional tenga rol 'professional'
        professional = attrs.get('professional')
        if professional and not professional.is_professional:
            raise serializers.ValidationError({"professional": "El usuario seleccionado no es un profesional."})
        
        # Si se actualiza una cita, controlar la validación según el estado
        instance = getattr(self, 'instance', None)
        if instance and instance.status in ['completed', 'cancelled']:
            status = attrs.get('status', instance.status)
            if status not in ['completed', 'cancelled']:
                raise serializers.ValidationError({"status": "No se puede cambiar el estado de una cita completada o cancelada."})
        
        return attrs


class AppointmentCreateSerializer(AppointmentSerializer):
    """Serializer para la creación de citas."""
    class Meta(AppointmentSerializer.Meta):
        pass
    
    def validate(self, attrs):
        """Validación específica para la creación de citas."""
        attrs = super().validate(attrs)
        
        start_time = attrs.get('start_time')
        end_time = attrs.get('end_time')
        professional = attrs.get('professional')
        
        if start_time and end_time and professional:
            # Verificar que la cita sea en el futuro
            if start_time <= timezone.now():
                raise serializers.ValidationError({"start_time": "La cita debe programarse para un momento futuro."})
            
            # Verificar que la fecha de inicio sea anterior a la fecha de fin
            if start_time >= end_time:
                raise serializers.ValidationError({"start_time": "La hora de inicio debe ser anterior a la hora de fin."})
            
            # Verificar que no se superponga con otras citas del mismo profesional
            overlapping = Appointment.objects.filter(
                professional=professional,
                status__in=['scheduled', 'confirmed'],
                start_time__lt=end_time,
                end_time__gt=start_time
            )
            
            if overlapping.exists():
                raise serializers.ValidationError({
                    "start_time": "El profesional ya tiene una cita programada en este horario."
                })
            
            # Verificar que el horario esté dentro de la disponibilidad del profesional
            day_of_week = start_time.weekday()
            start_time_time = start_time.time()
            end_time_time = end_time.time()
            
            availability = ProfessionalAvailability.objects.filter(
                professional=professional,
                day_of_week=day_of_week,
                start_time__lte=start_time_time,
                end_time__gte=end_time_time,
                is_available=True
            )
            
            if not availability.exists():
                raise serializers.ValidationError({
                    "start_time": "El profesional no está disponible en este horario."
                })
                
        return attrs


class AvailableSlotSerializer(serializers.Serializer):
    """
    Serializer para representar slots de tiempo disponibles para citas.
    No está vinculado directamente a un modelo.
    """
    start_time = serializers.DateTimeField()
    end_time = serializers.DateTimeField()
    professional_id = serializers.IntegerField()
    professional_name = serializers.CharField()


class AppointmentStatisticsSerializer(serializers.Serializer):
    """
    Serializer para estadísticas de citas.
    """
    total = serializers.IntegerField()
    scheduled = serializers.IntegerField()
    confirmed = serializers.IntegerField()
    completed = serializers.IntegerField()
    cancelled = serializers.IntegerField()
    no_show = serializers.IntegerField()
    today = serializers.IntegerField()
    this_week = serializers.IntegerField()
    this_month = serializers.IntegerField()
