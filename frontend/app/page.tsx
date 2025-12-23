import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles, Video, FileText, BarChart3, Zap, Shield, Clock, ArrowRight } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen gradient-bg text-white overflow-hidden">
      {/* Animated Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-indigo-500/5 rounded-full blur-2xl" />
      </div>

      {/* Hero Section */}
      <div className="relative container mx-auto px-4 py-20">
        <div className="flex flex-col items-center text-center space-y-8">
          {/* Floating Logo */}
          <div className="relative">
            <div className="absolute inset-0 bg-purple-500/20 blur-2xl rounded-full animate-pulse" />
            <div className="relative flex items-center gap-4 p-4">
              <div className="relative">
                <Sparkles className="w-16 h-16 text-purple-400" />
                <div className="absolute inset-0 animate-ping">
                  <Sparkles className="w-16 h-16 text-purple-400/30" />
                </div>
              </div>
              <h1 className="text-6xl font-bold gradient-text">AI Dronacharya</h1>
            </div>
          </div>

          {/* Tagline with Gradient */}
          <p className="text-2xl text-purple-200/90 max-w-2xl leading-relaxed">
            AI-Powered Video Interview Platform
            <span className="block text-lg text-purple-300/70 mt-2">
              Maximum Intelligence • Instant Feedback
            </span>
          </p>

          {/* CTA Buttons */}
          <div className="flex gap-6 mt-10">
            <Link href="/interview">
              <Button size="lg" className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white px-10 py-7 text-xl rounded-2xl btn-glow shadow-2xl shadow-purple-900/50 group">
                Start Interview
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <Link href="/dashboard">
              <Button size="lg" variant="outline" className="border-2 border-purple-500/50 text-purple-200 hover:bg-purple-900/30 hover:border-purple-400 px-10 py-7 text-xl rounded-2xl backdrop-blur-sm">
                View Results
              </Button>
            </Link>
          </div>

          {/* Trust Indicators */}
          <div className="flex items-center gap-8 mt-8 text-sm text-purple-300/60">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4" />
              <span>Privacy First</span>
            </div>
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4" />
              <span>Powered by Gemini</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              <span>5-60 Min Sessions</span>
            </div>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-24">
          <Card className="premium-card hover:scale-105 transition-all duration-300 hover:shadow-2xl hover:shadow-purple-900/30 group">
            <CardHeader className="space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Video className="w-7 h-7 text-white" />
              </div>
              <CardTitle className="text-2xl text-white">Live AI Interviewer</CardTitle>
              <CardDescription className="text-purple-200/70 text-base">
                Real-time conversation with an intelligent AI interviewer
              </CardDescription>
            </CardHeader>
            <CardContent className="text-slate-300">
              <ul className="space-y-3 text-base">
                <li className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-green-400" />
                  Natural voice interaction
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-green-400" />
                  Personalized questions
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-green-400" />
                  Context-aware responses
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card className="premium-card hover:scale-105 transition-all duration-300 hover:shadow-2xl hover:shadow-purple-900/30 group">
            <CardHeader className="space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                <FileText className="w-7 h-7 text-white" />
              </div>
              <CardTitle className="text-2xl text-white">Smart Resume Analysis</CardTitle>
              <CardDescription className="text-purple-200/70 text-base">
                Intelligent parsing with privacy protection
              </CardDescription>
            </CardHeader>
            <CardContent className="text-slate-300">
              <ul className="space-y-3 text-base">
                <li className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-blue-400" />
                  Automated skill extraction
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-blue-400" />
                  Experience gap analysis
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-blue-400" />
                  Tailored questions
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card className="premium-card hover:scale-105 transition-all duration-300 hover:shadow-2xl hover:shadow-purple-900/30 group">
            <CardHeader className="space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                <BarChart3 className="w-7 h-7 text-white" />
              </div>
              <CardTitle className="text-2xl text-white">Detailed Report Card</CardTitle>
              <CardDescription className="text-purple-200/70 text-base">
                Comprehensive feedback and scoring
              </CardDescription>
            </CardHeader>
            <CardContent className="text-slate-300">
              <ul className="space-y-3 text-base">
                <li className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-emerald-400" />
                  Technical proficiency score
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-emerald-400" />
                  Communication analysis
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-emerald-400" />
                  Improvement suggestions
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* How It Works - Enhanced */}
        <div className="mt-32 text-center">
          <h2 className="text-4xl font-bold gradient-text mb-4">How It Works</h2>
          <p className="text-purple-200/60 mb-12 text-lg">Get interview-ready in four simple steps</p>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 max-w-5xl mx-auto">
            {[
              { num: "1", title: "Upload Resume", desc: "PDF analysis with AI", color: "from-purple-500 to-purple-700" },
              { num: "2", title: "Choose Duration", desc: "5 to 60 minutes", color: "from-indigo-500 to-indigo-700" },
              { num: "3", title: "Interview", desc: "Talk with Shreya AI", color: "from-blue-500 to-blue-700" },
              { num: "4", title: "Get Results", desc: "Detailed scorecard", color: "from-emerald-500 to-emerald-700" }
            ].map((step, i) => (
              <div key={i} className="relative group">
                {i < 3 && (
                  <div className="hidden md:block absolute top-12 left-full w-full h-0.5 bg-gradient-to-r from-purple-500/50 to-transparent z-0" />
                )}
                <div className="glass-card p-6 rounded-2xl border border-purple-500/20 hover:border-purple-400/40 transition-all group-hover:scale-105">
                  <div className={`w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br ${step.color} flex items-center justify-center text-3xl font-bold text-white shadow-lg`}>
                    {step.num}
                  </div>
                  <p className="text-white font-semibold text-lg">{step.title}</p>
                  <p className="text-sm text-purple-300/60 mt-2">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer CTA */}
        <div className="mt-32 text-center">
          <div className="glass-card max-w-2xl mx-auto p-10 rounded-3xl glow-border">
            <h3 className="text-3xl font-bold text-white mb-4">Ready to Practice?</h3>
            <p className="text-purple-200/70 mb-8">Start your AI-powered interview experience now</p>
            <Link href="/interview">
              <Button size="lg" className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 px-12 py-6 text-xl rounded-2xl btn-glow">
                Begin Interview <Sparkles className="ml-2 w-5 h-5" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
