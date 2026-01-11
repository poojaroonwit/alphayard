import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, ScrollView } from 'react-native';
import DraggableFlatList, { ScaleDecorator, RenderItemParams } from 'react-native-draggable-flatlist';
import IconMC from 'react-native-vector-icons/MaterialCommunityIcons';
import { homeStyles } from '../../styles/homeStyles';
import { FamilyMemberDrawer } from './FamilyMemberDrawer';
import { CalendarDrawer } from './CalendarDrawer';
import { ChatbotBriefing } from './ChatbotBriefing';
import { MiniAppsGrid } from './MiniAppsGrid';
import { FinanceSummary } from './FinanceSummary';
import { HealthSummary } from './HealthSummary';
import { CustomizationOptionDrawer } from './CustomizationOptionDrawer';


interface YouTabProps {
  familyStatusMembers: any[];
  familyLocations: any[];
  selectedFamily?: any;
  isFamilyLoading?: boolean;
  onOpenApps: () => void;
  onGoToFinance: () => void;
}

export const YouTab: React.FC<YouTabProps> = ({
  onOpenApps,
  onGoToFinance,
}) => {
  // const { onlineUserIds } = useSocket(); // Unused
  const [showCalendarDrawer, setShowCalendarDrawer] = useState(false);
  // const [refreshing, setRefreshing] = useState(false);

  const [drawerVisible, setDrawerVisible] = useState(false);
  const [selectedMember] = useState<any | null>(null); // Kept state but removed setter warning // Kept for Drawer
  // const [isLoading, setIsLoading] = useState(true);

  // const loadData = async () => { ... } // Removed empty function
  // useEffect removed as loadData is gone

  // Widget Registry
  const WIDGET_REGISTRY = {
    briefing: { id: 'briefing', name: 'Daily Briefing & Apps', component: ChatbotBriefing, height: 320 },
    apps: { id: 'apps', name: 'Mini Apps', component: MiniAppsGrid, height: 200 },
    finance: { id: 'finance', name: 'Finance Summary', component: FinanceSummary, height: 200 },
    health: { id: 'health', name: 'Health Summary', component: HealthSummary, height: 200 },
  };

  const [isCustomizing, setIsCustomizing] = useState(false);
  const [widgets, setWidgets] = useState([
    WIDGET_REGISTRY.briefing,
    WIDGET_REGISTRY.finance,
    WIDGET_REGISTRY.health,
  ]);
  const [showAddWidgetModal, setShowAddWidgetModal] = useState(false);
  const [showCustomOptionDrawer, setShowCustomOptionDrawer] = useState(false);

  // Available widgets to add (excluding current ones)
  const availableWidgets = Object.values(WIDGET_REGISTRY).filter(
    w => !widgets.find(existing => existing.id === w.id)
  );

  const handleRemoveWidget = (id: string) => {
    setWidgets(prev => prev.filter(w => w.id !== id));
  };

  const handleAddWidget = (widget: any) => {
    setWidgets(prev => [...prev, widget]);
    setShowAddWidgetModal(false);
  };

  const renderWidget = ({ item, drag, isActive }: RenderItemParams<any>) => {
    const WidgetComponent = item.component;

    // Component-specific props
    const getProps = (id: string) => {
      switch (id) {
        case 'briefing': return { onCustomize: () => setShowCustomOptionDrawer(true), onSeeAllApps: onOpenApps };
        case 'apps': return { onSeeAllPress: onOpenApps };
        case 'finance': return { onGoToFinance: onGoToFinance };
        case 'health': return { onGoToHealth: () => console.log('Nav to health') };
        default: return {};
      }
    };

    return (
      <ScaleDecorator>
        <TouchableOpacity
          onLongPress={isCustomizing ? drag : undefined}
          disabled={!isCustomizing}
          activeOpacity={1}
          style={[
            {
              backgroundColor: item.id === 'briefing' ? '#FFFFFF' : '#FFFFFF', // White for briefing too, as requested
              borderRadius: item.id === 'briefing' ? 0 : 0,
              paddingHorizontal: item.id === 'briefing' ? 0 : 12, // Remove padding for briefing
              paddingVertical: item.id === 'briefing' ? 0 : 8,
              marginBottom: 16,
              marginHorizontal: 0,
              // Shadow - remove for briefing
              shadowColor: item.id === 'briefing' ? 'transparent' : '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: item.id === 'briefing' ? 0 : 0.05,
              shadowRadius: item.id === 'briefing' ? 0 : 8,
              elevation: item.id === 'briefing' ? 0 : 2,
              opacity: isActive ? 0.7 : 1
            },
            isCustomizing && { borderWidth: 2, borderColor: isActive ? '#4F46E5' : '#E5E7EB', borderRadius: 0, borderStyle: 'dashed', padding: 4 }
          ]}
        >
          {isCustomizing && (
            <View style={{ position: 'absolute', top: -12, right: -6, flexDirection: 'row', gap: 8, zIndex: 10 }}>
              {/* Drag Handle Icon */}
              <View style={{ backgroundColor: '#FFF', borderRadius: 12, elevation: 2 }}>
                <IconMC name="drag" size={24} color="#4F46E5" />
              </View>
              {/* Remove Button */}
              <TouchableOpacity
                onPress={() => handleRemoveWidget(item.id)}
                style={{ backgroundColor: '#EF4444', borderRadius: 12, width: 24, height: 24, justifyContent: 'center', alignItems: 'center', elevation: 2 }}
              >
                <IconMC name="close" size={16} color="#FFF" />
              </TouchableOpacity>
            </View>
          )}
          <View pointerEvents={isCustomizing ? 'none' : 'auto'}>
            <WidgetComponent {...getProps(item.id)} />
          </View>
        </TouchableOpacity>
      </ScaleDecorator>
    );
  };

  return (
    <View style={{ flex: 1 }}>
      {/* Customization Header - Only visible when customizing */}
      {isCustomizing && (
        <View style={{ flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', paddingHorizontal: 20, paddingTop: 10, paddingBottom: 10 }}>
          <TouchableOpacity
            style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#EEF2FF', padding: 8, borderRadius: 20 }}
            onPress={() => setIsCustomizing(false)}
          >
            <IconMC name="check-circle" size={20} color="#4F46E5" />
            <Text style={{ fontSize: 14, fontWeight: '600', color: "#4F46E5" }}>
              Done
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Divider Removed */}

      {isCustomizing && (
        <View style={{ paddingHorizontal: 20, paddingBottom: 10 }}>
          <Text style={{ fontSize: 12, color: '#6B7280', textAlign: 'center' }}>Long press to drag - Tap X to remove</Text>
        </View>
      )}

      <DraggableFlatList
        data={widgets}
        onDragEnd={({ data }) => setWidgets(data)}
        keyExtractor={(item) => item.id}
        renderItem={renderWidget}
        // Removed ItemSeparatorComponent
        containerStyle={homeStyles.cardScrollView} // Using existing style for bg
        contentContainerStyle={{ paddingTop: 14, paddingBottom: 100, paddingHorizontal: 0 }}
        showsVerticalScrollIndicator={false}
        ListFooterComponent={
          isCustomizing ? (
            <TouchableOpacity
              onPress={() => setShowAddWidgetModal(true)}
              style={{ marginHorizontal: 20, marginTop: 10, padding: 16, borderWidth: 2, borderColor: '#4F46E5', borderRadius: 16, borderStyle: 'dashed', alignItems: 'center', backgroundColor: '#EEF2FF' }}
            >
              <IconMC name="plus" size={24} color="#4F46E5" />
              <Text style={{ color: '#4F46E5', fontWeight: '600', marginTop: 4 }}>Add Widget</Text>
            </TouchableOpacity>
          ) : null
        }
      />

      {/* Add Widget Modal */}
      <Modal visible={showAddWidgetModal} animationType="slide" transparent>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
          <View style={{ backgroundColor: '#FFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: '60%' }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <Text style={{ fontSize: 20, fontWeight: 'bold' }}>Add Widget</Text>
              <TouchableOpacity onPress={() => setShowAddWidgetModal(false)}>
                <IconMC name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>
            <ScrollView>
              {availableWidgets.length === 0 ? (
                <Text style={{ color: '#6B7280', textAlign: 'center', padding: 20 }}>No more widgets available</Text>
              ) : (
                availableWidgets.map(widget => (
                  <TouchableOpacity
                    key={widget.id}
                    onPress={() => handleAddWidget(widget)}
                    style={{ flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: '#F9FAFB', borderRadius: 12, marginBottom: 12 }}
                  >
                    <IconMC name="view-grid-plus" size={24} color="#4F46E5" />
                    <View style={{ marginLeft: 12 }}>
                      <Text style={{ fontSize: 16, fontWeight: '600' }}>{widget.name}</Text>
                    </View>
                    <View style={{ flex: 1 }} />
                    <IconMC name="plus-circle" size={24} color="#4F46E5" />
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Drawers */}
      <FamilyMemberDrawer
        visible={drawerVisible}
        member={selectedMember}
        onClose={() => setDrawerVisible(false)}
      />
      <CalendarDrawer
        visible={showCalendarDrawer}
        onClose={() => setShowCalendarDrawer(false)}
      />
      <CustomizationOptionDrawer
        visible={showCustomOptionDrawer}
        onClose={() => setShowCustomOptionDrawer(false)}
        onCustomizeBound={() => console.log('Customize Bound Assistant')}
        onCustomizeYouTab={() => setIsCustomizing(true)}
      />
    </View >
  );
};
