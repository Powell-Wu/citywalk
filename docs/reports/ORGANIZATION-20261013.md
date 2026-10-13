# 项目资料整理记录

日期：2026-10-13（Asia/Taipei）。输入与输出均在 `D:/Documents/Codex/citywalk-app`。统一入口为 [项目资料索引](../README.md)，根 README 保留日常运行与发布说明。

## 整理结果

原13份根目录资料中，12份移入分类目录或会话归档，根目录仅保留README。新增当前路线图，拆出简明第二轮实施报告；原实施记录完整保存在历史归档。另归档6份早期设计文件。

| 原位置 | 新位置 | 处理依据 |
| --- | --- | --- |
| `GAME-IMPLEMENTATION-BRIEF.md` | [plans/GAME-IMPLEMENTATION-BRIEF.md](../plans/GAME-IMPLEMENTATION-BRIEF.md) | 保留现行约束；标注已完成迁移、当前JSON v3与兼容回退，修正后续agent指令 |
| `PROJECT-NAMING.md` | [design/PROJECT-NAMING.md](../design/PROJECT-NAMING.md) | 现行品牌规范 |
| `TASK-ART-MAP.md` | [design/TASK-ART-MAP.md](../design/TASK-ART-MAP.md) | 现行48卡插画映射，说明文字以当前源码为准 |
| `DEVICE-ACCEPTANCE.md` | [acceptance/DEVICE-ACCEPTANCE.md](../acceptance/DEVICE-ACCEPTANCE.md) | 待填人工验收表，保留待验状态 |
| `IMPLEMENTATION-PROGRESS.md` | [archive/2026-10/IMPLEMENTATION-HISTORY.md](../archive/2026-10/IMPLEMENTATION-HISTORY.md) | 原混合版本记录完整归档；最新第二轮内容提取到现行 [实施报告](IMPLEMENTATION-PROGRESS.md) |
| `GAME-QUALITY-PLAN.md` | [archive/2026-10/GAME-QUALITY-PLAN.md](../archive/2026-10/GAME-QUALITY-PLAN.md) | 已完成工程项归档，有效待办收拢到 [路线图](../plans/ROADMAP.md) |
| `MIGRATION-INVENTORY.md` | [archive/2026-10/MIGRATION-INVENTORY.md](../archive/2026-10/MIGRATION-INVENTORY.md) | 已完成42文件迁移，保留原路径与哈希 |
| `OPTIMIZATION-RESULTS.md` | [archive/2026-10/OPTIMIZATION-RESULTS.md](../archive/2026-10/OPTIMIZATION-RESULTS.md) | 迁移前v1版交付记录 |
| `PIXEL-PREVIEW.md` | [archive/2026-09/PIXEL-PREVIEW.md](../archive/2026-09/PIXEL-PREVIEW.md) | 早期视觉稿与旧版本预览记录 |
| `runbook.md` | `docs/archive/local/2026-09-17/runbook.md` | 旧本机手册，当前运行方式由根README承接 |
| 原 `task_plan.md`、`notes.md` | `docs/archive/sessions/2026-10-13-before-organization/` | 原样保存品牌与第二轮工作记录 |
| 本次 `task_plan.md`、`notes.md` | `docs/archive/sessions/2026-10-13-organization/` | 整理完成后收存本次计划和盘点笔记 |
| `assets/adventure-*.png`三张 | `assets/archive/early-scenes/` | 没有当前运行时或制图脚本引用 |
| `assets/concepts/batch-06-card-structure/`三份 | `assets/archive/card-structure-20260921/` | 已实装整卡与票券结构的历史稿，图片/提示词/原说明成套保留 |

各归档文件补充适用日期与当前替代入口；正文历史数字和失败记录保留。旧dist源码的失效超链接改为标明旧版本路径，原路径仍可通过迁移清单和Git历史追溯。

## 配套改动

- 新建计划/设计/报告/验收/归档索引与当前路线图，修订README和资料间的相对链接。
- 发布脚本允许正式 `docs/` 资料，拒绝 `docs/archive/local/` 和 `docs/archive/sessions/`；Git也忽略这两处本机记录。
- 发布暂存包含已移走的受跟踪根目录文件删除，防止下次发布遗留旧文档；没有创建提交、推送或部署。
- 新建本机 `assets/README.md`、`test-results/README.md`，标明原图输入、提示词、最终结果、历史失败和兼容构建的用途。

## 保留范围

没有删除资料。原13份根目录Markdown均有整理前完整快照；未提交的应用代码、`public/`资源、测试证据和兼容回退构建保留。batch-01–05制图输入及共用画风参考的路径保留，避免断开提示词与脚本引用。`.workbuddy/memory/`、`dist/`和旧`_site/`也保留原位置。

`prepare-art.cjs`仍输出旧dist路径，这一已有情况记录在本机素材索引；本次没有调用制图脚本或重新压缩资源。

整卡结构稿的原`PROMPT.txt`仅含`undefined`，有效提示词未保存；这一缺项已标明，原文件原样保留。

## 验证

- 移动当时16份文件的SHA-256全部一致；6份归档设计文件整理后继续与原值一致。
- 完整性检查确认13份根目录文档原件可追溯，166份文件（包括源码、资源及移动设计文件）内容不变。必要代码改动限于发布脚本及其回归用例，另更新`.gitignore`。
- `npm test`：78/78通过，包含正式docs提交、旧路径删除暂存和私人归档拒绝用例。
- `node --check scripts/publish.mjs`与`npm run check`通过：30个静态文件、924016字节，资源、PWA和离线覆盖完整；原内容版本r-9c29590d4fb7保留。
- 17份入口及正式Markdown中的82个本机/相对链接通过检查；Git忽略规则和发布暂存预览均核对，20条暂存候选不含私人归档，不改变实际暂存区。
- `git diff --check`通过。未重复浏览器/性能测试；本次没有应用源码和发布资源变更。

移动清单、原文件哈希、原件快照和最终验证位于本机 `test-results/organization-20261013/`。既有第二轮结果与人工验收结论未改变。
