# FenixClinicas

![FenixClinicas Logo](frontend/public/fenix_clinicas_logo.png)

## Descripción

FenixClinicas es un sistema integral de gestión clínica, diseñado para optimizar la administración de citas médicas, gestión de pacientes y profesionales de la salud. Esta plataforma proporciona un flujo eficiente para la programación, seguimiento y gestión de citas en entornos médicos.

## Características Principales

### Gestión de Citas
- Programación de citas con selección de profesional, paciente, fecha y hora
- Visualización de citas por diferentes filtros (profesional, paciente, estado)
- Sistema de estados de citas (programada, confirmada, completada, cancelada, no asistió)
- Capacidad para diferentes roles de usuario (paciente, profesional, administrador)
- Cancelación y reprogramación de citas
- Registro de motivos de cancelación

### Gestión de Pacientes
- Registro y actualización de información de pacientes
- Historial médico y de citas por paciente
- Búsqueda y filtrado avanzado de pacientes

### Gestión de Profesionales
- Registro de profesionales médicos y sus especialidades
- Configuración de horarios y disponibilidad
- Dashboard personalizado para cada profesional

### Panel Administrativo
- Control completo sobre usuarios, citas y configuraciones del sistema
- Reportes y estadísticas de uso
- Gestión de permisos y roles

## Tecnologías Utilizadas

### Backend
- Django (Framework de Python)
- Django REST Framework para API REST
- PostgreSQL para base de datos relacional
- JWT para autenticación segura

### Frontend
- React con TypeScript
- Material-UI para componentes de interfaz
- Redux para gestión de estado
- Axios para comunicación con API

## Estructura del Proyecto

- `/backend`: Contiene el proyecto Django (API REST).
- `/frontend`: Aplicación React con TypeScript.
  - `/src`: Código fuente del frontend
    - `/components`: Componentes reutilizables
    - `/pages`: Páginas principales de la aplicación
    - `/services`: Servicios para comunicación con API
    - `/context`: Contextos de React (autenticación, etc.)
    - `/utils`: Utilidades y funciones auxiliares

## Requisitos Previos

- Python 3.8 o superior
- Node.js 16.x o superior
- PostgreSQL 12 o superior
- Git

## Instalación y Configuración

### Backend (Django)

1. Clonar el repositorio:
   ```bash
   git clone https://github.com/tu-usuario/fenixclinicas.git
   cd fenixclinicas
   ```

2. Crear y activar un entorno virtual:
   ```bash
   python -m venv venv
   
   # En Windows
   venv\Scripts\activate
   
   # En Linux/Mac
   source venv/bin/activate
   ```

3. Instalar dependencias:
   ```bash
   pip install -r backend/requirements.txt
   ```

4. Configurar variables de entorno:
   - Crear archivo `.env` en el directorio `backend` basado en `.env.example`
   - Configurar conexión a base de datos, clave secreta, etc.

5. Realizar migraciones:
   ```bash
   cd backend
   python manage.py migrate
   ```

6. Crear superusuario:
   ```bash
   python manage.py createsuperuser
   ```

7. Iniciar servidor de desarrollo:
   ```bash
   python manage.py runserver
   ```
   El servidor estará disponible en http://localhost:8000/

### Frontend (React/TypeScript)

1. Instalar dependencias:
   ```bash
   cd frontend
   npm install
   ```

2. Configurar variables de entorno:
   - Crear archivo `.env` en el directorio `frontend` basado en `.env.example`
   - Configurar URL de la API y otras configuraciones necesarias

3. Iniciar servidor de desarrollo:
   ```bash
   npm start
   ```
   La aplicación estará disponible en http://localhost:3000/

## Despliegue en Producción

### Backend

1. Configurar settings para producción:
   - Establecer `DEBUG=False` en settings
   - Configurar `ALLOWED_HOSTS`
   - Asegurar que las claves secretas sean seguras

2. Configurar Gunicorn y Nginx:
   - Instalar Gunicorn: `pip install gunicorn`
   - Configurar Nginx como proxy inverso

3. Configurar base de datos PostgreSQL para producción

4. Recolectar archivos estáticos:
   ```bash
   python manage.py collectstatic
   ```

### Frontend

1. Crear build de producción:
   ```bash
   cd frontend
   npm run build
   ```

2. Servir los archivos estáticos con Nginx

## Desarrollo y Contribución

### Flujo de Trabajo

1. Crear una rama para cada funcionalidad/bugfix
2. Realizar commits con mensajes descriptivos
3. Enviar Pull Request a la rama principal
4. Esperar revisión de código

### Convenciones de Código

- Backend: Seguir PEP 8 para Python
- Frontend: Seguir ESLint/Prettier configurados en el proyecto

## Soporte

Para soporte, contactar a través de [soporte@fenixclinicas.com](mailto:soporte@fenixclinicas.com) o abrir un issue en el repositorio.

## Licencia

Este proyecto está bajo la Licencia MIT. Ver archivo [LICENSE](LICENSE) para más detalles.
