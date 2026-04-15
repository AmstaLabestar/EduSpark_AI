# Architecture

## Vue d'ensemble

Le projet est organise autour de trois briques simples:

1. Une interface web React.
2. Une base Supabase pour l'authentification, les cours, les inscriptions et les questions.
3. Deux fonctions serveur pour traiter les questions et preparer des exercices.

## Parcours enseignant

1. L'enseignant cree un compte.
2. La base cree automatiquement son profil.
3. Il cree un cours avec un titre, une description, un texte de reference et eventuellement un PDF.
4. Le cours recoit un code de partage.
5. Il peut ensuite preparer des exercices pour ce cours.

## Parcours eleve

1. L'eleve cree un compte.
2. Il rejoint un cours avec le code partage.
3. Il lit le texte du cours.
4. Il pose ses questions dans l'espace de discussion du cours.
5. Il complete les exercices disponibles.

## Source de verite

- Les utilisateurs et sessions vivent dans Supabase Auth.
- Les profils sont crees par le trigger SQL `handle_new_user`.
- Les cours, inscriptions, questions et exercices vivent en base Postgres.
- Les PDFs sont stockes dans `storage.objects` via le bucket `course_pdfs`.

## Regles d'acces

Les politiques de securite sont definies dans les migrations SQL:

- un utilisateur lit son propre profil
- un enseignant lit les informations de ses eleves
- seuls les membres d'un cours peuvent lire ce cours
- seuls les membres d'un cours peuvent ajouter des questions
- seuls les enseignants du cours peuvent preparer des exercices

## Frontend

### Pages principales

- `Home`: entree du produit
- `Login` et `Signup`: authentification
- `TeacherDashboard`: suivi enseignant
- `StudentDashboard`: suivi eleve
- `CreateCourse`: creation d'un cours
- `CoursePage`: lecture du contenu
- `ChatTutor`: questions sur le cours
- `Exercises`: entrainement et progression

### Services

- `supabaseClient.ts`: initialise le client Supabase
- `courseService.ts`: cours, inscriptions, progression et PDF
- `assignmentService.ts`: lecture et generation des exercices
- `aiService.ts`: appel de la fonction serveur de questions

## Fonctions serveur

### `ask-ai`

- verifie l'utilisateur
- charge le texte du cours
- relit les dernieres questions du meme utilisateur pour ce cours
- envoie la demande au service de reponse
- enregistre la question et la reponse

### `generate-exercises`

- verifie que l'utilisateur est bien enseignant du cours
- lit le texte du cours
- demande un jeu de questions a choix multiple
- valide la structure recue
- enregistre l'exercice en base

## Progression

La progression eleve visible dans les tableaux de bord est actuellement mise a jour a la fin des exercices.
Le pourcentage enregistre correspond au score obtenu sur la serie d'exercices terminee.
