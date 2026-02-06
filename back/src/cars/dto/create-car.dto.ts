import { IsInt, IsString, Length, Min } from 'class-validator';

export class CreateCarDto {
  @IsInt()
  @Min(0)
  trackId: number;

  @IsString()
  @Length(7, 7, { message: 'A placa deve ter exatamente 7 caracteres.' })
  plate: string;
}
