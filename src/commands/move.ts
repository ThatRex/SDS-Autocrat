import {
    ApplicationCommandOptionType,
    CommandInteraction,
    GuildChannel,
    GuildMember
} from 'discord.js'
import { Discord, Slash, SlashOption, Guard } from 'discordx'
import { NotBot } from '@discordx/utilities'
import { ErrorHandler } from '../guards/error.js'
import { IsGuild } from '../guards/isGuild.js'

@Discord()
@Guard(ErrorHandler, NotBot, IsGuild)
export class Move {
    @Slash({
        description: 'move everyone from the channel you are in to another channel',
        name: 'move'
    })
    async move(
        @SlashOption({
            description: 'voice channel to move to',
            name: 'voice-channel',
            required: true,
            type: ApplicationCommandOptionType.Channel
        })
        channelTo: GuildChannel,

        interaction: CommandInteraction
    ) {
        const member = interaction.member as GuildMember
        if (!member.permissions.has('MoveMembers'))
            throw new Error("Sorry, you don't have permession to do that")

        const channelFrom = member.voice.channel
        if (channelFrom === channelTo)
            throw new Error('You cant be moved to a channel you are already in')
        if (!channelFrom || !channelFrom.isVoiceBased())
            throw new Error('You are not in a voice channel')
        if (!channelTo.isVoiceBased()) throw new Error('Channel must be a voice channel')

        const membersToMove = channelFrom.members
        for (const [, member] of membersToMove) await member.voice.setChannel(channelTo)

        interaction.reply(`Moved membvers from ${channelFrom} to ${channelTo}`)
    }
}
