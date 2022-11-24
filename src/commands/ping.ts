import { NotBot } from '@discordx/utilities'
import {
    CommandInteraction,
    Role,
    GuildMember,
    GuildMemberRoleManager,
    DiscordAPIError
} from 'discord.js'
import { Discord, Guard, Slash } from 'discordx'

@Discord()
export class ping {
    @Slash({ description: 'ping' })
    @Guard(NotBot)
    async ping(interaction: CommandInteraction) {
        interaction.reply('pong')
    }
}
