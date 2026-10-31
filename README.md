# Hoje CV

Neste dia na história de Cabo Verde. Site estático (HTML, CSS e JavaScript, sem servidor próprio) que lê os acontecimentos de uma Google Sheet. Em português por defeito, com versão em inglês (botão PT | EN no topo).

## Como funciona

```
Google Sheet (privada)
  ├─ folha "eventos"  → só as linhas com estado "verificado" aparecem no site
  │                     (colunas titulo_en / descricao_en = versão inglesa)
  └─ folha "erros"    ← cada "Assinalar erro" entra aqui como "pendente"
        ▲
        │  Apps Script (apps-script/Code.gs), corre com a sua conta
        ▼
Site estático (index.html) — Vercel
```

- A Sheet **não precisa de ser pública**. O script só devolve os registos verificados e só aceita reportes com os códigos da lista. Não há texto livre.
- Um reporte **nunca altera** a folha "eventos". Quem decide é quem revê a folha "erros".
- Se a Sheet não responder, o site usa a cópia de reserva em `dados/eventos.js`.
- Se um registo não tiver tradução, a versão inglesa mostra o texto em português.

## Ficheiros

| Ficheiro | Para quê |
|---|---|
| `index.html` | O site completo (PT e EN) |
| `config.js` | O endereço do Apps Script (preencher no passo 1) |
| `dados/eventos.js` | Cópia de reserva da base |
| `apps-script/Code.gs` | O script a colar na Google Sheet |

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

- **Novo acontecimento:** acrescente uma linha na folha "eventos" com estado `verificado` e, se possível, `titulo_en` e `descricao_en`. As alterações aparecem no site em menos de 10 minutos; ao editar a folha o cache é limpo automaticamente.
- **Esconder um acontecimento:** mude o estado para outra coisa (por exemplo `por verificar`).
- **Rever erros:** na folha "erros", passe de `pendente` para `validado` ou `inválido` e escreva uma nota. Se for validado, corrija a linha na folha "eventos".
- **Atualizar a cópia de reserva:** de vez em quando, peça ao Claude para gerar um `dados/eventos.js` novo a partir da Sheet e substitua-o no GitHub.

## Se alterar o script

Depois de editar `Code.gs`, use **Implementar → Gerir implementações → Editar (lápis) → Versão: Nova versão**. Assim o URL `/exec` mantém-se igual.
