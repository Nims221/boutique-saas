# Boutique Premium Starter

Starter Next.js orienté **dashboard premium** pour une boutique.

## Objectif

Construire d'abord un produit très visuel et simple, avec 5 pages :
- Dashboard
- Ventes
- Stock
- Produits
- Réapprovisionnement

## Stack

- Next.js 15
- TypeScript
- Tailwind CSS
- Recharts
- lucide-react

## Démarrage

```bash
npm install
npm run dev
```

Puis ouvrir :

```txt
http://localhost:3000
```

## Important

Ce starter est volontairement **front-first** avec données de démonstration dans :

```txt
src/lib/data.ts
```

Ça permet de valider d'abord :
- le design
- l'expérience utilisateur
- la navigation
- le rendu premium

Ensuite seulement, on pourra brancher une vraie base de données.

## Étape suivante recommandée

Une fois le rendu validé :
1. brancher les produits réels
2. brancher les ventes réelles
3. brancher le stock réel
4. brancher le réapprovisionnement simple
