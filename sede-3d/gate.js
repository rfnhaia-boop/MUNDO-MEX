/* Porteiro da Sede: sem ?visita=1, só o dono entra. Local = dono; remoto = chave (?dono=CHAVE, guardada no navegador). Visitante vai pro tour. */
(function(){
  var Q=new URLSearchParams(location.search); if(Q.get('visita')==='1') return;
  try{ if(Q.get('dono')){ localStorage.setItem('nexOwnerKey',Q.get('dono')); Q.delete('dono'); history.replaceState(null,'',location.pathname+(Q.toString()?'?'+Q:'')); } }catch(e){}
  var k=''; try{ k=localStorage.getItem('nexOwnerKey')||''; }catch(e){}
  var ok=false; try{ var x=new XMLHttpRequest(); x.open('GET','/api/sede/auth',false); x.setRequestHeader('x-owner-key',k); x.send(); ok=x.status===200&&JSON.parse(x.responseText).dono===true; }catch(e){ ok=false; }
  if(!ok){ location.replace('../tour/index.html'); throw new Error('acesso restrito: visitante'); }
})();
