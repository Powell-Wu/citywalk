# 一起走走 · CityWalk

使用网址：https://powell-wu.github.io/citywalk/

## 只在一个目录开发

本机日常开发目录：`D:\Documents\Codex\citywalk-app`。
它直接连接 GitHub 仓库 `Powell-Wu/citywalk`，本地与 GitHub 使用相同结构：

- `dist/`：网页源码、卡片和图片；日常功能修改在这里。
- `tests/`：自动测试。
- `scripts/`：版本生成和检查。
- `.github/workflows/pages.yml`：自动发布流程。

`dist` 在这个项目中就是受版本控制的网页源文件，不是可随意删除的临时构建目录。

## 修改与发布

仍然在本地修改文件。保存文件不会自动上传；通过 Git 提交和推送，才会把改动送到 GitHub。

首次配置开发环境需要 Node.js 24，然后运行 `npm ci`。已配置的本机无需每次安装。

修改前同步：

```powershell
git pull --ff-only
```

修改完成后检查并发布（在 citywalk-app 中运行）：

```powershell
npm run release
npm test
npm run check
git add dist tests scripts .github package.json package-lock.json README.md .gitignore
git commit -m "feat: update CityWalk"
git push origin main
```

每一步成功后再执行下一步。也可以让开发助手完成检查、提交和推送，无需手动把 dist 拖到 GitHub。

推送到 main 后，GitHub Actions 的 **Publish CityWalk** 自动安装测试依赖、生成内容版本、运行测试与检查，再将 **dist 内容**发布至原网址。测试失败就停止发布，线上继续使用前一版本。仅在本地保存、仅创建 GitHub Release，都不会触发本流程。

在 GitHub → Actions → Publish CityWalk 查看结果；绿色表示发布成功，也可点 Run workflow 手动重新部署 GitHub 当前代码。该按钮不会上传电脑中尚未推送的改动。

## 手机更新

打开网页、返回前台、恢复网络及前台每15分钟会检查更新。设置 → 版本与更新可手动检查，下载完成后点击应用更新。更新不强制中断散步，保留本机记录并暂存当前表单草稿。

第一次从旧版升级：联网打开等待下载，关闭所有 CityWalk 标签页和主屏幕应用后重开。不要清除网站数据。重要记录可在设置中导出备份。

## 本机预览

```powershell
python -m http.server 5187 --bind 127.0.0.1 --directory dist
```

浏览器打开 http://127.0.0.1:5187/ 。手机使用正式网址，无需安装 Node.js 或 Python。
