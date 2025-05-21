import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  TextField,
  InputAdornment,
  IconButton,
  Grid,
  Card,
  CardContent,
  CardActions,
  Avatar,
  Chip,
  CircularProgress,
  Divider
} from '@mui/material';
import {
  Search as SearchIcon,
  Add as AddIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  MoreVert as MoreVertIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import professionalService from '../../services/api/professionalService';

// Datos simulados de profesionales
const mockProfessionals = [
  {
    id: 1,
    first_name: 'María',
    last_name: 'García',
    email: 'maria.garcia@example.com',
    phone_number: '555-123-4567',
    specialty: 'Cardiología',
    profile_picture: null,
    appointments_count: 24,
    rating: 4.8
  },
  {
    id: 2,
    first_name: 'Carlos',
    last_name: 'López',
    email: 'carlos.lopez@example.com',
    phone_number: '555-234-5678',
    specialty: 'Pediatría',
    profile_picture: null,
    appointments_count: 18,
    rating: 4.5
  },
  {
    id: 3,
    first_name: 'Ana',
    last_name: 'Martínez',
    email: 'ana.martinez@example.com',
    phone_number: '555-345-6789',
    specialty: 'Dermatología',
    profile_picture: null,
    appointments_count: 31,
    rating: 4.9
  },
  {
    id: 4,
    first_name: 'Roberto',
    last_name: 'Fernández',
    email: 'roberto.fernandez@example.com',
    phone_number: '555-456-7890',
    specialty: 'Traumatología',
    profile_picture: null,
    appointments_count: 15,
    rating: 4.6
  }
];

// Componente principal
const ProfessionalsPage: React.FC = () => {
  const [professionals, setProfessionals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [specialtyFilter, setSpecialtyFilter] = useState<string | null>(null);
  const navigate = useNavigate();

  // Cargar datos de profesionales desde la API
  useEffect(() => {
    const fetchProfessionals = async () => {
      setLoading(true);
      try {
        // Configurar parámetros de búsqueda
        const params: any = {};
        if (searchQuery) {
          params.search = searchQuery;
        }
        if (specialtyFilter) {
          params.specialty = specialtyFilter;
        }
        
        // Obtener datos de profesionales desde la API
        const data = await professionalService.getAll(params);
        setProfessionals(data);
      } catch (error) {
        console.error('Error al cargar profesionales:', error);
        // Usar datos simulados como fallback
        setProfessionals(mockProfessionals);
      } finally {
        setLoading(false);
      }
    };

    // Agregar un ligero retraso para evitar demasiadas llamadas a la API cuando se escribe en el buscador
    const delaySearch = setTimeout(() => {
      fetchProfessionals();
    }, 500);
    
    return () => clearTimeout(delaySearch);
  }, [searchQuery, specialtyFilter]);

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
  };

  const handleSpecialtyFilter = (specialty: string) => {
    setSpecialtyFilter(specialty === specialtyFilter ? null : specialty);
  };

  // Obtener lista de especialidades únicas
  const specialties = Array.from(
    new Set(professionals.map(professional => professional.specialty))
  ).sort();

  // Filtrar profesionales según la búsqueda y el filtro de especialidad
  const filteredProfessionals = professionals.filter(professional => {
    const matchesSearch = searchQuery === '' || (
      `${professional.first_name} ${professional.last_name}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
      professional.specialty.toLowerCase().includes(searchQuery.toLowerCase())
    );
    
    const matchesSpecialty = specialtyFilter === null || professional.specialty === specialtyFilter;
    
    return matchesSearch && matchesSpecialty;
  });

  // Función para generar las iniciales a partir del nombre y apellido
  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  // Generar color aleatorio pero consistente basado en el ID
  const getAvatarColor = (id: number) => {
    const colors = [
      '#1976d2', // Azul
      '#388e3c', // Verde
      '#d32f2f', // Rojo
      '#7b1fa2', // Púrpura
      '#c2185b', // Rosa
      '#f57c00', // Naranja
      '#0097a7', // Cian
      '#5d4037'  // Marrón
    ];
    
    return colors[id % colors.length];
  };

  return (
    <Box>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 'bold' }}>
          Profesionales
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => navigate('/professionals/new')}
        >
          Nuevo Profesional
        </Button>
      </Box>

      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', mb: 2 }}>
          <TextField
            fullWidth
            placeholder="Buscar por nombre o especialidad"
            variant="outlined"
            size="small"
            value={searchQuery}
            onChange={handleSearchChange}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />
        </Box>

        {specialties.length > 0 && (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 2 }}>
            {specialties.map((specialty) => (
              <Chip
                key={specialty}
                label={specialty}
                onClick={() => handleSpecialtyFilter(specialty)}
                variant={specialtyFilter === specialty ? 'filled' : 'outlined'}
                color={specialtyFilter === specialty ? 'primary' : 'default'}
              />
            ))}
          </Box>
        )}
      </Paper>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 5 }}>
          <CircularProgress />
        </Box>
      ) : filteredProfessionals.length > 0 ? (
        <Grid container spacing={3}>
          {filteredProfessionals.map(professional => (
            <Grid item xs={12} sm={6} md={4} key={professional.id}>
              <Card 
                sx={{ 
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: 4
                  } 
                }}
              >
                <CardContent sx={{ flexGrow: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Avatar 
                      sx={{ 
                        width: 64, 
                        height: 64, 
                        bgcolor: getAvatarColor(professional.id),
                        mr: 2 
                      }}
                    >
                      {getInitials(professional.first_name, professional.last_name)}
                    </Avatar>
                    
                    <Box sx={{ flexGrow: 1 }}>
                      <Typography variant="h6" component="h2">
                        {professional.first_name} {professional.last_name}
                      </Typography>
                      <Chip
                        label={professional.specialty}
                        size="small"
                        sx={{ mt: 0.5 }}
                      />
                    </Box>
                    
                    <IconButton size="small">
                      <MoreVertIcon />
                    </IconButton>
                  </Box>
                  
                  <Box sx={{ mb: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <EmailIcon fontSize="small" sx={{ color: 'text.secondary', mr: 1 }} />
                      <Typography variant="body2" color="text.secondary">
                        {professional.email}
                      </Typography>
                    </Box>
                    
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <PhoneIcon fontSize="small" sx={{ color: 'text.secondary', mr: 1 }} />
                      <Typography variant="body2" color="text.secondary">
                        {professional.phone_number}
                      </Typography>
                    </Box>
                  </Box>
                  
                  <Divider sx={{ my: 2 }} />
                  
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" color="text.secondary">
                      {professional.appointments_count} citas atendidas
                    </Typography>
                    
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      {[1, 2, 3, 4, 5].map((star) => (
                        <span 
                          key={star}
                          style={{ 
                            color: star <= Math.round(professional.rating) ? '#FFD700' : '#e0e0e0',
                            fontSize: '16px'
                          }}
                        >
                          ★
                        </span>
                      ))}
                      <Typography variant="body2" sx={{ ml: 0.5 }}>
                        ({professional.rating})
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
                
                <CardActions sx={{ p: 2, pt: 0 }}>
                  <Button 
                    size="small" 
                    onClick={() => navigate(`/professionals/${professional.id}`)}
                  >
                    Ver perfil
                  </Button>
                  <Button 
                    size="small" 
                    onClick={() => navigate(`/appointments/new?professional=${professional.id}`)}
                  >
                    Agendar cita
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      ) : (
        <Box sx={{ textAlign: 'center', py: 5 }}>
          <Typography variant="body1" color="text.secondary">
            No se encontraron profesionales con los criterios de búsqueda actuales.
          </Typography>
          <Button
            variant="outlined"
            startIcon={<AddIcon />}
            sx={{ mt: 2 }}
            onClick={() => navigate('/professionals/new')}
          >
            Agregar nuevo profesional
          </Button>
        </Box>
      )}
    </Box>
  );
};

export default ProfessionalsPage;
