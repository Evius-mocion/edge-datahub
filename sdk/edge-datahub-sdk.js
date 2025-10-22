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
      const errorData = await response.json();
      throw new Error(
        `Error registrando asistente: ${errorData.message || response.statusText}`,
      );
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
      const errorData = await response.json();
      throw new Error(
        `Error buscando asistente: ${errorData.message || response.statusText}`,
      );
    }

    return await response.json();
  }

  /**
   * Obtiene el status completo de un asistente (puntos, redemptions, actividad)
   * @param {Object} data - Datos para buscar el asistente (attendeeId, code, o email)
   * @param {string} [data.attendeeId] - ID del asistente
   * @param {string} [data.code] - Código del asistente
   * @param {string} [data.email] - Email del asistente
   * @returns {Promise<AttendeeStatusResponse>}
   */
  async getAttendeeStatus(data) {
    const response = await fetch(`${this.baseUrl}/attendees_status`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        `Error obteniendo status del asistente: ${errorData.message || response.statusText}`,
      );
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
      const errorData = await response.json();
      throw new Error(
        `Error registrando jugada: ${errorData.message || response.statusText}`,
      );
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
      const errorData = await response.json();
      throw new Error(
        `Error redimiendo puntos: ${errorData.message || response.statusText}`,
      );
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

  /**
   * Obtiene la URL base configurada
   * @returns {string} URL base del SDK
   */
  getBaseUrl() {
    return this.baseUrl;
  }

  /**
   * Obtiene el ID del evento (hardcoded)
   * @returns {string} ID del evento
   */
  getEventId() {
    return this.eventId;
  }

  /**
   * Obtiene el ID de la experiencia (hardcoded)
   * @returns {string} ID de la experiencia
   */
  getEventExperienceId() {
    return this.eventExperienceId;
  }
}

// Exportar instancia del SDK
const sdk = new EdgeDataHubSDK();
export { sdk };

// ===== TIPOS TYPESCRIPT (JSDoc para autocompletado) =====

/**
 * @typedef {Object} AttendeeStatusResponse
 * @property {string} message - Mensaje de respuesta
 * @property {Object} status - Status del asistente
 * @property {string} status.id - ID del asistente
 * @property {string} status.eventId - ID del evento
 * @property {string} status.fullName - Nombre completo
 * @property {string} status.email - Email
 * @property {string} [status.checkInAt] - Fecha de check-in
 * @property {number} status.totalPoints - Puntos totales
 * @property {number} status.redemptionPoints - Puntos redimidos
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
 * @typedef {Object} ExperiencePlayResponse
 * @property {string} message - Mensaje de respuesta
 * @property {Object} [experiencePlay] - Datos de la jugada registrada
 * @property {string} experiencePlay.id - ID de la jugada
 * @property {string} experiencePlay.attendeeId - ID del asistente
 * @property {string} experiencePlay.eventExperienceId - ID de la experiencia
 * @property {string} experiencePlay.play_timestamp - Timestamp de la jugada
 * @property {number} experiencePlay.score - Puntuación obtenida
 * @property {number} [experiencePlay.bonusScore] - Puntuación bonus
 * @property {string} [experiencePlay.modePoints] - Modo de puntos
 * @property {Object} [experiencePlay.data] - Datos adicionales
 */

/**
 * @typedef {Object} RedemptionRequest
 * @property {string} attendeeId - ID del asistente (REQUERIDO)
 * @property {number} pointsRedeemed - Puntos a redimir (REQUERIDO)
 * @property {string} reason - Motivo de la redención (REQUERIDO)
 * @description eventId se agrega automáticamente (está quemado en el código)
 */

/**
 * @typedef {Object} RedemptionResponse
 * @property {string} message - Mensaje de respuesta
 * @property {Object} [redemption] - Datos de la redención registrada
 * @property {string} redemption.id - ID de la redención
 * @property {string} redemption.attendeeId - ID del asistente
 * @property {string} redemption.eventId - ID del evento
 * @property {number} redemption.pointsRedeemed - Puntos redimidos
 * @property {string} redemption.reason - Motivo de la redención
 * @property {string} redemption.timestamp - Timestamp de la redención
 */

/**
 * @typedef {Object} ErrorResponse
 * @property {string} message - Mensaje de error
 * @property {string} [error] - Detalle del error
 * @property {number} [statusCode] - Código de estado HTTP
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
