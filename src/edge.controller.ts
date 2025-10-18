import { Body, Controller, Get, HttpCode, HttpStatus, Post, Query, Param } from '@nestjs/common';

import { EdgeService } from './edge.service';
import { EdgeSyncService } from './edge-sync.service';
import { SyncEventDto } from './dto/sync.dto';
import { AttendeeRegisterPayload } from './dto/edge-event.dto';
import { ExperiencePlayPayload } from './dto/edge-experience.dto';
import { AttendeeStatusDto, RedeptionsPointsDto } from './dto/edge-redemption';

@Controller('edge')
export class EdgeController {
  constructor(
    private readonly edgeService: EdgeService,
    private readonly syncService: EdgeSyncService,
  ) {}

  
  @Post('attendees/register')
  async registerAttendee(
   @Body() dto: AttendeeRegisterPayload
  ) {
    return this.edgeService.registerAttendee(dto);
  }

  @Get('attendees/:code')
  async findAttendeeByCode(
    @Param('code') code: string,
  ) {
    return this.edgeService.findAttendeeByCode(code);
  }

  @Post('experience')
  async logExperiencePlay(
    @Body() dto: ExperiencePlayPayload
  ) {
    return this.edgeService.logExperiencePlay(dto);
  }
  
  @Post('redemption')
  async redemptionPoints(
    @Body() dto: RedeptionsPointsDto
  ) {
    return this.edgeService.redeemPoints(dto);
  }

  @Post('attendees_status')
  async attendeeStatus(
    @Body() dto: AttendeeStatusDto
  ) {
    return this.edgeService.attendeeStatus(dto);
  }


  @Post('sync')
  @HttpCode(HttpStatus.ACCEPTED)
  async syncEvent(@Body() dto: SyncEventDto) {
    await this.syncService.syncEventFromCloud(dto.eventId);
    return { message: 'Sync initiated', eventId: dto.eventId };
  }
  
  @Post('upload')
  @HttpCode(HttpStatus.ACCEPTED)
  async uploadData() {
    await this.syncService.uploadDataTocloud();
    return { message: 'cloud Sync finished'};
  }

  @Get('health')
  async health() {
    const cloudConnected = await this.syncService.checkCloudConnection();
    return { 
      message: 'edge ok',
      cloudConnected,
      timestamp: new Date().toISOString()
    };
  }
}


