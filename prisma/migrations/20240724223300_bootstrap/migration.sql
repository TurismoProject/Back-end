-- CreateTable
CREATE TABLE "Admin" (
    "id" SERIAL NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "senha" VARCHAR(255) NOT NULL,
    "nome" TEXT NOT NULL,

    CONSTRAINT "Admin_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Fornecedor" (
    "id" SERIAL NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "senha" VARCHAR(255) NOT NULL,
    "nomeEmpresa" VARCHAR(255) NOT NULL,
    "cnpj" VARCHAR(255) NOT NULL,
    "telefone" VARCHAR(255) NOT NULL,
    "endereco" VARCHAR(255) NOT NULL,

    CONSTRAINT "Fornecedor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Cliente" (
    "id" SERIAL NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "senha" VARCHAR(255) NOT NULL,
    "nome" TEXT NOT NULL,
    "cpf" VARCHAR(255) NOT NULL,
    "dataNascimento" TIMESTAMP(3) NOT NULL,
    "telefone" VARCHAR(255) NOT NULL,
    "endereco" VARCHAR(255) NOT NULL,

    CONSTRAINT "Cliente_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Admin_email_key" ON "Admin"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Fornecedor_email_key" ON "Fornecedor"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Fornecedor_cnpj_key" ON "Fornecedor"("cnpj");

-- CreateIndex
CREATE UNIQUE INDEX "Cliente_email_key" ON "Cliente"("email");
