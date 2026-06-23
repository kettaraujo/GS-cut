/* DevDesk — Métricas (dashboard do time + individual) */

/* gráfico de barras simples em SVG */
function Barras({ dados, max, cor = 'var(--gold)', altura = 120, fmt = (v) => v, atual }) {
  const w = 100 / dados.length;
  return (
    <svg viewBox="0 0 320 150" style={{ width: '100%', height: 'auto', display: 'block' }}>
      {dados.map((d, i) => {
        const h = (d.v / max) * 110;
        const x = (i * 320) / dados.length + 8;
        const bw = 320 / dados.length - 16;
        const destaque = atual === i;
        return (
          <g key={i}>
            <rect x={x} y={130 - h} width={bw} height={h} rx="3"
              fill={destaque ? cor : 'var(--surface-3)'}
              stroke={destaque ? 'none' : 'var(--line-strong)'} strokeWidth="1"></rect>
            <text x={x + bw / 2} y={124 - h} textAnchor="middle" fill={destaque ? cor : 'var(--text-dim)'}
              fontSize="11" fontFamily="JetBrains Mono" fontWeight="700">{fmt(d.v)}</text>
            <text x={x + bw / 2} y={145} textAnchor="middle" fill="var(--text-faint)" fontSize="9.5" fontFamily="JetBrains Mono">{d.rotulo}</text>
          </g>
        );
      })}
    </svg>
  );
}

function Burndown() {
  const b = window.DD_METRICS.burndown;
  const W = 320, H = 150, px = 30, py = 12, pb = 22;
  const nx = (d) => px + (d / 10) * (W - px - 10);
  const ny = (v) => py + (1 - v / b.comprometido) * (H - py - pb);
  const ideal = `M ${nx(0)} ${ny(b.comprometido)} L ${nx(10)} ${ny(0)}`;
  const real = b.real.map((v, i) => `${i === 0 ? 'M' : 'L'} ${nx(i)} ${ny(v)}`).join(' ');
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto', display: 'block' }}>
      {[0, 14, 28, 42].map((v) => (
        <g key={v}>
          <line x1={px} x2={W - 10} y1={ny(v)} y2={ny(v)} stroke="var(--line)" strokeWidth="1"></line>
          <text x={px - 6} y={ny(v) + 3} textAnchor="end" fill="var(--text-faint)" fontSize="9" fontFamily="JetBrains Mono">{v}</text>
        </g>
      ))}
      {[0, 2, 4, 6, 8, 10].map((d) => (
        <text key={d} x={nx(d)} y={H - 6} textAnchor="middle" fill="var(--text-faint)" fontSize="9" fontFamily="JetBrains Mono">d{d}</text>
      ))}
      <path d={ideal} stroke="var(--text-faint)" strokeWidth="1.5" strokeDasharray="4 4" fill="none"></path>
      <path d={real} stroke="var(--gold)" strokeWidth="2.2" fill="none" strokeLinejoin="round"></path>
      <circle cx={nx(b.real.length - 1)} cy={ny(b.real[b.real.length - 1])} r="3.5" fill="var(--gold)"></circle>
      <line x1={nx(b.diaAtual)} x2={nx(b.diaAtual)} y1={py} y2={H - pb} stroke="var(--gold-dim)" strokeWidth="14" opacity="0.9"></line>
    </svg>
  );
}

function TelaMetricas({ papel, onAbrirRelatorio }) {
  const M = window.DD_METRICS;
  const ehViewer = papel === 'viewer';
  const ehTL = papel === 'techlead';
  const eu = PAPEL_USER[papel];
  const b = M.burndown;
  const restante = b.real[b.real.length - 1];

  return (
    <div className="dd-main">
      <Topbar titulo="Métricas" sub={ehViewer ? 'Visão agregada do time · somente leitura (RN-14)' : 'Derivadas do log imutável de transições (RN-15)'}>
        {ehTL ? (
          <span style={{ display: 'inline-flex', gap: 8 }}>
            <button className="dd-btn sm"><Ic d={ICONS.doc} size={12}></Ic>Exportar CSV</button>
            <button className="dd-btn sm"><Ic d={ICONS.doc} size={12}></Ic>Exportar PDF</button>
          </span>
        ) : null}
      </Topbar>
      <div className="dd-scroll">
        <div style={{ padding: 22, display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* KPIs */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12 }}>
            <div className="dd-panel dd-kpi">
              <div className="k-label">Velocity média (3 sprints)</div>
              <div className="k-valor">{M.velocityMedia3}<span style={{ fontSize: 13, color: 'var(--text-dim)' }}> pts</span></div>
              <div className="k-sub"><span className="up">▲ S11: 33 pts</span></div>
            </div>
            <div className="dd-panel dd-kpi">
              <div className="k-label">Sprint 12 · restante</div>
              <div className="k-valor">{restante}<span style={{ fontSize: 13, color: 'var(--text-dim)' }}> / {b.comprometido} pts</span></div>
              <div className="k-sub">dia {b.diaAtual} de 10 · ritmo ok</div>
            </div>
            <div className="dd-panel dd-kpi">
              <div className="k-label">Lead time médio</div>
              <div className="k-valor">{M.leadTimeMedio.toFixed(1).replace('.', ',')}<span style={{ fontSize: 13, color: 'var(--text-dim)' }}> d.u.</span></div>
              <div className="k-sub">criação → conclusão</div>
            </div>
            <div className="dd-panel dd-kpi">
              <div className="k-label">Taxa de rollover (S11)</div>
              <div className="k-valor">6<span style={{ fontSize: 13, color: 'var(--text-dim)' }}> %</span></div>
              <div className="k-sub"><span className="up">▼ em queda desde S7 (19%)</span></div>
            </div>
            <div className="dd-panel dd-kpi">
              <div className="k-label">Throughput (S11)</div>
              <div className="k-valor">12<span style={{ fontSize: 13, color: 'var(--text-dim)' }}> tasks</span></div>
              <div className="k-sub">concluídas na sprint</div>
            </div>
          </div>

          {/* gráficos linha 1 */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
            <div className="dd-panel">
              <div className="dd-panel-head"><h2>Velocity por sprint</h2><span style={{ marginLeft: 'auto', fontSize: 10, color: 'var(--text-faint)' }}>pts concluídos</span></div>
              <div className="dd-panel-body">
                <Barras dados={M.velocity.map((v) => ({ rotulo: v.sprint, v: v.pts }))} max={40} atual={4}></Barras>
              </div>
            </div>
            <div className="dd-panel">
              <div className="dd-panel-head"><h2>Burndown · Sprint 12</h2><span style={{ marginLeft: 'auto', fontSize: 10, color: 'var(--text-faint)' }}>pts × dias úteis</span></div>
              <div className="dd-panel-body"><Burndown></Burndown></div>
            </div>
            <div className="dd-panel">
              <div className="dd-panel-head"><h2>Taxa de rollover</h2><span style={{ marginLeft: 'auto', fontSize: 10, color: 'var(--text-faint)' }}>% de pts que rolaram</span></div>
              <div className="dd-panel-body">
                <Barras dados={M.rollover.map((v) => ({ rotulo: v.sprint, v: v.pct }))} max={25} atual={4} fmt={(v) => `${v}%`} cor="var(--green)"></Barras>
              </div>
            </div>
          </div>

          {/* linha 2: cycle time + projeções */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 12 }}>
            <div className="dd-panel">
              <div className="dd-panel-head">
                <h2>Cycle time por faixa de pontuação</h2>
                <span style={{ marginLeft: 'auto', fontSize: 10, color: 'var(--text-faint)' }}>tempo bloqueado exibido à parte (RN-09)</span>
              </div>
              <table className="dd-table">
                <thead><tr><th>Pts</th><th>Cycle time médio</th><th></th><th>Bloqueado</th><th>Amostra</th></tr></thead>
                <tbody>
                  {M.cyclePorPonto.map((c) => (
                    <tr key={c.pts} style={{ cursor: 'default' }}>
                      <td><Pts v={c.pts}></Pts></td>
                      <td className="mono" style={{ fontWeight: 700 }}>{c.dias.toFixed(1).replace('.', ',')} d.u.</td>
                      <td style={{ width: '36%' }}>
                        <div className="mt-cyclebar">
                          <span style={{ width: `${(c.dias / 7) * 100}%` }}></span>
                          <span className="blk" style={{ width: `${(c.bloqueado / 7) * 100}%` }}></span>
                        </div>
                      </td>
                      <td className="mono" style={{ color: c.bloqueado >= 0.8 ? 'var(--red)' : 'var(--text-dim)' }}>+{c.bloqueado.toFixed(1).replace('.', ',')}</td>
                      <td className="mono" style={{ color: 'var(--text-faint)' }}>{c.amostra} tasks</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="pl-regra">"Uma task de 3 pontos leva, em média, 2,4 dias úteis" — resposta empírica, não promessa</div>
            </div>

            <div className="dd-panel">
              <div className="dd-panel-head"><h2>Projeção de conclusão por épico</h2><span style={{ marginLeft: 'auto', fontSize: 10, color: 'var(--text-faint)' }}>restante ÷ velocity (RF-33)</span></div>
              <div className="dd-panel-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {window.DD_EPICS.map((e) => {
                  const rest = e.totalPts - e.donePts;
                  const sprints = Math.ceil(rest / M.velocityMedia3 * 10) / 10;
                  const pct = Math.round((e.donePts / e.totalPts) * 100);
                  return (
                    <div key={e.id}>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 5 }}>
                        <span className="edot" style={{ width: 7, height: 7, borderRadius: 2, background: e.cor, display: 'inline-block' }}></span>
                        <strong style={{ fontSize: 12.5 }}>{e.nome}</strong>
                        <span style={{ flex: 1 }}></span>
                        <span className="mono" style={{ fontSize: 11, color: 'var(--text-dim)' }}>{e.donePts}/{e.totalPts} pts</span>
                      </div>
                      <Progress pct={pct} cor={e.cor}></Progress>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4, fontSize: 10.5, color: 'var(--text-faint)' }}>
                        <span>{rest} pts restantes</span>
                        <span className="mono" style={{ color: 'var(--text-dim)' }}>{rest === 0 ? 'concluído' : `~${sprints.toFixed(1).replace('.', ',')} sprint${sprints > 1 ? 's' : ''}`}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* individual — oculto para viewer (RN-14) */}
          {!ehViewer ? (
            <div className="dd-panel">
              <div className="dd-panel-head">
                <h2>{ehTL ? 'Métricas individuais · Sprint 12' : 'Minhas métricas · Sprint 12'}</h2>
                <span style={{ marginLeft: 'auto', fontSize: 10, color: 'var(--text-faint)' }}>visível ao próprio dev e ao TechLead (RN-14)</span>
              </div>
              <table className="dd-table">
                <thead><tr><th>Dev</th><th>Pts concluídos</th><th>Tasks concluídas</th><th>Cycle time médio</th><th>Colaborações prestadas</th></tr></thead>
                <tbody>
                  {M.individual.filter((m) => ehTL || m.user === eu).map((m) => {
                    const u = ddUser(m.user);
                    return (
                      <tr key={m.user} style={{ cursor: 'default' }}>
                        <td><span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}><Avatar userId={m.user} size="sm"></Avatar><strong>{u.nome}</strong></span></td>
                        <td className="mono" style={{ fontWeight: 700 }}>{m.ptsSprint}</td>
                        <td className="mono">{m.tasksSprint}</td>
                        <td className="mono">{m.cycleMedio.toFixed(1).replace('.', ',')} d.u.</td>
                        <td>
                          <span className="mono" style={{ color: m.colaboracoes >= 3 ? 'var(--gold)' : undefined }}>{m.colaboracoes}</span>
                          {m.colaboracoes >= 3 ? <span style={{ fontSize: 10, color: 'var(--gold)', marginLeft: 6 }}>destaque em colaboração</span> : null}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {ehTL ? <div className="pl-regra">Métricas calibram o time, não ranqueiam pessoas — visíveis só aqui (RN-14)</div> : null}
            </div>
          ) : null}

        </div>
      </div>
    </div>
  );
}

Object.assign(window, { TelaMetricas });
