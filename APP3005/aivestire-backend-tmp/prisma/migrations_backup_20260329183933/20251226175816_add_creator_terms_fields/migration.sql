-- DropForeignKey
ALTER TABLE "Creator" DROP CONSTRAINT "Creator_user_id_fkey";

-- AlterTable
ALTER TABLE "Creator" ALTER COLUMN "terms_version" DROP DEFAULT;

-- AddForeignKey
ALTER TABLE "Creator" ADD CONSTRAINT "Creator_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;
