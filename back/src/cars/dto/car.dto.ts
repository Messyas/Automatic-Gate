import { CarReviewStatus } from '../entities/car.entity';

export class CarDto {
  id: number;
  plate: string;
  trackId: number;
  registered: boolean;
  released: boolean;
  reviewStatus: CarReviewStatus;
  createdAt: Date;
  updatedAt: Date;
}
