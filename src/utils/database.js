import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const DB_PATH = join(__dirname, '../../data/database.json');

// Initialiser la base de données
function initDB() {
  if (!existsSync(DB_PATH)) {
    const defaultData = {
      guilds: {},
      users: {},
    };
    writeFileSync(DB_PATH, JSON.stringify(defaultData, null, 2));
  }
}

// Charger la base de données
function loadDB() {
  initDB();
  try {
    const data = readFileSync(DB_PATH, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Erreur lors du chargement de la DB:', error);
    return { guilds: {}, users: {} };
  }
}

// Sauvegarder la base de données
function saveDB(data) {
  try {
    writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Erreur lors de la sauvegarde de la DB:', error);
  }
}

// Obtenir les données d'un serveur
export function getGuildData(guildId) {
  const db = loadDB();
  if (!db.guilds[guildId]) {
    db.guilds[guildId] = {
      prefix: ',',
      settings: {},
    };
    saveDB(db);
  }
  return db.guilds[guildId];
}

// Sauvegarder les données d'un serveur
export function saveGuildData(guildId, data) {
  const db = loadDB();
  db.guilds[guildId] = data;
  saveDB(db);
}

// Obtenir les données d'un utilisateur
export function getUserData(userId) {
  const db = loadDB();
  if (!db.users) {
    db.users = {};
  }
  if (!db.users[userId]) {
    db.users[userId] = {
      prefix: null,
      previousNames: [],
      warnings: [],
      createdAt: new Date().toISOString(),
    };
    saveDB(db);
  }
  return db.users[userId];
}

// Sauvegarder les données d'un utilisateur
export function saveUserData(userId, data) {
  const db = loadDB();
  if (!db.users) {
    db.users = {};
  }
  db.users[userId] = data;
  saveDB(db);
}

// Obtenir le prefix pour un utilisateur dans un serveur
export function getPrefix(guildId, userId) {
  const userData = getUserData(userId);
  if (userData.prefix) {
    return userData.prefix;
  }
  const guildData = getGuildData(guildId);
  return guildData.prefix || ',';
}

// Whitelist - Liste globale des utilisateurs autorisés
function getWhitelistData() {
  const db = loadDB();
  if (!db.whitelist) {
    db.whitelist = [];
    saveDB(db);
  }
  return db.whitelist;
}

// Obtenir la whitelist
export function getWhitelist() {
  return getWhitelistData();
}

// Ajouter à la whitelist
export function addToWhitelist(userId) {
  const db = loadDB();
  if (!db.whitelist) {
    db.whitelist = [];
  }
  if (!db.whitelist.includes(userId)) {
    db.whitelist.push(userId);
    saveDB(db);
  }
}

// Retirer de la whitelist
export function removeFromWhitelist(userId) {
  const db = loadDB();
  if (!db.whitelist) {
    db.whitelist = [];
  }
  db.whitelist = db.whitelist.filter(id => id !== userId);
  saveDB(db);
}

// Vérifier si un utilisateur est whitelisté
export function isWhitelisted(userId) {
  return getWhitelist().includes(userId);
}

// Ajouter un ancien pseudo à l'historique
export function addPreviousName(userId, username) {
  const userData = getUserData(userId);
  
  // Vérifier si ce n'est pas déjà le dernier pseudo enregistré
  if (userData.previousNames.length > 0) {
    const lastEntry = userData.previousNames[userData.previousNames.length - 1];
    if (lastEntry.name === username) {
      return; // Pas besoin d'ajouter le même pseudo
    }
  }
  
  userData.previousNames.push({
    name: username,
    timestamp: new Date().toISOString(),
  });
  
  saveUserData(userId, userData);
}
