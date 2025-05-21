from django.db import models
from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.utils.translation import gettext_lazy as _


class CustomUserManager(BaseUserManager):
    """
    Gestor de usuarios personalizado donde el email es el identificador único
    en lugar del nombre de usuario.
    """
    def create_user(self, email, password=None, **extra_fields):
        """
        Crea y guarda un Usuario con el email y contraseña proporcionados.
        """
        if not email:
            raise ValueError(_('El Email es obligatorio'))
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        """
        Crea y guarda un SuperUsuario con el email y contraseña proporcionados.
        """
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('is_active', True)
        extra_fields.setdefault('role', 'admin')

        if extra_fields.get('is_staff') is not True:
            raise ValueError(_('Superuser must have is_staff=True.'))
        if extra_fields.get('is_superuser') is not True:
            raise ValueError(_('Superuser must have is_superuser=True.'))
        return self.create_user(email, password, **extra_fields)


class CustomUser(AbstractUser):
    """
    Modelo de usuario personalizado con email como identificador principal
    y roles predefinidos.
    """
    ROLE_CHOICES = (
        ('admin', 'Administrador'),
        ('professional', 'Profesional'),
        ('patient', 'Paciente'),
    )
    
    username = None
    email = models.EmailField(_('email address'), unique=True)
    first_name = models.CharField(_('first name'), max_length=150)
    last_name = models.CharField(_('last name'), max_length=150)
    role = models.CharField(_('role'), max_length=20, choices=ROLE_CHOICES, default='patient')
    phone_number = models.CharField(_('phone number'), max_length=20, blank=True)
    address = models.CharField(_('address'), max_length=255, blank=True)
    date_of_birth = models.DateField(_('date of birth'), null=True, blank=True)
    profile_picture = models.ImageField(upload_to='profile_pics/', null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['first_name', 'last_name']

    objects = CustomUserManager()

    class Meta:
        verbose_name = _('usuario')
        verbose_name_plural = _('usuarios')

    def __str__(self):
        return f"{self.first_name} {self.last_name} ({self.email})"

    def get_full_name(self):
        """
        Retorna el nombre completo del usuario.
        """
        return f"{self.first_name} {self.last_name}"
    
    @property
    def is_admin(self):
        return self.role == 'admin'
    
    @property
    def is_professional(self):
        return self.role == 'professional'
    
    @property
    def is_patient(self):
        return self.role == 'patient'


class ProfessionalProfile(models.Model):
    """
    Perfil extendido para usuarios con rol de profesional.
    """
    user = models.OneToOneField(CustomUser, on_delete=models.CASCADE, related_name='professional_profile')
    specialty = models.CharField(_('specialty'), max_length=100)
    license_number = models.CharField(_('license number'), max_length=50)
    education = models.TextField(_('education'), blank=True)
    experience = models.TextField(_('experience'), blank=True)
    consultation_fee = models.DecimalField(_('consultation fee'), max_digits=10, decimal_places=2, default=0)
    
    class Meta:
        verbose_name = _('perfil profesional')
        verbose_name_plural = _('perfiles profesionales')

    def __str__(self):
        return f"Perfil de {self.user.get_full_name()}"
