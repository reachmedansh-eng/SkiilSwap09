import { useState } from "react";
import { Navbar } from "@/components/Navbar";
import { RetroBackground } from "@/components/RetroBackground";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Search, MessageCircle, Book, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Support() {
  const [searchQuery, setSearchQuery] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const { toast } = useToast();

  const faqs = [
    {
      question: "How do I propose a skill swap?",
      answer: "Navigate to the Listings page, find someone offering a skill you want to learn, and click 'View Profile'. From there, you can send them a swap proposal explaining what you can offer in return."
    },
    {
      question: "What happens when someone accepts my proposal?",
      answer: "You'll receive a notification and the exchange will move to your Active Swaps. You can then schedule sessions, chat with your partner, and start learning together!"
    },
    {
      question: "How do I earn XP and badges?",
      answer: "You earn XP by completing lessons, finishing swaps, maintaining daily streaks, and participating in the community. Badges are awarded for special achievements like your first swap, streak milestones, and skill mastery."
    },
    {
      question: "Can I swap with multiple people at once?",
      answer: "Absolutely! You can have multiple active swaps simultaneously. Just make sure you can commit the time to each exchange."
    },
    {
      question: "What if I need to cancel a swap?",
      answer: "Life happens! You can cancel a swap from your Exchanges page. Please communicate with your partner and give them notice. Frequent cancellations may affect your rating."
    },
    {
      question: "How does the rating system work?",
      answer: "After completing a swap, both partners rate each other on reliability, teaching quality, and communication. Your average rating is displayed on your profile."
    }
  ];

  const filteredFaqs = faqs.filter(faq => 
    faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
    faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: "Message sent!",
      description: "We'll get back to you within 24 hours.",
    });
    setName("");
    setEmail("");
    setMessage("");
  };

  return (
  <div className="min-h-screen bg-gradient-to-br from-mint/40 via-white to-teal/5 relative">
      <RetroBackground />
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-indigo mb-2">Support Center</h1>
          <p className="text-soft-blue text-lg">Find answers and get help</p>
        </div>

        {/* Quick Links */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <Card className="bg-white/80 backdrop-blur-lg border-soft-blue/20 hover:border-teal/40 transition-all cursor-pointer">
            <CardHeader>
              <div className="w-12 h-12 bg-teal/10 rounded-xl flex items-center justify-center mb-3">
                <Book className="w-6 h-6 text-teal" />
              </div>
              <CardTitle className="text-indigo">Getting Started</CardTitle>
              <CardDescription>Learn the basics of SkillSwap</CardDescription>
            </CardHeader>
          </Card>

          <Card className="bg-white/80 backdrop-blur-lg border-soft-blue/20 hover:border-teal/40 transition-all cursor-pointer">
            <CardHeader>
              <div className="w-12 h-12 bg-mustard/30 rounded-xl flex items-center justify-center mb-3">
                <MessageCircle className="w-6 h-6 text-indigo" />
              </div>
              <CardTitle className="text-indigo">Contact Us</CardTitle>
              <CardDescription>Get personalized support</CardDescription>
            </CardHeader>
          </Card>

          <Card className="bg-white/80 backdrop-blur-lg border-soft-blue/20 hover:border-teal/40 transition-all cursor-pointer">
            <CardHeader>
              <div className="w-12 h-12 bg-mint rounded-xl flex items-center justify-center mb-3">
                <Users className="w-6 h-6 text-teal" />
              </div>
              <CardTitle className="text-indigo">Community Forum</CardTitle>
              <CardDescription>Connect with other swappers</CardDescription>
            </CardHeader>
          </Card>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* FAQ Section */}
          <div className="lg:col-span-2">
            <Card className="bg-white/80 backdrop-blur-lg border-soft-blue/20 shadow-lg">
              <CardHeader>
                <CardTitle className="text-2xl text-indigo">Frequently Asked Questions</CardTitle>
                <div className="relative mt-4">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-soft-blue" />
                  <Input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search FAQs..."
                    className="pl-10 rounded-xl border-soft-blue/30 focus:border-teal"
                  />
                </div>
              </CardHeader>
              <CardContent>
                <Accordion type="single" collapsible className="space-y-4">
                  {filteredFaqs.map((faq, index) => (
                    <AccordionItem key={index} value={`item-${index}`} className="border border-soft-blue/20 rounded-lg px-4">
                      <AccordionTrigger className="text-indigo font-semibold hover:text-teal">
                        {faq.question}
                      </AccordionTrigger>
                      <AccordionContent className="text-soft-blue">
                        {faq.answer}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>

                {filteredFaqs.length === 0 && (
                  <p className="text-center text-soft-blue py-8">No FAQs match your search</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Contact Form */}
          <div>
            <Card className="bg-white/80 backdrop-blur-lg border-soft-blue/20 shadow-lg sticky top-8">
              <CardHeader>
                <CardTitle className="text-xl text-indigo">Contact Support</CardTitle>
                <CardDescription>Can't find what you're looking for?</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-indigo mb-2">Name</label>
                    <Input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Your name"
                      className="rounded-xl border-soft-blue/30 focus:border-teal"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-indigo mb-2">Email</label>
                    <Input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="your@email.com"
                      className="rounded-xl border-soft-blue/30 focus:border-teal"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-indigo mb-2">Message</label>
                    <Textarea
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="How can we help?"
                      rows={5}
                      className="rounded-xl border-soft-blue/30 focus:border-teal resize-none"
                      required
                    />
                  </div>

                  <Button type="submit" className="w-full bg-teal text-white rounded-xl hover:bg-teal/90">
                    Send Message
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
