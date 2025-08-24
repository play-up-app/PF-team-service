import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { dateTimeNormalizer } from './middleware/dateTimeNormalizer.js';
import teamRoutes from './routes/team.route.js';
import cookieParser from 'cookie-parser';
import { globalLimiter } from './middleware/rateLimiter.js';
import { 
    requestLogger,  
    logError,
    logInfo 
} from './config/logger.js';

const app = express();
const port = process.env.PORT || 3003;

// Configuration de Helmet
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'"],
            styleSrc: ["'self'"],
            imgSrc: ["'self'", "data:", "https:"],
            connectSrc: ["'self'"],
            fontSrc: ["'self'"],
            objectSrc: ["'none'"],
            mediaSrc: ["'self'"],
            frameSrc: ["'none'"],
        },
    },
    crossOriginEmbedderPolicy: true,
    crossOriginOpenerPolicy: true,
    crossOriginResourcePolicy: { policy: "same-site" },
    dnsPrefetchControl: true,
    frameguard: { action: "deny" },
    hidePoweredBy: true,
    hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true
    },
    ieNoOpen: true,
    noSniff: true,
    referrerPolicy: { policy: "strict-origin-when-cross-origin" },
    xssFilter: true,
}));

// Configuration CORS sécurisée
app.use(cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:8080',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowedHeaders: [
        'Content-Type',
        'Authorization',
        'X-Requested-With',
        'Accept',
        'Origin'
    ],
    exposedHeaders: ['Content-Range', 'X-Content-Range'],
    credentials: true,
    maxAge: 86400,
    optionsSuccessStatus: 204,
    preflightContinue: false,
}));

// Middleware de parsing avec limites
app.use(express.json({
    limit: '10kb' // Limite la taille des requêtes JSON
}));
app.use(express.urlencoded({ 
    extended: true,
    limit: '10kb' // Limite la taille des données de formulaire
}));
app.use(cookieParser());

// Rate Limiting global
app.use(globalLimiter);

// Logger pour les requêtes HTTP
app.use(requestLogger);

// Middleware pour normaliser automatiquement les dates/heures
app.use(dateTimeNormalizer);

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
            'DELETE /api/teams/:id/members/:playerId',
            'DELETE /api/teams/tournament/:tournamentId'

        ]
    });
});

// Middleware global de gestion des erreurs
app.use((error, req, res, next) => {
    // Log l'erreur
    logError(error, {
        url: req.url,
        method: req.method,
        body: req.body,
        user: req.user?.id
    });
    
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
        logInfo('Serveur démarré', {
            port,
            env: process.env.NODE_ENV || 'development',
            nodeVersion: process.version,
            databaseStatus: process.env.DATABASE_URL ? 'Configurée' : 'Non configurée'
        });
    });
}

// Export de l'app pour les tests
export default app;