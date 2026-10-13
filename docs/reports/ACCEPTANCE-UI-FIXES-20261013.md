# 验收修订：通行证、选图、准备出发与卡背

2026-10-13，Asia/Taipei。四项验收问题已完成修订，延续用户确认的明亮城市像素冒险风格。四项修订基线为 `r-947fd957864d`，随后根据用户反馈恢复深蓝卡背，最新本机构建 `r-093f6354c58e`，未提交、未发布。

## 后续验收：深蓝卡背与说明

用户偏好原来的深蓝卡背。已恢复 `deck-pattern.svg` 的深蓝城市路线、金色指南针与城市徽记，仍采用明确的图像层和同源资源地址，保留此前修复的翻牌表现。移除卡背底部说明框；当前主题名继续显示在旅程顶部，完整玩法说明移入默认折叠的“旅程工具”。

最新版本 `r-093f6354c58e`：类型检查0错误/警告、80/80业务测试、构建与资源检查通过，34文件共1,034,644字节。18项专项视觉检查、两主题×320/390完整旅程与真实v2升级检查通过，详见[视觉结果](../../test-results/card-back-dark-20261013/visual/results.json)和[主题/升级结果](../../test-results/card-back-dark-20261013/second-round/results.json)。新增断言检查深蓝图像地址、牌面无说明框、主题名显示与工具内说明可展开。用户本地预览已应用最新版本。

![当前深蓝卡背](../../test-results/card-back-dark-20261013/visual/card-back-390.png)

## 四项修订

| 验收问题 | 完成的改变 | 预览 |
| --- | --- | --- |
| 通行证像文本框，左侧过空 | 整张票面重新绘制：浅色城市地图、青色路线、指南针、连贯边框、撕票虚线和双人城市入口；中文标题、日期、编号与真实旅程状态叠加 | [完整票面](../../test-results/acceptance-fixes-20261013/visual/passport-1280.png) / [320px票面](../../test-results/acceptance-fixes-20261013/visual/passport-320.png) |
| 自定义卡无法选择插画 | 原生单选图集，提供自动匹配与九张现有插画；选图随卡片保存，收藏册显示真实插画，抽卡保留相同图像 | [选图编辑器](../../test-results/acceptance-fixes-20261013/visual/custom-editor-390.png) / [保存后的卡](../../test-results/acceptance-fixes-20261013/visual/custom-saved-390.png) |
| 准备出发比较简陋 | 新票面主视觉，时间、主题、出发设置三步选择；实时清单显示时间、主题、场景、预算、计分与任务顺序。手机行动栏固定在导航上方；试玩显示零消费、不计分，并禁用不适用配置 | [桌面准备页](../../test-results/acceptance-fixes-20261013/visual/setup-1280.png) / [手机准备页](../../test-results/acceptance-fixes-20261013/visual/setup-390.png) / [手机行动栏](../../test-results/acceptance-fixes-20261013/visual/setup-viewport-390.png) |
| 翻牌时卡背空白 | 通用卡面背景覆盖了反面图像，隔离浏览器读到 backgroundImage=none。删除覆盖，反面使用明确的原图层，叠放卡背也引用同一图像；正反面保留翻转动效 | [修订前](../../test-results/acceptance-fixes-20261013/card-back-before.png) / [修订后](../../test-results/acceptance-fixes-20261013/visual/card-back-390.png) |

九种选图分别为街角入口、隐藏通道、城市线索、小巷足迹、树荫对话、街角小店、镜头发现、城市声音、双人合作。卡片新增可选的 `artKey`，使用固定有效枚举，不保存任意图片 URL。旧卡没有这个字段时继续自动匹配；内置卡仍使用原有精确映射。已验证自定义图像在草稿刷新、保存、JSON导出/导入、抽卡快照、历史和离线重载中的保留。

准备页在草稿恢复后同步实时清单，试玩与正式模式相互切换时保留普通模式的配置选择，提交试玩仍由已有规则固定为零预算、不计分。未完成旅程进入准备页时继续展示恢复入口。

## 美术与资源

新通行证原稿、来源和完整提示词见 [batch-08](../../assets/concepts/batch-08-passport/README.md)。网页资源为960×384 WebP，44,582字节。票面为完整原画，动态信息保持原生文字。

九类任务插画从已有PNG原稿重新压缩，保持原尺寸与nearest缩放，将WebP quality78改为70，节省74,534字节。原PNG及调整前WebP均已保留，参数写入 `scripts/prepare-art.cjs`，输出目录修正为持久资源 `public/`。两张被同步软件加上设备后缀的旅程图片已恢复引用所需的原文件名，内容不变。

最终静态包34个文件，共1,035,128字节，1MiB预算剩余13,448字节。新增票面覆盖离线缓存，网页与现有纪念票图片引用完整。

## 验证

| 检查 | 最终结果与证据 |
| --- | --- |
| 业务与数据 | 80/80通过，包含两项新增自定义选图、旧卡兼容、抽卡和历史/备份测试：[日志](../../test-results/acceptance-fixes-20261013/unit-tests.txt) |
| 类型、构建与离线包 | 0错误、0警告；生产构建及资源预算检查通过：[类型](../../test-results/acceptance-fixes-20261013/typecheck.txt)、[构建](../../test-results/acceptance-fixes-20261013/build.txt)、[资源](../../test-results/acceptance-fixes-20261013/check.txt) |
| Edge / Chromium | 两浏览器各25项主流程、4项生命周期、5项主题/升级检查通过：[Edge](../../test-results/acceptance-fixes-20261013/final-edge/results.json)、[Chromium](../../test-results/acceptance-fixes-20261013/final-chromium/results.json)，各目录附lifecycle和second-round原始结果 |
| 专项验收 | 320/390/1280宽度、票面文字边界、准备清单、手机行动栏与导航间距、选图和离线恢复、正常/减少动画翻牌；18项截图检查无页面错误、无横向溢出、无资源404：[结果](../../test-results/acceptance-fixes-20261013/visual/results.json) |
| 实验室性能 | 试玩流程，桌面/移动模拟与冷暖缓存四个样本全部达标。最大LCP2276ms、INP56ms、CLS0：[方法与结果](../../test-results/acceptance-fixes-20261013/performance/results.json) |

以上最终验证均对应 `r-947fd957864d`。用户当前本地试玩标签已通过“检查更新→应用更新并刷新”切换到本版，并返回原任务：前两站已完成，第3站“各用相机找一个像笑脸的东西”继续进行，进度保留。

本地预览：`npm run preview -- --port 5198`，打开 `http://127.0.0.1:5198/citywalk/`。
