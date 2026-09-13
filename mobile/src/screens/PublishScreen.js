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

const SEASON = '2026/2027'

function Chip({ label, selected, onPress }) {
    return (
        <TouchableOpacity onPress={onPress} style={[styles.chip, selected && styles.chipSelected]}>
            <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{label}</Text>
        </TouchableOpacity>
    )
}

export default function PublishScreen() {
    const { token } = useAuth()
    const [assets, setAssets] = useState([])
    const [caption, setCaption] = useState('')
    const [selectedMatch, setSelectedMatch] = useState(null)
    const [uploading, setUploading] = useState(false)

    const [categories, setCategories] = useState([])
    const [category, setCategory] = useState(null)
    const [groups, setGroups] = useState([])
    const [poule, setPoule] = useState(null)
    const [matchOptions, setMatchOptions] = useState([])
    const [loadingMatches, setLoadingMatches] = useState(false)
    const [manualMode, setManualMode] = useState(false)
    const [manualHome, setManualHome] = useState('')
    const [manualAway, setManualAway] = useState('')

    const headers = { Authorization: `Bearer ${token}` }

    // Charger les catégories au montage
    useFocusEffect(
        useCallback(() => {
            client.get(`/matches/filters/?season=${encodeURIComponent(SEASON)}`, { headers })
                .then(res => {
                    setCategories(res.data.categories || [])
                    if (res.data.categories?.length > 0) setCategory(res.data.categories[0])
                })
                .catch(() => {})
        }, [token])
    )

    // Charger les poules puis les matchs quand la catégorie change
    useFocusEffect(
        useCallback(() => {
            if (!category) return
            client.get(`/matches/groups/?season=${encodeURIComponent(SEASON)}&category=${encodeURIComponent(category)}`, { headers })
                .then(res => {
                    const g = res.data.groups || []
                    setGroups(g)
                    const firstPoule = g.length > 0 ? g[0] : null
                    setPoule(firstPoule)
                    // Charger les matchs immédiatement avec la bonne poule
                    loadMatches(category, firstPoule)
                })
                .catch(() => {})
        }, [category, token])
    )

    // Recharger les matchs quand la poule change manuellement
    const prevPouleRef = React.useRef(null)
    React.useEffect(() => {
        if (poule !== prevPouleRef.current) {
            prevPouleRef.current = poule
            if (category) loadMatches(category, poule)
        }
    }, [poule])

    function loadMatches(cat, grp) {
        setLoadingMatches(true)
        setSelectedMatch(null)
        const base = `/matches/?season=${encodeURIComponent(SEASON)}&category=${encodeURIComponent(cat)}`
        const groupParam = grp ? `&group_name=${encodeURIComponent(grp)}` : ''

        Promise.all([
            client.get(`${base}${groupParam}&status=finished`, { headers }),
            client.get(`${base}${groupParam}&status=scheduled`, { headers }),
        ]).then(([finishedRes, scheduledRes]) => {
            const finished = (finishedRes.data.results || finishedRes.data)
            const scheduled = (scheduledRes.data.results || scheduledRes.data)

            const lastMatchday = finished.length > 0
                ? Math.max(...finished.map(m => m.matchday || 0))
                : null
            const lastFinished = lastMatchday !== null
                ? finished.filter(m => m.matchday === lastMatchday)
                    .sort((a, b) => new Date(b.date_time) - new Date(a.date_time))
                : []

            const nextMatchday = scheduled.length > 0
                ? Math.min(...scheduled.map(m => m.matchday || 999))
                : null
            const nextScheduled = nextMatchday !== null
                ? scheduled.filter(m => m.matchday === nextMatchday)
                    .sort((a, b) => new Date(a.date_time) - new Date(b.date_time))
                : []

            setMatchOptions([...lastFinished, ...nextScheduled])
        }).catch(() => {}).finally(() => setLoadingMatches(false))
    }

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
        if (result.canceled) return

        // videoMaxDuration n'est qu'une préférence pour le picker natif,
        // pas garantie (notamment sur Android) : on vérifie nous-mêmes.
        const duration = result.assets[0]?.duration // en millisecondes
        if (duration && duration > 60000) {
            Alert.alert(
                'Vidéo trop longue',
                `Ta vidéo dure ${Math.round(duration / 1000)}s. La durée maximale est de 60 secondes.`
            )
            return
        }

        setAssets(result.assets)
    }

    async function uploadToR2(uri, isVideo) {
        const contentType = isVideo ? 'video/mp4' : 'image/jpeg'
        const fileName = `${Date.now()}.${isVideo ? 'mp4' : 'jpg'}`

        // 1. Demander une URL pré-signée au backend
        const presignRes = await client.post('/media/presign/', {
            file_name: fileName,
            content_type: contentType,
        }, { headers })

        const { upload_url, public_url } = presignRes.data

        // 2. Lire le fichier local en blob puis uploader directement vers R2
        const fileRes = await fetch(uri)
        const blob = await fileRes.blob()
        const uploadRes = await fetch(upload_url, {
            method: 'PUT',
            headers: { 'Content-Type': contentType },
            body: blob,
        })
        if (!uploadRes.ok) throw new Error(`Upload R2 échoué: ${uploadRes.status}`)

        return public_url
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
                const url = await uploadToR2(asset.uri, isVideo)
                medias.push({ media_type: isVideo ? 'video' : 'photo', media_url: url })
            }
            await client.post('/posts/', {
                ...(selectedMatch ? { match_id: selectedMatch.id } : {}),
                caption: caption + (manualMode && manualHome && manualAway
                    ? `\n⚽ ${manualHome} - ${manualAway}` : ''),
                medias,
            }, { headers })
            Alert.alert('Publié !', 'Ta publication est en ligne.')
            setAssets([])
            setCaption('')
            setSelectedMatch(null)
        } catch (e) {
            const detail = e.response?.data?.detail || e.message || 'Impossible de publier.'
            Alert.alert('Erreur', detail)
        } finally {
            setUploading(false)
        }
    }

    return (
        <ScrollView style={styles.screen} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
            <View style={styles.header}>
                <Text style={styles.headerTitle}>PUBLIER</Text>
            </View>

            {/* Sélection média */}
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
                <Text style={styles.assetCount}>{assets.length} photos sélectionnées</Text>
            )}

            {/* Légende */}
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

            {/* Filtres catégorie */}
            <Text style={styles.label}>Catégorie</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsRow} contentContainerStyle={styles.chipsContent}>
                {categories.map(cat => (
                    <Chip key={cat} label={cat} selected={cat === category} onPress={() => setCategory(cat)} />
                ))}
            </ScrollView>

            {/* Filtres poule */}
            {groups.length > 0 && (
                <>
                    <Text style={[styles.label, { marginTop: 12 }]}>Poule</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsRow} contentContainerStyle={styles.chipsContent}>
                        {groups.map(g => (
                            <Chip key={g} label={g} selected={g === poule} onPress={() => setPoule(g)} />
                        ))}
                    </ScrollView>
                </>
            )}

            {/* Matchs disponibles */}
            <Text style={[styles.label, { marginTop: 16 }]}>Match lié (optionnel)</Text>
            {loadingMatches ? (
                <ActivityIndicator color="#E4002B" style={{ marginVertical: 12 }} />
            ) : matchOptions.length === 0 ? (
                <Text style={styles.noMatch}>Aucun match trouvé pour cette sélection</Text>
            ) : (
                matchOptions.map(match => {
                    const dt = new Date(match.date_time)
                    const dateStr = dt.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })
                    const timeStr = dt.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
                    const isSelected = selectedMatch?.id === match.id
                    const isFinished = match.status === 'finished'
                    return (
                        <TouchableOpacity
                            key={match.id}
                            style={[styles.matchItem, isSelected && styles.matchSelected]}
                            onPress={() => setSelectedMatch(isSelected ? null : match)}
                        >
                            <View style={styles.matchItemHeader}>
                                <Text style={[styles.matchStatus, isSelected && { color: 'rgba(255,255,255,0.7)' }]}>
                                    {isFinished ? '✓ Terminé' : '⏳ À venir'}
                                </Text>
                                <Text style={[styles.matchDate, isSelected && { color: 'rgba(255,255,255,0.7)' }]}>
                                    {dateStr} · {timeStr}
                                </Text>
                            </View>
                            <Text style={[styles.matchText, isSelected && styles.matchTextSelected]}>
                                {match.home_team?.name} {isFinished ? `${match.home_score} - ${match.away_score}` : 'VS'} {match.away_team?.name}
                            </Text>
                        </TouchableOpacity>
                    )
                })
            )}

            {/* Mode saisie manuelle */}
            <TouchableOpacity
                style={styles.manualToggle}
                onPress={() => { setManualMode(!manualMode); setSelectedMatch(null) }}
            >
                <Ionicons
                    name={manualMode ? 'checkbox' : 'square-outline'}
                    size={18}
                    color="#E4002B"
                />
                <Text style={styles.manualToggleText}>Mon match n'est pas dans la liste</Text>
            </TouchableOpacity>

            {manualMode && (
                <View style={styles.manualInputs}>
                    <TextInput
                        style={styles.manualInput}
                        placeholder="Équipe domicile"
                        placeholderTextColor="#A8A29B"
                        value={manualHome}
                        onChangeText={setManualHome}
                    />
                    <Text style={styles.manualVs}>VS</Text>
                    <TextInput
                        style={styles.manualInput}
                        placeholder="Équipe extérieur"
                        placeholderTextColor="#A8A29B"
                        value={manualAway}
                        onChangeText={setManualAway}
                    />
                </View>
            )}

            {/* Bouton publier */}
            <LinearGradient colors={['#E4002B', '#FF5A1F']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.btn}>
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
    screen: { flex: 1, backgroundColor: '#F6F3EE' },
    content: { paddingBottom: 110 },
    header: {
        backgroundColor: '#fff',
        paddingTop: 56, paddingBottom: 16, paddingHorizontal: 20,
        borderBottomWidth: 1, borderBottomColor: '#F4F1EC', marginBottom: 20,
    },
    headerTitle: { fontFamily: 'Anton_400Regular', fontSize: 28, color: '#1A1614' },
    imagePicker: { marginHorizontal: 16, height: 220, backgroundColor: '#fff', borderRadius: 16, overflow: 'hidden', marginBottom: 16 },
    preview: { width: '100%', height: '100%' },
    pickerRow: { marginHorizontal: 16, height: 120, backgroundColor: '#fff', borderRadius: 16, flexDirection: 'row', marginBottom: 16, overflow: 'hidden' },
    pickerBtn: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 8 },
    pickerBtnText: { fontFamily: 'PlusJakartaSans_700Bold', fontSize: 14, color: '#1A1614' },
    pickerDivider: { width: 1, backgroundColor: '#F4F1EC', marginVertical: 20 },
    assetCount: { fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 13, color: '#5C564F', marginHorizontal: 16, marginBottom: 8 },
    inputWrapper: { marginHorizontal: 16, marginBottom: 20 },
    input: { backgroundColor: '#fff', borderRadius: 14, padding: 16, fontFamily: 'PlusJakartaSans_400Regular', fontSize: 15, color: '#1A1614', minHeight: 90, textAlignVertical: 'top' },
    label: { fontFamily: 'PlusJakartaSans_700Bold', fontSize: 13, color: '#5C564F', marginBottom: 8, marginHorizontal: 16, textTransform: 'uppercase', letterSpacing: 1 },
    chipsRow: { flexGrow: 0, marginBottom: 4 },
    chipsContent: { paddingHorizontal: 16, gap: 8 },
    chip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 999, backgroundColor: '#fff', borderWidth: 1, borderColor: '#F4F1EC' },
    chipSelected: { backgroundColor: '#E4002B', borderColor: '#E4002B' },
    chipText: { fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 13, color: '#5C564F' },
    chipTextSelected: { color: '#fff' },
    noMatch: { fontFamily: 'PlusJakartaSans_400Regular', fontSize: 14, color: '#A8A29B', marginHorizontal: 16, marginVertical: 8 },
    matchItem: { backgroundColor: '#fff', borderRadius: 12, padding: 14, marginHorizontal: 16, marginBottom: 8 },
    matchSelected: { backgroundColor: '#E4002B' },
    matchItemHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
    matchStatus: { fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 11, color: '#A8A29B' },
    matchDate: { fontFamily: 'PlusJakartaSans_400Regular', fontSize: 11, color: '#A8A29B' },
    matchText: { fontFamily: 'PlusJakartaSans_700Bold', fontSize: 14, color: '#1A1614' },
    matchTextSelected: { color: '#fff' },
    manualToggle: {
        flexDirection: 'row', alignItems: 'center', gap: 8,
        marginHorizontal: 16, marginTop: 12, marginBottom: 4,
    },
    manualToggleText: {
        fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 13, color: '#5C564F',
    },
    manualInputs: {
        marginHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8,
    },
    manualInput: {
        flex: 1, backgroundColor: '#fff', borderRadius: 12,
        paddingHorizontal: 12, paddingVertical: 10,
        fontFamily: 'PlusJakartaSans_400Regular', fontSize: 14, color: '#1A1614',
    },
    manualVs: {
        fontFamily: 'Anton_400Regular', fontSize: 14, color: '#A8A29B',
    },
    btn: { marginHorizontal: 16, marginTop: 24, borderRadius: 14 },
    btnInner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, height: 54 },
    btnText: { fontFamily: 'PlusJakartaSans_800ExtraBold', fontSize: 16, color: '#fff' },
})
