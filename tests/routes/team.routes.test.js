import { describe, it, expect, beforeEach, jest } from '@jest/globals'
import request from 'supertest'

// Mock simple du client Prisma
const mockCreate = jest.fn()
const mockFindUnique = jest.fn()
const mockFindMany = jest.fn()
const mockUpdate = jest.fn()
const mockDelete = jest.fn()
const mockCount = jest.fn()
const mockMemberCreate = jest.fn()
const mockMemberFindMany = jest.fn()
const mockMemberDelete = jest.fn()

// Variables pour stocker les données mock
let mockTeams = []
let mockMembers = []
const generateId = () => `test-id-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

// Mock du module prisma
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

// Import après le mock
const app = (await import('../../index.js')).default

describe('Team Routes', () => {
  
  beforeEach(() => {
    // Reset des données mock
    mockTeams = []
    mockMembers = []
    
    // Configuration des mocks team
    mockCreate.mockImplementation(async ({ data, include }) => {
      const team = {
        id: generateId(),
        name: data.name,
        description: data.description || null,
        tournament_id: data.tournament_id,
        captain_id: data.captain_id,
        contact_email: data.contact_email || null,
        contact_phone: data.contact_phone || null,
        status: data.status || 'registered',
        skill_level: data.skill_level || 'amateur',
        notes: data.notes || null,
        created_at: new Date(),
        updated_at: new Date()
      }

      // Ajouter le capitaine comme membre si demandé
      if (data.team_member?.create) {
        const member = {
          id: generateId(),
          team_id: team.id,
          user_id: data.team_member.create.user_id,
          role: data.team_member.create.role,
          position: data.team_member.create.position || null,
          status: data.team_member.create.status || 'active',
          joined_at: new Date(),
          profile: {
            id: data.team_member.create.user_id,
            display_name: 'Test Captain',
            first_name: 'John',
            last_name: 'Doe',
            email: 'captain@test.com'
          }
        }
        mockMembers.push(member)
        
        if (include?.team_member) {
          team.team_member = [member]
        }
      }

      mockTeams.push(team)
      return team
    })

    mockFindUnique.mockImplementation(async ({ where, include }) => {
      const team = mockTeams.find(t => t.id === where.id)
      if (!team) return null

      const result = { ...team }
      
      if (include?.team_member) {
        result.team_member = mockMembers
          .filter(m => m.team_id === team.id)
          .map(m => ({
            ...m,
            profile: m.profile
          }))
      }
      
      if (include?.tournament) {
        result.tournament = {
          id: team.tournament_id,
          name: 'Mock Tournament',
          status: 'upcoming',
          start_date: new Date('2024-06-01')
        }
      }

      return result
    })

    mockFindMany.mockImplementation(async ({ where, skip = 0, take, include, orderBy }) => {
      let filtered = [...mockTeams]
      
      if (where?.name?.contains) {
        filtered = filtered.filter(t => 
          t.name.toLowerCase().includes(where.name.contains.toLowerCase())
        )
      }
      
      if (where?.tournament_id) {
        filtered = filtered.filter(t => t.tournament_id === where.tournament_id)
      }
      
      if (where?.status) {
        filtered = filtered.filter(t => t.status === where.status)
      }

      if (where?.skill_level) {
        filtered = filtered.filter(t => t.skill_level === where.skill_level)
      }

      // Pagination
      const sliced = filtered.slice(skip, take ? skip + take : undefined)
      
      return sliced.map(team => {
        const result = { ...team }
        
        if (include?.team_member) {
          result.team_member = mockMembers
            .filter(m => m.team_id === team.id)
            .map(m => ({
              ...m,
              profile: m.profile
            }))
        }
        
        if (include?.tournament) {
          result.tournament = {
            id: team.tournament_id,
            name: 'Mock Tournament',
            status: 'upcoming'
          }
        }
        
        if (include?._count) {
          result._count = {
            team_member: mockMembers.filter(m => m.team_id === team.id).length
          }
        }
        
        return result
      })
    })

    mockCount.mockImplementation(async ({ where }) => {
      let filtered = [...mockTeams]
      
      if (where?.name?.contains) {
        filtered = filtered.filter(t => 
          t.name.toLowerCase().includes(where.name.contains.toLowerCase())
        )
      }
      
      if (where?.tournament_id) {
        filtered = filtered.filter(t => t.tournament_id === where.tournament_id)
      }
      
      return filtered.length
    })

    mockUpdate.mockImplementation(async ({ where, data, include }) => {
      const teamIndex = mockTeams.findIndex(t => t.id === where.id)
      if (teamIndex === -1) {
        throw new Error('Team not found')
      }

      const updatedTeam = {
        ...mockTeams[teamIndex],
        ...data,
        updated_at: new Date()
      }
      
      mockTeams[teamIndex] = updatedTeam
      
      if (include?.team_member) {
        updatedTeam.team_member = mockMembers
          .filter(m => m.team_id === updatedTeam.id)
          .map(m => ({
            ...m,
            profile: m.profile
          }))
      }
      
      return updatedTeam
    })

    mockDelete.mockImplementation(async ({ where }) => {
      const teamIndex = mockTeams.findIndex(t => t.id === where.id)
      if (teamIndex === -1) {
        throw new Error('Team not found')
      }

      const deletedTeam = mockTeams[teamIndex]
      mockTeams.splice(teamIndex, 1)
      
      // Supprimer aussi les membres de l'équipe
      mockMembers = mockMembers.filter(m => m.team_id !== where.id)
      
      return deletedTeam
    })

    // Configuration des mocks team_member
    mockMemberCreate.mockImplementation(async ({ data, include }) => {
      const member = {
        id: generateId(),
        team_id: data.team_id,
        user_id: data.user_id,
        role: data.role,
        position: data.position || null,
        status: data.status || 'active',
        joined_at: new Date(),
        profile: {
          id: data.user_id,
          display_name: 'Test Player',
          first_name: 'Jane',
          last_name: 'Smith',
          email: 'player@test.com',
          avatar_url: null
        }
      }

      if (include?.team) {
        const team = mockTeams.find(t => t.id === data.team_id)
        member.team = team ? {
          id: team.id,
          name: team.name,
          tournament_id: team.tournament_id
        } : null
      }

      mockMembers.push(member)
      return member
    })

    mockMemberFindMany.mockImplementation(async ({ where, include, orderBy }) => {
      let filtered = mockMembers.filter(m => m.team_id === where.team_id)
      
      return filtered.map(member => ({
        ...member,
        profile: member.profile
      }))
    })

    mockMemberDelete.mockImplementation(async ({ where }) => {
      const memberIndex = mockMembers.findIndex(m => 
        m.team_id === where.team_id_user_id.team_id && 
        m.user_id === where.team_id_user_id.user_id
      )
      
      if (memberIndex === -1) {
        throw new Error('Member not found')
      }

      const deletedMember = mockMembers[memberIndex]
      mockMembers.splice(memberIndex, 1)
      return deletedMember
    })
  })
  
  describe('POST /api/teams', () => {
    it('devrait créer une nouvelle équipe', async () => {
      const teamData = {
        "name": "Les Tigres",
        "description": "Équipe de volleyball compétitive",
        "tournament_id": "f44a4d64-b36b-4dcb-93d9-f90d5e1fae69",
        "captain_id": "217f250c-cb7b-4950-8f07-c41606e9e706",
        "contact_email": "ami95190@gmail.com",
        "contact_phone": "+33123456789",
        "skill_level": "amateur",
        "notes": "Équipe expérimentée avec de bons résultats",
        "captain_position": "passeur"
      }

      const response = await request(app)
        .post('/api/teams')
        .send(teamData)
        .expect(201)

      expect(response.body.success).toBe(true)
      expect(response.body.message).toBe('Équipe créée avec succès')
      expect(response.body.data).toHaveProperty('id')
      expect(response.body.data.name).toBe('Les Tigres')
    })

    it('devrait retourner une erreur si captain_id manque', async () => {
      const teamData = {
        "name": "Les Tigres",
        "tournament_id": "f44a4d64-b36b-4dcb-93d9-f90d5e1fae69"
      }

      const response = await request(app)
        .post('/api/teams')
        .send(teamData)
        .expect(400)

      expect(response.body.success).toBe(false)
      expect(response.body.message).toBe('L\'ID du capitaine est requis')
    })

    it('devrait retourner une erreur si tournament_id manque', async () => {
      const teamData = {
        "name": "Les Tigres",
        "captain_id": "217f250c-cb7b-4950-8f07-c41606e9e706"
      }

      const response = await request(app)
        .post('/api/teams')
        .send(teamData)
        .expect(400)

      expect(response.body.success).toBe(false)
      expect(response.body.message).toBe('L\'ID du tournoi est requis')
    })
  })

  describe('GET /api/teams', () => {
    it('devrait lister toutes les équipes', async () => {
      const response = await request(app)
        .get('/api/teams')
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data).toBeInstanceOf(Array)
      expect(response.body.pagination).toHaveProperty('page')
      expect(response.body.pagination).toHaveProperty('total')
    })

    it('devrait filtrer les équipes par tournament_id', async () => {
      const response = await request(app)
        .get('/api/teams?tournament_id=f44a4d64-b36b-4dcb-93d9-f90d5e1fae69')
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data).toBeInstanceOf(Array)
    })

    it('devrait paginer les résultats', async () => {
      const response = await request(app)
        .get('/api/teams?page=1&limit=5')
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.pagination.page).toBe(1)
      expect(response.body.pagination.limit).toBe(5)
    })
  })

  describe('GET /api/teams/tournament/:tournamentId', () => {
    it('devrait récupérer les équipes d\'un tournoi', async () => {
      const tournamentId = 'f44a4d64-b36b-4dcb-93d9-f90d5e1fae69'
      
      const response = await request(app)
        .get(`/api/teams/tournament/${tournamentId}`)
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data).toBeInstanceOf(Array)
    })

    it('devrait retourner une erreur si tournamentId manque', async () => {
      const response = await request(app)
        .get('/api/teams/tournament/')
        .expect(404)
    })
  })

  describe('GET /api/teams/:teamId', () => {
    it('devrait récupérer une équipe par ID', async () => {
      // Créer une équipe d'abord
      const teamData = {
        "name": "Test Team",
        "tournament_id": "f44a4d64-b36b-4dcb-93d9-f90d5e1fae69",
        "captain_id": "217f250c-cb7b-4950-8f07-c41606e9e706"
      }

      const createResponse = await request(app)
        .post('/api/teams')
        .send(teamData)

      expect(createResponse.status).toBe(201)
      const teamId = createResponse.body.data.id

      const response = await request(app)
        .get(`/api/teams/${teamId}`)
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data.id).toBe(teamId)
      expect(response.body.data.name).toBe('Test Team')
    })

    it('devrait retourner 404 pour une équipe inexistante', async () => {
      const fakeId = 'fake-id-123'
      
      const response = await request(app)
        .get(`/api/teams/${fakeId}`)
        .expect(404)

      expect(response.body.success).toBe(false)
      expect(response.body.message).toBe('Équipe non trouvée')
    })
  })

  describe('PATCH /api/teams/:teamId', () => {
    it('devrait mettre à jour une équipe', async () => {
      // Créer une équipe d'abord
      const teamData = {
        "name": "Test Team Update",
        "tournament_id": "f44a4d64-b36b-4dcb-93d9-f90d5e1fae69",
        "captain_id": "217f250c-cb7b-4950-8f07-c41606e9e706"
      }

      const createResponse = await request(app)
        .post('/api/teams')
        .send(teamData)

      expect(createResponse.status).toBe(201)
      const teamId = createResponse.body.data.id

      const updateData = {
        "name": "Nouveau nom équipe",
        "description": "Nouvelle description",
        "skill_level": "confirme"
      }

      const response = await request(app)
        .patch(`/api/teams/${teamId}`)
        .send(updateData)
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data.name).toBe('Nouveau nom équipe')
      expect(response.body.data.description).toBe('Nouvelle description')
    })

    it('devrait retourner 404 pour une équipe inexistante', async () => {
      const fakeId = 'fake-id-123'
      const updateData = { "name": "Nouveau nom" }
      
      const response = await request(app)
        .patch(`/api/teams/${fakeId}`)
        .send(updateData)
        .expect(404)

      expect(response.body.success).toBe(false)
    })
  })

  describe('DELETE /api/teams/:teamId', () => {
    it('devrait supprimer une équipe', async () => {
      // Créer une équipe d'abord
      const teamData = {
        "name": "Test Team Delete",
        "tournament_id": "f44a4d64-b36b-4dcb-93d9-f90d5e1fae69",
        "captain_id": "217f250c-cb7b-4950-8f07-c41606e9e706"
      }

      const createResponse = await request(app)
        .post('/api/teams')
        .send(teamData)

      expect(createResponse.status).toBe(201)
      const teamId = createResponse.body.data.id

      const response = await request(app)
        .delete(`/api/teams/${teamId}`)
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.message).toBe('Équipe supprimée avec succès')
    })

    it('devrait retourner 404 pour une équipe inexistante', async () => {
      const fakeId = 'fake-id-123'
      
      const response = await request(app)
        .delete(`/api/teams/${fakeId}`)
        .expect(404)

      expect(response.body.success).toBe(false)
    })
  })

  describe('GET /api/teams/:teamId/members', () => {
    it('devrait récupérer les membres d\'une équipe', async () => {
      // Créer une équipe d'abord
      const teamData = {
        "name": "Test Team Members",
        "tournament_id": "f44a4d64-b36b-4dcb-93d9-f90d5e1fae69",
        "captain_id": "217f250c-cb7b-4950-8f07-c41606e9e706"
      }

      const createResponse = await request(app)
        .post('/api/teams')
        .send(teamData)

      expect(createResponse.status).toBe(201)
      const teamId = createResponse.body.data.id

      const response = await request(app)
        .get(`/api/teams/${teamId}/members`)
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data).toBeInstanceOf(Array)
      // Devrait contenir au moins le capitaine
      expect(response.body.data.length).toBeGreaterThanOrEqual(1)
    })
  })

  describe('POST /api/teams/:teamId/members', () => {
    it('devrait ajouter un membre à une équipe', async () => {
      // Créer une équipe d'abord
      const teamData = {
        "name": "Test Team Add Member",
        "tournament_id": "f44a4d64-b36b-4dcb-93d9-f90d5e1fae69",
        "captain_id": "217f250c-cb7b-4950-8f07-c41606e9e706"
      }

      const createResponse = await request(app)
        .post('/api/teams')
        .send(teamData)

      expect(createResponse.status).toBe(201)
      const teamId = createResponse.body.data.id

      const memberData = {
        "player_id": "another-player-id-123",
        "role": "player",
        "position": "attaquant"
      }

      const response = await request(app)
        .post(`/api/teams/${teamId}/members`)
        .send(memberData)
        .expect(201)

      expect(response.body.success).toBe(true)
      expect(response.body.message).toBe('Membre ajouté avec succès')
      expect(response.body.data.role).toBe('player')
    })

    it('devrait retourner une erreur si player_id manque', async () => {
      const teamId = 'some-team-id'
      const memberData = {
        "role": "player"
      }

      const response = await request(app)
        .post(`/api/teams/${teamId}/members`)
        .send(memberData)
        .expect(400)

      expect(response.body.success).toBe(false)
      expect(response.body.message).toBe('L\'ID du joueur est requis')
    })

    it('devrait retourner une erreur pour un rôle invalide', async () => {
      const teamId = 'some-team-id'
      const memberData = {
        "player_id": "player-id-123",
        "role": "invalid-role"
      }

      const response = await request(app)
        .post(`/api/teams/${teamId}/members`)
        .send(memberData)
        .expect(400)

      expect(response.body.success).toBe(false)
      expect(response.body.message).toContain('Rôle invalide')
    })
  })

  describe('DELETE /api/teams/:teamId/members/:playerId', () => {
    it('devrait retirer un membre d\'une équipe', async () => {
      // Créer une équipe d'abord
      const teamData = {
        "name": "Test Team Remove Member",
        "tournament_id": "f44a4d64-b36b-4dcb-93d9-f90d5e1fae69",
        "captain_id": "217f250c-cb7b-4950-8f07-c41606e9e706"
      }

      const createResponse = await request(app)
        .post('/api/teams')
        .send(teamData)

      expect(createResponse.status).toBe(201)
      const teamId = createResponse.body.data.id

      // Ajouter un membre d'abord
      const memberData = {
        "player_id": "player-to-remove-123",
        "role": "player"
      }

      await request(app)
        .post(`/api/teams/${teamId}/members`)
        .send(memberData)

      // Puis le retirer
      const response = await request(app)
        .delete(`/api/teams/${teamId}/members/player-to-remove-123`)
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.message).toBe('Membre retiré avec succès')
    })

    it('devrait retourner 404 pour un membre inexistant', async () => {
      const teamId = 'some-team-id'
      const playerId = 'non-existent-player'
      
      const response = await request(app)
        .delete(`/api/teams/${teamId}/members/${playerId}`)
        .expect(404)

      expect(response.body.success).toBe(false)
      expect(response.body.message).toBe('Membre non trouvé dans cette équipe')
    })
  })

  describe('GET /health', () => {
    it('devrait retourner le statut de santé du service', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.message).toBe('Team Service is running')
      expect(response.body).toHaveProperty('timestamp')
    })
  })

  describe('GET /', () => {
    it('devrait retourner les informations du service', async () => {
      const response = await request(app)
        .get('/')
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.message).toBe('Bienvenue sur le Team Service API')
      expect(response.body.endpoints).toHaveProperty('teams')
    })
  })
}) 