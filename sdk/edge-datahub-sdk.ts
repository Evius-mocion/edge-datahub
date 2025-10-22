/**
 * Edge DataHub SDK - TypeScript Version
 * Simple SDK for Event Gamification
 * Para eventos con conectividad intermitente
 */

import {
  type AttendeeRegisterRequest,
  type AttendeeResponse,
  type AttendeeStatusResponse,
  type ExperiencePlayRequest,
  type ExperiencePlayResponse,
  type RedemptionRequest,
  type RedemptionResponse,
  type ErrorResponse,
} from './sdk.types';

export class EdgeDataHubSDK {
  private baseUrl: string;
  private eventId: string;
  private eventExperienceId: string;

  constructor() {
    this.baseUrl = 'http://localhost:3000/edge';

    // Event configuration - HARDCODED IDs for this implementation
    this.eventId = 'event-uuid-123'; // HARDCODED: ID del evento
    this.eventExperienceId = 'experience-uuid-456'; // HARDCODED: ID de la experiencia
  }

  // ===== OPERACIONES PRINCIPALES =====

  /**
   * Registra un asistente
   * @param data - Datos del asistente (eventId se agrega automáticamente)
   * @returns Promise con la respuesta del servidor
   */
  async registerAttendee(
    data: AttendeeRegisterRequest,
  ): Promise<AttendeeResponse> {
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
      const errorData: ErrorResponse = await response.json();
      throw new Error(
        `Error registrando asistente: ${errorData.message || response.statusText}`,
      );
    }

    return await response.json();
  }

  /**
   * Busca asistente por código
   * @param code - Código único del asistente
   * @returns Promise con los datos del asistente
   */
  async findAttendeeByCode(code: string): Promise<AttendeeResponse> {
    const response = await fetch(`${this.baseUrl}/attendees/${code}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData: ErrorResponse = await response.json();
      throw new Error(
        `Error buscando asistente: ${errorData.message || response.statusText}`,
      );
    }

    return await response.json();
  }

  /**
   * Obtiene el status completo de un asistente (puntos, redemptions, actividad)
   * @param data - Datos para buscar el asistente (attendeeId, code, o email)
   * @returns Promise con el status completo del asistente
   */
  async getAttendeeStatus(data: {
    attendeeId?: string;
    code?: string;
    email?: string;
  }): Promise<AttendeeStatusResponse> {
    const response = await fetch(`${this.baseUrl}/attendees_status`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData: ErrorResponse = await response.json();
      throw new Error(
        `Error obteniendo status del asistente: ${errorData.message || response.statusText}`,
      );
    }

    return await response.json();
  }

  /**
   * Registra jugada en experiencia
   * @param data - Datos de la jugada (eventExperienceId se agrega automáticamente)
   * @returns Promise con la respuesta del servidor
   */
  async logExperiencePlay(
    data: ExperiencePlayRequest,
  ): Promise<ExperiencePlayResponse> {
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
      const errorData: ErrorResponse = await response.json();
      throw new Error(
        `Error registrando jugada: ${errorData.message || response.statusText}`,
      );
    }

    return await response.json();
  }

  /**
   * Redime puntos
   * @param data - Datos de redención (eventId se agrega automáticamente)
   * @returns Promise con la respuesta del servidor
   */
  async redeemPoints(data: RedemptionRequest): Promise<RedemptionResponse> {
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
      const errorData: ErrorResponse = await response.json();
      throw new Error(
        `Error redimiendo puntos: ${errorData.message || response.statusText}`,
      );
    }

    return await response.json();
  }

  // ===== UTILIDADES =====

  /**
   * Valida que los campos requeridos estén presentes
   * @param data - Datos a validar
   * @param requiredFields - Campos requeridos
   */
  private validateRequiredFields(
    data: Record<string, any>,
    requiredFields: string[],
  ): void {
    for (const field of requiredFields) {
      if (!data[field]) {
        throw new Error(`❌ Campo requerido faltante: ${field}`);
      }
    }
  }

  /**
   * Obtiene la URL base configurada
   * @returns URL base del SDK
   */
  getBaseUrl(): string {
    return this.baseUrl;
  }

  /**
   * Obtiene el ID del evento (hardcoded)
   * @returns ID del evento
   */
  getEventId(): string {
    return this.eventId;
  }

  /**
   * Obtiene el ID de la experiencia (hardcoded)
   * @returns ID de la experiencia
   */
  getEventExperienceId(): string {
    return this.eventExperienceId;
  }
}

export const sdk = new EdgeDataHubSDK();
