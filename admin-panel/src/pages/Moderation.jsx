import React from 'react'
import { useEffect, useState } from "react";
import client from '../api/client'

export default function Moderation() {
    const [posts, setPosts] = useState([])
    const [expandedPostId, setExpandedPostId] = useState(null)
    const [comments, setComments] = useState({})

    useEffect(() => {
        // 1. Fetch posts when the component mounts
        client.get('/posts/').then(res => setPosts(res.data))
    }, [])

    async function deletePost(id) {
        // 2. Ask for confirmation before deleting
        if (!window.confirm('Supprimer ce post ?')) return
        // 3. Send DELETE request and update the local state
        await client.delete(`/posts/${id}/`)
        setPosts(prev => prev.filter(p => p.id !== id))
    }

    async function toggleComments(postId) {
        if (expandedPostId === postId) {
            setExpandedPostId(null)
            return
        }

        const res = await client.get(`/posts/${postId}/comments/`)
        setComments(prev => ({ ...prev, [postId]: res.data }))
        setExpandedPostId(postId)
    }

    async function deleteComment(commentId, postId) {
        if (!window.confirm('Supprimer ce commentaire ?')) return
        try {
            await client.delete(`/posts/${postId}/comments/${commentId}/`)
            setComments(prev => ({
                ...prev,
                [postId]: prev[postId].filter(c => c.id !== commentId)
            }))
        } catch {
            alert('Erreur : impossible de supprimer ce commentaire.')
        }
    }

    return (
        <div style={{ padding: 24 }}>
            <h1>Modération - Posts</h1>
            <table border="1" cellPadding="8" style={{ width: '100%', borderCollapse: 'collapse'}}>
                <thead>
                    <tr>
                        <th>Auteur</th>
                        <th>Caption</th>
                        <th>Date</th>
                        <th>Action</th>
                        <th>Commentaires</th>
                    </tr>
                </thead>
                <tbody>
                    {posts.map(post => (
                        <React.Fragment key={post.id}>
                            <tr>
                                <td>{post.author_username}</td>
                                <td>{post.caption || '—'}</td>
                                <td>{new Date(post.created_at).toLocaleDateString('fr-FR')}</td>
                                <td>
                                    <button onClick={() => deletePost(post.id)} style={{ color: 'red' }}>
                                        Supprimer
                                    </button>
                                </td>
                                <td>
                                    <button onClick={() => toggleComments(post.id)}>
                                        {expandedPostId === post.id ? 'Masquer' : `Commentaires (${post.comments_count})`}
                                    </button>
                                </td>
                            </tr>
                            {expandedPostId === post.id && (comments[post.id] || []).map(c => (
                                <tr key={c.id} style={{ background: '#f9f9f9' }}>
                                    <td>{c.author_username}</td>
                                    <td colSpan={2}>{c.content}</td>
                                    <td>
                                        <button onClick={() => deleteComment(c.id, post.id)} style={{ color: 'red' }}>
                                            Supprimer
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </React.Fragment>
                    ))}
                </tbody>
            </table>
        </div>
    )
}