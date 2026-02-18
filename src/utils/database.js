import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const DB_PATH = join(__dirname, '../../data/database.json');

// Initialiser la base de données
function initDB() {
  const dataDir = join(DB_PATH, '..');
  if (!existsSync(dataDir)) {
    mkdirSync(dataDir, { recursive: true });
  }
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

// Obtenir les données d'un serveur (guildId peut être 'dm' pour les messages privés)
export function getGuildData(guildId) {
  const db = loadDB();
  const id = guildId || 'dm';
  if (!db.guilds[id]) {
    db.guilds[id] = {
      prefix: ',',
      settings: {},
    };
    saveDB(db);
  }
  return db.guilds[id];
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

// Obtenir le prefix pour un utilisateur (guildId = null pour DM)
export function getPrefix(guildId, userId) {
  const userData = getUserData(userId);
  if (userData.prefix) {
    return userData.prefix;
  }
  const guildData = getGuildData(guildId || 'dm');
  return guildData.prefix || ',';
}

// Whitelist - Par serveur (chaque serveur a sa propre whitelist)
function getGuildWhitelist(guildId) {
  if (!guildId) return [];
  const guildData = getGuildData(guildId);
  if (!guildData.whitelist) {
    guildData.whitelist = [];
    saveGuildData(guildId, guildData);
  }
  return guildData.whitelist;
}

// Obtenir la whitelist d'un serveur
export function getWhitelist(guildId) {
  return getGuildWhitelist(guildId);
}

// Ajouter à la whitelist d'un serveur
export function addToWhitelist(guildId, userId) {
  if (!guildId) return;
  const guildData = getGuildData(guildId);
  if (!guildData.whitelist) guildData.whitelist = [];
  if (!guildData.whitelist.includes(userId)) {
    guildData.whitelist.push(userId);
    saveGuildData(guildId, guildData);
  }
}

// Retirer de la whitelist d'un serveur
export function removeFromWhitelist(guildId, userId) {
  if (!guildId) return;
  const guildData = getGuildData(guildId);
  if (!guildData.whitelist) guildData.whitelist = [];
  guildData.whitelist = guildData.whitelist.filter(id => id !== userId);
  saveGuildData(guildId, guildData);
}

// Vérifier si un utilisateur est whitelisté sur un serveur
export function isWhitelisted(userId, guildId) {
  if (!guildId) return false;
  return getGuildWhitelist(guildId).includes(userId);
}

// Notes personnelles (pour commande en MP)
export function getUserNotes(userId) {
  const userData = getUserData(userId);
  if (!userData.notes) userData.notes = [];
  return userData.notes;
}

export function addUserNote(userId, content) {
  const userData = getUserData(userId);
  if (!userData.notes) userData.notes = [];
  const note = { id: Date.now(), content, createdAt: new Date().toISOString() };
  userData.notes.push(note);
  saveUserData(userId, userData);
  return note;
}

export function removeUserNote(userId, noteId) {
  const userData = getUserData(userId);
  if (!userData.notes) return false;
  const idx = userData.notes.findIndex(n => n.id === parseInt(noteId) || n.id === noteId);
  if (idx === -1) return false;
  userData.notes.splice(idx, 1);
  saveUserData(userId, userData);
  return true;
}

// Owners - Liste des owners (hors main owner qui est en dur)
const DEFAULT_OWNERS = ['1405334845420343328', '1230641184209109115'];

function getOwnerList() {
  const db = loadDB();
  if (!db.owners) {
    db.owners = [...DEFAULT_OWNERS];
    saveDB(db);
  }
  return db.owners;
}

export function getOwnerIds() {
  return [...getOwnerList()];
}

export function addOwner(userId) {
  const db = loadDB();
  if (!db.owners) db.owners = [];
  if (!db.owners.includes(userId)) {
    db.owners.push(userId);
    saveDB(db);
  }
}

export function removeOwner(userId) {
  const db = loadDB();
  if (!db.owners) db.owners = [];
  db.owners = db.owners.filter(id => id !== userId);
  saveDB(db);
}

// VIP - Utilisateurs ayant accès aux commandes premium (2,50€ lifetime)
function getVIPList() {
  const db = loadDB();
  if (!db.vip) db.vip = [];
  return db.vip;
}

export function isVIP(userId) {
  return getVIPList().includes(userId);
}

export function addVIP(userId) {
  const db = loadDB();
  if (!db.vip) db.vip = [];
  if (!db.vip.includes(userId)) {
    db.vip.push(userId);
    saveDB(db);
  }
}

export function removeVIP(userId) {
  const db = loadDB();
  if (!db.vip) db.vip = [];
  db.vip = db.vip.filter(id => id !== userId);
  saveDB(db);
}

export function getVIPUsers() {
  return [...getVIPList()];
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
