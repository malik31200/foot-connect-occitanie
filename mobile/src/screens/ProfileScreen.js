import React, { useCallback, useState } from 'react'
import { useFocusEffect } from '@react-navigation/native'
import {
    View, Text, StyleSheet, ActivityIndicator,
    TouchableOpacity, ScrollView, FlatList, Image, Dimensions
} from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { Ionicons } from '@expo/vector-icons'
import client from '../api/client'
import { useAuth } from '../context/AuthContext'

const SCREEN_WIDTH = Dimensions.get('window').width
const GRID_SIZE = (SCREEN_WIDTH - 4) / 3

export default function ProfileScreen({ route, navigation }) {
    const { token, logout } = useAuth()
    const [profile, setProfile] = useState(null)
    const [loading, setLoading] = useState(true)

    const userId = route?.params?.userId
    const headers = { Authorization: `Bearer ${token}` }
    const [posts, setPosts] = useState([])

    useFocusEffect(
        useCallback(() => {
            if (!profile) setLoading(true)
            const url = userId ? `/users/${userId}/` : '/auth/me/'
            client.get(url, { headers })
                .then(res => {
                    setProfile(res.data)
                    // Fetch posts de cet utilisateur
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

    async function handleMessage() {
        try {
            const res = await client.post('/conversations/', {
                target_user_id: profile.id
            }, { headers })
            navigation.navigate('Conversation', {
                conversationId: res.data.id,
                username: profile.username
            })
        } catch {}
    }

    if (loading) return (
        <View style={styles.centered}>
            <ActivityIndicator color="#E4002B" size="large" />
        </View>
    )

    return (
        <ScrollView style={styles.screen} bounces={false}>
            <LinearGradient
                colors={['#FF2A3C', '#E4002B', '#B80020']}
                style={styles.header}
            >
                <View style={styles.avatar}>
                    <Text style={styles.avatarText}>
                        {profile?.username?.charAt(0).toUpperCase()}
                    </Text>
                </View>
                <Text style={styles.username}>@{profile?.username}</Text>
                <Text style={styles.role}>{profile?.role === 'admin' ? 'Administrateur' : 'Joueur'}</Text>
            </LinearGradient>

            <View style={styles.card}>
                {userId && profile?.followers_count !== undefined && (
                    <View style={styles.statsRow}>
                        <View style={styles.stat}>
                            <Text style={styles.statNumber}>{profile.followers_count}</Text>
                            <Text style={styles.statLabel}>Abonnés</Text>
                        </View>
                        <View style={styles.statDivider} />
                        <View style={styles.stat}>
                            <Text style={styles.statNumber}>{profile.following_count}</Text>
                            <Text style={styles.statLabel}>Abonnements</Text>
                        </View>
                    </View>
                )}

                <View style={styles.infoRow}>
                    <Ionicons name="mail-outline" size={18} color="#5C564F" />
                    <Text style={styles.infoText}>{profile?.email}</Text>
                </View>

                {userId ? (
                    <View style={{ gap: 12 }}>
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
                        <LinearGradient
                            colors={['#E4002B', '#FF5A1F']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={styles.btn}
                        >
                            <TouchableOpacity style={styles.btnInner} onPress={handleMessage}>
                                <Ionicons name="chatbubble-outline" size={18} color="#fff" />
                                <Text style={styles.btnText}>Envoyer un message</Text>
                            </TouchableOpacity>
                        </LinearGradient>
                    </View>
                ) : (
                    <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
                        <Ionicons name="log-out-outline" size={20} color="#E4002B" />
                        <Text style={styles.logoutText}>Se déconnecter</Text>
                    </TouchableOpacity>
                )}
            </View>

            {/* Grille de publications */}
            {posts.length > 0 && (
                <View style={styles.gridSection}>
                    <Text style={styles.gridTitle}>Publications ({posts.length})</Text>
                    <FlatList
                        data={posts}
                        keyExtractor={item => item.id.toString()}
                        numColumns={3}
                        scrollEnabled={false}
                        ItemSeparatorComponent={() => <View style={{ height: 2 }} />}
                        renderItem={({ item }) => {
                            const media = item.medias?.[0]
                            return (
                                <View style={styles.gridCell}>
                                    {media?.media_type === 'photo' ? (
                                        <Image source={{ uri: media.media_url }} style={styles.gridImg} />
                                    ) : (
                                        <View style={[styles.gridImg, styles.gridVideo]}>
                                            <Ionicons name="videocam" size={24} color="#fff" />
                                        </View>
                                    )}
                                </View>
                            )
                        }}
                    />
                </View>
            )}
        </ScrollView>
    )
}

const styles = StyleSheet.create({
    screen: {
        flex: 1,
        backgroundColor: '#F6F3EE',
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        alignItems: 'center',
        paddingTop: 72,
        paddingBottom: 40,
    },
    avatar: {
        width: 90,
        height: 90,
        borderRadius: 45,
        backgroundColor: '#F5C518',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 14,
        borderWidth: 3,
        borderColor: 'rgba(255,255,255,0.4)',
    },
    avatarText: {
        fontFamily: 'PlusJakartaSans_800ExtraBold',
        fontSize: 36,
        color: '#1A1614',
    },
    username: {
        fontFamily: 'Anton_400Regular',
        fontSize: 26,
        color: '#fff',
        marginBottom: 4,
    },
    role: {
        fontFamily: 'PlusJakartaSans_400Regular',
        fontSize: 13,
        color: 'rgba(255,255,255,0.75)',
        letterSpacing: 1,
    },
    card: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 28,
        borderTopRightRadius: 28,
        marginTop: -20,
        padding: 24,
        minHeight: 300,
    },
    statsRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
        paddingBottom: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#F4F1EC',
    },
    stat: {
        alignItems: 'center',
        paddingHorizontal: 32,
    },
    statNumber: {
        fontFamily: 'Anton_400Regular',
        fontSize: 26,
        color: '#1A1614',
    },
    statLabel: {
        fontFamily: 'PlusJakartaSans_400Regular',
        fontSize: 12,
        color: '#5C564F',
        marginTop: 2,
    },
    statDivider: {
        width: 1,
        height: 36,
        backgroundColor: '#F4F1EC',
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginBottom: 24,
        backgroundColor: '#F6F3EE',
        borderRadius: 10,
        padding: 14,
    },
    infoText: {
        fontFamily: 'PlusJakartaSans_400Regular',
        fontSize: 14,
        color: '#5C564F',
    },
    btn: {
        borderRadius: 14,
        marginTop: 4,
    },
    btnInner: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        height: 52,
    },
    btnText: {
        fontFamily: 'PlusJakartaSans_700Bold',
        fontSize: 15,
        color: '#fff',
    },
    followBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        height: 52,
        borderRadius: 14,
        backgroundColor: '#E4002B',
    },
    followBtnActive: {
        backgroundColor: '#fff',
        borderWidth: 1.5,
        borderColor: '#E4002B',
    },
    followBtnText: {
        fontFamily: 'PlusJakartaSans_700Bold',
        fontSize: 15,
        color: '#fff',
    },
    followBtnTextActive: {
        color: '#E4002B',
    },
    logoutBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        borderWidth: 1.5,
        borderColor: '#E4002B',
        borderRadius: 14,
        height: 52,
        marginTop: 4,
    },
    logoutText: {
        fontFamily: 'PlusJakartaSans_700Bold',
        fontSize: 15,
        color: '#E4002B',
    },
    gridSection: {
        backgroundColor: '#fff',
        marginTop: 12,
        paddingTop: 16,
        paddingBottom: 32,
    },
    gridTitle: {
        fontFamily: 'PlusJakartaSans_700Bold',
        fontSize: 14,
        color: '#1A1614',
        paddingHorizontal: 16,
        marginBottom: 8,
    },
    gridCell: {
        width: GRID_SIZE,
        height: GRID_SIZE,
        marginRight: 2,
    },
    gridImg: {
        width: '100%',
        height: '100%',
        backgroundColor: '#1A1614',
    },
    gridVideo: {
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#2A2220',
    },
})
