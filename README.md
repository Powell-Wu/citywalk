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

### 双击一键发布

在本机项目文件夹双击 **publish.cmd**。脚本会核对仓库、检查远端是否需要同步、生成版本并运行全部测试。检查通过后显示修改文件，输入本次修改说明即可提交并推送，随后打开 GitHub Actions 结果页。直接回车可取消。

第一次使用若未配置 Git 身份，会询问提交者名称和邮箱（公开仓库推荐使用 GitHub 隐私邮箱），只保存到本仓库。若提示 GitHub 登录，请完成正常登录。

失败会停止并保留错误窗口；若提交已成功但推送失败，解决网络或登录问题后再次双击即可重试，不会重复创建相同提交。脚本不自动合并远端改动、不强制推送。它只暂存网页、测试、脚本和项目配置；本机私人笔记仍被忽略。显示“已推送”后仍需等待 Actions 变绿，才表示网站上线。

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

## 主题迭代状态

当前仅开放双人冒险，暖日散步暂时锁定，叙事卡牌不再作为独立主题。旧主题存档显示为冒险；旧备份导入会迁移主题设置，保留行程和分数。

冒险支持左滑换卡、右滑完成、回弹、出牌/补牌和完成积分反馈；按钮操作仍可使用。系统减少动态效果时停用位移动画。交互样式位于 dist/cards.css，原三张 story-*.webp 插图保留供后续美术迭代，目前不显示在卡面上。
