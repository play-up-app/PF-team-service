import TeamRepository from '../repositories/team.repository.js';

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
        return res.status(400).json({
          success: false,
          message: 'L\'ID du capitaine est requis'
        });
      }

      if (!tournament_id) {
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
        return res.status(400).json({
          success: false,
          message: 'Données invalides',
          errors: validationErrors
        });
      }

      // Création de l'équipe
      const team = await this.teamRepository.createTeam(captain_id, teamData);
      
      if (!team) {
        return res.status(500).json({
          success: false,
          message: 'Erreur lors de la création de l\'équipe'
        });
      }

      res.status(201).json({
        success: true,
        message: 'Équipe créée avec succès',
        data: team
      });
    } catch (error) {
      console.error('Erreur création équipe:', error);
      
      // Gestion des erreurs Prisma spécifiques
      if (error.code === 'P2002') {
        return res.status(409).json({
          success: false,
          message: 'Une équipe avec ce nom existe déjà dans ce tournoi'
        });
      }
      
      if (error.code === 'P2003') {
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
      const { teamId } = req.params;

      if (!teamId) {
        return res.status(400).json({
          success: false,
          message: 'ID d\'équipe requis'
        });
      }

      const team = await this.teamRepository.getTeam(teamId);
      
      if (!team) {
        return res.status(404).json({
          success: false,
          message: 'Équipe non trouvée'
        });
      }

      res.json({
        success: true,
        data: team
      });
    } catch (error) {
      console.error('Erreur récupération équipe:', error);
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
      
      // Validation des données de mise à jour
      const validationErrors = this.validateTeamData(updateData);
      if (validationErrors.length > 0) {
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
        return res.status(404).json({
          success: false,
          message: 'Équipe non trouvée ou erreur lors de la mise à jour'
        });
      }

      res.json({
        success: true,
        message: 'Équipe mise à jour avec succès',
        data: team
      });
    } catch (error) {
      console.error('Erreur mise à jour équipe:', error);
      
      if (error.code === 'P2002') {
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
      const { teamId } = req.params;

      const success = await this.teamRepository.deleteTeam(teamId);
      
      if (!success) {
        return res.status(404).json({
          success: false,
          message: 'Équipe non trouvée ou erreur lors de la suppression'
        });
      }

      res.json({
        success: true,
        message: 'Équipe supprimée avec succès'
      });
    } catch (error) {
      console.error('Erreur suppression équipe:', error);
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

      const result = await this.teamRepository.listTeams(filters, pagination);

      res.json({
        success: true,
        data: result.teams,
        pagination: result.pagination
      });
    } catch (error) {
      console.error('Erreur liste équipes:', error);
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

  addMember = async (req, res) => {
    try {
      const { teamId } = req.params;
      const { player_id, role = 'player', position } = req.body;

      if (!player_id) {
        return res.status(400).json({
          success: false,
          message: 'L\'ID du joueur est requis'
        });
      }

      // Validation du rôle
      const validRoles = ['captain', 'player'];
      if (!validRoles.includes(role)) {
        return res.status(400).json({
          success: false,
          message: `Rôle invalide. Rôles autorisés: ${validRoles.join(', ')}`
        });
      }

      const member = await this.teamRepository.addMember(teamId, player_id, role, position);
      
      if (!member) {
        return res.status(400).json({
          success: false,
          message: 'Erreur lors de l\'ajout du membre (joueur déjà dans l\'équipe ou équipe/joueur inexistant)'
        });
      }

      res.status(201).json({
        success: true,
        message: 'Membre ajouté avec succès',
        data: member
      });
    } catch (error) {
      console.error('Erreur ajout membre:', error);
      
      if (error.code === 'P2002') {
        return res.status(409).json({
          success: false,
          message: 'Ce joueur est déjà membre de cette équipe'
        });
      }
      
      if (error.code === 'P2003') {
        return res.status(400).json({
          success: false,
          message: 'Équipe ou joueur non trouvé'
        });
      }
      
      res.status(500).json({
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
}