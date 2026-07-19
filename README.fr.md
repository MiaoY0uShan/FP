<p align="center">
  <img src="docs/assets/fp-banner.svg" alt="FP transforme les tâches ambiguës, les agents parallèles et les exemples limités en progrès vérifiable" width="100%">
</p>

# FP

**Le correctif n'est pas la ligne d'arrivée. La preuve l'est.**

[![Validate](https://github.com/MiaoY0uShan/FP/actions/workflows/validate.yml/badge.svg)](https://github.com/MiaoY0uShan/FP/actions/workflows/validate.yml)
[![Release](https://img.shields.io/github/v/release/MiaoY0uShan/FP)](https://github.com/MiaoY0uShan/FP/releases)
[![License: MIT](https://img.shields.io/badge/license-MIT-22c55e.svg)](LICENSE)

La plupart des agents de codage se précipitent du prompt au correctif. FP fait en sorte que le vôtre trouve la vraie tâche, borne chaque délégation et termine avec des preuves qu'un agent parent peut vérifier indépendamment.

Il peut aussi apprendre des exécutions précédentes. Mais pas en transformant une anecdote chanceuse en loi permanente.

FP infère l'activation depuis l'objectif : il se charge automatiquement pour le travail d'ingénierie et reste inactif pour les conversations informelles ou autres objectifs non techniques.

Pas de démon. Pas de base de données. Pas de serveur MCP requis. Installez-le, rechargez votre agent et travaillez normalement.

## Vous connaissez cette situation

Quatre agents touchent les mêmes fichiers. L'un redémarre le service. Un autre signale une build verte. Personne ne reteste le téléphone qui ne peut toujours pas se connecter.

FP donne au travail une frontière, un propriétaire et une ligne d'arrivée observable.

```text
Sans FP

modifier config -> redémarrer service -> statut vert -> "terminé"

Avec FP

reproduire le client réel
-> comparer état désiré / généré / effectif
-> trouver la première frontière défaillante
-> faire le plus petit changement autorisé
-> réexécuter client réel + contrôle négatif + cycle de vie
-> enregistrer les preuves
```

Le second chemin est plus lent que deviner pendant environ cinq minutes. Il est considérablement plus rapide que déboguer la supposition pendant deux jours.

## Comment ça marche

```text
demande
-> router par risque réel
-> geler portée, autorité et acceptation
-> exécuter ou déléguer un travail borné
-> exécuter des vérifications observables
-> valider le Registre de Preuves
-> optionnellement évaluer un candidat d'apprentissage réutilisable
```

Avant d'ajouter du code, FP parcourt une courte échelle de réutilisation :

```text
1. Cela doit-il exister ?              non -> sauter (YAGNI)
2. Déjà dans le code ?                 oui -> réutiliser
3. La bibliothèque standard le fait ?  oui -> utiliser
4. Fonctionnalité native ?             oui -> utiliser
5. Dépendance installée ?              oui -> utiliser
6. Une ligne suffit ?                  oui -> écrire une ligne
7. Seulement alors                     -> ajouter le minimum de nouveau code
```

## Distribué, pas chaotique

```text
parent / intégrateur
|-- investigation bornée A       lecture seule
|-- investigation bornée B       lecture seule
|-- apprenti candidat            lecture seule, proposition seulement
|-- évaluateur aveugle           ensemble de test caché + oracle
|-- réviseur de spécification    tâche et session indépendantes
+-- réviseur d'intégration       tâche et session indépendantes
             -> preuves bornées + verdicts

un rédacteur -> le parent réexécute les vérifications critiques -> registre canonique
```

Les feuilles ne peuvent pas déléguer, utiliser des identifiants, déployer, envoyer des messages externes, promouvoir la mémoire ou muter l'état vivant.

## Apprendre sans mémoriser l'accident

```text
une exécution avec preuves -> observation
un cas grave -> liste de contrôle fantôme limitée et expirante
2-4 cas positifs indépendants -> validation croisée -> évaluation aveugle
tous les plis + contrôles + invariants + ombre future + restauration passent -> candidat actif approuvé
```

Voir la [Porte de Généralisation](fp/generalization-gate/SKILL.md).

## Installation

1. Téléchargez le dernier `fp-universal-v{version}.zip` depuis [Releases](https://github.com/MiaoY0uShan/FP/releases).
2. Extrayez-le à la racine du projet.
3. Sur Windows, exécutez `INSTALL-FP.cmd`. Sur macOS/Linux, exécutez `sh ./INSTALL-FP.sh`.
4. Vérifiez avec `INSTALL-FP.cmd -Verify` (Windows) ou `sh ./INSTALL-FP.sh --verify` (macOS/Linux).

Les objectifs d'ingénierie activent FP sans mot-clé :

```text
FP: Diagnostiquer et corriger la régression de réinitialisation de mot de passe.
$fp Examiner le workflow de release sans éditer.
```

## Routes

| Route | Quand | Quoi |
| --- | --- | --- |
| **Urgent / Haut Risque** | Incidents, grillages, changements de protocole | Confirmer l'intention → agir dans l'autorité |
| **Diagnostic Lecture Seule** | Pannes inconnues ou scans proactifs | Hypothèse → sonde → correction autorisée |
| **Construire** | Implémentation claire ou vague | Petit → Mini-rapport. Moyen → Rapport + Registre. Vague → Cartes d'idées |
| **Fermer** | Chaque tâche | Réussir avec preuves → un verdict → arrêter |

## Influences

Design affiné en étudiant [Superpowers](https://github.com/obra/superpowers), [Hermes Agent](https://github.com/NousResearch/hermes-agent), [Ponytail](https://github.com/DietrichGebert/ponytail), [Context7](https://github.com/upstash/context7), [Grill Me](https://github.com/mattpocock/skills/tree/main/skills/productivity/grill-me) et [code-review-graph](https://github.com/tirth8205/code-review-graph).

---

**Langues :** [English](README.md) · [中文](README.zh-CN.md) · [हिन्दी](README.hi.md) · [Español](README.es.md) · [Français](README.fr.md) · [العربية](README.ar.md) · [Português](README.pt.md) · [Русский](README.ru.md) · [日本語](README.ja.md)

## Licence

MIT. Utilisez-le, inspectez-le, améliorez-le et conservez l'avis.
