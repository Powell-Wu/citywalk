# 一起走走 · CityWalk

使用网址：https://powell-wu.github.io/citywalk/

## 后续升级文档

- [执行总纲](GAME-IMPLEMENTATION-BRIEF.md)：已决策的 Svelte + TypeScript + Vite 路线、视觉规范、迁移顺序、验收要求与可复制 agent 指令。
- [命名候选](PROJECT-NAMING.md)：推荐“岔路来信”及备选；正式名称待选择，网页尚未更名。
- [既有游戏优化方案](GAME-QUALITY-PLAN.md)：当前问题与历史检查证据，产品修复要求继续适用。

总纲 A→D 的本机实现已逐步接入；阶段证据和设备待验项见 IMPLEMENTATION-PROGRESS.md 与 DEVICE-ACCEPTANCE.md。

## 开发与目录

使用 Svelte 5 + TypeScript + Vite，继续一部手机双人同行、静态托管与离线使用。依赖版本锁在 package.json/package-lock.json，优先复用 Node.js 24。

- src/main.ts、src/App.svelte：启动、hash 路由与生命周期。
- src/pages：今天、出发、任务、收藏、日志、结算和设置的 Svelte 页面。
- src/lib/components：卡牌、旅程路线、奖励预告、通行证与纪念票；组件管理自己的结构样式。
- src/lib/domain：原有卡池、计分和行程规则，首轮保留 .mjs。
- src/lib/services：IndexedDB 原子事务、草稿、显式更新和页面操作编排。
- src/styles：基础布局、纸张主题、共享动效和可访问性。
- public：参与发布的插画、图标与 manifest。
- dist：生成的生产产物，不再直接编辑或提交；_site 为迁移对照产物。
- tests、scripts：业务与迁移测试、浏览器验收、构建和一键发布。

迁移基线为提交 5c32ee0 / r-4bf7cbb6ae14。原 dist 的42个文件逐一登记在 MIGRATION-INVENTORY.md；源码/资源进入 src/public，旧入口和版本文件由构建生成。未使用的 story 图片仍在本机 assets/archive/legacy-story，不进入发布。

## 本机预览与检查

首次或依赖变更后运行 npm ci。Windows 重装依赖时先关闭本项目的 Vite dev/preview，以免原生构建文件被占用。日常开发运行 npm run dev，打开终端给出的 /citywalk/ 地址。开发预览停用 Service Worker；离线和更新测试使用生产构建。

```powershell
npm run typecheck
npm test
npm run build
npm run check
npm run test:e2e
npm run preview
```

逐条执行，前一步失败先处理。npm run release 兼容旧命令，并完成同一套 Vite 构建、递归版本与缓存生成。npm run check 只检查已有产物，不修改文件。npm run test:browser 是 test:e2e 的兼容入口。

浏览器验收默认使用本机 Edge 和项目内 Playwright，自动启动隔离的 /citywalk/ 静态服务，不需要手工启动预览。CI 使用 Chromium；其他电脑可先运行 npx playwright install chromium 并设置 CITYWALK_TEST_BROWSER=chromium。CITYWALK_TEST_BROWSER 也可指定已有浏览器通道。生产流程结果与截图默认在已忽略的 test-results/migration-20261009；随后自动检查组件卸载、确认弹窗取消、监听清理与已提交操作的异步收尾，结果在 test-results/lifecycle-20261009。CITYWALK_E2E_OUTPUT 可指定独立结果目录，便于保留不同浏览器的证据。

旧版升级测试默认读取 Git 提交5c32ee0中的原应用，用随机本机端口和独立浏览器数据测试真实旧 worker → 新 worker，不操作用户正式网站的数据。需要保留 Git 历史；CITYWALK_BASELINE_REF 可指定兼容的旧基线。

回退也需要支持 JSON v2 的应用。对已保存 v2 的用户，不能直接部署原 v1 基线。先准备兼容的静态构建，将 CITYWALK_FALLBACK_DIR 指向该目录，再运行 npm run test:rollback：检查打开时数据不变、试玩分支/卡片保留、离线完成仍能提交，以及历史积分和声音偏好保留。本机已验证回退到归档 C 阶段 r-856a9f98bc7b；归档和测试结果仅保存在 test-results，不随项目发布。

## 修改与发布

双击 publish.cmd，或在终端运行 node scripts/publish.mjs。脚本核对 main、origin 地址、远端领先与暂存范围，再检查类型、业务、构建、资源和关键浏览器流程。通过后输入提交说明，随后提交并推送，打开 Actions 结果页。

提交对象是 src/public、配置、测试、脚本和列明的开发文档；不提交 dist、_site、私人笔记、.env 或本机设计资料。第一次迁移提交时脚本会从 Git 索引移除旧的 dist 源码，保留本机已经生成的产物。直接回车取消，检查失败不提交，推送失败可重试已有提交；不强制推送，也不自动合并远端改动。

保存文件不会自动上线。推送到 main 后，GitHub Actions 执行类型检查、业务测试、构建、递归产物检查与 Chromium 流程，再上传 dist 内容到原 GitHub Pages；失败时不发布。需要 Actions 的 build 和 deploy 均成功，并核对线上版本，才算上线。Run workflow 仅部署 GitHub 现有代码，不上传本机未推送的改动。

## 离线、记录与更新

保留 /citywalk/、原 hash 地址、manifest id/start_url/scope、IndexedDB citywalk-for-two/state/current、所有存储 key 和跨标签频道。JSON 存档升级为 version:2，IndexedDB 的结构版本仍为1。继续支持 v1 备份，先运行时校验，再在下一次成功保存的同一事务中迁移；只读打开不改旧数据。48张卡 ID、原节点顺序、短途13/半日20目标及原计分保持。新行程、迁移的旧行程均保存点值和阈值快照，历史按自身规则解释。若还有无法识别的旧标签，新页保留输入并暂缓写入，关闭旧标签或让它应用更新后再重试。

构建后递归处理最终 JS/CSS、指纹 assets 和静态资源，生成 release.json、兼容 release.mjs 与 sw.js。内容版本不依赖手工数字；同输入重建得到同版本。下载全部资源并核对内容哈希后才标记离线准备完成；中断或不匹配会删除未完成缓存。只在玩家显式应用更新时跳过等待。

打开网页、返回前台、恢复网络及前台每15分钟检查更新；设置 → 版本与更新可手动检查和应用。旧标签不自动刷新，旧模块缓存保留到所有相关标签都确认执行版本后再安全清理。更新前保存匹配的表单草稿，不清除网站数据。

任务花费草稿以行程+节点+卡片隔离，收尾草稿以行程隔离；出发、自定义卡和奖励表单也会暂存。草稿保存在当前标签页 sessionStorage，12小时后过期；成功提交清除对应草稿，换卡不带入旧花费。已提交记录由 IndexedDB 原子事务保存。换设备或清理浏览器前在设置导出备份。

## 当前玩法与后续阶段

任务页显示类型路线、当前站、稍后/跳过和下一档奖励；预算、额外奖励和撤销收在旅程工具中。普通完成是可继续操作的420ms页内盖章，达档保留宝箱确认；收尾与日志展示积分明细。卡牌前后共用5:7外框；标题超过牌面可用空间时，下方自动展示完整任务，任务详情另提供完整说明。滑动保留按钮和键盘替代，减少动态效果时直接更新。

首页可直接进入15–20分钟三卡试玩：零消费、不计分，首卡立即保存并打开。观察后共同选择寻找线索或倾听声音，后两张候选与纪念票随方向变化；方向保存后不随刷新重选。12张任务增加轮流、寻找和揭晓提示，不新增必填表单。

最近三局已完成卡的抽取权重降低到普通卡的四分之一；预算、场景、禁用和本局去重仍为硬条件。所有候选都近期出现过时仍可抽取。收藏册区分喜欢、不抽、完成过，筛选在当前标签刷新或应用更新后恢复；三枚纪念章从当前及保留历史计算，撤销或删除会重算。日志详情可预览并保存 PNG 纪念票，长记录分成多页逐页保存；支持文件分享的手机会显示分享按钮。设置可开启翻牌、盖章、达档三个短音效，默认关闭，后台停止，前台下一次手势可恢复。

性能复测运行 npm run measure:performance，使用锁定的官方 web-vitals 库测量 LCP、INP、CLS，记录冷/热缓存、尺寸、网络和 CPU 条件；库只用于测试，不进入产品或发送数据。实机和五对用户试玩按 DEVICE-ACCEPTANCE.md 单独记录。正式名称尚未选择，继续使用“一起走走”；模拟尺寸、浏览器触摸和自动性能测量不代表真实手机或真人验收。
