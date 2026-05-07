import os
import sys
import logging
from io import StringIO

sys.path.append('.')

from flask import Flask, Response, render_template_string
from scraper import run_scraper

app = Flask(__name__)

# In-memory cache for feed.yml
_cached_yml = None

HTML_PAGE = r"""
<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>YML Scraper</title>
    <style>
        * { box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
            background: #f5f7fa;
            margin: 0;
            padding: 40px 20px;
            color: #333;
        }
        .container {
            max-width: 800px;
            margin: 0 auto;
        }
        h1 {
            text-align: center;
            margin-bottom: 8px;
            color: #1a1a2e;
        }
        .subtitle {
            text-align: center;
            color: #666;
            margin-bottom: 32px;
        }
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
        }
        .btn:hover { background: #1d4ed8; }
        .btn:disabled { background: #93c5fd; cursor: not-allowed; }
        .btn-secondary {
            background: #10b981;
        }
        .btn-secondary:hover { background: #059669; }
        .actions {
            display: flex;
            gap: 12px;
            flex-wrap: wrap;
            margin-bottom: 16px;
        }
        .status {
            padding: 12px;
            border-radius: 8px;
            font-size: 14px;
            display: none;
        }
        .status.info { background: #dbeafe; color: #1e40af; display: block; }
        .status.success { background: #d1fae5; color: #065f46; display: block; }
        .status.error { background: #fee2e2; color: #991b1b; display: block; }
        pre {
            background: #1e1e2e;
            color: #cdd6f4;
            padding: 16px;
            border-radius: 8px;
            overflow-x: auto;
            font-size: 13px;
            line-height: 1.5;
            max-height: 400px;
            overflow-y: auto;
        }
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
        .stat-value {
            font-size: 24px;
            font-weight: 700;
            color: #2563eb;
        }
        .stat-label {
            font-size: 12px;
            color: #64748b;
            margin-top: 4px;
        }
        .spinner {
            width: 16px;
            height: 16px;
            border: 2px solid #fff;
            border-top-color: transparent;
            border-radius: 50%;
            animation: spin 0.8s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
    </style>
</head>
<body>
    <div class="container">
        <h1>YML Feed Scraper</h1>
        <p class="subtitle">Принудительное обновление YML фида для Яндекс.Маркета</p>

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
                    <span>Обновить фид</span>
                </button>
                <a class="btn btn-secondary" href="/feed.yml" target="_blank">Открыть feed.yml</a>
            </div>

            <div class="status" id="status"></div>
        </div>

        <div class="card" id="previewCard" style="display:none;">
            <h3 style="margin-top:0;">Превью YML</h3>
            <pre id="preview"></pre>
        </div>
    </div>

    <script>
        const btn = document.getElementById('updateBtn');
        const status = document.getElementById('status');
        const previewCard = document.getElementById('previewCard');
        const preview = document.getElementById('preview');

        btn.addEventListener('click', async () => {
            btn.disabled = true;
            btn.innerHTML = '<div class="spinner"></div><span>Обновление...</span>';
            status.className = 'status info';
            status.textContent = 'Скрапер запущен. Это может занять несколько минут...';
            previewCard.style.display = 'none';

            try {
                const response = await fetch('/api/run', { method: 'POST' });
                const text = await response.text();

                if (response.ok) {
                    status.className = 'status success';
                    status.textContent = 'Фид успешно обновлен!';
                    preview.textContent = text.substring(0, 3000) + (text.length > 3000 ? '\n\n... (truncated)' : '');
                    previewCard.style.display = 'block';
                    updateStats(text);
                } else {
                    status.className = 'status error';
                    status.textContent = 'Ошибка: ' + text;
                }
            } catch (err) {
                status.className = 'status error';
                status.textContent = 'Ошибка сети: ' + err.message;
            }

            btn.disabled = false;
            btn.innerHTML = '<span>Обновить фид</span>';
        });

        function updateStats(xml) {
            const offers = (xml.match(/<offer /g) || []).length;
            const cats = (xml.match(/<category /g) || []).length;
            document.getElementById('offerCount').textContent = offers;
            document.getElementById('catCount').textContent = cats;
            document.getElementById('lastUpdate').textContent = new Date().toLocaleTimeString('ru-RU', {hour:'2-digit', minute:'2-digit'});
        }

        // Load stats on page load
        fetch('/feed.yml')
            .then(r => r.text())
            .then(xml => {
                if (xml && xml.length > 50) {
                    updateStats(xml);
                }
            })
            .catch(() => {});
    </script>
</body>
</html>
"""


@app.route('/')
def index():
    return render_template_string(HTML_PAGE)


@app.route('/feed.yml')
def feed():
    global _cached_yml
    if _cached_yml:
        return Response(
            _cached_yml,
            mimetype='application/xml; charset=utf-8',
            headers={'Content-Disposition': 'inline; filename="feed.yml"'}
        )
    return Response(
        '<?xml version="1.0" encoding="utf-8"?><yml_catalog></yml_catalog>',
        mimetype='application/xml; charset=utf-8'
    )


@app.route('/api/run', methods=['POST'])
def api_run():
    global _cached_yml

    # Capture logs
    log_stream = StringIO()
    handler = logging.StreamHandler(log_stream)
    handler.setLevel(logging.INFO)
    root = logging.getLogger()
    root.addHandler(handler)

    try:
        _cached_yml = run_scraper()
        return Response(_cached_yml, mimetype='application/xml; charset=utf-8')
    except Exception as e:
        import traceback
        return Response(f'Error: {str(e)}\n{traceback.format_exc()}', status=500, mimetype='text/plain; charset=utf-8')
    finally:
        root.removeHandler(handler)


# Vercel entry point expects `app` variable
