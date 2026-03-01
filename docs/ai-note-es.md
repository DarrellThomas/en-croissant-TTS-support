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

Envie un pull request para agregar narracion text-to-speech. Francisco lo reviso y decidio que no era la direccion que queria para En Croissant. Esa es una decision de mantenedor, y la respeto — el conoce su proyecto mejor que nadie. Asi funciona el codigo abierto. La GPL me permite hacer un fork y construir en una direccion diferente, y agradezco esa libertad. Pero le debo la honestidad de decirlo directamente: sin En Croissant, En Parlant~ no existe. Punto.

Esto es lo que me queda dando vueltas. Francisco paso anos construyendo algo con cuidado — tomando decisiones dificiles, aprendiendo el framework, dando forma a la arquitectura a traves de cientos de commits. La funcionalidad TTS que agregue se construye sobre todo ese trabajo. No existiria sin las bases que el puso. Una IA me ayudo a moverme rapido, pero moverse rapido sobre el esfuerzo de anos de otra persona no es lo mismo que hacer lo que esa persona hizo.

Y no se que hacer con eso, honestamente. ¿Que significa la artesania cuando alguien puede extenderla a velocidad 10x? ¿Que significa pararse sobre los hombros de alguien cuando la escalera crecio tan alto tan rapido? No tengo respuestas ordenadas. Pero prefiero sentarme con la incomodidad que pretender que no esta ahi.

## El estado de las cosas

La comunidad de ajedrez obtiene un mejor producto porque herramientas como Claude Code existen. La brecha entre "ojala esta app pudiera narrar movimientos" y "narra movimientos en ocho idiomas con cinco proveedores TTS" paso de meses a dias.

Esto esta sucediendo en todas partes. Cada dominio. Cada oficio.

Algo de eso es genial. Un desarrollador solo con una buena idea puede competir con un equipo financiado.

Algo es genuinamente inquietante. Cuando el costo de construir cae hacia cero, ¿que pasa con las personas que se ganaban la vida en ese costo? Creo que la respuesta es el gusto, el juicio, y el preocuparse de verdad. Eso sigue siendo humano. Pero no voy a decirte que la transicion es indolora.

## Por que el ajedrez

El ajedrez es un refugio para mi. No soy Gran Maestro, y me encuentro siempre aprendiendo a lo largo de las decadas. Es el unico lugar donde tengo que pensar por mi mismo. Sin autocompletado. Sin sugerencias. Solo 64 casillas y 32 piezas y lo que mi cerebro pueda hacer con ellas.

Al tablero no le importan mis herramientas. No le importa mi GPU ni mi velocidad de inferencia. Solo pregunta: ¿puedes ver lo que esta pasando aqui? Eso es todo.

El ajedrez es donde voy para recordar lo que se siente usar mi propia mente.

## Una nota sobre la honestidad

He visto repositorios con miles de lineas de codigo generado por IA y cero reconocimiento. Gente haciendo pasar la produccion de Claude como propia en entrevistas, en trabajo para clientes, en contribuciones de codigo abierto. Lo entiendo. Hay un estigma. La gente escucha "asistido por IA" y piensa que es menor.

Pero aqui esta la cosa. Soy capitan de aerolinea. Treinta y nueve anos volando. Mi cabina esta llena de automatizacion. Piloto automatico, auto-throttle, fly-by-wire, GPS, vision sintetica. Nadie me ha preguntado nunca si estoy "realmente" pilotando el avion. Las herramientas no disminuyen la habilidad. Cambian lo que es la habilidad. El juicio, la conciencia situacional, la toma de decisiones cuando nada esta claro. Esa parte sigue siendo mia. Las herramientas solo me permiten operar a un nivel que no podria alcanzar a manos desnudas.

El software esta pasando por el mismo cambio que la aviacion paso hace decadas. Los puristas del vuelo manual siempre existiran, ¡y soy uno de ellos! Si estas en uno de mis aviones, de vez en cuando me veras pilotando todo manualmente. Del despegue al aterrizaje. Porque puedo. Porque esa habilidad importa. Pero tambien se cuando dejar que la automatizacion trabaje. ¿Saber la diferencia? Esa es la verdadera habilidad.

Este proyecto fue construido por un humano y una IA trabajando juntos. Estoy orgulloso de ambas mitades.

## Muestra tu trabajo

La mayoria de los proyectos "construidos con IA" se quedan en la etiqueta. Nosotros fuimos mas alla. El repositorio incluye el verdadero [documento de workflow de Claude Code](claude-workflow.md) — lo que la IA sabe, lo que se le dice, como funcionan las sesiones, donde el humano traza la linea. Los principios de programacion que guian cada sesion tambien estan en el repositorio, incluyendo una conversacion honesta sobre cuales reglas clasicas siguen vigentes en la era de la IA y cuales no.

Si tienes curiosidad por saber como se ve realmente el desarrollo asistido por IA — no la version de marketing, la cabina real — esta todo ahi. Codigo abierto significa proceso abierto.

## Cuidate

Si estas construyendo con IA, se honesto. Si te apoyas en el trabajo de alguien mas, dilo. Si el ritmo del cambio te inquieta, bien. Los que no se inquietan no estan prestando atencion.

Crecemos. Nos adaptamos. Una maquina derroto al campeon mundial de ajedrez en 1997 y en vez de que el juego muriera, crecio mas que nunca.

Construye cosas buenas. Da credito. Y encuentra tus propias 64 casillas.

Todos somos Kasparov ahora. Mirando el tablero. Preguntandonos que viene despues.

Cuidate.

-- Darrell

---

*En Parlant~ es un fork de [En Croissant](https://github.com/franciscoBSalgueiro/en-croissant) por Francisco Salgueiro, construido con [Claude Code](https://www.anthropic.com/claude-code) de Anthropic. El nombre significa "hablando" en frances. Porque este croissant te responde.*
