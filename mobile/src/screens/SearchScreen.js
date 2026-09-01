import React, { useState, useRef, useCallback } from 'react'
import {
    View, Text, TextInput, FlatList, TouchableOpacity,
    Image, StyleSheet, ActivityIndicator, SafeAreaView,
    StatusBar,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import client from '../api/client'
import { useAuth } from '../context/AuthContext'

const ROLE_LABELS = {
    joueur: 'Joueur', coach: 'Coach', supporter: 'Supporter',
    club: 'Dirigeant', partenaire: 'Partenaire',
}

const AVATAR_COLORS = ['#E4002B', '#F5C518', '#22A05A', '#3B82F6', '#8B5CF6']
function avatarColor(username) {
    let h = 0
    for (let i = 0; i < (username || '').length; i++) h = username.charCodeAt(i) + ((h << 5) - h)
    return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length]
}

function UserCard({ user, onPress }) {
    return (
        <TouchableOpacity style={styles.userCard} onPress={() => onPress(user)}>
            {user.avatar_url ? (
                <Image source={{ uri: user.avatar_url }} style={styles.userAvatar} />
            ) : (
                <View style={[styles.userAvatar, { backgroundColor: avatarColor(user.username), justifyContent: 'center', alignItems: 'center' }]}>
                    <Text style={styles.avatarInitial}>{user.username?.charAt(0).toUpperCase()}</Text>
                </View>
            )}
            <View style={styles.userInfo}>
                <Text style={styles.userName}>{user.username}</Text>
                <Text style={styles.userRole}>
                    {ROLE_LABELS[user.sport_role] || 'Supporter'}
                    {user.club_name ? ` · ${user.club_name}` : ''}
                </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#A8A29B" />
        </TouchableOpacity>
    )
}

function PostThumb({ post, onPress }) {
    const media = post.medias?.[0]
    const isVideo = media?.media_type === 'video'
    // Miniature vidéo : transformation Cloudinary ou R2 (on affiche juste l'icône play)
    const thumbUri = media?.media_url

    const home = post.match?.home_team?.name || ''
    const away = post.match?.away_team?.name || ''

    return (
        <TouchableOpacity style={styles.postCard} onPress={() => onPress(post)} activeOpacity={0.85}>
            <View style={styles.postThumb}>
                {thumbUri ? (
                    <Image source={{ uri: thumbUri }} style={StyleSheet.absoluteFill} resizeMode="cover" />
                ) : (
                    <View style={[StyleSheet.absoluteFill, { backgroundColor: '#1A1614' }]} />
                )}
                {isVideo && (
                    <View style={styles.playOverlay}>
                        <Ionicons name="play-circle" size={28} color="#fff" />
                    </View>
                )}
            </View>
            <View style={styles.postInfo}>
                <Text style={styles.postAuthor} numberOfLines={1}>@{post.author_username}</Text>
                {(home || away) ? (
                    <Text style={styles.postMatch} numberOfLines={1}>{home} – {away}</Text>
                ) : null}
                <Text style={styles.postCaption} numberOfLines={2}>{post.caption}</Text>
            </View>
        </TouchableOpacity>
    )
}

export default function SearchScreen({ navigation }) {
    const { token } = useAuth()
    const headers = { Authorization: `Bearer ${token}` }

    const [query, setQuery] = useState('')
    const [users, setUsers] = useState([])
    const [posts, setPosts] = useState([])
    const [loading, setLoading] = useState(false)
    const [searched, setSearched] = useState(false)
    const debounceRef = useRef(null)

    const search = useCallback((q) => {
        if (q.trim().length < 2) {
            setUsers([])
            setPosts([])
            setSearched(false)
            return
        }
        setLoading(true)
        client.get(`/search/?q=${encodeURIComponent(q.trim())}`, { headers })
            .then(res => {
                setUsers(res.data.users || [])
                setPosts(res.data.posts || [])
                setSearched(true)
            })
            .catch(() => {})
            .finally(() => setLoading(false))
    }, [token])

    function handleChange(text) {
        setQuery(text)
        clearTimeout(debounceRef.current)
        debounceRef.current = setTimeout(() => search(text), 400)
    }

    function goToProfile(user) {
        navigation.navigate('Profile', { userId: user.id })
    }

    function goToPost(post) {
        navigation.navigate('PostDetail', { post, posts: [post], initialIndex: 0 })
    }

    // Données pour FlatList unifiée
    const sections = []
    if (users.length > 0) {
        sections.push({ type: 'header', key: 'h-users', title: 'Utilisateurs' })
        users.forEach(u => sections.push({ type: 'user', key: `u-${u.id}`, data: u }))
    }
    if (posts.length > 0) {
        sections.push({ type: 'header', key: 'h-posts', title: 'Publications' })
        posts.forEach(p => sections.push({ type: 'post', key: `p-${p.id}`, data: p }))
    }
    if (searched && users.length === 0 && posts.length === 0) {
        sections.push({ type: 'empty', key: 'empty' })
    }

    function renderItem({ item }) {
        if (item.type === 'header') {
            return <Text style={styles.sectionTitle}>{item.title}</Text>
        }
        if (item.type === 'user') {
            return <UserCard user={item.data} onPress={goToProfile} />
        }
        if (item.type === 'post') {
            return <PostThumb post={item.data} onPress={goToPost} />
        }
        if (item.type === 'empty') {
            return (
                <View style={styles.emptyWrap}>
                    <Ionicons name="search-outline" size={48} color="#A8A29B" />
                    <Text style={styles.emptyText}>Aucun résultat pour « {query} »</Text>
                </View>
            )
        }
        return null
    }

    return (
        <SafeAreaView style={styles.safe}>
            <StatusBar barStyle="dark-content" />
            <View style={styles.topBar}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color="#1A1614" />
                </TouchableOpacity>
                <View style={styles.searchBox}>
                    <Ionicons name="search-outline" size={18} color="#A8A29B" style={{ marginRight: 8 }} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Équipe, joueur, club..."
                        placeholderTextColor="#A8A29B"
                        value={query}
                        onChangeText={handleChange}
                        autoFocus
                        returnKeyType="search"
                        autoCapitalize="none"
                        autoCorrect={false}
                    />
                    {query.length > 0 && (
                        <TouchableOpacity onPress={() => { setQuery(''); setUsers([]); setPosts([]); setSearched(false) }}>
                            <Ionicons name="close-circle" size={18} color="#A8A29B" />
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            {loading ? (
                <View style={styles.loadingWrap}>
                    <ActivityIndicator color="#E4002B" size="large" />
                </View>
            ) : (
                <FlatList
                    data={sections}
                    keyExtractor={item => item.key}
                    renderItem={renderItem}
                    contentContainerStyle={styles.list}
                    keyboardShouldPersistTaps="handled"
                    ListHeaderComponent={
                        !searched && query.length < 2 ? (
                            <View style={styles.hintWrap}>
                                <Ionicons name="search-outline" size={52} color="#D9D3CC" />
                                <Text style={styles.hintText}>Recherche un joueur, un club{'\n'}ou une équipe</Text>
                            </View>
                        ) : null
                    }
                />
            )}
        </SafeAreaView>
    )
}

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: '#F6F3EE' },

    topBar: {
        flexDirection: 'row', alignItems: 'center',
        paddingHorizontal: 16, paddingVertical: 10,
        backgroundColor: '#F6F3EE',
        borderBottomWidth: 1, borderBottomColor: '#EDE9E4',
    },
    backBtn: { marginRight: 12 },
    searchBox: {
        flex: 1, flexDirection: 'row', alignItems: 'center',
        backgroundColor: '#fff', borderRadius: 12,
        paddingHorizontal: 14, height: 44,
        borderWidth: 1.5, borderColor: '#EDE9E4',
    },
    searchInput: {
        flex: 1,
        fontFamily: 'PlusJakartaSans_400Regular',
        fontSize: 15, color: '#1A1614',
    },

    loadingWrap: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    list: { padding: 16, gap: 4 },

    hintWrap: { alignItems: 'center', marginTop: 80, gap: 16 },
    hintText: {
        fontFamily: 'PlusJakartaSans_400Regular',
        fontSize: 15, color: '#A8A29B', textAlign: 'center', lineHeight: 22,
    },

    emptyWrap: { alignItems: 'center', marginTop: 60, gap: 12 },
    emptyText: {
        fontFamily: 'PlusJakartaSans_400Regular',
        fontSize: 15, color: '#A8A29B', textAlign: 'center',
    },

    sectionTitle: {
        fontFamily: 'PlusJakartaSans_700Bold',
        fontSize: 13, color: '#5C564F',
        textTransform: 'uppercase', letterSpacing: 0.8,
        marginTop: 16, marginBottom: 8,
    },

    // Carte utilisateur
    userCard: {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: '#fff', borderRadius: 14,
        padding: 14, marginBottom: 8,
    },
    userAvatar: { width: 46, height: 46, borderRadius: 23 },
    avatarInitial: { fontFamily: 'PlusJakartaSans_800ExtraBold', fontSize: 20, color: '#fff' },
    userInfo: { flex: 1, marginLeft: 12 },
    userName: { fontFamily: 'PlusJakartaSans_700Bold', fontSize: 15, color: '#1A1614' },
    userRole: { fontFamily: 'PlusJakartaSans_400Regular', fontSize: 12, color: '#5C564F', marginTop: 2 },

    // Carte post
    postCard: {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: '#fff', borderRadius: 14,
        marginBottom: 8, overflow: 'hidden',
    },
    postThumb: {
        width: 80, height: 80,
        backgroundColor: '#EDE9E4',
    },
    playOverlay: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center', alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.3)',
    },
    postInfo: { flex: 1, padding: 12, gap: 3 },
    postAuthor: { fontFamily: 'PlusJakartaSans_700Bold', fontSize: 13, color: '#1A1614' },
    postMatch: { fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 12, color: '#E4002B' },
    postCaption: { fontFamily: 'PlusJakartaSans_400Regular', fontSize: 12, color: '#5C564F' },
})
