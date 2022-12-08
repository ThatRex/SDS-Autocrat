import { CommandInteraction, GuildMember, DiscordAPIError } from 'discord.js'
import { ApplicationCommandOptionType } from 'discord.js'
import { Discord, Guard, Slash, SlashOption } from 'discordx'
import { PrismaClient } from '@prisma/client'
import { NotBot } from '@discordx/utilities'
import { ErrorHandler } from '../guards/error.js'
import { IsGuild } from '../guards/isGuild.js'

const prisma = new PrismaClient()

@Discord()
@Guard(ErrorHandler, NotBot, IsGuild)
export class mute {
    @Slash({ description: 'mute a member' })
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

        if (!member.permissions.has('ModerateMembers', true))
            throw new Error(`Sorry, you don't have permession to do that`)
        if (member.id === user.id) throw new Error(`Sorry, you can't mute yourself`)
        if (member.id === interaction.client.user.id) throw new Error(`Lol, nice try`)

        const guildConfig = await prisma.guildConfig.findUnique({
            where: { guildId: interaction.guild!.id }
        })
        const mutedRoleId = guildConfig?.mutedRoleId ?? undefined

        if (!mutedRoleId) throw new Error(`This server has no muted role set`)
        if (user.roles.cache.some((role) => role.id === mutedRoleId))
            throw new Error(`Member is already muted`)

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

        try {
            await user.roles.set([mutedRoleId])
        } catch (err) {
            if (err instanceof DiscordAPIError)
                return interaction.reply(
                    err.code === 50001 ? `Sorry, I don't have permission to do that` : err.message
                )
        }
        interaction.reply(`${user} is now muted`)
    }
}

@Discord()
@Guard(ErrorHandler, NotBot, IsGuild)
export class unmute {
    @Slash({ description: 'unmute a member' })
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
        if (!member.permissions.has('ModerateMembers', true))
            throw new Error(`Sorry, you don't have permession to do that`)
        if (member.id === user.id) throw new Error(`Sorry, you can't mute yourself`)
        if (member.id === interaction.client.user.id) throw new Error(`Lol, nice try`)

        const guildConfig = await prisma.guildConfig.findUnique({
            where: { guildId: interaction.guild!.id }
        })
        const mutedRoleId = guildConfig?.mutedRoleId ?? undefined

        if (!mutedRoleId) throw new Error(`This server has no muted role set`)
        if (!user.roles.cache.some((role) => role.id === mutedRoleId))
            throw new Error(`Member is not muted`)

        const guildId = interaction.guild!.id
        const userId = interaction.user.id
        const mutedMember = await prisma.mutedMember.findUnique({
            where: { userId_guildId: { guildId, userId } },
            select: { userRoleIds: true }
        })

        const mutedMemberRoles = mutedMember ? mutedMember.userRoleIds.split(';') : []

        try {
            await user.roles.set(mutedMemberRoles)
        } catch (err) {
            if (err instanceof DiscordAPIError)
                throw new Error(
                    err.code === 50001 ? `Sorry, I don't have permission to do that` : err.message
                )
        }
        interaction.reply(`${user} is now unmuted`)
    }
}
