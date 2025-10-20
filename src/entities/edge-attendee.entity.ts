import { CheckInType } from 'src/types/attendee.type';
import { Entity, Column, PrimaryColumn, CreateDateColumn, UpdateDateColumn, Generated } from 'typeorm';

@Entity('edge_attendees')
export class EdgeAttendee {
	@PrimaryColumn({ type: 'uuid' })
	@Generated('uuid')
	id: string;

	@Column({ type: 'uuid', nullable: true })
	userId: string;

	@Column({ type: 'uuid' })
	eventId: string;

	@Column({
		type: 'enum',
		enum: CheckInType,
		nullable: true,
		default: CheckInType.STATION
	})
	origin: CheckInType;


	@Column({
		type: 'enum',
		enum: CheckInType,
		nullable: true,
		default: CheckInType.STATION
	})
	checkInType: CheckInType; 

	@Column({ nullable: false })
	fullName: string;

	@Column({ nullable: false, unique: true })
	email: string;
	
	@Column({ nullable: true })
	code: string;

	@Column({ nullable: true })
	country: string;

	@Column({ nullable: true })
	city: string;

	@Column({ nullable: true })
	plataform: string;

	@Column({ nullable: true })
	browser: string;

	

	@Column({ type: 'timestamptz', nullable: true })
	checkInAt: Date | null; 

	@Column({ type: 'jsonb', nullable: true })
	properties: Record<string, any>;

	@Column({ type: 'uuid', nullable: true })
	originalId: string;
	
	@Column({ type: 'boolean', nullable: false, default: false })
	sync: boolean;

	@CreateDateColumn({ type: 'timestamp' })
	createAt: Date;

	@UpdateDateColumn({ type: 'timestamp' })
	updatedAt: Date;

	@Column({ type: 'timestamptz', nullable: true })
	lastSyncedAt: Date;

}

