// src/weather/weather.controller.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { WeatherController } from './weather.controller';
import { WeatherService } from './weather.service';

const mockWeatherService = {
  getWeather: jest.fn().mockResolvedValue({
    city: 'London, England',
    temperature: 14.2,
    feelsLike: 12.8,
    condition: 'Partially cloudy',
    humidity: 71,
    fetchedAt: '2026-03-22T14:00:00.000Z',
  }),
};

describe('WeatherController', () => {
  let controller: WeatherController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [WeatherController],
      // eslint-disable-next-line prettier/prettier
      providers: [
        { provide:WeatherService, useValue: mockWeatherService },
      ],
    }).compile();

    controller = module.get<WeatherController>(WeatherController);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('deve chamar o service com a cidade correta', async () => {
    await controller.getWeather('london');
    expect(mockWeatherService.getWeather).toHaveBeenCalledWith('london');
  });

  it('deve retornar o resultado do service', async () => {
    const result = await controller.getWeather('london');
    expect(result.city).toBe('London, England');
    expect(result.temperature).toBe(14.2);
  });
});
