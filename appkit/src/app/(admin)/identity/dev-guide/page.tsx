'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { Button } from '@/components/ui/Button';
import { Copy, Terminal, Code } from 'lucide-react';

export default function IdentityDevGuidePage() {
    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Developer Guide</h2>
                    <p className="text-muted-foreground">
                        Integrate Identity features into your applications using our SDKs and APIs.
                    </p>
                </div>
            </div>

            <Tabs defaultValue="quickstart" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="quickstart">Quick Start</TabsTrigger>
                    <TabsTrigger value="authentication">Authentication</TabsTrigger>
                    <TabsTrigger value="sdk">SDK Reference</TabsTrigger>
                    <TabsTrigger value="api">API Reference</TabsTrigger>
                </TabsList>

                <TabsContent value="quickstart" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Installation</CardTitle>
                            <CardDescription>
                                Add the Identity SDK to your project.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="bg-muted p-4 rounded-md flex items-center justify-between">
                                <code className="text-sm font-mono">npm install @appkit/identity-sdk</code>
                                <Button variant="ghost" size="sm">
                                    <Copy className="h-4 w-4" />
                                </Button>
                            </div>
                            <div className="bg-muted p-4 rounded-md flex items-center justify-between">
                                <code className="text-sm font-mono">yarn add @appkit/identity-sdk</code>
                                <Button variant="ghost" size="sm">
                                    <Copy className="h-4 w-4" />
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Initialize the Client</CardTitle>
                            <CardDescription>
                                Configure the SDK with your application credentials.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="relative bg-muted p-4 rounded-md overflow-x-auto">
                                <pre className="text-sm font-mono text-foreground">
{`import { AppKitAuth } from '@appkit/identity-sdk';

const auth = new AppKitAuth({
  apiUrl: 'https://your-appkit-domain.com',
  appId: 'your-app-id'
});`}
                                </pre>
                                <Button variant="ghost" size="sm" className="absolute top-2 right-2">
                                    <Copy className="h-4 w-4" />
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="authentication" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Login Flow</CardTitle>
                            <CardDescription>
                                Implement login using the SDK.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="relative bg-muted p-4 rounded-md overflow-x-auto">
                                <pre className="text-sm font-mono text-foreground">
{`// Login with email and password
const result = await auth.login('user@example.com', 'password');
const user = result.user;

// Check authentication status
if (auth.isAuthenticated) {
  console.log('User is logged in:', auth.user);
}`}
                                </pre>
                                <Button variant="ghost" size="sm" className="absolute top-2 right-2">
                                    <Copy className="h-4 w-4" />
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
                
                <TabsContent value="sdk" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Core Methods</CardTitle>
                        </CardHeader>
                        <CardContent>
                           <div className="space-y-4">
                                <div className="border rounded-md p-4">
                                    <h4 className="font-semibold flex items-center gap-2">
                                        <Code className="h-4 w-4" />
                                        login(email, password)
                                    </h4>
                                    <p className="text-sm text-muted-foreground mt-1">Authenticates user with email and password.</p>
                                </div>
                                <div className="border rounded-md p-4">
                                    <h4 className="font-semibold flex items-center gap-2">
                                        <Code className="h-4 w-4" />
                                        logout()
                                    </h4>
                                    <p className="text-sm text-muted-foreground mt-1">Clears the session and logs out the user.</p>
                                </div>
                                <div className="border rounded-md p-4">
                                    <h4 className="font-semibold flex items-center gap-2">
                                        <Code className="h-4 w-4" />
                                        getUser()
                                    </h4>
                                    <p className="text-sm text-muted-foreground mt-1">Returns the current authenticated user profile.</p>
                                </div>
                                <div className="border rounded-md p-4">
                                    <h4 className="font-semibold flex items-center gap-2">
                                        <Code className="h-4 w-4" />
                                        isAuthenticated
                                    </h4>
                                    <p className="text-sm text-muted-foreground mt-1">Boolean property indicating authentication status.</p>
                                </div>
                           </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                 <TabsContent value="api" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>REST API Endpoints</CardTitle>
                        </CardHeader>
                        <CardContent>
                           <div className="space-y-4">
                                <div className="flex items-center gap-4 border-b pb-4">
                                    <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-bold">GET</span>
                                    <code className="text-sm">/api/v1/users</code>
                                    <span className="text-sm text-muted-foreground">List all users</span>
                                </div>
                                <div className="flex items-center gap-4 border-b pb-4">
                                    <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-bold">POST</span>
                                    <code className="text-sm">/api/v1/users</code>
                                    <span className="text-sm text-muted-foreground">Create a new user</span>
                                </div>
                                <div className="flex items-center gap-4 border-b pb-4">
                                    <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-bold">GET</span>
                                    <code className="text-sm">/api/v1/users/:id</code>
                                    <span className="text-sm text-muted-foreground">Get user details</span>
                                </div>
                                 <div className="flex items-center gap-4 pb-4">
                                    <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded text-xs font-bold">PUT</span>
                                    <code className="text-sm">/api/v1/users/:id</code>
                                    <span className="text-sm text-muted-foreground">Update user profile</span>
                                </div>
                           </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
