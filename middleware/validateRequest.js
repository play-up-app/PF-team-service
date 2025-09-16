/**
 * Middleware de validation des requêtes avec Joi
 * @param {Object} schema - Schéma Joi pour la validation
 * @param {string} property - Propriété de la requête à valider ('body', 'query', 'params')
 */
export const validateRequest = (schema, property = 'body') => {
    return (req, res, next) => {
        const { error, value } = schema.validate(req[property], {
            abortEarly: false,
            stripUnknown: true,
            errors: {
                wrap: {
                    label: ''
                }
            }
        });

        if (error) {
            const errors = error.details.map(detail => ({
                field: detail.path.join('.'),
                message: detail.message
            }));

            return res.status(400).json({
                status: 'error',
                message: 'Données invalides',
                errors: errors
            });
        }

        // Remplace les données validées et nettoyées
        req[property] = value;
        next();
    };
};
