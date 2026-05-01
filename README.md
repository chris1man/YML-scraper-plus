# YML Scraper Plus

Скрипт для парсинга товаров и создания YML-фида для Яндекс.Маркета.

## Быстрый старт

### 1. Установка зависимостей

```bash
pip install -r requirements.txt
```

### 2. Настройка

В файле `scraper.py` измените настройки под ваш сайт:

```python
# Настройки (ИЗМЕНИТЕ ПОД ВАШ САЙТ)
CATEGORY_URL = "https://example.com/category"  # URL категории с товарами
SHOP_NAME = "My Shop"
SHOP_COMPANY = "My Company"
SHOP_URL = "https://example.com"
```

### 3. Настройка селекторов CSS

Откройте `scraper.py` и измените селекторы под ваш сайт:

```python
SELECTORS = {
    "product_links": "a.product-link",  # Ссылки на товары
    "next_page": "a.pagination-next",    # Ссылка на следующую страницу
    "title": "h1.product-title",        # Название товара
    "price": "span.price",              # Цена
    "description": "div.description",   # Описание
    "images": "img.product-image",      # Изображения
    "article": "span.article",          # Артикул
    "availability": "span.availability" # Наличие
}
```

### 4. Запуск

```bash
python scraper.py
```

После выполнения будет создан файл `feed.yml`.

## GitHub Actions

Workflow автоматически:
- Запускается каждый день в 00:00 UTC
- Запускает скрапер
- Коммитит обновленный `feed.yml`
- Публикует файл на GitHub Pages

### Настройка GitHub Pages

1. Зайдите в Settings → Pages
2. В разделе "Build and deployment" выберите "GitHub Actions"
3. После первого запуска workflow, файл будет доступен по адресу:
   `https://ВАШ_ЛОГИН.github.io/ИМЯ_РЕПОЗИТОРИЯ/feed.yml`

### Ручной запуск

В GitHub перейдите в Actions → Scraper YML Feed → Run workflow

## Структура проекта

```
├── scraper.py              # Основной скрипт скрапера
├── requirements.txt        # Зависимости Python
├── .github/
│   └── workflows/
│       └── scraper.yml     # GitHub Actions workflow
└── feed.yml               # Сгенерированный YML файл (после запуска)
```

## Основные функции

- `get_products_list()` - получение списка товаров с пагинацией
- `parse_product(url)` - парсинг отдельного товара
- `build_yml(data)` - создание YML файла
- Автоматические повторные попытки при ошибках (до 3 раз)
- Поддержка пагинации
- Сохранение ссылок на изображения (без скачивания)
- Логирование процесса
