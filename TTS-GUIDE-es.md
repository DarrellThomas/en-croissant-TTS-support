# Guia de narracion Text-to-Speech

*Esta guia tambien esta disponible en:
[English](TTS-GUIDE.md) |
[Francais](TTS-GUIDE-fr.md) |
[Deutsch](TTS-GUIDE-de.md) |
[日本語](TTS-GUIDE-ja.md) |
[Русский](TTS-GUIDE-ru.md) |
[中文](TTS-GUIDE-zh.md) |
[한국어](TTS-GUIDE-ko.md)*

## Por que el TTS cambia tu forma de estudiar ajedrez

Cuando revisas una partida anotada, tus ojos hacen doble trabajo. Intentas seguir las piezas en el tablero *y* leer los comentarios al mismo tiempo. Tu mirada va y viene entre el tablero y el panel de anotaciones, y cada vez que lo hace, pierdes la posicion por una fraccion de segundo. Tienes que volver a encontrar las piezas, retrazar las lineas, reconstruir la imagen en tu cabeza.

El text-to-speech soluciona esto por completo.

Con el TTS activado, avanzas por una partida y las anotaciones se *leen en voz alta*. Tus ojos permanecen en el tablero. Ves al caballo aterrizar en f3 mientras una voz te explica por que es un buen movimiento de desarrollo. Ves la estructura de peones cambiar mientras el comentario explica la idea estrategica. El tablero y las palabras llegan juntos, como un entrenador sentado frente a ti.

Esto es especialmente util para:

- **Estudio de aperturas** — escucha las ideas detras de cada movimiento mientras observas la posicion desarrollarse
- **Revision de partidas** — recorre tus partidas anotadas y absorbe las lecciones naturalmente
- **Practica de finales** — mantén la vista en las casillas criticas mientras el comentario te guia
- **Inmersion linguistica** — estudia ajedrez en frances, aleman, espanol, ruso, japones, chino o coreano con todos los terminos traducidos
- **Accesibilidad** — para jugadores que prefieren escuchar que leer, o que quieren estudiar lejos del escritorio

Una vez que lo pruebes, volver a las anotaciones silenciosas sera como ver una pelicula sin sonido.

## Elegir un proveedor

En Parlant~ viene con cinco proveedores TTS. Solo necesitas uno para empezar. Elige el que mejor te convenga.

### ElevenLabs

La mejor calidad de voz disponible. ElevenLabs produce habla expresiva y natural con verdadera personalidad — algunas voces suenan como narradores de audiolibros, otras como presentadores. Decenas de voces unicas. Compatible con los ocho idiomas con excelente pronunciacion CJK.

El nivel gratuito ofrece 10.000 caracteres al mes (suficiente para 2-5 partidas anotadas). Los planes de pago empiezan en 5$/mes por 30.000 caracteres. Configuracion simple: crea una cuenta, copia tu clave API, pegala en En Parlant~.

Requiere internet. Ideal para entusiastas de la calidad vocal.

**[Guia de configuracion de ElevenLabs](docs/tts/setup-elevenlabs.md)** *(en ingles)*

### Google Cloud TTS

El mejor equilibrio entre calidad, soporte de idiomas y valor. Las voces neuronales WaveNet de Google suenan naturales y claras en los ocho idiomas. El nivel gratuito es generoso — un millon de caracteres al mes cubre cientos de partidas anotadas.

La configuracion tarda unos 5 minutos: crea una cuenta de Google Cloud, habilita la API Text-to-Speech, genera una clave API. Sin cargos a menos que excedas el nivel gratuito.

Requiere internet. Ideal para la mayoria de usuarios.

**[Guia de configuracion de Google Cloud](docs/tts/setup-google.md)** *(en ingles)*

### KittenTTS

IA local de alta calidad que funciona completamente en tu maquina. Usa un modelo neuronal ligero de ~25 MB con 8 voces expresivas (4 masculinas, 4 femeninas). La calidad es notablemente buena — entonacion natural, pronunciacion clara, expresividad autentica.

La desventaja es el hardware: KittenTTS usa PyTorch para inferencia en CPU y necesita un procesador multi-nucleo moderno. Solo ingles por ahora.

No requiere internet. Sin clave API. Mejor calidad local.

**[Guia de configuracion de KittenTTS](docs/tts/setup-kittentts.md)** *(en ingles)*

### System TTS

La sintesis de voz integrada de tu sistema operativo. Nada que instalar, sin claves API, sin servidores. Seleccionalo y listo. La calidad de voz es basica, pero funciona al instante.

En Linux es tipicamente eSpeak o speech-dispatcher; en macOS es la voz del sistema; en Windows es SAPI.

No requiere internet. Ideal para pruebas rapidas.

**[Guia de configuracion de System TTS](docs/tts/setup-system.md)** *(en ingles)*

### OpenTTS

Un servidor TTS de codigo abierto que funciona en tu maquina via Docker. Nada sale de tu computadora. Incluye varios motores TTS (Larynx, Festival, eSpeak, Coqui-TTS), ofreciendo mas de 75 voces solo para ingles.

La desventaja es la calidad: estos motores son mas antiguos, asi que el resultado suena mas robotico. Funciona mejor con idiomas europeos — CJK no esta bien soportado. OpenTTS podria ser eliminado en una version futura.

No requiere internet. Sin clave API. Ideal para maxima privacidad.

**[Guia de configuracion de OpenTTS](docs/tts/setup-opentts.md)** *(en ingles)*

### Nuestra recomendacion

Empieza con **ElevenLabs** si quieres la mejor calidad vocal. Para el mejor equilibrio calidad/uso gratuito, **Google Cloud** cubre cientos de partidas al mes. Para TTS local de alta calidad, **KittenTTS** es excelente si tienes una CPU moderna. Para probar sin configuracion, **System TTS** funciona al instante. Para maxima privacidad, **OpenTTS** funciona localmente via Docker.

## Referencia de ajustes

Todos los ajustes TTS estan en **Settings > Sound**:

| Ajuste | Funcion |
|--------|---------|
| **Text-to-Speech** | Interruptor principal para todas las funciones TTS |
| **Auto-Narrate on Move** | Leer automaticamente las anotaciones al avanzar por los movimientos |
| **TTS Provider** | Elegir entre los cinco proveedores |
| **TTS Voice** | Seleccion de voz especifica del proveedor |
| **TTS Language** | Idioma de narracion — los terminos de ajedrez se traducen automaticamente |
| **TTS Volume** | Volumen de la narracion |
| **TTS Speed** | Velocidad de reproduccion (0,5x a 2x) — ajusta sin regenerar el audio |
| **ElevenLabs API Key** | Tu clave API de ElevenLabs |
| **Google Cloud API Key** | Tu clave API de Google Cloud |
| **KittenTTS CPU Threads** | Hilos de CPU para inferencia (0 = auto) |
| **TTS Audio Cache** | Limpiar cache de audio para forzar regeneracion |

## Idiomas soportados

La narracion TTS soporta ocho idiomas con vocabulario de ajedrez completamente traducido:

| Idioma | Ejemplo de ajedrez |
|--------|-------------------|
| **English** | Knight f3, check. A strong developing move. |
| **Francais** | Cavalier f3, echec. Un coup de developpement fort. |
| **Espanol** | Caballo f3, jaque. Un fuerte movimiento. |
| **Deutsch** | Springer f3, Schach. Ein starker Entwicklungszug. |
| **日本語** | ナイト f3、チェック。強い展開の手。 |
| **Русский** | Конь f3, шах. Сильный развивающий ход. |
| **中文** | 马 f3，将军。一步控制中心的强力出子。 |
| **한국어** | 나이트 f3, 체크. 중앙을 지배하는 강력한 전개 수. |

Todos los terminos de ajedrez — nombres de piezas, "jaque", "jaque mate", "enroque", "captura", anotaciones como "Jugada brillante" y "Error grave" — se pronuncian en el idioma seleccionado.

## Consejos para la mejor experiencia

- **Usa Auto-Narrate.** Activa "Auto-Narrate on Move" y usa las flechas para recorrer las partidas. El comentario llega naturalmente mientras avanzas.

- **Anota tus propias partidas.** El TTS brilla de verdad cuando escuchas comentarios sobre *tus* partidas.

- **Prueba diferentes velocidades.** Algunos jugadores prefieren 1x para estudio cuidadoso, otros 1,3x para revision rapida.

- **Usa el icono de altavoz.** Cada comentario en la lista de movimientos tiene un pequeno icono de altavoz. Haz clic para escuchar esa anotacion.

- **Cambia de idioma para aprender vocabulario.** Si estudias ajedrez en un segundo idioma, ajusta el idioma TTS para que coincida.

## Sobre esta funcion

En Croissant es una herramienta de estudio de ajedrez de codigo abierto creada por [Francisco Salgueiro](https://github.com/franciscoBSalgueiro). Francisco construyo algo genuinamente especial y lo publico bajo licencia GPL-3.0. Esta funcion TTS existe gracias a su generosidad.

El plugin TTS fue desarrollado por Darrell en [Red Shed](https://redshed.ai), con la ayuda de [Claude Code](https://www.anthropic.com/claude-code). Cinco proveedores, soporte multi-idioma, vocabulario de ajedrez traducido en ocho idiomas.

Usamos IA para construir esto. [Lee mas aqui](docs/ai-note.md).

## Contacto

Nos encantaria saber como te funciona el TTS. Comentarios, sugerencias y retroalimentacion son siempre bienvenidos.

- **¿Quieres un idioma que aun no soportamos?** Dinoslo.
- **¿Encontraste un error?** Dinoslo y lo arreglaremos rapido.
- **¿Tienes una idea para otro proveedor TTS?** Estamos encantados de agregarlo.

Abre un ticket en [GitHub](https://github.com/DarrellThomas/en-parlant), o contactanos directamente en **[darrell@redshed.ai](mailto:darrell@redshed.ai)**.
