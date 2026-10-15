# Roam 仓库与网址迁移

2026-10-15，用户明确要求将 GitHub 仓库 `Powell-Wu/citywalk` 改为 `Powell-Wu/roam`，并一起迁移网站。

## 迁移结果

- 仓库目标：<https://github.com/Powell-Wu/roam>。
- 网站目标：<https://powell-wu.github.io/roam/>。
- Vite、资源检查、测试服务与发布脚本采用新地址。
- 旧网站地址不会由 GitHub 自动跳转；书签改用新网址。仓库旧链接由 GitHub 跳转。
- `package.json` 内部名称、环境变量、IndexedDB `citywalk-for-two/state/current`、存储 key 和跨标签频道保留。
- manifest `id` 显式固定为 `/citywalk/`，使有效应用身份与旧站一致；`start_url`、`scope` 仍为 `./`，在新网址解析为 `/roam/`。
- 新站离线缓存采用 `roam-static-`，旧 worker 无法清理新站缓存；新 worker 保留 `citywalk-static-` 旧缓存。旧路径标签仍打开时，新站暂缓写入，关闭旧标签即可继续。

同一浏览器、同一 HTTPS 域名下，两个路径访问同一 IndexedDB/localStorage。同一标签从旧路径进入新路径也会保留 sessionStorage 表单草稿。主屏幕图标的入口更新仍受实际手机浏览器的 PWA 更新机制影响。

## 验证

迁移从发布基线 `957be6c` 的独立工作区实现，本机尚未提交的产品功能没有随此次迁移发布。

- 类型检查：0 错误、0 警告。
- 单元测试：81/81 通过，包含跨路径写入保护与缓存保留。
- 生产构建、递归资源与完整离线缓存检查通过。
- 浏览器主要流程 25/25 通过，组件卸载、四组主题尺寸和发布版 v2 → v3 升级检查通过。
- 旧 `/citywalk/` 到新 `/roam/` 的独立浏览器检查通过：存档、偏好、自定义卡、花费草稿保留，旧标签写入保护、新旧缓存隔离、原 PWA id 与离线完成均通过，页面错误为 0。
- 候选内容版本 `r-064b9f63ed8e`，34 个静态文件，共 1,039,704 字节，符合 1 MiB 预算。

GitHub 重命名行为参考：[Renaming a repository](https://docs.github.com/en/repositories/creating-and-managing-repositories/renaming-a-repository)。
