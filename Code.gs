/**
 * Hoje CV — API da Google Sheet
 *
 * GET  ?acao=eventos  -> devolve só os registos com estado "verificado" da folha "eventos".
 * POST {chave, motivos[]} -> grava um reporte de erro na folha "erros" com estado "pendente".
 *
 * A Sheet continua privada: este script corre com a conta do dono e só expõe
 * o que está aqui definido. Um reporte nunca altera a folha "eventos".
 */

const FOLHA_EVENTOS = 'eventos';
const FOLHA_ERROS = 'erros';
const CACHE_SEGUNDOS = 600; // 10 minutos

// Únicos motivos aceites (o site só envia estes códigos; não há texto livre).
const MOTIVOS = {
  data: 'Data errada',
  ano: 'Ano errado',
  titulo: 'Título ou nome errado',
  descricao: 'Descrição incorreta',
  categoria: 'Categoria errada',
  local: 'Ilha ou local errado',
  fonte: 'Fonte não abre ou não confirma',
  imagem: 'Imagem errada ou inadequada',
  duplicado: 'Acontecimento repetido',
  ofensivo: 'Conteúdo ofensivo ou inadequado'
};

const LIMITE_POR_HORA = 30; // reportes por acontecimento por hora

function doGet(e) {
  const acao = (e && e.parameter && e.parameter.acao) || 'eventos';
  if (acao !== 'eventos') return json_({ erro: 'acao_desconhecida' });
  const cache = CacheService.getScriptCache();
  const n = Number(cache.get('eventos_v2_n') || 0);
  if (n) {
    const partes = cache.getAll(Array.from({ length: n }, function (_, i) { return 'eventos_v2_' + i; }));
    if (Object.keys(partes).length === n) {
      const txt = Array.from({ length: n }, function (_, i) { return partes['eventos_v2_' + i]; }).join('');
      return ContentService.createTextOutput(txt).setMimeType(ContentService.MimeType.JSON);
    }
  }
  const out = JSON.stringify({ atualizado: new Date().toISOString(), eventos: lerEventos_() });
  // O cache guarda no máximo 100 KB por valor, por isso divide-se em partes.
  const TAM = 90000, obj = {};
  let i = 0;
  for (let p = 0; p < out.length; p += TAM, i++) obj['eventos_v2_' + i] = out.slice(p, p + TAM);
  obj['eventos_v2_n'] = String(i);
  try { cache.putAll(obj, CACHE_SEGUNDOS); } catch (err) { /* sem cache: continua a funcionar */ }
  return ContentService.createTextOutput(out).setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  let body;
  try { body = JSON.parse(e.postData.contents); } catch (err) { return json_({ ok: false, erro: 'pedido_invalido' }); }
  const chave = String(body.chave || '');
  if (!/^\d{1,4}-\d{2}-\d{2}-[a-z0-9]{1,10}$/.test(chave)) return json_({ ok: false, erro: 'chave_invalida' });
  const motivos = (Array.isArray(body.motivos) ? body.motivos : [])
    .map(String).filter(function (m, i, a) { return MOTIVOS[m] && a.indexOf(m) === i; });
  if (!motivos.length || motivos.length > 10) return json_({ ok: false, erro: 'motivos_invalidos' });

  // O acontecimento é procurado aqui; título e data vêm da Sheet, nunca do pedido.
  const ev = lerEventos_().find(function (r) { return chaveDe_(r) === chave; });
  if (!ev) return json_({ ok: false, erro: 'evento_desconhecido' });

  const cache = CacheService.getScriptCache();
  const k = 'rl_' + chave;
  const n = Number(cache.get(k) || 0);
  if (n >= LIMITE_POR_HORA) return json_({ ok: false, erro: 'limite' });
  cache.put(k, String(n + 1), 3600);

  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const sh = SpreadsheetApp.getActive().getSheetByName(FOLHA_ERROS);
    const dataEv = pad_(ev[0]) + '/' + pad_(ev[1]) + '/' + ev[2];
    sh.appendRow([
      Utilities.formatDate(new Date(), 'Atlantic/Cape_Verde', 'yyyy-MM-dd HH:mm'),
      chave, dataEv, ev[3], motivos.map(function (m) { return MOTIVOS[m]; }).join('; '),
      'pendente', ''
    ]);
  } finally { lock.releaseLock(); }
  return json_({ ok: true });
}

// [dia, mes, ano, titulo, descricao, categoria, ilha, destaque, fonte, imagem, credito, titulo_en, descricao_en]
function lerEventos_() {
  const sh = SpreadsheetApp.getActive().getSheetByName(FOLHA_EVENTOS);
  const v = sh.getDataRange().getValues();
  const h = v.shift().map(String);
  const c = function (n) { return h.indexOf(n); };
  const I = {
    dia: c('dia'), mes: c('mes'), ano: c('ano'), titulo: c('titulo'), descricao: c('descricao'),
    categoria: c('categoria'), ilha: c('ilha'), destaque: c('destaque'), fonte: c('fonte'),
    estado: c('estado'), imagem: c('imagem'), credito: c('credito_imagem'),
    tituloEn: c('titulo_en'), descricaoEn: c('descricao_en')
  };
  return v.filter(function (r) { return String(r[I.estado]).trim().toLowerCase() === 'verificado' && r[I.titulo]; })
    .map(function (r) {
      return [Number(r[I.dia]), Number(r[I.mes]), Number(r[I.ano]), String(r[I.titulo]), String(r[I.descricao]),
        String(r[I.categoria]), String(r[I.ilha]), String(r[I.destaque]).toLowerCase() === 'sim' ? 1 : 0,
        String(r[I.fonte] || ''), I.imagem >= 0 ? String(r[I.imagem] || '') : '', I.credito >= 0 ? String(r[I.credito] || '') : '',
        I.tituloEn >= 0 ? String(r[I.tituloEn] || '') : '', I.descricaoEn >= 0 ? String(r[I.descricaoEn] || '') : ''];
    });
}

// Mesma chave que o site calcula: AAAA-MM-DD-hash(título)
function chaveDe_(r) { return r[2] + '-' + pad_(r[1]) + '-' + pad_(r[0]) + '-' + hash_(r[3]); }
function hash_(s) {
  let x = 5381;
  for (const ch of s) x = (((x << 5) + x + ch.charCodeAt(0)) >>> 0);
  return x.toString(36);
}
function pad_(n) { return ('0' + n).slice(-2); }
function json_(o) { return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }

/** Ao editar a folha "eventos", o site recebe a versão nova no pedido seguinte. */
function onEdit(e) {
  if (e && e.range && e.range.getSheet().getName() === FOLHA_EVENTOS) limparCache();
}

/** Executar à mão depois de editar a folha "eventos" para o site ver logo as mudanças. */
function limparCache() { CacheService.getScriptCache().remove('eventos_v2_n'); }
