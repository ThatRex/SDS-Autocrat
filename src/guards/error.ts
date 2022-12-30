import { GuardFunction } from 'discordx'
import { CommandInteraction, DiscordAPIError } from 'discord.js'

export const ErrorHandler: GuardFunction<CommandInteraction> = async (
    interaction,
    client,
    next
) => {
    try {
        await next()
    } catch (err) {
        let errorMessage = 'unknown error'

        if (err instanceof DiscordAPIError) {
            errorMessage = [50001, 50013].some((val) => val === (err as DiscordAPIError).code)
                ? `Sorry, I don't have permission to do that`
                : err.message
        } else if (err instanceof Error) errorMessage = err.message

        console.error(`${interaction.commandName}: ${errorMessage}`)
        if (interaction.deferred) {
            interaction.editReply({ content: errorMessage })
        } else {
            interaction.reply({ content: errorMessage, ephemeral: true })
        }
    }
}
