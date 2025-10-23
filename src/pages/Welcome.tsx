import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Search, Users, Trophy, Target, BarChart, MessageCircle, Award } from "lucide-react";
import { Button } from "../components/ui/button";
import { Logo } from "../components/Logo";

export default function Welcome() {
  const navigate = useNavigate();

  const steps = [
    {
      icon: Search,
      title: "Discover",
      description: "Find skills you want to learn and people who need your expertise"
    },
    {
      icon: Users,
      title: "Connect",
      description: "Match with learners and teachers in our vibrant community"
    },
    {
      icon: Trophy,
      title: "Grow",
      description: "Track progress, earn badges, and level up your skills together"
    }
  ];

  const features = [
    { icon: Target, title: "Smart Matching", description: "AI-powered recommendations based on your goals" },
    { icon: BarChart, title: "Progress Tracking", description: "Visualize your learning journey with detailed stats" },
    { icon: MessageCircle, title: "Community Support", description: "Connect with learners through real-time chat" },
    { icon: Award, title: "Earn Rewards", description: "Unlock badges and achievements as you grow" }
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="min-h-screen bg-gradient-to-br from-mint-breeze via-white to-teal-pulse/10 flex flex-col px-6 relative overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-20 left-10 w-32 h-32 bg-golden-spark/20 rounded-full blur-3xl animate-float" />
          <div className="absolute bottom-20 right-10 w-40 h-40 bg-teal-pulse/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '1s' }} />
        </div>

        {/* Logo Header */}
        <div className="relative z-10 py-6">
          <Logo />
        </div>

        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 items-center relative z-10 flex-1">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="space-y-6"
          >
            <h1 className="text-5xl md:text-6xl font-bold text-deep-indigo leading-tight">
              Learn Together, <span className="text-teal-pulse">Grow Together</span>
            </h1>
            <p className="text-xl text-neutral-800">
              Exchange skills with a community that values growth, curiosity, and meaningful connection.
            </p>
            <div className="flex flex-wrap gap-4">
              <Button 
                onClick={() => navigate('/signup')}
                className="bg-teal-pulse text-white px-8 py-6 rounded-full font-semibold hover:scale-105 transition-transform shadow-xl text-lg"
              >
                Start Your Journey
              </Button>
              <Button 
                onClick={() => navigate('/auth')}
                variant="outline"
                className="bg-white text-teal-pulse border-2 border-teal-pulse px-8 py-6 rounded-full font-semibold hover:bg-teal-pulse hover:text-white transition-colors text-lg"
              >
                Sign In
              </Button>
            </div>
            
            {/* Social Proof removed per request */}
          </motion.div>
          
          {/* Right side: Animated skill cards */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="hidden lg:block"
          >
            <div className="relative">
              <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-teal-pulse/30 to-golden-spark/30 rounded-3xl transform rotate-6 animate-pulse-glow" />
              <div className="relative bg-white/80 backdrop-blur-lg rounded-3xl p-8 shadow-2xl">
                <div className="space-y-4">
                  {['JavaScript', 'Design', 'Photography', 'Guitar'].map((skill, i) => (
                    <motion.div
                      key={skill}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.4 + i * 0.1 }}
                      className="bg-gradient-to-r from-mint-breeze to-teal-pulse/20 p-4 rounded-xl border border-teal-pulse/20 flex items-center gap-3"
                    >
                      <div className="w-12 h-12 bg-teal-pulse rounded-xl flex items-center justify-center text-white font-bold">
                        {skill[0]}
                      </div>
                      <span className="font-semibold text-deep-indigo">{skill}</span>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
      
      {/* How It Works Section */}
      <section className="py-24 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl md:text-5xl font-bold text-center text-deep-indigo mb-16"
          >
            Three Steps to Your Next Skill
          </motion.h2>
          <div className="grid md:grid-cols-3 gap-8">
            {steps.map((step, index) => (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.2 }}
                className="bg-gradient-to-br from-mint-breeze/50 to-white p-8 rounded-2xl border border-teal-pulse/20 hover:border-teal-pulse/40 transition-all hover:shadow-xl hover:-translate-y-2"
              >
                <div className="w-16 h-16 bg-gradient-to-br from-teal-pulse to-deep-indigo rounded-2xl flex items-center justify-center mb-6">
                  <step.icon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-deep-indigo mb-3">{step.title}</h3>
                <p className="text-neutral-700">{step.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-gradient-to-br from-mint-breeze/30 to-white">
        <div className="max-w-6xl mx-auto px-6">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl md:text-5xl font-bold text-center text-deep-indigo mb-16"
          >
            Everything You Need to Succeed
          </motion.h2>
          <div className="grid md:grid-cols-2 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="bg-white/80 backdrop-blur-lg p-6 rounded-2xl border border-soft-horizon/20 hover:border-teal-pulse/40 transition-all hover:shadow-lg"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-golden-spark to-golden-spark/80 rounded-xl flex items-center justify-center flex-shrink-0">
                    <feature.icon className="w-6 h-6 text-deep-indigo" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-deep-indigo mb-2">{feature.title}</h3>
                    <p className="text-neutral-700">{feature.description}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
      
      {/* Final CTA */}
      <section className="py-24 bg-deep-indigo text-white text-center relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-10 left-1/4 w-64 h-64 bg-golden-spark/20 rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-1/4 w-64 h-64 bg-teal-pulse/20 rounded-full blur-3xl" />
        </div>
        <div className="relative z-10 max-w-4xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-6">Ready to swap?</h2>
            <p className="text-xl text-white/80 mb-8 max-w-2xl mx-auto">
              Join thousands of learners exchanging skills and building meaningful connections.
            </p>
            <Button 
              onClick={() => navigate('/signup')}
              className="bg-golden-spark text-deep-indigo px-10 py-7 rounded-full text-xl font-bold hover:scale-105 transition-transform shadow-2xl"
            >
              Get Started Free
            </Button>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
