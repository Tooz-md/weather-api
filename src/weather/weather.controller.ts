// src/weather/weather.controller.ts
import { Controller, Get, Param } from '@nestjs/common';
import { WeatherService } from './weather.service';
import { WeatherResponseDto } from './dto/weather-response.dto';

@Controller('weather')
export class WeatherController {
  constructor(private readonly weatherService: WeatherService) {}

  @Get(':city')
  getWeather(@Param('city') city: string): Promise<WeatherResponseDto> {
    return this.weatherService.getWeather(city);
  }
}
