// CEASA: modo dono + mídia real das frutas. Tudo que o cliente vê de "foto da fruta" sai daqui, com a data e o lote que o DONO informou.
// Regras: (1) a data de postagem é do servidor, não dá pra forjar; (2) o custo que o dono paga nunca sai na rota pública; (3) o dono só altera algo depois de confirmar
// o que o Beto entendeu (2 passos: /dono/beto propõe, /dono/aplicar grava); (4) login do dono = PIN (hash scrypt) e só pode ser DEFINIDO por uma requisição local.
// Dados em data/ceasa/ (fora do git): estado.json, midia.json, dono.json, arquivos/.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const raiz = path.dirname(fileURLToPath(import.meta.url));
const PASTA = process.env.CEASA_DIR || path.join(raiz, 'data', 'ceasa'), ARQ = path.join(PASTA, 'arquivos');
const F = { estado: path.join(PASTA, 'estado.json'), midia: path.join(PASTA, 'midia.json'), dono: path.join(PASTA, 'dono.json') };
fs.mkdirSync(ARQ, { recursive: true });

const le = (f, vazio) => { try { return JSON.parse(fs.readFileSync(f, 'utf-8')); } catch { return vazio; } };
const grava = (f, o) => { const t = f + '.tmp'; fs.writeFileSync(t, JSON.stringify(o, null, 1)); fs.renameSync(t, f); };
const estado = () => { const e = le(F.estado, null) || {}; e.produtos ||= {}; e.aviso ||= ''; return e; };
const midias = () => { const m = le(F.midia, null); return Array.isArray(m) ? m : []; };

const ID = /^[a-z0-9]{2,24}$/, ARQUIVO = /^[a-z0-9_-]{6,60}\.(jpg|png|webp|mp4)$/;
const MAX_UP = 40 * 1024 * 1024, TTL = 12 * 3600e3;
const sessoes = new Map(), falhas = new Map();   // token -> expira; ip -> [horas das tentativas erradas]

// ---------- PIN ----------
const hashPin = (pin, sal) => crypto.scryptSync(String(pin), sal, 32).toString('hex');
function confere(pin) {
  const env = process.env.CEASA_DONO_PIN; pin = String(pin || '');
  if (env) { const a = Buffer.from(pin), b = Buffer.from(env); return a.length === b.length && crypto.timingSafeEqual(a, b); }
  const d = le(F.dono, null); if (!d || !d.sal || !d.hash) return false;
  const a = Buffer.from(hashPin(pin, d.sal), 'hex'), b = Buffer.from(d.hash, 'hex'); return a.length === b.length && crypto.timingSafeEqual(a, b);
}
const temPin = () => !!process.env.CEASA_DONO_PIN || !!le(F.dono, null)?.hash;
const ipDe = req => req.headers['x-forwarded-for']?.split(',')[0].trim() || req.socket.remoteAddress || '?';
const isLocal = req => !req.headers['x-forwarded-for'] && /^(::1|127\.0\.0\.1|::ffff:127\.0\.0\.1)$/.test(req.socket.remoteAddress || '');
const donoAutenticado = req => { const t = String(req.headers['x-dono-token'] || ''), exp = sessoes.get(t); if (!exp) return false; if (exp < Date.now()) { sessoes.delete(t); return false; } return true; };

// ---------- mídia: tipo pelo conteúdo, não pelo que o cliente diz ----------
function tipoPorBytes(b) {
  if (b.length > 12 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return { ext: 'jpg', tipo: 'foto' };
  if (b.length > 8 && b.slice(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return { ext: 'png', tipo: 'foto' };
  if (b.length > 12 && b.slice(0, 4).toString() === 'RIFF' && b.slice(8, 12).toString() === 'WEBP') return { ext: 'webp', tipo: 'foto' };
  if (b.length > 12 && b.slice(4, 8).toString() === 'ftyp') return { ext: 'mp4', tipo: 'video' };
  return null;
}
const MIMES = { jpg: 'image/jpeg', png: 'image/png', webp: 'image/webp', mp4: 'video/mp4' };
const dataOk = s => /^\d{4}-\d{2}-\d{2}$/.test(s) && !isNaN(Date.parse(s + 'T12:00:00Z')) && Date.parse(s + 'T00:00:00Z') <= Date.now() + 864e5;
const txt = (s, n) => String(s ?? '').replace(/[\u0000-\u001f<>]/g, ' ').trim().slice(0, n);

// ---------- o que é público ----------
export function publico() {
  const e = estado(), prods = {};
  for (const [id, p] of Object.entries(e.produtos)) prods[id] = { disponivel: p.disponivel ?? null, chegouEm: p.chegouEm || null, nota: p.nota || '', precoCaixa: p.precoCaixa ?? null, atualizadoEm: p.atualizadoEm || null };   // sem custo
  return { aviso: e.aviso || '', produtos: prods, atualizadoEm: e.atualizadoEm || null };
}
export const midiaPublica = () => midias().sort((a, b) => (b.fotografadoEm || '').localeCompare(a.fotografadoEm || '') || b.postadoEm.localeCompare(a.postadoEm));
// resumo curto pro cérebro do Beto-cliente saber o que existe (nunca inventar foto)
export function resumoParaBeto(ids) {
  const hoje = Date.now(), m = midiaPublica(), e = publico(), linhas = [];
  for (const id of ids) {
    const f = m.find(x => x.produto === id && !x.demo), p = e.produtos[id] || {};   // imagem de demonstração nunca conta como foto real
    const dias = f ? Math.floor((hoje - Date.parse(f.fotografadoEm + 'T12:00:00Z')) / 864e5) : null;
    if (f || p.disponivel === false || p.chegouEm) linhas.push(`${id}: ${f ? `mídia real (${f.tipo}) de ${f.fotografadoEm} (${dias <= 0 ? 'hoje' : dias + ' dias atrás'})${f.lote ? ', lote ' + f.lote : ''}${f.origem ? ', origem ' + f.origem : ''}` : 'sem foto real'}${p.disponivel === false ? ' · INDISPONÍVEL' : ''}${p.chegouEm ? ' · chegou ' + p.chegouEm.slice(0, 10) : ''}`);
  }
  return (e.aviso ? `AVISO DO DIA (do dono): ${e.aviso}\n` : '') + (linhas.length ? 'MÍDIA E ESTOQUE REAIS (só afirme foto/data/lote que estiver aqui; sem foto real, diga que ainda não tem e que é ilustrativa; para mostrar use action {type:"midia",id}):\n' + linhas.join('\n') : 'Nenhuma foto real cadastrada ainda: diga que a foto mostrada é ilustrativa.');
}

// ---------- aplica propostas confirmadas pelo dono ----------
const NUM = v => { const n = Number(v); return Number.isFinite(n) && n > 0 && n < 1e6 ? Math.round(n * 100) / 100 : null; };
export function aplica(propostas) {
  const e = estado(), agora = new Date().toISOString(), feitas = [];
  const prod = id => (e.produtos[id] ||= {});
  for (const p of (Array.isArray(propostas) ? propostas : []).slice(0, 40)) {
    if (!p || typeof p !== 'object') continue;
    if (p.tipo === 'aviso') { e.aviso = txt(p.texto, 240); feitas.push('aviso do dia'); continue; }
    if (!ID.test(String(p.id))) continue;
    const x = prod(p.id);
    if (p.tipo === 'preco') { const n = NUM(p.valor); if (n) { x.precoCaixa = n; x.atualizadoEm = agora; feitas.push(`preço ${p.id} R$ ${n}`); } }
    else if (p.tipo === 'custo') { const n = NUM(p.valor); if (n) { x.custoCaixa = n; x.atualizadoEm = agora; feitas.push(`custo ${p.id}`); } }
    else if (p.tipo === 'disponivel') { x.disponivel = !!p.valor; x.atualizadoEm = agora; feitas.push(`${p.id} ${p.valor ? 'disponível' : 'em falta'}`); }
    else if (p.tipo === 'chegada') { x.chegouEm = agora; x.disponivel = true; x.atualizadoEm = agora; feitas.push(`${p.id} chegou hoje`); }
    else if (p.tipo === 'nota') { x.nota = txt(p.texto, 160); x.atualizadoEm = agora; feitas.push(`nota ${p.id}`); }
  }
  e.atualizadoEm = agora; grava(F.estado, e); return feitas;
}

// ---------- imagem de DEMONSTRAÇÃO (só por script local, nunca por HTTP): aparece com selo "Demonstração" e o Beto NÃO a trata como foto real ----------
export function registraDemo(corpo, produto, nota = 'Imagem de demonstração') {
  const t = tipoPorBytes(corpo); if (!t) throw new Error('arquivo não é foto/vídeo'); if (!ID.test(produto)) throw new Error('produto inválido');
  const id = 'm' + Date.now().toString(36) + crypto.randomBytes(3).toString('hex'), arquivo = `${id}.${t.ext}`; fs.writeFileSync(path.join(ARQ, arquivo), corpo);
  const m = midias(), hoje = new Date().toISOString(); m.push({ id, produto, tipo: t.tipo, arquivo, fotografadoEm: hoje.slice(0, 10), postadoEm: hoje, lote: '', origem: '', nota: txt(nota, 140), demo: true, bytes: corpo.length });
  grava(F.midia, m); return id;
}
export function limpaDemos() { const m = midias(), fica = m.filter(x => !x.demo); for (const x of m.filter(x => x.demo)) { try { fs.unlinkSync(path.join(ARQ, x.arquivo)); } catch {} } grava(F.midia, fica); return m.length - fica.length; }

// ---------- HTTP ----------
const lerCorpo = (req, max) => new Promise((ok, no) => { const ch = []; let n = 0; req.on('data', c => { n += c.length; if (n > max) { no(new Error('arquivo grande demais')); req.destroy(); } else ch.push(c); }); req.on('end', () => ok(Buffer.concat(ch))); req.on('error', no); });

export async function trata(req, res, url, send) {
  const rota = url.pathname, J = (c, o) => send(res, c, JSON.stringify(o));
  if (!rota.startsWith('/api/ceasa/')) return false;
  try {
    if (rota === '/api/ceasa/estado' && req.method === 'GET') { J(200, { ...publico(), midia: midiaPublica() }); return true; }
    const mArq = /^\/api\/ceasa\/arquivo\/([a-z0-9_-]{6,60}\.(jpg|png|webp|mp4))$/.exec(rota);
    if (mArq && req.method === 'GET') {
      const f = path.join(ARQ, mArq[1]); if (!fs.existsSync(f)) { send(res, 404, 'não encontrado', 'text/plain; charset=utf-8'); return true; }
      const st = fs.statSync(f), tipo = MIMES[mArq[2]], rg = /^bytes=(\d*)-(\d*)$/.exec(req.headers.range || '');
      if (rg && tipo === 'video/mp4') { const ini = rg[1] === '' ? Math.max(0, st.size - Number(rg[2])) : Number(rg[1]), fim = rg[1] === '' || rg[2] === '' ? st.size - 1 : Math.min(Number(rg[2]), st.size - 1);
        if (ini > fim || ini >= st.size) { res.writeHead(416, { 'Content-Range': 'bytes */' + st.size }); res.end(); return true; }
        res.writeHead(206, { 'Content-Type': tipo, 'Accept-Ranges': 'bytes', 'Content-Range': `bytes ${ini}-${fim}/${st.size}`, 'Content-Length': fim - ini + 1, 'Cache-Control': 'public, max-age=3600' }); fs.createReadStream(f, { start: ini, end: fim }).pipe(res); return true; }
      res.writeHead(200, { 'Content-Type': tipo, 'Content-Length': st.size, 'Accept-Ranges': 'bytes', 'Cache-Control': 'public, max-age=3600' }); fs.createReadStream(f).pipe(res); return true;
    }
    if (rota === '/api/ceasa/dono/status' && req.method === 'GET') { J(200, { temPin: temPin(), logado: donoAutenticado(req) }); return true; }

    if (rota === '/api/ceasa/dono/definir-pin' && req.method === 'POST') {
      if (!isLocal(req)) { J(403, { erro: 'o PIN só pode ser definido no computador do servidor' }); return true; }
      const I = JSON.parse((await lerCorpo(req, 2000)).toString() || '{}'), pin = String(I.pin || '');
      if (pin.length < 6 || pin.length > 40) { J(400, { erro: 'PIN de 6 a 40 caracteres' }); return true; }
      const sal = crypto.randomBytes(16).toString('hex'); grava(F.dono, { sal, hash: hashPin(pin, sal), definidoEm: new Date().toISOString() }); sessoes.clear(); J(200, { ok: true }); return true;
    }
    if (rota === '/api/ceasa/dono/login' && req.method === 'POST') {
      const ip = ipDe(req), agora = Date.now(), tent = (falhas.get(ip) || []).filter(t => agora - t < 600e3);
      if (tent.length >= 5) { J(429, { erro: 'muitas tentativas, espere 10 minutos' }); return true; }
      if (!temPin()) { J(501, { erro: 'o dono ainda não tem PIN definido' }); return true; }
      const I = JSON.parse((await lerCorpo(req, 2000)).toString() || '{}');
      if (!confere(I.pin)) { tent.push(agora); falhas.set(ip, tent); J(401, { erro: 'PIN incorreto' }); return true; }
      falhas.delete(ip); const token = crypto.randomBytes(24).toString('hex'); sessoes.set(token, agora + TTL); J(200, { ok: true, token, expiraEm: agora + TTL }); return true;
    }

    // ---- daqui pra baixo: só o dono logado ----
    if (rota.startsWith('/api/ceasa/dono/')) {
      if (!donoAutenticado(req)) { J(401, { erro: 'entre com o PIN do dono' }); return true; }

      if (rota === '/api/ceasa/dono/midia' && req.method === 'POST') {
        const corpo = await lerCorpo(req, MAX_UP), t = tipoPorBytes(corpo);
        if (!t) { J(415, { erro: 'só aceito foto (jpg, png, webp) ou vídeo mp4' }); return true; }
        const hdr = n => { try { return decodeURIComponent(String(req.headers[n] || '')); } catch { return ''; } };
        const produto = hdr('x-produto'); if (!ID.test(produto)) { J(400, { erro: 'produto inválido' }); return true; }
        const quando = hdr('x-fotografado-em') || new Date().toISOString().slice(0, 10); if (!dataOk(quando)) { J(400, { erro: 'data inválida (AAAA-MM-DD, não pode ser futura)' }); return true; }
        const id = 'm' + Date.now().toString(36) + crypto.randomBytes(3).toString('hex'), arquivo = `${id}.${t.ext}`;
        fs.writeFileSync(path.join(ARQ, arquivo), corpo);
        const m = midias(); const reg = { id, produto, tipo: t.tipo, arquivo, fotografadoEm: quando, postadoEm: new Date().toISOString(), lote: txt(hdr('x-lote'), 40), origem: txt(hdr('x-origem'), 60), nota: txt(hdr('x-nota'), 140), bytes: corpo.length };
        m.push(reg); grava(F.midia, m); J(200, { ok: true, midia: reg }); return true;
      }
      const mDel = /^\/api\/ceasa\/dono\/midia\/(m[a-z0-9]{6,30})$/.exec(rota);
      if (mDel && req.method === 'DELETE') {
        const m = midias(), i = m.findIndex(x => x.id === mDel[1]); if (i < 0) { J(404, { erro: 'não existe' }); return true; }
        const [r] = m.splice(i, 1); grava(F.midia, m); try { fs.unlinkSync(path.join(ARQ, r.arquivo)); } catch {} J(200, { ok: true }); return true;
      }
      if (rota === '/api/ceasa/dono/estado' && req.method === 'GET') { J(200, { ...estado(), midia: midiaPublica() }); return true; }   // inclui custo (só dono)
      if (rota === '/api/ceasa/dono/aplicar' && req.method === 'POST') {
        const I = JSON.parse((await lerCorpo(req, 20000)).toString() || '{}'), feitas = aplica(I.propostas); J(200, { ok: true, feitas }); return true;
      }
      if (rota === '/api/ceasa/dono/beto' && req.method === 'POST') { await betoDono(req, res, send); return true; }
    }
    J(404, { erro: 'rota não existe' }); return true;
  } catch (err) { J(400, { erro: String(err.message) }); return true; }
}

// ---------- Beto como funcionário: entende o dono e PROPÕE mudanças (o dono confirma) ----------
async function betoDono(req, res, send) {
  const J = (c, o) => send(res, c, JSON.stringify(o));
  const I = JSON.parse((await lerCorpo(req, 40000)).toString() || '{}'), msg = txt(I.mensagem, 600); if (!msg) return J(400, { erro: 'sem mensagem' });
  const key = process.env.GROQ_API_KEY; if (!key) return J(501, { erro: 'IA desligada: falta GROQ_API_KEY no servidor' });
  const cat = (Array.isArray(I.catalogo) ? I.catalogo : []).slice(0, 120).map(p => ({ id: String(p.id).slice(0, 24), nome: txt(p.nome, 40), variante: txt(p.variante, 30) })).filter(p => ID.test(p.id)), ids = new Set(cat.map(p => p.id));
  const hist = (Array.isArray(I.historico) ? I.historico : []).slice(-10).map(m => ({ role: m.role === 'assistant' || m.role === 'bot' ? 'assistant' : 'user', content: txt(m.content, 500) })).filter(m => m.content);
  const e = estado(), hoje = new Date().toISOString().slice(0, 10);
  const sistema = `Você é o Beto, funcionário de confiança do Matheus (dono) no atacado de hortifrúti NEW CEASA. Agora quem fala com você é o PRÓPRIO DONO, não um cliente. Português do Brasil, direto, camarada, frases curtas.
Seu trabalho com ele: anotar o que ele comprou/chegou, preços, o que está em falta, avisos do dia, e lembrar de pedir fotos/vídeos novas das frutas (as fotos precisam ser renovadas a cada 2 dias, mostre quais produtos estão sem foto recente). Você NÃO altera nada sozinho: você PROPÕE em "propostas" e o dono confirma na tela. Nunca invente número: se ele não disse o valor, pergunte. Se faltar qual produto/variante, pergunte UMA coisa.
Tipos de proposta: {"tipo":"preco","id","valor"} (preço de venda por caixa/unidade em R$) · {"tipo":"custo","id","valor"} (quanto ele PAGOU, fica privado) · {"tipo":"disponivel","id","valor":true|false} · {"tipo":"chegada","id"} (chegou mercadoria hoje) · {"tipo":"nota","id","texto"} · {"tipo":"aviso","texto"} (aviso do dia pros clientes). Use SÓ ids do catálogo.
Hoje é ${hoje}. Estado atual: ${JSON.stringify(Object.fromEntries(Object.entries(e.produtos).map(([k, v]) => [k, { disponivel: v.disponivel, precoCaixa: v.precoCaixa, chegouEm: v.chegouEm?.slice(0, 10) }]))).slice(0, 2500)}. Última foto por produto: ${JSON.stringify(Object.fromEntries(cat.map(p => [p.id, midiaPublica().find(m => m.produto === p.id)?.fotografadoEm || null]))).slice(0, 2500)}.
CATÁLOGO: ${JSON.stringify(cat)}
Responda SÓ JSON: {"reply":"curto, diga o que entendeu e peça confirmação","propostas":[...],"chips":["até 3 respostas rápidas"]}.`;
  const ctl = new AbortController(), to = setTimeout(() => ctl.abort(), 20000);
  const r = await fetch('https://api.groq.com/openai/v1/chat/completions', { method: 'POST', signal: ctl.signal, headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + key }, body: JSON.stringify({ model: process.env.GROQ_VENDEDOR_MODEL || process.env.GROQ_MODEL || 'openai/gpt-oss-120b', reasoning_effort: 'low', temperature: 0.2, response_format: { type: 'json_object' }, messages: [{ role: 'system', content: sistema }, ...hist.slice(0, -1), { role: 'user', content: msg }] }) });
  clearTimeout(to); if (!r.ok) return J(502, { erro: 'a IA respondeu ' + r.status });
  const o = JSON.parse((await r.json()).choices[0].message.content);
  const propostas = (Array.isArray(o.propostas) ? o.propostas : []).filter(p => p && (p.tipo === 'aviso' || ids.has(String(p.id)))).slice(0, 20).map(p => ({ tipo: String(p.tipo), id: p.id ? String(p.id) : undefined, valor: p.valor, texto: p.texto ? txt(p.texto, 240) : undefined })).filter(p => ['preco', 'custo', 'disponivel', 'chegada', 'nota', 'aviso'].includes(p.tipo));
  J(200, { reply: txt(o.reply, 700), propostas, chips: (Array.isArray(o.chips) ? o.chips : []).slice(0, 3).map(c => txt(c, 40)) });
}
