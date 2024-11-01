# Granizo13
Estar en la carpeta GRANIZO13 (principal)

Correr ```npm install```

# Como ejecutar el código

1. Crear directorio `env` en la raíz del proyecto

- En ese mismo directorio crear un archivo `db_dev.env` con las siguientes variables de entorno (reemplazar los valores por los correspondientes):

```
POSTGRES_USER=
POSTGRES_PASSWORD=
POSTGRES_DB=
POSTGRES_PORT=5432
DATABASE_HOST=db_dev
```

- En ese mismo directorio crear un archivo `api_dev.env` con las siguientes variables de entorno (reemplazar los valores por los correspondientes):

```
DB_USERNAME=
DB_PASSWORD=
DB_NAME=
DB_PORT=5432
DB_HOST=db_dev
JWT_SECRET=
ADMIN_MAIL=admin@admin.com
OPENAI_API_KEY=
```

- Cree un archivo .env en la carpeta granizo porsiacaso con todo:

```
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_NAME=granizo13
DB_PORT=5432
DB_HOST=db_dev
JWT_SECRET=jajaja
ADMIN_MAIL=admin@admin.com
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DB=granizo13
POSTGRES_PORT=5432
DATABASE_HOST=db_dev
```

2. Ahora navega al directorio raíz del proyecto y ejecuta el siguiente comando:

```bash
docker-compose -f docker-compose.dev.yml build
```

Esto creará todos los servicios según lo definido en el archivo docker-compose.dev.yml

3. Ejecutar los servicios:

```bash
docker-compose -f docker-compose.dev.yml up
```

4. Para detener los servicios:

```bash
docker-compose -f docker-compose.dev.yml down
```

O bien apretar `Ctrl + C` en la terminal donde se están ejecutando los servicios.

5. Detener contenedores y eliminar volúmenes:

```bash
docker-compose -f docker-compose.dev.yml down -v
```