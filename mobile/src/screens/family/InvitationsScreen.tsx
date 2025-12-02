import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import CoolIcon from '../../components/common/CoolIcon';
import { familyApi } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

interface Invitation {
  id: string;
  familyId: string;
  email: string;
  message?: string;
  status: string;
  createdAt: string;
  expiresAt: string;
  family: { id: string; name: string; description?: string } | null;
  invitedBy: string;
}

const InvitationsScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { user } = useAuth();
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    loadInvitations();
  }, []);

  const loadInvitations = async () => {
    try {
      setLoading(true);
      const response = await familyApi.getPendingInvitations();
      setInvitations(response.invitations || []);
    } catch (error: any) {
      console.error('Error loading invitations:', error);
      Alert.alert('Error', error?.response?.data?.message || 'Failed to load invitations');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadInvitations();
  };

  const handleAccept = async (invitation: Invitation) => {
    Alert.alert(
      'Accept Invitation',
      `Join ${invitation.family?.name || 'this family'}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Accept',
          onPress: async () => {
            try {
              setProcessingId(invitation.id);
              const response = await familyApi.acceptFamilyInvitation(invitation.id);
              
              if (response.alreadyMember) {
                Alert.alert('Already a Member', response.message);
              } else {
                Alert.alert('Success', response.message, [
                  { text: 'OK', onPress: () => {
                    loadInvitations();
                    // Optionally navigate to family screen
                    navigation.navigate('Home');
                  }}
                ]);
              }
            } catch (error: any) {
              console.error('Error accepting invitation:', error);
              Alert.alert('Error', error?.response?.data?.message || 'Failed to accept invitation');
            } finally {
              setProcessingId(null);
            }
          }
        }
      ]
    );
  };

  const handleDecline = async (invitation: Invitation) => {
    Alert.alert(
      'Decline Invitation',
      `Decline invitation to join ${invitation.family?.name || 'this family'}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Decline',
          style: 'destructive',
          onPress: async () => {
            try {
              setProcessingId(invitation.id);
              await familyApi.declineFamilyInvitation(invitation.id);
              Alert.alert('Success', 'Invitation declined');
              loadInvitations();
            } catch (error: any) {
              console.error('Error declining invitation:', error);
              Alert.alert('Error', error?.response?.data?.message || 'Failed to decline invitation');
            } finally {
              setProcessingId(null);
            }
          }
        }
      ]
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return 'Expired';
    if (diffDays === 0) return 'Expires today';
    if (diffDays === 1) return 'Expires tomorrow';
    return `Expires in ${diffDays} days`;
  };

  const renderInvitation = ({ item }: { item: Invitation }) => {
    const isExpired = new Date(item.expiresAt) < new Date();
    const isProcessing = processingId === item.id;

    return (
      <View style={styles.invitationCard}>
        <View style={styles.invitationHeader}>
          <View style={styles.familyInfo}>
            <View style={styles.familyIcon}>
              <CoolIcon name="account-group" size={24} color="#FF5A5A" />
            </View>
            <View style={styles.familyDetails}>
              <Text style={styles.familyName}>{item.family?.name || 'Unknown Family'}</Text>
              <Text style={styles.invitedBy}>Invited by {item.invitedBy}</Text>
            </View>
          </View>
          {isExpired && (
            <View style={styles.expiredBadge}>
              <Text style={styles.expiredText}>Expired</Text>
            </View>
          )}
        </View>

        {item.message && (
          <Text style={styles.message}>{item.message}</Text>
        )}

        <View style={styles.invitationFooter}>
          <Text style={styles.expiryText}>{formatDate(item.expiresAt)}</Text>
          {!isExpired && (
            <View style={styles.actions}>
              <TouchableOpacity
                style={[styles.actionButton, styles.declineButton]}
                onPress={() => handleDecline(item)}
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <ActivityIndicator size="small" color="#EF4444" />
                ) : (
                  <>
                    <CoolIcon name="close" size={16} color="#EF4444" />
                    <Text style={styles.declineText}>Decline</Text>
                  </>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, styles.acceptButton]}
                onPress={() => handleAccept(item)}
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <CoolIcon name="check" size={16} color="#FFFFFF" />
                    <Text style={styles.acceptText}>Accept</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <CoolIcon name="arrow-left" size={24} color="#1F2937" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Invitations</Text>
          <View style={styles.headerRight} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF5A5A" />
          <Text style={styles.loadingText}>Loading invitations...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <CoolIcon name="arrow-left" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Invitations</Text>
        <TouchableOpacity
          style={styles.refreshButton}
          onPress={loadInvitations}
        >
          <CoolIcon name="refresh" size={20} color="#1F2937" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={invitations}
        keyExtractor={(item) => item.id}
        renderItem={renderInvitation}
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <CoolIcon name="email-outline" size={64} color="#9CA3AF" />
            <Text style={styles.emptyTitle}>No invitations</Text>
            <Text style={styles.emptySubtitle}>
              You don't have any pending family invitations
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
};

export default InvitationsScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    height: 56,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
  },
  headerRight: {
    width: 40,
  },
  refreshButton: {
    padding: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6B7280',
  },
  listContent: {
    padding: 16,
  },
  separator: {
    height: 12,
  },
  invitationCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  invitationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  familyInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  familyIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FEF2F2',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  familyDetails: {
    flex: 1,
  },
  familyName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  invitedBy: {
    fontSize: 12,
    color: '#6B7280',
  },
  expiredBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: '#FEF2F2',
  },
  expiredText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#EF4444',
  },
  message: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 12,
    lineHeight: 20,
  },
  invitationFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  expiryText: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  declineButton: {
    backgroundColor: '#FEF2F2',
  },
  acceptButton: {
    backgroundColor: '#FF5A5A',
  },
  declineText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#EF4444',
  },
  acceptText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  empty: {
    padding: 48,
    alignItems: 'center',
  },
  emptyTitle: {
    marginTop: 16,
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
  },
  emptySubtitle: {
    marginTop: 8,
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
});


