import React from 'react'
import {
    View, Text, Image, StyleSheet, ScrollView,
    TouchableOpacity, Dimensions
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { VideoView, useVideoPlayer } from 'expo-video'

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

export default function PostDetailScreen({ route, navigation }) {
    const { post } = route.params

    return (
        <ScrollView style={styles.screen} bounces={false}>
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

                {/* Stats */}
                <View style={styles.statsRow}>
                    <View style={styles.stat}>
                        <Ionicons name="heart" size={18} color="#E4002B" />
                        <Text style={styles.statText}>{post.likes_count}</Text>
                    </View>
                    <View style={styles.stat}>
                        <Ionicons name="chatbubble-outline" size={18} color="#5C564F" />
                        <Text style={styles.statText}>{post.comments_count}</Text>
                    </View>
                </View>
            </View>
        </ScrollView>
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
    statsRow: { flexDirection: 'row', gap: 20, marginTop: 4 },
    stat: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    statText: { fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 14, color: '#5C564F' },
})
