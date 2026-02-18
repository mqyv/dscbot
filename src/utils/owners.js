import { config } from 'dotenv';
import { getOwnerIds } from './database.js';

config();

// Propriétaire principal : seul à pouvoir modifier le profil du bot (customize) et gérer les owners
export const MAIN_OWNER_ID = '1214655422980423731';

/** Propriétaire principal uniquement (modifier profil bot, gérer owners) */
export function isMainOwner(userId) {
  return userId === MAIN_OWNER_ID;
}

/** Tout owner (bypass WL sur tous les serveurs, sauf customize réservé au main) */
export function isOwner(userId) {
  return userId === MAIN_OWNER_ID || getOwnerIds().includes(userId);
}
