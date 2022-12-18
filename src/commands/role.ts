import { CommandInteraction, Role, GuildMember } from 'discord.js'
import { ApplicationCommandOptionType } from 'discord.js'
import { Discord, Guard, Slash, SlashGroup, SlashOption } from 'discordx'
import { PrismaClient } from '@prisma/client'
import { ErrorHandler } from '../guards/error.js'
import { NotBot } from '@discordx/utilities'
import { IsGuild } from '../guards/isGuild.js'

const prisma = new PrismaClient()

@Discord()
@SlashGroup({ name: 'role', description: 'give or take a role', dmPermission: false })
@SlashGroup('role')
@Guard(ErrorHandler, NotBot, IsGuild)
export class role {
    @Slash({ description: 'give a role' })
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
    const member = interaction.member as GuildMember
    const manageableRoles = await prisma.manageableRole.findMany({
        where: { roleId: role.id },
        select: { managerRoleId: true }
    })

    const canManageRole =
        member.permissions.has('ManageRoles', true) ||
        manageableRoles.some((manageableRole: { [key: string]: string }) =>
            (interaction.member as GuildMember).roles.cache.some(
                (role) => role.id === manageableRole.managerRoleId
            )
        )

    if (!canManageRole) throw Error(`Sorry, you don't have permession to do that`)

    action === 'give' ? await user.roles.add(role) : await user.roles.remove(role)
    return interaction.reply(
        `Role, ${role} ${action === 'give' ? 'given to' : 'taken from'} ${user}`
    )
}
