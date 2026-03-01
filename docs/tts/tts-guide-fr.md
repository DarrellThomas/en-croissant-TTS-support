# Guide de narration Text-to-Speech

*Ce guide est aussi disponible en :
[English](tts-guide.md) |
[Espanol](tts-guide-es.md) |
[Deutsch](tts-guide-de.md) |
[日本語](tts-guide-ja.md) |
[Русский](tts-guide-ru.md) |
[中文](tts-guide-zh.md) |
[한국어](tts-guide-ko.md)*

## Pourquoi le TTS change votre facon d'etudier les echecs

Quand vous analysez une partie annotee, vos yeux font un double travail. Vous essayez de suivre les pieces sur l'echiquier *et* de lire les commentaires en meme temps. Votre regard va et vient entre l'echiquier et le panneau d'annotations, et a chaque aller-retour, vous perdez la position pendant une fraction de seconde. Vous devez retrouver les pieces, retracer les lignes, reconstruire l'image dans votre tete.

Le text-to-speech resout completement ce probleme.

Avec le TTS active, vous parcourez une partie et les annotations vous sont *lues a voix haute*. Vos yeux restent sur l'echiquier. Vous regardez le cavalier se poser sur f3 pendant qu'une voix vous explique pourquoi c'est un bon coup de developpement. Vous voyez la structure de pions changer pendant que le commentaire explique l'idee strategique. L'echiquier et les mots arrivent ensemble, comme un entraineur assis en face de vous.

C'est particulierement utile pour :

- **Etude des ouvertures** — entendre les idees derriere chaque coup en regardant la position se developper
- **Revue de parties** — parcourir vos parties annotees et absorber les lecons naturellement
- **Pratique des finales** — garder les yeux sur les cases critiques pendant que le commentaire vous guide
- **Immersion linguistique** — etudiez les echecs en francais, allemand, espagnol, russe, japonais, chinois ou coreen avec tous les termes traduits. Entendez "Cavalier f3, echec" au lieu de "Knight f3, check."
- **Accessibilite** — pour les joueurs qui preferent ecouter que lire, ou qui veulent etudier loin d'un bureau

Une fois que vous l'aurez essaye, revenir aux annotations silencieuses sera comme regarder un film sans le son.

## Choisir un fournisseur

En Parlant~ est livre avec cinq fournisseurs TTS. Vous n'en avez besoin que d'un seul pour commencer. Choisissez celui qui vous convient le mieux.

### ElevenLabs

La meilleure qualite vocale disponible. ElevenLabs produit une parole expressive et naturelle avec une vraie personnalite — certaines voix ressemblent a des narrateurs de livres audio, d'autres a des presentateurs. Des dizaines de voix uniques. Prend en charge les huit langues avec une excellente prononciation CJK.

Le niveau gratuit offre 10 000 caracteres par mois (suffisant pour 2 a 5 parties annotees). Les forfaits payants commencent a 5$/mois pour 30 000 caracteres. Configuration simple : creez un compte, copiez votre cle API, collez-la dans En Parlant~.

Necessite internet. Ideal pour les amateurs de qualite vocale.

**[Guide de configuration ElevenLabs](setup-elevenlabs.md)** *(en anglais)*

### Google Cloud TTS

Le meilleur equilibre entre qualite, support linguistique et cout. Les voix neuronales WaveNet de Google sont naturelles et claires dans les huit langues. Le niveau gratuit est genereux — un million de caracteres par mois couvre des centaines de parties annotees.

La configuration prend environ 5 minutes : creez un compte Google Cloud, activez l'API Text-to-Speech, generez une cle API. Aucuns frais sauf si vous depassez le niveau gratuit (tres difficile avec les annotations d'echecs).

Necessite internet. Ideal pour la plupart des utilisateurs.

**[Guide de configuration Google Cloud](setup-google.md)** *(en anglais)*

### KittenTTS

IA locale de haute qualite qui fonctionne entierement sur votre machine. Utilise un modele neuronal leger d'environ 25 Mo avec 8 voix expressives (4 masculines, 4 feminines). La qualite est remarquablement bonne — intonation naturelle, prononciation claire, expressivite authentique.

Le compromis est le materiel : KittenTTS utilise PyTorch pour l'inference CPU et necessite un processeur multi-coeur moderne. Anglais uniquement pour le moment.

Pas d'internet requis. Pas de cle API. Meilleure qualite locale.

**[Guide de configuration KittenTTS](setup-kittentts.md)** *(en anglais)*

### System TTS

La synthese vocale integree de votre systeme d'exploitation. Rien a installer, pas de cle API, pas de serveur. Selectionnez et c'est parti. La qualite vocale est basique — vous entendrez le ton robotique typique du TTS systeme — mais ca fonctionne instantanement.

Sur Linux c'est generalement eSpeak ou speech-dispatcher ; sur macOS c'est la voix systeme ; sur Windows c'est SAPI.

Pas d'internet requis. Ideal pour un test rapide.

**[Guide de configuration System TTS](setup-system.md)** *(en anglais)*

### OpenTTS

Un serveur TTS open-source qui tourne sur votre machine via Docker. Rien ne quitte votre ordinateur. Regroupe plusieurs moteurs TTS (Larynx, Festival, eSpeak, Coqui-TTS), offrant plus de 75 voix pour l'anglais seul.

Le compromis est la qualite : ces moteurs sont plus anciens, donc le resultat est plus robotique qu'ElevenLabs ou Google. Fonctionne mieux avec les langues europeennes — le CJK n'est pas bien supporte. OpenTTS pourrait etre retire dans une version future.

Pas d'internet requis. Pas de cle API. Ideal pour la confidentialite maximale.

**[Guide de configuration OpenTTS](setup-opentts.md)** *(en anglais)*

### Notre recommandation

Commencez par **ElevenLabs** si vous voulez la meilleure qualite vocale — le niveau gratuit suffit pour essayer. Pour le meilleur rapport qualite/utilisation gratuite, **Google Cloud** couvre des centaines de parties par mois. Pour du TTS local de haute qualite, **KittenTTS** est excellent si vous avez un CPU moderne. Pour un test sans configuration, **System TTS** fonctionne instantanement. Pour la confidentialite maximale, **OpenTTS** fonctionne entierement en local via Docker.

## Reference des parametres

Tous les parametres TTS sont dans **Settings > Sound** :

| Parametre | Fonction |
|-----------|----------|
| **Text-to-Speech** | Interrupteur principal pour toutes les fonctions TTS |
| **Auto-Narrate on Move** | Lire automatiquement les annotations en parcourant les coups |
| **TTS Provider** | Choisir parmi les cinq fournisseurs |
| **TTS Voice** | Selection de voix specifique au fournisseur |
| **TTS Language** | Langue de narration — les termes d'echecs sont traduits automatiquement |
| **TTS Volume** | Volume de la narration |
| **TTS Speed** | Vitesse de lecture (0,5x a 2x) — ajuste sans regenerer l'audio |
| **ElevenLabs API Key** | Votre cle API ElevenLabs |
| **Google Cloud API Key** | Votre cle API Google Cloud |
| **KittenTTS CPU Threads** | Threads CPU pour l'inference (0 = auto) |
| **TTS Audio Cache** | Effacer le cache audio pour forcer la regeneration |

## Langues prises en charge

La narration TTS prend en charge huit langues avec un vocabulaire d'echecs entierement traduit :

| Langue | Exemple d'echecs |
|--------|-----------------|
| **English** | Knight f3, check. A strong developing move. |
| **Francais** | Cavalier f3, echec. Un coup de developpement fort. |
| **Espanol** | Caballo f3, jaque. Un fuerte movimiento. |
| **Deutsch** | Springer f3, Schach. Ein starker Entwicklungszug. |
| **日本語** | ナイト f3、チェック。強い展開の手。 |
| **Русский** | Конь f3, шах. Сильный развивающий ход. |
| **中文** | 马 f3，将军。一步控制中心的强力出子。 |
| **한국어** | 나이트 f3, 체크. 중앙을 지배하는 강력한 전개 수. |

Tous les termes d'echecs — noms des pieces, "echec", "echec et mat", "roque", "prend", annotations comme "Coup brillant" et "Gaffe" — sont prononces dans la langue selectionnee. Les commentaires dans vos fichiers PGN sont lus tels quels, donc annotez vos parties dans la langue que vous souhaitez entendre.

## Conseils pour la meilleure experience

- **Utilisez Auto-Narrate.** Activez "Auto-Narrate on Move" et utilisez simplement les fleches pour parcourir les parties. Le commentaire arrive naturellement pendant que vous avancez.

- **Annotez vos propres parties.** Le TTS brille vraiment quand vous ecoutez les commentaires sur *vos* parties. Annotez vos parties, puis parcourez-les avec la narration.

- **Essayez differentes vitesses.** Certains joueurs preferent 1x pour une etude attentive, d'autres 1,3x pour une revue rapide. Le curseur de vitesse ajuste la lecture en temps reel.

- **Utilisez l'icone haut-parleur.** Chaque commentaire dans la liste des coups a une petite icone haut-parleur. Cliquez dessus pour ecouter cette annotation.

- **Changez de langue pour apprendre le vocabulaire.** Si vous etudiez les echecs dans une seconde langue, reglez la langue TTS pour correspondre.

## A propos de cette fonctionnalite

En Croissant est un outil d'etude d'echecs open-source cree par [Francisco Salgueiro](https://github.com/franciscoBSalgueiro). Francisco a construit quelque chose de vraiment special et l'a publie sous licence GPL-3.0. Cette fonctionnalite TTS existe grace a sa generosite.

Le plugin TTS a ete developpe par Darrell chez [Red Shed](https://redshed.ai), avec l'aide de [Claude Code](https://www.anthropic.com/claude-code). Cinq fournisseurs, support multi-langues, vocabulaire d'echecs traduit dans huit langues.

Nous avons utilise l'IA pour construire ceci. [En savoir plus](../ai-note.md).

## Nous contacter

Nous aimerions savoir comment le TTS fonctionne pour vous. Commentaires, suggestions et retours sont toujours les bienvenus.

- **Vous voulez une langue que nous ne supportons pas encore ?** Dites-le nous.
- **Vous avez trouve un bug ?** Dites-le nous et nous le corrigerons rapidement.
- **Vous avez une idee pour un autre fournisseur TTS ?** Nous sommes heureux de l'ajouter.

Ouvrez un ticket sur [GitHub](https://github.com/DarrellThomas/en-parlant), ou contactez-nous directement a **[darrell@redshed.ai](mailto:darrell@redshed.ai)**.
