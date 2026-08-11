import { useEffect, useState } from "react";
import client from '../api/client'

export default function Clubs() {
    const [clubs, setClubs] = useState([])
    const [form, setForm] = useState({ name: '', city: '', logo_url: '', fff_id: '', })
    const [error, setError] = useState('')

    useEffect(() => {
        fetchClubs()
    }, [])

    const fetchClubs = async () => {
        const res = await client.get('/clubs/')
        setClubs(res.data)
    }

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value })
    }

    const handleCreate = async (e) => {
        e.preventDefault()
        setError('')
        try {
            await client.post('/clubs/', form)
            setForm({ name: '', city: '', logo_url: '', fff_id: '', })
            fetchClubs()
        } catch {
            setError('Erreur lors de la création du club.')
        }
    }

    const handleDelete = async (id) => {
        if (!window.confirm('Supprimer ce club ?')) return
        await client.delete(`/clubs/${id}/`)
        fetchClubs()
    }

    return (
        <div style={{ padding: 24 }}>
            <h1>Clubs</h1>

            <h2>Ajouter un club</h2>
            <form onSubmit={handleCreate}>
                <input name="name" placeholder="Nom du club" value={form.name} onChange={handleChange} required />
                <input name="city" placeholder="Ville" value={form.city} onChange={handleChange} />
                <input name="logo_url" placeholder="URL Logo" value={form.logo_url} onChange={handleChange} />
                <input name="fff_id" placeholder="ID FFF (optionnel)" value={form.fff_id} onChange={handleChange} />
                <button type="submit">Créer</button>
            </form>
            {error && <p style={{ color: 'red' }}>{error}</p>}

            <h2>Liste des clubs ({clubs.length})</h2>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                    <tr>
                        <th>Nom</th>
                        <th>Ville</th>
                        <th>ID FFF</th>
                        <th>Action</th>
                    </tr>
                </thead>
                <tbody>
                    {clubs.map((club) => (
                        <tr key={club.id}>
                            <td>{club.name}</td>
                            <td>{club.city || '—'}</td>
                            <td>{club.fff_id}</td>
                            <td>
                                <button onClick={() => handleDelete(club.id)}>Supprimer</button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    )
}