import { IsString, IsObject, IsOptional, IsIn, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class EdgeEventMetadata {
	@IsString()
	@IsOptional()
	deviceId?: string;

	@IsString()
	@IsOptional()
	seq?: string;

	@IsString()
	@IsOptional()
	idempotencyKey?: string;

	@IsOptional()
	offline?: boolean;
}


// Specific payload DTOs
export class AttendeeCheckinPayload {
	@IsString()
	attendeeId: string;

	@IsString()
	eventId: string;

	@IsString()
	timestamp: string;

	@IsString()
	@IsOptional()
	stationId?: string;

	@IsString()
	@IsOptional()
	type?: string;
}

export class AttendeeRegisterPayload {
	@IsString()
	eventId: string;

	@IsString()
	fullName: string;

	@IsString()
	email: string;

	@IsObject()
	@IsOptional()
	properties?: Record<string, any>;

	@IsString()
	@IsOptional()
	country?: string;

	@IsString()
	@IsOptional()
	city?: string;
}


export class ActivityCheckinPayload {
	@IsString()
	activityId: string;

	@IsString()
	attendeeId: string;

	@IsString()
	date: string;
}

