import React, { useCallback, useState} from 'react'
import { useFocusEffect } from '@react-navigation/native'
import { 
    View, Text, FlatList, Image, TouchableOpacity,
    StyleSheet, ActivityIndicator
} from 'react-native'
import client from '../api/client'
import { useAuth } from '../context/AuthContext'


function PostCard({ post, token, onLike, navigation }) {
    const firstMedia = post.medias?.[0]

    return (
        <View style={styles.card}>
            <TouchableOpacity onPress={() => navigation.navigate('Profile', {
                userId: post.author_id,
                username: post.author_username
            })}>
                <Text style={styles.author}>{post.author_username}</Text>
            </TouchableOpacity>
            <Text style={styles.match}>
                {post.match_info?.home_team} vs {post.match_info?.away_team}
            </Text>

            {firstMedia?.media_type === 'photo' && (
                <Image source={{ uri: firstMedia.media_url }} style={styles.image} />
            )}

            {post.caption ? <Text style={styles.caption}>{post.caption}</Text> : null}

            <TouchableOpacity
            style={styles.likeRow}
            onPress={() => onLike(post.id)}
            >
                <Text style={styles.likeText}>❤️ {post.likes_count}</Text>
            </TouchableOpacity>
        </View>
    )
}

export default function FeedScreen({ navigation }) {
    const { token } = useAuth()
    const [posts, setPosts] = useState([])
    const [loading, setLoading] = useState(true)

    const headers = { Authorization: `Bearer ${token}` }

    useFocusEffect(
        useCallback(() => {
            setLoading(true)
            client.get('/feed/', { headers })
                .then(res => setPosts(res.data))
                .catch(() => {})
                .finally(() => setLoading(false))
        }, [token])
)


    async function handleLike(postId) {
        try {
            const res = await client.post(`/posts/${postId}/like/`, {}, { headers })
            setPosts(prev =>
                prev.map(p => p.id === postId ? { ...p, likes_count: res.data.likes_count} :p)
            )
        } catch {}
    }

    if (loading) return <ActivityIndicator style={{ flex: 1 }} />

    if (posts.length === 0) {
        return (
            <View style={styles.empty}>
                <Text style={styles.emptyText}>Aucune publication pour l'instant.</Text>
            </View>
        )
    }

    return (
        <FlatList
            data={posts}
            keyExtractor={item => item.id.toString()}
            renderItem={({ item }) => (
                <PostCard post={item} token={token} onLike={handleLike} navigation={navigation} />
            )}
            contentContainerStyle={styles.list}
        />
    )
}

const styles = StyleSheet.create({
    list: {
        padding: 16,
        backgroundColor: '#F6F3EE'
    },
    empty: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F6F3EE'
    },
    emptyText: {
        color: '#5C564F',
        fontSize: 16
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 12,
        marginBottom: 16,
        overflow: 'hidden'
    },
    author: {
        fontWeight: 'bold',
        color: '#1A1614',
        padding:12,
        paddingBottom: 2
    },
    match: {
        color: '#5C564F',
        fontSize: 12,
        paddingHorizontal: 12,
        paddingBottom: 8
    },
    image: {
        width: '100%',
        height: 250
    },
    caption: {
        color: '#1A1614',
        padding: 12,
        paddingBottom: 4
    },
    likeRow: {
        padding: 12,
        paddingTop: 8
    },
    likeText: {
        color: '#E4002B',
        fontWeight: 'bold'
    },
})