import { createEmbed } from '../utils/embeds.js';
import { isVIP, addVIP, removeVIP, getVIPUsers } from '../utils/database.js';
import { isOwner } from '../utils/owners.js';

// Commandes nécessitant VIP (2,50€ lifetime) - propriétaire et whitelistés en sont exemptés
export const VIP_COMMANDS = ['backup', 'giveaway'];

export default {
  data: {
    name: 'vip',
    description: 'Gérer les abonnés VIP (propriétaire uniquement)',
  },
  execute: async (message, args) => {
    if (!isOwner(message.author.id)) {
      return message.reply({
        embeds: [createEmbed('error', {
          title: 'Permission refusée',
          description: 'Cette commande est réservée au propriétaire du bot.',
        })],
      });
    }

    const subcommand = args[0]?.toLowerCase();

    if (subcommand === 'add') {
      await vipAdd(message, args.slice(1));
      return;
    }
    if (subcommand === 'remove') {
      await vipRemove(message, args.slice(1));
      return;
    }
    if (subcommand === 'list' || subcommand === 'ls') {
      await vipList(message);
      return;
    }
    if (subcommand === 'check') {
      await vipCheck(message, args.slice(1));
      return;
    }

    return message.reply({
      embeds: [createEmbed('info', {
        title: 'VIP – Gestion',
        description: [
          '**Commandes VIP** (2,50€ lifetime) : `backup`, `giveaway`',
          '',
          '**`vip add <@user|id>`** – Ajouter un utilisateur VIP',
          '**`vip remove <@user|id>`** – Retirer le statut VIP',
          '**`vip list`** – Liste des utilisateurs VIP',
          '**`vip check [@user]`** – Vérifier le statut VIP',
        ].join('\n'),
      })],
    });
  },
};

async function vipAdd(message, args) {
  const target = message.mentions.users.first() || (args[0] ? await message.client.users.fetch(args[0]).catch(() => null) : null);

  if (!target) {
    return message.reply({
      embeds: [createEmbed('error', {
        title: 'Erreur',
        description: 'Usage: `vip add @user` ou `vip add <id>`',
      })],
    });
  }

  addVIP(target.id);

  return message.reply({
    embeds: [createEmbed('success', {
      title: 'VIP ajouté',
      description: `**${target.tag}** a été ajouté aux utilisateurs VIP.\nAccès aux commandes : backup, giveaway.`,
    })],
  });
}

async function vipRemove(message, args) {
  const target = message.mentions.users.first() || (args[0] ? await message.client.users.fetch(args[0]).catch(() => null) : null);

  if (!target) {
    return message.reply({
      embeds: [createEmbed('error', {
        title: 'Erreur',
        description: 'Usage: `vip remove @user` ou `vip remove <id>`',
      })],
    });
  }

  removeVIP(target.id);

  return message.reply({
    embeds: [createEmbed('success', {
      title: 'VIP retiré',
      description: `**${target.tag}** n\'a plus le statut VIP.`,
    })],
  });
}

async function vipList(message) {
  const list = getVIPUsers();

  if (list.length === 0) {
    return message.reply({
      embeds: [createEmbed('info', {
        title: 'Liste VIP',
        description: 'Aucun utilisateur VIP.',
      })],
    });
  }

  const lines = [];
  for (const userId of list) {
    try {
      const user = await message.client.users.fetch(userId);
      lines.push(`• **${user.tag}** (\`${userId}\`)`);
    } catch {
      lines.push(`• \`${userId}\` (utilisateur introuvable)`);
    }
  }

  return message.reply({
    embeds: [createEmbed('info', {
      title: `Liste VIP (${list.length})`,
      description: lines.join('\n'),
    })],
  });
}

async function vipCheck(message, args) {
  const target = message.mentions.users.first() || (args[0] ? await message.client.users.fetch(args[0]).catch(() => null) : null) || message.author;

  const hasVIP = isVIP(target.id);

  return message.reply({
    embeds: [createEmbed(hasVIP ? 'success' : 'info', {
      title: 'Statut VIP',
      description: hasVIP
        ? `**${target.tag}** a le statut VIP.`
        : `**${target.tag}** n'a pas le statut VIP.`,
    })],
  });
}
