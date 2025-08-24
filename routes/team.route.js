import express from 'express';
import TeamController from '../controllers/team.controller.js';
import TeamRepository from '../repositories/team.repository.js';
import { validateRequest } from '../middleware/validateRequest.js';
import { createTeamSchema, updateTeamSchema, addMembersSchema } from '../validation/teamSchemas.js';
import { createTeamLimiter, addMemberLimiter } from '../middleware/rateLimiter.js';
import Joi from 'joi';

const router = express.Router();
const teamRepository = new TeamRepository();
const teamController = new TeamController(teamRepository);

// Créer une équipe
router.post('/',
    createTeamLimiter,
    validateRequest(createTeamSchema),
    (req, res) => teamController.createTeam(req, res)
);

// Récupérer une équipe par ID
router.get('/:id',
    validateRequest(Joi.object({
        id: Joi.string().uuid().required()
    }), 'params'),
    (req, res) => teamController.getTeam(req, res)
);

// Lister les équipes
router.get('/',
    validateRequest(Joi.object({
        page: Joi.number().integer().min(1).default(1),
        limit: Joi.number().integer().min(1).max(100).default(10),
        name: Joi.string(),
        status: Joi.string().valid('registered', 'confirmed', 'disqualified', 'withdrawn'),
        tournament_id: Joi.string().uuid(),
        skill_level: Joi.string().valid('amateur', 'intermediaire', 'confirme', 'expert')
    }), 'query'),
    (req, res) => teamController.listTeams(req, res)
);

// Mettre à jour une équipe
router.put('/:id',
    validateRequest(Joi.object({
        id: Joi.string().uuid().required()
    }), 'params'),
    validateRequest(updateTeamSchema),
    (req, res) => teamController.updateTeam(req, res)
);

// Ajouter des membres
router.post('/:id/members',
    addMemberLimiter,
    validateRequest(Joi.object({
        id: Joi.string().uuid().required()
    }), 'params'),
    // validateRequest(addMembersSchema),
    (req, res) => teamController.addMembers(req, res)
);

// Retirer un membre
router.delete('/:id/members/:userId',
    validateRequest(Joi.object({
        id: Joi.string().uuid().required(),
        userId: Joi.string().uuid().required()
    }), 'params'),
    (req, res) => teamController.removeMember(req, res)
);

// Récupérer les équipes d'un tournoi
router.get('/tournament/:tournamentId',
    validateRequest(Joi.object({
        tournamentId: Joi.string().uuid().required()
    }), 'params'),
    (req, res) => teamController.getTeamsByTournament(req, res)
);

// Supprimer toutes les équipes d'un tournoi
router.delete('/tournament/:tournamentId',
    validateRequest(Joi.object({
        tournamentId: Joi.string().uuid().required()
    }), 'params'),
    (req, res) => teamController.deleteTeamByTournament(req, res)
);

// Récupérer les membres d'une équipe
router.get('/:id/members',
    validateRequest(Joi.object({
        id: Joi.string().uuid().required()
    }), 'params'),
    (req, res) => teamController.getTeamMembers(req, res)
);

// creer une equipe avec un tournoi
router.post('/tournament/:tournamentId',
    validateRequest(
        Joi.object({
        tournamentId: Joi.string().uuid().required()
    }), 'params'),
    validateRequest(createTeamSchema),
    (req, res) => teamController.createTeamWithTournament(req, res)
);

// Supprimer une équipe
router.delete("/:id",
    validateRequest(Joi.object({
        id: Joi.string().uuid().required()
    }), 'params'),
    (req, res) => teamController.deleteTeam(req, res)
);

export default router;