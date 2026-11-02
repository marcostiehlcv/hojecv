# Hoje CV — correr no seu computador (localhost)

## Ficheiros
| Ficheiro | Para quê |
|---|---|
| `index.html` | O site completo (HTML, CSS e JavaScript), em PT e EN |
| `eventos.js` | Os dados do site (só registos `verificado`), gerados a partir da Sheet |
| `config.js` | URL do Apps Script (já preenchido), usado só para os reportes de erro |
| `Code.gs` | Script da Google Sheet (cola-se no Apps Script) |
| `scripts/gerar-eventos.js` | Gera o `eventos.js` a partir da Sheet |

## Abrir
**Opção 1 — duplo clique:** abra o `index.html` no browser. Funciona com o `eventos.js`.

**Opção 2 — servidor local (recomendado):** na pasta do projeto, abra um terminal e corra um destes comandos:

    python3 -m http.server 8000
    # ou, com Node.js:
    npx serve .

Abra depois http://localhost:8000

## Ver de onde vêm os dados
Abra http://localhost:8000/?fonte — aparece uma etiqueta azul no canto inferior esquerdo com a origem (`eventos.js`) e o número de registos.

## Levar alterações da Sheet para o site
Na pasta do projeto: `node scripts/gerar-eventos.js` (com `--ver` só valida e mostra as diferenças). Depois faça commit.

## Editar
- Estilos e texto: tudo está no `index.html` (CSS no topo, textos PT/EN no objeto `I18N`).
- Dados: edite a Google Sheet (folha `eventos`, estado `verificado`). Depois gere o `eventos.js` (ver acima).
