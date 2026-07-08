import React, {useCallback, useState} from 'react'
import { useFocusEffect } from '@react-navigation/native'
import {
    View, Text, FlatList, TouchableOpacity,
    StyleSheet, ActivityIndicator
} from 'react-native'
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
                .then(res =>setConversations(res.data))
                .catch(() => {})
                .finally(() => setLoading(false))
        }, [token])
    )

        if (loading) return <ActivityIndicator style={{ flex: 1 }} />

        if (conversations.length === 0) {
            return (
                <View style={styles.empty}>
                    <Text style={styles.emptyText}>Aucune conversation pour l'instant.</Text>
                </View>
            )
        }

        return (
            <FlatList
                data={conversations}
                keyExtractor={item => item.id.toString()}
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
        )
    }

const styles = StyleSheet.create({
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
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#F4F1EC'
    },
    avatar: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#E4002B',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12
    },
    avatarText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 18
    },
    info: {
        flex: 1
    },
    username: {
        fontWeight: 'bold',
        color: '#1A1614',
        fontSize: 15
    },
    lastMessage: {
        color: '#5C564F',
        fontSize: 13,
        marginTop: 2
    },
    badge: {
        backgroundColor: '#E4002B',
        borderRadius: 12,
        minWidth: 24,
        height: 24,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 6
    },
    badgeText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: 'bold'
    }
})
