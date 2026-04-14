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
- lance `npm run build`

## Points de controle avant mise en production

- les migrations Supabase sont appliquees
- les fonctions serveur sont deployees
- les secrets serveur sont definis
- le frontend pointe vers le bon projet Supabase
- `npm run check` passe sans erreur
