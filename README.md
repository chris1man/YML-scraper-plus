# YML Scraper Plus

Автоматический скрапер товаров с созданием YML-фида для Яндекс.Маркета.

## Архитектура

```
GitHub Actions (каждые 10 мин / manual)  →  Python scraper  →  feed.yml (commit в main)
                                                                        ↓
                                              ┌─────────────────────────┴─────────────────────────┐
                                              ↓                                                   ↓
GitHub Pages                              Vercel
  / (index.html)                            / → index.html (статика)
  /feed.yml (из репо)                       /feed.yml → api/feed.js (fetch из GitHub raw)
```

- **GitHub Actions** — запускает `scraper.py` каждые 10 минут или вручную через вкладку Actions.
- **Python scraper** — парсит сайт и создаёт `feed.yml`.
- **GitHub Pages** — отдаёт статическую страницу и фид напрямую из репозитория.
- **Vercel** — отдаёт статику + серверлесс-функция для feed.yml (всегда свежий, без пересборки).

## Структура

```
.
├── .github/workflows/scraper.yml   # Actions: cron + manual
├── scraper.py                      # Скрапер
├── config.py                       # Настройки
├── requirements.txt                # Python-зависимости
├── index.html                      # Главная страница
├── feed.yml                        # Фид (генерируется Actions)
├── vercel.json                     # Конфиг Vercel
├── api/
│   └── feed.js                     # Serverless: отдаёт feed.yml из GitHub raw
├── .env.example                    # Пример для локального запуска
└── README.md
```

## Настройка

### 1. Secrets в GitHub

**Settings → Secrets and variables → Actions → Secrets:**

| Название       | Значение                     |
|----------------|------------------------------|
| `CATEGORY_URL` | URL страницы со всеми товарами |

**Variables** (необязательно):

| Название                 | По умолчанию              |
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

### 2. GitHub Pages (опционально)

**Settings → Pages → Source: Deploy from a branch** → ветка `main`, папка `/ (root)` → Save.

Сайт: `https://ВАШ_ЛОГИН.github.io/ИМЯ_РЕПО/`
Фид: `https://ВАШ_ЛОГИН.github.io/ИМЯ_РЕПО/feed.yml`

### 3. Vercel (опционально)

1. Зарегистрируйтесь на [vercel.com](https://vercel.com) (бесплатно).
2. **New Project** → импортируйте этот репозиторий.
3. В **Settings → Environment Variables** добавьте:

| Название       | Значение                    |
|----------------|-----------------------------|
| `GITHUB_OWNER` | Ваш логин на GitHub         |
| `GITHUB_REPO`  | Имя репозитория             |

4. Нажмите **Deploy**.

Сайт: `https://yml-scraper-plus.vercel.app/`
Фид: `https://yml-scraper-plus.vercel.app/feed.yml`

> **Важно:** Vercel не пересобирается при каждом обновлении feed.yml. Серверлесс-функция `api/feed.js` всегда забирает свежий файл напрямую из GitHub, поэтому фид обновляется без лишних билдов.

## Локальный запуск

```bash
pip install -r requirements.txt
cp .env.example .env   # укажите CATEGORY_URL
python scraper.py
```

## Лицензия

MIT
