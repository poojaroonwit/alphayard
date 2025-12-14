import React from 'react';
import { View, Text } from 'react-native';

const TestApp = () => {
    return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'blue' }}>
            <Text style={{ color: 'white', fontSize: 24 }}>Test App Works</Text>
        </View>
    );
};

export default TestApp;
