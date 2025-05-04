# Gestion_Laboratorios_FACE

# Arquitectura del Proyecto: Gestor de Bitácoras y Asistencia para Consultores
1. Frontend (JavaScript)
Tecnologías: React.js 

Páginas Principales: (AUN NO FINAL)

- Login / Registro: Los usuarios (consultores) pueden iniciar sesión o registrarse.

- Dashboard: Un resumen con las bitácoras y un acceso a las funcionalidades principales.

- Bitácoras: Permite visualizar y agregar nuevas bitácoras de forma sencilla.

Asistencia: Interfaz para que los consultores hagan preguntas o accedan a la ayuda.

Autenticación: Implementar una autenticación JWT (JSON Web Token) para manejar la sesión de usuario.

2. Backend (Node.js con Express)
Tecnologías: Node.js, Express.js, JWT (JSON Web Tokens), Bcrypt (para encriptar contraseñas)

API RESTful:

# Autenticación:

Ruta de POST /auth/login: Verifica las credenciales y devuelve un JWT.

Ruta de POST /auth/register: Crea un nuevo usuario y devuelve el JWT.

# Bitácoras:

Ruta de GET /logs: Devuelve todas las bitácoras almacenadas.

Ruta de POST /logs: Permite crear una nueva bitácora.

Ruta de GET /logs/{id}: Detalles de una bitácora específica.

# Asistencia:

Ruta de GET /assistance: Lista de consultas y asistencia disponible.

Ruta de POST /assistance: Crea una solicitud de ayuda.


# Middleware:

Autenticación: Middleware que valida el token JWT en las rutas protegidas.

Validación de datos: Validación para los parámetros de las peticiones (por ejemplo, validar que la bitácora tiene un formato adecuado).

3. Base de Datos (POSTGRESQL)