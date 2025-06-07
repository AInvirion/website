# Guía de Despliegue en DigitalOcean App Platform

## Información del Proyecto
- **Tipo**: React + TypeScript + Vite
- **Puerto**: 8080
- **Build Command**: npm run build
- **Start Command**: npm start

## Variables de Entorno Requeridas

Estas variables deben configurarse en DigitalOcean App Platform:

```
NODE_ENV=production
VITE_SUPABASE_URL=https://vlycposuyicgnozzuvsr.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZseWNwb3N1eWljZ25venp1dnNyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDMxMjcyNDksImV4cCI6MjA1ODcwMzI0OX0.8Fol1BWaomNMv-6xx8Eb2A9bONoDNDMHnYIzfU-Edo8
VITE_STRIPE_PUBLISHABLE_KEY=[CLAVE_STRIPE_AQUI]
```

## Pasos de Configuración en DigitalOcean

### 1. Crear App
1. Ir a [cloud.digitalocean.com](https://cloud.digitalocean.com)
2. Click en **Create** → **Apps**
3. Seleccionar **GitHub** como fuente
4. Autorizar DigitalOcean para acceder a GitHub
5. Seleccionar repositorio: `role-based-service-hub`
6. Branch: `main`

### 2. Configurar Servicio Web
- **Name**: `role-based-service-hub-web`
- **Resource Type**: **Web Service**
- **Environment**: **Node.js**
- **Build Command**: `npm run build`
- **Run Command**: `npm start`
- **HTTP Port**: `8080`
- **HTTP Request Routes**: `/` (para capturar todas las rutas SPA)
- **Instance Size**: **Basic ($5/mes)** para empezar

### 3. Configurar Variables de Entorno
En la sección **"Environment Variables"** agregar todas las variables listadas arriba.

**⚠️ IMPORTANTE**: 
- Marcar como **"Encrypted"** las claves sensibles (SUPABASE_ANON_KEY, STRIPE_PUBLISHABLE_KEY)
- Usar exactamente los nombres de variables mostrados arriba

### 4. Seleccionar Región
- **Recomendado**: **NYC1** (Nueva York) para usuarios de América
- **Alternativas**: **AMS3** (Ámsterdam) para Europa, **SGP1** (Singapur) para Asia

### 5. Finalizar y Desplegar
1. Revisar toda la configuración
2. Click en **"Create App"**
3. Esperar el proceso de build y deploy (5-10 minutos)

## Verificación Post-Despliegue

Una vez completado el despliegue, verificar:

- [ ] **App accesible**: La URL proporcionada carga correctamente
- [ ] **Login funciona**: Autenticación con Supabase operativa
- [ ] **Navegación**: Todas las rutas funcionan (Dashboard, Services, Credits, etc.)
- [ ] **Sin errores**: Revisar los Runtime Logs en DigitalOcean
- [ ] **Funcionalidades**: Probar servicios principales de la app

## Configuración Opcional

### Dominio Personalizado
1. Ir a **Settings** → **Domains**
2. Click **"Add Domain"**
3. Ingresar tu dominio: `tudominio.com`
4. Configurar DNS en tu proveedor:
   ```
   Tipo: CNAME
   Nombre: @
   Valor: [tu-app].ondigitalocean.app
   ```

### Alertas de Monitoreo
1. Ir a **Settings** → **Alerts**
2. Configurar alertas para:
   - CPU Usage > 80%
   - Memory Usage > 85%
   - Deploy Failures
   - HTTP 5xx Errors > 10/min

## Costos Estimados

- **Basic Plan**: $5/mes (512MB RAM, 0.5 vCPU)
- **Professional**: $12/mes (1GB RAM, 1 vCPU)
- **Extras**: Dominio personalizado y SSL son gratuitos

## Troubleshooting

### Problema: Build Falla
- Verificar que todas las variables de entorno estén configuradas
- Revisar los Build Logs en DigitalOcean
- Asegurar que `npm run build` funciona localmente

### Problema: App No Carga
- Verificar que el puerto sea 8080
- Revisar Runtime Logs para errores
- Confirmar que las rutas SPA estén configuradas correctamente

### Problema: Supabase No Conecta
- Verificar variables VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY
- Confirmar que las variables estén marcadas como "Encrypted"
- Revisar la configuración de CORS en Supabase si es necesario

## Contacto

Si tienes problemas con el despliegue, contacta al desarrollador del proyecto con:
- Logs específicos del error
- Screenshots de la configuración
- URL de la app en DigitalOcean