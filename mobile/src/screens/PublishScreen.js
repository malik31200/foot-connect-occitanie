import React, { useState, useCallback } from 'react'
import { useFocusEffect } from '@react-navigation/native'
import {
    View, Text, TextInput, TouchableOpacity, Image,
    StyleSheet, ActivityIndicator, Alert, ScrollView
} from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { Ionicons } from '@expo/vector-icons'
import * as ImagePicker from 'expo-image-picker'
import axios from 'axios'
import client from '../api/client'
import { useAuth } from '../context/AuthContext'

const CLOUD_NAME = 'du7oifrll'
const UPLOAD_PRESET = 'foot_occitanie'

export default function PublishScreen() {
    const { token } = useAuth()
    const [image, setImage] = useState(null)
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

    async function pickImage() {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            quality: 0.8,
        })
        if (!result.canceled) setImage(result.assets[0])
    }

    async function uploadToCloudinary(uri) {
        const formData = new FormData()
        formData.append('file', { uri, type: 'image/jpeg', name: 'photo.jpg' })
        formData.append('upload_preset', UPLOAD_PRESET)
        const res = await axios.post(
            `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
            formData,
        )
        return res.data.secure_url
    }

    async function handlePublish() {
        if (!image) {
            Alert.alert('Erreur', 'Choisis une photo.')
            return
        }
        setUploading(true)
        try {
            const mediaUrl = await uploadToCloudinary(image.uri)
            await client.post('/posts/', {
                ...(selectedMatch ? { match_id: selectedMatch.id } : {}),
                caption,
                medias: [{ media_type: 'photo', media_url: mediaUrl }]
            }, { headers })
            Alert.alert('Publié !', 'Ta publication est en ligne.')
            setImage(null)
            setCaption('')
            setSelectedMatch(null)
        } catch (e) {
            Alert.alert('Erreur', 'Impossible de publier.')
        } finally {
            setUploading(false)
        }
    }

    return (
        <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>PUBLIER</Text>
            </View>

            <TouchableOpacity style={styles.imagePicker} onPress={pickImage}>
                {image ? (
                    <Image source={{ uri: image.uri }} style={styles.preview} />
                ) : (
                    <View style={styles.imagePickerInner}>
                        <View style={styles.iconCircle}>
                            <Ionicons name="camera" size={32} color="#E4002B" />
                        </View>
                        <Text style={styles.imagePickerText}>Choisir une photo</Text>
                        <Text style={styles.imagePickerSub}>Appuie pour ouvrir ta galerie</Text>
                    </View>
                )}
            </TouchableOpacity>

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
    imagePickerInner: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
    },
    iconCircle: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: '#F6F3EE',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 4,
    },
    imagePickerText: {
        fontFamily: 'PlusJakartaSans_700Bold',
        fontSize: 16,
        color: '#1A1614',
    },
    imagePickerSub: {
        fontFamily: 'PlusJakartaSans_400Regular',
        fontSize: 13,
        color: '#A8A29B',
    },
    preview: {
        width: '100%',
        height: '100%',
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
