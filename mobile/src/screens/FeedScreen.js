import React, { useCallback, useState, useEffect, useRef } from 'react'
import { useFocusEffect } from '@react-navigation/native'
import {
    View, Text, FlatList, Image, TouchableOpacity,
    StyleSheet, ActivityIndicator, Dimensions,
    Modal, TextInput, Platform, Alert, Keyboard
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { LinearGradient } from 'expo-linear-gradient'
import { Ionicons } from '@expo/vector-icons'
import { VideoView, useVideoPlayer } from 'expo-video'
import OccitanCross from '../components/OccitanCross'
import client from '../api/client'
import { useAuth } from '../context/AuthContext'

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get('window')

const CARD_HEIGHT = SCREEN_HEIGHT

// --- Lecteur vidéo natif avec expo-video ---
// isActive = false → on met en pause (scroll ou changement d'onglet)
function VideoItem({ uri, width, height, isActive }) {
    const player = useVideoPlayer(uri, p => {
        p.loop = true
    })

    useEffect(() => {
        if (isActive) {
            player.play()
        } else {
            player.pause()
        }
    }, [isActive])

    return (
        <VideoView
            player={player}
            style={{ width, height }}
            contentFit="contain"
            nativeControls={false}
        />
    )
}

function PostCard({ post, onLike, onComment, onDelete, onReport, currentUserId, navigation, itemHeight, isActive }) {
    const medias = post.medias || []
    const [currentIndex, setCurrentIndex] = useState(0)

    // --- État local du like pour afficher le cœur rouge immédiatement ---
    const [liked, setLiked] = useState(post.is_liked ?? false)
    const [likesCount, setLikesCount] = useState(post.likes_count)

    function handleLikePress() {
        // Mise à jour optimiste : on change l'affichage avant la réponse API
        const wasLiked = liked
        setLiked(!wasLiked)
        setLikesCount(prev => wasLiked ? prev - 1 : prev + 1)
        onLike(post.id)
    }

    return (
        <View style={[styles.card, { height: itemHeight }]}>
            <FlatList
                data={medias.length > 0 ? medias : [null]}
                horizontal
                pagingEnabled
                scrollEnabled={medias.length > 1}
                showsHorizontalScrollIndicator={false}
                keyExtractor={(item, index) => String(index)}
                onScroll={(e) => {
                    const idx = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH)
                    setCurrentIndex(idx)
                }}
                scrollEventThrottle={16}
                renderItem={({ item }) => {
                    if (!item) return (
                        <View style={{ width: SCREEN_WIDTH, height: itemHeight, backgroundColor: '#1A1614' }} />
                    )
                    if (item.media_type === 'photo') {
                        return (
                            // Style TikTok : photo entière + fond flouté derrière
                            <View style={{ width: SCREEN_WIDTH, height: itemHeight, backgroundColor: '#0E0B0A' }}>
                                {/* Fond : même image en cover + flou */}
                                <Image
                                    source={{ uri: item.media_url }}
                                    style={{ ...StyleSheet.absoluteFillObject }}
                                    resizeMode="cover"
                                    blurRadius={18}
                                />
                                {/* Photo complète par-dessus en contain */}
                                <Image
                                    source={{ uri: item.media_url }}
                                    style={{ width: SCREEN_WIDTH, height: itemHeight }}
                                    resizeMode="contain"
                                />
                            </View>
                        )
                    }
                    return <VideoItem uri={item.media_url} width={SCREEN_WIDTH} height={itemHeight} isActive={isActive} />
                }}
            />

            <LinearGradient
                colors={['rgba(14,11,10,0.55)', 'transparent', 'rgba(14,11,10,0.85)']}
                locations={[0, 0.25, 1]}
                style={styles.overlay}
            />

            {medias.length > 1 && (
                <View style={styles.dotsContainer}>
                    {medias.map((_, i) => (
                        <View key={i} style={[styles.dot, i === currentIndex && styles.dotActive]} />
                    ))}
                </View>
            )}

            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.navigate('Search')} style={styles.searchBtn}>
                    <Ionicons name="search-outline" size={22} color="#fff" />
                </TouchableOpacity>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Text style={styles.logoText}>FOOT CONNECT</Text>
                    <OccitanCross size={20} color="#F5C518" />
                </View>
                {currentUserId && post.author_id === currentUserId ? (
                    <TouchableOpacity
                        style={styles.deleteBtn}
                        onPress={() => onDelete(post.id)}
                    >
                        <Ionicons name="trash-outline" size={20} color="#fff" />
                    </TouchableOpacity>
                ) : currentUserId && post.author_id !== currentUserId ? (
                    <TouchableOpacity
                        style={styles.deleteBtn}
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
                ) : null}
            </View>

            <View style={styles.actions}>
                <TouchableOpacity style={styles.actionBtn} onPress={handleLikePress}>
                    <View style={[styles.actionCircle, liked && styles.actionCircleLiked]}>
                        {/* Cœur rouge si aimé, blanc sinon */}
                        <Ionicons name="heart" size={24} color={liked ? '#E4002B' : '#fff'} />
                    </View>
                    <Text style={styles.actionCount}>{likesCount}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionBtn} onPress={() => onComment(post.id)}>
                    <View style={styles.actionCircle}>
                        <Ionicons name="chatbubble-ellipses" size={22} color="#fff" />
                    </View>
                    <Text style={styles.actionCount}>{post.comments_count ?? 0}</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.info}>
                <TouchableOpacity
                    onPress={() => navigation.navigate('Profile', {
                        userId: post.author_id,
                        username: post.author_username
                    })}
                    style={{ alignSelf: 'flex-start' }}
                >
                    <View style={styles.authorRow}>
                        {post.author_avatar_url ? (
                            <Image source={{ uri: post.author_avatar_url }} style={styles.avatar} />
                        ) : (
                            <View style={styles.avatar}>
                                <Text style={styles.avatarText}>
                                    {post.author_username?.[0]?.toUpperCase()}
                                </Text>
                            </View>
                        )}
                        <Text style={styles.author}>{post.author_username}</Text>
                    </View>
                </TouchableOpacity>
                {post.caption ? (
                    <Text style={styles.caption}>{post.caption}</Text>
                ) : null}
                {post.match_info && (
                    <View style={styles.matchPill}>
                        <Text style={styles.matchPillText}>
                            {post.match_info.home_team} · {post.match_info.away_team}
                        </Text>
                    </View>
                )}
            </View>
        </View>
    )
}

export default function FeedScreen({ navigation }) {
    const { token } = useAuth()
    const insets = useSafeAreaInsets()
    const [posts, setPosts] = useState([])
    const [loading, setLoading] = useState(true)
    const headers = { Authorization: `Bearer ${token}` }
    const [itemHeight, setItemHeight] = useState(CARD_HEIGHT)
    const [activeIndex, setActiveIndex] = useState(0)
    const [screenFocused, setScreenFocused] = useState(true)
    const viewabilityConfig = useRef({ viewAreaCoveragePercentThreshold: 60 })
    const onViewableItemsChanged = useRef(({ viewableItems }) => {
        if (viewableItems.length > 0) setActiveIndex(viewableItems[0].index)
    })
    const [commentPostId, setCommentPostId] = useState(null)
    const [comments, setComments] = useState([])
    const [commentText, setCommentText] = useState('')
    const [replyingTo, setReplyingTo] = useState(null) // { id, username }
    const commentInputRef = useRef(null)
    const [currentUsername, setCurrentUsername] = useState('')
    const [currentUserId, setCurrentUserId] = useState(null)
    const [keyboardOffset, setKeyboardOffset] = useState(0)

    useEffect(() => {
        client.get('/auth/me/', { headers }).then(res => {
            setCurrentUsername(res.data.username)
            setCurrentUserId(res.data.id)
        }).catch(() => {})
    }, [token])

    useEffect(() => {
        const show = Keyboard.addListener('keyboardDidShow', e => setKeyboardOffset(e.endCoordinates.height))
        const hide = Keyboard.addListener('keyboardDidHide', () => setKeyboardOffset(0))
        return () => { show.remove(); hide.remove() }
    }, [])

    useFocusEffect(
        useCallback(() => {
            setScreenFocused(true)
            setLoading(true)
            client.get('/feed/', { headers })
                .then(res => setPosts(res.data))
                .catch(() => {})
                .finally(() => setLoading(false))
            // Quand on quitte l'onglet, on met les vidéos en pause
            return () => setScreenFocused(false)
        }, [token])
    )

    async function openComments(postId) {
        setCommentPostId(postId)
        setComments([])
        setCommentText('')
        try {
            const res = await client.get(`/posts/${postId}/comments/`, { headers })
            setComments(res.data)
        } catch {}
    }

    function closeComments() {
        Keyboard.dismiss()
        setCommentPostId(null)
        setReplyingTo(null)
    }

    function handleReply(comment) {
        setReplyingTo({ id: comment.id, username: comment.author_username })
        setCommentText(`@${comment.author_username} `)
        setTimeout(() => commentInputRef.current?.focus(), 100)
    }

    async function sendComment() {
        const content = commentText.trim()
        if (!content) return
        setCommentText('')
        const parentId = replyingTo?.id || null
        setReplyingTo(null)
        Keyboard.dismiss()
        try {
            const body = { content }
            if (parentId) body.parent_id = parentId
            const res = await client.post(`/posts/${commentPostId}/comments/`, body, { headers })
            if (parentId) {
                // Ajouter la réponse dans le commentaire parent local
                setComments(prev => prev.map(c =>
                    c.id === parentId
                        ? { ...c, replies: [...(c.replies || []), res.data] }
                        : c
                ))
            } else {
                setComments(prev => [...prev, res.data])
            }
            setPosts(prev => prev.map(p =>
                p.id === commentPostId ? { ...p, comments_count: (p.comments_count ?? 0) + 1 } : p
            ))
        } catch {}
    }

    async function deleteComment(commentId) {
        Alert.alert('Supprimer', 'Supprimer ce commentaire ?', [
            { text: 'Annuler', style: 'cancel' },
            {
                text: 'Supprimer', style: 'destructive', onPress: async () => {
                    try {
                        await client.delete(`/posts/${commentPostId}/comments/${commentId}/`, { headers })
                        setComments(prev => {
                            // Commentaire de premier niveau
                            const filtered = prev.filter(c => c.id !== commentId)
                            if (filtered.length < prev.length) return filtered
                            // C'est une réponse — la retirer du tableau replies du parent
                            return prev.map(c => ({
                                ...c,
                                replies: (c.replies || []).filter(r => r.id !== commentId)
                            }))
                        })
                        setPosts(prev => prev.map(p =>
                            p.id === commentPostId ? { ...p, comments_count: Math.max(0, (p.comments_count ?? 0) - 1) } : p
                        ))
                    } catch {}
                }
            }
        ])
    }

    async function handleLikeComment(commentId) {
        try {
            const res = await client.post(`/comments/${commentId}/like/`, {}, { headers })
            setComments(prev => prev.map(c => {
                if (c.id === commentId) {
                    return { ...c, is_liked: res.data.liked, likes_count: res.data.likes_count }
                }
                // Chercher dans les replies
                if (c.replies?.some(r => r.id === commentId)) {
                    return {
                        ...c,
                        replies: c.replies.map(r =>
                            r.id === commentId
                                ? { ...r, is_liked: res.data.liked, likes_count: res.data.likes_count }
                                : r
                        )
                    }
                }
                return c
            }))
        } catch {}
    }

    function handleReportComment(commentId) {
        Alert.alert(
            'Signaler ce commentaire',
            'Pourquoi signales-tu ce commentaire ?',
            [
                { text: 'Annuler', style: 'cancel' },
                {
                    text: 'Spam',
                    onPress: async () => {
                        try {
                            await client.post(`/comments/${commentId}/report/`, { reason: 'spam' }, { headers })
                            Alert.alert('Signalement envoyé', 'Merci. Notre équipe va examiner ce commentaire.')
                        } catch {}
                    }
                },
                {
                    text: 'Contenu inapproprié',
                    onPress: async () => {
                        try {
                            await client.post(`/comments/${commentId}/report/`, { reason: 'inappropriate' }, { headers })
                            Alert.alert('Signalement envoyé', 'Merci. Notre équipe va examiner ce commentaire.')
                        } catch {}
                    }
                },
            ]
        )
    }

    async function handleLike(postId) {
        try {
            await client.post(`/posts/${postId}/like/`, {}, { headers })
        } catch {}
    }

    async function handleReportPost(postId, reason) {
        try {
            await client.post(`/posts/${postId}/report/`, { reason }, { headers })
            Alert.alert('Signalement envoyé', 'Merci. Notre équipe va examiner ce contenu sous 24h.')
        } catch {
            Alert.alert('Erreur', 'Impossible d\'envoyer le signalement.')
        }
    }

    async function handleDeletePost(postId) {
        Alert.alert('Supprimer', 'Supprimer cette publication ?', [
            { text: 'Annuler', style: 'cancel' },
            {
                text: 'Supprimer', style: 'destructive', onPress: async () => {
                    try {
                        await client.delete(`/posts/${postId}/`, { headers })
                        setPosts(prev => prev.filter(p => p.id !== postId))
                    } catch {}
                }
            }
        ])
    }

    if (loading) return (
        <View style={styles.loading}>
            <ActivityIndicator color="#E4002B" size="large" />
        </View>
    )

    if (posts.length === 0) return (
        <View style={styles.empty}>
            <Text style={styles.emptyText}>Aucune publication pour l'instant.</Text>
        </View>
    )

    return (
        <>
        <FlatList
            data={posts}
            keyExtractor={item => item.id.toString()}
            renderItem={({ item, index }) => (
                <PostCard
                    post={item}
                    token={token}
                    onLike={handleLike}
                    onComment={openComments}
                    onDelete={handleDeletePost}
                    onReport={handleReportPost}
                    currentUserId={currentUserId}
                    navigation={navigation}
                    itemHeight={itemHeight}
                    isActive={index === activeIndex && screenFocused}
                />
            )}
            onLayout={(e) => setItemHeight(e.nativeEvent.layout.height)}
            onViewableItemsChanged={onViewableItemsChanged.current}
            viewabilityConfig={viewabilityConfig.current}
            pagingEnabled
            showsVerticalScrollIndicator={false}
            removeClippedSubviews
            windowSize={3}
            maxToRenderPerBatch={2}
            initialNumToRender={1}
        />

        <Modal
            visible={commentPostId !== null}
            animationType="slide"
            transparent
            onRequestClose={closeComments}
        >
            <View style={{ flex: 1, justifyContent: 'flex-end' }}>
            <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={closeComments} />
            <View style={[styles.modalSheet, { paddingBottom: keyboardOffset > 0 ? keyboardOffset : 0 }]}>
                <View style={styles.modalHandle} />
                <Text style={styles.modalTitle}>Commentaires</Text>
                <FlatList
                    data={comments}
                    keyExtractor={item => item.id.toString()}
                    keyboardShouldPersistTaps="handled"
                    contentContainerStyle={{ padding: 16, gap: 12 }}
                    ListEmptyComponent={
                        <Text style={styles.modalEmpty}>Sois le premier à commenter</Text>
                    }
                    renderItem={({ item }) => (
                        <View>
                            {/* Commentaire principal */}
                            <View style={styles.commentRow}>
                                <TouchableOpacity onPress={() => navigation.navigate('Profile', { userId: item.author_id, username: item.author_username })}>
                                    {item.author_avatar_url ? (
                                        <Image source={{ uri: item.author_avatar_url }} style={styles.commentAvatar} />
                                    ) : (
                                        <View style={styles.commentAvatar}>
                                            <Text style={styles.commentAvatarText}>{item.author_username?.[0]?.toUpperCase()}</Text>
                                        </View>
                                    )}
                                </TouchableOpacity>
                                <View style={styles.commentBubble}>
                                    <TouchableOpacity onPress={() => navigation.navigate('Profile', { userId: item.author_id, username: item.author_username })}>
                                        <Text style={styles.commentAuthor}>{item.author_username}</Text>
                                    </TouchableOpacity>
                                    <Text style={styles.commentContent}>{item.content}</Text>
                                    <View style={styles.commentFooter}>
                                        <TouchableOpacity onPress={() => handleLikeComment(item.id)} style={styles.commentLikeBtn}>
                                            <Ionicons name={item.is_liked ? 'football' : 'football-outline'} size={20} color={item.is_liked ? '#E4002B' : '#A8A29B'} />
                                            {(item.likes_count ?? 0) > 0 && (
                                                <Text style={[styles.commentLikeCount, item.is_liked && { color: '#E4002B' }]}>{item.likes_count}</Text>
                                            )}
                                        </TouchableOpacity>
                                        <TouchableOpacity onPress={() => handleReply(item)} style={styles.replyBtn}>
                                            <Text style={styles.replyBtnText}>Répondre</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                                <View style={styles.commentActions}>
                                    {item.author_username === currentUsername ? (
                                        <TouchableOpacity onPress={() => deleteComment(item.id)} style={styles.commentActionBtn}>
                                            <Ionicons name="trash-outline" size={20} color="#A8A29B" />
                                        </TouchableOpacity>
                                    ) : (
                                        <TouchableOpacity onPress={() => handleReportComment(item.id)} style={styles.commentActionBtn}>
                                            <Ionicons name="flag-outline" size={20} color="#A8A29B" />
                                        </TouchableOpacity>
                                    )}
                                </View>
                            </View>

                            {/* Réponses indentées */}
                            {(item.replies || []).map(reply => (
                                <View key={reply.id} style={[styles.commentRow, styles.replyRow]}>
                                    <TouchableOpacity onPress={() => navigation.navigate('Profile', { userId: reply.author_id, username: reply.author_username })}>
                                        {reply.author_avatar_url ? (
                                            <Image source={{ uri: reply.author_avatar_url }} style={[styles.commentAvatar, styles.replyAvatar]} />
                                        ) : (
                                            <View style={[styles.commentAvatar, styles.replyAvatar]}>
                                                <Text style={styles.commentAvatarText}>{reply.author_username?.[0]?.toUpperCase()}</Text>
                                            </View>
                                        )}
                                    </TouchableOpacity>
                                    <View style={[styles.commentBubble, styles.replyBubble]}>
                                        <TouchableOpacity onPress={() => navigation.navigate('Profile', { userId: reply.author_id, username: reply.author_username })}>
                                            <Text style={styles.commentAuthor}>{reply.author_username}</Text>
                                        </TouchableOpacity>
                                        <Text style={styles.commentContent}>{reply.content}</Text>
                                        <TouchableOpacity onPress={() => handleLikeComment(reply.id)} style={styles.commentLikeBtn}>
                                            <Ionicons name={reply.is_liked ? 'football' : 'football-outline'} size={16} color={reply.is_liked ? '#E4002B' : '#A8A29B'} />
                                            {(reply.likes_count ?? 0) > 0 && (
                                                <Text style={[styles.commentLikeCount, reply.is_liked && { color: '#E4002B' }]}>{reply.likes_count}</Text>
                                            )}
                                        </TouchableOpacity>
                                    </View>
                                    <View style={styles.commentActions}>
                                        {reply.author_username === currentUsername ? (
                                            <TouchableOpacity onPress={() => deleteComment(reply.id)} style={styles.commentActionBtn}>
                                                <Ionicons name="trash-outline" size={16} color="#A8A29B" />
                                            </TouchableOpacity>
                                        ) : (
                                            <TouchableOpacity onPress={() => handleReportComment(reply.id)} style={styles.commentActionBtn}>
                                                <Ionicons name="flag-outline" size={16} color="#A8A29B" />
                                            </TouchableOpacity>
                                        )}
                                    </View>
                                </View>
                            ))}
                        </View>
                    )}
                />
                {replyingTo && (
                    <View style={styles.replyingToBar}>
                        <Text style={styles.replyingToText}>↩ En réponse à <Text style={{ color: '#E4002B' }}>@{replyingTo.username}</Text></Text>
                        <TouchableOpacity onPress={() => { setReplyingTo(null); setCommentText('') }}>
                            <Ionicons name="close-circle" size={16} color="#A8A29B" />
                        </TouchableOpacity>
                    </View>
                )}
                <View style={[styles.commentInputRow, { paddingBottom: Math.max(insets.bottom, 10) }]}>
                    <TextInput
                        ref={commentInputRef}
                        style={styles.commentInput}
                        placeholder={replyingTo ? `Répondre à @${replyingTo.username}...` : 'Ajouter un commentaire...'}
                        placeholderTextColor="#A8A29B"
                        value={commentText}
                        onChangeText={setCommentText}
                        multiline
                        returnKeyType="send"
                        onSubmitEditing={sendComment}
                        blurOnSubmit
                    />
                    <TouchableOpacity style={styles.commentSendBtn} onPress={sendComment}>
                        <Ionicons name="send" size={18} color="#fff" />
                    </TouchableOpacity>
                </View>
            </View>
            </View>
        </Modal>
        </>
    )
}

const styles = StyleSheet.create({
    loading: {
        flex: 1,
        backgroundColor: '#0E0B0A',
        justifyContent: 'center',
        alignItems: 'center',
    },
    empty: {
        flex: 1,
        backgroundColor: '#0E0B0A',
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyText: {
        color: '#fff',
        fontFamily: 'PlusJakartaSans_400Regular',
        fontSize: 16,
    },
    card: {
        width: SCREEN_WIDTH,
        height: CARD_HEIGHT,
        backgroundColor: '#0E0B0A',
    },
    overlay: {
        ...StyleSheet.absoluteFillObject,
    },
    header: {
        position: 'absolute',
        top: 52,
        left: 0,
        right: 0,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    logoText: {
        fontFamily: 'Anton_400Regular',
        fontSize: 15,
        color: '#fff',
    },
    searchBtn: {
        position: 'absolute',
        left: 16,
        top: 0,
        padding: 6,
    },
    deleteBtn: {
        position: 'absolute',
        right: 16,
        top: 0,
        padding: 6,
    },
    actions: {
        position: 'absolute',
        right: 16,
        bottom: 180,
        alignItems: 'center',
        gap: 22,
    },
    actionBtn: {
        alignItems: 'center',
        gap: 4,
    },
    actionCircle: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    actionCircleLiked: {
        backgroundColor: 'rgba(228,0,43,0.2)',
    },
    actionCount: {
        color: '#fff',
        fontFamily: 'PlusJakartaSans_700Bold',
        fontSize: 13,
    },
    info: {
        position: 'absolute',
        bottom: 150,
        left: 16,
        right: 80,
    },
    authorRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 6,
    },
    avatar: {
        width: 38,
        height: 38,
        borderRadius: 19,
        backgroundColor: '#F5C518',
        borderWidth: 2,
        borderColor: '#F5C518',
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarText: {
        fontFamily: 'PlusJakartaSans_800ExtraBold',
        fontSize: 16,
        color: '#1A1614',
    },
    author: {
        fontFamily: 'PlusJakartaSans_700Bold',
        fontSize: 15,
        color: '#fff',
    },
    caption: {
        fontFamily: 'PlusJakartaSans_400Regular',
        fontSize: 14,
        color: '#fff',
        marginBottom: 8,
    },
    matchPill: {
        backgroundColor: 'rgba(228,0,43,0.85)',
        borderRadius: 999,
        paddingHorizontal: 12,
        paddingVertical: 4,
        alignSelf: 'flex-start',
    },
    matchPillText: {
        fontFamily: 'PlusJakartaSans_700Bold',
        fontSize: 12,
        color: '#fff',
    },
    dotsContainer: {
        position: 'absolute',
        top: 106,
        left: 0,
        right: 0,
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 5,
    },
    dot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: 'rgba(255,255,255,0.85)',
    },
    dotActive: {
        width: 24,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#fff',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    modalSheet: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        maxHeight: SCREEN_HEIGHT * 0.75,
    },
    modalHandle: {
        width: 40,
        height: 4,
        borderRadius: 2,
        backgroundColor: '#E0DDD9',
        alignSelf: 'center',
        marginTop: 12,
        marginBottom: 4,
    },
    modalTitle: {
        fontFamily: 'Anton_400Regular',
        fontSize: 20,
        color: '#1A1614',
        textAlign: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#F4F1EC',
    },
    modalEmpty: {
        fontFamily: 'PlusJakartaSans_400Regular',
        fontSize: 14,
        color: '#A8A29B',
        textAlign: 'center',
        paddingTop: 24,
    },
    commentRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 10,
    },
    commentAvatar: {
        width: 34,
        height: 34,
        borderRadius: 17,
        backgroundColor: '#F5C518',
        justifyContent: 'center',
        alignItems: 'center',
    },
    commentAvatarText: {
        fontFamily: 'PlusJakartaSans_800ExtraBold',
        fontSize: 13,
        color: '#1A1614',
    },
    commentBubble: {
        flex: 1,
        backgroundColor: '#F6F3EE',
        borderRadius: 14,
        padding: 10,
    },
    commentAuthor: {
        fontFamily: 'PlusJakartaSans_700Bold',
        fontSize: 13,
        color: '#1A1614',
        marginBottom: 2,
    },
    commentContent: {
        fontFamily: 'PlusJakartaSans_400Regular',
        fontSize: 14,
        color: '#1A1614',
    },
    commentActions: {
        flexDirection: 'column', alignItems: 'center', gap: 6, paddingTop: 2,
    },
    commentFooter: {
        flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 6,
    },
    commentLikeBtn: {
        flexDirection: 'row', alignItems: 'center', gap: 4,
    },
    replyBtn: { paddingVertical: 2 },
    replyBtnText: {
        fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 12, color: '#A8A29B',
    },
    replyRow: { marginLeft: 44, marginTop: 6 },
    replyAvatar: { width: 28, height: 28, borderRadius: 14 },
    replyBubble: { backgroundColor: '#EDE9E4' },
    replyingToBar: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 16, paddingVertical: 6,
        backgroundColor: '#F4F1EC',
        borderTopWidth: 1, borderTopColor: '#EDE9E4',
    },
    replyingToText: {
        fontFamily: 'PlusJakartaSans_400Regular', fontSize: 12, color: '#5C564F',
    },
    commentLikeCount: {
        fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 10, color: '#A8A29B',
    },
    commentActionBtn: { padding: 2 },
    commentInputRow: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        gap: 8,
        paddingHorizontal: 16,
        paddingTop: 8,
        borderTopWidth: 1,
        borderTopColor: '#F4F1EC',
    },
    commentInput: {
        flex: 1,
        backgroundColor: '#F4F1EC',
        borderRadius: 22,
        paddingHorizontal: 16,
        paddingVertical: 10,
        fontFamily: 'PlusJakartaSans_400Regular',
        fontSize: 14,
        color: '#1A1614',
        maxHeight: 80,
    },
    commentSendBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#E4002B',
        justifyContent: 'center',
        alignItems: 'center',
    },
})
