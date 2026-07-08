import React, { useState } from 'react'
import {
    View, Text, TextInput, TouchableOpacity,
    StyleSheet, ActivityIndicator, Alert
} from 'react-native'
import client from '../api/client'
import { useAuth } from '../context/AuthContext'

export default function RegisterScreen({ navigation }) {
    const { login } = useAuth()
    const [username, setUsername] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)

    async function handleRegister() {
        if (!username || !email || !password) {
            Alert.alert('Erreur', 'Remplis tous les champs.')
            return
        }
        setLoading(true)
        try{
            await client.post('/auth/register/', { username, email, password })
            const res = await client.post('/auth/login/', { email, password })
            login(res.data.access)
        } catch (e) {
            const msg  = e.response?.data
                ? Object.values(e.response.data).flat().join('\n')
                : 'Erreur réseau.'
                Alert.alert('Erreur', msg)
        }
    }

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Inscription</Text>

            <TextInput
            style={styles.input}
            placeholder="Nom d'utilisateur"
            value={username}
            onChangeText={setUsername}
            autoCapitalize='none'
            />
            <TextInput
            style={styles.input}
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
            keyboardType='email-address'
            autoCapitalize='none'
            />
            <TextInput
            style={styles.input}
            placeholder="Mot de passe"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            />

            <TouchableOpacity style={styles.button} onPress={handleRegister} disabled={loading}>
                {loading
                    ? <ActivityIndicator color='#fff' />
                    : <Text style={styles.buttonText}>S'inscrire</Text>}
            </TouchableOpacity>

            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                <Text style={styles.link}>Déjà un compte ? Se connecter</Text>
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