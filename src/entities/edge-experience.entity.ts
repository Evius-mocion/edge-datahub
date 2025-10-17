import { Entity, Column, PrimaryColumn, CreateDateColumn } from 'typeorm';

@Entity('edge_event_experiences')
export class EdgeEventExperience {
	@PrimaryColumn({ type: 'uuid' })
	id: string;

	@Column({ type: 'uuid' })
	eventId: string;

	@Column({ type: 'uuid' })
	experienceId: string;

	@Column({ type: 'varchar', nullable: true })
	location: string;

	@Column({ type: 'varchar', nullable: true })
	customName: string;

	@Column({ type: 'varchar', nullable: true })
	experienceName: string;

	@Column({ type: 'boolean', default: true })
	active: boolean;

	@Column({ type: 'jsonb', nullable: true })
	customConfig: any;
	
	@Column({ type: 'boolean', nullable: false, default: false })
	sync: boolean;
	
	@CreateDateColumn({ type: 'timestamp' })
	created_at: Date;
	
	@Column({ type: 'timestamp', nullable: true })
	lastSyncedAt: Date;
}

