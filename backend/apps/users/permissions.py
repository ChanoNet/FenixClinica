from rest_framework import permissions


class IsOwnerOrAdmin(permissions.BasePermission):
    """
    Permiso personalizado que solo permite a los propietarios de un objeto o administradores editarlo.
    Para pacientes, permite que cualquier usuario autenticado pueda verlos (GET), pero solo el propietario
    o administradores pueden editarlos (PUT, PATCH, DELETE).
    """
    def has_object_permission(self, request, view, obj):
        # Los administradores siempre tienen permiso
        if request.user.is_admin:
            return True
            
        # Para operaciones de solo lectura (GET, HEAD, OPTIONS), permitir acceso a pacientes
        if request.method in permissions.SAFE_METHODS:
            if hasattr(obj, 'role') and obj.role == 'patient':
                return True
            
        # El propietario del objeto tiene permiso para cualquier operación
        return obj.id == request.user.id


class IsAdminUser(permissions.BasePermission):
    """
    Permiso que solo permite acceso a usuarios administradores.
    """
    def has_permission(self, request, view):
        return request.user and request.user.is_admin
        
        
class IsProfessionalUser(permissions.BasePermission):
    """
    Permiso que solo permite acceso a usuarios profesionales.
    """
    def has_permission(self, request, view):
        return request.user and request.user.is_professional


class IsPatientUser(permissions.BasePermission):
    """
    Permiso que solo permite acceso a usuarios pacientes.
    """
    def has_permission(self, request, view):
        return request.user and request.user.is_patient
