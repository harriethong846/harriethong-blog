# harriethong'blog

一个文档式个人博客，灵感来自技术文档站点的清晰导航，但内容、视觉和代码均为独立实现。

## 在线地址

- 网站：`https://harriethong846.github.io/harriethong-visual-editor/`
- 可视化编辑器：`https://harriethong846.github.io/harriethong-visual-editor/editor/`

## 添加文章

打开编辑器后：

1. 点击左上角 `＋` 或左侧 `新建文章`。
2. 在右侧填写标题、URL slug、日期、分类、标签、摘要和正文。
3. 打开 `发布文章` 开关。
4. 点击右上角 `发布到 GitHub`，填写 GitHub fine-grained token。

正文使用普通文字，段落之间留一个空行。文章会自动出现在首页精选/最新列表和文章页中，不需要修改代码。

## 备份

编辑器会把草稿保存在当前浏览器。需要长期保存或换设备时，在 `备份` 面板导出 JSON；恢复时导入同一个 JSON 文件。

## 本地运行

Windows 可双击 `start-editor.cmd`。或在项目目录运行：

```powershell
npm start
```

编辑器地址：`http://localhost:4173/editor/`。

## GitHub Pages

仓库的 Pages 设置应为 `Deploy from a branch`、`main`、`/(root)`。编辑器发布按钮只更新 `content/site.json`，GitHub Pages 会自动重新部署。

## harriethong.org 与子域名

当前域名仍指向 Squarespace。确认 GitHub Pages 版本正常后，再在 GitHub Pages 的 Custom domain 中填写 `www.harriethong.org`，然后把 DNS 的 `www` CNAME 改为 `harriethong846.github.io`，并按 GitHub 页面显示的 A 记录替换根域名记录。不要删除邮箱相关的 MX/TXT 记录。

建议的子域名结构：

- `www.harriethong.org`：博客首页
- `notes.harriethong.org`：以后可指向独立笔记站（可选）
- `editor.harriethong.org`：不建议公开，编辑器暂时使用 GitHub Pages 的 `/editor/` 路径即可
