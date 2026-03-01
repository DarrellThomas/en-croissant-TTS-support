[English](../en/tts-guide.md) | [Français](../fr/tts-guide.md) | [Español](../es/tts-guide.md) | **Deutsch** | [日本語](../ja/tts-guide.md) | [Русский](../ru/tts-guide.md) | [中文](../zh/tts-guide.md) | [한국어](../ko/tts-guide.md)

# Text-to-Speech Narrations-Anleitung

## Warum TTS Ihr Schachstudium verandert

Wenn Sie eine kommentierte Partie analysieren, leisten Ihre Augen Doppelarbeit. Sie versuchen, den Figuren auf dem Brett zu folgen *und* gleichzeitig die Kommentare zu lesen. Ihr Blick springt zwischen dem Brett und dem Annotationspanel hin und her, und jedes Mal verlieren Sie die Position fur den Bruchteil einer Sekunde.

Text-to-Speech lost dieses Problem vollstandig.

Mit aktiviertem TTS gehen Sie durch eine Partie und die Annotationen werden Ihnen *vorgelesen*. Ihre Augen bleiben auf dem Brett. Sie beobachten, wie der Springer auf f3 landet, wahrend eine Stimme erklart, warum das ein starker Entwicklungszug ist. Brett und Worte kommen zusammen an, wie ein Trainer, der Ihnen gegenuber sitzt.

Das ist besonders wirkungsvoll fur:

- **Eroffnungsstudium** — horen Sie die Ideen hinter jedem Zug, wahrend Sie die Position sich entwickeln sehen
- **Partiereview** — gehen Sie durch Ihre kommentierten Partien und nehmen Sie die Lektionen naturlich auf
- **Endspielpraxis** — halten Sie den Fokus auf den kritischen Feldern, wahrend der Kommentar Sie leitet
- **Sprachimmersion** — studieren Sie Schach auf Franzosisch, Deutsch, Spanisch, Russisch, Japanisch, Chinesisch oder Koreanisch mit allen ubersetzten Fachbegriffen
- **Barrierefreiheit** — fur Spieler, die lieber zuhoren als lesen

Wenn Sie es einmal ausprobiert haben, fuhlen sich stumme Annotationen an wie ein Film ohne Ton.

## Einen Anbieter wahlen

En Parlant~ wird mit funf TTS-Anbietern ausgeliefert. Sie brauchen nur einen, um loszulegen.

### ElevenLabs

Die beste verfugbare Sprachqualitat. ElevenLabs produziert ausdrucksstarke, menschenahnliche Sprache mit echter Personlichkeit. Dutzende einzigartige Stimmen. Unterstutzt alle acht Sprachen mit ausgezeichneter CJK-Aussprache.

Das kostenlose Kontingent bietet 10.000 Zeichen pro Monat (ausreichend fur 2-5 kommentierte Partien). Bezahlplane ab 5$/Monat fur 30.000 Zeichen. Einfache Einrichtung: Konto erstellen, API-Schlussel kopieren, in En Parlant~ einfugen.

Erfordert Internet. Ideal fur Sprachqualitats-Enthusiasten.

**[ElevenLabs Einrichtungsanleitung](../tts/setup-elevenlabs.md)** *(auf Englisch)*

### Google Cloud TTS

Die beste Balance aus Qualitat, Sprachunterstutzung und Wert. Googles WaveNet-Neuronalstimmen klingen naturlich und klar in allen acht Sprachen. Das kostenlose Kontingent ist grosszugig — eine Million Zeichen pro Monat deckt Hunderte von kommentierten Partien ab.

Die Einrichtung dauert etwa 5 Minuten. Keine Kosten, es sei denn, Sie uberschreiten das kostenlose Kontingent.

Erfordert Internet. Ideal fur die meisten Benutzer.

**[Google Cloud Einrichtungsanleitung](../tts/setup-google.md)** *(auf Englisch)*

### KittenTTS

Hochwertige lokale KI, die vollstandig auf Ihrem Rechner lauft. Verwendet ein leichtgewichtiges ~25-MB-Neuronalmodell mit 8 ausdrucksstarken Stimmen (4 mannlich, 4 weiblich). Die Qualitat ist bemerkenswert gut.

Der Kompromiss ist die Hardware: KittenTTS verwendet PyTorch fur CPU-Inferenz und benotigt einen modernen Mehrkern-Prozessor. Derzeit nur Englisch.

Kein Internet erforderlich. Kein API-Schlussel. Beste lokale Qualitat.

**[KittenTTS Einrichtungsanleitung](../tts/setup-kittentts.md)** *(auf Englisch)*

### System TTS

Die eingebaute Sprachsynthese Ihres Betriebssystems. Nichts zu installieren, keine API-Schlussel, keine Server. Auswahlen und loslegen. Die Sprachqualitat ist grundlegend, aber es funktioniert sofort.

Unter Linux typischerweise eSpeak oder speech-dispatcher; unter macOS die Systemstimme; unter Windows SAPI.

Kein Internet erforderlich. Ideal fur schnelle Tests.

**[System TTS Einrichtungsanleitung](../tts/setup-system.md)** *(auf Englisch)*

### OpenTTS

Ein Open-Source-TTS-Server, der uber Docker auf Ihrem Rechner lauft. Nichts verlasst Ihren Computer. Bundelt mehrere TTS-Engines (Larynx, Festival, eSpeak, Coqui-TTS) mit uber 75 Stimmen allein fur Englisch.

Der Kompromiss ist die Qualitat: altere Engines, daher roboterhafter als ElevenLabs oder Google. Funktioniert am besten mit europaischen Sprachen — CJK wird nicht gut unterstutzt. OpenTTS konnte in einer zukunftigen Version entfernt werden.

Kein Internet erforderlich. Kein API-Schlussel. Ideal fur maximale Privatsphare.

**[OpenTTS Einrichtungsanleitung](../tts/setup-opentts.md)** *(auf Englisch)*

### Unsere Empfehlung

Beginnen Sie mit **ElevenLabs** fur die beste Sprachqualitat. Fur das beste Verhaltnis von Qualitat und kostenloser Nutzung deckt **Google Cloud** Hunderte von Partien pro Monat ab. Fur hochwertiges lokales TTS ist **KittenTTS** ausgezeichnet bei moderner CPU. Fur Tests ohne Einrichtung funktioniert **System TTS** sofort. Fur maximale Privatsphare lauft **OpenTTS** lokal uber Docker.

## Einstellungsreferenz

Alle TTS-Einstellungen finden Sie unter **Settings > Sound**:

| Einstellung | Funktion |
|-------------|----------|
| **Text-to-Speech** | Hauptschalter fur alle TTS-Funktionen |
| **Auto-Narrate on Move** | Annotationen automatisch vorlesen beim Durchgehen der Zuge |
| **TTS Provider** | Zwischen den funf Anbietern wechseln |
| **TTS Voice** | Anbieterspezifische Stimmauswahl |
| **TTS Language** | Narrations-Sprache — Schachbegriffe werden automatisch ubersetzt |
| **TTS Volume** | Lautstarke der Narration |
| **TTS Speed** | Wiedergabegeschwindigkeit (0,5x bis 2x) — anpassbar ohne Audio-Neugenerierung |
| **ElevenLabs API Key** | Ihr ElevenLabs-API-Schlussel |
| **Google Cloud API Key** | Ihr Google Cloud-API-Schlussel |
| **KittenTTS CPU Threads** | CPU-Threads fur Inferenz (0 = automatisch) |
| **TTS Audio Cache** | Audio-Cache loschen zur erzwungenen Neugenerierung |

## Unterstutzte Sprachen

TTS-Narration unterstutzt acht Sprachen mit vollstandig ubersetztem Schachvokabular:

| Sprache | Schachbeispiel |
|---------|---------------|
| **English** | Knight f3, check. A strong developing move. |
| **Francais** | Cavalier f3, echec. Un coup de developpement fort. |
| **Espanol** | Caballo f3, jaque. Un fuerte movimiento. |
| **Deutsch** | Springer f3, Schach. Ein starker Entwicklungszug. |
| **日本語** | ナイト f3、チェック。強い展開の手。 |
| **Русский** | Конь f3, шах. Сильный развивающий ход. |
| **中文** | 马 f3，将军。一步控制中心的强力出子。 |
| **한국어** | 나이트 f3, 체크. 중앙을 지배하는 강력한 전개 수. |

Alle Schachbegriffe — Figurennamen, "Schach", "Schachmatt", "Rochade", "schlagt", Zugbewertungen wie "Brillanter Zug" und "Patzer" — werden in der ausgewahlten Sprache gesprochen.

## Tipps fur die beste Erfahrung

- **Nutzen Sie Auto-Narrate.** Aktivieren Sie "Auto-Narrate on Move" und verwenden Sie die Pfeiltasten. Der Kommentar kommt naturlich wahrend Sie vorwarts gehen.

- **Kommentieren Sie Ihre eigenen Partien.** TTS glanzt wirklich, wenn Sie Kommentare zu *Ihren* Partien horen.

- **Probieren Sie verschiedene Geschwindigkeiten.** Manche Spieler bevorzugen 1x fur sorgfaltiges Studium, andere 1,3x fur schnellere Durchsicht.

- **Nutzen Sie das Lautsprecher-Symbol.** Jeder Kommentar in der Zugliste hat ein kleines Lautsprecher-Symbol. Klicken Sie darauf, um diese Annotation zu horen.

- **Wechseln Sie die Sprache, um Vokabular zu lernen.** Wenn Sie Schach in einer Zweitsprache studieren, stellen Sie die TTS-Sprache entsprechend ein.

## Uber diese Funktion

En Croissant ist ein Open-Source-Schachstudientool von [Francisco Salgueiro](https://github.com/franciscoBSalgueiro). Francisco hat etwas wirklich Besonderes geschaffen und es unter der GPL-3.0-Lizenz veroffentlicht. Diese TTS-Funktion existiert dank seiner Grosszugigkeit.

Das TTS-Plugin wurde von Darrell bei [Red Shed](https://redshed.ai) entwickelt, mit Hilfe von [Claude Code](https://www.anthropic.com/claude-code). Funf Anbieter, Mehrsprachen-Unterstutzung, ubersetztes Schachvokabular in acht Sprachen.

Wir haben KI benutzt, um dies zu bauen. [Mehr erfahren](ai-note.md).

## Kontakt

Wir wurden gerne horen, wie TTS fur Sie funktioniert. Kommentare, Vorschlage und Feedback sind immer willkommen.

Offnen Sie ein Ticket auf [GitHub](https://github.com/DarrellThomas/en-parlant), oder kontaktieren Sie uns direkt unter **[darrell@redshed.ai](mailto:darrell@redshed.ai)**.
