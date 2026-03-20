// src/weather/dto/weather-response.dto.ts
export class WeatherResponseDto {
  city: string;
  temperature: number;
  condition: string;
  humidity: number;
  feelsLike: number;
  fetchedAt: string;
}
