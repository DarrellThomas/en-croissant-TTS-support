# 文字转语音朗读指南

*本指南还有以下语言版本：
[English](TTS-GUIDE.md) |
[Francais](TTS-GUIDE-fr.md) |
[Espanol](TTS-GUIDE-es.md) |
[Deutsch](TTS-GUIDE-de.md) |
[日本語](TTS-GUIDE-ja.md) |
[Русский](TTS-GUIDE-ru.md) |
[한국어](TTS-GUIDE-ko.md)*

## 为什么TTS改变了你学习国际象棋的方式

当你复盘一局带注释的棋局时，你的眼睛在做双重工作。你试图跟踪棋盘上的棋子，*同时*阅读评论。你的目光在棋盘和注释面板之间来回跳动，每次跳动时，你都会短暂地失去对局面的把握。你必须重新找到棋子，重新追踪变化线，重新在脑中构建画面。

文字转语音完全解决了这个问题。

启用TTS后，你逐步浏览棋局，注释会被*朗读出来*。你的眼睛可以一直留在棋盘上。你看着马落在f3，同时一个声音告诉你为什么这是一步强有力的发展棋。棋盘和文字同时到达，就像一位坐在你对面的教练在教你。

这在以下场景中特别有效：

- **开局学习** — 观察局面发展的同时听取每步棋背后的理念
- **复盘** — 浏览你的注释棋局，自然地吸收经验
- **残局练习** — 将注意力集中在关键格上，让评论引导你
- **语言沉浸** — 用法语、德语、西班牙语、俄语、日语、中文或韩语学习国际象棋，所有术语都有翻译
- **无障碍** — 适合更喜欢听而不是读的棋手，或想要离开书桌学习的人

一旦尝试过，回到无声注释就像看一部没有声音的电影。

## 选择提供商

En Parlant~配备了五个TTS提供商。你只需要一个就可以开始。

### ElevenLabs

最佳语音质量。ElevenLabs生成富有表现力、类人的语音，具有真实的个性。数十种独特的声音可供选择。支持所有八种语言，CJK发音出色。

免费额度每月10,000个字符（足够2-5局注释棋局）。付费计划从每月5美元起，30,000个字符。设置简单：创建账号，复制API密钥，粘贴到En Parlant~中。

需要互联网。最适合注重语音质量的用户。

**[ElevenLabs设置指南](docs/tts/setup-elevenlabs.md)**（英文）

### Google Cloud TTS

质量、语言支持和价值的最佳平衡。Google的WaveNet神经语音在所有八种语言中都自然清晰。免费额度很慷慨——每月一百万个字符，覆盖数百局注释棋局。

设置大约需要5分钟。除非超出免费额度，否则不收费。

需要互联网。最适合大多数用户。

**[Google Cloud设置指南](docs/tts/setup-google.md)**（英文）

### KittenTTS

完全在本机运行的高质量本地AI。使用约25MB的轻量级神经模型，提供8种富有表现力的声音（4男4女）。质量非常出色。

硬件要求：KittenTTS使用PyTorch进行CPU推理，需要现代多核处理器。目前仅支持英语。

无需互联网。无需API密钥。最佳本地质量。

**[KittenTTS设置指南](docs/tts/setup-kittentts.md)**（英文）

### System TTS

操作系统内置的语音合成。无需安装，无需API密钥，无需服务器。选择即用。语音质量基础但立即可用。

Linux上通常是eSpeak或speech-dispatcher；macOS是系统语音；Windows是SAPI。

无需互联网。最适合快速测试。

**[System TTS设置指南](docs/tts/setup-system.md)**（英文）

### OpenTTS

通过Docker在本机运行的开源TTS服务器。数据不会离开你的电脑。捆绑多个TTS引擎（Larynx、Festival、eSpeak、Coqui-TTS），仅英语就提供75+种声音。

质量方面：较旧的引擎，声音比ElevenLabs或Google更机械。欧洲语言效果最好——CJK支持不佳。OpenTTS可能在未来版本中移除。

无需互联网。无需API密钥。最适合注重隐私的用户。

**[OpenTTS设置指南](docs/tts/setup-opentts.md)**（英文）

### 我们的推荐

想要最佳语音质量就选**ElevenLabs**。品质与免费使用的最佳平衡选**Google Cloud**，每月覆盖数百局棋局。高质量本地TTS选**KittenTTS**（需要现代CPU）。零配置测试选**System TTS**。最大隐私保护选**OpenTTS**，通过Docker完全本地运行。

## 设置参考

所有TTS设置位于**Settings > Sound**：

| 设置 | 功能 |
|------|------|
| **Text-to-Speech** | 所有TTS功能的主开关 |
| **Auto-Narrate on Move** | 逐步浏览棋步时自动朗读注释 |
| **TTS Provider** | 在五个提供商之间切换 |
| **TTS Voice** | 特定于提供商的声音选择 |
| **TTS Language** | 朗读语言——国际象棋术语自动翻译 |
| **TTS Volume** | 朗读音量 |
| **TTS Speed** | 播放速度（0.5x到2x）——无需重新生成音频即可调整 |
| **ElevenLabs API Key** | 你的ElevenLabs API密钥 |
| **Google Cloud API Key** | 你的Google Cloud API密钥 |
| **KittenTTS CPU Threads** | 推理用CPU线程数（0 = 自动） |
| **TTS Audio Cache** | 清除音频缓存以强制重新生成 |

## 支持的语言

TTS朗读支持八种语言，国际象棋词汇完全翻译：

| 语言 | 国际象棋示例 |
|------|------------|
| **English** | Knight f3, check. A strong developing move. |
| **Francais** | Cavalier f3, echec. Un coup de developpement fort. |
| **Espanol** | Caballo f3, jaque. Un fuerte movimiento. |
| **Deutsch** | Springer f3, Schach. Ein starker Entwicklungszug. |
| **日本語** | ナイト f3、チェック。強い展開の手。 |
| **Русский** | Конь f3, шах. Сильный развивающий ход. |
| **中文** | 马 f3，将军。一步控制中心的强力出子。 |
| **한국어** | 나이트 f3, 체크. 중앙을 지배하는 강력한 전개 수. |

所有国际象棋术语——棋子名称、"将军"、"将杀"、"王车易位"、"吃"，以及"妙手"和"败着"等评价——都用所选语言朗读。

## 获得最佳体验的建议

- **使用Auto-Narrate。** 打开"Auto-Narrate on Move"，用方向键浏览棋局。评论会随着你的前进自然流出。

- **给自己的棋局添加注释。** TTS在你听取*自己*棋局的评论时真正发挥作用。

- **尝试不同的速度。** 仔细学习用1倍速，快速复习用1.3倍速。

- **使用扬声器图标。** 每条评论旁都有一个小扬声器图标。点击即可只听那条注释。

- **切换语言来学习国际象棋词汇。** 如果你在用第二语言学习国际象棋，将TTS语言设置为匹配。

## 关于此功能

En Croissant是由[Francisco Salgueiro](https://github.com/franciscoBSalgueiro)创建的开源国际象棋学习工具。Francisco创造了真正特别的东西，并以GPL-3.0许可证发布。这个TTS功能的存在归功于他的慷慨。

TTS插件由[Red Shed](https://redshed.ai)的Darrell在[Claude Code](https://www.anthropic.com/claude-code)的帮助下开发。五个提供商，多语言支持，八种语言的国际象棋术语翻译。

我们使用AI来构建这个功能。[了解更多](docs/ai-note.md)。

## 联系我们

我们很想听听TTS对你的使用体验。评论、建议和反馈随时欢迎。

在[GitHub](https://github.com/DarrellThomas/en-parlant)上创建issue，或直接联系**[darrell@redshed.ai](mailto:darrell@redshed.ai)**。
