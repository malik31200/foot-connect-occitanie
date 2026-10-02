import { useEffect, useState } from 'react'
import client from '../api/client'

export default function Dashboard() {
    const [status, setStatus] = useState(null)
    const [logs, setLogs] = useState([])
    const [syncing, setSyncing] = useState(false)

    useEffect(() => {
        fetchStatus()
        fetchLogs()
    }, [])

    const fetchStatus = async () => {
        try {
            const res = await client.get('/scraper/status')
            setStatus(res.data)
        } catch {
            setStatus(null)
        }
    }

    const fetchLogs = async () => {
        try {
            const res = await client.get('/scraper/logs')
            setLogs(res.data)
        } catch {
            setLogs([])
        }
    }

    const handleSync = async () => {
        setSyncing(true)
        await client.post('/scraper/sync')
        setTimeout(() => {
            fetchStatus()
            fetchLogs()
            setSyncing(false)
        }, 5000)
    }

    return (
        <div className="admin-page">
            <h1>Dashboard - Supervision scraper FFF</h1>

            <div style={ {marginBottom: 24} }>
                <h2>Dernière synchronisation</h2>
                {status ? (
                    <div>
                        <p>Statut : <strong>{status.status}</strong></p>
                        <p>Démarré : {new Date(status.last_sync).toLocaleString('fr-FR')}</p>
                        <p>Terminé : {status.finished_at ? new Date(status.finished_at).toLocaleString('fr-FR') : '—'}</p>
                        <p>Matchs synchronisés : <strong>{status.matches_synced}</strong></p>
                        <p>Erreurs : <strong>{status.errors_count}</strong></p>
                    </div>
                ) : (
                    <p>Aucune synchronisation effectuée.</p>
                )}
            </div>

            <button onClick={handleSync} disabled={syncing}>
                {syncing ? 'Synchronisation en cours...' : 'Forcer une synchronisation'}
            </button>

            <div style={{ marginTop: 32 }}>
                <h2>Historique (30 derniers synchros)</h2>
                <div className="table-scroll">
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>Statut</th>
                            <th>Matchs</th>
                            <th>Erreurs</th>
                        </tr>
                    </thead>
                    <tbody>
                        {logs.map((log) => (
                            <tr key={log.id}>
                                <td>{new Date(log.started_at).toLocaleString('fr-FR')}</td>
                                <td>{log.status}</td>
                                <td>{log.matches_synced}</td>
                                <td>{log.errors_count}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                </div>
            </div>
        </div>
    )
}
