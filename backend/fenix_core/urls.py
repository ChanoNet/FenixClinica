"""
Configuración de URLs de FenixClinicas.
"""

from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from rest_framework import permissions
from drf_yasg.views import get_schema_view
from drf_yasg import openapi

# Importar las vistas del dashboard para poder usarlas directamente
from apps.appointments.views import dashboard_stats, upcoming_appointments

# Importar las vistas de profesionales
from apps.users.views import ProfessionalsListView, ProfessionalDetailView

# API Documentation schema
schema_view = get_schema_view(
    openapi.Info(
        title="FenixClinicas API",
        default_version='v1',
        description="API para gestión de citas médicas FenixClinicas",
        terms_of_service="https://www.fenixclinicas.com/terms/",
        contact=openapi.Contact(email="contacto@fenixclinicas.com"),
        license=openapi.License(name="MIT License"),
    ),
    public=True,
    permission_classes=(permissions.AllowAny,),
)

urlpatterns = [
    path('admin/', admin.site.urls),
    
    # API endpoints
    path('api/v1/users/', include('apps.users.urls')),
    path('api/v1/appointments/', include('apps.appointments.urls')),
    
    # Rutas directas para profesionales (para compatibilidad con el frontend)
    path('api/v1/professionals/', ProfessionalsListView.as_view(), name='direct-professionals-list'),
    path('api/v1/professionals/<int:pk>/', ProfessionalDetailView.as_view(), name='direct-professional-detail'),
    
    # Dashboard endpoints directos (para compatibilidad con el frontend)
    path('api/v1/dashboard/stats/', dashboard_stats, name='direct-dashboard-stats'),
    path('api/v1/dashboard/upcoming-appointments/', upcoming_appointments, name='direct-dashboard-upcoming-appointments'),
    
    # API documentation
    path('api/docs/', schema_view.with_ui('swagger', cache_timeout=0), name='schema-swagger-ui'),
    path('api/redoc/', schema_view.with_ui('redoc', cache_timeout=0), name='schema-redoc'),
]

# Serve static and media files during development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
