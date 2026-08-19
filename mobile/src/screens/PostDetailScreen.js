import React, { useState, useCallback, useRef } from 'react'
import {
    View, Text, Image, StyleSheet, ScrollView, FlatList,
    TouchableOpacity, TextInput, KeyboardAvoidingView,
    Platform, ActivityIndicator, Alert, Dimensions
} from 'react-native'
import { useFocusEffect } from '@react-navigation/native'
import { Ionicons } from '@expo/vector-icons'
import { VideoView, useVideoPlayer } from 'expo-video'
import { useAuth } from '../context/AuthContext'
import client from '../api/client'

const SCREEN_WIDTH = Dimensions.get('window').width

function VideoBlock({ uri }) {
    const player = useVideoPlayer(uri, p => {
        p.loop = true
        p.play()
    })
    return (
        <VideoView
            player={player}
            style={{ width: SCREEN_WIDTH, height: SCREEN_WIDTH }}
            contentFit="cover"
            nativeControls
        />
    )
}

function CommentItem({ comment, currentUserId, onDelete }) {
    return (
        <View style={styles.commentRow}>
            {comment.author_avatar_url ? (
                <Image source={{ uri: comment.author_avatar_url }} style={styles.commentAvatar} />
            ) : (
                <View style={styles.commentAvatarPlaceholder}>
                    <Text style={styles.commentAvatarLetter}>
                        {comment.author_username?.[0]?.toUpperCase()}
                    </Text>
                </View>
            )}
            <View style={styles.commentBubble}>
                <Text style={styles.commentAuthor}>@{comment.author_username}</Text>
                <Text style={styles.commentContent}>{comment.content}</Text>
            </View>
            {comment.author_id === currentUserId && (
                <TouchableOpacity onPress={() => onDelete(comment.id)} style={styles.commentDelete}>
                    <Ionicons name="trash-outline" size={16} color="#A8A29B" />
                </TouchableOpacity>
            )}
        </View>
    )
}

export default function PostDetailScreen({ route, navigation }) {
    const { post: initialPost } = route.params
    const { token, user } = useAuth()
    const headers = { Authorization: `Bearer ${token}` }

    const [post, setPost] = useState(initialPost)
    const [liked, setLiked] = useState(initialPost.is_liked || false)
    const [likesCount, setLikesCount] = useState(initialPost.likes_count || 0)

    const [comments, setComments] = useState([])
    const [loadingComments, setLoadingComments] = useState(true)
    const [commentText, setCommentText] = useState('')
    const [sending, setSending] = useState(false)
    const inputRef = useRef(null)

    useFocusEffect(
        useCallback(() => {
            loadComments()
        }, [post.id])
    )

    async function loadComments() {
        setLoadingComments(true)
        try {
            const res = await client.get(`/posts/${post.id}/comments/`, { headers })
            setComments(res.data.results || res.data)
        } catch {}
        finally { setLoadingComments(false) }
    }

    async function handleLike() {
        const wasLiked = liked
        setLiked(!wasLiked)
        setLikesCount(c => wasLiked ? c - 1 : c + 1)
        try {
            await client.post(`/posts/${post.id}/like/`, {}, { headers })
        } catch {
            setLiked(wasLiked)
            setLikesCount(c => wasLiked ? c + 1 : c - 1)
        }
    }

    async function handleSendComment() {
        if (!commentText.trim()) return
        setSending(true)
        try {
            const res = await client.post(`/posts/${post.id}/comments/`, {
                content: commentText.trim()
            }, { headers })
            setComments(prev => [res.data, ...prev])
            setCommentText('')
            inputRef.current?.blur()
        } catch {
            Alert.alert('Erreur', 'Impossible d\'envoyer le commentaire.')
        } finally {
            setSending(false)
        }
    }

    async function handleDeleteComment(commentId) {
        Alert.alert('Supprimer', 'Supprimer ce commentaire ?', [
            { text: 'Annuler', style: 'cancel' },
            {
                text: 'Supprimer', style: 'destructive',
                onPress: async () => {
                    try {
                        await client.delete(`/comments/${commentId}/`, { headers })
                        setComments(prev => prev.filter(c => c.id !== commentId))
                    } catch {}
                }
            }
        ])
    }

    return (
        <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            keyboardVerticalOffset={90}
        >
            <ScrollView style={styles.screen} bounces={false} keyboardShouldPersistTaps="handled">
                {/* Médias */}
                {post.medias?.map((media, i) => (
                    <View key={i}>
                        {media.media_type === 'photo' ? (
                            <Image
                                source={{ uri: media.media_url }}
                                style={styles.media}
                                resizeMode="cover"
                            />
                        ) : (
                            <VideoBlock uri={media.media_url} />
                        )}
                    </View>
                ))}

                <View style={styles.info}>
                    {/* Auteur */}
                    <TouchableOpacity
                        style={styles.authorRow}
                        onPress={() => navigation.navigate('Profile', {
                            userId: post.author_id,
                            username: post.author_username
                        })}
                    >
                        {post.author_avatar_url ? (
                            <Image source={{ uri: post.author_avatar_url }} style={styles.avatar} />
                        ) : (
                            <View style={styles.avatarPlaceholder}>
                                <Text style={styles.avatarLetter}>
                                    {post.author_username?.[0]?.toUpperCase()}
                                </Text>
                            </View>
                        )}
                        <Text style={styles.username}>@{post.author_username}</Text>
                    </TouchableOpacity>

                    {/* Caption */}
                    {post.caption ? (
                        <Text style={styles.caption}>{post.caption}</Text>
                    ) : null}

                    {/* Match */}
                    {post.match_info && (
                        <View style={styles.matchPill}>
                            <Ionicons name="football-outline" size={13} color="#E4002B" />
                            <Text style={styles.matchText}>
                                {post.match_info.home_team} · {post.match_info.away_team}
                            </Text>
                        </View>
                    )}

                    {/* Actions like */}
                    <View style={styles.actionsRow}>
                        <TouchableOpacity style={styles.actionBtn} onPress={handleLike}>
                            <Ionicons
                                name={liked ? 'heart' : 'heart-outline'}
                                size={24}
                                color={liked ? '#E4002B' : '#5C564F'}
                            />
                            <Text style={[styles.actionCount, liked && { color: '#E4002B' }]}>
                                {likesCount}
                            </Text>
                        </TouchableOpacity>
                        <View style={styles.actionBtn}>
                            <Ionicons name="chatbubble-outline" size={22} color="#5C564F" />
                            <Text style={styles.actionCount}>{comments.length}</Text>
                        </View>
                    </View>

                    {/* Commentaires */}
                    <Text style={styles.commentsTitle}>Commentaires</Text>
                    {loadingComments ? (
                        <ActivityIndicator color="#E4002B" style={{ marginVertical: 12 }} />
                    ) : comments.length === 0 ? (
                        <Text style={styles.noComment}>Sois le premier à commenter ✍️</Text>
                    ) : (
                        comments.map(comment => (
                            <CommentItem
                                key={comment.id}
                                comment={comment}
                                currentUserId={user?.id}
                                onDelete={handleDeleteComment}
                            />
                        ))
                    )}
                    <View style={{ height: 80 }} />
                </View>
            </ScrollView>

            {/* Champ commentaire */}
            <View style={styles.inputBar}>
                <TextInput
                    ref={inputRef}
                    style={styles.input}
                    placeholder="Ajouter un commentaire..."
                    placeholderTextColor="#A8A29B"
                    value={commentText}
                    onChangeText={setCommentText}
                    multiline
                />
                <TouchableOpacity
                    onPress={handleSendComment}
                    disabled={sending || !commentText.trim()}
                    style={[styles.sendBtn, (!commentText.trim() || sending) && { opacity: 0.4 }]}
                >
                    {sending ? (
                        <ActivityIndicator color="#fff" size="small" />
                    ) : (
                        <Ionicons name="send" size={18} color="#fff" />
                    )}
                </TouchableOpacity>
            </View>
        </KeyboardAvoidingView>
    )
}

const styles = StyleSheet.create({
    screen: { flex: 1, backgroundColor: '#F6F3EE' },
    media: { width: SCREEN_WIDTH, height: SCREEN_WIDTH, backgroundColor: '#1A1614' },
    info: { padding: 16, gap: 12 },
    authorRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    avatar: { width: 40, height: 40, borderRadius: 20 },
    avatarPlaceholder: {
        width: 40, height: 40, borderRadius: 20,
        backgroundColor: '#F5C518',
        justifyContent: 'center', alignItems: 'center',
    },
    avatarLetter: { fontFamily: 'PlusJakartaSans_800ExtraBold', fontSize: 16, color: '#1A1614' },
    username: { fontFamily: 'PlusJakartaSans_700Bold', fontSize: 15, color: '#1A1614' },
    caption: { fontFamily: 'PlusJakartaSans_400Regular', fontSize: 15, color: '#1A1614', lineHeight: 22 },
    matchPill: {
        flexDirection: 'row', alignItems: 'center', gap: 6,
        backgroundColor: '#FFF5F6', borderRadius: 20,
        paddingHorizontal: 12, paddingVertical: 6, alignSelf: 'flex-start',
    },
    matchText: { fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 12, color: '#E4002B' },
    actionsRow: { flexDirection: 'row', gap: 20, paddingVertical: 4 },
    actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    actionCount: { fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 15, color: '#5C564F' },
    commentsTitle: {
        fontFamily: 'PlusJakartaSans_700Bold', fontSize: 13, color: '#5C564F',
        textTransform: 'uppercase', letterSpacing: 1, marginTop: 4,
    },
    noComment: { fontFamily: 'PlusJakartaSans_400Regular', fontSize: 14, color: '#A8A29B' },
    commentRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 12 },
    commentAvatar: { width: 34, height: 34, borderRadius: 17 },
    commentAvatarPlaceholder: {
        width: 34, height: 34, borderRadius: 17,
        backgroundColor: '#F5C518',
        justifyContent: 'center', alignItems: 'center',
    },
    commentAvatarLetter: { fontFamily: 'PlusJakartaSans_700Bold', fontSize: 13, color: '#1A1614' },
    commentBubble: {
        flex: 1, backgroundColor: '#fff', borderRadius: 12,
        padding: 10, gap: 2,
    },
    commentAuthor: { fontFamily: 'PlusJakartaSans_700Bold', fontSize: 12, color: '#1A1614' },
    commentContent: { fontFamily: 'PlusJakartaSans_400Regular', fontSize: 14, color: '#1A1614' },
    commentDelete: { padding: 4, marginTop: 6 },
    inputBar: {
        flexDirection: 'row', alignItems: 'center', gap: 10,
        backgroundColor: '#fff', paddingHorizontal: 16, paddingVertical: 10,
        borderTopWidth: 1, borderTopColor: '#F4F1EC',
    },
    input: {
        flex: 1, backgroundColor: '#F6F3EE', borderRadius: 20,
        paddingHorizontal: 14, paddingVertical: 8,
        fontFamily: 'PlusJakartaSans_400Regular', fontSize: 14, color: '#1A1614',
        maxHeight: 80,
    },
    sendBtn: {
        width: 38, height: 38, borderRadius: 19,
        backgroundColor: '#E4002B',
        justifyContent: 'center', alignItems: 'center',
    },
})
