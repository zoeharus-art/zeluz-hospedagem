const assert=require('assert/strict');
const path=require('path');
const hist=require('../auaulandia/historico-checkins.js');
const mapa={
 a:{nome:'Hóspede Exemplo',tutor:'Responsável Árvore',entrada:'2026-10-03',saida:'2026-10-10',_ts:10,criado_por:'Consultora Exemplo'},
 b:{nome:'Hóspede Exemplo',tutor:'Responsável B',entrada:'2026-09-28',saida:'2026-10-04',_ts:20,conferencia:{concluida:true,concluida_por:'Monitor Exemplo',concluida_ts:1}},
 c:{nome:'Outro Hóspede',tutor:'Responsavel Arvore',entrada:'2026-10-11',saida:'2026-10-12',_ts:30},
 d:{nome:'Sem data',tutor:'Ninguém',_ts:40}
};
function playwrightLocal(){
  const locais=[process.env.HIST_CI_PLAYWRIGHT,'C:/Users/zeluz/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright'].filter(Boolean);
  for(const local of locais){try{return require(local);}catch(e){}}
  throw new Error('Playwright local não está disponível para o teste DOM.');
}
function mapaDom(){
  const out={hospedeExemplo:{nome:'Hóspede Exemplo',tutor:'Tutor Exemplo',entrada:'2026-10-03',saida:'2026-10-10',_ts:999,criado_por:'Consultora Exemplo',assinado_por:'Tutor Exemplo',assinatura:'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScL7WQAAAABJRU5ErkJggg==',conferencia:{concluida:true,concluida_por:'Monitor Exemplo',concluida_ts:1760001000000},checkout_etapa1:{quem:'Preparador Exemplo',ts:'2026-10-10T12:28:00Z'},checkout:{quem:'Consultora Exemplo',ts:'2026-10-10T16:01:00Z',semTutor:true,assinado_por:'Assinatura fictícia',assinatura:'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScL7WQAAAABJRU5ErkJggg=='}}};
  for(let i=0;i<20;i++) out['r'+i]={nome:'Animal '+i,tutor:'Tutor '+i,entrada:'2026-09-01',saida:'2026-09-02',_ts:900-i,criado_por:'Equipe'};
  out.r0.conferencia={concluida:false,pertences:{coleira:'Azul'}};
  out.r0.entregaSemTutor=true;
  out.r0.checkout_etapa1={quem:'Preparador Exemplo',ts:'2026-09-02T12:00:00Z',conferido:{coleira:true},obs:'Bolsa pronta'};
  return out;
}
async function testeDom(){
  const {chromium}=playwrightLocal();
  const chrome=process.env.HIST_CI_CHROME||'C:/Program Files/Google/Chrome/Application/chrome.exe';
  const browser=await chromium.launch({headless:true,executablePath:chrome});
  try{
    const page=await browser.newPage({viewport:{width:390,height:844}});
    await page.setContent('<main><div id="histCiConteudo"></div></main>');
    await page.addScriptTag({path:path.resolve(__dirname,'../auaulandia/historico-checkins.js')});
    await page.evaluate(function(dados){
      window.__permitido=true; window.__fotoPendentes=[];
      window.usuarioAtual=function(){return window.__permitido?{id:'sessao'}:null;}; window.podePapel=function(cap){return window.__permitido&&cap==='historico-checkins';};
      window.histCiSecoesConferencia=function(){return [{titulo:'Conferência de entrada',linhas:[{k:'Coleira',v:'Azul'},{t:'Observação registrada'}]}];};
      window.histCiSecoesCheckout=function(e){if(e.nome==='Animal 1')throw new Error('falha de seção');var e1=e.checkout_etapa1||{},s=[{titulo:'ETAPA 3 — CHECK-OUT: BOLSA MONTADA',linhas:e1.obs?[{k:'Bolsa',v:e1.obs}]:[]},{titulo:'ETAPA 4 — CONFERÊNCIA DO CHECK-OUT',linhas:e.checkout?[{k:'Saída',v:'Conferida'}]:[{t:'Nenhuma conferência final foi registrada.'}]}];if(e.checkout)s.push({titulo:'ITENS QUE NÃO DESCERAM',linhas:[{t:'Item sintético pendente'}]});return s;};
      window.histCiLerFotos=function(id){return new Promise(function(resolve,reject){window.__fotoPendentes.push({id:id,resolve:resolve,reject:reject});});};
      window.CF_ESTADIAS_LIDO=true; window.EST_TODAS=dados; return window.histCiAbrir();
    },mapaDom());
    assert.equal(await page.locator('[data-action="abrir"]').count(),20,'paginação mantém os 20 cards iniciais visíveis');
    assert.equal(await page.locator('[data-action="abrir"].pm-card').count(),20,'lista herda o card nativo do aplicativo sem trocar a navegação');
    assert.equal(await page.getByLabel('Hospedado entre').count(),1,'data inicial tem rótulo visível e específico');
    assert.equal(await page.getByLabel('Hospedado até').count(),1,'data final tem rótulo visível e específico');
    assert.equal(await page.getByLabel('Estado da conferência').locator('option:checked').textContent(),'Todas as situações','filtro inicia sem limitar situações');
    await page.locator('[data-action="abrir"]').first().click();
    assert.equal(await page.locator('[data-action="abrir"]').count(),0,'detalhe substitui a lista em vez de ficar depois dos cards');
    assert.equal(await page.getByText('Resumo da hospedagem').count(),1,'detalhe mostra as quatro etapas compactas');
    const etapas=await page.locator('.hist-ci-etapa').allTextContents();
    assert.match(etapas[0],/^Check-in[\s\S]*Consultora: Consultora Exemplo/,'check-in identifica a autoria real da consultora');
    assert.match(etapas[1],/^Conferência do check-in[\s\S]*Monitor: Monitor Exemplo/,'conferência de entrada identifica o monitor real');
    assert.match(etapas[2],/^Check-out[\s\S]*Monitor: Preparador Exemplo/,'check-out mostra somente a etapa da bolsa do monitor');
    assert.match(etapas[3],/^Conferência do check-out[\s\S]*Consultora: Consultora Exemplo/,'conferência final usa o registro real da consultora');
    assert.equal(await page.locator('details.hist-ci-conferencia > summary').textContent(),'Conferência do check-in','itens pertencem à conferência de entrada');
    assert.equal(await page.locator('details.hist-ci-saida > summary').textContent(),'Conferência do check-out','saída usa as seções preparadas pelo leitor');
    assert.match(await page.locator('details.hist-ci-saida').textContent(),/Item sintético pendente/,'itens pendentes da saída permanecem na conferência final');
    assert.match(await page.locator('.hist-ci-etapas').textContent(),/Retirada sem o tutor/,'saída sem tutor não inventa presença do tutor');
    assert.equal(await page.locator('.hist-ci-assinatura').count(),1,'assinatura do check-in permanece na evidência da entrada');
    assert.equal(await page.locator('.hist-ci-evidencia-assinatura').first().locator('h4').textContent(),'Check-in','assinatura da entrada não é mostrada como conferência do monitor');
    assert.equal(await page.locator('details.hist-ci-saida .hist-ci-assinatura').count(),0,'saída sem tutor não exibe assinatura alegada');
    assert.equal(await page.getByRole('button',{name:'Ver fotos da conferência do check-in'}).count(),1,'fotos não são carregadas antes do clique');
    await page.getByRole('button',{name:'Ver fotos da conferência do check-in'}).click();
    await page.waitForFunction(function(){return window.__fotoPendentes.length===1;});
    await page.getByRole('button',{name:'Voltar aos resultados'}).click();
    await page.locator('[data-action="abrir"][data-id="r0"]').click();
    await page.getByRole('button',{name:'Voltar aos resultados'}).click();
    await page.locator('[data-action="abrir"][data-id="hospedeExemplo"]').click();
    await page.evaluate(function(){window.__fotoPendentes[0].resolve(['data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScL7WQAAAABJRU5ErkJggg==']);});
    await page.waitForTimeout(20);
    await page.locator('[data-action="foto-ampliar"]').waitFor();
    assert.equal(await page.evaluate(function(){return window.__fotoPendentes.length;}),1,'retorno A é reaproveitado ao voltar para A sem nova leitura');
    await page.locator('[data-action="foto-ampliar"]').click();
    assert.equal(await page.locator('#histCiFotoDialog').count(),1,'miniatura abre foto ampliada em diálogo');
    await page.getByRole('button',{name:'Fechar foto'}).click();
    assert.equal(await page.locator('#histCiFotoDialog').count(),0,'diálogo de foto tem fechamento acessível');
    await page.getByRole('button',{name:'Voltar aos resultados'}).click();
    await page.locator('[data-action="abrir"][data-id="r0"]').click();
    await page.getByRole('button',{name:'Ver fotos da conferência do check-in'}).click();
    assert.match(await page.locator('.hist-ci-etapas').textContent(),/Pendente de conclusão[\s\S]*Preparador Exemplo/,'conferência parcial e bolsa em checkout são explicitadas');
    assert.equal(await page.locator('details.hist-ci-checkout > summary').textContent(),'Check-out','bolsa e observação ficam na etapa do monitor');
    assert.match(await page.locator('details.hist-ci-checkout').textContent(),/Bolsa pronta/,'observação gravada da bolsa não aparece na conferência final');
    assert.match(await page.locator('.hist-ci-etapas').textContent(),/Conferência do check-out[\s\S]*não registrada/,'etapa final ausente não é inferida a partir da bolsa');
    assert.match(await page.locator('.hist-ci-evidencia-assinatura').textContent(),/Entrada sem a presença do tutor/,'ausência do tutor na entrada não é confundida com retirada');
    await page.waitForFunction(function(){return window.__fotoPendentes.length===2;});
    await page.evaluate(function(){window.__fotoPendentes[1].reject(new Error('falha'));});
    await page.getByText('Não foi possível carregar as fotos da conferência do check-in.').waitFor();
    await page.getByRole('button',{name:'Tentar novamente'}).click();
    await page.waitForFunction(function(){return window.__fotoPendentes.length===3;});
    await page.evaluate(function(){window.__fotoPendentes[2].resolve(['data:image/svg+xml;base64,PHN2Zz4=']);});
    await page.getByText('Não foi possível carregar as fotos da conferência do check-in.').waitFor();
    await page.getByRole('button',{name:'Tentar novamente'}).click();
    await page.waitForFunction(function(){return window.__fotoPendentes.length===4;});
    await page.evaluate(function(){window.__permitido=false;window.__fotoPendentes[3].resolve(['data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScL7WQAAAABJRU5ErkJggg==']);});
    await page.getByText('Você não tem permissão para consultar este histórico.').waitFor();
    assert.equal(await page.locator('[data-action="foto-ampliar"]').count(),0,'revogação de permissão não expõe foto pendente');
    await page.evaluate(function(){window.__permitido=true;}); await page.evaluate(function(){return window.histCiAbrir();});
    await page.getByRole('button',{name:'Voltar aos resultados'}).click();
    await page.locator('[data-action="abrir"][data-id="hospedeExemplo"]').click();
    assert.equal(await page.getByRole('button',{name:'PDF da conferência de check-out'}).count(),1,'conferência final registrada oferece seu PDF');
    await page.evaluate(function(){window.EST_TODAS.hospedeExemplo.checkout.semTutor=false;window.histCiReceberEstadias(window.EST_TODAS);});
    assert.equal(await page.locator('details.hist-ci-saida .hist-ci-evidencia-assinatura').count(),1,'assinatura final fica dentro da conferência do check-out');
    assert.equal(await page.locator('details.hist-ci-saida .hist-ci-evidencia-assinatura h4').textContent(),'Conferência do check-out','assinatura final não é apresentada como assinatura do check-in');
    await page.getByRole('button',{name:'Voltar aos resultados'}).click();
    await page.locator('[data-action="abrir"][data-id="r1"]').click();
    assert.equal(await page.getByRole('button',{name:'Conferência do check-out não registrada'}).isDisabled(),true,'bolsa ou finalização ausentes não liberam PDF de check-out');
    assert.equal(await page.getByText('Não foi possível exibir esta seção.').count(),2,'falha do helper deixa explícita a indisponibilidade das duas etapas de saída');
    assert.equal(await page.getByText('Nenhuma imagem de assinatura registrada.').count(),1,'etapa registrada sem imagem de assinatura informa a ausência');
    await page.getByRole('button',{name:'Voltar aos resultados'}).click();
    assert.equal(await page.locator('[data-action="abrir"]').count(),20,'voltar restaura a página de resultados');
    const busca=page.locator('[data-field="busca"]'); await busca.fill('Hóspede Exemplo');
    assert.equal(await page.evaluate(function(){return document.activeElement===document.querySelector('[data-field="busca"]');}),true,'digitar não recria o input nem perde foco');
    const card=page.locator('[data-action="abrir"]'); assert.equal(await card.count(),1,'busca reduz sem ocultar a estadia encontrada');
    assert.match(await card.textContent(),/Consultora Exemplo/,'card mostra autoria e data do check-in');
    assert.match(await card.textContent(),/Monitor Exemplo/,'card mostra autoria e data da conferência');
    await card.click(); await page.getByRole('button',{name:'Voltar aos resultados'}).click();
    assert.equal(await busca.inputValue(),'Hóspede Exemplo','voltar preserva filtros da consulta');
    const datas=page.locator('input[type="date"]'); await datas.nth(0).fill('2026-10-10'); await datas.nth(1).fill('2026-10-01');
    assert.match(await page.locator('.hist-ci-corpo').textContent(),/data final deve ser igual ou posterior/i,'intervalo inválido é explicado sem resultado zero');
  }finally{await browser.close();}
}
const manterTeste=setInterval(function(){},1000);
(async function(){
  assert.equal(hist.normalizar('ÁRVORE'),'arvore','busca normaliza acentos');
  assert.deepEqual(hist.filtrar(mapa,{busca:'hóspede exemplo'},null).map(x=>x.id),['b','a'],'duas estadias do mesmo pet permanecem no histórico');
  assert.deepEqual(hist.filtrar(mapa,{busca:'arvore'},null).map(x=>x.id),['c','a'],'homônimos/tutores com e sem acento são encontrados');
  assert.deepEqual(hist.filtrar(mapa,{inicio:'2026-10-04',fim:'2026-10-04'},null).map(x=>x.id),['b','a'],'intervalo inclui estadias que sobrepõem a data consultada');
  assert.deepEqual(hist.filtrar(mapa,{inicio:'2026-10-11',fim:'2026-10-11'},null).map(x=>x.id),['c'],'intervalo não inclui ausência de datas nem período fora da estadia');
  assert.equal(hist.datasInvalidas({inicio:'2026-10-11',fim:'2026-10-10'}),true,'fim anterior ao início é inválido');
  assert.equal(hist.filtrar(mapa,{estado:'conferida'},null).length,1,'filtro de conferida usa a conferência salva');
  assert.equal(hist.resumoPadrao({}).checkinQuando,'não registrado','campos ausentes são explícitos');
  assert.equal(hist.seguroImagem('javascript:alert(1)'),false,'fonte de imagem insegura é recusada');
  assert.equal(hist.seguroImagem('data:image/svg+xml;base64,abc'),false,'SVG não é aceito como foto');
  assert.equal(hist.temCheckout({finalizada:true}),false,'status finalizada sozinho não inventa checkout');
  assert.equal(hist.temCheckout({checkout_etapa1:{quem:'Equipe'}}),false,'bolsa isolada não habilita PDF de checkout');
  assert.equal(hist.temCheckout({checkout:{}}),false,'objeto vazio de checkout não habilita PDF da conferência final');
  assert.equal(hist.temDadosConferencia({concluida:false,pertences:{coleira:'Azul'}}),true,'itens salvos tornam a conferência pendente explícita');
  assert.equal(hist.temDadosConferencia({concluida:false}),false,'flag pendente sem dados não inventa conferência');
  assert.equal(hist.permitido({podePapel(){return false;}}),false,'função nega acesso sem capacidade');
  assert.equal(hist.permitido({podePapel(){return true;}}),false,'função de sessão ausente não autoriza consulta');
  assert.equal(hist.permitido({podePapel(){return true;},usuarioAtual(){return null;}}),false,'pré-login não autoriza consulta pelo papel provisório');
  const reutiliza={CF_ESTADIAS_LIDO:true,EST_TODAS:mapa,usuarioAtual(){return {id:'sessao'};},podePapel(){return true;},DB:{ref(){throw new Error('não deve ler quando o mapa está pronto');}}};
  await hist.abrir(reutiliza); assert.equal(reutiliza.__histCiEstado.mapa,mapa,'mapa global completo é reutilizado quando indexado');
  const falha={usuarioAtual(){return {id:'sessao'};},podePapel(){return true;},histCiLerEstadias(){return Promise.reject(new Error('falha de leitura'));}};
  await hist.carregar(falha); assert.equal(hist.estadoFonte(falha.__histCiEstado),'erro','rejeição da leitura fica no estado de erro'); assert.match(falha.__histCiEstado.erro,/falha de leitura/,'erro remoto não vira resultado zero');
  const negado={podePapel(){return false;},histCiLerEstadias(){throw new Error('não pode ler');}};
  assert.equal(await hist.carregar(negado),false,'carregar também nega antes de solicitar leitura');
  await testeDom();
  clearInterval(manterTeste);
  console.log('ok: histórico filtra, protege leitura e passa interação DOM mobile');
})().catch(function(e){clearInterval(manterTeste);console.error(e);process.exitCode=1;});
