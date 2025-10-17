export interface UserContext {
	id: string;
	type: typeAccount;
	rol?: UserRol;
	eventId?: string;
	isAdmin?: boolean;
	tokenVersion: number;
}

export type typeAccount = 'client' | 'attendee';

export type genderType = 'male' | 'female' | 'other';

export enum UserRol {
	SUPER_ADMIN = 'super_admin',
	ADMIN = 'admin',
	USER = 'user',
}
