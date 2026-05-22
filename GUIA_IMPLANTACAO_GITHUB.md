# 🚀 Guia de Implantação e Manutenção: GitHub & Vercel

Este documento detalha como levar seu sistema para produção e como mantê-lo evoluindo com segurança.

## 1. O Sistema continuará funcionando?
**Sim.** O sistema é uma SPA (Single Page Application) que não depende de servidores próprios para rodar a lógica (apenas para baixar os dados do Google Sheets). A Vercel é a plataforma ideal para este tipo de projeto.

---

## 2. Passo a Passo: Levando para o GitHub e Vercel

### Fase A: Preparação
1. No AI Studio, vá no menu de **Configurações/Settings** e escolha **Export to GitHub** ou faça o download do **ZIP**.
2. Se baixou o ZIP: Extraia os arquivos em uma pasta no seu computador.

### Fase B: Criando o Repositório
1. Crie um novo repositório no seu GitHub (ex: `dashboard-pm3`).
2. Abra o terminal (PowerShell) na pasta do projeto e execute:
   ```powershell
   git init
   git add .
   git commit -m "Primeira versão: Dashboard PM3"
   git branch -M main
   git remote add origin https://github.com/SEU_USUARIO/SEU_REPOSITORIO.git
   git push -u origin main
   ```

### Fase C: Conectando à Vercel
1. Acesse [vercel.com](https://vercel.com) e faça login com seu GitHub.
2. Clique em **"Add New" > "Project"**.
3. Importe o repositório que você acabou de criar.
4. A Vercel detectará automaticamente que é um projeto **Vite**.
5. Clique em **Deploy**.
6. **Pronto!** Seu sistema terá um link `.vercel.app` público.

---

## 3. Como fazer Manutenção e Evolução (O Guia do Desenvolvedor)

**⚠️ REGRA DE OURO:** Jamais edite os arquivos diretamente no site do GitHub. Isso não permite testes e pode quebrar o sistema em produção.

### O Fluxo de Trabalho Correto (Workflow):
1. **Ambiente Local:** Utilize o **Visual Studio Code (VS Code)**.
2. **Dependências:** No PowerShell, dentro da pasta, rode:
   ```powershell
   npm install
   ```
3. **Desenvolvimento:** Inicie o servidor de testes local:
   ```powershell
   npm run dev
   ```
4. **Alterações:** Faça as mudanças no código. O navegador atualizará sozinho para você ver o resultado.
5. **Subindo a Versão:** Após testar e ver que está funcionando:
   ```powershell
   git add .
   git commit -m "Melhoria: Adição de nova coluna de filtragem"
   git push origin main
   ```
6. **Auto-Deploy:** No momento em que você der o `git push`, a Vercel detecta a mudança e atualiza o site automaticamente em segundos.

---

## 4. Como Escalar o Sistema

Se o seu sistema crescer muito (ex: muitas planilhas ou lógica complexa):

1. **Centralização de Configuração:** Crie um arquivo `config.ts` para guardar as URLs das planilhas, assim você não precisa caçar links dentro dos componentes.
2. **Componentização:** Se notar que está repetindo muito código entre a aba de Ocorrências e Faltas, peça para a IA criar um "Componente de Tabela Genérico" que aceite qualquer dado.
3. **Segurança:** Se precisar de dados que não podem ser públicos na web, considere migrar para o **Firebase** (o AI Studio tem suporte nativo para isso), mas lembre-se que isso adicionará uma camada de banco de dados.

## 5. Dica para grandes alterações com IA
Se você precisar fazer uma mudança muito grande e não quiser escrever código na mão:
1. Volte ao **AI Studio Build**.
2. Cole o código atual do arquivo que quer mudar.
3. Peça a alteração.
4. Copie o resultado de volta para o seu VS Code local, teste e dê o `git push`.

---
**Estratégia PM/3 - Tecnologia e Prontidão.**
