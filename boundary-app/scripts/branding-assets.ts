import fs from 'fs'
import path from 'path'
import http from 'http'
import https from 'https'

const API_BASE = process.env.EXPO_PUBLIC_API_URL || process.env.API_BASE_URL || 'http://localhost:3000/api'
const PROJECT_ROOT = path.resolve(__dirname, '..')

function getProtocol(url: string): typeof http | typeof https {
	return url.startsWith('https') ? https : http
}

async function fetchBranding(): Promise<{ logoUrl?: string; iconUrl?: string; mobileAppName?: string }> {
	const url = API_BASE.replace(/\/api$/i, '') + '/api/mobile/branding'
	const protocol = getProtocol(url)
	return new Promise((resolve, reject) => {
		protocol.get(url, (res) => {
			let data = ''
			res.on('data', (chunk) => (data += chunk))
			res.on('end', () => {
				try {
					const json = JSON.parse(data)
					resolve(json?.branding || {})
				} catch (e) {
					resolve({})
				}
			})
		}).on('error', reject)
	})
}

async function download(url: string, dest: string): Promise<void> {
	return new Promise((resolve, reject) => {
		const file = fs.createWriteStream(dest)
		const protocol = getProtocol(url)
		
		const handleResponse = (response: any) => {
			if (response.statusCode && response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
				// Handle redirects
				download(response.headers.location, dest).then(resolve).catch(reject)
				return
			}
			response.pipe(file)
			file.on('finish', () => file.close(() => resolve()))
		}
		
		const request = protocol.get(url, handleResponse)
		request.on('error', reject)
	})
}

async function run() {
	const branding = await fetchBranding()
	const assetsDir = path.join(PROJECT_ROOT, 'assets', 'branding')
	if (!fs.existsSync(assetsDir)) fs.mkdirSync(assetsDir, { recursive: true })

	let iconPath: string | undefined
	let splashPath: string | undefined

	if (branding.iconUrl) {
		const dest = path.join(assetsDir, 'icon.png')
		await download(branding.iconUrl, dest).catch(() => {})
		if (fs.existsSync(dest)) iconPath = './assets/branding/icon.png'
	}

	if (branding.logoUrl) {
		const dest = path.join(assetsDir, 'splash.png')
		await download(branding.logoUrl, dest).catch(() => {})
		if (fs.existsSync(dest)) splashPath = './assets/branding/splash.png'
	}

	const appJsonPath = path.join(PROJECT_ROOT, 'app.json')
	const raw = fs.readFileSync(appJsonPath, 'utf8')
	const app = JSON.parse(raw)

	if (branding.mobileAppName) {
		app.expo.name = branding.mobileAppName
	}
	// Update or clean up icon configuration
	if (iconPath) {
		// Only set if the downloaded file actually exists
		const absoluteIconPath = path.join(PROJECT_ROOT, iconPath.replace(/^\.\//, ''))
		if (fs.existsSync(absoluteIconPath)) {
			app.expo.icon = iconPath
			app.expo.android = app.expo.android || {}
			app.expo.android.adaptiveIcon = app.expo.android.adaptiveIcon || {}
			app.expo.android.adaptiveIcon.foregroundImage = iconPath
		}
	} else {
		// No icon from branding – remove stale icon paths that point to missing files
		if (typeof app.expo.icon === 'string') {
			const existingIconPath = path.join(PROJECT_ROOT, app.expo.icon.replace(/^\.\//, ''))
			if (!fs.existsSync(existingIconPath)) {
				delete app.expo.icon
			}
		}
		if (app.expo.android?.adaptiveIcon?.foregroundImage) {
			const fg = app.expo.android.adaptiveIcon.foregroundImage
			if (typeof fg === 'string') {
				const existingFgPath = path.join(PROJECT_ROOT, fg.replace(/^\.\//, ''))
				if (!fs.existsSync(existingFgPath)) {
					delete app.expo.android.adaptiveIcon.foregroundImage
				}
			}
		}
	}

	// Update or clean up splash configuration
	if (splashPath) {
		const absoluteSplashPath = path.join(PROJECT_ROOT, splashPath.replace(/^\.\//, ''))
		if (fs.existsSync(absoluteSplashPath)) {
			app.expo.splash = app.expo.splash || {}
			app.expo.splash.image = splashPath
			app.expo.splash.resizeMode = app.expo.splash.resizeMode || 'contain'
			app.expo.splash.backgroundColor = app.expo.splash.backgroundColor || '#ffffff'
		}
	} else if (app.expo.splash?.image) {
		const existingSplashPath = path.join(PROJECT_ROOT, app.expo.splash.image.replace(/^\.\//, ''))
		if (!fs.existsSync(existingSplashPath)) {
			delete app.expo.splash.image
		}
	}

	fs.writeFileSync(appJsonPath, JSON.stringify(app, null, 2))
	console.log('Branding assets applied to app.json')
}

run().catch((e) => {
	console.error('Branding assets script failed:', e)
	process.exit(1)
})
