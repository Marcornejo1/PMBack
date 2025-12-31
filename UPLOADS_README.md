# Sistema de Subida y Almacenamiento de Imágenes en Reportes de Mantenimiento

## Resumen

Este documento explica en detalle cómo se implementa la subida, almacenamiento y gestión de imágenes en el sistema de reportes de mantenimiento. Las imágenes se suben desde el frontend, se almacenan en el servidor backend y se registran en la base de datos para su posterior acceso.

## Arquitectura General

### Componentes Involucrados

1. **Frontend (React/TypeScript)**: Componente `InputImageUpload` para selección y preview de archivos
2. **Backend (Node.js/Express)**: Middleware Multer para manejo de archivos multipart
3. **Base de Datos (SQL Server)**: Tabla `imagenes_referencia` para metadata de archivos
4. **Sistema de Archivos**: Carpeta `uploads/` para almacenamiento físico

## Implementación Detallada

### 1. Configuración del Backend

#### Instalación de Dependencias

```bash
npm install multer @types/multer
```

#### Configuración de Multer en Rutas

**Archivo: `src/routes/reportes.routes.ts`**

```typescript
import express from "express";
import reportesController from "../controllers/reportes.controller";
import multer from "multer";

const reportesRouter: any = express.Router();

// Configurar multer para subir imágenes
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/'); // Carpeta donde se guardarán las imágenes
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + '.' + file.mimetype.split('/')[1]);
  }
});

const upload = multer({ storage: storage });

// Ruta para crear reporte con subida de archivos
reportesRouter.post("/", upload.array('referenciaImages', 10), reportesController.create);
```

#### Servir Archivos Estáticos

**Archivo: `src/index.ts`**

```typescript
// Servir archivos estáticos desde la carpeta uploads
app.use('/uploads', express.static('uploads'));
```

### 2. Estructura de la Base de Datos

#### Tabla `imagenes_referencia`

```sql
CREATE TABLE imagenes_referencia (
  idImagen UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
  idReporte UNIQUEIDENTIFIER NOT NULL,
  nombreArchivo NVARCHAR(500) NOT NULL,
  urlArchivo NVARCHAR(1000) NOT NULL,
  tipoMime NVARCHAR(50),
  tamanio BIGINT,
  fechaSubida DATE NOT NULL DEFAULT GETDATE(),

  FOREIGN KEY (idReporte) REFERENCES reportes(idReporte) ON DELETE CASCADE,
  INDEX idx_idReporte (idReporte)
);
```

### 3. Lógica del Controlador

#### Procesamiento de Archivos en `reportes.controller.ts`

```typescript
// Insertar imágenes de referencia
const files = (req as any).files;
if (files && files.length > 0) {
  const queryInsertImagen = `
    INSERT INTO imagenes_referencia (idReporte, nombreArchivo, urlArchivo, tipoMime, tamanio)
    VALUES (@idReporte, @nombreArchivo, @urlArchivo, @tipoMime, @tamanio)
  `;

  for (const file of files) {
    await request
      .input('idReporte', UniqueIdentifier, idReporte)
      .input('nombreArchivo', NVarChar, file.originalname)      // Nombre original del archivo
      .input('urlArchivo', NVarChar, `/uploads/${file.filename}`) // Ruta relativa para acceso
      .input('tipoMime', NVarChar, file.mimetype)              // Tipo MIME (ej: image/jpeg)
      .input('tamanio', BigInt, file.size)                     // Tamaño en bytes
      .query(queryInsertImagen);
  }
}
```

### 4. Implementación del Frontend

#### Componente `InputImageUpload`

**Características:**
- Selección múltiple de archivos
- Preview de imágenes antes de subir
- Validación de tipos de archivo (solo imágenes por defecto)
- Límite configurable de archivos (máx. 10 por defecto)

**Uso en Formulario:**

```tsx
<InputImageUpload
  name="referenciaImages"
  text="Seleccionar imágenes de referencia"
  register={register}
  setValue={setValue}
  required={false}
  maxFiles={10}
  acceptedFormats="image/*"
/>
```

#### Envío del Formulario

El formulario se envía como `multipart/form-data`, incluyendo:
- Campos de texto en `req.body.data` (JSON stringificado)
- Archivos en `req.files` (array de archivos)

### 5. Flujo de Datos Completo

1. **Usuario selecciona archivos** en el frontend
2. **Formulario se envía** como multipart/form-data
3. **Multer procesa archivos**:
   - Valida y guarda archivos en `uploads/`
   - Genera nombres únicos para evitar conflictos
4. **Controlador recibe datos**:
   - `req.body.data`: Campos del formulario
   - `req.files`: Array de archivos subidos
5. **Transacción de BD**:
   - Inserta reporte principal
   - Inserta datos relacionados
   - Inserta metadata de cada imagen
6. **Archivos accesibles** vía `/uploads/nombre-archivo`

### 6. Seguridad y Validaciones

#### Validaciones Implementadas

- **Tipo de archivo**: Solo imágenes (configurable)
- **Tamaño**: Límite por archivo (configurable en Multer)
- **Cantidad**: Máximo 10 archivos por reporte
- **Nombres únicos**: Timestamp + random para evitar colisiones

#### Consideraciones de Seguridad

- Archivos se almacenan fuera del directorio público web
- Nombres de archivo sanitizados
- Validación de tipos MIME
- Acceso controlado mediante rutas del backend

### 7. Acceso a las Imágenes

#### Desde el Frontend

```typescript
// Las imágenes se acceden vía URL del backend
const imageUrl = `${BACKEND_URL}/uploads/${filename}`;
```

#### En Reportes

Al consultar un reporte, se obtienen las URLs de las imágenes desde la tabla `imagenes_referencia`.

### 8. Limitaciones y Mejoras Futuras

#### Limitaciones Actuales

- Almacenamiento local (no escalable para producción)
- Sin compresión de imágenes
- Sin thumbnails automáticos
- Sin validación de contenido de archivos

#### Mejoras Recomendadas

1. **Almacenamiento en Nube**:
   - AWS S3, Google Cloud Storage, o Azure Blob Storage
   - CDN para distribución global

2. **Optimización de Imágenes**:
   - Compresión automática
   - Generación de thumbnails
   - Conversión de formatos

3. **Validación Avanzada**:
   - Análisis de contenido (virus, metadata)
   - Validación de dimensiones mínimas/máximas

4. **Gestión de Archivos**:
   - Eliminación automática de archivos huérfanos
   - Backup y recuperación
   - Versionado de archivos

### 9. Configuración de Producción

#### Variables de Entorno

```env
# Configuración de Multer
MAX_FILE_SIZE=5242880  # 5MB por archivo
MAX_FILES=10          # Máximo 10 archivos por subida
ALLOWED_TYPES=image/jpeg,image/png,image/gif,image/webp

# Configuración de Storage (futuro)
STORAGE_TYPE=local    # local | s3 | gcs | azure
```

#### Configuración de Servidor

```typescript
const upload = multer({
  storage: storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE || '5242880'),
    files: parseInt(process.env.MAX_FILES || '10')
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = (process.env.ALLOWED_TYPES || 'image/*').split(',');
    if (allowedTypes.includes(file.mimetype) || allowedTypes.includes('image/*')) {
      cb(null, true);
    } else {
      cb(new Error('Tipo de archivo no permitido'));
    }
  }
});
```

### 10. Troubleshooting

#### Problemas Comunes

1. **Archivos no se suben**:
   - Verificar configuración de Multer
   - Revisar límites de tamaño en servidor
   - Comprobar permisos de escritura en `uploads/`

2. **Imágenes no se muestran**:
   - Verificar ruta `/uploads` en Express
   - Comprobar URLs almacenadas en BD
   - Revisar configuración de CORS

3. **Errores de memoria**:
   - Implementar streaming para archivos grandes
   - Configurar límites apropiados

#### Logs y Debugging

```typescript
// En el controlador
console.log('Archivos recibidos:', files?.length || 0);
files?.forEach(file => {
  console.log(`Archivo: ${file.originalname} -> ${file.filename}`);
});
```

---

**Nota**: Esta implementación es funcional para desarrollo y entornos pequeños. Para producción, se recomienda migrar a un servicio de almacenamiento en la nube para mejor escalabilidad y confiabilidad.</content>
<parameter name="filePath">c:\Users\MCORNEJO\Documents\Desarrollo\Proyecto_Mantenimiento\PMBack\UPLOADS_README.md