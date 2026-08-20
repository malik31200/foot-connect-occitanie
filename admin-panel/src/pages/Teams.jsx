import { useEffect, useState } from 'react'
import client from '../api/client'

export default function Teams() {
    const [teams, setTeams] = useState([])
    const [clubs, setClubs] = useState([])
    const [selectedClub, setSelectedClub] = useState('')
    const [form, setForm] = useState({ club_id: '', name: '', category: '', group_name: '', season: '2026/2027', fff_id: '' })
    const [error, setError] = useState('')
    const [editingId, setEditingId] = useState(null)
    const [editForm, setEditForm] = useState({ club_id: '', name: '', category: '', group_name: '', season: '', fff_id: '' })

    useEffect(() => {
        fetchClubs()
        fetchTeams()
    }, [])

    const fetchClubs = async () => {
        const res = await client.get('/clubs/')
        setClubs(res.data)
    }

    const fetchTeams = async (clubId = '') => {
        const url = clubId ? `/teams/?club_id=${clubId}` : '/teams/'
        const res = await client.get(url)
        setTeams(res.data)
    }

    const handleClubFilter = (e) => {
        setSelectedClub(e.target.value)
        fetchTeams(e.target.value)
    }

    const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })
    const handleEditChange = (e) => setEditForm({ ...editForm, [e.target.name]: e.target.value })

    const handleCreate = async (e) => {
        e.preventDefault()
        setError('')
        try {
            await client.post('/teams/', form)
            setForm({ club_id: '', name: '', category: '', group_name: '', season: '2026/2027', fff_id: '' })
            fetchTeams(selectedClub)
        } catch {
            setError("Erreur lors de la création de l'équipe.")
        }
    }

    const handleEditStart = (team) => {
        setEditingId(team.id)
        setEditForm({
            club_id: team.club.id,
            name: team.name,
            category: team.category,
            group_name: team.group_name || '',
            season: team.season,
            fff_id: team.fff_id || '',
        })
    }

    const handleEditSave = async (id) => {
        try {
            await client.patch(`/teams/${id}/`, editForm)
            setEditingId(null)
            fetchTeams(selectedClub)
        } catch {
            alert("Erreur lors de la modification de l'équipe.")
        }
    }

    const handleDelete = async (id) => {
        if (!window.confirm('Supprimer cette équipe ?')) return
        await client.delete(`/teams/${id}/`)
        fetchTeams(selectedClub)
    }

    return (
        <div style={{ padding: 24 }}>
            <h1>Équipes</h1>

            <h2>Ajouter une équipe</h2>
            <form onSubmit={handleCreate}>
                <select name="club_id" value={form.club_id} onChange={handleChange} required>
                    <option value="">Choisir un club</option>
                    {clubs.map((club) => (
                        <option key={club.id} value={club.id}>{club.name}</option>
                    ))}
                </select>
                <input name="name" placeholder="Nom équipe" value={form.name} onChange={handleChange} required />
                <input name="category" placeholder="Catégorie" value={form.category} onChange={handleChange} required />
                <input name="group_name" placeholder="Poule" value={form.group_name} onChange={handleChange} />
                <input name="season" placeholder="Saison" value={form.season} onChange={handleChange} required />
                <input name="fff_id" placeholder="ID FFF (optionnel)" value={form.fff_id} onChange={handleChange} />
                <button type="submit">Créer</button>
            </form>
            {error && <p style={{ color: 'red' }}>{error}</p>}

            <h2>Filtrer par club</h2>
            <select value={selectedClub} onChange={handleClubFilter}>
                <option value="">Tous les clubs</option>
                {clubs.map((club) => (
                    <option key={club.id} value={club.id}>{club.name}</option>
                ))}
            </select>

            <h2>Liste des équipes ({teams.length})</h2>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                    <tr>
                        <th>Nom</th>
                        <th>Club</th>
                        <th>Catégorie</th>
                        <th>Poule</th>
                        <th>Saison</th>
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
                                    <td style={{ display: 'flex', gap: 4 }}>
                                        <button onClick={() => handleEditSave(team.id)} style={{ color: 'green' }}>✓ Sauver</button>
                                        <button onClick={() => setEditingId(null)}>✗ Annuler</button>
                                    </td>
                                </>
                            ) : (
                                <>
                                    <td>{team.name}</td>
                                    <td>{team.club.name}</td>
                                    <td>{team.category}</td>
                                    <td>{team.group_name}</td>
                                    <td>{team.season}</td>
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
