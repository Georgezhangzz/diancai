// 共享工具：Supabase REST 调用、管理员校验、Server酱推送
// 文件名以下划线开头，Vercel 不会把它当成接口路由。

const SUPABASE_URL = (process.env.SUPABASE_URL || '').replace(/\/$/, '');
const SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || '';
export const BUCKET = 'dishes';

// 新版 secret key（sb_secret_...）不是 JWT，只能放在 apikey 头里；
// 旧版 service_role key（eyJ...）两个头都放。
function headers(extra = {}) {
  const h = { apikey: SERVICE_KEY, ...extra };
  if (!SERVICE_KEY.startsWith('sb_')) h.Authorization = `Bearer ${SERVICE_KEY}`;
  return h;
}

// 调用 Supabase 数据库（PostgREST）
export async function db(path, { method = 'GET', body, prefer } = {}) {
  if (!SUPABASE_URL || !SERVICE_KEY) throw new Error('服务器没有配置 SUPABASE_URL / SUPABASE_SERVICE_KEY');
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    method,
    headers: headers({
      'Content-Type': 'application/json',
      ...(prefer ? { Prefer: prefer } : {}),
    }),
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`数据库错误 ${res.status}: ${text}`);
  return text ? JSON.parse(text) : null;
}

// 上传图片到 Supabase Storage，返回公开链接
export async function uploadImage(buffer, contentType, filename) {
  const res = await fetch(`${SUPABASE_URL}/storage/v1/object/${BUCKET}/${filename}`, {
    method: 'POST',
    headers: headers({ 'Content-Type': contentType, 'x-upsert': 'true' }),
    body: buffer,
  });
  if (!res.ok) throw new Error(`图片上传失败 ${res.status}: ${await res.text()}`);
  return `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${filename}`;
}

export function isAdmin(req) {
  const pw = process.env.ADMIN_PASSWORD;
  return Boolean(pw) && req.headers['x-admin-password'] === pw;
}

export async function readJson(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  if (typeof req.body === 'string') return JSON.parse(req.body || '{}');
  const chunks = [];
  for await (const c of req) chunks.push(c);
  const raw = Buffer.concat(chunks).toString('utf8');
  return raw ? JSON.parse(raw) : {};
}

export function send(res, status, data) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(data));
}

// Server酱推送到微信。支持 Turbo 版 (SCT...) 和 Server酱³ (sctp...) 的 SendKey
export async function notifyWeChat(title, desp) {
  const key = process.env.SERVERCHAN_KEY;
  if (!key) return { skipped: true };
  let url = `https://sctapi.ftqq.com/${key}.send`;
  const m = key.match(/^sctp(\d+)t/i);
  if (m) url = `https://${m[1]}.push.ft07.com/send/${key}.send`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title: title.slice(0, 32), desp }),
  });
  return res.json().catch(() => ({ code: res.status }));
}
