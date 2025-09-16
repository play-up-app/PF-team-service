import rateLimit from 'express-rate-limit';

// Limiteur global pour toutes les routes
export const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limite chaque IP à 100 requêtes par fenêtre
    message: {
        status: 'error',
        message: 'Trop de requêtes depuis cette IP, veuillez réessayer dans 15 minutes'
    },
    standardHeaders: true,
    legacyHeaders: false,
});

// Limiteur pour la création d'équipe
export const createTeamLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 heure
    max: 5, // Limite chaque IP à 5 créations d'équipe par heure
    message: {
        status: 'error',
        message: 'Trop d\'équipes créées, veuillez réessayer dans 1 heure'
    },
    standardHeaders: true,
    legacyHeaders: false,
});

// Limiteur pour l'ajout de membres
export const addMemberLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 heure
    max: 50, // Limite chaque IP à 20 ajouts de membres par heure
    message: {
        status: 'error',
        message: 'Trop de membres ajoutés, veuillez réessayer dans 1 heure'
    },
    standardHeaders: true,
    legacyHeaders: false,
});
