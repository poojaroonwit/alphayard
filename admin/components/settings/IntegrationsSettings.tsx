'use client'

import { useEffect, useState } from 'react'
import { settingsService, type IntegrationsSettings as IntegrationsSettingsType } from '../../services/settingsService'
import { Card, CardBody, CardHeader } from '../ui/Card'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { Select } from '../ui/Select'
import { LoadingSpinner } from '../ui/LoadingSpinner'

interface IntegrationsSettingsProps {
  activeSub?:
    | 'integrations'
    | 'auth'
    | 'endpoints'
    | 'monitoring'
    | 'push'
    | 'storage'
    | 'analytics'
    | 'payments'
    | 'smtp'
    | 'localization'
    | 'security'
}

export function IntegrationsSettings({ activeSub }: IntegrationsSettingsProps) {
  const [values, setValues] = useState<IntegrationsSettingsType>({
    mobileGA: { measurementId: '' },
    smtpMobile: { host: '', port: 587, user: '', pass: '', from: '' },
    smtpAdmin: { host: '', port: 587, user: '', pass: '', from: '' },
    ssoMobile: { provider: 'none', clientId: '', clientSecret: '', issuerUrl: '' },
    ssoAdmin: { provider: 'none', clientId: '', clientSecret: '', issuerUrl: '' },
    push: { fcmServerKey: '', apnsKeyId: '', apnsTeamId: '', apnsKeyP8: '', apnsTopic: '' },
    deepLinks: { iosAssociatedDomains: [], androidAppLinks: [], urlSchemes: [], adminRedirectUris: [] },
    monitoring: { sentryDsn: '', environment: '', tracesSampleRate: 1, profilesSampleRate: 1 },
    featureFlags: {},
    endpoints: { apiBaseUrl: '', websocketUrl: '', cdnBaseUrl: '' },
    auth: { jwtTtlMinutes: 60, refreshTtlDays: 30, allowedProviders: [], redirectUris: [] },
    security: { recaptchaSiteKey: '', recaptchaSecret: '', rateLimitRps: 100, corsOrigins: [], cspConnectSrc: [] },
    storage: { bucket: '', region: '', accessKeyId: '', secretAccessKey: '', cdnBaseUrl: '', maxUploadMb: 25 },
    webAnalytics: { gaMeasurementId: '', consentMode: 'basic' },
    branding: { logoUrl: '', faviconUrl: '', primaryColor: '#FA7272', termsUrl: '', privacyUrl: '', supportEmail: '' },
    localization: { defaultLocale: 'en', availableLocales: ['en'], fallbackBehavior: 'default' },
    payments: { stripePublishableKey: '', stripeSecretKey: '', webhookSigningSecret: '' }
  })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    const load = async () => {
      const existing = await settingsService.getIntegrations()
      if (existing) setValues(existing)
    }
    load()
  }, [])

  const update = (path: string, val: any) => {
    setValues(prev => {
      const clone: any = { ...prev }
      const parts = path.split('.')
      let ref: any = clone
      for (let i = 0; i < parts.length - 1; i++) ref = ref[parts[i]]
      ref[parts[parts.length - 1]] = val
      return clone
    })
  }

  const updateArray = (path: string, list: string) => {
    const arr = list
      .split('\n')
      .map(s => s.trim())
      .filter(Boolean)
    update(path, arr)
  }

  const onSave = async () => {
    setSaving(true)
    setSaved(false)
    try {
      await settingsService.saveIntegrations(values)
      setSaved(true)
    } finally {
      setSaving(false)
      setTimeout(() => setSaved(false), 2500)
    }
  }

  const show = (key: string) => !activeSub || activeSub === key

  return (
    <div className="space-y-6">
      {show('analytics') && (
        <Card variant="frosted">
          <CardHeader>
            <h3 className="text-base font-semibold text-gray-900">Mobile App Analytics (GA4)</h3>
          </CardHeader>
          <CardBody>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Measurement ID"
                placeholder="G-XXXXXXXXXX"
                value={values.mobileGA.measurementId}
                onChange={e => update('mobileGA.measurementId', e.target.value)}
              />
            </div>
          </CardBody>
        </Card>
      )}

      {show('push') && (
        <Card variant="frosted">
          <CardHeader>
            <h3 className="text-base font-semibold text-gray-900">Push Notifications</h3>
          </CardHeader>
          <CardBody>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <Input
                  label="FCM Server Key"
                  value={values.push?.fcmServerKey || ''}
                  onChange={e => update('push.fcmServerKey', e.target.value)}
                />
              </div>
              <Input
                label="APNs Key ID"
                value={values.push?.apnsKeyId || ''}
                onChange={e => update('push.apnsKeyId', e.target.value)}
              />
              <Input
                label="APNs Team ID"
                value={values.push?.apnsTeamId || ''}
                onChange={e => update('push.apnsTeamId', e.target.value)}
              />
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">APNs .p8 Key (paste)</label>
                <textarea
                  rows={4}
                  className="macos-input w-full"
                  value={values.push?.apnsKeyP8 || ''}
                  onChange={e => update('push.apnsKeyP8', e.target.value)}
                />
              </div>
              <div className="md:col-span-2">
                <Input
                  label="APNs Topic (Bundle ID)"
                  value={values.push?.apnsTopic || ''}
                  onChange={e => update('push.apnsTopic', e.target.value)}
                />
              </div>
            </div>
          </CardBody>
        </Card>
      )}

      {show('smtp') && (
        <>
          <Card variant="frosted">
            <CardHeader>
              <h3 className="text-base font-semibold text-gray-900">SMTP - Mobile Application</h3>
            </CardHeader>
            <CardBody>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input label="Host" value={values.smtpMobile.host} onChange={e => update('smtpMobile.host', e.target.value)} />
                <Input label="Port" type="number" value={values.smtpMobile.port} onChange={e => update('smtpMobile.port', Number(e.target.value))} />
                <Input label="User" value={values.smtpMobile.user} onChange={e => update('smtpMobile.user', e.target.value)} />
                <Input label="Password" type="password" value={values.smtpMobile.pass} onChange={e => update('smtpMobile.pass', e.target.value)} />
                <div className="md:col-span-2">
                  <Input label="From Email" value={values.smtpMobile.from} onChange={e => update('smtpMobile.from', e.target.value)} />
                </div>
              </div>
            </CardBody>
          </Card>
          <Card variant="frosted">
            <CardHeader>
              <h3 className="text-base font-semibold text-gray-900">SMTP - Admin Console</h3>
            </CardHeader>
            <CardBody>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input label="Host" value={values.smtpAdmin.host} onChange={e => update('smtpAdmin.host', e.target.value)} />
                <Input label="Port" type="number" value={values.smtpAdmin.port} onChange={e => update('smtpAdmin.port', Number(e.target.value))} />
                <Input label="User" value={values.smtpAdmin.user} onChange={e => update('smtpAdmin.user', e.target.value)} />
                <Input label="Password" type="password" value={values.smtpAdmin.pass} onChange={e => update('smtpAdmin.pass', e.target.value)} />
                <div className="md:col-span-2">
                  <Input label="From Email" value={values.smtpAdmin.from} onChange={e => update('smtpAdmin.from', e.target.value)} />
                </div>
              </div>
            </CardBody>
          </Card>
        </>
      )}

      {show('auth') && (
        <>
          <Card variant="frosted">
            <CardHeader>
              <h3 className="text-base font-semibold text-gray-900">SSO - Mobile Application</h3>
            </CardHeader>
            <CardBody>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Select
                  label="Provider"
                  value={values.ssoMobile.provider}
                  onChange={e => update('ssoMobile.provider', e.target.value)}
                  options={[
                    { value: 'none', label: 'None' },
                    { value: 'google', label: 'Google' },
                    { value: 'auth0', label: 'Auth0' },
                    { value: 'oidc', label: 'OIDC' }
                  ]}
                />
                <Input label="Issuer URL" value={values.ssoMobile.issuerUrl} onChange={e => update('ssoMobile.issuerUrl', e.target.value)} />
                <Input label="Client ID" value={values.ssoMobile.clientId} onChange={e => update('ssoMobile.clientId', e.target.value)} />
                <Input label="Client Secret" type="password" value={values.ssoMobile.clientSecret} onChange={e => update('ssoMobile.clientSecret', e.target.value)} />
              </div>
            </CardBody>
          </Card>
          <Card variant="frosted">
            <CardHeader>
              <h3 className="text-base font-semibold text-gray-900">SSO - Admin Console</h3>
            </CardHeader>
            <CardBody>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Select
                  label="Provider"
                  value={values.ssoAdmin.provider}
                  onChange={e => update('ssoAdmin.provider', e.target.value)}
                  options={[
                    { value: 'none', label: 'None' },
                    { value: 'google', label: 'Google' },
                    { value: 'auth0', label: 'Auth0' },
                    { value: 'oidc', label: 'OIDC' }
                  ]}
                />
                <Input label="Issuer URL" value={values.ssoAdmin.issuerUrl} onChange={e => update('ssoAdmin.issuerUrl', e.target.value)} />
                <Input label="Client ID" value={values.ssoAdmin.clientId} onChange={e => update('ssoAdmin.clientId', e.target.value)} />
                <Input label="Client Secret" type="password" value={values.ssoAdmin.clientSecret} onChange={e => update('ssoAdmin.clientSecret', e.target.value)} />
              </div>
            </CardBody>
          </Card>
        </>
      )}

      {show('endpoints') && (
        <>
          <Card variant="frosted">
            <CardHeader>
              <h3 className="text-base font-semibold text-gray-900">Deep Links & App Links</h3>
            </CardHeader>
            <CardBody>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">iOS Associated Domains (one per line)</label>
                  <textarea rows={4} className="macos-input w-full" value={(values.deepLinks?.iosAssociatedDomains || []).join('\n')} onChange={e => updateArray('deepLinks.iosAssociatedDomains', e.target.value)} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Android App Links (one per line)</label>
                  <textarea rows={4} className="macos-input w-full" value={(values.deepLinks?.androidAppLinks || []).join('\n')} onChange={e => updateArray('deepLinks.androidAppLinks', e.target.value)} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">URL Schemes (one per line)</label>
                  <textarea rows={4} className="macos-input w-full" value={(values.deepLinks?.urlSchemes || []).join('\n')} onChange={e => updateArray('deepLinks.urlSchemes', e.target.value)} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Admin Redirect URIs (one per line)</label>
                  <textarea rows={4} className="macos-input w-full" value={(values.deepLinks?.adminRedirectUris || []).join('\n')} onChange={e => updateArray('deepLinks.adminRedirectUris', e.target.value)} />
                </div>
              </div>
            </CardBody>
          </Card>
          <Card variant="frosted">
            <CardHeader>
              <h3 className="text-base font-semibold text-gray-900">Environment Endpoints</h3>
            </CardHeader>
            <CardBody>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input label="API Base URL" value={values.endpoints?.apiBaseUrl || ''} onChange={e => update('endpoints.apiBaseUrl', e.target.value)} />
                <Input label="WebSocket URL" value={values.endpoints?.websocketUrl || ''} onChange={e => update('endpoints.websocketUrl', e.target.value)} />
                <div className="md:col-span-2">
                  <Input label="CDN Base URL" value={values.endpoints?.cdnBaseUrl || ''} onChange={e => update('endpoints.cdnBaseUrl', e.target.value)} />
                </div>
              </div>
            </CardBody>
          </Card>
        </>
      )}

      {show('monitoring') && (
        <Card variant="frosted">
          <CardHeader>
            <h3 className="text-base font-semibold text-gray-900">Error Monitoring</h3>
          </CardHeader>
          <CardBody>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input label="Sentry DSN" value={values.monitoring?.sentryDsn || ''} onChange={e => update('monitoring.sentryDsn', e.target.value)} />
              <Input label="Environment" value={values.monitoring?.environment || ''} onChange={e => update('monitoring.environment', e.target.value)} />
              <Input label="Traces Sample Rate" type="number" step="0.01" value={values.monitoring?.tracesSampleRate ?? 1} onChange={e => update('monitoring.tracesSampleRate', Number(e.target.value))} />
              <Input label="Profiles Sample Rate" type="number" step="0.01" value={values.monitoring?.profilesSampleRate ?? 1} onChange={e => update('monitoring.profilesSampleRate', Number(e.target.value))} />
            </div>
          </CardBody>
        </Card>
      )}

      {show('auth') && (
        <Card variant="frosted">
          <CardHeader>
            <h3 className="text-base font-semibold text-gray-900">Authentication Defaults</h3>
          </CardHeader>
          <CardBody>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input label="JWT TTL (minutes)" type="number" value={values.auth?.jwtTtlMinutes ?? 60} onChange={e => update('auth.jwtTtlMinutes', Number(e.target.value))} />
              <Input label="Refresh TTL (days)" type="number" value={values.auth?.refreshTtlDays ?? 30} onChange={e => update('auth.refreshTtlDays', Number(e.target.value))} />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Allowed Providers (one per line)</label>
                <textarea rows={3} className="macos-input w-full" value={(values.auth?.allowedProviders || []).join('\n')} onChange={e => updateArray('auth.allowedProviders', e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Redirect URIs (one per line)</label>
                <textarea rows={3} className="macos-input w-full" value={(values.auth?.redirectUris || []).join('\n')} onChange={e => updateArray('auth.redirectUris', e.target.value)} />
              </div>
            </div>
          </CardBody>
        </Card>
      )}

      {show('security') && (
        <Card variant="frosted">
          <CardHeader>
            <h3 className="text-base font-semibold text-gray-900">Security</h3>
          </CardHeader>
          <CardBody>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input label="reCAPTCHA Site Key" value={values.security?.recaptchaSiteKey || ''} onChange={e => update('security.recaptchaSiteKey', e.target.value)} />
              <Input label="reCAPTCHA Secret" value={values.security?.recaptchaSecret || ''} onChange={e => update('security.recaptchaSecret', e.target.value)} />
              <Input label="Rate Limit (req/sec)" type="number" value={values.security?.rateLimitRps ?? 100} onChange={e => update('security.rateLimitRps', Number(e.target.value))} />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">CORS Origins (one per line)</label>
                <textarea rows={3} className="macos-input w-full" value={(values.security?.corsOrigins || []).join('\n')} onChange={e => updateArray('security.corsOrigins', e.target.value)} />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">CSP connect-src (one per line)</label>
                <textarea rows={3} className="macos-input w-full" value={(values.security?.cspConnectSrc || []).join('\n')} onChange={e => updateArray('security.cspConnectSrc', e.target.value)} />
              </div>
            </div>
          </CardBody>
        </Card>
      )}

      {show('storage') && (
        <Card variant="frosted">
          <CardHeader>
            <h3 className="text-base font-semibold text-gray-900">Storage / CDN</h3>
          </CardHeader>
          <CardBody>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input label="Bucket" value={values.storage?.bucket || ''} onChange={e => update('storage.bucket', e.target.value)} />
              <Input label="Region" value={values.storage?.region || ''} onChange={e => update('storage.region', e.target.value)} />
              <Input label="Access Key ID" value={values.storage?.accessKeyId || ''} onChange={e => update('storage.accessKeyId', e.target.value)} />
              <Input label="Secret Access Key" type="password" value={values.storage?.secretAccessKey || ''} onChange={e => update('storage.secretAccessKey', e.target.value)} />
              <Input label="CDN Base URL" value={values.storage?.cdnBaseUrl || ''} onChange={e => update('storage.cdnBaseUrl', e.target.value)} />
              <Input label="Max Upload (MB)" type="number" value={values.storage?.maxUploadMb ?? 25} onChange={e => update('storage.maxUploadMb', Number(e.target.value))} />
            </div>
          </CardBody>
        </Card>
      )}

      {show('analytics') && (
        <Card variant="frosted">
          <CardHeader>
            <h3 className="text-base font-semibold text-gray-900">Web Analytics (Admin)</h3>
          </CardHeader>
          <CardBody>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input label="GA4 Measurement ID" value={values.webAnalytics?.gaMeasurementId || ''} onChange={e => update('webAnalytics.gaMeasurementId', e.target.value)} />
              <Select
                label="Consent Mode"
                value={values.webAnalytics?.consentMode || 'basic'}
                onChange={e => update('webAnalytics.consentMode', e.target.value)}
                options={[
                  { value: 'auto', label: 'Auto' },
                  { value: 'basic', label: 'Basic' },
                  { value: 'disabled', label: 'Disabled' }
                ]}
              />
            </div>
          </CardBody>
        </Card>
      )}

      {show('integrations') && (
        <Card variant="frosted">
          <CardHeader>
            <h3 className="text-base font-semibold text-gray-900">Branding & Legal</h3>
          </CardHeader>
          <CardBody>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input label="Logo URL" value={values.branding?.logoUrl || ''} onChange={e => update('branding.logoUrl', e.target.value)} />
              <Input label="Favicon URL" value={values.branding?.faviconUrl || ''} onChange={e => update('branding.faviconUrl', e.target.value)} />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Primary Color</label>
                <input type="color" className="macos-input w-full h-10" value={values.branding?.primaryColor || '#FA7272'} onChange={e => update('branding.primaryColor', e.target.value)} />
              </div>
              <Input label="Terms URL" value={values.branding?.termsUrl || ''} onChange={e => update('branding.termsUrl', e.target.value)} />
              <Input label="Privacy URL" value={values.branding?.privacyUrl || ''} onChange={e => update('branding.privacyUrl', e.target.value)} />
              <Input label="Support Email" value={values.branding?.supportEmail || ''} onChange={e => update('branding.supportEmail', e.target.value)} />
            </div>
          </CardBody>
        </Card>
      )}

      {show('localization') && (
        <Card variant="frosted">
          <CardHeader>
            <h3 className="text-base font-semibold text-gray-900">Localization</h3>
          </CardHeader>
          <CardBody>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input label="Default Locale" value={values.localization?.defaultLocale || 'en'} onChange={e => update('localization.defaultLocale', e.target.value)} />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Available Locales (one per line)</label>
                <textarea rows={3} className="macos-input w-full" value={(values.localization?.availableLocales || []).join('\n')} onChange={e => updateArray('localization.availableLocales', e.target.value)} />
              </div>
              <div className="md:col-span-2">
                <Select
                  label="Fallback Behavior"
                  value={values.localization?.fallbackBehavior || 'default'}
                  onChange={e => update('localization.fallbackBehavior', e.target.value)}
                  options={[
                    { value: 'default', label: 'Default' },
                    { value: 'nearest', label: 'Nearest' }
                  ]}
                />
              </div>
            </div>
          </CardBody>
        </Card>
      )}

      {show('payments') && (
        <Card variant="frosted">
          <CardHeader>
            <h3 className="text-base font-semibold text-gray-900">Payments (Stripe)</h3>
          </CardHeader>
          <CardBody>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input label="Publishable Key" value={values.payments?.stripePublishableKey || ''} onChange={e => update('payments.stripePublishableKey', e.target.value)} />
              <Input label="Secret Key" value={values.payments?.stripeSecretKey || ''} onChange={e => update('payments.stripeSecretKey', e.target.value)} />
              <div className="md:col-span-2">
                <Input label="Webhook Signing Secret" value={values.payments?.webhookSigningSecret || ''} onChange={e => update('payments.webhookSigningSecret', e.target.value)} />
              </div>
            </div>
          </CardBody>
        </Card>
      )}

      <Card variant="frosted">
        <CardBody>
          <div className="flex items-center gap-3">
            <Button variant="primary" onClick={onSave} disabled={saving}>
              {saving ? (
                <>
                  <LoadingSpinner size="sm" className="mr-2" />
                  Saving...
                </>
              ) : (
                'Save Integrations'
              )}
            </Button>
            {saved && <span className="text-green-600 text-sm font-medium">Saved!</span>}
          </div>
        </CardBody>
      </Card>
    </div>
  )
}

export default IntegrationsSettings


