import winston from 'winston';

// Création du logger
const logger = winston.createLogger({
  // Niveau de log par défaut
  level: 'info',
  
  // Format simple pour les logs
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  
  // Où écrire les logs
  transports: [
    // Logs d'erreur dans un fichier
    new winston.transports.File({ 
      filename: 'logs/error.log',
      level: 'error'
    }),
    // Tous les logs dans un autre fichier
    new winston.transports.File({ 
      filename: 'logs/combined.log' 
    })
  ]
});

// En développement, on affiche aussi dans la console
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }));
}

// Middleware pour logger les requêtes HTTP
export const requestLogger = (req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    logger.info({
      method: req.method,
      url: req.url,
      status: res.statusCode,
      duration: Date.now() - start
    });
  });

  next();
};

// Fonctions simples pour logger
export const logError = (message, error) => {
  logger.error({
    message,
    error: error?.message,
    stack: error?.stack
  });
};

export const logInfo = (message, data = {}) => {
  logger.info({
    message,
    ...data
  });
};

export default logger;