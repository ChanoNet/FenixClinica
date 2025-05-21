from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from django.utils.translation import gettext_lazy as _

from .models import CustomUser, ProfessionalProfile


class ProfessionalProfileInline(admin.StackedInline):
    model = ProfessionalProfile
    can_delete = False
    verbose_name_plural = 'Perfil Profesional'
    fk_name = 'user'


@admin.register(CustomUser)
class CustomUserAdmin(UserAdmin):
    """Personalización del panel de administración para el modelo CustomUser."""
    fieldsets = (
        (None, {'fields': ('email', 'password')}),
        (_('Personal info'), {'fields': ('first_name', 'last_name', 'role', 'phone_number', 'address', 'date_of_birth', 'profile_picture')}),
        (_('Permissions'), {'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions')}),
        (_('Important dates'), {'fields': ('last_login', 'date_joined')}),
    )
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('email', 'password1', 'password2', 'first_name', 'last_name', 'role'),
        }),
    )
    list_display = ('email', 'first_name', 'last_name', 'role', 'is_active')
    list_filter = ('is_staff', 'is_superuser', 'is_active', 'role')
    search_fields = ('email', 'first_name', 'last_name')
    ordering = ('email',)
    inlines = [ProfessionalProfileInline]

    def get_inlines(self, request, obj=None):
        """Solo muestra el perfil profesional para usuarios con rol 'professional'."""
        if obj and obj.role == 'professional':
            return [ProfessionalProfileInline]
        return []


@admin.register(ProfessionalProfile)
class ProfessionalProfileAdmin(admin.ModelAdmin):
    """Admin para el modelo ProfessionalProfile."""
    list_display = ('user', 'specialty', 'license_number', 'consultation_fee')
    search_fields = ('user__email', 'user__first_name', 'user__last_name', 'specialty')
    list_filter = ('specialty',)
