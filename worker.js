/**
 * Cloudflare Worker — API для ручного запуска скрапера через GitHub Actions.
 *
 * Deploy:
 *   1. Откройте Cloudflare Dashboard → Workers & Pages → Create Worker
 *   2. Вставьте этот код
 *   3. Добавьте переменные окружения (Settings → Variables):
 *      GITHUB_TOKEN — Personal Access Token с правами repo и workflow
 *      GITHUB_OWNER — владелец репозитория
 *      GITHUB_REPO  — имя репозитория
 *
 * Routes:
 *   POST /api/run  → триггерит workflow_dispatch
 *   OPTIONS /api/run → CORS preflight
 */

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
      });
    }

    // Разрешаем только POST /api/run
    if (request.method !== 'POST' || url.pathname !== '/api/run') {
      return jsonResponse(
        { success: false, error: 'Not found. Use POST /api/run' },
        404
      );
    }

    const token = env.GITHUB_TOKEN;
    const owner = env.GITHUB_OWNER;
    const repo = env.GITHUB_REPO;

    if (!token || !owner || !repo) {
      return jsonResponse(
        { success: false, error: 'Server misconfiguration: missing GITHUB_TOKEN, GITHUB_OWNER or GITHUB_REPO' },
        500
      );
    }

    try {
      const ghResponse = await fetch(
        `https://api.github.com/repos/${owner}/${repo}/actions/workflows/scraper.yml/dispatches`,
        {
          method: 'POST',
          headers: {
            Accept: 'application/vnd.github+json',
            Authorization: `Bearer ${token}`,
            'X-GitHub-Api-Version': '2022-11-28',
            'Content-Type': 'application/json',
            'User-Agent': 'yml-scraper-cf-worker',
          },
          body: JSON.stringify({ ref: 'main' }),
        }
      );

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
  },
};

function jsonResponse(body, status) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
  });
}
