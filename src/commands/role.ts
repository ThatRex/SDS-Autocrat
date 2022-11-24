import { NotBot } from '@discordx/utilities'
import {
    CommandInteraction,
    Role,
    GuildMember,
    GuildMemberRoleManager,
    DiscordAPIError
} from 'discord.js'
import { ApplicationCommandOptionType } from 'discord.js'
import { Discord, Guard, Slash, SlashGroup, SlashOption } from 'discordx'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

@Discord()
@SlashGroup({ name: 'role', description: 'give or take a role' })
@SlashGroup('role')
export class role {
    @Slash({ description: 'give a role' })
    @Guard(NotBot)
    async give(
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
        await roleManage(interaction, 'give', role, user)
    }
    @Slash({ description: 'take a role' })
    @Guard(NotBot)
    async take(
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
        await roleManage(interaction, 'take', role, user)
    }
}

async function roleManage(
    interaction: CommandInteraction,
    action: 'give' | 'take',
    role: Role,
    user: GuildMember
) {
    const manageableRoles = await prisma.manageableRoles.findMany({
        where: { roleId: role.id },
        select: { managerRoleId: true }
    })

    const canManageRole = manageableRoles.some((manageableRole) => {
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
            interaction.member.roles.cache.some((role) => role.id === manageableRole.managerRoleId)
        )
    })

    if (!canManageRole) return interaction.reply(`Sorry, you don't have permession to do that`)

    try {
        action === 'give' ? await user.roles.add(role) : await user.roles.remove(role)
        interaction.reply(`Role, ${role} ${action === 'give' ? 'given to' : 'taken from'} ${user}`)
    } catch (err) {
        if (err instanceof DiscordAPIError)
            return interaction.reply(
                err.code === 50001 ? `Sorry, I don't have permission to do that` : err.message
            )
    }
}
