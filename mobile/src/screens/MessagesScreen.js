import React, { useCallback, useState } from 'react'
import { useFocusEffect } from '@react-navigation/native'
import {
    View, Text, FlatList, TouchableOpacity,
    StyleSheet, ActivityIndicator
} from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { Ionicons } from '@expo/vector-icons'
import client from '../api/client'
import { useAuth } from '../context/AuthContext'

export default function MessagesScreen({ navigation }) {
    const { token } = useAuth()
    const [conversations, setConversations] = useState([])
    const [loading, setLoading] = useState(true)
    const headers = { Authorization: `Bearer ${token}` }

    useFocusEffect(
        useCallback(() => {
            setLoading(true)
            client.get('/conversations/', { headers })
                .then(res => setConversations(res.data))
                .catch(() => {})
                .finally(() => setLoading(false))
        }, [token])
    )

    if (loading) return (
        <View style={styles.centered}>
            <ActivityIndicator color="#E4002B" size="large" />
        </View>
    )

    return (
        <View style={styles.screen}>

            {/* Header gradient rouge — même identité que Login/Profil */}
            <LinearGradient
                colors={['#FF2A3C', '#E4002B', '#B80020']}
                style={styles.header}
            >
                <Text style={styles.headerTitle}>MESSAGES</Text>
                {conversations.length > 0 && (
                    <Text style={styles.headerCount}>
                        {conversations.length} conversation{conversations.length > 1 ? 's' : ''}
                    </Text>
                )}
            </LinearGradient>

            {conversations.length === 0 ? (
                <View style={styles.centered}>
                    {/* Icône dans un cercle rouge pour garder l'identité */}
                    <View style={styles.emptyIcon}>
                        <Ionicons name="chatbubble-ellipses" size={36} color="#fff" />
                    </View>
                    <Text style={styles.emptyText}>Aucune conversation</Text>
                    <Text style={styles.emptySubText}>
                        Va sur le profil d'un joueur pour lui écrire
                    </Text>
                </View>
            ) : (
                <FlatList
                    data={conversations}
                    keyExtractor={item => item.id.toString()}
                    contentContainerStyle={styles.list}
                    renderItem={({ item }) => (
                        <TouchableOpacity
                            style={styles.row}
                            onPress={() => navigation.navigate('Conversation', {
                                conversationId: item.id,
                                username: item.other_username
                            })}
                            activeOpacity={0.8}
                        >
                            {/* Avatar avec initiale sur fond or */}
                            <View style={styles.avatar}>
                                <Text style={styles.avatarText}>
                                    {item.other_username[0].toUpperCase()}
                                </Text>
                            </View>
                            <View style={styles.info}>
                                <Text style={styles.username}>{item.other_username}</Text>
                                <Text
                                    style={[
                                        styles.lastMessage,
                                        item.unread_count > 0 && styles.lastMessageUnread
                                    ]}
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
                    )}
                />
            )}
        </View>
    )
}

const styles = StyleSheet.create({
    screen: {
        flex: 1,
        backgroundColor: '#F6F3EE',
    },
    header: {
        paddingTop: 60,
        paddingBottom: 24,
        paddingHorizontal: 20,
    },
    headerTitle: {
        fontFamily: 'Anton_400Regular',
        fontSize: 32,
        color: '#fff',
    },
    headerCount: {
        fontFamily: 'PlusJakartaSans_400Regular',
        fontSize: 13,
        color: 'rgba(255,255,255,0.75)',
        marginTop: 4,
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 32,
        gap: 12,
    },
    emptyIcon: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#E4002B',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    emptyText: {
        fontFamily: 'PlusJakartaSans_700Bold',
        fontSize: 18,
        color: '#1A1614',
    },
    emptySubText: {
        fontFamily: 'PlusJakartaSans_400Regular',
        fontSize: 14,
        color: '#5C564F',
        textAlign: 'center',
    },
    list: {
        padding: 16,
        gap: 8,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 14,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06,
        shadowRadius: 4,
        elevation: 2,
    },
    avatar: {
        width: 52,
        height: 52,
        borderRadius: 26,
        backgroundColor: '#F5C518',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 14,
    },
    avatarText: {
        fontFamily: 'PlusJakartaSans_800ExtraBold',
        fontSize: 22,
        color: '#1A1614',
    },
    info: {
        flex: 1,
    },
    username: {
        fontFamily: 'PlusJakartaSans_700Bold',
        fontSize: 15,
        color: '#1A1614',
    },
    lastMessage: {
        fontFamily: 'PlusJakartaSans_400Regular',
        fontSize: 13,
        color: '#A8A29B',
        marginTop: 3,
    },
    lastMessageUnread: {
        color: '#1A1614',
        fontFamily: 'PlusJakartaSans_600SemiBold',
    },
    badge: {
        backgroundColor: '#E4002B',
        borderRadius: 12,
        minWidth: 24,
        height: 24,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 6,
    },
    badgeText: {
        fontFamily: 'PlusJakartaSans_700Bold',
        color: '#fff',
        fontSize: 12,
    },
})
