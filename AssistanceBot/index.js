const { Client, GatewayIntentBits } = require('discord.js');
const fs = require('fs');
const path = require('path');
const handlers = require('./handlers');
const grinder = require('./grinder');

// Configuration
const CONFIG_PATH = path.join(__dirname, 'config.json');

// Load configuration
function loadConfig() {
    try {
        if (fs.existsSync(CONFIG_PATH)) {
            const data = fs.readFileSync(CONFIG_PATH, 'utf8');
            return JSON.parse(data);
        } else {
            // Create default config
            const defaultConfig = {
                bot\--verboseplaceholder',
                ownerId: 'YOUR_OWNER_ID_HERE'
            };
            fs.writeFileSync(CONFIG_PATH, JSON.stringify(defaultConfig, null, 2));
            console.log('Created default config.json - Please fill in your bot token and owner ID');
            return defaultConfig;
        }
    } catch (error) {
        console.error('Error loading config:', error.message);
        process.exit(1);
    }
}

// Initialize the bot
async function initializeBot() {
    const config = loadConfig();
    
    // Validate configuration
    if (!config.botToken || config.botToken === 'YOUR_BOT_TOKEN_HERE') {
        console.error('❌ Please set your bot token in config.json');
        process.exit(1);
    }
    
    if (!config.ownerId || config.ownerId === 'YOUR_OWNER_ID_HERE') {
        console.error('❌ Please set your owner ID in config.json');
        process.exit(1);
    }
    
    // Update access.json with owner ID
    const accessPath = path.join(__dirname, 'storage', 'access.json');
    try {
        const accessData = JSON.parse(fs.readFileSync(accessPath, 'utf8'));
        accessData.ownerId = config.ownerId;
        fs.writeFileSync(accessPath, JSON.stringify(accessData, null, 2));
    } catch (error) {
        console.error('Error updating access config:', error.message);
    }
    
    // Create Discord client
    const client = new Client({
        intents: [
            GatewayIntentBits.Guilds,
            GatewayIntentBits.GuildMessages,
            GatewayIntentBits.MessageContent,
            GatewayIntentBits.DirectMessages
        ]
    });
    
    // Bot ready event
    client.once('ready', async () => {
        console.log(`✅ Bot logged in as ${client.user.tag}`);
        console.log(`🔧 Owner ID: ${config.ownerId}`);
        console.log(`📝 Command prefix: ${handlers.PREFIX}`);
        console.log('🚀 Bot is ready to receive commands!');
        
        // Set bot status
        client.user.setActivity('Dank Memer farming', { type: 'WATCHING' });
        
        // Auto-start farming clients if any are marked as active
        console.log('🔄 Starting active farming clients...');
        const startedCount = await grinder.startAllClients();
        console.log(`✅ Started ${startedCount} farming clients`);
    });
    
    // Message event handler
    client.on('messageCreate', async (message) => {
        // Ignore bot messages
        if (message.author.bot) return;
        
        // Handle commands
        if (message.content.startsWith(handlers.PREFIX)) {
            await handlers.handleCommand(message);
        }
    });
    
    // Error handling
    client.on('error', (error) => {
        console.error('Discord client error:', error);
    });
    
    client.on('warn', (warning) => {
        console.warn('Discord client warning:', warning);
    });
    
    // Graceful shutdown
    process.on('SIGINT', async () => {
        console.log('\n🛑 Shutting down bot...');
        
        // Stop all farming clients
        const stoppedCount = await grinder.stopAllClients();
        console.log(`✅ Stopped ${stoppedCount} farming clients`);
        
        // Destroy main bot client
        client.destroy();
        console.log('✅ Bot shutdown complete');
        process.exit(0);
    });
    
    process.on('SIGTERM', async () => {
        console.log('\n🛑 Received SIGTERM, shutting down...');
        
        // Stop all farming clients
        const stoppedCount = await grinder.stopAllClients();
        console.log(`✅ Stopped ${stoppedCount} farming clients`);
        
        // Destroy main bot client
        client.destroy();
        console.log('✅ Bot shutdown complete');
        process.exit(0);
    });
    
    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
        console.error('Uncaught Exception:', error);
        process.exit(1);
    });
    
    process.on('unhandledRejection', (reason, promise) => {
        console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    });
    
    // Login to Discord
    try {
        await client.login(config.botToken);
    } catch (error) {
        console.error('❌ Failed to login to Discord:', error.message);
        process.exit(1);
    }
}

// Start the bot
console.log('🤖 Starting Dank Memer Bot...');
console.log('📁 Checking storage files...');

// Ensure storage directory exists
const storageDir = path.join(__dirname, 'storage');
if (!fs.existsSync(storageDir)) {
    fs.mkdirSync(storageDir, { recursive: true });
    console.log('✅ Created storage directory');
}

// Initialize and start the bot
initializeBot().catch((error) => {
    console.error('❌ Failed to initialize bot:', error);
    process.exit(1);
});
