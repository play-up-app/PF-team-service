import XLSX from 'xlsx';
import logger from '../config/logger.js';

export default class ExcelService {
  constructor() {
    this.supportedFormats = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel'
    ];
  }

  // Valider le fichier Excel
  validateFile(file) {
    if (!file) {
      throw new Error('Aucun fichier fourni');
    }

    if (!this.supportedFormats.includes(file.mimetype)) {
      throw new Error('Format de fichier non supporté. Seuls les fichiers Excel sont acceptés.');
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB
      throw new Error('Fichier trop volumineux. Taille maximale: 5MB');
    }

    return true;
  }

  // Lire le fichier Excel et le convertir en données JSON
  parseExcelFile(buffer) {
    try {
      logger.debug('Début du parsing du fichier Excel');

      const workbook = XLSX.read(buffer, { type: 'buffer' });
      
      if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
        throw new Error('Aucune feuille trouvée dans le fichier Excel');
      }

      // Utiliser la première feuille
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      
      if (!worksheet) {
        throw new Error('Impossible de lire la feuille Excel');
      }

      // Convertir en JSON avec les en-têtes
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
        header: 1,
        defval: '' // Valeur par défaut pour les cellules vides
      });

      if (jsonData.length < 2) {
        throw new Error('Le fichier Excel doit contenir au moins une ligne d\'en-têtes et une ligne de données');
      }

      // Prendre la première ligne comme en-têtes
      const headers = jsonData[0];
      const rows = jsonData.slice(1);

      // Convertir en objets avec les en-têtes comme clés
      const data = rows.map((row, index) => {
        const obj = {};
        headers.forEach((header, colIndex) => {
          if (header) {
            obj[header] = row[colIndex] || '';
          }
        });
        return obj;
      }).filter(row => {
        // Filtrer les lignes vides
        return Object.values(row).some(value => value !== '');
      });

      logger.info(`Fichier Excel parsé avec succès`, {
        totalRows: data.length,
        headers: headers
      });

      return data;

    } catch (error) {
      logger.error('Erreur lors du parsing du fichier Excel', {
        error: error.message
      });
      throw new Error(`Erreur lors de la lecture du fichier Excel: ${error.message}`);
    }
  }

  // Valider la structure des données Excel
  validateDataStructure(data) {
    const errors = [];
    const requiredColumns = ['Equipe', 'Joueur', 'Email', 'Role'];
    const validRoles = ['captain', 'player'];

    if (!data || data.length === 0) {
      errors.push('Le fichier Excel est vide ou ne contient pas de données');
      return { isValid: false, errors };
    }

    // Vérifier les colonnes requises
    const firstRow = data[0];
    const availableColumns = Object.keys(firstRow);
    const missingColumns = requiredColumns.filter(col => !availableColumns.includes(col));
    
    if (missingColumns.length > 0) {
      errors.push(`Colonnes manquantes: ${missingColumns.join(', ')}`);
      errors.push(`Colonnes disponibles: ${availableColumns.join(', ')}`);
    }

    // Valider chaque ligne de données
    data.forEach((row, index) => {
      const rowNum = index + 2; // +2 car on commence à la ligne 2 (après les en-têtes)

      // Vérifier les champs obligatoires
      if (!row['Equipe'] || row['Equipe'].toString().trim() === '') {
        errors.push(`Ligne ${rowNum}: Le nom de l'équipe est obligatoire`);
      }
      
      if (!row['Joueur'] || row['Joueur'].toString().trim() === '') {
        errors.push(`Ligne ${rowNum}: Le nom du joueur est obligatoire`);
      }
      
      if (!row['Email'] || row['Email'].toString().trim() === '') {
        errors.push(`Ligne ${rowNum}: L'email est obligatoire`);
      }
      
      if (!row['Role'] || row['Role'].toString().trim() === '') {
        errors.push(`Ligne ${rowNum}: Le rôle est obligatoire`);
      }

      // Valider l'email
      if (row['Email'] && !this.isValidEmail(row['Email'].toString())) {
        errors.push(`Ligne ${rowNum}: Format d'email invalide (${row['Email']})`);
      }

      // Valider le rôle
      if (row['Role'] && !validRoles.includes(row['Role'].toString().trim())) {
        errors.push(`Ligne ${rowNum}: Rôle invalide. Doit être "captain" ou "player" (reçu: ${row['Role']})`);
      }
    });

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Vérifier si l'email est valide
  isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // Nettoyer et normaliser les données
  normalizeData(data) {
    return data.map(row => ({
      teamName: row['Equipe'].toString().trim(),
      playerName: row['Joueur'].toString().trim(),
      email: row['Email'].toString().trim().toLowerCase(),
      role: row['Role'].toString().trim()
    }));
  }

  // Grouper les données par équipe
  groupDataByTeam(data) {
    const teamsData = {};
    
    data.forEach(row => {
      const teamName = row.teamName;
      if (!teamsData[teamName]) {
        teamsData[teamName] = [];
      }
      teamsData[teamName].push(row);
    });

    return teamsData;
  }

  // Générer un rapport d'import
  generateImportReport(result) {
    const { teamsCreated, playersCreated, summary } = result;
    
    return {
      success: true,
      summary: {
        totalRows: summary.totalRows,
        teamsProcessed: summary.teamsProcessed,
        playersProcessed: summary.playersProcessed,
        teamsCreated: teamsCreated.length,
        playersCreated: playersCreated.length,
        errors: summary.errors
      },
      details: {
        teams: teamsCreated.map(team => ({
          id: team.id,
          name: team.name,
          status: team.status
        })),
        players: playersCreated.map(player => ({
          id: player.id,
          role: player.role
        }))
      }
    };
  }
}
