import React from 'react';
import { Modal, View, Text, TouchableOpacity, ScrollView, Image } from 'react-native';
import IconMC from 'react-native-vector-icons/MaterialCommunityIcons';
import { homeStyles } from '../../styles/homeStyles';

interface hourse {
  id: string;
  name: string;
  members: number | any[];
}

interface FamilyDropdownProps {
  visible: boolean;
  onClose: () => void;
  selectedFamily: string;
  onFamilySelect: (familyName: string) => void;
  availableFamilies: hourse[];
}

export const FamilyDropdown: React.FC<FamilyDropdownProps> = ({
  visible,
  onClose,
  selectedFamily,
  onFamilySelect,
  availableFamilies,
}) => {
  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={homeStyles.calendarDrawerOverlay}>
        <View style={homeStyles.calendarDrawerContainer}>
          <View style={homeStyles.familyDropdownHeader}>
            <Text style={homeStyles.familyDropdownTitle}>Select hourse</Text>
            <TouchableOpacity onPress={onClose}>
              <IconMC name="close" size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>
          <ScrollView style={homeStyles.familyDropdownList}>
            {availableFamilies.map((hourse) => (
              <TouchableOpacity
                key={hourse.id}
                style={[
                  homeStyles.familyDropdownItem,
                  selectedFamily === hourse.name && homeStyles.familyDropdownItemSelected
                ]}
                onPress={() => onFamilySelect(hourse.name)}
              >
                <View style={homeStyles.familyDropdownItemContent}>
                  <View style={homeStyles.familyDropdownItemLogo}>
                    <IconMC name="crown" size={24} color="#FFD700" />
                  </View>
                  <View style={homeStyles.familyDropdownItemInfo}>
                    <Text style={[
                      homeStyles.familyDropdownItemName,
                      selectedFamily === hourse.name && homeStyles.familyDropdownItemNameSelected
                    ]}>
                      {hourse.name}
                    </Text>

                    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                      {Array.isArray(hourse.members) && hourse.members.slice(0, 5).map((member: any, index: number) => (
                        <View
                          key={member.id || index}
                          style={{
                            width: 24,
                            height: 24,
                            borderRadius: 12,
                            borderWidth: 2,
                            borderColor: '#FFFFFF',
                            marginLeft: index === 0 ? 0 : -8,
                            backgroundColor: '#E5E7EB',
                            overflow: 'hidden',
                            justifyContent: 'center',
                            alignItems: 'center'
                          }}
                        >
                          {member.avatar ? (
                            <Image
                              source={{ uri: member.avatar }}
                              style={{ width: '100%', height: '100%' }}
                            />
                          ) : (
                            <Text style={{ fontSize: 10, color: '#666', fontWeight: 'bold' }}>
                              {member.name?.charAt(0) || '?'}
                            </Text>
                          )}
                        </View>
                      ))}

                      {Array.isArray(hourse.members) && hourse.members.length > 5 && (
                        <Text style={{ marginLeft: 6, fontSize: 12, color: '#6B7280', fontWeight: '500' }}>
                          +{hourse.members.length - 5} more
                        </Text>
                      )}

                      {!Array.isArray(hourse.members) && (
                        <Text style={homeStyles.familyDropdownItemMembers}>
                          {hourse.members} members
                        </Text>
                      )}
                    </View>
                  </View>

                  {selectedFamily === hourse.name && (
                    <IconMC name="check" size={20} color="#FFB6C1" />
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};
