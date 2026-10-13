# 资料归档索引

归档日期：2026-10-13。当前待办见 [路线图](../plans/ROADMAP.md)，实现结果见 [当前报告](../reports/IMPLEMENTATION-PROGRESS.md)。以下资料保留用于版本对照，不作为新的开发任务。

## 项目历史资料

| 资料 | 原始阶段 | 归档理由 |
| --- | --- | --- |
| [像素风预览](2026-09/PIXEL-PREVIEW.md) | 2026-09，`r-f281a6c3be13` / `r-92978b72c0f1` | 早期视觉交付已被后续界面实装覆盖；端口和测试数是当时记录 |
| [游戏优化方案](2026-10/GAME-QUALITY-PLAN.md) | 2026-10-09评估，附10月13日执行更新 | M0/M1及第二轮工程项已完成；当前待验要求已收拢到路线图和设备表 |
| [第一轮优化交付](2026-10/OPTIMIZATION-RESULTS.md) | 2026-10-09，`r-4bf7cbb6ae14` | 迁移前 v1 发布记录；当前构建、检查命令和存档版本见现行资料 |
| [42文件迁移清单](2026-10/MIGRATION-INVENTORY.md) | 基线提交 `5c32ee0` | 迁移已经完成；原路径、处置和SHA-256留作追溯 |
| [实施历史快照](2026-10/IMPLEMENTATION-HISTORY.md) | 2026-10-09至10月13日整理前 | 保存阶段记录、发布失败、性能校准及第二轮附记；当前入口改为简明实施报告 |

归档中的旧代码路径、运行端口、测量样本和发布状态按原日期理解。原测试结果、截图和兼容回退包继续在本机 `test-results/` 的原位置。

## 本机工作记录

这些路径在 Git 中忽略，不进入一键发布提交范围：

- `sessions/2026-10-13-before-organization/`：整理前 `task_plan.md` 与 `notes.md` 原件，包含品牌实装和第二轮实施记录。
- `sessions/2026-10-13-organization/`：本次整理的计划和盘点笔记。
- `local/2026-09-17/runbook.md`：早期本机运行手册，保留旧 Sites/直接编辑 dist 的历史；当前操作见根 README。

早期 `.workbuddy/memory/` 属于原工具的本机记录，继续保留其原位置；其中的托管待办和 dist 源码说明已过时，不作为当前状态。

## 素材与证据

- `assets/archive/legacy-story/`：原有三张停用叙事图，保留原哈希说明。
- `assets/archive/early-scenes/`：三张早期场景/宝箱PNG，没有当前运行时或制图脚本引用。
- `assets/archive/card-structure-20260921/`：已实装的整卡/票券结构稿、图片和原`PROMPT.txt`；`DESIGN.md`中“未替换”描述属于原设计阶段。`PROMPT.txt`原内容仅为`undefined`，有效提示词未保存，未补写推测内容。
- `test-results/README.md`：当前最终结果、历史失败和兼容构建的本机索引。

当前生成资源的原图和成套提示词保留在 `assets/concepts/batch-01` 至 `batch-05-task-matching`；共用画风参考和变体也保留原路径，避免断开提示词引用。
