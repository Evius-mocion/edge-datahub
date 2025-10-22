/**
 * Edge DataHub SDK Types
 * TypeScript definitions for the Edge DataHub SDK
 */

export interface SDKConfig {
  baseUrl: string;
}

export interface AttendeeRegisterRequest {
  fullName: string;
  email: string;
  country?: string;
  city?: string;
  properties?: Record<string, any>;
}

export interface ExperiencePlayRequest {
  attendeeId: string;
  play_timestamp: string;
  score: number;
  bonusScore?: number;
  modePoints?: 'firstTry' | 'betterTry';
  data?: Record<string, any>;
}

export interface RedemptionRequest {
  attendeeId: string;
  pointsRedeemed: number;
  reason: string;
}

export interface AttendeeResponse {
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

export interface ExperiencePlayResponse {
  message: string;
  experiencePlay?: {
    id: string;
    attendeeId: string;
    eventExperienceId: string;
    play_timestamp: string;
    score: number;
    bonusScore?: number;
    modePoints?: string;
    data?: Record<string, any>;
  };
}

export interface RedemptionResponse {
  message: string;
  redemption?: {
    id: string;
    attendeeId: string;
    eventId: string;
    pointsRedeemed: number;
    reason: string;
    timestamp: string;
  };
}

export interface ErrorResponse {
  message: string;
  error?: string;
  statusCode?: number;
}

