# GenDoc — Mini SaaS de génération et d'édition de documents

GenDoc permet de **générer des documents officiels** à partir de modèles (certificats médicaux, contrats, baux, attestations…) et d'**éditer des PDF existants** en ajoutant du texte, des signatures, des dates, des coches — le tout depuis une interface web moderne.

## Fonctionnalités

- **Landing page animée** (Framer Motion), design premium.
- **Auth maison** : inscription / connexion avec bcrypt + JWT (cookie httpOnly).
- **Génération guidée** : 4 catégories (Médical, Contrats, Location, Administratif), 8 modèles prêts à l'emploi.
- **Éditeur PDF** : upload → annotations (texte / date / signature / coche) positionnables à la souris → export.
- **Plans & crédits** : 3 paliers (Gratuit, Pro, Entreprise) + packs de crédits à l'unité. Paiement **simulé** (modal Stripe-like).
- **Dashboard** : suivi des quotas mensuels (générations / modifications) + crédits.
- **Historique** : chaque document est stocké et re-téléchargeable.

## Stack

- Next.js 14 (App Router) + TypeScript + Tailwind CSS
- Framer Motion + Lucide
- Prisma 6 + SQLite en dev (PostgreSQL en prod)
- pdf-lib (génération) + pdfjs-dist (affichage)
- bcryptjs + jsonwebtoken (auth) + zod (validation)

## Lancement

```bash
npm install
npx prisma db push
npm run dev
```

Puis ouvrir http://localhost:3000

## Variables d'environnement

Copiez `.env.example` vers `.env` :

```
DATABASE_URL="file:./dev.db"
JWT_SECRET="change-moi-une-string-longue-et-aleatoire"
```

## Structure

```
src/
├── app/
│   ├── (auth)/          # login + register
│   ├── api/             # routes auth, generate, edit, pay, documents
│   ├── dashboard/       # tableau de bord
│   ├── generate/        # catégories + templates + formulaire
│   ├── edit/            # éditeur PDF
│   ├── documents/       # liste + détail
│   └── pricing/         # page tarifs + paiement simulé
├── components/
│   ├── landing/         # sections de la landing page
│   ├── dashboard/       # AppShell, GenerateForm, PdfEditor, PricingClient
│   └── ui/              # Button, Input, Card
└── lib/                 # auth, db, plans, quota, templates, pdf, utils
```

## À venir

- Intégration Stripe (Checkout + webhook) — le module paiement est déjà isolé dans `/api/pay`.
- OCR + extraction de texte natif des PDF (modif directe du contenu).
- Multi-utilisateurs / équipes (plan Entreprise).
- Signature électronique par tracé tactile.
- Export en lot + API publique.

## Notes

- Le paiement est actuellement **simulé** : le modal affiche 4242 4242 4242 4242 et met à jour directement le plan/crédits sans débit réel.
- Pour réinitialiser la base : `rm prisma/dev.db && npx prisma db push`.
- Prêt à être déployé sur Railway, Render, Fly.io ou n'importe quel VPS via Docker (pas de dépendance Vercel).
