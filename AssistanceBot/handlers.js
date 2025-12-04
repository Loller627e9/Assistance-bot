const { EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');
const grinder = require('./grinder');

const ACCESS_PATH = path.join(__dirname, 'storage', 'access.json');
const TOKENS_PATH = path.join(__dirname, 'storage', 'tokens.json');
const PREFIX = '$';

// Permissions
function loadAccess() {
    try {
        return JSON.parse(fs.readFileSync(ACCESS_PATH, 'utf8'));
    } catch {
        return { ownerId: '', authorizedUsers: [] };
    }
}

function saveAccess(data) {
    try {
        fs.writeFileSync(ACCESS_PATH, JSON.stringify(data, null, 2));
        return true;
    } catch {
        return false;
    }
}

function hasPermission(userId) {
    const access = loadAccess();
    return userId === access.ownerId || access.authorizedUsers.includes(userId);
}

function loadTokens() {
    try {
        return JSON.parse(fs.readFileSync(TOKENS_PATH, 'utf8'));
    } catch {
        return { tokens: [] };
    }
}

function formatNumber(n) {
    return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

// 📊 STATS EMBED
function createStatsEmbed() {
    const stats = grinder.getAllStats();
    const tokens = loadTokens();
    const embed = new EmbedBuilder().setTitle('📊 Farming Stats').setColor(0x00AE86).setTimestamp();

    if (!stats.stats || Object.keys(stats.stats).length === 0) {
        return embed.setDescription('No stats yet.');
    }

    let desc = '```ml\n';
    desc += 'Idx Name         💰Coins   ⚔️Cmds 📦Items 🐾Animals ❌Fails\n';
    desc += '─── ──────────── ──────── ────── ─────── ───────── ─────\n';

    tokens.tokens.forEach((t, i) => {
        const s = stats.stats[t.token];
        if (!s) return;
        const index = i.toString().padEnd(3);
        const name = s.name.slice(0, 12).padEnd(13);
        const coins = formatNumber(s.coins).padEnd(8);
        const cmds = s.commands.toString().padEnd(6);
        const items = s.items.toString().padEnd(6);
        const animals = s.animals.toString().padEnd(8);
        const fails = s.failures.toString().padEnd(5);
        desc += `${index} ${name} ${coins} ${cmds} ${items} ${animals} ${fails}\n`;
    });

    desc += '```';
    embed.setDescription(desc);

    const total = Object.values(stats.stats).reduce((a, s) => ({
        coins: a.coins + s.coins,
        commands: a.commands + s.commands,
        items: a.items + s.items,
        animals: a.animals + s.animals,
        failures: a.failures + s.failures
    }), { coins: 0, commands: 0, items: 0, animals: 0, failures: 0 });

    embed.addFields(
        {
            name: '📈 Totals',
            value: `**💰 Coins:** ${formatNumber(total.coins)}\n**⚔️ Cmds:** ${total.commands}\n**📦 Items:** ${total.items}\n**🐾 Animals:** ${total.animals}\n**❌ Fails:** ${total.failures}`,
            inline: true
        },
        {
            name: '🔄 Status',
            value: `**Active:** ${tokens.tokens.filter(t => t.active).length}/${tokens.tokens.length}`,
            inline: true
        }
    );

    return embed;
}

function createHelpEmbed() {
    return new EmbedBuilder()
        .setTitle('🤖 Dank Memer Bot Commands')
        .setColor(0x00AE86)
        .setDescription('Admin commands for managing Dank Memer farming accounts')
        .addFields(
            { name: '📊 Stats & Info', value: '```$help\n$stats```' },
            { name: '🔧 Token Management', value: '```$add-token <token> <channelId>\n$remove-token <index>\n$toggle <index>```' },
            { name: '⚡ Control', value: '```$start-all\n$stop-all```' },
            { name: '👥 Access', value: '```$grant <@user>\n$revoke <@user>```' },
            { name: '💾 Data', value: '```$reset-stats\n$export-stats```' }
        )
        .setFooter({ text: 'Use $ before each command' })
        .setTimestamp();
}

async function handleCommand(message) {
    if (!message.content.startsWith(PREFIX)) return;
    if (!hasPermission(message.author.id)) return message.reply('❌ No permission.');

    const args = message.content.slice(PREFIX.length).trim().split(/ +/);
    const cmd = args.shift().toLowerCase();

    try {
        switch (cmd) {
            case 'help': return message.reply({ embeds: [createHelpEmbed()] });
            case 'stats': return message.reply({ embeds: [createStatsEmbed()] });

            case 'add-token':
                if (args.length < 2) return message.reply('❌ Usage: `$add-token <token> <channelId>`');
                const [token, channelId] = args;
                const added = grinder.addToken(token, channelId);
                if (!added) return message.reply('❌ Failed to add token.');
                const login = await grinder.startClient(token, channelId);
                return login
                    ? message.reply(`✅ Added and logged in \`${grinder.maskToken(token)}\``)
                    : message.reply(`❌ Login failed for \`${grinder.maskToken(token)}\``);

            case 'remove-token':
                const removeIndex = parseInt(args[0]);
                if (isNaN(removeIndex)) return message.reply('❌ Invalid index.');
                return grinder.removeToken(removeIndex)
                    ? message.reply(`✅ Removed token at index ${removeIndex}`)
                    : message.reply('❌ Failed to remove token.');

            case 'toggle':
                const toggleIndex = parseInt(args[0]);
                if (isNaN(toggleIndex)) return message.reply('❌ Invalid index.');
                const data = loadTokens();
                const t = data.tokens[toggleIndex];
                if (!t) return message.reply('❌ Index not found.');
                t.active = !t.active;
                fs.writeFileSync(TOKENS_PATH, JSON.stringify(data, null, 2));
                if (t.active) {
                    const s = await grinder.startClient(t.token, t.channelId);
                    return message.reply(s
                        ? `✅ Activated ${grinder.maskToken(t.token)}`
                        : `❌ Login failed for ${grinder.maskToken(t.token)}`);
                } else {
                    await grinder.stopClient(t.token);
                    return message.reply(`🛑 Deactivated ${grinder.maskToken(t.token)}`);
                }

            case 'start-all':
                const count = await grinder.startAllClients(message);
                return message.reply(`✅ Started ${count} clients.`);

            case 'stop-all':
                const stop = await grinder.stopAllClients();
                return message.reply(`🛑 Stopped ${stop} clients.`);

            case 'grant':
                const grantId = args[0]?.replace(/[<@!>]/g, '');
                if (!grantId) return message.reply('❌ Usage: `$grant <@user>`');
                const access = loadAccess();
                if (access.authorizedUsers.includes(grantId)) return message.reply('❌ Already has access.');
                access.authorizedUsers.push(grantId);
                return saveAccess(access)
                    ? message.reply(`✅ Granted access to <@${grantId}>`)
                    : message.reply('❌ Failed to grant.');

            case 'revoke':
                const revokeId = args[0]?.replace(/[<@!>]/g, '');
                if (!revokeId) return message.reply('❌ Usage: `$revoke <@user>`');
                const a = loadAccess();
                const i = a.authorizedUsers.indexOf(revokeId);
                if (i === -1) return message.reply('❌ Not authorized.');
                a.authorizedUsers.splice(i, 1);
                return saveAccess(a)
                    ? message.reply(`✅ Revoked access from <@${revokeId}>`)
                    : message.reply('❌ Failed to revoke.');

            case 'reset-stats':
                return grinder.resetStats()
                    ? message.reply('✅ Stats reset.')
                    : message.reply('❌ Failed to reset stats.');

            case 'export-stats':
                const exp = grinder.exportStats();
                return exp
                    ? message.reply(`📁 Exported: \`${require('path').basename(exp)}\``)
                    : message.reply('❌ Export failed.');

            default:
                return message.reply('❌ Unknown command. Use `$help`.');
        }
    } catch (err) {
        console.error(`[CMD ERROR] ${cmd}:`, err);
        return message.reply('❌ Internal error.');
    }
}

module.exports = {
    handleCommand,
    hasPermission,
    PREFIX
};
