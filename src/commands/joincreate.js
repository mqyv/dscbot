import { SlashCommandBuilder, ChannelType, PermissionFlagsBits } from 'discord.js';
import { createEmbed } from '../utils/embeds.js';
import { getGuildData, saveGuildData } from '../utils/database.js';

export default {
  data: new SlashCommandBuilder()
    .setName('joincreate')
    .setDescription('Join to create : rejoins un vocal pour créer le tien (tu es prioritaire)')
    .addSubcommand(sub =>
      sub
        .setName('set')
        .setDescription('Définir le canal vocal "rejoindre pour créer"')
        .addChannelOption(opt =>
          opt.setName('canal').setDescription('Canal vocal à utiliser').setRequired(true).addChannelTypes(ChannelType.GuildVoice)
        )
    )
    .addSubcommand(sub =>
      sub.setName('unset').setDescription('Désactiver le join to create')
    )
    .addSubcommand(sub =>
      sub.setName('config').setDescription('Voir la configuration actuelle')
    )
    .addSubcommand(sub =>
      sub
        .setName('rename')
        .setDescription('Renommer ton vocal (propriétaire uniquement)')
        .addStringOption(opt =>
          opt.setName('nom').setDescription('Nouveau nom du vocal').setRequired(true)
        )
    )
    .addSubcommand(sub =>
      sub
        .setName('limit')
        .setDescription('Limiter le nombre de personnes dans ton vocal')
        .addIntegerOption(opt =>
          opt.setName('nombre').setDescription('Nombre max (0 = illimité)').setRequired(true).setMinValue(0).setMaxValue(99)
        )
    )
    .addSubcommand(sub =>
      sub
        .setName('permit')
        .setDescription('Autoriser quelqu\'un à rejoindre ton vocal')
        .addUserOption(opt =>
          opt.setName('utilisateur').setDescription('Utilisateur à autoriser').setRequired(true)
        )
    )
    .addSubcommand(sub =>
      sub
        .setName('reject')
        .setDescription('Retirer quelqu\'un de ton vocal')
        .addUserOption(opt =>
          opt.setName('utilisateur').setDescription('Utilisateur à retirer').setRequired(true)
        )
    )
    .addSubcommand(sub =>
      sub
        .setName('lock')
        .setDescription('Verrouiller ton vocal (personne ne peut rejoindre)')
    )
    .addSubcommand(sub =>
      sub
        .setName('unlock')
        .setDescription('Déverrouiller ton vocal')
    ),

  async execute(interaction, args, client) {
    const sub = interaction.options.getSubcommand();
    const guildData = getGuildData(interaction.guild.id);
    if (!guildData.settings) guildData.settings = {};
    if (!guildData.settings.joincreate) guildData.settings.joincreate = { channelId: null, creators: {} };

    const jc = guildData.settings.joincreate;

    if (sub === 'set') {
      if (!interaction.member.permissions.has(PermissionFlagsBits.ManageChannels)) {
        return interaction.reply({ content: 'Permission refusée. Gérer les canaux requis.', ephemeral: true });
      }
      const channel = interaction.options.getChannel('canal');
      jc.channelId = channel.id;
      saveGuildData(interaction.guild.id, guildData);
      return interaction.reply({
        embeds: [createEmbed('success', {
          title: 'Join to create configuré',
          description: `Rejoindre ${channel} créera désormais un nouveau vocal dont tu seras prioritaire.`,
        })],
        ephemeral: true,
      });
    }

    if (sub === 'unset') {
      if (!interaction.member.permissions.has(PermissionFlagsBits.ManageChannels)) {
        return interaction.reply({ content: 'Permission refusée.', ephemeral: true });
      }
      jc.channelId = null;
      jc.creators = {};
      saveGuildData(interaction.guild.id, guildData);
      return interaction.reply({
        embeds: [createEmbed('success', { title: 'Join to create désactivé', description: 'Le système a été désactivé.' })],
        ephemeral: true,
      });
    }

    if (sub === 'config') {
      const channel = jc.channelId ? interaction.guild.channels.cache.get(jc.channelId) : null;
      const embed = createEmbed('info', {
        title: 'Join to create',
        description: channel
          ? `Rejoins ${channel} pour créer ton vocal. Tu seras prioritaire (rename, limit, permit, reject, lock).`
          : 'Non configuré. Utilise `/joincreate set` pour définir le canal.',
      });
      if (channel) {
        embed.addFields({ name: 'Canal', value: channel.toString(), inline: true });
      }
      return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    // Subcommands qui nécessitent d'être propriétaire d'un vocal
    const voiceChannel = interaction.member.voice?.channel;
    if (!voiceChannel || voiceChannel.type !== ChannelType.GuildVoice) {
      return interaction.reply({ content: 'Tu dois être dans un vocal pour utiliser cette commande.', ephemeral: true });
    }

    const ownerId = jc.creators?.[voiceChannel.id];
    if (ownerId !== interaction.user.id) {
      return interaction.reply({ content: 'Tu n\'es pas le propriétaire de ce vocal. Seul le créateur peut utiliser cette commande.', ephemeral: true });
    }

    if (sub === 'rename') {
      const nom = interaction.options.getString('nom').trim().slice(0, 100).replace(/[^\w\s\-À-ÿ]/g, '') || 'vocal';
      try {
        await voiceChannel.setName(nom);
        return interaction.reply({ content: `Vocal renommé en **${nom}**.`, ephemeral: true });
      } catch (e) {
        return interaction.reply({ content: `Erreur: ${e.message}`, ephemeral: true });
      }
    }

    if (sub === 'limit') {
      const n = interaction.options.getInteger('nombre');
      try {
        await voiceChannel.setUserLimit(n);
        return interaction.reply({
          content: n === 0 ? 'Limite supprimée (illimité).' : `Limite fixée à **${n}** personne(s).`,
          ephemeral: true,
        });
      } catch (e) {
        return interaction.reply({ content: `Erreur: ${e.message}`, ephemeral: true });
      }
    }

    if (sub === 'permit') {
      const user = interaction.options.getUser('utilisateur');
      try {
        await voiceChannel.permissionOverwrites.edit(user.id, {
          Connect: true,
          Speak: true,
          ViewChannel: true,
        });
        return interaction.reply({ content: `${user} peut maintenant rejoindre ton vocal.`, ephemeral: true });
      } catch (e) {
        return interaction.reply({ content: `Erreur: ${e.message}`, ephemeral: true });
      }
    }

    if (sub === 'reject') {
      const user = interaction.options.getUser('utilisateur');
      const member = voiceChannel.members.get(user.id);
      if (member) {
        try {
          await member.voice.setChannel(null);
          return interaction.reply({ content: `${user} a été retiré du vocal.`, ephemeral: true });
        } catch (e) {
          return interaction.reply({ content: `Erreur: ${e.message}`, ephemeral: true });
        }
      }
      await voiceChannel.permissionOverwrites.delete(user.id).catch(() => {});
      return interaction.reply({ content: `${user} n'est pas dans le vocal ou a été retiré des autorisations.`, ephemeral: true });
    }

    if (sub === 'lock') {
      try {
        await voiceChannel.permissionOverwrites.edit(interaction.guild.id, { Connect: false });
        return interaction.reply({ content: 'Vocal verrouillé. Personne ne peut rejoindre.', ephemeral: true });
      } catch (e) {
        return interaction.reply({ content: `Erreur: ${e.message}`, ephemeral: true });
      }
    }

    if (sub === 'unlock') {
      try {
        await voiceChannel.permissionOverwrites.delete(interaction.guild.id);
        return interaction.reply({ content: 'Vocal déverrouillé.', ephemeral: true });
      } catch (e) {
        return interaction.reply({ content: `Erreur: ${e.message}`, ephemeral: true });
      }
    }
  },
};

export async function handleJoinCreateVoiceState(oldState, newState) {
  const guildId = newState.guild.id;
  const { getGuildData, saveGuildData } = await import('../utils/database.js');
  const guildData = getGuildData(guildId);
  const jc = guildData?.settings?.joincreate;
  if (!jc?.channelId) return;

  const joinChannelId = jc.channelId;
  if (!jc.creators) jc.creators = {};

  // Quelqu'un rejoint le canal "join to create"
  if (newState.channelId === joinChannelId && newState.member && !newState.member.user.bot) {
    const channel = newState.channel;
    const member = newState.member;
    const parentId = channel.parentId;

    const newChannel = await newState.guild.channels.create({
      name: `${member.displayName}-vocal`,
      type: ChannelType.GuildVoice,
      parent: parentId,
      permissionOverwrites: [
        { id: newState.guild.id, allow: [PermissionFlagsBits.Connect, PermissionFlagsBits.Speak, PermissionFlagsBits.ViewChannel] },
        { id: member.id, allow: [PermissionFlagsBits.ManageChannels, PermissionFlagsBits.Connect, PermissionFlagsBits.Speak, PermissionFlagsBits.MoveMembers, PermissionFlagsBits.ViewChannel] },
      ],
    });

    await member.voice.setChannel(newChannel);
    jc.creators[newChannel.id] = member.id;
    saveGuildData(guildId, guildData);
    return;
  }

  // Quelqu'un quitte un vocal créé → supprimer si vide
  const leftChannelId = oldState.channelId;
  if (leftChannelId && jc.creators[leftChannelId]) {
    const leftChannel = oldState.guild.channels.cache.get(leftChannelId);
    if (leftChannel && leftChannel.members.size === 0) {
      delete jc.creators[leftChannelId];
      saveGuildData(guildId, guildData);
      await leftChannel.delete().catch(() => {});
    }
  }
}
