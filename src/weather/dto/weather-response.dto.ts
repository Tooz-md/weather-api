import { ApiProperty } from '@nestjs/swagger';

export class WeatherResponseDto {
  @ApiProperty({ example: 'London, England, United Kingdom' })
  city: string;

  @ApiProperty({ example: 14.2 })
  temperature: number;

  @ApiProperty({ example: 12.8 })
  feelsLike: number;

  @ApiProperty({ example: 'Partially cloudy' })
  condition: string;

  @ApiProperty({ example: 71 })
  humidity: number;

  @ApiProperty({ example: '2026-03-22T14:00:00.000Z' })
  fetchedAt: string;
}
