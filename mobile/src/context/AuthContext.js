import React, { createContext, useContext, useState, useEffect } from 'react'
import * as SecureStore from 'expo-secure-store'
import client from '../api/client'

const AuthContext = createContext(null)

// Clé de stockage dans le coffre sécurisé du téléphone
const REFRESH_KEY = 'refresh_token'

export function AuthProvider({ children }) {
    const [token, setToken] = useState(null)
    // loading = true pendant qu'on vérifie si l'utilisateur est déjà connecté
    const [loading, setLoading] = useState(true)

    // Au démarrage de l'appli : tente de se reconnecter automatiquement
    useEffect(() => {
        async function tryAutoLogin() {
            try {
                const refreshToken = await SecureStore.getItemAsync(REFRESH_KEY)
                if (refreshToken) {
                    // On a un refresh token → on demande un nouvel access token
                    const res = await client.post('/auth/refresh/', { refresh: refreshToken })
                    setToken(res.data.access)
                }
            } catch {
                // Refresh token expiré ou invalide → on efface et on affiche le login
                await SecureStore.deleteItemAsync(REFRESH_KEY)
            } finally {
                setLoading(false)
            }
        }
        tryAutoLogin()
    }, [])

    // Appelé après un login réussi — sauvegarde le refresh token sur l'appareil
    async function login(accessToken, refreshToken) {
        setToken(accessToken)
        if (refreshToken) {
            await SecureStore.setItemAsync(REFRESH_KEY, refreshToken)
        }
    }

    // Efface tout → retour à l'écran de connexion
    async function logout() {
        setToken(null)
        await SecureStore.deleteItemAsync(REFRESH_KEY)
    }

    return (
        <AuthContext.Provider value={{ token, login, logout, loading }}>
            {children}
        </AuthContext.Provider>
    )
}

export function useAuth() {
    return useContext(AuthContext)
}
