import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { UnderlineTabNavigation } from '../common/UnderlineTabNavigation';
import { FamilyLocationMap } from './FamilyLocationMap';
import { FamilyMoodSummary } from './FamilyMoodSummary';
import { FamilyMemberDrawer } from './FamilyMemberDrawer';
import { ProfileFinancialTab } from '../profile/ProfileFinancialTab';
import GalleryCardContent from '../card/GalleryCardContent';
import { ScalePressable } from '../common/ScalePressable';
import { homeStyles } from '../../styles/homeStyles';
import IconMC from 'react-native-vector-icons/MaterialCommunityIcons';
import { typography } from '../../styles/typography';
import { useBranding } from '../../contexts/BrandingContext';
import CoolIcon from '../common/CoolIcon';

interface FamilyTabProps {
  familyStatusMembers: any[];
  familyLocations: any[];
  emotionData: any[];
  selectedFamily: any;
  onFamilySelect?: () => void;
}

export const FamilyTab: React.FC<FamilyTabProps> = ({
  familyStatusMembers,
  familyLocations,
  emotionData,
  selectedFamily,
  onFamilySelect,
}) => {
  /* eslint-disable @typescript-eslint/no-unused-vars */
  // Unused props kept for interface consistency or future use if needed
  // const { iconUrl } = useBranding(); 
  const [selectedMember, setSelectedMember] = useState<any | null>(null);
  const [drawerVisible, setDrawerVisible] = useState(false);
  // const [showFullMap, setShowFullMap] = useState(false); // Unused
  const [activeTab, setActiveTab] = useState('location');

  // Ref for ScrollView to enable auto-scroll
  const scrollViewRef = React.useRef<ScrollView>(null);
  // State to store the Y position of the tabs container
  const [tabsY, setTabsY] = React.useState(0);

  const tabs = [
    { id: 'location', label: 'Location', icon: 'map-marker-outline' },
    { id: 'gallery', label: 'Gallery', icon: 'image-outline' },
    { id: 'financial', label: 'Financial', icon: 'cash' },
    { id: 'health', label: 'Health', icon: 'heart-pulse' },
    { id: 'mood', label: 'Mood', icon: 'emoticon-happy-outline' },
  ];

  const handleMemberPress = (member: any) => {
    setSelectedMember(member);
    setDrawerVisible(true);
  };

  const handleTabPress = (tabId: string) => {
    setActiveTab(tabId);
    // Scroll to tabs position with a slight offset for header space if needed
    // 20px offset gives a bit of breathing room above the tabs
    if (scrollViewRef.current && tabsY > 0) {
      scrollViewRef.current.scrollTo({ y: tabsY - 20, animated: true });
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'location':
        return (
          <View style={[styles.mapSection, styles.card]}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Family Locations</Text>
              <TouchableOpacity onPress={() => setShowFullMap(true)}>
                <IconMC name="arrow-expand" size={20} color="#6B7280" />
              </TouchableOpacity>
            </View>
            <TouchableOpacity activeOpacity={0.9} onPress={() => setShowFullMap(true)} style={{ height: 250, borderRadius: 24, overflow: 'hidden' }}>
              <FamilyLocationMap
                locations={familyLocations}
                onMemberSelect={(loc: any) => {
                  const mem = familyStatusMembers.find(m => m.id === loc.userId) || familyStatusMembers[0]; // fallback
                  handleMemberPress(mem);
                }}
              />
              <View style={StyleSheet.absoluteFill} pointerEvents="box-only" />
            </TouchableOpacity>
          </View>
        );
      case 'mood':
        return (
          <View style={[styles.sectionPadding, styles.card]}>
            <FamilyMoodSummary
              onPress={() => console.log("Go to Mood Analyst")}
              emotionData={emotionData}
            />
          </View>
        );
      case 'gallery':
        return (
          <View style={[styles.card, { paddingHorizontal: 0 }]}>
            <GalleryCardContent />
          </View>
        );
      case 'financial':
        return (
          <View style={[styles.card]}>
            <ProfileFinancialTab showFinancial={true} />
          </View>
        );
      case 'health':
        return (
          <View style={[styles.sectionPadding, styles.card, { minHeight: 200, alignItems: 'center', justifyContent: 'center' }]}>
            <IconMC name="heart-pulse" size={48} color="#E5E7EB" />
            <Text style={{ marginTop: 12, color: '#9CA3AF' }}>Family Health Coming Soon</Text>
          </View>
        );
      default:
        return null;
    }
  };

  return (
    <ScrollView
      ref={scrollViewRef}
      style={styles.container}
      contentContainerStyle={{ paddingBottom: 100 }}
      showsVerticalScrollIndicator={false}
    >
      {/* Header with Family Selector REMOVED - Moved to Main Header */}
      {/* <View style={styles.header}> ... </View> */}
      <View style={{ height: 20 }} />

      {/* Members Horizontal Scroll */}
      <View style={[styles.section, styles.card, { marginBottom: 16 }]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.membersScroll}>
          {familyStatusMembers.map((member, index) => (
            <ScalePressable key={index} style={styles.memberItem} onPress={() => handleMemberPress(member)}>
              <View style={[styles.avatarContainer, { borderColor: member.status === 'online' ? '#10B981' : '#E5E7EB' }]}>
                {member.avatar ? (
                  <Image source={{ uri: member.avatar }} style={styles.avatar} />
                ) : (
                  <View style={[styles.avatar, { backgroundColor: '#FFB6C1', alignItems: 'center', justifyContent: 'center' }]}>
                    <Text style={{ color: '#FFF', fontWeight: '700', fontSize: 20 }}>{member.name.charAt(0)}</Text>
                  </View>
                )}
                {member.status === 'online' && <View style={styles.onlineBadge} />}
              </View>
              <Text style={styles.memberName} numberOfLines={1}>{member.name.split(' ')[0]}</Text>
            </ScalePressable>
          ))}
          <ScalePressable style={styles.memberItem} onPress={() => { /* Add member logic */ }}>
            <View style={[styles.avatarContainer, { borderColor: '#E5E7EB', borderStyle: 'dashed', borderWidth: 2 }]}>
              <View style={[styles.avatar, { backgroundColor: '#F9FAFB', alignItems: 'center', justifyContent: 'center' }]}>
                <IconMC name="plus" size={24} color="#9CA3AF" />
              </View>
            </View>
            <Text style={styles.memberName}>Add</Text>
          </ScalePressable>
        </ScrollView>
      </View>

      {/* Navigation Tabs */}
      <View
        style={{ paddingHorizontal: 20, marginBottom: 16 }}
        onLayout={(event) => {
          const layout = event.nativeEvent.layout;
          setTabsY(layout.y);
        }}
      >
        <UnderlineTabNavigation
          tabs={tabs}
          activeTab={activeTab}
          onTabPress={handleTabPress}
        />
      </View>

      {/* Content Area */}
      {renderContent()}

      {/* Drawers */}
      <FamilyMemberDrawer
        visible={drawerVisible}
        member={selectedMember}
        onClose={() => setDrawerVisible(false)}
      />

      {/* Full Screen Map Modal (Placeholder for now, or just alert) */}
      {/* Implement full screen map modal in next step */}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingBottom: 40,
  },
  header: {
    paddingHorizontal: 20,
    marginBottom: 20,
    marginTop: 10,
  },
  divider: {
    height: 0, // Removed
    margin: 0,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 0,
    marginHorizontal: 0,
    marginBottom: 8,
    paddingVertical: 24,
    // Shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  section: {
    // marginBottom: 0, // Handled by card
  },
  sectionPadding: {
    paddingHorizontal: 12, // Reduced for wider content
    // marginBottom: 0,
  },
  membersScroll: {
    paddingHorizontal: 12, // Reduced
    gap: 16,
  },
  memberItem: {
    alignItems: 'center',
    gap: 4,
    width: 48,
  },
  avatarContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    padding: 2,
    borderWidth: 2,
  },
  avatar: {
    width: '100%',
    height: '100%',
    borderRadius: 22,
  },
  onlineBadge: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#10B981',
    position: 'absolute',
    bottom: 0,
    right: 0,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  memberName: {
    fontSize: 12,
    fontWeight: '500',
    color: '#4B5563',
  },
  mapSection: {
    paddingHorizontal: 12,
    // marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: typography.heading,
    color: '#1F2937',
  },
});
