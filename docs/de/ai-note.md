[English](../en/ai-note.md) | [Français](../fr/ai-note.md) | [Español](../es/ai-note.md) | **Deutsch** | [日本語](../ja/ai-note.md) | [Русский](../ru/ai-note.md) | [中文](../zh/ai-note.md) | [한국어](../ko/ai-note.md)

# Ein Wort von Darrell

En Parlant~ ist ein Fork von [En Croissant](https://github.com/franciscoBSalgueiro/en-croissant), dem Open-Source-Schachstudientool von Francisco Salgueiro. Dieser Fork fugt Text-to-Speech-Narration hinzu — funf Anbieter, acht Sprachen, ubersetztes Schachvokabular — damit Sie Annotationen horen konnen, wahrend Ihre Augen auf dem Brett bleiben. Der Name bedeutet „beim Sprechen" auf Franzosisch. Weil dieses Croissant zuruckredet.

Diese Notiz handelt davon, wie es gebaut wurde, und was das meiner Meinung nach bedeutet.

## Deep Blue, und alles danach

11. Mai 1997. Deep Blue besiegt Kasparov. Sechste Partie. Die Berichterstattung las sich wie ein Nachruf auf das menschliche Gehirn. Ende einer Ara, und so weiter. Kasparov sturmte hinaus, uberzeugt, dass IBM betrogen hatte.

Aber Kasparov horte nicht mit Schach auf. Dieser Teil wird immer weggelassen. Er spielte weiter. Wurde besser. Studierte, was die Maschine getan hatte, und nahm es auf. Dann kam er mit etwas, das niemand erwartet hatte: Advanced Chess. Menschen und Computer spielen zusammen, als Team. Es stellte sich heraus, dass ein starker Mensch gepaart mit einer Maschine die Maschine allein schlagen konnte. Der Mensch brachte die Intuition. Die Maschine brachte die Rechenleistung. Zusammen waren sie etwas Neues.

Er nannte es das Zentaur-Modell. Fast dreissig Jahre spater sitze ich in einer Kiefer-Blockhütte in Ost-Texas und baue eine Schach-App mit einer KI, die nie mude wird, Rust-Fehlermeldungen zu lesen, und ich denke, Kasparov hatte recht.

## Gebaut mit Claude Code

Dieser Fork von En Croissant wurde mit [Claude Code](https://www.anthropic.com/claude-code) gebaut, Anthropics KI-Codierassistent. Jeder Rust-Befehl, jede React-Komponente, jedes Bash-Skript im TTS-System. Pair-programmiert, Mensch und KI. Ich werde nicht so tun, als ware es anders.

Das ist kein KI-Mull. Das ist Co-Entwicklung. Und es gibt einen echten Unterschied.

KI-Mull ist „mach mir eine Schach-App" einzutippen und auszuliefern, was zuruckkommt. Co-Entwicklung ist ein Mensch mit Jahrzehnten Ingenieurerfahrung und starken Meinungen uber Architektur, der sich mit einer KI hinsetzt und uber Fehlerbehandlung diskutiert. Der Mensch sagt „nein, das ist falsch, hier ist warum." Die KI sagt „fair, aber was ist mit diesem Randfall." Der Mensch bringt die Vision. Die KI bringt die Geschwindigkeit. Keiner baut das allein.

## Auf Franciscos Schultern

Francisco Salgueiro baute En Croissant uber Jahre durchdachter Architektur. Spate Nachte beim Debuggen von Tauri-Eigenheiten. Sorgfaltige UI-Arbeit mit Mantine. Ein PGN-Parser, der tatsachlich funktioniert. Engine-Integration, Datenbankverwaltung, Puzzle-Support. Alles. Er hat etwas gebaut, das ihm am Herzen lag, und das sieht man.

Ich reichte einen Pull Request ein, um Text-to-Speech-Narration hinzuzufugen. Francisco prufte ihn und entschied, dass das nicht die Richtung war, die er fur En Croissant wollte. Das ist die Entscheidung eines Maintainers, und ich respektiere sie — er kennt sein Projekt besser als jeder andere. So funktioniert Open Source. Die GPL erlaubt mir zu forken und in eine andere Richtung zu bauen, und ich bin dankbar fur diese Freiheit. Aber ich schulde ihm die Ehrlichkeit, es direkt zu sagen: ohne En Croissant existiert En Parlant~ nicht. Punkt.

Hier ist, was mich beschaftigt. Francisco hat Jahre damit verbracht, etwas mit Sorgfalt zu bauen — schwierige Entscheidungen zu treffen, das Framework zu lernen, die Architektur durch Hunderte von Commits zu formen. Das TTS-Feature, das ich hinzugefugt habe, baut auf all dieser Arbeit auf. Es wurde ohne das Fundament, das er gelegt hat, nicht existieren. Eine KI hat mir geholfen, schnell voranzukommen, aber schnell voranzukommen auf der Basis von jemandes jahrelanger Arbeit ist nicht dasselbe wie das zu tun, was er getan hat.

Und ich weiss ehrlich gesagt nicht, was ich damit anfangen soll. Was bedeutet Handwerkskunst, wenn jemand sie mit 10-facher Geschwindigkeit erweitern kann? Was bedeutet es, auf jemandes Schultern zu stehen, wenn die Leiter so schnell so hoch gewachsen ist? Ich habe keine sauberen Antworten. Aber ich sitze lieber mit dem Unbehagen, als so zu tun, als ware es nicht da.

## Der Stand der Dinge

Die Schachgemeinschaft bekommt ein besseres Produkt, weil Werkzeuge wie Claude Code existieren. Die Lucke zwischen „ich wunschte, diese App konnte Zuge vorlesen" und „sie liest Zuge in acht Sprachen mit funf TTS-Anbietern vor" schrumpfte von Monaten auf Tage.

Das passiert uberall. Jede Domane. Jedes Handwerk.

Einiges davon ist grossartig. Ein Solo-Entwickler mit einer guten Idee kann jetzt mit einem finanzierten Team konkurrieren.

Einiges ist echt beunruhigend. Wenn die Kosten des Bauens gegen null fallen, was passiert mit den Menschen, die ihren Lebensunterhalt in diesen Kosten verdienten? Ich denke, die Antwort ist Geschmack, Urteilsvermogen und sich wirklich kummern. Das ist immer noch menschlich.

## Warum Schach

Schach ist ein Zufluchtsort fur mich. Ich bin kein Grossmeister, und ich lerne immer noch, uber die Jahrzehnte hinweg. Es ist der einzige Ort, wo ich selbst denken muss. Kein Autocomplete. Keine Vorschlage. Nur 64 Felder und 32 Figuren und was auch immer mein Gehirn damit anfangen kann.

Das Brett interessiert sich nicht fur meine Tools. Nicht fur meine GPU oder meine Inferenzgeschwindigkeit. Es fragt nur: kannst du sehen, was hier passiert? Das ist alles.

Schach ist, wo ich hingehe, um mich daran zu erinnern, wie es sich anfuhlt, meinen eigenen Verstand zu benutzen.

## Eine Anmerkung zur Ehrlichkeit

Ich habe Repos gesehen mit Tausenden Zeilen KI-generiertem Code und null Anerkennung. Leute, die Claudes Output als ihren eigenen ausgeben in Vorstellungsgesprachen, in Kundenarbeit, in Open-Source-Beitragen. Ich verstehe das. Es gibt ein Stigma. Die Leute horen „KI-gestutzt" und denken weniger.

Aber hier ist die Sache. Ich bin Flugkapitan. Neununddreissig Jahre Fliegerei. Mein Cockpit ist vollgestopft mit Automatisierung. Autopilot, Autothrottle, Fly-by-Wire, GPS, synthetische Sicht. Niemand hat mich je gefragt, ob ich „wirklich" das Flugzeug fliege. Die Werkzeuge verringern nicht die Kompetenz. Sie verandern, was die Kompetenz ist. Urteilsvermogen, Situationsbewusstsein, Entscheidungsfindung, wenn nichts klar ist. Dieser Teil gehort immer noch mir. Die Werkzeuge lassen mich einfach auf einem Niveau operieren, das ich mit blossen Handen nicht erreichen konnte.

Software durchlauft gerade denselben Wandel, den die Luftfahrt vor Jahrzehnten durchlaufen hat. Die Puristen des Handfliegens wird es immer geben, und ich bin einer von ihnen! Wenn ihr in einem meiner Flugzeuge sitzt, werdet ihr mich ab und zu das ganze Ding von Hand fliegen sehen. Vom Start bis zur Landung. Weil ich es kann. Weil diese Fahigkeit zahlt. Aber ich weiss auch, wann ich die Automatisierung arbeiten lassen muss. Den Unterschied kennen? Das ist die wahre Kompetenz.

Dieses Projekt wurde von einem Menschen und einer KI gemeinsam gebaut. Ich bin stolz auf beide Halften.

## Zeigt eure Arbeit

Die meisten Projekte, die „mit KI gebaut" wurden, horen beim Label auf. Wir sind weitergegangen. Das Repository enthalt das tatsachliche [Claude Code Workflow-Dokument](../claude-workflow.md) — was die KI weiss, was ihr gesagt wird, wie Sitzungen ablaufen, wo der Mensch die Grenze zieht. Die Programmierprinzipien, die jede Sitzung leiten, sind ebenfalls im Repository, einschliesslich einer ehrlichen Diskussion daruber, welche klassischen Regeln im KI-Zeitalter noch gelten und welche nicht.

Wenn ihr neugierig seid, wie KI-gestutztes Entwickeln wirklich aussieht — nicht die Marketing-Version, das echte Cockpit — es ist alles da. Open Source bedeutet offener Prozess.

## Passt auf euch auf

Wenn ihr mit KI baut, seid ehrlich daruber. Wenn ihr auf der Arbeit anderer steht, sagt es. Wenn das Tempo der Veranderung euch beunruhigt, gut. Die, die es nicht beunruhigt, passen nicht auf.

Wir wachsen. Wir passen uns an. Eine Maschine besiegte den Schachweltmeister 1997 und statt dass das Spiel starb, wurde es grosser als je zuvor.

Baut gute Dinge. Gebt Anerkennung. Und findet eure eigenen 64 Felder.

Wir sind alle Kasparov jetzt. Starren auf das Brett. Fragen uns, was als Nachstes kommt.

Passt auf euch auf.

-- Darrell

---

*En Parlant~ ist ein Fork von [En Croissant](https://github.com/franciscoBSalgueiro/en-croissant) von Francisco Salgueiro, gebaut mit [Claude Code](https://www.anthropic.com/claude-code) von Anthropic. Der Name bedeutet „beim Sprechen" auf Franzosisch. Weil dieses Croissant zuruckredet.*
