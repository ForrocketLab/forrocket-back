/*
  Warnings:

  - You are about to drop the column `DADOS E FATOS DA AUTO-AVALIAÇÃO` on the `auto_avaliacoes_importadas` table. All the data in the column will be lost.
  - You are about to drop the column `criterio` on the `auto_avaliacoes_importadas` table. All the data in the column will be lost.
  - You are about to drop the column `periodo` on the `avaliacoes_360_importadas` table. All the data in the column will be lost.
  - You are about to drop the column `(ano.semestre)` on the `perfis_importados` table. All the data in the column will be lost.
  - You are about to drop the column `nome.sobrenome` on the `perfis_importados` table. All the data in the column will be lost.
  - You are about to drop the column `unidade` on the `perfis_importados` table. All the data in the column will be lost.
  - You are about to drop the column `EMAIL DA REFERÊNCIA ( nome.sobrenome )` on the `pesquisas_referencia_importadas` table. All the data in the column will be lost.
  - You are about to drop the column `justificativa` on the `pesquisas_referencia_importadas` table. All the data in the column will be lost.
  - Added the required column `CRITÉRIO` to the `auto_avaliacoes_importadas` table without a default value. This is not possible if the table is not empty.
  - Added the required column `Ciclo (ano.semestre)` to the `perfis_importados` table without a default value. This is not possible if the table is not empty.
  - Added the required column `Nome ( nome.sobrenome )` to the `perfis_importados` table without a default value. This is not possible if the table is not empty.
  - Added the required column `Unidade` to the `perfis_importados` table without a default value. This is not possible if the table is not empty.
  - Added the required column `EMAIL DA REFERÊNCIA
( nome.sobrenome )` to the `pesquisas_referencia_importadas` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_auto_avaliacoes_importadas" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "Email do Colaborador" TEXT NOT NULL,
    "Ciclo (ano.semestre)" TEXT NOT NULL,
    "CRITÉRIO" TEXT NOT NULL,
    "DESCRIÇÃO GERAL" TEXT NOT NULL,
    "AUTO-AVALIAÇÃO" INTEGER,
    "DESCRIÇÃO NOTA" TEXT,
    "DADOS E FATOS DA AUTO-AVALIAÇÃO
CITE, DE FORMA OBJETIVA, CASOS E SITUAÇÕES REAIS" TEXT,
    "dataImportacao" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_auto_avaliacoes_importadas" ("AUTO-AVALIAÇÃO", "Ciclo (ano.semestre)", "DESCRIÇÃO GERAL", "DESCRIÇÃO NOTA", "Email do Colaborador", "dataImportacao", "id") SELECT "AUTO-AVALIAÇÃO", "Ciclo (ano.semestre)", "DESCRIÇÃO GERAL", "DESCRIÇÃO NOTA", "Email do Colaborador", "dataImportacao", "id" FROM "auto_avaliacoes_importadas";
DROP TABLE "auto_avaliacoes_importadas";
ALTER TABLE "new_auto_avaliacoes_importadas" RENAME TO "auto_avaliacoes_importadas";
CREATE TABLE "new_avaliacoes_360_importadas" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "Email do Colaborador" TEXT NOT NULL,
    "Ciclo (ano.semestre)" TEXT NOT NULL,
    "EMAIL DO AVALIADO ( nome.sobrenome )" TEXT NOT NULL,
    "PROJETO EM QUE ATUARAM JUNTOS - OBRIGATÓRIO TEREM ATUADOS JUNTOS" TEXT,
    "PERÍODO" TEXT,
    "VOCÊ FICARIA MOTIVADO EM TRABALHAR NOVAMENTE COM ESTE COLABORADOR" TEXT,
    "DÊ UMA NOTA GERAL PARA O COLABORADOR" REAL,
    "PONTOS QUE DEVE MELHORAR" TEXT,
    "PONTOS QUE FAZ BEM E DEVE EXPLORAR" TEXT,
    "dataImportacao" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_avaliacoes_360_importadas" ("Ciclo (ano.semestre)", "DÊ UMA NOTA GERAL PARA O COLABORADOR", "EMAIL DO AVALIADO ( nome.sobrenome )", "Email do Colaborador", "PONTOS QUE DEVE MELHORAR", "PONTOS QUE FAZ BEM E DEVE EXPLORAR", "PROJETO EM QUE ATUARAM JUNTOS - OBRIGATÓRIO TEREM ATUADOS JUNTOS", "VOCÊ FICARIA MOTIVADO EM TRABALHAR NOVAMENTE COM ESTE COLABORADOR", "dataImportacao", "id") SELECT "Ciclo (ano.semestre)", "DÊ UMA NOTA GERAL PARA O COLABORADOR", "EMAIL DO AVALIADO ( nome.sobrenome )", "Email do Colaborador", "PONTOS QUE DEVE MELHORAR", "PONTOS QUE FAZ BEM E DEVE EXPLORAR", "PROJETO EM QUE ATUARAM JUNTOS - OBRIGATÓRIO TEREM ATUADOS JUNTOS", "VOCÊ FICARIA MOTIVADO EM TRABALHAR NOVAMENTE COM ESTE COLABORADOR", "dataImportacao", "id" FROM "avaliacoes_360_importadas";
DROP TABLE "avaliacoes_360_importadas";
ALTER TABLE "new_avaliacoes_360_importadas" RENAME TO "avaliacoes_360_importadas";
CREATE TABLE "new_perfis_importados" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "Nome ( nome.sobrenome )" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "Ciclo (ano.semestre)" TEXT NOT NULL,
    "Unidade" TEXT NOT NULL
);
INSERT INTO "new_perfis_importados" ("email", "id") SELECT "email", "id" FROM "perfis_importados";
DROP TABLE "perfis_importados";
ALTER TABLE "new_perfis_importados" RENAME TO "perfis_importados";
CREATE UNIQUE INDEX "perfis_importados_email_key" ON "perfis_importados"("email");
CREATE TABLE "new_pesquisas_referencia_importadas" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "Email do Colaborador" TEXT NOT NULL,
    "Ciclo (ano.semestre)" TEXT NOT NULL,
    "EMAIL DA REFERÊNCIA
( nome.sobrenome )" TEXT NOT NULL,
    "JUSTIFICATIVA" TEXT,
    "dataImportacao" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_pesquisas_referencia_importadas" ("Ciclo (ano.semestre)", "Email do Colaborador", "dataImportacao", "id") SELECT "Ciclo (ano.semestre)", "Email do Colaborador", "dataImportacao", "id" FROM "pesquisas_referencia_importadas";
DROP TABLE "pesquisas_referencia_importadas";
ALTER TABLE "new_pesquisas_referencia_importadas" RENAME TO "pesquisas_referencia_importadas";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
