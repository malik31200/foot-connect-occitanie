import React, { useCallback, useState, useRef } from 'react'
import { useFocusEffect } from '@react-navigation/native'
import {
    View, Text, FlatList, TextInput, TouchableOpacity,
    StyleSheet, KeyboardAvoidingView, Platform, Alert
} from 'react-native'
import client from '../api/client'
import { useAuth } from '../context/AuthContext'

export default function ConversationScreen({ route }) {
    const {conversationId, username } = route.params
    const { token } = useAuth()
    const [messages, setMessages] = useState([])
    const [text, setText] = useState('')
    const flatListRef = useRef(null)

    const headers = { Authorization: `Bearer ${token}`}

    useFocusEffect(
        useCallback(() => {
            loadMessages()
            markRead()
        }, [conversationId, token])
    )

    async function  loadMessages() {
        try {
            const res = await client.get(`/conversations/${conversationId}/messages/`, { headers })
            setMessages(res.data)
        } catch {}
    }

    async function markRead() {
        try {
            await client.patch(`/conversations/${conversationId}/read/`, {}, { headers })
        } catch {}
    }

    async function sendMessage() {
        const content = text.trim()

        if (!content) return
        setText('')
        try {
            const res = await client.post(
                `/conversations/${conversationId}/messages/`,
                { content },
                { headers }
            )
            setMessages(prev => [...prev, res.data])
            setTimeout(() => flatListRef.current?.scrollToEnd(), 100)
        } catch (e) {
            console.log('ERREUR ENVOI:', e.message, e.response?.data)
            Alert.alert('Erreur', JSON.stringify(e.response?.data || e.message))
        }

    }

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={90}
        >
            <FlatList
                ref={flatListRef}
                data={messages}
                keyExtractor={item => item.id.toString()}
                contentContainerStyle={styles.list}
                onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
                renderItem={({ item }) => (
                    <View style={[
                        styles.bubble,
                        item.sender_username === username ? styles.bubbleOther : styles.bubbleMe
                    ]}>
                        <Text style={[
                            styles.bubbleText,
                            item.sender_username !== username && styles.bubbleTextMe
                        ]}>
                            {item.content}
                        </Text>
                    </View>
                )}
            />
            <View style={styles.inputRow}>
                <TextInput
                    style={styles.input}
                    placeholder="Message..."
                    value={text}
                    onChangeText={setText}
                    multiline
                />
                <TouchableOpacity style={styles.sendBtn} onPress={sendMessage}>
                    <Text style={styles.sendText}>Envoyer</Text>
                </TouchableOpacity>
            </View>
        </KeyboardAvoidingView>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F6F3EE'
    },
    list: {
        padding: 16,
        paddingBottom: 8
    },
    bubble: {
        maxWidth: '75%',
        borderRadius: 16,
        padding: 12,
        marginBottom: 8
    },
    bubbleMe: {
        backgroundColor: '#E4002B',
        alignSelf: 'flex-end',
        borderBottomRightRadius: 4
    },
    bubbleOther: {
        backgroundColor: '#E8E3DC',
        alignSelf: 'flex-start',
        borderBottomLeftRadius: 4
    },
    bubbleText: {
        color: '#fff',
        fontSize: 15
    },
    bubbleTextMe: {
        color: '#fff'
    },
    inputRow: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        padding: 12,
        backgroundColor: '#fff',
        borderTopWidth: 1,
        borderTopColor: '#F4F1EC'
    },
    input: {
        flex: 1,
        backgroundColor: '#F4F1EC',
        borderRadius: 20,
        paddingHorizontal: 16,
        paddingVertical: 16,
        fontSize: 15,
        maxHeight: 100,
        marginRight: 8
    },
    sendBtn: {
        backgroundColor: '#E4002B',
        borderRadius: 20,
        paddingHorizontal: 16,
        paddingVertical: 10
    },
    sendText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 14
    }
})