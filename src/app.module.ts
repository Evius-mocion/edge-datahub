import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';
import { EdgeController } from './edge.controller';
import { EdgeService } from './edge.service';
import { EdgeSyncService } from './edge-sync.service';
import { EdgeAttendee } from './entities/edge-attendee.entity';
import { EdgeEvent } from './entities/edge-event.entity';
import { EdgeEventExperience } from './entities/edge-experience.entity';
import { EdgExperiencePlayData } from './entities/edge-experience-play-data';
import { EdgePointsRedemption } from './entities/edge-points-redemption';
import { ConfigModule } from "@nestjs/config";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    HttpModule.register({
      timeout: 5000,
      maxRedirects: 5,
    }),
    TypeOrmModule.forRootAsync({
      useFactory: () => {
        return {
          type: 'postgres',
          username: process.env.DATABASE_USER,
          password: process.env.DATABASE_PASSWORD,
          database: process.env.DATABASE,
          host: process.env.DATABASE_HOST,
          port: parseInt(process.env.DATABASE_PORT ?? ''),
          synchronize : true, 
          autoLoadEntities:true,
          logging: false,
          ssl: false,
          extra: {
            timezone: "utc",
          }
        } 
      },
    }),
    TypeOrmModule.forFeature([
      EdgeAttendee,
      EdgeEvent,
      EdgeEventExperience,
      EdgExperiencePlayData,
      EdgePointsRedemption
    ]),
  ],
  controllers: [EdgeController],
  providers: [EdgeService, EdgeSyncService],
  exports: [EdgeService, EdgeSyncService],
})
export class AppModule {}



