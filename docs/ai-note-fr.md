# Un mot de Darrell

*Cette note est aussi disponible en :
[English](ai-note.md) |
[Espanol](ai-note-es.md) |
[Deutsch](ai-note-de.md) |
[日本語](ai-note-ja.md) |
[Русский](ai-note-ru.md) |
[中文](ai-note-zh.md) |
[한국어](ai-note-ko.md)*

En Parlant~ est un fork d'[En Croissant](https://github.com/franciscoBSalgueiro/en-croissant), l'outil d'etude d'echecs open-source de Francisco Salgueiro. Ce fork ajoute la narration text-to-speech — cinq fournisseurs, huit langues, vocabulaire d'echecs traduit — pour que vous puissiez entendre les annotations pendant que vos yeux restent sur l'echiquier. Le nom signifie « en parlant » en francais. Parce que ce croissant vous repond.

Cette note explique comment il a ete construit, et ce que cela signifie selon moi.

## Deep Blue, et tout ce qui a suivi

11 mai 1997. Deep Blue bat Kasparov. Sixieme partie. La couverture mediatique ressemblait a un avis de deces pour le cerveau humain. Fin d'une ere, tout ca. Kasparov est sorti furieux, convaincu qu'IBM avait triche.

Mais Kasparov n'a pas arrete les echecs. Cette partie est toujours omise. Il a continue a jouer. S'est ameliore. A etudie ce que la machine avait fait et l'a assimile. Puis il a propose quelque chose que personne n'attendait : les Echecs Avances. Des humains et des ordinateurs jouant ensemble, en equipe. Il s'avere qu'un humain fort associe a une machine pouvait battre la machine seule. L'humain apportait l'intuition. La machine apportait le travail de force. Ensemble, ils etaient quelque chose de nouveau.

Il a appele ca le modele centaure. Pres de trente ans plus tard, je suis assis dans une cabane en pin dans l'Est du Texas, construisant une appli d'echecs avec une IA qui ne se lasse jamais de lire les messages d'erreur Rust, et je pense que Kasparov avait tout compris.

## Construit avec Claude Code

Ce fork d'En Croissant a ete construit avec [Claude Code](https://www.anthropic.com/claude-code), l'assistant de codage IA d'Anthropic. Chaque commande Rust, chaque composant React, chaque script bash dans le systeme TTS. Programme en binome, humain et IA. Je ne vais pas pretendre le contraire.

Ce n'est pas du slop IA. C'est du co-developpement. Et il y a une vraie difference.

Le slop IA, c'est taper « fais-moi une appli d'echecs » et livrer ce qui revient. Le co-developpement, c'est un humain avec des decennies d'experience en ingenierie et des opinions fortes sur l'architecture qui s'assoit avec une IA et discute de la gestion des erreurs. L'humain dit « non, c'est faux, voila pourquoi. » L'IA dit « d'accord, mais qu'en est-il de ce cas limite. » L'humain apporte la vision. L'IA apporte la velocite. Aucun des deux ne construit ca seul.

## Sur les epaules de Francisco

Francisco Salgueiro a construit En Croissant au fil d'annees d'architecture reflechie. Des nuits blanches a deboguer les caprices de Tauri. Un travail d'interface soigne avec Mantine. Un parseur PGN qui fonctionne vraiment. Integration moteur, gestion de base de donnees, support des puzzles. Tout. Il a construit quelque chose qui lui tenait a coeur et ca se voit.

J'ai soumis une pull request pour ajouter la narration text-to-speech. Francisco l'a examinee et a decide que ce n'etait pas la direction qu'il souhaitait pour En Croissant. C'est une decision de mainteneur, et je la respecte — il connait son projet mieux que quiconque. C'est comme ca que marche l'open source. La GPL me permet de forker et de construire dans une direction differente, et je suis reconnaissant de cette liberte. Mais je lui dois l'honnetete de le dire franchement : sans En Croissant, En Parlant~ n'existe pas. Point.

Voici ce qui me reste en tete, cependant. Francisco a passe des annees a construire quelque chose avec soin — prenant des decisions difficiles, apprenant le framework, faconnant l'architecture a travers des centaines de commits. La fonctionnalite TTS que j'ai ajoutee repose sur tout ce travail. Elle n'existerait pas sans les fondations qu'il a posees. Une IA m'a aide a aller vite, mais aller vite sur le travail de quelqu'un d'autre accumule pendant des annees, ce n'est pas la meme chose que faire ce qu'il a fait.

Et je ne sais pas quoi faire avec ca, honnetement. Que signifie le savoir-faire quand quelqu'un peut l'etendre a une vitesse 10x ? Que signifie se tenir sur les epaules de quelqu'un quand l'echelle est devenue si haute si vite ? Je n'ai pas de reponses nettes. Mais je prefere vivre avec l'inconfort plutot que de pretendre qu'il n'est pas la.

## L'etat des choses

La communaute des echecs obtient un meilleur produit parce que des outils comme Claude Code existent. L'ecart entre « j'aimerais que cette appli puisse narrer les coups » et « elle narre les coups en huit langues avec cinq fournisseurs TTS » est passe de mois a jours.

Ca se passe partout. Chaque domaine. Chaque metier. Des logiciels qui necessitaient des equipes ne necessitent plus qu'une personne.

Une partie de ca est geniale. Un dev solo avec une bonne idee peut rivaliser avec une equipe financee. Les projets open-source iterent plus vite que jamais.

Une partie est genuinement perturbante. Quand le cout de construction tombe vers zero, qu'arrive-t-il aux gens qui gagnaient leur vie dans ce cout ? Je pense que la reponse est le gout, le jugement, et le fait de s'en soucier. Ca reste humain. Mais je ne vais pas vous dire que la transition est indolore.

## Pourquoi les echecs

Les echecs sont un refuge pour moi. Je ne suis pas Grand Maitre, et je me retrouve toujours a apprendre au fil des decennies. C'est le seul endroit ou je dois penser par moi-meme. Pas d'autocompletion. Pas de suggestions. Juste 64 cases et 32 pieces et tout ce que mon cerveau peut en faire.

L'echiquier se moque de mes outils. Se moque de mon GPU ou de ma vitesse d'inference. Il demande juste : peux-tu voir ce qui se passe ici ? C'est tout. Reconnaissance de motifs et calcul sous pression. Pas de raccourcis.

Les echecs, c'est la ou je vais pour me rappeler ce que ca fait d'utiliser mon propre esprit.

## Une note sur l'honnetete

J'ai vu des depots avec des milliers de lignes de code genere par IA et zero reconnaissance. Des gens qui font passer le travail de Claude pour le leur dans des entretiens, du travail client, des contributions open-source. Je comprends. Il y a un stigmate. Les gens entendent « assiste par IA » et pensent que c'est moindre.

Mais voila. Je suis un commandant de bord. Trente-neuf ans de vol. Mon cockpit est bourre d'automatisation. Pilote automatique, auto-manettes, commandes de vol electroniques, GPS, vision synthetique. Personne ne m'a jamais demande si je « pilotais vraiment » l'avion. Les outils ne diminuent pas la competence. Ils changent ce qu'est la competence. Le jugement, la conscience de la situation, la prise de decision quand rien n'est clair. Ca reste a moi. Les outils me permettent juste d'operer a un niveau que je ne pourrais pas atteindre a mains nues.

Le logiciel traverse le meme virage que l'aviation a traverse il y a des decennies. Les puristes du pilotage manuel existeront toujours, et je suis l'un d'eux ! Si vous etes dans un de mes avions, de temps en temps vous me verrez piloter a la main du decollage a l'atterrissage. Parce que je peux. Parce que cette competence compte. Mais je sais aussi quand laisser l'automatisation travailler. Connaitre la difference ? C'est ca la vraie competence.

Ce projet a ete construit par un humain et une IA travaillant ensemble. Je suis fier des deux moities.

## Montrez votre travail

La plupart des projets « construits avec l'IA » s'arretent a l'etiquette. Nous sommes alles plus loin. Le depot inclut le veritable [document de workflow Claude Code](claude-workflow.md) — ce que l'IA sait, ce qu'on lui dit, comment les sessions fonctionnent, ou l'humain trace la ligne. Les principes de programmation qui guident chaque session sont aussi dans le depot, y compris une discussion honnete sur quelles regles classiques tiennent encore a l'ere de l'IA et lesquelles non.

Si vous etes curieux de savoir a quoi ressemble vraiment le developpement assiste par IA — pas la version marketing, le vrai cockpit — tout est la. Open source signifie processus ouvert.

## Soyez prudents

Si vous construisez avec l'IA, soyez honnetes. Si vous vous appuyez sur le travail de quelqu'un d'autre, dites-le. Si le rythme du changement vous met mal a l'aise, tant mieux. Ceux que ca ne derange pas ne font pas attention.

Nous grandissons. Nous nous adaptons. Une machine a battu le champion du monde d'echecs en 1997 et au lieu que le jeu meure, il est devenu plus grand que jamais.

Construisez de bonnes choses. Donnez du credit. Et trouvez vos propres 64 cases.

Nous sommes tous Kasparov maintenant. Regardant l'echiquier. Se demandant ce qui vient ensuite.

Soyez prudents.

-- Darrell

---

*En Parlant~ est un fork d'[En Croissant](https://github.com/franciscoBSalgueiro/en-croissant) par Francisco Salgueiro, construit avec [Claude Code](https://www.anthropic.com/claude-code) par Anthropic. Le nom signifie « en parlant » en francais. Parce que ce croissant vous repond.*
