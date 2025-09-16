import { prismaClient } from '../config/prisma.js';
import crypto from 'crypto';

export default class TeamRepository {
  constructor() {
    this.prisma = prismaClient;
  }

  async createTeam(captainId, teamData) {
    try {
      console.log(`👥 Création nouvelle équipe: ${teamData.name || 'Sans nom'}`);
      
      const team = await this.prisma.team.create({
        data: {
          name: teamData.name,
          description: teamData.description || null,
          tournament_id: teamData.tournament_id, // Obligatoire selon le schéma
          captain_id: captainId,
          contact_email: teamData.contact_email || null,
          contact_phone: teamData.contact_phone || null,
          status: 'registered',
          skill_level: teamData.skill_level || 'amateur',
          notes: teamData.notes || null,
          // Ajouter automatiquement le capitaine comme membre
          team_member: {
            create: {
              user_id: captainId,
              role: 'captain',
              position: teamData.captain_position || null,
              status: 'active'
            }
          }
        },
        include: {
          team_member: {
            include: {
              profile: {
                select: {
                  id: true,
                  display_name: true,
                  first_name: true,
                  last_name: true,
                  email: true
                }
              }
            }
          }
        }
      });

      console.log(`✅ Équipe créée avec ID: ${team.id}`);
      return team;
    } catch (error) {
      console.error(`❌ Erreur création équipe: ${error.message}`);
      return null;
    }
  }

  async getTeam(teamId) {
    try {
      console.log(`🔍 Récupération équipe ${teamId}`);
      
      const team = await this.prisma.team.findUnique({
        where: { id: teamId },
        select: {
          id: true,
          name: true,
          description: true,
          tournament_id: true,
          contact_email: true,
          status: true, 
          team_member: {
            include: {
              profile: {
                select: {
                  id: true,
                  display_name: true,
                  first_name: true,
                  last_name: true,
                  email: true
                }
              }
            }
          }
        }
      });

      if (!team) {
        console.log(`❌ Équipe ${teamId} non trouvée`);
        return null;
      }

      console.log(`✅ Équipe récupérée: ${team.name}`);
      return team;
    } catch (error) {
      console.error(`❌ Erreur récupération équipe ${teamId}: ${error.message}`);
      return null;
    }
  }

  async updateTeam(teamId, updateData) {
    try {
      console.log(`✏️ Mise à jour équipe ${teamId}`);
      
      const team = await this.prisma.team.update({
        where: { id: teamId },
        data: {
          ...(updateData.name && { name: updateData.name }),
          ...(updateData.description !== undefined && { description: updateData.description }),
          ...(updateData.contact_email !== undefined && { contact_email: updateData.contact_email }),
          ...(updateData.contact_phone !== undefined && { contact_phone: updateData.contact_phone }),
          ...(updateData.status && { status: updateData.status }),
          ...(updateData.skill_level && { skill_level: updateData.skill_level }),
          ...(updateData.notes !== undefined && { notes: updateData.notes }),
          updated_at: new Date()
        },
        include: {
          team_member: {
            include: {
              profile: {
                select: {
                  id: true,
                  display_name: true,
                  first_name: true,
                  last_name: true,
                  email: true
                }
              }
            }
          }
        }
      });

      console.log(`✅ Équipe ${teamId} mise à jour`);
      return team;
    } catch (error) {
      console.error(`❌ Erreur mise à jour équipe ${teamId}: ${error.message}`);
      return null;
    }
  }

  async deleteTeam(teamId) {
    try {
      console.log(`🗑️ Suppression équipe ${teamId}`);
      
      await this.prisma.team.delete({
        where: { id: teamId }
      });

      console.log(`✅ Équipe ${teamId} supprimée`);
      return true;
    } catch (error) {
      console.error(`❌ Erreur suppression équipe ${teamId}: ${error.message}`);
      return false;
    }
  }

  async listTeams(filters = {}, pagination = { page: 1, limit: 10 }) {
    try {
      const { page, limit } = pagination;
      const skip = (page - 1) * limit;
      console.log(`🔍 Liste équipes: page ${page}, limit ${limit}`);
      const where = {};
      if (filters.name) {
        where.name = { contains: filters.name, mode: 'insensitive' };
      }
      if (filters.status) {
        where.status = filters.status;
      }
      if (filters.tournament_id) {
        where.tournament_id = filters.tournament_id;
      }
      if (filters.skill_level) {
        where.skill_level = filters.skill_level;
      }

      const [teams, total] = await Promise.all([
        this.prisma.team.findMany({
          select: {
            id: true,
            name: true,
            description: true,
            tournament_id: true,
            contact_email: true,
            skill_level: true,
            status: true,
            team_member: {
              select: {
                position: true,
                role: true,
                status: true,
                profile: {
                  select: {
                    display_name: true,
                    email: true,
                  }
                }
              }
            }
          },
          where,
          skip,
          take: limit,
          orderBy: { created_at: 'desc' }
        }).then(teams => teams.map(team => ({
          id: team.id,
          name: team.name,
          description: team.description,
          tournamentId: team.tournament_id,
          contactEmail: team.contact_email,
          skillLevel: team.skill_level,
          status: team.status,
          members: team.team_member.map(member => ({
            name: member.profile.display_name,
            email: member.profile.email,
            role: member.role,
            position: member.position,
            status: member.status
          }))
        })))
      ]);
      return {
        teams,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      console.error(`❌ Erreur liste équipes: ${error.message}`);
      return { teams: [], pagination: { page: 1, limit: 10, total: 0, totalPages: 0 } };
    }
  }

  async addMembers(teamId, players) {
    try {
      console.log(`➕ Ajout membres à l'équipe ${teamId}`);

      const members = await this.prisma.team_member.createManyAndReturn({
        data: players.map(player => ({
          team_id: teamId,
          user_id: player.user_id,
          role: player.role,
          position: player.position,
          status: 'active'
        })),
        include: {
          profile: {
            select: {
              id: true,
              display_name: true,
              first_name: true,
              last_name: true,
              email: true,
              avatar_url: true
            }
          },
          team: {
            select: {
              id: true,
              name: true,
              tournament_id: true
            }
          }
        }
      });

      console.log(`✅ Membres ajoutés à l'équipe`);
      return members;
    } catch (error) {
      console.error(`❌ Erreur ajout membres: ${error.message}`);
      return null;
    }
  }

  async removeMember(teamId, playerId) {
    try {
      console.log(`➖ Retrait membre ${playerId} de l'équipe ${teamId}`);
      
      await this.prisma.team_member.delete({
        where: {
          team_id_user_id: {
            team_id: teamId,
            user_id: playerId
          }
        }
      });

      console.log(`✅ Membre retiré de l'équipe`);
      return true;
    } catch (error) {
      console.error(`❌ Erreur retrait membre: ${error.message}`);
      return false;
    }
  }

  async getTeamMembers(teamId) {
    try {
      console.log(`👥 Récupération membres équipe ${teamId}`);
      
      const members = await this.prisma.team_member.findMany({
        where: { team_id: teamId },
        include: {
          profile: {
            select: {
              id: true,
              display_name: true,
              first_name: true,
              last_name: true,
              email: true
            }
          }
        },
        orderBy: [
          { role: 'asc' },
          { joined_at: 'asc' }
        ]
      });

      console.log(`✅ ${members.length} membre(s) récupéré(s)`);
      return members;
    } catch (error) {
      console.error(`❌ Erreur récupération membres: ${error.message}`);
      return [];
    }
  }

  async getTeamsByTournament(tournamentId) {
    try {
      console.log(`🏆 Récupération équipes du tournoi ${tournamentId}`);
      
      const teams = await this.prisma.team.findMany({
        where: { tournament_id: tournamentId },
        include: {
          team_member: {
            include: {
              profile: {
                select: {
                  id: true,
                  display_name: true,
                  first_name: true,
                  last_name: true
                }
              }
            }
          },
          _count: {
            select: {
              team_member: true
            }
          }
        },
        orderBy: { created_at: 'asc' }
      });

      console.log(`✅ ${teams.length} équipe(s) récupérée(s) pour le tournoi`);
      return teams;
    } catch (error) {
      console.error(`❌ Erreur récupération équipes tournoi: ${error.message}`);
      return [];
    }
  }

  async deleteTeamByTournament(tournamentId) {
    try {
      console.log(`🗑️ Suppression équipes du tournoi ${tournamentId}`);
      // check if tournament exists else throw error
      const tournament = await this.prisma.tournament.findUnique({
        where: { id: tournamentId }
      });

      if (!tournament) {
        throw new Error(`Tournoi ${tournamentId} non trouvé`);
      }
      // check if there are teams in the tournament else throw error
      const teams = await this.prisma.team.findMany({
        where: { tournament_id: tournamentId }
      });
      if (teams.length === 0) {
        throw new Error(`Aucune équipe trouvée pour le tournoi ${tournamentId}`);
      }
      
      // delete teams
      return await this.prisma.$transaction(async (tx) => {
        // supprimer team_member
        await tx.team_member.deleteMany({
          where: { team_id: { in: teams.map(team => team.id) } }
        });
        // supprimer team
        await tx.team.deleteMany({
          where: { tournament_id: tournamentId }
        });
        return true;
      })
    }
    catch (error) {
      console.error(`❌ Erreur suppression équipes tournoi: ${error.message}`);
      return false;
    }
  }

  async createTeamWithTournament(teamData) {
    try {
        const team = await prismaClient.team.create({
            data: {
                ...teamData
            }
        })
        return team
    } catch (error) {
        console.error('Error creating team with tournament:', error)
        throw error
    }
  }

  // Méthodes pour l'import Excel des équipes
  async findTeamByName(tournamentId, teamName) {
    try {
      console.log(`🔍 Recherche équipe par nom: ${teamName} dans le tournoi ${tournamentId}`);
      
      const team = await this.prisma.team.findFirst({
        where: {
          tournament_id: tournamentId,
          name: teamName
        },
        include: {
          team_member: {
            include: {
              profile: {
                select: {
                  id: true,
                  display_name: true,
                  first_name: true,
                  last_name: true,
                  email: true
                }
              }
            }
          }
        }
      });

      if (team) {
        console.log(`✅ Équipe trouvée: ${team.name}`);
      } else {
        console.log(`❌ Équipe non trouvée: ${teamName}`);
      }

      return team;
    } catch (error) {
      console.error(`❌ Erreur recherche équipe par nom: ${error.message}`);
      throw error;
    }
  }

  async findUserByEmail(email) {
    try {
      console.log(`🔍 Recherche utilisateur par email: ${email}`);
      
      const user = await this.prisma.profile.findFirst({
        where: { email: email }
      });

      if (user) {
        console.log(`✅ Utilisateur trouvé: ${user.display_name}`);
      } else {
        console.log(`❌ Utilisateur non trouvé: ${email}`);
      }

      return user;
    } catch (error) {
      console.error(`❌ Erreur recherche utilisateur: ${error.message}`);
      throw error;
    }
  }

  async createUser(userData) {
    try {
      console.log(`👤 Création nouvel utilisateur: ${userData.email}`);

      // Générer un ID pour auth.users et profile (relation requise)
      const newUserId = crypto.randomUUID();

      // Créer l'utilisateur dans la table auth.users (champs majoritairement optionnels)
      await this.prisma.users.create({
        data: {
          id: newUserId,
          email: userData.email
        }
      });

      // Créer le profile lié en réutilisant le même id
      const profile = await this.prisma.profile.create({
        data: {
          id: newUserId,
          email: userData.email,
          display_name: userData.name,
          role: 'joueur',
          first_name: userData.name.split(' ')[0] || userData.name,
          last_name: userData.name.split(' ').slice(1).join(' ') || ''
        }
      });

      console.log(`✅ Utilisateur créé avec ID: ${profile.id}`);
      return profile;
    } catch (error) {
      console.error(`❌ Erreur création utilisateur: ${error.message}`);
      throw error;
    }
  }

  async createTeamFromExcel(tournamentId, teamName) {
    try {
      console.log(`👥 Création équipe depuis Excel: ${teamName}`);
      
      const team = await this.prisma.team.create({
        data: {
          name: teamName,
          tournament_id: tournamentId,
          status: 'confirmed',
          skill_level: 'amateur' // Valeur par défaut
        },
        include: {
          team_member: {
            include: {
              profile: {
                select: {
                  id: true,
                  display_name: true,
                  first_name: true,
                  last_name: true,
                  email: true,
                  role: true
                }
              }
            }
          }
        }
      });

      console.log(`✅ Équipe créée avec ID: ${team.id}`);
      return team;
    } catch (error) {
      console.error(`❌ Erreur création équipe depuis Excel: ${error.message}`);
      throw error;
    }
  }

  async createTeamMemberFromExcel(teamId, playerData) {
    try {
      console.log(`👤 Création membre d'équipe depuis Excel: ${playerData.email}`);
      
      const member = await this.prisma.team_member.create({
        data: {
          team_id: teamId,
          user_id: playerData.userId,
          role: playerData.role.toLowerCase() === 'capitaine' ? 'captain' : 'player',
          position: null, // Pas de position dans le format demandé
          status: 'active'
        },
        include: {
          profile: {
            select: {
              id: true,
              display_name: true,
              first_name: true,
              last_name: true,
              email: true
            }
          }
        }
      });

      console.log(`✅ Membre d'équipe créé avec ID: ${member.id}`);
      return member;
    } catch (error) {
      console.error(`❌ Erreur création membre d'équipe: ${error.message}`);
      throw error;
    }
  }

  async validateTournamentAccess(tournamentId, organizerId) {
    try {
      console.log(`🔐 Validation accès tournoi: ${tournamentId}`);
      
      const tournament = await this.prisma.tournament.findUnique({
        where: { id: tournamentId },
        select: { id: true, organizer_id: true }
      });

      if (!tournament) {
        console.log(`❌ Tournoi non trouvé: ${tournamentId}`);
        throw new Error('Tournoi non trouvé');
      }

      if (tournament.organizer_id !== organizerId) {
        console.log(`❌ Accès non autorisé au tournoi: ${tournamentId}`);
        throw new Error('Accès non autorisé au tournoi');
      }

      console.log(`✅ Accès au tournoi validé`);
      return true;
    } catch (error) {
      console.error(`❌ Erreur validation accès tournoi: ${error.message}`);
      throw error;
    }
  }

  async setTeamCaptain(teamId, userId) {
    try {
      console.log(`🧢 Définition du capitaine pour l'équipe ${teamId}: user ${userId}`);
      const team = await this.prisma.team.update({
        where: { id: teamId },
        data: { captain_id: userId }
      });
      return team;
    } catch (error) {
      console.error(`❌ Erreur définition capitaine: ${error.message}`);
      throw error;
    }
  }
}

