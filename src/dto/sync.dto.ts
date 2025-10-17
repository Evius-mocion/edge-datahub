import { IsString, IsOptional, IsNumber } from 'class-validator';

export class SyncEventDto {
	@IsString()
	eventId: string;

	@IsOptional()
	@IsNumber()
	lastSyncTimestamp?: number;
}

export class SyncStatusResponse {
	status: 'synced' | 'pending' | 'error';
	pendingEvents: number;
	lastSync: number | null;
	cloudConnected: boolean;
	localAttendees: number;
	localExperiences: number;
}

