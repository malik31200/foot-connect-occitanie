import React, { useCallback, useState } from 'react'
import { useFocusEffect } from '@react-navigation/native'
import {
    View, Text, StyleSheet, ActivityIndicator,
    TouchableOpacity, FlatList, Image, Dimensions, Alert
} from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { Ionicons } from '@expo/vector-icons'
import OccitanCross from '../components/OccitanCross'
import client from '../api/client'
import { useAuth } from '../context/AuthContext'

const SCREEN_WIDTH = Dimensions.get('window').width
const GRID_SIZE = (SCREEN_WIDTH - 6) / 3

function getVideoThumbnail(url) {
    if (!url || !url.includes('cloudinary.com')) return null
    return url
        .replace('/video/upload/', '/video/upload/so_0/')
        .replace(/\.(mp4|mov|avi|webm)$/i, '.jpg')
}

function sportRoleLabel(role) {
    switch (role) {
        case 'joueur': return 'Joueur'
        case 'coach': return 'Coach'
        case 'club': return 'Dirigeant de club'
        case 'partenaire': return 'Partenaire'
        default: return 'Supporter'
    }
}

export default function ProfileScreen({ route, navigation }) {
    const { token, logout } = useAuth()
    const [profile, setProfile] = useState(null)
    const [loading, setLoading] = useState(true)
    const [posts, setPosts] = useState([])
    const [activeTab, setActiveTab] = useState('photos')

    const userId = route?.params?.userId
    const isOwnProfile = !userId
    const headers = { Authorization: `Bearer ${token}` }

    useFocusEffect(
        useCallback(() => {
            if (!profile) setLoading(true)
            const url = userId ? `/users/${userId}/` : '/auth/me/'
            client.get(url, { headers })
                .then(res => {
                    setProfile(res.data)
                    const authorId = res.data.id
                    client.get(`/posts/?author=${authorId}`, { headers })
                        .then(r => setPosts(r.data))
                        .catch(() => {})
                })
                .catch(() => {})
                .finally(() => setLoading(false))
        }, [userId, token])
    )

    async function handleFollow() {
        try {
            const res = await client.post(`/users/${profile.id}/follow/`, {}, { headers })
            setProfile(prev => ({
                ...prev,
                is_following: res.data.following,
                followers_count: res.data.following
                    ? (prev.followers_count ?? 0) + 1
                    : Math.max(0, (prev.followers_count ?? 0) - 1),
            }))
        } catch {}
    }

    async function handleBlock() {
        const isBlocked = profile?.is_blocked
        Alert.alert(
            isBlocked ? 'Débloquer cet utilisateur' : 'Bloquer cet utilisateur',
            isBlocked
                ? `Veux-tu débloquer @${profile.username} ?`
                : `Tu ne verras plus les publications de @${profile.username}. Veux-tu continuer ?`,
            [
                { text: 'Annuler', style: 'cancel' },
                {
                    text: isBlocked ? 'Débloquer' : 'Bloquer',
                    style: isBlocked ? 'default' : 'destructive',
                    onPress: async () => {
                        try {
                            const res = await client.post(`/users/${profile.id}/block/`, {}, { headers })
                            const nowBlocked = res.data.blocked
                            setProfile(prev => ({ ...prev, is_blocked: nowBlocked }))
                            if (nowBlocked) {
                                Alert.alert(
                                    'Utilisateur bloqué',
                                    `@${profile.username} a été bloqué.`,
                                    [{ text: 'OK', onPress: () => navigation.popToTop() }]
                                )
                            }
                        } catch {
                            Alert.alert('Erreur', 'Impossible de modifier le blocage.')
                        }
                    }
                }
            ]
        )
    }

    async function handleMessage() {
        try {
            const res = await client.post('/conversations/', { target_user_id: profile.id }, { headers })
            navigation.navigate('Conversation', { conversationId: res.data.id, username: profile.username })
        } catch {}
    }

    async function handleDeletePost(postId) {
        Alert.alert(
            'Supprimer la publication',
            'Cette action est irréversible.',
            [
                { text: 'Annuler', style: 'cancel' },
                {
                    text: 'Supprimer', style: 'destructive',
                    onPress: async () => {
                        try {
                            await client.delete(`/posts/${postId}/`, { headers })
                            setPosts(prev => prev.filter(p => p.id !== postId))
                        } catch {
                            Alert.alert('Erreur', 'Impossible de supprimer ce post.')
                        }
                    }
                }
            ]
        )
    }

    if (loading) return (
        <View style={styles.centered}>
            <ActivityIndicator color="#E4002B" size="large" />
        </View>
    )

    const photos = posts.filter(p => p.medias?.[0]?.media_type !== 'video' || p.medias?.length === 0)
    const videos = posts.filter(p => p.medias?.[0]?.media_type === 'video')
    const gridData = activeTab === 'photos' ? photos : videos

    /* ── HEADER (ListHeaderComponent) ── */
    function renderHeader() {
        return (
            <View>
                {/* Bandeau rouge */}
                <LinearGradient colors={['#FF2A3C', '#E4002B', '#B80020']} style={styles.header}>
                    <View style={styles.profileRow}>
                        {profile?.avatar_url ? (
                            <Image source={{ uri: profile.avatar_url }} style={styles.avatar} />
                        ) : (
                            <View style={styles.avatar}>
                                <Text style={styles.avatarText}>
                                    {profile?.username?.charAt(0).toUpperCase()}
                                </Text>
                            </View>
                        )}
                        <View style={styles.nameBlock}>
                            <Text style={styles.username}>{profile?.username?.toUpperCase()}</Text>
                            <Text style={styles.role}>
                                {profile?.role === 'admin' ? 'Administrateur' : sportRoleLabel(profile?.sport_role)}
                            </Text>
                            {profile?.club_name ? (
                                <View style={styles.clubRow}>
                                    <Ionicons name="shield-outline" size={12} color="rgba(255,255,255,0.8)" />
                                    <Text style={styles.clubText}>{profile.club_name}</Text>
                                </View>
                            ) : null}
                        </View>
                        {/* Croix + Modifier regroupés en haut à droite */}
                        <View style={styles.headerRight}>
                            <OccitanCross size={24} color="#F5C518" />
                            {isOwnProfile && (
                                <TouchableOpacity
                                    style={styles.editBtnHeader}
                                    onPress={() => navigation.navigate('EditProfile')}
                                >
                                    <Text style={styles.editBtnHeaderText}>Modifier</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    </View>
                </LinearGradient>

                {/* Carte blanche */}
                <View style={styles.card}>
                    {/* Stats */}
                    <View style={styles.statsRow}>
                        <View style={styles.statBox}>
                            <Text style={styles.statNumber}>{posts.length}</Text>
                            <Text style={styles.statLabel}>POSTS</Text>
                        </View>
                        <TouchableOpacity
                            style={[styles.statBox, styles.statBoxMiddle]}
                            activeOpacity={0.7}
                            onPress={() => navigation.navigate('FollowList', {
                                userId: profile.id,
                                type: 'followers',
                            })}
                        >
                            <Text style={[styles.statNumber, { color: '#E4002B' }]}>
                                {profile?.followers_count ?? 0}
                            </Text>
                            <Text style={styles.statLabel}>ABONNÉS</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.statBox}
                            activeOpacity={0.7}
                            onPress={() => navigation.navigate('FollowList', {
                                userId: profile.id,
                                type: 'following',
                            })}
                        >
                            <Text style={styles.statNumber}>{profile?.following_count ?? 0}</Text>
                            <Text style={styles.statLabel}>ABONNEMENTS</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Actions profil autre */}
                    {!isOwnProfile && (
                        <View style={styles.actionsCol}>
                            <TouchableOpacity
                                style={[styles.followBtn, profile?.is_following && styles.followBtnActive]}
                                onPress={handleFollow}
                            >
                                <Ionicons
                                    name={profile?.is_following ? 'person-remove-outline' : 'person-add-outline'}
                                    size={18}
                                    color={profile?.is_following ? '#E4002B' : '#fff'}
                                />
                                <Text style={[styles.followBtnText, profile?.is_following && styles.followBtnTextActive]}>
                                    {profile?.is_following ? 'Ne plus suivre' : 'Suivre'}
                                </Text>
                            </TouchableOpacity>
                            <LinearGradient colors={['#E4002B', '#FF5A1F']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.msgBtn}>
                                <TouchableOpacity style={styles.msgBtnInner} onPress={handleMessage}>
                                    <Ionicons name="chatbubble-outline" size={18} color="#fff" />
                                    <Text style={styles.msgBtnText}>Envoyer un message</Text>
                                </TouchableOpacity>
                            </LinearGradient>
                            <TouchableOpacity style={styles.blockBtn} onPress={handleBlock}>
                                <Ionicons name="ban-outline" size={15} color="#A8A29B" />
                                <Text style={styles.blockBtnText}>
                                    {profile?.is_blocked ? 'Débloquer cet utilisateur' : 'Bloquer cet utilisateur'}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    )}

                    {/* Actions propre profil */}
                    {isOwnProfile && (
                        <View style={styles.actionsCol}>
                            <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
                                <Ionicons name="log-out-outline" size={18} color="#E4002B" />
                                <Text style={styles.logoutText}>Se déconnecter</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.deleteBtn}
                                onPress={() => Alert.alert(
                                    'Supprimer le compte',
                                    'Cette action est irréversible. Toutes tes données seront supprimées.',
                                    [
                                        { text: 'Annuler', style: 'cancel' },
                                        {
                                            text: 'Supprimer', style: 'destructive',
                                            onPress: async () => {
                                                try {
                                                    await client.delete('/auth/me/', { headers })
                                                    logout()
                                                } catch {
                                                    Alert.alert('Erreur', 'Impossible de supprimer le compte.')
                                                }
                                            }
                                        }
                                    ]
                                )}
                            >
                                <Ionicons name="trash-outline" size={15} color="#A8A29B" />
                                <Text style={styles.deleteBtnText}>Supprimer mon compte</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </View>

                {/* Onglets Photos / Vidéos */}
                {posts.length > 0 && (
                    <View style={styles.tabs}>
                        <TouchableOpacity
                            style={[styles.tab, activeTab === 'photos' && styles.tabActive]}
                            onPress={() => setActiveTab('photos')}
                        >
                            <Ionicons name="images-outline" size={16} color={activeTab === 'photos' ? '#E4002B' : '#A8A29B'} />
                            <Text style={[styles.tabText, activeTab === 'photos' && styles.tabTextActive]}>
                                Photos ({photos.length})
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.tab, activeTab === 'videos' && styles.tabActive]}
                            onPress={() => setActiveTab('videos')}
                        >
                            <Ionicons name="play-outline" size={16} color={activeTab === 'videos' ? '#E4002B' : '#A8A29B'} />
                            <Text style={[styles.tabText, activeTab === 'videos' && styles.tabTextActive]}>
                                Vidéos ({videos.length})
                            </Text>
                        </TouchableOpacity>
                    </View>
                )}
            </View>
        )
    }

    /* ── GRILLE : View flexWrap pour éviter le scroll imbriqué ── */
    function renderGrid() {
        if (posts.length === 0) return null
        if (gridData.length === 0) {
            return (
                <View style={styles.emptyTab}>
                    <Text style={styles.emptyTabText}>Aucun contenu</Text>
                </View>
            )
        }
        return (
            <View style={styles.grid}>
                {gridData.map((item, index) => {
                    const media = item.medias?.[0]
                    const thumb = media?.media_type === 'video'
                        ? getVideoThumbnail(media.media_url)
                        : media?.media_url
                    return (
                        <TouchableOpacity
                            key={item.id.toString()}
                            style={styles.gridCell}
                            onPress={() => navigation.navigate('PostDetail', {
                                post: item,
                                posts: gridData,
                                initialIndex: index,
                            })}
                            onLongPress={isOwnProfile ? () => handleDeletePost(item.id) : undefined}
                            delayLongPress={500}
                            activeOpacity={0.85}
                        >
                            {thumb ? (
                                <Image source={{ uri: thumb }} style={styles.gridImg} />
                            ) : (
                                <View style={[styles.gridImg, styles.gridVideoPlaceholder]}>
                                    <Ionicons name="videocam" size={24} color="#fff" />
                                </View>
                            )}
                            {media?.media_type === 'video' && (
                                <View style={styles.videoIcon}>
                                    <Ionicons name="play-circle" size={20} color="#fff" />
                                </View>
                            )}
                            {isOwnProfile && (
                                <View style={styles.deleteHint}>
                                    <Ionicons name="ellipsis-horizontal" size={12} color="rgba(255,255,255,0.7)" />
                                </View>
                            )}
                        </TouchableOpacity>
                    )
                })}
            </View>
        )
    }

    return (
        <FlatList
            style={styles.screen}
            data={[]}
            keyExtractor={() => 'empty'}
            renderItem={null}
            ListHeaderComponent={renderHeader()}
            ListFooterComponent={
                <View>
                    {renderGrid()}
                    <View style={{ height: 32 }} />
                </View>
            }
            showsVerticalScrollIndicator={false}
            bounces={false}
        />
    )
}

const styles = StyleSheet.create({
    screen: { flex: 1, backgroundColor: '#F6F3EE' },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: {
        paddingTop: 56,
        paddingHorizontal: 20,
        paddingBottom: 24,
    },
    profileRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
    },
    headerRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginLeft: 'auto',
    },
    avatar: {
        width: 72,
        height: 72,
        borderRadius: 36,
        backgroundColor: '#2563EB',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 3,
        borderColor: 'rgba(255,255,255,0.4)',
    },
    avatarText: {
        fontFamily: 'PlusJakartaSans_800ExtraBold',
        fontSize: 28,
        color: '#fff',
    },
    nameBlock: { flex: 1 },
    username: {
        fontFamily: 'Anton_400Regular',
        fontSize: 22,
        color: '#fff',
        lineHeight: 26,
    },
    role: {
        fontFamily: 'PlusJakartaSans_400Regular',
        fontSize: 12,
        color: 'rgba(255,255,255,0.75)',
        marginTop: 2,
    },
    clubRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginTop: 3,
    },
    clubText: {
        fontFamily: 'PlusJakartaSans_600SemiBold',
        fontSize: 12,
        color: 'rgba(255,255,255,0.9)',
    },
    editBtnHeader: {
        borderWidth: 1.5,
        borderColor: '#fff',
        borderRadius: 20,
        paddingHorizontal: 14,
        paddingVertical: 6,
    },
    editBtnHeaderText: {
        fontFamily: 'PlusJakartaSans_600SemiBold',
        fontSize: 13,
        color: '#fff',
    },
    card: {
        backgroundColor: '#fff',
        padding: 20,
    },
    statsRow: {
        flexDirection: 'row',
        gap: 10,
        marginBottom: 20,
    },
    statBox: {
        flex: 1,
        backgroundColor: '#F6F3EE',
        borderRadius: 14,
        paddingVertical: 12,
        alignItems: 'center',
    },
    statBoxMiddle: {
        borderWidth: 1.5,
        borderColor: '#F4F1EC',
        backgroundColor: '#fff',
    },
    statNumber: {
        fontFamily: 'Anton_400Regular',
        fontSize: 22,
        color: '#1A1614',
    },
    statLabel: {
        fontFamily: 'PlusJakartaSans_600SemiBold',
        fontSize: 10,
        color: '#A8A29B',
        letterSpacing: 0.8,
        marginTop: 2,
    },
    actionsCol: { gap: 10 },
    followBtn: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        gap: 8, height: 50, borderRadius: 14, backgroundColor: '#E4002B',
    },
    followBtnActive: {
        backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#E4002B',
    },
    followBtnText: {
        fontFamily: 'PlusJakartaSans_700Bold', fontSize: 15, color: '#fff',
    },
    followBtnTextActive: { color: '#E4002B' },
    msgBtn: { borderRadius: 14 },
    msgBtnInner: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        gap: 8, height: 50,
    },
    msgBtnText: { fontFamily: 'PlusJakartaSans_700Bold', fontSize: 15, color: '#fff' },
    blockBtn: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        gap: 6, height: 36,
    },
    blockBtnText: { fontFamily: 'PlusJakartaSans_400Regular', fontSize: 13, color: '#A8A29B' },
    logoutBtn: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        gap: 8, borderWidth: 1.5, borderColor: '#E4002B', borderRadius: 14, height: 50,
    },
    logoutText: { fontFamily: 'PlusJakartaSans_700Bold', fontSize: 15, color: '#E4002B' },
    deleteBtn: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, height: 40,
    },
    deleteBtnText: { fontFamily: 'PlusJakartaSans_400Regular', fontSize: 13, color: '#A8A29B' },
    tabs: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#F4F1EC',
        marginTop: 10,
    },
    tab: {
        flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        gap: 6, paddingVertical: 14,
        borderBottomWidth: 2, borderBottomColor: 'transparent',
    },
    tabActive: { borderBottomColor: '#E4002B' },
    tabText: { fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 13, color: '#A8A29B' },
    tabTextActive: { color: '#E4002B' },
    emptyTab: { padding: 32, alignItems: 'center', backgroundColor: '#fff' },
    emptyTabText: { fontFamily: 'PlusJakartaSans_400Regular', fontSize: 14, color: '#A8A29B' },
    // Grille flex-wrap — pas de FlatList imbriqué
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 3,
        backgroundColor: '#F6F3EE',
        paddingTop: 3,
    },
    gridCell: {
        width: GRID_SIZE,
        height: GRID_SIZE,
    },
    gridImg: { width: '100%', height: '100%', backgroundColor: '#1A1614' },
    gridVideoPlaceholder: {
        justifyContent: 'center', alignItems: 'center', backgroundColor: '#2A2220',
    },
    videoIcon: { position: 'absolute', bottom: 6, right: 6 },
    deleteHint: { position: 'absolute', top: 5, right: 5 },
})
