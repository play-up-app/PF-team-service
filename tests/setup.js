import dotenv from 'dotenv';

// Configuration globale pour les tests Jest
dotenv.config({ path: '.env.test' });

// Variables d'environnement par défaut pour les tests
process.env.NODE_ENV = 'test';
process.env.PORT = '3004'; // Port différent pour les tests
process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgresql://test:test@localhost:5432/team_service_test';

console.log('🧪 Configuration des tests initialisée'); 