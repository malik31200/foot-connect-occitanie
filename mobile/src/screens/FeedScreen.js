import React, { useCallback, useState } from 'react'
import { useFocusEffect } from '@react-navigation/native'
import {
    View, Text, FlatList, Image, TouchableOpacity,
    StyleSheet, ActivityIndicator, Dimensions
} from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { Ionicons } from '@expo/vector-icons'
import OccitanCross from '../components/OccitanCross'
import client from '../api/client'
import { useAuth } from '../context/AuthContext'

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get('window')

const TAB_BAR_HEIGHT = 80
const CARD_HEIGHT = SCREEN_HEIGHT - TAB_BAR_HEIGHT


function PostCard({ post, token, onLike, navigation, itemHeight }) {
    const firstMedia = post.medias?.[0]

    return (
        <View style={[styles.card, { height: itemHeight }]}>
            {firstMedia?.media_type === 'photo' ? (
                <Image
                    source={{ uri: firstMedia.media_url }}
                    style={styles.media}
                    resizeMode="cover"
                />
            ) : (
                <View style={styles.mediaPlaceholder} />
            )}

            <LinearGradient
                colors={['rgba(14,11,10,0.55)', 'transparent', 'rgba(14,11,10,0.85)']}
                locations={[0, 0.25, 1]}
                style={styles.overlay}
            />

            <View style={styles.header}>
                <OccitanCross size={28} color="#F5C518" />
                <Text style={styles.logoText}>FOOT CONNECT</Text>
            </View>

            <View style={styles.actions}>
                <TouchableOpacity style={styles.actionBtn} onPress={() => onLike(post.id)}>
                    <View style={styles.actionCircle}>
                        <Ionicons name="heart" size={24} color="#fff" />
                    </View>
                    <Text style={styles.actionCount}>{post.likes_count}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionBtn}>
                    <View style={styles.actionCircle}>
                        <Ionicons name="chatbubble-ellipses" size={22} color="#fff" />
                    </View>
                </TouchableOpacity>
            </View>

            <View style={styles.info}>
                <TouchableOpacity onPress={() => navigation.navigate('Profile', {
                    userId: post.author_id,
                    username: post.author_username
                })}>
                    <View style={styles.authorRow}>
                        <View style={styles.avatar}>
                            <Text style={styles.avatarText}>
                                {post.author_username?.[0]?.toUpperCase()}
                            </Text>
                        </View>
                        <Text style={styles.author}>{post.author_username}</Text>
                    </View>
                </TouchableOpacity>
                {post.caption ? (
                    <Text style={styles.caption}>{post.caption}</Text>
                ) : null}
                {post.match_info && (
                    <View style={styles.matchPill}>
                        <Text style={styles.matchPillText}>
                            {post.match_info.home_team} · {post.match_info.away_team}
                        </Text>
                    </View>
                )}
            </View>
        </View>
    )
}

export default function FeedScreen({ navigation }) {
    const { token } = useAuth()
    const [posts, setPosts] = useState([])
    const [loading, setLoading] = useState(true)
    const headers = { Authorization: `Bearer ${token}` }
    const [itemHeight, setItemHeight] = useState(SCREEN_HEIGHT - TAB_BAR_HEIGHT)


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
                prev.map(p => p.id === postId ? { ...p, likes_count: res.data.likes_count } : p)
            )
        } catch {}
    }

    if (loading) return (
        <View style={styles.loading}>
            <ActivityIndicator color="#E4002B" size="large" />
        </View>
    )

    if (posts.length === 0) return (
        <View style={styles.empty}>
            <Text style={styles.emptyText}>Aucune publication pour l'instant.</Text>
        </View>
    )

    return (
        <FlatList
            data={posts}
            keyExtractor={item => item.id.toString()}
            renderItem={({ item }) => (
                <PostCard post={item} token={token} onLike={handleLike} navigation={navigation} itemHeight={itemHeight} />
            )}
            onLayout={(e) => setItemHeight(e.nativeEvent.layout.height)}
            snapToInterval={itemHeight}
            decelerationRate="fast"
            showsVerticalScrollIndicator={false}
        />

    )
}

const styles = StyleSheet.create({
    loading: {
        flex: 1,
        backgroundColor: '#0E0B0A',
        justifyContent: 'center',
        alignItems: 'center',
    },
    empty: {
        flex: 1,
        backgroundColor: '#0E0B0A',
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyText: {
        color: '#fff',
        fontFamily: 'PlusJakartaSans_400Regular',
        fontSize: 16,
    },
    card: {
        width: SCREEN_WIDTH,
        height: CARD_HEIGHT,
        backgroundColor: '#0E0B0A',
    },
    media: {
        ...StyleSheet.absoluteFillObject,
    },
    mediaPlaceholder: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: '#1A1614',
    },
    overlay: {
        ...StyleSheet.absoluteFillObject,
    },
    header: {
        position: 'absolute',
        top: 52,
        left: 0,
        right: 0,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    logoText: {
        fontFamily: 'Anton_400Regular',
        fontSize: 15,
        color: '#fff',
    },
    actions: {
        position: 'absolute',
        right: 16,
        bottom: 120,
        alignItems: 'center',
        gap: 22,
    },
    actionBtn: {
        alignItems: 'center',
        gap: 4,
    },
    actionCircle: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    actionCount: {
        color: '#fff',
        fontFamily: 'PlusJakartaSans_700Bold',
        fontSize: 13,
    },
    info: {
        position: 'absolute',
        bottom: 90,
        left: 16,
        right: 80,
    },
    authorRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 6,
    },
    avatar: {
        width: 38,
        height: 38,
        borderRadius: 19,
        backgroundColor: '#F5C518',
        borderWidth: 2,
        borderColor: '#F5C518',
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarText: {
        fontFamily: 'PlusJakartaSans_800ExtraBold',
        fontSize: 16,
        color: '#1A1614',
    },
    author: {
        fontFamily: 'PlusJakartaSans_700Bold',
        fontSize: 15,
        color: '#fff',
    },
    caption: {
        fontFamily: 'PlusJakartaSans_400Regular',
        fontSize: 14,
        color: '#fff',
        marginBottom: 8,
    },
    matchPill: {
        backgroundColor: 'rgba(228,0,43,0.85)',
        borderRadius: 999,
        paddingHorizontal: 12,
        paddingVertical: 4,
        alignSelf: 'flex-start',
    },
    matchPillText: {
        fontFamily: 'PlusJakartaSans_700Bold',
        fontSize: 12,
        color: '#fff',
    },
})
