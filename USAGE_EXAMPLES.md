# Ejemplos de Uso - API Mutation Tester

## 🎯 Casos de Uso Comunes

### 1. Probar un API REST Básico

#### **Endpoint de Ejemplo:**
```
GET https://api.ejemplo.com/users?page=1&limit=10
```

#### **Configuración:**
- **URL:** `https://api.ejemplo.com/users?page=1&limit=10`
- **Método:** `GET`
- **Headers:** 
  ```json
  {
    "Authorization": "Bearer tu-token-aqui",
    "Content-Type": "application/json"
  }
  ```
- **Timeout:** `30000` (30 segundos)

#### **Mutaciones Generadas:**
- Parámetros con valores negativos: `?page=-1&limit=-10`
- Parámetros con valores extremos: `?page=999999&limit=999999`
- Caracteres especiales: `?page=<script>&limit='; DROP TABLE users;`
- Tipos incorrectos: `?page=true&limit=null`

---

### 2. Probar un Endpoint POST con Payload

#### **Endpoint de Ejemplo:**
```
POST https://api.ejemplo.com/users
```

#### **Configuración:**
- **URL:** `https://api.ejemplo.com/users`
- **Método:** `POST`
- **Headers:**
  ```json
  {
    "Authorization": "Bearer tu-token-aqui",
    "Content-Type": "application/json"
  }
  ```
- **Payload:**
  ```json
  {
    "name": "Juan Pérez",
    "email": "juan@ejemplo.com",
    "age": 30,
    "active": true
  }
  ```

#### **Mutaciones Generadas:**
- **Campo name vacío:** `{"name": "", "email": "juan@ejemplo.com", ...}`
- **Email malicioso:** `{"name": "Juan", "email": "<script>alert('xss')</script>", ...}`
- **Age negativo:** `{"name": "Juan", "email": "juan@ejemplo.com", "age": -1, ...}`
- **Campos faltantes:** `{"email": "juan@ejemplo.com", "age": 30}`
- **Campos extra:** `{"name": "Juan", "admin": true, "password": "hack", ...}`

---

### 3. Probar un API con Autenticación

#### **Endpoint de Ejemplo:**
```
PUT https://api.ejemplo.com/profile/123
```

#### **Configuración:**
- **URL:** `https://api.ejemplo.com/profile/123`
- **Método:** `PUT`
- **Headers:**
  ```json
  {
    "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "Content-Type": "application/json",
    "X-API-Key": "tu-api-key"
  }
  ```
- **Payload:**
  ```json
  {
    "firstName": "Ana",
    "lastName": "García",
    "phone": "+34123456789"
  }
  ```

#### **Mutaciones de Headers:**
- **Token malformado:** `"Authorization": "Bearer invalid-token"`
- **Headers faltantes:** Sin `X-API-Key`
- **Valores extremos:** `"X-API-Key": "A".repeat(10000)`

---

## 📊 Interpretación de Resultados por Escenario

### **Escenario 1: API Bien Protegido**

#### **Resultados Esperados:**
```
✅ Total Tests: 50
✅ Successful: 1 (happy path)
✅ Failed: 49 (mutaciones rechazadas)
✅ Vulnerabilities: 0
✅ Integrity Issues: 0
```

#### **Códigos de Estado:**
- **200 OK:** 1 (happy path)
- **400 Bad Request:** 35 (validación correcta)
- **401 Unauthorized:** 8 (autenticación)
- **422 Unprocessable Entity:** 6 (validación de negocio)

#### **Interpretación:**
🟢 **Excelente seguridad** - El API rechaza correctamente todas las mutaciones maliciosas.

---

### **Escenario 2: API con Vulnerabilidades**

#### **Resultados Problemáticos:**
```
⚠️ Total Tests: 50
⚠️ Successful: 15 (demasiados éxitos)
⚠️ Failed: 35
🚨 Vulnerabilities: 8 (crítico)
🚨 Integrity Issues: 3
```

#### **Vulnerabilidades Detectadas:**
1. **SQL Injection:** `200 OK` para payload `'; DROP TABLE users; --`
2. **XSS:** `200 OK` para `<script>alert('xss')</script>`
3. **Path Traversal:** `200 OK` para `../../../etc/passwd`
4. **Buffer Overflow:** `200 OK` para string de 100,000 caracteres

#### **Interpretación:**
🔴 **Vulnerabilidades críticas** - Requiere atención inmediata.

---

### **Escenario 3: API con Problemas de Robustez**

#### **Resultados Problemáticos:**
```
⚠️ Total Tests: 50
⚠️ Successful: 5
⚠️ Failed: 45
🟡 Vulnerabilities: 0
🚨 Integrity Issues: 12 (problemas de estabilidad)
```

#### **Problemas de Integridad:**
- **500 Internal Server Error:** 12 casos
- **Timeouts:** 3 casos
- **Respuestas inconsistentes:** 2 casos

#### **Interpretación:**
🟡 **Problemas de robustez** - El API es seguro pero inestable.

---

## 🔍 Análisis Detallado de Mutaciones

### **Mutación: STRING_MALICIOUS**

#### **Request Original:**
```json
{
  "name": "Juan Pérez",
  "comment": "Excelente servicio"
}
```

#### **Request Mutado:**
```json
{
  "name": "Juan Pérez",
  "comment": "'; DROP TABLE comments; --"
}
```

#### **Respuesta Problemática:**
```json
Status: 200 OK
{
  "success": true,
  "message": "Comment saved successfully",
  "id": 123
}
```

#### **Análisis:**
🚨 **Vulnerabilidad SQL Injection** - El API acepta y procesa payload malicioso sin validación.

---

### **Mutación: NUMERIC_LARGE**

#### **Request Original:**
```json
{
  "userId": 123,
  "amount": 100.50
}
```

#### **Request Mutado:**
```json
{
  "userId": 123,
  "amount": 999999999999999999999
}
```

#### **Respuesta Problemática:**
```json
Status: 500 Internal Server Error
{
  "error": "NumberFormatException: Value too large"
}
```

#### **Análisis:**
🟡 **Problema de Robustez** - El API no maneja correctamente valores numéricos extremos.

---

### **Mutación: MISSING_FIELD**

#### **Request Original:**
```json
{
  "email": "user@ejemplo.com",
  "password": "secreto123",
  "confirmPassword": "secreto123"
}
```

#### **Request Mutado:**
```json
{
  "email": "user@ejemplo.com",
  "password": "secreto123"
}
```

#### **Respuesta Correcta:**
```json
Status: 400 Bad Request
{
  "error": "Validation failed",
  "details": ["confirmPassword is required"]
}
```

#### **Análisis:**
✅ **Validación Correcta** - El API rechaza apropiadamente campos faltantes.

---

## 🛡️ Mejores Prácticas Basadas en Resultados

### **Para Vulnerabilidades Detectadas:**

#### **SQL Injection:**
```javascript
// ❌ Vulnerable
const query = `SELECT * FROM users WHERE name = '${userInput}'`;

// ✅ Seguro
const query = 'SELECT * FROM users WHERE name = ?';
db.execute(query, [userInput]);
```

#### **XSS Prevention:**
```javascript
// ❌ Vulnerable
response.send(`<h1>Hello ${userInput}</h1>`);

// ✅ Seguro
response.send(`<h1>Hello ${escapeHtml(userInput)}</h1>`);
```

### **Para Problemas de Robustez:**

#### **Validación de Entrada:**
```javascript
// ✅ Validación robusta
const schema = {
  name: { type: 'string', maxLength: 100, required: true },
  age: { type: 'number', min: 0, max: 150 },
  email: { type: 'string', format: 'email' }
};
```

#### **Manejo de Errores:**
```javascript
// ✅ Manejo apropiado
try {
  const result = await processData(input);
  return { success: true, data: result };
} catch (error) {
  logger.error('Processing failed:', error);
  return { success: false, error: 'Invalid input provided' };
}
```

---

## 📈 Métricas de Calidad del API

### **Puntuación de Seguridad:**
```
Puntuación = (Tests sin vulnerabilidades / Total tests) × 100

Excelente: 95-100%
Bueno: 85-94%
Regular: 70-84%
Malo: <70%
```

### **Puntuación de Robustez:**
```
Puntuación = (Tests sin errores 5xx / Total tests) × 100

Excelente: 95-100%
Bueno: 90-94%
Regular: 80-89%
Malo: <80%
```

### **Tiempo de Respuesta:**
```
Excelente: <100ms promedio
Bueno: 100-500ms promedio
Regular: 500ms-2s promedio
Malo: >2s promedio
```

---

## 🎯 Casos de Uso Específicos por Industria

### **E-commerce:**
- Probar endpoints de carrito de compras
- Validar procesamiento de pagos
- Verificar gestión de inventario

### **Fintech:**
- Probar APIs de transferencias
- Validar cálculos de intereses
- Verificar compliance regulatorio

### **Healthcare:**
- Probar manejo de datos sensibles
- Validar cumplimiento HIPAA
- Verificar encriptación de datos

### **IoT:**
- Probar endpoints de telemetría
- Validar autenticación de dispositivos
- Verificar rate limiting

Cada industria tiene patrones específicos de vulnerabilidades que el mutation testing puede ayudar a identificar.