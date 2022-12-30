import { CommandInteraction, Role } from 'discord.js'
import { ApplicationCommandOptionType } from 'discord.js'
import { Discord, Guard, Slash, SlashGroup, SlashOption } from 'discordx'
import { PrismaClient } from '@prisma/client'
import { ErrorHandler } from '../guards/error.js'
import { NotBot } from '@discordx/utilities'

const prisma = new PrismaClient()

@Discord()
@SlashGroup({
    name: 'config',
    description: 'configure me',
    dmPermission: false,
    defaultMemberPermissions: ['Administrator']
})
@SlashGroup('config')
@Guard(ErrorHandler, NotBot)
export class config {}

// @Discord()
// @SlashGroup({ name: 'mute', description: 'configure me', root: 'config' })
// @SlashGroup('mute', 'config')
// @Guard(ErrorHandler, NotBot)
// export class role {
//     @Slash({ description: 'configure muted role' })
//     async role(
//         @SlashOption({
//             name: 'role',
//             description: 'role',
//             required: true,
//             type: ApplicationCommandOptionType.Role
//         })
//         role: Role,

//         interaction: CommandInteraction
//     ) {
//         await prisma.guildConfig.upsert({
//             where: { guildId: interaction.guild!.id },
//             update: { mutedRoleId: role.id },
//             create: { guildId: interaction.guild!.id, mutedRoleId: role.id }
//         })

//         interaction.reply({ content: `Muted role set to ${role}`, ephemeral: true })
//     }
// }

@Discord()
@SlashGroup({
    name: 'manageable-roles',
    description: 'configure manageable roles',
    root: 'config'
})
@SlashGroup('manageable-roles', 'config')
@Guard(ErrorHandler, NotBot)
export class manageableRoles {
    @Slash({ description: 'list all manageable roles' })
    async list(interaction: CommandInteraction) {
        const guildRoles: string[] = []
        interaction.guild!.roles.cache.forEach((role) => guildRoles.push(role.id))

        const manageableRoles = await prisma.manageableRole.findMany({
            where: { roleId: { in: guildRoles } }
        })

        if (manageableRoles.length === 0)
            return interaction.reply('No manageable roles on this server')

        const manageableRoleParsed: { [key: string]: string[] } = {}
        manageableRoles.forEach((manageableRole: { [key: string]: string }) => {
            const role = manageableRole.managerRoleId
            manageableRoleParsed[role] = Object.hasOwn(manageableRoleParsed, role)
                ? [...manageableRoleParsed[role], manageableRole.roleId]
                : [manageableRole.roleId]
        })

        let description = ''
        for (const manageableRole in manageableRoleParsed) {
            const managerRole = interaction.guild!.roles.cache.find((r) => r.id === manageableRole)
            const managerRoleRoles = `<@&${manageableRoleParsed[manageableRole].join('>, <@&')}>`
            description += `__**${managerRole}:**__ ${managerRoleRoles}\n`
        }

        interaction.reply({ content: `**Manager Roles**\n${description}`, ephemeral: true })
    }

    @Slash({ description: 'add or remove a manageable role' })
    async toggle(
        @SlashOption({
            name: 'role',
            description: 'role to be managed',
            required: true,
            type: ApplicationCommandOptionType.Role
        })
        role: Role,
        @SlashOption({
            name: 'manager-role',
            description: 'manager role',
            required: true,
            type: ApplicationCommandOptionType.Role
        })
        managerRole: Role,

        interaction: CommandInteraction
    ) {
        if (role.id === managerRole.id) throw Error(`Sorry, a role can't manage itself`)

        let manageableRoleCreated = true

        try {
            await prisma.manageableRole.create({
                data: { managerRoleId: managerRole.id, roleId: role.id }
            })
        } catch {
            await prisma.manageableRole.delete({
                where: { roleId_managerRoleId: { managerRoleId: managerRole.id, roleId: role.id } }
            })
            manageableRoleCreated = false
        }

        interaction.reply({
            content: `${managerRole} can ${
                manageableRoleCreated ? 'now' : 'no longer'
            } manage ${role}`,
            ephemeral: true
        })
    }
}
