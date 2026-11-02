# CLAUDE.md — Hoje CV

Projeto: **Hoje CV** ("Neste dia na história de Cabo Verde"), de Marco Stiehl. Site estático que mostra, para cada dia do ano, acontecimentos, nascimentos e falecimentos da história de Cabo Verde. Domínio previsto: hojecv.app. Publicado na Vercel (plano Hobby, uso não comercial) a partir de um repositório GitHub.

## Regras de trabalho
- Responder **sempre em português de Portugal (PT-PT)**. Não escrever versões em inglês nas respostas, a não ser que se peça.
- Todo o texto visível no site existe em **PT (por defeito) e EN**. Qualquer texto novo tem de ser acrescentado nas duas línguas no objeto `I18N` do `index.html`.
- Mobile está aprovado ("perfeito"). Alterações de aspeto para computador vão dentro de `@media (min-width:900px)` e `(min-width:1500px)`, sem mexer no mobile.
- Tom da interface: sóbrio, informativo, sem exageros.

## Estrutura
| Ficheiro | Função |
|---|---|
| `index.html` | O site inteiro (HTML + CSS + JS). Editar diretamente |
| `eventos.js` | Os dados do site, gerados a partir da Sheet: `window.HOJECV_ATUALIZADO = "AAAA-MM-DD"` e `window.HOJECV_DADOS = [[...]]` |
| `config.js` | `window.HOJECV_CONFIG = { API: "<url /exec do Apps Script>" }` (usado só para os reportes) |
| `scripts/gerar-eventos.js` | Gera o `eventos.js` a partir do Apps Script, com validação (`--ver` só valida) |
| `Code.gs` | Script da Google Sheet (colar em Extensões → Apps Script). O site só o usa para os reportes |

**A Sheet serve para editar; o `eventos.js` serve o site.** O site é estático: lê apenas o `eventos.js` (carrega `dados/eventos.js` e depois `eventos.js`; o da raiz tem prioridade) e não pede dados ao Apps Script. Uma alteração na Sheet só chega ao site depois de regenerar o `eventos.js` e fazer commit.
Abrir `/?fonte` mostra uma etiqueta com a origem e o número de registos.
A nota no fim da vista Hoje mostra «Dados atualizados a …» (`I18N.*.updated`), a partir de `HOJECV_ATUALIZADO`. O gerador só muda essa data quando algum registo mudou (hora de Cabo Verde).

## Dados
Fonte de verdade: Google Sheet **"Hoje CV — Base de dados"** (id `1P8pzpkJ-V5zoudy7IWXynx_hyIG2YMhckNINPA6UpdI`).
- Folha `eventos` (colunas): id, dia, mes, ano, titulo, descricao, categoria, ilha, destaque, fonte, estado, imagem, credito_imagem, titulo_en, descricao_en, tema, fonte2, notas. Só as linhas com `estado = verificado` aparecem no site. `fonte2` (segunda fonte) e `notas` (porque está `por verificar`) ficam só na Sheet; o `Code.gs` não as exporta.
- Folha `erros`: cada "Assinalar erro" entra como `pendente`; revisão manual (`validado` / `inválido`). Um reporte **nunca** altera a folha `eventos`.

Cada registo em `eventos.js` é um array:
`[dia, mes, ano, titulo, descricao, categoria, ilha, destaque, fonte, imagem, credito, titulo_en, descricao_en, tema]`
- `categoria` = **tipo**: `acontecimento | nascimento | falecimento`
- `tema` = **área**: `politica | historia | musica | literatura | artes | desporto | religiao | sociedade | catastrofe` (historia = descobrimentos, período colonial, luta de libertação; artes = artes plásticas, cinema, teatro; sociedade = economia, educação, saúde, infraestruturas, imprensa, diáspora; catastrofe = secas, fomes, erupções, naufrágios, acidentes, epidemias). Um nascimento de um músico é `nascimento` + `musica`.
- Registos antigos sem `tema` (categoria `politica|cultura|desporto`) continuam a funcionar: o `toEv` converte-os.
- `destaque`: `1` = evento principal do dia (se não houver, usa-se o primeiro)
- `ilha`: nome da ilha, `Nacional` ou país/local (ex.: Portugal, Guiné-Bissau). Os nomes em inglês estão em `L().place`.
- Chave de um evento: `AAAA-MM-DD-hash(titulo)` (hash djb2 em base 36). A função existe no `index.html` (`keyOf`) e no `Code.gs` (`hash_`) e **têm de ser iguais**.

## Critérios editoriais (obrigatórios para novos registos)
1. Relevância para a história de Cabo Verde ou da diáspora.
2. **Data exata** (dia, mês e ano). Só ano ou mês = não entra. Se duas fontes discordam, o registo fica de fora até haver confirmação.
3. **Fonte consultável** em cada registo, e **duas fontes independentes** com a mesma data exata para entrar como `verificado` (`fonte` + `fonte2`; a Wikipédia, no máximo, como `fonte2`). Com uma só fonte ou com fontes que discordam, fica `por verificar`, com a razão em `notas`. Fontes aceites: instituições oficiais, arquivos, enciclopédias e imprensa cabo-verdiana de referência (Inforpress, Expresso das Ilhas, A Semana, RTC). Só factos comprovados, nunca especulação ou boatos.
4. Datas tradicionais (ex.: descobertas do séc. XV) são assinaladas como tal na descrição.
5. **Pares:** quem tem registo de nascimento deve ter o de falecimento (e vice-versa), quando as duas datas exatas são conhecidas.
6. Imagens: só quando existirem, de forma muito subtil, com licença livre (Wikimedia Commons) e crédito. Sem imagem, não se mostra nada.
7. Título e descrição em PT-PT, com tradução EN em `titulo_en` e `descricao_en`.

## Código (index.html)
- **Temas:** variáveis CSS em `:root` (claro) e `prefers-color-scheme: dark` / `data-theme`. Não usar cores soltas; usar os tokens (`--bg`, `--surface`, `--fg`, `--muted`, `--line`, `--ocean`, `--ocean-deep`, `--sun`, `--rubro`…).
- **i18n:** `I18N.pt` e `I18N.en`; `L()` devolve a língua atual; `T(e)`/`X(e)` escolhem título/descrição por língua; `PL()` traduz nomes de locais. Língua guardada em `localStorage` (`hojecv_lang`).
- **Filtros:** `I18N.*.cats` (tipos + temas); `hit(e,k)` aceita tipo ou tema; na vista Hoje só aparecem os filtros com registos nesse dia. `rotulo(e)` dá a etiqueta: tema nos acontecimentos, tipo nos nascimentos e falecimentos (também no cartão de partilha). Cores das etiquetas em tokens `--t-*`.
- **Estado:** `RAW` → `EVENTS` (objetos) → `BYKEY`. `route()` desenha as vistas Hoje e Explorar. `applyLang()` atualiza os textos.
- **Reportes:** motivos fixos por código (data, ano, titulo, descricao, categoria, local, fonte, imagem, duplicado, ofensivo), **sem texto livre**. POST `{chave, motivos[]}` para o Apps Script; reportes já enviados em `localStorage` (`hojecv_rep`).
- **Cartão de partilha:** canvas 1080×1080 (quadrado) e 1080×1920 (story) em `drawCard()`. Mostra marca, bandeira, data, ano, título, descrição, etiquetas (categoria, ilha, "há N anos"), imagem subtil e `hojecv.app`. Botões: Guardar imagem, Partilhar… (menu nativo), Ecrã inteiro, Copiar texto. **Sem botões de WhatsApp/X.**
- **Bandeira oficial** (SVG e canvas, `drawFlag`): viewBox 1020×600; azul `#003893`; faixa branca y=300 h=150; faixa vermelha `#cf2027` y=350 h=50; 10 estrelas amarelas `#f7d116` em círculo de raio 150, centro (382,5; 375), raio da estrela 35. Não alterar proporções.
- **Layout:** mobile em coluna única (máx. 640 px); computador ≥900 px com 900 px de largura (960 px a partir de 1500 px) e lista a duas colunas.
- Autor: "Hoje CV · Um projeto de Marco Stiehl" no rodapé (discreto). Secção "Sobre" com motivação e critérios.

## Apps Script (Code.gs)
- `doGet?acao=eventos`: devolve só linhas `verificado`, com `tema` como 14.º campo (cache 10 min em partes de 90 KB, chaves `eventos_v3_*`; `onEdit` limpa a cache, mas só em edições feitas à mão — depois de escrever pela API, correr `limparCache` ou esperar 10 min).
- `doPost`: valida `chave` por regex, aceita apenas códigos de motivo da lista, vai buscar título e data à Sheet (nunca ao pedido), limite de 30 reportes por evento por hora, grava na folha `erros` com `pendente`.
- Depois de editar: Implementar → Gerir implementações → Editar → **Nova versão** (o URL `/exec` mantém-se).

## Publicar
1. Alterar ficheiros localmente e testar (`python3 -m http.server 8000`, abrir `/?fonte`).
2. Fazer commit para o repositório `marcostiehlcv/hojecv` (branch `main`). A Vercel republica sozinha em ~1 minuto.
3. Para levar alterações da Sheet ao site: `node scripts/gerar-eventos.js` (lê `API?acao=eventos`, valida 14 campos, tipos, temas, datas e chaves, mostra novos e removidos e escreve o `eventos.js`), depois commit. A cache do Apps Script dura 10 min: depois de escrever na Sheet pela API, esperar ou correr `limparCache`.

## Cuidados
- Não incluir segredos nem a conta do Google no repositório. A Sheet é privada; só o Apps Script a lê. O `CLAUDE.md` tem o id da Sheet e não está no repositório (que é público).
- Não aumentar a base com datas por confirmar para atingir uma meta (objetivo: ≥500 registos, só com factos verificados).
- Depois de qualquer alteração visual, testar em mobile (≈390 px) e computador (≈1280 e 1920 px), nos temas claro e escuro, e em PT e EN.
- Verificar que não aparece "[object Object]" nem chaves de texto em falta ao trocar de língua.
