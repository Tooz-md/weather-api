import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { WeatherResponseDto } from './dto/weather-response.dto';

interface VisualCrossingData {
  resolvedAddress: string;
  currentConditions: {
    temp: number;
    feelslike: number;
    humidity: number;
    conditions: string;
  };
}

@Injectable()
export class WeatherService {
  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {}

  async getWeather(city: string): Promise<WeatherResponseDto> {
    const apiKey = this.configService.get<string>('VISUAL_CROSSING_API_KEY');

    const url = `https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline/${encodeURIComponent(city)}/today`;

    const { data } = await firstValueFrom(
      this.httpService.get<VisualCrossingData>(url, {
        params: {
          key: apiKey,
          unitGroup: 'metric',
          include: 'current',
          contentType: 'json',
        },
      }),
    );

    const current = data.currentConditions;

    return {
      city: data.resolvedAddress,
      temperature: current.temp,
      feelsLike: current.feelslike,
      condition: current.conditions,
      humidity: current.humidity,
      fetchedAt: new Date().toISOString(),
    };
  }
}
