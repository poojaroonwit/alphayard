// export const shoppingStyles = StyleSheet.create({ -> changed to plain object for homeStyles composition
export const shoppingStyles = {
  // Shopping List Styles
  shoppingListCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginTop: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  shoppingListHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  shoppingListTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    paddingHorizontal: 20,
  },
  shoppingListAddButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FEF7F7',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#FFB6C1',
  },
  shoppingListContent: {
    gap: 0,
  },
  shoppingListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 0,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  shoppingItemIcon: {
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    width: 24,
    height: 24,
  },
  shoppingItemName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    flex: 1,
  },
  shoppingItemNameCompleted: {
    textDecorationLine: 'line-through',
    color: '#9CA3AF',
  },
  shoppingItemQuantityText: {
    fontSize: 12,
    color: '#374151',
    fontWeight: '600',
    marginLeft: 12,
  },
  // Horizontal Shopping List Styles
  shoppingListContainer: {
    marginTop: 8,
  },
  shoppingCategoryList: {
    gap: 12,
  },
  shoppingCategoryScroll: {
    flexGrow: 0,
  },
  shoppingCategoryContent: {
    paddingVertical: 16,
    paddingBottom: 24,
    paddingLeft: 20,
    paddingRight: 20,
    gap: 12,
  },
  shoppingCategoryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    // removed border for cleaner look
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
    width: 300,
    minHeight: 100,
    marginHorizontal: 0,
    marginVertical: 0,
  },
  shoppingCategoryCardGradient: {
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 100,
  },
  shoppingCategoryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    paddingRight: 8,
  },
  shoppingCategoryIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  shoppingCategoryText: {
    flex: 1,
  },
  shoppingCategoryTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  shoppingCategorySubtitle: {
    fontSize: 12,
    fontWeight: '500',
    color: '#111827',
    opacity: 0.8,
  },
  shoppingCategoryRight: {
    alignItems: 'flex-end',
    gap: 6,
    maxWidth: '45%',
  },
  shoppingCategoryMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  shoppingCategoryMetaText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    maxWidth: '90%',
  },
  shoppingListHorizontalScroll: {
    flexGrow: 0,
  },
  shoppingListHorizontalContent: {
    gap: 6,
  },
  shoppingBeehiveContainer: {
    flexDirection: 'column',
  },
  shoppingBeehiveRow: {
    flexDirection: 'row',
    gap: 8, // Increased gap between icons in a row
    marginBottom: 12, // Increased space between rows
    justifyContent: 'center',
  },
  shoppingBeehiveRowOffset: {
    marginLeft: 24, // Increased offset for hexagonal beehive effect
  },
  shoppingIconContainer: {
    width: 40, // Slightly larger for hexagonal shape
    height: 40, // Slightly larger for hexagonal shape
    borderRadius: 20, // Circular for hexagonal effect
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 3,
    overflow: 'hidden',
  },
  shoppingIconPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E5E7EB', // Grey placeholder
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  shoppingIconGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Category Drawer Styles
  categoryDrawerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  categoryDrawerContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
    minHeight: '60%',
  },
  categoryDrawerHeader: {
    paddingTop: 20,
    paddingBottom: 16,
    paddingHorizontal: 20,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  categoryDrawerHeaderContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoryDrawerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  categoryDrawerIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  categoryDrawerTitleContainer: {
    flex: 1,
  },
  categoryDrawerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  categoryDrawerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  categoryDrawerCloseButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryDrawerContent: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  categoryDrawerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 0,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  categoryDrawerItemLeft: {
    marginRight: 12,
  },
  categoryDrawerItemIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryDrawerItemIconCompleted: {
    backgroundColor: '#10B981',
  },
  categoryDrawerItemContent: {
    flex: 1,
  },
  categoryDrawerItemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 2,
  },
  categoryDrawerItemNameCompleted: {
    textDecorationLine: 'line-through',
    color: '#9CA3AF',
  },
  categoryDrawerItemDescription: {
    fontSize: 14,
    color: '#6B7280',
  },
  categoryDrawerItemRight: {
    marginLeft: 12,
  },
  categoryDrawerItemQuantity: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '600',
    backgroundColor: '#E5E7EB',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  categoryDrawerItemQuantityCompleted: {
    backgroundColor: '#D1FAE5',
    color: '#059669',
  },
};


