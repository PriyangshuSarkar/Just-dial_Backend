/*
  Warnings:

  - Added the required column `salt` to the `admins` table without a default value. This is not possible if the table is not empty.
  - Added the required column `password` to the `businesses` table without a default value. This is not possible if the table is not empty.
  - Added the required column `salt` to the `businesses` table without a default value. This is not possible if the table is not empty.
  - Added the required column `salt` to the `users` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "admins" ADD COLUMN     "salt" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "businesses" ADD COLUMN     "password" TEXT NOT NULL,
ADD COLUMN     "salt" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "salt" TEXT NOT NULL;
