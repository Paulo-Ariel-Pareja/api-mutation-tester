# Guías de Seguridad - API Mutation Tester

## ⚠️ Advertencias Importantes

### **🚨 USO RESPONSABLE**

- **NUNCA** ejecutar contra APIs de producción sin autorización explícita
- **SIEMPRE** obtener permiso por escrito antes de probar APIs de terceros
- **SOLO** usar en entornos de desarrollo, testing o staging
- **INFORMAR** al equipo de seguridad antes de ejecutar pruebas

### **🔒 CONSIDERACIONES LEGALES**

- Respetar términos de servicio de APIs externas
- Cumplir con regulaciones locales de ciberseguridad
- Documentar todas las pruebas realizadas
- Mantener logs de auditoría

---

## 🛡️ Configuración Segura

### **Entorno de Pruebas Aislado**

#### **Red Aislada:**

```bash
# Crear red Docker aislada
docker network create --driver bridge mutation-test-net

# Ejecutar en red aislada
docker-compose --network mutation-test-net up
```

#### **Variables de Entorno:**

```bash
# .env.testing
NODE_ENV=testing
API_BASE_URL=http://localhost:3003
ENABLE_DANGEROUS_MUTATIONS=false
MAX_CONCURRENT_TESTS=5
RATE_LIMIT_ENABLED=true
```

#### **Configuración del Frontend:**

```typescript
// Delay entre mutaciones
const MUTATION_DELAY = 100; // 100ms entre requests
const MAX_CONCURRENT = 5; // Máximo 5 requests simultáneos
```

---

## 🔍 Tipos de Vulnerabilidades Detectables

### **1. Injection Attacks**

#### **SQL Injection:**

```sql
-- Payloads de prueba generados
'; DROP TABLE users; --
' OR '1'='1
' UNION SELECT password FROM admin_users --
```

#### **NoSQL Injection:**

```javascript
// MongoDB injection payloads
{"$ne": null}
{"$gt": ""}
{"$where": "this.password.length > 0"}
```

#### **Command Injection:**

```bash
# OS command injection payloads
; ls -la
| cat /etc/passwd
&& whoami
```

### **2. Cross-Site Scripting (XSS)**

#### **Reflected XSS:**

```html
<script>alert('XSS')</script>
<img src=x onerror=alert('XSS')>
javascript:alert('XSS')
```

#### **Stored XSS:**

```html
<svg onload=alert('Stored XSS')>
<iframe src="javascript:alert('XSS')">
```

### **3. Path Traversal**

#### **Directory Traversal:**

```
../../../etc/passwd
..\..\..\..\windows\system32\drivers\etc\hosts
....//....//....//etc/passwd
```

### **4. Buffer Overflow**

#### **String Length Attacks:**

```javascript
// Strings extremadamente largos
"A".repeat(100000);
"🚀".repeat(50000); // Unicode characters
```

### **5. Authentication Bypass**

#### **Token Manipulation:**

```
Bearer null
Bearer undefined
Bearer admin
Bearer ../../../etc/passwd
```

---

## 📊 Interpretación de Resultados de Seguridad

### **🟢 Respuestas Seguras**

#### **Para Payloads Maliciosos:**

```json
Status: 400 Bad Request
{
  "error": "Invalid input format",
  "code": "VALIDATION_ERROR"
}
```

#### **Para Ataques de Inyección:**

```json
Status: 422 Unprocessable Entity
{
  "error": "Input contains prohibited characters",
  "code": "SECURITY_VIOLATION"
}
```

### **🔴 Respuestas Vulnerables**

#### **Aceptación de Payload Malicioso:**

```json
Status: 200 OK
{
  "success": true,
  "data": "'; DROP TABLE users; -- processed successfully"
}
```

#### **Exposición de Información:**

```json
Status: 500 Internal Server Error
{
  "error": "SQLException: Table 'users' doesn't exist",
  "stack": "/var/www/app/database.php:123",
  "query": "SELECT * FROM users WHERE id = ''; DROP TABLE users; --'"
}
```

---

## 🛠️ Mitigaciones Recomendadas

### **Validación de Entrada**

#### **Whitelist Approach:**

```typescript
// ✅ Validación estricta
const allowedCharacters = /^[a-zA-Z0-9\s\-_\.@]+$/;
if (!allowedCharacters.test(userInput)) {
  throw new ValidationError("Invalid characters detected");
}
```

#### **Sanitización:**

```typescript
import { escape } from "html-escaper";
import validator from "validator";

// Sanitizar entrada
const sanitizedInput = validator.escape(userInput);
const htmlSafeInput = escape(userInput);
```

### **Prepared Statements**

#### **SQL Seguro:**

```typescript
// ✅ Prepared statement
const query = "SELECT * FROM users WHERE email = ? AND status = ?";
const result = await db.execute(query, [email, status]);

// ❌ String concatenation vulnerable
const query = `SELECT * FROM users WHERE email = '${email}'`;
```

### **Rate Limiting**

#### **Implementación:**

```typescript
import rateLimit from "express-rate-limit";

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // máximo 100 requests por ventana
  message: "Too many requests from this IP",
  standardHeaders: true,
  legacyHeaders: false,
});

app.use("/api/", limiter);
```

### **Input Length Limits**

#### **Validación de Tamaño:**

```typescript
// Límites de tamaño
const MAX_STRING_LENGTH = 1000;
const MAX_ARRAY_LENGTH = 100;
const MAX_OBJECT_DEPTH = 5;

if (input.length > MAX_STRING_LENGTH) {
  throw new ValidationError("Input too long");
}
```

---

## 🔐 Configuración de Seguridad del Tester

### **Configuración Conservadora**

#### **Mutaciones Limitadas:**

```typescript
// packages/backend/src/config/security.ts
export const SECURITY_CONFIG = {
  enableDangerousMutations: false,
  maxStringLength: 1000,
  maxConcurrentTests: 3,
  requestDelay: 500, // ms entre requests
  timeoutLimit: 30000, // 30 segundos máximo

  // Payloads prohibidos en producción
  disabledPayloads: ["DROP TABLE", "DELETE FROM", "rm -rf", "format C:"],
};
```

### **Logging de Seguridad**

#### **Auditoría Completa:**

```typescript
// Log de todas las mutaciones
const securityLogger = winston.createLogger({
  level: "info",
  format: winston.format.json(),
  transports: [
    new winston.transports.File({
      filename: "security-audit.log",
      level: "warn",
    }),
  ],
});

// Log cada mutación peligrosa
securityLogger.warn("Dangerous mutation executed", {
  testId,
  mutationType,
  targetUrl,
  payload: sanitizedPayload,
  timestamp: new Date().toISOString(),
});
```

---

## 🚨 Protocolo de Respuesta a Incidentes

### **Si Se Detecta Vulnerabilidad Crítica:**

1. **Detener inmediatamente** todas las pruebas
2. **Documentar** la vulnerabilidad encontrada
3. **Notificar** al equipo de seguridad
4. **No explotar** la vulnerabilidad
5. **Seguir** el proceso de divulgación responsable

### **Documentación de Vulnerabilidad:**

````markdown
## Reporte de Vulnerabilidad

**Fecha:** 2024-01-15
**Tester:** [Nombre del tester]
**Endpoint:** https://api.ejemplo.com/users
**Tipo:** SQL Injection
**Severidad:** Crítica

### Descripción:

El endpoint acepta payloads de SQL injection sin validación.

### Payload de Prueba:

```json
{
  "name": "'; DROP TABLE users; --"
}
```
````

### Respuesta del Servidor:

```json
{
  "success": true,
  "message": "User created successfully"
}
```

### Impacto:

Posible eliminación de datos críticos.

### Recomendación:

Implementar prepared statements y validación de entrada.

```

---

## 📋 Checklist de Seguridad

### **Antes de Ejecutar Pruebas:**
- [ ] Confirmar que es entorno de testing
- [ ] Obtener autorización por escrito
- [ ] Configurar rate limiting
- [ ] Habilitar logging de auditoría
- [ ] Verificar aislamiento de red
- [ ] Definir contacto de emergencia

### **Durante las Pruebas:**
- [ ] Monitorear logs del servidor objetivo
- [ ] Verificar que no se afecte producción
- [ ] Documentar todas las anomalías
- [ ] Respetar límites de rate limiting
- [ ] Detener si se detecta impacto negativo

### **Después de las Pruebas:**
- [ ] Generar reporte de seguridad
- [ ] Limpiar datos de prueba
- [ ] Notificar resultados al equipo
- [ ] Archivar logs de auditoría
- [ ] Programar seguimiento de mitigaciones

---

## 🎓 Recursos Adicionales

### **Estándares de Seguridad:**
- OWASP Top 10
- NIST Cybersecurity Framework
- ISO 27001

### **Herramientas Complementarias:**
- OWASP ZAP
- Burp Suite
- Postman Security Testing

### **Capacitación Recomendada:**
- Ethical Hacking
- Secure Coding Practices
- API Security Best Practices

**Recuerda:** El objetivo es mejorar la seguridad, no causar daño. Usa esta herramienta de manera responsable y ética.
```
