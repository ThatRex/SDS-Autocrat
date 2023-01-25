import type { ArgsOf } from 'discordx'
import { Discord, On } from 'discordx'

@Discord()
export class onJoin {
    @On({ event: 'voiceStateUpdate' })
    onJoin([oldState, newState]: ArgsOf<'voiceStateUpdate'>) {
        // To bypass discord bug where users cant send messages in voice text chats (when moved in) unless they have "ViewChannel" permissions.
        const member = oldState.member
        if (!member) return

        const channelTo = newState.channel
        const channelFrom = oldState.channel

        if (channelTo) {
            // Joining Channel
            const channel = channelTo
            const perms = channel.permissionsFor(member)
            const channelMemberOverwrite = channel.permissionOverwrites.cache.find(
                (overwrite) => overwrite.id === member.id
            )
            if (!perms.has('ViewChannel') && !channelMemberOverwrite)
                channel.permissionOverwrites.create(member, {
                    ViewChannel: true
                })
        }

        if (channelFrom) {
            // Leaving Channel
            const channel = channelFrom
            const perms = channel.permissionsFor(member)
            const channelMemberOverwrite = channel.permissionOverwrites.cache.find(
                (overwrite) => overwrite.id === member.id
            )
            if (
                perms.has('ViewChannel') &&
                channelMemberOverwrite &&
                channelMemberOverwrite.allow.has('ViewChannel') &&
                !channelMemberOverwrite.allow.toArray().filter((perm) => perm !== 'ViewChannel')
                    .length &&
                !channelMemberOverwrite.deny.toArray().length
            )
                channel.permissionOverwrites.delete(member)
        }
    }
}
