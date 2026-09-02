import React, { useEffect, useState } from 'react'
import client from '../api/client'

const TAB = { REPORTS: 'reports', POSTS: 'posts', USERS: 'users' }

export default function Moderation() {
    const [tab, setTab] = useState(TAB.REPORTS)

    // ── Signalements ──────────────────────────────────────────
    const [postReports, setPostReports] = useState([])
    const [commentReports, setCommentReports] = useState([])

    // ── Posts ──────────────────────────────────────────────────
    const [posts, setPosts] = useState([])
    const [expandedPostId, setExpandedPostId] = useState(null)
    const [comments, setComments] = useState({})

    // ── Utilisateurs ──────────────────────────────────────────
    const [users, setUsers] = useState([])
    const [userSearch, setUserSearch] = useState('')

    useEffect(() => {
        fetchReports()
        fetchPosts()
        fetchUsers()
    }, [])

    // ── Fetch ──────────────────────────────────────────────────
    const fetchReports = async () => {
        try {
            const res = await client.get('/reports/')
            setPostReports(res.data.post_reports || [])
            setCommentReports(res.data.comment_reports || [])
        } catch {}
    }

    const fetchPosts = async () => {
        const res = await client.get('/posts/')
        setPosts(res.data)
    }

    const fetchUsers = async () => {
        try {
            const res = await client.get('/auth/admin/users/')
            setUsers(res.data)
        } catch {}
    }

    // ── Actions signalements ───────────────────────────────────
    const dismissReport = async (type, id) => {
        await client.delete(`/reports/?type=${type}&id=${id}`)
        fetchReports()
    }

    const deleteReportedPost = async (postId, reportId) => {
        if (!window.confirm('Supprimer ce post ?')) return
        await client.delete(`/posts/${postId}/`)
        await client.delete(`/reports/?type=post&id=${reportId}`)
        fetchReports()
        fetchPosts()
    }

    const deleteReportedComment = async (commentId, postId, reportId) => {
        if (!window.confirm('Supprimer ce commentaire ?')) return
        await client.delete(`/posts/${postId}/comments/${commentId}/`)
        await client.delete(`/reports/?type=comment&id=${reportId}`)
        fetchReports()
    }

    // ── Actions posts ──────────────────────────────────────────
    const deletePost = async (id) => {
        if (!window.confirm('Supprimer ce post ?')) return
        await client.delete(`/posts/${id}/`)
        setPosts(prev => prev.filter(p => p.id !== id))
    }

    const toggleComments = async (postId) => {
        if (expandedPostId === postId) { setExpandedPostId(null); return }
        const res = await client.get(`/posts/${postId}/comments/`)
        setComments(prev => ({ ...prev, [postId]: res.data.results || res.data }))
        setExpandedPostId(postId)
    }

    const deleteComment = async (commentId, postId) => {
        if (!window.confirm('Supprimer ce commentaire ?')) return
        await client.delete(`/posts/${postId}/comments/${commentId}/`)
        setComments(prev => ({ ...prev, [postId]: prev[postId].filter(c => c.id !== commentId) }))
    }

    // ── Actions utilisateurs ───────────────────────────────────
    const banUser = async (userId, isActive) => {
        const action = isActive ? 'ban' : 'unban'
        const label = isActive ? 'Bannir' : 'Réactiver'
        if (!window.confirm(`${label} cet utilisateur ?`)) return
        await client.patch(`/auth/admin/users/${userId}/`, { action })
        fetchUsers()
    }

    const deleteUser = async (userId, username) => {
        if (!window.confirm(`Supprimer définitivement l'utilisateur "${username}" et tout son contenu ?`)) return
        await client.delete(`/auth/admin/users/${userId}/`)
        fetchUsers()
    }

    const filteredUsers = users.filter(u =>
        u.username.toLowerCase().includes(userSearch.toLowerCase()) ||
        u.email.toLowerCase().includes(userSearch.toLowerCase())
    )

    // ── Styles ────────────────────────────────────────────────
    const tabBtn = (t) => ({
        padding: '8px 20px', cursor: 'pointer', fontWeight: 'bold',
        borderBottom: tab === t ? '3px solid #E4002B' : '3px solid transparent',
        background: 'none', border: 'none',
        borderBottomStyle: 'solid',
        color: tab === t ? '#E4002B' : '#555',
        fontSize: 15,
    })

    const badge = (n) => n > 0 ? (
        <span style={{ background: '#E4002B', color: '#fff', borderRadius: 10, padding: '1px 7px', fontSize: 12, marginLeft: 6 }}>{n}</span>
    ) : null

    return (
        <div style={{ padding: 24 }}>
            <h1>Modération</h1>

            {/* ── Onglets ── */}
            <div style={{ display: 'flex', gap: 4, borderBottom: '1px solid #ddd', marginBottom: 24 }}>
                <button style={tabBtn(TAB.REPORTS)} onClick={() => setTab(TAB.REPORTS)}>
                    🚨 Signalements {badge(postReports.length + commentReports.length)}
                </button>
                <button style={tabBtn(TAB.POSTS)} onClick={() => setTab(TAB.POSTS)}>
                    📝 Posts ({posts.length})
                </button>
                <button style={tabBtn(TAB.USERS)} onClick={() => setTab(TAB.USERS)}>
                    👥 Utilisateurs ({users.length})
                </button>
            </div>

            {/* ══════════════════════════════════════════════════
                ONGLET SIGNALEMENTS
            ══════════════════════════════════════════════════ */}
            {tab === TAB.REPORTS && (
                <div>
                    {postReports.length === 0 && commentReports.length === 0 && (
                        <p style={{ color: '#aaa', textAlign: 'center', padding: 40 }}>✅ Aucun signalement en attente</p>
                    )}

                    {postReports.length > 0 && (
                        <>
                            <h2>Posts signalés ({postReports.length})</h2>
                            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 24 }}>
                                <thead>
                                    <tr style={{ background: '#f9f9f9' }}>
                                        <th style={th}>Auteur du post</th>
                                        <th style={th}>Caption</th>
                                        <th style={th}>Signalé par</th>
                                        <th style={th}>Raison</th>
                                        <th style={th}>Date</th>
                                        <th style={th}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {postReports.map(r => (
                                        <tr key={r.id} style={{ borderBottom: '1px solid #eee' }}>
                                            <td style={td}><strong>{r.post_author}</strong></td>
                                            <td style={td}>{r.post_caption || '—'}</td>
                                            <td style={td}>{r.reporter}</td>
                                            <td style={td}><span style={reasonBadge(r.reason)}>{r.reason}</span></td>
                                            <td style={td}>{new Date(r.created_at).toLocaleDateString('fr-FR')}</td>
                                            <td style={td}>
                                                <div style={{ display: 'flex', gap: 6 }}>
                                                    <button onClick={() => deleteReportedPost(r.post_id, r.id)} style={btnDanger}>🗑 Supprimer post</button>
                                                    <button onClick={() => dismissReport('post', r.id)} style={btnSecondary}>✓ Ignorer</button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </>
                    )}

                    {commentReports.length > 0 && (
                        <>
                            <h2>Commentaires signalés ({commentReports.length})</h2>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr style={{ background: '#f9f9f9' }}>
                                        <th style={th}>Auteur</th>
                                        <th style={th}>Commentaire</th>
                                        <th style={th}>Signalé par</th>
                                        <th style={th}>Raison</th>
                                        <th style={th}>Date</th>
                                        <th style={th}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {commentReports.map(r => (
                                        <tr key={r.id} style={{ borderBottom: '1px solid #eee' }}>
                                            <td style={td}><strong>{r.comment_author}</strong></td>
                                            <td style={td}>{r.comment_content}</td>
                                            <td style={td}>{r.reporter}</td>
                                            <td style={td}><span style={reasonBadge(r.reason)}>{r.reason}</span></td>
                                            <td style={td}>{new Date(r.created_at).toLocaleDateString('fr-FR')}</td>
                                            <td style={td}>
                                                <div style={{ display: 'flex', gap: 6 }}>
                                                    <button onClick={() => deleteReportedComment(r.comment_id, r.post_id, r.id)} style={btnDanger}>🗑 Supprimer</button>
                                                    <button onClick={() => dismissReport('comment', r.id)} style={btnSecondary}>✓ Ignorer</button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </>
                    )}
                </div>
            )}

            {/* ══════════════════════════════════════════════════
                ONGLET POSTS
            ══════════════════════════════════════════════════ */}
            {tab === TAB.POSTS && (
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ background: '#f9f9f9' }}>
                            <th style={th}>Auteur</th>
                            <th style={th}>Caption</th>
                            <th style={th}>Date</th>
                            <th style={th}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {posts.map(post => (
                            <React.Fragment key={post.id}>
                                <tr style={{ borderBottom: '1px solid #eee' }}>
                                    <td style={td}>{post.author_username}</td>
                                    <td style={td}>{post.caption || '—'}</td>
                                    <td style={td}>{new Date(post.created_at).toLocaleDateString('fr-FR')}</td>
                                    <td style={td}>
                                        <div style={{ display: 'flex', gap: 6 }}>
                                            <button onClick={() => toggleComments(post.id)} style={btnSecondary}>
                                                💬 {expandedPostId === post.id ? 'Masquer' : `Commentaires (${post.comments_count})`}
                                            </button>
                                            <button onClick={() => deletePost(post.id)} style={btnDanger}>🗑 Supprimer</button>
                                        </div>
                                    </td>
                                </tr>
                                {expandedPostId === post.id && (comments[post.id] || []).map(c => (
                                    <tr key={c.id} style={{ background: '#fafafa', borderBottom: '1px solid #f0f0f0' }}>
                                        <td style={{ ...td, paddingLeft: 32, color: '#555' }}>↳ {c.author_username}</td>
                                        <td style={td} colSpan={2}>{c.content}</td>
                                        <td style={td}>
                                            <button onClick={() => deleteComment(c.id, post.id)} style={btnDanger}>🗑 Supprimer</button>
                                        </td>
                                    </tr>
                                ))}
                            </React.Fragment>
                        ))}
                    </tbody>
                </table>
            )}

            {/* ══════════════════════════════════════════════════
                ONGLET UTILISATEURS
            ══════════════════════════════════════════════════ */}
            {tab === TAB.USERS && (
                <div>
                    <input
                        placeholder="Rechercher un utilisateur..."
                        value={userSearch}
                        onChange={e => setUserSearch(e.target.value)}
                        style={{ padding: '8px 14px', width: 280, borderRadius: 8, border: '1px solid #ddd', marginBottom: 16 }}
                    />
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ background: '#f9f9f9' }}>
                                <th style={th}>Utilisateur</th>
                                <th style={th}>Email</th>
                                <th style={th}>Rôle</th>
                                <th style={th}>Statut</th>
                                <th style={th}>Inscrit le</th>
                                <th style={th}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredUsers.map(u => (
                                <tr key={u.id} style={{ borderBottom: '1px solid #eee', opacity: u.is_active ? 1 : 0.5 }}>
                                    <td style={td}><strong>{u.username}</strong></td>
                                    <td style={td}>{u.email}</td>
                                    <td style={td}>{u.role}</td>
                                    <td style={td}>
                                        <span style={{ color: u.is_active ? '#22A05A' : '#E4002B', fontWeight: 'bold' }}>
                                            {u.is_active ? '✅ Actif' : '🚫 Banni'}
                                        </span>
                                    </td>
                                    <td style={td}>{new Date(u.date_joined).toLocaleDateString('fr-FR')}</td>
                                    <td style={td}>
                                        <div style={{ display: 'flex', gap: 6 }}>
                                            <button
                                                onClick={() => banUser(u.id, u.is_active)}
                                                style={u.is_active ? btnWarning : btnSuccess}
                                            >
                                                {u.is_active ? '🚫 Bannir' : '✅ Réactiver'}
                                            </button>
                                            <button onClick={() => deleteUser(u.id, u.username)} style={btnDanger}>
                                                🗑 Supprimer
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    )
}

// ── Styles partagés ────────────────────────────────────────────
const th = { padding: '10px 12px', textAlign: 'left', fontWeight: 'bold', fontSize: 13 }
const td = { padding: '10px 12px', fontSize: 13 }
const btnDanger = { background: '#E4002B', color: '#fff', border: 'none', padding: '5px 10px', borderRadius: 6, cursor: 'pointer', fontSize: 12 }
const btnSecondary = { background: '#f0f0f0', color: '#333', border: 'none', padding: '5px 10px', borderRadius: 6, cursor: 'pointer', fontSize: 12 }
const btnWarning = { background: '#f59e0b', color: '#fff', border: 'none', padding: '5px 10px', borderRadius: 6, cursor: 'pointer', fontSize: 12 }
const btnSuccess = { background: '#22A05A', color: '#fff', border: 'none', padding: '5px 10px', borderRadius: 6, cursor: 'pointer', fontSize: 12 }

const reasonBadge = (reason) => ({
    background: reason === 'spam' ? '#f59e0b' : '#E4002B',
    color: '#fff', borderRadius: 8, padding: '2px 8px', fontSize: 11,
})
