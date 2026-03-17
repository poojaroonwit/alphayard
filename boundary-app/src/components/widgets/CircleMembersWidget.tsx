import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { brandColors } from '../../theme/colors';
import { CircleMember } from '../../types/circle';

const IconMC = Icon as any;

interface CircleMembersWidgetProps {
  members: CircleMember[];
  onMemberPress?: (member: CircleMember) => void;
}

export const CircleMembersWidget: React.FC<CircleMembersWidgetProps> = ({
  members,
  onMemberPress,
}) => {
  if (!members || members.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Circle Members</Text>
        </View>
        <View style={styles.emptyState}>
          <IconMC name="account-group" size={48} color="#CCC" />
          <Text style={styles.emptyText}>No circle members yet</Text>
          <Text style={styles.emptySubtext}>Invite circle members to get started</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Circle Members</Text>
        <Text style={styles.subtitle}>{members.length} members</Text>
      </View>
      
      <View style={styles.membersList}>
        {members.map((member) => (
          <TouchableOpacity
            key={member.id}
            style={styles.memberItem}
            onPress={() => onMemberPress?.(member)}
          >
            <View style={styles.memberAvatar}>
              <Text style={styles.avatarText}>
                {member.name.charAt(0).toUpperCase()}
              </Text>
              {member.isOnline && <View style={styles.onlineIndicator} />}
            </View>
            
            <View style={styles.memberInfo}>
              <Text style={styles.memberName}>{member.name}</Text>
              <Text style={styles.memberRole}>{member.role || 'Member'}</Text>
            </View>
            
            <IconMC name="chevron-right" size={20} color="#CCC" />
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};


const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  membersList: {
    gap: 12,
  },
  memberItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  memberAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: brandColors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    position: 'relative',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#28A745',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  memberRole: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
    marginTop: 12,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 4,
    textAlign: 'center',
  },
});
 
