# DSH Design Studio v2 标准

插件负责和智能体交互，Pencil 负责核心基础。两边都不重写：交互流程沿用插件，核心能力直接调用 Pencil。

## 结合点

| 插件的交互层 | 接缝 | Pencil 的核心 |
| --- | --- | --- |
| `lib/tool.js` 把工具挂给模型 | 工具在插件进程里跑，作用在房间里的 graph 上 | `@open-pencil/core/tools`，执行时传 `new FigmaAPI(graph)` |
| 边写边看（`lib/draft.js`、tracker） | 模型工具调用的参数流 | `createStreamingJSXParser`、`stageJSXPreview` |
| 画布、点选回对话（`lib/picker.js`、`client.js`） | `dshDesign` 协议，选中消息带 `nodeId` | 场景图节点、`sceneNodeToJSX` |
| 手改记录（`lib/edits.js`） | 房间里人做的修改 | `@open-pencil/vue` 编辑器、`diffPageLayersJSX`、`jsxPatch` |
| 每轮版本（`lib/history.js`） | 每轮存 `.fig` | `diff_changes` 写版本说明 |
| `check_design`、`look_design` | 问题带 `nodeId` | `@open-pencil/core/lint`、`headlessRenderNodes` |
| Play、手机看、远程看 | pluginData 里的 `dsh.link` / `states` / `mock` | behaviours 的 play islands、`renderNodesToHTML` |
| `handoff_design`、`compare_design` | 引擎出的图当参考 | html、tailwind、Vue 导出 |

## 单一真相

新设计一律写进设计目录的 `design.fig`，一个顶层 frame 是一屏。`manifest.json` 记录屏顺序、kind、`docHash`、status。已有的 HTML 设计照旧可用，`design_import` 可以转成文档。

## 分层

- `lib/doc/` 是接缝层：房间、Pencil 工具适配、出图、门禁、出口。不碰 React。
- 编辑器界面来自 `Konbir-lab/open-pencil` 的 `dsh-embed` 分支，构建到 `lib/doccanvas/`。插件仓库不复制 Pencil 的界面源码。
- `lib/client.js` 只通过 `dshDesign` 协议和预览页说话。

## 依赖

`@open-pencil/*` 精确钉在 `0.17.0`。升级前先跑 contract test。`@open-pencil/collab` 没有发布到 npm，从 fork 的 `d549281` 打包进 `vendor/collab/`。运行时不构建，挂载前执行 `pnpm build`。

## 门禁

生成面：token 比值不超过 1.5；非照片区像素差低于 5%；照片区 SSIM 不低于 0.9；中文不错行；预热后每屏低于 5 秒，冷启动低于 5 秒。

编辑面：contract test 全绿。

交付面：`check_design` 零阻断，`compare_design` 低于 3%，`test-core`、`test-client`、`test-doc-*` 全绿。

## 测试

`npm test` 跑 `test/*.mjs`。`test-core`、`test-client` 保护交互层，`test-doc-*` 覆盖每个接缝。

## 挂载与回滚

挂载：备份 `~/.dsh/profiles/desktop/package.json`，把 `dsh-design-studio` 改成 `link:` 指向本目录，在 profile 目录安装，重启 DSH。

回滚：把那一行改回 `1.1.0`，删掉 `node_modules/dsh-design-studio` 软链接，再安装，重启。

## 流程

每个闭环一个提交，只推 `v2`。过门后把结果写进 `PLAN.md`，停下评审。
