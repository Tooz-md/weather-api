import {
  Injectable,
  Inject,
  NotFoundException,
  ServiceUnavailableException,
  BadRequestException,
} from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { AxiosError } from 'axios';
import Redis from 'ioredis';
import { REDIS_CLIENT } from '../redis/redis.module';
import { WeatherResponseDto } from './dto/weather-response.dto';

const CACHE_TTL = 60 * 60 * 12;

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
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
  ) {}

  async getWeather(city: string): Promise<WeatherResponseDto> {
    if (!city || city.trim().length < 2) {
      throw new BadRequestException('City name must be at least 2 characters');
    }

    const cacheKey = `weather:${city.toLowerCase()}`;

    const cached = await this.redis.get(cacheKey);
    if (cached) {
      console.log(`[CACHE HIT] ${cacheKey}`);
      return JSON.parse(cached) as WeatherResponseDto;
    }

    console.log(`[CACHE MISS] ${cacheKey}`);
    const apiKey = this.configService.get<string>('VISUAL_CROSSING_API_KEY');

    const url = `https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline/${encodeURIComponent(city)}/today`;

    try {
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

      const result: WeatherResponseDto = {
        city: data.resolvedAddress,
        temperature: current.temp,
        feelsLike: current.feelslike,
        condition: current.conditions,
        humidity: current.humidity,
        fetchedAt: new Date().toISOString(),
      };

      await this.redis.set(cacheKey, JSON.stringify(result), 'EX', CACHE_TTL);

      return result;
    } catch (error) {
      const axiosError = error as AxiosError;

      if (axiosError.response?.status === 400) {
        throw new NotFoundException(`City '${city}' not found`);
      }

      if (axiosError.response?.status === 401) {
        throw new ServiceUnavailableException('Invalid API key');
      }

      throw new ServiceUnavailableException('Weather service unavailable');
    }
  }
}
