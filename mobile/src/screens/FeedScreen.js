import React, { useCallback, useState, useEffect } from 'react'
import { useFocusEffect } from '@react-navigation/native'
import {
    View, Text, FlatList, Image, TouchableOpacity,
    StyleSheet, ActivityIndicator, Dimensions,
    Modal, TextInput, KeyboardAvoidingView, Platform, Alert, Keyboard
} from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { Ionicons } from '@expo/vector-icons'
import { VideoView, useVideoPlayer } from 'expo-video'
import OccitanCross from '../components/OccitanCross'
import client from '../api/client'
import { useAuth } from '../context/AuthContext'

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get('window')

const TAB_BAR_HEIGHT = 80
const CARD_HEIGHT = SCREEN_HEIGHT - TAB_BAR_HEIGHT

// --- Lecteur vidéo natif avec expo-video ---
function VideoItem({ uri, width, height }) {
    const player = useVideoPlayer(uri, p => {
        p.loop = true
    })
    return (
        <VideoView
            player={player}
            style={{ width, height }}
            contentFit="contain"
            nativeControls
        />
    )
}

function PostCard({ post, onLike, onComment, navigation, itemHeight }) {
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
                            // fond noir + contain pour voir la photo complète sans zoom
                            <View style={{ width: SCREEN_WIDTH, height: itemHeight, backgroundColor: '#0E0B0A' }}>
                                <Image
                                    source={{ uri: item.media_url }}
                                    style={{ width: SCREEN_WIDTH, height: itemHeight }}
                                    resizeMode="contain"
                                />
                            </View>
                        )
                    }
                    return <VideoItem uri={item.media_url} width={SCREEN_WIDTH} height={itemHeight} />
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
                <OccitanCross size={28} color="#F5C518" />
                <Text style={styles.logoText}>FOOT CONNECT</Text>
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
                <TouchableOpacity onPress={() => navigation.navigate('Profile', {
                    userId: post.author_id,
                    username: post.author_username
                })}>
                    <View style={styles.authorRow}>
                        <View style={styles.avatar}>
                            <Text style={styles.avatarText}>
                                {post.author_username?.[0]?.toUpperCase()}
                            </Text>
                        </View>
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
    const [posts, setPosts] = useState([])
    const [loading, setLoading] = useState(true)
    const headers = { Authorization: `Bearer ${token}` }
    const [itemHeight, setItemHeight] = useState(SCREEN_HEIGHT - TAB_BAR_HEIGHT)
    const [commentPostId, setCommentPostId] = useState(null)
    const [comments, setComments] = useState([])
    const [commentText, setCommentText] = useState('')
    const [currentUsername, setCurrentUsername] = useState('')

    useEffect(() => {
        client.get('/auth/me/', { headers }).then(res => setCurrentUsername(res.data.username)).catch(() => {})
    }, [token])

    useFocusEffect(
        useCallback(() => {
            setLoading(true)
            client.get('/feed/', { headers })
                .then(res => setPosts(res.data))
                .catch(() => {})
                .finally(() => setLoading(false))
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
    }

    async function sendComment() {
        const content = commentText.trim()
        if (!content) return
        setCommentText('')
        Keyboard.dismiss() // ferme le clavier après envoi
        try {
            const res = await client.post(`/posts/${commentPostId}/comments/`, { content }, { headers })
            setComments(prev => [...prev, res.data])
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
                        setComments(prev => prev.filter(c => c.id !== commentId))
                        setPosts(prev => prev.map(p =>
                            p.id === commentPostId ? { ...p, comments_count: Math.max(0, (p.comments_count ?? 0) - 1) } : p
                        ))
                    } catch {}
                }
            }
        ])
    }

    async function handleLike(postId) {
        try {
            await client.post(`/posts/${postId}/like/`, {}, { headers })
        } catch {}
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
            renderItem={({ item }) => (
                <PostCard
                    post={item}
                    token={token}
                    onLike={handleLike}
                    onComment={openComments}
                    navigation={navigation}
                    itemHeight={itemHeight}
                />
            )}
            onLayout={(e) => setItemHeight(e.nativeEvent.layout.height)}
            snapToInterval={itemHeight}
            decelerationRate="fast"
            showsVerticalScrollIndicator={false}
        />

        <Modal
            visible={commentPostId !== null}
            animationType="slide"
            transparent
            onRequestClose={closeComments}
        >
            {/* Toucher en dehors ferme le modal ET le clavier */}
            <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={closeComments} />

            {/* behavior="padding" fonctionne sur Android ET iOS */}
            <KeyboardAvoidingView
                behavior="padding"
                keyboardVerticalOffset={Platform.OS === 'android' ? 0 : 0}
                style={styles.modalSheet}
            >
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
                        <TouchableOpacity
                            onLongPress={item.author_username === currentUsername ? () => deleteComment(item.id) : null}
                            activeOpacity={1}
                        >
                            <View style={styles.commentRow}>
                                <View style={styles.commentAvatar}>
                                    <Text style={styles.commentAvatarText}>
                                        {item.author_username?.[0]?.toUpperCase()}
                                    </Text>
                                </View>
                                <View style={styles.commentBubble}>
                                    <Text style={styles.commentAuthor}>{item.author_username}</Text>
                                    <Text style={styles.commentContent}>{item.content}</Text>
                                </View>
                            </View>
                        </TouchableOpacity>
                    )}
                />
                <View style={styles.commentInputRow}>
                    <TextInput
                        style={styles.commentInput}
                        placeholder="Ajouter un commentaire..."
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
            </KeyboardAvoidingView>
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
    actions: {
        position: 'absolute',
        right: 16,
        bottom: 120,
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
        bottom: 90,
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
        backgroundColor: 'rgba(255,255,255,0.55)',
    },
    dotActive: {
        width: 20,
        height: 6,
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
        maxHeight: '70%',
        paddingBottom: 24,
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
