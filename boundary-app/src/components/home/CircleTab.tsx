import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Dimensions, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { ScalePressable } from '../common/ScalePressable';
import { homeStyles } from '../../styles/homeStyles';
import { CircleLocationMap } from './CircleLocationMap';

import { CircleMemberDrawer } from './CircleMemberDrawer';
import { CircleHealthTab } from './CircleHealthTab';
import { ProfileFinancialTab } from '../profile/ProfileFinancialTab';
import GalleryCardContent from '../card/GalleryCardContent';
import { CircleFilesTab } from '../files';

import { 
  Plus,
  Activity
} from 'lucide-react-native';
import { typography } from '../../styles/typography';

const PlusIcon = Plus as any;
const ActivityIcon = Activity as any;

interface CircleTabProps {
  circleStatusMembers: any[];
  circleLocations: any[];
  emotionData: any[];
  selectedCircle: string | null;
  currentCircle?: any;
  onCircleSelect: () => void;
  activeTab: string;
  onAddMember?: () => void;
}

export const CircleTab: React.FC<CircleTabProps> = ({
  circleStatusMembers,
  circleLocations,
  emotionData,
  activeTab,
  currentCircle,
  onAddMember,
}) => {
  /* eslint-disable @typescript-eslint/no-unused-vars */
  const [selectedMember, setSelectedMember] = useState<any | null>(null);
  const [drawerVisible, setDrawerVisible] = useState(false);

  // Ref for ScrollView to enable auto-scroll
  const scrollViewRef = React.useRef<ScrollView>(null);
  const { height } = Dimensions.get('window');
  const insets = useSafeAreaInsets();

  const handleMemberPress = (member: any) => {
    setSelectedMember(member);
    setDrawerVisible(true);
  };



  const renderContent = () => {
    switch (activeTab) {
      case 'location':
        return (
          <View style={[styles.locationContainer, { height: height - 250 }]}>
            <CircleLocationMap
              locations={circleLocations || []}
              onMemberSelect={(loc: any) => {
                const mem = circleStatusMembers.find(m => m.id === loc.userId) || circleStatusMembers[0]; 
                handleMemberPress(mem);
              }}
            />
            
            {/* Top Fade Gradient */}
            <LinearGradient
              colors={['rgba(255,255,255,1)', 'rgba(255,255,255,0)']}
              style={styles.topMapFade}
            />

            {/* Bottom Fade Gradient */}
            <LinearGradient
              colors={['rgba(255,255,255,0)', 'rgba(255,255,255,0.8)', 'rgba(255,255,255,1)']}
              style={styles.bottomMapFade}
            />
              
            {/* Floating Horizontal Member List Overlay */}
            <View style={[styles.floatingMemberOverlay, { bottom: insets.bottom + 104 }]}>
               <ScalePressable 
                  onPress={() => setDrawerVisible(true)}
                  style={[styles.memberListContainer, homeStyles.glassEffect]}
               >
                    <View style={styles.avatarsWrapper}>
                        {circleStatusMembers.slice(0, 5).map((member, index) => (
                            <View 
                                key={member.id || index} 
                                style={[
                                    styles.avatarOverlayItem, 
                                    { 
                                        zIndex: 10 - index,
                                        marginLeft: index === 0 ? 0 : -15 
                                    }
                                ]}
                            >
                                {member.avatar ? (
                                    <Image source={{ uri: member.avatar }} style={styles.avatarOverlayImage} />
                                ) : (
                                    <View style={[styles.avatarOverlayImage, { backgroundColor: '#FFB6C1', alignItems: 'center', justifyContent: 'center' }]}>
                                        <Text style={{ color: '#FFF', fontWeight: '700', fontSize: 12 }}>{member.name?.charAt(0)}</Text>
                                    </View>
                                )}
                            </View>
                        ))}
                        {circleStatusMembers.length > 5 && (
                             <View style={[styles.avatarOverlayItem, { zIndex: 0, marginLeft: -15, backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center' }]}>
                                <Text style={{ color: '#6B7280', fontSize: 10, fontWeight: '600' }}>+{circleStatusMembers.length - 5}</Text>
                             </View>
                        )}
                        {/* Add Member Button */}
                        <TouchableOpacity 
                            style={[
                                styles.avatarOverlayItem, 
                                { 
                                    zIndex: 0, 
                                    marginLeft: -15, 
                                    backgroundColor: '#FFFFFF', // Clean white background
                                    alignItems: 'center', 
                                    justifyContent: 'center',
                                    borderColor: '#E5E7EB', // Subtle border
                                    borderStyle: 'dashed', // Dashed border to indicate action
                                }
                            ]}
                            onPress={onAddMember}
                        >
                            <PlusIcon size={14} color="#6B7280" />
                        </TouchableOpacity>
                    </View>
                    <View style={styles.memberListTextContainer}>
                         <Text style={styles.memberListTitle}>Circle Members</Text>
                         <Text style={styles.memberListSubtitle}>{circleStatusMembers.length} people</Text>
                    </View>
                    <View style={styles.expandIcon}>
                         <ActivityIcon size={16} color="#9CA3AF" />
                    </View>
               </ScalePressable>
            </View>
          </View>
        );

      case 'gallery':
        return (
          <View style={[styles.card, { paddingHorizontal: 0 }]}>
            <GalleryCardContent darkMode={false} />
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
          <CircleHealthTab emotionData={emotionData} />
        );
      case 'files':
        return currentCircle?.id ? (
          <View style={[styles.card, { flex: 1, minHeight: 400 }]}>
            <CircleFilesTab 
              circleId={currentCircle.id} 
              circleName={currentCircle.name}
            />
          </View>
        ) : null;
      default:
        return null;
    }
  };


  return (
    <View style={styles.mainContainer}>
      {activeTab === 'location' ? (
        // For location tab, don't use ScrollView - map should be fixed height
        <View style={{ flex: 1 }}>
          {renderContent()}
        </View>
      ) : (
        <ScrollView
          ref={scrollViewRef}
          style={styles.container}
          contentContainerStyle={{ paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
        >
          <View style={{ height: 16 }} />
          {renderContent()}
        </ScrollView>
      )}

      {/* Drawers */}
      <CircleMemberDrawer
        visible={drawerVisible}
        member={selectedMember}
        members={circleStatusMembers}
        onClose={() => {
            setDrawerVisible(false);
            setSelectedMember(null); // Reset selection on close
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  circleInfoSection: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  circleAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    marginRight: 16,
    backgroundColor: '#F3F4F6',
  },
  circleAvatarPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FA7272',
  },
  circleAvatarText: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  circleInfoText: {
    flex: 1,
  },
  circleName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  circleDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  locationContainer: {
    width: '100%',
    position: 'relative',
    backgroundColor: 'transparent',
  },
  container: {
    flex: 1,
  },
  card: {
    backgroundColor: 'transparent',
    borderRadius: 0,
    marginHorizontal: 0,
    marginBottom: 0,
    elevation: 0,
  },
  sectionPadding: {
    paddingHorizontal: 20,
  },
  mapSection: {
    paddingHorizontal: 20,
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
  
  // Floating Member Overlay
  floatingMemberOverlay: {
    position: 'absolute',
    bottom: 24,
    left: 20,
    right: 20,
    alignItems: 'center', // Center it visually? Or keep it like a card?
    justifyContent: 'center',
    zIndex: 20,
  },
  memberListContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 24,
    paddingVertical: 14,
    paddingHorizontal: 16,
    width: '100%',
  },
  topMapFade: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 40,
    zIndex: 5,
  },
  bottomMapFade: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 120, // Increased height for smoother blend
    zIndex: 5,
  },
  avatarsWrapper: {
      flexDirection: 'row',
      alignItems: 'center',
      marginRight: 12,
  },
  avatarOverlayItem: {
      width: 36,
      height: 36,
      borderRadius: 18,
      borderWidth: 2,
      borderColor: '#FFFFFF',
      overflow: 'hidden',
  },
  avatarOverlayImage: {
      width: '100%',
      height: '100%',
      borderRadius: 18,
  },
  memberListTextContainer: {
      flex: 1,
  },
  memberListTitle: {
      fontSize: 14,
      fontWeight: '600',
      color: '#111827',
  },
  memberListSubtitle: {
      fontSize: 12,
      color: '#6B7280',
  },
  expandIcon: {
      marginLeft: 8,
  },

  // Member Row Styles
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  avatarContainerRow: {
    width: 50,
    height: 50,
    borderRadius: 25,
    padding: 2,
    borderWidth: 2,
    marginRight: 16,
  },
  avatarRow: {
    width: '100%',
    height: '100%',
    borderRadius: 23,
  },
  onlineBadgeRow: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#10B981',
    position: 'absolute',
    bottom: 0,
    right: 0,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  memberInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  memberNameRow: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  memberLocation: {
    fontSize: 13,
    color: '#6B7280',
    flex: 1,
  },
  addMemberRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 16,
      paddingHorizontal: 20,
  },
  addMemberIcon: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: '#FEF2F2',
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 16,
  },
  addMemberText: {
      fontSize: 16,
      fontWeight: '600',
      color: '#FA7272',
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FA7272',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    zIndex: 100,
  }
});


