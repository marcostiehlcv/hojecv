# Hoje CV — correr no seu computador (localhost)

## Ficheiros
| Ficheiro | Para quê |
|---|---|
| `index.html` | O site completo (HTML, CSS e JavaScript), em PT e EN |
| `eventos.js` | Cópia de reserva da base (só registos `verificado`) |
| `config.js` | URL do Apps Script (já preenchido); com `API: ""` o site usa só o `eventos.js` |
| `Code.gs` | Script da Google Sheet (cola-se no Apps Script; não é usado no site) |

## Abrir
**Opção 1 — duplo clique:** abra o `index.html` no browser. Funciona com os dados de reserva.

**Opção 2 — servidor local (recomendado):** na pasta do projeto, abra um terminal e corra um destes comandos:

    python3 -m http.server 8000
    # ou, com Node.js:
    npx serve .

Abra depois http://localhost:8000

## Ver de onde vêm os dados
Abra http://localhost:8000/?fonte — aparece uma etiqueta azul no canto inferior esquerdo:
- "Google Sheet (em direto)" = a ler da Sheet
- "cópia de reserva (eventos.js)" = a usar o ficheiro local

## Testar só com o ficheiro local (sem Sheet)
Em `config.js`, deixe `API: ""`. O site usa apenas o `eventos.js`.

## Editar
- Estilos e texto: tudo está no `index.html` (CSS no topo, textos PT/EN no objeto `I18N`).
- Dados: edite a Google Sheet (folha `eventos`, estado `verificado`). O `eventos.js` é só a cópia de reserva.
