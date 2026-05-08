# YML Scraper Plus

Автоматический скрапер товаров с созданием YML-фида для Яндекс.Маркета.

## Архитектура

```
GitHub Actions (cron / manual)  →  Python scraper  →  feed.yml (commit в репозиторий)
                                                              ↓
Cloudflare Worker  ←  GET / (HTML)  +  GET /feed.yml (из GitHub raw)  +  POST /api/run (trigger Actions)
```

- **GitHub Actions** — запускает Python-скрипт по расписанию (каждый день в 06:00 МСК) или вручную через вкладку Actions. Результат: `feed.yml` коммитится в репозиторий.
- **Python scraper** — парсит сайт и создаёт `feed.yml` в формате Яндекс.Маркета.
- **Cloudflare Worker** — единая точка входа, обслуживает все маршруты:
  - `GET /` — главная страница со статистикой фида и кнопкой ручного запуска
  - `GET /feed.yml` — отдаёт текущий `feed.yml` напрямую из репозитория (через GitHub raw URL)
  - `POST /api/run` — запускает обновление фида через GitHub Actions API

## Структура проекта

```
.
├── .github/
│   └── workflows/
│       └── scraper.yml      # GitHub Actions workflow (cron + manual)
├── worker.js                # Cloudflare Worker — все маршруты: /, /feed.yml, /api/run
├── wrangler.toml            # Конфигурация Cloudflare Worker
├── scraper.py               # Основной скрипт скрапера
├── config.py                # Конфигурация (читается из env)
├── requirements.txt         # Python-зависимости
├── index.html               # Копия HTML для локальной разработки (опционально)
├── feed.yml                 # Сгенерированный YML-фид (коммитится Actions)
├── .env.example             # Пример переменных окружения
└── README.md                # Этот файл
```

## Быстрый старт

### 1. Форк / клонирование

Склонируйте репозиторий или сделайте форк на GitHub.

### 2. Настройка секретов и переменных в GitHub

Перейдите в **Settings → Secrets and variables → Actions** и добавьте:

**Secrets (зашифрованные):**

| Название       | Значение                                           |
|----------------|----------------------------------------------------|
| `CATEGORY_URL` | URL страницы со списком всех товаров               |

**Variables (открытые, можно изменить без пересоздания):**

| Название                 | Значение по умолчанию                              |
|--------------------------|----------------------------------------------------|
| `SHOP_NAME`              | `My Shop`                                          |
| `SHOP_COMPANY`           | `My Company`                                       |
| `SHOP_URL`               | *(пусто)*                                          |
| `USER_AGENT`             | `Mozilla/5.0 ... Chrome/120.0.0.0 ...`             |
| `SELECTOR_PRODUCT_LINKS` | `li.item a`                                        |
| `SELECTOR_NEXT_PAGE`     | `a.ty-pagination__next`                            |
| `SELECTOR_TITLE`         | `h1.ty-product-block-title`                        |
| `SELECTOR_PRICE`         | `span.ty-price-num`                                |
| `SELECTOR_DESCRIPTION`   | `div.kits-block`                                   |
| `SELECTOR_IMAGES`        | `a.cm-image-previewer`                             |
| `SELECTOR_ARTICLE`       | *(пусто)*                                          |
| `SELECTOR_AVAILABILITY`  | *(пусто)*                                          |

> **Важно:** `CATEGORY_URL` обязателен. Все остальные параметры имеют разумные значения по умолчанию для CS-Cart.

### 3. Деплой Cloudflare Worker

1. Зарегистрируйтесь на [cloudflare.com](https://cloudflare.com) (бесплатно).
2. Установите Wrangler CLI:
   ```bash
   npm install -g wrangler
   ```
3. Войдите в аккаунт:
   ```bash
   wrangler login
   ```
4. Добавьте секреты (Wrangler запросит значения):
   ```bash
   wrangler secret put GITHUB_TOKEN   # Personal Access Token с правами repo + workflow
   wrangler secret put GITHUB_OWNER   # Ваш логин на GitHub
   wrangler secret put GITHUB_REPO    # Имя репозитория
   ```
5. Задеплойте Worker:
   ```bash
   wrangler deploy
   ```

После деплоя Worker будет доступен по адресу:
```
https://yml-scraper.ВАШ_ЛОГИН.workers.dev/
```

А фид по адресу:
```
https://yml-scraper.ВАШ_ЛОГИН.workers.dev/feed.yml
```

### 4. Ручной запуск скрапера

- **Через GitHub:** Actions → Scraper YML Feed → Run workflow
- **Через Worker:** откройте главную страницу Worker и нажмите кнопку "Запустить скрапер"

## Локальный запуск скрапера

```bash
# 1. Установка зависимостей
pip install -r requirements.txt

# 2. Настройка окружения (опционально)
cp .env.example .env
# Отредактируйте .env

# 3. Запуск скрапера
python scraper.py
```

После выполнения будет создан/обновлен файл `feed.yml`.

## Локальная разработка Worker

```bash
# Запуск Worker локально (тестирование маршрутов)
wrangler dev
```

Откройте `http://localhost:8787/` для проверки.

## Как работает скрапер

1. **Сбор ссылок** — скрапер открывает `CATEGORY_URL` и собирает ссылки на все товары (с учетом пагинации).
2. **Парсинг товаров** — для каждой ссылки загружает страницу товара и извлекает:
   - название
   - цену
   - описание / состав
   - изображения
   - артикул (если есть)
   - наличие (если есть)
3. **Генерация YML** — формирует `feed.yml` в формате Яндекс.Маркета.
4. **Коммит** — GitHub Actions коммитит `feed.yml` в репозиторий.
5. **Worker** — отдаёт `feed.yml` по запросу через GitHub raw URL.

## Технологии

- **Python 3.11** + `requests` + `BeautifulSoup`
- **GitHub Actions** — CI/CD и cron
- **Cloudflare Workers** — серверлесс-хостинг + API

## Лицензия

MIT
