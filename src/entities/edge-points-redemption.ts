import { Entity, Column, PrimaryColumn, CreateDateColumn, Generated } from 'typeorm';

@Entity('edge_points_redemption')
export class EdgePointsRedemption {
	@PrimaryColumn({ type: 'uuid' })
	@Generated('uuid')
	id: string;

	@Column({ type: 'uuid', nullable: false })
	eventId: string;

	@Column({ type: 'uuid', nullable: false })
	attendeeId: string;

	@Column({ type: 'float', nullable: false })
	pointsRedeemed: number;

	@Column({ type: 'varchar', length: 255, nullable: false })
	reason: string;

	@Column({ type: 'json', nullable: true })
	metadata: any;

	@Column({ type: 'timestamp', nullable: true })
	redemptionDate: Date;

	@Column({ type: 'boolean', nullable: false, default: false })
	sync: boolean;

	@CreateDateColumn({ type: 'timestamp' })
	createAt: Date;

	@Column({ type: 'timestamp', nullable: true })
	lastSyncedAt: Date;
}
