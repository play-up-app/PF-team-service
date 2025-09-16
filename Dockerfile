# Utiliser Node.js 20 avec Alpine Linux (plus léger)
FROM node:20-alpine

# Définir le répertoire de travail
WORKDIR /app

# Copier les fichiers de dépendances en premier (pour optimiser le cache Docker)
COPY package*.json ./

# Installer les dépendances
RUN npm ci --only=production

# Copier le schéma Prisma
COPY prisma ./prisma/

# Générer le client Prisma
RUN npx prisma generate

# Copier tout le code source
COPY . .

# Créer le dossier pour les logs
RUN mkdir -p logs

# Exposer le port 3002
EXPOSE 3002

# Définir les variables d'environnement
ENV NODE_ENV=production
ENV PORT=3002

# Commande pour démarrer l'application
CMD ["node", "index.js"]