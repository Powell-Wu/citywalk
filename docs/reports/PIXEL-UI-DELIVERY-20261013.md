# 城市像素冒险 UI 与纪念美术交付

2026-10-13，Asia/Taipei。用户确认方向：**明亮城市像素冒险，轻松、有游戏感**。

本轮已完成 UI 实装与 13 件纪念美术：六枚冒险邮票、六枚透明印章、一张纪念册封面。首页、准备出发、任务卡、收藏册、冒险日志与纪念票沿用同一组双人角色、晴日城市和像素冒险语言。本地最终构建为 `r-92ea46daee29`，未提交、未发布。

## 查看成果

- [整套美术总览](../../test-results/art-direction-20261013/visual/asset-board.png)
- [桌面首页](../../test-results/art-direction-20261013/visual/home-1280.png) / [手机首页](../../test-results/art-direction-20261013/visual/home-390.png)
- [桌面纪念册](../../test-results/art-direction-20261013/visual/album-1280.png) / [手机纪念册](../../test-results/art-direction-20261013/visual/album-390.png)
- [手机任务卡](../../test-results/art-direction-20261013/visual/task-390.png) / [小屏安全区](../../test-results/art-direction-20261013/visual/task-safe-320.png)
- [实际导出的纪念票 PNG](../../test-results/art-direction-20261013/visual/ticket-export.png)
- [设计规范与维护方法](../design/PIXEL-UI-20261013.md) / [原图与生成来源](../../assets/concepts/batch-07-pixel-collectibles/README.md)

截图中的三段历史为自动验证使用的示例旅程，存在隔离的浏览器上下文中。正式界面的历史、统计和成就读取用户自己的真实记录。

## 本轮实现

首页突出“直接试玩”和“准备出发”，用原有城市主图、三类任务邮票和通行证形成游戏入口。底部导航增加明确图标，桌面与手机按各自空间排版。

任务卡保留九类插画、精确任务映射、5:7 正反面、滑动和按钮操作。新增像素盖章；小屏按可用高度调整卡框，使操作菜单避开底部导航和安全区。准备页用邮票标识主题，收藏页保留喜欢、不抽、完成记录和自定义入口。

冒险日志加入像素纪念册封面、真实旅程统计和点亮印章。已获得与待获得状态沿用已有规则。纪念票采用场景、主题邮票和合作印章组合，PNG 保留任务、主题快照、回忆和长内容分页；场景按原图比例裁切。

邮票与印章共用图集索引，页面与 PNG 导出选择同一主题。正文、标题、日期与状态用原生文字排版，PNG 大图原稿保留在本机。初版复古稿留存在 batch-06，已退出网页资源。

## 验证记录

| 检查 | 结果与证据 |
| --- | --- |
| 业务测试 | 78/78 通过：[日志](../../test-results/art-direction-20261013/unit-tests.txt) |
| Svelte / TypeScript | 0 错误、0 警告：[日志](../../test-results/art-direction-20261013/typecheck.txt) |
| 构建、资源、离线覆盖 | 33 个文件，1,047,788 字节；在 1 MiB 预算内，资源引用及离线覆盖完整：[检查](../../test-results/art-direction-20261013/check.txt) |
| Edge 与 Chromium 完整流程 | 两浏览器各 25 项主流程、4 项生命周期、5 项主题与升级检查通过；执行版本 `r-e155298445ed`：[Edge](../../test-results/art-direction-20261013/final-edge/results.json)、[生命周期](../../test-results/art-direction-20261013/final-edge/lifecycle/results.json)、[主题与更新](../../test-results/art-direction-20261013/final-edge/second-round/results.json)、[Chromium](../../test-results/art-direction-20261013/final-chromium/results.json) |
| 最终版视觉与导出 | `r-92ea46daee29`，320 / 390 / 1280 三种宽度，共 23 项页面截图检查；图片均解码，无横向溢出，无页面错误，实际 PNG 宽度 900；手机另模拟 47px / 34px 安全区：[结果](../../test-results/art-direction-20261013/visual/results.json) |
| 最终版实验室性能 | 试玩流程，桌面及移动模拟、冷暖缓存四个样本全部达标；最大 LCP 2016ms、INP 56ms、CLS 0：[方法与原始结果](../../test-results/art-direction-20261013/final-performance/results.json) |

两个构建之间仅修正纪念票顶部场景的等比例裁切；最终版重新执行了业务测试、类型检查、构建检查、全部视觉与 PNG 导出检查及性能采样。真实手机与双人试玩仍沿用项目验收表的待验状态。

当前静态包余量为 788 字节。下一轮增添资源前应先整理重复样式和资源预算。后续美术调整可以直接重制已保存的 PNG 原稿，无需重新生成或安装依赖。

## 本地预览

```powershell
npm run build
npm run preview -- --port 5198
```

打开 `http://127.0.0.1:5198/citywalk/`。本轮保留原有未提交功能和数据兼容，未执行 Git 提交或部署。
