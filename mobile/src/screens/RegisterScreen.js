import React, { useState } from 'react'
import {
    View, Text, TextInput, TouchableOpacity,
    StyleSheet, ActivityIndicator, Alert,
    ScrollView, KeyboardAvoidingView, Platform
} from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { Ionicons } from '@expo/vector-icons'
import OccitanCross from '../components/OccitanCross'
import client from '../api/client'
import { useAuth } from '../context/AuthContext'

export default function RegisterScreen({ navigation }) {
    const { login } = useAuth()
    const [username, setUsername] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [showPassword, setShowPassword] = useState(false)
    const [acceptedTerms, setAcceptedTerms] = useState(false)
    const [sportRole, setSportRole] = useState('supporter')

    const ROLES = [
        { value: 'supporter', label: 'Supporter' },
        { value: 'joueur', label: 'Joueur' },
        { value: 'coach', label: 'Coach' },
        { value: 'club', label: 'Dirigeant' },
        { value: 'partenaire', label: 'Partenaire' },
    ]

    function showTerms() {
        Alert.alert(
            'Conditions d\'utilisation',
            'En utilisant Foot Connect Occitanie, tu acceptes :\n\n' +
            '• Ne publier aucun contenu offensant, haineux ou illégal.\n' +
            '• Respecter tous les membres de la communauté.\n' +
            '• Tout contenu inapproprié peut être signalé et supprimé.\n' +
            '• Les utilisateurs qui enfreignent ces règles peuvent être exclus.\n' +
            '• Nous traiterons tout signalement sous 24 heures.\n\n' +
            'L\'administrateur se réserve le droit de supprimer tout contenu et de bannir tout utilisateur qui ne respecte pas ces règles.',
            [{ text: 'Fermer', style: 'cancel' }]
        )
    }

    async function handleRegister() {
        if (!username || !email || !password) {
            Alert.alert('Erreur', 'Remplis tous les champs.')
            return
        }
        if (!acceptedTerms) {
            Alert.alert('Erreur', 'Tu dois accepter les conditions d\'utilisation pour continuer.')
            return
        }
        setLoading(true)
        try {
            await client.post('/auth/register/', { username, email, password, sport_role: sportRole })
            const res = await client.post('/auth/login/', { email, password })
            const meRes = await client.get('/auth/me/', {
                headers: { Authorization: `Bearer ${res.data.access}` }
            })
            login(res.data.access, res.data.refresh, meRes.data)
        } catch (e) {
            const msg = e.response?.data
                ? Object.values(e.response.data).flat().join('\n')
                : 'Erreur réseau.'
            Alert.alert('Erreur', msg)
        } finally {
            setLoading(false)
        }
    }

    return (
        <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <LinearGradient
                colors={['#FF2A3C', '#E4002B', '#B80020']}
                style={styles.header}
            >
                <TouchableOpacity
                    style={styles.backBtn}
                    onPress={() => navigation.navigate('Login')}
                >
                    <Text style={styles.backText}>‹ Retour</Text>
                </TouchableOpacity>
                <OccitanCross size={48} color="#F5C518" />
                <Text style={styles.headerTitle}>INSCRIPTION</Text>
            </LinearGradient>

            <View style={styles.card}>
                <ScrollView showsVerticalScrollIndicator={false}>
                    <Text style={styles.label}>Pseudo</Text>
                    <View style={styles.inputRow}>
                        <Text style={styles.prefix}>@</Text>
                        <TextInput
                            style={styles.inputWithPrefix}
                            placeholder="ton_pseudo"
                            placeholderTextColor="#A8A29B"
                            value={username}
                            onChangeText={setUsername}
                            autoCapitalize="none"
                        />
                    </View>

                    <Text style={styles.label}>Email</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Ton adresse e-mail"
                        placeholderTextColor="#A8A29B"
                        value={email}
                        onChangeText={setEmail}
                        keyboardType="email-address"
                        autoCapitalize="none"
                    />

                    <Text style={styles.label}>Mot de passe</Text>
                    <View style={styles.inputWrapper}>
                        <TextInput
                            style={styles.inputFlex}
                            placeholder="Ton mot de passe"
                            placeholderTextColor="#A8A29B"
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry={!showPassword}
                        />
                        <TouchableOpacity onPress={() => setShowPassword(v => !v)} style={styles.eyeBtn}>
                            <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color="#A8A29B" />
                        </TouchableOpacity>
                    </View>

                    {/* Sélection du rôle */}
                    <Text style={styles.label}>Tu es...</Text>
                    <View style={styles.rolesGrid}>
                        {ROLES.map(r => (
                            <TouchableOpacity
                                key={r.value}
                                style={[styles.roleChip, sportRole === r.value && styles.roleChipActive]}
                                onPress={() => setSportRole(r.value)}
                            >
                                <Text style={[styles.roleChipText, sportRole === r.value && styles.roleChipTextActive]}>
                                    {r.label}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    {/* Case à cocher CGU — obligatoire pour Apple */}
                    <TouchableOpacity
                        style={styles.checkboxRow}
                        onPress={() => setAcceptedTerms(v => !v)}
                        activeOpacity={0.7}
                    >
                        <View style={[styles.checkbox, acceptedTerms && styles.checkboxChecked]}>
                            {acceptedTerms && <Ionicons name="checkmark" size={14} color="#fff" />}
                        </View>
                        <Text style={styles.checkboxText}>
                            J'accepte les{' '}
                            <Text style={styles.checkboxLink} onPress={showTerms}>
                                Conditions d'utilisation
                            </Text>
                            {' '}et les règles de la communauté
                        </Text>
                    </TouchableOpacity>

                    <LinearGradient
                        colors={['#E4002B', '#FF5A1F']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={[styles.button, !acceptedTerms && { opacity: 0.5 }]}
                    >
                        <TouchableOpacity
                            style={styles.buttonInner}
                            onPress={handleRegister}
                            disabled={loading}
                        >
                            {loading
                                ? <ActivityIndicator color="#fff" />
                                : <Text style={styles.buttonText}>Créer mon compte</Text>
                            }
                        </TouchableOpacity>
                    </LinearGradient>

                    <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                        <Text style={styles.link}>
                            Déjà un compte ?{' '}
                            <Text style={styles.linkBold}>Connecte-toi</Text>
                        </Text>
                    </TouchableOpacity>
                </ScrollView>
            </View>
        </KeyboardAvoidingView>
    )
}

const styles = StyleSheet.create({
    header: {
        height: 200,
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 20,
    },
    backBtn: {
        position: 'absolute',
        top: 48,
        left: 22,
    },
    backText: {
        color: '#fff',
        fontFamily: 'PlusJakartaSans_600SemiBold',
        fontSize: 15,
    },
    headerTitle: {
        fontFamily: 'Anton_400Regular',
        fontSize: 26,
        color: '#fff',
        marginTop: 8,
    },
    card: {
        flex: 1,
        backgroundColor: '#fff',
        borderTopLeftRadius: 26,
        borderTopRightRadius: 26,
        marginTop: -22,
        padding: 28,
        paddingBottom: 40,
    },
    label: {
        fontFamily: 'PlusJakartaSans_700Bold',
        fontSize: 12,
        color: '#1A1614',
        marginBottom: 6,
    },
    input: {
        height: 50,
        backgroundColor: '#F4F1EC',
        borderRadius: 14,
        paddingHorizontal: 16,
        fontSize: 15,
        fontFamily: 'PlusJakartaSans_400Regular',
        color: '#1A1614',
        marginBottom: 16,
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F4F1EC',
        borderRadius: 14,
        marginBottom: 16,
        height: 50,
    },
    inputFlex: {
        flex: 1,
        paddingHorizontal: 16,
        fontSize: 15,
        fontFamily: 'PlusJakartaSans_400Regular',
        color: '#1A1614',
    },
    eyeBtn: {
        paddingHorizontal: 14,
        justifyContent: 'center',
        alignItems: 'center',
    },
    inputRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F4F1EC',
        borderRadius: 14,
        marginBottom: 16,
        height: 50,
        paddingHorizontal: 16,
    },
    prefix: {
        fontFamily: 'PlusJakartaSans_700Bold',
        fontSize: 16,
        color: '#A8A29B',
        marginRight: 4,
    },
    inputWithPrefix: {
        flex: 1,
        fontSize: 15,
        fontFamily: 'PlusJakartaSans_400Regular',
        color: '#1A1614',
    },
    button: {
        borderRadius: 15,
        marginTop: 8,
        marginBottom: 20,
        shadowColor: '#E4002B',
        shadowOffset: { width: 0, height: 14 },
        shadowOpacity: 0.7,
        shadowRadius: 26,
        elevation: 8,
    },
    buttonInner: {
        height: 54,
        alignItems: 'center',
        justifyContent: 'center',
    },
    buttonText: {
        fontFamily: 'PlusJakartaSans_800ExtraBold',
        fontSize: 15,
        color: '#fff',
    },
    link: {
        fontFamily: 'PlusJakartaSans_400Regular',
        textAlign: 'center',
        color: '#5C564F',
        fontSize: 14,
    },
    linkBold: {
        color: '#E4002B',
        fontFamily: 'PlusJakartaSans_700Bold',
    },
    rolesGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginBottom: 20,
    },
    roleChip: {
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 20,
        backgroundColor: '#F4F1EC',
        borderWidth: 1.5,
        borderColor: '#F4F1EC',
    },
    roleChipActive: {
        backgroundColor: '#FFF0F2',
        borderColor: '#E4002B',
    },
    roleChipText: {
        fontFamily: 'PlusJakartaSans_600SemiBold',
        fontSize: 13,
        color: '#5C564F',
    },
    roleChipTextActive: {
        color: '#E4002B',
    },
    checkboxRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 10,
        marginBottom: 16,
    },
    checkbox: {
        width: 22,
        height: 22,
        borderRadius: 6,
        borderWidth: 1.5,
        borderColor: '#A8A29B',
        backgroundColor: '#fff',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 1,
        flexShrink: 0,
    },
    checkboxChecked: {
        backgroundColor: '#E4002B',
        borderColor: '#E4002B',
    },
    checkboxText: {
        fontFamily: 'PlusJakartaSans_400Regular',
        fontSize: 13,
        color: '#5C564F',
        flex: 1,
        lineHeight: 20,
    },
    checkboxLink: {
        fontFamily: 'PlusJakartaSans_700Bold',
        color: '#E4002B',
        textDecorationLine: 'underline',
    },
})
