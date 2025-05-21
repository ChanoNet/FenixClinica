"""
Configuración ASGI para el proyecto FenixClinicas.

Expone el módulo ASGI como una variable de nivel de módulo llamada ``application``.
"""

import os

from django.core.asgi import get_asgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'fenix_core.settings')

application = get_asgi_application()
