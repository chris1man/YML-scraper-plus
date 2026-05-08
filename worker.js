/**
 * Cloudflare Worker — единая точка входа для YML Feed Scraper.
 *
 * Маршруты:
 *   GET /         → HTML-страница со статистикой и кнопкой запуска
 *   GET /feed.yml → отдаёт текущий feed.yml из репозитория
 *   POST /api/run → запускает обновление фида через GitHub Actions
 *
 * Переменные окружения (wrangler.toml или Cloudflare Dashboard):
 *   GITHUB_OWNER — владелец репозитория (например, your-login)
 *   GITHUB_REPO  — имя репозитория (например, YML-scraper-plus)
 *   GITHUB_TOKEN — Personal Access Token с правами repo и workflow
 */

// HTML главной страницы — встроен напрямую, чтобы Worker мог отдать его без Pages
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
            border: none;
            padding: 12px 24px;
            border-radius: 8px;
            font-size: 16px;
            cursor: pointer;
            transition: background 0.2s;
            text-decoration: none;
        }
        .btn:hover { background: #1d4ed8; }
        .btn:disabled { background: #93c5fd; cursor: not-allowed; }
        .btn-secondary { background: #10b981; }
        .btn-secondary:hover { background: #059669; }
        .actions { display: flex; gap: 12px; flex-wrap: wrap; margin-bottom: 16px; }
        .status { padding: 12px; border-radius: 8px; font-size: 14px; display: none; }
        .status.info { background: #dbeafe; color: #1e40af; display: block; }
        .status.success { background: #d1fae5; color: #065f46; display: block; }
        .status.error { background: #fee2e2; color: #991b1b; display: block; }
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
        .spinner {
            width: 16px; height: 16px;
            border: 2px solid #fff;
            border-top-color: transparent;
            border-radius: 50%;
            animation: spin 0.8s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        .footer { text-align: center; color: #94a3b8; font-size: 12px; margin-top: 24px; }
    </style>
</head>
<body>
    <div class="container">
        <h1>YML Feed Scraper</h1>
        <p class="subtitle">Статистика фида и управление обновлением</p>
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
                <button class="btn" id="updateBtn">
                    <span>Запустить скрапер</span>
                </button>
                <a class="btn btn-secondary" href="/feed.yml" target="_blank">Открыть feed.yml</a>
            </div>
            <div class="status" id="status"></div>
        </div>
        <div class="footer">
            Обновляется автоматически каждый день в 06:00 по Москве
        </div>
    </div>
    <script>
        const btn = document.getElementById('updateBtn');
        const status = document.getElementById('status');

        async function loadStats() {
            try {
                const response = await fetch('/feed.yml');
                const xml = await response.text();
                if (xml && xml.length > 50) {
                    updateStats(xml);
                }
            } catch (e) {
                console.error('Не удалось загрузить feed.yml:', e);
            }
        }

        function updateStats(xml) {
            const offers = (xml.match(/<offer /g) || []).length;
            const cats = (xml.match(/<category /g) || []).length;
            const dateMatch = xml.match(/<yml_catalog date="([^"]+)"/);
            const dateStr = dateMatch ? dateMatch[1] : '—';

            document.getElementById('offerCount').textContent = offers;
            document.getElementById('catCount').textContent = cats;
            document.getElementById('lastUpdate').textContent = dateStr;
        }

        btn.addEventListener('click', async () => {
            btn.disabled = true;
            btn.innerHTML = '<div class="spinner"></div><span>Запуск...</span>';
            status.className = 'status info';
            status.textContent = 'Отправлен запрос на запуск скрапера. Это может занять несколько минут...';

            try {
                const response = await fetch('/api/run', { method: 'POST' });
                let data;
                const contentType = response.headers.get('content-type') || '';
                if (contentType.includes('application/json')) {
                    data = await response.json();
                } else {
                    const text = await response.text();
                    data = { success: response.ok, message: text };
                }

                if (response.ok && data.success) {
                    status.className = 'status success';
                    status.textContent = 'Скрапер успешно запущен! Фид будет обновлен через несколько минут. Обновите страницу позже.';
                } else {
                    status.className = 'status error';
                    status.textContent = 'Ошибка: ' + (data.error || data.message || 'Не удалось запустить скрапер');
                }
            } catch (err) {
                status.className = 'status error';
                status.textContent = 'Ошибка сети: ' + err.message;
            }

            btn.disabled = false;
            btn.innerHTML = '<span>Запустить скрапер</span>';
        });

        loadStats();
    </script>
</body>
</html>`;

// CORS-заголовки для всех ответов
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

/**
 * Возвращает JSON-ответ с CORS-заголовками
 */
function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...CORS_HEADERS,
    },
  });
}

/**
 * Формирует URL для получения сырого файла из GitHub
 */
function getRawGitHubUrl(env, path) {
  return `https://raw.githubusercontent.com/${env.GITHUB_OWNER}/${env.GITHUB_REPO}/main/${path}`;
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const pathname = url.pathname;

    // CORS preflight — для всех маршрутов
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    // GET / → главная страница со статистикой
    if (request.method === 'GET' && pathname === '/') {
      return new Response(INDEX_HTML, {
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
          ...CORS_HEADERS,
        },
      });
    }

    // GET /feed.yml → отдаём фид из GitHub
    if (request.method === 'GET' && pathname === '/feed.yml') {
      try {
        const rawUrl = getRawGitHubUrl(env, 'feed.yml');
        const response = await fetch(rawUrl, {
          headers: { 'User-Agent': 'yml-scraper-worker' },
        });

        if (!response.ok) {
          return jsonResponse(
            { error: 'feed.yml не найден. Запустите скрапер через GitHub Actions.' },
            404
          );
        }

        const body = await response.text();
        return new Response(body, {
          headers: {
            'Content-Type': 'application/xml; charset=utf-8',
            ...CORS_HEADERS,
          },
        });
      } catch (err) {
        return jsonResponse({ error: 'Ошибка получения feed.yml: ' + err.message }, 500);
      }
    }

    // POST /api/run → запускаем workflow_dispatch в GitHub Actions
    if (request.method === 'POST' && pathname === '/api/run') {
      const { GITHUB_TOKEN, GITHUB_OWNER, GITHUB_REPO } = env;

      if (!GITHUB_TOKEN || !GITHUB_OWNER || !GITHUB_REPO) {
        return jsonResponse(
          { success: false, error: 'Server misconfiguration: missing GITHUB_TOKEN, GITHUB_OWNER or GITHUB_REPO' },
          500
        );
      }

      try {
        const dispatchUrl = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/actions/workflows/scraper.yml/dispatches`;
        const ghResponse = await fetch(dispatchUrl, {
          method: 'POST',
          headers: {
            Accept: 'application/vnd.github+json',
            Authorization: `Bearer ${GITHUB_TOKEN}`,
            'X-GitHub-Api-Version': '2022-11-28',
            'Content-Type': 'application/json',
            'User-Agent': 'yml-scraper-worker',
          },
          body: JSON.stringify({ ref: 'main' }),
        });

        if (ghResponse.status === 204 || ghResponse.ok) {
          return jsonResponse({ success: true, message: 'Workflow triggered successfully' }, 200);
        }

        const ghBody = await ghResponse.json().catch(() => ({}));
        return jsonResponse(
          { success: false, error: ghBody.message || `GitHub API error: ${ghResponse.status}` },
          502
        );
      } catch (err) {
        return jsonResponse({ success: false, error: err.message }, 500);
      }
    }

    // Всё остальное — 404
    return jsonResponse({ error: `Not found: ${pathname}` }, 404);
  },
};
