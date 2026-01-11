import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, Pressable, ScrollView, TextInput, ActivityIndicator } from 'react-native';
import IconMC from 'react-native-vector-icons/MaterialCommunityIcons';
import { countryService, Country } from '../../services/dataServices';
import { GeoScope, DistanceUnit, CustomCoordinates } from './PostFilterHeader';

// Conversion constants
const KM_TO_MILE = 0.621371;
const MILE_TO_KM = 1.60934;

interface LocationFilterDrawerProps {
    visible: boolean;
    onClose: () => void;

    geoScope: GeoScope;
    onGeoScopeChange: (scope: GeoScope) => void;
    distanceKm: number | null;
    onDistanceChange: (km: number) => void;
    distanceUnit: DistanceUnit;
    onDistanceUnitChange: (unit: DistanceUnit) => void;
    selectedCountry?: string;
    onCountryChange?: (country: string) => void;
    customCoordinates?: CustomCoordinates;
    onCustomCoordinatesChange?: (coords: CustomCoordinates) => void;
}

export const LocationFilterDrawer: React.FC<LocationFilterDrawerProps> = ({
    visible,
    onClose,
    geoScope,
    onGeoScopeChange,
    distanceKm,
    onDistanceChange,
    distanceUnit,
    onDistanceUnitChange,
    selectedCountry,
    onCountryChange,
    customCoordinates,
    onCustomCoordinatesChange,
}) => {
    // Additional Drawers state within this context
    const [countryPickerVisible, setCountryPickerVisible] = React.useState(false);
    const [searchQuery, setSearchQuery] = React.useState('');
    const [customCoordsModalVisible, setCustomCoordsModalVisible] = React.useState(false);

    // Custom Input State
    const [customDistanceInput, setCustomDistanceInput] = React.useState('');
    const [showCustomDistanceInput, setShowCustomDistanceInput] = React.useState(false);

    const [customLatInput, setCustomLatInput] = React.useState('');
    const [customLngInput, setCustomLngInput] = React.useState('');
    const [customNameInput, setCustomNameInput] = React.useState('');

    // Countries State
    const [countries, setCountries] = React.useState<Country[]>([]);
    const [loadingCountries, setLoadingCountries] = React.useState(false);

    // Fetch countries on mount if visible? Or just once.
    React.useEffect(() => {
        if (visible && countries.length === 0) {
            const fetchCountries = async () => {
                setLoadingCountries(true);
                const data = await countryService.getCountries();
                setCountries(data);
                setLoadingCountries(false);
            };
            fetchCountries();
        }
    }, [visible]);

    const getUnitLabel = (): string => {
        return distanceUnit === 'mile' ? 'mi' : 'km';
    };

    const toDisplayUnit = (km: number): number => {
        return distanceUnit === 'mile' ? km * KM_TO_MILE : km;
    };

    const toKm = (value: number): number => {
        return distanceUnit === 'mile' ? value * MILE_TO_KM : value;
    };

    const distanceOptions = [
        { label: `1${getUnitLabel()}`, valueKm: distanceUnit === 'mile' ? 1.60934 : 1 },
        { label: `5${getUnitLabel()}`, valueKm: distanceUnit === 'mile' ? 8.0467 : 5 },
        { label: `10${getUnitLabel()}`, valueKm: distanceUnit === 'mile' ? 16.0934 : 10 },
        { label: `25${getUnitLabel()}`, valueKm: distanceUnit === 'mile' ? 40.2336 : 25 },
        { label: `50${getUnitLabel()}`, valueKm: distanceUnit === 'mile' ? 80.4672 : 50 },
    ];

    const handleCustomDistanceSubmit = () => {
        const value = parseFloat(customDistanceInput);
        if (!isNaN(value) && value > 0) {
            onDistanceChange(toKm(value));
            setShowCustomDistanceInput(false);
            setCustomDistanceInput('');
            onClose();
        }
    };

    const handleCustomCoordsSubmit = () => {
        const lat = parseFloat(customLatInput);
        const lng = parseFloat(customLngInput);
        if (!isNaN(lat) && !isNaN(lng)) {
            onCustomCoordinatesChange?.({
                latitude: lat,
                longitude: lng,
                name: customNameInput || `${lat.toFixed(4)}, ${lng.toFixed(4)}`
            });
            setCustomCoordsModalVisible(false);
            onClose();
        }
    };

    return (
        <>
            <Modal
                visible={visible}
                transparent
                animationType="slide"
                onRequestClose={onClose}
            >
                <Pressable style={styles.drawerOverlay} onPress={onClose}>
                    <Pressable style={styles.drawer} onPress={e => e.stopPropagation()}>
                        <View style={styles.drawerHandle} />
                        <Text style={styles.drawerTitle}>Filter by Location</Text>

                        {/* Scope Options */}
                        <View style={styles.optionSection}>
                            <Text style={styles.optionLabel}>Scope</Text>
                            {[
                                { value: 'worldwide', label: 'Worldwide', icon: 'earth' },
                                { value: 'country', label: selectedCountry || 'Select Country', icon: 'flag' },
                                { value: 'nearby', label: 'Nearby', icon: 'map-marker-radius' },
                                { value: 'custom', label: customCoordinates?.name || 'Custom Location', icon: 'crosshairs-gps' },
                            ].map((option) => (
                                <TouchableOpacity
                                    key={option.value}
                                    style={[styles.optionItem, geoScope === option.value && styles.optionItemSelected]}
                                    onPress={() => {
                                        onGeoScopeChange(option.value as GeoScope);
                                        if (option.value === 'country') {
                                            setCountryPickerVisible(true);
                                        } else if (option.value === 'custom') {
                                            setCustomCoordsModalVisible(true);
                                        }
                                        if (option.value === 'worldwide') {
                                            onClose();
                                        }
                                    }}
                                >
                                    <IconMC name={option.icon} size={20} color={geoScope === option.value ? '#EF4444' : '#6B7280'} />
                                    <Text style={[styles.optionText, geoScope === option.value && styles.optionTextSelected]}>
                                        {option.label}
                                    </Text>
                                    {geoScope === option.value && <IconMC name="check" size={20} color="#EF4444" />}
                                </TouchableOpacity>
                            ))}
                        </View>

                        {/* Distance Options - Show for Nearby AND Custom scope */}
                        {(geoScope === 'nearby' || geoScope === 'custom') && (
                            <View style={styles.optionSection}>
                                <View style={styles.distanceHeader}>
                                    <Text style={styles.optionLabel}>Distance</Text>
                                    {/* Unit Toggle */}
                                    <View style={styles.unitToggle}>
                                        {['km', 'mile'].map((unit) => (
                                            <TouchableOpacity
                                                key={unit}
                                                style={[styles.unitOption, distanceUnit === unit && styles.unitOptionSelected]}
                                                onPress={() => onDistanceUnitChange(unit as DistanceUnit)}
                                            >
                                                <Text style={[styles.unitText, distanceUnit === unit && styles.unitTextSelected]}>
                                                    {unit}
                                                </Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                </View>

                                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.distanceChips}>
                                    {distanceOptions.map((opt) => (
                                        <TouchableOpacity
                                            key={opt.label}
                                            style={[
                                                styles.distanceChip,
                                                distanceKm !== null && Math.abs(opt.valueKm - distanceKm) < 0.1 && styles.distanceChipSelected
                                            ]}
                                            onPress={() => {
                                                onDistanceChange(opt.valueKm);
                                                onClose();
                                            }}
                                        >
                                            <Text style={[
                                                styles.distanceChipText,
                                                distanceKm !== null && Math.abs(opt.valueKm - distanceKm) < 0.1 && styles.distanceChipTextSelected
                                            ]}>
                                                {opt.label}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                    <TouchableOpacity
                                        style={styles.distanceChip}
                                        onPress={() => setShowCustomDistanceInput(true)}
                                    >
                                        <Text style={styles.distanceChipText}>Custom</Text>
                                    </TouchableOpacity>
                                </ScrollView>

                                {/* Custom Distance Input */}
                                {showCustomDistanceInput && (
                                    <View style={styles.customDistanceRow}>
                                        <TextInput
                                            style={styles.customDistanceInput}
                                            value={customDistanceInput}
                                            onChangeText={setCustomDistanceInput}
                                            placeholder={`Enter ${getUnitLabel()}`}
                                            keyboardType="numeric"
                                            autoFocus
                                        />
                                        <TouchableOpacity style={styles.applyButton} onPress={handleCustomDistanceSubmit}>
                                            <Text style={styles.applyButtonText}>Apply</Text>
                                        </TouchableOpacity>
                                    </View>
                                )}
                            </View>
                        )}

                        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                            <Text style={styles.closeButtonText}>Done</Text>
                        </TouchableOpacity>
                    </Pressable>
                </Pressable>
            </Modal>

            {/* Country Picker Modal - Keeping inside here or could be separate */}
            <Modal
                visible={countryPickerVisible}
                transparent
                animationType="slide"
                onRequestClose={() => setCountryPickerVisible(false)}
            >
                <Pressable style={styles.drawerOverlay} onPress={() => setCountryPickerVisible(false)}>
                    <Pressable style={styles.drawer} onPress={e => e.stopPropagation()}>
                        <View style={styles.drawerHandle} />
                        <Text style={styles.drawerTitle}>Select Country</Text>

                        {/* Search Bar */}
                        <View style={styles.searchContainer}>
                            <IconMC name="magnify" size={20} color="#9CA3AF" style={styles.searchIcon} />
                            <TextInput
                                style={styles.searchInput}
                                placeholder="Search country..."
                                placeholderTextColor="#9CA3AF"
                                value={searchQuery}
                                onChangeText={setSearchQuery}
                                autoCorrect={false}
                            />
                            {searchQuery.length > 0 && (
                                <TouchableOpacity onPress={() => setSearchQuery('')}>
                                    <IconMC name="close-circle" size={18} color="#9CA3AF" />
                                </TouchableOpacity>
                            )}
                        </View>

                        <ScrollView showsVerticalScrollIndicator={false}>
                            {loadingCountries ? (
                                <View style={{ padding: 20 }}>
                                    <ActivityIndicator size="large" color="#FF5A5A" />
                                </View>
                            ) : (
                                <>
                                    {countries.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase())).map((country) => (
                                        <TouchableOpacity
                                            key={country.name}
                                            style={[styles.optionItem, selectedCountry === country.name && styles.optionItemSelected]}
                                            onPress={() => {
                                                onCountryChange?.(country.name);
                                                setCountryPickerVisible(false);
                                                onClose(); // Close parent
                                                setSearchQuery('');
                                            }}
                                        >
                                            <Text style={styles.flagText}>{country.flag}</Text>
                                            <Text style={[styles.optionText, selectedCountry === country.name && styles.optionTextSelected]}>
                                                {country.name}
                                            </Text>
                                            {selectedCountry === country.name && <IconMC name="check" size={20} color="#EF4444" />}
                                        </TouchableOpacity>
                                    ))}
                                </>
                            )}
                        </ScrollView>
                        <TouchableOpacity style={styles.closeButton} onPress={() => setCountryPickerVisible(false)}>
                            <Text style={styles.closeButtonText}>Cancel</Text>
                        </TouchableOpacity>
                    </Pressable>
                </Pressable>
            </Modal>

            <Modal
                visible={customCoordsModalVisible}
                transparent={true}
                animationType="slide"
                onRequestClose={() => setCustomCoordsModalVisible(false)}
            >
                <Pressable
                    style={styles.drawerOverlay}
                    onPress={() => setCustomCoordsModalVisible(false)}
                >
                    <Pressable style={styles.drawerSmall} onPress={(e) => e.stopPropagation()}>
                        <View style={styles.drawerHandle} />
                        <Text style={styles.drawerTitle}>Custom Location</Text>

                        {/* Location Name */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>Name (optional)</Text>
                            <TextInput
                                style={styles.inputFull}
                                value={customNameInput}
                                onChangeText={setCustomNameInput}
                                placeholder="e.g., Beach Resort"
                                placeholderTextColor="#9CA3AF"
                            />
                        </View>

                        {/* Coordinates Row */}
                        <View style={styles.coordsRow}>
                            <View style={styles.coordInput}>
                                <Text style={styles.inputLabel}>Latitude</Text>
                                <TextInput
                                    style={styles.inputFull}
                                    value={customLatInput}
                                    onChangeText={setCustomLatInput}
                                    placeholder="e.g., 13.7563"
                                    placeholderTextColor="#9CA3AF"
                                    keyboardType="numeric"
                                />
                            </View>
                            <View style={styles.coordInput}>
                                <Text style={styles.inputLabel}>Longitude</Text>
                                <TextInput
                                    style={styles.inputFull}
                                    value={customLngInput}
                                    onChangeText={setCustomLngInput}
                                    placeholder="e.g., 100.5018"
                                    placeholderTextColor="#9CA3AF"
                                    keyboardType="numeric"
                                />
                            </View>
                        </View>

                        <View style={styles.modalButtons}>
                            <TouchableOpacity
                                style={styles.modalButtonCancel}
                                onPress={() => setCustomCoordsModalVisible(false)}
                            >
                                <Text style={styles.modalButtonCancelText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.modalButtonConfirm}
                                onPress={handleCustomCoordsSubmit}
                            >
                                <Text style={styles.modalButtonConfirmText}>Apply</Text>
                            </TouchableOpacity>
                        </View>
                    </Pressable>
                </Pressable>
            </Modal>
        </>
    );
};

const styles = StyleSheet.create({
    drawerOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    drawer: {
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 20,
        paddingBottom: 40,
        maxHeight: '80%',
    },
    drawerSmall: {
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 20,
        paddingBottom: 40,
    },
    drawerHandle: {
        width: 40,
        height: 4,
        backgroundColor: '#D1D5DB',
        borderRadius: 2,
        alignSelf: 'center',
        marginBottom: 16,
    },
    drawerTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#1F2937',
        marginBottom: 20,
        textAlign: 'center',
    },
    optionSection: {
        marginBottom: 20,
    },
    optionLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#6B7280',
        marginBottom: 12,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    optionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        paddingHorizontal: 12,
        borderRadius: 12,
        marginBottom: 8,
        backgroundColor: '#F9FAFB',
        gap: 12,
    },
    optionItemSelected: {
        backgroundColor: '#FEF2F2',
        borderWidth: 1,
        borderColor: '#EF4444',
    },
    optionText: {
        flex: 1,
        fontSize: 16,
        color: '#374151',
    },
    optionTextSelected: {
        color: '#EF4444',
        fontWeight: '500',
    },
    distanceHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    unitToggle: {
        flexDirection: 'row',
        backgroundColor: '#F3F4F6',
        borderRadius: 8,
        padding: 2,
    },
    unitOption: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 6,
    },
    unitOptionSelected: {
        backgroundColor: '#FFFFFF',
    },
    unitText: {
        fontSize: 13,
        color: '#6B7280',
    },
    unitTextSelected: {
        color: '#EF4444',
        fontWeight: '600',
    },
    distanceChips: {
        flexDirection: 'row',
        marginBottom: 12,
    },
    distanceChip: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        backgroundColor: '#F3F4F6',
        borderRadius: 20,
        marginRight: 8,
    },
    distanceChipSelected: {
        backgroundColor: '#EF4444',
    },
    distanceChipText: {
        fontSize: 14,
        color: '#374151',
        fontWeight: '500',
    },
    distanceChipTextSelected: {
        color: '#FFFFFF',
    },
    customDistanceRow: {
        flexDirection: 'row',
        gap: 8,
        marginTop: 8,
    },
    customDistanceInput: {
        flex: 1,
        borderWidth: 1,
        borderColor: '#D1D5DB',
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 10,
        fontSize: 16,
    },
    applyButton: {
        backgroundColor: '#EF4444',
        paddingHorizontal: 20,
        borderRadius: 8,
        justifyContent: 'center',
    },
    applyButtonText: {
        color: '#FFFFFF',
        fontWeight: '600',
        fontSize: 14,
    },
    closeButton: {
        backgroundColor: '#EF4444',
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 8,
    },
    closeButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F3F4F6',
        borderRadius: 12,
        paddingHorizontal: 12,
        paddingVertical: 10,
        marginBottom: 16,
    },
    searchIcon: {
        marginRight: 8,
    },
    searchInput: {
        flex: 1,
        fontSize: 16,
        color: '#1F2937',
    },
    flagText: {
        fontSize: 24,
        marginRight: 12,
    },
    inputGroup: {
        marginBottom: 16,
    },
    inputLabel: {
        fontSize: 14,
        fontWeight: '500',
        color: '#4B5563',
        marginBottom: 8,
    },
    inputFull: {
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 10,
        fontSize: 16,
        color: '#1F2937',
        backgroundColor: '#F9FAFB',
    },
    coordsRow: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 24,
    },
    coordInput: {
        flex: 1,
    },
    modalButtons: {
        flexDirection: 'row',
        gap: 12,
    },
    modalButtonCancel: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 8,
        backgroundColor: '#F3F4F6',
        alignItems: 'center',
    },
    modalButtonCancelText: {
        color: '#4B5563',
        fontWeight: '600',
        fontSize: 16,
    },
    modalButtonConfirm: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 8,
        backgroundColor: '#EF4444',
        alignItems: 'center',
    },
    modalButtonConfirmText: {
        color: '#FFFFFF',
        fontWeight: '600',
        fontSize: 16,
    },
});
