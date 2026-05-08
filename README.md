# YML Scraper Plus

Автоматический скрапер товаров с созданием YML-фида для Яндекс.Маркета.

## Архитектура

```
GitHub Actions  →  Python scraper  →  feed.yml  →  GitHub Pages
       ↑                                              ↓
Cloudflare Worker  ←  кнопка "Запустить скрапер" на сайте
```

- **GitHub Actions** — запускает Python-скрипт по расписанию (каждый день в 06:00 МСК) или вручную.
- **Python scraper** — парсит сайт и создает `feed.yml`.
- **GitHub Pages** — хостит статический сайт: главную страницу со статистикой и сам `feed.yml`.
- **Cloudflare Worker** — API-эндпоинт `/api/run`, который триггерит GitHub Actions при нажатии кнопки на сайте.

## Структура проекта

```
.
├── .github/
│   └── workflows/
│       └── scraper.yml      # GitHub Actions workflow
├── functions/
│   └── api/
│       └── run.js           # Cloudflare Pages Function (альтернатива Worker)
├── worker.js                # Cloudflare Worker для ручного запуска
├── scraper.py               # Основной скрипт скрапера
├── config.py                # Конфигурация (читается из env)
├── requirements.txt         # Python-зависимости
├── index.html               # Главная страница со статистикой
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

### 3. Включение GitHub Pages

1. Откройте **Settings → Pages** в репозитории.
2. В разделе **Build and deployment** выберите **Source: Deploy from a branch**.
3. Выберите ветку `main` и папку `/ (root)`.
4. Нажмите **Save**.

После первого запуска workflow сайт будет доступен по адресу:
```
https://ВАШ_ЛОГИН.github.io/ИМЯ_РЕПОЗИТОРИЯ/
```

А фид по адресу:
```
https://ВАШ_ЛОГИН.github.io/ИМЯ_РЕПОЗИТОРИЯ/feed.yml
```

### 4. Ручной запуск скрапера

- **Через GitHub:** Actions → Scraper YML Feed → Run workflow
- **Через сайт:** нажмите кнопку "Запустить скрапер" на главной странице

## Настройка Cloudflare Worker (опционально, для кнопки запуска)

Если вы хотите, чтобы кнопка "Запустить скрапер" на сайте работала, нужен API-эндпоинт. GitHub Pages не поддерживает серверный код, поэтому используем Cloudflare Worker:

1. Зарегистрируйтесь на [cloudflare.com](https://cloudflare.com) (бесплатно).
2. Перейдите в **Workers & Pages → Create Worker**.
3. Вставьте код из файла `worker.js` (в корне репозитория).
4. В настройках Worker (Settings → Variables) добавьте:

| Название       | Значение                                                                 |
|----------------|--------------------------------------------------------------------------|
| `GITHUB_TOKEN` | GitHub Personal Access Token с правами `repo` и `workflow`               |
| `GITHUB_OWNER` | Ваш логин на GitHub                                                      |
| `GITHUB_REPO`  | Имя репозитория (например, `YML-scraper-plus`)                           |

5. Сохраните Worker. Он получит URL вида `https://yml-scraper-plus.ВАШ_ЛОГИН.workers.dev`.
6. В `index.html` раскомментируйте и укажите полный URL Worker:
   ```js
   const API_URL = 'https://yml-scraper-plus.ВАШ_ЛОГИН.workers.dev/api/run';
   ```

> **Безопасность:** токен хранится в переменных окружении Cloudflare и нигде не попадает в клиентский код.

> **Альтернатива:** если вы используете Cloudflare Pages (не Worker), можно использовать файл `functions/api/run.js` — он работает как Pages Function внутри Pages-проекта.

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
- **GitHub Pages** — статический хостинг
- **Cloudflare Worker / Pages Functions** — serverless API

## Лицензия

MIT
