# 🤖 Dank Memer Bot

A powerful Node.js Discord bot that manages multiple Dank Memer accounts using `discord.js-selfbot-v13`, with a real admin bot interface via `discord.js` v14.

## ✅ Features

- **Multi-Account Farming**: Automate Dank Memer commands across multiple user tokens
- **Real-time Statistics**: Track coins, items, animals, catches, and failures per token
- **Admin Interface**: Control everything through Discord commands with a real bot
- **Persistent Storage**: All data saved to JSON files with automatic backups
- **Safety Features**: Token masking, error handling, and graceful shutdowns
- **Access Control**: Owner and authorized user permissions

## 🛠 Technology Stack

- **discord.js v14**: Real bot client for admin commands
- **discord.js-selfbot-v13**: User account automation
- **Node.js fs module**: JSON file storage
- **Comprehensive logging**: All actions logged to files

## 📦 Installation

1. **Clone or download** this repository
2. **Install dependencies**:
   ```bash
   npm install
   ```
3. **Configure the bot** (see Configuration section)
4. **Start the bot**:
   ```bash
   npm start
   ```

## ⚙️ Configuration

### 1. Bot Setup

When you first run the bot, it will create a `config.json` file:

```json
{
  "botToken": "YOUR_BOT_TOKEN_HERE",
  "ownerId": "YOUR_OWNER_ID_HERE"
}
```

**Fill in:**
- `botToken`: Your Discord bot token from [Discord Developer Portal](https://discord.com/developers/applications)
- `ownerId`: Your Discord user ID (enable Developer Mode in Discord, right-click your profile → Copy ID)

### 2. Bot Permissions

Your Discord bot needs these permissions:
- Read Messages
- Send Messages
- Use Slash Commands
- Embed Links
- Read Message History

### 3. Adding Farming Accounts

Use the `$add-token` command to add user tokens:
```
$add-token USER_TOKEN_HERE CHANNEL_ID_HERE
```

**To get user tokens:**
1. Open Discord in browser (not app)
2. Press F12 → Network tab
3. Send any message
4. Look for API calls, find Authorization header
5. Copy the token (starts with "mfa." or similar)

⚠️ **Warning**: Using user tokens violates Discord ToS. Use at your own risk.

## 🔄 Farming System

### Automated Commands
Each active token automatically runs:
- `pls beg` - Every 3 seconds
- `pls hunt` - Every 3 seconds  
- `pls dig` - Every 3 seconds
- `pls bal` - Every 3 seconds

**Timing:**
- 3 seconds between individual commands
- 45 seconds between full command cycles
- Automatic retry on failures

### Loot Detection
The bot automatically detects and tracks:

**Animals:** Rabbit, Duck, Boar, Deer, Skunk, Dragon
**Items:** Pepe Statue, Fishing Trophy, Trivia Trophy, Meme Box, Water Bucket, Coin Bomb

### Coin Tracking
- Parses wallet and bank amounts from `pls bal`
- Only counts increases (ignores spending)
- Tracks total earned coins per account

## 📊 Admin Commands

All commands use the `$` prefix:

### 📈 Stats & Info
- `$help` - Show command list
- `$stats` - View detailed farming statistics

### 🔧 Token Management  
- `$add-token <token> <channelId>` - Add new farming account
- `$remove-token <index>` - Remove account by index
- `$toggle <index>` - Toggle account active/inactive

### ⚡ Control
- `$start-all` - Start all active farming accounts
- `$stop-all` - Stop all running accounts

### 👥 Access Management
- `$grant <@user>` - Give command access to user
- `$revoke <@user>` - Remove command access

### 💾 Data Management
- `$reset-stats` - Clear all statistics
- `$export-stats` - Export stats to timestamped file

## 📁 File Structure

```
dank-memer-bot/
├── index.js              # Main bot entry point
├── grinder.js            # Farming logic for selfbots
├── handlers.js           # Admin command handlers
├── package.json          # Dependencies
├── config.json           # Bot configuration
├── sent_commands.log     # Command execution log
├── storage/
│   ├── tokens.json       # Token storage
│   ├── stats.json        # Statistics storage
│   └── access.json       # Access permissions
└── README.md            # This file
```

## 💾 Data Storage

### tokens.json
```json
{
  "tokens": [
    {
      "token": "USER_TOKEN_HERE",
      "channelId": "CHANNEL_ID_HERE", 
      "active": true
    }
  ]
}
```

### stats.json
```json
{
  "stats": {
    "TOKEN_HASH": {
      "name": "Username",
      "commands": 1250,
      "coins": 50000,
      "lastTotal": 75000,
      "catches": 25,
      "items": 10,
      "animals": 15,
      "failures": 2
    }
  }
}
```

### access.json
```json
{
  "ownerId": "YOUR_USER_ID",
  "authorizedUsers": ["USER_ID_1", "USER_ID_2"]
}
```

## 🛡️ Safety Features

### Token Security
- All tokens are masked in logs (shows only first/last 4 characters)
- Tokens never appear in error messages
- Secure file storage with proper permissions

### Error Handling
- Individual account failures don't crash the bot
- Automatic retry mechanisms
- Comprehensive error logging
- Graceful shutdown procedures

### Rate Limiting
- Built-in delays between commands
- Respects Discord rate limits
- Automatic backoff on errors

## 🌐 Hosting

### Local Development
```bash
node index.js
```

### Termux (Android)
```bash
pkg install nodejs
npm install
npm start
```

### VPS/Cloud Hosting
```bash
# Install Node.js 16+
npm install --production
npm start

# For production with PM2:
npm install -g pm2
pm2 start index.js --name "dank-memer-bot"
pm2 save
pm2 startup
```

### Docker
```dockerfile
FROM node:16-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY . .
CMD ["npm", "start"]
```

## 🔧 Troubleshooting

### Common Issues

**Bot won't start:**
- Check `config.json` has valid bot token and owner ID
- Ensure bot has proper permissions in Discord server

**Farming not working:**
- Verify user tokens are valid and not expired
- Check channel IDs are correct
- Ensure Dank Memer is in the target channels

**Commands not responding:**
- Verify you have permission (owner or authorized user)
- Check bot can read/send messages in the channel
- Try `$help` to test basic functionality

**Stats not updating:**
- Ensure farming accounts are active (`$stats` shows status)
- Check `sent_commands.log` for errors
- Verify Dank Memer is responding to commands

### Logs

Check these files for debugging:
- `sent_commands.log` - All command executions and errors
- Console output - Real-time bot status
- `storage/stats.json` - Current statistics

## ⚠️ Disclaimers

1. **Discord ToS**: Using user tokens violates Discord's Terms of Service
2. **Account Risk**: Your accounts may be banned or restricted
3. **Use Responsibly**: Don't spam or abuse Discord's services
4. **No Warranty**: This software is provided as-is without guarantees

## 📄 License

This project is for educational purposes only. Use at your own risk.

## 🤝 Contributing

Feel free to submit issues, feature requests, or pull requests to improve the bot.

---

**Happy farming! 🚜💰**