/**
 * Utility to format audit log entries into human-readable notifications.
 */

export function formatNotificationAction(action: string): string {
  return action
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
}

export function formatNotificationMessage(notif: any): string {
  const { action, resource, details } = notif;
  
  // If there's a pre-provided description, use it
  if (details?.description) {
    return details.description;
  }
  
  const resourceName = resource ? resource.charAt(0).toUpperCase() + resource.slice(1).toLowerCase() : 'System';
  const actionName = action ? action.toLowerCase() : 'event';
  
  switch (actionName) {
    case 'create':
      return `Created new ${resourceName.toLowerCase()}${details?.name ? `: ${details.name}` : ''}`;
    case 'update':
      return `Updated ${resourceName.toLowerCase()}${details?.name ? `: ${details.name}` : ''}`;
    case 'delete':
      return `Deleted ${resourceName.toLowerCase()}${details?.name ? `: ${details.name}` : ''}`;
    case 'login':
      return `User logged in to the system`;
    case 'logout':
      return `User logged out from the system`;
    case 'failed':
      return `Failed ${resourceName.toLowerCase()} attempt detected`;
    case 'security_alert':
      return `Security alert: ${details?.reason || 'Unknown issue'}`;
    default:
      // Fallback for other actions
      const formattedAction = actionName.replace(/_/g, ' ');
      return `${resourceName} ${formattedAction}`;
  }
}
