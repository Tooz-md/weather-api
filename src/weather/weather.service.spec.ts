import { Test, TestingModule } from '@nestjs/testing';
import { WeatherService } from './weather.service';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { REDIS_CLIENT } from '../redis/redis.module';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { of, throwError } from 'rxjs';
import { AxiosResponse } from 'axios';

// mocks — substituem as dependências reais nos testes
const mockHttpService = {
  get: jest.fn(),
};

const mockConfigService = {
  get: jest.fn().mockReturnValue('fake-api-key'),
};

const mockRedis = {
  get: jest.fn(),
  set: jest.fn(),
};

describe('WeatherService', () => {
  let service: WeatherService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WeatherService,
        { provide: HttpService, useValue: mockHttpService },
        { provide: ConfigService, useValue: mockConfigService },
        { provide: REDIS_CLIENT, useValue: mockRedis },
      ],
    }).compile();

    service = module.get<WeatherService>(WeatherService);

    // limpa os mocks antes de cada teste
    jest.clearAllMocks();
  });

  describe('getWeather', () => {
    it('deve lançar BadRequestException para cidade muito curta', async () => {
      await expect(service.getWeather('x')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('deve retornar dados do cache quando disponível', async () => {
      const cached = {
        city: 'London',
        temperature: 14,
        feelsLike: 12,
        condition: 'Cloudy',
        humidity: 70,
        fetchedAt: '2026-01-01T00:00:00.000Z',
      };

      mockRedis.get.mockResolvedValue(JSON.stringify(cached));

      const result = await service.getWeather('london');

      expect(result).toEqual(cached);
      expect(mockHttpService.get).not.toHaveBeenCalled(); // não chamou a API externa
    });

    it('deve buscar na API e salvar no cache quando cache miss', async () => {
      mockRedis.get.mockResolvedValue(null); // cache vazio

      const apiResponse: Partial<AxiosResponse> = {
        data: {
          resolvedAddress: 'London, England',
          currentConditions: {
            temp: 14.2,
            feelslike: 12.8,
            humidity: 71,
            conditions: 'Partially cloudy',
          },
        },
      };

      mockHttpService.get.mockReturnValue(of(apiResponse));
      mockRedis.set.mockResolvedValue('OK');

      const result = await service.getWeather('london');

      expect(result.city).toBe('London, England');
      expect(result.temperature).toBe(14.2);
      expect(mockRedis.set).toHaveBeenCalled(); // salvou no cache
    });

    it('deve lançar NotFoundException para cidade inválida', async () => {
      mockRedis.get.mockResolvedValue(null);

      mockHttpService.get.mockReturnValue(
        throwError(() => ({ response: { status: 400 } })),
      );

      await expect(service.getWeather('xyzabc')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
