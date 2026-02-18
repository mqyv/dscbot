import { createEmbed } from '../utils/embeds.js';
import { getOwnerIds, addOwner, removeOwner } from '../utils/database.js';
import { isMainOwner, MAIN_OWNER_ID } from '../utils/owners.js';

export default {
  data: {
    name: 'owner',
    description: 'Gérer les owners du bot (propriétaire principal uniquement)',
  },
  execute: async (message, args) => {
    if (!isMainOwner(message.author.id)) {
      return message.reply({
        embeds: [createEmbed('error', {
          title: 'Permission refusée',
          description: 'Seul le propriétaire principal du bot peut gérer les owners.',
        })],
      });
    }

    const subcommand = args[0]?.toLowerCase();

    if (subcommand === 'add') {
      await ownerAdd(message, args.slice(1));
      return;
    }
    if (subcommand === 'remove' || subcommand === 'rm') {
      await ownerRemove(message, args.slice(1));
      return;
    }
    if (subcommand === 'list' || subcommand === 'ls') {
      await ownerList(message);
      return;
    }

    return message.reply({
      embeds: [createEmbed('info', {
        title: 'Owner – Gestion',
        description: [
          '**`owner add <@user|id>`** – Ajouter un owner',
          '**`owner remove <@user|id>`** – Retirer un owner',
          '**`owner list`** – Liste des owners',
          '',
          '*Les owners ont accès à toutes les commandes sauf `customize` (profil du bot).*',
        ].join('\n'),
      })],
    });
  },
};

async function ownerAdd(message, args) {
  const target = message.mentions.users.first() || (args[0] ? await message.client.users.fetch(args[0]).catch(() => null) : null);

  if (!target) {
    return message.reply({
      embeds: [createEmbed('error', {
        title: 'Erreur',
        description: 'Usage: `owner add @user` ou `owner add <id>`',
      })],
    });
  }

  if (target.id === MAIN_OWNER_ID) {
    return message.reply({
      embeds: [createEmbed('error', {
        title: 'Erreur',
        description: 'Le propriétaire principal est déjà owner par défaut.',
      })],
    });
  }

  addOwner(target.id);

  return message.reply({
    embeds: [createEmbed('success', {
      title: 'Owner ajouté',
      description: `**${target.tag}** a été ajouté aux owners du bot.`,
    })],
  });
}

async function ownerRemove(message, args) {
  const target = message.mentions.users.first() || (args[0] ? await message.client.users.fetch(args[0]).catch(() => null) : null);

  if (!target) {
    return message.reply({
      embeds: [createEmbed('error', {
        title: 'Erreur',
        description: 'Usage: `owner remove @user` ou `owner remove <id>`',
      })],
    });
  }

  if (target.id === MAIN_OWNER_ID) {
    return message.reply({
      embeds: [createEmbed('error', {
        title: 'Erreur',
        description: 'Le propriétaire principal ne peut pas être retiré.',
      })],
    });
  }

  removeOwner(target.id);

  return message.reply({
    embeds: [createEmbed('success', {
      title: 'Owner retiré',
      description: `**${target.tag}** n'a plus le statut owner.`,
    })],
  });
}

async function ownerList(message) {
  const owners = getOwnerIds();
  const allOwners = [MAIN_OWNER_ID, ...owners];

  const lines = [];
  for (const userId of allOwners) {
    try {
      const user = await message.client.users.fetch(userId);
      const badge = userId === MAIN_OWNER_ID ? ' (principal)' : '';
      lines.push(`• **${user.tag}** \`${userId}\`${badge}`);
    } catch {
      lines.push(`• \`${userId}\` (introuvable)${userId === MAIN_OWNER_ID ? ' (principal)' : ''}`);
    }
  }

  return message.reply({
    embeds: [createEmbed('info', {
      title: `Liste des owners (${allOwners.length})`,
      description: lines.join('\n'),
    })],
  });
}
