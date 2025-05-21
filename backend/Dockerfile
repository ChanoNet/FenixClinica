# Utilizar una imagen base de Python
FROM python:3.10-slim

# Establecer variables de entorno
ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

# Establecer el directorio de trabajo
WORKDIR /app

# Instalar dependencias del sistema (si son necesarias, por ejemplo, para psycopg2)
# RUN apt-get update && apt-get install -y libpq-dev gcc

# Copiar el archivo de dependencias
COPY requirements.txt .

# Instalar dependencias de Python
RUN pip install --no-cache-dir -r requirements.txt

# Crear un usuario no root para ejecutar la aplicación
RUN addgroup --system app && adduser --system --group app app
USER app

# Copiar el resto de la aplicación
COPY . .

# Exponer el puerto en el que Gunicorn escuchará
EXPOSE 8000

# Comando para ejecutar la aplicación con Gunicorn
# Este comando será sobrescrito o complementado en docker-compose.yml para desarrollo
# En producción, se podría usar algo como:
# CMD ["gunicorn", "config.wsgi:application", "--bind", "0.0.0.0:8000"]
# Por ahora, lo dejamos vacío o con un comando de placeholder, ya que Django aún no está creado.
CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"]
