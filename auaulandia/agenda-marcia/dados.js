(function (raiz, fabrica) {
  var api = fabrica();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (raiz) raiz.ZeluzAgendaMarcia = api;
})(typeof window !== 'undefined' ? window : globalThis, function () {
  'use strict';

  var PRECO_CENTAVOS = 8000;
  var LIMITE_HISTORICO = 20;

  function texto(v) { return String(v == null ? '' : v).trim(); }
  function objeto(v) { return v && typeof v === 'object' && !Array.isArray(v) ? v : {}; }
  function copiar(v) { return v == null ? v : JSON.parse(JSON.stringify(v)); }
  function proprio(o, k) { return Object.prototype.hasOwnProperty.call(o || {}, k); }
  function hash(v) {
    var h = 2166136261, s = texto(v), i;
    for (i = 0; i < s.length; i += 1) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
    return (h >>> 0).toString(36);
  }
  function dataValida(v) {
    var s = texto(v), m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s), d;
    if (!m) return false;
    d = new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]), 12));
    return d.getUTCFullYear() === Number(m[1]) && d.getUTCMonth() === Number(m[2]) - 1 && d.getUTCDate() === Number(m[3]);
  }
  function mesValido(v) { return /^\d{4}-(0[1-9]|1[0-2])$/.test(texto(v)); }
  function diasDoMes(mes) {
    var p = mes.split('-').map(Number), qtd = new Date(Date.UTC(p[0], p[1], 0, 12)).getUTCDate(), out = [], i;
    for (i = 1; i <= qtd; i += 1) out.push(mes + '-' + String(i).padStart(2, '0'));
    return out;
  }
  function idValido(v) { return !!texto(v) && !/[.#$\[\]\/]/.test(texto(v)) && texto(v).length <= 160; }
  function caminhoDia(dia) { return 'daycare/dashboard/' + dia + '/avaliacao'; }
  function separarValor(reg) {
    var partes = texto(reg && (reg.valor || reg.nome)).replace(/\s*\([^)]*\)\s*$/, '').split('/');
    return { nome: texto(partes.shift()), raca: texto(partes.join('/')) };
  }
  function relogioSP(agora) {
    var bruto = typeof agora === 'function' ? agora() : Date.now(), d = bruto instanceof Date ? bruto : new Date(bruto), p = {};
    if (isNaN(d.getTime())) d = new Date();
    new Intl.DateTimeFormat('en-CA', {
      timeZone: 'America/Sao_Paulo', year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', hourCycle: 'h23'
    }).formatToParts(d).forEach(function (x) { if (x.type !== 'literal') p[x.type] = x.value; });
    return { ts: d.getTime(), quando: p.day + '/' + p.month + '/' + p.year + ' ' + p.hour + ':' + p.minute };
  }
  function campo(v, limite, obrigatorio, codigo) {
    if (v == null && !obrigatorio) return '';
    if (typeof v !== 'string') throw new Error(codigo + '_INVALIDO');
    var s = texto(v);
    if ((obrigatorio && !s) || s.length > limite) throw new Error(codigo + '_INVALIDO');
    return s;
  }
  function hora(v) {
    var s = campo(v, 5, true, 'HORA'), m = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(s);
    if (!m) throw new Error('HORA_INVALIDA');
    return s;
  }
  function telefoneBR(v, obrigatorio) {
    if (v == null || (typeof v === 'string' && !texto(v))) {
      if (obrigatorio) throw new Error('TELEFONE_OBRIGATORIO');
      return '';
    }
    if (typeof v !== 'string') throw new Error('TELEFONE_INVALIDO');
    var digitos = v.replace(/\D/g, ''), normalizado = '';
    if ((digitos.length === 12 || digitos.length === 13) && digitos.slice(0, 2) === '55') normalizado = '+' + digitos;
    else if (digitos.length === 10 || digitos.length === 11) normalizado = '+55' + digitos;
    if (!normalizado) {
      if (obrigatorio) throw new Error('TELEFONE_INVALIDO');
      return '';
    }
    return normalizado;
  }
  function prev(v, codigo) {
    if (!v || typeof v !== 'object' || Array.isArray(v) || typeof v.conferido !== 'boolean') throw new Error(codigo + '_INVALIDO');
    var r={conferido:v.conferido};
    if(proprio(v,'plano')){if(['em_dia','antes','na_zeluz','a_conferir'].indexOf(v.plano)<0)throw new Error(codigo+'_PLANO_INVALIDO');if(v.conferido!==(v.plano==='em_dia'))throw new Error(codigo+'_PLANO_INCONSISTENTE');r.plano=v.plano;r.detalhe=campo(v.detalhe,300,false,codigo+'_DETALHE');if(codigo==='VACINA'&&(r.plano==='antes'||r.plano==='na_zeluz')&&!r.detalhe)throw new Error('VACINA_DETALHE_OBRIGATORIO');}
    return r;
  }
  function prevLido(v){v=objeto(v);var r={conferido:v.conferido===true};if(['em_dia','antes','na_zeluz','a_conferir'].indexOf(v.plano)>=0){r.plano=v.plano;r.detalhe=texto(v.detalhe);}return r;}
  function mesclarPrev(atual,novo){var a=objeto(atual),r=Object.assign({},a,novo);if(a.plano&&!novo.plano){r.conferido=a.conferido===true;}return r;}
  function normalizarCampos(cmd) {
    return {
      nome: campo(cmd.nome, 80, true, 'NOME'), raca: campo(cmd.raca, 80, true, 'RACA'),
      tutor: campo(cmd.tutor, 140, true, 'TUTOR'), telefone: telefoneBR(cmd.telefone, true), hora: hora(cmd.hora),
      vacina: prev(cmd.vacina, 'VACINA'), vermifugo: prev(cmd.vermifugo, 'VERMIFUGO'),
      carrapaticida: prev(cmd.carrapaticida, 'CARRAPATICIDA'),
      experiencia: campo(cmd.experiencia, 500, false, 'EXPERIENCIA'),
      saude: campo(cmd.saude, 500, false, 'SAUDE'), observacoes: campo(cmd.observacoes, 1000, false, 'OBSERVACOES')
    };
  }
  function intencaoPagamento(v) {
    if (v == null) return null;
    if (!v || typeof v !== 'object' || Array.isArray(v) || typeof v.recebido !== 'boolean') throw new Error('PAGAMENTO_INVALIDO');
    var valor = proprio(v, 'valorCent') ? v.valorCent : v.valorPagoCentavos;
    if (v.recebido === true && valor === PRECO_CENTAVOS) return { recebido: true, valorPagoCentavos: PRECO_CENTAVOS };
    if (v.recebido === false && valor === 0) return { recebido: false, valorPagoCentavos: 0 };
    throw new Error('PAGAMENTO_INVALIDO');
  }
  function pagamentoSeguro(v) {
    v = objeto(v);
    var ts = v.ts, ok = v.recebido === true && v.valorPagoCentavos === PRECO_CENTAVOS &&
      texto(v.autorId) && texto(v.autorNome) && Number.isFinite(ts) && ts > 0;
    return {
      recebido: !!ok, valorPagoCentavos: ok ? PRECO_CENTAVOS : 0,
      quem: ok ? texto(v.autorNome) : '', quando: ok ? texto(v.quando) : '',
      autorId: ok ? texto(v.autorId) : '', autorNome: ok ? texto(v.autorNome) : '', ts: ok ? ts : 0,
      historico: Array.isArray(v.historico) ? copiar(v.historico.slice(-LIMITE_HISTORICO)) : []
    };
  }
  function ehAgenda(reg) {
    reg = objeto(reg);
    var det = objeto(reg.det), a = objeto(det.avaliacao129), versao = Number(a.versao) || 0;
    return det.agendaMarcia === true || a.agendaMarcia === true || versao === 131 || versao === 133;
  }
  function cancelamentoSeguro(v) {
    v = objeto(v);
    /* Cancelamento é fail-closed: uma marca `ativo:true` incompleta nunca pode vazar
       para Lançamentos/TV. A autoria completa continua obrigatória para CRIAR a marca. */
    var ativo = v.ativo === true;
    return {
      ativo: !!ativo, motivo: ativo ? texto(v.motivo) : '', quem: ativo ? texto(v.autorNome) : '',
      quando: ativo ? texto(v.quando) : '', autorId: ativo ? texto(v.autorId) : '',
      autorNome: ativo ? texto(v.autorNome) : '', ts: ativo && Number.isFinite(v.ts) && v.ts > 0 ? v.ts : 0,
      historico: Array.isArray(v.historico) ? copiar(v.historico.slice(-LIMITE_HISTORICO)) : []
    };
  }
  function publicavel(reg) {
    reg = objeto(reg);
    var a = objeto(objeto(reg.det).avaliacao129);
    return !a.remarcacao159 && pagamentoSeguro(a.pagamento).recebido === true && a.estado !== 'cancelada' && cancelamentoSeguro(a.cancelamento).ativo !== true;
  }
  function estadoRegistro(reg) {
    var a = objeto(objeto(objeto(reg).det).avaliacao129);
    if (a.remarcacao159) return 'remarcada';
    if (a.estado === 'cancelada' || cancelamentoSeguro(a.cancelamento).ativo) return 'cancelada';
    return publicavel(reg) ? 'confirmada' : 'pendente';
  }
  function espelhoLegadoComprovado(reg) {
    reg = objeto(reg);
    var a = objeto(objeto(reg.det).avaliacao129), versao = Number(a.versao) || 0;
    return (versao === 131 || versao === 132) && reg.planilha_ok === true;
  }
  function aplicarPagamento(atual, intencao, autor, rel, criacao) {
    atual = objeto(atual);
    var seguro = pagamentoSeguro(atual), hist = seguro.historico.slice(-(LIMITE_HISTORICO - 1));
    if (intencao == null) {
      if (!criacao && proprio(atual, 'recebido')) return copiar(atual);
      return { recebido: false, valorPagoCentavos: 0, historico: hist };
    }
    if (seguro.recebido === intencao.recebido && seguro.valorPagoCentavos === intencao.valorPagoCentavos) {
      return seguro.recebido ? copiar(atual) : { recebido: false, valorPagoCentavos: 0, historico: hist };
    }
    hist.push({ recebido: intencao.recebido, valorPagoCentavos: intencao.valorPagoCentavos, autorId: autor.id, autorNome: autor.nome, ts: rel.ts, quando: rel.quando });
    return {
      recebido: intencao.recebido, valorPagoCentavos: intencao.valorPagoCentavos,
      autorId: autor.id, autorNome: autor.nome, ts: rel.ts, quando: rel.quando, historico: hist
    };
  }
  function aplicarCancelamento(atual, ativo, motivo, autor, rel) {
    atual = objeto(atual);
    var hist = Array.isArray(atual.historico) ? atual.historico.slice(-(LIMITE_HISTORICO - 1)) : [];
    hist.push({ ativo: ativo, motivo: ativo ? motivo : '', autorId: autor.id, autorNome: autor.nome, ts: rel.ts, quando: rel.quando });
    if (!ativo) return { ativo: false, historico: hist };
    return { ativo: true, motivo: motivo, autorId: autor.id, autorNome: autor.nome, ts: rel.ts, quando: rel.quando, historico: hist };
  }
  function dados131(reg) {
    reg = objeto(reg);
    var det = objeto(reg.det), a = objeto(det.avaliacao129), v = separarValor(reg);
    var marcada = ehAgenda(reg), canc = cancelamentoSeguro(a.cancelamento), estado = estadoRegistro(reg);
    return {
      /* O protocolo nativo de edição altera o resumo superior. Em 131 ele é canônico;
         o bloco interno não pode ressuscitar nome/raça/hora antigos. */
      nome: marcada ? v.nome : (texto(a.nome) || v.nome), raca: marcada ? v.raca : (texto(a.raca) || v.raca),
      tutor: texto(a.tutor), telefone: telefoneBR(a.telefone, false), hora: marcada ? texto(reg.hora) : (texto(a.hora) || texto(reg.hora)),
      vacina: prevLido(a.vacina), vermifugo: prevLido(a.vermifugo),
      carrapaticida: prevLido(a.carrapaticida),
      experiencia: texto(a.experiencia), saude: texto(a.saude), observacoes: texto(a.observacoes),
      pagamento: pagamentoSeguro(a.pagamento), revisao: Number(a.revisao) || 0,
      autorId: texto(a.autorId), autorNome: texto(a.autorNome), ts: Number(a.ts) || 0, quando: texto(a.quando),
      agendaMarcia: marcada, estado: estado, confirmada: estado === 'confirmada', cancelada: estado === 'cancelada',
      cancelamento: canc, remarcacao159: copiar(a.remarcacao159 || null), projecao: copiar(objeto(a.projecao))
    };
  }
  function serialCampos(d) {
    var canc = objeto(d.cancelamento);
    var serial={
      nome: d.nome, raca: d.raca, tutor: d.tutor, telefone: d.telefone, hora: d.hora,
      vacina: !!d.vacina.conferido, vermifugo: !!d.vermifugo.conferido, carrapaticida: !!d.carrapaticida.conferido,
      experiencia: d.experiencia, saude: d.saude, observacoes: d.observacoes,
      pagamento: { recebido: d.pagamento.recebido, valorPagoCentavos: d.pagamento.valorPagoCentavos,
        autorId: d.pagamento.autorId, ts: d.pagamento.ts },
      remarcacao159: d.remarcacao159, estado: d.estado, cancelamento: { ativo: canc.ativo === true, autorId: texto(canc.autorId),
        ts: Number.isFinite(canc.ts) ? canc.ts : 0, motivo: texto(canc.motivo) }
    };
    if(d.vacina.plano||d.vermifugo.plano||d.carrapaticida.plano)serial.planos=[d.vacina,d.vermifugo,d.carrapaticida].map(function(v){return [v.plano||'',v.detalhe||''];});
    return JSON.stringify(serial);
  }
  function fingerprintRegistro(reg) {
    var d = dados131(reg);
    return 'am131-' + hash(serialCampos(d) + '^r' + d.revisao);
  }
  function itemDeRegistro(dia, id, reg) {
    var d = dados131(reg), estadoProjecao = texto(objeto(d.projecao).estado);
    return {
      id: texto(id), dia: dia, hora: d.hora, nome: d.nome, raca: d.raca, tutor: d.tutor, telefone: d.telefone,
      vacina: d.vacina, vermifugo: d.vermifugo, carrapaticida: d.carrapaticida,
      experiencia: d.experiencia, saude: d.saude, observacoes: d.observacoes,
      pagamento: { recebido: d.pagamento.recebido, valorCent: d.pagamento.valorPagoCentavos, quem: d.pagamento.quem, quando: d.pagamento.quando },
      remarcacao159: copiar(d.remarcacao159), estado: d.estado, confirmada: d.confirmada, cancelada: d.cancelada,
      cancelamento: d.cancelada ? { motivo: d.cancelamento.motivo, quem: d.cancelamento.quem, quando: d.cancelamento.quando } : null,
      espelhoOk: estadoProjecao === 'pendente' ? false : (estadoProjecao === 'confirmada' ? true : null),
      revisao: d.revisao, fingerprint: fingerprintRegistro(reg), quem: d.autorNome, quando: d.quando
    };
  }
  function snapshot(dia, bruto) {
    bruto = objeto(bruto);
    var itens = Object.keys(bruto).map(function (id) { return itemDeRegistro(dia, id, bruto[id]); });
    itens.sort(function (a, b) { return a.hora.localeCompare(b.hora) || a.nome.localeCompare(b.nome, 'pt-BR') || a.id.localeCompare(b.id); });
    return { dia: dia, estado: 'pronto', itens: itens };
  }

  function criar(entrada) {
    var deps = entrada || {}, db = deps.db, ativo = null, geracao = 0, cache = {}, idsCriacao = {}, emVoo = {};
    var mesesAtivos = {}, cacheMeses = {};
    function autorizado() { try { return typeof deps.pode === 'function' && deps.pode() === true; } catch (_) { return false; } }
    function autorValido() {
      var a; try { a = typeof deps.autor === 'function' ? deps.autor() : null; } catch (_) { a = null; }
      a = objeto(a); return texto(a.id) && texto(a.nome) ? { id: texto(a.id), nome: texto(a.nome) } : null;
    }
    function desligar() {
      if (!ativo) return;
      try { if (ativo.ref && typeof ativo.ref.off === 'function') ativo.ref.off('value', ativo.ok); } catch (_) {}
      ativo = null; geracao += 1;
    }
    function retratoMes(sessao) {
      var total = sessao.datas.length, terminados = Object.keys(sessao.resolvidos).length + Object.keys(sessao.erros).length;
      var estado = terminados < total ? 'carregando' : (Object.keys(sessao.erros).length ? 'falha' : 'pronto');
      return { mes: sessao.mes, estado: estado, dias: copiar(sessao.dias) };
    }
    function publicarMes(sessao) {
      if (!sessao || sessao.ativo !== true || mesesAtivos[sessao.mes] !== sessao) return;
      var snap = retratoMes(sessao);
      sessao.assinantes.slice().forEach(function (a) { try { a.callback(copiar(snap)); } catch (_) {} });
    }
    function desligarMes(sessao) {
      if (!sessao || sessao.ativo !== true) return;
      sessao.ativo = false;
      sessao.assinaturas.forEach(function (a) {
        try { if (a.query && typeof a.query.off === 'function') a.query.off('value', a.ok); } catch (_) {}
      });
      if (mesesAtivos[sessao.mes] === sessao) delete mesesAtivos[sessao.mes];
    }
    function observarMes(mes, callback) {
      mes = texto(mes);
      if (!mesValido(mes)) throw new Error('MES_INVALIDO');
      if (typeof callback !== 'function') throw new Error('CALLBACK_OBRIGATORIO');
      if (!autorizado()) throw new Error('SEM_PERMISSAO');
      var sessao = mesesAtivos[mes], assinatura = { callback: callback };
      if (!sessao) {
        sessao = mesesAtivos[mes] = {
          mes: mes, ativo: true, datas: diasDoMes(mes), dias: copiar(cacheMeses[mes] || {}),
          resolvidos: {}, erros: {}, assinaturas: [], assinantes: []
        };
        sessao.assinantes.push(assinatura);
        publicarMes(sessao);
        sessao.datas.forEach(function (dia) {
          var ref = db && typeof db.ref === 'function' ? db.ref(caminhoDia(dia)) : null, query = null;
          try {
            if (!ref || typeof ref.orderByKey !== 'function') throw new Error('QUERY_INDISPONIVEL');
            query = ref.orderByKey();
            if (!query || typeof query.limitToFirst !== 'function') throw new Error('QUERY_INDISPONIVEL');
            query = query.limitToFirst(1);
            if (!query || typeof query.on !== 'function') throw new Error('QUERY_INDISPONIVEL');
          } catch (_) {
            sessao.erros[dia] = true; delete sessao.dias[dia]; publicarMes(sessao); return;
          }
          var ok = function (s) {
            if (!sessao.ativo || mesesAtivos[mes] !== sessao) return;
            var v = s && typeof s.val === 'function' ? s.val() : null;
            /* A consulta curta continua sendo o padrão. Uma origem remarcada pode ser
               a primeira chave; só nesse dia passamos a observar todos os registros. */
            if (!sessao.completos) sessao.completos = {};
            if (!sessao.completos[dia] && Object.keys(objeto(v)).some(function (id) { return objeto(objeto(objeto(v[id]).det).avaliacao129).remarcacao159; })) {
              sessao.completos[dia] = true;
              var completo = { cb: function (sn) { ok(sn); } };
              sessao.assinaturas.push({ query: ref, ok: completo.cb });
              try { ref.on('value', completo.cb, erro); } catch (_) { erro(); }
              return;
            }
            sessao.dias[dia] = Object.keys(objeto(v)).some(function (id) { var m = objeto(objeto(objeto(v[id]).det).avaliacao129).remarcacao159; return !m || m.estado !== 'concluida'; });
            sessao.resolvidos[dia] = true; delete sessao.erros[dia];
            cacheMeses[mes] = copiar(sessao.dias); publicarMes(sessao);
          };
          var erro = function () {
            if (!sessao.ativo || mesesAtivos[mes] !== sessao) return;
            sessao.erros[dia] = true; delete sessao.resolvidos[dia]; delete sessao.dias[dia];
            if (cacheMeses[mes]) delete cacheMeses[mes][dia]; publicarMes(sessao);
          };
          var curta159 = function (s) { if (!sessao.completos || !sessao.completos[dia]) ok(s); };
          sessao.assinaturas.push({ query: query, ok: curta159 });
          try { query.on('value', curta159, erro); } catch (_) { erro(); }
        });
      } else {
        sessao.assinantes.push(assinatura);
        try { callback(copiar(retratoMes(sessao))); } catch (_) {}
      }
      var ligada = true;
      return function () {
        if (!ligada) return; ligada = false;
        sessao.assinantes = sessao.assinantes.filter(function (a) { return a !== assinatura; });
        if (!sessao.assinantes.length) desligarMes(sessao);
      };
    }
    function fecharTudo() {
      desligar();
      Object.keys(mesesAtivos).forEach(function (mes) { desligarMes(mesesAtivos[mes]); });
    }
    function observar(dia, callback) {
      dia = texto(dia); if (!dataValida(dia)) throw new Error('DIA_INVALIDO');
      if (typeof callback !== 'function') throw new Error('CALLBACK_OBRIGATORIO');
      desligar(); if (!autorizado()) throw new Error('SEM_PERMISSAO');
      var minha = ++geracao, ref = db && typeof db.ref === 'function' ? db.ref(caminhoDia(dia)) : null;
      ativo = { dia: dia, geracao: minha, ref: ref, ok: null };
      callback({ dia: dia, estado: 'carregando', itens: [] });
      if (!ref || typeof ref.on !== 'function') { callback({ dia: dia, estado: 'falha', itens: [] }); return desligar; }
      var ok = function (s) {
        if (!ativo || ativo.geracao !== minha || ativo.dia !== dia) return;
        var valor = s && typeof s.val === 'function' ? s.val() : null;
        cache[dia] = objeto(copiar(valor));
        callback(copiar(snapshot(dia, valor)));
      };
      var erro = function () {
        if (!ativo || ativo.geracao !== minha || ativo.dia !== dia) return;
        callback({ dia: dia, estado: 'falha', itens: [] });
      };
      ativo.ok = ok;
      try { ref.on('value', ok, erro); } catch (_) { erro(); }
      return function () { if (ativo && ativo.geracao === minha) desligar(); };
    }
    function obterIdCriacao(dia, chave) {
      var mapa = idsCriacao[dia] || (idsCriacao[dia] = {});
      if (mapa[chave]) return mapa[chave];
      if (!db || typeof db.ref !== 'function') throw new Error('BANCO_INDISPONIVEL');
      var pai = db.ref(caminhoDia(dia)), filho = pai && typeof pai.push === 'function' ? pai.push() : null, id = texto(filho && filho.key);
      if (!idValido(id)) throw new Error('ID_INDISPONIVEL');
      mapa[chave] = id; return id;
    }
    function mesmaAutoria(a) {
      var b = autorValido(); return !!(b && a && b.id === a.id && b.nome === a.nome);
    }
    function confirmarProjecao(cmd, autorEsperado) {
      cmd = cmd || {};
      var dia = texto(cmd.dia), id = texto(cmd.id), opId = texto(cmd.opId || cmd.op_id), revisao = Number(cmd.revisao), motivo = '';
      if (!dataValida(dia)) return Promise.reject(new Error('DIA_INVALIDO'));
      if (!idValido(id) || !idValido(opId) || !Number.isInteger(revisao) || revisao < 1) return Promise.reject(new Error('PROJECAO_INVALIDA'));
      if (!autorizado()) return Promise.reject(new Error('SEM_PERMISSAO'));
      var autorInicio = autorEsperado || autorValido(); if (!autorInicio) return Promise.reject(new Error('AUTORIA_OBRIGATORIA'));
      if (!mesmaAutoria(autorInicio)) return Promise.reject(new Error('AUTORIA_ALTERADA'));
      if (!db || typeof db.ref !== 'function') return Promise.reject(new Error('BANCO_INDISPONIVEL'));
      var ref = db.ref(caminhoDia(dia) + '/' + id);
      return Promise.resolve(ref.transaction(function (atual) {
        if (!autorizado()) { motivo = 'SEM_PERMISSAO'; return; }
        if (!mesmaAutoria(autorInicio)) { motivo = 'AUTORIA_ALTERADA'; return; }
        if (!atual || !ehAgenda(atual)) { motivo = 'AGENDAMENTO_DESATUALIZADO'; return; }
        var reg = copiar(atual), det = copiar(objeto(reg.det)), a = copiar(objeto(det.avaliacao129)), p = objeto(a.projecao);
        if (['lancar', 'editar', 'remover'].indexOf(texto(p.acao)) < 0 || texto(p.opId || p.op_id) !== opId || Number(p.revisao) !== revisao || p.estado !== 'pendente') {
          motivo = 'PROJECAO_DESATUALIZADA'; return;
        }
        var resumoAtual = objeto(p.depois), resumoRemover = objeto(p.antes);
        if (texto(reg.valor) !== texto(resumoAtual.valor) || texto(reg.hora) !== texto(resumoAtual.hora) ||
            (p.acao === 'remover' && (publicavel(reg) || !texto(resumoRemover.valor))) ||
            (p.acao !== 'remover' && !publicavel(reg))) {
          motivo = 'PROJECAO_DESATUALIZADA'; return;
        }
        var rel = relogioSP(deps.agora);
        p.estado = 'confirmada'; p.confirmadoTs = rel.ts; p.confirmadoQuando = rel.quando;
        p.confirmadoPor = { id: autorInicio.id, nome: autorInicio.nome };
        a.projecao = p; det.avaliacao129 = a; reg.det = det;
        reg.planilha_ok = true; reg.planilha_msg = '';
        if (p.acao === 'remover') delete reg.planilha_linha;
        if (p.acao === 'editar') delete reg.edicao_pendente;
        motivo = ''; return reg;
      })).then(function (res) {
        if (!res || res.committed !== true) throw new Error(motivo || 'PROJECAO_DESATUALIZADA');
        var reg = objeto(res.snapshot && res.snapshot.val && res.snapshot.val());
        if (!cache[dia]) cache[dia] = {}; cache[dia][id] = copiar(reg);
        return { ok: true, dia: dia, id: id, opId: opId, revisao: revisao, item: itemDeRegistro(dia, id, reg) };
      });
    }
    function salvar(cmd) {
      cmd = cmd || {};
      if (cmd.acao === 'remarcar' || cmd.acao === 'retomar_remarcacao') return remarcar(cmd);
      var dia = texto(cmd.dia), id = texto(cmd.id), token = texto(cmd.requestId || cmd.token), acao = texto(cmd.acao) || (id ? 'editar' : 'criar');
      var entradaCampos = cmd.avaliacao && typeof cmd.avaliacao === 'object' ? cmd.avaliacao : cmd, campos = null, pagamento = null, cuidadosGravados = null;
      var mutacaoCadastro = acao === 'criar' || acao === 'editar', editando = acao !== 'criar';
      if (!dataValida(dia)) return Promise.reject(new Error('DIA_INVALIDO'));
      if (['criar', 'editar', 'cancelar', 'reativar'].indexOf(acao) < 0 || (acao === 'criar' && id) || (acao !== 'criar' && !id)) return Promise.reject(new Error('ACAO_INVALIDA'));
      if (!autorizado()) return Promise.reject(new Error('SEM_PERMISSAO'));
      var autorInicio = autorValido(); if (!autorInicio) return Promise.reject(new Error('AUTORIA_OBRIGATORIA'));
      var motivoCancelamento = '';
      try {
        if (mutacaoCadastro) { campos = normalizarCampos(entradaCampos); pagamento = intencaoPagamento(entradaCampos.pagamento); }
        if (acao === 'cancelar') motivoCancelamento = campo(cmd.motivo, 300, false, 'MOTIVO');
      } catch (e) { return Promise.reject(e); }
      var chaveCriacao = '';
      if (acao === 'criar') {
        chaveCriacao = token || hash(dia + '^' + serialCampos(Object.assign({}, campos, { pagamento: { recebido: pagamento && pagamento.recebido, valorPagoCentavos: pagamento && pagamento.valorPagoCentavos, autorId: '', ts: 0 } })));
        try { id = obterIdCriacao(dia, chaveCriacao); } catch (e) { return Promise.reject(e); }
      }
      if (!idValido(id)) return Promise.reject(new Error('ID_INVALIDO'));
      var revisaoEsperada = cmd.expectedRevision, base = texto(cmd.expectedFingerprint || cmd.fingerprint || cmd.base);
      if (editando && (!Number.isInteger(revisaoEsperada) || revisaoEsperada < 0 || !base)) return Promise.reject(new Error('BASE_OBRIGATORIA'));
      var voo = dia + '/' + id;
      if (emVoo[voo]) return emVoo[voo];
      if (!db || typeof db.ref !== 'function') return Promise.reject(new Error('BANCO_INDISPONIVEL'));
      var ref = db.ref(caminhoDia(dia) + '/' + id), motivo = '', tokenSalvo = 'c-' + hash(chaveCriacao);
      var antesCommit = null, resumoAlterado = false, projecaoCriada = null, acaoProjecao = 'nenhuma', idempotente = false;
      var promessa = Promise.resolve(ref.transaction(function (atual) {
        if (!autorizado()) { motivo = 'SEM_PERMISSAO'; return; }
        var autor = autorValido();
        if (!autor) { motivo = 'AUTORIA_OBRIGATORIA'; return; }
        if (autor.id !== autorInicio.id || autor.nome !== autorInicio.nome) { motivo = 'AUTORIA_ALTERADA'; return; }
        var existe = atual && typeof atual === 'object' && !Array.isArray(atual), regAtual = objeto(atual), dAtual = dados131(regAtual);
        if (!editando && existe) {
          if (texto(objeto(objeto(regAtual.det).avaliacao129).criacaoToken) === tokenSalvo) { motivo = ''; idempotente = true; cuidadosGravados={vacina:campos.vacina,vermifugo:campos.vermifugo,carrapaticida:campos.carrapaticida}; return regAtual; }
          motivo = 'AGENDAMENTO_DESATUALIZADO'; return;
        }
        if (editando && (!existe || dAtual.revisao !== revisaoEsperada || fingerprintRegistro(regAtual) !== base)) {
          motivo = 'AGENDAMENTO_DESATUALIZADO'; return;
        }
        if (objeto(objeto(regAtual.det).avaliacao129).remarcacao159) { motivo = 'AGENDAMENTO_REMARCADO'; return; }
        if (acao === 'cancelar' && dAtual.cancelada) { motivo = 'AGENDAMENTO_JA_CANCELADO'; return; }
        if (acao === 'reativar' && !dAtual.cancelada) { motivo = 'AGENDAMENTO_NAO_CANCELADO'; return; }
        var rel = relogioSP(deps.agora), reg = copiar(regAtual), det = copiar(objeto(reg.det)), aAtual = objeto(det.avaliacao129), a = copiar(aAtual);
        var revisao = (editando ? dAtual.revisao : 0) + 1, hist = Array.isArray(aAtual.historico) ? aAtual.historico.slice(-(LIMITE_HISTORICO - 1)) : [];
        /* Formato antigo já vivia em Lançamentos/TV sem recibo estruturado. Só no
           retrato ANTERIOR ele conta como público; depois de migrado vale a régua
           estrita R$80+autoria, sem fabricar pagamento para o legado. */
        var antesPublicavel = existe && (!ehAgenda(regAtual) || publicavel(regAtual) || espelhoLegadoComprovado(regAtual)), valorAntes = texto(regAtual.valor), horaAntes = texto(regAtual.hora);
        antesCommit = editando ? copiar(regAtual) : null;
        if (mutacaoCadastro) {
          var pg = aplicarPagamento(aAtual.pagamento, pagamento, autor, rel, !editando);
          resumoAlterado = editando && (valorAntes !== campos.nome + ' / ' + campos.raca || horaAntes !== campos.hora);
          if (resumoAlterado && objeto(aAtual.projecao).estado === 'pendente') { motivo = 'PROJECAO_PENDENTE'; return; }
          a = {
            versao: 133, agendaMarcia: true, criacaoToken: texto(aAtual.criacaoToken) || tokenSalvo,
            nome: campos.nome, raca: campos.raca, tutor: campos.tutor, telefone: campos.telefone, hora: campos.hora,
            vacina: mesclarPrev(aAtual.vacina,campos.vacina), vermifugo: mesclarPrev(aAtual.vermifugo,campos.vermifugo), carrapaticida: mesclarPrev(aAtual.carrapaticida,campos.carrapaticida),
            experiencia: campos.experiencia, saude: campos.saude, observacoes: campos.observacoes,
            pagamento: pg, cancelamento: copiar(aAtual.cancelamento), projecao: copiar(aAtual.projecao),
            revisao: revisao, autorId: autor.id, autorNome: autor.nome, ts: rel.ts, quando: rel.quando, historico: hist
          };
          if (aAtual.origem159) a.origem159 = copiar(aAtual.origem159);
          cuidadosGravados={vacina:prevLido(a.vacina),vermifugo:prevLido(a.vermifugo),carrapaticida:prevLido(a.carrapaticida)};
          if (a.cancelamento === undefined) delete a.cancelamento;
          if (a.projecao === undefined) delete a.projecao;
          reg.valor = campos.nome + ' / ' + campos.raca; reg.hora = campos.hora;
        } else {
          a.versao = 133; a.agendaMarcia = true; a.revisao = revisao;
          a.autorId = autor.id; a.autorNome = autor.nome; a.ts = rel.ts; a.quando = rel.quando; a.historico = hist;
          a.cancelamento = aplicarCancelamento(aAtual.cancelamento, acao === 'cancelar', motivoCancelamento, autor, rel);
        }
        var eventoHist={ revisao: revisao, acao: acao, autorId: autor.id, autorNome: autor.nome, ts: rel.ts };if(mutacaoCadastro)eventoHist.cuidados=copiar(cuidadosGravados);hist.push(eventoHist);
        a.historico = hist; a.estado = a.cancelamento && a.cancelamento.ativo === true ? 'cancelada' : (pagamentoSeguro(a.pagamento).recebido ? 'confirmada' : 'pendente');
        det.agendaMarcia = true; det.fora_do_cadastro = true; det.avaliacao129 = a;
        reg.quem = autor.nome; reg.ts = rel.ts; reg.det = det;
        var depoisPublicavel = publicavel(reg);
        if (!antesPublicavel && depoisPublicavel) acaoProjecao = 'lancar';
        else if (antesPublicavel && !depoisPublicavel) acaoProjecao = 'remover';
        else if (antesPublicavel && depoisPublicavel && resumoAlterado) acaoProjecao = 'editar';
        else acaoProjecao = 'nenhuma';
        if (acaoProjecao !== 'nenhuma') {
          projecaoCriada = {
            opId: 'am133-' + hash(id + '^' + revisao + '^' + acaoProjecao + '^' + autor.id + '^' + rel.ts),
            revisao: revisao, acao: acaoProjecao, estado: 'pendente', solicitadoTs: rel.ts,
            solicitadoQuando: rel.quando, solicitadoPor: { id: autor.id, nome: autor.nome },
            antes: { valor: valorAntes, hora: horaAntes, planilhaLinha: Number(regAtual.planilha_linha) || 0 },
            depois: { valor: texto(reg.valor), hora: texto(reg.hora) }
          };
          a.projecao = copiar(projecaoCriada); det.avaliacao129 = a; reg.det = det;
          reg.planilha_tent = 0;
          delete reg.planilha_desisti;
          /* Clientes antigos reenviam automaticamente somente `planilha_ok:false` como
             lançamento. Remoção usa null e é retomada exclusivamente pelo protocolo
             `a.projecao`, evitando ressuscitar avaliação cancelada/desconfirmada. */
          reg.planilha_ok = acaoProjecao === 'remover' ? null : false;
          reg.planilha_msg = acaoProjecao === 'remover' ? 'remoção aguardando confirmação da planilha' : (acaoProjecao === 'editar' ? 'alteração aguardando confirmação da planilha' : 'lançamento aguardando confirmação da planilha');
          if (acaoProjecao === 'editar') {
            reg.edicao_pendente = {
              op_id: projecaoCriada.opId, dia: dia, estado: 'ponte_pendente', quem: autor.nome,
              autor: { id: autor.id, nome: autor.nome }, solicitado_ts: rel.ts, tentativas: 0,
              antes: { valor: valorAntes, hora: horaAntes, planilha_linha: Number(regAtual.planilha_linha) || 0 },
              depois: { valor: texto(reg.valor), hora: texto(reg.hora) }
            };
          } else delete reg.edicao_pendente;
        }
        motivo = ''; return reg;
      })).then(function (res) {
        if (!res || res.committed !== true) throw new Error(motivo || 'AGENDAMENTO_DESATUALIZADO');
        var reg = res.snapshot && typeof res.snapshot.val === 'function' ? objeto(res.snapshot.val()) : {}, item = itemDeRegistro(dia, id, reg), dConfirmado = dados131(reg);
        if (!dConfirmado.agendaMarcia || (mutacaoCadastro && (item.nome !== campos.nome || item.raca !== campos.raca || item.telefone !== campos.telefone || item.hora !== campos.hora || !['vacina','vermifugo','carrapaticida'].every(function(k){return item[k].conferido===cuidadosGravados[k].conferido&&(!cuidadosGravados[k].plano||(item[k].plano===cuidadosGravados[k].plano&&item[k].detalhe===cuidadosGravados[k].detalhe));})))) throw new Error('CONFIRMACAO_INVALIDA');
        if (!cache[dia]) cache[dia] = {}; cache[dia][id] = copiar(reg);
        function ack(ok, itemFinal) {
          var final = itemFinal || item;
          return { ok: true, acao: acao, dia: dia, id: id, revisao: final.revisao, quem: final.quem, quando: final.quando, item: copiar(final), espelhoOk: ok };
        }
        function espelhoConfirmado(v) { return v !== false && !(v && typeof v === 'object' && v.ok === false); }
        if (idempotente) return ack(objeto(dConfirmado.projecao).estado !== 'pendente');
        if (acaoProjecao === 'nenhuma') return ack(objeto(dConfirmado.projecao).estado !== 'pendente');
        if (typeof deps.aoSalvar !== 'function' || !mesmaAutoria(autorInicio) || !autorizado()) return ack(false);
        var contexto = {
          acao: acao, acaoProjecao: acaoProjecao, dia: dia, id: id, valor: reg.valor, hora: reg.hora, quem: reg.quem, ts: reg.ts,
          antes: copiar(antesCommit), registro: copiar(reg), resumoAlterado: resumoAlterado,
          projecao: copiar(projecaoCriada), pendente: acaoProjecao === 'editar' ? copiar(reg.edicao_pendente) : null,
          edicaoPendente: acaoProjecao === 'editar' ? copiar(reg.edicao_pendente) : null
        };
        function finalizarEspelho(v) {
          if (!espelhoConfirmado(v)) return ack(false);
          return confirmarProjecao({ dia: dia, id: id, opId: projecaoCriada.opId, revisao: projecaoCriada.revisao }, autorInicio)
            .then(function (confirmada) { return ack(true, confirmada.item); }, function () { return ack(false); });
        }
        try {
          var retorno = deps.aoSalvar(contexto);
          return retorno && typeof retorno.then === 'function' ? retorno.then(finalizarEspelho, function () { return ack(false); }) : finalizarEspelho(retorno);
        } catch (_) { return ack(false); }
      });
      emVoo[voo] = promessa.then(function (x) { delete emVoo[voo]; return x; }, function (e) { delete emVoo[voo]; throw e; });
      return emVoo[voo];
    }
    /* Protocolo em etapas, sem transação ampla: primeiro fecha a origem; somente
       após a retirada confirmada cria o destino. Cada etapa pode ser retomada. */
    async function remarcar(cmd) {
      var dia = texto(cmd.dia), id = texto(cmd.id), request = texto(cmd.requestId), retomar = cmd.acao === 'retomar_remarcacao';
      if (!dataValida(dia) || !idValido(id)) throw Error('DIA_OU_ID_INVALIDO');
      var novoDia = texto(cmd.novoDia), novaHora = retomar ? '' : hora(cmd.novaHora);
      if (!retomar && (!dataValida(novoDia) || !idValido(request) || request.length > 80)) throw Error('DESTINO_INVALIDO');
      if (!Number.isInteger(cmd.expectedRevision) || !texto(cmd.expectedFingerprint)) throw Error('BASE_OBRIGATORIA');
      if (!autorizado()) throw Error('SEM_PERMISSAO');
      var autor = autorValido(); if (!autor) throw Error('AUTORIA_OBRIGATORIA');
      if (!db || typeof db.ref !== 'function') throw Error('BANCO_INDISPONIVEL');
      function conferir() { if (!autorizado()) throw Error('SEM_PERMISSAO'); if (!mesmaAutoria(autor)) throw Error('AUTORIA_ALTERADA'); }
      var ref = db.ref(caminhoDia(dia) + '/' + id), motivo = '', origem;
      var res = await ref.transaction(function (cur) {
        motivo = ''; try { conferir(); } catch(e) { motivo=e.message; return; }
        if (!cur || !ehAgenda(cur)) { motivo='AGENDAMENTO_DESATUALIZADO'; return; }
        var a = objeto(objeto(cur.det).avaliacao129), m = objeto(a.remarcacao159);
        if (a.remarcacao159) {
          if (retomar && a.revisao === cmd.expectedRevision && fingerprintRegistro(cur) === cmd.expectedFingerprint ||
              !retomar && m.requestId === request && m.destino.dia === novoDia && m.destino.hora === novaHora) return cur;
          motivo='AGENDAMENTO_REMARCADO'; return;
        }
        if (retomar || a.revisao !== cmd.expectedRevision || fingerprintRegistro(cur) !== cmd.expectedFingerprint || estadoRegistro(cur)==='cancelada') { motivo='AGENDAMENTO_DESATUALIZADO'; return; }
        if (objeto(a.projecao).estado==='pendente' || cur.lockTs && Date.now()-cur.lockTs<120000) { motivo='PROJECAO_PENDENTE'; return; }
        if (novoDia===dia && novaHora===texto(cur.hora)) { motivo='DESTINO_IGUAL'; return; }
        var reg=copiar(cur), det=reg.det, rel=relogioSP(deps.agora), rev=(Number(a.revisao)||0)+1;
        a=det.avaliacao129;
        a.remarcacao159={requestId:request,estado:'pendente',origem:{dia:dia,id:id,hora:texto(cur.hora)},destino:{dia:novoDia,id:'am159-'+request,hora:novaHora},autorId:autor.id,autorNome:autor.nome,ts:rel.ts,quando:rel.quando};
        a.historico=(Array.isArray(a.historico)?a.historico:[]).slice(-(LIMITE_HISTORICO-1));
        a.historico.push({acao:'remarcar',revisao:rev,origem:copiar(a.remarcacao159.origem),destino:copiar(a.remarcacao159.destino),autorId:autor.id,autorNome:autor.nome,ts:rel.ts});
        a.revisao=rev; a.estado='remarcada'; a.autorId=autor.id; a.autorNome=autor.nome; a.ts=rel.ts; a.quando=rel.quando;
        var retirar=publicavel(cur)||espelhoLegadoComprovado(cur);
        delete reg.edicao_pendente;
        if(retirar){
          a.projecao={opId:'am159-remover-'+request,revisao:rev,acao:'remover',estado:'pendente',solicitadoTs:rel.ts,solicitadoQuando:rel.quando,solicitadoPor:copiar(autor),antes:{valor:texto(cur.valor),hora:texto(cur.hora),planilhaLinha:Number(cur.planilha_linha)||0},depois:{valor:texto(cur.valor),hora:texto(cur.hora)}};
          reg.planilha_ok=null; reg.planilha_tent=0; delete reg.planilha_desisti;
          reg.planilha_msg='remarcação: retirada do dia anterior pendente';
        } else delete a.projecao;
        return reg;
      });
      if (!res || res.committed!==true) throw Error(motivo||'AGENDAMENTO_DESATUALIZADO');
      origem=res.snapshot.val();
      function ack(concluida,destino,espelho) {
        return {ok:true,acao:'remarcar',dia:dia,id:id,revisao:dados131(origem).revisao,item:itemDeRegistro(dia,id,origem),concluida:concluida,destino:destino||null,espelhoOk:espelho===true};
      }
      async function projetar(d,i,reg) {
        var p=objeto(objeto(objeto(reg.det).avaliacao129).projecao);
        if(p.estado!=='pendente') return true;
        if(typeof deps.aoSalvar!=='function')return false;
        conferir();
        var r;try {r=await deps.aoSalvar({acao:'remarcar',acaoProjecao:p.acao,dia:d,id:i,registro:copiar(reg),projecao:copiar(p)});}catch(_){return false;}
        if(!r || r.ok!==true)return false;
        try {await confirmarProjecao({dia:d,id:i,opId:p.opId,revisao:p.revisao},autor);return true;}catch(_){return false;}
      }
      var m=origem.det.avaliacao129.remarcacao159;
      if (!await projetar(dia,id,origem)) return ack(false);
      /* Relê a confirmação: ACK tardio de uma operação diferente nunca libera destino. */
      conferir(); origem=(await ref.once('value')).val();
      if(!origem || !origem.det || !origem.det.avaliacao129 || !origem.det.avaliacao129.remarcacao159 || origem.det.avaliacao129.remarcacao159.requestId!==m.requestId)throw Error('AGENDAMENTO_DESATUALIZADO');
      var origemA=origem.det.avaliacao129;
      if(objeto(origemA.projecao).estado==='pendente')return ack(false);
      var destinoRef=db.ref(caminhoDia(m.destino.dia)+'/'+m.destino.id), destinoReg;
      motivo='';
      var criado=await destinoRef.transaction(function(cur){
        try{conferir();}catch(e){motivo=e.message;return;}
        if(cur){var vinculo=objeto(objeto(objeto(cur.det).avaliacao129).origem159);if(vinculo.dia===dia&&vinculo.id===id&&vinculo.requestId===m.requestId)return cur;motivo='DESTINO_OCUPADO';return;}
        var reg=copiar(origem),a=reg.det.avaliacao129,rel=relogioSP(deps.agora);
        delete a.remarcacao159; delete a.projecao; delete reg.planilha_linha; delete reg.lockTs; delete reg.lockAgenda133; delete reg.planilha_ok; delete reg.planilha_msg; delete reg.planilha_tent; delete reg.planilha_desisti; delete reg.edicao_pendente;
        a.origem159={dia:dia,id:id,requestId:m.requestId};
        reg.hora=m.destino.hora; a.hora=m.destino.hora;
        a.estado=pagamentoSeguro(a.pagamento).recebido?'confirmada':'pendente';
        if(publicavel(reg)){
          a.projecao={opId:'am159-lancar-'+m.requestId,revisao:a.revisao,acao:'lancar',estado:'pendente',solicitadoTs:rel.ts,solicitadoQuando:rel.quando,solicitadoPor:copiar(autor),antes:{valor:'',hora:''},depois:{valor:texto(reg.valor),hora:reg.hora}};
          reg.planilha_ok=false;reg.planilha_tent=0;reg.planilha_msg='remarcação: lançamento do novo dia pendente';
        }
        return reg;
      });
      if(!criado || criado.committed!==true)throw Error(motivo||'DESTINO_OCUPADO');
      destinoReg=criado.snapshot.val();
      conferir();
      var fim=await ref.transaction(function(cur){
        try{conferir();}catch(_){return;}
        var a=objeto(objeto(objeto(cur).det).avaliacao129),v=objeto(a.remarcacao159);
        if(v.requestId!==m.requestId)return;
        var reg=copiar(cur);reg.det.avaliacao129.remarcacao159.estado='concluida';return reg;
      });
      if(!fim || fim.committed!==true)return ack(false);
      origem=fim.snapshot.val();
      var espelho=await projetar(m.destino.dia,m.destino.id,destinoReg);
      if(!cache[dia])cache[dia]={};cache[dia][id]=copiar(origem);
      return ack(true,{dia:m.destino.dia,id:m.destino.id,hora:m.destino.hora},espelho);
    }
    function salvarConferencia(cmd) {
      cmd = cmd || {}; var dia = texto(cmd.dia), id = texto(cmd.id), reg = cache[dia] && cache[dia][id];
      if (!reg) return Promise.reject(new Error('AGENDAMENTO_DESATUALIZADO'));
      var atual = itemDeRegistro(dia, id, reg);
      return salvar({
        acao: 'editar', dia: dia, id: id, expectedRevision: cmd.expectedRevision, fingerprint: cmd.fingerprint || cmd.base || fingerprintRegistro(reg),
        nome: atual.nome, raca: atual.raca, hora: atual.hora,
        tutor: cmd.tutor, telefone: atual.telefone, vacina: cmd.vacina, vermifugo: cmd.vermifugo, carrapaticida: cmd.carrapaticida,
        experiencia: cmd.experiencia, saude: cmd.saude, observacoes: cmd.observacoes
      });
    }
    return { observar: observar, observarMes: observarMes, fechar: fecharTudo, salvar: salvar,
      salvarConferencia: salvarConferencia, confirmarProjecao: confirmarProjecao };
  }

  return { criar: criar, PRECO_CENTAVOS: PRECO_CENTAVOS, publicavel: publicavel, ehAgenda: ehAgenda, telefoneBR: telefoneBR };
});
