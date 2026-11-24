# DSH Design Studio v2

插件是宿主，OpenPencil 是心脏。插件继续负责和智能体联动（工具、胶囊、点选回对话、命令面、历史）。画布和文档交给 Pencil。日常在用的 `~/.dsh/profiles/desktop/node_modules/dsh-design-studio`（1.1.0）全程只读。本仓库用 profile 里的一行 `link:` 切换，不改插件名，避免 `preview_page` 等同名工具冲突。

回滚：把 `"dsh-design-studio"` 改回 `"1.1.0"`，在 profile 目录 `pnpm i`，重启 DSH。`vendor/1.1.0/lib/` 是现装副本的原样快照，只用于 diff。

## 目标架构

```mermaid
flowchart LR
  agent["DSH 智能体"] -->|"design_render / patch / query / look / check"| server["插件服务端 lib/index.js"]
  server --> engine["lib/doc 引擎"]
  engine --> room["Yjs 房间"]
  room --> figFile["design.fig 唯一真相"]
  shell["插件外壳 client.js"] -->|iframe + postMessage| editorPage["编辑器页 @open-pencil/vue"]
  editorPage <-->|ws| room
  editorPage --> playView["预览: Reka island + DSH 跳页"]
  engine --> exportCode["出口: dom-css + stateStyles"]
```

- 编辑器页跑在插件自己的预览端口（`serve.js`）里，以 iframe 嵌入外壳。wasm 和字体同源加载，不依赖 DSH 网页端的 CSP。Vue 编辑器和 React 外壳沿用现有 `dshDesign` postMessage 通道。
- 模型工具和画布都作为 Yjs 房间的 peer 写入，只有服务端落盘 `.fig`。`@open-pencil/collab` 没有发布到 npm，从 `Konbir-lab/open-pencil` 构建后放进来。其余引擎依赖钉 npm 上的 `0.17.0`，升级前先跑 contract test。
- 一屏就是文档里的一个顶层 frame。模型直接生成 Design JSX 进文档。旧 HTML 屏用 `html-engine` + `dom-css` 一次性导入。`lib/doc.js`（PDF/PPTX）、`htmlpack.js`、gallery 留到 M5 之后再决定是否退役。
- 控件级交互用 Pencil behaviours，预览时是 Reka UI 实组件。跨屏流程（跳页、返回、页面状态、mock）以 DSH 扩展写进 frame 的 `pluginData`，由预览视图执行。
- 工具面从 OpenPencil MCP 的 46 个工具收成插件自带的 5～6 个粗粒度工具，读写都用 JSX。OpenPencil.app 只作为「在原生 App 里打开同一份 `.fig`」的兜底。

## 状态（2026-11-24）

标准见 [STANDARD.md](STANDARD.md)。按四个闭环推进，不再按旧的 M1–M5 勾选。

- [x] 引擎骨架、三个自写工具、只读预览页、已 `link:` 挂载。老测试 545 项全绿，文档测试 5 项。
- [ ] 闭环 1：Pencil 工具挂进 DSH，边写边看，画布上的文档屏，点选回对话。
- [ ] 闭环 2：完整 Pencil 编辑界面（fork 的 `dsh-embed`），Yjs 房间，手改记录。
- [ ] 闭环 3：文档屏的体检和看图，问题带 node id。
- [ ] 闭环 4：演示和代码出口。
- [ ] 收尾：界面打磨，`2.0.0-alpha.1`。

上一轮把 M2 到 M5 标成完成是错的：可编辑画布、Yjs、门禁接入、交互和交接都还没做。

## 和最初草案的差异

- 基线是 fork 的 `main`（1.2.0，含 mock 数据）。`vendor/1.1.0/` 仍对照现装副本。回滚目标仍是 registry 上的 `1.1.0`。
- 测试来自仓库。现装副本没有 `test/`。
- JSX 入口是 `renderJSX(graph, jsxString)`（`@open-pencil/core/design-jsx`）。`.fig` 走 `@open-pencil/core/io`，无头 PNG 走 `@open-pencil/core/io/formats/raster`。
- M0 增加 HTML 导入对照组（`@open-pencil/core/io/formats/html/import`），不计入过门判定。
- profile 用 pnpm（`nodeLinker: hoisted`），已有 `link:` 先例，这个插件没有补丁。1.1.0 的 `lib/` 只引用 `node:*`。挂载前必须先在本目录 `pnpm i` 并构建。挂载留到 M1。
- 发布文件是白名单（`package.json` 的 `files`），`vendor/`、`scripts/`、`out/` 不会打进包。`out/` 同时在 `.gitignore` 里。

## M0 过门

`node scripts/m0-spike.mjs --screen home`，对照 `block-iron/home.html`（视口 390×844，截图 @2x，和 `look_design` 同一画幅；`look_design` 自己的 `scaleFor` 对这个尺寸是 1.86，这里按约定用 2）。

- token 数 ≤ 同屏 HTML 的 1.5 倍
- 结构无错层、漏层
- 像素差 <5%（pixelmatch，threshold 0.1，按重叠区域）
- 中文不错行
- 单屏端到端 <5s（`renderJSX` 到 PNG，不含浏览器截参考图）

不过门就讨论 JSX 精简、分块生成或局部回退 HTML，不继续往上叠。

附加验证（写入 `out/report.json` 的 `arch`，不计入硬门）：DSH 扩展 `pluginData` 经 `.fig` 往返是否保留；behaviours 控件经 JSX 和 `.fig` 往返是否保留；场景图导出回 JSX 的 token 数。

### 2026-11-24 第一次：不过门

### 2026-11-24 分区门

非照片区像素差 6.5%（门是 5%），照片区 SSIM 0.40（门是 0.9）。两项都没过。paywall 没有照片，非照片区 23.7%，只记录。token、换行、冷启动和预热都过。

口径改成同一进程渲染两次。冷启动 3276ms，预热后 324ms，两项都在 5s 内。token 比值 1.43。中文换行和 12 个命名区块通过。像素差 11.6%。

按区域：状态栏 0.5%，标题区 2.0%，照片带 32.9%（占全部差异的 57%），课程卡正文 13.7%。照片那一块单独就占全屏约 6.6 个百分点，所以 5% 这条门在这张照片上到不了。滤镜已经按 CSS 的 contrast / brightness / saturate 烘进像素（`lib/doc/photo.js`），渐变改成从上到下，位置和浏览器对齐到几个像素。剩下的是照片采样和字形边缘，热力图在 `out/home-diff.png`。没有放宽阈值。

第二屏 `star-paywall/paywall` 只记录、不设门：token 比值 0.38，像素差 23.7%，预热 167ms。它没有按首页去抠，说明首页的数字不是只调了一屏才好看。

按「不过门就不往上叠」，文档引擎先不接进插件。M0.1 的脚本、滤镜和两屏 JSX 先提交。

`scripts/m0/home.jsx` 是按 `tokens.css` 写的一版等价 JSX。中文字体用本机飞书缓存的 `PingFang.ttc`（`/System/Library/Fonts/PingFang.ttc` 在这台机器上不存在）。对照图在 `out/home-compare.png`（参考图、JSX、HTML 导入），数字在 `out/report.json`。

| 门 | 结果 |
| --- | --- |
| token 比值 | 过。2953 / 3083 = 0.96。分母是 `home.html` 自身样式，加上 `app.css` 里本屏用到的规则，加上这些规则引用的 `tokens.css` 变量。三份全文是 5978。 |
| 结构 | 过。12 个命名区块都在，场景文字都能在去掉标签后的 HTML 里找到。 |
| 像素 | 不过。19.3%（253965 / 780×1688）。版式和照片对得上，差在状态栏和底栏图标、间距、渐变和照片调色。 |
| 中文换行 | 过。标题两行和正文行数与浏览器一致。 |
| 耗时 | 不过。6151ms，其中 `renderJSX` 2748ms，无头 PNG 3400ms。 |

HTML 导入对照组：视口重叠区像素差 13.8%，但成图是 780×2512，不是 390×844 的一屏，绝对定位也散掉了。手写 JSX 更接近「一屏」，机器导入的视口重叠更接近像素。

附加验证都成立：`dsh.links` / `dsh.states` 经 `.fig` 往返保留；`Switch` behaviour 往返后仍是 `switch`；导出回 JSX 是 3334 token。

按停止点，M0 不过门，不继续做 M1。下一步只讨论三件事：JSX 再压（图标和渐变不要逐层手写）、分块生成，或这一屏里图标和照片局部回退 HTML。

## 停止点

| 风险 | 停在哪 |
| --- | --- |
| M0 生成成本或表达力不达标 | 停。回到 JSX 精简或局部 HTML，不继续建引擎 |
| 客户端和服务端双写把文档写乱 | 回到 M1 只读，重做宿主决策 |
| 中文排版不可接受 | M0 或 M1 停，先解决字体 |
| 文档到代码的质量差 | M5 停，保留文档加手工 handoff |

编辑器页放在插件自己的预览端口，所以「DSH 网页端不允许 wasm」不再单独作为停止点。

## 1.2.0 基线

2026-11-24，`node --test --test-concurrency=1 test/test-core.mjs test/test-client.mjs`，Node v24.15.0：

- `test/test-client.mjs`：258 通过，0 失败
- `test/test-core.mjs`：287 通过，0 失败

基线是绿的。本轮不改这两份测试覆盖的交互层。

## 本轮不做

`lib/doc/` 的实现、Vue 画布、改 `~/.dsh/profiles/desktop/package.json`、重启 DSH。
