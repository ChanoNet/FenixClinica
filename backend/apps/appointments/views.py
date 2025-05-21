from rest_framework import viewsets, status, permissions, generics
from rest_framework.response import Response
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.views import APIView
from django.utils import timezone
from django.db.models import Count, Q, Sum
from datetime import datetime, timedelta, time
import json

from .models import ProfessionalAvailability, Appointment, AppointmentAttachment
from .serializers import (
    ProfessionalAvailabilitySerializer,
    AppointmentSerializer,
    AppointmentCreateSerializer,
    AppointmentAttachmentSerializer,
    AvailableSlotSerializer,
    AppointmentStatisticsSerializer
)
from apps.users.permissions import IsAdminUser, IsProfessionalUser, IsPatientUser, IsOwnerOrAdmin


class ProfessionalAvailabilityViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gestionar las disponibilidades de los profesionales.
    """
    serializer_class = ProfessionalAvailabilitySerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        """Filtra las disponibilidades según el usuario y parámetros."""
        user = self.request.user
        if user.is_admin:
            # Los administradores pueden ver todas las disponibilidades
            queryset = ProfessionalAvailability.objects.all()
        elif user.is_professional:
            # Los profesionales solo ven sus propias disponibilidades
            queryset = ProfessionalAvailability.objects.filter(professional=user)
        else:
            # Los pacientes pueden ver las disponibilidades de todos los profesionales
            queryset = ProfessionalAvailability.objects.filter(is_available=True)
        
        # Filtra por profesional si se proporciona el ID
        professional_id = self.request.query_params.get('professional_id')
        if professional_id:
            queryset = queryset.filter(professional_id=professional_id)
            
        # Filtra por día de la semana
        day = self.request.query_params.get('day')
        if day is not None:
            queryset = queryset.filter(day_of_week=day)
            
        return queryset.order_by('day_of_week', 'start_time')
    
    def perform_create(self, serializer):
        """Asegura que solo los profesionales puedan crear sus propias disponibilidades."""
        user = self.request.user
        if user.is_admin:
            serializer.save()
        else:
            serializer.save(professional=user)
    
    def check_permissions(self, request):
        """Verifica permisos específicos según el método y usuario."""
        super().check_permissions(request)
        
        # Para crear, actualizar o eliminar, el usuario debe ser profesional o admin
        if request.method != 'GET' and not (request.user.is_professional or request.user.is_admin):
            self.permission_denied(
                request, message="Solo los profesionales o administradores pueden modificar las disponibilidades."
            )


class AppointmentViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gestionar las citas.
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def get_serializer_class(self):
        """Selecciona el serializer adecuado según la acción."""
        if self.action == 'create':
            return AppointmentCreateSerializer
        return AppointmentSerializer
    
    def get_queryset(self):
        """Filtra las citas según el usuario y parámetros."""
        user = self.request.user
        
        if user.is_admin:
            # Administradores ven todas las citas
            queryset = Appointment.objects.all()
        elif user.is_professional:
            # Profesionales ven solo sus citas
            queryset = Appointment.objects.filter(professional=user)
        else:
            # Pacientes ven solo sus propias citas
            queryset = Appointment.objects.filter(patient=user)
        
        # Filtros adicionales
        status_filter = self.request.query_params.get('status')
        if status_filter:
            statuses = status_filter.split(',')
            queryset = queryset.filter(status__in=statuses)
            
        date_from = self.request.query_params.get('date_from')
        if date_from:
            try:
                date_from = datetime.strptime(date_from, '%Y-%m-%d').date()
                queryset = queryset.filter(start_time__date__gte=date_from)
            except ValueError:
                pass
                
        date_to = self.request.query_params.get('date_to')
        if date_to:
            try:
                date_to = datetime.strptime(date_to, '%Y-%m-%d').date()
                queryset = queryset.filter(start_time__date__lte=date_to)
            except ValueError:
                pass
                
        # Filtro para citas hoy
        today = self.request.query_params.get('today')
        if today == 'true':
            today_date = timezone.now().date()
            queryset = queryset.filter(start_time__date=today_date)
        
        return queryset.order_by('-start_time')
    
    def perform_create(self, serializer):
        """
        Al crear una cita, establece automáticamente al usuario actual como paciente
        si es un paciente, o valida los permisos si es un admin o profesional.
        """
        user = self.request.user
        
        if user.is_patient:
            serializer.save(patient=user)
        else:
            # Administradores y profesionales pueden crear citas para cualquier paciente
            serializer.save()
    
    @action(detail=True, methods=['post'])
    def cancel(self, request, pk=None):
        """Acción para cancelar una cita."""
        appointment = self.get_object()
        appointment.cancel()
        return Response({'status': 'Cita cancelada'})
    
    @action(detail=True, methods=['post'])
    def complete(self, request, pk=None):
        """Acción para marcar una cita como completada."""
        appointment = self.get_object()
        
        # Solo profesionales y administradores pueden marcar citas como completadas
        if not (request.user.is_professional or request.user.is_admin):
            return Response(
                {'error': 'No tiene permisos para marcar citas como completadas.'},
                status=status.HTTP_403_FORBIDDEN
            )
            
        appointment.mark_as_completed()
        return Response({'status': 'Cita marcada como completada'})
    
    @action(detail=True, methods=['post'])
    def no_show(self, request, pk=None):
        """Acción para marcar que el paciente no asistió a la cita."""
        appointment = self.get_object()
        
        # Solo profesionales y administradores pueden marcar citas como no asistidas
        if not (request.user.is_professional or request.user.is_admin):
            return Response(
                {'error': 'No tiene permisos para marcar citas como no asistidas.'},
                status=status.HTTP_403_FORBIDDEN
            )
            
        appointment.mark_as_no_show()
        return Response({'status': 'Cita marcada como no asistida'})
    
    @action(detail=False, methods=['get'])
    def statistics(self, request):
        """Acción para obtener estadísticas de citas."""
        user = request.user
        
        # Base queryset según el rol del usuario
        if user.is_admin:
            queryset = Appointment.objects.all()
        elif user.is_professional:
            queryset = Appointment.objects.filter(professional=user)
        else:
            queryset = Appointment.objects.filter(patient=user)
        
        # Calcular estadísticas
        today = timezone.now().date()
        week_start = today - timedelta(days=today.weekday())
        month_start = today.replace(day=1)
        
        stats = {
            'total': queryset.count(),
            'scheduled': queryset.filter(status='scheduled').count(),
            'confirmed': queryset.filter(status='confirmed').count(),
            'completed': queryset.filter(status='completed').count(),
            'cancelled': queryset.filter(status='cancelled').count(),
            'no_show': queryset.filter(status='no_show').count(),
            'today': queryset.filter(start_time__date=today).count(),
            'this_week': queryset.filter(start_time__date__gte=week_start).count(),
            'this_month': queryset.filter(start_time__date__gte=month_start).count(),
        }
        
        serializer = AppointmentStatisticsSerializer(stats)
        return Response(serializer.data)


class AppointmentAttachmentViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gestionar los adjuntos de las citas.
    """
    serializer_class = AppointmentAttachmentSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        """Filtra los adjuntos según el usuario y parámetros."""
        user = self.request.user
        
        # Filtrar por cita si se proporciona el ID
        appointment_id = self.request.query_params.get('appointment_id')
        
        if user.is_admin:
            queryset = AppointmentAttachment.objects.all()
        elif user.is_professional:
            queryset = AppointmentAttachment.objects.filter(
                Q(appointment__professional=user) | Q(uploaded_by=user)
            )
        else:
            queryset = AppointmentAttachment.objects.filter(
                Q(appointment__patient=user) | Q(uploaded_by=user)
            )
            
        if appointment_id:
            queryset = queryset.filter(appointment_id=appointment_id)
            
        return queryset
    
    def perform_create(self, serializer):
        """Establece el usuario actual como el que sube el archivo."""
        serializer.save(uploaded_by=self.request.user)


class AvailableSlotsView(APIView):
    """
    Vista para obtener slots disponibles para citas con un profesional.
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        """Obtiene slots disponibles según parámetros."""
        professional_id = request.query_params.get('professional_id')
        date_from = request.query_params.get('date_from')
        date_to = request.query_params.get('date_to')
        
        if not professional_id:
            return Response(
                {'error': 'Se requiere ID del profesional'},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        try:
            # Convertir fechas
            if date_from:
                start_date = datetime.strptime(date_from, '%Y-%m-%d').date()
            else:
                start_date = timezone.now().date()
                
            if date_to:
                end_date = datetime.strptime(date_to, '%Y-%m-%d').date()
            else:
                # Por defecto, una semana adelante
                end_date = start_date + timedelta(days=7)
                
            # Limitar el rango a máximo 30 días
            if (end_date - start_date).days > 30:
                end_date = start_date + timedelta(days=30)
                
            # Obtener disponibilidades del profesional
            availabilities = ProfessionalAvailability.objects.filter(
                professional_id=professional_id,
                is_available=True
            )
            
            if not availabilities.exists():
                return Response([])
                
            # Obtener citas existentes del profesional en el rango de fechas
            existing_appointments = Appointment.objects.filter(
                professional_id=professional_id,
                start_time__date__gte=start_date,
                start_time__date__lte=end_date,
                status__in=['scheduled', 'confirmed']
            )
            
            # Calcular slots disponibles
            available_slots = []
            current_date = start_date
            slot_duration = timedelta(minutes=30)  # Duración predeterminada de 30 minutos
            
            while current_date <= end_date:
                day_of_week = current_date.weekday()
                
                # Obtener disponibilidades para este día de la semana
                day_availabilities = availabilities.filter(day_of_week=day_of_week)
                
                for availability in day_availabilities:
                    # Crear datetime combinando la fecha actual con las horas de disponibilidad
                    slot_start = datetime.combine(current_date, availability.start_time)
                    slot_end = datetime.combine(current_date, availability.end_time)
                    
                    # Generar slots para este bloque de disponibilidad
                    current_slot_start = slot_start
                    
                    while current_slot_start + slot_duration <= slot_end:
                        current_slot_end = current_slot_start + slot_duration
                        
                        # Verificar si el slot se superpone con alguna cita existente
                        is_available = True
                        for appointment in existing_appointments:
                            if (current_slot_start < appointment.end_time and
                                current_slot_end > appointment.start_time):
                                is_available = False
                                break
                                
                        if is_available:
                            available_slots.append({
                                'start_time': current_slot_start,
                                'end_time': current_slot_end,
                                'professional_id': int(professional_id),
                                'professional_name': availability.professional.get_full_name()
                            })
                            
                        current_slot_start += slot_duration
                
                current_date += timedelta(days=1)
                
            # Serializar y retornar los slots disponibles
            serializer = AvailableSlotSerializer(available_slots, many=True)
            return Response(serializer.data)
            
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )


# ======= VISTAS PARA EL DASHBOARD =======

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def dashboard_stats(request):
    """
    Obtiene estadísticas generales para el dashboard:
    - Total de citas
    - Citas por estado (programadas, confirmadas, completadas, etc.)
    - Citas de hoy, esta semana y este mes
    """
    try:
        # Obtener todas las citas según el rol del usuario
        user = request.user
        
        if user.is_admin:
            # Los administradores ven todas las citas
            appointments = Appointment.objects.all()
        elif hasattr(user, 'professional_profile') and user.professional_profile:
            # Los profesionales ven sus propias citas
            appointments = Appointment.objects.filter(professional=user)
        else:
            # Los pacientes ven sus propias citas
            appointments = Appointment.objects.filter(patient=user)
        
        # Calcular estadísticas generales
        total = appointments.count()
        
        # Estadísticas por estado
        status_counts = {
            'scheduled': appointments.filter(status='scheduled').count(),
            'confirmed': appointments.filter(status='confirmed').count(),
            'completed': appointments.filter(status='completed').count(),
            'cancelled': appointments.filter(status='cancelled').count(),
            'no_show': appointments.filter(status='no_show').count(),
        }
        
        # Fechas para filtros
        today = timezone.now().date()
        start_of_week = today - timedelta(days=today.weekday())
        start_of_month = today.replace(day=1)
        
        # Citas por período de tiempo
        time_counts = {
            'today': appointments.filter(start_time__date=today).count(),
            'this_week': appointments.filter(start_time__date__gte=start_of_week).count(),
            'this_month': appointments.filter(start_time__date__gte=start_of_month).count(),
        }
        
        # Combinar todos los datos estadísticos
        stats = {
            'total': total,
            **status_counts,
            **time_counts
        }
        
        return Response(stats)
        
    except Exception as e:
        return Response(
            {'error': f'Error al obtener estadísticas: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def upcoming_appointments(request):
    """
    Obtiene las próximas citas para el dashboard
    """
    try:
        # Parámetros de consulta
        limit = request.query_params.get('limit', 5)
        try:
            limit = int(limit)
        except ValueError:
            limit = 5
        
        # Obtener usuario actual
        user = request.user
        
        # Fecha actual para filtrar solo citas futuras
        now = timezone.now()
        
        # Obtener citas según rol del usuario
        if user.is_admin:
            # Administradores ven todas las próximas citas
            appointments = Appointment.objects.filter(
                start_time__gt=now
            ).order_by('start_time')[:limit]
        elif hasattr(user, 'professional_profile') and user.professional_profile:
            # Profesionales ven sus próximas citas
            appointments = Appointment.objects.filter(
                professional=user,
                start_time__gt=now
            ).order_by('start_time')[:limit]
        else:
            # Pacientes ven sus próximas citas
            appointments = Appointment.objects.filter(
                patient=user,
                start_time__gt=now
            ).order_by('start_time')[:limit]
        
        # Serializar citas
        serializer = AppointmentSerializer(appointments, many=True)
        
        return Response(serializer.data)
        
    except Exception as e:
        return Response(
            {'error': f'Error al obtener próximas citas: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
