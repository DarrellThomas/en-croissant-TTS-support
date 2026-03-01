# 텍스트 음성 변환 내레이션 가이드

*이 가이드는 다른 언어로도 제공됩니다:
[English](TTS-GUIDE.md) |
[Francais](TTS-GUIDE-fr.md) |
[Espanol](TTS-GUIDE-es.md) |
[Deutsch](TTS-GUIDE-de.md) |
[日本語](TTS-GUIDE-ja.md) |
[Русский](TTS-GUIDE-ru.md) |
[中文](TTS-GUIDE-zh.md)*

## TTS가 체스 학습을 바꾸는 이유

주석이 달린 기보를 복습할 때, 여러분의 눈은 이중 작업을 합니다. 체스판 위의 기물을 따라가면서 *동시에* 코멘트를 읽으려 합니다. 시선이 체스판과 주석 패널 사이를 오가며, 매번 잠깐씩 국면을 놓치게 됩니다.

텍스트 음성 변환(TTS)은 이 문제를 완전히 해결합니다.

TTS를 활성화하면 기보를 진행할 때 주석이 *소리내어 읽어집니다*. 눈은 체스판에 집중할 수 있습니다. 나이트가 f3에 착지하는 것을 보면서, 왜 그것이 강력한 전개 수인지 목소리가 설명해 줍니다. 체스판과 말이 동시에 도착합니다. 마치 맞은편에 앉은 코치가 가르쳐주는 것처럼.

이것은 특히 다음에 효과적입니다:

- **오프닝 학습** — 포지션이 전개되는 것을 보면서 각 수의 아이디어를 들을 수 있습니다
- **기보 리뷰** — 주석이 달린 기보를 자연스럽게 레슨을 흡수하며 진행합니다
- **엔드게임 연습** — 중요한 칸에 집중하면서 해설이 안내합니다
- **언어 몰입** — 프랑스어, 독일어, 스페인어, 러시아어, 일본어, 중국어, 한국어로 모든 체스 용어가 번역된 체스를 학습합니다
- **접근성** — 읽기보다 듣기가 편한 분, 또는 책상에서 떨어져 학습하고 싶은 분에게

한번 사용해 보면, 음성 없는 주석으로 돌아가는 것은 영화를 무음으로 보는 것 같은 느낌이 될 것입니다.

## 프로바이더 선택

En Parlant~에는 다섯 가지 TTS 프로바이더가 탑재되어 있습니다. 시작하는 데 필요한 프로바이더는 하나뿐입니다.

### ElevenLabs

최고의 음성 품질. ElevenLabs는 표현력 있고 자연스러운 음성을 생성합니다. 수십 가지 개성적인 목소리를 선택할 수 있습니다. 8개 언어 모두 지원하며 CJK 발음도 우수합니다.

무료 한도는 월 10,000자 (주석이 달린 기보 2~5국 분량). 유료 플랜은 월 5달러부터 30,000자. 설정 간단: 계정 생성, API 키 복사, En Parlant~에 붙여넣기.

인터넷 필요. 음성 품질을 중시하는 분에게 최적.

**[ElevenLabs 설정 가이드](docs/tts/setup-elevenlabs.md)** *(영어)*

### Google Cloud TTS

품질, 언어 지원, 비용의 최적 균형. Google의 WaveNet 신경망 음성은 8개 언어 모두에서 자연스럽고 명료합니다. 무료 한도가 넉넉합니다 — 월 100만 자로 수백 국의 주석 기보를 커버합니다.

설정은 약 5분. 무료 한도를 초과하지 않는 한 요금 없음.

인터넷 필요. 대부분의 사용자에게 최적.

**[Google Cloud 설정 가이드](docs/tts/setup-google.md)** *(영어)*

### KittenTTS

완전히 로컬에서 작동하는 고품질 AI. 약 25MB의 경량 신경망 모델로 8개의 표현력 있는 음성(남성 4, 여성 4)을 제공합니다. 품질이 놀라울 정도로 좋습니다.

하드웨어 요구: KittenTTS는 PyTorch를 사용하여 CPU 추론을 수행하므로 최신 멀티코어 프로세서가 필요합니다. 현재 영어만 지원.

인터넷 불필요. API 키 불필요. 최고의 로컬 품질.

**[KittenTTS 설정 가이드](docs/tts/setup-kittentts.md)** *(영어)*

### System TTS

운영 체제에 내장된 음성 합성. 설치할 것 없음, API 키 없음, 서버 없음. 선택하면 바로 작동합니다. 음성 품질은 기본적이지만 즉시 사용 가능합니다.

Linux에서는 eSpeak 또는 speech-dispatcher, macOS에서는 시스템 음성, Windows에서는 SAPI.

인터넷 불필요. 빠른 테스트에 최적.

**[System TTS 설정 가이드](docs/tts/setup-system.md)** *(영어)*

### OpenTTS

Docker를 통해 로컬에서 실행되는 오픈소스 TTS 서버. 데이터가 컴퓨터 밖으로 나가지 않습니다. 여러 TTS 엔진(Larynx, Festival, eSpeak, Coqui-TTS)을 번들하여 영어만으로 75개 이상의 음성을 제공합니다.

품질 면에서 구세대 엔진이므로 ElevenLabs나 Google보다 기계적입니다. 유럽 언어에서 가장 잘 작동합니다 — CJK는 잘 지원되지 않습니다. 향후 버전에서 제거될 수 있습니다.

인터넷 불필요. API 키 불필요. 최대 프라이버시에 최적.

**[OpenTTS 설정 가이드](docs/tts/setup-opentts.md)** *(영어)*

### 추천

최고의 음성 품질을 원한다면 **ElevenLabs**부터 시작하세요. 품질과 무료 사용의 최적 균형은 **Google Cloud**가 월 수백 국을 커버합니다. 고품질 로컬 TTS는 **KittenTTS**가 모던 CPU에서 탁월합니다. 설정 없는 테스트는 **System TTS**가 즉시 작동합니다. 최대 프라이버시는 **OpenTTS**가 Docker로 로컬 실행합니다.

## 설정 참조

모든 TTS 설정은 **Settings > Sound**에 있습니다:

| 설정 | 기능 |
|------|------|
| **Text-to-Speech** | 모든 TTS 기능의 메인 스위치 |
| **Auto-Narrate on Move** | 수를 넘길 때 주석을 자동으로 읽어줌 |
| **TTS Provider** | 다섯 가지 프로바이더 간 전환 |
| **TTS Voice** | 프로바이더별 음성 선택 |
| **TTS Language** | 내레이션 언어 — 체스 용어 자동 번역 |
| **TTS Volume** | 내레이션 볼륨 |
| **TTS Speed** | 재생 속도 (0.5배~2배) — 오디오 재생성 없이 조정 |
| **ElevenLabs API Key** | ElevenLabs API 키 |
| **Google Cloud API Key** | Google Cloud API 키 |
| **KittenTTS CPU Threads** | 추론용 CPU 스레드 (0 = 자동) |
| **TTS Audio Cache** | 오디오 캐시를 지워 재생성 강제 |

## 지원 언어

TTS 내레이션은 체스 용어가 완전히 번역된 8개 언어를 지원합니다:

| 언어 | 체스 예시 |
|------|----------|
| **English** | Knight f3, check. A strong developing move. |
| **Francais** | Cavalier f3, echec. Un coup de developpement fort. |
| **Espanol** | Caballo f3, jaque. Un fuerte movimiento. |
| **Deutsch** | Springer f3, Schach. Ein starker Entwicklungszug. |
| **日本語** | ナイト f3、チェック。強い展開の手。 |
| **Русский** | Конь f3, шах. Сильный развивающий ход. |
| **中文** | 马 f3，将军。一步控制中心的强力出子。 |
| **한국어** | 나이트 f3, 체크. 중앙을 지배하는 강력한 전개 수. |

모든 체스 용어 — 기물 이름, "체크", "체크메이트", "캐슬링", "잡음", 그리고 "브릴리언트한 수"와 "대실수" 같은 평가 — 는 선택한 언어로 읽어집니다.

## 더 나은 경험을 위한 팁

- **Auto-Narrate를 활용하세요.** "Auto-Narrate on Move"를 켜고 화살표 키로 기보를 넘기기만 하면 됩니다.

- **자신의 대국에 주석을 달아 보세요.** TTS가 진가를 발휘하는 것은 *자신의* 대국 해설을 들을 때입니다.

- **재생 속도를 바꿔 보세요.** 꼼꼼히 연구하려면 1배속, 빠르게 복습하려면 1.3배속.

- **스피커 아이콘을 활용하세요.** 각 코멘트에 작은 스피커 아이콘이 있습니다. 클릭하면 해당 주석만 들을 수 있습니다.

- **언어를 바꿔서 체스 용어를 배우세요.** 제2언어로 체스를 공부하고 있다면 TTS 언어를 맞춰 보세요.

## 이 기능에 대해

En Croissant는 [Francisco Salgueiro](https://github.com/franciscoBSalgueiro)가 개발한 오픈소스 체스 학습 도구입니다. Francisco는 정말로 뛰어난 것을 만들어 GPL-3.0 라이선스로 공개했습니다. 이 TTS 기능은 그의 관대함 덕분에 존재합니다.

TTS 플러그인은 [Red Shed](https://redshed.ai)의 Darrell이 [Claude Code](https://www.anthropic.com/claude-code)의 도움을 받아 개발했습니다. 5개 프로바이더, 다국어 지원, 8개 언어 체스 용어 번역.

우리는 AI를 사용하여 이것을 만들었습니다. [자세히 보기](docs/ai-note.md).

## 문의

TTS 사용 경험을 듣고 싶습니다. 의견, 제안, 피드백은 언제든 환영합니다.

[GitHub](https://github.com/DarrellThomas/en-parlant)에서 이슈를 생성하시거나 **[darrell@redshed.ai](mailto:darrell@redshed.ai)**로 직접 연락해 주세요.
