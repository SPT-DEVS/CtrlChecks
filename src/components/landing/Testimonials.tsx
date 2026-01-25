import { motion } from "framer-motion";
import { Star } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const testimonials = [
  {
    content:
      "CtrlChecks transformed our customer support workflow. We've automated 80% of our ticket routing using AI classification. Response times dropped from hours to minutes.",
    author: "Sarah Chen",
    role: "Head of Support, TechCorp",
    avatar: "",
    rating: 5,
  },
  {
    content:
      "The visual builder is incredible. I'm not a developer, but I was able to create complex data pipelines in minutes. The AI nodes are a game-changer for content generation.",
    author: "Marcus Johnson",
    role: "Marketing Director, GrowthLabs",
    avatar: "",
    rating: 5,
  },
  {
    content:
      "We migrated from n8n to CtrlChecks for the AI capabilities. The integration with GPT-4 and Claude is seamless. Our automation workflows are now 10x more intelligent.",
    author: "Elena Rodriguez",
    role: "CTO, DataFlow Inc",
    avatar: "",
    rating: 5,
  },
  {
    content:
      "The team collaboration features are exactly what we needed. Multiple engineers can work on the same workflow, and version control saves us from making mistakes.",
    author: "David Kim",
    role: "Engineering Lead, ScaleUp",
    avatar: "",
    rating: 5,
  },
  {
    content:
      "I've tried many automation tools, but none come close to the flexibility of CtrlChecks. The custom code nodes let me do anything I need when built-in nodes aren't enough.",
    author: "Jessica Martinez",
    role: "Freelance Developer",
    avatar: "",
    rating: 5,
  },
  {
    content:
      "Enterprise-grade security was our top priority. CtrlChecks delivered with SOC 2 compliance, SSO, and detailed audit logs. Our compliance team is happy.",
    author: "Robert Thompson",
    role: "CISO, FinanceFirst",
    avatar: "",
    rating: 5,
  },
];

export function Testimonials() {
  return (
    <section id="testimonials" className="py-20 sm:py-32 bg-muted/30">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mx-auto max-w-2xl text-center"
        >
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
            Loved by <span className="text-gradient">teams worldwide</span>
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Join thousands of teams already automating with CtrlChecks
          </p>
        </motion.div>

        {/* Testimonials Grid */}
        <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={testimonial.author}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.05 }}
              className="rounded-2xl border border-border bg-card p-6"
            >
              {/* Stars */}
              <div className="flex gap-1">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star
                    key={i}
                    className="h-4 w-4 fill-warning text-warning"
                  />
                ))}
              </div>

              {/* Content */}
              <p className="mt-4 text-muted-foreground">
                "{testimonial.content}"
              </p>

              {/* Author */}
              <div className="mt-6 flex items-center gap-3">
                <Avatar>
                  <AvatarImage src={testimonial.avatar} />
                  <AvatarFallback className="bg-primary/10 text-primary">
                    {testimonial.author
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-medium">{testimonial.author}</div>
                  <div className="text-sm text-muted-foreground">
                    {testimonial.role}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
