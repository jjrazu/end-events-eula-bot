# End Events EULA Discord Bot

A Discord.js v14 bot for the End Events scripted SMP.

## Features

- 📄 View EULA button opens the supplied Google Drive PDF.
- ✅ I Agree button gives the EULA Accepted role.
- 📋 Logs every acceptance to a staff channel.
- 🕐 Logs the Discord username, user ID, and exact acceptance time.
- `/eula setup` posts the EULA panel.
- `/eula status member:@user` checks acceptance.
- `/eula revoke member:@user` removes the EULA role.
- Uses Discord slash commands and buttons.

## Requirements

- Node.js 18 or newer
- A Discord bot application
- A Discord server where you can manage roles/channels

## 1. Create the bot

Go to the Discord Developer Portal:
https://discord.com/developers/applications

Create an application, then create a Bot for it.

Copy the bot token. Keep it private. Never post it publicly.

## 2. Invite the bot

Invite it using OAuth2 with these scopes:

- `bot`
- `applications.commands`

The bot needs these permissions:

- View Channels
- Send Messages
- Embed Links
- Read Message History
- Manage Roles

The bot's highest role must be ABOVE the `EULA Accepted` role.

## 3. Configure .env

Copy `.env.example` to `.env` and fill in:

DISCORD_TOKEN=your bot token
GUILD_ID=your End Events server ID
EULA_ROLE_ID=the EULA Accepted role ID
LOG_CHANNEL_ID=the EULA log channel ID

## 4. Install and run

Open a terminal in this folder:

npm install
npm start

## 5. Post the panel

In your End Events EULA channel, run:

/eula setup

The bot will post the panel with:

[ 📄 View EULA ] [ ✅ I Agree ]

The View EULA button opens:

https://drive.google.com/file/d/1mR-ZO-g9CzEy6XDqcXE9agG15NMA010Z/view?usp=sharing

## 24/7 hosting

Upload this project to a Node.js hosting provider that supports persistent Discord bots.

Set the environment variables from `.env` in the host's environment-variable settings, then use:

npm install
npm start

Do not upload your real `.env` file or expose your bot token.

## Important

The bot records acceptance by giving the member the EULA Accepted role and sending an acceptance log to the configured log channel.

For a legal agreement, make sure your final terms are appropriate for your jurisdiction and intended participants.
