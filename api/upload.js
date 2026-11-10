// /api/upload  POST（管理员）：上传菜品照片
// 网页端会先把照片压缩成 JPEG（最长边 1200px），再以 base64 发过来，
// 所以不会超过 Vercel 4.5MB 的请求大小限制。
import { isAdmin, readJson, send, uploadImage } from './_lib.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return send(res, 405, { error: 'Method not allowed' });
  if (!isAdmin(req)) return send(res, 401, { error: '密码不对' });
  try {
    const { data } = await readJson(req);
    const m = /^data:(image\/(jpeg|png|webp));base64,(.+)$/.exec(data || '');
    if (!m) return send(res, 400, { error: '图片格式不支持' });
    const buffer = Buffer.from(m[3], 'base64');
    if (buffer.length > 3.5 * 1024 * 1024) return send(res, 400, { error: '图片太大了' });
    const ext = m[2] === 'jpeg' ? 'jpg' : m[2];
    const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const url = await uploadImage(buffer, m[1], filename);
    return send(res, 200, { url });
  } catch (e) {
    return send(res, 500, { error: e.message });
  }
}
