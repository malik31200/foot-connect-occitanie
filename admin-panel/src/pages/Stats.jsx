import { useEffect, useState } from 'react'
import client from '../api/client'

const RED = '#E4002B'

const card = {
    border: '1px solid var(--border)',
    borderRadius: 10,
    padding: 16,
    textAlign: 'left',
    background: 'var(--bg)',
}

const fmtDay = (iso) => {
    const [, m, d] = iso.split('-')
    return `${d}/${m}`
}

function Kpi({ label, value, hint }) {
    return (
        <div style={card}>
            <div style={{ fontSize: 13 }}>{label}</div>
            <div style={{ fontSize: 30, fontWeight: 700, color: 'var(--text-h)', lineHeight: 1.2 }}>{value}</div>
            {hint && <div style={{ fontSize: 12, marginTop: 4 }}>{hint}</div>}
        </div>
    )
}

// Histogramme simple en SVG : une barre par jour, valeur au survol
function DailyBars({ data, field, color = RED }) {
    const max = Math.max(1, ...data.map(d => d[field]))
    const W = 600, H = 140, gap = 3
    const bw = W / data.length - gap
    return (
        <svg viewBox={`0 0 ${W} ${H + 20}`} style={{ width: '100%', height: 'auto', display: 'block' }}>
            <line x1="0" y1={H} x2={W} y2={H} stroke="var(--border)" />
            {data.map((d, i) => {
                const h = (d[field] / max) * (H - 14)
                const x = i * (bw + gap)
                return (
                    <g key={d.date}>
                        <title>{`${fmtDay(d.date)} : ${d[field]}`}</title>
                        <rect x={x} y={H - h} width={bw} height={Math.max(h, d[field] ? 2 : 0)} rx="2" fill={color} />
                        {/* on écrit la date une barre sur 5 + la dernière */}
                        {(i % 5 === 0 || i === data.length - 1) && (
                            <text x={x + bw / 2} y={H + 15} fontSize="11" textAnchor="middle" fill="currentColor">
                                {fmtDay(d.date)}
                            </text>
                        )}
                    </g>
                )
            })}
            <text x={W} y="11" fontSize="11" textAnchor="end" fill="currentColor">max {max}</text>
        </svg>
    )
}

function Section({ title, children }) {
    return (
        <div style={{ ...card, marginBottom: 16 }}>
            <h2 style={{ fontSize: 18, margin: '0 0 12px' }}>{title}</h2>
            {children}
        </div>
    )
}

export default function Stats() {
    const [stats, setStats] = useState(null)
    const [error, setError] = useState('')

    useEffect(() => {
        client.get('/admin/stats/')
            .then(res => setStats(res.data))
            .catch(() => setError('Impossible de charger les statistiques.'))
    }, [])

    if (error) return <div className="admin-page"><h1>Statistiques</h1><p>{error}</p></div>
    if (!stats) return <div className="admin-page"><h1>Statistiques</h1><p>Chargement…</p></div>

    const { kpis, retention, daily } = stats
    const totals = daily.reduce((acc, d) => {
        for (const k of ['posts', 'likes', 'comments', 'messages', 'signups']) acc[k] = (acc[k] || 0) + d[k]
        return acc
    }, {})
    const retentionRate = retention.cohort_size
        ? Math.round((retention.returned / retention.cohort_size) * 100)
        : null
    const maxRole = Math.max(1, ...stats.roles.map(r => r.count))

    return (
        <div className="admin-page">
            <h1>Statistiques</h1>
            {stats.tracking_since ? (
                <p style={{ fontSize: 14 }}>
                    Suivi de l'activité depuis le {new Date(stats.tracking_since).toLocaleDateString('fr-FR')}
                    {' '}(les comptes admin ne sont pas comptés).
                </p>
            ) : (
                <p style={{ fontSize: 14 }}>
                    Le suivi de l'activité vient de démarrer : les chiffres « actifs » se rempliront au fil des jours.
                </p>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginBottom: 16 }}>
                <Kpi label="Actifs aujourd'hui" value={kpis.active_today} />
                <Kpi label="Actifs sur 7 jours" value={kpis.active_7d} />
                <Kpi label="Actifs sur 30 jours" value={kpis.active_30d} />
                <Kpi label="Inscrits" value={kpis.users_total} hint={`+${kpis.new_users_7d} cette semaine`} />
                <Kpi
                    label="Taux de retour"
                    value={retentionRate === null ? '—' : `${retentionRate} %`}
                    hint={retention.cohort_size
                        ? `${retention.returned} / ${retention.cohort_size} inscrits de la semaine dernière revenus cette semaine`
                        : 'Pas encore assez de données'}
                />
            </div>

            <Section title="Utilisateurs actifs par jour (30 jours)">
                <DailyBars data={daily} field="active" />
            </Section>

            <Section title={`Nouveaux inscrits par jour (${totals.signups} sur 30 jours)`}>
                <DailyBars data={daily} field="signups" color="#22A05A" />
            </Section>

            <Section title="Contenu sur 30 jours">
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 12 }}>
                    <Kpi label="Posts" value={totals.posts} />
                    <Kpi label="Likes" value={totals.likes} />
                    <Kpi label="Commentaires" value={totals.comments} />
                    <Kpi label="Messages privés" value={totals.messages} />
                </div>
            </Section>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16 }}>
                <Section title="Top posts de la semaine">
                    {stats.top_posts.length === 0 ? <p>Aucun post cette semaine.</p> : (
                        <ol style={{ margin: 0, paddingLeft: 20 }}>
                            {stats.top_posts.map(p => (
                                <li key={p.id} style={{ marginBottom: 8 }}>
                                    <strong style={{ color: 'var(--text-h)' }}>{p.author}</strong>
                                    {p.match && <span style={{ fontSize: 13 }}> · {p.match}</span>}
                                    <div style={{ fontSize: 13 }}>
                                        ❤️ {p.likes} · 💬 {p.comments}{p.caption && ` · « ${p.caption} »`}
                                    </div>
                                </li>
                            ))}
                        </ol>
                    )}
                </Section>

                <Section title="Équipes les plus postées (30 jours)">
                    {stats.top_teams.length === 0 ? <p>Aucun post lié à un match.</p> : (
                        <ol style={{ margin: 0, paddingLeft: 20 }}>
                            {stats.top_teams.map(t => (
                                <li key={t.team} style={{ marginBottom: 6 }}>
                                    {t.team} — <strong>{t.posts}</strong> post{t.posts > 1 ? 's' : ''}
                                </li>
                            ))}
                        </ol>
                    )}
                </Section>

                <Section title="Répartition par rôle">
                    {stats.roles.map(r => (
                        <div key={r.role} style={{ marginBottom: 8 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
                                <span>{r.role}</span><strong>{r.count}</strong>
                            </div>
                            <div style={{ background: 'var(--border)', borderRadius: 4, height: 8 }}>
                                <div style={{ width: `${(r.count / maxRole) * 100}%`, background: RED, height: 8, borderRadius: 4 }} />
                            </div>
                        </div>
                    ))}
                </Section>
            </div>
        </div>
    )
}
