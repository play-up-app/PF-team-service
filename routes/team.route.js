import express from 'express';
import TeamController from '../controllers/team.controller.js';


const router = express.Router();
const teamController = new TeamController();

// Routes CRUD pour les équipes
router.post('/', teamController.createTeam);
router.get('/', teamController.listTeams);
router.get('/tournament/:tournamentId', teamController.getTeamsByTournament);
router.get('/:teamId', teamController.getTeam);
router.patch('/:teamId', teamController.updateTeam);
router.delete('/:teamId', teamController.deleteTeam);

router.get('/:teamId/members', teamController.getTeamMembers);
router.post('/:teamId/members', teamController.addMember);
router.delete('/:teamId/members/:playerId', teamController.removeMember);

export default router;