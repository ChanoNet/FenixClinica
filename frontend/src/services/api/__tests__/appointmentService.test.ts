import axios from 'axios';
import appointmentService from '../appointmentService';
import { getAuthHeader } from '../utils';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

// Mock local storage y utils para los encabezados de autenticación
jest.mock('../utils', () => ({
  getAuthHeader: jest.fn().mockReturnValue({ Authorization: 'Bearer test-token' })
}));

describe('appointmentService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getAll', () => {
    it('debe devolver una lista de citas', async () => {
      // Datos simulados
      const mockAppointments = [
        { id: 1, patient_name: 'Juan Pérez', professional_name: 'Dra. García', start_time: '2025-06-01T10:00:00' },
        { id: 2, patient_name: 'María López', professional_name: 'Dr. Rodríguez', start_time: '2025-06-02T11:30:00' }
      ];

      // Configurar la respuesta simulada
      mockedAxios.get.mockResolvedValueOnce({ data: mockAppointments });

      // Llamar al servicio
      const result = await appointmentService.getAll();

      // Verificar que el servicio devuelve los datos esperados
      expect(result).toEqual(mockAppointments);
      expect(mockedAxios.get).toHaveBeenCalledWith(
        'http://localhost:8000/api/appointments/',
        { headers: getAuthHeader(), params: undefined }
      );
    });

    it('debe aplicar filtros cuando se proporcionan', async () => {
      // Datos simulados
      const mockAppointments = [{ id: 1, patient_name: 'Juan Pérez' }];
      
      // Parámetros de filtro
      const params = { patient_id: 1, status: 'scheduled' };

      // Configurar la respuesta simulada
      mockedAxios.get.mockResolvedValueOnce({ data: mockAppointments });

      // Llamar al servicio
      const result = await appointmentService.getAll(params);

      // Verificar que el servicio devuelve los datos esperados
      expect(result).toEqual(mockAppointments);
      expect(mockedAxios.get).toHaveBeenCalledWith(
        'http://localhost:8000/api/appointments/',
        { headers: getAuthHeader(), params }
      );
    });

    it('debe manejar errores correctamente', async () => {
      // Simular un error
      const errorMessage = 'Error al cargar las citas';
      mockedAxios.get.mockRejectedValueOnce(new Error(errorMessage));

      // Llamar al servicio y verificar que lanza el error
      await expect(appointmentService.getAll()).rejects.toThrow(errorMessage);
    });
  });

  describe('getById', () => {
    it('debe devolver una cita específica por ID', async () => {
      // Datos simulados
      const mockAppointment = { 
        id: 1, 
        patient_name: 'Juan Pérez', 
        professional_name: 'Dra. García', 
        start_time: '2025-06-01T10:00:00' 
      };

      // Configurar la respuesta simulada
      mockedAxios.get.mockResolvedValueOnce({ data: mockAppointment });

      // Llamar al servicio
      const result = await appointmentService.getById(1);

      // Verificar que el servicio devuelve los datos esperados
      expect(result).toEqual(mockAppointment);
      expect(mockedAxios.get).toHaveBeenCalledWith(
        'http://localhost:8000/api/appointments/1/',
        { headers: getAuthHeader() }
      );
    });
  });

  describe('create', () => {
    it('debe crear una nueva cita correctamente', async () => {
      // Datos simulados
      const appointmentData = {
        patient_id: 1,
        professional_id: 2,
        start_time: '2025-06-01T10:00:00',
        end_time: '2025-06-01T11:00:00',
        status: 'scheduled',
        notes: 'Consulta general'
      };

      const createdAppointment = {
        id: 1,
        ...appointmentData,
        created_at: '2025-05-17T18:30:00',
        updated_at: '2025-05-17T18:30:00'
      };

      // Configurar la respuesta simulada
      mockedAxios.post.mockResolvedValueOnce({ data: createdAppointment });

      // Llamar al servicio
      const result = await appointmentService.create(appointmentData);

      // Verificar que el servicio devuelve los datos esperados
      expect(result).toEqual(createdAppointment);
      expect(mockedAxios.post).toHaveBeenCalledWith(
        'http://localhost:8000/api/appointments/',
        appointmentData,
        { headers: getAuthHeader() }
      );
    });
  });
});
