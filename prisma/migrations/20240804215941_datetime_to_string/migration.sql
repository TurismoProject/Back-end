/*
  Warnings:

  - You are about to drop the `Admin` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Fornecedor` table. If the table is not empty, all the data it contains will be lost.

*/
-- AlterTable
ALTER TABLE "Cliente" ALTER COLUMN "nome" DROP NOT NULL,
ALTER COLUMN "dataNascimento" SET DATA TYPE VARCHAR(255),
ALTER COLUMN "endereco" DROP NOT NULL;

-- DropTable
DROP TABLE "Admin";

-- DropTable
DROP TABLE "Fornecedor";
