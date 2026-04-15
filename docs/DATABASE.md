# Database

## But

La base Supabase porte la logique centrale du produit:

- creation automatique des profils
- separation enseignant / eleve
- acces aux cours
- inscriptions
- questions
- exercices
- stockage prive des PDF

## Tables principales

### `profiles`

Contient le profil lie au compte d'authentification.

- `id`: identifiant de l'utilisateur
- `full_name`: nom affiche
- `role`: `student` ou `teacher`

Le profil est cree automatiquement a l'inscription par le trigger `handle_new_user`.

### `courses`

Contient un cours cree par un enseignant.

- `teacher_id`: proprietaire du cours
- `title`: titre obligatoire
- `description`: resume du cours
- `content_text`: texte de reference utilise pour les reponses du tuteur
- `pdf_path`: chemin du PDF optionnel
- `course_code`: code de partage

### `enrollments`

Relie un eleve a un cours et stocke sa progression.

- une seule ligne par couple `course_id` / `student_id`
- `progress_pct` reste borne entre `0` et `100`

### `questions`

Historique des questions posees dans un cours.

- chaque question appartient a un utilisateur et a un cours
- le texte de question ne peut pas etre vide

### `assignments`

Serie d'exercices preparee pour un cours.

- `created_by`: enseignant createur
- `title`: nom de la serie
- `questions`: tableau JSON des questions

## Regles de role

La base applique les regles suivantes:

- seul un profil `teacher` peut creer, modifier ou supprimer un cours
- seul un profil `student` peut rejoindre un cours avec un code
- seul un profil `student` peut mettre a jour sa progression
- seul un profil `teacher` peut enregistrer ou supprimer des exercices
- seul un profil `teacher` peut deposer ou supprimer un PDF de cours

## Controles de qualite en base

Les migrations recentes ajoutent plusieurs garde-fous:

- titre de cours non vide
- format du code cours borne a 8 caracteres hexadecimaux majuscules
- progression bornee entre `0` et `100`
- texte de question non vide
- titre d'exercice non vide
- liste de questions d'exercice obligatoirement non vide

## Fonction utile

### `enroll_with_code(text)`

Cette fonction:

1. verifie qu'un utilisateur est connecte
2. verifie qu'il a le role `student`
3. cherche le cours a partir du code
4. cree l'inscription si elle n'existe pas deja
5. renvoie l'identifiant du cours

## Effet attendu apres migration

Si un mauvais role tente une action interdite, le refus se fait directement en base.
Cela evite de faire reposer les regles d'acces uniquement sur l'interface web.
