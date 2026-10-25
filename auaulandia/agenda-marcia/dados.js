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
  function prev(v, codigo) {
    if (!v || typeof v !== 'object' || Array.isArray(v) || typeof v.conferido !== 'boolean') throw new Error(codigo + '_INVALIDO');
    return { conferido: v.conferido };
  }
  function normalizarCampos(cmd) {
    return {
      nome: campo(cmd.nome, 80, true, 'NOME'), raca: campo(cmd.raca, 80, true, 'RACA'),
      tutor: campo(cmd.tutor, 140, true, 'TUTOR'), hora: hora(cmd.hora),
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
    var ok = v.recebido === true && v.valorPagoCentavos === PRECO_CENTAVOS && texto(v.autorId) && texto(v.autorNome) && Number(v.ts) > 0;
    return {
      recebido: !!ok, valorPagoCentavos: ok ? PRECO_CENTAVOS : 0,
      quem: ok ? texto(v.autorNome) : '', quando: ok ? texto(v.quando) : '',
      autorId: ok ? texto(v.autorId) : '', autorNome: ok ? texto(v.autorNome) : '', ts: ok ? Number(v.ts) : 0,
      historico: Array.isArray(v.historico) ? copiar(v.historico.slice(-LIMITE_HISTORICO)) : []
    };
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
  function dados131(reg) {
    reg = objeto(reg);
    var det = objeto(reg.det), a = objeto(det.avaliacao129), v = separarValor(reg);
    var marcada = a.agendaMarcia === true || det.agendaMarcia === true || Number(a.versao) === 131;
    return {
      /* O protocolo nativo de edição altera o resumo superior. Em 131 ele é canônico;
         o bloco interno não pode ressuscitar nome/raça/hora antigos. */
      nome: marcada ? v.nome : (texto(a.nome) || v.nome), raca: marcada ? v.raca : (texto(a.raca) || v.raca),
      tutor: texto(a.tutor), hora: marcada ? texto(reg.hora) : (texto(a.hora) || texto(reg.hora)),
      vacina: { conferido: !!objeto(a.vacina).conferido }, vermifugo: { conferido: !!objeto(a.vermifugo).conferido },
      carrapaticida: { conferido: !!objeto(a.carrapaticida).conferido },
      experiencia: texto(a.experiencia), saude: texto(a.saude), observacoes: texto(a.observacoes),
      pagamento: pagamentoSeguro(a.pagamento), revisao: Number(a.revisao) || 0,
      autorId: texto(a.autorId), autorNome: texto(a.autorNome), ts: Number(a.ts) || 0, quando: texto(a.quando),
      agendaMarcia: marcada
    };
  }
  function serialCampos(d) {
    return JSON.stringify({
      nome: d.nome, raca: d.raca, tutor: d.tutor, hora: d.hora,
      vacina: !!d.vacina.conferido, vermifugo: !!d.vermifugo.conferido, carrapaticida: !!d.carrapaticida.conferido,
      experiencia: d.experiencia, saude: d.saude, observacoes: d.observacoes,
      pagamento: { recebido: d.pagamento.recebido, valorPagoCentavos: d.pagamento.valorPagoCentavos,
        autorId: d.pagamento.autorId, ts: d.pagamento.ts }
    });
  }
  function fingerprintRegistro(reg) {
    var d = dados131(reg);
    return 'am131-' + hash(serialCampos(d) + '^r' + d.revisao);
  }
  function itemDeRegistro(dia, id, reg) {
    var d = dados131(reg);
    return {
      id: texto(id), dia: dia, hora: d.hora, nome: d.nome, raca: d.raca, tutor: d.tutor,
      vacina: d.vacina, vermifugo: d.vermifugo, carrapaticida: d.carrapaticida,
      experiencia: d.experiencia, saude: d.saude, observacoes: d.observacoes,
      pagamento: { recebido: d.pagamento.recebido, valorCent: d.pagamento.valorPagoCentavos, quem: d.pagamento.quem, quando: d.pagamento.quando },
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
    function salvar(cmd) {
      cmd = cmd || {};
      var dia = texto(cmd.dia), entradaCampos = cmd.avaliacao && typeof cmd.avaliacao === 'object' ? cmd.avaliacao : cmd, campos, pagamento;
      if (!dataValida(dia)) return Promise.reject(new Error('DIA_INVALIDO'));
      if (!autorizado()) return Promise.reject(new Error('SEM_PERMISSAO'));
      var autorInicio = autorValido(); if (!autorInicio) return Promise.reject(new Error('AUTORIA_OBRIGATORIA'));
      try { campos = normalizarCampos(entradaCampos); pagamento = intencaoPagamento(entradaCampos.pagamento); } catch (e) { return Promise.reject(e); }
      var editando = !!texto(cmd.id), id = texto(cmd.id), token = texto(cmd.requestId || cmd.token);
      var acao = texto(cmd.acao) || (editando ? 'editar' : 'criar');
      if ((acao !== 'criar' && acao !== 'editar') || (acao === 'criar' && editando) || (acao === 'editar' && !editando)) return Promise.reject(new Error('ACAO_INVALIDA'));
      var chaveCriacao = token || hash(dia + '^' + serialCampos(Object.assign({}, campos, { pagamento: { recebido: pagamento && pagamento.recebido, valorPagoCentavos: pagamento && pagamento.valorPagoCentavos, autorId: '', ts: 0 } })));
      try { if (!editando) id = obterIdCriacao(dia, chaveCriacao); } catch (e) { return Promise.reject(e); }
      if (!idValido(id)) return Promise.reject(new Error('ID_INVALIDO'));
      var revisaoEsperada = cmd.expectedRevision, base = texto(cmd.expectedFingerprint || cmd.fingerprint || cmd.base);
      if (editando && (!Number.isInteger(revisaoEsperada) || revisaoEsperada < 0 || !base)) return Promise.reject(new Error('BASE_OBRIGATORIA'));
      var voo = dia + '/' + id;
      if (emVoo[voo]) return emVoo[voo];
      if (!db || typeof db.ref !== 'function') return Promise.reject(new Error('BANCO_INDISPONIVEL'));
      var ref = db.ref(caminhoDia(dia) + '/' + id), motivo = '', tokenSalvo = 'c-' + hash(chaveCriacao);
      var antesCommit = null, resumoAlterado = false, pendenteCriada = null, idempotente = false;
      var promessa = Promise.resolve(ref.transaction(function (atual) {
        if (!autorizado()) { motivo = 'SEM_PERMISSAO'; return; }
        var autor = autorValido();
        if (!autor) { motivo = 'AUTORIA_OBRIGATORIA'; return; }
        if (autor.id !== autorInicio.id || autor.nome !== autorInicio.nome) { motivo = 'AUTORIA_ALTERADA'; return; }
        var existe = atual && typeof atual === 'object' && !Array.isArray(atual), regAtual = objeto(atual), dAtual = dados131(regAtual);
        if (!editando && existe) {
          if (texto(objeto(objeto(regAtual.det).avaliacao129).criacaoToken) === tokenSalvo) { motivo = ''; idempotente = true; return regAtual; }
          motivo = 'AGENDAMENTO_DESATUALIZADO'; return;
        }
        if (editando && (!existe || dAtual.revisao !== revisaoEsperada || fingerprintRegistro(regAtual) !== base)) {
          motivo = 'AGENDAMENTO_DESATUALIZADO'; return;
        }
        var rel = relogioSP(deps.agora), reg = copiar(regAtual), det = copiar(objeto(reg.det)), aAtual = objeto(det.avaliacao129);
        var revisao = (editando ? dAtual.revisao : 0) + 1, hist = Array.isArray(aAtual.historico) ? aAtual.historico.slice(-(LIMITE_HISTORICO - 1)) : [];
        var pg = aplicarPagamento(aAtual.pagamento, pagamento, autor, rel, !editando);
        antesCommit = editando ? copiar(regAtual) : null;
        resumoAlterado = editando && (texto(regAtual.valor) !== campos.nome + ' / ' + campos.raca || texto(regAtual.hora) !== campos.hora);
        if (resumoAlterado && regAtual.edicao_pendente) { motivo = 'EDICAO_PENDENTE'; return; }
        hist.push({ revisao: revisao, autorId: autor.id, autorNome: autor.nome, ts: rel.ts });
        det.agendaMarcia = true;
        det.fora_do_cadastro = true;
        det.avaliacao129 = {
          versao: 131, agendaMarcia: true, criacaoToken: texto(aAtual.criacaoToken) || tokenSalvo,
          nome: campos.nome, raca: campos.raca, tutor: campos.tutor, hora: campos.hora,
          vacina: campos.vacina, vermifugo: campos.vermifugo, carrapaticida: campos.carrapaticida,
          experiencia: campos.experiencia, saude: campos.saude, observacoes: campos.observacoes,
          pagamento: pg, revisao: revisao, autorId: autor.id, autorNome: autor.nome, ts: rel.ts, quando: rel.quando, historico: hist
        };
        reg.valor = campos.nome + ' / ' + campos.raca;
        reg.hora = campos.hora;
        reg.quem = autor.nome;
        reg.ts = rel.ts;
        reg.det = det;
        if (!editando) {
          reg.planilha_ok = false;
          reg.planilha_msg = 'lançamento aguardando confirmação da planilha';
        }
        if (resumoAlterado) {
          pendenteCriada = {
            op_id: 'am131-' + hash(id + '^' + revisao + '^' + autor.id + '^' + rel.ts), dia: dia,
            estado: 'ponte_pendente', quem: autor.nome, autor: { id: autor.id, nome: autor.nome },
            solicitado_ts: rel.ts, tentativas: 0,
            antes: { valor: texto(regAtual.valor), hora: texto(regAtual.hora), planilha_linha: Number(regAtual.planilha_linha) || 0 },
            depois: { valor: reg.valor, hora: reg.hora }
          };
          reg.edicao_pendente = copiar(pendenteCriada);
          reg.planilha_ok = false;
          reg.planilha_msg = 'alteração aguardando confirmação da planilha';
        }
        motivo = '';
        return reg;
      })).then(function (res) {
        if (!res || res.committed !== true) throw new Error(motivo || 'AGENDAMENTO_DESATUALIZADO');
        var reg = res.snapshot && typeof res.snapshot.val === 'function' ? objeto(res.snapshot.val()) : {}, item = itemDeRegistro(dia, id, reg), dConfirmado = dados131(reg);
        if (!dConfirmado.agendaMarcia || item.nome !== campos.nome || item.raca !== campos.raca || item.hora !== campos.hora) throw new Error('CONFIRMACAO_INVALIDA');
        if (!cache[dia]) cache[dia] = {};
        cache[dia][id] = copiar(reg);
        var espelhoOk = true;
        function ack(ok) { return { ok: true, acao: acao, dia: dia, id: id, revisao: item.revisao, quem: item.quem, quando: item.quando, item: copiar(item), espelhoOk: ok }; }
        function espelhoConfirmado(v) { return v !== false && !(v && typeof v === 'object' && v.ok === false); }
        if (!idempotente && typeof deps.aoSalvar === 'function') {
          try {
            var retorno = deps.aoSalvar({
              acao: acao, dia: dia, id: id, valor: reg.valor, hora: reg.hora, quem: reg.quem, ts: reg.ts,
              antes: copiar(antesCommit), registro: copiar(reg), resumoAlterado: resumoAlterado,
              pendente: copiar(pendenteCriada), edicaoPendente: copiar(pendenteCriada)
            });
            if (retorno && typeof retorno.then === 'function') return retorno.then(function (v) { return ack(espelhoConfirmado(v)); }, function () { return ack(false); });
            espelhoOk = espelhoConfirmado(retorno);
          } catch (_) { espelhoOk = false; }
        }
        return ack(espelhoOk);
      });
      emVoo[voo] = promessa.then(function (x) { delete emVoo[voo]; return x; }, function (e) { delete emVoo[voo]; throw e; });
      return emVoo[voo];
    }
    function salvarConferencia(cmd) {
      cmd = cmd || {}; var dia = texto(cmd.dia), id = texto(cmd.id), reg = cache[dia] && cache[dia][id];
      if (!reg) return Promise.reject(new Error('AGENDAMENTO_DESATUALIZADO'));
      var atual = itemDeRegistro(dia, id, reg);
      return salvar({
        acao: 'editar', dia: dia, id: id, expectedRevision: cmd.expectedRevision, fingerprint: cmd.fingerprint || cmd.base || fingerprintRegistro(reg),
        nome: atual.nome, raca: atual.raca, hora: atual.hora,
        tutor: cmd.tutor, vacina: cmd.vacina, vermifugo: cmd.vermifugo, carrapaticida: cmd.carrapaticida,
        experiencia: cmd.experiencia, saude: cmd.saude, observacoes: cmd.observacoes
      });
    }
    return { observar: observar, fechar: desligar, salvar: salvar, salvarConferencia: salvarConferencia };
  }

  return { criar: criar, PRECO_CENTAVOS: PRECO_CENTAVOS };
});
