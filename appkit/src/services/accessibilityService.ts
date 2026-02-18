// Accessibility service for content management
export class AccessibilityService {
  private static instance: AccessibilityService
  private violations: AccessibilityViolation[] = []
  private guidelines: AccessibilityGuideline[] = []

  private constructor() {
    this.initializeGuidelines()
  }

  public static getInstance(): AccessibilityService {
    if (!AccessibilityService.instance) {
      AccessibilityService.instance = new AccessibilityService()
    }
    return AccessibilityService.instance
  }

  // Initialize WCAG 2.1 guidelines
  private initializeGuidelines(): void {
    this.guidelines = [
      {
        id: 'alt-text',
        level: 'A',
        title: 'Images must have alt text',
        description: 'All images must have descriptive alt text for screen readers',
        check: (content: any) => this.checkAltText(content)
      },
      {
        id: 'heading-structure',
        level: 'A',
        title: 'Proper heading structure',
        description: 'Headings must follow a logical hierarchy (H1 → H2 → H3)',
        check: (content: any) => this.checkHeadingStructure(content)
      },
      {
        id: 'color-contrast',
        level: 'AA',
        title: 'Color contrast ratio',
        description: 'Text must have sufficient contrast against background',
        check: (content: any) => this.checkColorContrast(content)
      },
      {
        id: 'keyboard-navigation',
        level: 'A',
        title: 'Keyboard accessibility',
        description: 'All interactive elements must be keyboard accessible',
        check: (content: any) => this.checkKeyboardNavigation(content)
      },
      {
        id: 'focus-management',
        level: 'A',
        title: 'Focus management',
        description: 'Focus must be visible and logical',
        check: (content: any) => this.checkFocusManagement(content)
      },
      {
        id: 'aria-labels',
        level: 'A',
        title: 'ARIA labels',
        description: 'Interactive elements must have proper ARIA labels',
        check: (content: any) => this.checkAriaLabels(content)
      },
      {
        id: 'link-text',
        level: 'A',
        title: 'Descriptive link text',
        description: 'Links must have descriptive text, not just "click here"',
        check: (content: any) => this.checkLinkText(content)
      },
      {
        id: 'form-labels',
        level: 'A',
        title: 'Form labels',
        description: 'All form inputs must have associated labels',
        check: (content: any) => this.checkFormLabels(content)
      },
      {
        id: 'video-captions',
        level: 'A',
        title: 'Video captions',
        description: 'Videos must have captions or transcripts',
        check: (content: any) => this.checkVideoCaptions(content)
      },
      {
        id: 'audio-transcripts',
        level: 'A',
        title: 'Audio transcripts',
        description: 'Audio content must have transcripts',
        check: (content: any) => this.checkAudioTranscripts(content)
      }
    ]
  }

  // Check content for accessibility violations
  public checkContent(content: any): AccessibilityReport {
    this.violations = []
    
    // Run all accessibility checks
    this.guidelines.forEach(guideline => {
      try {
        const result = guideline.check(content)
        if (!result.passed) {
          this.violations.push({
            guidelineId: guideline.id,
            level: guideline.level,
            title: guideline.title,
            description: guideline.description,
            element: result.element || 'Unknown',
            suggestion: result.suggestion || 'Please review and fix this issue',
            severity: this.getSeverity(guideline.level),
            impact: result.impact || 'medium'
          })
        }
      } catch (error) {
        console.error(`Error checking guideline ${guideline.id}:`, error)
      }
    })

    return {
      score: this.calculateScore(),
      violations: this.violations,
      passed: this.violations.length === 0,
      recommendations: this.generateRecommendations()
    }
  }

  // Individual check methods
  private checkAltText(content: any): AccessibilityCheckResult {
    const images = this.findImages(content)
    const violations: string[] = []

    images.forEach(image => {
      if (!image.alt || image.alt.trim() === '') {
        violations.push(`Image at ${image.src || 'unknown location'} missing alt text`)
      } else if (image.alt.toLowerCase().includes('image') || image.alt.toLowerCase().includes('picture')) {
        violations.push(`Image at ${image.src || 'unknown location'} has non-descriptive alt text`)
      }
    })

    return {
      passed: violations.length === 0,
      element: violations.length > 0 ? violations[0] : undefined,
      suggestion: violations.length > 0 ? 'Add descriptive alt text to all images' : undefined,
      impact: violations.length > 0 ? 'high' : undefined
    }
  }

  private checkHeadingStructure(content: any): AccessibilityCheckResult {
    const headings = this.findHeadings(content)
    const violations: string[] = []
    let lastLevel = 0

    headings.forEach(heading => {
      const level = parseInt(heading.level.replace('h', ''))
      
      if (level > lastLevel + 1) {
        violations.push(`Heading ${heading.level} follows ${lastLevel > 0 ? `H${lastLevel}` : 'no heading'}, skipping levels`)
      }
      
      lastLevel = level
    })

    return {
      passed: violations.length === 0,
      element: violations.length > 0 ? violations[0] : undefined,
      suggestion: violations.length > 0 ? 'Ensure headings follow logical hierarchy (H1 → H2 → H3)' : undefined,
      impact: violations.length > 0 ? 'medium' : undefined
    }
  }

  private checkColorContrast(content: any): AccessibilityCheckResult {
    // This would require more sophisticated color analysis
    // For now, we'll provide a basic check
    const textElements = this.findTextElements(content)
    const violations: string[] = []

    // Basic check for common contrast issues
    textElements.forEach(element => {
      if (element.color && element.backgroundColor) {
        const contrast = this.calculateContrast(element.color, element.backgroundColor)
        if (contrast < 4.5) {
          violations.push(`Text with insufficient contrast ratio: ${contrast.toFixed(2)}`)
        }
      }
    })

    return {
      passed: violations.length === 0,
      element: violations.length > 0 ? violations[0] : undefined,
      suggestion: violations.length > 0 ? 'Ensure text has sufficient contrast (4.5:1 for normal text, 3:1 for large text)' : undefined,
      impact: violations.length > 0 ? 'high' : undefined
    }
  }

  private checkKeyboardNavigation(content: any): AccessibilityCheckResult {
    const interactiveElements = this.findInteractiveElements(content)
    const violations: string[] = []

    interactiveElements.forEach(element => {
      if (!element.tabIndex && element.type !== 'button' && element.type !== 'link') {
        violations.push(`Interactive element missing keyboard accessibility`)
      }
    })

    return {
      passed: violations.length === 0,
      element: violations.length > 0 ? violations[0] : undefined,
      suggestion: violations.length > 0 ? 'Ensure all interactive elements are keyboard accessible' : undefined,
      impact: violations.length > 0 ? 'high' : undefined
    }
  }

  private checkFocusManagement(content: any): AccessibilityCheckResult {
    // This would require more sophisticated focus analysis
    return {
      passed: true,
      element: undefined,
      suggestion: undefined,
      impact: undefined
    }
  }

  private checkAriaLabels(content: any): AccessibilityCheckResult {
    const interactiveElements = this.findInteractiveElements(content)
    const violations: string[] = []

    interactiveElements.forEach(element => {
      if (!element.ariaLabel && !element.ariaLabelledBy && !element.text) {
        violations.push(`Interactive element missing accessible name`)
      }
    })

    return {
      passed: violations.length === 0,
      element: violations.length > 0 ? violations[0] : undefined,
      suggestion: violations.length > 0 ? 'Add ARIA labels or visible text to interactive elements' : undefined,
      impact: violations.length > 0 ? 'high' : undefined
    }
  }

  private checkLinkText(content: any): AccessibilityCheckResult {
    const links = this.findLinks(content)
    const violations: string[] = []

    links.forEach(link => {
      const text = link.text?.toLowerCase() || ''
      if (text.includes('click here') || text.includes('read more') || text.includes('here')) {
        violations.push(`Link with non-descriptive text: "${link.text}"`)
      }
    })

    return {
      passed: violations.length === 0,
      element: violations.length > 0 ? violations[0] : undefined,
      suggestion: violations.length > 0 ? 'Use descriptive link text that explains the destination' : undefined,
      impact: violations.length > 0 ? 'medium' : undefined
    }
  }

  private checkFormLabels(content: any): AccessibilityCheckResult {
    const formElements = this.findFormElements(content)
    const violations: string[] = []

    formElements.forEach(element => {
      if (!element.label && !element.ariaLabel && !element.ariaLabelledBy) {
        violations.push(`Form element missing label`)
      }
    })

    return {
      passed: violations.length === 0,
      element: violations.length > 0 ? violations[0] : undefined,
      suggestion: violations.length > 0 ? 'Add labels to all form elements' : undefined,
      impact: violations.length > 0 ? 'high' : undefined
    }
  }

  private checkVideoCaptions(content: any): AccessibilityCheckResult {
    const videos = this.findVideos(content)
    const violations: string[] = []

    videos.forEach(video => {
      if (!video.captions && !video.transcript) {
        violations.push(`Video missing captions or transcript`)
      }
    })

    return {
      passed: violations.length === 0,
      element: violations.length > 0 ? violations[0] : undefined,
      suggestion: violations.length > 0 ? 'Add captions or transcripts to videos' : undefined,
      impact: violations.length > 0 ? 'high' : undefined
    }
  }

  private checkAudioTranscripts(content: any): AccessibilityCheckResult {
    const audios = this.findAudios(content)
    const violations: string[] = []

    audios.forEach(audio => {
      if (!audio.transcript) {
        violations.push(`Audio missing transcript`)
      }
    })

    return {
      passed: violations.length === 0,
      element: violations.length > 0 ? violations[0] : undefined,
      suggestion: violations.length > 0 ? 'Add transcripts to audio content' : undefined,
      impact: violations.length > 0 ? 'high' : undefined
    }
  }

  // Helper methods to find elements in content
  private findImages(content: any): any[] {
    // This would traverse the content structure to find images
    return []
  }

  private findHeadings(content: any): any[] {
    // This would traverse the content structure to find headings
    return []
  }

  private findTextElements(content: any): any[] {
    // This would traverse the content structure to find text elements
    return []
  }

  private findInteractiveElements(content: any): any[] {
    // This would traverse the content structure to find interactive elements
    return []
  }

  private findLinks(content: any): any[] {
    // This would traverse the content structure to find links
    return []
  }

  private findFormElements(content: any): any[] {
    // This would traverse the content structure to find form elements
    return []
  }

  private findVideos(content: any): any[] {
    // This would traverse the content structure to find videos
    return []
  }

  private findAudios(content: any): any[] {
    // This would traverse the content structure to find audio elements
    return []
  }

  // Utility methods
  private calculateContrast(color1: string, color2: string): number {
    // Simplified contrast calculation
    // In a real implementation, you'd use proper color contrast algorithms
    return 4.5 // Placeholder
  }

  private getSeverity(level: string): 'low' | 'medium' | 'high' {
    switch (level) {
      case 'A':
        return 'high'
      case 'AA':
        return 'medium'
      case 'AAA':
        return 'low'
      default:
        return 'medium'
    }
  }

  private calculateScore(): number {
    if (this.violations.length === 0) return 100
    
    const totalChecks = this.guidelines.length
    const violations = this.violations.length
    return Math.max(0, Math.round(((totalChecks - violations) / totalChecks) * 100))
  }

  private generateRecommendations(): string[] {
    const recommendations: string[] = []
    
    if (this.violations.length === 0) {
      recommendations.push('Great! Your content meets accessibility standards.')
      return recommendations
    }

    const highPriority = this.violations.filter(v => v.severity === 'high')
    const mediumPriority = this.violations.filter(v => v.severity === 'medium')
    const lowPriority = this.violations.filter(v => v.severity === 'low')

    if (highPriority.length > 0) {
      recommendations.push(`Fix ${highPriority.length} high-priority accessibility issues first`)
    }

    if (mediumPriority.length > 0) {
      recommendations.push(`Address ${mediumPriority.length} medium-priority issues for better accessibility`)
    }

    if (lowPriority.length > 0) {
      recommendations.push(`Consider fixing ${lowPriority.length} low-priority issues for optimal accessibility`)
    }

    return recommendations
  }

  // Public methods
  public getGuidelines(): AccessibilityGuideline[] {
    return [...this.guidelines]
  }

  public getViolations(): AccessibilityViolation[] {
    return [...this.violations]
  }

  public clearViolations(): void {
    this.violations = []
  }
}

// Types
interface AccessibilityGuideline {
  id: string
  level: 'A' | 'AA' | 'AAA'
  title: string
  description: string
  check: (content: any) => AccessibilityCheckResult
}

interface AccessibilityCheckResult {
  passed: boolean
  element?: string
  suggestion?: string
  impact?: 'low' | 'medium' | 'high'
}

interface AccessibilityViolation {
  guidelineId: string
  level: string
  title: string
  description: string
  element: string
  suggestion: string
  severity: 'low' | 'medium' | 'high'
  impact: 'low' | 'medium' | 'high'
}

interface AccessibilityReport {
  score: number
  violations: AccessibilityViolation[]
  passed: boolean
  recommendations: string[]
}

// Export singleton instance
export const accessibilityService = AccessibilityService.getInstance()
