import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  HttpCode,
  HttpStatus,
  NotFoundException,
} from '@nestjs/common';
import { CarsService } from './cars.service';
import { CreateCarDto } from './dto/create-car.dto';
import { CarDto } from './dto/car.dto';

@Controller('cars')
export class CarsController {
  constructor(private readonly carsService: CarsService) {}

  // 1) Detecção / registro
  @Post('detect')
  @HttpCode(HttpStatus.OK)
  async detect(@Body() dto: CreateCarDto): Promise<{ message: string }> {
    const { plate } = dto;
    let message: string;

    try {
      await this.carsService.findByPlate(plate);
      message = `Placa ${plate} já cadastrada`;
    } catch (err) {
      if (err instanceof NotFoundException) {
        await this.carsService.create(dto);
        message = `Placa ${plate} cadastrada com sucesso`;
      } else {
        throw err;
      }
    }

    return { message };
  }

  // 2) Consulta por placa
  @Get(':plate')
  async getByPlate(@Param('plate') plate: string): Promise<CarDto> {
    const car = await this.carsService.findByPlate(plate);
    return {
      id: car.id,
      plate: car.plate,
      trackId: car.trackId,
      registered: car.registered,
      createdAt: car.createdAt,
      updatedAt: car.updatedAt,
    };
  }

  // 3) Liberação
  @Post(':plate/release')
  @HttpCode(HttpStatus.OK)
  async release(@Param('plate') plate: string): Promise<{ allowed: boolean }> {
    await this.carsService.releaseByPlate(plate);
    return { allowed: true };
  }

  // 4) Listar todos os veículos
  @Get()
  async listAll(): Promise<CarDto[]> {
    const cars = await this.carsService.findAll();
    return cars.map((car) => ({
      id: car.id,
      plate: car.plate,
      trackId: car.trackId,
      registered: car.registered,
      createdAt: car.createdAt,
      updatedAt: car.updatedAt,
    }));
  }
}
