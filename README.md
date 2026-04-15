# EduLearn BF

Plateforme d'apprentissage pour enseignants et eleves, sans serveur applicatif classique.
L'application repose sur un front React, une base Supabase et deux fonctions serveur:

- une fonction pour repondre aux questions sur un cours
- une fonction pour preparer des exercices a choix multiple

## Ce que fait le projet

- Un enseignant peut creer un cours, ajouter du texte, joindre un PDF et partager un code d'inscription.
- Un eleve peut rejoindre un cours, lire son contenu, poser des questions et faire les exercices prepares pour ce cours.
- La progression visible dans les tableaux de bord vient des exercices completes par les eleves.

## Stack technique

- Frontend: Vite, React 18, React Router, TypeScript
- Donnees et authentification: Supabase
- Fonctions serveur: Supabase Edge Functions
- Stockage des fichiers: bucket prive `course_pdfs`

## Demarrage rapide

### 1. Installer les dependances

```bash
npm install
```

Sur PowerShell Windows, utilise `npm.cmd` si `npm` est bloque par la politique d'execution.

### 2. Configurer le frontend

Copie `.env.example` vers `.env` et renseigne:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

### 3. Configurer Supabase

Le projet attend:

- l'authentification email/mot de passe activee
- les migrations SQL appliquees
- les fonctions `ask-ai` et `generate-exercises` deployees
- la variable serveur `GOOGLE_API_KEY` definie dans Supabase

### 4. Lancer l'application

```bash
npm run dev
```

## Scripts utiles

- `npm run dev`: demarrage local
- `npm run test`: tests automatises
- `npm run typecheck`: verification TypeScript
- `npm run build`: build de production
- `npm run check`: verification complete locale

## Configuration Supabase

### Appliquer la base

Les migrations se trouvent dans `supabase/migrations/`.

Commande conseillee:

```bash
npx.cmd supabase@latest db push
```

### Deployer les fonctions

```bash
npx.cmd supabase@latest functions deploy ask-ai
npx.cmd supabase@latest functions deploy generate-exercises
```

### Definir les secrets serveur

```bash
npx.cmd supabase@latest secrets set GOOGLE_API_KEY="..."
```

## Organisation du projet

- `src/app/pages`: pages de l'application
- `src/app/auth`: session, profil et protection des routes
- `src/app/services`: acces a Supabase et appels aux fonctions serveur
- `src/app/hooks`: logique reutilisable cote interface
- `supabase/migrations`: schema SQL et politiques d'acces
- `supabase/functions`: fonctions serveur executees par Supabase
- `docs`: documentation technique du projet

## Comportement important a connaitre

- Les profils sont crees par la base lors de l'inscription.
- Les reponses aux questions se basent uniquement sur `courses.content_text`.
- Le PDF reste un support complementaire; il n'est pas utilise comme source de reponse.
- Aucun contenu de demonstration n'est livre avec l'application.
- Si aucun exercice n'a ete prepare pour un cours, l'eleve voit un etat vide clair au lieu de faux exercices.

## Verification avant livraison

Avant un merge ou un deploiement:

```bash
npm run typecheck
npm run test
npm run build
```

La CI execute aussi ces verifications sur chaque push et sur chaque pull request.

## Documentation complementaire

- `docs/ARCHITECTURE.md`
- `docs/DATABASE.md`
- `docs/OPERATIONS.md`
- `docs/CONTRIBUTING.md`
