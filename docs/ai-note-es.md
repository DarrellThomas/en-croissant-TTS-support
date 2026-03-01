# Una nota de Darrell

*Esta nota tambien esta disponible en:
[English](ai-note.md) |
[Francais](ai-note-fr.md) |
[Deutsch](ai-note-de.md) |
[日本語](ai-note-ja.md) |
[Русский](ai-note-ru.md) |
[中文](ai-note-zh.md) |
[한국어](ai-note-ko.md)*

En Parlant~ es un fork de [En Croissant](https://github.com/franciscoBSalgueiro/en-croissant), la herramienta de estudio de ajedrez de codigo abierto de Francisco Salgueiro. Este fork agrega narracion text-to-speech — cinco proveedores, ocho idiomas, vocabulario de ajedrez traducido — para que puedas escuchar las anotaciones mientras tus ojos permanecen en el tablero. El nombre significa "hablando" en frances. Porque este croissant te responde.

Esta nota trata sobre como se construyo, y lo que creo que eso significa.

## Deep Blue, y todo lo que vino despues

11 de mayo de 1997. Deep Blue derrota a Kasparov. Sexta partida. La cobertura mediatica parecia un obituario para el cerebro humano. Fin de una era, y todo eso. Kasparov salio furioso, convencido de que IBM hizo trampa.

Pero Kasparov no dejo el ajedrez. Esa parte siempre se omite. Siguio jugando. Mejoro. Estudio lo que la maquina habia hecho y lo asimilo. Luego propuso algo que nadie esperaba: Ajedrez Avanzado. Humanos y computadoras jugando juntos, como equipo. Resulta que un humano fuerte asociado con una maquina podia ganarle a la maquina sola. El humano aportaba la intuicion. La maquina aportaba el trabajo pesado. Juntos eran algo nuevo.

Lo llamo el modelo centauro. Casi treinta anos despues estoy sentado en una cabana de pino en el Este de Texas construyendo una app de ajedrez con una IA que nunca se cansa de leer mensajes de error de Rust, y creo que Kasparov lo clavo.

## Construido con Claude Code

Este fork de En Croissant fue construido con [Claude Code](https://www.anthropic.com/claude-code), el asistente de codificacion IA de Anthropic. Cada comando Rust, cada componente React, cada script bash en el sistema TTS. Programacion en pareja, humano e IA. No voy a fingir lo contrario.

Esto no es basura de IA. Esto es co-desarrollo. Y hay una diferencia real.

La basura de IA es escribir "hazme una app de ajedrez" y enviar lo que sea que regrese. El co-desarrollo es un humano con decadas de experiencia en ingenieria y opiniones fuertes sobre arquitectura sentandose con una IA y discutiendo sobre el manejo de errores. El humano dice "no, eso esta mal, aqui esta por que." La IA dice "de acuerdo, pero que hay de este caso limite." El humano aporta la vision. La IA aporta la velocidad. Ninguno construye esto solo.

## Sobre los hombros de Francisco

Francisco Salgueiro construyo En Croissant a lo largo de anos de arquitectura reflexiva. Noches en vela depurando las peculiaridades de Tauri. Trabajo cuidadoso de interfaz con Mantine. Un parser PGN que realmente funciona. Integracion de motores, gestion de bases de datos, soporte de puzzles. Todo. Construyo algo que le importaba y se nota.

Le pregunte sobre integrar text-to-speech. Voces premium, multiples proveedores, narracion que hace que estudiar partidas se sienta como escuchar una transmision. Ese no era su estilo, y lo respeto. Asi funciona el codigo abierto. Puedo tomar su trabajo y construir en una direccion diferente. Pero le debo la honestidad de decirlo directamente: sin En Croissant, En Parlant~ no existe. Punto.

Lo que Francisco logro en anos de artesania dedicada, yo lo amplie en un fin de semana con una cafetera, y una IA que nunca se cansa.

No es una fanfarronada. Es simplemente donde estamos ahora.

Y no se que hacer con eso, honestamente. ¿Que significa la artesania cuando el oficio se acelera 10x? No tengo respuestas ordenadas. Pero prefiero sentarme con la incomodidad que pretender que no esta ahi.

## El estado de las cosas

La comunidad de ajedrez obtiene un mejor producto porque herramientas como esta existen. La brecha entre "ojala esta app pudiera narrar movimientos" y "narra movimientos en ocho idiomas con cinco proveedores TTS" paso de meses a dias.

Esto esta sucediendo en todas partes. Cada dominio. Cada oficio.

Algo de eso es genial. Un desarrollador solo con una buena idea puede competir con un equipo financiado.

Algo es genuinamente inquietante. Cuando el costo de construir cae hacia cero, ¿que pasa con las personas que se ganaban la vida en ese costo? Creo que la respuesta es el gusto, el juicio, y el preocuparse de verdad. Eso sigue siendo humano. Pero no voy a decirte que la transicion es indolora.

## Por que el ajedrez

El ajedrez es un refugio. El unico lugar donde tengo que pensar por mi mismo. Sin autocompletado. Sin sugerencias. Solo 64 casillas y 32 piezas y lo que mi cerebro pueda hacer con ellas.

Al tablero no le importan mis herramientas. No le importa mi GPU ni mi velocidad de inferencia. Solo pregunta: ¿puedes ver lo que esta pasando aqui? Eso es todo.

El ajedrez es donde voy para recordar lo que se siente usar mi propia mente.

## Una nota sobre la honestidad

He visto repositorios con miles de lineas de codigo generado por IA y cero reconocimiento. Soy capitan de aerolinea. Treinta y cinco anos en el asiento. Mi cabina esta llena de automatizacion. Piloto automatico, auto-throttle, fly-by-wire, GPS, vision sintetica. Nadie me ha preguntado nunca si estoy "realmente" pilotando el avion. Las herramientas no disminuyen la habilidad. Cambian lo que es la habilidad.

Este proyecto fue construido por un humano y una IA trabajando juntos. Estoy orgulloso de ambas mitades.

## Cuidate

Si estas construyendo con IA, se honesto. Si te apoyas en el trabajo de alguien mas, dilo. Si el ritmo del cambio te inquieta, bien. Los que no se inquietan no estan prestando atencion.

Crecemos. Nos adaptamos. Una maquina derroto al campeon mundial de ajedrez en 1997 y en vez de que el juego muriera, crecio mas que nunca.

Construye cosas buenas. Da credito. Y encuentra tus propias 64 casillas.

Todos somos Kasparov ahora. Mirando el tablero. Preguntandonos que viene despues.

Cuidate.

-- Darrell

---

*En Parlant~ es un fork de [En Croissant](https://github.com/franciscoBSalgueiro/en-croissant) por Francisco Salgueiro, construido con [Claude Code](https://www.anthropic.com/claude-code) de Anthropic. El nombre significa "hablando" en frances. Porque este croissant te responde.*
