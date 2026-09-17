# CityWalk

使用网址：https://powell-wu.github.io/citywalk/

## 发布更新

修改根目录的网页文件并提交到 main，GitHub Actions 的 **Publish CityWalk** 会自动生成内容版本号并发布。无需手动修改 sw.js 的缓存版本。

在仓库 Actions → Publish CityWalk → Run workflow 可以手动重新发布。Pages 的 Source 使用 GitHub Actions。运行变绿后才表示发布成功；GitHub Release 本身不会替代网页部署。

## 手机接收更新

网页在打开、回到前台、恢复网络和前台每 15 分钟检查更新。新版下载完成后出现提示，点击“应用更新”刷新，不会在散步中强制刷新。

设置 → 版本与更新：随时点击“检查更新”；检测到新版后点击“应用更新并刷新”。散步进度、积分、皮肤、历史记录保留；正常浏览器环境下也会暂存并恢复当前表单草稿。

第一次从没有更新入口的旧版升级：联网打开网站，等待下载，关闭所有 CityWalk 网页标签及主屏幕应用，再重新打开。如果依然没有更新入口，稍后重试。不要清除网站数据，以免丢失仅保存在本机的记录。

## 本地构建检查

需要 Node.js 24，不需要安装 npm 依赖：

```
node scripts/stage-pages.mjs
```

生成的 `_site` 是部署产物。用户使用网页版无需安装 Node.js。
