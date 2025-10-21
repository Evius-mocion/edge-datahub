# 🎮 Edge DataHub SDK - Guía Rápida

**Para desarrolladores que necesitan integrar con el sistema de gamificación del evento**

## 🚀 Instalación Rápida

```html
<!-- Incluir en tu HTML -->
<script src="edge-datahub-sdk.js"></script>
```

```javascript
// Configurar SDK
const sdk = new EdgeDataHubSDK({
  baseUrl: 'http://localhost:3000/edge', // URL de tu servidor Edge DataHub
});
```

## 📋 Operaciones Disponibles

### ✅ **1. REGISTRO DE ASISTENTE** (CRÍTICO - No se puede encolar)

```javascript
try {
  const response = await sdk.registerAttendee({
    eventId: 'event-uuid-123',
    fullName: 'Juan Pérez',
    email: 'juan@example.com',
    country: 'Colombia',
    city: 'Bogotá',
    properties: {
      company: 'Mi Empresa',
      role: 'Developer',
    },
  });

  console.log('✅ Asistente registrado:', response.attendee.code);
  // El código generado es: 123456 (se usa para buscar al asistente)
} catch (error) {
  console.error('❌ Error:', error.message);
  // Si no hay conexion con el servidor local, esto FALLA - no se puede encolar
}
```

### 🔍 **2. BUSCAR ASISTENTE POR CÓDIGO** (CRÍTICO - Consulta local)

```javascript
try {
  const response = await sdk.findAttendeeByCode('123456');
  console.log('✅ Asistente encontrado:', response.attendee);
} catch (error) {
  console.error('❌ Asistente no encontrado');
}
```

### 🎯 **3. REGISTRAR JUGADA EN EXPERIENCIA** (SE ENCOLA automáticamente)

```javascript
// Esto SIEMPRE funciona - se encola si no conexion con el servidor local
sdk.logExperiencePlay({
  eventExperienceId: 'experience-uuid-456',
  attendeeId: 'attendee-uuid-789',
  play_timestamp: new Date().toISOString(), // "2025-10-17T04:35:57.000Z"
  data: {
    level: 3,
    timeSpent: 120,
    achievements: ['first_try', 'perfect_score'],
  },
  score: 1500,
  bonusScore: 300,
  modePoints: 'firstTry', // "firstTry" | "betterTry"
});

console.log('📝 Jugada registrada - se sincronizará automáticamente');
```

### 🏆 **4. REDIMIR PUNTOS** (SE ENCOLA automáticamente)

```javascript
// Esto SIEMPRE funciona - se encola si no conexion con el servidor local
sdk.redeemPoints({
  eventId: 'event-uuid-123',
  attendeeId: 'attendee-uuid-789',
  pointsRedeemed: 500,
  reason: 'Canje de premio - Camiseta oficial',
});

console.log('📝 Redención procesada - se sincronizará automáticamente');
```

## 🔧 Utilidades del SDK

```javascript
// Verificar estado de conexión
console.log('¿Hay internet?', sdk.getConnectionStatus());

// Ver cuántos elementos hay en cola
console.log('Elementos en cola:', sdk.getQueueSize());

// Ver estadísticas detalladas de la cola
console.log('Estadísticas:', sdk.getQueueStats());
// {
//   total: 5,
//   pending: 3,
//   retrying: 1,
//   failed: 1
// }

// Forzar sincronización manual
await sdk.forceSync();

// Limpiar cola (¡CUIDADO!)
sdk.clearQueue();
```

## 🎮 Ejemplo Completo para un Juego

```javascript
class GameManager {
  constructor() {
    this.sdk = new EdgeDataHubSDK({
      baseUrl: 'http://localhost:3000/edge',
    });
    this.currentAttendee = null;
  }

  // Paso 1: Registrar asistente (debe tener internet)
  async registerPlayer(playerData) {
    try {
      const response = await this.sdk.registerAttendee({
        eventId: 'event-123',
        fullName: playerData.name,
        email: playerData.email,
        country: playerData.country || 'Colombia',
        city: playerData.city || 'Bogotá',
      });

      this.currentAttendee = response.attendee;
      console.log(`🎉 Jugador registrado: ${this.currentAttendee.code}`);
      return true;
    } catch (error) {
      alert('❌ Error: Necesitas conexión a internet para registrarte');
      return false;
    }
  }

  // Paso 2: Buscar asistente existente
  async findPlayerByCode(code) {
    try {
      const response = await this.sdk.findAttendeeByCode(code);
      this.currentAttendee = response.attendee;
      console.log(`✅ Jugador encontrado: ${this.currentAttendee.fullName}`);
      return true;
    } catch (error) {
      alert('❌ Código no válido');
      return false;
    }
  }

  // Paso 3: Registrar puntuación (funciona sin internet)
  submitScore(score, bonusScore = 0) {
    if (!this.currentAttendee) {
      alert('❌ Primero debes registrar o buscar un jugador');
      return;
    }

    this.sdk.logExperiencePlay({
      eventExperienceId: 'game-experience-123', // ID de tu experiencia
      attendeeId: this.currentAttendee.id,
      play_timestamp: new Date().toISOString(),
      data: {
        gameLevel: this.currentLevel,
        timeSpent: this.timeSpent,
        moves: this.movesCount,
      },
      score: score,
      bonusScore: bonusScore,
      modePoints: this.isFirstTry ? 'firstTry' : 'betterTry',
    });

    console.log(
      `📝 Puntuación ${score} registrada para ${this.currentAttendee.fullName}`,
    );
  }

  // Paso 4: Redimir premio (funciona sin internet)
  redeemPrize(points, reason) {
    if (!this.currentAttendee) {
      alert('❌ Primero debes registrar o buscar un jugador');
      return;
    }

    this.sdk.redeemPoints({
      eventId: 'event-123',
      attendeeId: this.currentAttendee.id,
      pointsRedeemed: points,
      reason: reason,
    });

    console.log(`🏆 Redención de ${points} puntos procesada`);
  }
}

// Uso en tu juego
const game = new GameManager();

// Registrar nuevo jugador
await game.registerPlayer({
  name: 'María García',
  email: 'maria@example.com',
});

// O buscar jugador existente
await game.findPlayerByCode('123456');

// Registrar puntuación
game.submitScore(1500, 300);

// Redimir premio
game.redeemPrize(500, 'Canje de camiseta');
```

## 🔄 Cómo Funciona la Cola Offline

1. **Con Internet**: Los datos se envían directamente al servidor
2. **Sin Internet**: Los datos se guardan en localStorage
3. **Recuperación**: Cada 30 segundos intenta enviar los datos pendientes
4. **Reintentos**: Hasta 3 intentos por elemento
5. **Logs**: Todo se registra en la consola para debugging

## 🚨 Reglas Importantes

### ✅ **SÍ se puede hacer sin internet:**

- Registrar jugadas (`logExperiencePlay`)
- Redimir puntos (`redeemPoints`)
- Buscar asistente por código (`findAttendeeByCode`)

### ❌ **NO se puede hacer sin internet:**

- Registrar nuevo asistente (`registerAttendee`)

## 🐛 Debugging

```javascript
// Ver todos los logs en la consola del navegador
// Los logs aparecen con emojis para fácil identificación:
// 📝 = Encolado
// ✅ = Exitoso
// ❌ = Error
// 🔄 = Procesando
// 🗑️ = Limpiado

// Ver estado actual
console.log('Estado:', {
  online: sdk.getConnectionStatus(),
  queueSize: sdk.getQueueSize(),
  queueStats: sdk.getQueueStats(),
});
```

## 🎯 Para Mañana - Checklist

- [ ] Incluir `edge-datahub-sdk.js` en tu proyecto
- [ ] Configurar `baseUrl` con la IP de tu servidor
- [ ] Implementar registro de asistente (con validación de internet)
- [ ] Implementar búsqueda por código
- [ ] Implementar registro de jugadas
- [ ] Implementar redención de puntos
- [ ] Probar con y sin internet
- [ ] Verificar logs en consola

¡Listo para el evento! 🚀
