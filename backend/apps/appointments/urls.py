from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import (
    ProfessionalAvailabilityViewSet,
    AppointmentViewSet,
    AppointmentAttachmentViewSet,
    AvailableSlotsView,
    dashboard_stats,
    upcoming_appointments
)

# Configuración del router
router = DefaultRouter()
router.register(r'availabilities', ProfessionalAvailabilityViewSet, basename='availability')
router.register(r'appointments', AppointmentViewSet, basename='appointment')
router.register(r'attachments', AppointmentAttachmentViewSet, basename='attachment')

urlpatterns = [
    path('', include(router.urls)),
    path('available-slots/', AvailableSlotsView.as_view(), name='available-slots'),
    
    # Rutas del Dashboard
    path('dashboard/stats/', dashboard_stats, name='dashboard-stats'),
    path('dashboard/upcoming-appointments/', upcoming_appointments, name='dashboard-upcoming-appointments'),
]
