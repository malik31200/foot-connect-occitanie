import React, { useCallback, useState, useRef } from 'react'
import { useFocusEffect } from '@react-navigation/native'
import {
    View, Text, FlatList, TextInput, TouchableOpacity,
    StyleSheet, Alert, KeyboardAvoidingView, Platform
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import client from '../api/client'
import { useAuth } from '../context/AuthContext'

export default function ConversationScreen({ route }) {
    const { conversationId, username } = route.params
    const { token } = useAuth()
    const [messages, setMessages] = useState([])
    const [text, setText] = useState('')
    const flatListRef = useRef(null)
    const headers = { Authorization: `Bearer ${token}` }
    const insets = useSafeAreaInsets()

    useFocusEffect(
        useCallback(() => {
            loadMessages()
            markRead()
        }, [conversationId, token])
    )

    async function loadMessages() {
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
            Alert.alert('Erreur', JSON.stringify(e.response?.data || e.message))
        }
    }

    // Sur iOS : KeyboardAvoidingView gère le clavier
    // Sur Android : "pan" dans app.json fait monter tout l'écran → View suffit
    const Wrapper = Platform.OS === 'ios' ? KeyboardAvoidingView : View
    const wrapperProps = Platform.OS === 'ios'
        ? { behavior: 'padding', keyboardVerticalOffset: 90 }
        : {}

    return (
        <Wrapper style={styles.container} {...wrapperProps}>
            <FlatList
                ref={flatListRef}
                data={messages}
                keyExtractor={item => item.id.toString()}
                contentContainerStyle={styles.list}
                onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
                renderItem={({ item }) => {
                    const isMe = item.sender_username !== username
                    return (
                        <View style={[styles.bubble, isMe ? styles.bubbleMe : styles.bubbleOther]}>
                            <Text style={[styles.bubbleText, isMe ? styles.bubbleTextMe : styles.bubbleTextOther]}>
                                {item.content}
                            </Text>
                        </View>
                    )
                }}
            />
            <View style={[styles.inputRow, { paddingBottom: 12 + insets.bottom }]}>
                <TextInput
                    style={styles.input}
                    placeholder="Message..."
                    placeholderTextColor="#A8A29B"
                    value={text}
                    onChangeText={setText}
                    multiline
                />
                <TouchableOpacity style={styles.sendBtn} onPress={sendMessage}>
                    <Ionicons name="send" size={20} color="#fff" />
                </TouchableOpacity>
            </View>
        </Wrapper>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F6F3EE',
    },
    list: {
        padding: 16,
        paddingBottom: 8,
        gap: 6,
    },
    bubble: {
        maxWidth: '75%',
        borderRadius: 18,
        paddingHorizontal: 14,
        paddingVertical: 10,
    },
    bubbleMe: {
        backgroundColor: '#E4002B',
        alignSelf: 'flex-end',
        borderBottomRightRadius: 4,
    },
    bubbleOther: {
        backgroundColor: '#fff',
        alignSelf: 'flex-start',
        borderBottomLeftRadius: 4,
    },
    bubbleText: {
        fontFamily: 'PlusJakartaSans_400Regular',
        fontSize: 15,
        lineHeight: 21,
    },
    bubbleTextMe: {
        color: '#fff',
    },
    bubbleTextOther: {
        color: '#1A1614',
    },
    inputRow: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        paddingTop: 12,
        paddingHorizontal: 12,
        backgroundColor: '#fff',
        borderTopWidth: 1,
        borderTopColor: '#F4F1EC',
        gap: 8,
    },
    input: {
        flex: 1,
        backgroundColor: '#F4F1EC',
        borderRadius: 22,
        paddingHorizontal: 16,
        paddingVertical: 12,
        fontFamily: 'PlusJakartaSans_400Regular',
        fontSize: 15,
        color: '#1A1614',
        maxHeight: 100,
    },
    sendBtn: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#E4002B',
        justifyContent: 'center',
        alignItems: 'center',
    },
})
