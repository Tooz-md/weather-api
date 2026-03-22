import { Controller, Get, Param } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { WeatherService } from './weather.service';
import { WeatherResponseDto } from './dto/weather-response.dto';

@ApiTags('weather')
@Controller('weather')
export class WeatherController {
  constructor(private readonly weatherService: WeatherService) {}

  @Get(':city')
  @ApiOperation({ summary: 'Get current weather for a city' })
  @ApiParam({ name: 'city', example: 'london' })
  @ApiResponse({ status: 200, type: WeatherResponseDto })
  @ApiResponse({ status: 400, description: 'City name too short' })
  @ApiResponse({ status: 404, description: 'City not found' })
  @ApiResponse({ status: 429, description: 'Too many requests' })
  @ApiResponse({ status: 503, description: 'Weather service unavailable' })
  getWeather(@Param('city') city: string): Promise<WeatherResponseDto> {
    return this.weatherService.getWeather(city);
  }
}
