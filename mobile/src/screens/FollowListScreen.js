import React, { useEffect, useState } from 'react'
import {
    View, Text, FlatList, TouchableOpacity,
    StyleSheet, ActivityIndicator, Image
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import client from '../api/client'
import { useAuth } from '../context/AuthContext'

function sportRoleLabel(role) {
    switch (role) {
        case 'joueur': return 'Joueur'
        case 'coach': return 'Coach'
        case 'club': return 'Dirigeant de club'
        case 'partenaire': return 'Partenaire'
        default: return 'Supporter'
    }
}

export default function FollowListScreen({ route, navigation }) {
    const { userId, type } = route.params // type = 'followers' | 'following'
    const { token } = useAuth()
    const headers = { Authorization: `Bearer ${token}` }
    const [users, setUsers] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        client.get(`/users/${userId}/${type}/`, { headers })
            .then(res => setUsers(res.data))
            .catch(() => {})
            .finally(() => setLoading(false))
    }, [userId, type])

    return (
        <View style={styles.screen}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color="#1A1614" />
                </TouchableOpacity>
                <Text style={styles.title}>
                    {type === 'followers' ? 'Abonnés' : 'Abonnements'}
                </Text>
            </View>

            {loading ? (
                <View style={styles.centered}>
                    <ActivityIndicator color="#E4002B" size="large" />
                </View>
            ) : users.length === 0 ? (
                <View style={styles.centered}>
                    <Ionicons name="people-outline" size={48} color="#A8A29B" />
                    <Text style={styles.emptyText}>
                        {type === 'followers' ? 'Aucun abonné' : 'Aucun abonnement'}
                    </Text>
                </View>
            ) : (
                <FlatList
                    data={users}
                    keyExtractor={item => item.id.toString()}
                    contentContainerStyle={styles.list}
                    renderItem={({ item }) => (
                        <TouchableOpacity
                            style={styles.row}
                            onPress={() => navigation.navigate('Profile', {
                                userId: item.id,
                                username: item.username,
                            })}
                            activeOpacity={0.8}
                        >
                            {item.avatar_url ? (
                                <Image source={{ uri: item.avatar_url }} style={styles.avatar} />
                            ) : (
                                <View style={styles.avatarPlaceholder}>
                                    <Text style={styles.avatarLetter}>
                                        {item.username?.[0]?.toUpperCase()}
                                    </Text>
                                </View>
                            )}
                            <View style={styles.info}>
                                <Text style={styles.username}>@{item.username}</Text>
                                <Text style={styles.role}>{sportRoleLabel(item.sport_role)}</Text>
                            </View>
                            <Ionicons name="chevron-forward" size={18} color="#A8A29B" />
                        </TouchableOpacity>
                    )}
                />
            )}
        </View>
    )
}

const styles = StyleSheet.create({
    screen: { flex: 1, backgroundColor: '#F6F3EE' },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingTop: 56,
        paddingBottom: 16,
        paddingHorizontal: 16,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#F4F1EC',
        gap: 12,
    },
    backBtn: { padding: 4 },
    title: {
        fontFamily: 'Anton_400Regular',
        fontSize: 24,
        color: '#1A1614',
    },
    centered: {
        flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12,
    },
    emptyText: {
        fontFamily: 'PlusJakartaSans_400Regular',
        fontSize: 15, color: '#A8A29B',
    },
    list: { padding: 16, gap: 10 },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 14,
        gap: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 1,
    },
    avatar: { width: 48, height: 48, borderRadius: 24 },
    avatarPlaceholder: {
        width: 48, height: 48, borderRadius: 24,
        backgroundColor: '#F5C518',
        justifyContent: 'center', alignItems: 'center',
    },
    avatarLetter: {
        fontFamily: 'PlusJakartaSans_800ExtraBold',
        fontSize: 20, color: '#1A1614',
    },
    info: { flex: 1 },
    username: {
        fontFamily: 'PlusJakartaSans_700Bold',
        fontSize: 15, color: '#1A1614',
    },
    role: {
        fontFamily: 'PlusJakartaSans_400Regular',
        fontSize: 12, color: '#5C564F', marginTop: 2,
    },
})
