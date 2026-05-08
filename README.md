# YML Scraper Plus

Автоматический скрапер товаров с созданием YML-фида для Яндекс.Маркета.

## Архитектура

```
GitHub Actions (каждые 10 мин / manual)  →  Python scraper  →  feed.yml (commit)
                                                                        ↓
GitHub Pages  ←  index.html (статистика)  +  /feed.yml (фид)
```

- **GitHub Actions** — запускает `scraper.py` каждые 10 минут или вручную через вкладку Actions.
- **Python scraper** — парсит сайт и создаёт `feed.yml`.
- **GitHub Pages** — отдаёт статическую страницу и фид.

## Структура

```
.
├── .github/workflows/scraper.yml   # Actions: cron + manual
├── scraper.py                      # Скрапер
├── config.py                       # Настройки
├── requirements.txt                # Python-зависимости
├── index.html                      # Главная страница (GitHub Pages)
├── feed.yml                        # Фид (генерируется Actions)
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

### 2. Включить GitHub Pages

**Settings → Pages → Source: Deploy from a branch** → ветка `main`, папка `/ (root)` → Save.

Сайт: `https://ВАШ_ЛОГИН.github.io/ИМЯ_РЕПО/`
Фид: `https://ВАШ_ЛОГИН.github.io/ИМЯ_РЕПО/feed.yml`

## Локальный запуск

```bash
pip install -r requirements.txt
cp .env.example .env   # укажите CATEGORY_URL
python scraper.py
```

## Лицензия

MIT
