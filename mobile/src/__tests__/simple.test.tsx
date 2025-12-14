/**
 * Simple React Component Test
 */

import React from 'react';
import renderer from 'react-test-renderer';
import { Text, View } from 'react-native';

// Simple test component
const SimpleComponent = () => (
    <View>
        <Text>Hello World</Text>
    </View>
);

describe('Simple React Native Test', () => {
    it('renders correctly', () => {
        const tree = renderer.create(<SimpleComponent />);
        expect(tree.toJSON()).toBeTruthy();
    });

    it('contains Hello World text', () => {
        const tree = renderer.create(<SimpleComponent />);
        const json = tree.toJSON() as any;
        expect(json.children[0].children[0]).toBe('Hello World');
    });
});
