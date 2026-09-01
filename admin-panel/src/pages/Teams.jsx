import { useEffect, useState } from 'react'
import client from '../api/client'

export default function Teams() {
    const [teams, setTeams] = useState([])
    const [clubs, setClubs] = useState([])
    const [filters, setFilters] = useState({ club_id: '', category: '', group_name: '', season: '2026/2027' })
    const [form, setForm] = useState({ club_id: '', name: '', category: '', group_name: '', season: '2026/2027', fff_id: '' })
    const [error, setError] = useState('')
    const [editingId, setEditingId] = useState(null)
    const [editForm, setEditForm] = useState({ club_id: '', name: '', category: '', group_name: '', season: '', fff_id: '' })

    // Venue inline
    const [venueTeamId, setVenueTeamId] = useState(null)
    const [venueInput, setVenueInput] = useState('')
    const [fillEmptyOnly, setFillEmptyOnly] = useState(true)

    useEffect(() => { fetchClubs(); fetchTeams() }, [])

    const fetchClubs = async () => {
        const res = await client.get('/clubs/')
        setClubs(res.data)
    }

    const fetchTeams = async (f = filters) => {
        const params = new URLSearchParams()
        if (f.club_id) params.append('club_id', f.club_id)
        if (f.category) params.append('category', f.category)
        if (f.group_name) params.append('group_name', f.group_name)
        if (f.season) params.append('season', f.season)
        const res = await client.get(`/teams/?${params.toString()}`)
        setTeams(res.data)
    }

    const handleFilterChange = (e) => {
        const next = { ...filters, [e.target.name]: e.target.value }
        setFilters(next)
        fetchTeams(next)
    }

    const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })
    const handleEditChange = (e) => setEditForm({ ...editForm, [e.target.name]: e.target.value })

    const handleCreate = async (e) => {
        e.preventDefault()
        setError('')
        try {
            await client.post('/teams/', form)
            setForm({ club_id: '', name: '', category: '', group_name: '', season: '2026/2027', fff_id: '' })
            fetchTeams()
        } catch { setError("Erreur lors de la création de l'équipe.") }
    }

    const handleEditStart = (team) => {
        setEditingId(team.id)
        setEditForm({ club_id: team.club.id, name: team.name, category: team.category, group_name: team.group_name || '', season: team.season, fff_id: team.fff_id || '' })
    }

    const handleEditSave = async (id) => {
        try {
            await client.patch(`/teams/${id}/`, editForm)
            setEditingId(null)
            fetchTeams()
        } catch { alert("Erreur lors de la modification de l'équipe.") }
    }

    const handleDelete = async (id) => {
        if (!window.confirm('Supprimer cette équipe ?')) return
        await client.delete(`/teams/${id}/`)
        fetchTeams()
    }

    const handleVenueSave = async (teamId, teamName) => {
        if (!venueInput.trim()) return
        const msg = fillEmptyOnly
            ? `Remplir les matchs SANS lieu de "${teamName}" avec cette adresse ?`
            : `Écraser TOUS les matchs à domicile de "${teamName}" avec cette adresse ?`
        if (!window.confirm(msg)) return
        try {
            const res = await client.post(`/teams/${teamId}/set_home_venue/`, {
                venue: venueInput,
                fill_empty_only: fillEmptyOnly,
            })
            alert(res.data.message)
            setVenueTeamId(null)
            setVenueInput('')
        } catch { alert('Erreur lors de la mise à jour des lieux.') }
    }

    return (
        <div style={{ padding: 24 }}>
            <h1>Équipes</h1>

            <h2>Ajouter une équipe</h2>
            <form onSubmit={handleCreate} style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 8 }}>
                <select name="club_id" value={form.club_id} onChange={handleChange} required>
                    <option value="">Choisir un club</option>
                    {clubs.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                <input name="name" placeholder="Nom équipe" value={form.name} onChange={handleChange} required />
                <input name="category" placeholder="Catégorie" value={form.category} onChange={handleChange} required style={{ width: 80 }} />
                <input name="group_name" placeholder="Poule" value={form.group_name} onChange={handleChange} style={{ width: 80 }} />
                <input name="season" placeholder="Saison" value={form.season} onChange={handleChange} required style={{ width: 90 }} />
                <input name="fff_id" placeholder="ID FFF (optionnel)" value={form.fff_id} onChange={handleChange} style={{ width: 120 }} />
                <button type="submit">Créer</button>
            </form>
            {error && <p style={{ color: 'red' }}>{error}</p>}

            {/* ── Filtres ── */}
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center', marginBottom: 16, marginTop: 16 }}>
                <select name="season" value={filters.season} onChange={handleFilterChange}>
                    <option value="">Toutes saisons</option>
                    <option value="2026/2027">2026/2027</option>
                    <option value="2025/2026">2025/2026</option>
                    <option value="2024/2025">2024/2025</option>
                </select>
                <select name="category" value={filters.category} onChange={handleFilterChange}>
                    <option value="">Toutes catégories</option>
                    {['U14', 'U16', 'U18', 'Seniors', 'Vétérans', 'Regional 1', 'Regional 2', 'Regional 3'].map(c =>
                        <option key={c} value={c}>{c}</option>
                    )}
                </select>
                <input name="group_name" placeholder="Poule (ex: Poule A)" value={filters.group_name} onChange={handleFilterChange} style={{ width: 140 }} />
                <select name="club_id" value={filters.club_id} onChange={handleFilterChange}>
                    <option value="">Tous les clubs</option>
                    {clubs.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                <button onClick={() => { const reset = { club_id: '', category: '', group_name: '', season: '2026/2027' }; setFilters(reset); fetchTeams(reset) }}>
                    Réinitialiser
                </button>
            </div>

            <p style={{ margin: '8px 0' }}>{teams.length} équipe(s)</p>

            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                    <tr>
                        <th>Nom</th>
                        <th>Club</th>
                        <th>Catégorie</th>
                        <th>Poule</th>
                        <th>Saison</th>
                        <th style={{ minWidth: 260 }}>🏟️ Stade domicile</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {teams.map((team) => (
                        <tr key={team.id}>
                            {editingId === team.id ? (
                                <>
                                    <td><input name="name" value={editForm.name} onChange={handleEditChange} style={{ width: '100%' }} /></td>
                                    <td>
                                        <select name="club_id" value={editForm.club_id} onChange={handleEditChange}>
                                            {clubs.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                        </select>
                                    </td>
                                    <td><input name="category" value={editForm.category} onChange={handleEditChange} style={{ width: 60 }} /></td>
                                    <td><input name="group_name" value={editForm.group_name} onChange={handleEditChange} style={{ width: 80 }} /></td>
                                    <td><input name="season" value={editForm.season} onChange={handleEditChange} style={{ width: 90 }} /></td>
                                    <td>—</td>
                                    <td style={{ display: 'flex', gap: 4 }}>
                                        <button onClick={() => handleEditSave(team.id)} style={{ color: 'green' }}>✓ Sauver</button>
                                        <button onClick={() => setEditingId(null)}>✗</button>
                                    </td>
                                </>
                            ) : (
                                <>
                                    <td>{team.name}</td>
                                    <td>{team.club.name}</td>
                                    <td>{team.category}</td>
                                    <td>{team.group_name || '—'}</td>
                                    <td>{team.season}</td>
                                    <td>
                                        {venueTeamId === team.id ? (
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                                <input
                                                    value={venueInput}
                                                    onChange={e => setVenueInput(e.target.value)}
                                                    placeholder="Ex: 12 rue du Stade, Toulouse"
                                                    style={{ width: '100%' }}
                                                    autoFocus
                                                />
                                                <label style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                                                    <input
                                                        type="checkbox"
                                                        checked={fillEmptyOnly}
                                                        onChange={e => setFillEmptyOnly(e.target.checked)}
                                                    />
                                                    Uniquement les matchs sans lieu
                                                </label>
                                                <div style={{ display: 'flex', gap: 4 }}>
                                                    <button onClick={() => handleVenueSave(team.id, team.name)} style={{ color: 'green', fontSize: 12 }}>✓ Appliquer</button>
                                                    <button onClick={() => setVenueTeamId(null)} style={{ fontSize: 12 }}>✗</button>
                                                </div>
                                            </div>
                                        ) : (
                                            <button
                                                onClick={() => { setVenueTeamId(team.id); setVenueInput(team.home_venue || ''); setFillEmptyOnly(true) }}
                                                style={{ fontSize: 12, padding: '3px 8px', cursor: 'pointer' }}
                                            >
                                                🏟️ {team.home_venue ? 'Modifier le stade' : 'Définir le stade'}
                                            </button>
                                        )}
                                    </td>
                                    <td style={{ display: 'flex', gap: 4 }}>
                                        <button onClick={() => handleEditStart(team)}>Modifier</button>
                                        <button onClick={() => handleDelete(team.id)} style={{ color: 'red' }}>Supprimer</button>
                                    </td>
                                </>
                            )}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    )
}
