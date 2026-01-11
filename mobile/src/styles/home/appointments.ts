// export const appointmentsStyles = StyleSheet.create({ -> changed to plain object
export const appointmentsStyles = {
  appointmentsScrollView: {
    marginTop: 12,
  },
  appointmentsContent: {
    paddingHorizontal: 20,
  },
  appointmentTimelineContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    position: 'relative',
  },
  appointmentTimelineLine: {
    position: 'absolute',
    top: 16,
    left: 16,
    right: 16,
    height: 2,
    backgroundColor: '#E5E7EB',
    zIndex: 0,
  },
  appointmentTimelineItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    width: 200,
    position: 'relative',
    zIndex: 1,
  },
  appointmentTimelineNode: {
    alignItems: 'center',
    marginRight: 12,
    position: 'relative',
  },
  appointmentIconCycle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  appointmentContent: {
    flex: 1,
    paddingTop: 30,
  },
  appointmentTime: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '600',
    marginBottom: 4,
  },
  appointmentTitle: {
    fontSize: 16,
    color: '#374151',
    fontWeight: '600',
    marginBottom: 6,
    lineHeight: 20,
  },
  appointmentLocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  appointmentLocation: {
    fontSize: 12,
    color: '#6B7280',
    flex: 1,
  },
};


