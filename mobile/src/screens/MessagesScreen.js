import React, { useCallback, useState } from 'react'
import { useFocusEffect } from '@react-navigation/native'
import {
    View, Text, FlatList, TouchableOpacity,
    StyleSheet, ActivityIndicator
} from 'react-native'
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
            <View style={styles.header}>
                <Text style={styles.headerTitle}>MESSAGES</Text>
            </View>

            {conversations.length === 0 ? (
                <View style={styles.centered}>
                    <Ionicons name="chatbubble-ellipses-outline" size={56} color="#A8A29B" />
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
                        >
                            <View style={styles.avatar}>
                                <Text style={styles.avatarText}>
                                    {item.other_username[0].toUpperCase()}
                                </Text>
                            </View>
                            <View style={styles.info}>
                                <Text style={styles.username}>{item.other_username}</Text>
                                <Text style={styles.lastMessage} numberOfLines={1}>
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
        backgroundColor: '#fff',
        paddingTop: 56,
        paddingBottom: 16,
        paddingHorizontal: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#F4F1EC',
    },
    headerTitle: {
        fontFamily: 'Anton_400Regular',
        fontSize: 28,
        color: '#1A1614',
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 32,
    },
    emptyText: {
        fontFamily: 'PlusJakartaSans_700Bold',
        fontSize: 18,
        color: '#1A1614',
        marginTop: 16,
    },
    emptySubText: {
        fontFamily: 'PlusJakartaSans_400Regular',
        fontSize: 14,
        color: '#5C564F',
        textAlign: 'center',
        marginTop: 8,
    },
    list: {
        padding: 16,
        gap: 8,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 14,
        padding: 14,
    },
    avatar: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: '#F5C518',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 14,
    },
    avatarText: {
        fontFamily: 'PlusJakartaSans_800ExtraBold',
        fontSize: 20,
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
        color: '#5C564F',
        marginTop: 3,
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
