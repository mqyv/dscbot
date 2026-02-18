import { createEmbed } from '../utils/embeds.js';
import { E } from '../utils/emojis.js';
import { getGuildData, saveGuildData } from '../utils/database.js';

const DEFAULT_CONFIG = {
  enabled: false,
  threshold: 5,
  windowSeconds: 30,
  action: 'kick',
  whitelistRoles: [],
  whitelistUsers: [],
  newAccountMaxDays: 0,
  lockDurationMinutes: 0,
  alertChannelId: null,
  customReason: null,
};

function ensureConfig(guildData, guildId) {
  if (!guildData.settings) guildData.settings = {};
  if (!guildData.settings.antiraid) {
    guildData.settings.antiraid = { ...DEFAULT_CONFIG };
  }
  const cfg = guildData.settings.antiraid;
  for (const [k, v] of Object.entries(DEFAULT_CONFIG)) {
    if (cfg[k] === undefined) cfg[k] = v;
  }
  if (!Array.isArray(cfg.whitelistRoles)) cfg.whitelistRoles = [];
  if (!Array.isArray(cfg.whitelistUsers)) cfg.whitelistUsers = [];
  return cfg;
}

export default {
  data: {
    name: 'antiraid',
    description: 'Protéger le serveur contre les raids (joins massifs)',
  },
  execute: async (message, args) => {
    if (!message.member.permissions.has('Administrator')) {
      return message.reply({
        embeds: [createEmbed('error', {
          title: 'Permission refusée',
          description: 'Vous devez être administrateur pour utiliser cette commande.',
        })],
      });
    }

    const subcommand = args[0]?.toLowerCase();
    const sub2 = args[1]?.toLowerCase();
    const guildData = getGuildData(message.guild.id);
    const cfg = ensureConfig(guildData, message.guild.id);
    const e = E;

    // === ON / OFF ===
    if (subcommand === 'on' || subcommand === 'enable') {
      cfg.enabled = true;
      saveGuildData(message.guild.id, guildData);
      return message.reply({
        embeds: [createEmbed('success', {
          title: `${e.success} Antiraid activé`,
          description: buildConfigSummary(cfg),
        })],
      });
    }

    if (subcommand === 'off' || subcommand === 'disable') {
      cfg.enabled = false;
      saveGuildData(message.guild.id, guildData);
      return message.reply({
        embeds: [createEmbed('success', {
          title: `${e.success} Antiraid désactivé`,
          description: 'La protection antiraid est désactivée.',
        })],
      });
    }

    // === CONFIG (seuil, fenêtre, action) ===
    if (subcommand === 'config' || subcommand === 'set') {
      const threshold = parseInt(args[1], 10);
      const windowSec = parseInt(args[2], 10);
      const action = (args[3] || cfg.action).toLowerCase();

      if (!args[1] || !args[2]) {
        return message.reply({
          embeds: [createEmbed('error', {
            title: 'Usage',
            description: '`antiraid config <seuil> <fenêtre_secondes> [action]`\n\nEx: `antiraid config 5 30 kick`\n• seuil: 2-20\n• fenêtre: 10-120 secondes\n• action: kick, ban, lock',
          })],
        });
      }

      if (isNaN(threshold) || threshold < 2 || threshold > 20) {
        return message.reply({ embeds: [createEmbed('error', { title: 'Erreur', description: 'Seuil invalide (2-20).' })] });
      }
      if (isNaN(windowSec) || windowSec < 10 || windowSec > 120) {
        return message.reply({ embeds: [createEmbed('error', { title: 'Erreur', description: 'Fenêtre invalide (10-120s).' })] });
      }
      if (!['kick', 'ban', 'lock'].includes(action)) {
        return message.reply({ embeds: [createEmbed('error', { title: 'Erreur', description: 'Action: kick, ban ou lock.' })] });
      }

      cfg.threshold = threshold;
      cfg.windowSeconds = windowSec;
      cfg.action = action;
      saveGuildData(message.guild.id, guildData);
      return message.reply({
        embeds: [createEmbed('success', {
          title: `${e.success} Config mise à jour`,
          description: `**${threshold}** joins en **${windowSec}s** → **${action}**`,
        })],
      });
    }

    // === WHITELIST ===
    if (subcommand === 'whitelist' && !sub2) {
      return message.reply({
        embeds: [createEmbed('info', {
          title: `${e.list} Whitelist antiraid`,
          description: [
            '**Rôles:** `antiraid whitelist role add/remove @rôle`',
            '**Utilisateurs:** `antiraid whitelist user add/remove @user`',
            '',
            `Rôles whitelistés: ${cfg.whitelistRoles?.length || 0}`,
            `Utilisateurs whitelistés: ${cfg.whitelistUsers?.length || 0}`,
          ].join('\n'),
        })],
      });
    }

    if (subcommand === 'whitelist' && (sub2 === 'role' || sub2 === 'roles')) {
      const action = args[2]?.toLowerCase();
      const role = message.mentions.roles.first() || message.guild.roles.cache.get(args[3]);

      if (action === 'add' && role) {
        if (!cfg.whitelistRoles.includes(role.id)) {
          cfg.whitelistRoles.push(role.id);
          saveGuildData(message.guild.id, guildData);
        }
        return message.reply({
          embeds: [createEmbed('success', {
            title: `${e.success} Rôle whitelisté`,
            description: `${role} ne sera pas affecté par l'antiraid.`,
          })],
        });
      }
      if (action === 'remove' && role) {
        cfg.whitelistRoles = cfg.whitelistRoles.filter(id => id !== role.id);
        saveGuildData(message.guild.id, guildData);
        return message.reply({
          embeds: [createEmbed('success', {
            title: `${e.success} Rôle retiré`,
            description: `${role} n'est plus whitelisté.`,
          })],
        });
      }
      const list = cfg.whitelistRoles.map(id => message.guild.roles.cache.get(id)?.toString() || id).join(', ') || 'Aucun';
      return message.reply({
        embeds: [createEmbed('info', {
          title: `${e.list} Rôles whitelistés`,
          description: list,
          fields: [{ name: 'Usage', value: '`antiraid whitelist role add @rôle`\n`antiraid whitelist role remove @rôle`', inline: false }],
        })],
      });
    }

    // === WHITELIST USERS ===
    if (subcommand === 'whitelist' && (sub2 === 'user' || sub2 === 'users')) {
      const action = args[2]?.toLowerCase();
      const user = message.mentions.users.first();

      if (action === 'add' && user) {
        if (!cfg.whitelistUsers.includes(user.id)) {
          cfg.whitelistUsers.push(user.id);
          saveGuildData(message.guild.id, guildData);
        }
        return message.reply({
          embeds: [createEmbed('success', {
            title: `${e.success} Utilisateur whitelisté`,
            description: `${user.tag} ne sera pas affecté par l'antiraid.`,
          })],
        });
      }
      if (action === 'remove' && user) {
        cfg.whitelistUsers = cfg.whitelistUsers.filter(id => id !== user.id);
        saveGuildData(message.guild.id, guildData);
        return message.reply({
          embeds: [createEmbed('success', {
            title: `${e.success} Utilisateur retiré`,
            description: `${user.tag} n'est plus whitelisté.`,
          })],
        });
      }
      const list = cfg.whitelistUsers.slice(0, 10).map(id => `<@${id}>`).join(', ') || 'Aucun';
      return message.reply({
        embeds: [createEmbed('info', {
          title: `${e.list} Utilisateurs whitelistés`,
          description: list + (cfg.whitelistUsers.length > 10 ? ` (+${cfg.whitelistUsers.length - 10})` : ''),
          fields: [{ name: 'Usage', value: '`antiraid whitelist user add @user`\n`antiraid whitelist user remove @user`', inline: false }],
        })],
      });
    }

    // === NEW ACCOUNT (âge max du compte) ===
    if (subcommand === 'newaccount' || subcommand === 'age') {
      const days = parseInt(args[1], 10);
      if (args[1] === undefined || args[1] === '') {
        return message.reply({
          embeds: [createEmbed('info', {
            title: 'Âge des comptes',
            description: `Actuel: **${cfg.newAccountMaxDays === 0 ? 'Tous les comptes' : `Comptes de moins de ${cfg.newAccountMaxDays} jour(s)`}**\n\n\`antiraid newaccount <jours>\`\n• 0 = tous les comptes\n• 7 = seulement les comptes créés il y a moins de 7 jours`,
          })],
        });
      }
      if (isNaN(days) || days < 0 || days > 365) {
        return message.reply({ embeds: [createEmbed('error', { title: 'Erreur', description: 'Valeur invalide (0-365 jours).' })] });
      }
      cfg.newAccountMaxDays = days;
      saveGuildData(message.guild.id, guildData);
      return message.reply({
        embeds: [createEmbed('success', {
          title: `${e.success} Âge configuré`,
          description: days === 0 ? 'Tous les comptes sont concernés.' : `Seuls les comptes de moins de ${days} jour(s) seront affectés.`,
        })],
      });
    }

    // === LOCK DURATION (auto-désactivation du lock) ===
    if (subcommand === 'lockduration' || subcommand === 'lockauto') {
      const mins = parseInt(args[1], 10);
      if (args[1] === undefined || args[1] === '') {
        return message.reply({
          embeds: [createEmbed('info', {
            title: 'Durée du lock',
            description: `Actuel: **${cfg.lockDurationMinutes === 0 ? 'Manuel (pas d\'auto-désactivation)' : `${cfg.lockDurationMinutes} minute(s)`}**\n\n\`antiraid lockduration <minutes>\`\n• 0 = désactiver manuellement\n• 30 = revenir au niveau normal après 30 min`,
          })],
        });
      }
      if (isNaN(mins) || mins < 0 || mins > 1440) {
        return message.reply({ embeds: [createEmbed('error', { title: 'Erreur', description: 'Valeur invalide (0-1440 minutes).' })] });
      }
      cfg.lockDurationMinutes = mins;
      saveGuildData(message.guild.id, guildData);
      return message.reply({
        embeds: [createEmbed('success', {
          title: `${e.success} Durée du lock`,
          description: mins === 0 ? 'Le lock restera jusqu\'à désactivation manuelle.' : `Le niveau de vérification reviendra après ${mins} minute(s).`,
        })],
      });
    }

    // === ALERT CHANNEL ===
    if (subcommand === 'alert' || subcommand === 'channel') {
      const channel = message.mentions.channels.first() || message.guild.channels.cache.get(args[1]);
      if (args[1] === 'clear' || args[1] === 'remove' || args[1] === 'none') {
        cfg.alertChannelId = null;
        saveGuildData(message.guild.id, guildData);
        return message.reply({
          embeds: [createEmbed('success', { title: `${e.success} Canal d'alerte`, description: 'Canal d\'alerte antiraid supprimé.' })],
        });
      }
      if (channel) {
        cfg.alertChannelId = channel.id;
        saveGuildData(message.guild.id, guildData);
        return message.reply({
          embeds: [createEmbed('success', {
            title: `${e.success} Canal d'alerte`,
            description: `Les alertes antiraid seront envoyées dans ${channel}.`,
          })],
        });
      }
      const current = cfg.alertChannelId ? `<#${cfg.alertChannelId}>` : 'Aucun';
      return message.reply({
        embeds: [createEmbed('info', {
          title: 'Canal d\'alerte',
          description: `Actuel: ${current}\n\n\`antiraid alert #canal\` – Définir\n\`antiraid alert clear\` – Supprimer`,
        })],
      });
    }

    // === CUSTOM REASON ===
    if (subcommand === 'reason' || subcommand === 'raison') {
      if (args[1] === 'clear' || args[1] === 'remove' || args[1] === 'reset') {
        cfg.customReason = null;
        saveGuildData(message.guild.id, guildData);
        return message.reply({
          embeds: [createEmbed('success', { title: `${e.success} Raison`, description: 'Raison personnalisée supprimée.' })],
        });
      }
      const reason = args.slice(1).join(' ').trim();
      if (reason) {
        cfg.customReason = reason.slice(0, 500);
        saveGuildData(message.guild.id, guildData);
        return message.reply({
          embeds: [createEmbed('success', {
            title: `${e.success} Raison configurée`,
            description: `Raison: ${cfg.customReason}`,
          })],
        });
      }
      return message.reply({
        embeds: [createEmbed('info', {
          title: 'Raison personnalisée',
          description: `Actuel: ${cfg.customReason || 'Par défaut'}\n\n\`antiraid reason <texte>\` – Définir\n\`antiraid reason clear\` – Réinitialiser`,
        })],
      });
    }

    // === RESET (réinitialiser toute la config) ===
    if (subcommand === 'reset') {
      guildData.settings.antiraid = { ...DEFAULT_CONFIG };
      saveGuildData(message.guild.id, guildData);
      return message.reply({
        embeds: [createEmbed('success', {
          title: `${e.success} Config réinitialisée`,
          description: 'Toute la configuration antiraid a été réinitialisée.',
        })],
      });
    }

    // === STATUS / INFO ===
    if (subcommand === 'status' || subcommand === 'info' || !subcommand) {
      const status = cfg.enabled ? 'Activé' : 'Désactivé';
      const color = cfg.enabled ? 'success' : 'info';
      const fields = [
        { name: 'Seuil', value: `${cfg.threshold} joins`, inline: true },
        { name: 'Fenêtre', value: `${cfg.windowSeconds}s`, inline: true },
        { name: 'Action', value: cfg.action, inline: true },
        { name: 'Âge max compte', value: cfg.newAccountMaxDays === 0 ? 'Tous' : `${cfg.newAccountMaxDays}j`, inline: true },
        { name: 'Lock auto', value: cfg.lockDurationMinutes === 0 ? 'Manuel' : `${cfg.lockDurationMinutes}min`, inline: true },
        { name: 'Whitelist', value: `${(cfg.whitelistRoles?.length || 0) + (cfg.whitelistUsers?.length || 0)}`, inline: true },
      ];
      if (cfg.alertChannelId) {
        fields.push({ name: 'Canal alerte', value: `<#${cfg.alertChannelId}>`, inline: false });
      }
      if (cfg.customReason) {
        fields.push({ name: 'Raison personnalisée', value: cfg.customReason.slice(0, 100), inline: false });
      }
      return message.reply({
        embeds: [createEmbed(color, {
          title: `${e.lock} Antiraid – ${status}`,
          description: buildConfigSummary(cfg),
          fields,
          footer: { text: 'antiraid help pour toutes les commandes' },
        })],
      });
    }

    // === HELP ===
    if (subcommand === 'help') {
      return message.reply({
        embeds: [createEmbed('info', {
          title: `${e.lock} Antiraid – Aide complète`,
          description: [
            '**Activation**',
            '• `antiraid on` / `antiraid off`',
            '',
            '**Config principale**',
            '• `antiraid config <seuil> <secondes> [action]`',
            '  seuil: 2-20 | fenêtre: 10-120s | action: kick, ban, lock',
            '',
            '**Whitelist**',
            '• `antiraid whitelist role add/remove @rôle`',
            '• `antiraid whitelist user add/remove @user`',
            '',
            '**Options avancées**',
            '• `antiraid newaccount <jours>` – Cibler les comptes récents (0=tous)',
            '• `antiraid lockduration <min>` – Auto-désactiver le lock (0=manuel)',
            '• `antiraid alert #canal` – Canal pour les alertes',
            '• `antiraid reason <texte>` – Raison personnalisée kick/ban',
            '',
            '**Autres**',
            '• `antiraid status` – Voir la config',
            '• `antiraid reset` – Tout réinitialiser',
          ].join('\n'),
        })],
      });
    }

    return message.reply({
      embeds: [createEmbed('info', {
        title: 'Antiraid',
        description: 'Commande inconnue. Utilisez `antiraid help` pour l\'aide complète.',
      })],
    });
  },
};

function buildConfigSummary(cfg) {
  const parts = [`**${cfg.threshold}** joins en **${cfg.windowSeconds}s** → **${cfg.action}**`];
  if (cfg.newAccountMaxDays > 0) parts.push(`Comptes < ${cfg.newAccountMaxDays}j`);
  if (cfg.whitelistRoles?.length || cfg.whitelistUsers?.length) {
    parts.push(`Whitelist: ${(cfg.whitelistRoles?.length || 0) + (cfg.whitelistUsers?.length || 0)}`);
  }
  return parts.join(' • ');
}
