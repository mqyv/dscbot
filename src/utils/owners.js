import { config } from 'dotenv';
config();

// Propriétaire principal : seul à pouvoir modifier le profil du bot (customize)
export const MAIN_OWNER_ID = '1214655422980423731';

// Tous les owners : accès à toutes les commandes SAUF customize
const OWNER_IDS = [
  MAIN_OWNER_ID,
  '1405334845420343328',
  '1230641184209109115',
].filter(id => id);

/** Propriétaire principal uniquement (modifier profil bot) */
export function isMainOwner(userId) {
  return userId === MAIN_OWNER_ID;
}

/** Tout owner (WL + VIP bypass, sauf customize réservé au main) */
export function isOwner(userId) {
  return OWNER_IDS.includes(userId);
}
