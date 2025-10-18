import { Body, Injectable, Logger } from '@nestjs/common';
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
import { chunk } from 'lodash';
import { Cron, CronExpression } from '@nestjs/schedule';
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

  @Cron(CronExpression.EVERY_10_MINUTES)
  async handleHourlySync() {
    this.logger.log('⏰ Ejecutando sincronización automática...');
    // Aquí va tu lógica (puedes inyectar otros servicios/repos)
    const connected = await this.checkCloudConnection();

    if (connected) {
      this.logger.log(
        '☁️ Conexión establecida con la nube. Subiendo datos pendientes...',
      );
      await this.uploadDataTocloud();
    } else {
      this.logger.warn(
        '⚠️ No se pudo establecer conexión con la nube. Se reintentará en el próximo ciclo.',
      );
    }
  }

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

  async uploadDataTocloud() {
    const apiBase = process.env.API_BASE;
    if (!apiBase) {
      throw new Error('API_BASE not configured');
    }

    const token = process.env.TOKEN;
    const headers: Record<string, string> = {
      'content-type': 'application/json',
    };
    if (token) headers['authorization'] = `Bearer ${token}`;

    const event = await this.eventRepo.findOneBy({ sync: true });

    if (!event) {
      this.logger.error(`[UPLOAD - ERROR] not found event to sync`);
      return false;
    }

    this.logger.debug(`[UPLOAD] Starting sync for event: ${event?.id}`);
    this.logger.debug(`[UPLOAD] API_BASE: ${apiBase}`);

    try {
      await this.uploadAttendees(event?.id, apiBase, headers);
      await this.uploadPlayData(event?.id, apiBase, headers);
      await this.uploadRedemptions(event?.id, apiBase, headers);
      this.logger.log(`✅ Successfully synced event ${event?.id}`);
    } catch (error) {
      this.logger.error(`❌ Error syncing event ${event?.id}:`, error);
    }
  }

  private async uploadAttendees(
    eventId: string,
    apiBase: string,
    headers: Record<string, string>,
  ): Promise<void> {
    const url = `${apiBase}/attendee/massive_upload`;

    try {
      // 🔹 Buscar asistentes pendientes de sincronizar
      const attendeesToUpload = await this.attendeeRepo.find({
        where: { eventId, sync: false },
      });

      if (!attendeesToUpload.length) {
        this.logger.log(
          `✅[ATTENDEE] No hay asistentes pendientes para el evento ${eventId}`,
        );
        return;
      }

      this.logger.debug(
        `[ATTENDEE] Se van a subir ${attendeesToUpload.length} asistentes no sincronizados para el evento ${eventId}`,
      );

      // 🚀 Dividir en lotes de 1000
      const batches = chunk(attendeesToUpload, 1000);
      let batchNum = 1;

      for (const batch of batches) {
        this.logger.log(
          `🔹[ATTENDEE] Subiendo lote ${batchNum} de ${batches.length} (${batch.length} registros)...`,
        );

        try {
          // 🔸 1. Enviar lote a la API externa
          const { data } = await firstValueFrom(
            this.http
              .post(url, { attendees: batch, eventId }, { headers })
              .pipe(timeout(15000)),
          );
          // 🔸 2. Actualizar asistentes locales si la API responde correctamente
          const uploadedAttendees = data?.success || [];

          const updates = uploadedAttendees
            .map((uploaded) => {
              const local = batch.find((a) => a.email === uploaded.email);
              if (!local) return null;
              return {
                id: local.id, // ID local para que TypeORM sepa qué actualizar
                originalId: uploaded.id, // ID remoto
                userId: uploaded.userId,
                sync: true,
                lastSyncedAt: new Date(),
              };
            })
            .filter(Boolean); // quitar nulls si no se encontró

          // 🔹 Guardar cambios en la base local
          if (updates.length > 0) {
            await this.attendeeRepo.save(updates);
          }

          this.logger.log(
            `✅ [ATTENDEE] Lote ${batchNum} sincronizado correctamente`,
          );
        } catch (err) {
          this.logger.error(
            `❌ [ATTENDEE] Error al subir lote ${batchNum}:`,
            err,
          );
        }

        batchNum++;
      }

      this.logger.log(
        `✔️ [ATTENDEE] Proceso completado: ${attendeesToUpload.length} asistentes subidos para el evento ${eventId}`,
      );
    } catch (error) {
      this.logger.error(
        `❌  [ATTENDEE] Error general subiendo asistentes para ${eventId}:`,
        error,
      );
    }
  }

  private async uploadPlayData(
    eventId: string,
    apiBase: string,
    headers: Record<string, string>,
  ) {
    const url = `${apiBase}/experience-play-data/massive_upload`;

    try {
      // 🔹 Buscar registros pendientes de sincronizar
      const recordsToUpload = await this.experiencePlayData.find({
        where: { eventId, sync: false },
        relations: ['eventExperience', 'attendee'],
      });

      if (!recordsToUpload.length) {
        this.logger.log(
          `✅ [PLAY-DATA] No hay registros de play data pendientes para el evento ${eventId}`,
        );
        return;
      }

      this.logger.debug(
        `[PLAY-DATA] Se van a subir ${recordsToUpload.length} registros de play data para el evento ${eventId}`,
      );
      // 🚀 Dividir en lotes de 1000
      const batches = chunk(recordsToUpload, 1000);
      let batchNum = 1;

      for (const batch of batches) {
        this.logger.log(
          `🔹[PLAY-DATA] Subiendo lote ${batchNum} de ${batches.length} (${batch.length} registros)...`,
        );

        try {
          const payload = batch.map((record) => ({
            localId: record.id,
            eventExperienceId: record.eventExperienceId,
            eventId,
            experienceId: record.eventExperience.experienceId,
            attendeeId: record.attendee.originalId,
            play_timestamp: record.play_timestamp,
            data: record.data,
            score: record.score,
            bonusScore: record.bonusScore,
            created_at: record.created_at,
          }));

          // 🔸 Enviar lote al endpoint remoto
          const { data } = await firstValueFrom(
            this.http
              .post(url, { playData: payload, eventId }, { headers })
              .pipe(timeout(15000)),
          );

          // 🔹 La API debería devolver algo como: { success: true, playData: [{ id, attendeeId, ... }] }
          const uploadedRecords = data?.success || [];
          // 🔹 Preparar cambios para guardar en la base local
          const updates = uploadedRecords
            .map((uploaded) => {
              const local = batch.find((r) => r.id === uploaded.localId);
              if (!local) return null;
              return {
                id: local.id,
                sync: true,
                lastSyncedAt: new Date(),
              };
            })
            .filter(Boolean);

          if (updates.length > 0) {
            await this.experiencePlayData.save(updates);
          }

          this.logger.log(
            `✅[PLAY-DATA] Lote ${batchNum} sincronizado correctamente`,
          );
        } catch (err) {
          this.logger.error(
            `❌ [PLAY-DATA] Error al subir lote ${batchNum}:`,
            err,
          );
        }

        batchNum++;
      }

      this.logger.log(
        `✔️[PLAY-DATA]  Proceso completado: ${recordsToUpload.length} registros subidos para el evento ${eventId}`,
      );
    } catch (error) {
      this.logger.error(
        `❌[PLAY-DATA] Error general subiendo play data para el evento ${eventId}:`,
        error,
      );
    }
  }
  private async uploadRedemptions(
    eventId: string,
    apiBase: string,
    headers: Record<string, string>,
  ) {
    const url = `${apiBase}/points-redemption/massive_upload`;

    try {
      // 🔹 Buscar registros pendientes de sincronizar
      const recordsToUpload = await this.pointsRedemptionRepo.find({
        where: { eventId, sync: false },
        relations: ['attendee'],
      });

      if (!recordsToUpload.length) {
        this.logger.log(
          `✅ [REDEMPTIONS] No hay registros de redepmtion pendientes para el evento ${eventId}`,
        );
        return;
      }

      this.logger.debug(
        `[REDEMPTIONS] Se van a subir ${recordsToUpload.length} registros de redepmtion para el evento ${eventId}`,
      );
      // 🚀 Dividir en lotes de 1000
      const batches = chunk(recordsToUpload, 1000);
      let batchNum = 1;

      for (const batch of batches) {
        this.logger.log(
          `🔹[REDEMPTIONS]  Subiendo lote ${batchNum} de ${batches.length} (${batch.length} registros)...`,
        );

        try {
          const payload = batch.map((record) => ({
            attendeeEventId: eventId,
            attendeeUserId: record.attendee.userId,
            eventId,
            metadata: record.metadata,
            reason: record.reason,
            pointsRedeemed: record.pointsRedeemed,
            redemptionDate: record.redemptionDate,
            localId: record.id,
          }));

          // 🔸 Enviar lote al endpoint remoto
          const { data } = await firstValueFrom(
            this.http
              .post(url, { playData: payload, eventId }, { headers })
              .pipe(timeout(15000)),
          );

          console.log('data');
          // 🔹 La API debería devolver algo como: { success: true, playData: [{ id, attendeeId, ... }] }
          const uploadedRecords = data?.success || [];
          // 🔹 Preparar cambios para guardar en la base local
          const updates = uploadedRecords
            .map((uploaded) => {
              const local = batch.find((r) => r.id === uploaded.localId);
              if (!local) return null;
              return {
                id: local.id,
                sync: true,
                lastSyncedAt: new Date(),
              };
            })
            .filter(Boolean);

          if (updates.length > 0) {
            await this.pointsRedemptionRepo.save(updates);
          }

          this.logger.log(
            `✅ [REDEMPTIONS] Lote ${batchNum} sincronizado correctamente`,
          );
        } catch (err) {
          this.logger.error(
            `❌ [REDEMPTIONS] Error al subir lote ${batchNum}:`,
            err,
          );
        }

        batchNum++;
      }

      this.logger.log(
        `✔️[REDEMPTIONS]  Proceso completado: ${recordsToUpload.length} registros subidos para el evento ${eventId}`,
      );
    } catch (error) {
      this.logger.error(
        `❌ [REDEMPTIONS] Error general subiendo play data para el evento ${eventId}:`,
        error,
      );
    }
  }

  private async syncEventDetails(
    eventId: string,
    apiBase: string,
    headers: Record<string, string>,
  ): Promise<void> {
    const url = `${apiBase}/events/landing/${eventId}`;
    this.logger.debug(`[SYNC] Fetching event details from ${url}`);

    try {
      const { data } = await firstValueFrom(
        this.http.get(url, { headers }).pipe(timeout(5000)),
      );

      const eventData = data.event;
      const edgeEvent = this.eventRepo.create({
        id: eventData.id,
        name: eventData.name,
        description: eventData.description,
        type: eventData.type,
        accessType: eventData.accessType,
        dates: eventData.dates,
        initialDate: new Date(eventData.initialDate),
        finishDate: new Date(eventData.finishDate),
        active: eventData.active,
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

  private async syncAttendees(
    eventId: string,
    apiBase: string,
    headers: Record<string, string>,
  ): Promise<void> {
    const url = `${apiBase}/attendee/full/${eventId}`;
    try {
      const { data } = await firstValueFrom(
        this.http.get(url, { headers }).pipe(timeout(5000)),
      );

      const attendees = data.attendees || [];
      const attendeesToSave: EdgeAttendee[] = [];

      console.log('se van a procesar ->' + attendees.length + ' attendees');
      for (const attendee of attendees) {
        const edgeAttendee = this.attendeeRepo.create({
          originalId: attendee.id,
          eventId: eventId,
          userId: attendee.userId,
          fullName: attendee.fullName,
          email: attendee.email,
          country: attendee.country,
          checkInType: attendee.checkInType,
          origin: attendee.origin,
          city: attendee.city,
          checkInAt: attendee.checkInAt
            ? new Date(attendee.checkInAt).toISOString()
            : null,
          properties: attendee.properties ?? null,
          lastSyncedAt: new Date(),
          sync: true,
          code: generate_code_by_email(attendee.email),
        });

        attendeesToSave.push(edgeAttendee);
      }

      // 🚀 Procesar en lotes de 1000 filas
      const batches = chunk(attendeesToSave, 1000);
      let batchNum = 1;

      for (const batch of batches) {
        console.log(
          `🔹 Procesando lote ${batchNum++} de ${batches.length} (${batch.length} registros)`,
        );

        await this.attendeeRepo.upsert(batch, {
          conflictPaths: ['email'],
          skipUpdateIfNoValuesChanged: true,
        });
      }
      this.logger.log(
        `Synced ${attendees.length} attendees for event ${eventId}`,
      );
    } catch (error) {
      this.logger.error(`Error syncing attendees for event ${eventId}:`, error);
    }
  }

  private async syncExperiences(
    eventId: string,
    apiBase: string,
    headers: Record<string, string>,
  ): Promise<void> {
    const url = `${apiBase}/event-experience/by-event/${eventId}`;
    try {
      const { data } = await firstValueFrom(
        this.http.get(url, { headers }).pipe(timeout(5000)),
      );

      const experiences = data.eventExperiences || [];
      const experiencesToSave: EdgeEventExperience[] = [];
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

      this.logger.log(
        `Synced ${experiences.length} experiences for event ${eventId}`,
      );
    } catch (error) {
      this.logger.error(
        `Error syncing experiences for event ${eventId}:`,
        error,
      );
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
        this.http.get(url).pipe(
          timeout(3000),
          catchError(() => []),
        ),
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
