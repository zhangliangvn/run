// ============================================
// CẤU HÌNH VÀ CONSTANTS
// ============================================
const CONFIG = {
    WEATHER_API_KEY: 'a081a048aa37ae4fd7766c934e6ea158',
    WEATHER_BASE_URL: 'https://api.openweathermap.org/data/2.5',
    MARINE_API_URL: 'https://marine-api.open-meteo.com/v1/marine',
    FORECAST_API_URL: 'https://api.open-meteo.com/v1/forecast',
    CACHE_DURATION: 30 * 60 * 1000,
    DEFAULT_LOCATION: {
        lat: 16.0738,
        lon: 108.1477,
        name: 'Liên Chiểu, Đà Nẵng, VN'
    }
};

// ============================================
// DỮ LIỆU TRAINING
// ============================================
let trainingData = [];
let programInfo = {};

function loadTrainingData() {
    try {
        if (typeof TRAINING_CONFIG !== 'undefined') {
            programInfo = TRAINING_CONFIG.program;
            trainingData = TRAINING_CONFIG.workouts;
            console.log(`✅ Loaded ${trainingData.length} workouts for ${programInfo.name}`);
            return Promise.resolve(true);
        } else {
            throw new Error('TRAINING_CONFIG not found');
        }
    } catch (error) {
        console.error('Error loading training data:', error);
        console.log('Using fallback training data...');
        trainingData = getFallbackTrainingData();
        programInfo = {
            name: "Marathon Sub 4:30",
            target: "Sub 4 hours 30 minutes",
            description: "Chương trình tập luyện Marathon cho mục tiêu dưới 4:30"
        };
        return Promise.resolve(false);
    }
}

function getFallbackTrainingData() {
    return [
        {date:"26/09/2025",day:"Friday",workout:"Easy",distance:6,description:"6 km @6:30/km",notes:"Shake-out before weekend long run"},
        {date:"27/09/2025",day:"Saturday",workout:"Rest",distance:0,description:"Rest day",notes:""},
        {date:"28/09/2025",day:"Sunday",workout:"Long run",distance:20,description:"20 km @6:20–6:30/km",notes:"2 gels, salt GU 1 cap/45–60'"}
    ];
}

// ============================================
// WEATHER CACHE VÀ STATE MANAGEMENT
// ============================================
let weatherCache = {
    current: null,
    forecast: null,
    lastUpdate: null,
    location: null
};

let swimmingCache = {
    marine: null,
    weather: null,
    lastUpdate: null,
    location: null
};

// ============================================
// MODAL/POPUP CLASS
// ============================================
class WorkoutModal {
    constructor() {
        this.modal = null;
        this.createModal();
    }

    createModal() {
        // Tạo modal element
        const modalHTML = `
            <div class="modal-overlay" id="workoutModal">
                <div class="modal-content">
                    <div class="modal-header">
                        <div>
                            <div class="modal-title" id="modalTitle">Buổi tập</div>
                            <div class="modal-date" id="modalDate">Ngày</div>
                        </div>
                        <button class="modal-close" id="modalClose">&times;</button>
                    </div>
                    <div class="modal-body" id="modalBody">
                        <!-- Content will be inserted here -->
                    </div>
                </div>
            </div>
        `;

        // Thêm vào body
        const div = document.createElement('div');
        div.innerHTML = modalHTML;
        document.body.appendChild(div.firstElementChild);

        this.modal = document.getElementById('workoutModal');

        // Event listeners
        document.getElementById('modalClose').addEventListener('click', () => this.close());
        this.modal.addEventListener('click', (e) => {
            if (e.target === this.modal) {
                this.close();
            }
        });

        // ESC key to close
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.modal.classList.contains('active')) {
                this.close();
            }
        });
    }

    open(workout, date, weatherData) {
        const formatted = TrainingUtils.formatDate(date);
        const isToday = TrainingUtils.getToday().getTime() === date.getTime();
        const isRaceDay = workout.workout.toLowerCase().includes('race');

        // Set title and date
        document.getElementById('modalTitle').textContent = workout.workout;
        document.getElementById('modalDate').textContent = `${formatted.dayName}, ${formatted.dateStr}${isToday ? ' (Hôm nay)' : ''}`;

        // Build modal body content
        let bodyHTML = `
            <div class="modal-workout-main">
                <span class="modal-workout-type ${TrainingUtils.getWorkoutClass(workout.workout)}">${workout.workout}</span>
                <div class="modal-workout-distance">${workout.distance} km</div>
                <div class="modal-workout-description">${workout.description}</div>
            </div>
        `;

        // Add notes section if exists
        if (workout.notes) {
            bodyHTML += `
                <div class="modal-section">
                    <div class="modal-section-title">📝 Lưu ý quan trọng</div>
                    <div class="modal-section-content">${workout.notes}</div>
                </div>
            `;
        }

        // Add weather section
        if (weatherData) {
            const weatherHTML = this.buildWeatherSection(date, weatherData, isToday);
            if (weatherHTML) {
                bodyHTML += weatherHTML;
            }
        }

        // Race day special message
        if (isRaceDay) {
            bodyHTML += `
                <div class="modal-section">
                    <div class="modal-section-title">🏁 Ngày thi đấu</div>
                    <div class="modal-section-content" style="color: var(--warning); font-weight: 600;">
                        Đây là ngày marathon! Hãy chuẩn bị tinh thần, dinh dưỡng và sẵn sàng cho cuộc đua của bạn. 
                        Good luck! 🎉
                    </div>
                </div>
            `;
        }

        document.getElementById('modalBody').innerHTML = bodyHTML;

        // Show modal
        this.modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    buildWeatherSection(date, weatherData, isToday) {
        let weatherHTML = `
            <div class="modal-section">
                <div class="modal-section-title">🌤️ Thời tiết dự báo</div>
        `;

        if (isToday && weatherData.current) {
            const runningTimes = WeatherService.getCurrentRunningTimes(weatherData.current);
            if (runningTimes) {
                const morningTemp = Math.round(runningTimes.morning.main.temp);
                const eveningTemp = Math.round(runningTimes.evening.main.temp);
                const morningTempClass = WeatherService.getTemperatureColor(morningTemp);
                const eveningTempClass = WeatherService.getTemperatureColor(eveningTemp);
                const icon = WeatherService.getWeatherIcon(weatherData.current.weather[0].icon);

                weatherHTML += `
                    <div class="modal-weather-grid">
                        <div class="modal-weather-time">
                            <div class="modal-weather-label">🌅 Sáng sớm (4-6h)</div>
                            <div class="modal-weather-temp ${morningTempClass}">${morningTemp}°C</div>
                            <div class="modal-weather-icon">${icon}</div>
                            <div class="modal-weather-desc">${weatherData.current.weather[0].description}</div>
                        </div>
                        <div class="modal-weather-time">
                            <div class="modal-weather-label">🌆 Chiều muộn (17-18h)</div>
                            <div class="modal-weather-temp ${eveningTempClass}">${eveningTemp}°C</div>
                            <div class="modal-weather-icon">${icon}</div>
                            <div class="modal-weather-desc">${weatherData.current.weather[0].description}</div>
                        </div>
                    </div>
                    <div class="modal-weather-details">
                        <div class="modal-weather-item">
                            <span class="modal-weather-item-icon">💧</span>
                            <span>Độ ẩm: ${weatherData.current.main.humidity}%</span>
                        </div>
                        <div class="modal-weather-item">
                            <span class="modal-weather-item-icon">💨</span>
                            <span>Gió: ${Math.round(weatherData.current.wind.speed * 3.6)} km/h</span>
                        </div>
                        <div class="modal-weather-item">
                            <span class="modal-weather-item-icon">👁️</span>
                            <span>Tầm nhìn: ${Math.round(weatherData.current.visibility / 1000)} km</span>
                        </div>
                        <div class="modal-weather-item">
                            <span class="modal-weather-item-icon">🌡️</span>
                            <span>Cảm giác: ${Math.round(weatherData.current.main.feels_like)}°C</span>
                        </div>
                    </div>
                `;
            }
        } else if (weatherData.forecast) {
            const forecasts = WeatherService.getRunningTimeForecasts(weatherData.forecast, date);
            if (forecasts && (forecasts.morning || forecasts.evening)) {
                weatherHTML += `<div class="modal-weather-grid">`;

                if (forecasts.morning) {
                    const temp = Math.round(forecasts.morning.main.temp);
                    const tempClass = WeatherService.getTemperatureColor(temp);
                    const icon = WeatherService.getWeatherIcon(forecasts.morning.weather[0].icon);
                    weatherHTML += `
                        <div class="modal-weather-time">
                            <div class="modal-weather-label">🌅 Sáng sớm</div>
                            <div class="modal-weather-temp ${tempClass}">${temp}°C</div>
                            <div class="modal-weather-icon">${icon}</div>
                            <div class="modal-weather-desc">${forecasts.morning.weather[0].description}</div>
                        </div>
                    `;
                } else {
                    weatherHTML += `
                        <div class="modal-weather-time">
                            <div class="modal-weather-label">🌅 Sáng sớm</div>
                            <div class="modal-weather-desc">Chưa có dữ liệu</div>
                        </div>
                    `;
                }

                if (forecasts.evening) {
                    const temp = Math.round(forecasts.evening.main.temp);
                    const tempClass = WeatherService.getTemperatureColor(temp);
                    const icon = WeatherService.getWeatherIcon(forecasts.evening.weather[0].icon);
                    weatherHTML += `
                        <div class="modal-weather-time">
                            <div class="modal-weather-label">🌆 Chiều muộn</div>
                            <div class="modal-weather-temp ${tempClass}">${temp}°C</div>
                            <div class="modal-weather-icon">${icon}</div>
                            <div class="modal-weather-desc">${forecasts.evening.weather[0].description}</div>
                        </div>
                    `;
                } else {
                    weatherHTML += `
                        <div class="modal-weather-time">
                            <div class="modal-weather-label">🌆 Chiều muộn</div>
                            <div class="modal-weather-desc">Chưa có dữ liệu</div>
                        </div>
                    `;
                }

                weatherHTML += `</div>`;

                // Add detailed weather info if available
                const detailForecast = forecasts.morning || forecasts.evening;
                if (detailForecast) {
                    weatherHTML += `
                        <div class="modal-weather-details">
                            <div class="modal-weather-item">
                                <span class="modal-weather-item-icon">💧</span>
                                <span>Độ ẩm: ${detailForecast.main.humidity}%</span>
                            </div>
                            <div class="modal-weather-item">
                                <span class="modal-weather-item-icon">💨</span>
                                <span>Gió: ${Math.round(detailForecast.wind.speed * 3.6)} km/h</span>
                            </div>
                            <div class="modal-weather-item">
                                <span class="modal-weather-item-icon">👁️</span>
                                <span>Tầm nhìn: ${Math.round(detailForecast.visibility / 1000)} km</span>
                            </div>
                            <div class="modal-weather-item">
                                <span class="modal-weather-item-icon">🌡️</span>
                                <span>Cảm giác: ${Math.round(detailForecast.main.feels_like)}°C</span>
                            </div>
                        </div>
                    `;
                }
            }
        }

        weatherHTML += `</div>`;
        return weatherHTML;
    }

    close() {
        this.modal.classList.remove('active');
        document.body.style.overflow = '';
    }
}

// ============================================
// WEATHER FUNCTIONS
// ============================================
class WeatherService {
    static async getCurrentLocation() {
        return new Promise((resolve, reject) => {
            if (!navigator.geolocation) {
                console.log('Geolocation not supported, using default location');
                resolve({
                    lat: CONFIG.DEFAULT_LOCATION.lat,
                    lon: CONFIG.DEFAULT_LOCATION.lon,
                    isDefault: true
                });
                return;
            }
            
            navigator.geolocation.getCurrentPosition(
                position => {
                    resolve({
                        lat: position.coords.latitude,
                        lon: position.coords.longitude,
                        isDefault: false
                    });
                },
                error => {
                    console.log('Geolocation error, using default location:', error);
                    resolve({
                        lat: CONFIG.DEFAULT_LOCATION.lat,
                        lon: CONFIG.DEFAULT_LOCATION.lon,
                        isDefault: true
                    });
                },
                {
                    enableHighAccuracy: true,
                    timeout: 10000,
                    maximumAge: 300000
                }
            );
        });
    }

    static async fetchCurrentWeather(lat, lon) {
        const response = await fetch(
            `${CONFIG.WEATHER_BASE_URL}/weather?lat=${lat}&lon=${lon}&appid=${CONFIG.WEATHER_API_KEY}&units=metric&lang=vi`
        );
        
        if (!response.ok) {
            throw new Error(`Weather API error: ${response.status}`);
        }
        
        return await response.json();
    }

    static async fetchWeatherForecast(lat, lon) {
        const response = await fetch(
            `${CONFIG.WEATHER_BASE_URL}/forecast?lat=${lat}&lon=${lon}&appid=${CONFIG.WEATHER_API_KEY}&units=metric&lang=vi`
        );
        
        if (!response.ok) {
            throw new Error(`Weather API error: ${response.status}`);
        }
        
        return await response.json();
    }

    static async getLocationName(lat, lon) {
        try {
            const response = await fetch(
                `${CONFIG.WEATHER_BASE_URL}/weather?lat=${lat}&lon=${lon}&appid=${CONFIG.WEATHER_API_KEY}&units=metric&lang=vi`
            );
            const data = await response.json();
            return `${data.name}, ${data.sys.country}`;
        } catch (error) {
            return 'Vị trí hiện tại';
        }
    }

    static getTemperatureColor(temp) {
        if (temp >= 30) return 'temp-hot';
        if (temp >= 25) return 'temp-warm';
        if (temp >= 15) return 'temp-cool';
        return 'temp-cold';
    }

    static getWeatherIcon(weatherCode, isDay = true) {
        const icons = {
            '01d': '☀️', '01n': '🌙',
            '02d': '⛅', '02n': '☁️',
            '03d': '☁️', '03n': '☁️',
            '04d': '☁️', '04n': '☁️',
            '09d': '🌧️', '09n': '🌧️',
            '10d': '🌦️', '10n': '🌧️',
            '11d': '⛈️', '11n': '⛈️',
            '13d': '🌨️', '13n': '🌨️',
            '50d': '🌫️', '50n': '🌫️'
        };
        return icons[weatherCode] || '🌤️';
    }

    static async loadWeatherData() {
        const locationInfo = document.getElementById('locationInfo');
        
        try {
            const now = Date.now();
            if (weatherCache.current && weatherCache.forecast && 
                weatherCache.lastUpdate && 
                (now - weatherCache.lastUpdate) < CONFIG.CACHE_DURATION) {
                return weatherCache;
            }

            locationInfo.innerHTML = `
                <span class="mini-spinner"></span>
                <span>Đang xác định vị trí...</span>
            `;

            const location = await this.getCurrentLocation();
            
            locationInfo.innerHTML = `
                <span class="mini-spinner"></span>
                <span>Đang tải thời tiết...</span>
            `;

            let locationName;
            if (location.isDefault) {
                locationName = CONFIG.DEFAULT_LOCATION.name;
            } else {
                locationName = await this.getLocationName(location.lat, location.lon);
            }

            const [currentWeather, forecast] = await Promise.all([
                this.fetchCurrentWeather(location.lat, location.lon),
                this.fetchWeatherForecast(location.lat, location.lon)
            ]);

            weatherCache = {
                current: currentWeather,
                forecast: forecast,
                lastUpdate: now,
                location: { ...location, name: locationName }
            };

            const locationIcon = location.isDefault ? '📍' : '🎯';
            const locationText = location.isDefault ? `${locationIcon} ${locationName} (mặc định)` : `${locationIcon} ${locationName}`;
            
            locationInfo.innerHTML = locationText;

            return weatherCache;

        } catch (error) {
            console.error('Weather loading error:', error);
            
            try {
                locationInfo.innerHTML = `
                    <span class="mini-spinner"></span>
                    <span>Thử vị trí mặc định...</span>
                `;

                const [currentWeather, forecast] = await Promise.all([
                    this.fetchCurrentWeather(CONFIG.DEFAULT_LOCATION.lat, CONFIG.DEFAULT_LOCATION.lon),
                    this.fetchWeatherForecast(CONFIG.DEFAULT_LOCATION.lat, CONFIG.DEFAULT_LOCATION.lon)
                ]);

                weatherCache = {
                    current: currentWeather,
                    forecast: forecast,
                    lastUpdate: Date.now(),
                    location: { 
                        lat: CONFIG.DEFAULT_LOCATION.lat, 
                        lon: CONFIG.DEFAULT_LOCATION.lon, 
                        name: CONFIG.DEFAULT_LOCATION.name,
                        isDefault: true 
                    }
                };

                locationInfo.innerHTML = `📍 ${CONFIG.DEFAULT_LOCATION.name} (mặc định)`;
                return weatherCache;

            } catch (fallbackError) {
                console.error('Fallback weather loading error:', fallbackError);
                locationInfo.innerHTML = `⚠️ Không thể tải thời tiết`;
                return null;
            }
        }
    }

    static getRunningTimeForecasts(forecast, targetDate) {
        if (!forecast || !forecast.list) return null;
        
        const targetDateStr = targetDate.toISOString().split('T')[0];
        const dayForecasts = forecast.list.filter(item => {
            const itemDate = new Date(item.dt * 1000);
            const itemDateStr = itemDate.toISOString().split('T')[0];
            return itemDateStr === targetDateStr;
        });
        
        if (dayForecasts.length === 0) return null;
        
        const morningForecast = dayForecasts.find(item => {
            const hour = new Date(item.dt * 1000).getHours();
            return hour === 6;
        }) || dayForecasts.find(item => {
            const hour = new Date(item.dt * 1000).getHours();
            return hour >= 3 && hour <= 9;
        });
        
        const eveningForecast = dayForecasts.find(item => {
            const hour = new Date(item.dt * 1000).getHours();
            return hour === 18;
        }) || dayForecasts.find(item => {
            const hour = new Date(item.dt * 1000).getHours();
            return hour >= 15 && hour <= 21;
        });
        
        return {
            morning: morningForecast,
            evening: eveningForecast
        };
    }

    static getCurrentRunningTimes(currentWeather) {
        if (!currentWeather) return null;
        
        const now = new Date();
        const currentHour = now.getHours();
        const baseTemp = currentWeather.main.temp;
        
        let morningTemp, eveningTemp;
        
        if (currentHour >= 4 && currentHour <= 8) {
            morningTemp = baseTemp;
            eveningTemp = baseTemp + 4;
        } else if (currentHour >= 16 && currentHour <= 20) {
            morningTemp = baseTemp - 4;
            eveningTemp = baseTemp;
        } else if (currentHour >= 12 && currentHour <= 16) {
            morningTemp = baseTemp - 3;
            eveningTemp = baseTemp + 1;
        } else {
            morningTemp = baseTemp - 2;
            eveningTemp = baseTemp + 2;
        }
        
        return {
            morning: {
                ...currentWeather,
                main: {
                    ...currentWeather.main,
                    temp: morningTemp,
                    feels_like: morningTemp + (currentWeather.main.feels_like - currentWeather.main.temp)
                }
            },
            evening: {
                ...currentWeather,
                main: {
                    ...currentWeather.main,
                    temp: eveningTemp,
                    feels_like: eveningTemp + (currentWeather.main.feels_like - currentWeather.main.temp)
                }
            }
        };
    }
}

// ============================================
// SWIMMING WEATHER SERVICE (giữ nguyên code cũ)
// ============================================
class SwimmingService {
    static async fetchMarineData(lat, lon) {
        const response = await fetch(
            `${CONFIG.MARINE_API_URL}?latitude=${lat}&longitude=${lon}&hourly=wave_height,wave_direction,wave_period,wind_wave_height,wind_wave_direction,wind_wave_period,sea_surface_temperature&timezone=Asia/Ho_Chi_Minh&forecast_days=2`
        );
        
        if (!response.ok) {
            throw new Error(`Marine API error: ${response.status}`);
        }
        
        return await response.json();
    }

    static async fetchDetailedWeather(lat, lon) {
        const response = await fetch(
            `${CONFIG.FORECAST_API_URL}?latitude=${lat}&longitude=${lon}&hourly=temperature_2m,relative_humidity_2m,visibility,uv_index,wind_speed_10m,wind_direction_10m,weather_code,precipitation,precipitation_probability&timezone=Asia/Ho_Chi_Minh&forecast_days=2`
        );
        
        if (!response.ok) {
            throw new Error(`Forecast API error: ${response.status}`);
        }
        
        return await response.json();
    }

    static async loadSwimmingData() {
        try {
            const now = Date.now();
            if (swimmingCache.marine && swimmingCache.weather && 
                swimmingCache.lastUpdate && 
                (now - swimmingCache.lastUpdate) < CONFIG.CACHE_DURATION) {
                return swimmingCache;
            }

            let location;
            if (weatherCache.location) {
                location = weatherCache.location;
            } else {
                location = await WeatherService.getCurrentLocation();
                if (location.isDefault) {
                    location.name = CONFIG.DEFAULT_LOCATION.name;
                } else {
                    location.name = await WeatherService.getLocationName(location.lat, location.lon);
                }
            }

            const [marineData, weatherData] = await Promise.all([
                this.fetchMarineData(location.lat, location.lon),
                this.fetchDetailedWeather(location.lat, location.lon)
            ]);

            swimmingCache = {
                marine: marineData,
                weather: weatherData,
                lastUpdate: now,
                location: location,
                isRealMarine: true
            };

            return swimmingCache;

        } catch (error) {
            console.error('Swimming data loading error:', error);
            try {
                console.log('Trying fallback with wind-based marine data...');
                const location = weatherCache.location || {
                    lat: CONFIG.DEFAULT_LOCATION.lat,
                    lon: CONFIG.DEFAULT_LOCATION.lon,
                    name: CONFIG.DEFAULT_LOCATION.name,
                    isDefault: true
                };

                const weatherData = await this.fetchDetailedWeather(location.lat, location.lon);
                const marineData = this.createMarineFromWind(weatherData);

                return {
                    marine: marineData,
                    weather: weatherData,
                    lastUpdate: Date.now(),
                    location: location,
                    isWindBased: true
                };
            } catch (fallbackError) {
                return this.createEmergencyFallbackData();
            }
        }
    }

    static createMarineFromWind(weatherData) {
        const times = weatherData.hourly.time;
        const windSpeeds = weatherData.hourly.wind_speed_10m;
        const windDirections = weatherData.hourly.wind_direction_10m;
        
        const waveHeights = windSpeeds.map(windSpeed => {
            if (windSpeed <= 5) return 0.1 + (windSpeed / 5) * 0.1;
            else if (windSpeed <= 15) return 0.2 + ((windSpeed - 5) / 10) * 0.3;
            else if (windSpeed <= 25) return 0.5 + ((windSpeed - 15) / 10) * 0.5;
            else return Math.min(1.0 + (windSpeed - 25) * 0.05, 2.5);
        });

        const wavePeriods = windSpeeds.map(windSpeed => {
            return Math.max(2, Math.min(6, 2 + windSpeed * 0.1));
        });

        return {
            hourly: {
                time: times,
                wave_height: waveHeights,
                wave_direction: windDirections,
                wave_period: wavePeriods,
                wind_wave_height: waveHeights.map(h => h * 0.8),
                wind_wave_direction: windDirections,
                wind_wave_period: wavePeriods
            },
            isFromWind: true
        };
    }

    static createFallbackMarineData() {
        const hours = 48;
        const now = new Date();
        const times = [];
        const waveHeights = [];
        const waveDirections = [];
        const wavePeriods = [];

        for (let i = 0; i < hours; i++) {
            const time = new Date(now.getTime() + i * 60 * 60 * 1000);
            times.push(time.toISOString());
            waveHeights.push(0.1 + Math.random() * 0.4);
            waveDirections.push(Math.random() * 360);
            wavePeriods.push(2 + Math.random() * 3);
        }

        return {
            hourly: {
                time: times,
                wave_height: waveHeights,
                wave_direction: waveDirections,
                wave_period: wavePeriods,
                wind_wave_height: waveHeights.map(h => h * 0.8),
                wind_wave_direction: waveDirections,
                wind_wave_period: wavePeriods
            },
            isFallback: true
        };
    }

    static createEmergencyFallbackData() {
        const now = new Date();
        const hours = 12;
        const times = [];
        const temps = [];
        const windSpeeds = [];
        const visibilities = [];
        const uvIndices = [];

        for (let i = 0; i < hours; i++) {
            const time = new Date(now.getTime() + i * 60 * 60 * 1000);
            times.push(time.toISOString());
            
            const hour = time.getHours();
            const baseTemp = 25 + Math.sin((hour - 6) * Math.PI / 12) * 5;
            temps.push(baseTemp);
            windSpeeds.push(5 + Math.random() * 10);
            visibilities.push(8 + Math.random() * 12);
            uvIndices.push(hour >= 6 && hour <= 18 ? Math.max(0, (hour - 6) * 0.8) : 0);
        }

        const marineData = this.createFallbackMarineData();

        return {
            marine: marineData,
            weather: {
                hourly: {
                    time: times,
                    temperature_2m: temps,
                    relative_humidity_2m: Array(hours).fill(70),
                    visibility: visibilities.map(v => v * 1000),
                    uv_index: uvIndices,
                    wind_speed_10m: windSpeeds,
                    wind_direction_10m: Array(hours).fill(90),
                    weather_code: Array(hours).fill(1)
                }
            },
            lastUpdate: Date.now(),
            location: weatherCache.location || {
                lat: CONFIG.DEFAULT_LOCATION.lat,
                lon: CONFIG.DEFAULT_LOCATION.lon,
                name: CONFIG.DEFAULT_LOCATION.name,
                isDefault: true
            },
            isEmergencyFallback: true
        };
    }

    static getSwimmingCondition(waveHeight, windSpeed, visibility, uvIndex, precipitation, precipitationProb) {
        let score = 0;
        let issues = [];

        const precip = precipitation || 0;
        const prob = precipitationProb || 0;
        
        if (precip <= 0 && prob <= 10) {
            score += 50;
        } else if (precip <= 0.1 && prob <= 30) {
            score += 35;
            issues.push('Mưa rất nhẹ');
        } else if (precip <= 1 && prob <= 50) {
            score += 20;
            issues.push('Mưa nhẹ');
        } else if (precip <= 5 && prob <= 70) {
            score += 5;
            issues.push('Mưa vừa - không nên bơi');
        } else {
            score += 0;
            issues.push('Mưa to - rất nguy hiểm');
        }

        if (waveHeight <= 0.5) score += 20;
        else if (waveHeight <= 1.0) { score += 15; issues.push('Sóng nhẹ'); }
        else if (waveHeight <= 1.5) { score += 8; issues.push('Sóng trung bình'); }
        else { score += 0; issues.push('Sóng lớn'); }

        if (windSpeed <= 10) score += 15;
        else if (windSpeed <= 20) { score += 10; issues.push('Gió nhẹ'); }
        else if (windSpeed <= 30) { score += 5; issues.push('Gió mạnh'); }
        else { score += 0; issues.push('Gió rất mạnh'); }

        if (visibility >= 10) score += 10;
        else if (visibility >= 5) { score += 8; issues.push('Tầm nhìn hạn chế'); }
        else if (visibility >= 2) { score += 4; issues.push('Tầm nhìn kém'); }
        else { score += 0; issues.push('Tầm nhìn rất kém'); }

        if (uvIndex <= 2) score += 5;
        else if (uvIndex <= 5) { score += 4; issues.push('UV trung bình'); }
        else if (uvIndex <= 7) { score += 2; issues.push('UV cao'); }
        else { score += 0; issues.push('UV rất cao'); }

        let condition, recommendation, icon;
        if (score >= 90) {
            condition = 'excellent';
            recommendation = '🌊 Tuyệt vời cho bơi! Điều kiện lý tưởng.';
            icon = '🌊';
        } else if (score >= 75) {
            condition = 'good';
            recommendation = '👍 Tốt cho bơi. ' + (issues.length > 0 ? 'Lưu ý: ' + issues.join(', ') : '');
            icon = '✅';
        } else if (score >= 50) {
            condition = 'moderate';
            recommendation = '⚠️ Bơi cẩn thận. Vấn đề: ' + issues.join(', ');
            icon = '⚠️';
        } else {
            condition = 'poor';
            recommendation = '🚫 Không nên bơi. Nguy cơ: ' + issues.join(', ');
            icon = '❌';
        }

        return { condition, recommendation, icon, score, issues };
    }

    static getPrecipitationClass(precipitation) {
        const precip = precipitation || 0;
        if (precip <= 0) return 'precip-none';
        if (precip <= 0.5) return 'precip-light';
        if (precip <= 2) return 'precip-moderate';
        return 'precip-heavy';
    }

    static getPrecipitationIcon(precipitation, precipitationProb) {
        const precip = precipitation || 0;
        const prob = precipitationProb || 0;
        
        if (precip <= 0 && prob <= 10) return '☀️';
        if (precip <= 0.1) return '🌦️';
        if (precip <= 1) return '🌧️';
        return '⛈️';
    }

    static getPrecipitationDescription(precipitation, precipitationProb) {
        const precip = precipitation || 0;
        const prob = precipitationProb || 0;
        
        if (precip <= 0 && prob <= 10) return 'Không mưa';
        if (precip <= 0.1) return 'Mưa phùn nhẹ';
        if (precip <= 1) return 'Mưa nhẹ';
        if (precip <= 5) return 'Mưa vừa';
        return 'Mưa to';
    }

    static getWaveHeightClass(height) {
        if (height <= 0.5) return 'wave-height-0';
        if (height <= 1.0) return 'wave-height-1';
        if (height <= 1.5) return 'wave-height-2';
        return 'wave-height-3';
    }

    static getUVClass(uv) {
        if (uv <= 2) return 'uv-low';
        if (uv <= 5) return 'uv-moderate';
        if (uv <= 7) return 'uv-high';
        return 'uv-very-high';
    }

    static getVisibilityClass(visibility) {
        if (visibility >= 10) return 'visibility-excellent';
        if (visibility >= 5) return 'visibility-good';
        if (visibility >= 2) return 'visibility-moderate';
        return 'visibility-poor';
    }

    static getWindDirection(degrees) {
        const directions = ['B', 'ĐB', 'Đ', 'ĐN', 'N', 'TN', 'T', 'TB'];
        const index = Math.round(degrees / 45) % 8;
        return directions[index];
    }
}

// ============================================
// DATE & TRAINING UTILITIES
// ============================================
class TrainingUtils {
    static parseDate(dateStr) {
        const parts = dateStr.split('/');
        return new Date(parts[2], parts[1] - 1, parts[0]);
    }

    static getToday() {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return today;
    }

    static formatDate(date) {
        const days = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
        const months = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'];
        return {
            dayName: days[date.getDay()],
            dateStr: `${date.getDate()}/${months[date.getMonth()]}`
        };
    }

    static getWorkoutClass(workout) {
        const type = workout.toLowerCase();
        if (type.includes('easy')) return 'type-easy';
        if (type.includes('interval')) return 'type-interval';
        if (type.includes('tempo')) return 'type-tempo';
        if (type.includes('long')) return 'type-long';
        if (type.includes('core')) return 'type-core';
        if (type.includes('rest')) return 'type-rest';
        if (type.includes('race')) return 'type-interval';
        return 'type-easy';
    }

    static getTodayWorkout() {
        const today = this.getToday();
        return trainingData.find(workout => {
            const workoutDate = this.parseDate(workout.date);
            workoutDate.setHours(0, 0, 0, 0);
            return workoutDate.getTime() === today.getTime();
        });
    }

    static getWeekWorkouts() {
        const today = this.getToday();
        const weekWorkouts = [];
        
        for (let i = 0; i < 7; i++) {
            const date = new Date(today);
            date.setDate(today.getDate() + i);
            date.setHours(0, 0, 0, 0);
            
            const workout = trainingData.find(w => {
                const workoutDate = this.parseDate(w.date);
                workoutDate.setHours(0, 0, 0, 0);
                return workoutDate.getTime() === date.getTime();
            });
            
            weekWorkouts.push({
                date: date,
                isToday: i === 0,
                workout: workout
            });
        }
        
        return weekWorkouts;
    }

    static calculateStats() {
        const today = this.getToday();
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - today.getDay());
        weekStart.setHours(0, 0, 0, 0);
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        weekEnd.setHours(23, 59, 59, 999);
        
        const totalDistance = trainingData.reduce((sum, w) => sum + (w.distance || 0), 0);
        
        const weekDistance = trainingData
            .filter(w => {
                const date = this.parseDate(w.date);
                return date >= weekStart && date <= weekEnd;
            })
            .reduce((sum, w) => sum + (w.distance || 0), 0);
        
        const raceWorkout = trainingData.find(w => w.workout.toLowerCase().includes('race'));
        const raceDay = raceWorkout ? this.parseDate(raceWorkout.date) : this.parseDate('30/11/2025');
        const daysUntilRace = Math.ceil((raceDay - today) / (1000 * 60 * 60 * 24));
        
        const completed = trainingData.filter(w => {
            const date = this.parseDate(w.date);
            return date < today;
        }).length;
        
        return {
            totalDistance: totalDistance.toFixed(1),
            weekDistance: weekDistance.toFixed(1),
            daysUntilRace: daysUntilRace > 0 ? daysUntilRace : 0,
            completed: completed
        };
    }
}

// ============================================
// RENDERING FUNCTIONS
// ============================================
class UIRenderer {
    static renderTodayWorkout(workout, weatherData) {
        if (!workout) {
            return `
                <div class="today-section">
                    <div class="today-card">
                        <div class="no-workout">
                            <h2>📅 Không có lịch tập hôm nay</h2>
                            <p>Kiểm tra lịch tuần này bên dưới</p>
                        </div>
                    </div>
                </div>
            `;
        }
        
        const date = TrainingUtils.formatDate(TrainingUtils.getToday());
        const isRaceDay = workout.workout.toLowerCase().includes('race');
        
        let weatherHtml = '';
        if (weatherData && weatherData.current) {
            const runningTimes = WeatherService.getCurrentRunningTimes(weatherData.current);
            const weather = weatherData.current;
            
            if (runningTimes) {
                const morningTemp = Math.round(runningTimes.morning.main.temp);
                const eveningTemp = Math.round(runningTimes.evening.main.temp);
                const morningTempClass = WeatherService.getTemperatureColor(morningTemp);
                const eveningTempClass = WeatherService.getTemperatureColor(eveningTemp);
                const icon = WeatherService.getWeatherIcon(weather.weather[0].icon);
                
                weatherHtml = `
                    <div class="today-weather">
                        <div class="weather-times">
                            <div class="weather-time-slot">
                                <div class="time-label">🌅 Sáng sớm (4-6h)</div>
                                <div class="time-weather">
                                    <div class="time-temp ${morningTempClass}">${morningTemp}°C</div>
                                    <div class="time-icon">${icon}</div>
                                </div>
                                <div class="time-desc">${weather.weather[0].description}</div>
                            </div>
                            <div class="weather-time-slot">
                                <div class="time-label">🌆 Chiều muộn (17-18h)</div>
                                <div class="time-weather">
                                    <div class="time-temp ${eveningTempClass}">${eveningTemp}°C</div>
                                    <div class="time-icon">${icon}</div>
                                </div>
                                <div class="time-desc">${weather.weather[0].description}</div>
                            </div>
                        </div>
                        <div class="weather-details">
                            <div class="weather-item">
                                <span class="weather-icon">💧</span>
                                <span>${weather.main.humidity}%</span>
                            </div>
                            <div class="weather-item">
                                <span class="weather-icon">💨</span>
                                <span>${Math.round(weather.wind.speed * 3.6)} km/h</span>
                            </div>
                            <div class="weather-item">
                                <span class="weather-icon">👁️</span>
                                <span>${Math.round(weather.visibility / 1000)} km</span>
                            </div>
                            <div class="weather-item">
                                <span class="weather-icon">🌡️</span>
                                <span>Hiện tại ${Math.round(weather.main.temp)}°C</span>
                            </div>
                        </div>
                    </div>
                `;
            }
        } else {
            weatherHtml = `
                <div class="today-weather">
                    <div class="weather-times">
                        <div class="weather-time-slot">
                            <div class="time-label">🌅 Sáng sớm</div>
                            <div class="time-weather">
                                <div class="time-temp">--°C</div>
                            </div>
                            <div class="time-desc">Đang tải...</div>
                        </div>
                        <div class="weather-time-slot">
                            <div class="time-label">🌆 Chiều muộn</div>
                            <div class="time-weather">
                                <div class="time-temp">--°C</div>
                            </div>
                            <div class="time-desc">Đang tải...</div>
                        </div>
                    </div>
                </div>
            `;
        }
        
        return `
            <div class="today-section">
                <div class="today-card">
                    <div class="today-header">
                        <span class="today-badge">${isRaceDay ? '🏁 NGÀY THI ĐẤU' : 'HÔM NAY'}</span>
                        <span class="today-date">${date.dayName}, ${date.dateStr}</span>
                    </div>
                    <div class="workout-main">
                        <div class="workout-title">${workout.workout}</div>
                        <div class="workout-distance">${workout.distance} km</div>
                        <span class="workout-type ${TrainingUtils.getWorkoutClass(workout.workout)}">${workout.workout}</span>
                    </div>
                    <div class="workout-details">
                        <div class="detail-row">
                            <span class="detail-label">Chi tiết bài tập</span>
                            <span class="detail-value">${workout.description}</span>
                        </div>
                        ${workout.notes ? `
                        <div class="detail-row">
                            <span class="detail-label">Lưu ý</span>
                            <span class="detail-value">${workout.notes}</span>
                        </div>
                        ` : ''}
                    </div>
                    ${weatherHtml}
                </div>
            </div>
        `;
    }

    static renderStats(stats) {
        return `
            <div class="stats-section">
                <div class="stats-grid">
                    <div class="stat-card">
                        <div class="stat-icon">📊</div>
                        <div class="stat-value">${stats.totalDistance}</div>
                        <div class="stat-label">Tổng KM</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-icon">📅</div>
                        <div class="stat-value">${stats.weekDistance}</div>
                        <div class="stat-label">KM tuần này</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-icon">🎯</div>
                        <div class="stat-value">${stats.daysUntilRace}</div>
                        <div class="stat-label">Ngày đến Race</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-icon">✅</div>
                        <div class="stat-value">${stats.completed}</div>
                        <div class="stat-label">Đã hoàn thành</div>
                    </div>
                </div>
            </div>
        `;
    }

    static renderWeekView(weekWorkouts, weatherData, modal) {
        const weekCards = weekWorkouts.map(day => {
            const formatted = TrainingUtils.formatDate(day.date);
            const workout = day.workout;
            
            let weatherHtml = '';
            if (weatherData) {
                if (day.isToday && weatherData.current) {
                    const runningTimes = WeatherService.getCurrentRunningTimes(weatherData.current);
                    if (runningTimes) {
                        const morningTemp = Math.round(runningTimes.morning.main.temp);
                        const eveningTemp = Math.round(runningTimes.evening.main.temp);
                        const morningTempClass = WeatherService.getTemperatureColor(morningTemp);
                        const eveningTempClass = WeatherService.getTemperatureColor(eveningTemp);
                        const icon = WeatherService.getWeatherIcon(weatherData.current.weather[0].icon);
                        
                        weatherHtml = `
                            <div class="day-weather">
                                <div class="day-weather-times">
                                    <div class="day-time-slot">
                                        <div class="day-time-label">🌅 Sáng</div>
                                        <div class="day-time-temp ${morningTempClass}">${morningTemp}°C</div>
                                        <div class="day-time-icon">${icon}</div>
                                    </div>
                                    <div class="day-time-slot">
                                        <div class="day-time-label">🌆 Chiều</div>
                                        <div class="day-time-temp ${eveningTempClass}">${eveningTemp}°C</div>
                                        <div class="day-time-icon">${icon}</div>
                                    </div>
                                </div>
                            </div>
                        `;
                    }
                } else if (weatherData.forecast) {
                    const forecasts = WeatherService.getRunningTimeForecasts(weatherData.forecast, day.date);
                    if (forecasts && (forecasts.morning || forecasts.evening)) {
                        let morningHtml = '<div class="day-time-slot"><div class="day-time-label">🌅 Sáng</div><div style="font-size:0.7rem;color:#94a3b8;">N/A</div></div>';
                        let eveningHtml = '<div class="day-time-slot"><div class="day-time-label">🌆 Chiều</div><div style="font-size:0.7rem;color:#94a3b8;">N/A</div></div>';
                        
                        if (forecasts.morning) {
                            const temp = Math.round(forecasts.morning.main.temp);
                            const tempClass = WeatherService.getTemperatureColor(temp);
                            const icon = WeatherService.getWeatherIcon(forecasts.morning.weather[0].icon);
                            morningHtml = `
                                <div class="day-time-slot">
                                    <div class="day-time-label">🌅 Sáng</div>
                                    <div class="day-time-temp ${tempClass}">${temp}°C</div>
                                    <div class="day-time-icon">${icon}</div>
                                </div>
                            `;
                        }
                        
                        if (forecasts.evening) {
                            const temp = Math.round(forecasts.evening.main.temp);
                            const tempClass = WeatherService.getTemperatureColor(temp);
                            const icon = WeatherService.getWeatherIcon(forecasts.evening.weather[0].icon);
                            eveningHtml = `
                                <div class="day-time-slot">
                                    <div class="day-time-label">🌆 Chiều</div>
                                    <div class="day-time-temp ${tempClass}">${temp}°C</div>
                                    <div class="day-time-icon">${icon}</div>
                                </div>
                            `;
                        }
                        
                        weatherHtml = `
                            <div class="day-weather">
                                <div class="day-weather-times">
                                    ${morningHtml}
                                    ${eveningHtml}
                                </div>
                            </div>
                        `;
                    }
                }
            }
            
            if (!weatherHtml) {
                weatherHtml = `
                    <div class="day-weather">
                        <div class="day-weather-times">
                            <div class="day-time-slot">
                                <div class="day-time-label">🌅 Sáng</div>
                                <div class="day-time-temp">--°C</div>
                            </div>
                            <div class="day-time-slot">
                                <div class="day-time-label">🌆 Chiều</div>
                                <div class="day-time-temp">--°C</div>
                            </div>
                        </div>
                    </div>
                `;
            }
            
            const cardId = `day-card-${day.date.getTime()}`;
            
            return `
                <div class="day-card ${day.isToday ? 'is-today' : ''}" id="${cardId}" data-date="${day.date.toISOString()}">
                    <div class="day-name">${formatted.dayName}</div>
                    <div class="day-date">${formatted.dateStr}</div>
                    <div class="day-workout">${workout ? workout.workout : 'Không có'}</div>
                    <div class="day-distance">${workout ? workout.distance + ' km' : '-'}</div>
                    ${weatherHtml}
                </div>
            `;
        }).join('');
        
        return `
            <div class="week-section">
                <h2 class="section-title">🗓️ Lịch tập 7 ngày tới</h2>
                <div class="week-scroll">
                    <div class="week-container">
                        ${weekCards}
                    </div>
                </div>
            </div>
        `;
    }
}

// ============================================
// SWIMMING UI RENDERER (giữ nguyên code cũ - các hàm render swimming)
// ============================================
class SwimmingRenderer {
    static renderSwimmingWeather(swimmingData) {
        if (!swimmingData || !swimmingData.weather) {
            return `
                <div class="swimming-section">
                    <div class="swimming-card">
                        <div class="no-workout">
                            <h2>🌊 Không thể tải dữ liệu bơi</h2>
                            <p>Vui lòng thử lại sau</p>
                        </div>
                    </div>
                </div>
            `;
        }

        const now = new Date();
        const currentHour = now.getHours();
        
        let dataNotice = '';
        if (swimmingData.isEmergencyFallback) {
            dataNotice = `
                <div class="swimming-card" style="background: rgba(251, 146, 60, 0.1); border: 1px solid #fb923c;">
                    <div class="swimming-header">
                        <span class="swimming-title">⚠️ Dữ liệu mô phỏng</span>
                        <span class="swimming-time">Không có kết nối API</span>
                    </div>
                    <div class="recommendation-text" style="color: #fb923c;">
                        Đang sử dụng dữ liệu ước tính. Vui lòng kiểm tra điều kiện thực tế trước khi bơi.
                    </div>
                </div>
            `;
        } else if (swimmingData.isWindBased) {
            dataNotice = `
                <div class="swimming-card" style="background: rgba(59, 130, 246, 0.1); border: 1px solid #3b82f6;">
                    <div class="swimming-header">
                        <span class="swimming-title">🌬️ Dữ liệu kết hợp</span>
                        <span class="swimming-time">Sóng tính từ gió</span>
                    </div>
                    <div class="recommendation-text" style="color: #3b82f6;">
                        Sử dụng dữ liệu thời tiết thực tế. Sóng được tính từ tốc độ gió theo công thức Beaufort.
                    </div>
                </div>
            `;
        } else if (swimmingData.isRealMarine) {
            dataNotice = `
                <div class="swimming-card" style="background: rgba(34, 197, 94, 0.1); border: 1px solid #22c55e;">
                    <div class="swimming-header">
                        <span class="swimming-title">🌊 Dữ liệu marine thực tế</span>
                        <span class="swimming-time">Open-Meteo Marine API</span>
                    </div>
                    <div class="recommendation-text" style="color: #22c55e;">
                        Sử dụng dữ liệu sóng biển và thời tiết thực tế từ Open-Meteo. Độ chính xác cao!
                    </div>
                </div>
            `;
        }
        
        const currentIndex = swimmingData.weather.hourly.time.findIndex(time => {
            const timeHour = new Date(time).getHours();
            return timeHour >= currentHour;
        }) || 0;

        const current = {
            temp: swimmingData.weather.hourly.temperature_2m[currentIndex] || 25,
            humidity: swimmingData.weather.hourly.relative_humidity_2m[currentIndex] || 70,
            visibility: (swimmingData.weather.hourly.visibility?.[currentIndex] || 15000) / 1000,
            uvIndex: swimmingData.weather.hourly.uv_index?.[currentIndex] || 3,
            windSpeed: swimmingData.weather.hourly.wind_speed_10m[currentIndex] || 10,
            windDirection: swimmingData.weather.hourly.wind_direction_10m?.[currentIndex] || 90,
            waveHeight: swimmingData.marine?.hourly?.wave_height?.[currentIndex] || 0.4,
            waveDirection: swimmingData.marine?.hourly?.wave_direction?.[currentIndex] || 90,
            wavePeriod: swimmingData.marine?.hourly?.wave_period?.[currentIndex] || 5,
            seaTemp: swimmingData.marine?.hourly?.sea_surface_temperature?.[currentIndex] || null,
            precipitation: swimmingData.weather.hourly.precipitation?.[currentIndex] || 0,
            precipitationProb: swimmingData.weather.hourly.precipitation_probability?.[currentIndex] || 0
        };

        const condition = SwimmingService.getSwimmingCondition(
            current.waveHeight,
            current.windSpeed,
            current.visibility,
            current.uvIndex,
            current.precipitation,
            current.precipitationProb
        );

        return `
            <div class="swimming-section">
                ${dataNotice}
                
                <div class="swimming-card condition-${condition.condition}">
                    <div class="swimming-header">
                        <span class="swimming-title">${condition.icon} Điều kiện bơi</span>
                        <span class="swimming-time">Hiện tại ${now.getHours()}:${now.getMinutes().toString().padStart(2, '0')}</span>
                    </div>
                    
                    <div class="condition-grid">
                        <div class="condition-item">
                            <span class="condition-icon">🌧️</span>
                            <div class="condition-value ${SwimmingService.getPrecipitationClass(current.precipitation || 0)}">${(current.precipitation || 0).toFixed(1)}mm</div>
                            <div class="condition-label">Lượng mưa</div>
                            <div class="condition-desc">${current.precipitationProb || 0}% xác suất</div>
                        </div>
                        
                        <div class="condition-item">
                            <span class="condition-icon">🌊</span>
                            <div class="condition-value ${SwimmingService.getWaveHeightClass(current.waveHeight)}">${current.waveHeight?.toFixed(2)}m</div>
                            <div class="condition-label">Độ cao sóng</div>
                            <div class="condition-desc">${SwimmingService.getWindDirection(current.waveDirection)} · ${current.wavePeriod?.toFixed(1)}s</div>
                        </div>
                        
                        <div class="condition-item">
                            <span class="condition-icon">💨</span>
                            <div class="condition-value">${Math.round(current.windSpeed)} km/h</div>
                            <div class="condition-label">Tốc độ gió</div>
                            <div class="condition-desc">${SwimmingService.getWindDirection(current.windDirection)}</div>
                        </div>
                        
                        <div class="condition-item">
                            <span class="condition-icon">${current.seaTemp ? '🌡️' : '🏊‍♂️'}</span>
                            <div class="condition-value ${WeatherService.getTemperatureColor(current.seaTemp || current.temp)}">${Math.round(current.seaTemp || current.temp)}°C</div>
                            <div class="condition-label">${current.seaTemp ? 'Nhiệt độ nước' : 'Nhiệt độ không khí'}</div>
                            <div class="condition-desc">${Math.round(current.humidity)}% độ ẩm</div>
                        </div>
                        
                        <div class="condition-item">
                            <span class="condition-icon">☀️</span>
                            <div class="condition-value ${SwimmingService.getUVClass(current.uvIndex)}">${Math.round(current.uvIndex)}</div>
                            <div class="condition-label">UV Index</div>
                            <div class="condition-desc">${current.visibility?.toFixed(1)} km tầm nhìn</div>
                        </div>
                    </div>

                    <div class="swimming-recommendation">
                        <div class="recommendation-header">
                            <span class="recommendation-icon">${condition.icon}</span>
                            <span class="recommendation-title">Khuyến nghị</span>
                        </div>
                        <div class="recommendation-text">${condition.recommendation}</div>
                    </div>
                </div>

                ${this.renderSwimmingTimes(swimmingData)}
                ${this.renderHourlyForecast(swimmingData)}
            </div>
        `;
    }

    static renderSwimmingTimes(swimmingData) {
        if (!swimmingData || !swimmingData.weather) {
            return '<div class="swimming-card"><p>Không có dữ liệu thời gian</p></div>';
        }

        const now = new Date();
        const times = [
            { label: '🌅 Sáng sớm', start: 6, end: 8, icon: '🌅' },
            { label: '🌆 Chiều mát', start: 17, end: 19, icon: '🌆' }
        ];

        const timeSlots = times.map(timeSlot => {
            const timeIndex = swimmingData.weather.hourly.time.findIndex(time => {
                const hour = new Date(time).getHours();
                const day = new Date(time).toDateString();
                const today = now.toDateString();
                return day === today && hour >= timeSlot.start && hour <= timeSlot.end;
            });

            if (timeIndex === -1) {
                return `
                    <div class="time-slot">
                        <div class="swimming-header">
                            <span>${timeSlot.icon}</span>
                            <span class="swimming-title">${timeSlot.label}</span>
                        </div>
                        <div class="condition-desc">Không có dữ liệu</div>
                    </div>
                `;
            }

            const data = {
                temp: swimmingData.weather.hourly.temperature_2m[timeIndex] || 25,
                windSpeed: swimmingData.weather.hourly.wind_speed_10m[timeIndex] || 10,
                visibility: (swimmingData.weather.hourly.visibility[timeIndex] || 10000) / 1000,
                uvIndex: swimmingData.weather.hourly.uv_index[timeIndex] || 3,
                waveHeight: swimmingData.marine?.hourly?.wave_height?.[timeIndex] || 0.3
            };

            const condition = SwimmingService.getSwimmingCondition(
                data.waveHeight,
                data.windSpeed,
                data.visibility,
                data.uvIndex
            );

            const isRecommended = condition.condition === 'excellent' || condition.condition === 'good';

            return `
                <div class="time-slot ${isRecommended ? 'recommended' : ''}">
                    <div class="swimming-header">
                        <span>${timeSlot.icon}</span>
                        <span class="swimming-title">${timeSlot.label}</span>
                    </div>
                    <div class="condition-grid">
                        <div class="condition-item">
                            <div class="condition-value">${Math.round(data.temp || 0)}°C</div>
                            <div class="condition-label">Nhiệt độ</div>
                        </div>
                        <div class="condition-item">
                            <div class="condition-value ${SwimmingService.getWaveHeightClass(data.waveHeight)}">${data.waveHeight?.toFixed(1) || 'N/A'}m</div>
                            <div class="condition-label">Sóng</div>
                        </div>
                    </div>
                    <div class="condition-desc">${condition.recommendation}</div>
                </div>
            `;
        }).join('');

        return `
            <div class="swimming-card">
                <h3 class="swimming-title">⏰ Thời gian tốt nhất</h3>
                <div class="swimming-times">
                    ${timeSlots}
                </div>
            </div>
        `;
    }

    static renderHourlyForecast(swimmingData) {
        if (!swimmingData || !swimmingData.weather) {
            return '<div class="swimming-card"><p>Không có dữ liệu dự báo</p></div>';
        }

        const now = new Date();
        const next12Hours = [];

        for (let i = 0; i < 12; i++) {
            const targetTime = new Date(now.getTime() + i * 60 * 60 * 1000);
            const timeIndex = swimmingData.weather.hourly.time.findIndex(time => {
                const dataTime = new Date(time);
                return Math.abs(dataTime - targetTime) < 30 * 60 * 1000;
            });

            if (timeIndex !== -1) {
                next12Hours.push({
                    time: targetTime,
                    temp: swimmingData.weather.hourly.temperature_2m[timeIndex] || 25,
                    windSpeed: swimmingData.weather.hourly.wind_speed_10m[timeIndex] || 10,
                    visibility: (swimmingData.weather.hourly.visibility[timeIndex] || 10000) / 1000,
                    uvIndex: swimmingData.weather.hourly.uv_index[timeIndex] || 3,
                    waveHeight: swimmingData.marine?.hourly?.wave_height?.[timeIndex] || 0.3,
                    precipitation: swimmingData.weather.hourly.precipitation?.[timeIndex] || 0,
                    precipitationProb: swimmingData.weather.hourly.precipitation_probability?.[timeIndex] || 0
                });
            }
        }

        const hourlyCards = next12Hours.map(hour => {
            const condition = SwimmingService.getSwimmingCondition(
                hour.waveHeight,
                hour.windSpeed,
                hour.visibility,
                hour.uvIndex,
                hour.precipitation,
                hour.precipitationProb
            );

            const precipIcon = SwimmingService.getPrecipitationIcon(hour.precipitation, hour.precipitationProb);
            const precipValue = (hour.precipitation || 0).toFixed(1);

            return `
                <div class="hour-card condition-${condition.condition}">
                    <div class="hour-time">${hour.time.getHours()}:00</div>
                    <div class="hour-temp ${WeatherService.getTemperatureColor(hour.temp)}">${Math.round(hour.temp)}°C</div>
                    <div class="hour-precip ${SwimmingService.getPrecipitationClass(hour.precipitation || 0)}">${precipValue}mm ${precipIcon}</div>
                    <div class="hour-wave ${SwimmingService.getWaveHeightClass(hour.waveHeight)}">${(hour.waveHeight || 0).toFixed(1)}m 🌊</div>
                    <div class="condition-desc">${condition.icon}</div>
                </div>
            `;
        }).join('');

        return `
            <div class="swimming-card">
                <h3 class="swimming-title">📊 Dự báo 12 giờ tới</h3>
                <div class="hourly-forecast">
                    <div class="hourly-scroll">
                        ${hourlyCards}
                    </div>
                </div>
            </div>
        `;
    }
}

// ============================================
// MAIN APPLICATION CLASS
// ============================================
class MarathonTrainingApp {
    constructor() {
        this.touchStartY = 0;
        this.touchEndY = 0;
        this.currentTab = 'training';
        this.modal = new WorkoutModal();
        this.initEventListeners();
    }

    switchTab(tabName) {
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });
        document.getElementById(`${tabName}Tab`).classList.add('active');

        this.currentTab = tabName;

        if (tabName === 'training') {
            this.renderTraining();
        } else if (tabName === 'swimming') {
            this.renderSwimming();
        }
    }

    async renderTraining() {
        const todayWorkout = TrainingUtils.getTodayWorkout();
        const weekWorkouts = TrainingUtils.getWeekWorkouts();
        const stats = TrainingUtils.calculateStats();
        
        const html = `
            ${UIRenderer.renderTodayWorkout(todayWorkout, null)}
            ${UIRenderer.renderStats(stats)}
            ${UIRenderer.renderWeekView(weekWorkouts, null, this.modal)}
        `;
        
        document.getElementById('mainContent').innerHTML = html;
        
        // Attach click handlers to day cards
        this.attachDayCardHandlers(weekWorkouts);
        
        WeatherService.loadWeatherData().then(weatherData => {
            if (weatherData) {
                const htmlWithWeather = `
                    ${UIRenderer.renderTodayWorkout(todayWorkout, weatherData)}
                    ${UIRenderer.renderStats(stats)}
                    ${UIRenderer.renderWeekView(weekWorkouts, weatherData, this.modal)}
                `;
                document.getElementById('mainContent').innerHTML = htmlWithWeather;
                
                // Re-attach handlers after re-render
                this.attachDayCardHandlers(weekWorkouts, weatherData);
            }
        });
    }

    attachDayCardHandlers(weekWorkouts, weatherData = null) {
        weekWorkouts.forEach(day => {
            if (!day.workout) return;
            
            const cardId = `day-card-${day.date.getTime()}`;
            const card = document.getElementById(cardId);
            
            if (card) {
                card.addEventListener('click', () => {
                    this.modal.open(day.workout, day.date, weatherData);
                });
            }
        });
    }

    async renderSwimming() {
        document.getElementById('swimmingContent').innerHTML = `
            <div class="swimming-section">
                <div class="swimming-card">
                    <div class="swimming-header">
                        <span class="swimming-title">🌊 Điều kiện bơi</span>
                        <span class="swimming-time">Đang tải...</span>
                    </div>
                    <div class="condition-grid">
                        <div class="condition-item">
                            <span class="condition-icon">🌊</span>
                            <div class="condition-value">--</div>
                            <div class="condition-label">Độ cao sóng</div>
                        </div>
                        <div class="condition-item">
                            <span class="condition-icon">💨</span>
                            <div class="condition-value">--</div>
                            <div class="condition-label">Tốc độ gió</div>
                        </div>
                        <div class="condition-item">
                            <span class="condition-icon">🌡️</span>
                            <div class="condition-value">--</div>
                            <div class="condition-label">Nhiệt độ</div>
                        </div>
                        <div class="condition-item">
                            <span class="condition-icon">☀️</span>
                            <div class="condition-value">--</div>
                            <div class="condition-label">UV Index</div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        SwimmingService.loadSwimmingData().then(swimmingData => {
            const html = SwimmingRenderer.renderSwimmingWeather(swimmingData);
            document.getElementById('swimmingContent').innerHTML = html;
        });
    }

    initEventListeners() {
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tabName = e.currentTarget.dataset.tab;
                this.switchTab(tabName);
            });
        });

        document.addEventListener('touchstart', (e) => {
            this.touchStartY = e.changedTouches[0].screenY;
        }, { passive: true });
        
        document.addEventListener('touchend', (e) => {
            this.touchEndY = e.changedTouches[0].screenY;
            this.handleSwipe();
        }, { passive: true });

        document.addEventListener('visibilitychange', () => {
            if (!document.hidden) {
                if (this.currentTab === 'training') {
                    this.renderTraining();
                } else if (this.currentTab === 'swimming') {
                    this.renderSwimming();
                }
            }
        });

        document.body.addEventListener('touchmove', (e) => {
            if (e.touches.length > 1) {
                e.preventDefault();
            }
        }, { passive: false });

        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            this.deferredPrompt = e;
        });
    }

    handleSwipe() {
        const swipeDistance = this.touchStartY - this.touchEndY;
        if (swipeDistance < -100 && window.scrollY === 0) {
            this.refreshData();
        }
    }

    refreshData() {
        weatherCache = {
            current: null,
            forecast: null,
            lastUpdate: null,
            location: null
        };
        
        swimmingCache = {
            marine: null,
            weather: null,
            lastUpdate: null,
            location: null
        };
        
        const locationInfo = document.getElementById('locationInfo');
        locationInfo.innerHTML = `
            <span class="mini-spinner"></span>
            <span>Đang làm mới...</span>
        `;
        
        setTimeout(() => {
            if (this.currentTab === 'training') {
                this.renderTraining();
            } else if (this.currentTab === 'swimming') {
                this.renderSwimming();
            }
        }, 300);
    }

    scheduleUpdate() {
        const now = new Date();
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(0, 0, 0, 0);
        
        const msUntilMidnight = tomorrow - now;
        
        setTimeout(() => {
            weatherCache = {
                current: null,
                forecast: null,
                lastUpdate: null,
                location: null
            };
            swimmingCache = {
                marine: null,
                weather: null,
                lastUpdate: null,
                location: null
            };
            
            if (this.currentTab === 'training') {
                this.renderTraining();
            } else if (this.currentTab === 'swimming') {
                this.renderSwimming();
            }
            this.scheduleUpdate();
        }, msUntilMidnight);
    }

    init() {
        loadTrainingData().then(() => {
            this.renderTraining();
        }).catch((error) => {
            console.error('Failed to load training data:', error);
            this.renderTraining();
        });

        this.scheduleUpdate();

        if ('serviceWorker' in navigator) {
            window.addEventListener('load', () => {
                // navigator.serviceWorker.register('/sw.js');
            });
        }
    }
}

// ============================================
// APPLICATION INITIALIZATION
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    const app = new MarathonTrainingApp();
    app.init();
});