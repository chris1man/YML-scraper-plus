/**
 * Cloudflare Worker — единая точка входа для YML Feed Scraper.
 *
 * Маршруты:
 *   GET /         → HTML-страница со статистикой и ссылкой на GitHub Actions
 *   GET /feed.yml → отдаёт текущий feed.yml
 *
 * Переменная окружения (wrangler secret или Dashboard):
 *   FEED_URL — полный URL к сырому feed.yml в репозитории
 *     например: https://raw.githubusercontent.com/OWNER/REPO/main/feed.yml
 */

// HTML главной страницы — встроен напрямую
const INDEX_HTML = `<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>YML Feed Scraper</title>
    <style>
        * { box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
            background: #f5f7fa;
            margin: 0;
            padding: 40px 20px;
            color: #333;
        }
        .container { max-width: 800px; margin: 0 auto; }
        h1 { text-align: center; margin-bottom: 8px; color: #1a1a2e; }
        .subtitle { text-align: center; color: #666; margin-bottom: 32px; }
        .card {
            background: #fff;
            border-radius: 12px;
            padding: 24px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.06);
            margin-bottom: 20px;
        }
        .btn {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            background: #2563eb;
            color: #fff;
            padding: 12px 24px;
            border-radius: 8px;
            font-size: 16px;
            text-decoration: none;
            transition: background 0.2s;
        }
        .btn:hover { background: #1d4ed8; }
        .btn-secondary { background: #10b981; }
        .btn-secondary:hover { background: #059669; }
        .actions { display: flex; gap: 12px; flex-wrap: wrap; margin-bottom: 16px; }
        .stats {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
            gap: 12px;
            margin-bottom: 16px;
        }
        .stat {
            background: #f8fafc;
            padding: 16px;
            border-radius: 8px;
            text-align: center;
        }
        .stat-value { font-size: 24px; font-weight: 700; color: #2563eb; }
        .stat-label { font-size: 12px; color: #64748b; margin-top: 4px; }
        .footer { text-align: center; color: #94a3b8; font-size: 12px; margin-top: 24px; }
    </style>
</head>
<body>
    <div class="container">
        <h1>YML Feed Scraper</h1>
        <p class="subtitle">Статистика фида</p>
        <div class="card">
            <div class="stats">
                <div class="stat">
                    <div class="stat-value" id="offerCount">...</div>
                    <div class="stat-label">Товаров в фиде</div>
                </div>
                <div class="stat">
                    <div class="stat-value" id="catCount">...</div>
                    <div class="stat-label">Категорий</div>
                </div>
                <div class="stat">
                    <div class="stat-value" id="lastUpdate">...</div>
                    <div class="stat-label">Последнее обновление</div>
                </div>
            </div>
            <div class="actions">
                <a class="btn" id="actionsLink" href="#" target="_blank">Открыть Actions</a>
                <a class="btn btn-secondary" href="/feed.yml" target="_blank">Открыть feed.yml</a>
            </div>
        </div>
        <div class="footer">
            Обновляется автоматически каждый день в 06:00 по Москве
        </div>
    </div>
    <script>
        async function loadStats() {
            try {
                const response = await fetch('/feed.yml');
                const xml = await response.text();
                if (xml && xml.length > 50) {
                    const offers = (xml.match(/<offer /g) || []).length;
                    const cats = (xml.match(/<category /g) || []).length;
                    const dateMatch = xml.match(/<yml_catalog date="([^"]+)"/);
                    document.getElementById('offerCount').textContent = offers;
                    document.getElementById('catCount').textContent = cats;
                    document.getElementById('lastUpdate').textContent = dateMatch ? dateMatch[1] : '—';
                }
            } catch (e) {
                console.error('Не удалось загрузить feed.yml:', e);
            }
        }
        loadStats();
    </script>
</body>
</html>`;

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const pathname = url.pathname;

    // GET / → главная страница
    if (request.method === 'GET' && pathname === '/') {
      return new Response(INDEX_HTML, {
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
      });
    }

    // GET /feed.yml → отдаём фид
    if (request.method === 'GET' && pathname === '/feed.yml') {
      const feedUrl = env.FEED_URL;
      if (!feedUrl) {
        return new Response('FEED_URL не настроен', { status: 500 });
      }

      try {
        const response = await fetch(feedUrl, {
          headers: { 'User-Agent': 'yml-scraper-worker' },
        });

        if (!response.ok) {
          return new Response('feed.yml не найден. Запустите скрапер через GitHub Actions.', {
            status: 404,
            headers: { 'Content-Type': 'text/plain; charset=utf-8' },
          });
        }

        const body = await response.text();
        return new Response(body, {
          headers: { 'Content-Type': 'application/xml; charset=utf-8' },
        });
      } catch (err) {
        return new Response('Ошибка получения feed.yml: ' + err.message, { status: 500 });
      }
    }

    // Всё остальное — 404
    return new Response('Not found: ' + pathname, { status: 404 });
  },
};
