import {
    CommandInteraction,
    Role,
    GuildMember,
    ApplicationCommandType,
    UserContextMenuCommandInteraction
} from 'discord.js'
import { ApplicationCommandOptionType } from 'discord.js'
import { ContextMenu, Discord, Guard, Slash, SlashGroup, SlashOption } from 'discordx'
import { PrismaClient } from '@prisma/client'
import { ErrorHandler } from '../guards/error.js'
import { NotBot } from '@discordx/utilities'
import { IsGuild } from '../guards/isGuild.js'

const prisma = new PrismaClient()

@Discord()
@SlashGroup({ name: 'role', description: 'manage roles', dmPermission: false })
@SlashGroup('role')
@Guard(ErrorHandler, NotBot, IsGuild)
export class role {
    @Slash({ name: 'toggle', description: 'give or take a role' })
    async toggle(
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
        await roleManage(interaction, 'toggle', role, user)
    }

    @ContextMenu({
        name: 'Toggle @Calls Approved',
        type: ApplicationCommandType.User,
        dmPermission: false,
        guilds: ['953475156309856256']
    })
    async toggleContextMenu(interaction: UserContextMenuCommandInteraction) {
        const role = interaction.guild!.roles.cache.get('1036651254211936256')
        if (!role) throw Error('Calls Approved role not found.')
        const member = interaction.targetMember as GuildMember
        await roleManage(interaction, 'toggle', role, member)
    }
}

async function roleManage(
    interaction: CommandInteraction | UserContextMenuCommandInteraction,
    action: 'give' | 'take' | 'toggle',
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

    if (!canManageRole) throw Error(`Sorry, you don't have permission to do that`)

    if (action === 'toggle')
        action = (await user.roles.cache.some((memberRole) => memberRole.id === role.id))
            ? 'take'
            : 'give'

    action === 'give' ? await user.roles.add(role) : await user.roles.remove(role)
    return interaction.reply({
        content: `Role, ${role} ${action === 'give' ? 'given to' : 'taken from'} ${user}`,
        ephemeral: true
    })
}
