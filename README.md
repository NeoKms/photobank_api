## Настройка и запуск
### Способ 1. Локальный.

Скопировать файл ```.env.example``` и заполнить своими данными. Потом запустить приложение ```npm run dev/start```

### Способ 2. Контейнер upachko/photobank_api.

Должны быть переданы enviroment из файла ```.env.example```

### Способ 3. docker-compose.

В проекте лежат конфигурации для запуска. Надо взять два файла ```services.yaml``` и ```apps.yaml```, заполнить их данными и запустить (запускает так же и клиент фотобанка).

```docker-compose -f services.yaml up -d && docker-compose -f apps.yaml up -d ```

Для работы клиента надо запустить команду ```docker exec -it photobank_client sh -c "cd /usr/share/nginx/html && sh getenv.sh"```