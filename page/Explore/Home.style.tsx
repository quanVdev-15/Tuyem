import { StyleSheet, Dimensions, Platform } from 'react-native';
const { width, height } = Dimensions.get('window');

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA', // light chill background
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowOffset: { width: 0, height: 2 },
        shadowRadius: 8,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  memoryCount: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2D3748',
  },
  cancelText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#4A90E2',
  },
  batchDeleteButton: {
    backgroundColor: '#E53E3E',
    padding: 8,
    borderRadius: 8,
  },
  searchContainer: {
    backgroundColor: '#F5F7FA',
    borderTopWidth: 0,
    borderBottomWidth: 0,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  searchInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    height: 40,
    paddingHorizontal: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOpacity: 0.02,
        shadowOffset: { width: 0, height: 1 },
        shadowRadius: 4,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  searchText: {
    fontSize: 14,
    color: '#4A5568',
  },
  galleryContainer: {
    flex: 1,
    paddingHorizontal: 8,
  },
  listContent: {
    paddingBottom: 16,
  },
  itemContainer: {
    margin: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOpacity: 0.03,
        shadowOffset: { width: 0, height: 2 },
        shadowRadius: 6,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  image: {
    width: (width / 2) - 24,
    height: (width / 2) - 24,
  },
  noPhoto: {
    width: (width / 2) - 24,
    height: (width / 2) - 24,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#EDF2F7',
  },
  noPhotoText: {
    marginTop: 8,
    fontSize: 12,
    color: '#A0AEC0',
  },
  selectedItem: {
    borderColor: '#4A90E2',
    borderWidth: 2,
  },
  checkbox: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(74, 144, 226, 0.7)',
    borderRadius: 12,
    padding: 2,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 40,
  },
  emptyText: {
    marginTop: 12,
    fontSize: 16,
    color: '#718096',
    textAlign: 'center',
  },
  emptyButton: {
    marginTop: 16,
    backgroundColor: '#4A90E2',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
  },
  emptyButtonText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  backdropContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  detailOverlay: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: '80%',
    backgroundColor: '#f8f8f8',
    shadowColor: '#000',
    shadowOffset: { width: -2, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
    padding: 16,
    paddingTop: 50, // Make space for buttons at the top
    justifyContent: 'flex-start', // Align content from the top
  },
  deleteButton: {
    position: 'absolute',
    top: 16,
    right: 56,
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#E53E3E',
  },
  editButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#4A90E2',
  },
  detailContent: {
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  detailCard: {
    backgroundColor: '#F7FAFC',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  detailText: {
    fontSize: 14,
    marginBottom: 8,
    color: '#2D3748',
  },
  label: {
    fontWeight: '600',
    color: '#4A5568',
  },
  viewOnMapButton: {
    marginTop: 12,
    alignSelf: 'flex-start',
    backgroundColor: '#4A5568',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 16,
  },
  viewOnMapButtonText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  mapContainer: {
    height: 200,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
  },
  mapPreview: {
    width: '100%',
    height: '100%',
  },
  detailImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    marginBottom: 16,
  }
});
