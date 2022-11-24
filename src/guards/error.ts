import type { GuardFunction } from 'discordx'
import type { CommandInteraction } from 'discord.js'

export const ErrorHandler: GuardFunction<CommandInteraction> = async (
    interaction,
    client,
    next
) => {
    try {
        await next()
    } catch (err) {
        if (err instanceof Error) return interaction.reply(err.message)
        console.error(err)
        interaction.reply('unknown error')
    }
}
