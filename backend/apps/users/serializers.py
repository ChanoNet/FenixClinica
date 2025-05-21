from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

from .models import ProfessionalProfile

User = get_user_model()


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    """
    Serializer personalizado para tokens JWT que incluye datos adicionales del usuario.
    """
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)

        # Agrega datos personalizados al token
        token['email'] = user.email
        token['name'] = user.get_full_name()
        token['role'] = user.role

        return token


class ProfessionalProfileSerializer(serializers.ModelSerializer):
    """
    Serializer para el perfil profesional.
    """
    class Meta:
        model = ProfessionalProfile
        fields = ('specialty', 'license_number', 'education', 'experience', 'consultation_fee')


class UserSerializer(serializers.ModelSerializer):
    """
    Serializer para mostrar datos de usuario.
    """
    professional_profile = ProfessionalProfileSerializer(read_only=True)
    
    class Meta:
        model = User
        fields = ('id', 'email', 'first_name', 'last_name', 'role', 'phone_number', 
                  'address', 'date_of_birth', 'profile_picture', 'professional_profile')
        read_only_fields = ('id',)


class UserRegistrationSerializer(serializers.ModelSerializer):
    """
    Serializer para el registro de usuarios.
    """
    password = serializers.CharField(write_only=True, required=True, validators=[validate_password])
    password2 = serializers.CharField(write_only=True, required=True)
    professional_profile = ProfessionalProfileSerializer(required=False)

    class Meta:
        model = User
        fields = ('email', 'password', 'password2', 'first_name', 'last_name', 'role',
                  'phone_number', 'address', 'date_of_birth', 'profile_picture', 'professional_profile')

    def validate(self, attrs):
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError({"password": "Las contraseñas no coinciden."})
        
        return attrs

    def create(self, validated_data):
        professional_profile_data = validated_data.pop('professional_profile', None)
        password = validated_data.pop('password')
        password2 = validated_data.pop('password2', None)  # Remove password2 if it exists
        
        user = User.objects.create(**validated_data)
        user.set_password(password)
        user.save()
        
        # Si el rol es 'professional' y hay datos de perfil, crear el perfil profesional
        if user.role == 'professional' and professional_profile_data:
            ProfessionalProfile.objects.create(user=user, **professional_profile_data)
            
        return user


class UserUpdateSerializer(serializers.ModelSerializer):
    """
    Serializer para actualizar datos de usuario.
    """
    professional_profile = ProfessionalProfileSerializer(required=False)
    
    class Meta:
        model = User
        fields = ('first_name', 'last_name', 'phone_number', 'address', 
                  'date_of_birth', 'profile_picture', 'professional_profile')
        
    def update(self, instance, validated_data):
        professional_profile_data = validated_data.pop('professional_profile', None)
        
        # Actualizar campos del usuario
        instance = super().update(instance, validated_data)
        
        # Actualizar o crear perfil profesional si es necesario
        if professional_profile_data and instance.role == 'professional':
            profile, created = ProfessionalProfile.objects.get_or_create(user=instance)
            for attr, value in professional_profile_data.items():
                setattr(profile, attr, value)
            profile.save()
            
        return instance


class PasswordChangeSerializer(serializers.Serializer):
    """
    Serializer para cambio de contraseña.
    """
    old_password = serializers.CharField(required=True)
    new_password = serializers.CharField(required=True, validators=[validate_password])
    
    def validate_old_password(self, value):
        user = self.context['request'].user
        if not user.check_password(value):
            raise serializers.ValidationError("La contraseña actual es incorrecta.")
        return value
