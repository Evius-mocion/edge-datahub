/**
 * Edge DataHub SDK - Simple SDK for Event Gamification
 * Para eventos con conectividad intermitente
 */

class EdgeDataHubSDK {
  constructor(config) {
    this.baseUrl = config.baseUrl || 'http://localhost:3000/edge';
    
    // Event configuration - HARDCODED IDs for this implementation
    this.eventId = 'event-uuid-123'; // HARDCODED: ID del evento
    this.eventExperienceId = 'experience-uuid-456'; // HARDCODED: ID de la experiencia
  }

  // ===== OPERACIONES PRINCIPALES =====

  /**
   * Registra un asistente
   * @param {AttendeeRegisterRequest} data - Datos del asistente (eventId se agrega automáticamente)
   * @returns {Promise<AttendeeResponse>}
   */
  async registerAttendee(data) {
    // Validar campos requeridos
    this.validateRequiredFields(data, ['fullName', 'email']);

    // Agregar eventId automáticamente
    const payload = {
      ...data,
      eventId: this.eventId,
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
   * Busca asistente por código
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

  /**
   * Registra jugada en experiencia
   * @param {ExperiencePlayRequest} data - Datos de la jugada (eventExperienceId se agrega automáticamente)
   * @returns {Promise<any>}
   */
  async logExperiencePlay(data) {
    // Validar campos requeridos
    this.validateRequiredFields(data, [
      'attendeeId',
      'play_timestamp',
      'score',
    ]);

    // Agregar eventExperienceId automáticamente
    const payload = {
      ...data,
      eventExperienceId: this.eventExperienceId,
    };

    const response = await fetch(`${this.baseUrl}/experience`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Error registrando jugada: ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Redime puntos
   * @param {RedemptionRequest} data - Datos de redención (eventId se agrega automáticamente)
   * @returns {Promise<any>}
   */
  async redeemPoints(data) {
    // Validar campos requeridos
    this.validateRequiredFields(data, [
      'attendeeId',
      'pointsRedeemed',
      'reason',
    ]);

    // Agregar eventId automáticamente
    const payload = {
      ...data,
      eventId: this.eventId,
    };

    const response = await fetch(`${this.baseUrl}/redemption`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Error redimiendo puntos: ${response.statusText}`);
    }

    return await response.json();
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
}

// ===== TIPOS TYPESCRIPT (JSDoc para autocompletado) =====

/**
 * @typedef {Object} SDKConfig
 * @property {string} baseUrl - URL base del servidor Edge DataHub
 */

/**
 * @typedef {Object} AttendeeRegisterRequest
 * @property {string} fullName - Nombre completo del asistente (REQUERIDO)
 * @property {string} email - Email del asistente (REQUERIDO)
 * @property {string} [country] - País (opcional)
 * @property {string} [city] - Ciudad (opcional)
 * @property {Object} [properties] - Propiedades adicionales (opcional)
 * @description eventId se agrega automáticamente (está quemado en el código)
 */

/**
 * @typedef {Object} ExperiencePlayRequest
 * @property {string} attendeeId - ID del asistente (REQUERIDO)
 * @property {string} play_timestamp - Timestamp de la jugada en formato ISO (REQUERIDO)
 * @property {number} score - Puntuación obtenida (REQUERIDO)
 * @property {number} [bonusScore] - Puntuación bonus (opcional)
 * @property {string} [modePoints] - Modo de puntos: 'firstTry' | 'betterTry' (opcional)
 * @property {Object} [data] - Datos adicionales de la jugada (opcional)
 * @description eventExperienceId se agrega automáticamente (está quemado en el código)
 */

/**
 * @typedef {Object} RedemptionRequest
 * @property {string} attendeeId - ID del asistente (REQUERIDO)
 * @property {number} pointsRedeemed - Puntos a redimir (REQUERIDO)
 * @property {string} reason - Motivo de la redención (REQUERIDO)
 * @description eventId se agrega automáticamente (está quemado en el código)
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

// Exportar para uso
if (typeof module !== 'undefined' && module.exports) {
  module.exports = EdgeDataHubSDK;
} else {
  window.EdgeDataHubSDK = EdgeDataHubSDK;
}
