```tsx
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ArrowRight, Shield, Clock, Zap, Users, TrendingUp, CheckCircle, Star, Play } from 'lucide-react'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-slate-900 text-white">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/95 backdrop-blur supports-[backdrop-filter]:bg-slate-900/60 sticky top-0 z-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="h-8 w-8 rounded-lg bg-blue-500 flex items-center justify-center">
                  <Zap className="h-5 w-5 text-white" />
                </div>
                <span className="text-xl font-bold">StreamFlow</span>
              </div>
            </div>
            <nav className="hidden md:flex items-center space-x-8">
              <Link href="#features" className="text-slate-300 hover:text-white transition-colors">
                Features
              </Link>
              <Link href="#pricing" className="text-slate-300 hover:text-white transition-colors">
                Pricing
              </Link>
              <Link href="#docs" className="text-slate-300 hover:text-white transition-colors">
                Docs
              </Link>
              <Link href="#about" className="text-slate-300 hover:text-white transition-colors">
                About
              </Link>
            </nav>
            <div className="flex items-center space-x-4">
              <Button variant="ghost" className="text-slate-300 hover:text-white">
                Sign In
              </Button>
              <Button className="bg-blue-500 hover:bg-blue-600">
                Get Started
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 lg:py-32">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-4xl mx-auto">
            <Badge className="mb-6 bg-blue-500/10 text-blue-400 border-blue-500/20">
              Built on Solana
            </Badge>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
              Stream Tokens with
              <br />
              Real-Time Precision
            </h1>
            <p className="text-xl text-slate-300 mb-8 max-w-2xl mx-auto">
              The most advanced token streaming and vesting platform on Solana. Create payment streams, 
              manage vesting schedules, and handle treasury operations with unparalleled efficiency.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="bg-blue-500 hover:bg-blue-600 text-lg px-8 py-3">
                Start Streaming
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button size="lg" variant="outline" className="border-slate-700 text-slate-300 hover:bg-slate-800 text-lg px-8 py-3">
                <Play className="mr-2 h-5 w-5" />
                Watch Demo
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 border-y border-slate-800">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-3xl lg:text-4xl font-bold text-blue-400 mb-2">$2.5B+</div>
              <div className="text-slate-400">Total Streamed</div>
            </div>
            <div className="text-center">
              <div className="text-3xl lg:text-4xl font-bold text-blue-400 mb-2">50K+</div>
              <div className="text-slate-400">Active Streams</div>
            </div>
            <div className="text-center">
              <div className="text-3xl lg:text-4xl font-bold text-blue-400 mb-2">1M+</div>
              <div className="text-slate-400">Transactions</div>
            </div>
            <div className="text-center">
              <div className="text-3xl lg:text-4xl font-bold text-blue-400 mb-2">99.9%</div>
              <div className="text-slate-400">Uptime</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold mb-4">
              Everything you need for token streaming
            </h2>
            <p className="text-xl text-slate-300 max-w-2xl mx-auto">
              Powerful features designed for modern DeFi applications and treasury management
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <div className="h-12 w-12 rounded-lg bg-blue-500/10 flex items-center justify-center mb-4">
                  <Clock className="h-6 w-6 text-blue-400" />
                </div>
                <CardTitle className="text-white">Real-Time Streaming</CardTitle>
                <CardDescription className="text-slate-400">
                  Stream tokens by the second with precise timing and automatic distribution
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <div className="h-12 w-12 rounded-lg bg-blue-500/10 flex items-center justify-center mb-4">
                  <Shield className="h-6 w-6 text-blue-400" />
                </div>
                <CardTitle className="text-white">Vesting Schedules</CardTitle>
                <CardDescription className="text-slate-400">
                  Create complex vesting schedules with cliffs, linear unlocks, and custom curves
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <div className="h-12 w-12 rounded-lg bg-blue-500/10 flex items-center justify-center mb-4">
                  <TrendingUp className="h-6 w-6 text-blue-400" />
                </div>
                <CardTitle className="text-white">Treasury Management</CardTitle>
                <CardDescription className="text-slate-400">
                  Manage organizational treasuries with multi-sig support and governance controls
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <div className="h-12 w-12 rounded-lg bg-blue-500/10 flex items-center justify-center mb-4">
                  <Users className="h-6 w-6 text-blue-400" />
                </div>
                <CardTitle className="text-white">Batch Operations</CardTitle>
                <CardDescription className="text-slate-400">
                  Process multiple streams and payments in a single transaction for efficiency
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <div className="h-12 w-12 rounded-lg bg-blue-500/10 flex items-center justify-center mb-4">
                  <Zap className="h-6 w-6 text-blue-400" />
                </div>
                <CardTitle className="text-white">Low Fees</CardTitle>
                <CardDescription className="text-slate-400">
                  Leverage Solana's speed and low costs for efficient token distribution
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <div className="h-12 w-12 rounded-lg bg-blue-500/10 flex items-center justify-center mb-4">
                  <CheckCircle className="h-6 w-6 text-blue-400" />
                </div>
                <CardTitle className="text-white">Audit Ready</CardTitle>
                <CardDescription className="text-slate-400">
                  Comprehensive logging and reporting for compliance and audit requirements
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* Use Cases Section */}
      <section className="py-20 bg-slate-800/50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold mb-4">
              Built for every use case
            </h2>
            <p className="text-xl text-slate-300 max-w-2xl mx-auto">
              From payroll to token distribution, StreamFlow handles it all
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Employee Payroll</CardTitle>
                <CardDescription className="text-slate-400">
                  Stream salaries in real-time, eliminating traditional payroll cycles
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-slate-300">
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-blue-400 mr-2" />
                    Real-time salary streaming
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-blue-400 mr-2" />
                    Automatic tax calculations
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-blue-400 mr-2" />
                    Multi-currency support
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Token Vesting</CardTitle>
                <CardDescription className="text-slate-400">
                  Manage investor and team token allocations with flexible vesting
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-slate-300">
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-blue-400 mr-2" />
                    Custom vesting curves
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-blue-400 mr-2" />
                    Cliff periods
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-blue-400 mr-2" />
                    Cancellation controls
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">DAO Treasury</CardTitle>
                <CardDescription className="text-slate-400">
                  Distribute treasury funds with governance and transparency
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-slate-300">
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-blue-400 mr-2" />
                    Multi-sig integration
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-blue-400 mr-2" />
                    Governance controls
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-blue-400 mr-2" />
                    Transparent reporting
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold mb-4">
              Trusted by leading organizations
            </h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="bg-slate-800 border-slate-700">
              <CardContent className="pt-6">
                <div className="flex mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-slate-300 mb-4">
                  "StreamFlow revolutionized how we handle payroll. Our team gets paid every second, 
                  and the transparency is incredible."
                </p>
                <div className="flex items-center">
                  <div className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center mr-3">
                    <span className="text-sm font-bold">JD</span>
                  </div>
                  <div>
                    <div className="font-semibold text-white">John Doe</div>
                    <div className="text-sm text-slate-400">CEO, TechCorp</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-800