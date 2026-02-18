import { createEmbed } from '../utils/embeds.js';
import { getE } from '../utils/emojis.js';

// Parse "2d6", "1d20", "4d8+3"
function parseDice(expr) {
  const match = expr.toLowerCase().match(/^(\d*)d(\d+)([+-]\d+)?$/);
  if (!match) return null;
  const count = parseInt(match[1] || '1') || 1;
  const sides = parseInt(match[2]) || 6;
  const mod = match[3] ? parseInt(match[3]) : 0;
  if (count < 1 || count > 100) return null;
  if (sides < 2 || sides > 1000) return null;
  return { count, sides, mod };
}

function roll(sides) {
  return Math.floor(Math.random() * sides) + 1;
}

export default {
  data: {
    name: 'dice',
    description: 'Lancer des dés (ex: 2d6, 1d20, 4d8+3)',
  },
  execute: async (message, args) => {
    const e = getE(message.guild);
    const expr = args[0] || '1d6';
    const parsed = parseDice(expr);

    if (!parsed) {
      const errorEmbed = createEmbed('error', {
        title: 'Format invalide',
        description: 'Utilise le format `XdY` ou `XdY+Z`\nExemples: `1d6`, `2d20`, `4d8+3`',
      });
      return message.reply({ embeds: [errorEmbed] });
    }

    const { count, sides, mod } = parsed;
    const rolls = [];
    let total = 0;
    for (let i = 0; i < count; i++) {
      const r = roll(sides);
      rolls.push(r);
      total += r;
    }
    total += mod;

    const rollsStr = count <= 10 ? rolls.join(', ') : `${rolls.slice(0, 5).join(', ')}... (+${count - 5} autres)`;
    const modStr = mod !== 0 ? ` ${mod > 0 ? '+' : ''}${mod}` : '';
    const desc = count <= 10
      ? `**${expr}** → [${rollsStr}]${modStr} = **${total}**`
      : `**${expr}** → ${count} dés, total = **${total}**`;

    const embed = createEmbed('default', {
      title: `${e.dice} Lancer de dés`,
      description: desc,
    });

    message.reply({ embeds: [embed] });
  },
};
