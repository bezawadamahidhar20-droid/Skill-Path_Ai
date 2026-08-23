'use client'

import { useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import Image from 'next/image'
import Link from 'next/link'
import gsap from 'gsap'

export function HeroSection() {
  const badgeRef = useRef<HTMLDivElement>(null)
  const titleRef = useRef<HTMLDivElement>(null)
  const subtitleRef = useRef<HTMLParagraphElement>(null)
  const featuresRef = useRef<HTMLDivElement>(null)
  const ctaRef = useRef<HTMLDivElement>(null)
  const imageRef = useRef<HTMLDivElement>(null)
  const dotsRef = useRef<HTMLDivElement[]>([])

  useEffect(() => {
    // Text stagger animation on mount
    gsap.fromTo(
      badgeRef.current,
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, duration: 0.6, ease: 'power2.out' }
    )

    gsap.fromTo(
      titleRef.current,
      { opacity: 0, y: 30 },
      { opacity: 1, y: 0, duration: 0.8, delay: 0.1, ease: 'power2.out' }
    )

    gsap.fromTo(
      subtitleRef.current,
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, duration: 0.7, delay: 0.2, ease: 'power2.out' }
    )

    if (featuresRef.current) {
      gsap.fromTo(
        featuresRef.current.querySelectorAll('.feature-row'),
        { opacity: 0, x: -20 },
        { opacity: 1, x: 0, duration: 0.6, stagger: 0.1, delay: 0.3, ease: 'power2.out' }
      )
    }

    gsap.fromTo(
      ctaRef.current,
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, duration: 0.6, delay: 0.5, ease: 'power2.out' }
    )

    // Image entrance with slight tilt on hover
    gsap.fromTo(
      imageRef.current,
      { opacity: 0, scale: 0.9, y: 30 },
      { opacity: 1, scale: 1, y: 0, duration: 0.8, delay: 0.2, ease: 'back.out(1.2)' }
    )



    // Floating dots animation
    dotsRef.current.forEach((dot) => {
      const randomX = gsap.utils.random(-30, 30)
      const randomY = gsap.utils.random(-30, 30)
      const randomDuration = gsap.utils.random(6, 10)

      gsap.to(dot, {
        x: randomX,
        y: randomY,
        duration: randomDuration,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut'
      })
    })
  }, [])

  const features = [
    {
      title: 'PRS Score Engine',
      description: '0–100 real-time readiness scoring',
      icon: (
        <svg className="w-6 h-6 text-blue-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm0-13c-2.76 0-5 2.24-5 5s2.24 5 5 5 5-2.24 5-5-2.24-5-5-5z" />
        </svg>
      )
    },
    {
      title: 'GitHub + LinkedIn Intelligence',
      description: 'Live profile analysis powered by APIs',
      icon: (
        <svg className="w-6 h-6 text-blue-600" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.9 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v-3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
        </svg>
      )
    },
    {
      title: 'Company Lens Eligibility',
      description: 'Match your profile with real company criteria',
      icon: (
        <svg className="w-6 h-6 text-blue-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
          <path d="M17 21v-8H7v8M7 3v5h8" />
        </svg>
      )
    }
  ]

  return (
    <section id="home" className="relative w-full bg-gradient-to-br from-white via-blue-50 to-indigo-50 overflow-hidden">
      {/* Premium Background */}
      <div className="absolute inset-0 -z-20 overflow-hidden">
        {/* Gradient blobs */}
        <div className="absolute -top-40 right-0 w-96 h-96 bg-gradient-to-br from-blue-200 to-cyan-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
        <div className="absolute top-1/2 -left-40 w-80 h-80 bg-gradient-to-tr from-purple-200 to-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-15 animate-pulse" style={{ animationDelay: '2s' }}></div>
        <div className="absolute bottom-0 right-1/3 w-96 h-96 bg-gradient-to-tl from-indigo-200 to-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-15"></div>

        {/* Grid texture */}
        <div
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage:
              'linear-gradient(0deg, transparent 24%, rgba(59, 130, 246, 0.3) 25%, rgba(59, 130, 246, 0.3) 26%, transparent 27%, transparent 74%, rgba(59, 130, 246, 0.3) 75%, rgba(59, 130, 246, 0.3) 76%, transparent 77%, transparent), linear-gradient(90deg, transparent 24%, rgba(59, 130, 246, 0.3) 25%, rgba(59, 130, 246, 0.3) 26%, transparent 27%, transparent 74%, rgba(59, 130, 246, 0.3) 75%, rgba(59, 130, 246, 0.3) 76%, transparent 77%, transparent)',
            backgroundSize: '50px 50px'
          }}
        ></div>

        {/* Floating dots */}
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            ref={(el) => {
              if (el) dotsRef.current[i] = el
            }}
            className="absolute w-2 h-2 bg-blue-400 rounded-full opacity-20"
            style={{
              left: `${20 + i * 15}%`,
              top: `${30 + (i % 2) * 40}%`
            }}
          ></div>
        ))}
      </div>

      <div className="max-w-7xl mx-auto px-4 py-20 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* LEFT SIDE - PREMIUM TEXT & CTA */}
          <div className="space-y-8">
            {/* Badge with glow */}
            <div
              ref={badgeRef}
              className="inline-block bg-blue-100 text-blue-700 px-4 py-2 rounded-full text-sm font-semibold relative"
              style={{
                boxShadow: '0 0 20px rgba(59, 130, 246, 0.3)'
              }}
            >
              AI-POWERED PLACEMENT INTELLIGENCE
            </div>

            {/* Main Title - Premium Typography */}
            <div ref={titleRef}>
              <h1 className="text-5xl lg:text-7xl font-black text-gray-900 leading-tight">
                CampusIQ
              </h1>
              <div className="mt-2 flex flex-wrap items-baseline gap-3">
                <span className="text-4xl lg:text-5xl font-bold text-gray-900">Placement Readiness</span>
                <span className="text-4xl lg:text-5xl font-bold bg-gradient-to-r from-blue-600 via-blue-600 to-cyan-600 bg-clip-text text-transparent">
                  Made Predictable
                </span>
              </div>
              {/* Animated underline */}
              <div className="h-1 w-24 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-full mt-4"></div>
            </div>

            {/* Subheading */}
            <p
              ref={subtitleRef}
              className="text-lg text-gray-600 max-w-lg leading-relaxed"
            >
              Track LinkedIn, GitHub, Resume, Aptitude, Coding and Soft Skills using a real-time Placement Readiness Score (PRS).
            </p>

            {/* Feature Rows - Premium Cards */}
            <div ref={featuresRef} className="space-y-3">
              {features.map((feature, idx) => (
                <div
                  key={idx}
                  className="feature-row group bg-white/60 backdrop-blur-md border border-white/40 rounded-xl p-4 hover:bg-white/80 hover:border-blue-200 transition-all duration-300 cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex-shrink-0">
                      {feature.icon}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 text-sm">{feature.title}</h3>
                      <p className="text-xs text-gray-600">{feature.description}</p>
                    </div>
                    <svg className="w-5 h-5 text-blue-600 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              ))}
            </div>

            {/* CTA Buttons */}
            <div ref={ctaRef} className="flex flex-wrap items-center gap-4">
              <Link href="/login">
                <Button className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-8 py-6 rounded-full font-semibold hover:shadow-2xl hover:shadow-blue-400 transition-all duration-300 text-lg">
                  Get Started
                </Button>
              </Link>
              <Link href="/login">
                <Button variant="outline" className="border-amber-500/50 bg-amber-50/50 text-amber-900 px-6 py-6 rounded-full font-semibold hover:bg-amber-100 transition-all text-base flex items-center gap-2">
                  <span>⚡ 1-Click Judge Demo Mode</span>
                </Button>
              </Link>
            </div>

            {/* Trust Line */}
            <p className="text-sm text-gray-600 font-medium">
              Trusted by Placement Cells • <span className="font-semibold text-blue-600">7500+ Students Tracked</span>
            </p>
          </div>

          {/* RIGHT SIDE - PREMIUM IMAGE */}
          <div className="relative h-full flex items-center justify-center">
            {/* Image Card */}
            <div
              ref={imageRef}
              className="relative w-full max-w-md"
            >
              {/* Subtle glow glow behind */}
              <div className="absolute -inset-8 bg-gradient-to-br from-blue-200/30 via-purple-200/20 to-cyan-200/30 rounded-3xl blur-3xl -z-10"></div>

              <div className="relative rounded-3xl overflow-hidden shadow-2xl"
                style={{
                  boxShadow: '0 20px 60px rgba(59, 130, 246, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.3)'
                }}
              >
                {/* Gradient border */}
                <div className="absolute inset-0 rounded-3xl p-px bg-gradient-to-br from-blue-400/30 via-transparent to-cyan-400/30 pointer-events-none"></div>

                {/* Image */}
                <Image
                  src="/college-boy.png"
                  alt="College student using CampusIQ"
                  width={400}
                  height={500}
                  className="w-full h-auto object-cover"
                  priority
                />

                {/* Overlay blur */}
                <div className="absolute inset-0 bg-gradient-to-t from-blue-600/5 to-transparent pointer-events-none"></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Wave Divider */}
      <div className="absolute bottom-0 left-0 w-full h-20 bg-gradient-to-t from-white to-transparent pointer-events-none"></div>
    </section>
  )
}
