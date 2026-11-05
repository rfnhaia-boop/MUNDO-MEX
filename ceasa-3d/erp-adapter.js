/*
 * Ponte NEW CEASA -> ERP
 *
 * Configure antes deste arquivo:
 * window.CEASA_ERP_CONFIG = {
 *   baseUrl: 'https://erp.seudominio.com/api',
 *   credentials: 'include',
 *   headers: { 'X-Tenant-Id': '...' },
 *   paths: {
 *     health: '/health', catalogo: '/catalogo', estoque: '/estoque/consultar',
 *     cliente: '/clientes/:documento', ultimaCompra: '/pedidos/ultimo',
 *     pedidos: '/pedidos', statusPedido: '/pedidos/:id'
 *   }
 * };
 *
 * O servidor deve autenticar por sessão segura/HttpOnly. Não coloque segredos neste arquivo.
 */
(function initCeasaERP(global){
  'use strict';
  if(global.CEASA_ERP && global.CEASA_ERP.__newCeasaAdapter) return;

  const config=global.CEASA_ERP_CONFIG||{};
  const baseUrl=String(config.baseUrl||'').replace(/\/$/,'');
  const paths=Object.assign({
    health:'/health', catalogo:'/catalogo', estoque:'/estoque/consultar',
    cliente:'/clientes/:documento', ultimaCompra:'/pedidos/ultimo',
    pedidos:'/pedidos', statusPedido:'/pedidos/:id'
  },config.paths||{});

  class ERPError extends Error{
    constructor(message,status,detail){ super(message); this.name='ERPError'; this.status=status||0; this.detail=detail||null; }
  }
  const path=(template,params={})=>Object.entries(params).reduce((out,[key,value])=>out.replace(':'+key,encodeURIComponent(value)),template);
  const query=params=>{
    const q=new URLSearchParams(); Object.entries(params||{}).forEach(([k,v])=>{ if(v!==undefined&&v!==null&&v!=='') q.set(k,v); });
    const value=q.toString(); return value?'?'+value:'';
  };
  async function request(urlPath,{method='GET',body,idempotencyKey,timeout=12000}={}){
    if(!baseUrl) throw new ERPError('ERP ainda não configurado');
    const controller=new AbortController(), timer=setTimeout(()=>controller.abort(),timeout);
    try{
      const headers=Object.assign({'Accept':'application/json'},config.headers||{});
      if(body!==undefined) headers['Content-Type']='application/json';
      if(idempotencyKey) headers['Idempotency-Key']=idempotencyKey;
      const response=await fetch(baseUrl+urlPath,{method,headers,credentials:config.credentials||'include',body:body===undefined?undefined:JSON.stringify(body),signal:controller.signal});
      const type=response.headers.get('content-type')||'';
      const data=type.includes('application/json')?await response.json():await response.text();
      if(!response.ok) throw new ERPError((data&&data.message)||`ERP respondeu ${response.status}`,response.status,data);
      return data;
    }catch(error){
      if(error.name==='AbortError') throw new ERPError('Tempo de resposta do ERP esgotado',408);
      throw error;
    }finally{ clearTimeout(timer); }
  }
  const unwrapList=data=>Array.isArray(data)?data:Array.isArray(data&&data.items)?data.items:Array.isArray(data&&data.data)?data.data:[];
  const normalizeProduct=(item,index=0)=>({
    sku:String(item.sku??item.codigo??item.id??`P${index+1}`),
    nome:String(item.nome??item.name??item.descricao??'Produto'),
    preco:Number(item.preco??item.price??item.valor??0)||0,
    estoque:Number(item.estoque??item.stock??item.quantidade??0)||0,
    categoria:String(item.categoria??item.category??''),
    ativo:item.ativo!==false&&item.active!==false,
    atualizadoEm:item.atualizadoEm??item.updatedAt??null
  });

  const adapter={
    __newCeasaAdapter:true,
    mode:baseUrl?'remote':'local',
    connected:!!baseUrl,
    ERPError,
    async ping(){ return request(paths.health); },
    async catalogo(){ const data=await request(paths.catalogo+query({canal:'ceasa-3d'})); return unwrapList(data).map(normalizeProduct); },
    async estoque(ids=[]){ return request(paths.estoque,{method:'POST',body:{skus:ids,canal:'ceasa-3d'}}); },
    async cliente(documento){ return request(path(paths.cliente,{documento:String(documento||'').replace(/\D/g,'')})); },
    async ultimaCompra(cliente={}){ const data=await request(paths.ultimaCompra+query({clienteId:cliente.id,documento:String(cliente.documento||'').replace(/\D/g,'')})); return unwrapList(data.itens||data).map(item=>({id:String(item.id??item.sku??item.codigo),q:Number(item.q??item.qtd??item.quantidade??1)||1})); },
    async criarPedido(pedido){ return request(paths.pedidos,{method:'POST',body:pedido,idempotencyKey:pedido.id}); },
    async statusPedido(id){ return request(path(paths.statusPedido,{id})); }
  };
  global.CEASA_ERP=adapter;
  global.dispatchEvent(new CustomEvent('ceasa:erp-ready',{detail:{mode:adapter.mode,connected:adapter.connected}}));
})(window);
