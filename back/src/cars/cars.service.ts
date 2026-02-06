import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PaginatedCarsDto } from './dto/paginated-cars.dto';
import { CreateCarDto } from './dto/create-car.dto';
import { ReviewQueryDto } from './dto/review-query.dto';
import { Car, CarReviewStatus } from './entities/car.entity';

@Injectable()
export class CarsService {
  constructor(
    @InjectRepository(Car)
    private readonly carsRepo: Repository<Car>,
  ) {}

  async findByPlate(plate: string): Promise<Car> {
    const car = await this.carsRepo.findOne({ where: { plate } });
    if (!car) {
      throw new NotFoundException(`Placa ${plate} nao encontrada.`);
    }
    return car;
  }

  async createApproved(dto: CreateCarDto): Promise<Car> {
    const exists = await this.carsRepo.findOne({ where: { plate: dto.plate } });
    if (exists) {
      throw new ConflictException(`Placa ${dto.plate} ja cadastrada.`);
    }

    const car = this.carsRepo.create({
      ...dto,
      registered: true,
      released: true,
      reviewStatus: CarReviewStatus.APPROVED,
    });

    return this.carsRepo.save(car);
  }

  async createPendingReview(dto: CreateCarDto): Promise<Car> {
    const exists = await this.carsRepo.findOne({ where: { plate: dto.plate } });
    if (exists) {
      throw new ConflictException(`Placa ${dto.plate} ja cadastrada.`);
    }

    const car = this.carsRepo.create({
      ...dto,
      registered: false,
      released: false,
      reviewStatus: CarReviewStatus.PENDING_REVIEW,
    });

    return this.carsRepo.save(car);
  }

  async detectAtGate(dto: CreateCarDto): Promise<{
    allowed: boolean;
    status: CarReviewStatus;
    message: string;
    car: Car;
  }> {
    const existing = await this.carsRepo.findOne({ where: { plate: dto.plate } });

    if (!existing) {
      const car = await this.createPendingReview(dto);
      return {
        allowed: false,
        status: car.reviewStatus,
        message: `Placa ${dto.plate} bloqueada para revisao na portaria.`,
        car,
      };
    }

    existing.trackId = dto.trackId;
    if (
      existing.registered &&
      existing.reviewStatus !== CarReviewStatus.REJECTED
    ) {
      existing.reviewStatus = CarReviewStatus.APPROVED;
    }

    if (existing.reviewStatus === CarReviewStatus.APPROVED) {
      existing.registered = true;
      const saved = await this.carsRepo.save(existing);
      return {
        allowed: true,
        status: saved.reviewStatus,
        message: `Placa ${saved.plate} autorizada para entrada.`,
        car: saved,
      };
    }

    if (existing.reviewStatus === CarReviewStatus.REJECTED) {
      const saved = await this.carsRepo.save(existing);
      return {
        allowed: false,
        status: saved.reviewStatus,
        message: `Placa ${saved.plate} recusada pela portaria.`,
        car: saved,
      };
    }

    const saved = await this.carsRepo.save(existing);
    return {
      allowed: false,
      status: saved.reviewStatus,
      message: `Placa ${saved.plate} aguardando analise do operador.`,
      car: saved,
    };
  }

  async findAll(): Promise<Car[]> {
    return this.carsRepo.find({
      order: { createdAt: 'DESC' },
    });
  }

  async findReviewQueue(query: ReviewQueryDto): Promise<PaginatedCarsDto> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const status = query.status ?? 'pending';

    const qb = this.carsRepo
      .createQueryBuilder('car')
      .orderBy('car.createdAt', 'DESC');

    if (status === 'pending') {
      qb.where('car.reviewStatus = :status', {
        status: CarReviewStatus.PENDING_REVIEW,
      });
    } else if (status === 'rejected') {
      qb.where('car.reviewStatus = :status', {
        status: CarReviewStatus.REJECTED,
      });
    } else {
      qb.where('car.reviewStatus IN (:...status)', {
        status: [CarReviewStatus.PENDING_REVIEW, CarReviewStatus.REJECTED],
      });
    }

    qb.skip((page - 1) * limit).take(limit);

    const [data, total] = await qb.getManyAndCount();
    const totalPages = Math.max(1, Math.ceil(total / limit));

    return {
      data,
      meta: {
        page,
        limit,
        total,
        totalPages,
        hasPrev: page > 1,
        hasNext: page < totalPages,
      },
    };
  }

  async releaseByPlate(plate: string): Promise<Car> {
    const car = await this.carsRepo.findOneByOrFail({ plate });
    car.released = true;
    car.registered = true;
    car.reviewStatus = CarReviewStatus.APPROVED;
    return this.carsRepo.save(car);
  }

  async approveByPlate(plate: string): Promise<Car> {
    const car = await this.carsRepo.findOneByOrFail({ plate });
    car.registered = true;
    car.released = true;
    car.reviewStatus = CarReviewStatus.APPROVED;
    return this.carsRepo.save(car);
  }

  async rejectByPlate(plate: string): Promise<Car> {
    const car = await this.carsRepo.findOneByOrFail({ plate });
    car.registered = false;
    car.released = false;
    car.reviewStatus = CarReviewStatus.REJECTED;
    return this.carsRepo.save(car);
  }
}
