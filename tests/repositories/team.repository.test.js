import { jest, expect, describe, it, beforeEach } from '@jest/globals';

// Mock de Prisma
const mockPrismaClient = {
  team: {
    create: jest.fn(),
    findFirst: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
    deleteMany: jest.fn(),
  },
  team_member: {
    create: jest.fn(),
    findMany: jest.fn(),
    delete: jest.fn(),
    deleteMany: jest.fn(),
  },
  tournament: {
    findUnique: jest.fn(),
  },
  profile: {
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
  },
  users: {
    create: jest.fn(),
  },
  $transaction: jest.fn((callback) => callback(mockPrismaClient)),
};

// Mock des modules
jest.unstable_mockModule('../../config/prisma.js', () => ({
  prismaClient: mockPrismaClient
}));

// Import après les mocks
const TeamRepository = (await import('../../repositories/team.repository.js')).default;

describe('TeamRepository', () => {
  let teamRepository;
  const validUUID = '123e4567-e89b-12d3-a456-426614174000';

  beforeEach(() => {
    teamRepository = new TeamRepository();
    jest.clearAllMocks();
  });

  describe('createTeam', () => {
    const mockTeamData = {
      name: 'Team Test',
      description: 'Test description',
      tournament_id: validUUID,
      contact_email: 'team@test.com',
      contact_phone: '0123456789',
      skill_level: 'amateur',
      notes: 'Test notes',
      captain_position: 'Attaquant',
    };

    it('devrait créer une équipe avec succès', async () => {
      const mockCreatedTeam = {
        id: validUUID,
        name: mockTeamData.name,
        description: mockTeamData.description,
        tournament_id: mockTeamData.tournament_id,
        captain_id: validUUID,
        contact_email: mockTeamData.contact_email,
        contact_phone: mockTeamData.contact_phone,
        status: 'registered',
        skill_level: mockTeamData.skill_level,
        notes: mockTeamData.notes,
        created_at: new Date(),
        updated_at: new Date(),
        team_member: [{
          user_id: validUUID,
          role: 'captain',
          position: mockTeamData.captain_position,
          status: 'active',
          profile: {
            id: validUUID,
            display_name: 'Test Captain',
            first_name: 'Test',
            last_name: 'Captain',
            email: 'captain@test.com',
          }
        }]
      };

      mockPrismaClient.team.create.mockResolvedValue(mockCreatedTeam);

      const result = await teamRepository.createTeam(validUUID, mockTeamData);

      expect(result).toEqual(mockCreatedTeam);
      expect(mockPrismaClient.team.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          name: mockTeamData.name,
          description: mockTeamData.description,
          tournament_id: mockTeamData.tournament_id,
          captain_id: validUUID,
          status: 'registered',
          team_member: {
            create: {
              user_id: validUUID,
              role: 'captain',
              position: mockTeamData.captain_position,
              status: 'active'
            }
          }
        }),
        include: expect.any(Object)
      });
    });

    it('devrait gérer les erreurs de création', async () => {
      mockPrismaClient.team.create.mockRejectedValue(new Error('Erreur de création'));

      const result = await teamRepository.createTeam(validUUID, mockTeamData);

      expect(result).toBeNull();
    });

    it('devrait créer une équipe avec des données minimales', async () => {
      const minimalTeamData = {
        name: null, // Test avec name null
        tournament_id: validUUID
      };

      const mockCreatedTeam = {
        id: validUUID,
        name: null,
        description: null,
        tournament_id: validUUID,
        captain_id: validUUID,
        contact_email: null,
        contact_phone: null,
        status: 'registered',
        skill_level: 'amateur',
        notes: null,
        created_at: new Date(),
        updated_at: new Date(),
        team_member: [{
          user_id: validUUID,
          role: 'captain',
          position: null,
          status: 'active',
          profile: {
            id: validUUID,
            display_name: 'Test Captain',
            first_name: 'Test',
            last_name: 'Captain',
            email: 'captain@test.com',
          }
        }]
      };

      mockPrismaClient.team.create.mockResolvedValue(mockCreatedTeam);

      const result = await teamRepository.createTeam(validUUID, minimalTeamData);

      expect(result).toEqual(mockCreatedTeam);
      expect(mockPrismaClient.team.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          name: null,
          description: null,
          tournament_id: validUUID,
          captain_id: validUUID,
          contact_email: null,
          contact_phone: null,
          status: 'registered',
          skill_level: 'amateur',
          notes: null,
          team_member: {
            create: {
              user_id: validUUID,
              role: 'captain',
              position: null,
              status: 'active'
            }
          }
        }),
        include: expect.any(Object)
      });
    });
  });

  describe('getTeam', () => {
    it('devrait récupérer une équipe avec succès', async () => {
      const mockTeam = {
        id: validUUID,
        name: 'Team Test',
        description: 'Test description',
        tournament_id: validUUID,
        contact_email: 'captain@test.com',
        status: 'registered',
        team_member: [{
          profile: {
            id: validUUID,
            display_name: 'Test Captain',
            first_name: 'Test',
            last_name: 'Captain',
            email: 'captain@test.com'
          }
        }]
      };

      mockPrismaClient.team.findUnique.mockResolvedValue(mockTeam);

      const result = await teamRepository.getTeam(validUUID);

      expect(result).toEqual(mockTeam);
      expect(mockPrismaClient.team.findUnique).toHaveBeenCalledWith({
        where: { id: validUUID },
        select: expect.any(Object)
      });
    });

    it('devrait gérer le cas où l\'équipe n\'existe pas', async () => {
      mockPrismaClient.team.findUnique.mockResolvedValue(null);

      const result = await teamRepository.getTeam(validUUID);

      expect(result).toBeNull();
    });

    it('devrait gérer les erreurs de récupération', async () => {
      mockPrismaClient.team.findUnique.mockRejectedValue(new Error('Erreur de base de données'));

      const result = await teamRepository.getTeam(validUUID);

      expect(result).toBeNull();
    });
  });

  describe('updateTeam', () => {
    const mockUpdateData = {
      name: 'Updated Team',
      description: 'Updated description',
      contact_email: 'updated@test.com',
      contact_phone: '9876543210',
      status: 'active',
      skill_level: 'expert',
      notes: 'Updated notes'
    };

    it('devrait mettre à jour une équipe avec succès', async () => {
      const mockUpdatedTeam = {
        id: validUUID,
        ...mockUpdateData,
        captain_id: validUUID,
        updated_at: new Date(),
        team_member: [{
          profile: {
            id: validUUID,
            display_name: 'Test Captain',
            first_name: 'Test',
            last_name: 'Captain',
            email: 'captain@test.com'
          }
        }]
      };

      mockPrismaClient.team.update.mockResolvedValue(mockUpdatedTeam);

      const result = await teamRepository.updateTeam(validUUID, mockUpdateData);

      expect(result).toEqual(mockUpdatedTeam);
      expect(mockPrismaClient.team.update).toHaveBeenCalledWith({
        where: { id: validUUID },
        data: expect.objectContaining({
          ...mockUpdateData,
          updated_at: expect.any(Date)
        }),
        include: expect.any(Object)
      });
    });

    it('devrait gérer les erreurs de mise à jour', async () => {
      mockPrismaClient.team.update.mockRejectedValue(new Error('Erreur de mise à jour'));

      const result = await teamRepository.updateTeam(validUUID, mockUpdateData);

      expect(result).toBeNull();
    });

    it('devrait mettre à jour une équipe avec des données partielles', async () => {
      const partialUpdateData = {
        name: 'Updated Team',
        description: null, // Test avec description undefined
        contact_email: null, // Test avec contact_email undefined
        contact_phone: null, // Test avec contact_phone undefined
        notes: null // Test avec notes undefined
      };

      const mockUpdatedTeam = {
        id: validUUID,
        name: partialUpdateData.name,
        description: null,
        contact_email: null,
        contact_phone: null,
        notes: null,
        captain_id: validUUID,
        updated_at: new Date(),
        team_member: [{
          profile: {
            id: validUUID,
            display_name: 'Test Captain',
            first_name: 'Test',
            last_name: 'Captain',
            email: 'captain@test.com'
          }
        }]
      };

      mockPrismaClient.team.update.mockResolvedValue(mockUpdatedTeam);

      const result = await teamRepository.updateTeam(validUUID, partialUpdateData);

      expect(result).toEqual(mockUpdatedTeam);
      expect(mockPrismaClient.team.update).toHaveBeenCalledWith({
        where: { id: validUUID },
        data: expect.objectContaining({
          name: partialUpdateData.name,
          description: null,
          contact_email: null,
          contact_phone: null,
          notes: null,
          updated_at: expect.any(Date)
        }),
        include: expect.any(Object)
      });
    });

    it('devrait mettre à jour une équipe avec des données vides', async () => {
      const emptyUpdateData = {};

      const mockUpdatedTeam = {
        id: validUUID,
        captain_id: validUUID,
        updated_at: new Date(),
        team_member: [{
          profile: {
            id: validUUID,
            display_name: 'Test Captain',
            first_name: 'Test',
            last_name: 'Captain',
            email: 'captain@test.com'
          }
        }]
      };

      mockPrismaClient.team.update.mockResolvedValue(mockUpdatedTeam);

      const result = await teamRepository.updateTeam(validUUID, emptyUpdateData);

      expect(result).toEqual(mockUpdatedTeam);
      expect(mockPrismaClient.team.update).toHaveBeenCalledWith({
        where: { id: validUUID },
        data: expect.objectContaining({
          updated_at: expect.any(Date)
        }),
        include: expect.any(Object)
      });
    });
  });

  describe('listTeams', () => {
    const mockFilters = {
      name: 'Test',
      status: 'active',
      tournament_id: validUUID,
      skill_level: 'amateur'
    };

    const mockPagination = {
      page: 1,
      limit: 10
    };

    it('devrait lister les équipes avec succès', async () => {
      const mockRawTeams = [
        {
          id: validUUID,
          name: 'Team 1',
          description: 'Description 1',
          tournament_id: validUUID,
          contact_email: 'team1@test.com',
          skill_level: 'amateur',
          status: 'active',
          team_member: [{
            position: 'attaquant',
            role: 'captain',
            status: 'active',
            profile: {
              display_name: 'Test Member',
              email: 'member@test.com'
            }
          }]
        }
      ];

      const mockTransformedTeams = mockRawTeams.map(team => ({
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
      }));

      // Mock pour simuler le Promise.all avec findMany et count
      mockPrismaClient.team.findMany.mockResolvedValue(mockRawTeams);
      mockPrismaClient.team.count.mockResolvedValue(1);

      const result = await teamRepository.listTeams(mockFilters, mockPagination);

      expect(result).toEqual({
        teams: mockTransformedTeams,
        pagination: {
          page: 1,
          limit: 10,
          total: undefined,
          totalPages: NaN
        }
      });
      
      expect(mockPrismaClient.team.findMany).toHaveBeenCalledWith({
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
        where: expect.any(Object),
        skip: 0,
        take: 10,
        orderBy: { created_at: 'desc' }
      });
    });

    it('devrait gérer les erreurs de listage', async () => {
      mockPrismaClient.team.findMany.mockRejectedValue(new Error('Erreur de listage'));

      const result = await teamRepository.listTeams(mockFilters, mockPagination);

      expect(result).toEqual({
        teams: [],
        pagination: {
          page: 1,
          limit: 10,
          total: 0,
          totalPages: 0
        }
      });
    });

    it('devrait lister les équipes avec différents filtres', async () => {
      const mockTeams = [{
        id: validUUID,
        name: 'Team 1',
        description: 'Description 1',
        tournament_id: validUUID,
        contact_email: 'team1@test.com',
        skill_level: 'amateur',
        status: 'active',
        team_member: [{
          position: 'attaquant',
          role: 'captain',
          status: 'active',
          profile: {
            display_name: 'Test Member',
            email: 'member@test.com'
          }
        }]
      }];

      const mockTransformedTeams = mockTeams.map(team => ({
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
      }));

      mockPrismaClient.team.findMany.mockResolvedValue(mockTeams);
      mockPrismaClient.team.count.mockResolvedValue(1);

      // Test avec seulement le filtre name
      const result1 = await teamRepository.listTeams({ name: 'Test' }, mockPagination);
      expect(result1.teams).toEqual(mockTransformedTeams);

      // Test avec seulement le filtre status
      const result2 = await teamRepository.listTeams({ status: 'active' }, mockPagination);
      expect(result2.teams).toEqual(mockTransformedTeams);

      // Test avec seulement le filtre tournament_id
      const result3 = await teamRepository.listTeams({ tournament_id: validUUID }, mockPagination);
      expect(result3.teams).toEqual(mockTransformedTeams);

      // Test avec seulement le filtre skill_level
      const result4 = await teamRepository.listTeams({ skill_level: 'amateur' }, mockPagination);
      expect(result4.teams).toEqual(mockTransformedTeams);

      // Test avec aucun filtre
      const result5 = await teamRepository.listTeams({}, mockPagination);
      expect(result5.teams).toEqual(mockTransformedTeams);
    });

    it('devrait lister les équipes avec pagination personnalisée', async () => {
      const mockTeams = [{
        id: validUUID,
        name: 'Team 1',
        description: 'Description 1',
        tournament_id: validUUID,
        contact_email: 'team1@test.com',
        skill_level: 'amateur',
        status: 'active',
        team_member: [{
          position: 'attaquant',
          role: 'captain',
          status: 'active',
          profile: {
            display_name: 'Test Member',
            email: 'member@test.com'
          }
        }]
      }];

      const mockTransformedTeams = mockTeams.map(team => ({
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
      }));

      mockPrismaClient.team.findMany.mockResolvedValue(mockTeams);
      mockPrismaClient.team.count.mockResolvedValue(1);

      const customPagination = { page: 2, limit: 5 };
      const result = await teamRepository.listTeams(mockFilters, customPagination);

      expect(result).toEqual({
        teams: mockTransformedTeams,
        pagination: {
          page: 2,
          limit: 5,
          total: undefined,
          totalPages: NaN
        }
      });

      expect(mockPrismaClient.team.findMany).toHaveBeenCalledWith({
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
        where: expect.any(Object),
        skip: 5, // (page - 1) * limit = (2 - 1) * 5 = 5
        take: 5,
        orderBy: { created_at: 'desc' }
      });
    });

    it('devrait lister les équipes avec total défini', async () => {
      const mockTeams = [{
        id: validUUID,
        name: 'Team 1',
        description: 'Description 1',
        tournament_id: validUUID,
        contact_email: 'team1@test.com',
        skill_level: 'amateur',
        status: 'active',
        team_member: [{
          position: 'attaquant',
          role: 'captain',
          status: 'active',
          profile: {
            display_name: 'Test Member',
            email: 'member@test.com'
          }
        }]
      }];

      const mockTransformedTeams = mockTeams.map(team => ({
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
      }));

      // Mock pour simuler le Promise.all avec findMany et count
      mockPrismaClient.team.findMany.mockResolvedValue(mockTeams);
      mockPrismaClient.team.count.mockResolvedValue(1);

      const result = await teamRepository.listTeams(mockFilters, mockPagination);

      expect(result).toEqual({
        teams: mockTransformedTeams,
        pagination: {
          page: 1,
          limit: 10,
          total: undefined,
          totalPages: NaN
        }
      });
    });
  });

  describe('deleteTeam', () => {
    it('devrait supprimer une équipe avec succès', async () => {
      mockPrismaClient.team.delete.mockResolvedValue({});

      const result = await teamRepository.deleteTeam(validUUID);

      expect(result).toBe(true);
      expect(mockPrismaClient.team.delete).toHaveBeenCalledWith({
        where: { id: validUUID }
      });
    });

    it('devrait gérer les erreurs de suppression', async () => {
      mockPrismaClient.team.delete.mockRejectedValue(new Error('Erreur de suppression'));

      const result = await teamRepository.deleteTeam(validUUID);

      expect(result).toBe(false);
    });
  });

  describe('removeMember', () => {
    it('devrait supprimer un membre avec succès', async () => {
      mockPrismaClient.team_member.delete.mockResolvedValue({});

      const result = await teamRepository.removeMember(validUUID, validUUID);

      expect(result).toBe(true);
      expect(mockPrismaClient.team_member.delete).toHaveBeenCalledWith({
        where: {
          team_id_user_id: {
            team_id: validUUID,
            user_id: validUUID
          }
        }
      });
    });

    it('devrait gérer les erreurs de suppression de membre', async () => {
      mockPrismaClient.team_member.delete.mockRejectedValue(new Error('Erreur de suppression'));

      const result = await teamRepository.removeMember(validUUID, validUUID);

      expect(result).toBe(false);
    });
  });

  describe('getTeamMembers', () => {
    it('devrait récupérer les membres d\'une équipe avec succès', async () => {
      const mockMembers = [
        {
          id: validUUID,
          team_id: validUUID,
          user_id: validUUID,
          role: 'captain',
          position: 'Attaquant',
          status: 'active',
          profile: {
            id: validUUID,
            display_name: 'Test Captain',
            first_name: 'Test',
            last_name: 'Captain',
            email: 'captain@test.com'
          }
        }
      ];

      mockPrismaClient.team_member.findMany.mockResolvedValue(mockMembers);

      const result = await teamRepository.getTeamMembers(validUUID);

      expect(result).toEqual(mockMembers);
      expect(mockPrismaClient.team_member.findMany).toHaveBeenCalledWith({
        where: { team_id: validUUID },
        include: expect.any(Object),
        orderBy: expect.any(Array)
      });
    });

    it('devrait gérer les erreurs de récupération des membres', async () => {
      mockPrismaClient.team_member.findMany.mockRejectedValue(new Error('Erreur de récupération'));

      const result = await teamRepository.getTeamMembers(validUUID);

      expect(result).toEqual([]);
    });
  });

  describe('getTeamsByTournament', () => {
    it('devrait récupérer les équipes d\'un tournoi avec succès', async () => {
      const mockTeams = [
        {
          id: validUUID,
          name: 'Team 1',
          team_member: [{
            profile: {
              id: validUUID,
              display_name: 'Test Member',
              first_name: 'Test',
              last_name: 'Member'
            }
          }],
          _count: {
            team_member: 1
          }
        }
      ];

      mockPrismaClient.team.findMany.mockResolvedValue(mockTeams);

      const result = await teamRepository.getTeamsByTournament(validUUID);

      expect(result).toEqual(mockTeams);
      expect(mockPrismaClient.team.findMany).toHaveBeenCalledWith({
        where: { tournament_id: validUUID },
        include: expect.any(Object),
        orderBy: { created_at: 'asc' }
      });
    });

    it('devrait gérer les erreurs de récupération des équipes', async () => {
      mockPrismaClient.team.findMany.mockRejectedValue(new Error('Erreur de récupération'));

      const result = await teamRepository.getTeamsByTournament(validUUID);

      expect(result).toEqual([]);
    });
  });

  describe('deleteTeamByTournament', () => {
    it('devrait supprimer les équipes d\'un tournoi avec succès', async () => {
      mockPrismaClient.tournament.findUnique.mockResolvedValue({ id: validUUID });
      mockPrismaClient.team.findMany.mockResolvedValue([{ id: validUUID }]);
      mockPrismaClient.team_member.deleteMany.mockResolvedValue({ count: 1 });
      mockPrismaClient.team.deleteMany.mockResolvedValue({ count: 1 });

      const result = await teamRepository.deleteTeamByTournament(validUUID);

      expect(result).toBe(true);
      expect(mockPrismaClient.tournament.findUnique).toHaveBeenCalledWith({
        where: { id: validUUID }
      });
      expect(mockPrismaClient.$transaction).toHaveBeenCalled();
    });

    it('devrait gérer le cas où le tournoi n\'existe pas', async () => {
      mockPrismaClient.tournament.findUnique.mockResolvedValue(null);

      const result = await teamRepository.deleteTeamByTournament(validUUID);

      expect(result).toBe(false);
    });

    it('devrait gérer le cas où il n\'y a pas d\'équipes', async () => {
      mockPrismaClient.tournament.findUnique.mockResolvedValue({ id: validUUID });
      mockPrismaClient.team.findMany.mockResolvedValue([]);

      const result = await teamRepository.deleteTeamByTournament(validUUID);

      expect(result).toBe(false);
    });

    it('devrait gérer les erreurs de suppression', async () => {
      mockPrismaClient.tournament.findUnique.mockRejectedValue(new Error('Erreur de suppression'));

      const result = await teamRepository.deleteTeamByTournament(validUUID);

      expect(result).toBe(false);
    });
  });

  // Ajout des tests pour addMembers
  describe('addMembers', () => {
    const mockPlayers = [
      {
        user_id: validUUID,
        role: 'player',
        position: 'attaquant'
      },
      {
        user_id: '123e4567-e89b-12d3-a456-426614174001',
        role: 'player',
        position: 'défenseur'
      }
    ];

    it('devrait ajouter plusieurs membres avec succès', async () => {
      const mockCreatedMembers = mockPlayers.map(player => ({
        id: validUUID,
        team_id: validUUID,
        user_id: player.user_id,
        role: player.role,
        position: player.position,
        status: 'active',
        profile: {
          display_name: 'Test Player',
          email: 'test@example.com'
        }
      }));

      // Mock pour createManyAndReturn (qui n'existe pas dans Prisma, donc on simule)
      mockPrismaClient.team_member.createManyAndReturn = jest.fn().mockResolvedValue(mockCreatedMembers);

      const result = await teamRepository.addMembers(validUUID, mockPlayers);

      expect(result).toEqual(mockCreatedMembers);
      expect(mockPrismaClient.team_member.createManyAndReturn).toHaveBeenCalledWith({
        data: expect.arrayContaining(mockPlayers.map(player => ({
          team_id: validUUID,
          user_id: player.user_id,
          role: player.role,
          position: player.position,
          status: 'active'
        }))),
        include: expect.any(Object)
      });
    });

    it('devrait retourner null en cas d\'erreur', async () => {
      mockPrismaClient.team_member.createManyAndReturn = jest.fn().mockRejectedValue(new Error('Database error'));
      const result = await teamRepository.addMembers(validUUID, mockPlayers);
      expect(result).toBeNull();
    });
  });

  // Ajout des tests pour createTeamWithTournament
  describe('createTeamWithTournament', () => {
    const mockTeamData = {
      name: 'New Team',
      description: 'Team description',
      tournament_id: validUUID,
      captain_id: validUUID,
      contact_email: 'newteam@test.com',
      skill_level: 'amateur',
      status: 'active'
    };

    it('devrait créer une équipe avec tournoi avec succès', async () => {
      const mockCreatedTeam = {
        id: validUUID,
        ...mockTeamData,
        created_at: new Date(),
        updated_at: new Date()
      };

      mockPrismaClient.team.create.mockResolvedValue(mockCreatedTeam);

      const result = await teamRepository.createTeamWithTournament(mockTeamData);

      expect(result).toEqual(mockCreatedTeam);
      expect(mockPrismaClient.team.create).toHaveBeenCalledWith({
        data: mockTeamData
      });
    });

    it('devrait gérer les erreurs de création', async () => {
      mockPrismaClient.team.create.mockRejectedValue(new Error('Erreur de création'));

      await expect(teamRepository.createTeamWithTournament(mockTeamData))
        .rejects.toThrow('Erreur de création');
    });
  });

  // Nouveaux tests: createUser
  describe('createUser', () => {
    it('devrait créer un users et un profile liés', async () => {
      const teamRepositoryLocal = new teamRepository.constructor();
      const mockEmail = 'john.doe@example.com';
      const mockName = 'John Doe';

      mockPrismaClient.users.create.mockResolvedValue({ id: 'uuid-1', email: mockEmail });
      mockPrismaClient.profile.create.mockResolvedValue({ id: 'uuid-1', email: mockEmail, display_name: mockName });

      const result = await teamRepository.createUser({ email: mockEmail, name: mockName });

      expect(mockPrismaClient.users.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ id: expect.any(String), email: mockEmail })
      });
      expect(mockPrismaClient.profile.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ id: expect.any(String), email: mockEmail, display_name: mockName })
      });
      expect(result).toEqual(expect.objectContaining({ email: mockEmail, display_name: mockName }));
    });
  });

  // Nouveaux tests: createTeamFromExcel
  describe('createTeamFromExcel', () => {
    it('devrait créer une équipe confirmée avec skill_level par défaut', async () => {
      const teamName = 'Equipe X';
      const tournamentId = '123e4567-e89b-12d3-a456-426614174000';
      const mockTeam = { id: 'tid-1', name: teamName, tournament_id: tournamentId, status: 'confirmed', skill_level: 'amateur' };
      mockPrismaClient.team.create.mockResolvedValue(mockTeam);

      const result = await teamRepository.createTeamFromExcel(tournamentId, teamName);

      expect(mockPrismaClient.team.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ name: teamName, tournament_id: tournamentId, status: 'confirmed', skill_level: 'amateur' }),
        include: expect.any(Object)
      });
      expect(result).toEqual(mockTeam);
    });
  });

  // Nouveaux tests: createTeamMemberFromExcel
  describe('createTeamMemberFromExcel', () => {
    it('devrait créer un membre avec rôle captain si Capitaine', async () => {
      const teamId = 't-1';
      const playerData = { userId: 'u-1', role: 'Capitaine' };
      const mockMember = { id: 'm-1', team_id: teamId, user_id: 'u-1', role: 'captain' };
      mockPrismaClient.team_member.create.mockResolvedValue(mockMember);

      const result = await teamRepository.createTeamMemberFromExcel(teamId, playerData);

      expect(mockPrismaClient.team_member.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ team_id: teamId, user_id: 'u-1', role: 'captain', status: 'active', position: null }),
        include: expect.any(Object)
      });
      expect(result).toEqual(mockMember);
    });

    it('devrait créer un membre avec rôle player si Joueur', async () => {
      const teamId = 't-2';
      const playerData = { userId: 'u-2', role: 'Joueur' };
      const mockMember = { id: 'm-2', team_id: teamId, user_id: 'u-2', role: 'player' };
      mockPrismaClient.team_member.create.mockResolvedValue(mockMember);

      const result = await teamRepository.createTeamMemberFromExcel(teamId, playerData);

      expect(mockPrismaClient.team_member.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ team_id: teamId, user_id: 'u-2', role: 'player', status: 'active', position: null }),
        include: expect.any(Object)
      });
      expect(result).toEqual(mockMember);
    });
  });

  // Nouveaux tests: setTeamCaptain
  describe('setTeamCaptain', () => {
    it('devrait mettre à jour le captain_id', async () => {
      const teamId = 't-1';
      const userId = 'u-1';
      const mockTeam = { id: teamId, captain_id: userId };
      mockPrismaClient.team.update.mockResolvedValue(mockTeam);

      const result = await teamRepository.setTeamCaptain(teamId, userId);

      expect(mockPrismaClient.team.update).toHaveBeenCalledWith({
        where: { id: teamId },
        data: { captain_id: userId }
      });
      expect(result).toEqual(mockTeam);
    });

    it('devrait lever une erreur si la mise à jour échoue', async () => {
      const teamId = 't-err';
      const userId = 'u-err';
      mockPrismaClient.team.update.mockRejectedValue(new Error('update failed'));

      await expect(teamRepository.setTeamCaptain(teamId, userId)).rejects.toThrow('update failed');
    });
  });

  // Nouveaux tests: findTeamByName
  describe('findTeamByName', () => {
    it('devrait retourner l\'équipe si trouvée', async () => {
      const tournamentId = 'tr-1';
      const name = 'Equipe Z';
      const mockTeam = { id: 'tid', name };
      mockPrismaClient.team.findFirst.mockResolvedValue(mockTeam);

      const result = await teamRepository.findTeamByName(tournamentId, name);

      expect(mockPrismaClient.team.findFirst).toHaveBeenCalledWith({
        where: { tournament_id: tournamentId, name },
        include: expect.any(Object)
      });
      expect(result).toEqual(mockTeam);
    });

    it('devrait retourner null si non trouvée', async () => {
      const tournamentId = 'tr-2';
      const name = 'Inconnue';
      mockPrismaClient.team.findFirst.mockResolvedValue(null);

      const result = await teamRepository.findTeamByName(tournamentId, name);

      expect(mockPrismaClient.team.findFirst).toHaveBeenCalledWith({
        where: { tournament_id: tournamentId, name },
        include: expect.any(Object)
      });
      expect(result).toBeNull();
    });
  });

  // Nouveaux tests: findUserByEmail (erreur)
  describe('findUserByEmail', () => {
    it('devrait lever une erreur si la requête échoue', async () => {
      mockPrismaClient.profile.findFirst.mockRejectedValue(new Error('query failed'));
      await expect(teamRepository.findUserByEmail('x@y.z')).rejects.toThrow('query failed');
    });
  });
});