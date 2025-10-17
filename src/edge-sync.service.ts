import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EdgeAttendee } from './entities/edge-attendee.entity';
import { EdgeEvent } from './entities/edge-event.entity';
import { EdgeEventExperience } from './entities/edge-experience.entity';
import { EdgExperiencePlayData } from './entities/edge-experience-play-data';
import { firstValueFrom, timeout, catchError } from 'rxjs';
import { EdgePointsRedemption } from './entities/edge-points-redemption';
import { generate_code_by_email } from './common/utils';

@Injectable()
export class EdgeSyncService {
  private readonly logger = new Logger(EdgeSyncService.name);

  constructor(
    private readonly http: HttpService,
    @InjectRepository(EdgeAttendee)
    private readonly attendeeRepo: Repository<EdgeAttendee>,
    @InjectRepository(EdgeEvent)
    private readonly eventRepo: Repository<EdgeEvent>,
    @InjectRepository(EdgeEventExperience)
    private readonly experienceRepo: Repository<EdgeEventExperience>,
    @InjectRepository(EdgExperiencePlayData)
    private readonly experiencePlayData: Repository<EdgExperiencePlayData>,
    @InjectRepository(EdgePointsRedemption)
    private readonly pointsRedemptionRepo: Repository<EdgePointsRedemption>,
  ) {}

  /**
   * Sync event data from cloud to local edge database
   */
  async syncEventFromCloud(eventId: string): Promise<void> {
    const apiBase = process.env.API_BASE;
    if (!apiBase) {
      throw new Error('API_BASE not configured');
    }

    const token = process.env.TOKEN;
    const headers: Record<string, string> = {
      'content-type': 'application/json',
    };
    if (token) headers['authorization'] = `Bearer ${token}`;

    this.logger.debug(`[SYNC] Starting sync for event: ${eventId}`);
    this.logger.debug(`[SYNC] API_BASE: ${apiBase}`);

    try {
      await this.syncEventDetails(eventId, apiBase, headers);
      await this.syncAttendees(eventId, apiBase, headers);
      await this.syncExperiences(eventId, apiBase, headers);
     

      this.logger.log(`✅ Successfully synced event ${eventId}`);
    } catch (error) {
      this.logger.error(`❌ Error syncing event ${eventId}:`, error);
      throw error;
    }
  }

  private async syncEventDetails(eventId: string, apiBase: string, headers: Record<string, string>): Promise<void> {
    const url = `${apiBase}/events/landing/${eventId}`;
    this.logger.debug(`[SYNC] Fetching event details from ${url}`);

    try {
      const { data } = await firstValueFrom(
        this.http.get(url, { headers }).pipe(timeout(5000))
      );

      const eventData = data.event;
      const edgeEvent = this.eventRepo.create({
        id: eventData.id,
        name: eventData.name,
        description: eventData.description,
        type: eventData.type,
        accessType: eventData.accessType,
        dates: eventData.dates,
        initialDate:  new Date(eventData.initialDate),
        finishDate: new Date(eventData.finishDate),
        active: eventData.active ,
        registrationFields: eventData.registrationFields || [],
        sync: true,
        originalId: eventData.id,
        lastSyncedAt: new Date(),
      });

      await this.eventRepo.save(edgeEvent); 
      this.logger.log(`Synced event details for ${eventId}`);
    } catch (error) {
      this.logger.error(`Error syncing event details for ${eventId}:`, error);
    }
  }

  private async syncAttendees(eventId: string, apiBase: string, headers: Record<string, string>): Promise<void> {
    const url = `${apiBase}/attendee/all/${eventId}`;
    try {
      const { data } = await firstValueFrom(
        this.http.get(url, { headers }).pipe(timeout(5000))
      );

      const attendees = data.attendees || [];
    const atteendesToSave : EdgeAttendee[] = [];
    for (const attendee of attendees) {
        const edgeAttendee = this.attendeeRepo.create({
          originalId: attendee.id,
          userId: attendee.userId,
          eventId: eventId,
          fullName: attendee.fullName,
          email: attendee.email,
          country: attendee.country,
          city: attendee.city,
          checkInAt: attendee.checkInAt ? new Date(attendee.checkInAt).toISOString() : null,
          properties: attendee.properties,
          lastSyncedAt: new Date(),
          sync: true,
          code: generate_code_by_email(attendee.email),
        });
        atteendesToSave.push(edgeAttendee);
      } 
      await this.attendeeRepo.save(atteendesToSave);

      this.logger.log(`Synced ${attendees.length} attendees for event ${eventId}`);
    } catch (error) {
      this.logger.error(`Error syncing attendees for event ${eventId}:`, error);
    }
  }

  private async syncExperiences(eventId: string, apiBase: string, headers: Record<string, string>): Promise<void> {
    const url = `${apiBase}/event-experience/by-event/${eventId}`;
    try {
      const { data } = await firstValueFrom(
        this.http.get(url, { headers }).pipe(timeout(5000))
      );

      const experiences = data.eventExperiences || [];
      const experiencesToSave : EdgeEventExperience[] = [];
      for (const exp of experiences) {
        const edgeExperience = this.experienceRepo.create({
          id: exp.id,
          sync: true,
          eventId: exp.eventId,
          experienceId: exp.experienceId,
          location: exp.location,
          customName: exp.customName,
          experienceName: exp.experience?.name,
          active: exp.active !== false,
          customConfig: exp.customConfig,
          lastSyncedAt: new Date(),
        });
        experiencesToSave.push(edgeExperience);
      } 
      await this.experienceRepo.save(experiencesToSave);

      this.logger.log(`Synced ${experiences.length} experiences for event ${eventId}`);
    } catch (error) {
      this.logger.error(`Error syncing experiences for event ${eventId}:`, error);
    }
  }


  /**
   * Check if cloud is reachable
   */
  async checkCloudConnection(): Promise<boolean> {
    const apiBase = process.env.API_BASE;
    if (!apiBase) return false;

    const url = `${apiBase}/events/stats`;
    try {
	  console.log('Checking cloud connection to a', url);
      const res = await firstValueFrom(
        this.http.get(url).pipe(timeout(3000), catchError(() => []))
      );
      return !!res;
    } catch {
      return false;
    }
  }

  /**
   * Get sync status
   */
  async getSyncStatus(eventId?: string): Promise<any> {
    const cloudConnected = await this.checkCloudConnection();
    const localAttendees = eventId
      ? await this.attendeeRepo.count({ where: { eventId } })
      : await this.attendeeRepo.count();

    const localExperiences = eventId
      ? await this.experienceRepo.count({ where: { eventId } })
      : await this.experienceRepo.count();

    return {
      cloudConnected,
      localAttendees,
      localExperiences,
      eventId: eventId || 'all',
    };
  }

 
}
