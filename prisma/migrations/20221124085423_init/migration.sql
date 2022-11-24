-- CreateTable
CREATE TABLE "manageableRole" (
    "roleId" TEXT NOT NULL,
    "managerRoleId" TEXT NOT NULL,

    PRIMARY KEY ("roleId", "managerRoleId")
);

-- CreateTable
CREATE TABLE "mutedMember" (
    "userId" TEXT NOT NULL,
    "guildId" TEXT NOT NULL,
    "userRoleIds" TEXT NOT NULL,

    PRIMARY KEY ("userId", "guildId")
);
