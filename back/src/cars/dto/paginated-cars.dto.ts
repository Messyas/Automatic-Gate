import { CarDto } from './car.dto';

export class PaginatedCarsDto {
  data: CarDto[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasPrev: boolean;
    hasNext: boolean;
  };
}
