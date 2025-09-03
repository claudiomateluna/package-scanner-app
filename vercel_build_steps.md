# Paso a Paso Detallado para Deploy en Vercel

## **Paso 1: Preparación Inicial**

### 1.1 Crear Cuenta en Vercel
1. Abre tu navegador y ve a [vercel.com](https://vercel.com)
2. Haz clic en **"Sign Up"** (esquina superior derecha)
3. Elige una opción de registro:
   - **"Continue with GitHub"** (recomendado)
   - **"Continue with GitLab"**
   - **"Continue with Bitbucket"**
   - **"Continue with Email"** (opción alternativa)

### 1.2 Verificación de Cuenta
1. Si elegiste email, revisa tu bandeja de entrada
2. Abre el email de verificación de Vercel
3. Haz clic en **"Verify Email Address"**
4. Configura tu contraseña si es necesario

## **Paso 2: Preparar tu Repositorio**

### 2.1 Asegurar que tu código esté en Git
1. Abre tu terminal en el directorio del proyecto
2. Verifica que estés en el directorio correcto:
   ```bash
   pwd  # En Windows: cd
   ```
3. Inicializa git si no lo has hecho:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   ```

### 2.2 Subir a GitHub/GitLab/Bitbucket
1. Crea un nuevo repositorio en GitHub:
   - Ve a [github.com](https://github.com)
   - Haz clic en **"+"** → **"New repository"**
   - Nombre: `package-scanner-app`
   - Descripción: Opcional
   - Visibilidad: **Public** o **Private**
   - **NO** inicialices con README
   - Haz clic en **"Create repository"**
2. Conecta tu repositorio local:
   ```bash
   git remote add origin https://github.com/TU_USUARIO/package-scanner-app.git
   git branch -M main
   git push -u origin main
   ```

## **Paso 3: Conectar Vercel con tu Repositorio**

### 3.1 Iniciar Sesión en Vercel
1. Ve a [vercel.com](https://vercel.com)
2. Haz clic en **"Log In"** (esquina superior derecha)
3. Usa la misma cuenta con la que te registraste

### 3.2 Importar Proyecto
1. En el dashboard principal, haz clic en **"New Project"**
2. Verás una lista de tus repositorios
3. Busca tu repositorio (`package-scanner-app`)
4. Haz clic en **"Import"** junto a tu repositorio

## **Paso 4: Configuración del Proyecto**

### 4.1 Configuración Automática
Vercel detectará automáticamente que es una aplicación Next.js:
- **Framework Preset**: Debería mostrar "Next.js"
- **Build Command**: `next build` (por defecto)
- **Output Directory**: `.next` (por defecto)
- **Development Command**: `next dev` (por defecto)

### 4.2 Verificar Configuración
1. Asegúrate de que los siguientes campos estén correctos:
   - **Framework Preset**: Next.js
   - **Root Directory**: Deja vacío (a menos que tu app esté en una subcarpeta)
   - **Build Command**: `npm run build`
   - **Output Directory**: Deja vacío
2. **NO** hagas clic en "Deploy" todavía

## **Paso 5: Configurar Variables de Entorno**

### 5.1 Acceder a Variables de Entorno
1. En la pantalla de configuración del proyecto, busca la sección **"Environment Variables"**
2. Haz clic en **"Add"** para añadir cada variable

### 5.2 Añadir Variables Necesarias
Añade estas tres variables de entorno:

**Variable 1:**
- **KEY**: `NEXT_PUBLIC_SUPABASE_URL`
- **VALUE**: Tu URL de Supabase (ej: `https://gkqebmqtmjeinjuoivvu.supabase.co`)
- **TARGET**: Deja seleccionado "Production" y "Preview"

**Variable 2:**
- **KEY**: `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- **VALUE**: Tu clave anónima de Supabase
- **TARGET**: Deja seleccionado "Production" y "Preview"

**Variable 3:**
- **KEY**: `SUPABASE_SERVICE_ROLE_KEY`
- **VALUE**: Tu clave de rol de servicio de Supabase
- **TARGET**: Deja seleccionado "Production" y "Preview"

### 5.3 Guardar Variables
1. Después de añadir cada variable, haz clic en **"Add"**
2. Verifica que las tres variables aparezcan en la lista

## **Paso 6: Completar el Deploy**

### 6.1 Iniciar Deploy
1. Desplázate hasta la parte inferior de la página
2. Haz clic en el botón grande **"Deploy"**
3. Verás una pantalla de "Building..."

### 6.2 Monitorear el Proceso
1. Observa la barra de progreso:
   - **Cloning** (clonando repositorio)
   - **Installing** (instalando dependencias)
   - **Building** (construyendo la aplicación)
   - **Deploying** (desplegando)
2. Puedes hacer clic en cada paso para ver los logs detallados

### 6.3 Esperar Finalización
1. El proceso tardará entre 1-3 minutos
2. Cuando termine, verás **"Ready!"** en verde
3. Se mostrará la URL de tu aplicación (algo como `package-scanner-app.vercel.app`)

## **Paso 7: Verificar el Deploy**

### 7.1 Acceder a la Aplicación
1. Haz clic en la URL proporcionada o copia y pega en tu navegador
2. Verifica que la aplicación cargue correctamente
3. Prueba iniciar sesión con un usuario existente

### 7.2 Verificar Funcionalidades
1. Prueba la pantalla de selección de local
2. Verifica el scanner de paquetes
3. Prueba la sección de administración si tienes permisos

## **Paso 8: Configurar Dominio Personalizado (Opcional)**

### 8.1 Acceder a Configuración de Dominio
1. En el dashboard de Vercel, ve a tu proyecto
2. Haz clic en **"Settings"** en el menú lateral
3. Selecciona **"Domains"** en el submenú

### 8.2 Añadir Dominio Personalizado
1. Haz clic en **"Add"**
2. Ingresa tu dominio (ej: `scanner.mieempresa.com`)
3. Sigue las instrucciones para configurar DNS

### 8.3 Configuración DNS
Vercel te proporcionará registros DNS que debes añadir en tu proveedor de dominio:
- **Tipo**: CNAME o A record
- **Nombre**: El subdominio o @ para dominio principal
- **Valor**: El valor proporcionado por Vercel

## **Paso 9: Monitoreo y Mantenimiento**

### 9.1 Ver Deployments
1. En el dashboard del proyecto, haz clic en **"Deployments"**
2. Verás una lista de todos los deployments
3. Puedes hacer clic en cualquiera para ver logs detallados

### 9.2 Ver Analytics
1. Haz clic en **"Analytics"** en el menú del proyecto
2. Monitorea:
   - Page loads
   - Performance metrics
   - Geographic distribution

### 9.3 Verificar Uso
1. Ve a **"Settings"** → **"Billing & Usage"**
2. Revisa el consumo de:
   - Build time
   - Bandwidth
   - Serverless function execution

## **Paso 10: Deployments Automáticos**

### 10.1 Funcionamiento Automático
1. Cada `git push` a la rama principal generará un nuevo deployment
2. Cada Pull Request generará un preview deployment
3. No necesitas hacer nada manualmente

### 10.2 Ejemplo de Workflow
```bash
# Trabaja en una nueva feature
git checkout -b nueva-feature
# Haz cambios...
git add .
git commit -m "Añadir nueva feature"
git push origin nueva-feature

# Crea Pull Request en GitHub
# Vercel crea preview deployment automáticamente

# Al hacer merge al main
git checkout main
git pull origin main
# Vercel hace deployment automático a producción
```

## **Resolución de Problemas Comunes**

### **Problema: Build Fallido**
1. Ve a **"Deployments"** en el dashboard
2. Haz clic en el deployment fallido
3. Revisa los logs para identificar el error
4. Comunes:
   - Variables de entorno faltantes
   - Errores en el código
   - Dependencias faltantes

### **Problema: Aplicación no carga**
1. Verifica que todas las variables de entorno estén configuradas
2. Revisa la consola del navegador (F12) por errores
3. Asegúrate de que la conexión a Supabase funcione

### **Problema: 404 en rutas**
1. Verifica que estés usando el enrutamiento correcto de Next.js
2. Asegúrate de que las páginas existan en la estructura correcta
3. Revisa el archivo `next.config.js` si tienes configuraciones personalizadas

## **Mejores Prácticas**

### **1. Commits Descriptivos**
```bash
git commit -m "feat: añadir validación de formularios"
git commit -m "fix: corregir error en scanner de códigos"
```

### **2. Variables de Entorno Seguras**
- Nunca commitees secrets en el código
- Usa siempre el panel de Vercel para variables sensibles

### **3. Monitoreo Regular**
- Revisa analytics semanalmente
- Monitorea el uso de build time
- Verifica que los deployments sean exitosos

### **4. Backups**
- Mantén tu repositorio actualizado
- Considera tener un backup de las variables de entorno

## **Recursos Adicionales**

- **Documentación de Vercel**: [vercel.com/docs](https://vercel.com/docs)
- **Comunidad**: [vercel.com/community](https://vercel.com/community)
- **Soporte**: Disponible en el plan Hobby por comunidad y documentación