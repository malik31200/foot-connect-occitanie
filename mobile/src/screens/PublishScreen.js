import React, { useState, useCallback } from 'react'
import { useFocusEffect } from '@react-navigation/native'
import {
    View, Text, TextInput, TouchableOpacity, Image,
    StyleSheet, ActivityIndicator, Alert, ScrollView
} from 'react-native'
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
                .catch((e) => console.log('ERREUR MATCHS:', e.message))
        }, [token])
    )

    async function pickImage() {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            quality: 0.8,
        })
        if (!result.canceled) {
            setImage(result.assets[0])
        }
    }

    async function uploadToCloudinary(uri) {
        const formData = new FormData()
        formData.append('file', { uri, type: 'image/jpeg', name:'photo.jpg' })
        formData.append('upload_preset', UPLOAD_PRESET)
        const res = await axios.post(
            `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
            formData,
        )
        return res.data.secure_url
    }

    async function handlePublish() {
        if (!image) {
            Alert.alert('Erreur', 'Choisis une photo.');
            return
        }
        if (!selectedMatch) {
            Alert.alert('Erreur', 'Choisis un match.');
            return
        }
        setUploading(true)
        try {
            const mediaUrl = await uploadToCloudinary(image.uri)
            await client.post('/posts/', {
                match_id: selectedMatch.id,
                caption,
                medias: [{ media_type: 'photo', media_url: mediaUrl }]
            }, { headers })
            Alert.alert('Succès !', 'Publication créée.')
            setImage(null)
            setCaption('')
            setSelectedMatch(null)
        } catch (e) {
            console.log('ERREUR PUBLISH:', e.message, e.response?.data)
            Alert.alert('Erreur', 'Impossible de publier.')
        } finally {
            setUploading(false)
        }
    }

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            <Text style={styles.title}>Nouvelle publication</Text>

            <TouchableOpacity style={styles.imagePicker} onPress={pickImage}>
                {image
                    ? <Image source={{ uri: image.uri }} style={styles.preview} />
                    : <Text style={styles.imagePickerText}>+ Choisir une photo</Text>
                }
            </TouchableOpacity>

            <TextInput
                style={styles.input}
                placeholder="Description..."
                value={caption}
                onChangeText={setCaption}
                multiline
                />

                <Text style={styles.label}>Choisis un match :</Text>
                {matches.slice(0, 10).map(match => (
                    <TouchableOpacity
                        key={match.id}
                        style={[styles.matchItem, selectedMatch?.id === match.id && styles.matchSelected]}
                        onPress={() => setSelectedMatch(match)}
                    >
                        <Text style={[styles.matchText, selectedMatch?.id === match.id && styles.matchTextSelected]}>
                            {match.home_team?.name} vs {match.away_team?.name}
                        </Text>
                    </TouchableOpacity>
                ))}

                <TouchableOpacity style={styles.button} onPress={handlePublish} disabled={uploading}>
                    {uploading
                        ? <ActivityIndicator color="#fff" />
                        : <Text style={styles.buttonText}>Publier</Text>
                    }
                </TouchableOpacity>
        </ScrollView>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F6F3EE',
    },
    content: {
        padding: 24,
    },
    title: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#1A1614',
        marginBottom: 24
    },
    imagePicker: {
        width: '100%',
        height: 200,
        backgroundColor: '#F4F1EC',
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
        overflow: 'hidden',
    },
    imagePickerText: {
        color: '#A8A29B',
        fontSize: 16
    },
    preview: {
        width: '100%',
        height: 200
    },
    input: {
        backgroundColor: '#F4F1EC',
        borderRadius: 8,
        padding: 14,
        marginBottom: 16,
        fontSize: 16,
        color: '#1A1614',
        minHeight: 80,
    },
    label: {
        fontSize: 14,
        color: '#5C564F',
        marginBottom: 8,
        fontWeight: 'bold'
    },
    matchItem: {
        backgroundColor: '#F4F1EC',
        borderRadius: 8,
        padding: 12,
        marginBottom: 8
    },
    matchSelected: {
        backgroundColor: '#E4002B'
    },
    matchText: {
        color: '#1A1614',
        fontSize: 14
    },
    matchTextSelected: {
        color: '#fff'
    },
    button: {
        backgroundColor: '#E4002B',
        borderRadius: 8,
        padding: 16,
        alignItems: 'center',
        marginTop: 16,
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold'
    },
})
