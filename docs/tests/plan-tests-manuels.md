# Plan de tests manuels — Application mobile et back-office

Ces tests couvrent ce que les tests automatiques du back-end ne vérifient pas : l'interface mobile, l'envoi réel des médias, les emails et le back-office. Ils sont à exécuter avant chaque publication sur les stores.

**Environnement :** appli publiée (version du store) sur un iPhone et un téléphone Android, back-office sur footconnect-occitanie.fr, comptes de test dédiés.

**Comment remplir :** colonne « Résultat » = OK ou KO ; en cas de KO, créer une issue GitHub et noter son numéro. Les captures sont rangées dans `docs/tests/captures/` sous le nom indiqué.

| ID | Parcours | Étapes | Résultat attendu | iOS | Android | Capture |
| --- | --- | --- | --- | --- | --- | --- |
| M01 | Inscription | Ouvrir l'appli → S'inscrire → remplir les champs sans cocher les CGU → valider | Message « Tu dois accepter les conditions d'utilisation », pas de compte créé | | | `M01-cgu.png` |
| M02 | Inscription | Cocher les CGU, mot de passe « 1234 » → valider | Message expliquant les règles du mot de passe | | | `M02-mdp-faible.png` |
| M03 | Inscription | Données valides → valider | Compte créé, arrivée sur le fil | | | `M03-inscription-ok.png` |
| M04 | Connexion | Se déconnecter → se reconnecter avec un mauvais mot de passe | « Email ou mot de passe incorrect » | | | `M04-connexion-ko.png` |
| M05 | Connexion | Afficher / masquer le mot de passe avec l'icône œil | Le mot de passe s'affiche puis se masque | | | |
| M06 | Session | Fermer complètement l'appli puis la rouvrir | Toujours connecté, sans ressaisir le mot de passe | | | |
| M07 | Mot de passe oublié | « Mot de passe oublié » → email → saisir le code reçu → nouveau mot de passe | Email reçu en moins d'1 minute ; connexion possible avec le nouveau mot de passe | | | `M07-email-code.png` |
| M08 | Matchs | Onglet Matchs → choisir U18, Poule B | Onglets À venir, Terminés, Classement, Calendrier remplis pour cette poule | | | `M08-matchs.png` |
| M09 | Matchs | Comparer l'heure d'un match avec le back-office | Même heure (heure de Paris) dans l'appli et le back-office | | | |
| M10 | Classement | Onglet Classement d'une poule avec des matchs joués | Classement trié par points, colonnes J, G, N, P, diff., Pts | | | `M10-classement.png` |
| M11 | Publication | Publier → choisir un match terminé → 3 photos → légende → Publier | Post visible en tête du fil, carrousel de 3 photos, match affiché | | | `M11-post-photos.png` |
| M12 | Publication | Publier une vidéo de 30 s | Vidéo lue dans le fil avec les contrôles lecture / pause | | | `M12-post-video.png` |
| M13 | Publication | « Mon match n'est pas dans la liste » → saisir les deux équipes → Publier | Post publié avec les deux équipes | | | |
| M14 | Publication | Publier sans choisir de match ni saisir d'équipes | Attendu V1 : publication refusée. Aujourd'hui : publiée (bug connu B05) | | | |
| M15 | Fil | Liker un post, puis retirer le like | Cœur rouge puis vide, compteur +1 puis −1 | | | |
| M16 | Commentaires | Commenter un post, répondre à un commentaire, supprimer son commentaire | Commentaire et réponse affichés ; suppression possible seulement sur ses propres commentaires | | | `M16-commentaires.png` |
| M17 | Partage | Bouton Partager sur un post | Le menu de partage du téléphone s'ouvre (WhatsApp, SMS…) | | | |
| M18 | Profil | Suivre un utilisateur depuis son profil | Bouton « Ne plus suivre », compteur d'abonnés +1 | | | |
| M19 | Profil | Modifier son nom, son rôle et son avatar | Changements visibles sur le profil et dans le fil | | | `M19-edition-profil.png` |
| M20 | Messagerie | Envoyer un message à un autre compte, lire avec l'autre compte | Message reçu, compteur de non lus remis à 0 à l'ouverture | | | `M20-messagerie.png` |
| M21 | Messagerie | Écrire un long message sur Android | Le clavier ne cache pas le champ de saisie | | | |
| M22 | Recherche | Loupe → taper « toulouse » | Posts des matchs de Toulouse et utilisateurs correspondants | | | |
| M23 | Signalement | Trois points d'un post → Signaler → motif | Message de confirmation ; signalement visible dans le back-office | | | `M23-signalement.png` |
| M24 | Blocage | Bloquer un utilisateur depuis son profil | Ses posts disparaissent du fil | | | |
| M25 | Suppression | Profil → Modifier → Supprimer mon compte → confirmer | Retour à l'écran de connexion ; impossible de se reconnecter avec ce compte | | | |
| A01 | Back-office | Se connecter avec un compte non admin | Accès refusé | | | |
| A02 | Back-office | Matchs → Modifier un match → saisir 11:00 | 11:00 affiché dans le back-office et dans l'appli | | | |
| A03 | Back-office | Saisir le score d'un match | Statut « finished », match verrouillé, classement de l'appli mis à jour | | | `A03-score.png` |
| A04 | Back-office | Modération → supprimer un post signalé | Post supprimé de l'appli, signalement retiré de la liste | | | |
| A05 | Back-office | Modération → bannir un utilisateur | L'utilisateur ne peut plus se connecter | | | |
| A06 | Back-office | Page Stats | Chiffres clés et graphiques affichés | | | `A06-stats.png` |
| A07 | Back-office | Ouvrir sur un téléphone | Menu et tableaux utilisables (défilement horizontal) | | | |
