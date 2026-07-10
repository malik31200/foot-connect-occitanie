import React, { useState, useCallback } from 'react'
import { useFocusEffect } from '@react-navigation/native'
import {
    View, Text, TextInput, TouchableOpacity, Image,
    StyleSheet, ActivityIndicator, Alert, ScrollView
} from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { Ionicons } from '@expo/vector-icons'
import * as ImagePicker from 'expo-image-picker'
import client from '../api/client'
import { useAuth } from '../context/AuthContext'

const CLOUD_NAME = 'du7oifrll'
const UPLOAD_PRESET = 'foot_occitanie'

export default function PublishScreen() {
    const { token } = useAuth()
    const [assets, setAssets] = useState([])
    const [caption, setCaption] = useState('')
    const [matches, setMatches] = useState([])
    const [selectedMatch, setSelectedMatch] = useState(null)
    const [uploading, setUploading] = useState(false)
    const headers = { Authorization: `Bearer ${token}` }

    useFocusEffect(
        useCallback(() => {
            client.get('/matches/?season=2025', { headers })
                .then(res => setMatches(res.data.results || res.data))
                .catch(() => {})
        }, [token])
    )

    async function pickPhotos() {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsMultipleSelection: true,
            quality: 0.8,
        })
        if (!result.canceled) setAssets(result.assets)
    }

    async function pickVideo() {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Videos,
            allowsMultipleSelection: false,
            videoMaxDuration: 60,
        })
        if (!result.canceled) setAssets(result.assets)
    }

    async function uploadToCloudinary(uri, isVideo) {
        const formData = new FormData()
        formData.append('file', {
            uri,
            type: isVideo ? 'video/mp4' : 'image/jpeg',
            name: isVideo ? 'video.mp4' : 'photo.jpg',
        })
        formData.append('upload_preset', UPLOAD_PRESET)
        const endpoint = isVideo ? 'video' : 'image'
        const res = await fetch(
            `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/${endpoint}/upload`,
            { method: 'POST', body: formData },
        )
        const data = await res.json()
        if (!res.ok) throw new Error(data.error?.message || 'Upload échoué')
        return data.secure_url
    }


    async function handlePublish() {
        if (assets.length === 0) {
            Alert.alert('Erreur', 'Choisis au moins une photo ou une vidéo.')
            return
        }
        setUploading(true)
        try {
            const medias = []
            for (const asset of assets) {
                const isVideo = asset.type === 'video'
                const url = await uploadToCloudinary(asset.uri, isVideo)
                medias.push({
                    media_type: isVideo ? 'video' : 'photo',
                    media_url: url,
                })
            }

            await client.post('/posts/', {
                ...(selectedMatch ? { match_id: selectedMatch.id } : {}),
                caption,
                medias,
            }, { headers })
            Alert.alert('Publié !', 'Ta publication est en ligne.')
            setAssets([])
            setCaption('')
            setSelectedMatch(null)
        } catch (e) {
            const detail = e.response?.data?.error?.message || e.message || 'Impossible de publier.'
            Alert.alert('Erreur', detail)
        } finally {
            setUploading(false)
        }
    }


    return (
        <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>PUBLIER</Text>
            </View>

            {assets.length > 0 ? (
                <TouchableOpacity style={styles.imagePicker} onPress={assets[0].type === 'video' ? pickVideo : pickPhotos}>
                    {assets[0].type === 'video' ? (
                        <View style={[styles.preview, { backgroundColor: '#1A1614', justifyContent: 'center', alignItems: 'center' }]}>
                            <Ionicons name="play-circle" size={64} color="#F5C518" />
                            <Text style={{ color: '#fff', fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 14, marginTop: 10 }}>
                                Vidéo sélectionnée
                            </Text>
                        </View>
                    ) : (
                        <Image source={{ uri: assets[0].uri }} style={styles.preview} />
                    )}
                </TouchableOpacity>
            ) : (
                <View style={styles.pickerRow}>
                    <TouchableOpacity style={styles.pickerBtn} onPress={pickPhotos}>
                        <Ionicons name="images-outline" size={28} color="#E4002B" />
                        <Text style={styles.pickerBtnText}>Photos</Text>
                    </TouchableOpacity>
                    <View style={styles.pickerDivider} />
                    <TouchableOpacity style={styles.pickerBtn} onPress={pickVideo}>
                        <Ionicons name="videocam-outline" size={28} color="#E4002B" />
                        <Text style={styles.pickerBtnText}>Vidéo</Text>
                    </TouchableOpacity>
                </View>
            )}

            {assets.length > 1 && (
                <Text style={{ fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 13, color: '#5C564F', marginHorizontal: 16, marginBottom: 8 }}>
                    {assets.length} photos sélectionnées
                </Text>
            )}


            <View style={styles.inputWrapper}>
                <TextInput
                    style={styles.input}
                    placeholder="Décris le moment..."
                    placeholderTextColor="#A8A29B"
                    value={caption}
                    onChangeText={setCaption}
                    multiline
                />
            </View>

            {matches.length > 0 && (
                <>
                    <Text style={styles.label}>Match lié (optionnel)</Text>
                    {matches.slice(0, 10).map(match => (
                        <TouchableOpacity
                            key={match.id}
                            style={[
                                styles.matchItem,
                                selectedMatch?.id === match.id && styles.matchSelected
                            ]}
                            onPress={() => setSelectedMatch(
                                selectedMatch?.id === match.id ? null : match
                            )}
                        >
                            <Ionicons
                                name="football-outline"
                                size={16}
                                color={selectedMatch?.id === match.id ? '#fff' : '#5C564F'}
                            />
                            <Text style={[
                                styles.matchText,
                                selectedMatch?.id === match.id && styles.matchTextSelected
                            ]}>
                                {match.home_team?.name} · {match.away_team?.name}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </>
            )}

            <LinearGradient
                colors={['#E4002B', '#FF5A1F']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.btn}
            >
                <TouchableOpacity style={styles.btnInner} onPress={handlePublish} disabled={uploading}>
                    {uploading ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <>
                            <Ionicons name="cloud-upload-outline" size={20} color="#fff" />
                            <Text style={styles.btnText}>Publier</Text>
                        </>
                    )}
                </TouchableOpacity>
            </LinearGradient>
        </ScrollView>
    )
}

const styles = StyleSheet.create({
    screen: {
        flex: 1,
        backgroundColor: '#F6F3EE',
    },
    content: {
        paddingBottom: 40,
    },
    header: {
        backgroundColor: '#fff',
        paddingTop: 56,
        paddingBottom: 16,
        paddingHorizontal: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#F4F1EC',
        marginBottom: 20,
    },
    headerTitle: {
        fontFamily: 'Anton_400Regular',
        fontSize: 28,
        color: '#1A1614',
    },
    imagePicker: {
        marginHorizontal: 16,
        height: 220,
        backgroundColor: '#fff',
        borderRadius: 16,
        overflow: 'hidden',
        marginBottom: 16,
    },
    preview: {
        width: '100%',
        height: '100%',
    },
    pickerRow: {
        marginHorizontal: 16,
        height: 120,
        backgroundColor: '#fff',
        borderRadius: 16,
        flexDirection: 'row',
        marginBottom: 16,
        overflow: 'hidden',
    },
    pickerBtn: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
    },
    pickerBtnText: {
        fontFamily: 'PlusJakartaSans_700Bold',
        fontSize: 14,
        color: '#1A1614',
    },
    pickerDivider: {
        width: 1,
        backgroundColor: '#F4F1EC',
        marginVertical: 20,
    },
    inputWrapper: {
        marginHorizontal: 16,
        marginBottom: 20,
    },
    input: {
        backgroundColor: '#fff',
        borderRadius: 14,
        padding: 16,
        fontFamily: 'PlusJakartaSans_400Regular',
        fontSize: 15,
        color: '#1A1614',
        minHeight: 90,
        textAlignVertical: 'top',
    },
    label: {
        fontFamily: 'PlusJakartaSans_700Bold',
        fontSize: 13,
        color: '#5C564F',
        marginBottom: 10,
        marginHorizontal: 16,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    matchItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        backgroundColor: '#fff',
        borderRadius: 10,
        padding: 14,
        marginHorizontal: 16,
        marginBottom: 8,
    },
    matchSelected: {
        backgroundColor: '#E4002B',
    },
    matchText: {
        fontFamily: 'PlusJakartaSans_600SemiBold',
        fontSize: 14,
        color: '#1A1614',
    },
    matchTextSelected: {
        color: '#fff',
    },
    btn: {
        marginHorizontal: 16,
        marginTop: 24,
        borderRadius: 14,
    },
    btnInner: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        height: 54,
    },
    btnText: {
        fontFamily: 'PlusJakartaSans_800ExtraBold',
        fontSize: 16,
        color: '#fff',
    },
})
