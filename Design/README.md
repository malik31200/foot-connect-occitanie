# Handoff : Foot Connect Occitanie

## Overview
**Foot Connect Occitanie** est un réseau social mobile dédié au football régional occitan, ciblant un public **ado**. L'app permet de : suivre un feed vidéo immersif d'actions de match, consulter le calendrier / classement des matchs régionaux par catégorie et poule, publier ses propres photos/vidéos, commenter, et discuter en messagerie privée.

Identité visuelle : **croix occitane** (or sur rouge) traitée comme logo, esthétique sportive énergique (rouge Occitan + or), typographie display type maillot.

## Screenshots
Aperçus visuels dans `screenshots/` :
- `01-design-board.png` — **planche complète** : les 13 écrans/états + sections Logo & Identité (couleurs, typo). Vue d'ensemble du système.
- `01-prototype.png` → `06-prototype.png` — parcours du **prototype interactif** : Connexion → Feed → Matchs (filtres catégorie/poule) → Messages → Conversation → Profil.

Ces images sont des repères visuels. Les fichiers `.dc.html` (ouvrables au navigateur) restent la référence interactive exacte.

## About the Design Files
Les fichiers de ce bundle (`prototype/*.dc.html`) sont des **références de design créées en HTML** — des prototypes qui montrent l'apparence et le comportement voulus, **pas du code de production à copier tel quel**.

Ces fichiers utilisent un format interne « Design Component » (`.dc.html`) avec un runtime maison (`support.js`) : template + une classe logique `Component extends DCLogic` (proche d'un composant React class). **Ne pas réutiliser `support.js` ni le format `.dc.html`** dans le vrai codebase — c'est un artefact de l'outil de design.

La tâche est de **recréer ces designs dans l'environnement du codebase cible** (React, React Native, Vue, SwiftUI…) avec ses patterns et libs établis. Si aucun environnement n'existe encore : pour une app mobile de ce type, **React Native (Expo)** ou **React + Vite** (PWA mobile) sont des choix adaptés.

## Fidelity
**High-fidelity (hifi).** Couleurs, typographie, espacements et interactions sont définitifs. Recréer l'UI au pixel près avec les composants du codebase. Les valeurs exactes sont listées dans **Design Tokens**.

Note : les médias (vidéos de feed, vignettes, avatars) sont des **placeholders** (dégradés + rayures). Les remplacer par de vrais médias / photos de profil. Les avatars sont actuellement des initiales sur fond dégradé — pattern réutilisable comme fallback.

---

## Architecture & navigation

L'app est une **single-page** mobile (largeur de design **360 px**, hauteur écran **~740 px**, ratio téléphone). Navigation par **barre d'onglets basse** persistante + quelques écrans plein écran (connexion, inscription, conversation) et un **overlay** (commentaires).

Écran d'entrée : **Connexion**. Après connexion → **Feed**.

Barre de navigation basse (5 items), visible sur Feed / Matchs / Publier / Messages / Profil :
`Accueil (Feed)` · `Matchs` · **`Publier` (FAB central or)** · `Messages` · `Profil`
- Item actif : rouge `#E4002B`. Inactif : `#A8A29B` (ou blanc 60 % sur le feed sombre).
- Sur le **Feed** (fond sombre), la barre devient translucide foncée (`rgba(14,11,10,.72)` + blur). Ailleurs : blanche, bordure haute `#EFEBE4`.
- Le bouton central **Publier** est un FAB rond (50×50) en dégradé or `linear-gradient(135deg,#F5C518,#F59B0B)`, légèrement remonté (`margin-top:-9px`), icône `+` encre.
- Pastille de notif rouge sur Messages.

---

## Screens / Views

### 1. Connexion (`login`)
- **Purpose** : authentification / entrée dans l'app.
- **Layout** : fond rouge dégradé radial plein écran (`radial-gradient(130% 100% at 75% 0%,#FF2A3C,#E4002B 46%,#B80020)`) avec motif de rayures diagonales subtiles ; logo centré en haut (croix occitane or 84px + wordmark) ; **carte blanche** ancrée en bas (`border-radius:32px 32px 0 0`) contenant le formulaire.
- **Composants** :
  - Logo : croix occitane (SVG, or `#F5C518`) + « FOOT CONNECT » (Anton 42px blanc) + « OCCITANIE » (Anton 18px, `letter-spacing:.3em`, or). Tagline « Le réseau social du foot occitan » (11px, blanc 80 %, uppercase).
  - Titre « Connexion » (Anton 26px, centré).
  - Champs **Email** et **Mot de passe** : hauteur 50px, `border-radius:14px`, fond `#F4F1EC`, label 12px/700. Mot de passe avec icône œil.
  - Bouton **Se connecter** : 54px, `border-radius:15px`, `linear-gradient(95deg,#E4002B,#FF5A1F)`, texte blanc 15px/800, ombre rouge. → va au Feed.
  - Séparateur « ou ». Lien « Pas encore de compte ? **Inscris-toi** » (rouge) → Inscription.
  - Bouton **Continuer en mode démo →** : 50px, bordure or `#F5C518`, fond `#FFFBEE`, texte `#9A7B00`. → Feed.

### 2. Inscription (`signup`)
- **Purpose** : création de compte.
- **Layout** : header rouge dégradé (184px) avec « ‹ Retour », logo + titre « Inscription » ; carte blanche remontée (`-22px`, `border-radius:26px 26px 0 0`) avec le formulaire (scrollable).
- **Composants** : champs Prénom + Nom (sur une ligne, flex gap 12px), Pseudo (préfixe `@`), Email, Mot de passe (œil), Club favori (select factice avec chevron `⌄`). Case à cocher CGU (carré 20px rouge coché). Bouton **Créer mon compte** (même style que Se connecter) → Feed. Lien « Déjà un compte ? **Connecte-toi** » → Connexion.

### 3. Feed (`feed`)
- **Purpose** : flux vidéo immersif plein écran (façon TikTok/Reels) d'actions de match.
- **Layout** : plein écran sombre. Média placeholder en fond + **gradient overlay** haut/bas pour lisibilité (`linear-gradient(180deg,rgba(14,11,10,.55) 0%,transparent 22% 55%,rgba(14,11,10,.85) 100%)`).
- **Composants** :
  - Top : heure + logo « Foot Connect » (Anton 15px blanc) + badge **LIVE** rouge avec point pulsant (animation `fcoPulse` 1.4s).
  - **Rail d'actions à droite** (vertical, gap 22px) : ❤️ Like (compteur, démarre à **145**), 💬 Commentaire (ouvre l'overlay commentaires ; compteur = 21 + commentaires ajoutés), 🔗 Partage (8).
  - **Légende en bas** : avatar initiales (38px, bordure or) + nom « Marc Dupont » + handle ; texte de la publication ; **pill de contexte match** (rouge dégradé) : `U17R · Blagnac 1–0 Fenouillet · sam. 8 nov.`
  - Interactions : clic cœur → toggle rempli/vide + ±1 ; clic 💬 → overlay commentaires.

### 4. Matchs (`matchs`)
- **Purpose** : calendrier, classement et résultats du foot régional, **filtrables par catégorie puis poule**.
- **Layout** : fond crème `#F6F3EE`, scrollable, header blanc sticky (logo + nom complet).
- **Composants** :
  - Titre « Calendrier des matchs » (Anton 24px).
  - **Filtre Catégorie** : label « CATÉGORIE » + 3 pills `U16 / U17 / U18` (1 active). Pill active : `linear-gradient(95deg,#E4002B,#FF5A1F)` texte blanc ; inactive : fond blanc, bordure `1.5px #EAE6E0`, texte `#5C564F`.
  - **Filtre Poule** : label « POULE » + 3 pills `Toutes / Poule A / Poule B` (même style actif/inactif).
  - **Segmented control** (4 onglets) : `À venir / Terminés / Classement / Calendrier`. Onglet actif : fond blanc + ombre douce dans un conteneur `#EDE9E2 border-radius:13px padding:4px`.
  - **À venir** : liste de cartes filtrées (catégorie + poule). Carte : badges catégorie (`U16R`, fond `#FBE9C7`/`#9A6B00`) + poule (`Poule A`, fond `#E3ECFF`/`#2A5FD0`), ligue, « Équipe A vs Équipe B » (800/16px), date (icône calendrier rouge), lieu (icône pin). Si vide → message centré « Aucun match à venir pour cette poule. »
  - **Terminés** : cartes avec badge vert « Terminé », score encadré (`#F4F1EC`, Anton 18px) entre les 2 équipes, date. Même filtrage + état vide.
  - **Classement** : carte tableau (`#` / Équipe / J / G / Pts), 1er surligné vert (`border-left:3px #22A05A`, fond dégradé vert translucide).
  - **Calendrier** : cartes par **Journée** (J1, J2…) avec date, lignes « Équipe — score/heure — Équipe ». Heure à venir = pill or `#FBE9C7`/`#9A6B00`.

### 5. Publier (`publier`)
- **Purpose** : créer une publication liée à un match.
- **Composants** : titre « Créer une publication » ; **Match** (select obligatoire `*`) ; **Photo ou vidéo** (2 zones dashed côte à côte : photo bordure rouge `#E4002B`/fond `#FFF4F2`, vidéo bordure or `#F5C518`/fond `#FFFBEE`) ; **Description** (textarea optionnelle, 84px) ; bouton **Publier** (rouge dégradé, icône upload). Dans le prototype, Publier → Feed.

### 6. Messages (`messages`)
- **Purpose** : liste des conversations.
- **Composants** : titre « Messages » ; barre de recherche (46px, icône loupe) ; **liste de cartes conversation** (blanc, `border-radius:18px`, ombre douce) : avatar initiales + point vert « en ligne », nom (800/14px), aperçu du dernier message (`#8A847D`), heure, **badge compteur non-lus** rouge. 4 contacts : Marc Dupont (2), Julie Martin, Thomas Leroy, Sophie Dubois (1). Clic sur une carte → Conversation.

### 7. Profil (`profil`)
- **Purpose** : profil utilisateur.
- **Layout** : **cover rouge** (150px, dégradé + rayures, logo or en haut à droite), avatar rond (88px, initiales, bordure crème 4px) chevauchant la cover (`margin-top:-46px`).
- **Composants** : nom (Anton 22px) + handle ; bouton **Modifier** (pill bordure rouge) → Modifier le profil ; bio ; **3 stats** (cartes blanches) : Posts 12 / Abonnés 1 247 (chiffre rouge) / Abonnements 318 ; **segmented** `▦ Photos` / `▶ Vidéos` ; **grille Photos** (3 colonnes, carrés `border-radius:13px`, dégradés placeholder, badge vues monospace) ou **grille Vidéos** (2 colonnes, ratio portrait `.72`).

### 8. Modifier le profil (`editProfil`)
- **Purpose** : édition du profil.
- **Layout** : header blanc « Annuler / Modifier le profil / OK » (OK rouge) ; cover éditable (104px, pill « Couverture » + icône appareil photo) ; avatar avec **badge appareil photo** rouge (32px) en bas à droite.
- **Composants** : champs (bordure `1.5px #EAE6E0`, fond blanc) Nom complet, Identifiant (`@`), Bio (textarea), Club favori + Catégorie (selects sur une ligne) ; bouton **Enregistrer les modifications** (rouge) → Profil ; lien **Se déconnecter** (`#B80020`) → Connexion. Annuler / OK → Profil.

### 9. Conversation (`chat`)
- **Purpose** : fil de discussion privé + envoi de message.
- **Layout** : colonne flex pleine hauteur. Header blanc : « ‹ » (retour Messages) + avatar + nom + statut « En ligne » (point vert). Zone messages scrollable (séparateur « Aujourd'hui »). Barre de saisie blanche en bas.
- **Composants** : **bulles** — reçues à gauche (fond blanc, `border-radius:16px 16px 16px 4px`, texte encre) ; envoyées à droite (fond `#E4002B`, `border-radius:16px 16px 4px 16px`, texte blanc) ; heure 9px sous chaque bulle (opacity .6). Champ `<input>` (44px, fond `#F4F1EC`) + bouton rond envoyer (44px, rouge dégradé, icône avion). Entrée par clic du bouton ; chaque contact ouvre un thread pré-rempli différent.

### 10. Commentaires (overlay sur le Feed) (`showComments`)
- **Purpose** : lire et ajouter des commentaires sur la publication du feed.
- **Layout** : **bottom sheet** (66 % hauteur) par-dessus le feed assombri (`rgba(14,11,10,.5)`), `border-radius:26px 26px 0 0`. Fermeture par ✕ ou tap sur le fond.
- **Composants** : header « Commentaires (N) » (Anton 18px) + ✕ ; liste (avatar initiales 36px + nom + « · date » + texte) ; barre de saisie `<input>` « Ajoute un commentaire… » + bouton envoyer (rond rouge, avion). Envoi → ajoute le commentaire (auteur « Marc Dupont ») et incrémente le compteur du feed.

---

## Interactions & Behavior
- **Navigation onglets** : change l'écran actif ; l'item correspondant passe en rouge. Barre adaptée au thème (feed sombre vs reste clair).
- **Like (feed)** : toggle ; cœur passe rempli rouge `#E4002B` ↔ vide ; compteur ±1.
- **Filtres Matchs** : sélection Catégorie (U16/U17/U18) ET Poule (Toutes/A/B) → filtre simultané des listes À venir et Terminés. « Toutes » = pas de filtre poule. Listes vides → message dédié.
- **Onglets Matchs / Profil** : segmented controls qui basculent le contenu rendu.
- **Commentaires** : ouverture overlay depuis l'icône 💬 ; saisie contrôlée ; envoi ajoute en bas de liste + maj compteur ; vidage du champ ; fermeture via ✕/backdrop.
- **Conversation** : ouverture depuis une carte Messages (thread propre à chaque contact) ; saisie contrôlée ; envoi ajoute une bulle « moi » à droite, vide le champ. Retour « ‹ » → Messages.
- **Animations** : badge LIVE pulsant (`@keyframes fcoPulse` : opacity 1↔.35, 1.4s infinite). Prévoir des transitions douces d'apparition des écrans / slide-up des sheets dans l'implémentation réelle (non encore définies, au choix du dev — viser 150–250 ms ease-out).
- **Champs texte** : actuellement la plupart sont des placeholders statiques ; seuls les champs **commentaire** et **message** sont des vrais inputs contrôlés. Brancher la validation réelle (email, mot de passe, champs requis `*`) à l'implémentation.

## State Management
État global de l'app (dans le prototype, un seul composant) :
- `screen` : `'login' | 'signup' | 'feed' | 'matchs' | 'publier' | 'messages' | 'profil' | 'editProfil' | 'chat'`
- `matchTab` : `'avenir' | 'termines' | 'classement' | 'calendrier'`
- `matchCat` : `'U16' | 'U17' | 'U18'` (défaut `U16`)
- `matchPoule` : `'all' | 'A' | 'B'` (défaut `all`)
- `profilTab` : `'photos' | 'videos'`
- `liked` : boolean, `likes` : number (145)
- `showComments` : boolean ; `comments` : tableau `{name, initials, color, text, time}` ; `commentDraft` : string
- `msgDraft` : string ; `chatName / chatInitials / chatColor` ; `thread` : tableau `{me:boolean, text, time}`

Transitions : voir Interactions. Données matchs (À venir / Terminés) = tableaux statiques `{cat, poule, league, home, away, date, venue}` / `{…, score}` filtrés par `cat` + `poule`. **À remplacer par un vrai fetch API** (calendrier/résultats/classement par catégorie & poule). Idem feed, messages, commentaires → backend.

## Design Tokens

### Couleurs
| Token | Hex | Usage |
|---|---|---|
| Rouge Occitan | `#E4002B` | primaire, accents, actif |
| Rouge vif | `#FF2A3C` | haut des dégradés rouges |
| Orange flamme | `#FF5A1F` | fin des dégradés boutons (`95deg,#E4002B,#FF5A1F`) |
| Crimson | `#B80020` | bas des dégradés, déconnexion |
| Or | `#F5C518` | croix occitane, FAB, accents |
| Or foncé | `#F59B0B` | fin dégradé FAB or |
| Encre | `#1A1614` | texte principal |
| Crème fond | `#F6F3EE` | fond des écrans clairs |
| Fond champ | `#F4F1EC` | inputs |
| Gris segment | `#EDE9E2` | conteneur segmented |
| Bordure | `#EAE6E0` / `#EFEBE4` / `#F2EEE8` | bordures / séparateurs |
| Texte secondaire | `#5C564F` / `#8A847D` | sous-textes |
| Texte tertiaire | `#A8A29B` / `#C4BEB6` | placeholders, labels |
| Sombre feed | `#0E0B0A` | bezel / fond feed |
| Vert succès | `#22A05A` / `#1F8A4C` (sur `#DEF3E6`) | 1er du classement, badge « Terminé » |
| Badge catégorie | texte `#9A6B00` sur `#FBE9C7` | pills U16R / heures |
| Badge poule | texte `#2A5FD0` sur `#E3ECFF` | pills Poule A/B |
| Avatars (dégradés) | `#4F8DF7→#2A5FD0`, `#F5C518→#F59B0B`, `#E4002B→#FF5A1F`, `#7C5CF5→#5634C9` | fallback initiales |

### Typographie
- **Anton** (Google Fonts) — titres, scores, logo, nombres. Toujours `text-transform:uppercase`. Tailles : 64 (page), 42 (logo), 26 (titre écran), 22–24 (sections), 16–18 (sous-titres/scores).
- **Plus Jakarta Sans** (Google Fonts, 400/500/600/700/800) — toute l'UI. Tailles courantes : 10–11 (labels/badges, souvent uppercase `letter-spacing:.06–.14em`), 12–14 (corps/boutons), 15 (titres de bouton).

### Spacing / rayons / ombres
- Rayons : champs `13–15px` · cartes `16–20px` · sheets/cartes hero `26–32px` · pills `999px` · bezel téléphone `46px` / écran `37px`.
- Espacements récurrents : padding écran horizontal `22px` ; gaps `6 / 8 / 10 / 12 / 14px`.
- Ombres : boutons rouges `0 14px 26px -12px rgba(228,0,43,.7)` ; cartes `0 10px 26px -24px rgba(0,0,0,.5)` ; FAB or `0 8px 18px -6px rgba(245,155,11,.8)` ; téléphone `0 40px 70px -30px rgba(0,0,0,.5)`.
- Barre nav basse : hauteur `78–80px`.
- Hit targets : boutons ronds 44–50px (respecter ≥44px).

### Logo / croix occitane (SVG)
Croix pattée (branches évasées) + 12 pommettes. Path principal :
`<polygon points="47,47 38,20 82,20 73,47 100,38 100,82 73,73 82,100 38,100 47,73 20,82 20,38"/>` dans un `viewBox="0 0 120 120"`, plus 12 `<circle r="8">` aux extrémités (coords dans le SVG des fichiers). Déclinaisons fournies dans la planche : emblème or/rouge, app icon (carré arrondi rouge), monochrome encre, réversé blanc. Wordmark : « FOOT CONNECT » / « OCCITANIE » en Anton.

## Assets
- **Polices** : Anton + Plus Jakarta Sans (Google Fonts) — déjà importées via `<link>`.
- **Icônes** : SVG inline (stroke, `viewBox 0 0 24 24`) — maison/home, calendrier, message, profil, cœur, partage, loupe, appareil photo, pin, avion d'envoi, upload, +. Remplaçables par une lib d'icônes du codebase (Lucide, Feather… — le style stroke 2px correspond à Lucide).
- **Croix occitane** : SVG inline (voir ci-dessus) — à extraire en composant/asset.
- **Médias** : placeholders (dégradés + rayures) pour vidéos feed, vignettes profil, avatars. À remplacer par de vrais médias.

## Files
Dans `prototype/` :
- **`Foot Connect Occitanie - Prototype.dc.html`** — le **prototype interactif** complet (navigation réelle, filtres, like, commentaires, conversation). **Référence principale pour le comportement.**
- **`Foot Connect Occitanie.dc.html`** — la **planche de design** : les 13 écrans/états affichés côte à côte en mockups téléphone + sections **Logo** (déclinaisons) et **Identité** (palette, typo). **Référence principale pour le visuel statique de chaque écran.**
- **`support.js`** — runtime de l'outil de design. **NE PAS porter dans le codebase** ; fourni seulement pour pouvoir ouvrir les `.dc.html` localement.

> Pour visualiser les `.dc.html` : les ouvrir dans un navigateur (ils chargent `support.js` à côté). Ce sont des références — réimplémenter proprement dans le framework cible.
