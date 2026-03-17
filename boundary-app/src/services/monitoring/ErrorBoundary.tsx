import React, { Component, ErrorInfo, ReactNode } from 'react';
import {
  View,
  Alert,
} from 'react-native';
import {
  Box,
  Text,
  VStack,
  Button,
  Icon,
  useToast,
} from 'native-base';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import analyticsService from '../analytics/AnalyticsService';
import { isDev } from '../../utils/isDev';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    // Track error in analytics
    analyticsService.trackError(error, {
      componentStack: errorInfo.componentStack,
      errorBoundary: true,
    });

    // Log to crash reporting service
    this.logErrorToService(error, errorInfo);
  }

  private logErrorToService(error: Error, errorInfo: ErrorInfo) {
    // Here you would send to your crash reporting service
    // (Sentry, Crashlytics, etc.)
    console.error('Crash Report:', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
    });
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  private handleReportError = () => {
    Alert.alert(
      'Report Error',
      'Would you like to report this error to our support team?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Report', onPress: this.sendErrorReport },
      ]
    );
  };

  private sendErrorReport = () => {
    const { error, errorInfo } = this.state;
    if (!error) return;

    // Here you would send the error report to your support system
    console.log('Sending error report:', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo?.componentStack,
    });

    Alert.alert(
      'Thank You',
      'Error report sent successfully. We\'ll investigate and fix the issue.'
    );
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <Box flex={1} bg="white" alignItems="center" justifyContent="center" px={6}>
          <VStack space={6} alignItems="center">
            <Icon
              as={MaterialCommunityIcons}
              name="alert-circle"
              size="6xl"
              color="error.500"
            />
            
            <VStack space={4} alignItems="center">
              <Text fontSize="xl" fontWeight="bold" color="gray.800" textAlign="center">
                Oops! Something went wrong
              </Text>
              <Text color="gray.600" textAlign="center" px={4}>
                We're sorry, but something unexpected happened. Our team has been notified and is working to fix the issue.
              </Text>
            </VStack>

            <VStack space={3} w="full">
              <Button
                size="lg"
                onPress={this.handleRetry}
                leftIcon={
                  <Icon
                    as={MaterialCommunityIcons}
                    name="refresh"
                    size="sm"
                  />
                }
              >
                Try Again
              </Button>
              
              <Button
                variant="outline"
                size="lg"
                onPress={this.handleReportError}
                leftIcon={
                  <Icon
                    as={MaterialCommunityIcons}
                    name="bug"
                    size="sm"
                  />
                }
              >
                Report Error
              </Button>
            </VStack>

            {isDev && this.state.error && (
              <VStack space={2} w="full" mt={4}>
                <Text fontSize="sm" fontWeight="semibold" color="gray.700">
                  Debug Information:
                </Text>
                <Text fontSize="xs" color="gray.500" numberOfLines={5}>
                  {this.state.error.message}
                </Text>
              </VStack>
            )}
          </VStack>
        </Box>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary; 
