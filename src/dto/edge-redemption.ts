import { IsNumber, IsOptional, IsString } from "class-validator";

export class RedeptionsPointsDto {
    @IsString()
    reason: string;

    @IsNumber()
    pointsRedeemed: number;

    @IsString()
    eventId: string;

    @IsString()
    attendeeId: string;

}

export class AttendeeStatusDto {
    @IsString()
    @IsOptional()
    email?: string;

    @IsOptional()
    @IsString()
    code?: string;

    @IsOptional()
    @IsString()
    attendeeId?: string;

}