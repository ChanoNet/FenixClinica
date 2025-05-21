import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  TextField,
  InputAdornment,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  IconButton,
  Chip,
  Avatar,
  CircularProgress,
  Tooltip
} from '@mui/material';
import {
  Search as SearchIcon,
  Add as AddIcon,
  Visibility as VisibilityIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  FilterList as FilterListIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import patientService from '../../services/api/patientService';
import { useAuth } from '../../context/AuthContext';

// Datos simulados de pacientes
const mockPatients = [
  {
    id: 1,
    first_name: 'Juan',
    last_name: 'Pérez',
    email: 'juan.perez@example.com',
    phone_number: '555-123-4567',
    profile_picture: null,
    birth_date: '1980-05-15',
    appointments_count: 8,
    last_visit: '2025-04-30'
  },
  {
    id: 2,
    first_name: 'Laura',
    last_name: 'Rodríguez',
    email: 'laura.rodriguez@example.com',
    phone_number: '555-234-5678',
    profile_picture: null,
    birth_date: '1992-08-21',
    appointments_count: 5,
    last_visit: '2025-05-02'
  },
  {
    id: 3,
    first_name: 'Roberto',
    last_name: 'Fernández',
    email: 'roberto.fernandez@example.com',
    phone_number: '555-345-6789',
    profile_picture: null,
    birth_date: '1975-11-10',
    appointments_count: 12,
    last_visit: '2025-05-10'
  },
  {
    id: 4,
    first_name: 'Carmen',
    last_name: 'Gutiérrez',
    email: 'carmen.gutierrez@example.com',
    phone_number: '555-456-7890',
    profile_picture: null,
    birth_date: '1988-02-28',
    appointments_count: 3,
    last_visit: '2025-04-15'
  },
  {
    id: 5,
    first_name: 'Miguel',
    last_name: 'Sánchez',
    email: 'miguel.sanchez@example.com',
    phone_number: '555-567-8901',
    profile_picture: null,
    birth_date: '1995-07-03',
    appointments_count: 2,
    last_visit: '2025-05-05'
  }
];

const PatientsPage: React.FC = () => {
  const [patients, setPatients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  const { user } = useAuth();

  useEffect(() => {
    const fetchPatients = async () => {
      setLoading(true);
      try {
        // Configurar parámetros de búsqueda
        const params: any = {};
        if (searchQuery) {
          params.search = searchQuery;
        }
        
        // Obtener datos de pacientes desde la API
        const data = await patientService.getAll(params);
        
        // Asegurarse de que los datos son un array
        if (data && Array.isArray(data)) {
          setPatients(data);
        } else if (data && data.results && Array.isArray(data.results)) {
          // Si la respuesta tiene un formato {results: [...]}
          setPatients(data.results);
        } else if (data) {
          console.warn('La respuesta de pacientes no tiene el formato esperado:', data);
          setPatients([]);
        } else {
          setPatients([]);
        }
      } catch (error) {
        console.error('Error al cargar pacientes:', error);
        // Usar datos simulados como fallback
        setPatients(mockPatients);
      } finally {
        setLoading(false);
      }
    };

    // Agregar un ligero retraso para evitar demasiadas llamadas a la API cuando se escribe en el buscador
    const delaySearch = setTimeout(() => {
      fetchPatients();
    }, 500);
    
    return () => clearTimeout(delaySearch);
  }, [searchQuery]);

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
    setPage(0);
  };

  // Asegurarnos de que patients es un array antes de aplicar filter
  const safePatients = Array.isArray(patients) ? patients : [];
  
  // Filtrar pacientes según la búsqueda
  const filteredPatients = safePatients.filter(patient => {
    if (!patient) return false;
    
    const fullName = `${patient.first_name || ''} ${patient.last_name || ''}`.toLowerCase();
    const email = (patient.email || '').toLowerCase();
    const phone = patient.phone_number || '';
    
    return fullName.includes(searchQuery.toLowerCase()) ||
           email.includes(searchQuery.toLowerCase()) ||
           phone.includes(searchQuery);
  });

  // Calcular edad a partir de la fecha de nacimiento
  const calculateAge = (birthDateString: string) => {
    const birthDate = new Date(birthDateString);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDifference = today.getMonth() - birthDate.getMonth();
    
    if (monthDifference < 0 || (monthDifference === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  };

  // Función para generar las iniciales a partir del nombre y apellido
  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  // Formatear fecha
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES');
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
          Pacientes
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => navigate('/patients/new')}
        >
          Nuevo Paciente
        </Button>
      </Box>

      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', mb: 2 }}>
          <TextField
            fullWidth
            placeholder="Buscar por nombre, email o teléfono"
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
      </Paper>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 5 }}>
          <CircularProgress />
        </Box>
      ) : filteredPatients.length > 0 ? (
        <Paper>
          <TableContainer>
            <Table aria-label="tabla de pacientes">
              <TableHead>
                <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                  <TableCell>Paciente</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Teléfono</TableCell>
                  <TableCell>Edad</TableCell>
                  <TableCell>Última visita</TableCell>
                  <TableCell>Citas</TableCell>
                  <TableCell align="center">Acciones</TableCell>
                </TableRow>
              </TableHead>
              
              <TableBody>
                {filteredPatients
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((patient) => (
                    <TableRow
                      key={patient.id}
                      hover
                      sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                    >
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Avatar
                            sx={{
                              bgcolor: getAvatarColor(patient.id),
                              mr: 2,
                              width: 40,
                              height: 40
                            }}
                          >
                            {getInitials(patient.first_name, patient.last_name)}
                          </Avatar>
                          <Box>
                            <Typography variant="body1">
                              {patient.first_name} {patient.last_name}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      
                      <TableCell>{patient.email}</TableCell>
                      <TableCell>{patient.phone_number}</TableCell>
                      <TableCell>{calculateAge(patient.birth_date)} años</TableCell>
                      <TableCell>{patient.last_visit ? formatDate(patient.last_visit) : 'Sin visitas'}</TableCell>
                      
                      <TableCell>
                        <Chip
                          label={`${patient.appointments_count} citas`}
                          size="small"
                          color={patient.appointments_count > 0 ? "primary" : "default"}
                          variant={patient.appointments_count > 0 ? "filled" : "outlined"}
                        />
                      </TableCell>
                      
                      <TableCell align="center">
                        <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                          <Tooltip title="Ver detalles">
                            <IconButton
                              size="small"
                              color="primary"
                              onClick={() => navigate(`/patients/${patient.id}`)}
                            >
                              <VisibilityIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          
                          <Tooltip title="Editar">
                            <IconButton
                              size="small"
                              color="primary"
                              onClick={() => navigate(`/patients/${patient.id}/edit`)}
                              sx={{ ml: 1 }}
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          
                          <Tooltip title="Agendar cita">
                            <IconButton
                              size="small"
                              color="primary"
                              onClick={() => navigate(`/appointments/new?patient=${patient.id}`)}
                              sx={{ ml: 1 }}
                            >
                              <AddIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          
          <TablePagination
            rowsPerPageOptions={[5, 10, 25]}
            component="div"
            count={filteredPatients.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            labelRowsPerPage="Filas por página:"
            labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count}`}
          />
        </Paper>
      ) : (
        <Box sx={{ textAlign: 'center', py: 5 }}>
          <Typography variant="body1" color="text.secondary">
            No se encontraron pacientes con los criterios de búsqueda actuales.
          </Typography>
          <Button
            variant="outlined"
            startIcon={<AddIcon />}
            sx={{ mt: 2 }}
            onClick={() => navigate('/patients/new')}
          >
            Agregar nuevo paciente
          </Button>
        </Box>
      )}
    </Box>
  );
};

export default PatientsPage;
