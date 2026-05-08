/**
 * Vercel Serverless Function — отдаёт feed.yml из GitHub репозитория.
 *
 * Переменные окружения (Vercel → Settings → Environment Variables):
 *   GITHUB_OWNER — владелец репозитория
 *   GITHUB_REPO  — имя репозитория
 */

export default async function handler(req, res) {
  const owner = process.env.GITHUB_OWNER;
  const repo = process.env.GITHUB_REPO;

  if (!owner || !repo) {
    res.status(500).send('GITHUB_OWNER и GITHUB_REPO не настроены');
    return;
  }

  const rawUrl = `https://raw.githubusercontent.com/${owner}/${repo}/main/feed.yml`;

  try {
    const response = await fetch(rawUrl);

    if (!response.ok) {
      res.status(404).send('feed.yml не найден');
      return;
    }

    const body = await response.text();
    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=60');
    res.status(200).send(body);
  } catch (err) {
    res.status(500).send('Ошибка: ' + err.message);
  }
}
