import { StyleSheet } from 'react-native';

import { goalsStyles } from './home/goals';
import { shoppingStyles } from './home/shopping';
import { appointmentsStyles } from './home/appointments';
import { attentionStyles } from './home/attention';
import { socialStyles } from './home/social';
import { familyStyles } from './home/family';
import { blogStyles } from './home/blog';
import { chatStyles } from './home/chat';
import { headerStyles } from './home/header';
import { tabStyles } from './home/tabs';
import { portfolioStyles } from './home/portfolio';
import { modalStyles } from './home/modals';
import { calendarStyles } from './home/calendar';
import { widgetStyles } from './home/widgets';
import { emptyStateStyles } from './home/emptyState';
import { commonStyles } from './home/common';
import { galleryStyles } from './home/gallery';



export const homeStyles = StyleSheet.create({
  // Basic container styles
  gradientContainer: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  contentContainer: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  tabContentScrollView: {
    flex: 1,
  },

  // Main Content Card
  mainContentCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    marginHorizontal: 0,
    marginTop: -16, // Counteracting the 16px margin seen by user
    marginBottom: 0,
    paddingTop: 0,
    paddingBottom: 20, // Keep some bottom padding
    paddingHorizontal: 0,
    flex: 1,
  },

  // Content Card Header
  contentCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  contentCardHeaderLeft: {
    flex: 1,
  },
  contentCardTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333333',
  },
  contentCardHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  menuButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // ScrollViews
  mainScrollView: {
    flex: 1,
  },
  mainScrollContent: {
    flexGrow: 1,
    minHeight: '100%',
  },
  cardScrollView: {
    flex: 1,
  },
  cardScrollContent: {
    paddingBottom: 20,
  },

  // Spread all modules
  ...headerStyles,
  ...shoppingStyles,
  ...goalsStyles,
  ...appointmentsStyles,
  ...attentionStyles,
  ...socialStyles,
  ...familyStyles,
  ...blogStyles,
  ...chatStyles,
  ...tabStyles,
  ...portfolioStyles,
  ...modalStyles,
  ...calendarStyles,
  ...widgetStyles,
  ...emptyStateStyles,
  ...emptyStateStyles,
  ...commonStyles,
  ...galleryStyles,

  // Home Content Container
  homeContentContainer: {
    paddingHorizontal: 20,
  },
  welcomeSection: {
    paddingTop: 24,
    paddingBottom: 20,
    paddingLeft: 32,
    paddingRight: 32,
  },
  quickActionButton: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  quickActionText: {
    fontSize: 20,
    color: '#374151',
    fontWeight: 'bold',
  },
});
