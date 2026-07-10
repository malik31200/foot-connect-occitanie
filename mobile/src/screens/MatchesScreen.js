import React, { createContext, useContext, useEffect, useState } from 'react'
import {
    View, Text, FlatList, StyleSheet, ActivityIndicator,
    TouchableOpacity, ScrollView
} from 'react-native'
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs'
import { Ionicons } from '@expo/vector-icons'
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

function EmptyState({ message }) {
    return (
        <View style={styles.empty}>
            <Ionicons name="football-outline" size={48} color="#A8A29B" />
            <Text style={styles.emptyText}>{message}</Text>
        </View>
    )
}

function MatchCard({ item, showScore }) {
    return (
        <View style={styles.matchCard}>
            <View style={styles.matchHeader}>
                <Text style={styles.matchday}>J{item.matchday}</Text>
                <Text style={styles.matchDate}>
                    {new Date(item.date_time).toLocaleDateString('fr-FR', {
                        day: '2-digit', month: 'short'
                    })}
                </Text>
            </View>
            <View style={styles.matchTeams}>
                <Text style={styles.teamName} numberOfLines={1}>{item.home_team.name}</Text>
                {showScore && item.status === 'finished' ? (
                    <Text style={styles.score}>{item.home_score} - {item.away_score}</Text>
                ) : (
                    <Text style={styles.vs}>VS</Text>
                )}
                <Text style={[styles.teamName, { textAlign: 'right' }]} numberOfLines={1}>
                    {item.away_team.name}
                </Text>
            </View>
        </View>
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
            .then(res => setMatches(res.data.results || res.data))
            .finally(() => setLoading(false))
    }, [category, poule])

    if (loading) return <ActivityIndicator color="#E4002B" style={{ marginTop: 40 }} />
    if (matches.length === 0) return <EmptyState message="Aucun match à venir" />
    return (
        <FlatList data={matches} keyExtractor={item => item.id.toString()}
            contentContainerStyle={styles.list}
            renderItem={({ item }) => <MatchCard item={item} showScore={false} />} />
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
            .then(res => setMatches(res.data.results || res.data))
            .finally(() => setLoading(false))
    }, [category, poule])

    if (loading) return <ActivityIndicator color="#E4002B" style={{ marginTop: 40 }} />
    if (matches.length === 0) return <EmptyState message="Aucun résultat disponible" />
    return (
        <FlatList data={matches} keyExtractor={item => item.id.toString()}
            contentContainerStyle={styles.list}
            renderItem={({ item }) => <MatchCard item={item} showScore={true} />} />
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
            .then(res => setStandings(res.data.results || res.data))
            .finally(() => setLoading(false))
    }, [category, poule])

    if (loading) return <ActivityIndicator color="#E4002B" style={{ marginTop: 40 }} />
    if (standings.length === 0) return <EmptyState message="Classement indisponible" />

    return (
        <FlatList data={standings} keyExtractor={item => item.id.toString()}
            contentContainerStyle={styles.list}
            ListHeaderComponent={() => (
                <View style={styles.standingHeader}>
                    <Text style={[styles.standingHeaderCell, { width: 36 }]}>#</Text>
                    <Text style={[styles.standingHeaderCell, { flex: 1, textAlign: 'left' }]}>Équipe</Text>
                    <Text style={styles.standingHeaderCell}>J</Text>
                    <Text style={styles.standingHeaderCell}>+/-</Text>
                    <Text style={[styles.standingHeaderCell, { color: '#E4002B' }]}>Pts</Text>
                </View>
            )}
            renderItem={({ item, index }) => (
                <View style={[styles.standingRow, index % 2 === 0 && styles.standingRowAlt]}>
                    <Text style={[
                        styles.rank,
                        index === 0 && { color: '#F5C518' },
                        index === 1 && { color: '#A8A29B' },
                        index === 2 && { color: '#CD7F32' },
                    ]}>{item.rank}</Text>
                    <Text style={styles.teamNameStanding} numberOfLines={1}>{item.team_name}</Text>
                    <Text style={styles.standingStat}>{item.played}</Text>
                    <Text style={styles.standingStat}>
                        {item.goal_diff > 0 ? `+${item.goal_diff}` : item.goal_diff}
                    </Text>
                    <Text style={styles.standingPts}>{item.points}</Text>
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
            .then(res => setMatches(res.data.results || res.data))
            .finally(() => setLoading(false))
    }, [category, poule])

    if (loading) return <ActivityIndicator color="#E4002B" style={{ marginTop: 40 }} />
    if (matches.length === 0) return <EmptyState message="Calendrier indisponible" />
    return (
        <FlatList data={matches} keyExtractor={item => item.id.toString()}
            contentContainerStyle={styles.list}
            renderItem={({ item }) => <MatchCard item={item} showScore={true} />} />
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
                if (res.data.categories.length > 0) setCategory(res.data.categories[0])
            })
            .catch(err => console.log('ERREUR filters:', err.message))
    }, [])

    useEffect(() => {
        if (!category) return
        setPoule(null)
        client.get(`/matches/groups/?season=2025&category=${encodeURIComponent(category)}`)
            .then(res => setGroups(res.data.groups))
    }, [category])

    return (
        <FiltersContext.Provider value={{ category, poule }}>
            <View style={styles.screen}>
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>MATCHS</Text>
                </View>

                <ScrollView horizontal showsHorizontalScrollIndicator={false}
                    style={styles.chipsRow} contentContainerStyle={styles.chipsContent}>
                    {categories.map(cat => (
                        <Chip key={cat} label={cat} selected={cat === category} onPress={() => setCategory(cat)} />
                    ))}
                </ScrollView>

                {groups.length > 0 && (
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}
                        style={styles.chipsRowSmall} contentContainerStyle={styles.chipsContent}>
                        <Chip label="Toutes" selected={poule === null} onPress={() => setPoule(null)} />
                        {groups.map(g => (
                            <Chip key={g} label={g} selected={g === poule} onPress={() => setPoule(g)} />
                        ))}
                    </ScrollView>
                )}

                <Tab.Navigator screenOptions={{
                    tabBarScrollEnabled: true,
                    tabBarStyle: { backgroundColor: '#fff', elevation: 0, shadowOpacity: 0 },
                    tabBarLabelStyle: {
                        fontFamily: 'PlusJakartaSans_700Bold',
                        fontSize: 12,
                        textTransform: 'none',
                    },
                    tabBarIndicatorStyle: { backgroundColor: '#E4002B', height: 2 },
                    tabBarActiveTintColor: '#E4002B',
                    tabBarInactiveTintColor: '#A8A29B',
                }}>
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
    screen: { flex: 1, backgroundColor: '#F6F3EE' },
    header: {
        backgroundColor: '#fff',
        paddingTop: 56,
        paddingBottom: 14,
        paddingHorizontal: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#F4F1EC',
    },
    headerTitle: { fontFamily: 'Anton_400Regular', fontSize: 28, color: '#1A1614' },
    chipsRow: { flexGrow: 0, backgroundColor: '#fff', paddingVertical: 10 },
    chipsRowSmall: { flexGrow: 0, backgroundColor: '#F6F3EE', paddingVertical: 8 },
    chipsContent: { paddingHorizontal: 16, gap: 8 },
    chip: { paddingHorizontal: 16, paddingVertical: 7, borderRadius: 999, backgroundColor: '#F4F1EC' },
    chipSelected: { backgroundColor: '#E4002B' },
    chipText: { fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 13, color: '#5C564F' },
    chipTextSelected: { color: '#fff' },
    list: { padding: 12, gap: 8 },
    empty: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 60, gap: 12 },
    emptyText: { fontFamily: 'PlusJakartaSans_400Regular', fontSize: 15, color: '#A8A29B' },
    matchCard: { backgroundColor: '#fff', borderRadius: 12, padding: 14 },
    matchHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
    matchday: { fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 12, color: '#A8A29B' },
    matchDate: { fontFamily: 'PlusJakartaSans_400Regular', fontSize: 12, color: '#5C564F' },
    matchTeams: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    teamName: { flex: 1, fontFamily: 'PlusJakartaSans_700Bold', fontSize: 13, color: '#1A1614' },
    score: { fontFamily: 'Anton_400Regular', fontSize: 20, color: '#E4002B', marginHorizontal: 12, minWidth: 60, textAlign: 'center' },
    vs: { fontFamily: 'Anton_400Regular', fontSize: 14, color: '#A8A29B', marginHorizontal: 12, minWidth: 40, textAlign: 'center' },
    standingHeader: {
        flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14,
        paddingVertical: 10, backgroundColor: '#F4F1EC', borderRadius: 10, marginBottom: 4,
    },
    standingHeaderCell: {
        fontFamily: 'PlusJakartaSans_700Bold', fontSize: 11, color: '#5C564F',
        width: 36, textAlign: 'center', textTransform: 'uppercase',
    },
    standingRow: {
        flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff',
        borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, marginBottom: 4,
    },
    standingRowAlt: { backgroundColor: '#FAFAF9' },
    rank: { fontFamily: 'Anton_400Regular', fontSize: 18, width: 36, color: '#1A1614', textAlign: 'center' },
    teamNameStanding: { flex: 1, fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 13, color: '#1A1614', marginRight: 8 },
    standingStat: { fontFamily: 'PlusJakartaSans_400Regular', fontSize: 13, color: '#5C564F', width: 36, textAlign: 'center' },
    standingPts: { fontFamily: 'Anton_400Regular', fontSize: 16, color: '#E4002B', width: 36, textAlign: 'center' },
})
