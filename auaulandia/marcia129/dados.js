(function (raiz, fabrica) {
  var api = fabrica();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (raiz) raiz.ZeluzMarciaDados129 = api;
})(typeof window !== 'undefined' ? window : globalThis, function () {
  'use strict';

  var CAMINHOS = {
    dashboard: 'daycare/dashboard/{dia}',
    chamada: 'daycare/chamada/{dia}',
    meta: 'daycare/chamada-meta/{dia}',
    checkins: 'daycare/checkin-corpo/{dia}',
    checkout: 'daycare/checkout-corpo/{dia}',
    almoco: 'daycare/almoco/{dia}',
    almoco2: 'daycare/atividade/{dia}/almoco2',
    avisosComida: 'daycare/avisos-comida/{dia}',
    avulsos: 'daycare/avulsos/{dia}',
    turma: 'daycare/turma/{dia}',
    ocorrencias: 'daycare/ocorrencias/{dia}',
    tempo: 'daycare/tempo-atividade/{dia}',
    avaliacoesGestao: 'daycare/avaliacoes-gestao/{dia}',
    tarefas: 'daycare/painel-tarefas/{dia}'
  };
  var ORDEM_DIAS = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sab'];
  var LIMITE_HISTORICO = 20;

  function texto(v) { return String(v == null ? '' : v).trim(); }
  function objeto(v) { return v && typeof v === 'object' && !Array.isArray(v) ? v : {}; }
  function lista(v) { return Array.isArray(v) ? v : []; }
  function copiar(v) { return v == null ? v : JSON.parse(JSON.stringify(v)); }
  function proprio(o, k) { return Object.prototype.hasOwnProperty.call(o || {}, k); }
  function normal(v) {
    var s = texto(v).toLowerCase();
    try { s = s.normalize('NFD').replace(/[\u0300-\u036f]/g, ''); } catch (_) {}
    return s.replace(/\s+/g, ' ');
  }
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
  function diasEntre(de, ate) {
    if (!dataValida(de) || !dataValida(ate)) return null;
    return Math.floor((Date.parse(ate + 'T12:00:00Z') - Date.parse(de + 'T12:00:00Z')) / 86400000);
  }
  function diaSemana(dia) {
    if (!dataValida(dia)) return '';
    return ORDEM_DIAS[new Date(dia + 'T12:00:00Z').getUTCDay()] || '';
  }
  function caminho(modelo, dia) { return modelo.replace('{dia}', dia); }
  function estadoInicial() {
    var out = {};
    Object.keys(CAMINHOS).forEach(function (k) { out[k] = { estado: 'carregando', valor: null }; });
    return out;
  }
  function falhou(f) { return !f || f.estado === 'falha'; }
  function pronto(f) { return !!f && f.estado === 'pronto'; }
  function valor(f) { return pronto(f) ? objeto(f.valor) : {}; }

  function relogioSP(agora) {
    var bruto = typeof agora === 'function' ? agora() : Date.now();
    var d = bruto instanceof Date ? bruto : new Date(bruto);
    if (isNaN(d.getTime())) d = new Date();
    var p = {}, partes = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'America/Sao_Paulo', year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', hourCycle: 'h23'
    }).formatToParts(d);
    partes.forEach(function (x) { if (x.type !== 'literal') p[x.type] = x.value; });
    return { dia: p.year + '-' + p.month + '-' + p.day, hora: p.hour + ':' + p.minute, minutos: Number(p.hour) * 60 + Number(p.minute), ts: d.getTime() };
  }
  function quandoBR(ts) {
    var d = new Date(Number(ts));
    if (isNaN(d.getTime())) return '';
    return new Intl.DateTimeFormat('pt-BR', {
      timeZone: 'America/Sao_Paulo', day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit', hourCycle: 'h23'
    }).format(d);
  }

  function cadastroSeguro(deps, dia) {
    try {
      /* O argumento e retrocompativel: funcoes antigas simplesmente o ignoram. */
      var f = typeof deps.fontesCadastro === 'function' ? deps.fontesCadastro(dia) : null;
      return f && typeof f === 'object' ? f : { pronto: false };
    } catch (_) { return { pronto: false, falha: true }; }
  }
  function extras(deps, p) {
    try { return objeto(deps.helpers.pelExtra(p)); } catch (_) { return {}; }
  }
  function dado(deps, p, campo) {
    try {
      var v = deps.helpers.pelGet(p, campo);
      if (v != null && v !== '') return v;
    } catch (_) {}
    var ex = extras(deps, p);
    return ex[campo] != null && ex[campo] !== '' ? ex[campo] : (p && p[campo] != null ? p[campo] : '');
  }
  function nomePet(deps, p) { return texto(dado(deps, p, 'n') || (p && p.n)); }
  function racaPet(deps, p) { return texto(dado(deps, p, 'raca') || (p && p.raca)); }
  function tutorPet(deps, p) { return texto(dado(deps, p, 'tutor') || (p && p.tutor)); }
  function chavePet(deps, p) {
    try { return texto(deps.helpers.dcKey(nomePet(deps, p), tutorPet(deps, p))); }
    catch (_) { return 'pet-' + hash(nomePet(deps, p) + '^' + tutorPet(deps, p)); }
  }
  function pelKeyCompativel(deps, p) {
    if (deps.helpers && typeof deps.helpers.pelKey === 'function') {
      try { return texto(deps.helpers.pelKey(p)); } catch (_) {}
    }
    return ((p && p.n || '') + '__' + (p && p.tutor || '')).toLowerCase().replace(/[.#$\[\]\/]/g, '-');
  }
  function ativo(deps, p) {
    try { return !deps.helpers.pelInativo(p); } catch (_) { return true; }
  }
  function morador(deps, p) {
    try { return !!deps.helpers.ehMoradorZeluz(p); } catch (_) { return false; }
  }
  function diasDoPet(deps, p, dia) {
    try { return lista(deps.helpers.pelDias(p, dia)); } catch (_) { return []; }
  }
  function basePet(deps, p) {
    return { chave: chavePet(deps, p), p: p, nome: nomePet(deps, p), raca: racaPet(deps, p), tutor: tutorPet(deps, p) };
  }

  function separarValor(reg) {
    var bruto = texto(reg && (reg.valor || reg.nome || reg.pet)).replace(/\s*\([^)]*\)\s*$/, '');
    var partes = bruto.split('/');
    return { nome: texto(partes.shift()), raca: texto(partes.join('/')) };
  }
  function idsDoCadastro(deps, p) {
    var ex = extras(deps, p), ids = [p && p.id, p && p._id, p && p.key, p && p.refKey, p && p.dcKey,
      ex.id, ex._id, ex.key, ex.refKey, ex.dcKey, chavePet(deps, p), pelKeyCompativel(deps, p)];
    return ids.map(texto).filter(Boolean);
  }
  function associarCadastro(deps, peludinhos, reg, permiteNomeTutor) {
    reg = objeto(reg);
    var det = objeto(reg.det);
    /* Um lançamento manual continua sem ficha, mesmo se nome/raça forem homônimos
       ou se um identificador residual vier junto do registro. */
    if (det.fora_do_cadastro === true) return null;
    var explicitos = [reg.dcKey, reg.chave, reg.refKey, reg.petId, reg.cadastroId,
      det.dcKey, det.chave, det.refKey, det.petId, det.cadastroId].map(texto).filter(Boolean);
    var achados = [];
    if (explicitos.length) {
      achados = peludinhos.filter(function (p) {
        var ids = idsDoCadastro(deps, p);
        return explicitos.some(function (id) { return ids.indexOf(id) >= 0; });
      });
      return achados.length === 1 ? achados[0] : null;
    }
    if (permiteNomeTutor === true) {
      var nomeDireto = texto(reg.nome || reg.n), tutorDireto = texto(reg.tutor);
      if (nomeDireto && tutorDireto) {
        achados = peludinhos.filter(function (p) {
          return normal(nomePet(deps, p)) === normal(nomeDireto) && normal(tutorPet(deps, p)) === normal(tutorDireto);
        });
        return achados.length === 1 ? achados[0] : null;
      }
    }
    var partes = separarValor(reg);
    if (!partes.nome || !partes.raca) return null;
    achados = peludinhos.filter(function (p) {
      return normal(nomePet(deps, p)) === normal(partes.nome) && normal(racaPet(deps, p)) === normal(partes.raca);
    });
    return achados.length === 1 ? achados[0] : null;
  }
  function registros(grupo) {
    grupo = objeto(grupo);
    return Object.keys(grupo).map(function (id) { return { id: id, reg: objeto(grupo[id]) }; });
  }
  function chaveRegistro(deps, tipo, item, peludinhos) {
    var p = associarCadastro(deps, peludinhos, item.reg, true);
    if (p) return { chave: chavePet(deps, p), p: p };
    /* A turma canônica também exclui lançamentos que não casam com uma ficha. */
    return { chave: '', p: null, incompleto: true, tipo: tipo, id: item.id };
  }

  function dataPrev(v) { return dataValida(texto(v)) ? texto(v) : ''; }
  function dataBR(v) { return dataValida(v) ? v.slice(8, 10) + '/' + v.slice(5, 7) + '/' + v.slice(0, 4) : ''; }
  function prevUnica(datas, dia) {
    var ds = datas.map(dataPrev);
    if (ds.some(function (x) { return !x; })) return { situacao: 'conferir', data: '', dataISO: '' };
    var vencidas = ds.filter(function (x) { return x < dia; }).sort();
    if (vencidas.length) return { situacao: 'vencido', data: dataBR(vencidas[0]), dataISO: vencidas[0] };
    ds.sort();
    return { situacao: 'em-dia', data: dataBR(ds[0] || ''), dataISO: ds[0] || '' };
  }
  function prevencao(deps, p, dia) {
    if (!p) return { vacina: { situacao: 'conferir', data: '', dataISO: '' }, vermifugo: { situacao: 'conferir', data: '', dataISO: '' }, carrapaticida: { situacao: 'conferir', data: '', dataISO: '' } };
    var ex = extras(deps, p);
    /* Somente vencimentos explícitos. Datas de aplicação (*_t) nunca viram validade aqui. */
    return {
      vacina: prevUnica([ex.vac_mult_p, ex.vac_gripe_p, ex.vac_raiva_p], dia),
      vermifugo: prevUnica([ex.verm_p || ex.vermifugo_p], dia),
      carrapaticida: prevUnica([ex.ecto_p || ex.carrapaticida_p], dia)
    };
  }
  function primeiroTexto(valores) {
    var achado = '';
    valores.some(function (v) { if (texto(v)) { achado = texto(v); return true; } return false; });
    return achado;
  }
  function textoPersistido(v, limite) {
    if (typeof v !== 'string') return '';
    var s = texto(v);
    return s.length <= limite ? s : '';
  }
  function detalhesAvaliacao(deps, p, reg) {
    var det = objeto(reg && reg.det);
    return {
      experiencia: primeiroTexto([det.experiencia, p && dado(deps, p, 'experiencia_creche'), p && dado(deps, p, 'creche_anterior'), p && dado(deps, p, 'experiencia_daycare')]),
      saude: primeiroTexto([det.doenca, det.restricao, p && dado(deps, p, 'problema'), p && dado(deps, p, 'restricao'), p && dado(deps, p, 'alergia')]),
      observacoes: primeiroTexto([det.observacoes, det.obs, p && dado(deps, p, 'obs_tutor'), p && dado(deps, p, 'observacoes')])
    };
  }
  function prevConferencia(v, dia) {
    v = objeto(v);
    var situacao = texto(v.situacao), dataISO = texto(v.dataISO);
    if (['em-dia', 'vencido', 'conferir'].indexOf(situacao) < 0) return null;
    if (dataISO && !dataValida(dataISO)) return null;
    if (situacao === 'em-dia' && (!dataISO || dataISO < dia)) return null;
    if (situacao === 'vencido' && (!dataISO || dataISO >= dia)) return null;
    return { situacao: situacao, dataISO: dataISO };
  }
  function prevCheckConferencia(v, dia) {
    v = objeto(v);
    if (typeof v.conferido === 'boolean') return { conferido: v.conferido };
    var legado = prevConferencia(v, dia);
    return { conferido: !!legado && legado.situacao === 'em-dia' };
  }
  function conferenciaEfetiva(deps, dia, p, regAvaliacao, persistida, fontePronta) {
    var basePrev = prevencao(deps, p, dia), baseDet = detalhesAvaliacao(deps, p, regAvaliacao), r = objeto(persistida);
    var origem = objeto(objeto(regAvaliacao && regAvaliacao.det).avaliacao129);
    function prev(nome) {
      if (proprio(r, nome)) return prevCheckConferencia(r[nome], dia);
      if (proprio(origem, nome)) return prevCheckConferencia(origem[nome], dia);
      return { conferido: !!basePrev[nome] && basePrev[nome].situacao === 'em-dia' };
    }
    function campo(nome, limite, base) {
      if (proprio(r, nome)) return textoPersistido(r[nome], limite);
      if (proprio(origem, nome)) return textoPersistido(origem[nome], limite);
      return texto(base);
    }
    return {
      tutor: campo('tutor', 140, p && tutorPet(deps, p)),
      vacina: prev('vacina'), vermifugo: prev('vermifugo'), carrapaticida: prev('carrapaticida'),
      experiencia: campo('experiencia', 500, baseDet.experiencia),
      saude: campo('saude', 500, baseDet.saude),
      observacoes: campo('observacoes', 1000, baseDet.observacoes),
      revisao: fontePronta ? (Number(r.revisao) || 0) : null,
      quem: fontePronta ? primeiroTexto([textoPersistido(r.autorNome, 140), textoPersistido(r.quem, 140)]) : '',
      quando: fontePronta ? (texto(r.quando) || quandoBR(r.ts)) : ''
    };
  }
  function prevAgenda(v) { return { conferido: !!(v && v.conferido) }; }
  function observacoesConferencia(p, conf) {
    var out = [];
    function por(rotulo, v) { if (texto(v)) out.push({ rotulo: rotulo, valor: texto(v) }); }
    por('Experiência anterior', conf.experiencia);
    por('Doença ou restrição', conf.saude);
    por('Observações', conf.observacoes);
    if (!p && !out.length) por('Conferência', 'Cadastro não associado com segurança');
    return out;
  }
  function minutosHoraAvaliacao(v) {
    var s = texto(v).toLowerCase().replace(/\s+/g, ''), m = /^([01]?\d|2[0-3]):([0-5]\d)$/.exec(s);
    if (!m) m = /^([01]?\d|2[0-3])h(?:([0-5]\d))?$/.exec(s);
    return m ? Number(m[1]) * 60 + Number(m[2] || 0) : null;
  }
  function montarAgenda(deps, dia, fontes, cad) {
    if (!pronto(fontes.dashboard)) return { estado: falhou(fontes.dashboard) ? 'falha' : 'carregando', itens: [] };
    var peludinhos = lista(cad.peludinhos), grupo = valor(fontes.dashboard).avaliacao;
    var fonteConferenciaPronta = pronto(fontes.avaliacoesGestao), conferencias = valor(fontes.avaliacoesGestao);
    var itens = registros(grupo).map(function (it, ordem) {
      var p = cad.pronto === true ? associarCadastro(deps, peludinhos, it.reg, false) : null;
      var v = separarValor(it.reg), conf = conferenciaEfetiva(deps, dia, p, it.reg, conferencias[it.id], fonteConferenciaPronta);
      return {
        id: 'avaliacao-' + hash(it.id), codigoOrigem: it.id, hora: texto(it.reg.hora),
        nome: v.nome, raca: v.raca, tutor: conf.tutor,
        vacina: prevAgenda(conf.vacina), vermifugo: prevAgenda(conf.vermifugo), carrapaticida: prevAgenda(conf.carrapaticida),
        observacoes: observacoesConferencia(p, conf), conferencia: conf, _ordem: ordem
      };
    });
    itens.sort(function (a, b) {
      var am = minutosHoraAvaliacao(a.hora), bm = minutosHoraAvaliacao(b.hora);
      if (am == null && bm == null) return a._ordem - b._ordem;
      if (am == null) return 1;
      if (bm == null) return -1;
      return am - bm || a._ordem - b._ordem;
    });
    itens.forEach(function (it) { delete it._ordem; });
    return { estado: 'pronto', itens: itens };
  }

  function campoTexto(v, limite, obrigatorio, codigo) {
    if (v == null && !obrigatorio) return '';
    if (typeof v !== 'string') throw new Error(codigo + '_INVALIDO');
    var s = texto(v);
    if ((obrigatorio && !s) || s.length > limite) throw new Error(codigo + '_INVALIDO');
    return s;
  }
  function prevEntrada(v, codigo) {
    if (!v || typeof v !== 'object' || Array.isArray(v)) throw new Error(codigo + '_INVALIDO');
    if (typeof v.conferido !== 'boolean') throw new Error(codigo + '_INVALIDO');
    return { conferido: v.conferido };
  }
  function prevParaGravar(atual, novo) {
    atual = objeto(atual);
    var out = { conferido: novo.conferido === true };
    var situacao = texto(atual.situacao), dataISO = texto(atual.dataISO);
    /* Migração sem perda: conserva a data antiga válida, mas nunca aceita ou cria data nova. */
    if (['em-dia', 'vencido', 'conferir'].indexOf(situacao) >= 0 && (!dataISO || dataValida(dataISO))) {
      out.situacao = situacao;
      out.dataISO = dataISO;
    }
    return out;
  }

  function hospedesAtivos(deps, dia, cad) {
    var mod = deps.ZeluzHospedesAtividades || deps.hospedesAtividades;
    if (cad.estadiasProntas !== true || !mod || typeof mod.listarHospedesAtivos !== 'function') return { pronto: false, itens: [] };
    try {
      return mod.listarHospedesAtivos({
        pronto: true, dia: dia, estadias: objeto(cad.estadias), peludinhos: lista(cad.peludinhos),
        dcKey: deps.helpers.dcKey, pelKey: function (p) { return pelKeyCompativel(deps, p); }
      });
    } catch (_) { return { pronto: false, itens: [] }; }
  }
  function participantesDoDia(deps, dia, fontes, cad) {
    if (cad.pronto !== true) return { pronto: false, estado: cad.falha ? 'falha' : 'carregando', itens: [], matriculados: null, avulsos: null, reposicoes: null, total: null };
    var rel = relogioSP(deps.agora), slug = diaSemana(dia), peludinhos = lista(cad.peludinhos), por = {}, ordem = [];
    function incluir(chave, p, origem, reg) {
      if (!chave || por[chave]) return false;
      var v = reg ? separarValor(reg) : { nome: '', raca: '' };
      var b = p ? basePet(deps, p) : { chave: chave, p: null, nome: v.nome, raca: v.raca, tutor: '' };
      b.origem = origem; por[chave] = b; ordem.push(b); return true;
    }
    /* No histórico, a ficha de hoje não reconstrói quem era esperado naquele dia. */
    if (dia < rel.dia) {
      if (!pronto(fontes.turma) || !Array.isArray(valor(fontes.turma).chaves)) return { pronto: false, estado: falhou(fontes.turma) ? 'falha' : 'carregando', itens: [], matriculados: null, avulsos: null, reposicoes: null, total: null, historicoSemTurma: true };
      valor(fontes.turma).chaves.forEach(function (k) {
        var achados = peludinhos.filter(function (p) { return chavePet(deps, p) === texto(k); });
        incluir(texto(k), achados.length === 1 ? achados[0] : null, 'fotografia-turma');
      });
      return { pronto: true, historico: true, itens: ordem, por: por, matriculados: null, avulsos: null, reposicoes: null, total: ordem.length, incompleto: false };
    }
    if (!pronto(fontes.dashboard)) return { pronto: false, estado: falhou(fontes.dashboard) ? 'falha' : 'carregando', itens: [], matriculados: null, avulsos: null, reposicoes: null, total: null };
    peludinhos.forEach(function (p) {
      if (!ativo(deps, p) || morador(deps, p) || ['seg', 'ter', 'qua', 'qui', 'sex'].indexOf(slug) < 0) return;
      if (diasDoPet(deps, p, dia).indexOf(slug) >= 0) incluir(chavePet(deps, p), p, 'matriculado');
    });
    var nMat = ordem.length, dash = valor(fontes.dashboard), nRep = 0, nAv = 0, repIncompleta = false, avIncompleta = !pronto(fontes.avulsos);
    registros(dash.reposicao).forEach(function (it) {
      var r = chaveRegistro(deps, 'reposicao', it, peludinhos);
      if (!r.chave) { repIncompleta = true; return; }
      if (incluir(r.chave, r.p, 'reposicao', it.reg)) nRep += 1;
    });
    /* O nó oficial de avulsos cobre o que entrou pela Chamada; o dashboard cobre Lançamentos. */
    if (pronto(fontes.avulsos)) registros(valor(fontes.avulsos)).forEach(function (it) {
      var r = chaveRegistro(deps, 'avulso', it, peludinhos);
      if (!r.chave) { avIncompleta = true; return; }
      if (incluir(r.chave, r.p, 'avulso', it.reg)) nAv += 1;
    });
    registros(dash.avulso).forEach(function (it) {
      var r = chaveRegistro(deps, 'avulso', it, peludinhos);
      if (!r.chave) { avIncompleta = true; return; }
      if (incluir(r.chave, r.p, 'avulso', it.reg)) nAv += 1;
    });
    return { pronto: true, itens: ordem, por: por, matriculados: nMat, avulsos: avIncompleta ? null : nAv,
      reposicoes: repIncompleta ? null : nRep, total: repIncompleta || avIncompleta ? null : ordem.length,
      incompleto: repIncompleta || avIncompleta };
  }
  function estadoRefeicao(v) {
    if (v && typeof v === 'object') return texto(v.estado || v.valor);
    return texto(v);
  }
  function checkinValido(deps, v) {
    var p = deps.Presenca96 || deps.ZeluzPresenca96Core || deps.presenca96;
    if (p && typeof p.checkinValido === 'function') { try { return !!p.checkinValido(v); } catch (_) {} }
    return !!(v && v.fim && (!v.tipo || v.tipo === 'entrada'));
  }
  function checkoutValido(deps, v) {
    var p = deps.Presenca96 || deps.ZeluzPresenca96Core || deps.presenca96;
    if (p && typeof p.checkoutValido === 'function') { try { return !!p.checkoutValido(v); } catch (_) {} }
    return !!(v && v.fim && (!v.tipo || v.tipo === 'saida'));
  }
  function refeicaoPositiva(deps, v) {
    var p = deps.Presenca96 || deps.ZeluzPresenca96Core || deps.presenca96;
    if (p && typeof p.refeicaoPositiva === 'function') { try { return !!p.refeicaoPositiva(v); } catch (_) {} }
    return ['tudo', 'metade', 'nao', 'comeu'].indexOf(estadoRefeicao(v)) >= 0;
  }
  function fontesPresencaProntas(fontes) {
    return ['chamada', 'meta', 'checkins', 'checkout', 'almoco', 'almoco2', 'avulsos', 'turma'].every(function (k) { return pronto(fontes[k]); });
  }
  function estaPresente(deps, chave, fontes, hospedes) {
    var chamada = valor(fontes.chamada), meta = valor(fontes.meta), m = objeto(meta[chave]);
    if (chamada[chave] === 'veio' || checkinValido(deps, valor(fontes.checkins)[chave]) || checkoutValido(deps, valor(fontes.checkout)[chave])) return true;
    if (refeicaoPositiva(deps, valor(fontes.almoco)[chave]) || refeicaoPositiva(deps, valor(fontes.almoco2)[chave])) return true;
    if (['presenca-operacional-sem-exame', 'presenca-informada-sem-exame', 'presenca-confirmada-checkin'].indexOf(texto(m.estado)) >= 0) return true;
    return !!hospedes[chave];
  }
  function montarQuantidades(deps, dia, fontes, cad, parts, hosp) {
    if (!parts.pronto) return { estado: parts.estado === 'carregando' ? 'carregando' : 'falha', matriculados: null, avulsos: null, reposicoes: null, total: null, hospedes: null, presentes: null };
    var hospVistos = {}, hospN = hosp.pronto ? 0 : null;
    if (hosp.pronto) hosp.itens.forEach(function (o) { var k = o && o.p ? chavePet(deps, o.p) : texto(o && o.refKey); if (k && !hospVistos[k]) { hospVistos[k] = true; hospN += 1; } });
    var rel = relogioSP(deps.agora), presentes = null;
    if (!parts.incompleto && hosp.pronto && dia <= rel.dia && fontesPresencaProntas(fontes)) presentes = parts.itens.filter(function (x) { return estaPresente(deps, x.chave, fontes, hospVistos); }).length;
    return { estado: 'pronto', matriculados: parts.matriculados, avulsos: parts.avulsos, reposicoes: parts.reposicoes, total: parts.total, hospedes: hospN, presentes: presentes };
  }

  function reposicoesDaSessao(cad) {
    if (Array.isArray(cad.reposicoes)) return cad.reposicoes.slice();
    var r = objeto(cad.reposicoes || cad.repos), out = [];
    Object.keys(r).forEach(function (k) {
      var v = r[k];
      if (Array.isArray(v)) v.forEach(function (x) { out.push(x); });
      else if (v && typeof v === 'object') out.push(v);
    });
    return out;
  }
  function participantesPresenca(deps, fontes, parts, cad) {
    var turma = valor(fontes.turma), chaves = Array.isArray(turma.chaves) ? turma.chaves : [];
    var por = {};
    parts.itens.forEach(function (x) { por[x.chave] = x; });
    var out = chaves.map(function (k) {
      var x = por[k] || {};
      return { chave: k, pet: x.nome || 'FILHOt a conferir', tutor: x.tutor || '', telefone: '' };
    });
    var av = valor(fontes.avulsos);
    Object.keys(av).forEach(function (id) {
      var r = objeto(av[id]), n = texto(r.nome || r.n), t = texto(r.tutor), k;
      if (!n) return;
      try { k = texto(deps.helpers.dcKey(n, t)); } catch (_) { k = 'av-' + hash(id); }
      if (!out.some(function (x) { return x.chave === k; })) out.push({ chave: k, pet: n, tutor: t, telefone: '' });
    });
    return out;
  }
  function montarFaltas(deps, dia, fontes, cad, parts) {
    var rel = relogioSP(deps.agora), core = deps.Presenca96 || deps.ZeluzPresenca96Core || deps.presenca96;
    if (dia > rel.dia) return { estado: 'pronto', itens: [] };
    if (!fontesPresencaProntas(fontes) || cad.reposProntas !== true || !core || typeof core.resumoGestao !== 'function') return { estado: 'falha', itens: [] };
    var turma = valor(fontes.turma), agendaPronta = Array.isArray(turma.chaves);
    if (dia < rel.dia && !agendaPronta) return { estado: 'falha', itens: [] };
    var fs = {}, nomes = ['chamada', 'meta', 'checkins', 'checkout', 'almoco', 'almoco2', 'avulsos', 'turma'];
    nomes.forEach(function (n) { fs[n] = { pronto: pronto(fontes[n]), valores: valor(fontes[n]) }; });
    var resumo;
    try {
      resumo = core.resumoGestao({ dia: dia, hoje: rel.dia, minutosAgora: rel.minutos, fontes: fs,
        reposPronto: true, agendaPronta: agendaPronta, participantes: participantesPresenca(deps, fontes, parts, cad), reposicoes: reposicoesDaSessao(cad) });
    } catch (_) { return { estado: 'falha', itens: [] }; }
    if (!resumo || resumo.estado === 'fonte-incompleta') return { estado: 'falha', itens: [] };
    if (resumo.estado === 'aguardando-1130') return { estado: 'pronto', itens: [{ id: 'regra-1130', nome: 'Conferência de faltas', situacao: 'Aguardando 11h30', detalhe: 'Antes de 11h30 nenhuma ausência é tratada como falta por este painel.' }] };
    var faixa = resumo.revisao15 ? 'Revisão das 15h' : 'Acompanhamento desde 11h30', itens = [];
    lista(resumo.avisadas).forEach(function (x) { itens.push({ id: 'avisada-' + hash(x.chave), nome: texto(x.pet), tutor: texto(x.tutor), situacao: 'Ausência avisada', motivo: texto(x.motivo), detalhe: faixa + (x.informante ? ' · Informante: ' + texto(x.informante) : '') }); });
    lista(resumo.trocasReposicoes).forEach(function (x) { itens.push({ id: 'troca-' + hash(x.chave + '^' + x.tipo), nome: texto(x.pet), tutor: texto(x.tutor), situacao: texto(x.tipo), motivo: texto(x.motivo), detalhe: faixa }); });
    lista(resumo.contatar).forEach(function (x) { itens.push({ id: 'contato-' + hash(x.chave), nome: texto(x.pet), tutor: texto(x.tutor), situacao: x.tipo === 'falta-sem-aviso' ? 'Falta sem aviso' : 'Ausência a conferir', motivo: texto(x.motivo), detalhe: faixa, chave: texto(x.chave) }); });
    return { estado: 'pronto', itens: itens };
  }

  function montarNovatos(deps, dia, fontes, cad, parts, hosp) {
    var rel = relogioSP(deps.agora), hospMap = {};
    if (!parts.pronto || !hosp.pronto || dia > rel.dia || !fontesPresencaProntas(fontes)) return { estado: parts.pronto && dia > rel.dia ? 'pronto' : 'falha', itens: [] };
    hosp.itens.forEach(function (o) { if (o && o.p) hospMap[chavePet(deps, o.p)] = true; });
    var itens = [];
    parts.itens.forEach(function (x) {
      if (!x.p || !estaPresente(deps, x.chave, fontes, hospMap)) return;
      var ex = extras(deps, x.p), mat = dataPrev(ex.matricula || x.p.matricula), desde = dataPrev(ex.adaptacao_desde), idade = mat ? diasEntre(mat, dia) : null, idadeAd = desde ? diasEntre(desde, dia) : null;
      var novo = idade !== null && idade >= 0 && idade <= 45;
      var adapt = texto(ex.adaptacao).toLowerCase() === 'sim' && idadeAd !== null && idadeAd >= 0 && idadeAd <= 45 && normal(ex.adaptacao_tipo) !== 'hospedagem';
      if (!novo && !adapt) return;
      var situacao = novo ? 'Cliente novo' : 'Em adaptação';
      var detalhe = novo ? ('Matrícula há ' + idade + ' dia' + (idade === 1 ? '' : 's') + '.') : '';
      if (adapt) detalhe += (detalhe ? ' ' : '') + 'Adaptação ativa' + (ex.adaptacao_tipo ? ': ' + texto(ex.adaptacao_tipo) : '') + ' · ' + idadeAd + ' dia' + (idadeAd === 1 ? '' : 's') + '.';
      itens.push({ id: 'novato-' + hash(x.chave), nome: x.nome, raca: x.raca, tutor: x.tutor, situacao: situacao, detalhe: detalhe, chave: x.chave });
    });
    return { estado: 'pronto', itens: itens };
  }
  function montarComida(deps, fontes, parts, hosp) {
    if (!parts.pronto || !hosp.pronto || !pronto(fontes.almoco) || !pronto(fontes.almoco2) || !pronto(fontes.avisosComida)) return { estado: 'falha', itens: [] };
    var hospPorChave = {}, vistos = {}, todos = [];
    hosp.itens.forEach(function (o) {
      if (!o || !o.p) return;
      var b = basePet(deps, o.p);
      /* Só muda uma linha da turma para hóspede quando o módulo ligou a estadia à ficha. */
      if (b.chave && typeof o.i === 'number') hospPorChave[b.chave] = true;
    });
    parts.itens.forEach(function (x) {
      if (!x || !x.chave || vistos[x.chave]) return;
      vistos[x.chave] = true;
      todos.push(Object.assign({}, x, { grupo: hospPorChave[x.chave] ? 'hospede' : 'daycare' }));
    });
    hosp.itens.forEach(function (o) {
      if (!o || !o.p) return;
      var b = basePet(deps, o.p);
      if (!b.chave || vistos[b.chave]) return;
      vistos[b.chave] = true;
      b.grupo = 'hospede';
      todos.push(b);
    });
    var a1 = valor(fontes.almoco), a2 = valor(fontes.almoco2), av = valor(fontes.avisosComida), out = [];
    todos.forEach(function (x) {
      var m1 = estadoRefeicao(a1[x.chave]), m2 = estadoRefeicao(a2[x.chave]);
      if (m1 === 'na' || m2 === 'na' || m2 === 'comeu' || (m1 === 'comeu' && !m2) || m1 === 'tudo' || m2 === 'tudo') return;
      var situacao = '', refeicao = '', detalhe = '';
      if (m2 === 'nao') { situacao = 'Não comeu'; refeicao = '2º horário'; detalhe = 'Não comeu nem no 2º horário.'; }
      else if (m2 === 'metade') { situacao = 'Comeu metade'; refeicao = '2º horário'; detalhe = 'Comeu metade no 2º horário.'; }
      else if (m1 === 'nao' && !m2) { situacao = 'Aguardando'; refeicao = '1º horário'; detalhe = 'Não comeu no 1º horário; aguarda o 2º horário, por volta de 15h30.'; }
      else if (m1 === 'metade') { situacao = 'Comeu metade'; refeicao = '1º horário'; detalhe = 'Comeu metade; não vai ao 2º horário.'; }
      if (!situacao) return;
      if (av[x.chave]) detalhe += ' Aviso registrado.';
      out.push({ id: 'comida-' + hash(x.chave), nome: x.nome, raca: x.raca, tutor: x.tutor, situacao: situacao, refeicao: refeicao, detalhe: detalhe, chave: x.chave, grupo: x.grupo });
    });
    return { estado: 'pronto', itens: out };
  }
  function montarSaude(fontes) {
    if (!pronto(fontes.ocorrencias)) return { estado: falhou(fontes.ocorrencias) ? 'falha' : 'carregando', itens: [] };
    var out = [], o = valor(fontes.ocorrencias);
    Object.keys(o).forEach(function (id) {
      var x = objeto(o[id]); if (!texto(x.pet) || x.anulada) return;
      var detalhes = lista(x.itens).map(texto).filter(Boolean); if (texto(x.coco)) detalhes.push(texto(x.coco));
      out.push({ id: 'saude-' + hash(id), nome: texto(x.pet), tutor: texto(x.tutor), situacao: x.desfecho ? 'Resolvido' : 'Em aberto', detalhe: [texto(x.origem) || 'Check-in', detalhes.join(' · ')].filter(Boolean).join(': '), chave: texto(x.refKey) || id });
    });
    out.sort(function (a, b) { return a.nome.localeCompare(b.nome, 'pt-BR'); });
    return { estado: 'pronto', itens: out };
  }
  function minutosEntre(deps, ini, fim) {
    if (deps.helpers && typeof deps.helpers.diffMin === 'function') {
      try { var n = deps.helpers.diffMin(ini, fim); return Number.isFinite(n) && n >= 0 ? n : null; } catch (_) {}
    }
    if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(texto(ini)) || !/^([01]\d|2[0-3]):[0-5]\d$/.test(texto(fim))) return null;
    var a = ini.split(':').map(Number), b = fim.split(':').map(Number), n = b[0] * 60 + b[1] - (a[0] * 60 + a[1]);
    return n > 0 ? n : null;
  }
  function montarTempos(deps, fontes) {
    if (!pronto(fontes.tempo)) return { estado: falhou(fontes.tempo) ? 'falha' : 'carregando', itens: [] };
    var out = [], t = valor(fontes.tempo);
    Object.keys(t).forEach(function (slug) {
      var x = objeto(t[slug]), ini = texto(x.inicio), fim = texto(x.fim), quem = texto(x.quemInicio || x.quemFim);
      if (!quem && !ini && !fim) return;
      var aberta = !!ini && !fim, min = ini && fim ? minutosEntre(deps, ini, fim) : null;
      var rotulo = texto(x.atividade || x.nome);
      try { if (!rotulo && typeof deps.helpers.atividadeNome === 'function') rotulo = texto(deps.helpers.atividadeNome(slug)); } catch (_) {}
      out.push({ id: 'tempo-' + hash(slug), nome: quem, atividade: rotulo || texto(slug), minutos: min, emCurso: aberta, situacao: aberta ? 'Em curso' : (min == null ? 'A conferir' : 'Encerrada'), detalhe: aberta ? 'Atividade iniciada; o tempo ainda não foi confirmado.' : (min == null ? 'Horários inválidos ou incompletos.' : '') });
    });
    return { estado: 'pronto', itens: out };
  }

  function tarefasDerivadas(blocos) {
    var out = [], vistos = {};
    function add(tipo, chave, titulo, detalhe, categoria) {
      var id = 'm129-' + tipo + '-' + hash(chave);
      if (vistos[id]) return; vistos[id] = true;
      out.push({ id: id, titulo: titulo, detalhe: detalhe, feito: false, quem: '', quando: '', categoria: categoria });
    }
    if (blocos.faltas.estado === 'pronto') blocos.faltas.itens.forEach(function (x) {
      if (x.situacao === 'Falta sem aviso') add('falta', x.chave || x.id, 'Ligar para o tutor de ' + (x.nome || 'FILHOt a conferir'), 'Entender o motivo da ausência e conferir como o FILHOt está.', 'faltas');
    });
    if (blocos.novatos.estado === 'pronto') blocos.novatos.itens.forEach(function (x) {
      add('novato', x.chave || x.id, 'Conversar com a família de ' + (x.nome || 'FILHOt novato'), 'Ouvir o tutor e acompanhar a adaptação.', 'novatos');
      add('video', x.chave || x.id, 'Enviar vídeo para o tutor de ' + (x.nome || 'FILHOt novato'), 'Marque depois de enviar o vídeo à família.', 'novatos');
    });
    if (blocos.comida.estado === 'pronto') blocos.comida.itens.forEach(function (x) {
      if (x.situacao !== 'Aguardando') add('comida', x.chave || x.id, 'Conferir alimentação de ' + (x.nome || 'FILHOt'), x.detalhe, 'alimentacao');
    });
    if (blocos.saude.estado === 'pronto') blocos.saude.itens.forEach(function (x) {
      if (x.situacao === 'Em aberto') add('saude', x.chave || x.id, 'Conferir questão do check-in de ' + (x.nome || 'FILHOt'), x.detalhe, 'saude');
    });
    return out;
  }
  function montarTarefas(fontes, blocos) {
    if (!pronto(fontes.tarefas)) return { estado: falhou(fontes.tarefas) ? 'falha' : 'carregando', itens: [] };
    var persistidas = valor(fontes.tarefas), itens = tarefasDerivadas(blocos);
    itens.forEach(function (t) {
      var r = objeto(persistidas[t.id]);
      if (!proprio(r, 'feito')) return;
      t.feito = r.feito === true; t.quem = texto(r.autorNome || r.quem); t.quando = texto(r.quando) || quandoBR(r.ts);
    });
    return { estado: 'pronto', itens: itens };
  }

  function montarSnapshot(deps, dia, fontes) {
    var cad = cadastroSeguro(deps, dia), parts = participantesDoDia(deps, dia, fontes, cad), hosp = hospedesAtivos(deps, dia, cad);
    var blocos = {
      agenda: montarAgenda(deps, dia, fontes, cad),
      quantidades: montarQuantidades(deps, dia, fontes, cad, parts, hosp),
      faltas: montarFaltas(deps, dia, fontes, cad, parts),
      novatos: montarNovatos(deps, dia, fontes, cad, parts, hosp),
      comida: montarComida(deps, fontes, parts, hosp),
      saude: montarSaude(fontes),
      tempos: montarTempos(deps, fontes)
    };
    blocos.tarefas = montarTarefas(fontes, blocos);
    var rel = relogioSP(deps.agora);
    return { dia: dia, atualizadoEm: rel.hora, agenda: blocos.agenda, quantidades: blocos.quantidades, faltas: blocos.faltas,
      novatos: blocos.novatos, comida: blocos.comida, saude: blocos.saude, tempos: blocos.tempos, tarefas: blocos.tarefas };
  }

  function criar(entrada) {
    var deps = entrada || {}, db = deps.db, helpers = deps.helpers || {}, emVoo = {}, ultimos = {}, revisoes = {}, fontesUltimas = {}, ativoObs = null, geracao = 0;
    deps.helpers = helpers;
    function autorizado() { try { return typeof deps.pode === 'function' && deps.pode() === true; } catch (_) { return false; } }
    function exigirPermissao() { if (!autorizado()) throw new Error('SEM_PERMISSAO'); }
    function autorValido() {
      var a; try { a = typeof deps.autor === 'function' ? deps.autor() : null; } catch (_) { a = null; }
      a = objeto(a); return texto(a.id) && texto(a.nome) ? { id: texto(a.id), nome: texto(a.nome) } : null;
    }
    function ler(nome, dia) {
      var no = caminho(CAMINHOS[nome], dia);
      if (!db || typeof db.ref !== 'function') return Promise.resolve({ estado: 'falha', valor: null });
      try {
        return Promise.resolve(db.ref(no).once('value')).then(function (snap) {
          return { estado: 'pronto', valor: snap && typeof snap.val === 'function' ? snap.val() : null };
        }, function () { return { estado: 'falha', valor: null }; });
      } catch (_) { return Promise.resolve({ estado: 'falha', valor: null }); }
    }
    function memorizar(dia, snap, fontes) {
      var registros = valor(fontes && fontes.tarefas), mapa = {};
      Object.keys(registros).forEach(function (id) { mapa[id] = Number(objeto(registros[id]).revisao) || 0; });
      ultimos[dia] = snap;
      revisoes[dia] = mapa;
      fontesUltimas[dia] = fontes;
      return snap;
    }
    function carregar(dia) {
      dia = texto(dia); if (!dataValida(dia)) return Promise.reject(new Error('DIA_INVALIDO'));
      try { exigirPermissao(); } catch (e) { return Promise.reject(e); }
      if (emVoo[dia]) return emVoo[dia];
      var nomes = Object.keys(CAMINHOS);
      emVoo[dia] = Promise.all(nomes.map(function (n) { return ler(n, dia); })).then(function (res) {
        var fontes = {}; nomes.forEach(function (n, i) { fontes[n] = res[i]; });
        var snap = memorizar(dia, montarSnapshot(deps, dia, fontes), fontes); return copiar(snap);
      }).then(function (x) { delete emVoo[dia]; return x; }, function (e) { delete emVoo[dia]; throw e; });
      return emVoo[dia];
    }
    function desligar() {
      if (!ativoObs) return;
      ativoObs.assinaturas.forEach(function (a) {
        try { if (a.ref && typeof a.ref.off === 'function') a.ref.off('value', a.sucesso); } catch (_) {}
      });
      ativoObs = null; geracao += 1;
    }
    function observar(dia, atualizar) {
      dia = texto(dia); if (!dataValida(dia)) throw new Error('DIA_INVALIDO');
      desligar();
      if (typeof atualizar !== 'function') throw new Error('ATUALIZAR_OBRIGATORIO');
      exigirPermissao();
      var minha = ++geracao, fontes = estadoInicial(), assinaturas = [];
      ativoObs = { dia: dia, geracao: minha, assinaturas: assinaturas, fontes: fontes, publicar: null };
      function publicar() {
        if (!ativoObs || ativoObs.geracao !== minha || ativoObs.dia !== dia) return null;
        var snap = memorizar(dia, montarSnapshot(deps, dia, fontes), fontes), resposta = copiar(snap);
        try { atualizar(copiar(resposta)); } catch (_) {}
        return resposta;
      }
      ativoObs.publicar = publicar;
      publicar();
      Object.keys(CAMINHOS).forEach(function (nome) {
        var ref = db && typeof db.ref === 'function' ? db.ref(caminho(CAMINHOS[nome], dia)) : null;
        var sucesso = function (snap) {
          if (!ativoObs || ativoObs.geracao !== minha || ativoObs.dia !== dia) return;
          fontes[nome] = { estado: 'pronto', valor: snap && typeof snap.val === 'function' ? snap.val() : null }; publicar();
        };
        var erro = function () {
          if (!ativoObs || ativoObs.geracao !== minha || ativoObs.dia !== dia) return;
          fontes[nome] = { estado: 'falha', valor: null }; publicar();
        };
        if (!ref || typeof ref.on !== 'function') { fontes[nome] = { estado: 'falha', valor: null }; return; }
        assinaturas.push({ ref: ref, sucesso: sucesso });
        try { ref.on('value', sucesso, erro); } catch (_) { erro(); }
      });
      publicar();
      return function () { if (ativoObs && ativoObs.geracao === minha) desligar(); };
    }
    function recalcular() {
      if (!ativoObs || !autorizado() || typeof ativoObs.publicar !== 'function') return null;
      return ativoObs.publicar();
    }
    function salvarTarefa(cmd) {
      cmd = cmd || {}; var dia = texto(cmd.dia), id = texto(cmd.id), feito = cmd.feito;
      if (!dataValida(dia)) return Promise.reject(new Error('DIA_INVALIDO'));
      if (!/^[a-z0-9][a-z0-9_-]{0,79}$/.test(id)) return Promise.reject(new Error('ID_INVALIDO'));
      if (typeof feito !== 'boolean') return Promise.reject(new Error('ESTADO_INVALIDO'));
      try { exigirPermissao(); } catch (e) { return Promise.reject(e); }
      var autorInicio = autorValido();
      if (!autorInicio) return Promise.reject(new Error('AUTORIA_OBRIGATORIA'));
      var anterior = ultimos[dia], tarefa = anterior && anterior.tarefas && anterior.tarefas.itens.filter(function (x) { return x.id === id; })[0];
      if (!tarefa) return Promise.reject(new Error('TAREFA_DESATUALIZADA'));
      var esperado = tarefa.feito === true, revisaoEsperada = Number(revisoes[dia] && revisoes[dia][id]) || 0;
      if (esperado === feito) return Promise.reject(new Error('SEM_ALTERACAO'));
      if (!db || typeof db.ref !== 'function') return Promise.reject(new Error('BANCO_INDISPONIVEL'));
      var ref = db.ref('daycare/painel-tarefas/' + dia + '/' + id), motivo = '';
      return Promise.resolve(ref.transaction(function (atual) {
        /* Firebase pode repetir esta função: permissão e autoria são conferidas em cada tentativa. */
        if (!autorizado()) { motivo = 'SEM_PERMISSAO'; return; }
        var autor = autorValido();
        if (!autor) { motivo = 'AUTORIA_OBRIGATORIA'; return; }
        if (autor.id !== autorInicio.id || autor.nome !== autorInicio.nome) { motivo = 'AUTORIA_ALTERADA'; return; }
        atual = objeto(atual);
        var real = atual.feito === true, revisaoReal = Number(atual.revisao) || 0;
        if (real !== esperado || revisaoReal !== revisaoEsperada) { motivo = 'TAREFA_DESATUALIZADA'; return; }
        var rel = relogioSP(deps.agora), revisao = (Number(atual.revisao) || 0) + 1;
        var hist = Array.isArray(atual.historico) ? atual.historico.slice(-(LIMITE_HISTORICO - 1)) : [];
        hist.push({ revisao: revisao, feito: feito, autorId: autor.id, autorNome: autor.nome, ts: rel.ts });
        motivo = '';
        return { versao: 129, feito: feito, autorId: autor.id, autorNome: autor.nome, ts: rel.ts, revisao: revisao, historico: hist };
      })).then(function (res) {
        if (!res || res.committed !== true) throw new Error(motivo || 'TAREFA_DESATUALIZADA');
        var reg = res.snapshot && typeof res.snapshot.val === 'function' ? objeto(res.snapshot.val()) : {};
        if (reg.feito !== feito || !texto(reg.autorNome) || !Number(reg.ts)) throw new Error('CONFIRMACAO_INVALIDA');
        tarefa.feito = reg.feito; tarefa.quem = texto(reg.autorNome); tarefa.quando = quandoBR(reg.ts);
        if (!revisoes[dia]) revisoes[dia] = {};
        revisoes[dia][id] = Number(reg.revisao) || (revisaoEsperada + 1);
        if (ativoObs && ativoObs.dia === dia && pronto(ativoObs.fontes.tarefas)) {
          var tarefasAtuais = copiar(valor(ativoObs.fontes.tarefas));
          tarefasAtuais[id] = copiar(reg);
          ativoObs.fontes.tarefas = { estado: 'pronto', valor: tarefasAtuais };
        }
        return { id: id, feito: reg.feito, quem: texto(reg.autorNome), quando: quandoBR(reg.ts) };
      });
    }
    function salvarAvaliacao(cmd) {
      cmd = cmd || {};
      var dia = texto(cmd.dia), id = texto(cmd.id);
      if (!dataValida(dia)) return Promise.reject(new Error('DIA_INVALIDO'));
      if (!/^avaliacao-[a-z0-9]+$/.test(id)) return Promise.reject(new Error('ID_INVALIDO'));
      try { exigirPermissao(); } catch (e) { return Promise.reject(e); }
      var autorInicio = autorValido();
      if (!autorInicio) return Promise.reject(new Error('AUTORIA_OBRIGATORIA'));
      var entradaNormalizada;
      try {
        entradaNormalizada = {
          tutor: campoTexto(cmd.tutor, 140, true, 'TUTOR'),
          vacina: prevEntrada(cmd.vacina, 'VACINA'),
          vermifugo: prevEntrada(cmd.vermifugo, 'VERMIFUGO'),
          carrapaticida: prevEntrada(cmd.carrapaticida, 'CARRAPATICIDA'),
          experiencia: campoTexto(cmd.experiencia, 500, false, 'EXPERIENCIA'),
          saude: campoTexto(cmd.saude, 500, false, 'SAUDE'),
          observacoes: campoTexto(cmd.observacoes, 1000, false, 'OBSERVACOES')
        };
      } catch (e) { return Promise.reject(e); }
      var ultimo = ultimos[dia], fonteDia = fontesUltimas[dia];
      var item = ultimo && ultimo.agenda && ultimo.agenda.estado === 'pronto' && ultimo.agenda.itens.filter(function (x) { return x.id === id; })[0];
      if (!item || !texto(item.codigoOrigem)) return Promise.reject(new Error('AVALIACAO_DESATUALIZADA'));
      if (!fonteDia || !pronto(fonteDia.dashboard) || !pronto(fonteDia.avaliacoesGestao)) return Promise.reject(new Error('FONTE_AVALIACOES_INDISPONIVEL'));
      var codigoOrigem = texto(item.codigoOrigem), existe = registros(valor(fonteDia.dashboard).avaliacao).some(function (x) { return x.id === codigoOrigem; });
      if (!existe || /[.#$\[\]\/]/.test(codigoOrigem) || codigoOrigem.length > 160) return Promise.reject(new Error('AVALIACAO_DESATUALIZADA'));
      var revisaoEsperada = Number(item.conferencia && item.conferencia.revisao) || 0;
      if (cmd.expectedRevision != null) {
        var informada = cmd.expectedRevision;
        if (!Number.isInteger(informada) || informada < 0 || informada !== revisaoEsperada) return Promise.reject(new Error('AVALIACAO_DESATUALIZADA'));
      }
      if (!db || typeof db.ref !== 'function') return Promise.reject(new Error('BANCO_INDISPONIVEL'));
      var ref = db.ref('daycare/avaliacoes-gestao/' + dia + '/' + codigoOrigem), motivo = '';
      return Promise.resolve(ref.transaction(function (atual) {
        if (!autorizado()) { motivo = 'SEM_PERMISSAO'; return; }
        var autor = autorValido();
        if (!autor) { motivo = 'AUTORIA_OBRIGATORIA'; return; }
        if (autor.id !== autorInicio.id || autor.nome !== autorInicio.nome) { motivo = 'AUTORIA_ALTERADA'; return; }
        atual = objeto(atual);
        var revisaoReal = Number(atual.revisao) || 0;
        if (revisaoReal !== revisaoEsperada) { motivo = 'AVALIACAO_DESATUALIZADA'; return; }
        var rel = relogioSP(deps.agora), revisao = revisaoReal + 1;
        var prevs = {
          vacina: prevParaGravar(atual.vacina, entradaNormalizada.vacina),
          vermifugo: prevParaGravar(atual.vermifugo, entradaNormalizada.vermifugo),
          carrapaticida: prevParaGravar(atual.carrapaticida, entradaNormalizada.carrapaticida)
        };
        var hist = Array.isArray(atual.historico) ? atual.historico.slice(-(LIMITE_HISTORICO - 1)) : [];
        hist.push({
          revisao: revisao, tutor: entradaNormalizada.tutor,
          vacina: prevs.vacina, vermifugo: prevs.vermifugo, carrapaticida: prevs.carrapaticida,
          experiencia: entradaNormalizada.experiencia, saude: entradaNormalizada.saude, observacoes: entradaNormalizada.observacoes,
          autorId: autor.id, autorNome: autor.nome, ts: rel.ts
        });
        motivo = '';
        return {
          versao: 129, tutor: entradaNormalizada.tutor,
          vacina: prevs.vacina, vermifugo: prevs.vermifugo, carrapaticida: prevs.carrapaticida,
          experiencia: entradaNormalizada.experiencia, saude: entradaNormalizada.saude, observacoes: entradaNormalizada.observacoes,
          autorId: autor.id, autorNome: autor.nome, ts: rel.ts, revisao: revisao, historico: hist
        };
      })).then(function (res) {
        if (!res || res.committed !== true) throw new Error(motivo || 'AVALIACAO_DESATUALIZADA');
        var reg = res.snapshot && typeof res.snapshot.val === 'function' ? objeto(res.snapshot.val()) : {};
        if (Number(reg.revisao) !== revisaoEsperada + 1 || texto(reg.autorId) !== autorInicio.id || texto(reg.autorNome) !== autorInicio.nome) throw new Error('CONFIRMACAO_INVALIDA');
        var registrosGestao = copiar(valor(fonteDia.avaliacoesGestao));
        registrosGestao[codigoOrigem] = copiar(reg);
        fonteDia.avaliacoesGestao = { estado: 'pronto', valor: registrosGestao };
        var atualizado;
        if (ativoObs && ativoObs.dia === dia && typeof ativoObs.publicar === 'function') atualizado = ativoObs.publicar();
        else atualizado = copiar(memorizar(dia, montarSnapshot(deps, dia, fonteDia), fonteDia));
        var agenda = atualizado.agenda.itens.filter(function (x) { return x.id === id; })[0];
        if (!agenda) throw new Error('CONFIRMACAO_INVALIDA');
        return { id: id, codigoOrigem: codigoOrigem, agenda: copiar(agenda), conferencia: copiar(agenda.conferencia) };
      });
    }
    return { carregar: carregar, observar: observar, recalcular: recalcular, fechar: desligar, salvarTarefa: salvarTarefa, salvarAvaliacao: salvarAvaliacao };
  }

  return { criar: criar };
});
