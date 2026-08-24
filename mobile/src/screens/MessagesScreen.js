import React, { useCallback, useState } from 'react'
import { useFocusEffect } from '@react-navigation/native'
import {
    View, Text, FlatList, TouchableOpacity,
    StyleSheet, ActivityIndicator, TextInput
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import OccitanCross from '../components/OccitanCross'
import client from '../api/client'
import { useAuth } from '../context/AuthContext'

const AVATAR_COLORS = ['#2563EB', '#D97706', '#DC2626', '#059669', '#7C3AED', '#0891B2', '#EA580C', '#0F766E']

function getAvatarColor(username) {
    if (!username) return AVATAR_COLORS[0]
    let hash = 0
    for (let i = 0; i < username.length; i++) hash = username.charCodeAt(i) + ((hash << 5) - hash)
    return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]
}

function formatTime(dateStr) {
    if (!dateStr) return ''
    const d = new Date(dateStr)
    const now = new Date()
    const diffDays = Math.floor((now - d) / 86400000)
    if (diffDays === 0) return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
    if (diffDays === 1) return 'Hier'
    return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })
}

export default function MessagesScreen({ navigation }) {
    const { token } = useAuth()
    const [conversations, setConversations] = useState([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')
    const headers = { Authorization: `Bearer ${token}` }

    useFocusEffect(
        useCallback(() => {
            if (conversations.length === 0) setLoading(true)
            client.get('/conversations/', { headers })
                .then(res => setConversations(res.data))
                .catch(() => {})
                .finally(() => setLoading(false))
        }, [token])
    )

    const filtered = conversations.filter(c =>
        c.other_username?.toLowerCase().includes(search.toLowerCase())
    )

    if (loading) return (
        <View style={styles.centered}>
            <ActivityIndicator color="#E4002B" size="large" />
        </View>
    )

    return (
        <View style={styles.screen}>
            {/* Header léger */}
            <View style={styles.header}>
                <View style={styles.logoRow}>
                    <OccitanCross size={22} color="#E4002B" />
                    <Text style={styles.logoText}>FOOT CONNECT{'\n'}OCCITANIE</Text>
                </View>
                <Text style={styles.title}>MESSAGES</Text>
                <Text style={styles.subtitle}>Discute avec les passionnés de foot</Text>

                {/* Barre de recherche */}
                <View style={styles.searchBar}>
                    <Ionicons name="search-outline" size={16} color="#A8A29B" />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Rechercher une conversation..."
                        placeholderTextColor="#A8A29B"
                        value={search}
                        onChangeText={setSearch}
                    />
                </View>
            </View>

            {filtered.length === 0 ? (
                <View style={styles.centered}>
                    <Ionicons name="chatbubble-ellipses-outline" size={48} color="#A8A29B" />
                    <Text style={styles.emptyText}>
                        {search ? 'Aucun résultat' : 'Aucune conversation'}
                    </Text>
                    {!search && (
                        <Text style={styles.emptySubText}>
                            Va sur le profil d'un joueur pour lui écrire
                        </Text>
                    )}
                </View>
            ) : (
                <FlatList
                    data={filtered}
                    keyExtractor={item => item.id.toString()}
                    contentContainerStyle={styles.list}
                    renderItem={({ item }) => {
                        const color = getAvatarColor(item.other_username)
                        return (
                            <TouchableOpacity
                                style={styles.row}
                                onPress={() => navigation.navigate('Conversation', {
                                    conversationId: item.id,
                                    username: item.other_username
                                })}
                                activeOpacity={0.8}
                            >
                                {/* Avatar coloré */}
                                <View style={[styles.avatar, { backgroundColor: color }]}>
                                    <Text style={styles.avatarText}>
                                        {item.other_username?.[0]?.toUpperCase()}
                                        {item.other_username?.[1]?.toUpperCase() || ''}
                                    </Text>
                                    <View style={styles.onlineDot} />
                                </View>

                                <View style={styles.info}>
                                    <View style={styles.infoTop}>
                                        <Text style={styles.username}>{item.other_username}</Text>
                                        <Text style={styles.time}>{formatTime(item.updated_at)}</Text>
                                    </View>
                                    <Text
                                        style={[styles.lastMessage, item.unread_count > 0 && styles.lastMessageUnread]}
                                        numberOfLines={1}
                                    >
                                        {item.last_message || 'Aucun message'}
                                    </Text>
                                </View>

                                {item.unread_count > 0 && (
                                    <View style={styles.badge}>
                                        <Text style={styles.badgeText}>{item.unread_count}</Text>
                                    </View>
                                )}
                            </TouchableOpacity>
                        )
                    }}
                />
            )}
        </View>
    )
}

const styles = StyleSheet.create({
    screen: { flex: 1, backgroundColor: '#F6F3EE' },
    header: {
        backgroundColor: '#F6F3EE',
        paddingTop: 56,
        paddingHorizontal: 20,
        paddingBottom: 12,
    },
    logoRow: {
        flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16,
    },
    logoText: {
        fontFamily: 'PlusJakartaSans_700Bold',
        fontSize: 11,
        color: '#E4002B',
        lineHeight: 15,
        letterSpacing: 0.5,
    },
    title: {
        fontFamily: 'Anton_400Regular',
        fontSize: 36,
        color: '#1A1614',
        marginBottom: 4,
    },
    subtitle: {
        fontFamily: 'PlusJakartaSans_400Regular',
        fontSize: 13,
        color: '#5C564F',
        marginBottom: 16,
    },
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 14,
        paddingHorizontal: 14,
        paddingVertical: 10,
        gap: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 1,
    },
    searchInput: {
        flex: 1,
        fontFamily: 'PlusJakartaSans_400Regular',
        fontSize: 14,
        color: '#1A1614',
    },
    list: { padding: 16, paddingTop: 12, gap: 10 },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 14,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 6,
        elevation: 1,
    },
    avatar: {
        width: 52,
        height: 52,
        borderRadius: 26,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    onlineDot: {
        position: 'absolute',
        bottom: 2,
        right: 2,
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: '#22C55E',
        borderWidth: 2,
        borderColor: '#fff',
    },
    avatarText: {
        fontFamily: 'PlusJakartaSans_800ExtraBold',
        fontSize: 16,
        color: '#fff',
        letterSpacing: 0.5,
    },
    info: { flex: 1 },
    infoTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 },
    username: { fontFamily: 'PlusJakartaSans_700Bold', fontSize: 15, color: '#1A1614' },
    time: { fontFamily: 'PlusJakartaSans_400Regular', fontSize: 12, color: '#A8A29B' },
    lastMessage: {
        fontFamily: 'PlusJakartaSans_400Regular', fontSize: 13, color: '#5C564F',
    },
    lastMessageUnread: {
        fontFamily: 'PlusJakartaSans_700Bold', color: '#1A1614',
    },
    badge: {
        width: 22, height: 22, borderRadius: 11,
        backgroundColor: '#E4002B',
        justifyContent: 'center', alignItems: 'center', marginLeft: 8,
    },
    badgeText: { fontFamily: 'PlusJakartaSans_700Bold', fontSize: 11, color: '#fff' },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 10, padding: 32 },
    emptyText: { fontFamily: 'PlusJakartaSans_700Bold', fontSize: 16, color: '#1A1614' },
    emptySubText: { fontFamily: 'PlusJakartaSans_400Regular', fontSize: 13, color: '#5C564F', textAlign: 'center' },
})
