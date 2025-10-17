import { IsNotEmpty, IsNumber, IsObject, IsOptional, IsString } from "class-validator";

export class ExperiencePlayPayload {
    @IsString()
    @IsNotEmpty()
    eventExperienceId: string;

    @IsString()
    @IsOptional()
    attendeeId?: string;


    @IsString()
    play_timestamp: string;

    @IsObject()
    @IsOptional()
    data?: any;

    @IsNumber()
    score: number;

    @IsOptional()
    bonusScore?: number;

    @IsString()
    @IsOptional()
    modePoints?: 'firstTry' | 'betterTry';

}