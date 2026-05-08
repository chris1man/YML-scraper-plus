# YML Scraper Plus

Автоматический скрапер товаров с созданием YML-фида для Яндекс.Маркета.

## Архитектура

```
GitHub Actions (cron / manual)  →  Python scraper  →  feed.yml (commit в репозиторий)
                                                              ↓
Cloudflare Worker  ←  GET / (HTML со статистикой)  +  GET /feed.yml (из GitHub raw)
```

- **GitHub Actions** — запускает Python-скрипт по расписанию (каждый день в 06:00 МСК) или вручную через вкладку Actions. Результат: `feed.yml` коммитится в репозиторий.
- **Python scraper** — парсит сайт и создаёт `feed.yml` в формате Яндекс.Маркета.
- **Cloudflare Worker** — обслуживает два маршрута:
  - `GET /` — главная страница со статистикой фида и ссылкой на GitHub Actions
  - `GET /feed.yml` — отдаёт текущий `feed.yml` напрямую из репозитория

## Структура проекта

```
.
├── .github/
│   └── workflows/
│       └── scraper.yml      # GitHub Actions workflow (cron + manual)
├── worker.js                # Cloudflare Worker: GET /, GET /feed.yml
├── wrangler.toml            # Конфигурация Cloudflare Worker
├── scraper.py               # Основной скрипт скрапера
├── config.py                # Конфигурация (читается из env)
├── requirements.txt         # Python-зависимости
├── feed.yml                 # Сгенерированный YML-фид (коммитится Actions)
├── .env.example             # Пример переменных окружения
└── README.md                # Этот файл
```

## Быстрый старт

### 1. Форк / клонирование

Склонируйте репозиторий или сделайте форк на GitHub.

### 2. Настройка секретов в GitHub

Перейдите в **Settings → Secrets and variables → Actions** и добавьте:

**Secrets:**

| Название       | Значение                              |
|----------------|---------------------------------------|
| `CATEGORY_URL` | URL страницы со списком всех товаров  |

**Variables** (необязательно, есть дефолты):

| Название                 | Значение по умолчанию     |
|--------------------------|---------------------------|
| `SHOP_NAME`              | `My Shop`                 |
| `SHOP_COMPANY`           | `My Company`              |
| `SHOP_URL`               | *(пусто)*                 |
| `USER_AGENT`             | `Mozilla/5.0 ...`         |
| `SELECTOR_PRODUCT_LINKS` | `li.item a`               |
| `SELECTOR_NEXT_PAGE`     | `a.ty-pagination__next`   |
| `SELECTOR_TITLE`         | `h1.ty-product-block-title` |
| `SELECTOR_PRICE`         | `span.ty-price-num`       |
| `SELECTOR_DESCRIPTION`   | `div.kits-block`          |
| `SELECTOR_IMAGES`        | `a.cm-image-previewer`    |
| `SELECTOR_ARTICLE`       | *(пусто)*                 |
| `SELECTOR_AVAILABILITY`  | *(пусто)*                 |

### 3. Деплой Cloudflare Worker

```bash
npm install -g wrangler && wrangler login
wrangler secret put FEED_URL
# Введите: https://raw.githubusercontent.com/OWNER/REPO/main/feed.yml
wrangler deploy
```

Сайт будет доступен по адресу:
```
https://yml-scraper.ВАШ_ЛОГИН.workers.dev/
```

### 4. Обновление фида

- **Автоматически:** каждый день в 06:00 МСК
- **Вручную:** вкладка GitHub Actions → Scraper YML Feed → Run workflow
- **Со страницы:** кнопка "Открыть Actions" ведёт на страницу workflow

## Локальный запуск скрапера

```bash
pip install -r requirements.txt
cp .env.example .env   # отредактируйте CATEGORY_URL
python scraper.py
```

## Локальная разработка Worker

```bash
wrangler dev
# Откройте http://localhost:8787/
```

## Технологии

- **Python 3.11** + `requests` + `BeautifulSoup`
- **GitHub Actions** — cron + manual
- **Cloudflare Workers** — хостинг

## Лицензия

MIT
