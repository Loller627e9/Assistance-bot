const { Client } = require('discord.js-selfbot-v13');
const fs = require('fs');
const path = require('path');

const COMMAND_INTERVAL = 3000;
const CYCLE_INTERVAL = 45000;

const TOKENS_PATH = path.join(__dirname, 'storage', 'tokens.json');
const STATS_PATH = path.join(__dirname, 'storage', 'stats.json');
const LOG_PATH = path.join(__dirname, 'sent_commands.log');

const activeClients = new Map();

function logToFile(message) {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${message}\n`;
    fs.appendFileSync(LOG_PATH, logMessage);
    console.log(message);
}

function maskToken(token) {
    if (!token) return 'INVALID_TOKEN';
    return token.slice(0, 4) + '...' + token.slice(-4);
}

function loadStats() {
    try {
        return JSON.parse(fs.readFileSync(STATS_PATH, 'utf8'));
    } catch {
        return { stats: {} };
    }
}

function saveStats(stats) {
    fs.writeFileSync(STATS_PATH, JSON.stringify(stats, null, 2));
}

function parseCoins(content) {
    const walletMatch = content.match(/<:Coin:.*?>\s*([\d,]+)/);
    const bankMatch = content.match(/<:Bank:.*?>\s*([\d,]+)/);
    const wallet = walletMatch ? parseInt(walletMatch[1].replace(/,/g, '')) : 0;
    const bank = bankMatch ? parseInt(bankMatch[1].replace(/,/g, '')) : 0;
    return { wallet, bank };
}

function parseLoot(content) {
    const result = { animals: [], items: [] };
    const lootMatches = content.matchAll(/\*\*\d+ [<:a-zA-Z0-9]+:(\d+)> ([^\*\n]+)/g);
    for (const match of lootMatches) {
        const name = match[2].trim();
        if (content.includes('caught') || content.includes('hunting')) result.animals.push(name);
        else result.items.push(name);
    }

    if (result.animals.length === 0 && content.includes('caught a')) result.animals.push('Unknown Animal');
    if (result.items.length === 0 && content.includes('found a')) result.items.push('Unknown Item');
    return result;
}

function initializeStats(token, username) {
    const stats = loadStats();
    if (!stats.stats[token]) {
        stats.stats[token] = {
            name: username || maskToken(token),
            commands: 0,
            coins: 0,
            lastTotal: 0,
            catches: 0,
            items: 0,
            animals: 0,
            failures: 0
        };
        saveStats(stats);
    } else if (username && stats.stats[token].name !== username) {
        stats.stats[token].name = username;
        saveStats(stats);
    }
    return stats;
}

function updateStats(token, content) {
    const stats = loadStats();
    if (!stats.stats[token]) return;

    if (content.includes('<:Coin:') && content.includes('<:Bank:')) {
        const { wallet, bank } = parseCoins(content);
        const total = wallet + bank;
        if (total > stats.stats[token].lastTotal) {
            stats.stats[token].coins += total - stats.stats[token].lastTotal;
        }
        stats.stats[token].lastTotal = total;
    }

    const { animals, items } = parseLoot(content);
    stats.stats[token].animals += animals.length;
    stats.stats[token].items += items.length;
    stats.stats[token].catches += animals.length + items.length;

    saveStats(stats);
}

async function sendCommand(client, channelId, command) {
    const stats = loadStats();
    const \--verboseplaceholder.token;

    if (stats.stats[token]) {
        stats.stats[token].commands++;
        saveStats(stats);
    }

    try {
        const channel = await client.channels.fetch(channelId);
        if (!channel) throw new Error('Channel not found');
        await channel.send(command);
        logToFile(`[${maskToken(token)}] Sent command: ${command}`);
        return true;
    } catch (err) {
        logToFile(`[${maskToken(token)}] Command failed: ${err.message}`);
        stats.stats[token].failures++;
        saveStats(stats);
        return false;
    }
}

async function runCommandCycle(client, channelId) {
    if (!client.isReady()) return;
    const commands = ['pls beg', 'pls hunt', 'pls dig', 'pls bal'];
    for (const cmd of commands) {
        if (!client.isReady()) break;
        await sendCommand(client, channelId, cmd);
        await new Promise(res => setTimeout(res, COMMAND_INTERVAL));
    }

    if (client.isReady()) {
        setTimeout(() => runCommandCycle(client, channelId), CYCLE_INTERVAL);
    }
}

async function startClient(token, channelId) {
    if (activeClients.has(token)) return false;

    const client = new Client({ checkUpdate: false, readyStatus: false, syncStatus: false });

    client.on('ready', () => {
        logToFile(`Logged in as ${client.user.tag} (${maskToken(token)})`);
        initializeStats(token, client.user.username);
        runCommandCycle(client, channelId);
    });

    client.on('messageCreate', async (message) => {
        if (message.author.id !== '\--verboseplaceholder') return;
        if (message.channel.id !== channelId) return;
        if (message.reference?.messageId) {
            const reply = await message.channel.messages.fetch(message.reference.messageId);
            if (reply?.author.id === client.user.id) {
                let text = message.content || '';
                if (message.embeds.length) {
                    for (const embed of message.embeds) {
                        if (embed.description) text += ' ' + embed.description;
                        for (const f of embed.fields || []) {
                            text += ' ' + f.name + ' ' + f.value;
                        }
                    }
                }
                updateStats(token, text);
            }
        }
    });

    client.on('error', err => {
        logToFile(`Client error (${maskToken(token)}): ${err.message}`);
    });

    try {
        await client.login(token);
        activeClients.set(token, client);
        return true;
    } catch (e) {
        logToFile(`❌ Login failed for ${maskToken(token)} — ${e.message}`);
        return false;
    }
}

async function stopClient(token) {
    if (!activeClients.has(token)) return;
    const client = activeClients.get(token);
    client.destroy();
    activeClients.delete(token);
    logToFile(`Stopped client for ${maskToken(token)}`);
}

async function startAllClients(discordMsg = null) {
    const tokensData = JSON.parse(fs.readFileSync(TOKENS_PATH, 'utf8'));
    let started = 0;
    for (const t of tokensData.tokens) {
        if (t.active) {
            const success = await startClient(t.token, t.channelId);
            if (!success && discordMsg) {
                await discordMsg.channel.send(`❌ Login failed for ${maskToken(t.token)}`);
            } else if (success) {
                started++;
            }
        }
    }
    return started;
}

async function stopAllClients() {
    let stopped = 0;
    for (const token of activeClients.keys()) {
        await stopClient(token);
        stopped++;
    }
    return stopped;
}

function toggleToken(index) {
    const tokensData = JSON.parse(fs.readFileSync(TOKENS_PATH, 'utf8'));
    if (index < 0 || index >= tokensData.tokens.length) return false;

    tokensData.tokens[index].active = !tokensData.tokens[index].active;
    fs.writeFileSync(TOKENS_PATH, JSON.stringify(tokensData, null, 2));

    const \--verboseplaceholder.tokens[index].token;
    const channelId = tokensData.tokens[index].channelId;
    if (tokensData.tokens[index].active) {
        startClient(token, channelId);
    } else {
        stopClient(token);
    }
    return true;
}

function addToken(token, channelId) {
    const tokensData = JSON.parse(fs.readFileSync(TOKENS_PATH, 'utf8'));
    if (tokensData.tokens.find(t => t.token === token)) return false;
    tokensData.tokens.push({ token, channelId, active: false });
    fs.writeFileSync(TOKENS_PATH, JSON.stringify(tokensData, null, 2));
    return true;
}

function removeToken(index) {
    const tokensData = JSON.parse(fs.readFileSync(TOKENS_PATH, 'utf8'));
    if (index < 0 || index >= tokensData.tokens.length) return false;
    const \--verboseplaceholder.tokens[index].token;
    stopClient(token);
    tokensData.tokens.splice(index, 1);
    fs.writeFileSync(TOKENS_PATH, JSON.stringify(tokensData, null, 2));
    const stats = loadStats();
    delete stats.stats[token];
    saveStats(stats);
    return true;
}

function resetStats() {
    const tokensData = JSON.parse(fs.readFileSync(TOKENS_PATH, 'utf8'));
    const stats = { stats: {} };
    for (const t of tokensData.tokens) {
        stats.stats[t.token] = {
            name: maskToken(t.token),
            commands: 0,
            coins: 0,
            lastTotal: 0,
            catches: 0,
            items: 0,
            animals: 0,
            failures: 0
        };
    }
    fs.writeFileSync(STATS_PATH, JSON.stringify(stats, null, 2));
    return true;
}

function exportStats() {
    const stats = loadStats();
    const filename = `stats_export_${new Date().toISOString().replace(/:/g, '-')}.json`;
    const exportPath = path.join(__dirname, filename);
    fs.writeFileSync(exportPath, JSON.stringify(stats, null, 2));
    return exportPath;
}

function getAllStats() {
    return loadStats();
}

module.exports = {
    startClient,
    stopClient,
    startAllClients,
    stopAllClients,
    toggleToken,
    addToken,
    removeToken,
    resetStats,
    exportStats,
    getAllStats,
    maskToken
};

