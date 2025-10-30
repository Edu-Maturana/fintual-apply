# Tarea de Fintual

## 📋 Descripción

Esta tarea simula un sistema de rebalanceo de portafolio según la distribución objetivo de las acciones.

## 🏗️ Arquitectura

### Clases Principales

- **`Stock`**: Representa un activo individual con símbolo, nombre, cantidad de acciones y precio
- **`Portfolio`**: Maneja la lógica de rebalanceo y cálculo de distribuciones

## 🚀 Instalación y Uso

### Prerrequisitos

- Node.js (versión 14 o superior)
- npm o yarn

### Instalación

```bash
# Clonar el repositorio
git clone https://github.com/Edu-Maturana/fintual-apply
cd fintual-apply

# Instalar dependencias
npm install

# Compilar TypeScript
npm run build

# Ejecutar en modo desarrollo
npm run dev

# O ejecutar la versión compilada
npm start
```

## 📊 Ejemplo de Entrada y Salida

### Configuración Inicial

```typescript
const myStocks = [
  {
    symbol: "VOO",
    name: "Vanguard S&P 500 ETF",
    shares: 5.248567795,
    price: 631.93,
  },
  {
    symbol: "BTC",
    name: "Bitcoin",
    shares: 0.01392148,
    price: 110748.67,
  },
  {
    symbol: "IAUM",
    name: "IShares Gold Trust Micro",
    shares: 14.444292189,
    price: 39.32,
  },
];

const targetAllocation = [
  { symbol: "VOO", percentage: 60 },
  { symbol: "BTC", percentage: 30 },
  { symbol: "IAUM", percentage: 10 },
];
```

### Salida del Programa

```
Estado actual del portafolio:

VOO: 61% - $3316.73
BTC: 28% - $1541.79
IAUM: 10% - $567.95

Plan de rebalanceo:

💸 Vender 0.09629231195843219 unidades de VOO
(que equivalen a $60.85)

🤑 Comprar 0.0007779175006582806 unidades de BTC
(que equivalen a $86.15)

💸 Vender 0.6435230893117271 unidades de IAUM
(que equivalen a $25.3)

Estado del portafolio después de rebalancear:

VOO: 60% - $3255.88
BTC: 30% - $1627.94
IAUM: 10% - $542.65
```

_Hecho con ❤️... Vamos que se puede_
