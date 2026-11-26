# Foot Connect Occitanie — Charte de projet

Projet Portfolio de fin d'année — Holberton School · 12/11/2026 · Malik Bouanani

## 0. Identité du projet et organisation

**Titre du projet :** Foot Connect Occitanie

**Description courte :** Foot Connect Occitanie est une application mobile (iOS et Android) qui réunit au même endroit les scores, calendriers et classements du football amateur en Occitanie, et les photos et vidéos de chaque match publiées par les joueurs, parents et supporters.

**Équipe :** projet individuel.

| Membre | Rôles | Responsabilités concrètes |
| --- | --- | --- |
| Malik Bouanani | Développeur full-stack, chef de projet, QA | Application mobile (React Native + Expo) ; API REST (Django + DRF) et base PostgreSQL ; back-office admin (React + Vite) ; import des données FFF ; déploiement et maintenance du serveur (VPS Ubuntu, Nginx, Gunicorn, SSL) ; publication sur l'App Store et le Google Play Store ; tests, documentation, préparation de la démo |

**Communication :** seul sur le projet, je communique surtout avec mon mentor et les SWEs de la spécialisation, et avec les utilisateurs de l'application.

- Point d'avancement chaque semaine avec le mentor (démo de ce qui a été livré, blocages, prochaines tâches).
- Suivi des tâches dans un tableau de bord GitHub (colonnes À faire / En cours / Fait), une carte par fonctionnalité ou bug.
- Retours des utilisateurs collectés via les avis des stores, les testeurs et le signalement intégré à l'application.

**Prise de décision :**

- Les décisions techniques courantes (bibliothèque, structure du code, correctif) sont prises par moi et tracées dans les messages de commit et la documentation du dépôt (`CLAUDE.md`, dossier `docs/`).
- Les décisions majeures (retirer ou ajouter une fonctionnalité, changer de technologie, changer d'hébergeur) sont notées dans un journal de décisions et validées avec le mentor avant d'être appliquées.

## 1. Problème et utilisateurs cibles

**Énoncé du problème :** en football amateur en Occitanie, les scores, calendriers et classements sont publiés sur les sites et applis de la FFF, alors que les photos et vidéos des matchs sont dispersées sur TikTok, Instagram, Facebook et des groupes WhatsApp. Un parent ou un supporter qui veut savoir « quel a été le score et à quoi a ressemblé le match » doit chercher dans 3 ou 4 endroits différents, et souvent ne trouve pas les images.

**Utilisateurs cibles :**

- **Parents de jeunes joueurs (U14 à U18)** : suivent l'équipe de leur enfant, veulent les résultats et des souvenirs du match.
- **Supporters et proches** : suivent un club local ou une catégorie.
- **Joueurs** : veulent retrouver leurs matchs, publier et revoir leurs actions.
- **Coachs et dirigeants de club** : veulent plus de visibilité pour leur équipe et consulter calendrier et classement rapidement.

**Points de douleur :**

- Les résultats et les images d'un même match ne sont jamais au même endroit.
- Sur TikTok ou Instagram, retrouver la vidéo d'un match précis dépend du hasard de l'algorithme ou de connaître le bon compte.
- Les vidéos postées par des parents restent dans des groupes WhatsApp privés et ne profitent ni aux autres familles ni au club.
- Les petits clubs n'ont ni le temps ni les moyens d'animer des réseaux sociaux pour chaque équipe.

**Preuves que le problème existe :**

- **Expérience personnelle :** en tant que parent, je devais consulter le site de la FFF pour le score, puis fouiller TikTok et les groupes de parents pour trouver une photo ou une vidéo du match. L'idée du projet vient de là.
- **Échanges avec d'autres parents, joueurs et coachs :** ils décrivent le même parcours en plusieurs applis. *À compléter : nombre de personnes interrogées et 2 ou 3 phrases qu'elles ont dites.*
- **Usage réel de l'application publiée :** 102 comptes créés au 30/10/2026, dont 25 sur les 30 derniers jours, sans aucune publicité ; 91 supporters, 5 joueurs, 4 coachs et 2 dirigeants. L'application est publiée sur le Google Play Store (après un test fermé de 14 jours validé par Google) et sur l'App Store.

**Solutions existantes :**

| Solution | Ce qu'elle fait bien | Ce qui manque pour notre problème |
| --- | --- | --- |
| [myFFF](https://apps.apple.com/FR/app/id1442552191) (appli officielle FFF) | Toutes les compétitions officielles, résultats et classements | Aucune photo ou vidéo de match, aucune dimension communautaire |
| [Score'n'co](https://scorenco.com/football) | Résultats et calendriers de 15 000 clubs, scores en direct par des « scoreurs » bénévoles | Centré sur le score ; pas de fil de photos et vidéos liées à chaque match |
| TikTok, Instagram, Facebook | Beaucoup de vidéos, grande audience | Aucun lien avec le score ou le classement ; un match précis est difficile à retrouver |
| Groupes WhatsApp de parents | Partage rapide entre familles d'une même équipe | Privé, éphémère, introuvable pour les autres |

Aucune de ces solutions ne relie, pour un match donné, son score officiel et les images publiées par ceux qui y étaient : c'est le créneau de Foot Connect Occitanie.

## 2. Solution proposée et proposition de valeur

**Solution proposée :** une application mobile où chaque match du football amateur d'Occitanie a sa page : score, date, lieu, classement de la poule, et les photos et vidéos publiées par les utilisateurs pour ce match. Un utilisateur choisit sa catégorie et sa poule, consulte les matchs à venir, terminés, le classement et le calendrier, puis publie ou regarde les médias du match. Un back-office web permet à l'administrateur de gérer clubs, équipes, matchs et résultats, et de modérer les contenus.

**Type de projet :** application mobile multiplateforme (iOS et Android, React Native + Expo), avec une API REST (Django + Django REST Framework), une base PostgreSQL, un back-office web (React + Vite) et un stockage des médias sur Cloudflare R2. Le tout est hébergé sur un serveur VPS Ubuntu.

**Comment elle résout le problème :**

- Chaque publication est **liée à un match**, choisi dans la liste ou saisi à la main (équipe à domicile et à l'extérieur) : les images ne se perdent plus, on les retrouve depuis le match.
- Les données sportives (calendrier, scores, classements) viennent des calendriers officiels FFF et sont corrigeables par l'administrateur.
- Le fil d'actualité montre les derniers contenus de toute la région, sans dépendre d'un algorithme externe.

**Proposition de valeur :**

- **Pour les parents et supporters :** un seul endroit pour le score et les souvenirs du match, sans chercher sur TikTok ou WhatsApp.
- **Pour les joueurs :** une vitrine de leurs matchs, avec likes, commentaires et abonnés.
- **Pour les clubs et coachs :** de la visibilité sans devoir animer eux-mêmes des réseaux sociaux.

**Fonctionnalités principales :**

1. Compte utilisateur : inscription avec acceptation des CGU, connexion, mot de passe oublié, modification du profil et de l'avatar, suppression du compte.
2. Page Matchs : onglets À venir, Terminés, Classement, Calendrier, filtrés par catégorie, poule et saison.
3. Publication de photos (carrousel) ou d'une vidéo liées à un match.
4. Fil d'actualité avec likes, commentaires et partage.
5. Abonnements entre utilisateurs, recherche d'utilisateurs et de posts.
6. Messagerie privée entre deux utilisateurs.
7. Sécurité du contenu : signaler un post ou un commentaire, bloquer un utilisateur.
8. Back-office admin : gestion des clubs, équipes, matchs et scores, classements, modération, statistiques d'utilisation.

**Pourquoi c'est réaliste :** le MVP est déjà en production. L'application est publiée sur l'App Store et le Google Play Store, et l'API tourne sur footconnect-occitanie.fr. La période Portfolio sert à consolider ce MVP et à livrer une V1, pas à partir de zéro.

## 3. Périmètre, hors périmètre et limites du MVP

**MVP (déjà livré et publié avant la période Portfolio) :**

- Inscription avec CGU, connexion, mot de passe oublié, profil et avatar modifiables, suppression du compte
- Page Matchs : À venir, Terminés, Classement, Calendrier, filtres catégorie / poule / saison (U14 à Seniors, 2026/2027)
- Publication d'un post (photos ou vidéo) lié à un match, choisi dans la liste ou saisi à la main
- Fil d'actualité, likes, commentaires, partage externe
- Abonnements, recherche, messagerie privée
- Signaler un contenu, bloquer un utilisateur
- Back-office : clubs, équipes, matchs, saisie et correction des scores, classements recalculés, modération, statistiques

**Dans le périmètre de la période Portfolio (V1) :**

- Notifications push : nouveau like, commentaire, message, nouvel abonné
- Rendre l'indication du match obligatoire à la publication (aujourd'hui, un post peut être publié sans match)
- Fiabiliser les données sportives sans API FFF (refusée par la FFF) : accélérer l'import des calendriers exportés, et permettre aux coachs et dirigeants de saisir le score de leur match, validé par l'administrateur
- Qualité : réparer et compléter les tests automatiques du back-end, intégration continue (lint + tests à chaque push)
- Stabilité et sécurité du serveur : sauvegardes quotidiennes de la base, mises à jour système, suivi des erreurs
- Publier la V1 sur les deux stores

**Hors périmètre :**

- Diffusion vidéo en direct
- Score minute par minute pendant le match
- Chat de groupe
- Boutique, paiement en ligne, abonnement payant
- Site web public pour les utilisateurs (l'usage reste mobile ; le web est réservé à l'admin)
- Autres régions que l'Occitanie
- Recommandations par intelligence artificielle

**Améliorations futures (après le Portfolio) :**

- Suivre une équipe favorite et être notifié de ses résultats
- Espace club vérifié (un dirigeant gère la page de son club)
- Repost interne d'une publication
- Extension aux autres ligues régionales

**Limite du MVP :** le MVP est réussi si un utilisateur peut créer un compte, trouver le match de son équipe avec son score et son classement, publier une photo ou une vidéo liée à ce match et voir les publications des autres, pendant qu'un administrateur peut corriger un score et retirer un contenu signalé.

## 4. Risques, contraintes et hypothèses

**Risques et plan de mitigation :**

| # | Risque | Type | Impact | Probabilité | Mitigation |
| --- | --- | --- | --- | --- | --- |
| 1 | Pas d'accès automatique aux données FFF : l'API est bloquée (erreur 403 depuis juin 2026) et la FFF a refusé par écrit d'ouvrir ses API aux clubs (réponse à la Jeune Entente Toulousaine, club affilié) | Données | Élevé | Certaine (confirmée) | Ne pas contourner la protection (refus explicite de la FFF) ; import des calendriers exportés depuis le site public via le script existant ; saisie et correction des scores dans le back-office ; saisie des scores par les coachs et dirigeants, validée par l'admin (V1) ; veille sur une future offre FFF pour les clubs |
| 2 | Refus d'une mise à jour par Apple ou Google | Organisation / temps | Élevé | Moyenne (un refus Apple déjà reçu avant la publication) | Relire les règles des stores avant chaque envoi ; garder CGU, signalement, blocage et suppression de compte ; soumettre tôt pour garder une marge |
| 3 | Photos et vidéos de joueurs mineurs publiées sans accord, ou contenu inapproprié | Sécurité / données personnelles | Élevé | Moyenne | CGU qui interdisent ces contenus ; signalement en 2 clics ; traitement des signalements sous 24 h dans le back-office ; suppression définitive du média sur demande |
| 4 | Panne ou attaque du serveur unique, perte de la base | Technique / sécurité | Élevé | Faible | Sauvegarde quotidienne de la base hors du serveur ; connexion SSH par clé uniquement ; pare-feu limité aux ports 22, 80, 443 ; mises à jour automatiques |
| 5 | Développeur seul : maladie, retard, une tâche bloque tout | Organisation | Moyen | Moyenne | Priorités MoSCoW ; tâches courtes (2 jours max) ; documentation dans le dépôt ; point hebdomadaire avec le mentor pour débloquer vite |
| 6 | Le périmètre grossit (nouvelles idées en cours de route) | Temps | Moyen | Élevée | Toute nouvelle idée va dans « Améliorations futures » sauf validation du mentor ; les Must Have passent en premier |
| 7 | Hausse des coûts de stockage des vidéos | Technique / budget | Moyen | Faible | Vidéos limitées à 60 s et compressées ; suivi mensuel de la facture Cloudflare R2 |

**Contraintes :**

- Période Portfolio de 10 à 12 semaines, avec un seul développeur.
- Budget personnel réduit : serveur VPS (environ 5 € par mois), comptes développeur Apple et Google, stockage des médias.
- Chaque mise à jour mobile dépend de la validation d'Apple et de Google (1 à 7 jours).
- Les données FFF ne sont pas accessibles par API : la FFF réserve ses API aux ligues et districts et a refusé l'accès aux clubs, sans solution prévue à court terme.
- Respect du RGPD : collecte minimale, droit à la suppression du compte, secrets jamais dans le code.

**Hypothèses :**

- Les utilisateurs ont un smartphone récent (iOS ou Android) et un accès internet au bord du terrain ou après le match.
- Les parents et joueurs acceptent de publier leurs photos et vidéos dans une appli dédiée plutôt que seulement sur TikTok ou WhatsApp.
- Les calendriers officiels restent consultables publiquement sur le site de la FFF.
- Une mise à jour des scores par l'administrateur une fois par semaine suffit pour le MVP ; en V1, les coachs et dirigeants acceptent de saisir le score de leur match.

## 5. Critères de succès

Le projet est réussi si tous les critères ci-dessous sont vérifiés à la démo finale. Chacun se mesure sans interprétation.

| Domaine | Critère mesurable | Comment on le vérifie |
| --- | --- | --- |
| Produit | La V1 (avec notifications push) est publiée sur le Google Play Store et l'App Store | Numéro de version visible sur les deux stores |
| Produit | Au moins 12 user stories sont démontrées (inscription, connexion, consulter matchs / classement / calendrier, publier, liker, commenter, suivre, message privé, signaler, bloquer, supprimer son compte, corriger un score en admin) | Démo en direct |
| Produit | Le parcours de démo complet passe sans bug bloquant : inscription → trouver le match de son équipe → publier une photo → like et commentaire par un 2e compte → l'admin corrige le score → le classement se met à jour | Démo sur un vrai téléphone |
| Produit | Une notification push arrive en moins d'1 minute après un like, un commentaire ou un message, sur iOS et Android | Test sur 2 téléphones |
| Données | 100 % des matchs des catégories couvertes ont une date, une heure et un lieu ; les scores sont à jour au plus tard 48 h après le match | Back-office, page Matchs |
| Qualité | Les tests automatiques du back-end passent à 100 % et couvrent l'authentification, les posts, les scores et classements, et les permissions admin | Rapport de tests de l'intégration continue sur GitHub |
| Sécurité | Aucun mot de passe, clé ou jeton dans le dépôt ; 100 % des signalements traités en moins de 24 h | Recherche dans le dépôt ; onglet Modération |
| Adoption | 200 comptes inscrits (102 au 30/10/2026) et 30 utilisateurs actifs par semaine en fin de période | Page Statistiques du back-office |
| Documentation | Le README explique l'installation et le lancement du projet ; je peux expliquer chaque choix technique majeur (Django, React Native, R2, déploiement VPS) | README ; soutenance |

*Les objectifs d'adoption (200 inscrits, 30 actifs par semaine) sont une proposition à valider avec le mentor.*
