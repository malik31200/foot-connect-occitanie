import React, { useCallback, useEffect, useState } from 'react'
import { useFocusEffect } from '@react-navigation/native'
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native'
import client from '../api/client'
import { useAuth } from '../context/AuthContext'

export default function ProfileScreen({ route, navigation }) {
    const { token } = useAuth()
    const [profile, setProfile] = useState(null)
    const [loading, setLoading] = useState(true)

    const userId = route?.params?.userId
    const headers = { Authorization: `Bearer ${token}` }

    useFocusEffect(
        useCallback(() => {
            setLoading(true)
            const url = userId ? `/users/${userId}/` : '/auth/me/'
            client.get(url, { headers })
                .then(res => setProfile(res.data))
                .catch(() =>{})
                .finally(() => setLoading(false))
        }, [userId, token])
    )

    async function handleMessages() {
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

    if (loading) return <ActivityIndicator style={{ flex: 1 }} />

    return (
        <View style={styles.container}>
            <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                    {profile?.username?.charAt(0).toUpperCase()}
                </Text>
            </View>
            <Text style={styles.username}>{profile?.username}</Text>
            <Text style={styles.email}>{profile?.email}</Text>

            {userId && (
                <TouchableOpacity style={styles.messageBtn} onPress={handleMessages}>
                    <Text style={styles.messageBtnText}>Envoyer un message</Text>
                </TouchableOpacity>
            )}
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        paddingTop: 60,
        backgroundColor: '#F6F3EE',
    },
    avatar: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#E4002B',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    avatarText: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#fff',
    },
    username: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#1A1614',
        marginBottom: 4,
    },
    email: {
        fontSize: 14,
        color: '#5C564F',
    },
    messageBtn: {
        backgroundColor: '#E4002B',
        borderRadius: 8,
        paddingHorizontal: 24,
        paddingVertical: 12,
        marginTop: 8,
    },
    messageBtnText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 15,
    }
})
