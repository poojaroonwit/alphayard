
import { FieldDefinition } from '../components/collections/CollectionSchemaBuilder';

/**
 * Generates TypeScript usage examples for mobile integration based on a collection schema.
 * @param collectionName The system name/ID of the collection
 * @param displayName The human-readable name of the collection
 * @param fields The list of fields defined in the schema
 * @returns A formatted string containing the TypeScript interface and usage code
 */
export const generateMobileUsage = (
    collectionName: string, 
    displayName: string, 
    fields: { key?: string; name?: string; type: string; required?: boolean; options?: any[] }[]
) => {
    // Normalize fields to handle both SchemaField (key) and FieldDefinition (name) structures
    const normalizedFields = fields.map(f => ({
        name: f.key || f.name || 'unknown_field',
        type: f.type,
        required: f.required,
        options: f.options
    }));

    const typeName = displayName.replace(/\s+/g, '') + 'Item';
    
    const interfaceFields = normalizedFields.map(f => {
        let type = 'string';
        if (f.type === 'number') type = 'number';
        if (f.type === 'boolean') type = 'boolean';
        if (f.type === 'date' || f.type === 'datetime') type = 'Date';
        if (f.type === 'select' || f.type === 'multiselect') {
            type = (f.options || []).length > 0
                ? `\n    | '${(f.options || []).map(o => o.value).join("'\n    | '")}'`
                : 'string';
        }
        
        return `  ${f.name}${f.required ? '' : '?'}: ${type};`
    }).join('\n');

    return `// 1. Define the type (Optional, for better intellisense)
interface ${typeName} {
  id: string;
${interfaceFields}
}

// 2. Use the hook (Pre-built in 'src/hooks/useCollection')
const { 
  data, // List of items
  loading, 
  create, 
  update, 
  remove,
  getItem 
} = useCollection<${typeName}>('${collectionName}');

// 3. Examples:
// Read (List): data.map(item => item.field)
// Read (One):  const item = await getItem('id_here');
// Create:      await create({ ${normalizedFields[0]?.name || 'field'}: 'value' });
// Update:      await update('id_here', { ${normalizedFields[0]?.name || 'field'}: 'new_value' });
// Delete:      await remove('id_here');

// 4. Render list
<FlatList
  data={data}
  renderItem={({ item }) => (
    <View>
      <Text>{item.${normalizedFields[0]?.name || 'name'}}</Text>
      <Button onPress={() => remove(item.id)} title="Delete" />
    </View>
  )}
/>`;
};
