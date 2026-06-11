import { useEffect, useState } from "react";
import client from '../api/client'

export default function Matches() {
    const [matches, setMatches] = useState([])
    const [filters, setFilters] = useState({ status: '', category: '', season: '2025' })
    const [editingMatch, setEditingMatch] = useState(null)
    const [scoreForm, setScoreForm] = useState({ home_score: '', away_score:'', status: 'finished' })

    useEffect(() => {
        fetchMatches()
    }, [])

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

    const handleUnlock = async (id) => {
        await client.patch(`/matches/${id}/unlock/`)
        fetchMatches()
    }

    return (
        <div style={{ padding: 24 }}>
            <h1>Matchs</h1>

            <form onSubmit={handleFilterSubmit} style={{ marginBottom: 24, display: 'flex', gap: 12 }}>
                <select name="status" value={filters.status} onChange={handleFilterChange}>
                    <option value="">Tous status</option>
                    <option value="scheduled">À venir</option>
                    <option value="finished">Terminés</option>
                </select>
                <input name="season" placeholder="Saison" value={filters.season} onChange={handleFilterChange} style={{ width: 80 }} />
                <input name="category" placeholder="Categorie" value={filters.category} onChange={handleFilterChange} />
                <button type="submit">Filtrer</button>
            </form>

            <p>{matches.length} match(s)</p>

            <table>
                <thead>
                    <tr>
                        <th>Date</th>
                        <th>Domicile</th>
                        <th>Score</th>
                        <th>Extérieur</th>
                        <th>Catégorie</th>
                        <th>Statut</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {matches.map((match) => (
                        <tr key={match.id}>
                            <td>{new Date(match.date_time).toLocaleString('fr-FR')}</td>
                            <td>{match.home_team.name}</td>
                            <td>
                                {editingMatch === match.id ? (
                                    <span>
                                        <input
                                            type="number"
                                            value={scoreForm.home_score}
                                            onChange={(e) => setScoreForm({ ...scoreForm, home_score: e.target.value })}
                                            style={{ width: 40 }}
                                            />
                                            {' - '}
                                            <input
                                                type="number"
                                                value={scoreForm.away_score}
                                                onChange={(e) => setScoreForm({ ...scoreForm, away_score: e.target.value })}
                                                style={{ width: 40 }}
                                            />
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
                            <td>{match.status}</td>
                            <td>
                                {!match.is_locked && (
                                    <button onClick={() => handleEditScore(match)}>
                                        Saisir le score
                                    </button>
                                )}
                                {match.is_locked && (
                                    <button onClick={() => handleUnlock(match.id)}>
                                        Déverrouiller
                                    </button>
                                )}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    )

}