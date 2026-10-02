import { useState } from 'react'
import axios from 'axios'
import client from '../api/client'


export default function Login({ onLogin }) {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')
        try {
            const res = await client.post('/auth/login/', {
                email, password })
                localStorage.setItem('access_token', res.data.access)
                localStorage.setItem('refresh_token', res.data.refresh)
                onLogin()
        } catch {
            setError('Email ou mot de passe incorrect.')
        }
    }

    return (
        <div className="admin-login-box" style={{ maxWidth: 400, margin: '100px auto', padding: 24 }}>
            <h1>Admin - Foot Connect Occitanie</h1>
            <form onSubmit={handleSubmit}>
                <div>
                    <label>Email</label>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        style={{ display: 'block', width: '100%', marginBottom: 12 }}
                    />
                </div>
                <div>
                    <label>Mot de passe</label>
                    <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    style={{ display: 'block', width: '100%', marginBottom: 12 }}
                    />
                </div>
                {error && <p style={{ color: 'red', }}>{error}</p>}
                <button type="submit">Se connecter</button>
            </form>
        </div>
    )
}
