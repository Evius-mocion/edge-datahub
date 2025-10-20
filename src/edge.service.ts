import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, MoreThan, Not, Repository } from 'typeorm';
import { EdgeAttendee } from './entities/edge-attendee.entity';
import { EdgeEvent } from './entities/edge-event.entity';
import { EdgeEventExperience } from './entities/edge-experience.entity';
import { EdgExperiencePlayData } from './entities/edge-experience-play-data';
import { EdgePointsRedemption } from './entities/edge-points-redemption';
import { AttendeeRegisterPayload } from './dto/edge-event.dto';
import { generate_code_by_email } from './common/utils';
import { ExperiencePlayPayload } from './dto/edge-experience.dto';
import { AttendeeStatusDto, RedeptionsPointsDto } from './dto/edge-redemption';
import { CheckInType } from './types/attendee.type';

@Injectable()
export class EdgeService {
  private readonly logger = new Logger(EdgeService.name);

  constructor(
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
  ) {
  }

  async registerAttendee(dto: AttendeeRegisterPayload): Promise<any> {
    const { eventId, fullName, email, country, city, properties } = dto;

    const event = await this.eventRepo.findOne({ where: { id: eventId } });
    if (!event) {
       throw new NotFoundException(`Event with ID ${dto.eventId} not found.`);
    }

    const attendeExiste = await this.attendeeRepo.findOne({ where: { eventId, email } })

    if (attendeExiste) {
      return { message: 'Attendee already registered', attendee: attendeExiste };
    }
    
    const newAttendee = this.attendeeRepo.create({
      eventId,
      fullName,
      email,
      sync: false,
      origin: CheckInType.STATION,
      checkInAt : new Date().toISOString(),
      checkInType: CheckInType.STATION,
      country,
      city,
      properties,
      code: generate_code_by_email(email),
    });

    const attendee = await this.attendeeRepo.save(newAttendee);

    return { message: 'Attendee registered successfully', attendee: attendee };
  }

  async findAttendeeByCode(code: string) {
      const attendeExiste = await this.attendeeRepo.findOneBy({ code })
    if (!attendeExiste) {
      throw new NotFoundException(`Attendee with code ${code} not found.`);
    }

    return { message: 'Attendee found', attendee: attendeExiste };
  }

  async logExperiencePlay(dto: ExperiencePlayPayload): Promise<{ message: string; play: any }> {
  const {
    eventExperienceId,
    attendeeId,
    play_timestamp,
    data,
    bonusScore,
    score,
  } = dto;

  // Buscar experiencia y asistente en paralelo
  const [eventExperience, attendee] = await Promise.all([
    this.experienceRepo.findOne({ where: { id: eventExperienceId } }),
    this.attendeeRepo.findOne({ where: { id: attendeeId } }),
  ]);

  if (!eventExperience) {
    throw new NotFoundException(`Event Experience with ID ${eventExperienceId} not found.`);
  }

  if (!attendee || attendee.eventId !== eventExperience.eventId) {
    throw new NotFoundException(
      `Attendee with ID ${attendeeId} not found for event ${eventExperience.eventId}.`,
    );
  }

  // Buscar si ya jugó
  const existingPlay = await this.experiencePlayData.findOne({
    where: { eventExperienceId, attendeeId, eventId: eventExperience.eventId,
      score : MoreThan(0)
    },
  });
  
  if (existingPlay) {
       // Crear nuevo registro si no existe
      const newPlaywithoutScore = this.experiencePlayData.create({
        eventExperienceId,
        attendeeId,
        play_timestamp: new Date(play_timestamp),
        data,
        bonusScore,
        created_at: new Date(),
        score : 0,
        sync: false,
        eventId: eventExperience.eventId,
      });

      const savedPlay = await this.experiencePlayData.save(newPlaywithoutScore);

      return { message: 'Experience play updated successfully', play: savedPlay };
    
  }

  // Crear nuevo registro si no existe
  const newPlay = this.experiencePlayData.create({
    eventExperienceId,
    attendeeId,
    play_timestamp: new Date(play_timestamp),
    data,
    bonusScore,
    created_at: new Date(),
    score,
    sync: false,
    eventId: eventExperience.eventId,
  });

  const savedPlay = await this.experiencePlayData.save(newPlay);

  return { message: 'Experience play logged successfully', play: savedPlay };
  }

  async redeemPoints(
  dto: RedeptionsPointsDto,
): Promise<{ message: string; redemption: any }> {
  const { eventId, attendeeId, pointsRedeemed, reason } = dto;

  // Buscar evento y asistente en paralelo
  const [event, attendee] = await Promise.all([
    this.eventRepo.findOne({ where: { id: eventId } }),
    this.attendeeRepo.findOne({ where: { id: attendeeId, eventId } }),
  ]);

  if (!event) {
    throw new NotFoundException(`Event with ID ${eventId} not found.`);
  }

  if (!attendee) {
    throw new NotFoundException(
      `Attendee with ID ${attendeeId} not found for event ${eventId}.`,
    );
  }

  // Verificar si ya redimió
  const existingRedemption = await this.pointsRedemptionRepo.findOne({
    where: { eventId, attendeeId },
  });

  if (existingRedemption) {
    return {
      message: 'Points already redeemed for this attendee and event',
      redemption: existingRedemption,
    };
  }


   const totalPoints = await this.get_total_points_user(attendee.id, attendee.eventId)

  if (pointsRedeemed > totalPoints) {
     throw new BadRequestException(`Cannot redeem ${pointsRedeemed} points — you only have ${totalPoints} points`)
  }

  
  const redemption = this.pointsRedemptionRepo.create({
    eventId,
    attendeeId,
    pointsRedeemed,
    reason,
    redemptionDate: new Date(),
    sync: false,
  });

  await this.pointsRedemptionRepo.save(redemption);

  return { message: 'Points redeemed successfully', redemption };
  }

async attendeeStatus(
  dto: AttendeeStatusDto,
): Promise<{ message: string; status: any }> {
  const { attendeeId, code, email } = dto;


const whereClause =
  [{ id: attendeeId }, { code }, { email }]
    .find(condition => Object.values(condition)[0]) || null;


  if (!whereClause) {
    throw new BadRequestException('You must provide attendeeId, code, or email.');
  }

  const attendee = await this.attendeeRepo.findOne({ where: whereClause });

  if (!attendee) {
    throw new NotFoundException('Attendee not found.');
  }


  const  totalPoints = await this.get_total_points_user(attendee.id, attendee.eventId)

  const status = {
    id: attendee.id,
    eventId: attendee.eventId,
    fullName: attendee.fullName,
    email: attendee.email,
    checkInAt: attendee.checkInAt,
    totalPoints: Number(totalPoints) || 0,
  };

  return { message: 'Attendee status retrieved successfully', status };
}


  async get_total_points_user(attendee_id : string, event_id: string){
    const { totalPoints } =
    (await this.experiencePlayData
      .createQueryBuilder('play')
      .select('SUM(COALESCE(play.score, 0) + COALESCE(play.bonusScore, 0))', 'totalPoints')
      .where('play.attendeeId = :attendeeId', { attendeeId: attendee_id })
      .andWhere('play.eventId = :eventId', { eventId: event_id})
      .getRawOne()) || { totalPoints: 0 };
    return totalPoints
  }

}


