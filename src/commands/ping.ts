import { NotBot } from '@discordx/utilities'
import { CommandInteraction } from 'discord.js'
import { Discord, Guard, Slash } from 'discordx'
import { ErrorHandler } from '../guards/error.js'

@Discord()
@Guard(ErrorHandler, NotBot)
export class ping {
    @Slash({ description: 'ping' })
    ping(interaction: CommandInteraction) {
        interaction.reply('pong')
    }
}
