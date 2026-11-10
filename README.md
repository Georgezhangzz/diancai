# 私房菜点菜网站：部署说明

朋友打开链接 → 选菜和辣度 → 提交 → 你的微信马上收到订单。
你自己在 `/admin.html` 添加新菜、上传照片、查看订单。

全部用免费服务，不需要买服务器，照着做大约 20 分钟。

## 文件说明

| 文件 | 作用 |
|---|---|
| `index.html` | 朋友看到的点菜页 |
| `admin.html` | 你的管理后台（需要密码） |
| `api/` | 后端接口（Vercel 自动部署） |
| `supabase.sql` | 建数据库表的脚本，运行一次 |

---

## 第 1 步：Supabase（存菜单、订单、照片）

1. 打开 https://supabase.com ，用 GitHub 登录，点 **New project**。名字随便填，Region 选 **Sydney** 或离朋友近的地区，记下数据库密码。
2. 项目建好后，左侧点 **SQL Editor** → **New query**，把 `supabase.sql` 的全部内容粘贴进去，点 **Run**。会建好菜品表、订单表、照片存储，并加 3 道示例菜。
3. 记下两样东西：
   - **Project URL**：在 **Project Settings → Data API**（或者点顶部的 **Connect** 按钮）里，类似 `https://abcdxyz.supabase.co`
   - **Secret key**：在 **Project Settings → API Keys** 页面的 **Secret keys** 区域，`default` 那一行以 `sb_secret_` 开头。先点眼睛图标显示完整内容，再点复制。
   ⚠️ 这个 key 权限很大，只填到 Vercel 里，不要发给别人，也不要写进网页。上面那个 `sb_publishable_` 不是我们要用的。

## 第 2 步：Server酱（推送到微信）

1. 打开 https://sct.ftqq.com ，用微信扫码登录。
2. 按页面提示关注公众号，消息就是通过它发到你微信的。
3. 在 **SendKey** 页面复制你的 SendKey，一般以 `SCT` 开头。
4. 可以在网页上点“发送测试消息”，确认微信能收到。

> 免费版每天的推送条数有限，朋友之间点菜一般够用。订单就算没推送成功，也会存在后台，在 `/admin.html` 里都能看到。

## 第 3 步：上传代码到 GitHub

1. 打开 https://github.com/new ，新建一个仓库（比如叫 `diancai`），选 **Private** 也可以。
2. 在新仓库页面点 **uploading an existing file**，把解压后的**所有文件和 `api` 文件夹**一起拖进去，点 **Commit changes**。
   请确认仓库里能看到 `api/order.js` 这样的路径，不要把文件都摊平到根目录。

## 第 4 步：Vercel（让网页上线）

1. 打开 https://vercel.com ，用 GitHub 登录，点 **Add New → Project**，选刚才的仓库，点 **Import**。
2. **Framework Preset** 选 **Other**，其他保持默认。
3. 展开 **Environment Variables**，添加 4 个变量：

   | Name | Value |
   |---|---|
   | `SUPABASE_URL` | 第 1 步的 Project URL |
   | `SUPABASE_SERVICE_KEY` | 第 1 步的 Secret key（`sb_secret_...`） |
   | `ADMIN_PASSWORD` | 自己设一个后台密码 |
   | `SERVERCHAN_KEY` | 第 2 步的 SendKey |

4. 点 **Deploy**，等 1 分钟左右，会得到一个类似 `https://diancai-xxx.vercel.app` 的网址。

## 第 5 步：开始用

- **发给朋友**：`https://你的网址.vercel.app`
- **你的后台**：`https://你的网址.vercel.app/admin.html`，输入 `ADMIN_PASSWORD`

建议先在后台删掉示例菜，加上你自己的菜和照片，再自己下一单试试，确认微信能收到。

### 常见调整

- **改网页标题**：打开 `index.html`，找到 `const KITCHEN_NAME = '我的小厨房';`，改成你想要的名字，然后重新上传。Vercel 会自动重新部署。
- **改了环境变量**：需要在 Vercel 项目的 **Deployments** 里点最新一次部署右边的 **⋯ → Redeploy** 才会生效。
- **某道菜不需要辣度**：在后台编辑这道菜，取消勾选“这道菜可以选辣度”。
- **暂时不做某道菜**：点“下架”，朋友就看不到了，之后还能再上架。

### 出问题时

- **菜单加载不出来**：多半是 `SUPABASE_URL` 或 `SUPABASE_SERVICE_KEY` 填错了，或者第 1 步的 SQL 没有运行。
- **能下单但微信没收到**：检查 `SERVERCHAN_KEY`，也可能是当天的免费额度用完了。订单仍然在后台。
- **朋友在中国大陆打不开**：`vercel.app` 域名在大陆有时访问不稳定。可以在 Vercel 绑定一个自己的域名来改善。
