import { Response } from 'express';
import { supabase } from '../config/supabase';

export class VersionController {
  /**
   * Get version history for a page
   */
  async getVersionHistory(req: any, res: Response) {
    try {
      const { pageId } = req.params;
      const { limit = 50, offset = 0 } = req.query;

      const { data, error } = await supabase
        .from('page_versions')
        .select('*')
        .eq('page_id', pageId)
        .order('version_number', { ascending: false })
        .range(parseInt(String(offset)), parseInt(String(offset)) + parseInt(String(limit)) - 1);

      if (error) {
        console.error('Error fetching version history:', error);
        return res.status(400).json({ error: error.message });
      }

      res.json({ versions: data });
    } catch (error) {
      console.error('Error fetching version history:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Get a specific version
   */
  async getVersion(req: any, res: Response) {
    try {
      const { pageId, versionId } = req.params;

      const { data, error } = await supabase
        .from('page_versions')
        .select('*')
        .eq('page_id', pageId)
        .eq('id', versionId)
        .single();

      if (error) {
        console.error('Error fetching version:', error);
        return res.status(404).json({ error: 'Version not found' });
      }

      res.json({ version: data });
    } catch (error) {
      console.error('Error fetching version:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Get a specific version by version number
   */
  async getVersionByNumber(req: any, res: Response) {
    try {
      const { pageId, versionNumber } = req.params;

      const { data, error } = await supabase
        .from('page_versions')
        .select('*')
        .eq('page_id', pageId)
        .eq('version_number', parseInt(versionNumber))
        .single();

      if (error) {
        console.error('Error fetching version:', error);
        return res.status(404).json({ error: 'Version not found' });
      }

      res.json({ version: data });
    } catch (error) {
      console.error('Error fetching version:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Preview a specific version (render version without affecting current page)
   */
  async previewVersion(req: any, res: Response) {
    try {
      const { pageId, versionId } = req.params;

      // Get version
      const { data: version, error: versionError } = await supabase
        .from('page_versions')
        .select('*')
        .eq('page_id', pageId)
        .eq('id', versionId)
        .single();

      if (versionError) {
        console.error('Error fetching version:', versionError);
        return res.status(404).json({ error: 'Version not found' });
      }

      // Get page metadata
      const { data: page, error: pageError } = await supabase
        .from('pages')
        .select('id, title, slug, description, metadata, seo_config')
        .eq('id', pageId)
        .single();

      if (pageError) {
        console.error('Error fetching page:', pageError);
        return res.status(404).json({ error: 'Page not found' });
      }

      // Combine page metadata with version components
      const preview = {
        ...page,
        components: version.components,
        version_number: version.version_number,
        version_created_at: version.created_at,
        version_created_by: version.created_by
      };

      res.json({ preview });
    } catch (error) {
      console.error('Error previewing version:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Restore a previous version (creates a new version based on the selected one)
   */
  async restoreVersion(req: any, res: Response) {
    try {
      const { pageId, versionId } = req.params;
      const { changeDescription } = req.body;
      const userId = req.user?.id || req.admin?.id;

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      // Get the version to restore
      const { data: version, error: versionError } = await supabase
        .from('page_versions')
        .select('*')
        .eq('page_id', pageId)
        .eq('id', versionId)
        .single();

      if (versionError) {
        console.error('Error fetching version:', versionError);
        return res.status(404).json({ error: 'Version not found' });
      }

      // Delete current page components
      await supabase
        .from('page_components')
        .delete()
        .eq('page_id', pageId);

      // Insert components from the version
      if (version.components && Array.isArray(version.components) && version.components.length > 0) {
        const componentData = version.components.map((comp: any) => ({
          page_id: pageId,
          component_type: comp.componentType || comp.component_type,
          position: comp.position,
          props: comp.props || {},
          styles: comp.styles || {},
          responsive_config: comp.responsiveConfig || comp.responsive_config || {}
        }));

        const { error: insertError } = await supabase
          .from('page_components')
          .insert(componentData);

        if (insertError) {
          console.error('Error restoring components:', insertError);
          return res.status(400).json({ error: 'Failed to restore version components' });
        }
      }

      // Update page to trigger version creation
      const { data: updatedPage, error: updateError } = await supabase
        .from('pages')
        .update({
          updated_by: userId,
          updated_at: new Date().toISOString(),
          metadata: {
            ...version.metadata,
            restored_from_version: version.version_number,
            restore_description: changeDescription || `Restored from version ${version.version_number}`
          }
        })
        .eq('id', pageId)
        .select()
        .single();

      if (updateError) {
        console.error('Error updating page:', updateError);
        return res.status(400).json({ error: 'Failed to update page' });
      }

      // Get the newly created version
      const { data: newVersion } = await supabase
        .from('page_versions')
        .select('*')
        .eq('page_id', pageId)
        .order('version_number', { ascending: false })
        .limit(1)
        .single();

      res.json({ 
        page: updatedPage,
        newVersion,
        message: `Successfully restored version ${version.version_number}`
      });
    } catch (error) {
      console.error('Error restoring version:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Compare two versions
   */
  async compareVersions(req: any, res: Response) {
    try {
      const { pageId } = req.params;
      const { version1, version2 } = req.query;

      if (!version1 || !version2) {
        return res.status(400).json({ error: 'Both version IDs are required' });
      }

      // Get both versions
      const { data: versions, error } = await supabase
        .from('page_versions')
        .select('*')
        .eq('page_id', pageId)
        .in('id', [version1, version2]);

      if (error || !versions || versions.length !== 2) {
        console.error('Error fetching versions:', error);
        return res.status(404).json({ error: 'One or both versions not found' });
      }

      const v1 = versions.find(v => v.id === version1);
      const v2 = versions.find(v => v.id === version2);

      if (!v1 || !v2) {
        return res.status(404).json({ error: 'One or both versions not found' });
      }

      // Compare components
      const comparison = this.compareComponents(v1.components, v2.components);

      res.json({
        version1: {
          id: v1.id,
          version_number: v1.version_number,
          created_at: v1.created_at,
          created_by: v1.created_by
        },
        version2: {
          id: v2.id,
          version_number: v2.version_number,
          created_at: v2.created_at,
          created_by: v2.created_by
        },
        comparison
      });
    } catch (error) {
      console.error('Error comparing versions:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Helper method to compare components between two versions
   */
  private compareComponents(components1: any[], components2: any[]) {
    const added: any[] = [];
    const removed: any[] = [];
    const modified: any[] = [];

    // Create maps for easier comparison
    const map1 = new Map(components1.map((c, i) => [i, c]));
    const map2 = new Map(components2.map((c, i) => [i, c]));

    // Find added and modified components
    map2.forEach((comp2, index) => {
      const comp1 = map1.get(index);
      
      if (!comp1) {
        added.push({
          position: index,
          component: comp2
        });
      } else {
        // Check if component was modified
        const changes = this.findComponentChanges(comp1, comp2);
        if (changes.length > 0) {
          modified.push({
            position: index,
            componentType: comp2.componentType || comp2.component_type,
            changes
          });
        }
      }
    });

    // Find removed components
    map1.forEach((comp1, index) => {
      if (!map2.has(index)) {
        removed.push({
          position: index,
          component: comp1
        });
      }
    });

    return {
      added,
      removed,
      modified,
      summary: {
        addedCount: added.length,
        removedCount: removed.length,
        modifiedCount: modified.length
      }
    };
  }

  /**
   * Helper method to find changes between two components
   */
  private findComponentChanges(comp1: any, comp2: any) {
    const changes: any[] = [];

    // Check component type
    const type1 = comp1.componentType || comp1.component_type;
    const type2 = comp2.componentType || comp2.component_type;
    if (type1 !== type2) {
      changes.push({
        property: 'componentType',
        oldValue: type1,
        newValue: type2
      });
    }

    // Check position
    if (comp1.position !== comp2.position) {
      changes.push({
        property: 'position',
        oldValue: comp1.position,
        newValue: comp2.position
      });
    }

    // Check props
    const propsChanges = this.findObjectChanges(comp1.props || {}, comp2.props || {});
    if (propsChanges.length > 0) {
      changes.push({
        property: 'props',
        changes: propsChanges
      });
    }

    // Check styles
    const stylesChanges = this.findObjectChanges(comp1.styles || {}, comp2.styles || {});
    if (stylesChanges.length > 0) {
      changes.push({
        property: 'styles',
        changes: stylesChanges
      });
    }

    return changes;
  }

  /**
   * Helper method to find changes between two objects
   */
  private findObjectChanges(obj1: any, obj2: any) {
    const changes: any[] = [];
    const allKeys = new Set([...Object.keys(obj1), ...Object.keys(obj2)]);

    allKeys.forEach(key => {
      const val1 = obj1[key];
      const val2 = obj2[key];

      if (JSON.stringify(val1) !== JSON.stringify(val2)) {
        changes.push({
          key,
          oldValue: val1,
          newValue: val2
        });
      }
    });

    return changes;
  }

  /**
   * Delete a version (only for non-current versions)
   */
  async deleteVersion(req: any, res: Response) {
    try {
      const { pageId, versionId } = req.params;

      // Get the latest version number
      const { data: latestVersion } = await supabase
        .from('page_versions')
        .select('version_number')
        .eq('page_id', pageId)
        .order('version_number', { ascending: false })
        .limit(1)
        .single();

      // Get the version to delete
      const { data: versionToDelete } = await supabase
        .from('page_versions')
        .select('version_number')
        .eq('id', versionId)
        .single();

      if (!versionToDelete) {
        return res.status(404).json({ error: 'Version not found' });
      }

      // Prevent deletion of the current version
      if (latestVersion && versionToDelete.version_number === latestVersion.version_number) {
        return res.status(400).json({ error: 'Cannot delete the current version' });
      }

      const { error } = await supabase
        .from('page_versions')
        .delete()
        .eq('id', versionId);

      if (error) {
        console.error('Error deleting version:', error);
        return res.status(400).json({ error: error.message });
      }

      res.json({ message: 'Version deleted successfully' });
    } catch (error) {
      console.error('Error deleting version:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}
