import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Alert,
  Breadcrumbs,
  Link,
  SelectChangeEvent,
  Divider,
  Chip,
  InputAdornment,
  Avatar,
  Rating
} from '@mui/material';
import { 
  Person as PersonIcon,
  Save as SaveIcon, 
  ArrowBack as ArrowBackIcon,
  MedicalServices as MedicalServicesIcon,
  PhotoCamera as PhotoCameraIcon,
  Insights as InsightsIcon,
  CalendarMonth as CalendarIcon
} from '@mui/icons-material';
import professionalService from '../../services/api/professionalService';
import authService from '../../services/api/authService';
import { useAuth } from '../../context/AuthContext';

const ProfessionalFormPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isNewProfessional = id === 'new';
  const pageTitle = isNewProfessional ? 'Crear Nuevo Profesional' : 'Editar Profesional';
  const isSelfEdit = user && id && user.id.toString() === id;
  
  // Guardar el ID del profesional por separado para asegurar que no se pierde
  const [professionalId, setProfessionalId] = useState<number | null>(
    id && id !== 'new' ? parseInt(id) || null : null
  );
  
  // Lista de especialidades médicas comunes
  const specialtiesList = [
    'Alergología',
    'Anestesiología',
    'Cardiología',
    'Cirugía General',
    'Cirugía Plástica',
    'Dermatología',
    'Endocrinología',
    'Gastroenterología',
    'Geriatría',
    'Ginecología y Obstetricia',
    'Hematología',
    'Infectología',
    'Medicina Familiar',
    'Medicina General',
    'Medicina Interna',
    'Nefrología',
    'Neurocirugía',
    'Neurología',
    'Oftalmología',
    'Oncología',
    'Ortopedia y Traumatología',
    'Otorrinolaringología',
    'Pediatría',
    'Psiquiatría',
    'Radiología',
    'Reumatología',
    'Urología'
  ];

  // Validaciones
  const [validationErrors, setValidationErrors] = useState<{[key: string]: string}>({});

  // Estado para manejar la imagen de perfil
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [profileImageUrl, setProfileImageUrl] = useState<string>('');
  const [uploadingImage, setUploadingImage] = useState<boolean>(false);
  
  const [formData, setFormData] = useState({
    email: '',
    first_name: '',
    last_name: '',
    phone_number: '',
    specialty: '',
    custom_specialty: '',
    description: '',
    education: '',
    office_address: '',
    consultation_fee: '',
    // Imagen de perfil (URL)
    profile_image: '',
    // Redes sociales y sitio web
    website: '',
    linkedin: '',
    twitter: '',
    instagram: '',
    // Disponibilidad semanal (días disponibles)
    availability: {
      monday: false,
      tuesday: false,
      wednesday: false,
      thursday: false,
      friday: false,
      saturday: false,
      sunday: false
    },
    // Horarios de atención (formato 24h)
    work_hours_start: '09:00',
    work_hours_end: '18:00',
    // Estadísticas y calificaciones (solo lectura)
    rating: 0,
    reviews_count: 0,
    patients_count: 0,
    appointments_completed: 0,
    password: '',
    password2: '',
    role: 'professional' as 'admin' | 'professional' | 'patient'
  });
  
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  // Cargar datos del profesional si estamos editando
  useEffect(() => {
    if (!isNewProfessional && id) {
      setLoading(true);
      
      const fetchProfessionalData = async () => {
        try {
          const data = await professionalService.getById(id);
          
          // Guardar el ID para referencias futuras
          setProfessionalId(data.id);
          
          // Actualizar la URL de la imagen de perfil si existe
          if (data.profile_image) {
            setProfileImageUrl(data.profile_image);
          }
          
          // Actualizar el formulario con los datos obtenidos
          setFormData({
            email: data.email || '',
            first_name: data.first_name || '',
            last_name: data.last_name || '',
            phone_number: data.phone_number || '',
            specialty: data.specialty || '',
            custom_specialty: '', // Campo nuevo para especialidad personalizada
            description: data.description || '',
            education: data.education || '',
            office_address: data.office_address || '',
            consultation_fee: data.consultation_fee ? data.consultation_fee.toString() : '',
            
            // Imagen de perfil
            profile_image: data.profile_image || '',
            
            // Nuevos campos de redes sociales (usar datos de la API si existen)
            website: data.website || '',
            linkedin: data.linkedin || '',
            twitter: data.twitter || '',
            instagram: data.instagram || '',
            
            // Disponibilidad (usar datos de la API o valores predeterminados)
            availability: data.availability || {
              monday: false,
              tuesday: false,
              wednesday: false,
              thursday: false,
              friday: false,
              saturday: false,
              sunday: false
            },
            
            // Horarios de atención (usar datos de la API o valores predeterminados)
            work_hours_start: data.work_hours_start || '09:00',
            work_hours_end: data.work_hours_end || '18:00',
            
            // Estadísticas (solo lectura)
            rating: data.rating || 0,
            reviews_count: data.reviews_count || 0,
            patients_count: data.patients_count || 0,
            appointments_completed: data.appointments_completed || 0,
            
            password: '',
            password2: '',
            role: 'professional'
          });
          setLoading(false);
        } catch (error: any) {
          console.error('Error al cargar datos del profesional:', error);
          setError(`Error al cargar los datos: ${error.message || 'Error desconocido'}`);
          setLoading(false);
        }
      };
      
      fetchProfessionalData();
    }
  }, [id, isNewProfessional]);
  
  // Manejar cambios en los campos del formulario
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    // Limpiar errores de validación cuando el usuario edita un campo
    if (validationErrors[name]) {
      setValidationErrors(prev => {
        const newErrors = {...prev};
        delete newErrors[name];
        return newErrors;
      });
    }
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  // Manejar cambios en los select
  const handleSelectChange = (e: SelectChangeEvent<string>) => {
    const { name, value } = e.target;
    // Limpiar errores de validación cuando el usuario edita un campo
    if (validationErrors[name]) {
      setValidationErrors(prev => {
        const newErrors = {...prev};
        delete newErrors[name];
        return newErrors;
      });
    }
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  // Manejar cambios en checkboxes de disponibilidad
  const handleAvailabilityChange = (day: string) => {
    setFormData(prev => ({
      ...prev,
      availability: {
        ...prev.availability,
        [day]: !prev.availability[day as keyof typeof prev.availability]
      }
    }));
  };
  
  // Manejar la subida de imagen de perfil
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      // Validar el tipo de archivo
      if (!file.type.match('image.*')) {
        setValidationErrors(prev => ({ 
          ...prev, 
          profileImage: 'El archivo debe ser una imagen (JPG, PNG, etc.)' 
        }));
        return;
      }
      
      // Validar el tamaño del archivo (máximo 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setValidationErrors(prev => ({ 
          ...prev, 
          profileImage: 'La imagen no debe exceder 5MB' 
        }));
        return;
      }
      
      // Crear una URL para la vista previa
      const reader = new FileReader();
      reader.onload = (loadEvent) => {
        setProfileImageUrl(loadEvent.target?.result as string);
      };
      reader.readAsDataURL(file);
      
      // Guardar el archivo para su posterior envío
      setProfileImage(file);
      setFormData(prev => ({ ...prev, profile_image: 'uploading' })); // Marcar que hay una imagen pendiente de subir
      
      // Limpiar cualquier error previo
      if (validationErrors.profileImage) {
        setValidationErrors(prev => {
          const newErrors = {...prev};
          delete newErrors.profileImage;
          return newErrors;
        });
      }
    }
  };
  
  // Simular subida de imagen a un servidor (en implementación real se usaría API)
  const uploadImage = async (file: File): Promise<string> => {
    setUploadingImage(true);
    try {
      // Aquí iría la lógica real de subida a un servidor
      // Por ahora solo simulamos una subida exitosa después de un breve retraso
      await new Promise(resolve => setTimeout(resolve, 1500));
      const imageUrl = URL.createObjectURL(file); // Crear URL local
      setUploadingImage(false);
      return imageUrl;
    } catch (error) {
      setUploadingImage(false);
      throw error;
    }
  };
  // Enviar el formulario
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccessMessage('');
    
    try {
      // Si hay una imagen para subir, procesarla primero
      let imageUrl = formData.profile_image;
      if (profileImage) {
        try {
          imageUrl = await uploadImage(profileImage);
        } catch (imageError) {
          console.error('Error al subir la imagen de perfil:', imageError);
          // Continuamos con el resto del formulario aunque falle la imagen
        }
      }
      
      // Preparar los datos para enviar
      const dataToSubmit = {
        ...formData,
        // Si se eligió "Otra" especialidad, usar el valor personalizado
        specialty: formData.specialty === 'Otra' ? formData.custom_specialty : formData.specialty,
        // Incluir la URL de la imagen (si se subió correctamente)
        profile_image: imageUrl !== 'uploading' ? imageUrl : '',
        consultation_fee: formData.consultation_fee ? parseFloat(formData.consultation_fee) : undefined
      };
      
      console.log('Datos a enviar:', dataToSubmit);
      console.log('¿Es nuevo profesional?:', isNewProfessional);
      console.log('¿Es edición propia?:', isSelfEdit);
      console.log('ID del profesional:', professionalId);
      
      // Caso 1: Crear nuevo profesional
      if (isNewProfessional) {
        console.log('Creando nuevo profesional');
        
        // Validar que se han proporcionado contraseñas
        if (!formData.password || !formData.password2) {
          setError('Debes proporcionar una contraseña');
          setSaving(false);
          return;
        }
        
        if (formData.password !== formData.password2) {
          setError('Las contraseñas no coinciden');
          setSaving(false);
          return;
        }
        
        // Usar el servicio de autenticación para registrar al profesional
        // Solo enviamos los campos que acepta la interfaz RegisterParams
        await authService.register({
          email: formData.email,
          password: formData.password,
          password2: formData.password2,
          first_name: formData.first_name,
          last_name: formData.last_name,
          role: 'professional',
          phone_number: formData.phone_number
        });
        
        // Después del registro, actualizamos los datos adicionales del profesional
        // Idealmente habría que obtener el ID del profesional recién creado
        // Pero como no tenemos ese dato, lo haremos mediante el correo
        try {
          // Esperar brevemente para que se procese el registro
          await new Promise(resolve => setTimeout(resolve, 500));
          
          // Buscar profesionales con el mismo correo
          const professionals = await professionalService.getAll({ search: formData.email });
          
          if (professionals && professionals.length > 0) {
            const newProfessional = professionals.find((p: any) => p.email === formData.email);
            
            if (newProfessional && newProfessional.id) {
              // Actualizar los campos adicionales - solo enviamos los campos que acepta el servicio
              await professionalService.update(newProfessional.id, {
                specialty: dataToSubmit.specialty,
                description: formData.description,
                education: formData.education,
                office_address: formData.office_address,
                consultation_fee: formData.consultation_fee ? parseFloat(formData.consultation_fee) : undefined,
                website: formData.website,
                linkedin: formData.linkedin,
                twitter: formData.twitter,
                instagram: formData.instagram,
                availability: formData.availability,
                work_hours_start: formData.work_hours_start,
                work_hours_end: formData.work_hours_end
              });
              console.log('Datos adicionales del profesional actualizados');
            }
          }
        } catch (updateError) {
          console.warn('No se pudieron actualizar los datos adicionales:', updateError);
          // No bloqueamos el flujo principal si esto falla
        }
        
        setSuccessMessage('Profesional creado con éxito');
        setTimeout(() => {
          navigate('/professionals');
        }, 1500);
      }
      // Caso 2: Editar un profesional existente
      else {
        console.log('Actualizando profesional existente');
        
        if (!professionalId) {
          setError('ID de profesional no válido');
          setSaving(false);
          return;
        }
        
        // Actualizar los datos del profesional
        await professionalService.update(professionalId, {
          first_name: formData.first_name,
          last_name: formData.last_name,
          phone_number: formData.phone_number,
          specialty: dataToSubmit.specialty,
          description: formData.description,
          education: formData.education,
          office_address: formData.office_address,
          consultation_fee: formData.consultation_fee ? parseFloat(formData.consultation_fee) : undefined,
          website: formData.website,
          linkedin: formData.linkedin,
          twitter: formData.twitter,
          instagram: formData.instagram,
          availability: formData.availability,
          work_hours_start: formData.work_hours_start,
          work_hours_end: formData.work_hours_end
        });
        
        setSuccessMessage('Datos actualizados con éxito');
      }
      
      setSaving(false);
    } catch (err: any) {
      console.error('Error al guardar los datos:', err);
      setError(err.response?.data?.detail || err.message || 'Error al guardar los datos');
      setSaving(false);
    }
  };
  return (
    <Box>
      <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 2 }}>
        <Link
          underline="hover"
          color="inherit"
          href="#"
          onClick={(e) => {
            e.preventDefault();
            navigate('/');
          }}
        >
          Inicio
        </Link>
        <Link
          underline="hover"
          color="inherit"
          href="#"
          onClick={(e) => {
            e.preventDefault();
            navigate('/professionals');
          }}
        >
          Profesionales
        </Link>
        <Typography color="text.primary">{pageTitle}</Typography>
      </Breadcrumbs>
      
      <Box display="flex" alignItems="center" mb={3}>
        <MedicalServicesIcon fontSize="large" sx={{ mr: 1 }} />
        <Typography variant="h4" component="h1">
          {pageTitle}
        </Typography>
      </Box>
      
      <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}
        
        {successMessage && (
          <Alert severity="success" sx={{ mb: 3 }}>
            {successMessage}
          </Alert>
        )}
        
        {loading ? (
          <Box display="flex" justifyContent="center" p={3}>
            <CircularProgress />
          </Box>
        ) : (
          <form onSubmit={handleSubmit}>
            <Grid container spacing={3}>
              {/* Sección de foto de perfil */}
              <Grid item xs={12}>
                <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 'medium' }}>
                  Foto de perfil
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Box
                    sx={{
                      width: 150,
                      height: 150,
                      borderRadius: '50%',
                      bgcolor: 'grey.200',
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      overflow: 'hidden',
                      border: '1px solid',
                      borderColor: 'divider',
                      mr: 3,
                      position: 'relative'
                    }}
                  >
                    {profileImageUrl ? (
                      <img 
                        src={profileImageUrl} 
                        alt="Vista previa"
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                      />
                    ) : (
                      <PersonIcon sx={{ fontSize: 80, color: 'grey.400' }} />
                    )}
                    {uploadingImage && (
                      <Box
                        sx={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          right: 0,
                          bottom: 0,
                          display: 'flex',
                          justifyContent: 'center',
                          alignItems: 'center',
                          backgroundColor: 'rgba(255, 255, 255, 0.7)'
                        }}
                      >
                        <CircularProgress size={40} />
                      </Box>
                    )}
                  </Box>
                  <Box sx={{ flexGrow: 1 }}>
                    <input
                      accept="image/*"
                      style={{ display: 'none' }}
                      id="profile-image-upload"
                      type="file"
                      onChange={handleImageUpload}
                    />
                    <label htmlFor="profile-image-upload">
                      <Button
                        variant="contained"
                        component="span"
                        sx={{ mb: 1 }}
                        startIcon={<PhotoCameraIcon />}
                      >
                        Subir foto
                      </Button>
                    </label>
                    <Typography variant="caption" display="block" color="text.secondary">
                      Sube una foto profesional. Formatos permitidos: JPG, PNG. Tamaño máximo: 5MB.
                    </Typography>
                    {validationErrors.profileImage && (
                      <Typography color="error" variant="caption" display="block">
                        {validationErrors.profileImage}
                      </Typography>
                    )}
                  </Box>
                </Box>
                <Divider sx={{ my: 2 }} />
              </Grid>
              
              {/* Datos personales */}
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Nombre"
                  name="first_name"
                  value={formData.first_name}
                  onChange={handleChange}
                  fullWidth
                  required
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Apellido"
                  name="last_name"
                  value={formData.last_name}
                  onChange={handleChange}
                  fullWidth
                  required
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Correo Electrónico"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  fullWidth
                  required
                  disabled={!isNewProfessional} // Email solo editable al crear nuevo profesional
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Teléfono"
                  name="phone_number"
                  value={formData.phone_number}
                  onChange={handleChange}
                  fullWidth
                />
              </Grid>
              
              {isNewProfessional && (
                <>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="Contraseña"
                      name="password"
                      type="password"
                      value={formData.password}
                      onChange={handleChange}
                      fullWidth
                      required
                    />
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="Confirmar Contraseña"
                      name="password2"
                      type="password"
                      value={formData.password2}
                      onChange={handleChange}
                      fullWidth
                      required
                    />
                  </Grid>
                </>
              )}
              
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth required>
                  <InputLabel id="specialty-label">Especialidad</InputLabel>
                  <Select
                    labelId="specialty-label"
                    id="specialty"
                    name="specialty"
                    value={formData.specialty}
                    onChange={handleSelectChange}
                    label="Especialidad"
                  >
                    <MenuItem value=""><em>Seleccione una especialidad</em></MenuItem>
                    {specialtiesList.map((specialty) => (
                      <MenuItem key={specialty} value={specialty}>
                        {specialty}
                      </MenuItem>
                    ))}
                    <MenuItem value="Otra">Otra especialidad</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              
              {formData.specialty === 'Otra' && (
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Especificar otra especialidad"
                    name="custom_specialty"
                    value={formData.custom_specialty || ''}
                    onChange={handleChange}
                    fullWidth
                    required
                  />
                </Grid>
              )}
              
              <Grid item xs={12}>
                <TextField
                  label="Dirección de consultorio"
                  name="office_address"
                  value={formData.office_address}
                  onChange={handleChange}
                  fullWidth
                  multiline
                  rows={2}
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Tarifa de Consulta"
                  name="consultation_fee"
                  type="number"
                  value={formData.consultation_fee}
                  onChange={handleChange}
                  InputProps={{
                    startAdornment: <InputAdornment position="start">$</InputAdornment>,
                  }}
                  fullWidth
                />
              </Grid>
              
              {/* Sección de redes sociales y sitio web */}
              <Grid item xs={12}>
                <Typography variant="subtitle1" sx={{ mt: 2, mb: 2, fontWeight: 'medium' }}>
                  Redes sociales y contacto
                </Typography>
                <Divider sx={{ mb: 2 }} />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Sitio web"
                  name="website"
                  value={formData.website}
                  onChange={handleChange}
                  fullWidth
                  placeholder="https://www.ejemplo.com"
                  InputProps={{
                    startAdornment: <InputAdornment position="start">🌐</InputAdornment>,
                  }}
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  label="LinkedIn"
                  name="linkedin"
                  value={formData.linkedin}
                  onChange={handleChange}
                  fullWidth
                  placeholder="https://www.linkedin.com/in/usuario"
                  InputProps={{
                    startAdornment: <InputAdornment position="start">in</InputAdornment>,
                  }}
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Twitter/X"
                  name="twitter"
                  value={formData.twitter}
                  onChange={handleChange}
                  fullWidth
                  placeholder="@usuario"
                  InputProps={{
                    startAdornment: <InputAdornment position="start">@</InputAdornment>,
                  }}
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Instagram"
                  name="instagram"
                  value={formData.instagram}
                  onChange={handleChange}
                  fullWidth
                  placeholder="@usuario"
                  InputProps={{
                    startAdornment: <InputAdornment position="start">@</InputAdornment>,
                  }}
                />
              </Grid>
              
              {/* Sección de disponibilidad */}
              <Grid item xs={12}>
                <Typography variant="subtitle1" sx={{ mt: 2, mb: 2, fontWeight: 'medium' }}>
                  Disponibilidad y horarios
                </Typography>
                <Divider sx={{ mb: 2 }} />
              </Grid>
              
              <Grid item xs={12}>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  Días disponibles para consultas:
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {[
                    { day: 'monday', label: 'Lunes' },
                    { day: 'tuesday', label: 'Martes' },
                    { day: 'wednesday', label: 'Miércoles' },
                    { day: 'thursday', label: 'Jueves' },
                    { day: 'friday', label: 'Viernes' },
                    { day: 'saturday', label: 'Sábado' },
                    { day: 'sunday', label: 'Domingo' }
                  ].map(({ day, label }) => (
                    <Chip
                      key={day}
                      label={label}
                      onClick={() => handleAvailabilityChange(day)}
                      color={formData.availability[day as keyof typeof formData.availability] ? 'primary' : 'default'}
                      variant={formData.availability[day as keyof typeof formData.availability] ? 'filled' : 'outlined'}
                      sx={{ m: 0.5 }}
                    />
                  ))}
                </Box>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Hora de inicio"
                  name="work_hours_start"
                  type="time"
                  value={formData.work_hours_start}
                  onChange={handleChange}
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Hora de fin"
                  name="work_hours_end"
                  type="time"
                  value={formData.work_hours_end}
                  onChange={handleChange}
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  label="Formación Académica"
                  name="education"
                  value={formData.education}
                  onChange={handleChange}
                  fullWidth
                  multiline
                  rows={3}
                />
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  label="Descripción del profesional"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  fullWidth
                  multiline
                  rows={4}
                  placeholder="Incluye información sobre tu experiencia, especialización y enfoque profesional"
                />
              </Grid>
              
              {/* Sección de estadísticas (solo visible al editar) */}
              {!isNewProfessional && (
                <>
                  <Grid item xs={12}>
                    <Typography variant="subtitle1" sx={{ mt: 2, mb: 2, fontWeight: 'medium' }}>
                      <InsightsIcon sx={{ verticalAlign: 'middle', mr: 1 }} />
                      Estadísticas profesionales
                    </Typography>
                    <Divider sx={{ mb: 2 }} />
                  </Grid>
                  
                  <Grid item xs={12} sm={6} md={3}>
                    <Box sx={{ textAlign: 'center', p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                      <Typography variant="h5" color="primary">
                        {formData.rating > 0 ? (
                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Typography variant="h5" component="span" sx={{ mr: 1 }}>
                              {formData.rating.toFixed(1)}
                            </Typography>
                            <Rating value={formData.rating} precision={0.5} readOnly size="small" />
                          </Box>
                        ) : 'Sin calificaciones'}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Calificación ({formData.reviews_count} reseñas)
                      </Typography>
                    </Box>
                  </Grid>
                  
                  <Grid item xs={12} sm={6} md={3}>
                    <Box sx={{ textAlign: 'center', p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                      <Typography variant="h5" color="primary">
                        {formData.patients_count || 0}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Pacientes atendidos
                      </Typography>
                    </Box>
                  </Grid>
                  
                  <Grid item xs={12} sm={6} md={3}>
                    <Box sx={{ textAlign: 'center', p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                      <Typography variant="h5" color="primary">
                        {formData.appointments_completed || 0}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Citas completadas
                      </Typography>
                    </Box>
                  </Grid>
                  
                  <Grid item xs={12} sm={6} md={3}>
                    <Box 
                      sx={{ 
                        textAlign: 'center', 
                        p: 2, 
                        border: '1px solid', 
                        borderColor: 'divider', 
                        borderRadius: 1,
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        height: '100%'
                      }}
                    >
                      <Button 
                        variant="outlined" 
                        color="primary"
                        startIcon={<CalendarIcon />}
                        onClick={() => navigate(`/professionals/${professionalId}/appointments`)}
                        sx={{ fontSize: '0.9rem' }}
                      >
                        Ver agenda
                      </Button>
                    </Box>
                  </Grid>
                </>
              )}
              
              {/* Botones de acción */}
              <Grid item xs={12} sx={{ mt: 3, display: 'flex', justifyContent: 'space-between' }}>
                <Button 
                  variant="outlined" 
                  color="primary" 
                  onClick={() => navigate('/professionals')}
                  startIcon={<ArrowBackIcon />}
                >
                  Cancelar
                </Button>
                
                <Button 
                  type="submit" 
                  variant="contained" 
                  color="primary"
                  disabled={saving || loading}
                  startIcon={saving ? <CircularProgress size={20} /> : <SaveIcon />}
                >
                  {saving ? 'Guardando...' : 'Guardar'}
                </Button>
              </Grid>
            </Grid>
          </form>
        )}
      </Paper>
    </Box>
  );
};

export default ProfessionalFormPage;
