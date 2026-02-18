'use client'

import React from 'react'
import Link from 'next/link'
import { 
  ArrowRight, 
  BookOpen, 
  Code2, 
  Terminal, 
  ShieldCheck, 
  Zap, 
  Globe,
  Smartphone,
  Server
} from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { Card, CardContent } from '../../components/ui/Card'

export default function DevHubHome() {
  return (
    <div className="space-y-12">
      {/* Hero Section */}
      <section className="space-y-6">
        <div className="space-y-4">
          <Badge className="bg-blue-50 text-blue-600 border-blue-100 px-3 py-1 rounded-full font-bold text-xs uppercase tracking-wider">
            Developer Hub
          </Badge>
          <h1 className="text-4xl sm:text-5xl font-black text-slate-900 dark:text-white tracking-tight leading-[1.1]">
            Build Secure <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">Integrations</span> Faster.
          </h1>
          <p className="text-lg text-slate-500 dark:text-slate-400 leading-relaxed max-w-2xl">
            Everything you need to integrate AppKit's identity gateway into your applications. From quickstarts to advanced SDK references.
          </p>
        </div>
        
        <div className="flex flex-wrap gap-4">
          <Button size="lg" className="rounded-full px-8 bg-blue-600 hover:bg-blue-700 font-bold shadow-lg shadow-blue-500/25">
            <Link href="/dev-hub/quick-start" className="flex items-center gap-2 text-white">
              Start Building <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
          <Button variant="outline" size="lg" className="rounded-full px-8 font-bold border-slate-200">
            <Link href="/identity/oauth-clients">Manage Clients</Link>
          </Button>
        </div>
      </section>

      {/* Feature Grid */}
      <section id="overview" className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-12">
        <div className="group p-8 rounded-3xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
          <div className="h-12 w-12 rounded-2xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600 mb-6 group-hover:scale-110 transition-transform">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <h3 className="text-xl font-bold mb-3">Login & Auth</h3>
          <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed mb-6">
            Implement secure authentication with OAuth 2.0 and OIDC. Supports Social, SSO, and MFA natively.
          </p>
          <Link href="/dev-hub/modules/login" className="text-blue-600 font-bold text-sm inline-flex items-center gap-2 hover:gap-3 transition-all">
            Explore Login <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        <div className="group p-8 rounded-3xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
          <div className="h-12 w-12 rounded-2xl bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center text-purple-600 mb-6 group-hover:scale-110 transition-transform">
            <Code2 className="h-6 w-6" />
          </div>
          <h3 className="text-xl font-bold mb-3">Identity SDKs</h3>
          <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed mb-6">
            Official libraries for React, Next.js, and Node.js. Abstract away the complexity of JWT validation.
          </p>
          <Link href="/dev-hub/installation" className="text-purple-600 font-bold text-sm inline-flex items-center gap-2 hover:gap-3 transition-all">
            View SDKs <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      </section>

      {/* Integration Methods */}
      <section id="key-features" className="pt-12 space-y-8">
        <div className="space-y-2">
          <h2 className="text-2xl font-bold">Integration Methods</h2>
          <p className="text-slate-500">Choose the best path for your application architecture.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-2xl border border-slate-100 bg-slate-50/50 dark:bg-slate-900 hover:bg-white dark:hover:bg-slate-800 transition-colors">
            <Globe className="h-5 w-5 text-blue-500 mb-4" />
            <h4 className="font-bold mb-2">Web Apps</h4>
            <p className="text-xs text-slate-500 leading-relaxed">Server-side logic with Secure Cookie sessions.</p>
          </div>
          <div className="p-6 rounded-2xl border border-slate-100 bg-slate-50/50 dark:bg-slate-900 hover:bg-white dark:hover:bg-slate-800 transition-colors">
            <Zap className="h-5 w-5 text-amber-500 mb-4" />
            <h4 className="font-bold mb-2">Modern SPAs</h4>
            <p className="text-xs text-slate-500 leading-relaxed">Fast, token-based auth with PKCE protection.</p>
          </div>
          <div className="p-6 rounded-2xl border border-slate-100 bg-slate-50/50 dark:bg-slate-900 hover:bg-white dark:hover:bg-slate-800 transition-colors">
            <Smartphone className="h-5 w-5 text-green-500 mb-4" />
            <h4 className="font-bold mb-2">Native Mobile</h4>
            <p className="text-xs text-slate-500 leading-relaxed">Direct system browser integration for iOS & Android.</p>
          </div>
        </div>
      </section>

      {/* Footer Meta */}
      <section id="next-steps" className="pt-12 border-t border-slate-100 dark:border-slate-800 flex flex-wrap gap-8 justify-between items-center pb-24">
        <div className="flex gap-4 items-center">
            <div className="flex -space-x-2">
                {[1,2,3].map(i => (
                    <div key={i} className="h-8 w-8 rounded-full border-2 border-white bg-slate-200" />
                ))}
            </div>
            <p className="text-sm text-slate-500">Joined by <span className="font-bold text-slate-900">500+</span> developers this week.</p>
        </div>
        <div className="flex gap-6">
            <Link href="#" className="text-sm text-slate-400 hover:text-slate-900 transition-colors font-medium">GitHub</Link>
            <Link href="#" className="text-sm text-slate-400 hover:text-slate-900 transition-colors font-medium">Twitter</Link>
            <Link href="#" className="text-sm text-slate-400 hover:text-slate-900 transition-colors font-medium">Discord</Link>
        </div>
      </section>
    </div>
  )
}
