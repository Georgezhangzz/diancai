// /api/dishes
//   GET              朋友看到的菜单（只返回上架的菜）
//   GET ?all=1       管理员：所有菜（含下架）
//   POST             管理员：新增菜品
//   PATCH ?id=xx     管理员：修改菜品（含上架/下架）
//   DELETE ?id=xx    管理员：删除菜品
import { db, isAdmin, readJson, send } from './_lib.js';

const FIELDS = ['name', 'description', 'category', 'image_url', 'spicy_option', 'active', 'sort_order'];

function pick(body) {
  const out = {};
  for (const f of FIELDS) if (body[f] !== undefined) out[f] = body[f];
  if (typeof out.name === 'string') out.name = out.name.trim().slice(0, 50);
  if (typeof out.description === 'string') out.description = out.description.trim().slice(0, 300);
  if (typeof out.category === 'string') out.category = out.category.trim().slice(0, 20);
  return out;
}

export default async function handler(req, res) {
  try {
    const url = new URL(req.url, 'http://x');
    const id = url.searchParams.get('id');

    if (req.method === 'GET') {
      const all = url.searchParams.get('all') === '1';
      if (all && !isAdmin(req)) return send(res, 401, { error: '密码不对' });
      const filter = all ? '' : '&active=eq.true';
      const rows = await db(`dishes?select=*${filter}&order=sort_order.asc,created_at.desc`);
      return send(res, 200, rows);
    }

    if (!isAdmin(req)) return send(res, 401, { error: '密码不对' });

    if (req.method === 'POST') {
      const data = pick(await readJson(req));
      if (!data.name) return send(res, 400, { error: '菜名不能为空' });
      const rows = await db('dishes', { method: 'POST', body: data, prefer: 'return=representation' });
      return send(res, 200, rows[0]);
    }

    if (!id || !/^\d+$/.test(id)) return send(res, 400, { error: '缺少菜品 id' });

    if (req.method === 'PATCH') {
      const data = pick(await readJson(req));
      const rows = await db(`dishes?id=eq.${id}`, { method: 'PATCH', body: data, prefer: 'return=representation' });
      return send(res, 200, rows[0] || null);
    }

    if (req.method === 'DELETE') {
      await db(`dishes?id=eq.${id}`, { method: 'DELETE' });
      return send(res, 200, { ok: true });
    }

    return send(res, 405, { error: 'Method not allowed' });
  } catch (e) {
    return send(res, 500, { error: e.message });
  }
}
