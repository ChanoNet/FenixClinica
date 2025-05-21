"""
Configuración WSGI para el proyecto FenixClinicas.

Expone el módulo WSGI como una variable de nivel de módulo llamada ``application``.
"""

import os

from django.core.wsgi import get_wsgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'fenix_core.settings')

application = get_wsgi_application()
