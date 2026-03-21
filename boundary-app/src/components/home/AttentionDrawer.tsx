import React from 'react';
import { Modal, View, Text, TouchableOpacity, ScrollView, Pressable } from 'react-native';
import IconMC from 'react-native-vector-icons/MaterialCommunityIcons';
import { homeStyles } from '../../styles/homeStyles';
import { AttentionApp } from '../../types/home';


interface AttentionDrawerProps {
  visible: boolean;
  onClose: () => void;
  attentionApps: AttentionApp[];
}

export const AttentionDrawer: React.FC<AttentionDrawerProps> = ({
  visible,
  onClose,
  attentionApps,
}) => {
  const getPriorityColors = (priority?: 'high' | 'medium' | 'low') => {
    switch (priority) {
      case 'high':
        return { bg: '#FEF2F2', fg: '#EF4444' };
      case 'medium':
        return { bg: '#FFFBEB', fg: '#F59E0B' };
      default:
        return { bg: '#F0FDF4', fg: '#10B981' };
    }
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <Pressable style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 0, 0, 0.5)' }} onPress={onClose} />
      <View style={{ flex: 1, justifyContent: 'flex-end' }} pointerEvents="box-none">
        <View style={homeStyles.attentionDrawer}>
          {/* Attention Drawer Header */}
          <View style={homeStyles.attentionDrawerHeader}>
            <Text style={homeStyles.attentionDrawerTitle}>Attention List</Text>
            <TouchableOpacity
              style={homeStyles.attentionDrawerCloseButton}
              onPress={onClose}
            >
              <IconMC name="close" size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>

          {/* Attention Items List */}
          <ScrollView 
            style={homeStyles.attentionDrawerList}
            contentContainerStyle={homeStyles.attentionDrawerListContent}
            showsVerticalScrollIndicator={true}
            bounces={true}
          >
            {attentionApps.map((app) => {
              const pr = getPriorityColors(app.priority);
              return (
                <TouchableOpacity key={app.id} style={homeStyles.attnListItem}>
                  <View style={homeStyles.attnItemLeft}>
                    <View style={[homeStyles.attnIconContainer, { backgroundColor: app.color || '#FFB6C1' }]}>
                      <IconMC name={app.icon} size={20} color="#FFFFFF" />
                    </View>
                  </View>
                  <View style={homeStyles.attnItemRight}>
                    <View style={homeStyles.attnItemHeader}>
                      <Text style={homeStyles.attnItemTitle} numberOfLines={1}>
                        {(app as any).title || app.name}
                      </Text>
                      <View style={[homeStyles.attnPriorityChip, { backgroundColor: pr.bg }]}>
                        <Text style={[homeStyles.attnPriorityText, { color: pr.fg }]}>
                          {(app as any).priority || (app.isUrgent ? 'high' : 'low')}
                        </Text>
                      </View>
                    </View>
                    <Text style={homeStyles.attnItemSubtitle} numberOfLines={2}>
                      {(app as any).subtitle || `${app.notifications} notifications pending`}
                    </Text>
                    <View style={homeStyles.attnItemMeta}>
                      <View style={homeStyles.attnMetaItem}>
                        <IconMC name="clock-outline" size={12} color="#9CA3AF" />
                        <Text style={homeStyles.attnMetaText}>
                          {(app as any).time || '2 min ago'}
                        </Text>
                      </View>
                      <View style={homeStyles.attnMetaItem}>
                        <IconMC name="bell" size={12} color="#9CA3AF" />
                        <Text style={homeStyles.attnMetaText}>
                          {app.notifications} items
                        </Text>
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

