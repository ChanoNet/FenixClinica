from django.contrib import admin
from .models import ProfessionalAvailability, Appointment, AppointmentAttachment


class AppointmentAttachmentInline(admin.TabularInline):
    model = AppointmentAttachment
    extra = 0


@admin.register(ProfessionalAvailability)
class ProfessionalAvailabilityAdmin(admin.ModelAdmin):
    """Admin para el modelo ProfessionalAvailability."""
    list_display = ('professional', 'day_of_week', 'start_time', 'end_time', 'is_available')
    list_filter = ('day_of_week', 'is_available', 'professional')
    search_fields = ('professional__first_name', 'professional__last_name', 'professional__email')


@admin.register(Appointment)
class AppointmentAdmin(admin.ModelAdmin):
    """Admin para el modelo Appointment."""
    list_display = ('id', 'patient', 'professional', 'start_time', 'end_time', 'status', 'payment_status')
    list_filter = ('status', 'payment_status', 'professional')
    search_fields = ('patient__email', 'patient__first_name', 'patient__last_name', 
                     'professional__email', 'professional__first_name', 'professional__last_name')
    date_hierarchy = 'start_time'
    inlines = [AppointmentAttachmentInline]
    readonly_fields = ('created_at', 'updated_at')
    
    fieldsets = (
        ('Información General', {
            'fields': ('patient', 'professional', 'status', 'reason')
        }),
        ('Horario', {
            'fields': ('start_time', 'end_time')
        }),
        ('Notas y Seguimiento', {
            'fields': ('notes',)
        }),
        ('Pago', {
            'fields': ('payment_status', 'payment_amount')
        }),
        ('Metadatos', {
            'fields': ('reminder_sent', 'created_at', 'updated_at')
        }),
    )


@admin.register(AppointmentAttachment)
class AppointmentAttachmentAdmin(admin.ModelAdmin):
    """Admin para el modelo AppointmentAttachment."""
    list_display = ('title', 'appointment', 'uploaded_by', 'uploaded_at')
    list_filter = ('uploaded_at',)
    search_fields = ('title', 'appointment__patient__email', 'appointment__professional__email')
