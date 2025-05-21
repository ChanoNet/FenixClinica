# FenixClinicas

Sistema de gestión de turnos clínicos.

## Estructura del Proyecto

- `/backend`: Contiene el proyecto Django (API REST).
- `/frontend`: Contendrá la aplicación SPA (React/Vue).

## Configuración (Backend)

1.  Crear un entorno virtual: `python -m venv venv`
2.  Activar el entorno: `source venv/bin/activate` (Linux/macOS) o `venv\Scripts\activate` (Windows)
3.  Instalar dependencias: `pip install -r backend/requirements.txt`
4.  Crear un archivo `.env` en el directorio `backend` a partir de `backend/.env.example` y configurar las variables.
5.  Ejecutar migraciones: `python backend/manage.py migrate`
6.  Crear un superusuario: `python backend/manage.py createsuperuser`
7.  Iniciar el servidor de desarrollo: `python backend/manage.py runserver`
