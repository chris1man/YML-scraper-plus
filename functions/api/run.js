/**
 * Cloudflare Pages Function — API для ручного запуска скрапера через GitHub Actions.
 *
 * POST /api/run
 * Триггерит workflow_dispatch в GitHub Actions для запуска скрапера.
 *
 * Требуемые переменные окружения (Cloudflare Pages → Settings → Environment variables):
 *   GITHUB_TOKEN — Personal Access Token с правами repo и workflow
 *   GITHUB_OWNER — владелец репозитория (например, your-login)
 *   GITHUB_REPO  — имя репозитория (например, YML-scraper-plus)
 */

export async function onRequestPost(context) {
  const { request, env } = context;

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
          'User-Agent': 'yml-scraper-cf-pages',
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
}

export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}

function jsonResponse(body, status) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
  });
}
