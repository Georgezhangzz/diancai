// /api/orders
//   GET              管理员：最近的订单
//   PATCH ?id=xx     管理员：标记完成 / 未完成  body: { done: true }
import { db, isAdmin, readJson, send } from './_lib.js';

export default async function handler(req, res) {
  if (!isAdmin(req)) return send(res, 401, { error: '密码不对' });
  try {
    if (req.method === 'GET') {
      const rows = await db('orders?select=*&order=created_at.desc&limit=100');
      return send(res, 200, rows);
    }
    if (req.method === 'PATCH') {
      const id = new URL(req.url, 'http://x').searchParams.get('id');
      if (!id || !/^\d+$/.test(id)) return send(res, 400, { error: '缺少订单 id' });
      const { done } = await readJson(req);
      const rows = await db(`orders?id=eq.${id}`, {
        method: 'PATCH', body: { done: Boolean(done) }, prefer: 'return=representation',
      });
      return send(res, 200, rows[0] || null);
    }
    return send(res, 405, { error: 'Method not allowed' });
  } catch (e) {
    return send(res, 500, { error: e.message });
  }
}
