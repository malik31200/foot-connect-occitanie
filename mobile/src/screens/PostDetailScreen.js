import React, { useRef, useState, useEffect, useCallback } from 'react'
import {
    View, Text, Image, StyleSheet, FlatList,
    TouchableOpacity, TextInput, KeyboardAvoidingView,
    Platform, ActivityIndicator, Alert, Dimensions,
    Modal, Keyboard
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { LinearGradient } from 'expo-linear-gradient'
import { Ionicons } from '@expo/vector-icons'
import { VideoView, useVideoPlayer } from 'expo-video'
import OccitanCross from '../components/OccitanCross'
import { useAuth } from '../context/AuthContext'
import client from '../api/client'

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get('window')

// ─── Lecteur vidéo ─────────────────────────────────────────────────────────────
function VideoItem({ uri, isActive }) {
    const player = useVideoPlayer(uri, p => { p.loop = true })
    useEffect(() => {
        isActive ? player.play() : player.pause()
    }, [isActive])
    return (
        <VideoView
            player={player}
            style={{ width: SCREEN_WIDTH, height: SCREEN_HEIGHT }}
            contentFit="contain"
            nativeControls={false}
        />
    )
}

// ─── Une carte post style TikTok ───────────────────────────────────────────────
function PostCard({ post, onLike, onOpenComments, onDelete, onReport, currentUserId, navigation, isActive, onBack }) {
    const medias = post.medias || []
    const [currentIndex, setCurrentIndex] = useState(0)
    const [liked, setLiked] = useState(post.is_liked ?? false)
    const [likesCount, setLikesCount] = useState(post.likes_count ?? 0)
    const [commentsCount, setCommentsCount] = useState(post.comments_count ?? 0)
    const insets = useSafeAreaInsets()

    function handleLikePress() {
        const wasLiked = liked
        setLiked(!wasLiked)
        setLikesCount(c => wasLiked ? c - 1 : c + 1)
        onLike(post.id)
    }

    return (
        <View style={[styles.card, { height: SCREEN_HEIGHT }]}>
            {/* Médias */}
            <FlatList
                data={medias.length > 0 ? medias : [null]}
                horizontal
                pagingEnabled
                scrollEnabled={medias.length > 1}
                showsHorizontalScrollIndicator={false}
                keyExtractor={(_, i) => String(i)}
                onScroll={e => {
                    setCurrentIndex(Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH))
                }}
                scrollEventThrottle={16}
                renderItem={({ item }) => {
                    if (!item) return (
                        <View style={{ width: SCREEN_WIDTH, height: SCREEN_HEIGHT, backgroundColor: '#1A1614' }} />
                    )
                    if (item.media_type === 'photo') {
                        return (
                            <View style={{ width: SCREEN_WIDTH, height: SCREEN_HEIGHT, backgroundColor: '#0E0B0A' }}>
                                <Image
                                    source={{ uri: item.media_url }}
                                    style={StyleSheet.absoluteFill}
                                    resizeMode="cover"
                                    blurRadius={18}
                                />
                                <Image
                                    source={{ uri: item.media_url }}
                                    style={{ width: SCREEN_WIDTH, height: SCREEN_HEIGHT }}
                                    resizeMode="contain"
                                />
                            </View>
                        )
                    }
                    return <VideoItem uri={item.media_url} isActive={isActive} />
                }}
            />

            {/* Dégradé overlay */}
            <LinearGradient
                colors={['rgba(14,11,10,0.6)', 'transparent', 'rgba(14,11,10,0.85)']}
                locations={[0, 0.3, 1]}
                style={StyleSheet.absoluteFill}
                pointerEvents="none"
            />

            {/* Dots carousel */}
            {medias.length > 1 && (
                <View style={styles.dotsContainer}>
                    {medias.map((_, i) => (
                        <View key={i} style={[styles.dot, i === currentIndex && styles.dotActive]} />
                    ))}
                </View>
            )}

            {/* Header : retour + logo + action */}
            <View style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
                <TouchableOpacity onPress={onBack} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color="#fff" />
                </TouchableOpacity>
                <View style={styles.logoGroup}>
                    <OccitanCross size={24} color="#F5C518" />
                    <Text style={styles.logoText}>FOOT CONNECT</Text>
                </View>
                {currentUserId && post.author_id === currentUserId ? (
                    <TouchableOpacity style={styles.topAction} onPress={() => onDelete(post.id)}>
                        <Ionicons name="trash-outline" size={20} color="#fff" />
                    </TouchableOpacity>
                ) : (
                    <TouchableOpacity
                        style={styles.topAction}
                        onPress={() => Alert.alert(
                            'Signaler ce contenu',
                            'Pourquoi signales-tu ce contenu ?',
                            [
                                { text: 'Annuler', style: 'cancel' },
                                { text: 'Spam', onPress: () => onReport(post.id, 'spam') },
                                { text: 'Contenu inapproprié', onPress: () => onReport(post.id, 'inappropriate') },
                            ]
                        )}
                    >
                        <Ionicons name="flag-outline" size={20} color="#fff" />
                    </TouchableOpacity>
                )}
            </View>

            {/* Actions droite */}
            <View style={[styles.actions, { bottom: insets.bottom + 80 }]}>
                <TouchableOpacity style={styles.actionBtn} onPress={handleLikePress}>
                    <View style={[styles.actionCircle, liked && styles.actionCircleLiked]}>
                        <Ionicons name="heart" size={24} color={liked ? '#E4002B' : '#fff'} />
                    </View>
                    <Text style={styles.actionCount}>{likesCount}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionBtn} onPress={() => {
                    onOpenComments(post.id)
                }}>
                    <View style={styles.actionCircle}>
                        <Ionicons name="chatbubble-ellipses" size={22} color="#fff" />
                    </View>
                    <Text style={styles.actionCount}>{commentsCount}</Text>
                </TouchableOpacity>
            </View>

            {/* Infos bas gauche */}
            <View style={[styles.info, { bottom: insets.bottom + 80, paddingRight: 90 }]}>
                <TouchableOpacity
                    onPress={() => navigation.navigate('Profile', {
                        userId: post.author_id,
                        username: post.author_username,
                    })}
                    style={styles.authorRow}
                >
                    {post.author_avatar_url ? (
                        <Image source={{ uri: post.author_avatar_url }} style={styles.avatar} />
                    ) : (
                        <View style={styles.avatar}>
                            <Text style={styles.avatarText}>{post.author_username?.[0]?.toUpperCase()}</Text>
                        </View>
                    )}
                    <Text style={styles.author}>{post.author_username}</Text>
                </TouchableOpacity>
                {post.caption ? <Text style={styles.caption} numberOfLines={2}>{post.caption}</Text> : null}
                {post.match_info && (
                    <View style={styles.matchPill}>
                        <Ionicons name="football-outline" size={12} color="#F5C518" />
                        <Text style={styles.matchPillText} numberOfLines={1}>
                            {post.match_info.home_team} · {post.match_info.away_team}
                        </Text>
                    </View>
                )}
            </View>
        </View>
    )
}

// ─── Modal commentaires (identique au Feed) ────────────────────────────────────
function CommentsModal({ visible, postId, onClose, token, currentUsername, currentUserId, onCommentCountChange }) {
    const headers = { Authorization: `Bearer ${token}` }
    const [comments, setComments] = useState([])
    const [commentText, setCommentText] = useState('')
    const insets = useSafeAreaInsets()

    useEffect(() => {
        if (!postId) return
        setComments([])
        client.get(`/posts/${postId}/comments/`, { headers })
            .then(res => setComments(res.data.results || res.data))
            .catch(() => {})
    }, [postId])

    async function sendComment() {
        const content = commentText.trim()
        if (!content) return
        setCommentText('')
        Keyboard.dismiss()
        try {
            const res = await client.post(`/posts/${postId}/comments/`, { content }, { headers })
            setComments(prev => [...prev, res.data])
            onCommentCountChange?.(postId, 1)
        } catch {}
    }

    async function deleteComment(commentId) {
        Alert.alert('Supprimer', 'Supprimer ce commentaire ?', [
            { text: 'Annuler', style: 'cancel' },
            {
                text: 'Supprimer', style: 'destructive', onPress: async () => {
                    try {
                        await client.delete(`/comments/${commentId}/`, { headers })
                        setComments(prev => prev.filter(c => c.id !== commentId))
                        onCommentCountChange?.(postId, -1)
                    } catch {}
                }
            }
        ])
    }

    async function handleLikeComment(commentId) {
        try {
            const res = await client.post(`/comments/${commentId}/like/`, {}, { headers })
            setComments(prev => prev.map(c =>
                c.id === commentId ? { ...c, is_liked: res.data.liked, likes_count: res.data.likes_count } : c
            ))
        } catch {}
    }

    function handleReportComment(commentId) {
        Alert.alert('Signaler ce commentaire', 'Pourquoi ?', [
            { text: 'Annuler', style: 'cancel' },
            { text: 'Spam', onPress: async () => { try { await client.post(`/comments/${commentId}/report/`, { reason: 'spam' }, { headers }); Alert.alert('Signalement envoyé', 'Merci.') } catch {} } },
            { text: 'Contenu inapproprié', onPress: async () => { try { await client.post(`/comments/${commentId}/report/`, { reason: 'inappropriate' }, { headers }); Alert.alert('Signalement envoyé', 'Merci.') } catch {} } },
        ])
    }

    return (
        <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
            <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => { Keyboard.dismiss(); onClose() }} />
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.modalSheet}
            >
                <View style={styles.modalHandle} />
                <Text style={styles.modalTitle}>Commentaires</Text>
                <FlatList
                    data={comments}
                    keyExtractor={item => item.id.toString()}
                    keyboardShouldPersistTaps="handled"
                    contentContainerStyle={{ padding: 16, gap: 12 }}
                    ListEmptyComponent={<Text style={styles.modalEmpty}>Sois le premier à commenter ✍️</Text>}
                    renderItem={({ item }) => (
                        <View style={styles.commentRow}>
                            {item.author_avatar_url ? (
                                <Image source={{ uri: item.author_avatar_url }} style={styles.commentAvatar} />
                            ) : (
                                <View style={styles.commentAvatar}>
                                    <Text style={styles.commentAvatarText}>{item.author_username?.[0]?.toUpperCase()}</Text>
                                </View>
                            )}
                            <View style={styles.commentBubble}>
                                <Text style={styles.commentAuthor}>{item.author_username}</Text>
                                <Text style={styles.commentContent}>{item.content}</Text>
                            </View>
                            <View style={styles.commentActions}>
                                <TouchableOpacity onPress={() => handleLikeComment(item.id)} style={styles.commentLikeBtn}>
                                    <Ionicons
                                        name={item.is_liked ? 'football' : 'football-outline'}
                                        size={15}
                                        color={item.is_liked ? '#E4002B' : '#A8A29B'}
                                    />
                                    {(item.likes_count ?? 0) > 0 && (
                                        <Text style={[styles.commentLikeCount, item.is_liked && { color: '#E4002B' }]}>
                                            {item.likes_count}
                                        </Text>
                                    )}
                                </TouchableOpacity>
                                {item.author_username === currentUsername ? (
                                    <TouchableOpacity onPress={() => deleteComment(item.id)} style={styles.commentActionBtn}>
                                        <Ionicons name="trash-outline" size={14} color="#A8A29B" />
                                    </TouchableOpacity>
                                ) : (
                                    <TouchableOpacity onPress={() => handleReportComment(item.id)} style={styles.commentActionBtn}>
                                        <Ionicons name="flag-outline" size={14} color="#A8A29B" />
                                    </TouchableOpacity>
                                )}
                            </View>
                        </View>
                    )}
                />
                <View style={[styles.inputBar, { paddingBottom: Math.max(insets.bottom, 10) }]}>
                    <TextInput
                        style={styles.input}
                        placeholder="Ajouter un commentaire..."
                        placeholderTextColor="#A8A29B"
                        value={commentText}
                        onChangeText={setCommentText}
                        multiline
                    />
                    <TouchableOpacity
                        onPress={sendComment}
                        disabled={!commentText.trim()}
                        style={[styles.sendBtn, !commentText.trim() && { opacity: 0.4 }]}
                    >
                        <Ionicons name="send" size={18} color="#fff" />
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </Modal>
    )
}

// ─── Écran principal ───────────────────────────────────────────────────────────
export default function PostDetailScreen({ route, navigation }) {
    const { post: initialPost, posts: postList, initialIndex } = route.params
    const { token, user } = useAuth()
    const headers = { Authorization: `Bearer ${token}` }
    const flatRef = useRef(null)

    const [posts, setPosts] = useState(postList?.length > 0 ? postList : [initialPost])
    const [activeIndex, setActiveIndex] = useState(initialIndex ?? 0)
    const [commentPostId, setCommentPostId] = useState(null)

    const viewabilityConfig = useRef({ viewAreaCoveragePercentThreshold: 60 })
    const onViewableItemsChanged = useRef(({ viewableItems }) => {
        if (viewableItems.length > 0) setActiveIndex(viewableItems[0].index)
    })

    useEffect(() => {
        if ((initialIndex ?? 0) > 0) {
            setTimeout(() => {
                flatRef.current?.scrollToIndex({ index: initialIndex, animated: false })
            }, 100)
        }
    }, [])

    async function handleLike(postId) {
        try {
            await client.post(`/posts/${postId}/like/`, {}, { headers })
        } catch {}
    }

    async function handleDelete(postId) {
        Alert.alert('Supprimer', 'Supprimer cette publication ?', [
            { text: 'Annuler', style: 'cancel' },
            {
                text: 'Supprimer', style: 'destructive', onPress: async () => {
                    try {
                        await client.delete(`/posts/${postId}/`, { headers })
                        const remaining = posts.filter(p => p.id !== postId)
                        if (remaining.length === 0) {
                            navigation.goBack()
                        } else {
                            setPosts(remaining)
                        }
                    } catch {}
                }
            }
        ])
    }

    async function handleReport(postId, reason) {
        try {
            await client.post(`/posts/${postId}/report/`, { reason }, { headers })
            Alert.alert('Signalement envoyé', 'Merci. Notre équipe va examiner ce contenu.')
        } catch {}
    }

    function handleCommentCountChange(postId, delta) {
        setPosts(prev => prev.map(p =>
            p.id === postId ? { ...p, comments_count: Math.max(0, (p.comments_count ?? 0) + delta) } : p
        ))
    }

    return (
        <View style={{ flex: 1, backgroundColor: '#0E0B0A' }}>
            <FlatList
                ref={flatRef}
                data={posts}
                keyExtractor={item => item.id.toString()}
                renderItem={({ item, index }) => (
                    <PostCard
                        post={item}
                        onLike={handleLike}
                        onOpenComments={setCommentPostId}
                        onDelete={handleDelete}
                        onReport={handleReport}
                        currentUserId={user?.id}
                        navigation={navigation}
                        isActive={index === activeIndex}
                        onBack={() => navigation.goBack()}
                    />
                )}
                onViewableItemsChanged={onViewableItemsChanged.current}
                viewabilityConfig={viewabilityConfig.current}
                snapToInterval={SCREEN_HEIGHT}
                decelerationRate="fast"
                showsVerticalScrollIndicator={false}
                getItemLayout={(_, index) => ({
                    length: SCREEN_HEIGHT,
                    offset: SCREEN_HEIGHT * index,
                    index,
                })}
            />
            <CommentsModal
                visible={commentPostId !== null}
                postId={commentPostId}
                onClose={() => setCommentPostId(null)}
                token={token}
                currentUsername={user?.username}
                currentUserId={user?.id}
                onCommentCountChange={handleCommentCountChange}
            />
        </View>
    )
}

const styles = StyleSheet.create({
    card: { width: SCREEN_WIDTH, backgroundColor: '#0E0B0A' },

    dotsContainer: {
        position: 'absolute', top: 80,
        flexDirection: 'row', alignSelf: 'center', gap: 5,
    },
    dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.4)' },
    dotActive: { backgroundColor: '#fff', width: 18 },

    topBar: {
        position: 'absolute', top: 0, left: 0, right: 0,
        flexDirection: 'row', alignItems: 'center',
        paddingHorizontal: 16, gap: 12,
    },
    backBtn: {
        width: 38, height: 38, borderRadius: 19,
        backgroundColor: 'rgba(14,11,10,0.4)',
        justifyContent: 'center', alignItems: 'center',
    },
    logoGroup: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, justifyContent: 'center' },
    logoText: {
        fontFamily: 'Anton_400Regular', fontSize: 18, color: '#fff', letterSpacing: 1,
    },
    topAction: {
        width: 38, height: 38, borderRadius: 19,
        backgroundColor: 'rgba(14,11,10,0.4)',
        justifyContent: 'center', alignItems: 'center',
    },

    actions: {
        position: 'absolute', right: 16,
        flexDirection: 'column', alignItems: 'center', gap: 20,
    },
    actionBtn: { alignItems: 'center', gap: 4 },
    actionCircle: {
        width: 48, height: 48, borderRadius: 24,
        backgroundColor: 'rgba(255,255,255,0.15)',
        justifyContent: 'center', alignItems: 'center',
    },
    actionCircleLiked: { backgroundColor: 'rgba(228,0,43,0.2)' },
    actionCount: {
        fontFamily: 'PlusJakartaSans_700Bold', fontSize: 13, color: '#fff',
    },

    info: {
        position: 'absolute', left: 16,
        flexDirection: 'column', gap: 6,
    },
    authorRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    avatar: {
        width: 36, height: 36, borderRadius: 18,
        backgroundColor: '#F5C518',
        justifyContent: 'center', alignItems: 'center',
        borderWidth: 2, borderColor: 'rgba(255,255,255,0.3)',
    },
    avatarText: { fontFamily: 'PlusJakartaSans_800ExtraBold', fontSize: 14, color: '#1A1614' },
    author: { fontFamily: 'PlusJakartaSans_700Bold', fontSize: 15, color: '#fff' },
    caption: { fontFamily: 'PlusJakartaSans_400Regular', fontSize: 13, color: 'rgba(255,255,255,0.85)', lineHeight: 18 },
    matchPill: {
        flexDirection: 'row', alignItems: 'center', gap: 5,
        backgroundColor: 'rgba(14,11,10,0.55)', borderRadius: 20,
        paddingHorizontal: 10, paddingVertical: 4, alignSelf: 'flex-start',
    },
    matchPillText: { fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 11, color: '#F5C518' },

    // Modal commentaires
    modalOverlay: { flex: 1 },
    modalSheet: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        maxHeight: SCREEN_HEIGHT * 0.75,
    },
    modalHandle: {
        width: 40, height: 4, borderRadius: 2,
        backgroundColor: '#E0DBDA',
        alignSelf: 'center', marginTop: 10, marginBottom: 4,
    },
    modalTitle: {
        fontFamily: 'Anton_400Regular', fontSize: 20, color: '#1A1614',
        paddingHorizontal: 16, paddingVertical: 10,
    },
    modalEmpty: {
        fontFamily: 'PlusJakartaSans_400Regular', fontSize: 14, color: '#A8A29B',
        textAlign: 'center', paddingVertical: 32,
    },
    commentRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
    commentAvatar: {
        width: 34, height: 34, borderRadius: 17,
        backgroundColor: '#F5C518',
        justifyContent: 'center', alignItems: 'center',
        overflow: 'hidden',
    },
    commentAvatarText: { fontFamily: 'PlusJakartaSans_700Bold', fontSize: 13, color: '#1A1614' },
    commentBubble: {
        flex: 1, backgroundColor: '#F6F3EE', borderRadius: 12, padding: 10, gap: 2,
    },
    commentAuthor: { fontFamily: 'PlusJakartaSans_700Bold', fontSize: 12, color: '#1A1614' },
    commentContent: { fontFamily: 'PlusJakartaSans_400Regular', fontSize: 14, color: '#1A1614' },
    commentActions: { flexDirection: 'column', alignItems: 'center', gap: 6, paddingTop: 4 },
    commentLikeBtn: { alignItems: 'center', gap: 2 },
    commentLikeCount: { fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 10, color: '#A8A29B' },
    commentActionBtn: { padding: 2 },
    inputBar: {
        flexDirection: 'row', alignItems: 'center', gap: 10,
        backgroundColor: '#fff', paddingHorizontal: 16, paddingTop: 10,
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
