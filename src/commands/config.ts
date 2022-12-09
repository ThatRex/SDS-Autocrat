import { CommandInteraction, Role, GuildMember, EmbedBuilder } from 'discord.js'
import { ApplicationCommandOptionType } from 'discord.js'
import { Discord, Guard, Slash, SlashGroup, SlashOption } from 'discordx'
import { PrismaClient } from '@prisma/client'
import { ErrorHandler } from '../guards/error.js'
import { NotBot } from '@discordx/utilities'
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/index.js'

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

@Discord()
@SlashGroup({ name: 'mute', description: 'configure me', root: 'config' })
@SlashGroup('mute', 'config')
@Guard(ErrorHandler, NotBot)
export class role {
    @Slash({ description: 'configure muted role' })
    async role(
        @SlashOption({
            name: 'role',
            description: 'role',
            required: true,
            type: ApplicationCommandOptionType.Role
        })
        role: Role,

        interaction: CommandInteraction
    ) {
        await prisma.guildConfig.upsert({
            where: { guildId: interaction.guild!.id },
            update: { mutedRoleId: role.id },
            create: { guildId: interaction.guild!.id, mutedRoleId: role.id }
        })

        interaction.reply(`Muted role set to ${role}`)
    }
}

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
        manageableRoles.forEach((manageableRole) => {
            const role = manageableRole.managerRoleId
            manageableRoleParsed[role] = Object.hasOwn(manageableRoleParsed, role)
                ? [...manageableRoleParsed[role], manageableRole.roleId]
                : [manageableRole.roleId]
        })

        const embed = new EmbedBuilder().setColor('#d5152f').setTitle('Manager Roles')

        for (const manageableRole in manageableRoleParsed)
            embed.addFields({
                name: `${
                    interaction.guild!.roles.cache.find((r) => r.id === manageableRole)?.name
                }`,
                value: `<@&${manageableRoleParsed[manageableRole].join('>, <@&')}>`
            })

        interaction.reply({ embeds: [embed] })
    }

    @Slash({ description: 'add a manageable role' })
    async add(
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
        const member = interaction.member as GuildMember
        if (!member.permissions.has('Administrator'))
            throw Error(`Sorry, you don't have permession to do that`)

        if (role.id === managerRole.id) throw Error(`Sorry, a role can't manage itself`)

        try {
            await prisma.manageableRole.create({
                data: { managerRoleId: managerRole.id, roleId: role.id }
            })
        } catch (err) {
            if (err instanceof PrismaClientKnownRequestError && err.code === 'P2002')
                throw Error(`${role} can already be managed by ${managerRole}`)
        }

        interaction.reply(`${managerRole} can now manage ${role}`)
    }

    @Slash({ description: 'remove a manageable role' })
    async remove(
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
        const member = interaction.member as GuildMember

        if (!member.permissions.has('Administrator'))
            return interaction.reply(`Sorry, you don't have permession to do that`)

        try {
            await prisma.manageableRole.delete({
                where: { roleId_managerRoleId: { managerRoleId: managerRole.id, roleId: role.id } }
            })
        } catch (err) {
            if (err instanceof PrismaClientKnownRequestError && err.code === 'P2002')
                throw Error(`${role} is not manageable by ${managerRole}`)
        }

        interaction.reply(`${managerRole} can no longer manage ${role}`)
    }
}
