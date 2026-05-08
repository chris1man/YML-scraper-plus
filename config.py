"""
Configuration for YML Scraper
All settings can be overridden by environment variables with the same name
"""

import os

# ===== ОБЯЗАТЕЛЬНЫЕ НАСТРОЙКИ =====
# URL со списком ВСЕХ товаров (должен быть задан в .env или окружении)
CATEGORY_URL = os.environ.get("CATEGORY_URL", "")

# ===== ИНФОРМАЦИЯ О МАГАЗИне =====
SHOP_NAME = os.environ.get("SHOP_NAME", "My Shop")
SHOP_COMPANY = os.environ.get("SHOP_COMPANY", "My Company")
SHOP_URL = os.environ.get("SHOP_URL", "")

# ===== HTTP НАСТРОЙКИ =====
USER_AGENT = os.environ.get(
    "USER_AGENT",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
)
SITEMAP_URL = os.environ.get("SITEMAP_URL", "")

# ===== CSS СЕЛЕКТОРЫ =====
# На странице списка товаров: ссылки на каждый товар
SELECTOR_PRODUCT_LINKS = os.environ.get("SELECTOR_PRODUCT_LINKS", "li.item a")

# На странице списка: ссылка "следующая страница" (для пагинации)
SELECTOR_NEXT_PAGE = os.environ.get("SELECTOR_NEXT_PAGE", "a.ty-pagination__next")

# На странице товара: заголовок с названием
SELECTOR_TITLE = os.environ.get("SELECTOR_TITLE", "h1.ty-product-block-title")

# На странице товара: цена (span с числом)
SELECTOR_PRICE = os.environ.get("SELECTOR_PRICE", "span.ty-price-num")

# На странице товара: описание / состав
SELECTOR_DESCRIPTION = os.environ.get("SELECTOR_DESCRIPTION", "div.kits-block")

# На странице товара: изображения (тег <a> с href на большое фото — CS-Cart)
SELECTOR_IMAGES = os.environ.get("SELECTOR_IMAGES", "a.cm-image-previewer")

# Артикул (если есть на сайте, укажите селектор)
SELECTOR_ARTICLE = os.environ.get("SELECTOR_ARTICLE", "")

# Наличие (если есть на сайте, укажите селектор)
SELECTOR_AVAILABILITY = os.environ.get("SELECTOR_AVAILABILITY", "")