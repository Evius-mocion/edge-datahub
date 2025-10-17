import { Entity, Column, PrimaryColumn, CreateDateColumn, Generated } from 'typeorm';

@Entity('edge_experience_play_data')
export class EdgExperiencePlayData {
	@PrimaryColumn({ type: 'uuid' })
	@Generated('uuid')
	id: string;

	@Column({ type: 'uuid' })
	eventExperienceId: string;

	@Column({ type: 'uuid' , nullable: false })
	eventId: string;
	
	@Column({ type: 'uuid' , nullable: false })
	attendeeId: string;

	@Column({ type: 'timestamp', nullable: false })
	play_timestamp: Date;

	@Column({ type: 'json', nullable: true })
	data: any;

	@CreateDateColumn({ type: 'timestamp' })
	created_at: Date;

	@Column({ type: 'float', nullable: true, default: 0 })
	score: number;

	@Column({ type: 'float', nullable: true, default: 0 })
	bonusScore: number;

	@Column({ type: 'boolean', nullable: false, default: false })
	sync: boolean;

	@CreateDateColumn({ type: 'timestamp' })
	createAt: Date;
	
	@Column({ type: 'timestamp', nullable: true })
	lastSyncedAt: Date;
}

