import { DynamicField, EventAccessType, EventType, IDates } from 'src/types/event.type';
import { Entity, Column, PrimaryColumn, CreateDateColumn, UpdateDateColumn, DeleteDateColumn } from 'typeorm';

@Entity('edge_events')
export class EdgeEvent {
	@PrimaryColumn({ type: 'uuid' })
	id: string;

	@Column({ nullable: false })
	name: string;

	@Column({ type: 'text', nullable: true })
	description: string;

	@Column({ nullable: false, default: EventType.ONLINE, enum: EventType })
	type: EventType;

	@Column({
		nullable: true,
		default: EventAccessType.FREE_BY_REGISTER,
		enum: EventAccessType,
	})
	accessType: EventAccessType;

	@Column({ nullable: false, type: 'jsonb' })
	dates: IDates[];

	@Column({ nullable: false })
	initialDate: Date;

	@Column({ nullable: false })
	finishDate: Date;

	@Column({ type: 'jsonb', nullable: true })
	styles: Record<string, any>;

	@Column({ default: true })
	active: boolean;

	@Column({ nullable: false, type: 'jsonb', default: [] })
	registrationFields?: DynamicField[];

	@Column({ type: 'uuid', nullable: true })
	originalId: string;

	@Column({ type: 'boolean', nullable: false, default: false })
	sync: boolean;

	@Column({ type: 'timestamp', nullable: true })
	lastSyncedAt: Date;

	@CreateDateColumn({ nullable: false, default: new Date() })
	createAt: Date;

	@UpdateDateColumn({ nullable: false, default: new Date() })
	updatedAt: Date;

	@DeleteDateColumn()
	deletedAt: Date;
}
