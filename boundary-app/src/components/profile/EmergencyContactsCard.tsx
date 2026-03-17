import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Linking,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTranslation } from 'react-i18next';
import { colors, textColors } from '../../theme/colors';

interface EmergencyContact {
  id: string;
  name: string;
  phoneNumber: string;
  relationship: string;
  isPrimary: boolean;
}

interface EmergencyContactsCardProps {
  contacts: EmergencyContact[];
  onManageContacts: () => void;
}

export const EmergencyContactsCard: React.FC<EmergencyContactsCardProps> = ({
  contacts,
  onManageContacts,
}) => {
  const { t } = useTranslation();

  const handleCallContact = (contact: EmergencyContact) => {
    Alert.alert(
      t('profile.callContact'),
      `${t('profile.callContactConfirm')} ${contact.name}?`,
      [
        { text: t('cancel'), style: 'cancel' },
        {
          text: t('call'),
          onPress: () => Linking.openURL(`tel:${contact.phoneNumber}`),
        },
      ]
    );
  };

  const getRelationshipIcon = (relationship: string) => {
    switch (relationship.toLowerCase()) {
      case 'spouse':
      case 'husband':
      case 'wife':
        return 'heart';
      case 'parent':
      case 'mother':
      case 'father':
        return 'account-supervisor';
      case 'child':
      case 'son':
      case 'daughter':
        return 'baby-face';
      case 'sibling':
      case 'brother':
      case 'sister':
        return 'account-group';
      case 'doctor':
        return 'doctor';
      case 'friend':
        return 'account-heart';
      default:
        return 'account';
    }
  };

  const getRelationshipColor = (relationship: string) => {
    switch (relationship.toLowerCase()) {
      case 'spouse':
      case 'husband':
      case 'wife':
        return '#FF6B9D';
      case 'parent':
      case 'mother':
      case 'father':
        return '#4ECDC4';
      case 'child':
      case 'son':
      case 'daughter':
        return '#45B7D1';
      case 'doctor':
        return '#96CEB4';
      default:
        return '#667eea';
    }
  };

  if (contacts.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.sectionTitle}>{t('profile.emergencyContacts')}</Text>
        
        <View style={styles.emptyCard}>
          <Icon name="phone-alert-outline" size={48} color={textColors.primarySecondary} />
          <Text style={styles.emptyTitle}>{t('profile.noEmergencyContacts')}</Text>
          <Text style={styles.emptySubtitle}>{t('profile.addEmergencyContactsDesc')}</Text>
          
          <TouchableOpacity style={styles.addButton} onPress={onManageContacts}>
            <Icon name="plus" size={16} color="#FFFFFF" />
            <Text style={styles.addButtonText}>{t('profile.addContact')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{t('profile.emergencyContacts')}</Text>
        <TouchableOpacity onPress={onManageContacts}>
          <Text style={styles.manageText}>{t('profile.manage')}</Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.contactsCard}>
        {contacts.slice(0, 3).map((contact, index) => (
          <View key={contact.id}>
            <TouchableOpacity
              style={styles.contactItem}
              onPress={() => handleCallContact(contact)}
              activeOpacity={0.7}
            >
              <View style={styles.contactIcon}>
                <View
                  style={[
                    styles.iconContainer,
                    { backgroundColor: getRelationshipColor(contact.relationship) }
                  ]}
                >
                  <Icon
                    name={getRelationshipIcon(contact.relationship)}
                    size={20}
                    color="#FFFFFF"
                  />
                </View>
                {contact.isPrimary && (
                  <View style={styles.primaryBadge}>
                    <Icon name="star" size={10} color="#FFD700" />
                  </View>
                )}
              </View>
              
              <View style={styles.contactInfo}>
                <Text style={styles.contactName}>{contact.name}</Text>
                <Text style={styles.contactRelationship}>{contact.relationship}</Text>
                <Text style={styles.contactPhone}>{contact.phoneNumber}</Text>
              </View>
              
              <TouchableOpacity
                style={styles.callButton}
                onPress={() => handleCallContact(contact)}
              >
                <Icon name="phone" size={20} color={colors.primary} />
              </TouchableOpacity>
            </TouchableOpacity>
            
            {index < Math.min(contacts.length, 3) - 1 && <View style={styles.separator} />}
          </View>
        ))}
        
        {contacts.length > 3 && (
          <TouchableOpacity style={styles.viewAllButton} onPress={onManageContacts}>
            <Text style={styles.viewAllText}>
              {t('profile.viewAllContacts')} ({contacts.length - 3} {t('more')})
            </Text>
            <Icon name="chevron-right" size={16} color={textColors.primarySecondary} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: textColors.primary,
  },
  manageText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
  contactsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  contactIcon: {
    position: 'relative',
    marginRight: 16,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  primaryBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FFD700',
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    fontSize: 16,
    fontWeight: '600',
    color: textColors.primary,
    marginBottom: 2,
  },
  contactRelationship: {
    fontSize: 13,
    color: textColors.primarySecondary,
    marginBottom: 2,
  },
  contactPhone: {
    fontSize: 12,
    color: textColors.primarySecondary,
    fontFamily: 'monospace',
  },
  callButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.backgroundLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  separator: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 8,
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 4,
    marginTop: 8,
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: '500',
    color: textColors.primarySecondary,
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: textColors.primary,
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    color: textColors.primarySecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    gap: 8,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default EmergencyContactsCard;
