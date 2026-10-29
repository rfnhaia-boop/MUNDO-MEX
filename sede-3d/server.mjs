// Servidor local dos mundos 3D (porta 8099): arquivos estáticos de Ativos/ + estado compartilhado da Sede.
// GET/PUT /api/sede/estado  -> Ativos/sede-3d/data/estado.json  (a Sede e o executor, eu, leem e escrevem o MESMO arquivo)
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import crypto from 'node:crypto';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');                       // Ativos/
const stateFile = path.join(here, 'data', 'estado.json');
const port = Number(process.env.PORT || 8099);
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.gif': 'image/gif', '.mp3': 'audio/mpeg', '.wav': 'audio/wav', '.txt': 'text/plain; charset=utf-8', '.ico': 'image/x-icon', '.woff2': 'font/woff2' };

const send = (res, code, body, type = 'application/json; charset=utf-8') => { res.writeHead(code, { 'Content-Type': type, 'Cache-Control': 'no-store', 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET,PUT,POST,OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type,x-owner-key' }); res.end(body); };

// Dono: máquina local (sem proxy) OU quem manda a chave de data/owner.key. Visitante só alcança o tour e o POST de lead.
const keyFile = path.join(here, 'data', 'owner.key'); let OWNER_KEY = process.env.OWNER_KEY || '';
if (!OWNER_KEY) { try { OWNER_KEY = fs.readFileSync(keyFile, 'utf-8').trim(); } catch {} }
if (!OWNER_KEY) { OWNER_KEY = crypto.randomBytes(16).toString('hex'); fs.mkdirSync(path.dirname(keyFile), { recursive: true }); fs.writeFileSync(keyFile, OWNER_KEY); }
const isLocal = req => !req.headers['x-forwarded-for'] && /^(::1|127\.0\.0\.1|::ffff:127\.0\.0\.1)$/.test(req.socket.remoteAddress || '');
const isOwner = (req, url) => isLocal(req) || (OWNER_KEY && (req.headers['x-owner-key'] === OWNER_KEY || url.searchParams.get('k') === OWNER_KEY));

http.createServer((req, res) => {
  const url = new URL(req.url, 'http://localhost');
  if (req.method === 'OPTIONS') return send(res, 204, '');
  if (url.pathname === '/api/sede/auth') return send(res, 200, JSON.stringify({ dono: isOwner(req, url) }));
  if ((url.pathname === '/api/sede/estado' || /\/sede-3d\/data\//i.test(url.pathname) || /owner\.key/i.test(url.pathname)) && !isOwner(req, url)) return send(res, 403, JSON.stringify({ erro: 'area restrita' }));
  if (url.pathname === '/api/sede/estado') {
    if (req.method === 'GET') {
      try { return send(res, 200, fs.readFileSync(stateFile, 'utf-8')); } catch { return send(res, 200, 'null'); }
    }
    if (req.method === 'PUT') {
      let body = ''; req.on('data', c => { body += c; if (body.length > 5e6) req.destroy(); });
      req.on('end', () => { try { JSON.parse(body); fs.mkdirSync(path.dirname(stateFile), { recursive: true }); fs.writeFileSync(stateFile, body); send(res, 200, '{"ok":true}'); } catch (e) { send(res, 400, JSON.stringify({ erro: String(e.message) })); } });
      return;
    }
  }
  if (url.pathname === '/api/tour/lead' && req.method === 'POST') {
    let body = ''; req.on('data', c => { body += c; if (body.length > 1e6) req.destroy(); });
    req.on('end', () => {
      try {
        const L = JSON.parse(body);
        if (!L || !L.nome || !L.whatsapp) return send(res, 400, JSON.stringify({ erro: 'faltam nome e whatsapp' }));
        const clip = (v, n = 200) => String(v ?? '').slice(0, n);
        const lead = { id: clip(L.id, 20) || 'TR' + Date.now(), criadoEm: new Date().toISOString(), teste: !!L.teste, ref: clip(L.ref, 60), nome: clip(L.nome, 80), empresa: clip(L.empresa, 120), ramo: clip(L.ramo, 60), cidade: clip(L.cidade, 80), tamanho: clip(L.tamanho, 30), dores: (Array.isArray(L.dores) ? L.dores : []).map(x => clip(x, 80)).slice(0, 8), presenca: (Array.isArray(L.presenca) ? L.presenca : []).map(x => clip(x, 60)).slice(0, 6), momento: clip(L.momento, 120), pacote: clip(L.pacote, 12), horario: clip(L.horario, 60), whatsapp: clip(L.whatsapp, 30), consentimento: !!L.consentimento, mobile: !!L.mobile };
        const f = path.join(here, 'data', 'leads-tour.json'); fs.mkdirSync(path.dirname(f), { recursive: true });
        let all = []; try { all = JSON.parse(fs.readFileSync(f, 'utf-8')); } catch {} all.push(lead); fs.writeFileSync(f, JSON.stringify(all, null, 1));
        // cria as tarefas na fila do chefe (mesmo arquivo que a Sede e o executor usam)
        let e = null; try { e = JSON.parse(fs.readFileSync(stateFile, 'utf-8')); } catch {}
        if (!e || !Array.isArray(e.tarefas)) e = { v: 0, tarefas: [], pausa: false, meta: null, log: [], alvo: null, reunioes: [] };
        const now = Date.now(), tag = lead.teste ? '[TESTE] ' : '', mk = (titulo, detalhe, dono, tipo, status) => ({ id: 'T' + Math.random().toString(36).slice(2, 8), titulo, detalhe, dono, tipo, status, criadoEm: now, feitoEm: null, resultado: '' });
        const resumo = `${lead.nome} · ${lead.empresa} (${lead.ramo}, ${lead.cidade}, ${lead.tamanho}). Dores: ${lead.dores.join('; ') || '-'}. Já tem: ${lead.presenca.join(', ') || '-'}. Momento: ${lead.momento}. Pacote indicado: ${lead.pacote}. WhatsApp ${lead.whatsapp}. Quer conversar: ${lead.horario}. Origem: ${lead.ref}.`;
        e.tarefas.push(mk(tag + 'Preparar a Análise Estratégica de ' + lead.empresa, resumo, 'prospeccao', 'preparar', 'aprovada'));
        e.tarefas.push(mk(tag + 'Confirmar reunião com ' + lead.nome + ' (' + lead.empresa + ') · ' + lead.horario, 'Mensagem de confirmação por WhatsApp para ' + lead.whatsapp + '. ' + resumo, 'vendas', 'enviar', 'pendente'));
        (e.log = e.log || []).push({ t: now, txt: tag + 'Novo lead do tour: ' + lead.nome + ' / ' + lead.empresa + ' (origem ' + lead.ref + ')' });
        e.v = now; fs.writeFileSync(stateFile, JSON.stringify(e));
        send(res, 200, JSON.stringify({ ok: true, id: lead.id }));
      } catch (err) { send(res, 400, JSON.stringify({ erro: String(err.message) })); }
    });
    return;
  }
  let p = decodeURIComponent(url.pathname); if (p.endsWith('/')) p += 'index.html';
  const file = path.normalize(path.join(root, p));
  if (!file.startsWith(root)) return send(res, 403, 'proibido', 'text/plain');
  fs.stat(file, (err, st) => {
    if (err || !st.isFile()) return send(res, 404, 'não encontrado', 'text/plain; charset=utf-8');
    res.writeHead(200, { 'Content-Type': MIME[path.extname(file).toLowerCase()] || 'application/octet-stream', 'Cache-Control': 'no-cache' });
    fs.createReadStream(file).pipe(res);
  });
}).listen(port, () => console.log('mundos 3D em http://localhost:' + port));
