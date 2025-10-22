# Edge DataHub SDK - TypeScript Version

SDK simple para gamificación de eventos con tipos TypeScript completos.

## 📦 Instalación

```typescript
// Importar el SDK
import { EdgeDataHubSDK, SDKConfig, AttendeeRegisterRequest } from './edge-datahub-sdk';
```

## ⚙️ Configuración

```typescript
// Configurar SDK - IDs quemados en el código
const sdk = new EdgeDataHubSDK({
  baseUrl: 'http://localhost:3000/edge', // URL de tu servidor Edge DataHub
});
```

## 📋 Servicios Disponibles

### **1. Registrar Asistente**

```typescript
const attendeeData: AttendeeRegisterRequest = {
  fullName: 'Juan Pérez',
  email: 'juan@example.com',
  country: 'Colombia', // Opcional
  city: 'Bogotá', // Opcional
  properties: { // Opcional
    phone: '3001234567',
    company: 'Mi Empresa'
  }
};

try {
  const response = await sdk.registerAttendee(attendeeData);
  console.log('✅ Asistente registrado:', response.attendee.code);
} catch (error) {
  console.error('❌ Error:', error.message);
}
```

### **2. Buscar Asistente por Código**

```typescript
try {
  const response = await sdk.findAttendeeByCode('ABC123');
  console.log('✅ Asistente encontrado:', response.attendee.fullName);
} catch (error) {
  console.error('❌ Error:', error.message);
}
```

### **3. Registrar Jugada en Experiencia**

```typescript
const playData: ExperiencePlayRequest = {
  attendeeId: 'attendee-uuid-123',
  play_timestamp: new Date().toISOString(),
  score: 850,
  bonusScore: 50, // Opcional
  modePoints: 'firstTry', // Opcional: 'firstTry' | 'betterTry'
  data: { // Opcional
    level: 5,
    timeSpent: 120
  }
};

try {
  const response = await sdk.logExperiencePlay(playData);
  console.log('✅ Jugada registrada:', response.message);
} catch (error) {
  console.error('❌ Error:', error.message);
}
```

### **4. Redimir Puntos**

```typescript
const redemptionData: RedemptionRequest = {
  attendeeId: 'attendee-uuid-123',
  pointsRedeemed: 500,
  reason: 'Canje de camiseta'
};

try {
  const response = await sdk.redeemPoints(redemptionData);
  console.log('✅ Puntos redimidos:', response.message);
} catch (error) {
  console.error('❌ Error:', error.message);
}
```

## 🎮 Ejemplo Completo para un Juego

```typescript
import { EdgeDataHubSDK, SDKConfig, AttendeeRegisterRequest, ExperiencePlayRequest, RedemptionRequest } from './edge-datahub-sdk';

class GameManager {
  private sdk: EdgeDataHubSDK;
  private currentAttendee: any = null;

  constructor() {
    this.sdk = new EdgeDataHubSDK({
      baseUrl: 'http://localhost:3000/edge',
    });
  }

  // Paso 1: Registrar asistente
  async registerPlayer(playerData: { fullName: string; email: string }) {
    try {
      const response = await this.sdk.registerAttendee(playerData);
      this.currentAttendee = response.attendee;
      console.log('✅ Jugador registrado:', this.currentAttendee.code);
      return this.currentAttendee;
    } catch (error) {
      console.error('❌ Error registrando:', error.message);
      throw error;
    }
  }

  // Paso 2: Buscar asistente existente
  async findPlayer(code: string) {
    try {
      const response = await this.sdk.findAttendeeByCode(code);
      this.currentAttendee = response.attendee;
      console.log('✅ Jugador encontrado:', this.currentAttendee.fullName);
      return this.currentAttendee;
    } catch (error) {
      console.error('❌ Error buscando:', error.message);
      throw error;
    }
  }

  // Paso 3: Registrar jugada
  async logGamePlay(score: number, bonusScore?: number) {
    if (!this.currentAttendee) {
      throw new Error('No hay jugador activo');
    }

    try {
      const playData: ExperiencePlayRequest = {
        attendeeId: this.currentAttendee.id,
        play_timestamp: new Date().toISOString(),
        score,
        bonusScore,
        modePoints: 'firstTry',
        data: {
          level: this.getCurrentLevel(),
          timeSpent: this.getGameTime()
        }
      };

      const response = await this.sdk.logExperiencePlay(playData);
      console.log('✅ Jugada registrada:', response.message);
      return response;
    } catch (error) {
      console.error('❌ Error registrando jugada:', error.message);
      throw error;
    }
  }

  // Paso 4: Redimir premio
  async redeemPrize(points: number, reason: string) {
    if (!this.currentAttendee) {
      throw new Error('No hay jugador activo');
    }

    try {
      const redemptionData: RedemptionRequest = {
        attendeeId: this.currentAttendee.id,
        pointsRedeemed: points,
        reason
      };

      const response = await this.sdk.redeemPoints(redemptionData);
      console.log('✅ Premio redimido:', response.message);
      return response;
    } catch (error) {
      console.error('❌ Error redimiendo:', error.message);
      throw error;
    }
  }

  // Métodos auxiliares del juego
  private getCurrentLevel(): number {
    return Math.floor(Math.random() * 10) + 1;
  }

  private getGameTime(): number {
    return Math.floor(Math.random() * 300) + 60; // 1-5 minutos
  }
}

// Uso del GameManager
const game = new GameManager();

// Registrar nuevo jugador
await game.registerPlayer({
  fullName: 'María García',
  email: 'maria@example.com'
});

// Registrar jugada
await game.logGamePlay(750, 100);

// Redimir premio
await game.redeemPrize(500, 'Canje de camiseta');
```

## 🔧 Utilidades del SDK

```typescript
// Obtener configuración
console.log('Base URL:', sdk.getBaseUrl());
console.log('Event ID:', sdk.getEventId());
console.log('Experience ID:', sdk.getEventExperienceId());
```

## 📝 Tipos TypeScript Disponibles

```typescript
// Configuración del SDK
interface SDKConfig {
  baseUrl: string;
}

// Solicitud de registro de asistente
interface AttendeeRegisterRequest {
  fullName: string;
  email: string;
  country?: string;
  city?: string;
  properties?: Record<string, any>;
}

// Solicitud de jugada
interface ExperiencePlayRequest {
  attendeeId: string;
  play_timestamp: string;
  score: number;
  bonusScore?: number;
  modePoints?: 'firstTry' | 'betterTry';
  data?: Record<string, any>;
}

// Solicitud de redención
interface RedemptionRequest {
  attendeeId: string;
  pointsRedeemed: number;
  reason: string;
}

// Respuesta de asistente
interface AttendeeResponse {
  message: string;
  attendee: {
    id: string;
    code: string;
    fullName: string;
    email: string;
    country?: string;
    city?: string;
    properties?: Record<string, any>;
  };
}
```

## 🎯 Para Mañana - Checklist

- [ ] Incluir `edge-datahub-sdk.ts` y `sdk.types.ts` en tu proyecto
- [ ] Configurar `baseUrl` con la IP de tu servidor
- [ ] Implementar manejo de errores con try/catch
- [ ] Probar todos los servicios
- [ ] Verificar respuestas del servidor
- [ ] Configurar TypeScript en tu proyecto

¡Listo para el evento! 🚀

