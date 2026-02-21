const fs = require('fs');
const path = require('path');

// Read the current v1/index.ts file
const v1IndexPath = path.join(__dirname, 'src/routes/v1/index.ts');
let v1IndexContent = fs.readFileSync(v1IndexPath, 'utf8');

// Replace the problematic config route imports and usage
const oldConfigImport = "import configRoutes from '../configRoutes';";
const newConfigImport = "import workingConfigRoutes from '../admin/workingConfigRoutes';";

const oldConfigRoute = "router.use('/admin/config', configRoutes); // Admin configuration (alternative path)";
const newConfigRoute = "router.use('/admin/config', workingConfigRoutes); // Use working config routes";

// Apply the replacements
v1IndexContent = v1IndexContent.replace(oldConfigImport, newConfigImport);
v1IndexContent = v1IndexContent.replace(oldConfigRoute, newConfigRoute);

// Also add the v1 admin config route
const v1AdminConfigRoute = "router.use('/admin/config', workingConfigRoutes); // Use working config routes for v1 as well";
if (!v1IndexContent.includes('router.use(\'/admin/config\', workingConfigRoutes)')) {
  // Find the line after app-config and insert our route
  const insertPoint = v1IndexContent.indexOf("router.use('/app-config', appConfigRoutes);");
  if (insertPoint !== -1) {
    const lines = v1IndexContent.split('\n');
    const insertIndex = lines.findIndex(line => line.includes("router.use('/app-config', appConfigRoutes);"));
    if (insertIndex !== -1) {
      lines.splice(insertIndex + 1, 0, "router.use('/admin/config', workingConfigRoutes); // Working admin config routes");
      v1IndexContent = lines.join('\n');
    }
  }
}

// Write the patched content back
fs.writeFileSync(v1IndexPath, v1IndexContent);

console.log('✅ Admin routes patched successfully!');
console.log('📁 Modified:', v1IndexPath);
console.log('🔄 Routes now use workingConfigRoutes instead of problematic configRoutes');
