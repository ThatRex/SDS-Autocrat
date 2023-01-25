import {
    ApplicationCommandOptionType,
    BaseGuildVoiceChannel,
    ChannelType,
    CommandInteraction,
    GuildMember
} from 'discord.js'
import { Discord, Slash, SlashOption, Guard } from 'discordx'
import { NotBot } from '@discordx/utilities'
import { ErrorHandler } from '../guards/error.js'

@Discord()
@Guard(ErrorHandler, NotBot)
export class Move {
    @Slash({
        description: 'move everyone from the channel you are in to another channel',
        name: 'move',
        dmPermission: false
    })
    async move(
        @SlashOption({
            description: 'voice channel to move to',
            name: 'voice-channel-to',
            required: true,
            type: ApplicationCommandOptionType.Channel,
            channelTypes: [ChannelType.GuildVoice]
        })
        channelTo: BaseGuildVoiceChannel,

        @SlashOption({
            description: 'voice channel to move from',
            name: 'voice-channel-from',
            type: ApplicationCommandOptionType.Channel,
            channelTypes: [ChannelType.GuildVoice]
        })
        channelFrom: BaseGuildVoiceChannel,

        interaction: CommandInteraction
    ) {
        await interaction.deferReply({ ephemeral: true })

        const member = interaction.member as GuildMember
        channelFrom = channelFrom ?? member.voice.channel

        const canMoveMembers =
            member.permissions.has('MoveMembers') ||
            (channelFrom.permissionsFor(member).has('MoveMembers') &&
                channelTo.permissionsFor(member).has('MoveMembers'))

        if (!canMoveMembers) throw new Error("Sorry, you don't have permession to do that")
        if (!channelFrom || !channelFrom.isVoiceBased())
            throw Error('You are not in a voice channel')
        if (channelTo === channelFrom)
            throw Error(`You cant be moved to a channel you are already in`)
        if (!channelTo.isVoiceBased()) throw Error('Channel must be a voice channel')

        await Promise.all(
            Array.from(channelFrom.members.values()).map((member) =>
                member.voice.setChannel(channelTo)
            )
        )

        await interaction.editReply(`Moved members from ${channelFrom} to ${channelTo}`)
    }
}
