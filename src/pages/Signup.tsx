import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ProgressBar } from "@/components/ProgressBar";
import { SkillChip } from "@/components/SkillChip";
import confetti from "canvas-confetti";
import { Eye, EyeOff, Sparkles, Gift, Target, Trophy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const POPULAR_SKILLS = [
  "JavaScript", "Python", "Design", "Photography", "Guitar", "Spanish",
  "Cooking", "Writing", "Marketing", "Yoga", "Drawing", "Video Editing"
];

export default function Signup() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  
  // Form data
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [personality, setPersonality] = useState<string[]>([]);
  const [skillsOffered, setSkillsOffered] = useState<string[]>([]);
  const [skillsWanted, setSkillsWanted] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState("");
  const [loading, setLoading] = useState(false);

  const personalities = [
    { id: "visual", emoji: "👁️", title: "Visual Learner", description: "I learn best through images and videos" },
    { id: "deep", emoji: "🌊", title: "Deep Diver", description: "I like comprehensive, detailed content" },
    { id: "quick", emoji: "⚡", title: "Quick Wins", description: "I prefer bite-sized, practical lessons" },
    { id: "community", emoji: "🤝", title: "Community Driven", description: "I thrive in collaborative learning" }
  ];

  const celebrateSignup = () => {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#329D9F', '#F1D869', '#D7F9F1']
    });
  };

  const handleStage1 = async () => {
    if (!email || !password || !username) {
      toast({ title: "Please fill all fields", variant: "destructive" });
      return;
    }

    setLoading(true);
    const redirectUrl = `${window.location.origin}/`;
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: { username }
      }
    });

    setLoading(false);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }

    setCurrentStep(2);
  };

  const addSkill = (skill: string, type: "offer" | "want") => {
    const trimmed = skill.trim();
    if (!trimmed) return;

    if (type === "offer" && !skillsOffered.includes(trimmed)) {
      setSkillsOffered([...skillsOffered, trimmed]);
    } else if (type === "want" && !skillsWanted.includes(trimmed)) {
      setSkillsWanted([...skillsWanted, trimmed]);
    }
    setSkillInput("");
  };

  const removeSkill = (skill: string, type: "offer" | "want") => {
    if (type === "offer") {
      setSkillsOffered(skillsOffered.filter(s => s !== skill));
    } else {
      setSkillsWanted(skillsWanted.filter(s => s !== skill));
    }
  };

  const handleFinish = async () => {
    celebrateSignup();
    
    // Award initial XP and badge
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      await supabase.from("profiles").update({
        xp: 50
      }).eq("id", session.user.id);

      await supabase.from("badges").insert({
        user_id: session.user.id,
        badge_type: "welcome",
        name: "Welcome to SkillSwap",
        icon: "🎉",
        description: "Completed your first signup!"
      });
    }

    setCurrentStep(5);
    setTimeout(() => navigate("/dashboard"), 3000);
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <h2 className="text-3xl font-bold text-deep-indigo">Welcome Aboard ✨</h2>
              <p className="text-soft-horizon">Let's create your SkillSwap account</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-deep-indigo mb-2">Username</label>
                <Input
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Choose a username"
                  className="rounded-xl border-soft-horizon/30 focus:border-teal-pulse"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-deep-indigo mb-2">Email</label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="rounded-xl border-soft-horizon/30 focus:border-teal-pulse"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-deep-indigo mb-2">Password</label>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Create a secure password"
                    className="rounded-xl border-soft-horizon/30 focus:border-teal-pulse pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-soft-horizon hover:text-teal-pulse"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
            </div>

            <Button
              onClick={handleStage1}
              disabled={loading}
              className="w-full bg-teal-pulse text-white py-6 rounded-full font-semibold hover:scale-105 transition-transform"
            >
              {loading ? "Creating Account..." : "Continue"}
            </Button>

            <button
              onClick={() => navigate("/dashboard")}
              className="w-full text-sm text-soft-horizon hover:text-teal-pulse transition-colors"
            >
              Skip customization →
            </button>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <h2 className="text-3xl font-bold text-deep-indigo">Choose Your Vibe 🎨</h2>
              <p className="text-soft-horizon">Select all that resonate with you</p>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              {personalities.map((p) => (
                <button
                  key={p.id}
                  onClick={() => {
                    if (personality.includes(p.id)) {
                      setPersonality(personality.filter(id => id !== p.id));
                    } else {
                      setPersonality([...personality, p.id]);
                    }
                  }}
                  className={`p-6 rounded-2xl border-2 transition-all hover:scale-105 text-left ${
                    personality.includes(p.id)
                      ? "border-teal-pulse bg-teal-pulse/10 shadow-lg"
                      : "border-soft-horizon/30 bg-white hover:border-teal-pulse/50"
                  }`}
                >
                  <div className="text-4xl mb-3">{p.emoji}</div>
                  <h3 className="font-bold text-deep-indigo mb-1">{p.title}</h3>
                  <p className="text-sm text-soft-horizon">{p.description}</p>
                </button>
              ))}
            </div>

            <Button
              onClick={() => setCurrentStep(3)}
              className="w-full bg-teal-pulse text-white py-6 rounded-full font-semibold hover:scale-105 transition-transform"
            >
              Continue
            </Button>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <Gift className="w-12 h-12 mx-auto text-teal-pulse" />
              <h2 className="text-3xl font-bold text-deep-indigo">Skills You Offer 🎁</h2>
              <p className="text-soft-horizon">What can you teach others?</p>
            </div>

            <div className="bg-mint-breeze/30 p-6 rounded-2xl">
              <div className="flex gap-2 mb-4">
                <Input
                  value={skillInput}
                  onChange={(e) => setSkillInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addSkill(skillInput, "offer")}
                  placeholder="Type a skill..."
                  className="flex-1 rounded-xl border-teal-pulse/30 focus:border-teal-pulse"
                />
                <Button
                  onClick={() => addSkill(skillInput, "offer")}
                  className="bg-teal-pulse text-white rounded-xl px-6"
                >
                  Add
                </Button>
              </div>

              <div className="flex flex-wrap gap-2 mb-4">
                {skillsOffered.map((skill) => (
                  <SkillChip
                    key={skill}
                    skill={skill}
                    variant="offer"
                    onRemove={() => removeSkill(skill, "offer")}
                  />
                ))}
              </div>

              <div className="pt-4 border-t border-teal-pulse/20">
                <p className="text-sm text-soft-horizon mb-3">Popular skills:</p>
                <div className="flex flex-wrap gap-2">
                  {POPULAR_SKILLS.filter(s => !skillsOffered.includes(s)).slice(0, 6).map((skill) => (
                    <button
                      key={skill}
                      onClick={() => addSkill(skill, "offer")}
                      className="px-3 py-1 bg-white border border-teal-pulse/20 rounded-full text-sm text-teal-pulse hover:bg-teal-pulse hover:text-white transition-colors"
                    >
                      + {skill}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <Button
              onClick={() => setCurrentStep(4)}
              disabled={skillsOffered.length === 0}
              className="w-full bg-teal-pulse text-white py-6 rounded-full font-semibold hover:scale-105 transition-transform"
            >
              Continue
            </Button>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <Target className="w-12 h-12 mx-auto text-golden-spark" />
              <h2 className="text-3xl font-bold text-deep-indigo">Skills You Want 🎯</h2>
              <p className="text-soft-horizon">What do you want to learn?</p>
            </div>

            <div className="bg-golden-spark/10 p-6 rounded-2xl">
              <div className="flex gap-2 mb-4">
                <Input
                  value={skillInput}
                  onChange={(e) => setSkillInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addSkill(skillInput, "want")}
                  placeholder="Type a skill..."
                  className="flex-1 rounded-xl border-golden-spark/30 focus:border-golden-spark"
                />
                <Button
                  onClick={() => addSkill(skillInput, "want")}
                  className="bg-golden-spark text-deep-indigo rounded-xl px-6"
                >
                  Add
                </Button>
              </div>

              <div className="flex flex-wrap gap-2 mb-4">
                {skillsWanted.map((skill) => (
                  <SkillChip
                    key={skill}
                    skill={skill}
                    variant="want"
                    onRemove={() => removeSkill(skill, "want")}
                  />
                ))}
              </div>

              <div className="pt-4 border-t border-golden-spark/20">
                <p className="text-sm text-soft-horizon mb-3">Popular skills:</p>
                <div className="flex flex-wrap gap-2">
                  {POPULAR_SKILLS.filter(s => !skillsWanted.includes(s)).slice(0, 6).map((skill) => (
                    <button
                      key={skill}
                      onClick={() => addSkill(skill, "want")}
                      className="px-3 py-1 bg-white border border-golden-spark/20 rounded-full text-sm text-deep-indigo hover:bg-golden-spark hover:text-deep-indigo transition-colors"
                    >
                      + {skill}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <Button
              onClick={handleFinish}
              disabled={skillsWanted.length === 0}
              className="w-full bg-gradient-to-r from-teal-pulse to-golden-spark text-white py-6 rounded-full font-semibold hover:scale-105 transition-transform"
            >
              Complete Setup
            </Button>
          </div>
        );

      case 5:
        return (
          <div className="text-center space-y-6">
            <div className="w-24 h-24 mx-auto bg-gradient-to-br from-golden-spark to-golden-spark/80 rounded-full flex items-center justify-center">
              <Trophy className="w-12 h-12 text-deep-indigo" />
            </div>

            <div className="space-y-2">
              <h2 className="text-4xl font-bold text-deep-indigo">You're All Set! 🎉</h2>
              <p className="text-xl text-soft-horizon">Welcome to the SkillSwap community</p>
            </div>

            <div className="bg-mint-breeze/50 rounded-2xl p-8 space-y-4">
              <div className="flex items-center justify-center gap-3">
                <Sparkles className="w-6 h-6 text-golden-spark" />
                <span className="text-2xl font-bold text-teal-pulse">+50 XP</span>
              </div>

              <div className="bg-white/80 backdrop-blur-lg rounded-xl p-4">
                <p className="text-sm text-soft-horizon mb-2">First Badge Earned</p>
                <div className="flex items-center justify-center gap-3">
                  <div className="text-4xl">🎉</div>
                  <div className="text-left">
                    <p className="font-bold text-deep-indigo">Welcome to SkillSwap</p>
                    <p className="text-sm text-soft-horizon">Completed your first signup!</p>
                  </div>
                </div>
              </div>

              <p className="text-soft-horizon">
                We found <span className="font-bold text-teal-pulse">{Math.floor(Math.random() * 20) + 10}</span> potential matches for you
              </p>
            </div>

            <p className="text-sm text-soft-horizon">Redirecting to dashboard...</p>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-mint-breeze via-white to-teal-pulse/10 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-2xl">
        {currentStep < 5 && (
          <div className="mb-8">
            <p className="text-center text-sm text-soft-horizon mb-3">Step {currentStep} of 4</p>
            <ProgressBar current={currentStep} total={4} showLabel={false} />
          </div>
        )}

        <div className="bg-white/80 backdrop-blur-lg rounded-3xl p-8 md:p-12 shadow-2xl border border-soft-horizon/20">
          {renderStep()}
        </div>
      </div>
    </div>
  );
}
