/**
 * LoginScreen Test Cases
 * 
 * Production-ready tests for login screen functionality.
 * Uses react-test-renderer for React Native component testing.
 */

import React from 'react';
import renderer, { act } from 'react-test-renderer';

// Test data
const TEST_CREDENTIALS = {
    validEmail: 'john.doe@example.com',
    validPassword: 'SecurePass123!',
    invalidEmail: 'notanemail',
    emptyPassword: '',
};

// Mock functions
const mockLogin = jest.fn();
const mockLoginWithSSO = jest.fn();
const mockNavigate = jest.fn();
const mockGoBack = jest.fn();

// Mock ALL dependencies BEFORE any imports
jest.mock('@react-navigation/native', () => ({
    useNavigation: () => ({
        navigate: mockNavigate,
        goBack: mockGoBack,
    }),
}));

jest.mock('../../../contexts/AuthContext', () => ({
    useAuth: () => ({
        login: mockLogin,
        loginWithSSO: mockLoginWithSSO,
        devBypassLogin: jest.fn(),
        isLoading: false,
        isAuthenticated: false,
        user: null,
    }),
}));

jest.mock('../../../hooks/useAppConfig', () => ({
    useLoginBackground: () => ({
        background: null,
        loading: false,
    }),
}));

jest.mock('expo-linear-gradient', () => ({
    LinearGradient: 'LinearGradient',
}));

jest.mock('react-native-vector-icons/MaterialCommunityIcons', () => 'Icon');

jest.mock('../../../components/DynamicBackground', () => ({
    DynamicBackground: ({ children }: any) => children,
}));

jest.mock('../../../components/DynamicImage', () => ({
    DynamicLogo: () => null,
}));

jest.mock('react-native-safe-area-context', () => ({
    SafeAreaView: ({ children }: any) => children,
}));

// Import component after mocks
import LoginScreen from '../LoginScreen';

// Helper functions
function findByTestId(instance: renderer.ReactTestInstance, testId: string) {
    try {
        return instance.findByProps({ testID: testId });
    } catch {
        return null;
    }
}

function findByPlaceholder(instance: renderer.ReactTestInstance, placeholder: string) {
    try {
        return instance.findByProps({ placeholder });
    } catch {
        return null;
    }
}

function findTextNode(instance: renderer.ReactTestInstance, text: string) {
    const textNodes = instance.findAll(node =>
        node.type === 'Text' &&
        node.children &&
        node.children.some(child => typeof child === 'string' && child.includes(text))
    );
    return textNodes.length > 0 ? textNodes[0] : null;
}

function findTouchableWithText(instance: renderer.ReactTestInstance, text: string) {
    const touchables = instance.findAll(node => {
        if (!node.props?.onPress) return false;
        try {
            const textNodes = node.findAll(n =>
                n.type === 'Text' &&
                n.children?.some((c: any) => typeof c === 'string' && c.includes(text))
            );
            return textNodes.length > 0;
        } catch {
            return false;
        }
    });
    return touchables.length > 0 ? touchables[0] : null;
}

describe('LoginScreen', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('Initial Rendering', () => {
        it('should render the email input field', async () => {
            let component: renderer.ReactTestRenderer;
            await act(async () => {
                component = renderer.create(<LoginScreen />);
            });

            const emailInput = findByTestId(component!.root, 'email-input');
            expect(emailInput).not.toBeNull();
            expect(emailInput?.props.placeholder).toBe('Enter Email');
        });

        it('should render the password input field', async () => {
            let component: renderer.ReactTestRenderer;
            await act(async () => {
                component = renderer.create(<LoginScreen />);
            });

            const passwordInput = findByPlaceholder(component!.root, 'Enter Password');
            expect(passwordInput).not.toBeNull();
            expect(passwordInput?.props.secureTextEntry).toBe(true);
        });

        it('should render the Sign in button', async () => {
            let component: renderer.ReactTestRenderer;
            await act(async () => {
                component = renderer.create(<LoginScreen />);
            });

            const signInText = findTextNode(component!.root, 'Sign in');
            expect(signInText).not.toBeNull();
        });

        it('should render Remember me checkbox', async () => {
            let component: renderer.ReactTestRenderer;
            await act(async () => {
                component = renderer.create(<LoginScreen />);
            });

            const rememberMe = findTextNode(component!.root, 'Remember me');
            expect(rememberMe).not.toBeNull();
        });

        it('should render Forgot password link', async () => {
            let component: renderer.ReactTestRenderer;
            await act(async () => {
                component = renderer.create(<LoginScreen />);
            });

            const forgotPassword = findTextNode(component!.root, 'Forgot password?');
            expect(forgotPassword).not.toBeNull();
        });

        it('should render social login options', async () => {
            let component: renderer.ReactTestRenderer;
            await act(async () => {
                component = renderer.create(<LoginScreen />);
            });

            const socialText = findTextNode(component!.root, 'Sign in with');
            expect(socialText).not.toBeNull();
        });

        it('should render signup link for new users', async () => {
            let component: renderer.ReactTestRenderer;
            await act(async () => {
                component = renderer.create(<LoginScreen />);
            });

            const noAccount = findTextNode(component!.root, "Don't have an account?");
            const signUp = findTextNode(component!.root, 'Sign up');
            expect(noAccount).not.toBeNull();
            expect(signUp).not.toBeNull();
        });
    });

    describe('Form Input', () => {
        it('should update email value when text is entered', async () => {
            let component: renderer.ReactTestRenderer;
            await act(async () => {
                component = renderer.create(<LoginScreen />);
            });

            const emailInput = findByTestId(component!.root, 'email-input');

            await act(async () => {
                emailInput?.props.onChangeText(TEST_CREDENTIALS.validEmail);
            });

            expect(emailInput?.props.value).toBe(TEST_CREDENTIALS.validEmail);
        });

        it('should update password value when text is entered', async () => {
            let component: renderer.ReactTestRenderer;
            await act(async () => {
                component = renderer.create(<LoginScreen />);
            });

            const passwordInput = findByPlaceholder(component!.root, 'Enter Password');

            await act(async () => {
                passwordInput?.props.onChangeText(TEST_CREDENTIALS.validPassword);
            });

            expect(passwordInput?.props.value).toBe(TEST_CREDENTIALS.validPassword);
        });

        it('should mask password by default', async () => {
            let component: renderer.ReactTestRenderer;
            await act(async () => {
                component = renderer.create(<LoginScreen />);
            });

            const passwordInput = findByPlaceholder(component!.root, 'Enter Password');
            expect(passwordInput?.props.secureTextEntry).toBe(true);
        });
    });

    describe('Form Submission', () => {
        it('should call login with correct credentials when form is submitted', async () => {
            let component: renderer.ReactTestRenderer;
            await act(async () => {
                component = renderer.create(<LoginScreen />);
            });

            const emailInput = findByTestId(component!.root, 'email-input');
            const passwordInput = findByPlaceholder(component!.root, 'Enter Password');

            // Enter credentials
            await act(async () => {
                emailInput?.props.onChangeText(TEST_CREDENTIALS.validEmail);
                passwordInput?.props.onChangeText(TEST_CREDENTIALS.validPassword);
            });

            // Find and press sign in button
            const signInButton = findTouchableWithText(component!.root, 'Sign in');

            await act(async () => {
                signInButton?.props.onPress();
            });

            expect(mockLogin).toHaveBeenCalledWith(
                TEST_CREDENTIALS.validEmail,
                TEST_CREDENTIALS.validPassword
            );
        });
    });

    describe('Navigation', () => {
        it('should navigate to Signup when Sign up link is pressed', async () => {
            let component: renderer.ReactTestRenderer;
            await act(async () => {
                component = renderer.create(<LoginScreen />);
            });

            const signUpButton = findTouchableWithText(component!.root, 'Sign up');

            await act(async () => {
                signUpButton?.props.onPress();
            });

            expect(mockNavigate).toHaveBeenCalledWith('Signup');
        });

        it('should navigate to ForgotPassword when forgot password is pressed', async () => {
            let component: renderer.ReactTestRenderer;
            await act(async () => {
                component = renderer.create(<LoginScreen />);
            });

            const forgotPasswordButton = findTouchableWithText(component!.root, 'Forgot password?');

            await act(async () => {
                forgotPasswordButton?.props.onPress();
            });

            expect(mockNavigate).toHaveBeenCalledWith('ForgotPassword');
        });
    });

    describe('Component Structure', () => {
        it('should render without crashing', async () => {
            let component: renderer.ReactTestRenderer | null = null;
            await act(async () => {
                component = renderer.create(<LoginScreen />);
            });

            expect(component).toBeTruthy();
            expect(component!.toJSON()).toBeTruthy();
        });
    });
});
