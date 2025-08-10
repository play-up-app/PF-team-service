# Utiliser l'image Node.js officielle avec Alpine pour la taille réduite
FROM node:18-alpine

# Définir le répertoire de travail
WORKDIR /app

# Copier les fichiers de dépendances
COPY package*.json ./

# Installer les dépendances
RUN npm ci --only=production && npm cache clean --force

# Créer un utilisateur non-root pour la sécurité
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001

# Copier le code source
COPY . .

# Générer le client Prisma
RUN npx prisma generate

# Changer la propriété des fichiers
RUN chown -R nodejs:nodejs /app
USER nodejs

# Exposer le port
EXPOSE 3003

# Définir la commande de démarrage
CMD ["npm", "start"] 