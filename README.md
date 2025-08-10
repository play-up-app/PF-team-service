# Team Service 👥

Service de gestion des équipes pour l'application full-stack de volleyball. Ce microservice gère la création, modification et gestion des équipes et de leurs membres dans le contexte de tournois.

## 🚀 Fonctionnalités

### CRUD Équipes
- ✅ Créer une nouvelle équipe (avec capitaine automatique)
- ✅ Récupérer une équipe par ID avec membres et statistiques
- ✅ Mettre à jour une équipe
- ✅ Supprimer une équipe
- ✅ Lister les équipes avec filtres et pagination
- ✅ Récupérer toutes les équipes d'un tournoi

### Gestion des Membres
- ✅ Ajouter un membre à une équipe avec rôle et position
- ✅ Retirer un membre d'une équipe
- ✅ Récupérer la liste des membres d'une équipe
- ✅ Gestion des rôles (captain, player, substitute)

## 📋 Prérequis

- Node.js (v18 ou supérieur)
- PostgreSQL avec Supabase
- npm ou yarn

## 🛠️ Installation

1. **Cloner le projet et installer les dépendances**
```bash
cd team-service
npm install
```

2. **Configuration des variables d'environnement**
```bash
cp .env.example .env
```

Modifier le fichier `.env` avec vos configurations :
```env
PORT=3003
NODE_ENV=development
DATABASE_URL="postgresql://username:password@localhost:5432/team_db"
DIRECT_URL="postgresql://username:password@localhost:5432/team_db"
JWT_SECRET=your-super-secret-jwt-key-here
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001
```

3. **Configuration de la base de données**
```bash
# Récupérer le schéma depuis la base existante
npx prisma db pull

# Générer le client Prisma
npx prisma generate
```

## 🚦 Démarrage

### Mode développement
```bash
npm run dev
```

### Mode production
```bash
npm start
```

### Avec Docker
```bash
docker build -t team-service .
docker run -p 3003:3003 --env-file .env team-service
```

## 📡 API Endpoints

### Équipes

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| `POST` | `/api/teams` | Créer une équipe |
| `GET` | `/api/teams` | Lister les équipes avec filtres |
| `GET` | `/api/teams/tournament/:tournamentId` | Équipes d'un tournoi |
| `GET` | `/api/teams/:id` | Récupérer une équipe |
| `PUT` | `/api/teams/:id` | Mettre à jour une équipe |
| `DELETE` | `/api/teams/:id` | Supprimer une équipe |

### Membres

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| `GET` | `/api/teams/:id/members` | Récupérer les membres |
| `POST` | `/api/teams/:id/members` | Ajouter un membre |
| `DELETE` | `/api/teams/:id/members/:playerId` | Retirer un membre |

### Utilitaires

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| `GET` | `/health` | Vérification santé du service |
| `GET` | `/` | Informations du service |

## 📝 Exemples d'utilisation

### Créer une équipe
```bash
curl -X POST http://localhost:3003/api/teams \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Les Champions",
    "description": "Équipe de champions",
    "tournament_id": "tournament-123",
    "captainId": "user-123",
    "contact_email": "captain@team.com",
    "contact_phone": "+33123456789",
    "skill_level": "intermediate"
  }'
```

### Ajouter un membre
```bash
curl -X POST http://localhost:3003/api/teams/team-123/members \
  -H "Content-Type: application/json" \
  -d '{
    "playerId": "user-456",
    "role": "player",
    "position": "libero"
  }'
```

### Lister les équipes avec filtres
```bash
curl "http://localhost:3003/api/teams?page=1&limit=10&tournament_id=tournament-123&status=registered"
```

### Récupérer les équipes d'un tournoi
```bash
curl "http://localhost:3003/api/teams/tournament/tournament-123"
```

## 🧪 Tests

```bash
# Lancer tous les tests
npm test

# Tests en mode watch
npm run test:watch

# Tests avec couverture
npm run test:coverage
```

## 🔍 Linting et Formatage

```bash
# Vérifier le code
npm run lint

# Corriger automatiquement
npm run lint:fix

# Formater le code
npm run format
```

## 📊 Base de Données

### Modèles utilisés

Le service utilise les modèles Supabase suivants :

- **team** : Équipes avec informations complètes
  - `id`, `name`, `description`, `tournament_id`
  - `captain_id`, `contact_email`, `contact_phone`
  - `status`, `skill_level`, `notes`
  - `created_at`, `updated_at`

- **team_member** : Relations équipe-utilisateur
  - `id`, `team_id`, `user_id`
  - `role`, `position`, `status`
  - `joined_at`, `created_at`

- **profile** : Profils utilisateurs (référence)
  - `id`, `email`, `display_name`
  - `first_name`, `last_name`, `avatar_url`

### Contraintes de base

- **Équipe unique par nom et tournoi** : Une équipe ne peut avoir le même nom qu'une autre dans le même tournoi
- **Membre unique** : Un utilisateur ne peut être membre que d'une seule équipe par tournoi
- **Capitaine requis** : Chaque équipe doit avoir un capitaine
- **Tournoi requis** : Chaque équipe doit être liée à un tournoi

## 🏗️ Architecture

```
team-service/
├── config/          # Configuration Prisma
├── controllers/     # Contrôleurs HTTP (logique métier)
├── repositories/    # Couche d'accès aux données
├── routes/          # Définition des routes Express
├── middleware/      # Middlewares (dates, auth)
├── prisma/          # Schéma de base de données
└── tests/           # Tests unitaires
```

### Principes appliqués
- **Clean Code** : Code lisible et maintenable
- **Repository Pattern** : Séparation logique métier / accès données
- **ES6 Modules** : Import/export moderne
- **Validation native** : Prisma gère les contraintes
- **Error Handling** : Gestion centralisée des erreurs

## 🔒 Sécurité

- Validation des données avec contraintes Prisma
- Middleware de sécurité (Helmet)
- Gestion des erreurs sans exposition d'informations sensibles
- CORS configuré pour les domaines autorisés
- Support JWT pour l'authentification (optionnel)

## 📈 Monitoring

- Endpoint `/health` pour les vérifications de santé
- Logs structurés avec emojis pour la lisibilité
- Gestion gracieuse de l'arrêt du serveur
- Métriques de base (équipes créées, membres ajoutés)

## 🔄 Statuts des équipes

- `registered` : Équipe inscrite (défaut)
- `confirmed` : Équipe confirmée pour le tournoi
- `eliminated` : Équipe éliminée
- `disqualified` : Équipe disqualifiée

## 👥 Rôles des membres

- `captain` : Capitaine de l'équipe (unique)
- `player` : Joueur titulaire
- `substitute` : Joueur remplaçant

## 🏐 Niveaux de compétence

- `amateur` : Niveau amateur (défaut)
- `intermediate` : Niveau intermédiaire
- `advanced` : Niveau avancé
- `professional` : Niveau professionnel

## 🤝 Contribution

1. Fork du projet
2. Créer une branche feature (`git checkout -b feature/nouvelle-fonctionnalite`)
3. Commit des changes (`git commit -am 'Ajout nouvelle fonctionnalité'`)
4. Push vers la branche (`git push origin feature/nouvelle-fonctionnalite`)
5. Créer une Pull Request

## 📄 License

Ce projet est sous licence ISC.

---

**Note**: Ce service fait partie d'une architecture microservices pour une application de gestion de tournois de volleyball. Il utilise Supabase comme base de données et Prisma comme ORM. 