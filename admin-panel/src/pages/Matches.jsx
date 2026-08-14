import { useEffect, useState } from "react";
import client from '../api/client'

export default function Matches() {
    const [matches, setMatches] = useState([])
    const [teams, setTeams] = useState([])
    const [filters, setFilters] = useState({ status: '', category: '', season: '2026/2027' })
    const [editingMatch, setEditingMatch] = useState(null)
    const [scoreForm, setScoreForm] = useState({ home_score: '', away_score: '', status: 'finished' })
    const [createForm, setCreateForm] = useState({
        home_team_id: '',
        away_team_id: '',
        category: 'U18',
        season: '2026/2027',
        group_name: 'Poule B',
        matchday: '1',
        date_time: '',
        venue: '',
        status: 'scheduled',
    })
    const [createError, setCreateError] = useState('')
    const [editingId, setEditingId] = useState(null)
    const [editForm, setEditForm] = useState({ date_time: '', venue: '', status: '', group_name: '', matchday: '' })

    useEffect(() => {
        fetchMatches()
        fetchTeams()
    }, [])

    const fetchTeams = async () => {
        const res = await client.get('/teams/')
        setTeams(res.data)
    }

    const fetchMatches = async () => {
        const params = new URLSearchParams()
        if (filters.status) params.append('status', filters.status)
        if (filters.category) params.append('category', filters.category)
        if (filters.season) params.append('season', filters.season)
        const res = await client.get(`/matches/?${params.toString()}`)
        setMatches(res.data)
    }

    const handleFilterChange = (e) => {
        setFilters({ ...filters, [e.target.name]: e.target.value })
    }

    const handleFilterSubmit = (e) => {
        e.preventDefault()
        fetchMatches()
    }

    const handleCreateChange = (e) => {
        setCreateForm({ ...createForm, [e.target.name]: e.target.value })
    }

    const handleCreateSubmit = async (e) => {
        e.preventDefault()
        setCreateError('')
        try {
            await client.post('/matches/', {
                ...createForm,
                matchday: parseInt(createForm.matchday),
            })
            setCreateForm({
                home_team_id: '',
                away_team_id: '',
                category: 'U18',
                season: '2026/2027',
                group_name: 'Poule B',
                matchday: '1',
                date_time: '',
                venue: '',
                status: 'scheduled',
            })
            fetchMatches()
        } catch (e) {
            setCreateError('Erreur lors de la création du match.')
        }
    }

    const handleEditScore = (match) => {
        setEditingMatch(match.id)
        setScoreForm({
            home_score: match.home_score ?? '',
            away_score: match.away_score ?? '',
            status: 'finished',
        })
    }

    const handleScoreSubmit = async (id) => {
        await client.patch(`/matches/${id}/result/`, scoreForm)
        setEditingMatch(null)
        fetchMatches()
    }

    const handleEditStart = (match) => {
        setEditingId(match.id)
        setEditForm({
            date_time: match.date_time ? match.date_time.slice(0, 16) : '',
            venue: match.venue || '',
            status: match.status || 'scheduled',
            group_name: match.group_name || '',
            matchday: match.matchday || '',
        })
    }

    const handleEditSave = async (id) => {
        try {
            await client.patch(`/matches/${id}/`, {
                ...editForm,
                matchday: parseInt(editForm.matchday),
            })
            setEditingId(null)
            fetchMatches()
        } catch (e) {
            alert('Erreur lors de la modification.')
        }
    }

    const handleUnlock = async (id) => {
        await client.patch(`/matches/${id}/unlock/`)
        fetchMatches()
    }

    const handleDelete = async (id) => {
        if (!window.confirm('Supprimer ce match ?')) return
        await client.delete(`/matches/${id}/`)
        fetchMatches()
    }

    return (
        <div style={{ padding: 24 }}>
            <h1>Matchs</h1>

            {/* --- Formulaire création match --- */}
            <h2>Ajouter un match</h2>
            <form onSubmit={handleCreateSubmit} style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 24 }}>
                <select name="home_team_id" value={createForm.home_team_id} onChange={handleCreateChange} required>
                    <option value="">Équipe domicile</option>
                    {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
                <select name="away_team_id" value={createForm.away_team_id} onChange={handleCreateChange} required>
                    <option value="">Équipe extérieur</option>
                    {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
                <input name="category" placeholder="Catégorie" value={createForm.category} onChange={handleCreateChange} required style={{ width: 60 }} />
                <input name="season" placeholder="Saison" value={createForm.season} onChange={handleCreateChange} required style={{ width: 90 }} />
                <input name="group_name" placeholder="Poule" value={createForm.group_name} onChange={handleCreateChange} style={{ width: 80 }} />
                <input name="matchday" type="number" placeholder="Journée" value={createForm.matchday} onChange={handleCreateChange} style={{ width: 70 }} />
                <input name="date_time" type="datetime-local" value={createForm.date_time} onChange={handleCreateChange} required />
                <input name="venue" placeholder="Lieu (optionnel)" value={createForm.venue} onChange={handleCreateChange} style={{ width: 140 }} />
                <button type="submit">Créer</button>
            </form>
            {createError && <p style={{ color: 'red' }}>{createError}</p>}

            {/* --- Filtres --- */}
            <form onSubmit={handleFilterSubmit} style={{ marginBottom: 24, display: 'flex', gap: 12 }}>
                <select name="status" value={filters.status} onChange={handleFilterChange}>
                    <option value="">Tous status</option>
                    <option value="scheduled">À venir</option>
                    <option value="finished">Terminés</option>
                </select>
                <input name="season" placeholder="Saison" value={filters.season} onChange={handleFilterChange} style={{ width: 90 }} />
                <input name="category" placeholder="Catégorie" value={filters.category} onChange={handleFilterChange} />
                <button type="submit">Filtrer</button>
            </form>

            <p>{matches.length} match(s)</p>

            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                    <tr>
                        <th>J.</th>
                        <th>Date</th>
                        <th>Domicile</th>
                        <th>Score</th>
                        <th>Extérieur</th>
                        <th>Catégorie</th>
                        <th>Poule</th>
                        <th>Lieu</th>
                        <th>Statut</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {matches.map((match) => editingId === match.id ? (
                        <tr key={match.id} style={{ background: '#fffbe6' }}>
                            <td>
                                <input type="number" value={editForm.matchday}
                                    onChange={e => setEditForm({ ...editForm, matchday: e.target.value })}
                                    style={{ width: 50 }} />
                            </td>
                            <td>
                                <input type="datetime-local" value={editForm.date_time}
                                    onChange={e => setEditForm({ ...editForm, date_time: e.target.value })}
                                    style={{ width: 160 }} />
                            </td>
                            <td>{match.home_team.name}</td>
                            <td>
                                {match.home_score !== null ? `${match.home_score} - ${match.away_score}` : '-'}
                            </td>
                            <td>{match.away_team.name}</td>
                            <td>{match.category}</td>
                            <td>
                                <input value={editForm.group_name}
                                    onChange={e => setEditForm({ ...editForm, group_name: e.target.value })}
                                    style={{ width: 80 }} />
                            </td>
                            <td>
                                <input value={editForm.venue}
                                    onChange={e => setEditForm({ ...editForm, venue: e.target.value })}
                                    placeholder="Adresse du stade"
                                    style={{ width: 180 }} />
                            </td>
                            <td>
                                <select value={editForm.status}
                                    onChange={e => setEditForm({ ...editForm, status: e.target.value })}>
                                    <option value="scheduled">À venir</option>
                                    <option value="finished">Terminé</option>
                                    <option value="postponed">Reporté</option>
                                </select>
                            </td>
                            <td style={{ display: 'flex', gap: 4 }}>
                                <button onClick={() => handleEditSave(match.id)} style={{ color: 'green' }}>✓</button>
                                <button onClick={() => setEditingId(null)}>✗</button>
                            </td>
                        </tr>
                    ) : (
                        <tr key={match.id}>
                            <td>{match.matchday}</td>
                            <td>{new Date(match.date_time).toLocaleString('fr-FR')}</td>
                            <td>{match.home_team.name}</td>
                            <td>
                                {editingMatch === match.id ? (
                                    <span>
                                        <input type="number" value={scoreForm.home_score} onChange={(e) => setScoreForm({ ...scoreForm, home_score: e.target.value })} style={{ width: 40 }} />
                                        {' - '}
                                        <input type="number" value={scoreForm.away_score} onChange={(e) => setScoreForm({ ...scoreForm, away_score: e.target.value })} style={{ width: 40 }} />
                                        <button onClick={() => handleScoreSubmit(match.id)}>✓</button>
                                        <button onClick={() => setEditingMatch(null)}>✗</button>
                                    </span>
                                ) : (
                                    <span>
                                        {match.home_score !== null ? `${match.home_score} - ${match.away_score}` : '-'}
                                        {match.is_locked && ' 🔒'}
                                    </span>
                                )}
                            </td>
                            <td>{match.away_team.name}</td>
                            <td>{match.category}</td>
                            <td>{match.group_name}</td>
                            <td>{match.venue || '-'}</td>
                            <td>{match.status}</td>
                            <td style={{ display: 'flex', gap: 4 }}>
                                <button onClick={() => handleEditStart(match)}>Modifier</button>
                                {!match.is_locked && <button onClick={() => handleEditScore(match)}>Score</button>}
                                {match.is_locked && <button onClick={() => handleUnlock(match.id)}>🔓</button>}
                                <button onClick={() => handleDelete(match.id)} style={{ color: 'red' }}>✕</button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    )
}
