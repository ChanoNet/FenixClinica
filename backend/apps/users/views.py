from rest_framework import generics, status, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework.decorators import action
from django.contrib.auth import get_user_model
from django.db.models import Q

from .serializers import (
    UserSerializer, 
    UserRegistrationSerializer, 
    UserUpdateSerializer,
    PasswordChangeSerializer,
    CustomTokenObtainPairSerializer
)
from .permissions import IsOwnerOrAdmin, IsAdminUser

User = get_user_model()


class CustomTokenObtainPairView(TokenObtainPairView):
    """
    View personalizada para obtener tokens JWT con datos adicionales del usuario.
    """
    serializer_class = CustomTokenObtainPairSerializer


class UserRegistrationView(generics.CreateAPIView):
    """
    View para el registro de usuarios.
    No requiere autenticación.
    """
    queryset = User.objects.all()
    serializer_class = UserRegistrationSerializer
    permission_classes = [permissions.AllowAny]

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        
        # Genera tokens para inicio de sesión inmediato
        token_serializer = CustomTokenObtainPairSerializer(data={
            'email': request.data.get('email'),
            'password': request.data.get('password')
        })
        token_serializer.is_valid(raise_exception=True)
        
        return Response({
            'user': UserSerializer(user, context=self.get_serializer_context()).data,
            'tokens': token_serializer.validated_data
        }, status=status.HTTP_201_CREATED)


class UserDetailView(generics.RetrieveUpdateAPIView):
    """
    View para ver y actualizar detalles de usuario.
    Solo el propietario o administradores pueden ver/modificar.
    """
    queryset = User.objects.all()
    permission_classes = [permissions.IsAuthenticated, IsOwnerOrAdmin]
    
    def get_serializer_class(self):
        if self.request.method == 'PUT' or self.request.method == 'PATCH':
            return UserUpdateSerializer
        return UserSerializer


class CurrentUserView(APIView):
    """
    View para obtener/actualizar datos del usuario actual.
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        serializer = UserSerializer(request.user)
        return Response(serializer.data)
    
    def put(self, request):
        serializer = UserUpdateSerializer(request.user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class PasswordChangeView(APIView):
    """
    View para cambiar la contraseña del usuario.
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        serializer = PasswordChangeSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            user = request.user
            user.set_password(serializer.validated_data['new_password'])
            user.save()
            return Response({'message': 'Contraseña actualizada con éxito'}, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class UserListView(generics.ListAPIView):
    """
    View para listar usuarios.
    Solo administradores pueden ver la lista completa.
    """
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdminUser]
    
    def get_queryset(self):
        """
        Filtra usuarios por rol si se especifica en query params.
        Añade ordenamiento por id para evitar advertencias de paginación.
        """
        queryset = User.objects.all().order_by('id')  # Ordenar por id para evitar la advertencia
        role = self.request.query_params.get('role', None)
        if role:
            queryset = queryset.filter(role=role)
        return queryset


class ProfessionalsListView(generics.ListAPIView):
    """
    View para listar profesionales (accesible para todos los usuarios autenticados).
    """
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        """
        Obtiene solo usuarios con rol 'professional'.
        Opcionalmente filtra por especialidad.
        """
        queryset = User.objects.filter(role='professional')
        specialty = self.request.query_params.get('specialty', None)
        if specialty:
            queryset = queryset.filter(professional_profile__specialty=specialty)
        return queryset


class PatientsListView(generics.ListAPIView):
    """
    View para listar pacientes (accesible para todos los usuarios autenticados).
    """
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        """
        Obtiene solo usuarios con rol 'patient'.
        Opcionalmente filtra por nombre, email o teléfono.
        """
        queryset = User.objects.filter(role='patient')
        
        # Filtrar por término de búsqueda
        search = self.request.query_params.get('search', None)
        if search:
            queryset = queryset.filter(
                Q(first_name__icontains=search) |
                Q(last_name__icontains=search) |
                Q(email__icontains=search) |
                Q(phone_number__icontains=search)
            )
            
        return queryset


class PatientDetailView(generics.RetrieveUpdateAPIView):
    """
    View para ver y actualizar detalles de un paciente.
    Más permisiva que UserDetailView para permitir editar pacientes desde el frontend.
    """
    queryset = User.objects.filter(role='patient')
    permission_classes = [permissions.IsAuthenticated]  # Solo requiere autenticación, no verifica propietario
    
    def get_serializer_class(self):
        if self.request.method == 'PUT' or self.request.method == 'PATCH':
            return UserUpdateSerializer
        return UserSerializer


class ProfessionalDetailView(generics.RetrieveUpdateAPIView):
    """
    View para ver y actualizar detalles de un profesional.
    Similar a PatientDetailView pero para profesionales.
    """
    queryset = User.objects.filter(role='professional')
    permission_classes = [permissions.IsAuthenticated]  # Solo requiere autenticación para ver detalles
    
    def get_serializer_class(self):
        if self.request.method == 'PUT' or self.request.method == 'PATCH':
            return UserUpdateSerializer
        return UserSerializer
    
    def get_object(self):
        """
        Obtiene el objeto del paciente y registra información en caso de errores
        """
        try:
            obj = super().get_object()
            return obj
        except Exception as e:
            # Loguear el error para depuración
            print(f"Error al obtener paciente con ID {self.kwargs.get('pk')}: {str(e)}")
            raise
    
    def update(self, request, *args, **kwargs):
        """
        Sobreescribimos el método update para agregar logs y manejo de errores
        """
        try:
            # Obtener ID del paciente desde la URL
            patient_id = self.kwargs.get('pk')
            print(f"Intentando actualizar paciente con ID: {patient_id}")
            print(f"Datos recibidos: {request.data}")
            
            # Asegurar que no se cambie el rol
            if 'role' in request.data and request.data['role'] != 'patient':
                request.data['role'] = 'patient'
                
            # Continuar con la actualización normal
            return super().update(request, *args, **kwargs)
        except Exception as e:
            print(f"Error al actualizar paciente: {str(e)}")
            raise
