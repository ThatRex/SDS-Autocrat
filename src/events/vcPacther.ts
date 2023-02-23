import type { ArgsOf } from 'discordx'
import { Discord, On } from 'discordx'

@Discord()
export class VcPacther {
    @On({ event: 'voiceStateUpdate' })
    vcPacther([oldState, newState]: ArgsOf<'voiceStateUpdate'>) {
        //* This patches bug where users cant send messages or stream in voice text chats (when moved in) unless they have "ViewChannel" & "Connect" permissions
        //! `voiceStateUpdate` is also triggered when a user stop & starts streaming
        //? To prevent this from adding & removing a channel members override either deny any perm or add any non "ViewChannel" or "Connect" perm 

        const member = oldState.member
        const channelTo = newState.channel
        const channelFrom = oldState.channel

        if (!member || channelFrom === channelTo || !(channelTo || channelFrom)) return

        if (channelTo)
            (() => {
                // Joining Channel
                const channel = channelTo

                const channelMemberOverwrite = channel.permissionOverwrites.cache.find(
                    (overwrite) => overwrite.id === member.id
                )
                if (channelMemberOverwrite) return

                const perms = channel.permissionsFor(member)
                if (!perms.has('ViewChannel') || !perms.has('Connect'))
                    channel.permissionOverwrites.create(member, {
                        ViewChannel: true,
                        Connect: true
                    })
            })()

        if (channelFrom)
            (() => {
                // Leaving Channel
                const channel = channelFrom

                const perms = channel.permissionsFor(member)
                if (!(perms.has('ViewChannel') && perms.has('Connect'))) return

                const channelMemberOverwrite = channel.permissionOverwrites.cache.find(
                    (overwrite) => overwrite.id === member.id
                )
                if (!channelMemberOverwrite) return

                if (
                    !(channelMemberOverwrite.allow.has('ViewChannel') &&
                    channelMemberOverwrite.allow.has('Connect'))
                )
                    return

                if (
                    channelMemberOverwrite.allow
                        .toArray()
                        .filter((perm) => !['ViewChannel', 'Connect'].includes(perm)).length
                )
                    return

                if (channelMemberOverwrite.deny.toArray().length) return

                channel.permissionOverwrites.delete(member)
            })()
    }
}
