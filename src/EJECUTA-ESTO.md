# ⚡ EJECUTA ESTO - Solución Rápida

## 🎯 Problema
Estás trabajando en **local** pero los archivos tienen imports de Figma Make.

## ✅ Solución en 3 Pasos

### **1. Corregir imports**
```bash
node fix-imports.js
```

### **2. Instalar dependencias**
```bash
npm install
```

### **3. Iniciar servidor**
```bash
npm run dev
```

---

## 🚀 Comando Todo-en-Uno

```bash
node fix-imports.js && npm install && npm run dev
```

---

## 🔧 Si `node fix-imports.js` da error

Usa VS Code Find & Replace:

1. **Presiona:** `Cmd + Shift + H` (Mac) o `Ctrl + Shift + H` (Windows)
2. **Find:** `@\d+\.\d+\.\d+"`
3. **Replace:** `"`
4. **Activa:** El ícono de Regex `.*`
5. **Files to include:** `components/**/*.tsx, src/**/*.tsx`
6. **Click:** "Replace All"
7. **Ejecuta:** `npm install && npm run dev`

---

## ✅ Después de esto

Tu app debería abrir en: **http://localhost:5173**

---

**📖 Más detalles:** Ver `/SOLUCION-ERROR-LOCAL.md`
