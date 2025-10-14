# API Mutation Tester

Una herramienta integral para probar la robustez de APIs a través de mutaciones automatizadas. Esta aplicación permite evaluar la seguridad y estabilidad de endpoints REST mediante la generación automática de casos de prueba maliciosos y anómalos.

## 🎯 ¿Qué es API Mutation Testing?

El **Mutation Testing de APIs** es una técnica de testing que consiste en:

1. **Ejecutar el "Happy Path"** - Probar el endpoint con datos válidos
2. **Generar Mutaciones** - Crear variaciones maliciosas de los datos de entrada
3. **Ejecutar Mutaciones** - Enviar las mutaciones al endpoint
4. **Analizar Respuestas** - Detectar vulnerabilidades y problemas de integridad
5. **Generar Reporte** - Proporcionar un análisis detallado de los resultados

## 🏗️ Arquitectura del Proyecto

Este es un monorepo que contiene:

- **`packages/frontend/`** - Interfaz React con TypeScript y Material-UI
- **`packages/backend/`** - API NestJS con TypeScript
- **`packages/shared/`** - Tipos e interfaces compartidas

## 🚀 Configuración de Desarrollo

### Prerrequisitos

- Node.js 18+
- npm
- Docker y Docker Compose (opcional)

### Desarrollo Local

1. **Instalar dependencias:**
```bash
npm install
```

2. **Compilar paquete compartido:**
```bash
npm run build:shared
```

3. **Iniciar servidores de desarrollo:**
```bash
npm run dev
```

Esto iniciará:
- **Frontend:** http://localhost:3000
- **Backend:** http://localhost:3003

### Desarrollo con Docker

Alternativamente, usar Docker Compose:

```bash
docker-compose up
```

## 📖 Cómo Usar la Aplicación

### 1. Configurar una Prueba

1. **Acceder a la aplicación:** http://localhost:3000
2. **Completar el formulario de configuración:**
   - **URL del Endpoint:** La URL completa del API a probar
   - **Método HTTP:** GET, POST, PUT, DELETE, PATCH
   - **Headers:** Headers HTTP necesarios (ej: Authorization, Content-Type)
   - **Payload:** Datos del cuerpo de la petición (para POST/PUT/PATCH)
   - **Timeout:** Tiempo límite en milisegundos (1000-300000ms)

### 2. Ejecutar la Prueba

1. **Hacer clic en "Start Test"**
2. **Ser redirigido a la página de progreso** (`/progress/[test-id]`)
3. **Monitorear el progreso en tiempo real** a través de Polling
4. **Ver actualizaciones de estado** conforme se ejecutan las mutaciones

### 3. Analizar Resultados

1. **Acceder al reporte completo** cuando la prueba termine
2. **Revisar el dashboard de resultados** con métricas clave
3. **Explorar resultados detallados** en la tabla interactiva
4. **Exportar el reporte** en formato JSON

## 🔍 Criterios de Clasificación

### Tipos de Mutaciones Generadas

> **✅ Soporte Completo para Métodos HTTP**
> 
> - **GET**: Mutaciones en parámetros de URL, query parameters y headers
> - **POST/PUT/PATCH**: Mutaciones en payload JSON y headers  
> - **DELETE**: Mutaciones en headers y parámetros de URL

#### **1. Mutaciones de Cadenas (String)**
- **`STRING_EMPTY`** - Cadenas vacías (`""`)
- **`STRING_LONG`** - Cadenas extremadamente largas (>10,000 caracteres)
- **`STRING_MALICIOUS`** - Payloads de inyección SQL, XSS, etc.

#### **2. Mutaciones de Tipos (Type)**
- **`TYPE_BOOLEAN`** - Cambiar strings/números por booleanos
- **`TYPE_ARRAY`** - Cambiar valores por arrays
- **`TYPE_NULL`** - Cambiar valores por `null`
- **`TYPE_UNDEFINED`** - Cambiar valores por `undefined`

#### **3. Mutaciones Numéricas (Numeric)**
- **`NUMERIC_LARGE`** - Números extremadamente grandes
- **`NUMERIC_NEGATIVE`** - Números negativos inesperados
- **`NUMERIC_ZERO`** - Valores cero donde no se esperan

#### **4. Mutaciones de Caracteres Especiales**
- **`SPECIAL_CHARACTERS`** - Caracteres especiales (`!@#$%^&*()`)
- **`UNICODE_CHARACTERS`** - Caracteres Unicode y emojis

#### **5. Mutaciones de Estructura**
- **`MISSING_FIELD`** - Eliminar campos requeridos
- **`EXTRA_FIELD`** - Agregar campos inesperados
- **`INVALID_TYPE`** - Cambiar tipos de datos esperados

#### **6. Mutaciones Específicas para GET**
- **Query Parameters**: Modificación de parámetros existentes con valores maliciosos
- **Parameter Injection**: Inyección de parámetros adicionales (`debug=true`, `admin=1`)
- **Path Traversal**: Intentos de traversal en segmentos de URL (`../`, `..%2F`)
- **Header Injection**: Inyección de headers maliciosos (`X-Forwarded-For`, `Host`)
- **URL Manipulation**: Modificación de la estructura de la URL

### Clasificación de Resultados

#### **🟢 Exitosos (2xx-3xx)**
- **Descripción:** El endpoint respondió correctamente
- **Interpretación:** Comportamiento esperado o manejo adecuado de la mutación

#### **🟡 Errores de Cliente (4xx)**
- **Descripción:** El endpoint rechazó la petición
- **Interpretación:** Validación correcta del input (comportamiento deseado)

#### **🔴 Errores de Servidor (5xx)**
- **Descripción:** El endpoint falló internamente
- **Interpretación:** Posible problema de robustez o manejo de errores

### Detección de Vulnerabilidades

#### **⚠️ Vulnerabilidades Detectadas**
Se marca como vulnerabilidad cuando:
- **Respuesta 2xx a payload malicioso** - El endpoint acepta datos peligrosos
- **Información sensible expuesta** - Respuestas revelan datos internos
- **Bypass de validación** - Mutaciones que deberían fallar son aceptadas

#### **🚨 Problemas de Integridad**
Se marca como problema de integridad cuando:
- **Respuestas inconsistentes** - Diferentes respuestas para inputs similares
- **Errores inesperados** - Fallos que indican problemas de implementación
- **Timeouts o conexiones perdidas** - Problemas de estabilidad

### Métricas del Reporte

#### **Resumen Ejecutivo**
- **Total de Pruebas:** Número total de mutaciones ejecutadas
- **Pruebas Exitosas:** Respuestas 2xx-3xx
- **Pruebas Fallidas:** Respuestas 4xx-5xx
- **Vulnerabilidades Encontradas:** Número de vulnerabilidades detectadas
- **Problemas de Integridad:** Número de problemas de integridad
- **Tiempo Promedio de Respuesta:** Rendimiento del endpoint

#### **Análisis Detallado**
- **Distribución de Códigos de Estado:** Gráfico de respuestas por código HTTP
- **Estadísticas de Tiempo de Respuesta:** Min, max, promedio, percentil 95
- **Categorización por Tipo de Mutación:** Resultados agrupados por tipo
- **Detalles de Vulnerabilidades:** Descripción específica de cada problema

## 🔧 Funcionalidades Avanzadas

### **Actualizaciones en Tiempo Real**
- **Polling Connection** para monitoreo en vivo
- **Indicadores visuales** del estado de conexión
- **Progreso detallado** con fases de ejecución

### **Análisis de Requests**
- **Detalles completos del request** enviado al endpoint
- **Headers, payload y método** para cada mutación
- **Descripción de la mutación** aplicada
- **Comparación** entre request original y mutado

### **Exportación de Reportes**
- **Formato JSON estructurado** con todos los detalles
- **Metadatos de ejecución** incluidos
- **Análisis estadístico** completo
- **Filtros aplicados** preservados

### **Filtrado y Búsqueda**
- **Filtros por categoría** (éxito, error, vulnerabilidad, integridad)
- **Rangos de código de estado** y tiempo de respuesta
- **Búsqueda de texto** en resultados y errores
- **Ordenamiento** por múltiples criterios

## 📊 Interpretación de Resultados

### **Escenarios Ideales**
- **4xx para mutaciones maliciosas** - Validación correcta
- **Tiempos de respuesta consistentes** - Rendimiento estable
- **Sin vulnerabilidades detectadas** - Seguridad adecuada

### **Señales de Alerta**
- **2xx para payloads maliciosos** - Posible vulnerabilidad
- **5xx frecuentes** - Problemas de robustez
- **Timeouts o errores de conexión** - Problemas de estabilidad
- **Información sensible en respuestas** - Posible fuga de datos

### **Acciones Recomendadas**
1. **Revisar vulnerabilidades** identificadas prioritariamente
2. **Investigar errores 5xx** para mejorar manejo de errores
3. **Analizar patrones** en las mutaciones que causan problemas
4. **Implementar validaciones** adicionales según sea necesario

## 🛠️ Scripts Disponibles

- **`npm run dev`** - Iniciar frontend y backend en modo desarrollo
- **`npm run build`** - Compilar todos los paquetes para producción
- **`npm run test`** - Ejecutar pruebas para todos los paquetes
- **`npm run dev:frontend`** - Iniciar solo el frontend
- **`npm run dev:backend`** - Iniciar solo el backend
- **`npm run build:shared`** - Compilar solo el paquete compartido

## 📚 Documentación Adicional

### **API Documentation**
Cuando el backend esté ejecutándose, visitar: http://localhost:3003/api/docs

### **Demo de Reportes**
Para ver un ejemplo de reporte: http://localhost:3000/demo/report-viewer

## 🔒 Consideraciones de Seguridad

- **Usar solo en entornos de prueba** - No ejecutar contra APIs de producción sin autorización
- **Configurar rate limiting** en el endpoint objetivo si es necesario
- **Revisar logs del servidor** objetivo durante las pruebas
- **Obtener autorización** antes de probar APIs de terceros

## 🤝 Contribución

1. Fork el repositorio
2. Crear una rama para la funcionalidad (`git checkout -b feature/nueva-funcionalidad`)
3. Commit los cambios (`git commit -am 'Agregar nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Crear un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.