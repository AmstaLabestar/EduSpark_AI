# Contribution

## Methode de travail

Pour garder un historique lisible:

1. creer une branche a partir de `main`
2. faire un lot de changements coherent
3. lancer les verifications locales
4. commit
5. fusionner sur `main`
6. pousser

## Verifications minimales

Avant un commit ou un push:

```bash
npm run typecheck
npm run build
```

## Regles de modification

- ne pas ajouter de contenu fictif dans l'application
- documenter tout nouveau comportement visible
- garder des messages utilisateurs simples et explicites
- eviter les dependances non utilisees
- garder le README synchronise avec le code reel

## Quand une migration est ajoutee

- la placer dans `supabase/migrations`
- expliquer son objectif dans le commit
- verifier l'impact sur les droits d'acces
