import React, { useState } from 'react'
import {
    View, Text, TextInput, TouchableOpacity,
    StyleSheet, ActivityIndicator, Alert
} from 'react-native'
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
            <View style={styles.container}>
                <Text style={styles.title}>Connexion</Text>

                <TextInput
                    style={styles.input}
                    placeholder="Email"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                />
                <TextInput
                    style={styles.input}
                    placeholder="Mot de passe"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                />

                <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={loading}>
                    {loading
                        ? <ActivityIndicator color="#fff" />
                        : <Text style={styles.buttonText}>Se connecter</Text>
                    }
                </TouchableOpacity>

                <TouchableOpacity onPress={() => navigation.navigate('Register')}>
                    <Text style={styles.link}>Pas encore de compte ? S'inscrire</Text>
                </TouchableOpacity>
            </View>
        )
    }

    const styles = StyleSheet.create({
        container: {
            flex: 1,
            justifyContent: 'center',
            padding: 24,
            backgroundColor: '#F6F3EE',
        },
        title: {
            fontSize: 28,
            fontWeight: 'bold',
            color: '#1A1614',
            marginBottom: 32,
        },
        input: {
            backgroundColor: '#F4F1EC',
            borderRadius: 8,
            padding: 14,
            marginBottom: 16,
            fontSize: 16,
            color: '#1A1614',
        },
        button: {
            backgroundColor: '#E4002B',
            borderRadius: 8,
            padding: 16,
            alignItems: 'center',
            marginBottom: 16,
        },
        buttonText: {
            color: '#fff',
            fontSize: 16,
            fontWeight: 'bold',
        },
        link: {
            color: '#E4002B',
            textAlign: 'center',
            fontSize: 14,
        },
    })
