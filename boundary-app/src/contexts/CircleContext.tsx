import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { Alert } from 'react-native';
import { circleApi as CircleService } from '../services/api/circle';
import { Circle, CircleMember, CircleInvitation } from '../services/api/circle';
import appkit from '../services/api/appkit';

// State interface
interface CircleState {
  currentCircle: Circle | null;
  circles: Circle[];
  members: CircleMember[];
  invitations: CircleInvitation[];
  loading: boolean;
  error: string | null;
}

// Action types
type CircleAction =
  | { type: 'CIRCLE_START' }
  | { type: 'CIRCLE_SUCCESS'; payload: { circles: Circle[]; currentCircle: Circle | null; members: CircleMember[] } }
  | { type: 'CIRCLE_FAILURE'; payload: string }
  | { type: 'INVITATIONS_SUCCESS'; payload: any[] }
  | { type: 'CREATE_CIRCLE_SUCCESS'; payload: Circle }
  | { type: 'JOIN_CIRCLE_SUCCESS'; payload: Circle }
  | { type: 'LEAVE_CIRCLE_SUCCESS'; payload: string }
  | { type: 'UPDATE_CIRCLE_SUCCESS'; payload: Circle }
  | { type: 'REMOVE_MEMBER_SUCCESS'; payload: string }
  | { type: 'UPDATE_MEMBER_SUCCESS'; payload: CircleMember }
  | { type: 'ACCEPT_INVITATION_SUCCESS'; payload: { circle: Circle; invitationId: string } }
  | { type: 'DECLINE_INVITATION_SUCCESS'; payload: string }
  | { type: 'CLEAR_ERROR' };

// Initial state
const initialState: CircleState = {
  currentCircle: null,
  circles: [],
  members: [],
  invitations: [],
  loading: false,
  error: null,
};

// Reducer function
const circleReducer = (state: CircleState, action: CircleAction): CircleState => {
  switch (action.type) {
    case 'CIRCLE_START':
      return {
        ...state,
        loading: true,
        error: null,
      };
    case 'CIRCLE_SUCCESS':
      return {
        ...state,
        circles: action.payload.circles,
        currentCircle: action.payload.currentCircle,
        members: action.payload.members,
        loading: false,
        error: null,
      };
    case 'CIRCLE_FAILURE':
      return {
        ...state,
        loading: false,
        error: action.payload,
      };
    case 'INVITATIONS_SUCCESS':
      return {
        ...state,
        invitations: action.payload,
        loading: false,
        error: null,
      };
    case 'CREATE_CIRCLE_SUCCESS':
      return {
        ...state,
        circles: [...state.circles, action.payload],
        currentCircle: action.payload,
        members: action.payload.members || [],
        loading: false,
        error: null,
      };
    case 'JOIN_CIRCLE_SUCCESS':
      return {
        ...state,
        circles: [...state.circles, action.payload],
        currentCircle: action.payload,
        members: action.payload.members || [],
        invitations: state.invitations.filter(inv => inv.circleId !== action.payload.id),
        loading: false,
        error: null,
      };
    case 'LEAVE_CIRCLE_SUCCESS':
      return {
        ...state,
        circles: state.circles.filter(c => c.id !== action.payload),
        currentCircle: null,
        members: [],
        loading: false,
        error: null,
      };
    case 'UPDATE_CIRCLE_SUCCESS':
      return {
        ...state,
        circles: state.circles.map(c => c.id === action.payload.id ? action.payload : c),
        currentCircle: state.currentCircle?.id === action.payload.id ? action.payload : state.currentCircle,
        loading: false,
        error: null,
      };
    case 'REMOVE_MEMBER_SUCCESS':
      return {
        ...state,
        members: state.members.filter(m => m.id !== action.payload),
        loading: false,
        error: null,
      };
    case 'UPDATE_MEMBER_SUCCESS':
      return {
        ...state,
        members: state.members.map(m => m.id === action.payload.id ? action.payload : m),
        loading: false,
        error: null,
      };
    case 'ACCEPT_INVITATION_SUCCESS':
      return {
        ...state,
        circles: [...state.circles, action.payload.circle],
        currentCircle: action.payload.circle,
        members: action.payload.circle.members || [],
        invitations: state.invitations.filter((inv: any) => inv.id !== action.payload.invitationId),
        loading: false,
        error: null,
      };
    case 'DECLINE_INVITATION_SUCCESS':
      return {
        ...state,
        invitations: state.invitations.filter((inv: any) => inv.id !== action.payload),
        loading: false,
        error: null,
      };
    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null,
      };
    default:
      return state;
  }
};

// Context interface
interface CircleContextType extends CircleState {
  loadCircleData: () => Promise<void>;
  createCircle: (data: any) => Promise<void>;
  joinCircle: (invitationId: string) => Promise<void>;
  leaveCircle: (circleId: string) => Promise<void>;
  inviteMember: (circleId: string, email: string, role?: string) => Promise<void>;
  removeMember: (circleId: string, memberId: string) => Promise<void>;
  updateMemberRole: (circleId: string, memberId: string, role: string) => Promise<void>;
  updateCircleSettings: (circleId: string, settings: any) => Promise<void>;
  acceptInvitation: (invitationId: string) => Promise<void>;
  declineInvitation: (invitationId: string) => Promise<void>;
  clearError: () => void;
}

// Create context
const CircleContext = createContext<CircleContextType | undefined>(undefined);

// Provider component
interface CircleProviderProps {
  children: ReactNode;
}

export const CircleProvider: React.FC<CircleProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(circleReducer, initialState);

  useEffect(() => {
    if (appkit.isAuthenticated()) {
      loadCircleData();
    }
  }, []);

  const loadCircleData = async () => {
    try {
      dispatch({ type: 'CIRCLE_START' });
      
      const [circlesResponse, invitationsResponse] = await Promise.all([
        CircleService.getCircles(),
        CircleService.getPendingInvitations(),
      ]);

      const circles = circlesResponse.families || [];
      const currentCircle = circles.find((c: any) => c.isCurrent) || (circles.length > 0 ? circles[0] : null);
      const members = currentCircle ? (currentCircle.members || []) : [];

      dispatch({
        type: 'CIRCLE_SUCCESS',
        payload: { circles, currentCircle, members }
      });

      dispatch({
        type: 'INVITATIONS_SUCCESS',
        payload: (invitationsResponse as any).invitations || []
      });
    } catch (error: any) {
      dispatch({
        type: 'CIRCLE_FAILURE',
        payload: error.message || 'Failed to load circle data'
      });
    }
  };

  const createCircle = async (data: any) => {
    try {
      dispatch({ type: 'CIRCLE_START' });
      const response = await CircleService.createCircle(data);
      dispatch({ type: 'CREATE_CIRCLE_SUCCESS', payload: response.circle });
      Alert.alert('Success', 'Circle created successfully');
    } catch (error: any) {
      dispatch({ type: 'CIRCLE_FAILURE', payload: error.message || 'Failed to create circle' });
      throw error;
    }
  };

  const joinCircle = async (invitationId: string) => {
    try {
      dispatch({ type: 'CIRCLE_START' });
      const response = await CircleService.acceptCircleInvitation(invitationId);
      dispatch({ type: 'ACCEPT_INVITATION_SUCCESS', payload: { circle: response.circle, invitationId } });
      Alert.alert('Success', 'Joined circle successfully');
    } catch (error: any) {
      dispatch({ type: 'CIRCLE_FAILURE', payload: error.message || 'Failed to join circle' });
      throw error;
    }
  };

  const leaveCircle = async (circleId: string) => {
    try {
      dispatch({ type: 'CIRCLE_START' });
      await CircleService.leaveCircle(circleId);
      dispatch({ type: 'LEAVE_CIRCLE_SUCCESS', payload: circleId });
      Alert.alert('Success', 'Left circle successfully');
    } catch (error: any) {
      dispatch({ type: 'CIRCLE_FAILURE', payload: error.message || 'Failed to leave circle' });
      throw error;
    }
  };

  const inviteMember = async (circleId: string, email: string, role: string = 'member') => {
    try {
      dispatch({ type: 'CIRCLE_START' });
      await CircleService.addCircleMember(circleId, { email, role: role as any });
      dispatch({ type: 'CLEAR_ERROR' });
      Alert.alert('Success', 'Invitation sent successfully');
    } catch (error: any) {
      dispatch({ type: 'CIRCLE_FAILURE', payload: error.message || 'Failed to send invitation' });
      throw error;
    }
  };

  const removeMember = async (circleId: string, memberId: string) => {
    try {
      dispatch({ type: 'CIRCLE_START' });
      await CircleService.removeCircleMember(circleId, memberId);
      dispatch({ type: 'REMOVE_MEMBER_SUCCESS', payload: memberId });
      Alert.alert('Success', 'Member removed successfully');
    } catch (error: any) {
      dispatch({ type: 'CIRCLE_FAILURE', payload: error.message || 'Failed to remove member' });
      throw error;
    }
  };

  const updateMemberRole = async (circleId: string, memberId: string, role: string) => {
    try {
      dispatch({ type: 'CIRCLE_START' });
      const response = await CircleService.updateCircleMemberRole(circleId, memberId, role as any);
      dispatch({ type: 'UPDATE_MEMBER_SUCCESS', payload: response.member });
      Alert.alert('Success', 'Member role updated successfully');
    } catch (error: any) {
      dispatch({ type: 'CIRCLE_FAILURE', payload: error.message || 'Failed to update member role' });
      throw error;
    }
  };

  const updateCircleSettings = async (circleId: string, settings: any) => {
    try {
      dispatch({ type: 'CIRCLE_START' });
      const response = await CircleService.updateCircle(circleId, settings);
      dispatch({ type: 'UPDATE_CIRCLE_SUCCESS', payload: response.circle });
      Alert.alert('Success', 'Circle settings updated successfully');
    } catch (error: any) {
      dispatch({ type: 'CIRCLE_FAILURE', payload: error.message || 'Failed to update circle settings' });
      throw error;
    }
  };

  const acceptInvitation = async (invitationId: string) => {
    try {
      dispatch({ type: 'CIRCLE_START' });
      const response = await CircleService.acceptCircleInvitation(invitationId);
      dispatch({ type: 'ACCEPT_INVITATION_SUCCESS', payload: { circle: response.circle, invitationId } });
      Alert.alert('Success', 'Invitation accepted successfully');
    } catch (error: any) {
      dispatch({ type: 'CIRCLE_FAILURE', payload: error.message || 'Failed to accept invitation' });
      throw error;
    }
  };

  const declineInvitation = async (invitationId: string) => {
    try {
      dispatch({ type: 'CIRCLE_START' });
      await CircleService.declineCircleInvitation(invitationId);
      dispatch({ type: 'DECLINE_INVITATION_SUCCESS', payload: invitationId });
      Alert.alert('Success', 'Invitation declined');
    } catch (error: any) {
      dispatch({ type: 'CIRCLE_FAILURE', payload: error.message || 'Failed to decline invitation' });
      throw error;
    }
  };

  const clearError = () => {
    dispatch({ type: 'CLEAR_ERROR' });
  };

  const value: CircleContextType = {
    ...state,
    loadCircleData,
    createCircle,
    joinCircle,
    leaveCircle,
    inviteMember,
    removeMember,
    updateMemberRole,
    updateCircleSettings,
    acceptInvitation,
    declineInvitation,
    clearError,
  };

  return (
    <CircleContext.Provider value={value}>
      {children}
    </CircleContext.Provider>
  );
};

export const useCircle = (): CircleContextType => {
  const context = useContext(CircleContext);
  if (context === undefined) {
    throw new Error('useCircle must be used within a CircleProvider');
  }
  return context;
};
