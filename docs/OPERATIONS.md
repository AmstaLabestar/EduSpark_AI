# Operations

## Installation locale

```bash
npm install
```

Puis:

```bash
npm run dev
```

## Variables frontend

Le fichier `.env` doit contenir:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

## Variables serveur Supabase

Les fonctions serveur attendent:

- `GOOGLE_API_KEY`

## Verifications locales

```bash
npm run typecheck
npm run test
npm run build
```

Ou en une seule commande:

```bash
npm run check
```

## CI

Le pipeline GitHub Actions:

- installe les dependances avec `npm ci`
- lance `npm run typecheck`
- lance `npm run test`
- lance `npm run build`

## Points de controle avant mise en production

- les migrations Supabase sont appliquees
- les fonctions serveur sont deployees
- les secrets serveur sont definis
- le frontend pointe vers le bon projet Supabase
- `npm run check` passe sans erreur

## Sequence de deploiement conseillee

1. appliquer les migrations SQL
2. definir ou verifier les secrets serveur
3. deployer les fonctions serveur
4. lancer `npm run check` localement
5. pousser sur `main` pour laisser la CI refaire les controles

## Verification fonctionnelle minimale

- creation de compte enseignant
- creation de cours
- ajout d'un eleve avec un code de cours
- ouverture du cours cote eleve
- generation d'exercices
- passage d'un exercice eleve
- verification de la progression dans les tableaux de bord
