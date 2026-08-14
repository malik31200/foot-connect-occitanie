import React, { useState, useEffect } from 'react'
import {
    View, Text, TextInput, TouchableOpacity, StyleSheet,
    ScrollView, ActivityIndicator, Alert, Image, Platform
} from 'react-native'
import * as ImagePicker from 'expo-image-picker'
import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import client from '../api/client'
import { useAuth } from '../context/AuthContext'

const CLOUD_NAME = 'du7oifrll'
const UPLOAD_PRESET = 'foot_occitanie'

const SPORT_ROLES = [
    { value: 'joueur', label: 'Joueur', icon: 'football-outline' },
    { value: 'coach', label: 'Coach', icon: 'ribbon-outline' },
    { value: 'supporter', label: 'Supporter', icon: 'heart-outline' },
]

export default function EditProfileScreen({ navigation }) {
    const { token } = useAuth()
    const headers = { Authorization: `Bearer ${token}` }

    const [username, setUsername] = useState('')
    const [sportRole, setSportRole] = useState('supporter')
    const [avatarUrl, setAvatarUrl] = useState('')
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [uploading, setUploading] = useState(false)

    useEffect(() => {
        client.get('/auth/me/', { headers })
            .then(res => {
                setUsername(res.data.username || '')
                setSportRole(res.data.sport_role || 'supporter')
                setAvatarUrl(res.data.avatar_url || '')
            })
            .finally(() => setLoading(false))
    }, [])

    async function pickAvatar() {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
        if (status !== 'granted') {
            Alert.alert('Permission refusée', 'Autorise l\'accès à ta galerie pour changer ta photo.')
            return
        }
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
        })
        if (result.canceled) return

        const asset = result.assets[0]
        setUploading(true)
        try {
            const url = await uploadToCloudinary(asset.uri)
            setAvatarUrl(url)
        } catch (e) {
            Alert.alert('Erreur', 'Impossible d\'uploader la photo.')
        } finally {
            setUploading(false)
        }
    }

    async function uploadToCloudinary(uri) {
        const formData = new FormData()
        const filename = uri.split('/').pop()
        const ext = filename.split('.').pop()
        formData.append('file', { uri, name: filename, type: `image/${ext}` })
        formData.append('upload_preset', UPLOAD_PRESET)
        const res = await fetch(
            `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
            { method: 'POST', body: formData }
        )
        const data = await res.json()
        if (!res.ok) throw new Error(data.error?.message || 'Upload échoué')
        return data.secure_url
    }

    async function handleSave() {
        if (!username.trim()) {
            Alert.alert('Erreur', 'Le nom d\'utilisateur ne peut pas être vide.')
            return
        }
        setSaving(true)
        try {
            await client.patch('/auth/me/', {
                username: username.trim(),
                sport_role: sportRole,
                avatar_url: avatarUrl || null,
            }, { headers })
            Alert.alert('Succès', 'Profil mis à jour !', [
                { text: 'OK', onPress: () => navigation.goBack() }
            ])
        } catch (e) {
            const msg = e.response?.data?.username?.[0] || 'Impossible de sauvegarder.'
            Alert.alert('Erreur', msg)
        } finally {
            setSaving(false)
        }
    }

    if (loading) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator color="#E4002B" size="large" />
            </View>
        )
    }

    return (
        <ScrollView style={styles.screen} contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled">

            {/* Avatar */}
            <View style={styles.avatarSection}>
                <TouchableOpacity onPress={pickAvatar} style={styles.avatarWrap} disabled={uploading}>
                    {avatarUrl ? (
                        <Image source={{ uri: avatarUrl }} style={styles.avatar} />
                    ) : (
                        <View style={styles.avatarPlaceholder}>
                            <Text style={styles.avatarInitial}>
                                {username?.charAt(0).toUpperCase() || '?'}
                            </Text>
                        </View>
                    )}
                    <View style={styles.avatarBadge}>
                        {uploading
                            ? <ActivityIndicator color="#fff" size="small" />
                            : <Ionicons name="camera" size={16} color="#fff" />
                        }
                    </View>
                </TouchableOpacity>
                <Text style={styles.avatarHint}>Appuie pour changer ta photo</Text>
            </View>

            {/* Nom d'utilisateur */}
            <View style={styles.field}>
                <Text style={styles.label}>Nom d'utilisateur</Text>
                <View style={styles.inputWrap}>
                    <Ionicons name="person-outline" size={18} color="#A8A29B" style={styles.inputIcon} />
                    <TextInput
                        style={styles.input}
                        value={username}
                        onChangeText={setUsername}
                        autoCapitalize="none"
                        autoCorrect={false}
                        placeholder="Ton pseudo"
                        placeholderTextColor="#A8A29B"
                    />
                </View>
            </View>

            {/* Rôle sportif */}
            <View style={styles.field}>
                <Text style={styles.label}>Mon rôle</Text>
                <View style={styles.roleRow}>
                    {SPORT_ROLES.map(r => (
                        <TouchableOpacity
                            key={r.value}
                            style={[styles.roleBtn, sportRole === r.value && styles.roleBtnActive]}
                            onPress={() => setSportRole(r.value)}
                        >
                            <Ionicons
                                name={r.icon}
                                size={20}
                                color={sportRole === r.value ? '#E4002B' : '#A8A29B'}
                            />
                            <Text style={[styles.roleLabel, sportRole === r.value && styles.roleLabelActive]}>
                                {r.label}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>

            {/* Bouton sauvegarder */}
            <LinearGradient
                colors={['#E4002B', '#FF5A1F']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.saveBtn}
            >
                <TouchableOpacity style={styles.saveBtnInner} onPress={handleSave} disabled={saving}>
                    {saving
                        ? <ActivityIndicator color="#fff" />
                        : <>
                            <Ionicons name="checkmark-circle-outline" size={20} color="#fff" />
                            <Text style={styles.saveBtnText}>Sauvegarder</Text>
                          </>
                    }
                </TouchableOpacity>
            </LinearGradient>
        </ScrollView>
    )
}

const styles = StyleSheet.create({
    screen: { flex: 1, backgroundColor: '#F6F3EE' },
    content: { padding: 24, gap: 24 },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },

    avatarSection: { alignItems: 'center', paddingTop: 8 },
    avatarWrap: { position: 'relative' },
    avatar: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#F4F1EC' },
    avatarPlaceholder: {
        width: 100, height: 100, borderRadius: 50,
        backgroundColor: '#F5C518',
        justifyContent: 'center', alignItems: 'center',
    },
    avatarInitial: { fontFamily: 'PlusJakartaSans_800ExtraBold', fontSize: 40, color: '#1A1614' },
    avatarBadge: {
        position: 'absolute', bottom: 2, right: 2,
        width: 30, height: 30, borderRadius: 15,
        backgroundColor: '#E4002B',
        justifyContent: 'center', alignItems: 'center',
        borderWidth: 2, borderColor: '#F6F3EE',
    },
    avatarHint: {
        marginTop: 10,
        fontFamily: 'PlusJakartaSans_400Regular',
        fontSize: 13,
        color: '#A8A29B',
    },

    field: { gap: 8 },
    label: { fontFamily: 'PlusJakartaSans_700Bold', fontSize: 14, color: '#1A1614' },
    inputWrap: {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: '#fff', borderRadius: 12,
        paddingHorizontal: 14, height: 52,
        borderWidth: 1.5, borderColor: '#F4F1EC',
    },
    inputIcon: { marginRight: 10 },
    input: {
        flex: 1,
        fontFamily: 'PlusJakartaSans_400Regular',
        fontSize: 15, color: '#1A1614',
    },

    roleRow: { flexDirection: 'row', gap: 10 },
    roleBtn: {
        flex: 1, alignItems: 'center', justifyContent: 'center',
        paddingVertical: 14, borderRadius: 12,
        backgroundColor: '#fff',
        borderWidth: 1.5, borderColor: '#F4F1EC',
        gap: 6,
    },
    roleBtnActive: { borderColor: '#E4002B', backgroundColor: '#FFF5F6' },
    roleLabel: {
        fontFamily: 'PlusJakartaSans_600SemiBold',
        fontSize: 12, color: '#A8A29B',
    },
    roleLabelActive: { color: '#E4002B' },

    saveBtn: { borderRadius: 14 },
    saveBtnInner: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        gap: 10, height: 54,
    },
    saveBtnText: { fontFamily: 'PlusJakartaSans_700Bold', fontSize: 16, color: '#fff' },
})
