import Joi from 'joi';

// Schéma pour la création d'une équipe
export const createTeamSchema = Joi.object({
    name: Joi.string()
        .min(3)
        .max(100)
        .required()
        .messages({
            'string.min': 'Le nom de l\'équipe doit contenir au moins 3 caractères',
            'string.max': 'Le nom de l\'équipe ne doit pas dépasser 100 caractères',
            'any.required': 'Le nom de l\'équipe est requis'
        }),
    description: Joi.string()
        .max(500)
        .allow(null, '')
        .messages({
            'string.max': 'La description ne doit pas dépasser 500 caractères'
        }),
    tournament_id: Joi.string()
        .uuid()
        .required()
        .messages({
            'string.guid': 'L\'ID du tournoi doit être un UUID valide',
            'any.required': 'L\'ID du tournoi est requis'
        }),
    captain_id: Joi.string()
        .uuid()
        .required()
        .messages({
            'string.guid': 'L\'ID du capitaine doit être un UUID valide',
            'any.required': 'L\'ID du capitaine est requis'
        }),
    contact_email: Joi.string()
        .email()
        .allow(null, '')
        .messages({
            'string.email': 'L\'email de contact doit être une adresse email valide'
        }),
    contact_phone: Joi.string()
        .pattern(/^[0-9+\-\s()]{8,20}$/)
        .allow(null, '')
        .messages({
            'string.pattern.base': 'Le numéro de téléphone doit être un format valide'
        }),
    skill_level: Joi.string()
        .valid('amateur', 'intermediaire', 'confirme', 'expert')
        .default('amateur')
        .messages({
            'any.only': 'Le niveau doit être amateur, intermediaire, confirme ou expert'
        }),
    notes: Joi.string()
        .max(1000)
        .allow(null, '')
        .messages({
            'string.max': 'Les notes ne doivent pas dépasser 1000 caractères'
        })
});

// Schéma pour la mise à jour d'une équipe
export const updateTeamSchema = Joi.object({
    name: Joi.string()
        .min(3)
        .max(100)
        .messages({
            'string.min': 'Le nom de l\'équipe doit contenir au moins 3 caractères',
            'string.max': 'Le nom de l\'équipe ne doit pas dépasser 100 caractères'
        }),
    description: Joi.string()
        .max(500)
        .allow(null, '')
        .messages({
            'string.max': 'La description ne doit pas dépasser 500 caractères'
        }),
    contact_email: Joi.string()
        .email()
        .allow(null, '')
        .messages({
            'string.email': 'L\'email de contact doit être une adresse email valide'
        }),
    contact_phone: Joi.string()
        .pattern(/^[0-9+\-\s()]{8,20}$/)
        .allow(null, '')
        .messages({
            'string.pattern.base': 'Le numéro de téléphone doit être un format valide'
        }),
    status: Joi.string()
        .valid('registered', 'confirmed', 'disqualified', 'withdrawn')
        .messages({
            'any.only': 'Le statut doit être registered, confirmed, disqualified ou withdrawn'
        }),
    skill_level: Joi.string()
        .valid('amateur', 'intermediaire', 'confirme', 'expert')
        .messages({
            'any.only': 'Le niveau doit être amateur, intermediaire, confirme ou expert'
        }),
    notes: Joi.string()
        .max(1000)
        .allow(null, '')
        .messages({
            'string.max': 'Les notes ne doivent pas dépasser 1000 caractères'
        })
}).min(1).messages({
    'object.min': 'Au moins un champ doit être fourni pour la mise à jour'
});

// Schéma pour l'ajout de membres, liste de joueurs
export const addMembersSchema = Joi.object({
    player_id: Joi.string()
        .uuid()
        .required()
        .messages({
            'string.guid': 'L\'ID du joueur doit être un UUID valide',
            'any.required': 'L\'ID du joueur est requis'
        }),
    role: Joi.string()
        .valid('player', 'captain')
        .default('player')
        .messages({
            'any.only': 'Le rôle doit être player, captain ou coach'
        }),
    position: Joi.string()
        .max(50)
        .allow(null, '')
        .messages({
            'string.max': 'La position ne doit pas dépasser 50 caractères'
        })
});
