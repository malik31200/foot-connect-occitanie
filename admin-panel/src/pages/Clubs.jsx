import { useEffect, useState } from "react";
import client from '../api/client'

export default function Clubs() {
    const [clubs, setClubs] = useState([])
    const [form, setForm] = useState({ name: '', city: '', logo_url: '', fff_id: '', stadium: '' })
    const [error, setError] = useState('')
    const [editingId, setEditingId] = useState(null)
    const [editForm, setEditForm] = useState({ name: '', city: '', logo_url: '', fff_id: '', stadium: '' })

    useEffect(() => { fetchClubs() }, [])

    const fetchClubs = async () => {
        const res = await client.get('/clubs/')
        setClubs(res.data)
    }

    const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })
    const handleEditChange = (e) => setEditForm({ ...editForm, [e.target.name]: e.target.value })

    const handleCreate = async (e) => {
        e.preventDefault()
        setError('')
        try {
            await client.post('/clubs/', form)
            setForm({ name: '', city: '', logo_url: '', fff_id: '', stadium: '' })
            fetchClubs()
        } catch {
            setError('Erreur lors de la création du club.')
        }
    }

    const handleEditStart = (club) => {
        setEditingId(club.id)
        setEditForm({ name: club.name, city: club.city || '', logo_url: club.logo_url || '', fff_id: club.fff_id || '', stadium: club.stadium || '' })
    }

    const handleEditSave = async (id) => {
        try {
            await client.patch(`/clubs/${id}/`, editForm)
            setEditingId(null)
            fetchClubs()
        } catch {
            alert('Erreur lors de la modification du club.')
        }
    }

    const handleDelete = async (id) => {
        if (!window.confirm('Supprimer ce club ?')) return
        await client.delete(`/clubs/${id}/`)
        fetchClubs()
    }

    return (
        <div className="admin-page">
            <h1>Clubs</h1>

            <h2>Ajouter un club</h2>
            <form onSubmit={handleCreate} style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 8 }}>
                <input name="name" placeholder="Nom du club" value={form.name} onChange={handleChange} required />
                <input name="city" placeholder="Ville" value={form.city} onChange={handleChange} />
                <input name="stadium" placeholder="Adresse du stade" value={form.stadium} onChange={handleChange} style={{ width: 250 }} />
                <input name="logo_url" placeholder="URL Logo" value={form.logo_url} onChange={handleChange} style={{ width: 200 }} />
                <input name="fff_id" placeholder="ID FFF (optionnel)" value={form.fff_id} onChange={handleChange} style={{ width: 120 }} />
                <button type="submit">Créer</button>
            </form>
            {error && <p style={{ color: 'red' }}>{error}</p>}

            <h2>Liste des clubs ({clubs.length})</h2>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                    <tr>
                        <th>Nom</th>
                        <th>Ville</th>
                        <th style={{ minWidth: 220 }}>Adresse du stade</th>
                        <th>ID FFF</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {clubs.map((club) => (
                        <tr key={club.id}>
                            {editingId === club.id ? (
                                <>
                                    <td><input name="name" value={editForm.name} onChange={handleEditChange} style={{ width: '100%' }} /></td>
                                    <td><input name="city" value={editForm.city} onChange={handleEditChange} style={{ width: '100%' }} /></td>
                                    <td>
                                        <input name="stadium" value={editForm.stadium} onChange={handleEditChange} placeholder="Ex: 12 rue du Stade, Toulouse" style={{ width: '100%' }} />
                                    </td>
                                    <td>
                                        <input name="fff_id" value={editForm.fff_id} onChange={handleEditChange} placeholder="ID FFF" style={{ width: 120, display: 'block' }} />
                                        <input name="logo_url" value={editForm.logo_url} onChange={handleEditChange} placeholder="URL Logo" style={{ width: 120, marginTop: 4, display: 'block' }} />
                                    </td>
                                    <td style={{ display: 'flex', gap: 4 }}>
                                        <button onClick={() => handleEditSave(club.id)} style={{ color: 'green' }}>✓ Sauver</button>
                                        <button onClick={() => setEditingId(null)}>✗ Annuler</button>
                                    </td>
                                </>
                            ) : (
                                <>
                                    <td>{club.name}</td>
                                    <td>{club.city || '—'}</td>
                                    <td style={{ color: club.stadium ? '#1A1614' : '#aaa', fontSize: 13 }}>
                                        {club.stadium || 'Non renseigné'}
                                    </td>
                                    <td>{club.fff_id || '—'}</td>
                                    <td style={{ display: 'flex', gap: 4 }}>
                                        <button onClick={() => handleEditStart(club)}>Modifier</button>
                                        <button onClick={() => handleDelete(club.id)} style={{ color: 'red' }}>Supprimer</button>
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
