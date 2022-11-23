import { NotBot } from '@discordx/utilities'
import {
    CommandInteraction,
    Role,
    GuildMember,
    GuildMemberRoleManager,
    DiscordAPIError
} from 'discord.js'
import { ApplicationCommandOptionType } from 'discord.js'
import { Discord, Guard, Slash, SlashChoice, SlashOption } from 'discordx'
import { PrismaClient } from '@prisma/client'
import console from 'console'

const prisma = new PrismaClient()

@Discord()
export class ManageRole {
    @Slash({ description: 'give or take a role' })
    @Guard(NotBot)
    async role(
        @SlashChoice('give', 'take')
        @SlashOption({
            name: 'action',
            description: 'action',
            required: true,
            type: ApplicationCommandOptionType.String
        })
        action: string,

        @SlashOption({
            name: 'member',
            description: 'member',
            required: true,
            type: ApplicationCommandOptionType.User
        })
        user: GuildMember,

        @SlashOption({
            name: 'role',
            description: 'role',
            required: true,
            type: ApplicationCommandOptionType.Role
        })
        role: Role,

        interaction: CommandInteraction
    ) {
        const roleToManage = role

        const manageableRoles = await prisma.manageableRoles.findMany({
            where: { roleId: roleToManage.id },
            select: { managerRoleId: true }
        })

        const canManageRole = manageableRoles.some((manageableRole) => {
            console.log('a')
            if (
                !(
                    interaction.member &&
                    interaction.member instanceof GuildMember &&
                    interaction.member.roles instanceof GuildMemberRoleManager
                )
            )
                return false
            return (
                interaction.member.permissions.has('ManageRoles', true) ||
                interaction.member.roles.cache.some(
                    (role) => role.id === manageableRole.managerRoleId
                )
            )
        })

        if (!canManageRole) return interaction.reply(`Sorry, you don't have permession to do that`)

        try {
            action === 'give'
                ? await user.roles.add(roleToManage)
                : await user.roles.remove(roleToManage)
            interaction.reply(
                `Role, ${roleToManage} has been ${
                    action === 'give' ? 'given to' : 'taken from'
                } ${user}`
            )
        } catch (err) {
            if (err instanceof DiscordAPIError)
                return interaction.reply(
                    err.code === 50001 ? `Sorry, I don't have permission to do that` : err.message
                )
        }
    }
}
