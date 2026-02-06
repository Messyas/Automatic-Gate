import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { CarDto } from './dto/car.dto';
import { CreateCarDto } from './dto/create-car.dto';
import { PaginatedCarsDto } from './dto/paginated-cars.dto';
import { ReviewQueryDto } from './dto/review-query.dto';
import { Car, CarReviewStatus } from './entities/car.entity';
import { CarsService } from './cars.service';

@Controller('cars')
export class CarsController {
  constructor(private readonly carsService: CarsService) {}

  @Post('detect')
  @HttpCode(HttpStatus.OK)
  async detect(@Body() dto: CreateCarDto): Promise<{
    allowed: boolean;
    status: CarReviewStatus;
    message: string;
    car: CarDto;
  }> {
    const result = await this.carsService.detectAtGate(dto);
    return {
      allowed: result.allowed,
      status: result.status,
      message: result.message,
      car: this.toDto(result.car),
    };
  }

  @Get('review')
  async listReview(@Query() query: ReviewQueryDto): Promise<PaginatedCarsDto> {
    const result = await this.carsService.findReviewQueue(query);
    return {
      data: result.data.map((car) => this.toDto(car)),
      meta: result.meta,
    };
  }

  @Post(':plate/approve')
  @HttpCode(HttpStatus.OK)
  async approve(@Param('plate') plate: string): Promise<{
    allowed: boolean;
    status: CarReviewStatus;
    message: string;
    car: CarDto;
  }> {
    const car = await this.carsService.approveByPlate(plate);
    return {
      allowed: true,
      status: car.reviewStatus,
      message: `Placa ${car.plate} cadastrada e liberada para entrada.`,
      car: this.toDto(car),
    };
  }

  @Post(':plate/reject')
  @HttpCode(HttpStatus.OK)
  async reject(@Param('plate') plate: string): Promise<{
    allowed: boolean;
    status: CarReviewStatus;
    message: string;
    car: CarDto;
  }> {
    const car = await this.carsService.rejectByPlate(plate);
    return {
      allowed: false,
      status: car.reviewStatus,
      message: `Placa ${car.plate} recusada na portaria.`,
      car: this.toDto(car),
    };
  }

  @Get(':plate')
  async getByPlate(@Param('plate') plate: string): Promise<CarDto> {
    const car = await this.carsService.findByPlate(plate);
    return this.toDto(car);
  }

  @Post(':plate/release')
  @HttpCode(HttpStatus.OK)
  async release(@Param('plate') plate: string): Promise<{ allowed: boolean }> {
    await this.carsService.releaseByPlate(plate);
    return { allowed: true };
  }

  @Get()
  async listAll(): Promise<CarDto[]> {
    const cars = await this.carsService.findAll();
    return cars.map((car) => this.toDto(car));
  }

  private toDto(car: Car): CarDto {
    return {
      id: car.id,
      plate: car.plate,
      trackId: car.trackId,
      registered: car.registered,
      released: car.released,
      reviewStatus: car.reviewStatus,
      createdAt: car.createdAt,
      updatedAt: car.updatedAt,
    };
  }
}
