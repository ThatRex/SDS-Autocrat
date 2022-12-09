import { CommandInteraction, GuildMember } from 'discord.js'
import { ApplicationCommandOptionType } from 'discord.js'
import { Discord, Guard, Slash, SlashOption } from 'discordx'
import { PrismaClient } from '@prisma/client'
import { NotBot } from '@discordx/utilities'
import { ErrorHandler } from '../guards/error.js'

const prisma = new PrismaClient()

@Discord()
@Guard(ErrorHandler, NotBot)
export class mute {
    @Slash({
        description: 'mute a member',
        dmPermission: false,
        defaultMemberPermissions: ['ModerateMembers']
    })
    async mute(
        @SlashOption({
            name: 'member',
            description: 'member',
            required: true,
            type: ApplicationCommandOptionType.User
        })
        user: GuildMember,

        interaction: CommandInteraction
    ) {
        const member = interaction.member as GuildMember

        if (member.id === user.id) throw Error(`Sorry, you can't mute yourself`)
        if (member.id === interaction.client.user.id) throw Error(`Lol, nice try`)

        const guildConfig = await prisma.guildConfig.findUnique({
            where: { guildId: interaction.guild!.id }
        })
        const mutedRoleId = guildConfig?.mutedRoleId ?? undefined

        if (!mutedRoleId) throw Error(`This server has no muted role set`)
        if (user.roles.cache.some((role) => role.id === mutedRoleId))
            throw Error(`Member is already muted`)

        const userRoles: string[] = []
        user.roles.cache.forEach((role) => {
            userRoles.push(role.id)
        })

        const guildId = interaction.guild!.id
        const userId = interaction.user.id
        const data = {
            guildId,
            userId,
            userRoleIds: userRoles.join(';')
        }
        await prisma.mutedMember.upsert({
            where: {
                userId_guildId: { guildId, userId }
            },
            create: data,
            update: data
        })

        await user.roles.set([mutedRoleId])
        interaction.reply(`${user} is now muted`)
    }
}

@Discord()
@Guard(ErrorHandler, NotBot)
export class unmute {
    @Slash({
        description: 'unmute a member',
        dmPermission: false,
        defaultMemberPermissions: ['ModerateMembers']
    })
    async unmute(
        @SlashOption({
            name: 'member',
            description: 'member',
            required: true,
            type: ApplicationCommandOptionType.User
        })
        user: GuildMember,

        interaction: CommandInteraction
    ) {
        const member = interaction.member as GuildMember

        if (member.id === user.id) throw Error(`Sorry, you can't mute yourself`)
        if (member.id === interaction.client.user.id) throw Error(`Lol, nice try`)

        const guildConfig = await prisma.guildConfig.findUnique({
            where: { guildId: interaction.guild!.id }
        })
        const mutedRoleId = guildConfig?.mutedRoleId ?? undefined

        if (!mutedRoleId) throw Error(`This server has no muted role set`)
        if (!user.roles.cache.some((role) => role.id === mutedRoleId))
            throw Error(`Member is not muted`)

        const guildId = interaction.guild!.id
        const userId = interaction.user.id
        const mutedMember = await prisma.mutedMember.findUnique({
            where: { userId_guildId: { guildId, userId } },
            select: { userRoleIds: true }
        })

        const mutedMemberRoles = mutedMember ? mutedMember.userRoleIds.split(';') : []
        await user.roles.set(mutedMemberRoles)
        interaction.reply(`${user} is now unmuted`)
    }
}
