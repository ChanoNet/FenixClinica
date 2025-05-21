from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView

from .views import (
    UserRegistrationView,
    UserDetailView,
    CurrentUserView,
    PasswordChangeView,
    UserListView,
    ProfessionalsListView,
    PatientsListView,
    PatientDetailView,
    CustomTokenObtainPairView
)

urlpatterns = [
    # Autenticación
    path('token/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    
    # Registro y gestión de usuarios
    path('register/', UserRegistrationView.as_view(), name='register'),
    path('me/', CurrentUserView.as_view(), name='current_user'),
    path('change-password/', PasswordChangeView.as_view(), name='change_password'),
    
    # Listados (para admin)
    path('', UserListView.as_view(), name='user_list'),
    path('professionals/', ProfessionalsListView.as_view(), name='professionals_list'),
    
    # Endpoints para pacientes (más permisivos)
    # Estos endpoints tienen prioridad sobre los genéricos
    path('patients/', PatientsListView.as_view(), name='patients_list'),
    path('patients/<int:pk>/', PatientDetailView.as_view(), name='patient_detail'),
    
    # Detalles de usuario específico (genérico)
    # Este endpoint debe estar después de los endpoints específicos
    path('<int:pk>/', UserDetailView.as_view(), name='user_detail'),
]
