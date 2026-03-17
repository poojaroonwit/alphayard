import { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  FlatList,
  Image,
  StatusBar,
  SafeAreaView,
  Alert,
  StyleSheet
} from 'react-native';
import {
  Folder,
  HardDrive,
  Cloud,
  Trash2,
  MoreVertical,
  Search,
  ArrowLeft,
  ChevronRight,
  Image as ImageIcon,
  Video,
  FileText,
  Grid,
  List as ListIcon,
  Disc,
  Server,
  CloudLightning,
  Smartphone,
  Loader
} from 'lucide-react-native';
import GalleryScreen from '../main/GalleryScreen';
import { fileManagementApi } from '../../services/api/fileManagement';

// const { width, height } = Dimensions.get('window'); // Dimensions unused
const THEME_COLOR = '#FA7272';
const SIDEBAR_WIDTH = 80;

// Types
type StorageSource = 'device' | 'network' | 'icloud' | 'gdrive' | 'onedrive' | 'recycle_bin';

interface FileItem {
  id: string;
  name: string;
  type: 'folder' | 'file' | 'image' | 'video' | 'doc' | 'audio' | 'other';
  size?: string;
  date: string;
  items?: number; // for folders
  thumbnail?: string;
}

// Helper to format bytes
const formatSize = (bytes: number) => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

const StorageScreen = ({ navigation }: any) => {
  const [currentSource, setCurrentSource] = useState<StorageSource>('network');
  const [currentPath, setCurrentPath] = useState<{id: string | null, name: string}[]>([{id: null, name: 'Home'}]);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isGalleryMode, setIsGalleryMode] = useState(false);
  const [files, setFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Cloud connection status (mock)
  const [cloudStatus, setCloudStatus] = useState<Record<string, boolean>>({
    icloud: false,
    gdrive: true,
    onedrive: false
  });

  useEffect(() => {
    loadFiles();
  }, [currentSource, currentPath]);

  const loadFiles = async () => {
    setLoading(true);
    try {
      if (currentSource === 'network') {
        const parentId = currentPath[currentPath.length - 1].id;
        const [foldersRes, filesRes] = await Promise.all([
          fileManagementApi.getFolders(parentId || undefined),
          fileManagementApi.getFiles({ folderId: parentId || undefined })
        ]);

        if (foldersRes.success && filesRes.success) {
          const folderItems: FileItem[] = foldersRes.folders.map(f => ({
            id: f.id,
            name: f.name,
            type: 'folder',
            date: new Date(f.updatedAt).toLocaleDateString(),
            items: f.itemCount
          }));

          const fileItems: FileItem[] = filesRes.files.map(f => ({
            id: f.id,
            name: f.fileName,
            type: f.fileType === 'document' ? 'doc' : f.fileType,
            size: formatSize(f.size),
            date: new Date(f.updatedAt).toLocaleDateString(),
            thumbnail: f.thumbnailUrl || f.url
          }));

          setFiles([...folderItems, ...fileItems]);
        }
      } else if (currentSource === 'recycle_bin') {
         const trashRes = await fileManagementApi.getTrash();
         if (trashRes.success) {
            setFiles(trashRes.files.map(f => ({
                id: f.id,
                name: f.fileName,
                type: f.fileType === 'document' ? 'doc' : f.fileType,
                size: formatSize(f.size),
                date: new Date(f.updatedAt).toLocaleDateString(),
                thumbnail: f.thumbnailUrl
            })));
         }
      } else {
         // Placeholder for device/cloud sources
         setFiles([]); 
      }
    } catch (error) {
      console.error('Failed to load files:', error);
      Alert.alert('Error', 'Failed to load files');
    } finally {
      setLoading(false);
    }
  };

  const handleSourceChange = (source: StorageSource) => {
    if (!cloudStatus[source] && source !== 'device' && source !== 'network' && source !== 'recycle_bin') {
      // Prompt to connect
      Alert.alert(
        "Connect Account", 
        `Would you like to connect your ${getSourceName(source)} account?`,
        [
          { text: "Cancel", style: "cancel" },
          { text: "Connect", onPress: () => {
             // Mock connect
             setCloudStatus(prev => ({ ...prev, [source]: true }));
             setCurrentSource(source);
          }}
        ]
      );
      return;
    }
    setCurrentSource(source);
    setCurrentPath([{id: null, name: 'Home'}]);
    setIsGalleryMode(false);
  };

  const handleFolderPress = (folderId: string, folderName: string) => {
    // Check if gallery folder (simplified logic)
    if (folderName === 'Images' || folderName === 'Gallery') {
      // Maybe switch to gallery mode? 
      // For now just navigate folder
    }
    setCurrentPath(prev => [...prev, {id: folderId, name: folderName}]);
  };

  const handleBack = () => {
    if (isGalleryMode) {
      setIsGalleryMode(false);
      setCurrentPath(prev => prev.slice(0, -1));
      return;
    }

    if (currentPath.length > 1) {
      setCurrentPath(prev => prev.slice(0, -1));
    } else {
      navigation.goBack();
    }
  };

  const getSourceName = (source: StorageSource) => {
    switch (source) {
      case 'device': return 'Internal Storage';
      case 'network': return 'Network Store';
      case 'icloud': return 'Apple iCloud';
      case 'gdrive': return 'Google Drive';
      case 'onedrive': return 'OneDrive';
      case 'recycle_bin': return 'Recycle Bin';
      default: return 'Storage';
    }
  };

  const getSourceIcon = (source: StorageSource, active: boolean) => {
    const iconColor = active ? THEME_COLOR : '#9CA3AF';
    const props = { size: 24, color: iconColor };
    switch (source) {
      case 'device': return <Smartphone {...props} />;
      case 'network': return <Server {...props} />;
      case 'icloud': return <Cloud {...props} />;
      case 'gdrive': return <Disc {...props} />;
      case 'onedrive': return <CloudLightning {...props} />;
      case 'recycle_bin': return <Trash2 {...props} />;
      default: return <HardDrive {...props} />;
    }
  };

  const renderSidebarItem = (source: StorageSource) => (
    <TouchableOpacity
      key={source}
      style={[styles.sidebarItem, currentSource === source && styles.sidebarItemActive]}
      onPress={() => handleSourceChange(source)}
    >
      <View style={styles.sidebarIconWrapper}>
        {getSourceIcon(source, currentSource === source)}
        {!cloudStatus[source] && (
            <View style={styles.disconnectBadge} />
        )}
      </View>
      <Text style={[styles.sidebarLabel, currentSource === source && styles.sidebarLabelActive]}>
        {source === 'device' ? 'Phone' : 
         source === 'network' ? 'Network' :
         source === 'icloud' ? 'Apple' :
         source === 'gdrive' ? 'Drive' :
         source === 'onedrive' ? 'One' : 'Bin'}
      </Text>
    </TouchableOpacity>
  );

  const renderFileIcon = (item: FileItem) => {
    if (item.thumbnail) {
      return <Image source={{ uri: item.thumbnail }} style={styles.fileThumbnail} />;
    }
    
    switch (item.type) {
      case 'folder': return <Folder size={24} {...({color: "#FF9F43", fill: "#FF9F43", fillOpacity: 0.2} as any)} />;
      case 'image': return <ImageIcon size={24} {...({color: "#3B82F6"} as any)} />;
      case 'video': return <Video size={24} {...({color: "#EF4444"} as any)} />;
      case 'doc': return <FileText size={24} {...({color: "#10B981"} as any)} />;
      default: return <FileText size={24} {...({color: "#6B7280"} as any)} />;
    }
  };

  const renderContent = () => {
    if (isGalleryMode) {
      return <GalleryScreen embedded darkMode={false} />;
    }

    if (loading) {
      return (
        <View style={styles.centerContainer}>
          <Loader size={32} {...({color: THEME_COLOR, style: { transform: [{ rotate: '45deg' }] }} as any)} />
          <Text style={styles.loadingText}>Syncing {getSourceName(currentSource)}...</Text>
        </View>
      );
    }

    if (files.length === 0) {
      return (
        <View style={styles.centerContainer}>
          <Folder size={64} {...({color: "#E5E7EB"} as any)} />
          <Text style={styles.emptyText}>Folder is empty</Text>
        </View>
      );
    }

    return (
      <FlatList
        key={viewMode}
        data={files}
        keyExtractor={item => item.id}
        numColumns={viewMode === 'grid' ? 2 : 1}
        contentContainerStyle={styles.fileList}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={viewMode === 'grid' ? styles.gridItem : styles.listItem}
            onPress={() => {
              if (item.type === 'folder') handleFolderPress(item.id, item.name);
              else Alert.alert('File Preview', `Opening ${item.name}...`);
            }}
          >
            {viewMode === 'grid' ? (
              <View style={styles.gridCard}>
                <View style={[styles.gridIconContainer, { backgroundColor: item.type === 'folder' ? '#FEF3C7' : '#F3F4F6' }]}>
                  {renderFileIcon(item)}
                </View>
                <View style={styles.gridInfo}>
                  <Text style={styles.fileName} numberOfLines={1}>{item.name}</Text>
                  <Text style={styles.fileMeta}>
                    {item.type === 'folder' ? `${item.items} items` : item.size}
                  </Text>
                </View>
              </View>
            ) : (
                <View style={styles.listCard}>
                     <View style={[styles.listIconContainer, { backgroundColor: item.type === 'folder' ? '#FEF3C7' : '#F3F4F6' }]}>
                        {renderFileIcon(item)}
                    </View>
                    <View style={styles.listInfo}>
                        <Text style={styles.fileName} numberOfLines={1}>{item.name}</Text>
                        <Text style={styles.fileMeta}>
                            {item.date} • {item.type === 'folder' ? `${item.items} items` : item.size}
                        </Text>
                    </View>
                    <TouchableOpacity style={{ padding: 8 }}>
                         <MoreVertical size={20} {...({color: "#9CA3AF"} as any)} />
                    </TouchableOpacity>
                </View>
            )}
          </TouchableOpacity>
        )}
      />
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      {/* Container Layout */}
      <View style={styles.mainLayout}>
        
        {/* Sidebar */}
        <View style={styles.sidebar}>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.sidebarContent}>
             <View style={styles.sidebarSection}>
                <Text style={styles.sidebarSectionTitle}>LOCAL</Text>
                {renderSidebarItem('device')}
                {renderSidebarItem('network')}
             </View>

             <View style={styles.sidebarSection}>
                <Text style={styles.sidebarSectionTitle}>CLOUD</Text>
                {renderSidebarItem('icloud')}
                {renderSidebarItem('gdrive')}
                {renderSidebarItem('onedrive')}
             </View>

             <View style={styles.sidebarSection}>
                <Text style={styles.sidebarSectionTitle}>TRASH</Text>
                {renderSidebarItem('recycle_bin')}
             </View>
          </ScrollView>
        </View>

        {/* Main Content Area */}
        <View style={styles.contentArea}>
            {/* Header */}
            <View style={styles.header}>
                <View style={styles.headerTop}>
                    <TouchableOpacity onPress={handleBack} style={styles.backButton}>
                        <ArrowLeft size={24} {...({color: "#1F2937"} as any)} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>{getSourceName(currentSource)}</Text>
                    <View style={{ flexDirection: 'row', gap: 12 }}>
                         <TouchableOpacity onPress={() => setViewMode(prev => prev === 'grid' ? 'list' : 'grid')}>
                            {viewMode === 'grid' ? <ListIcon size={24} {...({color: "#1F2937"} as any)} /> : <Grid size={24} {...({color: "#1F2937"} as any)} />}
                         </TouchableOpacity>
                         <TouchableOpacity>
                            <Search size={24} {...({color: "#1F2937"} as any)} />
                         </TouchableOpacity>
                    </View>
                </View>
                
                {/* Breadcrumb Path */}
                {!isGalleryMode && (
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.breadcrumbBar}>
                        {currentPath.map((segment, index) => (
                            <View key={index} style={{ flexDirection: 'row', alignItems: 'center' }}>
                                 {index > 0 && <ChevronRight size={16} {...({color: "#4B5563"} as any)} />}
                                 <TouchableOpacity onPress={() => setCurrentPath(currentPath.slice(0, index + 1))}>
                                     <Text style={[styles.breadcrumbText, index === currentPath.length - 1 && styles.breadcrumbActive]}>
                                         {segment.name}
                                     </Text>
                                 </TouchableOpacity>
                            </View>
                        ))}
                    </ScrollView>
                )}
            </View>

            {/* Folder Content */}
            <View style={styles.fileView}>
                {renderContent()}
            </View>

            {/* Floating Action Button */}
            {!isGalleryMode && (
                <TouchableOpacity style={styles.fab} onPress={() => {/* Handle menu */}}>
              <MoreVertical size={24} {...({color: '#6B7280'} as any)} />
            </TouchableOpacity>
            )}
        </View>

      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  mainLayout: {
    flex: 1,
    flexDirection: 'row',
  },
  sidebar: {
    width: SIDEBAR_WIDTH,
    backgroundColor: '#FFFFFF',
    borderRightWidth: 1,
    borderRightColor: '#E5E7EB',
  },
  sidebarContent: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  sidebarSection: {
    marginBottom: 24,
    width: '100%',
    alignItems: 'center',
  },
  sidebarSectionTitle: {
    fontSize: 10,
    fontWeight: '700',
    color: '#9CA3AF',
    marginBottom: 12,
  },
  sidebarItem: {
    alignItems: 'center',
    marginBottom: 16,
    width: '100%',
  },
  sidebarItemActive: {
    opacity: 1,
  },
  sidebarIconWrapper: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    marginBottom: 4,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  sidebarLabel: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '500',
  },
  sidebarLabelActive: {
    color: THEME_COLOR,
    fontWeight: '700',
  },
  disconnectBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#9CA3AF',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  contentArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
  },
  breadcrumbBar: {
    flexDirection: 'row',
  },
  breadcrumbText: {
    fontSize: 14,
    color: '#6B7280',
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  breadcrumbActive: {
    color: THEME_COLOR,
    fontWeight: '600',
  },
  fileView: {
    flex: 1,
  },
  fileList: {
    padding: 20,
    paddingBottom: 100,
  },
  gridItem: {
    flex: 0.5,
    padding: 6,
  },
  gridCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  gridIconContainer: {
    width: '100%',
    aspectRatio: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    marginBottom: 12,
  },
  gridInfo: {
    gap: 2,
  },
  listItem: {
    marginBottom: 12,
  },
  listCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  listIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  listInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  fileName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  fileThumbnail: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
    resizeMode: 'cover',
  },
  fileMeta: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: THEME_COLOR,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: THEME_COLOR,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6B7280',
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: '500',
    color: '#9CA3AF',
  },
  moreButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default StorageScreen;
