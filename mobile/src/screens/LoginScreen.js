import React, { useState } from 'react'
import {
    View, Text, TextInput, TouchableOpacity,
    StyleSheet, ActivityIndicator, Alert,
    KeyboardAvoidingView, Platform
} from 'react-native'
import OccitanCross from '../components/OccitanCross'
import { LinearGradient } from 'expo-linear-gradient'
import client from '../api/client'
import { useAuth } from '../context/AuthContext'

export default function LoginScreen({ navigation }) {
    const { login } = useAuth()
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)

    async function handleLogin() {
        if (!email || !password) {
            Alert.alert('Erreur', 'Remplis tous les champs.')
            return
        }
            setLoading(true)
            try {
                const res = await client.post('/auth/login/', {email, password })
                login(res.data.access)
            } catch (e) {
                const msg = e.response?.data?.detail || 'Erreur réseau.'
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
                    style={styles.screen}
                >
                    <View style={styles.logoSection}>
                        <OccitanCross size={84} color="#F5C518" />
                        <Text style={styles.appName}>FOOT CONNECT</Text>
                        <Text style={styles.region}>OCCITANIE</Text>
                        <Text style={styles.tagline}>LE RÉSEAU SOCIAL DU FOOT OCCITAN</Text>
                    </View>

                    <View style={styles.card}>
                    <Text style={styles.cardTitle}>CONNEXION</Text>

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
                    <TextInput
                        style={styles.input}
                        placeholder="Ton mot de passe"
                        placeholderTextColor="#A8A29B"
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry
                    />

                    <LinearGradient
                        colors={['#E4002B', '#FF5A1F']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.button}
                    >
                        <TouchableOpacity
                            style={styles.buttonInner}
                            onPress={handleLogin}
                            disabled={loading}
                        >
                            {loading
                                ? <ActivityIndicator color="#fff" />
                                : <Text style={styles.buttonText}>Se connecter</Text>
                            }
                        </TouchableOpacity>
                    </LinearGradient>

                    <TouchableOpacity onPress={() => navigation.navigate('Register')}>
                        <Text style={styles.link}>
                            Pas encore de compte ?{' '}
                            <Text style={styles.linkBold}>Inscris-toi</Text>
                        </Text>
                    </TouchableOpacity>
                </View>
            </LinearGradient>
        </KeyboardAvoidingView>                
        )
    }

    const styles = StyleSheet.create({
    screen: {
        flex: 1,
    },
    logoSection: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 60,
    },
    appName: {
        fontFamily: 'Anton_400Regular',
        fontSize: 42,
        color: '#fff',
        lineHeight: 46,
    },
    region: {
        fontFamily: 'Anton_400Regular',
        fontSize: 18,
        color: '#F5C518',
        letterSpacing: 8,
        marginTop: 4,
    },
    tagline: {
        fontFamily: 'PlusJakartaSans_400Regular',
        fontSize: 11,
        color: 'rgba(255,255,255,0.8)',
        letterSpacing: 2,
        marginTop: 12,
    },
    card: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        padding: 28,
        paddingBottom: 40,
    },
    cardTitle: {
        fontFamily: 'Anton_400Regular',
        fontSize: 26,
        color: '#1A1614',
        textAlign: 'center',
        marginBottom: 24,
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
})
