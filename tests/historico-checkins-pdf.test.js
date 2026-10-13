'use strict';

const assert=require('assert');
const fs=require('fs');
const os=require('os');
const path=require('path');
const vm=require('vm');
const cp=require('child_process');

const pdf=require('../auaulandia/historico-checkins-pdf');
const raiz=path.resolve(__dirname,'..');
// A fonte privada só entra por variável de ambiente. O fallback é neutro e não
// versionado, para que o teste portátil não aponte para documentos reais.
const fontePrivadaOpcional=process.env.HIST_CI_FIXTURE_PRIVADA||path.resolve(raiz,'tests','.retrato','hospedagem-qa-privada.json');
const privado=fs.existsSync(fontePrivadaOpcional)?JSON.parse(fs.readFileSync(fontePrivadaOpcional,'utf8')):null;
const IMAGEM_TESTE='data:image/jpeg;base64,/9j/2Q==';

function fixturePortatil(){
  const pertences=Array.from({length:12},(_,i)=>({uid:'p'+i,k:'outro',nome:'Item '+String(i).padStart(2,'0')}));
  const conferenciaPertences={}; pertences.forEach(x=>{conferenciaPertences[x.uid]={etiquetado:true,quem:'Monitor Exemplo',ts:1760000100000};});
  return {
    estadia_id:'fixture-portatil-2026-10-03',
    estadia:{
      _ts:1760000000000,assinado_por:'Tutor Exemplo',assinatura:IMAGEM_TESTE,criado_por:'Consultora Exemplo',
      entrada:'2026-10-03',saida:'2026-10-10',entregaSemTutor:false,nome:'Hóspede Exemplo',raca:'Raça Exemplo',
      refKey:'hospede-exemplo__tutor-exemplo',status:'finalizada',tipo:'hospedagem',tutor:'Tutor Exemplo',
      ficha:{obsGeral:'Registro histórico de teste.',alim:{tipo:'Alimento sintético',qtd:90,unidade:'gramas'},spa:{banho:'Não'}},
      pertences,
      medicacao:[
        {nome:'Medicamento Alfa',q:1,u:'comprimido',horarios:['09:00'],continuo:true},
        {nome:'Medicamento Beta',q:1,u:'cápsula',horarios:['09:00'],continuo:true}
      ],
      conferencia:{
        concluida:true,concluida_por:'Monitor Exemplo',concluida_ts:1760000700000,
        pertences:conferenciaPertences,
        medicacaoEtiqueta:{
          'med_0_medicamento-alfa':{etiquetado:true,quem:'Monitor Exemplo',ts:1760000200000},
          'med_1_medicamento-beta':{etiquetado:true,quem:'Monitor Exemplo',ts:1760000300000}
        },
        medicacao:{
          'med_0_medicamento-alfa':{testado:true,confirmado:true,quem:'Monitor Exemplo',ts:1760000400000},
          'med_1_medicamento-beta':{testado:true,confirmado:true,quem:'Monitor Exemplo',ts:1760000500000}
        },
        racao:{modo:'peso',pesado:true,pesoTrazido:480,minimoNecessario:600,deficit:120,unidade:'gramas',quem:'Monitor Exemplo',ts:1760000600000}
      }
    },
    cadastro_daycare:{alergia:'ingrediente-sintético',restricao:'restrição-sintética'},
    conferencia_fotos:[IMAGEM_TESTE]
  };
}
const hospede=fixturePortatil();

function clone(v){ return JSON.parse(JSON.stringify(v)); }
function geradorNativo(){
  const src=fs.readFileSync(path.join(raiz,'auaulandia','index.html'),'utf8');
  const ini=src.indexOf("var ZPDF_AZUL='0.137 0.302 0.404'");
  const fim=src.indexOf('\n  // A ficha em PDF, agora sobre o motor',ini);
  assert(ini>0&&fim>ini,'não localizou o gerador nativo zPdfDocBlob');
  const troca={0x2014:'-',0x2013:'-',0x2018:"'",0x2019:"'",0x201C:'"',0x201D:'"',0x2026:'...',0x2022:'-',0x00A0:' '};
  function latin1(str){ let out=''; const s=String(str); for(let i=0;i<s.length;i++){const c=s.codePointAt(i);if(c>0xFFFF)i++;out+=troca[c]!=null?troca[c]:(c<=0xFF?String.fromCharCode(c):'?');}return out; }
  const ctx={Blob,Uint8Array,zLogoJpeg:()=>null,ciPdfEsc:s=>latin1(s).replace(/\\/g,'\\\\').replace(/\(/g,'\\(').replace(/\)/g,'\\)')};
  vm.runInNewContext(src.slice(ini,fim)+'\nthis.resultado=zPdfDocBlob;',ctx,{filename:'index-zPdfDocBlob.js'});
  return ctx.resultado;
}
function ambienteImagem(dataUrl){
  class Imagem{
    constructor(){ this.width=120; this.height=80; this.naturalWidth=120; this.naturalHeight=80; }
    set src(v){ this._src=v; queueMicrotask(()=>this.onload&&this.onload()); }
  }
  const contexto={fillStyle:'',fillRect(){},drawImage(){}};
  const document={
    getElementById(){ return null; },
    createElement(tipo){
      assert.equal(tipo,'canvas');
      return {width:0,height:0,getContext:()=>contexto,toDataURL:()=>dataUrl};
    }
  };
  return {Image:Imagem,document,atob:s=>Buffer.from(s,'base64').toString('binary')};
}
function baseDeps(extra){
  return Object.assign({
    podePapel:p=>p==='historico-checkins',
    usuarioAtual:()=>({uid:'teste'}),
    ciBaixarBlob:()=>true,
    cfRefFotos:()=>({once:()=>Promise.resolve({val:()=>[]})})
  },extra||{});
}
async function extrair(blob,rotulo){
  const raizTemp=path.resolve(os.tmpdir());
  const dir=fs.mkdtempSync(path.join(raizTemp,'zeluz-pdf-'));
  const arq=path.join(dir,rotulo+'.pdf');
  try{
    fs.writeFileSync(arq,Buffer.from(await blob.arrayBuffer()));
    const python=process.env.CODEX_PYTHON||'python';
    const script='import json,sys\nfrom pypdf import PdfReader\nr=PdfReader(sys.argv[1])\nprint(json.dumps({"paginas":len(r.pages),"texto":"\\n".join((p.extract_text() or "") for p in r.pages)},ensure_ascii=False))';
    const out=cp.execFileSync(python,['-c',script,arq],{encoding:'utf8'});
    return JSON.parse(out);
  }finally{
    // Só remove o arquivo criado por este teste e o diretório vazio que o mkdtemp devolveu.
    // A validação impede que uma alteração futura transforme a limpeza em alvo amplo.
    const alvo=path.resolve(dir), prefixo=raizTemp+path.sep;
    if(!alvo.startsWith(prefixo)||!path.basename(alvo).startsWith('zeluz-pdf-')) throw new Error('Diretório temporário inesperado; limpeza cancelada: '+alvo);
    try{if(fs.existsSync(arq))fs.unlinkSync(arq);}finally{if(fs.existsSync(alvo))fs.rmdirSync(alvo);}
  }
}

async function executar(){
  let leituras=0,geracoes=0,downloads=0;
  let r=await pdf.criar({
    podePapel:()=>false, usuarioAtual:()=>({uid:'x'}),
    cfRefFotos:()=>{leituras++;}, ciFichaFonteEstadia:()=>{geracoes++;}, ciBaixarBlob:()=>{downloads++;}
  })('conferencia',{id:hospede.estadia_id,e:hospede.estadia});
  assert.equal(r.erro,'sem-permissao');
  assert.deepEqual([leituras,geracoes,downloads],[0,0,0],'sem permissão não pode ler, gerar nem baixar');

  const fotoReal=hospede.conferencia_fotos[0];
  const imagem=ambienteImagem(fotoReal);
  let fonteCheckin=null,refConsultada='';
  const originalObs=hospede.estadia.ficha.obsGeral;
  r=await pdf.criar(baseDeps(Object.assign({},imagem,{
    histCiCadastroPorRefKey:key=>{refConsultada=key;return hospede.cadastro_daycare;},
    ciFichaFonteEstadia:e=>({hosp:{nome:e.nome,raca:e.raca,tutor:e.tutor},d:{entrada:e.entrada,saida:e.saida,ficha:e.ficha,pertences:e.pertences},meds:e.medicacao,assina:e.assinado_por}),
    ciFichaPdfBlob:f=>{fonteCheckin=f;return new Blob(['checkin'],{type:'application/pdf'});}
  })))('checkin',{id:hospede.estadia_id,e:hospede.estadia});
  assert(r.ok);
  assert.equal(refConsultada,hospede.estadia.refKey,'cadastro atual deve ser consultado só pela chave de vínculo exata');
  assert(fonteCheckin.assinatura&&fonteCheckin.assinatura.bytes.length>0,'assinatura salva deve ser convertida para JPEG');
  assert.match(fonteCheckin.d.ficha.obsGeral,/REEMISSÃO DO CHECK-IN/);
  assert.match(fonteCheckin.d.ficha.obsGeral,/ETAPA 1/);
  assert.match(fonteCheckin.d.ficha.obsGeral,/exclusivamente no cadastro vinculado à hospedagem/);
  assert.equal(hospede.estadia.ficha.obsGeral,originalObs,'a reemissão não pode alterar a estadia em memória');

  const li=pdf.linhasItens(hospede.estadia).map(x=>x.v).join('\n');
  assert.match(li,/Medicamento Alfa/); assert.match(li,/dose 1 comprimido/); assert.match(li,/horários 09:00/);
  assert.match(li,/alarme testado: sim/); assert.match(li,/som confirmado: sim/);
  // A chave deve casar byte a byte com jsNorm(...)+ciSlug(...) do app para nomes com
  // acentos, espaços repetidos e pontuação. Nome vazio recupera a chave histórica salva.
  const ciSlugReal=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim().replace(/\s+/g,' ').replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'');
  ['  Ômega   3 + Ácido? ','Cápsula d\'Água','Vitamina B12 / 500mg'].forEach((nome,i)=>{
    assert.equal(pdf.medChave({nome},i),'med_'+i+'_'+ciSlugReal(nome));
  });
  assert.equal(pdf.medChave({nome:''},2,{medicacao:{'med_2_item-1760000800000':{testado:true}}}),'med_2_item-1760000800000');
  const inconsistente=clone(hospede.estadia);
  inconsistente.conferencia.medicacao['med_0_medicamento-alfa']={testado:false,confirmado:true,quem:'Registro sintético'};
  const linc=pdf.linhasItens(inconsistente).find(x=>x.k==='Medicação'&&/Medicamento Alfa/.test(x.v)).v;
  assert.match(linc,/alarme testado: não/); assert.match(linc,/som confirmado: sim/);

  downloads=0;
  r=await pdf.criar(baseDeps({
    zPdfDocBlob:()=>{geracoes++;return new Blob(['x']);},
    cfRefFotos:()=>({once:()=>Promise.reject(new Error('rede indisponível'))}),
    ciBaixarBlob:()=>{downloads++;return true;}
  }))('conferencia',{id:hospede.estadia_id,e:hospede.estadia});
  assert(!r.ok); assert.match(r.erro,/Não consegui ler as fotos/); assert.equal(downloads,0,'falha de leitura não pode virar “nenhuma foto” nem baixar PDF');

  // Na base atual cada foto é um registro {src, quem, ts, tirada?}. O adaptador inline
  // aplica o normalizador canônico e entrega ao módulo somente URLs ainda disponíveis.
  const registrosFotos={
    f1:{src:fotoReal,quem:'Monitor de teste',ts:1},
    f2:{src:fotoReal,quem:'Monitor de teste',ts:2,tirada:{quem:'Gestão',ts:3}},
    f3:{src:fotoReal,quem:'Monitor de teste',ts:4}
  };
  let adapterChamado='',fallbackChamado=0,opcoesAdapter=null,docAdapter=null;
  function motorAdapter(doc,opts){docAdapter=doc;opcoesAdapter=opts;return new Blob(['adapter']);}
  motorAdapter.aceitaFotosHistorico=true;
  r=await pdf.criar(baseDeps(Object.assign({},imagem,{
    zPdfDocBlob:motorAdapter,
    histCiLerFotos:id=>{ adapterChamado=id; return Object.keys(registrosFotos).sort().map(k=>registrosFotos[k]).filter(f=>!f.tirada).map(f=>f.src); },
    cfRefFotos:()=>{ fallbackChamado++; throw new Error('fallback não deveria ser chamado'); }
  })))('conferencia',{id:hospede.estadia_id,e:hospede.estadia});
  assert(r.ok); assert.equal(adapterChamado,hospede.estadia_id); assert.equal(fallbackChamado,0);
  assert.equal(opcoesAdapter.fotos.length,2,'o leitor injetado deve entregar somente as fotos disponíveis no registro');
  const textoAdapter=docAdapter.secoes.flatMap(s=>s.linhas).map(x=>x.v||x.t||'').join('\n');
  assert.match(textoAdapter,/2 fotos disponíveis no registro/);

  downloads=0;
  r=await pdf.criar(baseDeps({
    zPdfDocBlob:()=>new Blob(['não deve gerar']),
    histCiLerFotos:()=>Promise.reject(new Error('leitura protegida recusada')),
    ciBaixarBlob:()=>{ downloads++; return true; }
  }))('conferencia',{id:hospede.estadia_id,e:hospede.estadia});
  assert(!r.ok); assert.match(r.erro,/leitura protegida recusada/); assert.equal(downloads,0,'erro do leitor injetado deve impedir o download');

  downloads=0;
  r=await pdf.criar(baseDeps({
    zPdfDocBlob:()=>new Blob(['não deve gerar']),
    cfRefFotos:()=>({once:()=>Promise.resolve({val:()=>registrosFotos})}),
    ciBaixarBlob:()=>{ downloads++; return true; }
  }))('conferencia',{id:hospede.estadia_id,e:hospede.estadia});
  assert(!r.ok); assert.match(r.erro,/exige o leitor seguro do histórico/); assert.equal(downloads,0,'registro novo sem adaptador não pode virar PDF sem fotos');

  let opcoesFotos=null,docFotos=null;
  function motorFotos(doc,opts){docFotos=doc;opcoesFotos=opts;return new Blob(['fotos']);}
  motorFotos.aceitaFotosHistorico=true;
  r=await pdf.criar(baseDeps(Object.assign({},imagem,{
    zPdfDocBlob:motorFotos,
    cfRefFotos:()=>({once:()=>Promise.resolve({val:()=>[fotoReal,fotoReal,fotoReal]})})
  })))('conferencia',{id:hospede.estadia_id,e:hospede.estadia});
  assert(r.ok); assert.equal(opcoesFotos.fotos.length,3,'todas as fotos salvas devem chegar ao gerador');
  assert(opcoesFotos.assinatura&&opcoesFotos.assinatura.bytes.length>0,'extrato deve anexar assinatura salva');
  const textoFotos=docFotos.secoes.flatMap(s=>s.linhas).map(x=>x.v||x.t||'').join('\n');
  assert.match(textoFotos,/peso trazido: 480/); assert.match(textoFotos,/mínimo necessário: 600/); assert.match(textoFotos,/déficit: 120/);
  assert.match(textoFotos,/assinatura do tutor salva no check-in|imagem salva no check-in/i);

  const nativo=geradorNativo();
  let blobHospede=null;
  r=await pdf.criar(baseDeps(Object.assign({},imagem,{
    zPdfDocBlob:nativo,
    cfRefFotos:()=>({once:()=>Promise.resolve({val:()=>hospede.conferencia_fotos})}),
    ciBaixarBlob:b=>{blobHospede=b;return true;}
  })))('conferencia',{id:hospede.estadia_id,e:hospede.estadia});
  assert(r.ok&&blobHospede instanceof Blob);
  const lidoHospede=await extrair(blobHospede,'hospede-conferencia-real');
  assert(lidoHospede.paginas>=1); assert.match(lidoHospede.texto,/Medicamento Alfa/); assert.match(lidoHospede.texto,/09:00/);
  assert.match(lidoHospede.texto,/peso trazido: 480/); assert.match(lidoHospede.texto,/600/); assert.match(lidoHospede.texto,/120/);

  const muitos=clone(hospede.estadia); muitos.assinatura='';
  muitos.pertences=Array.from({length:80},(_,i)=>({uid:'item-'+i,k:'outro',nome:'Item '+String(i).padStart(2,'0')}));
  muitos.conferencia.pertences={}; muitos.pertences.forEach(x=>{muitos.conferencia.pertences[x.uid]={etiquetado:true,quem:'Monitor de teste',ts:muitos.conferencia.concluida_ts};});
  let blobMuitos=null;
  r=await pdf.criar(baseDeps({
    zPdfDocBlob:nativo,
    cfRefFotos:()=>({once:()=>Promise.resolve({val:()=>[]})}),
    ciBaixarBlob:b=>{blobMuitos=b;return true;}
  }))('conferencia',{id:'multipagina-real',e:muitos});
  assert(r.ok&&blobMuitos instanceof Blob);
  const lidoMuitos=await extrair(blobMuitos,'multipagina-80-itens-real');
  assert(lidoMuitos.paginas>1,'80 itens devem produzir PDF multipágina real');
  assert.match(lidoMuitos.texto,/Item 00/); assert.match(lidoMuitos.texto,/Item 79/);

  // Check-out é outro documento: usa exclusivamente a assinatura da SAÍDA e seus
  // próprios responsáveis. A assinatura de entrada abaixo é propositalmente distinta.
  const saida=clone(hospede.estadia);
  saida.assinatura='data:image/jpeg;base64,RU5UUkFEQQ==';
  saida.assinado_por='Assinatura sintetica de entrada';
  saida.pertences.push({uid:'longo',nome:'Item sintetico de transporte com etiqueta'});
  saida.ocorrencias={antiga:{texto:'Registro sintetico anulado',anulada:true}};
  saida.checkout_etapa1={quem:'Preparador Exemplo',ts:1760100000000,obs:'Bolsa revisada',conferido:{pert_p0:true,pert_longo:true,med_0:true,racao:false,desconhecido:true,oc_antiga:true}};
  saida.checkout={quem:'Consultora Exemplo',ts:1760101000000,obs:'Saída confirmada',assinado_por:'Assinatura sintetica de saída',assinatura:IMAGEM_TESTE,semTutor:false,conferido:{pert_p0:true,pert_longo:true,med_0:false,racao:true,desconhecido:false,oc_antiga:false},faltou_descer:['Item sintetico ausente']};
  const secoesSaida=pdf.histCiSecoesCheckout(saida);
  const textoSecoesSaida=secoesSaida.flatMap(s=>s.linhas).map(x=>(x.k?x.k+': ':'')+(x.v||x.t||'')).join('\n');
  assert.deepEqual(secoesSaida.slice(1,3).map(s=>s.titulo),['ETAPA 3 — CHECK-OUT: BOLSA MONTADA','ETAPA 4 — CONFERÊNCIA DO CHECK-OUT']);
  assert.match(textoSecoesSaida,/Preparador Exemplo/); assert.match(textoSecoesSaida,/Consultora Exemplo/);
  assert.match(textoSecoesSaida,/Item sem descrição no registro \[desconhecido\]/);
  assert.match(textoSecoesSaida,/Registro anulado: Registro sintetico anulado/);
  assert.match(textoSecoesSaida,/marcado como conferido/); assert.match(textoSecoesSaida,/não marcado como conferido/);
  assert.match(textoSecoesSaida,/conferência não registrada/);
  const linhaLonga=secoesSaida.flatMap(s=>s.linhas).find(x=>/Item sintetico de transporte/.test(x.t||''));
  assert(linhaLonga&&linhaLonga.t&&!linhaLonga.k,'item de check-out deve usar uma linha textual quebrável, não duas colunas estreitas');
  assert.match(textoSecoesSaida,/Item sintetico ausente/); assert(!/pontos|placar/i.test(textoSecoesSaida));

  let docSaida=null,optsSaida=null,blobSaida=null;
  function motorSaida(doc,opts){ docSaida=doc; optsSaida=opts; return nativo(doc,opts); }
  const fontesAssinaturaSaida=[];
  class ImagemSaida{ constructor(){this.width=120;this.height=80;this.naturalWidth=120;this.naturalHeight=80;} set src(v){fontesAssinaturaSaida.push(v);queueMicrotask(()=>this.onload&&this.onload());} }
  const imagemSaida={Image:ImagemSaida,atob:s=>Buffer.from(s,'base64').toString('binary'),document:{getElementById(){return null;},createElement(){return {width:0,height:0,getContext:()=>({fillStyle:'',fillRect(){},drawImage(){}}),toDataURL:()=>IMAGEM_TESTE};}}};
  r=await pdf.criar(baseDeps(Object.assign({},imagemSaida,{
    zPdfDocBlob:motorSaida,
    ciBaixarBlob:b=>{blobSaida=b;return true;},
    // Se o checkout tentasse ler fotos da conferência, este teste falharia.
    histCiLerFotos:()=>{throw new Error('foto de entrada não pode ser lida para a saída');}
  })))('checkout',{id:'checkout-sintetico',e:saida});
  assert(r.ok&&blobSaida instanceof Blob); assert(optsSaida.assinatura&&optsSaida.assinatura.bytes.length>0);
  assert.equal(optsSaida.assinaNome,'Assinatura sintetica de saída');
  assert.deepEqual(fontesAssinaturaSaida,[saida.checkout.assinatura],'a geração da saída só pode converter a assinatura do checkout');
  const lidoSaida=await extrair(blobSaida,'checkout-sintetico-real');
  assert(lidoSaida.paginas>=1); assert.match(lidoSaida.texto,/EXTRATO SALVO DO CHECK-OUT [-—] ETAPAS 3 E 4/); assert.match(lidoSaida.texto,/Preparador Exemplo/); assert.match(lidoSaida.texto,/Consultora Exemplo/); assert.match(lidoSaida.texto,/Item sintetico ausente/); assert.match(lidoSaida.texto,/Item sintetico de transporte/);
  assert(!/Assinatura sintetica de entrada/.test(lidoSaida.texto),'o extrato da saída não pode declarar a assinatura de entrada');
  assert.equal(docSaida.secoes.some(s=>/FOTOS/i.test(s.titulo)),false,'foto de entrada não é foto de saída');

  assert.equal(pdf.arquivo('checkin',saida),'Reemissao-etapa-1-check-in-recepcao-hospede-exemplo-2026-10-03.pdf');
  assert.equal(pdf.arquivo('conferencia',saida),'Extrato-etapa-2-conferencia-check-in-hospede-exemplo-2026-10-03.pdf');
  assert.equal(pdf.arquivo('checkout',saida),'Extrato-etapas-3-e-4-check-out-hospede-exemplo-2026-10-03.pdf');

  const fallbackBolsa=clone(saida); delete fallbackBolsa.checkout_etapa1.quem; delete fallbackBolsa.checkout_etapa1.ts;
  fallbackBolsa.checkout.bolsa_montada_por='Preparador Exemplo preservado'; fallbackBolsa.checkout.bolsa_montada_em=1760100000000;
  const textoFallback=pdf.histCiSecoesCheckout(fallbackBolsa).flatMap(s=>s.linhas).map(x=>x.v||x.t||'').join('\n');
  assert.match(textoFallback,/Preparador Exemplo preservado/,'dados preservados no checkout recuperam autoria da etapa 1');

  const apenasBolsa=clone(saida); delete apenasBolsa.checkout;
  const secoesApenasBolsa=pdf.histCiSecoesCheckout(apenasBolsa);
  assert.deepEqual(secoesApenasBolsa.map(s=>s.titulo),['ETAPA 3 — CHECK-OUT: BOLSA MONTADA','ETAPA 4 — CONFERÊNCIA DO CHECK-OUT']);
  assert.match(secoesApenasBolsa[0].linhas.map(x=>x.v||x.t||'').join('\n'),/Preparador Exemplo/);
  assert.match(secoesApenasBolsa[1].linhas[0].t,/ainda não foi registrada/);

  const retiradaTerceiro=clone(saida); retiradaTerceiro.checkout.semTutor=true; retiradaTerceiro.checkout.assinatura=IMAGEM_TESTE;
  let fontesTerceiro=[],optsTerceiro=null;
  class ImagemTerceiro{set src(v){fontesTerceiro.push(v);queueMicrotask(()=>this.onload&&this.onload());}}
  r=await pdf.criar(baseDeps({
    Image:ImagemTerceiro,document:{getElementById(){return null;},createElement(){throw new Error('não deve converter assinatura');}},atob:()=>'',
    zPdfDocBlob:(doc,opts)=>{optsTerceiro=opts;return new Blob(['retirada']);},ciBaixarBlob:()=>true
  }))('checkout',{id:'retirada-terceiro',e:retiradaTerceiro});
  assert(r.ok); assert.deepEqual(fontesTerceiro,[]); assert.equal(optsTerceiro.assinatura,null); assert.equal(optsTerceiro.assinaNome,null,'retirada sem tutor nunca anexa assinatura legada');

  downloads=0;
  const semSaida=clone(hospede.estadia); delete semSaida.checkout; semSaida.status='finalizada';
  r=await pdf.criar(baseDeps({zPdfDocBlob:()=>new Blob(['não deve gerar']),ciBaixarBlob:()=>{downloads++;return true;}}))('checkout',{id:'sem-checkout',e:semSaida});
  assert(!r.ok); assert.match(r.erro,/não possui um check-out salvo/i); assert.equal(downloads,0,'status finalizada não substitui a saída salva');

  downloads=0; let sessao=0;
  r=await pdf.criar(baseDeps(Object.assign({},imagem,{
    usuarioAtual:()=>++sessao===1?{uid:'antes'}:null,
    zPdfDocBlob:()=>new Blob(['gerado mas não baixado']), ciBaixarBlob:()=>{downloads++;return true;}
  })))('checkout',{id:'sessao-trocada',e:saida});
  assert(!r.ok); assert.match(r.erro,/sessão ou permissão mudou/i); assert.equal(downloads,0,'troca de sessão após a conversão bloqueia o download');

  let qaPrivado='ignorado (arquivo privado ausente)';
  if(privado){
    const fotoPrivada=(privado.conferencia_fotos||[])[0]||IMAGEM_TESTE;
    const ambientePrivado=ambienteImagem(fotoPrivada);
    let blobPrivado=null;
    r=await pdf.criar(baseDeps(Object.assign({},ambientePrivado,{
      zPdfDocBlob:nativo,
      cfRefFotos:()=>({once:()=>Promise.resolve({val:()=>privado.conferencia_fotos||[]})}),
      ciBaixarBlob:b=>{blobPrivado=b;return true;}
    })))('conferencia',{id:privado.estadia_id,e:privado.estadia});
    assert(r.ok&&blobPrivado instanceof Blob);
    const lidoPrivado=await extrair(blobPrivado,'qa-fixture-opcional');
    const ePrivada=privado.estadia||{}, cPrivada=ePrivada.conferencia||{}, racaoPrivada=cPrivada.racao||{};
    const primeiroMedicamento=(ePrivada.medicacao||[])[0]||{};
    const esperadosPrivados=[primeiroMedicamento.nome,(primeiroMedicamento.horarios||[])[0],racaoPrivada.pesoTrazido,racaoPrivada.deficit]
      .filter(v=>v!==undefined&&v!==null&&String(v)!=='');
    esperadosPrivados.forEach(v=>assert.match(lidoPrivado.texto,new RegExp(String(v).replace(/[.*+?^${}()|[\]\\]/g,'\\$&'))));
    qaPrivado='executado';
  }

  // A API global é criada antes das funções inline, mas resolve tudo somente no clique.
  const globais=['podePapel','usuarioAtual','ciBaixarBlob','ciFichaFonteEstadia','ciFichaPdfBlob','histCiCadastroPorRefKey','Image','document','atob'];
  const antes={}; globais.forEach(k=>{antes[k]=global[k];});
  try{
    Object.assign(global,imagem,{
      podePapel:()=>true, usuarioAtual:()=>({uid:'depois-do-load'}), ciBaixarBlob:()=>true,
      atob:function(s){assert.strictEqual(this,globalThis,'atob deve receber globalThis como receptor');return Buffer.from(s,'base64').toString('binary');},
      histCiCadastroPorRefKey:()=>null,
      ciFichaFonteEstadia:e=>({hosp:{nome:e.nome},d:{ficha:e.ficha||{},pertences:[]},meds:[]}),
      ciFichaPdfBlob:()=>new Blob(['dinamico'])
    });
    r=await pdf.histCiPdfBaixar('checkin',{id:'dinamico',e:hospede.estadia});
    assert(r.ok,'dependências e atob definidos depois do carregamento devem ser resolvidos com o receptor correto');
  }finally{globais.forEach(k=>{if(antes[k]===undefined)delete global[k];else global[k]=antes[k];});}

  console.log('Grupos portáteis passaram: permissão, reemissão fiel, chaves/sinais, leitores de fotos, anexos, PDF nativo, multipágina real e dependências tardias. QA privado: '+qaPrivado+'.');
}

executar().catch(e=>{console.error(e&&e.stack||e);process.exit(1);});
