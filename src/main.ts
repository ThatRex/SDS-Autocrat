import 'reflect-metadata'
import 'dotenv/config'
import { dirname, importx } from '@discordx/importer'
import type { Interaction, Message } from 'discord.js'
import { IntentsBitField } from 'discord.js'
import { Client } from 'discordx'

export const bot = new Client({
    // This will only add new commands to existing guilds unless in production
    botGuilds:
        process.env.NODE_ENV !== 'production'
            ? ['559178010838958090'] // [(client) => client.guilds.cache.map((guild) => guild.id)]
            : undefined,
    // Discord intents
    intents: [
        IntentsBitField.Flags.Guilds,
        // IntentsBitField.Flags.GuildMembers,
        // IntentsBitField.Flags.GuildMessages,
        // IntentsBitField.Flags.GuildMessageReactions,
        IntentsBitField.Flags.GuildVoiceStates
    ],
    // Debug logs are disabled in silent mode
    silent: false
    // Configuration for @SimpleCommand
    // simpleCommand: {
    //   prefix: "s!",
    // },
})

bot.once('ready', async () => {
    // Make sure all guilds are cached
    await bot.guilds.fetch()
    // Synchronize applications commands with Discord
    await bot.initApplicationCommands()
    // To clear all guild commands, uncomment this line,
    // This is useful when moving from guild commands to global commands
    // It must only be executed once
    // await bot.clearApplicationCommands(...bot.guilds.cache.map((g) => g.id))
    console.log('Bot started')
})

bot.on('interactionCreate', (interaction: Interaction) => {
    bot.executeInteraction(interaction)
})

bot.on('messageCreate', (message: Message) => {
    bot.executeCommand(message)
})

process.on('unhandledRejection', (error) => {
    console.error('Unhandled promise rejection: ', error)
})

async function run() {
    // The following syntax should be used in the ECMAScript environment
    await importx(dirname(import.meta.url) + '/{events,commands}/**/*.{ts,js}')
    // Let's start the bot
    if (!process.env.BOT_TOKEN) throw Error('Could not find BOT_TOKEN in your environment')
    // Log in with your bot token
    await bot.login(process.env.BOT_TOKEN)
}

run()
