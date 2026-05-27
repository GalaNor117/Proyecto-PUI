# Plataforma de Integración PUI

Plataforma de integración con la **Plataforma Única de Identidad (PUI)** del Gobierno de México para instituciones financieras clasificadas como "institución diversa".

Permite recibir reportes de personas desaparecidas del sistema gubernamental PUI y cruzarlos automáticamente contra los registros administrativos internos de la institución financiera, notificando coincidencias en tiempo real.

---

## Índice

1. [Stack tecnológico](#stack-tecnológico)
2. [Arquitectura general](#arquitectura-general)
3. [Despliegue en Windows Server 2019](#despliegue-en-windows-server-2019)
   - [Requisitos previos](#requisitos-previos)
   - [Paso 1 — Habilitar WSL2](#paso-1--habilitar-wsl2)
   - [Paso 2 — Instalar Ubuntu 22.04](#paso-2--instalar-ubuntu-2204-en-wsl2)
   - [Paso 3 — Instalar Docker Engine](#paso-3--instalar-docker-engine-en-wsl2)
   - [Paso 4 — Transferir el proyecto](#paso-4--transferir-el-proyecto-al-servidor)
   - [Paso 5 — Obtener certificado SSL](#paso-5--obtener-certificado-ssl-lets-encrypt)
   - [Paso 6 — Configurar variables de entorno](#paso-6--configurar-variables-de-entorno)
   - [Paso 7 — Montar certificados en Docker](#paso-7--montar-certificados-en-docker)
   - [Paso 8 — Abrir puertos en el Firewall](#paso-8--abrir-puertos-en-el-firewall-de-windows)
   - [Paso 9 — Levantar la plataforma](#paso-9--levantar-la-plataforma)
   - [Paso 10 — Crear primer operador del panel](#paso-10--crear-primer-operador-del-panel)
   - [Paso 11 — Verificar que todo funciona](#paso-11--verificar-que-todo-funciona)
4. [Renovación automática del certificado SSL](#renovación-automática-del-certificado-ssl)
5. [Variables de entorno — referencia completa](#variables-de-entorno--referencia-completa)
6. [Conectar la base de datos interna](#conectar-la-base-de-datos-interna)
7. [Fases de búsqueda](#fases-de-búsqueda)
8. [Endpoints expuestos a la PUI](#endpoints-expuestos-a-la-pui)
9. [Panel de administración](#panel-de-administración)
10. [Registro administrativo en Llave MX](#registro-administrativo-en-llave-mx)
11. [Pruebas de seguridad requeridas antes de producción](#pruebas-de-seguridad-requeridas-antes-de-producción)
12. [Seguridad implementada](#seguridad-implementada)
13. [Mantenimiento y actualizaciones](#mantenimiento-y-actualizaciones)

---

## Stack tecnológico

| Capa | Tecnología |
|------|-----------|
| **Backend** | NestJS 10 · TypeScript 5 strict · Node.js 20 |
| **Base de datos** | PostgreSQL 15 |
| **Caché de tokens** | Redis 7 |
| **Frontend** | Angular 17 standalone · Angular Material |
| **Contenedores** | Docker Engine · Docker Compose |
| **Servidor web** | nginx (dentro del contenedor frontend) |
| **SSL** | Let's Encrypt (win-acme o certbot) |

---

## Arquitectura general

```
Internet / PUI
     │
     │ HTTPS :443
     ▼
┌─────────────────────────────────────────────┐
│  Windows Server 2019                        │
│                                             │
│  WSL2 (Ubuntu 22.04)                        │
│  ┌──────────────────────────────────────┐   │
│  │  Docker Engine                       │   │
│  │                                      │   │
│  │  ┌──────────┐    ┌────────────────┐  │   │
│  │  │ frontend │    │   backend      │  │   │
│  │  │  nginx   │───▶│   NestJS :3000 │  │   │
│  │  │  :80/443 │    └───────┬────────┘  │   │
│  │  └──────────┘            │           │   │
│  │                   ┌──────┴──────┐    │   │
│  │              ┌────┴────┐  ┌─────┴──┐ │   │
│  │              │PostgreSQL│  │ Redis  │ │   │
│  │              │  :5432  │  │ :6379  │ │   │
│  │              └─────────┘  └────────┘ │   │
│  └──────────────────────────────────────┘   │
└─────────────────────────────────────────────┘
```

El frontend (nginx) recibe todas las peticiones:
- `/api/*` → proxy inverso al backend NestJS
- `/*` → sirve la SPA Angular

---

## Despliegue en Windows Server 2019

### Requisitos previos

| Requisito | Detalle |
|-----------|---------|
| **OS** | Windows Server 2019 (versión 1809 o superior, con todas las actualizaciones) |
| **RAM** | Mínimo 4 GB libres para WSL2 + Docker |
| **Disco** | 20 GB libres |
| **Acceso** | Cuenta de Administrador en el servidor |
| **Red** | IP pública fija o nombre de dominio apuntando al servidor |
| **Dominio** | Un dominio o subdominio propio (ej. `pui.financiera.com.mx`) |

> **Importante:** Necesitas acceso de Administrador para todos los pasos siguientes.

---

### Paso 1 — Habilitar WSL2

Abre **PowerShell como Administrador** y ejecuta:

```powershell
# Habilitar el subsistema de Windows para Linux
dism.exe /online /enable-feature /featurename:Microsoft-Windows-Subsystem-Linux /all /norestart

# Habilitar la plataforma de máquina virtual (requerido por WSL2)
dism.exe /online /enable-feature /featurename:VirtualMachinePlatform /all /norestart

# Reiniciar el servidor
Restart-Computer
```

Después del reinicio, abre **PowerShell como Administrador** de nuevo:

```powershell
# Establecer WSL2 como versión por defecto
wsl --set-default-version 2

# Actualizar el kernel de WSL (descargar el instalador)
# Descarga manual: https://aka.ms/wsl2kernel
# O con winget si está disponible:
winget install Microsoft.WSL
```

> Si `winget` no está disponible, descarga el actualizador del kernel desde:
> **https://aka.ms/wsl2kernel** e instálalo manualmente.

---

### Paso 2 — Instalar Ubuntu 22.04 en WSL2

```powershell
# Instalar Ubuntu 22.04 desde la tienda
wsl --install -d Ubuntu-22.04

# Verificar que quedó en WSL2
wsl --list --verbose
# Debe mostrar: Ubuntu-22.04   Running   2
```

Al instalarse por primera vez, WSL te pedirá crear un usuario de Linux (ej. `adminpui` con una contraseña). Guarda esas credenciales.

---

### Paso 3 — Instalar Docker Engine en WSL2

Abre la terminal de Ubuntu (busca "Ubuntu 22.04" en el menú Inicio de Windows Server) y ejecuta:

```bash
# Actualizar paquetes base
sudo apt update && sudo apt upgrade -y

# Instalar dependencias
sudo apt install -y ca-certificates curl gnupg lsb-release

# Agregar la clave GPG oficial de Docker
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | \
  sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg

# Agregar el repositorio de Docker
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] \
  https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Instalar Docker Engine + plugin Compose
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# Agregar tu usuario al grupo docker (evita usar sudo en cada comando)
sudo usermod -aG docker $USER
newgrp docker

# Iniciar Docker
sudo service docker start

# Verificar instalación
docker --version
docker compose version
```

Para que Docker arranque automáticamente al iniciar WSL2, agrega esto al final de `~/.bashrc`:

```bash
# Dentro de Ubuntu WSL2
echo '# Auto-start Docker
if [ "$(sudo service docker status 2>&1)" != " * Docker is running" ]; then
  sudo service docker start > /dev/null 2>&1
fi' >> ~/.bashrc

source ~/.bashrc
```

Permite al usuario de Ubuntu ejecutar Docker sin contraseña (necesario para auto-start):

```bash
echo "$USER ALL=(ALL) NOPASSWD: /usr/sbin/service docker start" | \
  sudo tee /etc/sudoers.d/docker-autostart
```

---

### Paso 4 — Transferir el proyecto al servidor

**Opción A — Con WinSCP (interfaz gráfica, recomendada):**

1. Descarga WinSCP: [winscp.net](https://winscp.net)
2. Conéctate al servidor vía SFTP con tu cuenta de administrador
3. Copia la carpeta `pui-platform` a `C:\pui-platform` (o donde prefieras)

**Opción B — Con PowerShell desde tu máquina local:**

```powershell
# Desde tu máquina de desarrollo, comprimir el proyecto
Compress-Archive -Path "C:\Users\slonw\Desktop\Proyecto-PUI\pui-platform" `
  -DestinationPath "C:\temp\pui-platform.zip"

# Copiar al servidor (reemplaza IP_SERVIDOR con la IP real)
scp C:\temp\pui-platform.zip administrador@IP_SERVIDOR:C:\pui-platform.zip
```

En el servidor, descomprimir:

```powershell
# En PowerShell del servidor
Expand-Archive -Path C:\pui-platform.zip -DestinationPath C:\pui-platform
```

**Acceder al proyecto desde WSL2:**

```bash
# Dentro de Ubuntu WSL2
# Las unidades de Windows están en /mnt/c/, /mnt/d/, etc.
ls /mnt/c/pui-platform/

# Crear un enlace simbólico para mayor comodidad
ln -s /mnt/c/pui-platform ~/pui-platform
cd ~/pui-platform
```

---

### Paso 5 — Obtener certificado SSL (Let's Encrypt)

Necesitas que el dominio ya apunte al servidor antes de este paso.

**Verificar que el DNS está propagado:**

```bash
# Dentro de Ubuntu WSL2
nslookup pui.financiera.com.mx
# Debe devolver la IP de tu servidor
```

**Instalar Certbot y obtener el certificado:**

```bash
# Dentro de Ubuntu WSL2
sudo apt install -y certbot

# Obtener certificado (el dominio debe apuntar a este servidor)
# Detén temporalmente cualquier servicio en el puerto 80
sudo certbot certonly --standalone -d pui.financiera.com.mx \
  --email admin@financiera.com.mx --agree-tos --non-interactive

# Los certificados quedan en:
# /etc/letsencrypt/live/pui.financiera.com.mx/fullchain.pem
# /etc/letsencrypt/live/pui.financiera.com.mx/privkey.pem
ls /etc/letsencrypt/live/pui.financiera.com.mx/
```

**Copiar los certificados a una ruta accesible por Docker:**

```bash
# Crear carpeta de certificados en el proyecto
mkdir -p ~/pui-platform/certs

# Copiar (se necesita sudo porque /etc/letsencrypt tiene permisos restrictivos)
sudo cp /etc/letsencrypt/live/pui.financiera.com.mx/fullchain.pem ~/pui-platform/certs/cert.pem
sudo cp /etc/letsencrypt/live/pui.financiera.com.mx/privkey.pem ~/pui-platform/certs/key.pem

# Dar permisos de lectura
sudo chmod 644 ~/pui-platform/certs/cert.pem
sudo chmod 640 ~/pui-platform/certs/key.pem
```

---

### Paso 6 — Configurar variables de entorno

```bash
# Dentro de Ubuntu WSL2
cd ~/pui-platform/backend
cp .env.example .env
nano .env
```

Edita cada valor según tu entorno. A continuación la guía completa:

```env
# ─────────────────────────────────────────────────────
# IDENTIDAD DE LA INSTITUCIÓN
# ─────────────────────────────────────────────────────

# RFC con homoclave de la institución financiera
RFC_INSTITUCION=XAXX010101000

# URL pública donde la PUI enviará los webhooks (tu dominio)
URL_BASE=https://pui.financiera.com.mx

# Contraseña con la que la institución se autentica ante la PUI
# (La define la institución y se registra en Llave MX)
CLAVE_PUI_LOGIN=ClaveSegura2026!

# Clave que la PUI incluye en sus webhooks para verificar autenticidad
# (La define la institución y se comunica a la PUI en el registro)
CLAVE_WEBHOOK=OtraClaveSegura2026!

# Clave AES-256 en base64 para cifrar biométricos
# Generar con: openssl rand -base64 32
CLAVE_BIOMETRICOS=<resultado_de_openssl_rand_-base64_32>

# ─────────────────────────────────────────────────────
# CONEXIÓN CON EL SISTEMA PUI (Gobierno de México)
# ─────────────────────────────────────────────────────

# URL base de la API PUI (no cambiar salvo nueva versión del manual)
PUI_BASE_URL=https://www.api.plataformadebusqueda.gob.mx/api/2_3_0

# Origin requerido por PUI en las peticiones
PUI_ORIGIN=https://www.api.plataformadebusqueda.gob.mx

# ─────────────────────────────────────────────────────
# SEGURIDAD JWT
# ─────────────────────────────────────────────────────

# Secret para tokens de webhook (mínimo 32 caracteres)
# Generar con: openssl rand -hex 32
JWT_SECRET=<resultado_de_openssl_rand_-hex_32>
JWT_EXPIRATION_SECONDS=3600

# Secret para tokens del panel de operadores (mínimo 32 caracteres)
# Generar con: openssl rand -hex 32
PANEL_JWT_SECRET=<resultado_de_openssl_rand_-hex_32_diferente>
PANEL_JWT_EXPIRATION_SECONDS=28800

# Dominio desde donde se accede al panel (para CORS)
PANEL_ORIGIN=https://pui.financiera.com.mx

# ─────────────────────────────────────────────────────
# BASE DE DATOS PostgreSQL
# ─────────────────────────────────────────────────────

# Con Docker Compose el host es siempre "postgres" (nombre del servicio)
DATABASE_URL=postgresql://pui_user:CAMBIA_ESTA_PASSWORD@postgres:5432/pui_integration

# ─────────────────────────────────────────────────────
# REDIS (caché de tokens PUI)
# ─────────────────────────────────────────────────────

# Con Docker Compose el host es siempre "redis" (nombre del servicio)
REDIS_URL=redis://redis:6379

# ─────────────────────────────────────────────────────
# SCHEDULER — FASE 3 (búsqueda continua)
# ─────────────────────────────────────────────────────

# Cron expression — por defecto cada hora en punto
# Formato: minuto hora día-mes mes día-semana
BUSQUEDA_CONTINUA_CRON=0 * * * *

# ─────────────────────────────────────────────────────
# TLS — rutas dentro del contenedor (no cambiar)
# ─────────────────────────────────────────────────────

TLS_CERT_PATH=/certs/cert.pem
TLS_KEY_PATH=/certs/key.pem

# ─────────────────────────────────────────────────────
# APLICACIÓN
# ─────────────────────────────────────────────────────

PORT=3000

# development: TypeORM crea/actualiza las tablas automáticamente (NO usar en prod)
# production: requiere ejecutar migraciones manualmente
NODE_ENV=production
```

**Generar las claves seguras** (ejecutar dentro de Ubuntu WSL2):

```bash
# Generar JWT_SECRET
openssl rand -hex 32

# Generar PANEL_JWT_SECRET (diferente al anterior)
openssl rand -hex 32

# Generar CLAVE_BIOMETRICOS
openssl rand -base64 32
```

**Cambiar la contraseña de PostgreSQL en docker-compose.yml:**

Edita `~/pui-platform/docker-compose.yml` y cambia `pui_pass` por una contraseña segura:

```bash
nano ~/pui-platform/docker-compose.yml
```

Línea a modificar:

```yaml
postgres:
  environment:
    POSTGRES_PASSWORD: TU_PASSWORD_SEGURA_AQUI   # <-- cambiar esto
```

Y actualiza también el `.env`:

```env
DATABASE_URL=postgresql://pui_user:TU_PASSWORD_SEGURA_AQUI@postgres:5432/pui_integration
```

---

### Paso 7 — Montar certificados en Docker

El `docker-compose.yml` ya está configurado para montar la carpeta `./certs` del proyecto. Verifica que la línea exista:

```bash
grep -A2 "volumes:" ~/pui-platform/docker-compose.yml | grep certs
# Debe mostrar: - ./certs:/certs:ro
```

Si no aparece, edita el archivo:

```bash
nano ~/pui-platform/docker-compose.yml
```

Y asegúrate de que el servicio `backend` tenga:

```yaml
backend:
  volumes:
    - ./certs:/certs:ro
```

---

### Paso 8 — Abrir puertos en el Firewall de Windows

Desde **PowerShell como Administrador** en Windows Server (no en WSL2):

```powershell
# Abrir puerto 80 (HTTP — necesario para renovar certificados)
New-NetFirewallRule -DisplayName "PUI HTTP" `
  -Direction Inbound -Protocol TCP -LocalPort 80 -Action Allow

# Abrir puerto 443 (HTTPS — tráfico principal)
New-NetFirewallRule -DisplayName "PUI HTTPS" `
  -Direction Inbound -Protocol TCP -LocalPort 443 -Action Allow

# Verificar que se crearon
Get-NetFirewallRule -DisplayName "PUI*" | Select-Object DisplayName, Enabled, Direction
```

> Si el servidor está detrás de un router o firewall de red, también debes abrir los puertos 80 y 443 ahí y redirigirlos a la IP interna del servidor.

---

### Paso 9 — Levantar la plataforma

```bash
# Dentro de Ubuntu WSL2
cd ~/pui-platform

# Primera vez: construir imágenes y levantar todos los servicios
docker compose up --build -d

# Seguir los logs en tiempo real para verificar que inicia sin errores
docker compose logs -f

# Ctrl+C para salir de los logs (los contenedores siguen corriendo)
```

**Verificar que todos los contenedores están en ejecución:**

```bash
docker compose ps
```

Deberías ver algo así:

```
NAME                    STATUS          PORTS
pui-platform-backend    Up (healthy)    0.0.0.0:3000->3000/tcp
pui-platform-frontend   Up              0.0.0.0:80->80/tcp, 0.0.0.0:443->443/tcp
pui-platform-postgres   Up (healthy)    5432/tcp
pui-platform-redis      Up (healthy)    6379/tcp
```

> Si algún contenedor aparece como `Exit` o `Restarting`, revisa sus logs:
> ```bash
> docker compose logs backend
> docker compose logs postgres
> ```

---

### Paso 10 — Crear primer operador del panel

```bash
# Dentro de Ubuntu WSL2
# Generar el hash bcrypt de la contraseña del primer administrador
docker exec pui-platform-backend node -e \
  "const b=require('bcrypt'); b.hash('TuContraseñaAdmin123!',12).then(h=>console.log(h))"
```

Copia el hash que devuelve (comienza con `$2b$12$...`) e inserta el usuario en la BD:

```bash
docker exec -it pui-platform-postgres psql -U pui_user -d pui_integration -c \
  "INSERT INTO usuario_panel (nombre, email, password_hash, rol, activo)
   VALUES ('Administrador', 'admin@financiera.com.mx', '\$2b\$12\$HASH_COPIADO_AQUI', 'admin', true);"
```

> **Nota:** Las contraseñas del panel deben cumplir mínimo 12 caracteres, una mayúscula, un número y un carácter especial.

---

### Paso 11 — Verificar que todo funciona

**Desde el servidor (Ubuntu WSL2):**

```bash
# Health check del backend
curl -k https://localhost:3000/health
# Respuesta esperada: {"status":"ok","database":"connected","redis":"connected"}

# Estado de conexión con PUI (requiere credenciales reales)
curl -k https://localhost:3000/health/pui
```

**Desde un navegador externo:**

```
https://pui.financiera.com.mx          →  Panel de administración (login)
https://pui.financiera.com.mx/api/health →  JSON con estado de todos los servicios
```

---

## Renovación automática del certificado SSL

Let's Encrypt emite certificados por 90 días. Configura renovación automática:

```bash
# Dentro de Ubuntu WSL2
# Agregar tarea cron para renovar cada 2 meses
(crontab -l 2>/dev/null; echo "0 3 1 */2 * \
  sudo certbot renew --quiet --pre-hook 'docker compose -f ~/pui-platform/docker-compose.yml stop frontend' \
  --post-hook 'sudo cp /etc/letsencrypt/live/pui.financiera.com.mx/fullchain.pem ~/pui-platform/certs/cert.pem && \
               sudo cp /etc/letsencrypt/live/pui.financiera.com.mx/privkey.pem ~/pui-platform/certs/key.pem && \
               docker compose -f ~/pui-platform/docker-compose.yml start frontend && \
               docker compose -f ~/pui-platform/docker-compose.yml restart backend'") | crontab -

# Verificar la tarea
crontab -l
```

**Probar la renovación sin ejecutarla realmente:**

```bash
sudo certbot renew --dry-run
```

---

## Variables de entorno — referencia completa

| Variable | Requerida | Descripción |
|----------|-----------|-------------|
| `RFC_INSTITUCION` | ✅ | RFC con homoclave de la institución financiera |
| `URL_BASE` | ✅ | URL pública del servidor (ej. `https://pui.financiera.com.mx`) |
| `CLAVE_PUI_LOGIN` | ✅ | Contraseña de la institución ante la PUI (se registra en Llave MX) |
| `CLAVE_WEBHOOK` | ✅ | Clave que la PUI incluye al llamar los webhooks |
| `CLAVE_BIOMETRICOS` | ✅ | Clave AES-256 en base64 para cifrar fotos y huellas |
| `PUI_BASE_URL` | ✅ | URL base de la API PUI del gobierno |
| `PUI_ORIGIN` | ✅ | Origin requerido por la PUI en las peticiones |
| `JWT_SECRET` | ✅ | Secret JWT para tokens de webhook (mín. 32 chars) |
| `JWT_EXPIRATION_SECONDS` | ✅ | Tiempo de vida del token de webhook en segundos |
| `PANEL_JWT_SECRET` | ✅ | Secret JWT para operadores del panel (mín. 32 chars) |
| `PANEL_JWT_EXPIRATION_SECONDS` | ✅ | Tiempo de vida del token del panel en segundos |
| `PANEL_ORIGIN` | ✅ | Dominio del panel para CORS |
| `DATABASE_URL` | ✅ | URL completa de conexión PostgreSQL |
| `REDIS_URL` | ✅ | URL de conexión Redis |
| `BUSQUEDA_CONTINUA_CRON` | ✅ | Cron expression para la Fase 3 de búsqueda |
| `TLS_CERT_PATH` | ✅ | Ruta del certificado TLS dentro del contenedor |
| `TLS_KEY_PATH` | ✅ | Ruta de la llave privada TLS dentro del contenedor |
| `PORT` | ✅ | Puerto del backend (default: 3000) |
| `NODE_ENV` | ✅ | `development` (auto-migrate) o `production` (migrations) |

---

## Conectar la base de datos interna

La plataforma viene con un **adaptador stub** que devuelve vacío hasta que se conecte la BD real de la institución. Esto es intencional: el sistema funciona completo, solo que no encontrará coincidencias hasta tener datos reales.

Para conectar la BD real de la institución:

### 1. Implementar el repositorio real

Crea el archivo `backend/src/sistema-interno/sistema-interno-real.repository.ts`:

```typescript
import { Injectable } from '@nestjs/common';
import { ISistemaInternoRepository } from './sistema-interno.repository.interface';
import { DatosBasicosPersona, EventoHistorico } from './sistema-interno.repository.interface';

@Injectable()
export class SistemaInternoRealRepository implements ISistemaInternoRepository {

  async buscarPorCURP(curp: string): Promise<DatosBasicosPersona | null> {
    // Conectar a tu BD interna y buscar la persona por CURP
    // Devuelve null si no existe
    const resultado = await tuConexionBD.query(
      'SELECT * FROM clientes WHERE curp = $1', [curp]
    );
    if (!resultado.rows.length) return null;
    
    const r = resultado.rows[0];
    return {
      curp: r.curp,
      nombre: r.nombre,
      apellidoPaterno: r.apellido_paterno,
      apellidoMaterno: r.apellido_materno,
      fechaNacimiento: r.fecha_nacimiento,
      // Campos opcionales: foto (Buffer), huella (Buffer)
    };
  }

  async obtenerHistorial(curp: string, fechaDesde: Date): Promise<EventoHistorico[]> {
    // Devuelve eventos de los últimos 12 años (Fase 2)
    const resultados = await tuConexionBD.query(
      'SELECT * FROM movimientos WHERE curp = $1 AND fecha >= $2',
      [curp, fechaDesde]
    );
    return resultados.rows.map(r => ({
      fecha: r.fecha,
      tipo: r.tipo_movimiento,
      descripcion: r.descripcion,
      monto: r.monto,
      sucursal: r.sucursal,
    }));
  }
}
```

### 2. Registrar el repositorio real

Edita `backend/src/sistema-interno/sistema-interno.module.ts`:

```typescript
// Reemplazar:
{ provide: SISTEMA_INTERNO_REPOSITORY, useClass: SistemaInternoStubRepository }

// Con:
{ provide: SISTEMA_INTERNO_REPOSITORY, useClass: SistemaInternoRealRepository }
```

### 3. Reconstruir el contenedor

```bash
docker compose up --build -d backend
```

El resto del sistema (biométricos, mapper de coincidencias, fases de búsqueda) se activa automáticamente cuando el repositorio devuelve datos reales.

---

## Fases de búsqueda

Al recibir un reporte de persona desaparecida, la plataforma ejecuta tres fases:

| Fase | Nombre | Descripción | Cuándo se ejecuta |
|------|--------|-------------|-------------------|
| **Fase 1** | Básica | Datos más recientes de la persona en la BD interna | Inmediatamente al recibir el reporte |
| **Fase 2** | Histórica | Eventos hasta 12 años desde la fecha de desaparición | Inmediatamente después de Fase 1 |
| **Fase 3** | Continua | Verifica nuevos eventos periódicamente mientras el reporte esté activo | Scheduler cron (configurado en `BUSQUEDA_CONTINUA_CRON`) |

Si se encuentra una coincidencia en cualquier fase, se notifica automáticamente a la PUI mediante el endpoint `busqueda-coincidencia` del gobierno.

---

## Endpoints expuestos a la PUI

La PUI llama a estos endpoints en tu servidor. Todos requieren autenticación.

| Método | Ruta | Descripción |
|--------|------|-------------|
| `POST` | `/login` | La PUI se autentica para obtener token JWT |
| `POST` | `/activar-reporte` | Nuevo reporte de persona desaparecida |
| `POST` | `/activar-reporte-prueba` | Prueba de conectividad (no genera búsqueda real) |
| `POST` | `/desactivar-reporte` | Persona localizada — detiene la Fase 3 |

La URL completa que debes registrar con la PUI es:

```
https://pui.financiera.com.mx/api
```

---

## Panel de administración

Accede en `https://pui.financiera.com.mx` con las credenciales del operador creado en el Paso 10.

| Sección | Descripción |
|---------|-------------|
| **Dashboard** | 4 métricas en tiempo real + indicador de conexión con PUI (verde/rojo) |
| **Reportes** | Lista paginada de reportes activos e históricos con insignias de fase (F1/F2/F3) |
| **Detalle de reporte** | Información completa + línea de tiempo vertical + coincidencias del reporte |
| **Coincidencias** | Historial de notificaciones enviadas a la PUI, filtrable por fase/fecha/reporte |
| **Logs** | Bitácora completa de actividad. CURP siempre enmascarada: `••••••••••••XXXX` |

---

## Registro administrativo en Llave MX

Antes de conectar a **producción**, el representante legal de la institución debe completar el proceso administrativo:

1. Ingresar a **[llave.gob.mx](https://llave.gob.mx)** con e.firma institucional
2. Registrar la institución como "entidad integrante PUI"
3. Proporcionar la URL base del webhook:
   ```
   https://pui.financiera.com.mx/api
   ```
4. Acordar y registrar la `CLAVE_WEBHOOK` (la institución la define)
5. Recibir del gobierno las credenciales de conexión para el `.env`:
   - `PUI_BASE_URL` (si cambia de la URL de pruebas)
   - Credenciales de autenticación PUI
6. Actualizar el `.env` con los valores de producción y reiniciar el backend:
   ```bash
   docker compose restart backend
   ```

> **Nota:** Existe un ambiente de **pruebas** de la PUI disponible antes de producción. Solicítalo durante el registro en Llave MX para validar la integración completa sin afectar datos reales.

---

## Pruebas de seguridad requeridas antes de producción

El **Manual Técnico PUI** (sección 8) exige tres tipos de pruebas antes de conectar al ambiente de producción:

### SAST — Análisis de código estático

```bash
# Dentro de Ubuntu WSL2, desde la raíz del proyecto
cd ~/pui-platform

# Instalar Semgrep (gratuito)
pip3 install semgrep

# Ejecutar análisis
semgrep scan --config auto backend/src/
semgrep scan --config auto frontend/src/
```

### SCA — Análisis de dependencias

```bash
# Auditoría de dependencias vulnerables
cd ~/pui-platform/backend && npm audit
cd ~/pui-platform/frontend && npm audit

# Si encuentra vulnerabilidades críticas, actualizar:
npm audit fix
```

### DAST — Análisis dinámico (con la plataforma corriendo)

```bash
# Instalar OWASP ZAP
docker pull ghcr.io/zaproxy/zaproxy:stable

# Ejecutar escaneo contra la plataforma
docker run -t ghcr.io/zaproxy/zaproxy:stable zap-baseline.py \
  -t https://pui.financiera.com.mx \
  -r zap-report.html
```

Los reportes deben revisarse y resolverse las vulnerabilidades **CRÍTICAS** y **ALTAS** antes de ir a producción.

---

## Seguridad implementada

| Mecanismo | Detalle |
|-----------|---------|
| **TLS 1.2 mínimo** | Requerido por el Manual PUI. Configurado en NestJS al leer los certificados |
| **Helmet** | Headers de seguridad HTTP completos en todas las respuestas |
| **CORS restringido** | Solo acepta peticiones del dominio configurado en `PANEL_ORIGIN` y `PUI_ORIGIN` |
| **Rate limiting** | 5 req/min en `/login`, 30 req/min en el resto de la API |
| **Validación de entrada** | `ValidationPipe` con `whitelist: true` — rechaza propiedades no declaradas en los DTOs |
| **CURP protegida** | Almacenada únicamente como SHA-256 en logs. Nunca en texto plano |
| **Tokens JWT** | Nunca aparecen en logs ni en respuestas de error |
| **Biométricos cifrados** | AES-256-GCM con IV aleatorio de 12 bytes por operación |
| **Contraseñas** | bcrypt con factor 12 para operadores del panel |
| **Autenticación dual** | JWT separados para webhooks PUI (`jwt-webhook`) y operadores del panel (`jwt-panel`) |

---

## Mantenimiento y actualizaciones

### Ver logs en tiempo real

```bash
# Todos los servicios
docker compose logs -f

# Solo el backend
docker compose logs -f backend

# Solo errores
docker compose logs backend 2>&1 | grep -i error
```

### Reiniciar un servicio

```bash
# Reiniciar solo el backend (sin perder datos)
docker compose restart backend

# Reiniciar todo
docker compose restart
```

### Actualizar el código

```bash
cd ~/pui-platform

# 1. Detener los servicios (los datos en PostgreSQL se conservan en el volumen)
docker compose down

# 2. Actualizar el código (copiar nuevos archivos o hacer git pull)

# 3. Reconstruir y levantar
docker compose up --build -d
```

### Backup de la base de datos

```bash
# Crear backup
docker exec pui-platform-postgres pg_dump -U pui_user pui_integration > \
  backup_$(date +%Y%m%d_%H%M%S).sql

# Restaurar backup
docker exec -i pui-platform-postgres psql -U pui_user pui_integration < backup_FECHA.sql
```

### Backup automatizado (ejecutar una vez)

```bash
# Cron que hace backup diario a las 2 AM
(crontab -l 2>/dev/null; echo "0 2 * * * docker exec pui-platform-postgres \
  pg_dump -U pui_user pui_integration > ~/backups/pui_\$(date +\%Y\%m\%d).sql") | crontab -

mkdir -p ~/backups
```

### Actualizar certificado manualmente

```bash
sudo certbot renew --force-renewal
sudo cp /etc/letsencrypt/live/pui.financiera.com.mx/fullchain.pem ~/pui-platform/certs/cert.pem
sudo cp /etc/letsencrypt/live/pui.financiera.com.mx/privkey.pem ~/pui-platform/certs/key.pem
docker compose restart backend
```

### Comandos útiles de diagnóstico

```bash
# Verificar uso de recursos
docker stats

# Verificar espacio en disco
df -h

# Ver variables de entorno cargadas en el backend
docker exec pui-platform-backend env | grep -v SECRET | grep -v PASSWORD

# Conectar a la BD directamente
docker exec -it pui-platform-postgres psql -U pui_user -d pui_integration

# Consultas útiles en la BD
# Ver reportes activos:
SELECT id, fecha_reporte, fase1_completada, fase2_completada, activo FROM reporte_activo WHERE activo = true;

# Ver últimas coincidencias:
SELECT * FROM coincidencia ORDER BY created_at DESC LIMIT 10;

# Ver últimos logs:
SELECT accion, resultado, created_at FROM log_interaccion ORDER BY created_at DESC LIMIT 20;
```

---

## Estructura del proyecto

```
pui-platform/
├── backend/
│   ├── src/
│   │   ├── auth/              # Autenticación webhook (jwt-webhook strategy)
│   │   ├── panel-auth/        # Autenticación panel (jwt-panel strategy)
│   │   ├── webhook/           # Endpoints que recibe la PUI
│   │   ├── busqueda/          # Fases 1, 2 y 3 de búsqueda
│   │   ├── pui-client/        # Cliente HTTP hacia la API PUI
│   │   ├── sistema-interno/   # Interfaz + stub del repositorio interno
│   │   ├── biometrico/        # Cifrado AES-256-GCM de biométricos
│   │   ├── curp/              # Validación y extracción de estado desde CURP
│   │   ├── database/          # Entidades TypeORM y repositorios
│   │   ├── logger/            # Audit logger con CURP hasheada
│   │   ├── panel/             # Endpoints del panel de administración
│   │   ├── config/            # Validación de variables de entorno
│   │   ├── health/            # Health check endpoint
│   │   └── main.ts            # Bootstrap con TLS, Helmet, CORS
│   ├── test/                  # Tests e2e
│   ├── .env.example           # Plantilla de variables de entorno
│   └── Dockerfile
├── frontend/
│   ├── src/app/
│   │   ├── core/              # Auth service, interceptor HTTP, guard
│   │   ├── features/          # Login, Dashboard, Reportes, Coincidencias, Logs
│   │   └── shared/            # Pipes, componentes reutilizables
│   ├── nginx.conf             # Proxy inverso + SPA routing
│   └── Dockerfile
├── certs/                     # Certificados TLS (no subir a git)
├── docker-compose.yml
└── README.md
```

---

*Versión del manual PUI implementada: 2.3.0*
*Última actualización de este README: Mayo 2026*
