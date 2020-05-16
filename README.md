# VK Mini Apps API Server
Простейший сервер API для VK Mini Apps  

Пример использования:
```
const VkAppsApiServer = require('flyink13/vkappsapi');

class AppAPI extends VkAppsApiServer {
  api_random(user_id, query) {
    return Math.random();
  }
  
  api_echo(user_id, query) {
    return Promise.resolve({ user_id, query });
  }
}

new AppAPI({
  appSecret: 'abcdf',   // Секретный ключ приложения
  testValidation: true, // Для отладки API, игнорирует sign и смотрит на testValidation=1 в GET параметрах
  
  // Все параметры от HttpServer
  maxConnections: 300,  // Максимальное количество одновременных клиентов
  ttl: 30e3,            // Максимальное время жизни сокета в секундах
  contentSizeLimit: 1e6 // Максимальный размер POST запроса 
}).listen(3006).catch(console.error);
```
