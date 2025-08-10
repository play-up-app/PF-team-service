import { prismaClient } from '../config/prisma.js';

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
            },
            orderBy: [
              { role: 'asc' },
              { joined_at: 'asc' }
            ]
          },
          tournament: {
            select: {
              id: true,
              name: true,
              status: true,
              start_date: true
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
          where,
          skip,
          take: limit,
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
            tournament: {
              select: {
                id: true,
                name: true,
                status: true
              }
            },
            _count: {
              select: {
                team_member: true
              }
            }
          },
          orderBy: { created_at: 'desc' }
        }),
        this.prisma.team.count({ where })
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

  async addMember(teamId, playerId, role = 'player', position = null) {
    try {
      console.log(`➕ Ajout membre ${playerId} à l'équipe ${teamId}`);
      
      const member = await this.prisma.team_member.create({
        data: {
          team_id: teamId,
          user_id: playerId,
          role: role,
          position: position,
          status: 'active'
        },
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

      console.log(`✅ Membre ajouté à l'équipe`);
      return member;
    } catch (error) {
      console.error(`❌ Erreur ajout membre: ${error.message}`);
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
}

