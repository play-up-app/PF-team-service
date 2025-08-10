import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { dateTimeNormalizer } from './middleware/dateTimeNormalizer.js';
import teamRoutes from './routes/team.route.js';
import cookieParser from 'cookie-parser'

const app = express();
const port = process.env.PORT || 3003;

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true
}))
app.use(express.json())
app.use(cookieParser())

// Middleware pour normaliser automatiquement les dates/heures
app.use(dateTimeNormalizer)

// Route de santé
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Team Service is running',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0'
  });
});

// Route racine
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Bienvenue sur le Team Service API',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      teams: '/api/teams',
      documentation: 'Voir le README.md pour la documentation complète'
    }
  });
});

// Routes API
app.use('/api/teams', teamRoutes);

// Middleware de gestion des erreurs 404
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} non trouvée`,
    availableEndpoints: [
      'GET /',
      'GET /health',
      'GET /api/teams',
      'POST /api/teams',
      'GET /api/teams/tournament/:tournamentId',
      'GET /api/teams/:id',
      'PUT /api/teams/:id',
      'DELETE /api/teams/:id',
      'GET /api/teams/:id/members',
      'POST /api/teams/:id/members',
      'DELETE /api/teams/:id/members/:playerId'
    ]
  });
});

// Middleware global de gestion des erreurs
app.use((error, req, res, next) => {
  console.error('Erreur globale:', error);
  
  // Erreur de validation Prisma
  if (error.code === 'P2002') {
    return res.status(409).json({
      success: false,
      message: 'Conflit de données - cette ressource existe déjà',
      details: error.meta
    });
  }
  
  // Erreur de contrainte de clé étrangère Prisma
  if (error.code === 'P2003') {
    return res.status(400).json({
      success: false,
      message: 'Référence invalide - ressource liée non trouvée'
    });
  }
  
  // Erreur de parsing JSON
  if (error instanceof SyntaxError && error.status === 400 && 'body' in error) {
    return res.status(400).json({
      success: false,
      message: 'Format JSON invalide'
    });
  }
  
  // Erreur générique
  res.status(500).json({
    success: false,
    message: 'Erreur interne du serveur',
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
  });
});

// Démarrage du serveur (seulement si ce n'est pas un environnement de test)
if (process.env.NODE_ENV !== 'test') {
  app.listen(port, () => {
    console.log(`🚀 Team Service démarré sur le port ${port}`);
    console.log(`📋 Environnement: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🔗 URL: http://localhost:${port}`);
    console.log(`💾 Base de données: ${process.env.DATABASE_URL ? 'Configurée' : 'Non configurée (utiliser .env)'}`);
  });
}

// Export de l'app pour les tests
export default app;

