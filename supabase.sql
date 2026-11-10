-- 在 Supabase 后台 → SQL Editor 里整段粘贴运行一次即可

-- 菜品表
create table if not exists dishes (
  id           bigint generated always as identity primary key,
  name         text not null,
  description  text default '',
  category     text default '',
  image_url    text default '',
  spicy_option boolean default true,   -- 这道菜能不能选辣度
  active       boolean default true,   -- 是否上架
  sort_order   int default 0,
  created_at   timestamptz default now()
);

-- 订单表
create table if not exists orders (
  id            bigint generated always as identity primary key,
  customer_name text not null,
  note          text default '',
  meal_time     text default '',
  items         jsonb not null,        -- [{dish_id, name, qty, spice}]
  done          boolean default false,
  created_at    timestamptz default now()
);

-- 打开行级安全且不建任何规则：外人拿公开 key 也读写不了，
-- 只有部署在 Vercel 上的接口（用 service_role key）能访问。
alter table dishes enable row level security;
alter table orders enable row level security;

-- 存放菜品照片的公开图床
insert into storage.buckets (id, name, public)
values ('dishes', 'dishes', true)
on conflict (id) do nothing;

-- 几道示例菜，可以在管理页里改掉或删掉
insert into dishes (name, description, category, spicy_option, sort_order) values
  ('麻婆豆腐', '嫩豆腐配牛肉末，麻辣下饭', '家常菜', true, 1),
  ('可乐鸡翅', '甜口，小朋友最爱', '家常菜', false, 2),
  ('番茄炒蛋', '国民下饭菜', '家常菜', false, 3);
