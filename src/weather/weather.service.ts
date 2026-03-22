// src/weather/weather.service.ts
import { Injectable, Inject } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
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
    const cacheKey = `weather:${city.toLowerCase()}`;

    // 1. tenta buscar do cache
    const cached = await this.redis.get(cacheKey);
    if (cached) {
      console.log(`[CACHE HIT] ${cacheKey}`);
      return JSON.parse(cached) as WeatherResponseDto;
    }

    // 2. cache miss — busca na API externa
    console.log(`[CACHE MISS] ${cacheKey}`);
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

    const result: WeatherResponseDto = {
      city: data.resolvedAddress,
      temperature: current.temp,
      feelsLike: current.feelslike,
      condition: current.conditions,
      humidity: current.humidity,
      fetchedAt: new Date().toISOString(),
    };

    // 3. salva no cache com TTL de 12h
    await this.redis.set(cacheKey, JSON.stringify(result), 'EX', CACHE_TTL);

    return result;
  }
}
