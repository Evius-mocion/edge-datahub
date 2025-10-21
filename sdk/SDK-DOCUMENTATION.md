# 🎮 Edge DataHub SDK - Guía de Uso

**SDK simple para integrar con el sistema de gamificación del evento**

## 🚀 Instalación Rápida

```html
<!-- Incluir en tu HTML -->
<script src="edge-datahub-sdk.js"></script>
```

```javascript
// Configurar SDK - IDs quemados en el código
const sdk = new EdgeDataHubSDK({
  baseUrl: 'http://localhost:3000/edge', // URL de tu servidor Edge DataHub
});
```

## 📋 Servicios Disponibles

### **1. Registrar Asistente**

Registra un nuevo asistente en el evento y genera un código único para identificarlo.

```javascript
const response = await sdk.registerAttendee({
  fullName: 'Juan Pérez', // REQUERIDO
  email: 'juan@example.com', // REQUERIDO
  country: 'Colombia', // opcional
  city: 'Bogotá', // opcional
  properties: {
    // opcional
    company: 'Mi Empresa',
    role: 'Developer',
  },
});

console.log('Asistente registrado:', response.attendee.code);
// Retorna: { message: 'Attendee registered successfully', attendee: {...} }
```

**Campos requeridos:** `fullName`, `email`  
**Campos opcionales:** `country`, `city`, `properties`

### **2. Buscar Asistente por Código**

Busca un asistente existente usando su código único.

```javascript
const response = await sdk.findAttendeeByCode('ABC123');

console.log('Asistente encontrado:', response.attendee);
// Retorna: { message: 'Attendee found', attendee: {...} }
```

**Parámetro:** `code` (string) - Código del asistente

### **3. Registrar Jugada en Experiencia**

Registra una jugada/puntuación de un asistente en una experiencia específica.

```javascript
const response = await sdk.logExperiencePlay({
  attendeeId: 'attendee-uuid-789', // REQUERIDO
  play_timestamp: new Date().toISOString(), // REQUERIDO
  score: 1500, // REQUERIDO
  bonusScore: 300, // opcional
  modePoints: 'firstTry', // opcional: "firstTry" | "betterTry"
  data: {
    // opcional
    level: 3,
    timeSpent: 120,
    achievements: ['first_try', 'perfect_score'],
  },
});

console.log('Jugada registrada:', response.message);
// Retorna: { message: 'Experience play logged successfully', play: {...} }
```

**Campos requeridos:** `attendeeId`, `play_timestamp`, `score`  
**Campos opcionales:** `bonusScore`, `modePoints`, `data`

### **4. Redimir Puntos**

Permite a un asistente redimir puntos por premios.

```javascript
const response = await sdk.redeemPoints({
  attendeeId: 'attendee-uuid-789', // REQUERIDO
  pointsRedeemed: 500, // REQUERIDO
  reason: 'Canje de premio - Camiseta oficial', // REQUERIDO
});

console.log('Redención procesada:', response.message);
// Retorna: { message: 'Points redeemed successfully', redemption: {...} }
```

**Campos requeridos:** `attendeeId`, `pointsRedeemed`, `reason`

## 🔧 Manejo de Errores

Todos los métodos pueden lanzar errores si:

- No hay conexión a internet
- El servidor no responde
- Los datos enviados son inválidos
- El asistente no existe

```javascript
try {
  const response = await sdk.registerAttendee({
    fullName: 'Juan Pérez',
    email: 'juan@example.com',
  });
  console.log('Éxito:', response.message);
} catch (error) {
  console.error('Error:', error.message);
  // Manejar el error según sea necesario
}
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
        fullName: playerData.name, // REQUERIDO
        email: playerData.email, // REQUERIDO
        country: playerData.country || 'Colombia', // opcional
        city: playerData.city || 'Bogotá', // opcional
      });
      // eventId se agrega automáticamente

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
      attendeeId: this.currentAttendee.id, // REQUERIDO
      play_timestamp: new Date().toISOString(), // REQUERIDO
      score: score, // REQUERIDO
      bonusScore: bonusScore, // opcional
      modePoints: this.isFirstTry ? 'firstTry' : 'betterTry', // opcional
      data: {
        // opcional
        gameLevel: this.currentLevel,
        timeSpent: this.timeSpent,
        moves: this.movesCount,
      },
    });
    // eventExperienceId se agrega automáticamente

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
      attendeeId: this.currentAttendee.id, // REQUERIDO
      pointsRedeemed: points, // REQUERIDO
      reason: reason, // REQUERIDO
    });
    // eventId se agrega automáticamente

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
await game.findPlayerByCode('ABC123');

// Registrar puntuación
game.submitScore(1500, 300);

// Redimir premio
game.redeemPrize(500, 'Canje de camiseta');
```


## 🎯 Para Mañana - Checklist

- [ ] Incluir `edge-datahub-sdk.js` en tu proyecto
- [ ] Configurar `baseUrl` con la IP de tu servidor
- [ ] Implementar manejo de errores con try/catch
- [ ] Probar todos los servicios
- [ ] Verificar respuestas del servidor

¡Listo para el evento! 🚀
