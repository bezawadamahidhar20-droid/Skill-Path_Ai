'use client'

import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/dist/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

export function TrustStrip() {
  const containerRef = useRef(null)
  const headingRef = useRef(null)
  const logosRef = useRef<(HTMLDivElement | null)[]>([])

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Heading fade-in
      gsap.fromTo(
        headingRef.current,
        { opacity: 0, y: 20 },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          scrollTrigger: {
            trigger: containerRef.current,
            start: 'top 85%',
            toggleActions: 'play none none none'
          }
        }
      )

      // Stagger logos with grayscale hover
      logosRef.current.forEach((logo, idx) => {
        gsap.fromTo(
          logo,
          { opacity: 0, scale: 0.9 },
          {
            opacity: 1,
            scale: 1,
            duration: 0.5,
            delay: idx * 0.05,
            scrollTrigger: {
              trigger: containerRef.current,
              start: 'top 85%',
              toggleActions: 'play none none none'
            }
          }
        )
      })
    })

    return () => ctx.revert()
  }, [])

  const companies = [
    'TCS',
    'Infosys',
    'Accenture',
    'Capgemini',
    'Cognizant',
    'Deloitte',
    'Wipro',
    'LTI Mindtree'
  ]

  return (
    <section ref={containerRef} className="w-full bg-white py-12 border-t border-gray-100">
      <div className="max-w-7xl mx-auto px-4">
        {/* Heading Section */}
        <div ref={headingRef} className="text-center mb-10">
          <h2 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-2">
            Trusted by top recruiters and placement teams
          </h2>
          <p className="text-sm text-gray-600 max-w-2xl mx-auto">
            Built for students preparing for Tier-1 and Tier-2 companies.
          </p>
        </div>

        {/* Logo Strip - Horizontal Scroll on Mobile, Row on Desktop */}
        <div className="overflow-x-auto md:overflow-visible">
          <div className="flex items-center justify-center md:justify-center gap-6 md:gap-8 min-w-max md:min-w-0 px-4 md:px-0">
            {companies.map((company, idx) => (
              <div
                key={idx}
                ref={(el) => {
                  if (el) logosRef.current[idx] = el
                }}
                className="flex-shrink-0 h-16 flex items-center justify-center group transition-all duration-300"
              >
                <div className="text-center">
                  <p className="text-sm font-semibold text-gray-500 group-hover:text-blue-600 transition-colors duration-300 whitespace-nowrap">
                    {company}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
