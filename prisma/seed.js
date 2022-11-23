import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// prisma doesn't support createMany for SQLite so one by one we go...

// Rexs:ab: B | A
await prisma.manageableRoles.create({
    data: {
        roleId: '1037478363650084904',
        managerRoleId: '1037478325834227712'
    }
})

// SDS: Calls Approved | Calls Mod
await prisma.manageableRoles.create({
    data: {
        roleId: '1036651254211936256',
        managerRoleId: '1036651222503014493'
    }
})

// SDS: Calls Approved | Moderator
await prisma.manageableRoles.create({
    data: {
        roleId: '1036651254211936256',
        managerRoleId: '953475156351778843'
    }
})
