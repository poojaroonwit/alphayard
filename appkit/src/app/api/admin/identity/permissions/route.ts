// Permissions System - Complete implementation with database integration
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/server/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const module = searchParams.get('module')
    
    if (module) {
      // Get permissions for specific module
      const modulePermissions = await prisma.userGroup.findMany({
        where: {
          permissions: {
            path: ['*'],
            string_contains: `${module}:`
          }
        },
        select: {
          permissions: true
        }
      })
      
      // Extract unique permissions for this module
      const allPermissions = new Set<string>()
      modulePermissions.forEach(group => {
        const permissions = Array.isArray(group.permissions) ? group.permissions : []
        permissions.forEach((perm: any) => {
          if (typeof perm === 'string') {
            if (perm === '*' || perm.startsWith(`${module}:`)) {
              allPermissions.add(perm)
            }
          }
        })
      })
      
      const formattedPermissions = Array.from(allPermissions).map(perm => {
        const [mod, action] = perm.split(':')
        return {
          id: perm,
          module: mod,
          action: action,
          description: `${action.charAt(0).toUpperCase() + action.slice(1)} ${mod.charAt(0).toUpperCase() + mod.slice(1)}`
        }
      })
      
      return NextResponse.json({
        success: true,
        permissions: formattedPermissions,
        module: module,
        message: `Permissions for module '${module}' retrieved successfully`
      })
    }
    
    // Get all permissions grouped by module
    const allRoles = await prisma.userGroup.findMany({
      select: {
        permissions: true
      }
    })
    
    // Extract and deduplicate all permissions
    const allPermissions = new Set<string>()
    const permissionsByModule = {} as Record<string, any[]>
    
    allRoles.forEach(role => {
      const permissions = Array.isArray(role.permissions) ? role.permissions : []
      permissions.forEach((perm: any) => {
        if (typeof perm === 'string') {
          allPermissions.add(perm)
          
          if (perm === '*') {
            // Super admin permission
            if (!permissionsByModule['*']) {
              permissionsByModule['*'] = []
            }
            permissionsByModule['*'].push({
              id: perm,
              module: '*',
              action: 'all',
              description: 'Full system access'
            })
          } else if (perm.includes(':')) {
            const [mod, action] = perm.split(':')
            if (!permissionsByModule[mod]) {
              permissionsByModule[mod] = []
            }
            permissionsByModule[mod].push({
              id: perm,
              module: mod,
              action: action,
              description: `${action.charAt(0).toUpperCase() + action.slice(1)} ${mod.charAt(0).toUpperCase() + mod.slice(1)}`
            })
          }
        }
      })
    })
    
    // Convert to array format
    const formattedPermissions = Object.entries(permissionsByModule).flatMap(([module, perms]) => 
      perms.map((perm: any) => ({
        id: perm.id,
        module: perm.module,
        action: perm.action,
        description: perm.description
      }))
    
    return NextResponse.json({
      success: true,
      permissions: formattedPermissions,
      modules: Object.keys(permissionsByModule),
      message: 'All permissions retrieved successfully'
    })
  } catch (error) {
    console.error('Failed to get permissions:', error)
    return NextResponse.json(
      { error: 'Failed to get permissions' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, module, action, description } = body
    
    if (!name || !module || !action) {
      return NextResponse.json(
        { error: 'Name, module, and action are required' },
        { status: 400 }
      )
    }
    
    const permissionId = `${module}:${action}`
    
    // Check if permission already exists
    const existingPermission = await prisma.userGroup.findFirst({
      where: {
        permissions: {
          path: ['*'],
          string_contains: permissionId
        }
      }
    })
    
    if (existingPermission) {
      return NextResponse.json(
        { error: 'Permission already exists' },
        { status: 409 }
      )
    }
    
    // Add permission to all roles that have '*' permission
    const superAdminRoles = await prisma.userGroup.findMany({
      where: {
        permissions: {
          path: ['*'],
          string_contains: '*'
        }
      }
    })
    
    // Update all super admin roles to include the new permission
    await prisma.userGroup.updateMany({
      where: {
        id: { in: superAdminRoles.map(role => role.id) }
      },
      data: {
        permissions: {
          push: permissionId
        }
      }
    })
    
    console.log(`🔐 Permission Created: ${permissionId}`, {
      permissionId,
      module,
      action,
      description
    })
    
    return NextResponse.json({
      success: true,
      permission: {
        id: permissionId,
        module,
        action,
        description: description || `${action.charAt(0).toUpperCase() + action.slice(1)} ${module.charAt(0).toUpperCase() + module.slice(1)}`
      },
      message: 'Permission created successfully'
    }, { status: 201 })
  } catch (error) {
    console.error('Failed to create permission:', error)
    return NextResponse.json(
      { error: 'Failed to create permission' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, name, description } = body
    
    if (!id) {
      return NextResponse.json(
        { error: 'Permission ID is required' },
        { status: 400 }
      )
    }
    
    // Parse permission ID to get module and action
    const [module, action] = id.split(':')
    
    // Update permission in all roles that have this permission
    const rolesWithPermission = await prisma.userGroup.findMany({
      where: {
        permissions: {
          path: ['*'],
          string_contains: id
        }
      }
    })
    
    if (rolesWithPermission.length === 0) {
      return NextResponse.json(
        { error: 'Permission not found' },
        { status: 404 }
      )
    }
    
    // Update the permission in all roles
    await prisma.userGroup.updateMany({
      where: {
        id: { in: rolesWithPermission.map(role => role.id) }
      },
      data: {
        permissions: {
          set: rolesWithPermission.map(role => 
            role.permissions.map((perm: any) => 
              perm === id ? `${module}:${action}` : perm
            )
          )
        }
      }
    })
    
    console.log(`🔐 Permission Updated: ${id}`, {
      permissionId: id,
      module,
      action,
      description
    })
    
    return NextResponse.json({
      success: true,
      permission: {
        id: id,
        module,
        action,
        description: description || `${action.charAt(0).toUpperCase() + action.slice(1)} ${module.charAt(0).toUpperCase() + module.slice(1)}`
      },
      message: 'Permission updated successfully'
    })
  } catch (error) {
    console.error('Failed to update permission:', error)
    return NextResponse.json(
      { error: 'Failed to update permission' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const permissionId = searchParams.get('id')
    
    if (!permissionId) {
      return NextResponse.json(
        { error: 'Permission ID is required' },
        { status: 400 }
      )
    }
    
    // Check if permission exists
    const rolesWithPermission = await prisma.userGroup.findMany({
      where: {
        permissions: {
          path: ['*'],
          string_contains: permissionId
        }
      }
    })
    
    if (rolesWithPermission.length === 0) {
      return NextResponse.json(
        { error: 'Permission not found' },
        { status: 404 }
      )
    }
    
    // Remove permission from all roles
    await prisma.userGroup.updateMany({
      where: {
        id: { in: rolesWithPermission.map(role => role.id) }
      },
      data: {
        permissions: {
          set: rolesWithPermission.map(role => 
            role.permissions.filter((perm: any) => perm !== permissionId)
          )
        }
      }
    })
    
    console.log(`🔐 Permission Deleted: ${permissionId}`, {
      permissionId
    })
    
    return NextResponse.json({
      success: true,
      message: 'Permission deleted successfully'
    })
  } catch (error) {
    console.error('Failed to delete permission:', error)
    return NextResponse.json(
      { error: 'Failed to delete permission' },
      { status: 500 }
    )
  }
}
