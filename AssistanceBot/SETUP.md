# 🚀 Quick Setup Guide

## Step 1: Install Dependencies
```bash
npm install
```

## Step 2: Configure Bot
1. Edit `config.json`:
   ```json
   {
     "botToken": "YOUR_DISCORD_BOT_TOKEN",
     "ownerId": "YOUR_DISCORD_USER_ID"
   }
   ```

2. **Get Bot Token:**
   - Go to [Discord Developer Portal](https://discord.com/developers/applications)
   - Create new application → Bot → Copy token

3. **Get Your User ID:**
   - Enable Developer Mode in Discord
   - Right-click your profile → Copy ID

## Step 3: Invite Bot to Server
Use this URL (replace CLIENT_ID with your bot's client ID):
```
https://discord.com/api/oauth2/authorize?client_id=CLIENT_ID&permissions=274877908992&scope=bot
```

## Step 4: Start Bot
```bash
npm start
```

## Step 5: Add Farming Accounts
In Discord, use:
```
$add-token USER_TOKEN CHANNEL_ID
$toggle 0
$start-all
```

## ⚠️ Getting User Tokens
1. Open Discord in browser (not app)
2. Press F12 → Network tab
3. Send a message
4. Find API request → Headers → Authorization
5. Copy the token

**Warning:** Using user tokens violates Discord ToS!

## 📊 View Stats
```
$stats
```

## 🆘 Need Help?
- Check `README.md` for full documentation
- Look at `sent_commands.log` for errors
- Use `$help` for command list