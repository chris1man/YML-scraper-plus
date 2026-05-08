/**
 * Vercel Serverless Function — отдаёт feed.yml из GitHub репозитория.
 *
 * Переменные окружения (Vercel → Settings → Environment Variables):
 *   GITHUB_OWNER — владелец репозитория (например, your-login)
 *   GITHUB_REPO  — имя репозитория (например, YML-scraper-plus)
 *
 * GitHub Actions обновляет feed.yml каждые 10 минут,
 * эта функция всегда отдаёт свежую версию без пересборки проекта.
 */

export const config = {
  runtime: 'edge',
};

export default async function handler(request) {
  const owner = process.env.GITHUB_OWNER;
  const repo = process.env.GITHUB_REPO;

  if (!owner || !repo) {
    return new Response('GITHUB_OWNER и GITHUB_REPO не настроены', {
      status: 500,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
  }

  const rawUrl = `https://raw.githubusercontent.com/${owner}/${repo}/main/feed.yml`;

  try {
    const response = await fetch(rawUrl, {
      headers: { 'User-Agent': 'yml-scraper-vercel' },
    });

    if (!response.ok) {
      return new Response('feed.yml не найден. Запустите скрапер через GitHub Actions.', {
        status: 404,
        headers: { 'Content-Type': 'text/plain; charset=utf-8' },
      });
    }

    const body = await response.text();
    return new Response(body, {
      status: 200,
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 'public, max-age=60',
      },
    });
  } catch (err) {
    return new Response('Ошибка получения feed.yml: ' + err.message, {
      status: 500,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
  }
}
