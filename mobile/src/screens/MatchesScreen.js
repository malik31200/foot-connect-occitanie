import React, { createContext, useContext, useEffect, useState } from 'react'
import { View, Text, FlatList, StyleSheet, ActivityIndicator, TouchableOpacity, ScrollView } from 'react-native'
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs'
import client from '../api/client'

const Tab = createMaterialTopTabNavigator()
const FiltersContext = createContext({ category: null, poule: null })

function Chip({ label, selected, onPress }) {
    return (
        <TouchableOpacity onPress={onPress} style={[styles.chip, selected && styles.chipSelected]}>
            <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{label}</Text>
        </TouchableOpacity>
    )
}

function AvenirTab() {
    const { category, poule } = useContext(FiltersContext)
    const [matches, setMatches] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (!category) return
        setLoading(true)
        let url = `/matches/?status=scheduled&season=2025&category=${encodeURIComponent(category)}`
        if (poule) url += `&group_name=${encodeURIComponent(poule)}`
        client.get(url)
        .then(res => setMatches(res.data))
        .finally(() => setLoading(false))
    }, [category, poule])

    if (loading) return <ActivityIndicator style={{ marginTop: 40}} />

    return (
        <FlatList
            data={matches}
            keyExtractor={item => item.id.toString()}
            renderItem={({ item }) => (
                <View style={styles.matchCard}>
                    <Text style={styles.teams}>{item.home_team.name} vs {item.away_team.name}</Text>
                    <Text style={styles.info}>{new Date(item.date_time).toLocaleDateString('fr-FR')} - {item.category}</Text>
                </View>
            )}
        />
    )
}

function TerminesTab() {
    const { category, poule } = useContext(FiltersContext)
    const [matches, setMatches] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (!category) return
        setLoading(true)
        let url = `/matches/?status=finished&season=2025&category=${encodeURIComponent(category)}`
        if (poule) url += `&group_name=${encodeURIComponent(poule)}`
        client.get(url)
        .then(res => setMatches(res.data))
        .finally(() => setLoading(false))
    }, [category, poule])

    if (loading) return <ActivityIndicator style={{ marginTop: 40 }} />

    return (
        <FlatList
            data={matches}
            keyExtractor={item => item.id.toString()}
            renderItem={({ item }) => (
                <View style={styles.matchCard}>
                    <Text style={styles.teams}>
                        {item.home_team.name} {item.home_score} - {item.away_score} {item.away_team.name}
                    </Text>
                    <Text style={styles.info}>{item.category}</Text>
                </View>
            )}
        />
    )
}

function ClassementTab() {
    const { category, poule } = useContext(FiltersContext)
    const [standings, setStandings] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (!category) return
        setLoading(true)
        let url = `/standings/?season=2025&category=${encodeURIComponent(category)}`
        if (poule) url += `&group_name=${encodeURIComponent(poule)}`
        client.get(url)
        .then(res => setStandings(res.data))
        .finally(() => setLoading(false))
    }, [category, poule])

    if (loading) return <ActivityIndicator style={{ marginTop: 40 }} />

    return (
        <FlatList
            data={standings}
            keyExtractor={item => item.id.toString()}
            renderItem={({ item }) => (
                <View style={styles.standingRow}>
                    <Text style={styles.rank}>{item.rank}</Text>
                    <Text style={styles.teamName}>{item.team_name}</Text>
                    <Text style={styles.stat}>{item.played}</Text>
                    <Text style={styles.stat}>{item.points}</Text>
                </View>
            )}
        />
    )
}

function CalendrierTab() {
    const { category, poule } = useContext(FiltersContext)
    const [matches, setMatches] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (!category) return
        setLoading(true)
        let url = `/matches/?season=2025&category=${encodeURIComponent(category)}`
        if (poule) url += `&group_name=${encodeURIComponent(poule)}`
        client.get(url)
        .then(res => setMatches(res.data))
        .finally(() => setLoading(false))
    }, [category, poule])

    if (loading) return <ActivityIndicator style={{ marginTop: 40 }} />

    return (
        <FlatList
            data={matches}
            keyExtractor={item => item.id.toString()}
            renderItem={({ item }) => (
                <View style={styles.matchCard}>
                    <Text style={styles.matchday}>J{item.matchday}</Text>
                    {item.status === 'finished' ? (
                        <Text style={styles.teams}>
                            {item.home_team.name} {item.home_score} - {item.away_score} {item.away_team.name}
                        </Text>
                    ) : (
                        <Text style={styles.teams}>{item.home_team.name} vs {item.away_team.name}</Text>
                    )}
                    <Text style={styles.info}>{new Date(item.date_time).toLocaleDateString('fr-FR')}</Text>
                </View>
            )}
        />
    )
}

export default function MatchesScreen() {
    const [categories, setCategories] = useState([])
    const [category, setCategory] = useState(null)
    const [groups, setGroups] = useState([])
    const [poule, setPoule] = useState(null)

    useEffect(() => {
        client.get('/matches/filters/?season=2025')
        .then(res => {
            setCategories(res.data.categories)
            if (res.data.categories.length > 0) {
                setCategory(res.data.categories[0])
            }
        })
        .catch(err => console.log('ERREUR filters:', err.message))
    }, [])

        useEffect (() => {
            if (!category) return
            setPoule(null)
            client.get(`/matches/groups/?season=2025&category=${encodeURIComponent(category)}`)
            .then(res => setGroups(res.data.groups))
        }, [category])

    return (
        <FiltersContext.Provider value={{ category, poule }}>
            <View style={{ flex: 1 }}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsRow}>
                    {categories.map(cat => (
                        <Chip key={cat} label={cat} selected={cat === category} onPress={() => setCategory(cat)} />
                    ))}
                </ScrollView>

                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsRow}>
                    <Chip label="Toutes" selected={poule === null} onPress={() => setPoule(null)} />
                    {groups.map(g => (
                        <Chip key={g} label={g} selected={g === poule} onPress={() => setPoule(g)} />
                    ))}
                </ScrollView>
                <Tab.Navigator screenOptions={{ tabBarScrollEnabled: true }}>
                    <Tab.Screen name="À venir" component={AvenirTab} />
                    <Tab.Screen name="Terminés" component={TerminesTab} />
                    <Tab.Screen name="Classement" component={ClassementTab} />
                    <Tab.Screen name="Calendrier" component={CalendrierTab} />
                </Tab.Navigator>
            </View>
        </FiltersContext.Provider>
    )
}

const styles = StyleSheet.create({
    matchCard: {
        padding: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    teams: {
        fontSize: 12,
        fontWeight: 'bold'
    },
    info: {
        fontSize: 12,
        color: '#666',
        marginTop: 2,
    },
    matchday: {
        fontSize: 11,
        color: '#999',
    },
    standingRow: {
        flexDirection: 'row',
        padding: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
        alignItems: 'center',
    },
    rank: {
        width: 30,
        fontWeight: 'bold',
        fontSize: 14,
    },
    teamName: {
        flex: 1,
        fontSize: 13,
    },
    stat: {
        width: 30,
        textAlign: 'center',
        fontSize: 13,
    },
    chipsRow: {
        paddingHorizontal: 12,
        paddingVertical: 8,
        flexGrow: 0,
    },
    chip: {
        paddingHorizontal: 14,
        paddingVertical: 6,
        borderRadius: 20,
        backgroundColor: '#eee',
        marginRight: 8,
    },
    chipSelected: {
        backgroundColor: '#e74c3c',
    },
    chipText: {
        fontSize: 13,
        color: '#333',
    },
    chipTextSelected: {
        color: '#fff',
        fontWeight: 'bold',
    },
})