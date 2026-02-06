import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Car } from './entities/car.entity';
import { CreateCarDto } from './dto/create-car.dto';

@Injectable()
export class CarsService {
  constructor(
    @InjectRepository(Car)
    private readonly carsRepo: Repository<Car>,
  ) {}

  async findByPlate(plate: string): Promise<Car> {
    const car = await this.carsRepo.findOne({ where: { plate } });
    if (!car) throw new NotFoundException(`Placa ${plate} não encontrada.`);
    return car;
  }

  async create(dto: CreateCarDto): Promise<Car> {
    const exists = await this.carsRepo.findOne({ where: { plate: dto.plate } });
    if (exists)
      throw new ConflictException(`Placa ${dto.plate} já cadastrada.`);
    const car = this.carsRepo.create({ ...dto, registered: true });
    return this.carsRepo.save(car);
  }

  async findAll(): Promise<Car[]> {
    return this.carsRepo.find();
  }

  /**
   * Marca o carro como “released” — dispara @UpdateDateColumn()
   */
  // src/cars/cars.service.ts
  async releaseByPlate(plate: string): Promise<Car> {
    const car = await this.carsRepo.findOneByOrFail({ plate });

    // Exemplo: defina um flag released = true  (se não existir ainda, crie a coluna)
    car.released = true;

    // Salvar fará o TypeORM atualizar updatedAt
    return this.carsRepo.save(car);
  }
}
