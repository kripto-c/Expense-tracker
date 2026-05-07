-- DropForeignKey
ALTER TABLE "GroupMember" DROP CONSTRAINT "GroupMember_roleId_fkey";

-- AlterTable
ALTER TABLE "GroupMember" ADD COLUMN     "role" TEXT NOT NULL DEFAULT 'member';

-- AlterTable
ALTER TABLE "Role" ALTER COLUMN "description" SET DEFAULT '';
