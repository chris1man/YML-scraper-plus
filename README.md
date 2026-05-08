# YML Scraper Plus

Автоматический скрапер товаров с созданием YML-фида для Яндекс.Маркета.

## Архитектура

```
GitHub Actions (cron / manual)  →  Python scraper  →  feed.yml
                                                    ↓
Cloudflare Pages  ←  index.html (статистика) + feed.yml + /api/run (Pages Function)
```

- **GitHub Actions** — запускает Python-скрипт по расписанию (каждый день в 06:00 МСК) или вручную через вкладку Actions.
- **Python scraper** — парсит сайт и создаёт `feed.yml` в формате Яндекс.Маркета.
- **Cloudflare Pages** — хостит статический сайт:
  - `/` — главная страница со статистикой фида и кнопкой ручного запуска
  - `/feed.yml` — сам фид
  - `/api/run` — Cloudflare Pages Function для ручного запуска скрапера

## Структура проекта

```
.
├── .github/
│   └── workflows/
│       └── scraper.yml      # GitHub Actions workflow (cron + manual)
├── functions/
│   └── api/
│       └── run.js           # Cloudflare Pages Function — POST /api/run
├── scraper.py               # Основной скрипт скрапера
├── config.py                # Конфигурация (читается из env)
├── requirements.txt         # Python-зависимости
├── index.html               # Главная страница со статистикой и кнопкой запуска
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

### 3. Деплой на Cloudflare Pages

1. Зарегистрируйтесь на [cloudflare.com](https://cloudflare.com) (бесплатно).
2. Перейдите в **Workers & Pages → Create → Pages → Connect to Git**.
3. Выберите этот репозиторий.
4. Настройки сборки:
   - **Build command:** оставьте пустым (статический сайт)
   - **Build output directory:** оставьте `/` (корень репозитория)
5. В разделе **Settings → Environment variables** добавьте:

| Название       | Значение                                                                 |
|----------------|--------------------------------------------------------------------------|
| `GITHUB_TOKEN` | GitHub Personal Access Token с правами `repo` и `workflow`               |
| `GITHUB_OWNER` | Ваш логин на GitHub                                                      |
| `GITHUB_REPO`  | Имя репозитория (например, `YML-scraper-plus`)                           |

6. Нажмите **Deploy**.

После деплоя сайт будет доступен по адресу:
```
https://yml-scraper-plus.pages.dev/
```

А фид по адресу:
```
https://yml-scraper-plus.pages.dev/feed.yml
```

### 4. Ручной запуск скрапера

- **Через GitHub:** Actions → Scraper YML Feed → Run workflow
- **Через сайт:** нажмите кнопку "Запустить скрапер" на главной странице

## Локальный запуск

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

## Технологии

- **Python 3.11** + `requests` + `BeautifulSoup`
- **GitHub Actions** — CI/CD и cron
- **Cloudflare Pages** — статический хостинг + Pages Functions для API

## Лицензия

MIT
