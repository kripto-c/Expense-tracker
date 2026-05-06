/*
  Warnings:

  - You are about to drop the column `role` on the `GroupMember` table. All the data in the column will be lost.
  - Added the required column `roleId` to the `GroupMember` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "GroupMember" DROP COLUMN "role",
ADD COLUMN     "roleId" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "Role" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Role_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Role_name_key" ON "Role"("name");

-- AddForeignKey
ALTER TABLE "GroupMember" ADD CONSTRAINT "GroupMember_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
