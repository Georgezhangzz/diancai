// /api/order  POST：朋友提交订单 → 存数据库 → 推送到你的微信
import { db, notifyWeChat, readJson, send } from './_lib.js';

const SPICE = ['不辣', '微辣', '中辣', '特辣'];

export default async function handler(req, res) {
  if (req.method !== 'POST') return send(res, 405, { error: 'Method not allowed' });
  try {
    const body = await readJson(req);
    const name = String(body.name || '').trim().slice(0, 20);
    const note = String(body.note || '').trim().slice(0, 300);
    const when = String(body.when || '').trim().slice(0, 40);
    const items = Array.isArray(body.items) ? body.items.slice(0, 30) : [];

    if (!name) return send(res, 400, { error: '请填写你的名字' });
    if (!items.length) return send(res, 400, { error: '还没有选菜哦' });

    // 用数据库里的真实菜品校验，防止乱填
    const ids = [...new Set(items.map((i) => Number(i.dish_id)).filter(Number.isInteger))];
    if (!ids.length) return send(res, 400, { error: '菜品无效' });
    const dishes = await db(`dishes?select=id,name,spicy_option&active=eq.true&id=in.(${ids.join(',')})`);
    const byId = Object.fromEntries(dishes.map((d) => [d.id, d]));

    const clean = [];
    for (const it of items) {
      const d = byId[Number(it.dish_id)];
      if (!d) continue;
      const qty = Math.min(Math.max(parseInt(it.qty, 10) || 1, 1), 10);
      const spice = d.spicy_option ? (SPICE.includes(it.spice) ? it.spice : '微辣') : null;
      clean.push({ dish_id: d.id, name: d.name, qty, spice });
    }
    if (!clean.length) return send(res, 400, { error: '选的菜已经下架了，刷新一下再点吧' });

    const [order] = await db('orders', {
      method: 'POST',
      body: { customer_name: name, note, meal_time: when, items: clean },
      prefer: 'return=representation',
    });

    const lines = clean.map((c) => `- **${c.name}** ×${c.qty}${c.spice ? `（${c.spice}）` : ''}`);
    const desp = [
      `**${name}** 点了 ${clean.reduce((s, c) => s + c.qty, 0)} 份菜：`,
      '',
      ...lines,
      '',
      when ? `**想吃的时间**：${when}` : '',
      note ? `**备注**：${note}` : '',
      '',
      `订单号 #${order.id}`,
    ].filter((l, i, a) => l !== '' || a[i - 1] !== '').join('\n');

    let notified = false;
    try {
      const r = await notifyWeChat(`🍳 ${name} 点菜啦（${clean.length} 道）`, desp);
      notified = r && r.code === 0;
    } catch { /* 推送失败不影响下单，订单已存好 */ }

    return send(res, 200, { ok: true, id: order.id, notified });
  } catch (e) {
    return send(res, 500, { error: e.message });
  }
}
