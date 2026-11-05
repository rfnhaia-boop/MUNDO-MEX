// TESTES DO MODO DONO DA CEASA (auth, mídia com data/lote, custo privado, 2 passos). Rodar: node --test testes/ceasa/dono.test.mjs
import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import http from 'node:http';

process.env.CEASA_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'ceasa-t-'));
process.env.CEASA_DONO_PIN = 'pin-de-teste-123';
const D = await import('../../ceasa-dono.mjs');
const send = (res, code, body, type = 'application/json; charset=utf-8') => { res.writeHead(code, { 'Content-Type': type }); res.end(body); };
let srv, base;
before(async () => { srv = http.createServer((req, res) => { const url = new URL(req.url, 'http://x'); D.trata(req, res, url, send); }); await new Promise(r => srv.listen(0, '127.0.0.1', r)); base = 'http://127.0.0.1:' + srv.address().port; });
after(() => { srv.close(); fs.rmSync(process.env.CEASA_DIR, { recursive: true, force: true }); });
const J = async (p, o = {}) => { const r = await fetch(base + p, o); const t = await r.text(); let b; try { b = JSON.parse(t); } catch { b = t; } return { s: r.status, b }; };
const JPG = Buffer.concat([Buffer.from([0xff, 0xd8, 0xff, 0xe0]), Buffer.alloc(40, 1)]);
const login = async () => (await J('/api/ceasa/dono/login', { method: 'POST', body: JSON.stringify({ pin: process.env.CEASA_DONO_PIN }) })).b.token;

test('D1 sem login o dono não faz nada (upload, aplicar, beto, estado privado)', async () => {
  for (const [m, p] of [['POST', '/api/ceasa/dono/midia'], ['POST', '/api/ceasa/dono/aplicar'], ['POST', '/api/ceasa/dono/beto'], ['GET', '/api/ceasa/dono/estado']]) assert.equal((await J(p, { method: m, body: m === 'POST' ? '{}' : undefined })).s, 401, p);
});
test('D2 PIN errado é recusado e depois de 5 erros bloqueia mesmo com o PIN certo', async () => {
  for (let i = 0; i < 5; i++) assert.equal((await J('/api/ceasa/dono/login', { method: 'POST', body: JSON.stringify({ pin: 'errado' + i }) })).s, 401);
  assert.equal((await J('/api/ceasa/dono/login', { method: 'POST', body: JSON.stringify({ pin: process.env.CEASA_DONO_PIN }) })).s, 429);
});
test('D3 definir PIN só vale pra requisição local (com x-forwarded-for é recusado)', async () => {
  const r = await J('/api/ceasa/dono/definir-pin', { method: 'POST', headers: { 'x-forwarded-for': '8.8.8.8' }, body: JSON.stringify({ pin: 'novopin123' }) });
  assert.equal(r.s, 403);
});
test('D4 upload de foto: data de postagem é do servidor, tipo vem do conteúdo, e a foto aparece pública com lote e data', async () => {
  const D2 = await import('../../ceasa-dono.mjs'); void D2;
  // o bloqueio de D2 é por IP; limpa usando outro IP simulado
  const token = (await J('/api/ceasa/dono/login', { method: 'POST', headers: { 'x-forwarded-for': '10.0.0.9' }, body: JSON.stringify({ pin: process.env.CEASA_DONO_PIN }) })).b.token;
  assert.ok(token, 'login deveria funcionar de outro IP');
  const H = { 'x-dono-token': token, 'x-produto': 'banprata', 'x-lote': encodeURIComponent('L-0412'), 'x-origem': encodeURIComponent('Bom Jesus da Lapa · BA'), 'x-fotografado-em': new Date().toISOString().slice(0, 10) };
  const up = await J('/api/ceasa/dono/midia', { method: 'POST', headers: H, body: JPG }); assert.equal(up.s, 200, JSON.stringify(up.b));
  assert.equal(up.b.midia.tipo, 'foto'); assert.ok(up.b.midia.postadoEm); assert.equal(up.b.midia.lote, 'L-0412');
  const pub = await J('/api/ceasa/estado'); assert.equal(pub.b.midia[0].produto, 'banprata');
  const arq = await fetch(base + '/api/ceasa/arquivo/' + up.b.midia.arquivo); assert.equal(arq.status, 200); assert.equal(arq.headers.get('content-type'), 'image/jpeg');
  globalThis.__tok = token; globalThis.__mid = up.b.midia;
});
test('D5 arquivo que não é foto/vídeo (script disfarçado de jpg) é recusado; data futura e produto inválido também', async () => {
  const H = { 'x-dono-token': globalThis.__tok, 'x-produto': 'banprata' };
  assert.equal((await J('/api/ceasa/dono/midia', { method: 'POST', headers: H, body: Buffer.from('<script>alert(1)</script>') })).s, 415);
  assert.equal((await J('/api/ceasa/dono/midia', { method: 'POST', headers: { ...H, 'x-fotografado-em': '2999-01-01' }, body: JPG })).s, 400);
  assert.equal((await J('/api/ceasa/dono/midia', { method: 'POST', headers: { ...H, 'x-produto': '../../etc' }, body: JPG })).s, 400);
  assert.equal((await J('/api/ceasa/arquivo/..%2f..%2fserver.mjs')).s, 404);
});
test('D6 o custo que o dono paga nunca aparece na rota pública, só na do dono', async () => {
  const tok = globalThis.__tok, ap = await J('/api/ceasa/dono/aplicar', { method: 'POST', headers: { 'x-dono-token': tok }, body: JSON.stringify({ propostas: [{ tipo: 'custo', id: 'banprata', valor: 61.5 }, { tipo: 'preco', id: 'banprata', valor: 85 }, { tipo: 'chegada', id: 'laranja' }, { tipo: 'disponivel', id: 'limao', valor: false }, { tipo: 'aviso', texto: 'Laranja nova chegou' }] }) });
  assert.equal(ap.s, 200); assert.ok(ap.b.feitas.length >= 5);
  const pub = JSON.stringify((await J('/api/ceasa/estado')).b); assert.ok(!/custo/i.test(pub) && !pub.includes('61.5'), 'custo vazou na rota pública');
  const priv = await J('/api/ceasa/dono/estado', { headers: { 'x-dono-token': tok } }); assert.equal(priv.b.produtos.banprata.custoCaixa, 61.5);
  assert.equal((await J('/api/ceasa/estado')).b.produtos.limao.disponivel, false);
});
test('D7 propostas inválidas (valor negativo, id estranho, NaN) são ignoradas', async () => {
  const r = await J('/api/ceasa/dono/aplicar', { method: 'POST', headers: { 'x-dono-token': globalThis.__tok }, body: JSON.stringify({ propostas: [{ tipo: 'preco', id: 'gala', valor: -5 }, { tipo: 'preco', id: 'GALA;x', valor: 5 }, { tipo: 'preco', id: 'gala', valor: 'abc' }, { tipo: 'preco', id: 'gala', valor: 1e9 }] }) });
  assert.deepEqual(r.b.feitas, []);
});
test('D8 o resumo pro Beto-cliente só cita foto, data e lote que existem de verdade', () => {
  const t = D.resumoParaBeto(['banprata', 'gala']);
  assert.ok(/banprata: mídia real \(foto\)/.test(t) && /L-0412/.test(t)); assert.ok(!/gala: mídia real/.test(t), 'gala não tem foto e não pode ser citada como real');
});
test('D9 apagar mídia remove do registro e do disco', async () => {
  const m = globalThis.__mid, r = await J('/api/ceasa/dono/midia/' + m.id, { method: 'DELETE', headers: { 'x-dono-token': globalThis.__tok } }); assert.equal(r.s, 200);
  assert.equal((await fetch(base + '/api/ceasa/arquivo/' + m.arquivo)).status, 404);
});
test('D10 imagem de demonstração aparece pública com selo demo, mas o Beto não a trata como foto real e não existe rota HTTP pra criar demo', async () => {
  const id = D.registraDemo(JPG, 'laranja'); const pub = (await J('/api/ceasa/estado')).b.midia.find(m => m.id === id);
  assert.equal(pub.demo, true); assert.ok(!/laranja: mídia real/.test(D.resumoParaBeto(['laranja'])), 'demo contou como foto real');
  const r = await J('/api/ceasa/dono/midia', { method: 'POST', headers: { 'x-dono-token': globalThis.__tok, 'x-produto': 'laranja', 'x-demo': '1' }, body: JPG });
  assert.ok(!r.b.midia || r.b.midia.demo !== true, 'cliente/dono não pode criar demo por HTTP'); assert.equal(D.limpaDemos() >= 1, true);
});
