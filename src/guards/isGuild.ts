import { CommandInteraction } from 'discord.js'
import { GuardFunction } from 'discordx'

export const IsGuild: GuardFunction<CommandInteraction> = async (interaction, client, next) => {
    if (!(interaction instanceof CommandInteraction && interaction.guild))
        return interaction.reply(`This command may not be used in DM`)
    await next()
}
