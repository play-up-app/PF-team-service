import TeamRepository from '../repositories/team.repository.js';
import { logInfo, logError } from '../config/logger.js';

export default class TeamController {
  constructor() {
    this.teamRepository = new TeamRepository();
  }

  validateTeamData(data) {
    const errors = [];
    
    if (!data.name || data.name.trim().length < 2) {
      errors.push('Le nom de l\'équipe doit contenir au moins 2 caractères');
    }
    if (data.name && data.name.length > 255) {
      errors.push('Le nom de l\'équipe ne peut pas dépasser 255 caractères');
    }
    if (data.contact_email && !this.isValidEmail(data.contact_email)) {
      errors.push('L\'email de contact n\'est pas valide');
    }
    if (data.contact_phone && data.contact_phone.length > 20) {
      errors.push('Le numéro de téléphone ne peut pas dépasser 20 caractères');
    }
    
    return errors;
  }

  isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  createTeam = async (req, res) => {
    try {
      logInfo('Tentative de création d\'équipe', { 
        captain_id: req.body.captain_id,
        tournament_id: req.body.tournament_id,
        name: req.body.name 
      });

      const { 
        captain_id, 
        name, 
        description, 
        tournament_id,
        contact_email,
        contact_phone,
        skill_level,
        notes,
        captain_position
      } = req.body;

      // Validation simple
      if (!captain_id) {
        logError('Création équipe échouée: ID capitaine manquant');
        return res.status(400).json({
          success: false,
          message: 'L\'ID du capitaine est requis'
        });
      }

      if (!tournament_id) {
        logError('Création équipe échouée: ID tournoi manquant');
        return res.status(400).json({
          success: false,
          message: 'L\'ID du tournoi est requis'
        });
      }

      const teamData = { 
        name, 
        description, 
        tournament_id,
        contact_email,
        contact_phone,
        skill_level,
        notes,
        captain_position
      };
      
      const validationErrors = this.validateTeamData(teamData);
      
      if (validationErrors.length > 0) {
        logError('Création équipe échouée: validation échouée', { errors: validationErrors });
        return res.status(400).json({
          success: false,
          message: 'Données invalides',
          errors: validationErrors
        });
      }

      // Création de l'équipe
      const team = await this.teamRepository.createTeam(captain_id, teamData);
      
      if (!team) {
        logError('Création équipe échouée: erreur repository');
        return res.status(500).json({
          success: false,
          message: 'Erreur lors de la création de l\'équipe'
        });
      }

      logInfo('Équipe créée avec succès', { 
        team_id: team.id, 
        name: team.name,
        tournament_id: team.tournament_id 
      });

      res.status(201).json({
        success: true,
        message: 'Équipe créée avec succès',
        data: team
      });
    } catch (error) {
      logError('Erreur création équipe', error);
      
      // Gestion des erreurs Prisma spécifiques
      if (error.code === 'P2002') {
        logError('Création équipe échouée: nom d\'équipe déjà existant', { 
          name: req.body.name, 
          tournament_id: req.body.tournament_id 
        });
        return res.status(409).json({
          success: false,
          message: 'Une équipe avec ce nom existe déjà dans ce tournoi'
        });
      }
      
      if (error.code === 'P2003') {
        logError('Création équipe échouée: référence invalide', { 
          captain_id: req.body.captain_id, 
          tournament_id: req.body.tournament_id 
        });
        return res.status(400).json({
          success: false,
          message: 'Référence invalide (capitaine ou tournoi non trouvé)'
        });
      }
      
      res.status(500).json({
        success: false,
        message: 'Erreur interne du serveur'
      });
    }
  };

  getTeam = async (req, res) => {
    try {
      const { id } = req.params;
      logInfo('Tentative de récupération d\'équipe', { team_id: id });

      if (!id) {
        logError('Récupération équipe échouée: ID manquant');
        return res.status(400).json({
          success: false,
          message: 'ID d\'équipe requis'
        });
      }

      const team = await this.teamRepository.getTeam(id);
      
      if (!team) {
        logError('Récupération équipe échouée: équipe non trouvée', { team_id: id });
        return res.status(404).json({
          success: false,
          message: 'Équipe non trouvée'
        });
      }

      logInfo('Équipe récupérée avec succès', { team_id: id, name: team.name });
      res.json({
        success: true,
        data: team
      });
    } catch (error) {
      logError('Erreur récupération équipe', error);
      res.status(500).json({
        success: false,
        message: 'Erreur interne du serveur'
      });
    }
  };

  updateTeam = async (req, res) => {
    try {
      const { teamId } = req.params;
      const updateData = req.body;
      
      logInfo('Tentative de mise à jour d\'équipe', { 
        team_id: teamId, 
        update_fields: Object.keys(updateData) 
      });
      
      // Validation des données de mise à jour
      const validationErrors = this.validateTeamData(updateData);
      if (validationErrors.length > 0) {
        logError('Mise à jour équipe échouée: validation échouée', { 
          team_id: teamId, 
          errors: validationErrors 
        });
        return res.status(400).json({
          success: false,
          message: 'Données invalides',
          errors: validationErrors
        });
      }

      // Validation du statut si fourni
      const validStatuses = ['registered', 'confirmed', 'disqualified', 'withdrawn'];
      if (updateData.status && !validStatuses.includes(updateData.status)) {
        return res.status(400).json({
          success: false,
          message: `Statut invalide. Statuts autorisés: ${validStatuses.join(', ')}`
        });
      }

      // Validation du niveau si fourni
      const validSkillLevels = ['debutant', 'amateur', 'confirme', 'expert', 'professionnel'];
      if (updateData.skill_level && !validSkillLevels.includes(updateData.skill_level)) {
        return res.status(400).json({
          success: false,
          message: `Niveau invalide. Niveaux autorisés: ${validSkillLevels.join(', ')}`
        });
      }

      const team = await this.teamRepository.updateTeam(teamId, updateData);
      
      if (!team) {
        logError('Mise à jour équipe échouée: équipe non trouvée', { team_id: teamId });
        return res.status(404).json({
          success: false,
          message: 'Équipe non trouvée ou erreur lors de la mise à jour'
        });
      }

      logInfo('Équipe mise à jour avec succès', { 
        team_id: teamId, 
        name: team.name,
        update_fields: Object.keys(updateData) 
      });

      res.json({
        success: true,
        message: 'Équipe mise à jour avec succès',
        data: team
      });
    } catch (error) {
      logError('Erreur mise à jour équipe', error);
      
      if (error.code === 'P2002') {
        logError('Mise à jour équipe échouée: nom d\'équipe déjà existant', { 
          team_id: req.params.teamId,
          name: req.body.name 
        });
        return res.status(409).json({
          success: false,
          message: 'Une équipe avec ce nom existe déjà dans ce tournoi'
        });
      }
      
      res.status(500).json({
        success: false,
        message: 'Erreur interne du serveur'
      });
    }
  };

  deleteTeam = async (req, res) => {
    try {
      const { id } = req.params;
      logInfo('Tentative de suppression d\'équipe', { team_id: id });
      
      const success = await this.teamRepository.deleteTeam(id);
      
      if (!success) {
        logError('Suppression équipe échouée: équipe non trouvée', { team_id: id });
        return res.status(404).json({
          success: false,
          message: 'Équipe non trouvée ou erreur lors de la suppression'
        });
      }

      logInfo('Équipe supprimée avec succès', { team_id: id });
      res.json({
        success: true,
        message: 'Équipe supprimée avec succès'
      });
    } catch (error) {
      logError('Erreur suppression équipe', error);
      res.status(500).json({
        success: false,
        message: 'Erreur interne du serveur'
      });
    }
  };

  listTeams = async (req, res) => {
    try {
      const {
        page = 1,
        limit = 10,
        name,
        status,
        tournament_id,
        skill_level
      } = req.query;

      const filters = {};
      if (name) filters.name = name;
      if (status) filters.status = status;
      if (tournament_id) filters.tournament_id = tournament_id;
      if (skill_level) filters.skill_level = skill_level;

      const pagination = {
        page: Math.max(1, parseInt(page, 10)),
        limit: Math.min(50, Math.max(1, parseInt(limit, 10))) // Entre 1 et 50
      };

      logInfo('Tentative de listage d\'équipes', { 
        filters, 
        pagination,
        filters_count: Object.keys(filters).length 
      });

      const result = await this.teamRepository.listTeams(filters, pagination);

      logInfo('Équipes listées avec succès', { 
        teams_count: result.teams.length,
        total_pages: result.pagination.totalPages,
        current_page: result.pagination.page 
      });

      res.json({
        success: true,
        data: result.teams,
        pagination: result.pagination
      });
    } catch (error) {
      logError('Erreur liste équipes', error);
      res.status(500).json({
        success: false,
        message: 'Erreur interne du serveur'
      });
    }
  };

  getTeamsByTournament = async (req, res) => {
    try {
      const { tournamentId } = req.params;

      if (!tournamentId) {
        return res.status(400).json({
          success: false,
          message: 'ID de tournoi requis'
        });
      }

      const teams = await this.teamRepository.getTeamsByTournament(tournamentId);

      res.json({
        success: true,
        data: teams
      });
    } catch (error) {
      console.error('Erreur récupération équipes tournoi:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur interne du serveur'
      });
    }
  };

  addMembers = async (req, res) => {
    try {
      const { id } = req.params;
      const { players } = req.body;

      logInfo('Tentative d\'ajout de membres', { 
        team_id: id, 
        players_count: players?.length || 0 
      });

      const members = await this.teamRepository.addMembers(id, players);
      
      if (!members) {
        logError('Ajout membres échoué: erreur repository', { team_id: id });
        return res.status(400).json({
          success: false,
          message: 'Erreur lors de l\'ajout des membres (joueur déjà dans l\'équipe ou équipe/joueur inexistant)'
        });
      }

      logInfo('Membres ajoutés avec succès', { 
        team_id: id, 
        members_count: members.length 
      });

      res.status(201).json({
        success: true,
        message: 'Membres ajoutés avec succès',
        data: members
      });
    } catch (error) {
      logError('Erreur ajout membres', error);
      
      if (error.code === 'P2002') {
        logError('Ajout membres échoué: joueur déjà membre', { 
          team_id: req.params.id,
          players: req.body.players 
        });
        return res.status(409).json({
          success: false,
          message: 'Ce joueur est déjà membre de cette équipe'
        });
      }
      
      if (error.code === 'P2003') {
        logError('Ajout membres échoué: équipe ou joueur non trouvé', { 
          team_id: req.params.id,
          players: req.body.players 
        });
        return res.status(400).json({
          success: false,
          message: 'Équipe ou joueur non trouvé'
        });
      }
      
      return res.status(500).json({
        success: false,
        message: 'Erreur interne du serveur'
      });
    }
  };

  removeMember = async (req, res) => {
    try {
      const { teamId, playerId } = req.params;

      const success = await this.teamRepository.removeMember(teamId, playerId);
      
      if (!success) {
        return res.status(404).json({
          success: false,
          message: 'Membre non trouvé dans cette équipe'
        });
      }

      res.json({
        success: true,
        message: 'Membre retiré avec succès'
      });
    } catch (error) {
      console.error('Erreur retrait membre:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur interne du serveur'
      });
    }
  };

  getTeamMembers = async (req, res) => {
    try {
      const { teamId } = req.params;

      const members = await this.teamRepository.getTeamMembers(teamId);

      res.json({
        success: true,
        data: members
      });
    } catch (error) {
      console.error('Erreur récupération membres:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur interne du serveur'
      });
    }
  };

  deleteTeamByTournament = async (req, res) => {
    try {
      const { tournamentId } = req.params;
      logInfo('Tentative de suppression d\'équipes par tournoi', { tournament_id: tournamentId });
      
      const success = await this.teamRepository.deleteTeamByTournament(tournamentId);
      if (!success) {
        logError('Suppression équipes par tournoi échouée', { tournament_id: tournamentId });
        return res.status(404).json({
          success: false,
          message: 'Erreur lors de la suppression des équipes'
        });
      }
      
      logInfo('Équipes supprimées par tournoi avec succès', { tournament_id: tournamentId });
      res.json({
        success: true,
        message: 'Équipes supprimées avec succès'
      });
    }
    catch (error) {
      logError('Erreur suppression équipes tournoi', error);
      res.status(500).json({
        success: false,
        message: 'Erreur interne du serveur'
      });
    }
  }

  createTeamWithTournament = async (req, res) => {
    try {
      const teamData = req.body;
      const team = await this.teamRepository.createTeamWithTournament(teamData);
      res.status(201).json({
        success: true,
        message: 'Équipe créée avec succès',
        data: team
      });
    } catch (error) {
      console.error('Erreur création équipe:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur interne du serveur'
      });
    }
  }
}