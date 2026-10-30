# 登录与评论配置指南（Supabase Auth + Giscus）

本文介绍如何为本站配置**登录/注册（Supabase Auth）**与**评论系统（Giscus）**。完成后本站支持
邮箱密码、邮箱 Magic Link、Google 一键登录，以及基于 GitHub Discussions 的评论区。

- 线上地址：<https://wanghui-blog.pages.dev>
- 源码仓库：<https://github.com/wanghui0648-rgb/blog>

---

## 一、Supabase 项目配置

### 1. 创建项目

1. 打开 <https://supabase.com>，用 GitHub 账号登录（没有就注册）。
2. 点击 **New project**，填写：
   - **Name**：随意，例如 `wanghui-blog`。
   - **Database Password**：设置一个强密码并**妥善保存**（后续重置数据库时才用得到）。
   - **Region**：选择离你/读者最近的区域，例如 `Southeast Asia (Singapore)`。
3. 点击 **Create new project**，等待 1~2 分钟初始化完成。

### 2. 拿到 API 密钥

进入项目 → 左侧 **Project Settings（齿轮） → API**，记下两个值：

- **Project URL**：形如 `https://<ref>.supabase.co`
- **Project API keys → `anon` `public`**：一长串 JWT，这是**公开**的匿名密钥。

这两个值稍后要填到 `.env.local`（本地）和 GitHub Secrets（线上构建）里：

```
VITE_SUPABASE_URL=https://<ref>.supabase.co
VITE_SUPABASE_ANON_KEY=<anon public key>
```

> `anon` key 是设计上给前端用的公开密钥，可以放心暴露在浏览器里。
> **绝对不要**把 `service_role` key 放到前端或任何 `VITE_` 变量中（它拥有绕过 RLS 的最高权限）。

---

## 二、开启登录方式（Authentication → Providers）

进入左侧 **Authentication → Providers**（旧版 UI 在 **Authentication → Sign In / Providers**）。

### 1. Email（邮箱密码 / Magic Link）

- 找到 **Email**，确认已 **Enable**。
- **Enable Email provider**：允许邮箱 + 密码注册/登录。
- **Confirm email**：建议开启（新用户需点邮件里的确认链接后才能登录）。
- **Email OTP / Magic Link**：如需「邮箱验证码 / 免密登录」，保持开启即可，前端发起
  `signInWithOtp` 时会给用户发一封带链接的邮件。

> 若测试阶段收不到确认邮件，可在同一页面临时关闭 **Confirm email**，或用 Supabase
> 内置的测试邮箱；正式环境建议保持开启，并配置自己的 SMTP（**Project Settings → Auth → SMTP**）。

### 2. Google 登录（OAuth）

#### a) 在 Google Cloud Console 创建 OAuth 客户端

1. 打开 <https://console.cloud.google.com>，新建或选择一个项目。
2. 左侧 **APIs & Services → OAuth consent screen**，配置同意屏幕：
   - User Type 选 **External**，填写应用名、支持邮箱、开发者邮箱即可保存。
3. 左侧 **APIs & Services → Credentials → Create Credentials → OAuth client ID**：
   - Application type 选 **Web application**。
   - **Authorized redirect URIs** 填 Supabase 提供的回调地址：
     ```
     https://<ref>.supabase.co/auth/v1/callback
     ```
     > `<ref>` 就是你的 Supabase 项目 ref（Project URL 里 `https://` 和 `.supabase.co` 中间那段）。
     > 这个回调地址在 **Supabase → Authentication → Providers → Google** 页面上也会直接显示，可复制粘贴，避免手误。
   - 创建后记下 **Client ID** 与 **Client Secret**。

#### b) 把 Client ID / Secret 填进 Supabase

1. 回到 **Supabase → Authentication → Providers → Google**，点击 **Enable**。
2. 粘贴上一步的 **Client ID** 和 **Client Secret**，保存。

#### c) 配置 Supabase 的 URL（非常关键）

进入 **Authentication → URL Configuration**：

- **Site URL**：填本站主域名，例如 `https://wanghui-blog.pages.dev`。
- **Redirect URLs**：把所有允许的回调地址加进来（每行一个），至少包含本站登录页：
  ```
  https://wanghui-blog.pages.dev/login/
  http://localhost:8080/login/
  ```
  > 本地开发端口以 `npm run docs:dev` 实际输出为准（默认 8080）。
  > 若这里没配全，OAuth / Magic Link 登录完成后会被 Supabase 拒绝跳转，报
  > 「redirect_uri mismatch」或直接回到 Site URL。

---

## 三、本地开发

### 1. 准备 `src/.env.local`

> ⚠️ 本项目用 `vuepress build src` 构建，Vite 以 **`src` 为根目录**，所以 `.env.local`
> 必须放在 **`src/` 下**（放仓库根目录不会生效）。

把仓库根目录的示例文件复制到 `src/` 并填入真实值（`.env.local` 已被 `.gitignore` 忽略，不会提交）：

```bash
cp .env.example src/.env.local
```

编辑 `src/.env.local`：

```
VITE_SUPABASE_URL=https://<ref>.supabase.co
VITE_SUPABASE_ANON_KEY=<anon public key>
```

> ⚠️ Vite 只会把 **`VITE_` 前缀**的变量注入到浏览器端，而且是在**构建/启动时写死**的。
> 改了 `src/.env.local` 后需要**重启** `npm run docs:dev` 才会生效。
>
> 💡 Supabase 新版控制台给的 `sb_publishable_...`（publishable key）就等价于旧版的
> `anon public key`，直接填到 `VITE_SUPABASE_ANON_KEY` 即可，同样是可公开的前端密钥。

### 2. 启动

```bash
npm install
npm run docs:dev      # 默认 http://localhost:8080
```

打开 `http://localhost:8080/login/` 测试邮箱/Google 登录是否正常。

---

## 四、线上部署（Cloudflare Pages + GitHub Actions）

本站通过 GitHub Actions 构建后由 Wrangler 直传 Cloudflare Pages。因为环境变量在**构建时烘焙**进产物，
所以必须在 CI 构建那一步注入。

### 1. 在 GitHub 仓库配置 Secrets

进入仓库 **Settings → Secrets and variables → Actions → New repository secret**，添加：

| Secret 名称 | 值 |
| --- | --- |
| `VITE_SUPABASE_URL` | 你的 Project URL，如 `https://<ref>.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | 你的 anon public key |

（部署本身还需要已有的 `CLOUDFLARE_API_TOKEN`、`CLOUDFLARE_ACCOUNT_ID`。）

### 2. 在 deploy.yml 构建步骤注入 env

`.github/workflows/deploy.yml` 的 **Build site** 步骤已经加了如下 `env`，让 Vite 在构建时拿到变量：

```yaml
      - name: Build site
        run: npm run docs:build
        env:
          VITE_SUPABASE_URL: ${{ secrets.VITE_SUPABASE_URL }}
          VITE_SUPABASE_ANON_KEY: ${{ secrets.VITE_SUPABASE_ANON_KEY }}
```

> 只加在「Build site」，不要动「Deploy to Cloudflare Pages」那一步。
> 推送 `main` 后 Actions 会自动重新构建；记得在 **Supabase → Authentication → URL Configuration**
> 里把 `https://wanghui-blog.pages.dev/login/` 加进 Redirect URLs。

---

## 五、评论区（Giscus）

Giscus 基于 GitHub Discussions 存储评论，访问者用 GitHub 账号登录即可评论。

### 1. 仓库开启 Discussions

进入 GitHub 仓库 **Settings → General → Features**，勾选 **Discussions**。

### 2. 安装 giscus App

打开 <https://github.com/apps/giscus>，点击 **Install**，选择本仓库
`wanghui0648-rgb/blog` 并授权。

### 3. 生成配置参数

打开 <https://giscus.app>，按提示填写：

- **Repository**：`wanghui0648-rgb/blog`（需满足：公开仓库、已装 giscus app、已开 Discussions）。
- **Discussion category**：选一个分类，例如 **Announcements**（建议选只有维护者能新建 Discussion 的分类，
  避免读者随意开新帖）。
- **Mapping**：一般选 `pathname`（按页面路径映射 Discussion）。
- 页面下方会生成一段配置，里面有四个关键值：`repo`、`repoId`、`category`、`categoryId`。

### 4. 填进主题配置

把上面四个值填入 `src/.vuepress/theme.ts` 里的 `plugins.comment` 配置。
⚠️ 注意：在本站使用的 theme-hope 版本中，`comment` **必须放在 `plugins` 对象内部**，
放在顶层会被静默忽略、评论区不会显示。示意：

```ts
plugins: {
  blog: true,
  comment: {
    provider: "Giscus",
    repo: "wanghui0648-rgb/blog",
    repoId: "R_kgDOVbeE7g",
    category: "Announcements",
    categoryId: "DIC_kwDOVbeE7s4DJ9t-",
    mapping: "pathname",
  },
}
```

保存后重新 `npm run docs:dev` / 重新构建即可看到每篇文章底部的评论区。

---

## 六、安全说明

- **anon key 是公开的**：`VITE_SUPABASE_ANON_KEY` 会出现在前端产物里，这是设计如此，不必惊慌。
- **真正的安全靠 RLS**：所有数据访问都由 Supabase 的**行级安全策略（Row Level Security）**把关。
  务必在每张表上 `enable row level security` 并写好策略（例如：所有人可读、仅本人可写自己的记录）。
- **绝不放 service_role**：`service_role` key 拥有绕过 RLS 的最高权限，只能放在服务端（如 Edge Function），
  **永远不要**写进前端、`VITE_` 变量或提交到仓库。
- **密钥泄露处理**：若 anon key 之外的东西（如 service_role 或 Google Client Secret）疑似泄露，
  立即到对应控制台**轮换/重置**。
- **环境文件**：`.env.local` 已被 `.gitignore` 忽略；只提交不含真实值的 `.env.example`。
