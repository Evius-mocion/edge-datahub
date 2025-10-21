/**
 * Edge DataHub SDK - Simple Offline Queue System
 * Para eventos con conectividad intermitente
 */

class EdgeDataHubSDK {
  constructor(config) {
    this.baseUrl = config.baseUrl || 'http://localhost:3000/edge';
    this.isOnline = true;
    this.queueKey = 'edge_datahub_queue';
    this.maxRetries = 3;
    this.retryDelay = 5000; // 5 segundos
    
    // Event configuration - REQUIRED for each implementation
    this.eventId = config.eventId; // REQUIRED: ID del evento
    this.eventExperienceId = config.eventExperienceId; // REQUIRED: ID de la experiencia
    
    if (!this.eventId) {
      throw new Error('❌ eventId is required in SDK configuration');
    }
    if (!this.eventExperienceId) {
      throw new Error('❌ eventExperienceId is required in SDK configuration');
    }

    // Health check cada 10 segundos
    this.startHealthCheck();

    // Procesar cola cada 30 segundos
    this.startQueueProcessor();
  }

  // ===== HEALTH CHECK =====
  startHealthCheck() {
    setInterval(async () => {
      try {
        const response = await fetch(`${this.baseUrl}/health`, {
          method: 'GET',
          timeout: 3000,
        });
        this.isOnline = response.ok;
      } catch (error) {
        this.isOnline = false;
      }
    }, 10000);
  }

  // ===== QUEUE MANAGEMENT =====
  enqueue(operation, data, endpoint) {
    const queueItem = {
      id: Date.now() + Math.random(),
      operation,
      data,
      endpoint,
      timestamp: new Date().toISOString(),
      retries: 0,
    };

    const queue = this.getQueue();
    queue.push(queueItem);
    this.saveQueue(queue);

    console.log(
      `📝 [QUEUE] Encolado: ${operation} - Total en cola: ${queue.length}`,
    );
  }

  getQueue() {
    try {
      return JSON.parse(localStorage.getItem(this.queueKey) || '[]');
    } catch {
      return [];
    }
  }

  saveQueue(queue) {
    localStorage.setItem(this.queueKey, JSON.stringify(queue));
  }

  startQueueProcessor() {
    setInterval(() => {
      this.processQueue();
    }, 30000);
  }

  async processQueue() {
    if (!this.isOnline) return;

    const queue = this.getQueue();
    if (queue.length === 0) return;

    console.log(`🔄 [QUEUE] Procesando ${queue.length} elementos...`);

    const itemsToProcess = queue.filter(
      (item) => item.retries < this.maxRetries,
    );

    for (const item of itemsToProcess) {
      try {
        await this.executeOperation(item);
        this.removeFromQueue(item.id);
        console.log(`✅ [QUEUE] Procesado: ${item.operation}`);
      } catch (error) {
        this.incrementRetries(item.id);
        console.log(`❌ [QUEUE] Error en ${item.operation}: ${error.message}`);
      }
    }
  }

  async executeOperation(item) {
    const response = await fetch(`${this.baseUrl}${item.endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(item.data),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  }

  removeFromQueue(itemId) {
    const queue = this.getQueue();
    const filtered = queue.filter((item) => item.id !== itemId);
    this.saveQueue(filtered);
  }

  incrementRetries(itemId) {
    const queue = this.getQueue();
    const item = queue.find((item) => item.id === itemId);
    if (item) {
      item.retries++;
      this.saveQueue(queue);
    }
  }

  // ===== OPERACIONES CRÍTICAS (NO ENCOLABLES) =====

  /**
   * Registra un asistente - CRÍTICO: No se puede encolar
   * @param {AttendeeRegisterRequest} data - Datos del asistente (sin eventId, se agrega automáticamente)
   * @returns {Promise<AttendeeResponse>}
   */
  async registerAttendee(data) {
    if (!this.isOnline) {
      throw new Error(
        '❌ No se puede registrar asistente sin conexión a internet',
      );
    }

    // Validar campos requeridos
    this.validateRequiredFields(data, ['fullName', 'email']);

    // Agregar eventId automáticamente
    const payload = {
      ...data,
      eventId: this.eventId
    };

    const response = await fetch(`${this.baseUrl}/attendees/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Error registrando asistente: ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Busca asistente por código - CRÍTICO: Consulta local
   * @param {string} code
   * @returns {Promise<AttendeeResponse>}
   */
  async findAttendeeByCode(code) {
    const response = await fetch(`${this.baseUrl}/attendees/${code}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Error buscando asistente: ${response.statusText}`);
    }

    return await response.json();
  }

  // ===== OPERACIONES ENCOLABLES =====

  /**
   * Registra jugada en experiencia - SE ENCOLA si no hay conexión
   * @param {ExperiencePlayRequest} data - Datos de la jugada (sin eventExperienceId, se agrega automáticamente)
   */
  logExperiencePlay(data) {
    // Validar campos requeridos
    this.validateRequiredFields(data, ['attendeeId', 'play_timestamp', 'score']);

    // Agregar eventExperienceId automáticamente
    const payload = {
      ...data,
      eventExperienceId: this.eventExperienceId
    };

    if (this.isOnline) {
      // Intentar enviar directamente
      fetch(`${this.baseUrl}/experience`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })
        .then((response) => {
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
          }
          console.log('✅ [DIRECT] Jugada enviada directamente');
        })
        .catch((error) => {
          console.log('📝 [FALLBACK] Encolando jugada...');
          this.enqueue('logExperiencePlay', payload, '/experience');
        });
    } else {
      console.log('📝 [OFFLINE] Encolando jugada...');
      this.enqueue('logExperiencePlay', payload, '/experience');
    }
  }

  /**
   * Redime puntos - SE ENCOLA si no hay conexión
   * @param {RedemptionRequest} data - Datos de redención (sin eventId, se agrega automáticamente)
   */
  redeemPoints(data) {
    // Validar campos requeridos
    this.validateRequiredFields(data, ['attendeeId', 'pointsRedeemed', 'reason']);

    // Agregar eventId automáticamente
    const payload = {
      ...data,
      eventId: this.eventId
    };

    if (this.isOnline) {
      // Intentar enviar directamente
      fetch(`${this.baseUrl}/redemption`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })
        .then((response) => {
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
          }
          console.log('✅ [DIRECT] Redención enviada directamente');
        })
        .catch((error) => {
          console.log('📝 [FALLBACK] Encolando redención...');
          this.enqueue('redeemPoints', payload, '/redemption');
        });
    } else {
      console.log('📝 [OFFLINE] Encolando redención...');
      this.enqueue('redeemPoints', payload, '/redemption');
    }
  }

  // ===== UTILIDADES =====

  /**
   * Valida que los campos requeridos estén presentes
   * @param {Object} data - Datos a validar
   * @param {string[]} requiredFields - Campos requeridos
   */
  validateRequiredFields(data, requiredFields) {
    for (const field of requiredFields) {
      if (!data[field]) {
        throw new Error(`❌ Campo requerido faltante: ${field}`);
      }
    }
  }

  /**
   * Obtiene estado de conexión
   * @returns {boolean}
   */
  getConnectionStatus() {
    return this.isOnline;
  }

  /**
   * Obtiene tamaño de la cola
   * @returns {number}
   */
  getQueueSize() {
    return this.getQueue().length;
  }

  /**
   * Fuerza procesamiento de la cola
   */
  async forceSync() {
    console.log('🔄 [FORCE] Forzando sincronización...');
    await this.processQueue();
  }

  /**
   * Limpia la cola (usar con cuidado)
   */
  clearQueue() {
    localStorage.removeItem(this.queueKey);
    console.log('🗑️ [CLEAR] Cola limpiada');
  }

  /**
   * Obtiene estadísticas de la cola
   * @returns {object}
   */
  getQueueStats() {
    const queue = this.getQueue();
    return {
      total: queue.length,
      pending: queue.filter((item) => item.retries === 0).length,
      retrying: queue.filter(
        (item) => item.retries > 0 && item.retries < this.maxRetries,
      ).length,
      failed: queue.filter((item) => item.retries >= this.maxRetries).length,
    };
  }
}

// ===== TIPOS TYPESCRIPT (JSDoc para autocompletado) =====

/**
 * @typedef {Object} SDKConfig
 * @property {string} baseUrl - URL base del servidor Edge DataHub
 * @property {string} eventId - ID del evento (REQUERIDO)
 * @property {string} eventExperienceId - ID de la experiencia (REQUERIDO)
 */

/**
 * @typedef {Object} AttendeeRegisterRequest
 * @property {string} fullName - Nombre completo del asistente (REQUERIDO)
 * @property {string} email - Email del asistente (REQUERIDO)
 * @property {string} [country] - País (opcional)
 * @property {string} [city] - Ciudad (opcional)
 * @property {Object} [properties] - Propiedades adicionales (opcional)
 * @description eventId se agrega automáticamente desde la configuración del SDK
 */

/**
 * @typedef {Object} ExperiencePlayRequest
 * @property {string} attendeeId - ID del asistente (REQUERIDO)
 * @property {string} play_timestamp - Timestamp de la jugada en formato ISO (REQUERIDO)
 * @property {number} score - Puntuación obtenida (REQUERIDO)
 * @property {number} [bonusScore] - Puntuación bonus (opcional)
 * @property {string} [modePoints] - Modo de puntos: 'firstTry' | 'betterTry' (opcional)
 * @property {Object} [data] - Datos adicionales de la jugada (opcional)
 * @description eventExperienceId se agrega automáticamente desde la configuración del SDK
 */

/**
 * @typedef {Object} RedemptionRequest
 * @property {string} attendeeId - ID del asistente (REQUERIDO)
 * @property {number} pointsRedeemed - Puntos a redimir (REQUERIDO)
 * @property {string} reason - Motivo de la redención (REQUERIDO)
 * @description eventId se agrega automáticamente desde la configuración del SDK
 */

/**
 * @typedef {Object} AttendeeResponse
 * @property {string} message - Mensaje de respuesta
 * @property {Object} attendee - Datos del asistente
 * @property {string} attendee.id - ID del asistente
 * @property {string} attendee.code - Código único del asistente
 * @property {string} attendee.fullName - Nombre completo
 * @property {string} attendee.email - Email
 * @property {string} [attendee.country] - País
 * @property {string} [attendee.city] - Ciudad
 * @property {Object} [attendee.properties] - Propiedades adicionales
 */

/**
 * @typedef {Object} QueueStats
 * @property {number} total - Total de elementos en cola
 * @property {number} pending - Elementos pendientes (sin reintentos)
 * @property {number} retrying - Elementos en proceso de reintento
 * @property {number} failed - Elementos que fallaron después de todos los reintentos
 */

// Exportar para uso
if (typeof module !== 'undefined' && module.exports) {
  module.exports = EdgeDataHubSDK;
} else {
  window.EdgeDataHubSDK = EdgeDataHubSDK;
}
