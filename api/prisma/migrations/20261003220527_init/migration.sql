-- CreateTable
CREATE TABLE "LogoSettings" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "server" TEXT NOT NULL,
    "port" INTEGER NOT NULL DEFAULT 1433,
    "database" TEXT NOT NULL,
    "user" TEXT NOT NULL,
    "passwordEncrypted" TEXT NOT NULL,
    "firmNo" TEXT NOT NULL DEFAULT '001',
    "periodNo" TEXT NOT NULL DEFAULT '01',
    "encrypt" BOOLEAN NOT NULL DEFAULT false,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LogoSettings_pkey" PRIMARY KEY ("id")
);
