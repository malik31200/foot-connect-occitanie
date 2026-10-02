import { useEffect, useState } from "react";
import client from '../api/client'

export default function Standings() {
    const [standings, setStandings] = useState([])
    const [filters, setFilters] = useState({ category: '', season: '2026/2027', group_name: '' })

    useEffect(() => {
        fetchStandings()
    }, [])

    const fetchStandings = async () => {
        const params = new URLSearchParams()
        if(filters.category) params.append('category', filters.category)
        if(filters.season) params.append('season', filters.season)
        if(filters.group_name) params.append('group_name', filters.group_name)
        const res = await client.get(`/standings/?${params.toString()}`)
        setStandings(res.data)
    }

    const handleChange = (e) => {
       setFilters({ ...filters, [e.target.name]: e.target.value })
    }

    const handleSubmit = (e) => {
        e.preventDefault()
        fetchStandings()
    }

    return (
        <div className="admin-page">
            <h1>Classement</h1>

            <form onSubmit={handleSubmit} style={{ marginBottom: 24, display: 'flex', gap: 12 }}>
                <input name="category" placeholder="Catégorie" value={filters.category} onChange={handleChange}/>
                <input name="season" placeholder="Saison" value={filters.season} onChange={handleChange}/>
                <input name="group_name" placeholder="Poule" value={filters.group_name} onChange={handleChange}/>
                <button type="submit">Filter</button>
            </form>

            <p>{standings.length} équipe(s)</p>

            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                    <tr>
                        <th>#</th>
                        <th>Équipe</th>
                        <th>Jo</th>
                        <th>G</th>
                        <th>N</th>
                        <th>P</th>
                        <th>BP</th>
                        <th>BC</th>
                        <th>Diff</th>
                        <th>Pts</th>
                    </tr>
                </thead>
                <tbody>
                    {standings.map((s) => (
                        <tr key={s.id}>
                            <td>{s.rank}</td>
                            <td>{s.team_name}</td>
                            <td>{s.played}</td>
                            <td>{s.won}</td>
                            <td>{s.draw}</td>
                            <td>{s.lost}</td>
                            <td>{s.goals_for}</td>
                            <td>{s.goals_against}</td>
                            <td>{s.goal_diff}</td>
                            <td>{s.points}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    )
}