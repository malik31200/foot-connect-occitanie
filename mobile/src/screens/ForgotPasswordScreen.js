import React, { useState } from 'react'
import {
    View, Text, TextInput, TouchableOpacity,
    StyleSheet, ActivityIndicator, Alert,
    KeyboardAvoidingView, Platform, ScrollView
} from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { Ionicons } from '@expo/vector-icons'
import OccitanCross from '../components/OccitanCross'
import client from '../api/client'

export default function ForgotPasswordScreen({ navigation }) {
    const [step, setStep] = useState(1) // 1 = email, 2 = code + new password
    const [email, setEmail] = useState('')
    const [code, setCode] = useState('')
    const [newPassword, setNewPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [loading, setLoading] = useState(false)

    async function handleSendCode() {
        if (!email.trim()) {
            Alert.alert('Erreur', 'Entre ton adresse email.')
            return
        }
        setLoading(true)
        try {
            await client.post('/auth/forgot-password/', { email: email.trim().toLowerCase() })
            setStep(2)
        } catch {
            Alert.alert('Erreur', 'Erreur réseau. Réessaie.')
        } finally {
            setLoading(false)
        }
    }

    async function handleResetPassword() {
        if (!code.trim() || !newPassword.trim()) {
            Alert.alert('Erreur', 'Remplis tous les champs.')
            return
        }
        if (newPassword.length < 6) {
            Alert.alert('Erreur', 'Le mot de passe doit faire au moins 6 caractères.')
            return
        }
        setLoading(true)
        try {
            await client.post('/auth/reset-password/', {
                email: email.trim().toLowerCase(),
                code: code.trim(),
                new_password: newPassword,
            })
            Alert.alert(
                'Succès !',
                'Ton mot de passe a été mis à jour. Tu peux te connecter.',
                [{ text: 'Se connecter', onPress: () => navigation.navigate('Login') }]
            )
        } catch (e) {
            const msg = e.response?.data?.detail || 'Code invalide ou expiré.'
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
            <LinearGradient colors={['#FF2A3C', '#E4002B', '#B80020']} style={styles.screen}>
                <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
                    <View style={styles.logoSection}>
                        <OccitanCross size={64} color="#F5C518" />
                        <Text style={styles.appName}>FOOT CONNECT</Text>
                        <Text style={styles.region}>OCCITANIE</Text>
                    </View>

                    <View style={styles.card}>
                        <Text style={styles.cardTitle}>
                            {step === 1 ? 'MOT DE PASSE\nOUBLIÉ' : 'NOUVEAU\nMOT DE PASSE'}
                        </Text>

                        {step === 1 ? (
                            <>
                                <Text style={styles.subtitle}>
                                    Entre ton adresse email et on t'envoie un code de réinitialisation.
                                </Text>
                                <Text style={styles.label}>Email</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Ton adresse e-mail"
                                    placeholderTextColor="#A8A29B"
                                    value={email}
                                    onChangeText={setEmail}
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                    autoFocus
                                />
                                <LinearGradient
                                    colors={['#E4002B', '#FF5A1F']}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 0 }}
                                    style={styles.button}
                                >
                                    <TouchableOpacity
                                        style={styles.buttonInner}
                                        onPress={handleSendCode}
                                        disabled={loading}
                                    >
                                        {loading
                                            ? <ActivityIndicator color="#fff" />
                                            : <Text style={styles.buttonText}>Envoyer le code</Text>
                                        }
                                    </TouchableOpacity>
                                </LinearGradient>
                            </>
                        ) : (
                            <>
                                <Text style={styles.subtitle}>
                                    Un code à 6 chiffres a été envoyé à{' '}
                                    <Text style={{ color: '#E4002B', fontFamily: 'PlusJakartaSans_700Bold' }}>
                                        {email}
                                    </Text>
                                </Text>

                                <Text style={styles.label}>Code reçu par email</Text>
                                <TextInput
                                    style={[styles.input, styles.codeInput]}
                                    placeholder="123456"
                                    placeholderTextColor="#A8A29B"
                                    value={code}
                                    onChangeText={setCode}
                                    keyboardType="number-pad"
                                    maxLength={6}
                                    autoFocus
                                />

                                <Text style={styles.label}>Nouveau mot de passe</Text>
                                <View style={styles.inputWrapper}>
                                    <TextInput
                                        style={styles.inputFlex}
                                        placeholder="Au moins 6 caractères"
                                        placeholderTextColor="#A8A29B"
                                        value={newPassword}
                                        onChangeText={setNewPassword}
                                        secureTextEntry={!showPassword}
                                    />
                                    <TouchableOpacity
                                        onPress={() => setShowPassword(v => !v)}
                                        style={styles.eyeBtn}
                                    >
                                        <Ionicons
                                            name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                                            size={20}
                                            color="#A8A29B"
                                        />
                                    </TouchableOpacity>
                                </View>

                                <LinearGradient
                                    colors={['#E4002B', '#FF5A1F']}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 0 }}
                                    style={styles.button}
                                >
                                    <TouchableOpacity
                                        style={styles.buttonInner}
                                        onPress={handleResetPassword}
                                        disabled={loading}
                                    >
                                        {loading
                                            ? <ActivityIndicator color="#fff" />
                                            : <Text style={styles.buttonText}>Réinitialiser</Text>
                                        }
                                    </TouchableOpacity>
                                </LinearGradient>

                                <TouchableOpacity onPress={() => setStep(1)}>
                                    <Text style={styles.link}>← Changer d'email</Text>
                                </TouchableOpacity>
                            </>
                        )}

                        <TouchableOpacity onPress={() => navigation.navigate('Login')} style={{ marginTop: 16 }}>
                            <Text style={styles.link}>Retour à la connexion</Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </LinearGradient>
        </KeyboardAvoidingView>
    )
}

const styles = StyleSheet.create({
    screen: { flex: 1 },
    scroll: { flexGrow: 1 },
    logoSection: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 60,
        paddingBottom: 24,
    },
    appName: {
        fontFamily: 'Anton_400Regular',
        fontSize: 36,
        color: '#fff',
        lineHeight: 40,
    },
    region: {
        fontFamily: 'Anton_400Regular',
        fontSize: 15,
        color: '#F5C518',
        letterSpacing: 8,
        marginTop: 4,
    },
    card: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        padding: 28,
        paddingBottom: 40,
        flex: 1,
    },
    cardTitle: {
        fontFamily: 'Anton_400Regular',
        fontSize: 26,
        color: '#1A1614',
        textAlign: 'center',
        marginBottom: 12,
        lineHeight: 30,
    },
    subtitle: {
        fontFamily: 'PlusJakartaSans_400Regular',
        fontSize: 14,
        color: '#5C564F',
        textAlign: 'center',
        marginBottom: 24,
        lineHeight: 20,
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
    codeInput: {
        fontSize: 24,
        fontFamily: 'Anton_400Regular',
        letterSpacing: 6,
        textAlign: 'center',
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
    button: {
        borderRadius: 15,
        marginTop: 8,
        marginBottom: 20,
        shadowColor: '#E4002B',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.4,
        shadowRadius: 16,
        elevation: 6,
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
        marginTop: 4,
    },
})
