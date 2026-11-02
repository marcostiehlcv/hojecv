# Hoje CV

Neste dia na história de Cabo Verde. Site estático (HTML, CSS e JavaScript, sem servidor próprio). Os acontecimentos são editados numa Google Sheet e publicados no ficheiro `eventos.js`. Em português por defeito, com versão em inglês (botão PT | EN no topo).

## Como funciona

```
Google Sheet (privada)
  ├─ folha "eventos"  → só as linhas com estado "verificado" aparecem no site
  │                     (colunas titulo_en / descricao_en = versão inglesa;
  │                      categoria = tipo, tema = área; fonte2 e notas só na Sheet)
  └─ folha "erros"    ← cada "Assinalar erro" entra aqui como "pendente"
        ▲
        │  Apps Script (Code.gs), corre com a sua conta
        │   ├─ GET ?acao=eventos → scripts/gerar-eventos.js → eventos.js (commit)
        │   └─ POST reportes ← site
        ▼
Site estático (index.html + eventos.js) — Vercel
```

- A Sheet **não precisa de ser pública**. O script só devolve os registos verificados e só aceita reportes com os códigos da lista. Não há texto livre.
- Um reporte **nunca altera** a folha "eventos". Quem decide é quem revê a folha "erros".
- O site lê só o `eventos.js`, por isso não depende da Sheet para abrir. Uma alteração na Sheet chega ao site quando se regenera o `eventos.js` e se faz commit.
- Se um registo não tiver tradução, a versão inglesa mostra o texto em português.

## Ficheiros

| Ficheiro | Para quê |
|---|---|
| `index.html` | O site completo (PT e EN) |
| `config.js` | O endereço do Apps Script (preencher no passo 1) |
| `eventos.js` | Os dados do site (gerados a partir da Sheet) |
| `Code.gs` | O script a colar na Google Sheet |
| `scripts/gerar-eventos.js` | Gera o `eventos.js` a partir da Sheet, com validação |

## Passo 1 — Ligar a Google Sheet (5 minutos)

1. Abra a Sheet **Hoje CV — Base de dados**.
2. Menu **Extensões → Apps Script**.
3. Apague o que lá estiver, cole todo o conteúdo de `apps-script/Code.gs` e guarde.
4. **Implementar → Nova implementação**:
   - Tipo: **Aplicação web**
   - Executar como: **Eu**
   - Quem tem acesso: **Qualquer pessoa**
5. Autorize quando o Google pedir. O aviso "app não verificada" é normal para scripts próprios: escolha *Avançadas → Aceder*.
6. Copie o **URL da aplicação web** (termina em `/exec`) e cole-o em `config.js`:

```js
window.HOJECV_CONFIG = {
  API: "https://script.google.com/macros/s/XXXXXXXX/exec"
};
```

Para testar, abra o URL seguido de `?acao=eventos`. Deve aparecer a lista em JSON.

## Passo 2 — GitHub

1. Crie uma conta em github.com.
2. **New repository**, nome `hojecv`, visibilidade **Public**.
3. **Add file → Upload files**: arraste todos os ficheiros desta pasta, mantendo as subpastas, e clique em **Commit changes**.

## Passo 3 — Publicar na Vercel (plano Hobby, grátis)

1. Entre em vercel.com com **Continue with GitHub**.
2. Escolha o plano **Hobby** (uso pessoal e não comercial).
3. **Add New → Project**, escolha o repositório `hojecv` e clique em **Deploy**. Não é preciso alterar nada: o site é estático.
4. Em cerca de um minuto o site fica em `hojecv.vercel.app` (ou parecido).

Cada alteração enviada para o GitHub publica uma versão nova automaticamente.

## Passo 4 — Domínio hojecv.app

Na Vercel: **Project → Settings → Domains → Add**, escreva `hojecv.app` e siga as instruções de DNS do fornecedor onde comprou o domínio. O HTTPS é automático (obrigatório nos domínios .app).

**Nota:** o plano Hobby é para uso não comercial. Se o projeto passar a ter receitas (publicidade, patrocínios), é preciso mudar para o plano Pro ou para o GitHub Pages.

## Rotina de manutenção

- **Novo acontecimento:** acrescente uma linha na folha "eventos" com estado `verificado`, `categoria` (`acontecimento`, `nascimento` ou `falecimento`), `tema` (`politica`, `historia`, `musica`, `literatura`, `artes`, `desporto`, `religiao`, `sociedade` ou `catastrofe`) e, se possível, `titulo_en` e `descricao_en`. Só entra como `verificado` com duas fontes independentes (`fonte` e `fonte2`); caso contrário fica `por verificar`, com a razão em `notas`. Para aparecer no site, regenere o `eventos.js` (`node scripts/gerar-eventos.js`) e faça commit. O site mostra «Última atualização: …» com a data e a hora (de Cabo Verde) da última alteração dos registos.
- **Esconder um acontecimento:** mude o estado para outra coisa (por exemplo `por verificar`).
- **Rever erros:** na folha "erros", passe de `pendente` para `validado` ou `inválido` e escreva uma nota. Se for validado, corrija a linha na folha "eventos".
- **Publicar alterações da Sheet:** `node scripts/gerar-eventos.js` (ou peça ao Claude) e commit. O script recusa escrever se encontrar erros nos dados.

## Se alterar o script

Depois de editar `Code.gs`, use **Implementar → Gerir implementações → Editar (lápis) → Versão: Nova versão**. Assim o URL `/exec` mantém-se igual.
