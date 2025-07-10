-- CreateTable
CREATE TABLE "perfis_importados" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nome.sobrenome" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "(ano.semestre)" TEXT NOT NULL,
    "unidade" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "auto_avaliacoes_importadas" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "Email do Colaborador" TEXT NOT NULL,
    "Ciclo (ano.semestre)" TEXT NOT NULL,
    "criterio" TEXT NOT NULL,
    "DESCRIÇÃO GERAL" TEXT NOT NULL,
    "AUTO-AVALIAÇÃO" INTEGER,
    "DESCRIÇÃO NOTA" TEXT,
    "DADOS E FATOS DA AUTO-AVALIAÇÃO" TEXT,
    "dataImportacao" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "avaliacoes_360_importadas" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "Email do Colaborador" TEXT NOT NULL,
    "Ciclo (ano.semestre)" TEXT NOT NULL,
    "EMAIL DO AVALIADO ( nome.sobrenome )" TEXT NOT NULL,
    "PROJETO EM QUE ATUARAM JUNTOS - OBRIGATÓRIO TEREM ATUADOS JUNTOS" TEXT,
    "periodo" TEXT,
    "VOCÊ FICARIA MOTIVADO EM TRABALHAR NOVAMENTE COM ESTE COLABORADOR" TEXT,
    "DÊ UMA NOTA GERAL PARA O COLABORADOR" REAL,
    "PONTOS QUE DEVE MELHORAR" TEXT,
    "PONTOS QUE FAZ BEM E DEVE EXPLORAR" TEXT,
    "dataImportacao" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "pesquisas_referencia_importadas" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "Email do Colaborador" TEXT NOT NULL,
    "Ciclo (ano.semestre)" TEXT NOT NULL,
    "EMAIL DA REFERÊNCIA ( nome.sobrenome )" TEXT NOT NULL,
    "justificativa" TEXT,
    "dataImportacao" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "perfis_importados_email_key" ON "perfis_importados"("email");
