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
        dmPermission: false,
        defaultMemberPermissions: ['MoveMembers']
    })
    async move(
        @SlashOption({
            description: 'voice channel to move to',
            name: 'voice-channel',
            required: true,
            type: ApplicationCommandOptionType.Channel,
            channelTypes: [ChannelType.GuildVoice]
        })
        channelTo: BaseGuildVoiceChannel,

        interaction: CommandInteraction
    ) {
        await interaction.deferReply({ ephemeral: true })

        const member = interaction.member as GuildMember
        const channelFrom = member.voice.channel

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
