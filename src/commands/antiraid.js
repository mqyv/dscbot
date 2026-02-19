import { SlashCommandBuilder, PermissionFlagsBits, ChannelType } from 'discord.js';
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

function buildConfigSummary(cfg) {
  const parts = [`**${cfg.threshold}** joins en **${cfg.windowSeconds}s** → **${cfg.action}**`];
  if (cfg.newAccountMaxDays > 0) parts.push(`Comptes < ${cfg.newAccountMaxDays}j`);
  if (cfg.whitelistRoles?.length || cfg.whitelistUsers?.length) {
    parts.push(`Whitelist: ${(cfg.whitelistRoles?.length || 0) + (cfg.whitelistUsers?.length || 0)}`);
  }
  return parts.join(' • ');
}

const antiraidSlashData = new SlashCommandBuilder()
  .setName('antiraid')
  .setDescription('Protéger le serveur contre les raids (joins massifs)')
  .addSubcommand(sub => sub.setName('on').setDescription('Activer la protection antiraid'))
  .addSubcommand(sub => sub.setName('off').setDescription('Désactiver la protection antiraid'))
  .addSubcommand(sub =>
    sub
      .setName('config')
      .setDescription('Configurer seuil, fenêtre et action')
      .addIntegerOption(o => o.setName('seuil').setDescription('Nombre de joins déclenchant l\'action (2-20)').setRequired(true).setMinValue(2).setMaxValue(20))
      .addIntegerOption(o => o.setName('fenetre').setDescription('Fenêtre en secondes (10-120)').setRequired(true).setMinValue(10).setMaxValue(120))
      .addStringOption(o => o.setName('action').setDescription('Action à effectuer').setRequired(false).addChoices(
        { name: 'Kick', value: 'kick' },
        { name: 'Ban', value: 'ban' },
        { name: 'Lock (verrouiller)', value: 'lock' }
      ))
  )
  .addSubcommand(sub =>
    sub
      .setName('whitelist_role_add')
      .setDescription('Ajouter un rôle à la whitelist')
      .addRoleOption(o => o.setName('role').setDescription('Rôle à exempter').setRequired(true))
  )
  .addSubcommand(sub =>
    sub
      .setName('whitelist_role_remove')
      .setDescription('Retirer un rôle de la whitelist')
      .addRoleOption(o => o.setName('role').setDescription('Rôle à retirer').setRequired(true))
  )
  .addSubcommand(sub => sub.setName('whitelist_role_list').setDescription('Voir les rôles whitelistés'))
  .addSubcommand(sub =>
    sub
      .setName('whitelist_user_add')
      .setDescription('Ajouter un utilisateur à la whitelist')
      .addUserOption(o => o.setName('utilisateur').setDescription('Utilisateur à exempter').setRequired(true))
  )
  .addSubcommand(sub =>
    sub
      .setName('whitelist_user_remove')
      .setDescription('Retirer un utilisateur de la whitelist')
      .addUserOption(o => o.setName('utilisateur').setDescription('Utilisateur à retirer').setRequired(true))
  )
  .addSubcommand(sub => sub.setName('whitelist_user_list').setDescription('Voir les utilisateurs whitelistés'))
  .addSubcommand(sub =>
    sub
      .setName('newaccount')
      .setDescription('Cibler les comptes récents (0 = tous)')
      .addIntegerOption(o => o.setName('jours').setDescription('Âge max du compte en jours (0-365)').setRequired(true).setMinValue(0).setMaxValue(365))
  )
  .addSubcommand(sub =>
    sub
      .setName('lockduration')
      .setDescription('Durée auto du lock avant retour à la normale (0 = manuel)')
      .addIntegerOption(o => o.setName('minutes').setDescription('Minutes (0-1440)').setRequired(true).setMinValue(0).setMaxValue(1440))
  )
  .addSubcommand(sub =>
    sub
      .setName('alert')
      .setDescription('Définir le canal des alertes antiraid')
      .addChannelOption(o => o.setName('canal').setDescription('Canal pour les alertes').setRequired(false).addChannelTypes(ChannelType.GuildText))
  )
  .addSubcommand(sub =>
    sub
      .setName('alert_clear')
      .setDescription('Supprimer le canal d\'alerte')
  )
  .addSubcommand(sub =>
    sub
      .setName('reason')
      .setDescription('Raison personnalisée pour kick/ban')
      .addStringOption(o => o.setName('texte').setDescription('Raison (vide pour réinitialiser)').setRequired(false))
  )
  .addSubcommand(sub => sub.setName('reset').setDescription('Réinitialiser toute la configuration'))
  .addSubcommand(sub => sub.setName('status').setDescription('Voir la configuration actuelle'));

export default {
  data: antiraidSlashData,
  execute: async (interactionOrMessage, args, client) => {
    const isSlash = interactionOrMessage.isChatInputCommand?.();
    const interaction = isSlash ? interactionOrMessage : null;

    if (!interaction) {
      return interactionOrMessage.reply({
        embeds: [createEmbed('info', {
          title: 'Antiraid',
          description: 'L\'antiraid est disponible uniquement en **slash command**.\nUtilisez `/antiraid` pour configurer la protection.',
        })],
      });
    }

    if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
      return interaction.reply({
        content: 'Vous devez être administrateur.',
        ephemeral: true,
      });
    }

    const sub = interaction.options.getSubcommand();
    const guildData = getGuildData(interaction.guild.id);
    const cfg = ensureConfig(guildData, interaction.guild.id);
    const e = E;

    if (sub === 'on') {
      cfg.enabled = true;
      saveGuildData(interaction.guild.id, guildData);
      return interaction.reply({
        embeds: [createEmbed('success', { title: `${e.success} Antiraid activé`, description: buildConfigSummary(cfg) })],
        ephemeral: true,
      });
    }

    if (sub === 'off') {
      cfg.enabled = false;
      saveGuildData(interaction.guild.id, guildData);
      return interaction.reply({
        embeds: [createEmbed('success', { title: `${e.success} Antiraid désactivé`, description: 'La protection antiraid est désactivée.' })],
        ephemeral: true,
      });
    }

    if (sub === 'config') {
      const threshold = interaction.options.getInteger('seuil');
      const windowSec = interaction.options.getInteger('fenetre');
      const action = interaction.options.getString('action') || cfg.action;

      cfg.threshold = threshold;
      cfg.windowSeconds = windowSec;
      cfg.action = action;
      saveGuildData(interaction.guild.id, guildData);
      return interaction.reply({
        embeds: [createEmbed('success', {
          title: `${e.success} Config mise à jour`,
          description: `**${threshold}** joins en **${windowSec}s** → **${action}**`,
        })],
        ephemeral: true,
      });
    }

    if (sub === 'whitelist_role_add') {
      const role = interaction.options.getRole('role');
      if (!cfg.whitelistRoles.includes(role.id)) {
        cfg.whitelistRoles.push(role.id);
        saveGuildData(interaction.guild.id, guildData);
      }
      return interaction.reply({
        embeds: [createEmbed('success', {
          title: `${e.success} Rôle whitelisté`,
          description: `${role} ne sera pas affecté par l'antiraid.`,
        })],
        ephemeral: true,
      });
    }

    if (sub === 'whitelist_role_remove') {
      const role = interaction.options.getRole('role');
      cfg.whitelistRoles = cfg.whitelistRoles.filter(id => id !== role.id);
      saveGuildData(interaction.guild.id, guildData);
      return interaction.reply({
        embeds: [createEmbed('success', {
          title: `${e.success} Rôle retiré`,
          description: `${role} n'est plus whitelisté.`,
        })],
        ephemeral: true,
      });
    }

    if (sub === 'whitelist_role_list') {
      const list = cfg.whitelistRoles.map(id => interaction.guild.roles.cache.get(id)?.toString() || id).join(', ') || 'Aucun';
      return interaction.reply({
        embeds: [createEmbed('info', { title: `${e.list} Rôles whitelistés`, description: list })],
        ephemeral: true,
      });
    }

    if (sub === 'whitelist_user_add') {
      const user = interaction.options.getUser('utilisateur');
      if (!cfg.whitelistUsers.includes(user.id)) {
        cfg.whitelistUsers.push(user.id);
        saveGuildData(interaction.guild.id, guildData);
      }
      return interaction.reply({
        embeds: [createEmbed('success', {
          title: `${e.success} Utilisateur whitelisté`,
          description: `${user.tag} ne sera pas affecté par l'antiraid.`,
        })],
        ephemeral: true,
      });
    }

    if (sub === 'whitelist_user_remove') {
      const user = interaction.options.getUser('utilisateur');
      cfg.whitelistUsers = cfg.whitelistUsers.filter(id => id !== user.id);
      saveGuildData(interaction.guild.id, guildData);
      return interaction.reply({
        embeds: [createEmbed('success', {
          title: `${e.success} Utilisateur retiré`,
          description: `${user.tag} n'est plus whitelisté.`,
        })],
        ephemeral: true,
      });
    }

    if (sub === 'whitelist_user_list') {
      const list = cfg.whitelistUsers.slice(0, 10).map(id => `<@${id}>`).join(', ') || 'Aucun';
      const suffix = cfg.whitelistUsers.length > 10 ? ` (+${cfg.whitelistUsers.length - 10})` : '';
      return interaction.reply({
        embeds: [createEmbed('info', { title: `${e.list} Utilisateurs whitelistés`, description: list + suffix })],
        ephemeral: true,
      });
    }

    if (sub === 'newaccount') {
      const days = interaction.options.getInteger('jours');
      cfg.newAccountMaxDays = days;
      saveGuildData(interaction.guild.id, guildData);
      return interaction.reply({
        embeds: [createEmbed('success', {
          title: `${e.success} Âge configuré`,
          description: days === 0 ? 'Tous les comptes sont concernés.' : `Seuls les comptes de moins de ${days} jour(s) seront affectés.`,
        })],
        ephemeral: true,
      });
    }

    if (sub === 'lockduration') {
      const mins = interaction.options.getInteger('minutes');
      cfg.lockDurationMinutes = mins;
      saveGuildData(interaction.guild.id, guildData);
      return interaction.reply({
        embeds: [createEmbed('success', {
          title: `${e.success} Durée du lock`,
          description: mins === 0 ? 'Le lock restera jusqu\'à désactivation manuelle.' : `Le niveau reviendra après ${mins} minute(s).`,
        })],
        ephemeral: true,
      });
    }

    if (sub === 'alert') {
      const channel = interaction.options.getChannel('canal');
      if (channel) {
        cfg.alertChannelId = channel.id;
        saveGuildData(interaction.guild.id, guildData);
        return interaction.reply({
          embeds: [createEmbed('success', {
            title: `${e.success} Canal d'alerte`,
            description: `Les alertes antiraid seront envoyées dans ${channel}.`,
          })],
          ephemeral: true,
        });
      }
      const current = cfg.alertChannelId ? `<#${cfg.alertChannelId}>` : 'Aucun';
      return interaction.reply({
        embeds: [createEmbed('info', { title: 'Canal d\'alerte', description: `Actuel: ${current}\n\nUtilisez \`/antiraid alert #canal\` pour définir.` })],
        ephemeral: true,
      });
    }

    if (sub === 'alert_clear') {
      cfg.alertChannelId = null;
      saveGuildData(interaction.guild.id, guildData);
      return interaction.reply({
        embeds: [createEmbed('success', { title: `${e.success} Canal d'alerte`, description: 'Canal d\'alerte supprimé.' })],
        ephemeral: true,
      });
    }

    if (sub === 'reason') {
      const texte = interaction.options.getString('texte');
      if (!texte || texte.trim() === '') {
        cfg.customReason = null;
        saveGuildData(interaction.guild.id, guildData);
        return interaction.reply({
          embeds: [createEmbed('success', { title: `${e.success} Raison`, description: 'Raison personnalisée supprimée.' })],
          ephemeral: true,
        });
      }
      cfg.customReason = texte.trim().slice(0, 500);
      saveGuildData(interaction.guild.id, guildData);
      return interaction.reply({
        embeds: [createEmbed('success', {
          title: `${e.success} Raison configurée`,
          description: `Raison: ${cfg.customReason}`,
        })],
        ephemeral: true,
      });
    }

    if (sub === 'reset') {
      guildData.settings.antiraid = { ...DEFAULT_CONFIG };
      saveGuildData(interaction.guild.id, guildData);
      return interaction.reply({
        embeds: [createEmbed('success', {
          title: `${e.success} Config réinitialisée`,
          description: 'Toute la configuration antiraid a été réinitialisée.',
        })],
        ephemeral: true,
      });
    }

    if (sub === 'status') {
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
      return interaction.reply({
        embeds: [createEmbed(color, {
          title: `${e.lock} Antiraid – ${status}`,
          description: buildConfigSummary(cfg),
          fields,
        })],
        ephemeral: true,
      });
    }
  },
};
