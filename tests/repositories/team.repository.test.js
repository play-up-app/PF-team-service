import { describe, it, expect, beforeEach, jest } from '@jest/globals'

// Mock des fonctions Prisma
const mockCreate = jest.fn()
const mockFindUnique = jest.fn()
const mockFindMany = jest.fn()
const mockUpdate = jest.fn()
const mockDelete = jest.fn()
const mockCount = jest.fn()
const mockMemberCreate = jest.fn()
const mockMemberFindMany = jest.fn()
const mockMemberDelete = jest.fn()

// Mock du module Prisma
jest.unstable_mockModule('../../config/prisma.js', () => ({
  prismaClient: {
    team: {
      create: mockCreate,
      findUnique: mockFindUnique,
      findMany: mockFindMany,
      update: mockUpdate,
      delete: mockDelete,
      count: mockCount
    },
    team_member: {
      create: mockMemberCreate,
      findMany: mockMemberFindMany,
      delete: mockMemberDelete
    }
  }
}))

// Import dynamique après le mock
const TeamRepository = (await import('../../repositories/team.repository.js')).default

describe('TeamRepository - Tests Unitaires', () => {
  let teamRepository

  beforeEach(() => {
    teamRepository = new TeamRepository()
    jest.clearAllMocks()
  })

  describe('createTeam', () => {
    it('devrait créer une équipe avec le capitaine comme membre', async () => {
      const captainId = 'captain-123'
      const teamData = {
        name: 'Équipe Test',
        description: 'Description test',
        tournament_id: 'tournament-123',
        contact_email: 'test@example.com',
        skill_level: 'amateur'
      }
      
      const expectedTeam = {
        id: 'team-123',
        name: 'Équipe Test',
        description: 'Description test',
        tournament_id: 'tournament-123',
        captain_id: captainId,
        contact_email: 'test@example.com',
        status: 'registered',
        skill_level: 'amateur',
        team_member: [{
          id: 'member-123',
          user_id: captainId,
          role: 'captain',
          status: 'active'
        }]
      }

      mockCreate.mockResolvedValue(expectedTeam)

      const result = await teamRepository.createTeam(captainId, teamData)

      expect(mockCreate).toHaveBeenCalledWith({
        data: expect.objectContaining({
          name: teamData.name,
          description: teamData.description,
          tournament_id: teamData.tournament_id,
          captain_id: captainId,
          contact_email: teamData.contact_email,
          contact_phone: null,
          status: 'registered',
          skill_level: teamData.skill_level,
          notes: null,
          team_member: {
            create: {
              user_id: captainId,
              role: 'captain',
              position: null,
              status: 'active'
            }
          }
        }),
        include: expect.objectContaining({
          team_member: expect.any(Object)
        })
      })
      
      expect(result).toEqual(expectedTeam)
    })

    it('devrait gérer les erreurs Prisma P2002 (contrainte unique)', async () => {
      const error = new Error('Unique constraint violation')
      error.code = 'P2002'
      mockCreate.mockRejectedValue(error)

      const result = await teamRepository.createTeam('captain-123', {
        name: 'Test Team',
        tournament_id: 'tournament-123'
      })

      expect(result).toBeNull()
    })

    it('devrait gérer les erreurs Prisma P2003 (contrainte de clé étrangère)', async () => {
      const error = new Error('Foreign key constraint violation')
      error.code = 'P2003'
      mockCreate.mockRejectedValue(error)

      const result = await teamRepository.createTeam('invalid-captain', {
        name: 'Test Team',
        tournament_id: 'invalid-tournament'
      })

      expect(result).toBeNull()
    })
  })

  describe('getTeam', () => {
    it('devrait récupérer une équipe avec ses membres et tournoi', async () => {
      const teamId = 'team-123'
      const expectedTeam = {
        id: teamId,
        name: 'Équipe Test',
        team_member: [
          {
            id: 'member-1',
            user_id: 'user-1',
            role: 'captain',
            profile: { display_name: 'Captain User' }
          }
        ],
        tournament: {
          id: 'tournament-123',
          name: 'Tournoi Test',
          status: 'upcoming'
        }
      }

      mockFindUnique.mockResolvedValue(expectedTeam)

      const result = await teamRepository.getTeam(teamId)

      expect(mockFindUnique).toHaveBeenCalledWith({
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
      })
      
      expect(result).toEqual(expectedTeam)
    })

    it('devrait retourner null si équipe non trouvée', async () => {
      mockFindUnique.mockResolvedValue(null)

      const result = await teamRepository.getTeam('non-existent')

      expect(result).toBeNull()
    })

    it('devrait gérer les erreurs de base de données', async () => {
      mockFindUnique.mockRejectedValue(new Error('Database error'))

      const result = await teamRepository.getTeam('team-123')

      expect(result).toBeNull()
    })
  })

  describe('updateTeam', () => {
    it('devrait mettre à jour une équipe avec updated_at', async () => {
      const teamId = 'team-123'
      const updateData = { name: 'Nouveau nom', status: 'active' }
      const updatedTeam = {
        id: teamId,
        name: 'Nouveau nom',
        status: 'active',
        updated_at: new Date()
      }

      mockUpdate.mockResolvedValue(updatedTeam)

      const result = await teamRepository.updateTeam(teamId, updateData)

      expect(mockUpdate).toHaveBeenCalledWith({
        where: { id: teamId },
        data: {
          ...updateData,
          updated_at: expect.any(Date)
        },
        include: expect.any(Object)
      })
      
      expect(result).toEqual(updatedTeam)
    })

    it('devrait retourner null si équipe non trouvée', async () => {
      const error = new Error('Team not found')
      error.code = 'P2025'
      mockUpdate.mockRejectedValue(error)

      const result = await teamRepository.updateTeam('non-existent', { name: 'Updated' })

      expect(result).toBeNull()
    })
  })

  describe('deleteTeam', () => {
    it('devrait supprimer une équipe avec succès', async () => {
      const teamId = 'team-123'
      mockDelete.mockResolvedValue({ id: teamId })

      const result = await teamRepository.deleteTeam(teamId)

      expect(mockDelete).toHaveBeenCalledWith({
        where: { id: teamId }
      })
      
      expect(result).toBe(true)
    })

    it('devrait retourner false si équipe non trouvée', async () => {
      const error = new Error('Team not found')
      error.code = 'P2025'
      mockDelete.mockRejectedValue(error)

      const result = await teamRepository.deleteTeam('non-existent')

      expect(result).toBe(false)
    })
  })

  describe('listTeams', () => {
    it('devrait lister les équipes avec filtres et pagination', async () => {
      const teams = [
        { id: 'team-1', name: 'Team 1', _count: { team_member: 2 } },
        { id: 'team-2', name: 'Team 2', _count: { team_member: 3 } }
      ]
      const totalCount = 15

      mockFindMany.mockResolvedValue(teams)
      mockCount.mockResolvedValue(totalCount)

      const filters = { 
        name: 'Test',
        tournament_id: 'tournament-123',
        status: 'active' 
      }
      const pagination = { page: 2, limit: 5 }

      const result = await teamRepository.listTeams(filters, pagination)

      expect(mockFindMany).toHaveBeenCalledWith({
        where: {
          name: { contains: 'Test', mode: 'insensitive' },
          tournament_id: 'tournament-123',
          status: 'active'
        },
        skip: 5, // (page-1) * limit
        take: 5,
        include: expect.any(Object),
        orderBy: { created_at: 'desc' }
      })

      expect(mockCount).toHaveBeenCalledWith({
        where: {
          name: { contains: 'Test', mode: 'insensitive' },
          tournament_id: 'tournament-123',
          status: 'active'
        }
      })

      expect(result).toEqual({
        teams,
        pagination: {
          page: 2,
          limit: 5,
          total: 15,
          totalPages: 3
        }
      })
    })

    it('devrait utiliser des valeurs par défaut pour la pagination', async () => {
      mockFindMany.mockResolvedValue([])
      mockCount.mockResolvedValue(0)

      const result = await teamRepository.listTeams({}, { page: 1, limit: 10 })

      expect(mockFindMany).toHaveBeenCalledWith({
        where: {},
        skip: 0,
        take: 10,
        include: expect.objectContaining({
          team_member: expect.any(Object),
          tournament: expect.any(Object),
          _count: expect.any(Object)
        }),
        orderBy: { created_at: 'desc' }
      })

      expect(result.pagination).toEqual({
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 0
      })
    })

    it('devrait gérer les erreurs de base de données', async () => {
      mockFindMany.mockRejectedValue(new Error('Database error'))

      const result = await teamRepository.listTeams({}, { page: 1, limit: 5 })

      expect(result).toEqual({
        teams: [],
        pagination: { page: 1, limit: 10, total: 0, totalPages: 0 }
      })
    })
  })

  describe('addMember', () => {
    it('devrait ajouter un membre à une équipe', async () => {
      const teamId = 'team-123'
      const playerId = 'player-123'
      const role = 'player'
      const position = 'attaquant'
      
      const member = {
        id: 'member-123',
        team_id: teamId,
        user_id: playerId,
        role,
        position,
        status: 'active',
        profile: { display_name: 'Player Test' },
        team: { id: teamId, name: 'Team Test' }
      }

      mockMemberCreate.mockResolvedValue(member)

      const result = await teamRepository.addMember(teamId, playerId, role, position)

      expect(mockMemberCreate).toHaveBeenCalledWith({
        data: {
          team_id: teamId,
          user_id: playerId,
          role,
          position,
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
      })
      
      expect(result).toEqual(member)
    })

    it('devrait gérer les erreurs de contrainte (membre déjà dans l\'équipe)', async () => {
      const error = new Error('Unique constraint violation')
      error.code = 'P2002'
      mockMemberCreate.mockRejectedValue(error)

      const result = await teamRepository.addMember('team-123', 'player-123', 'player')

      expect(result).toBeNull()
    })
  })

  describe('removeMember', () => {
    it('devrait retirer un membre d\'une équipe', async () => {
      const teamId = 'team-123'
      const playerId = 'player-123'
      
      mockMemberDelete.mockResolvedValue({ id: 'member-123' })

      const result = await teamRepository.removeMember(teamId, playerId)

      expect(mockMemberDelete).toHaveBeenCalledWith({
        where: {
          team_id_user_id: {
            team_id: teamId,
            user_id: playerId
          }
        }
      })
      
      expect(result).toBe(true)
    })

    it('devrait retourner false si membre non trouvé', async () => {
      const error = new Error('Member not found')
      error.code = 'P2025'
      mockMemberDelete.mockRejectedValue(error)

      const result = await teamRepository.removeMember('team-123', 'player-123')

      expect(result).toBe(false)
    })
  })

  describe('getTeamMembers', () => {
    it('devrait récupérer les membres d\'une équipe triés par rôle', async () => {
      const teamId = 'team-123'
      const members = [
        {
          id: 'member-1',
          user_id: 'user-1',
          role: 'captain',
          profile: { display_name: 'Captain User' }
        },
        {
          id: 'member-2',
          user_id: 'user-2',
          role: 'player',
          profile: { display_name: 'Player User' }
        }
      ]

      mockMemberFindMany.mockResolvedValue(members)

      const result = await teamRepository.getTeamMembers(teamId)

      expect(mockMemberFindMany).toHaveBeenCalledWith({
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
      })
      
      expect(result).toEqual(members)
    })

    it('devrait retourner un tableau vide en cas d\'erreur', async () => {
      mockMemberFindMany.mockRejectedValue(new Error('Database error'))

      const result = await teamRepository.getTeamMembers('team-123')

      expect(result).toEqual([])
    })
  })

  describe('getTeamsByTournament', () => {
    it('devrait récupérer les équipes d\'un tournoi', async () => {
      const tournamentId = 'tournament-123'
      const teams = [
        {
          id: 'team-1',
          name: 'Team 1',
          tournament_id: tournamentId,
          team_member: [],
          _count: { team_member: 2 }
        }
      ]

      mockFindMany.mockResolvedValue(teams)

      const result = await teamRepository.getTeamsByTournament(tournamentId)

      expect(mockFindMany).toHaveBeenCalledWith({
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
      })
      
      expect(result).toEqual(teams)
    })

    it('devrait retourner un tableau vide en cas d\'erreur', async () => {
      mockFindMany.mockRejectedValue(new Error('Database error'))

      const result = await teamRepository.getTeamsByTournament('tournament-123')

      expect(result).toEqual([])
    })
  })
}) 