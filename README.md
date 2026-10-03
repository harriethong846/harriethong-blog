# Harriet Visual Site Editor

一个可直接托管在 GitHub Pages 上的个人网站和可视化编辑器。没有数据库，也没有构建依赖。

## 已实现

- 直接点击画布编辑网站标题、导航、标题、正文、引用及图片说明
- 添加、删除和移动内容区块
- 添加左侧或右侧侧边栏
- 个人主页、文章手记、极简档案三套模板
- 添加和重命名页面
- 调整主题色、背景、卡片色、文字色及字体风格
- 浏览器自动保存、JSON 备份与恢复
- 使用 GitHub API 将内容发布到仓库
- 响应式手机布局

## 本地打开

需要 Node.js 18 或更高版本：

```powershell
npm start
```

然后访问：

- 编辑器：<http://localhost:4173/editor/>
- 正式网站预览：<http://localhost:4173/>

不要双击 HTML 文件直接打开，因为浏览器通常会阻止网页读取 `content/site.json`。

## 放到 GitHub Pages

1. 在 GitHub 新建一个空仓库，例如 `harriethong-site`。
2. 将本项目中的全部文件提交并推送到仓库的 `main` 分支。
3. 打开仓库 **Settings → Pages**。
4. 在 **Build and deployment** 中选择 **Deploy from a branch**。
5. 选择 `main` 和 `/ (root)`，保存。
6. GitHub 会给出类似 `https://用户名.github.io/harriethong-site/` 的网址。

编辑器地址是在网站地址末尾加 `/editor/`。

## 在线编辑并发布

编辑器会将草稿自动保存到当前浏览器。要把修改发布到网站：

1. 在 GitHub 的 **Settings → Developer settings → Personal access tokens → Fine-grained tokens** 创建令牌。
2. Repository access 只选择该网站仓库。
3. Repository permissions 将 **Contents** 设为 **Read and write**。
4. 回到编辑器点击“发布到 GitHub”，填写用户名、仓库、分支和令牌。

令牌只用于调用 GitHub API，并且只保存在当前页面的内存中；关闭或刷新页面后需要重新输入。仓库目标会保存，令牌不会保存。

如果不想使用令牌，也可以点击“导出备份”，然后将生成的 JSON 文件重命名为 `site.json`，上传覆盖仓库的 `content/site.json`。

## 将 harriethong.org 从 Squarespace 改到 GitHub Pages

完成网站并确认 GitHub Pages 地址正常前，先不要更改当前 DNS。

准备切换时：

1. 将 `CNAME.example` 重命名为 `CNAME`。
2. 在 GitHub Pages 设置中将 Custom domain 设为 `www.harriethong.org`。
3. 在 WordPress.com DNS 中，把 `www` CNAME 从 `ext-cust.squarespace.com` 改为 `你的用户名.github.io`。
4. 将根域名 `@` 的四条 Squarespace A 记录替换为 GitHub Pages 官方提供的四条 A 记录。
5. 等 GitHub 显示 DNS check successful 后启用 **Enforce HTTPS**。

DNS 切换前务必再次核对 GitHub 官方文档中最新的记录值。不要删除邮箱使用的 MX 和 TXT 记录。

## 数据文件

正式网站只读取 [`content/site.json`](content/site.json)。在线编辑器中的未发布草稿存放在浏览器 localStorage 中。发布按钮会把草稿提交到这个 JSON 文件。
