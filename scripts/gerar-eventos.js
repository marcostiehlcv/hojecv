/* Gera o eventos.js a partir da Google Sheet (via Apps Script, só registos "verificado").
   Uso (na raiz do projeto):  node scripts/gerar-eventos.js        -> valida e escreve
                              node scripts/gerar-eventos.js --ver  -> só valida e mostra as diferenças
   Precisa do Code.gs com o campo "tema" (14 campos). A cache do Apps Script dura 10 min. */
const fs = require("fs");
const path = require("path");

const RAIZ = path.join(__dirname, "..");
const SAIDA = path.join(RAIZ, "eventos.js");
const TIPOS = ["acontecimento", "nascimento", "falecimento"];
const TEMAS = ["politica", "historia", "musica", "literatura", "artes", "desporto", "religiao", "sociedade", "catastrofe"];

// Mesma chave que o site (keyOf) e o Code.gs (hash_): AAAA-MM-DD-djb2(titulo) em base 36
const hash = s => { let x = 5381; for (const ch of s) x = (((x << 5) + x + ch.charCodeAt(0)) >>> 0); return x.toString(36); };
const pad = n => ("0" + n).slice(-2);
const chave = r => r[2] + "-" + pad(r[1]) + "-" + pad(r[0]) + "-" + hash(r[3]);

function ler(ficheiro) {
  global.window = {};
  if (!fs.existsSync(ficheiro)) return null;
  new Function("window", fs.readFileSync(ficheiro, "utf8"))(global.window);
  return global.window;
}

function validar(D) {
  const erros = [], vistas = new Set();
  D.forEach(r => {
    const [d, m, y, t, x, c, , , fonte, , , te, xe, tema] = r;
    const id = `${d}/${m}/${y} «${t}»`;
    if (r.length !== 14) erros.push(`${id}: ${r.length} campos (esperados 14)`);
    if (!TIPOS.includes(c)) erros.push(`${id}: categoria "${c}"`);
    if (!TEMAS.includes(tema)) erros.push(`${id}: tema "${tema}"`);
    const dt = new Date(Date.UTC(2024, m - 1, d));
    if (!(m >= 1 && m <= 12 && dt.getUTCDate() === d) || !(y > 1400 && y <= new Date().getFullYear())) erros.push(`${id}: data inválida`);
    if (!t || !x || !te || !xe) erros.push(`${id}: falta texto PT ou EN`);
    if (!fonte) erros.push(`${id}: sem fonte`);
    const k = chave(r);
    if (vistas.has(k)) erros.push(`${id}: chave repetida ${k}`);
    vistas.add(k);
  });
  return erros;
}

(async () => {
  const api = (ler(path.join(RAIZ, "config.js")) || {}).HOJECV_CONFIG?.API;
  if (!api) throw new Error("config.js sem API");
  const res = await fetch(api + "?acao=eventos", { redirect: "follow" });
  const j = await res.json();
  const D = j.eventos;
  if (!Array.isArray(D) || !D.length) throw new Error("O Apps Script não devolveu eventos");

  const erros = validar(D);
  const antigo = (ler(SAIDA) || {}).HOJECV_DADOS || [];
  const ka = new Set(antigo.map(chave)), kn = new Set(D.map(chave));
  const novos = D.filter(r => !ka.has(chave(r))), saem = antigo.filter(r => !kn.has(chave(r)));

  console.log(`Sheet: ${D.length} registos (atualizado ${j.atualizado}) | eventos.js atual: ${antigo.length}`);
  console.log(`Novos: ${novos.length} | Saem: ${saem.length}`);
  saem.slice(0, 20).forEach(r => console.log(`  - ${r[0]}/${r[1]}/${r[2]} ${r[3]}`));
  if (erros.length) {
    console.log(`\n${erros.length} erro(s):`);
    erros.slice(0, 40).forEach(e => console.log("  ✗ " + e));
    process.exitCode = 1;
    return;
  }
  if (process.argv.includes("--ver")) return;

  const corpo = D.map(r => "[" + r.map(v => JSON.stringify(v)).join(", ") + "]").join(", ");
  fs.writeFileSync(SAIDA, `/* Dados do site, gerados a partir da Google Sheet por scripts/gerar-eventos.js (só registos "verificado").
   [dia, mes, ano, titulo, descricao, categoria, ilha, destaque, fonte, imagem, credito, titulo_en, descricao_en, tema]
   categoria = tipo (${TIPOS.join(" | ")}); tema = ${TEMAS.join(" | ")} */
window.HOJECV_DADOS = [${corpo}];
`);
  console.log(`\neventos.js escrito com ${D.length} registos.`);
})().catch(e => { console.error("Erro: " + e.message); process.exitCode = 1; });
