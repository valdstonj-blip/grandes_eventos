# 🌐 Guia de Implantação: GitHub Pages (PM/3)

Este guia explica como publicar seu sistema no GitHub Pages sem erros e como manter o fluxo de trabalho profissional entre a IA e seu computador local.

---

## 1. O Segredo contra a "Tela Branca"
Para que o sistema NÃO fique com a tela branca ao subir para o GitHub Pages, já deixamos dois pontos configurados:

1.  **`vite.config.ts`**: Adicionamos `base: './'`. Isso força o navegador a procurar os arquivos (CSS, JS) na pasta atual, não na raiz do domínio.
2.  **GitHub Action**: Criamos o arquivo `.github/workflows/deploy.yml`. Ele é o "robô" que vai compilar seu código e publicar automaticamente toda vez que você enviar algo novo.

---

## 2. Passo a Passo Inicial (No seu Computador)

Abra o seu **PowerShell** na pasta do projeto e execute estes comandos em ordem:

```powershell
# 1. Iniciar o rastreamento do Git
git init

# 2. Adicionar todos os arquivos
git add .

# 3. Criar o primeiro registro de versão
git commit -m "Build: Configuração GitHub Pages"

# 4. Definir a branch principal
git branch -M main

# 5. Conectar ao seu repositório (Troque SEU_USUARIO e REPOSITORIO)
git remote add origin https://github.com/SEU_USUARIO/SEU_REPOSITORIO.git

# 6. Enviar para o GitHub
git push -u origin main
```

---

## 3. PASSO CRUCIAL (No Site do GitHub)
Após dar o `git push`, a tela não aparecerá sozinha. Você precisa autorizar o GitHub Actions:

1. Acesse seu repositório no site do GitHub.
2. Vá em **Settings** (Configurações) > **Pages**.
3. Em **Build and deployment** > **Source**, altere de "Deploy from a branch" para **"GitHub Actions"**.
4. Clique na aba **Actions** no topo do site e você verá o "Deploy to GitHub Pages" rodando. Quando o ícone ficar verde, o site estará no ar!

---

## 4. O Fluxo de Trabalho Ideal (Workflow)

Para manter o sistema seguro e funcional, siga este ciclo de manutenção:

### A. Grandes Alterações (IA Studio)
*Quando precisar de novas funcionalidades complexas ou mudar toda a lógica:*
1. Use o **AI Studio Build**.
2. Peça a mudança e verifique se funcionou no **Preview**.
3. Copie o código gerado para o arquivo correspondente no seu **VS Code** local.

### B. Ajustes Finos (VS Code Local)
*Quando precisar trocar um texto, mudar uma cor ou corrigir uma palavra:*
1. Abra o projeto no VS Code.
2. Rode `npm run dev` no PowerShell para ver as mudanças em tempo real.
3. É muito mais rápido e seguro para detalhes pequenos.

### C. Implantação (O Pulo do Gato)
1. Após terminar as mudanças e testar localmente:
```powershell
git add .
git commit -m "Ajuste secundário: Cor de destaque alterada"
git push origin main
```
2. **O robô faz o resto:** O arquivo `.github/workflows/deploy.yml` detecta o comando, compila o sistema e atualiza seu site público em segundos. **Não precisa fazer mais nada manualmente.**

---

**Dica de Pro:** Nunca edite arquivos diretamente no site do GitHub. Siga sempre o fluxo: **IA -> VS Code -> Push -> Site**. Isso garante que você nunca perca o controle das versões.

---
**EMG PM/3 - Suporte Técnico e Estratégico.**
