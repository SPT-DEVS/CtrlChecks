import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Play, Sparkles, Workflow, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Hero() {
  return (
    <section className="relative overflow-hidden pt-32 pb-20 sm:pt-40 sm:pb-32">
      {/* Background gradients */}
      <div className="absolute inset-0 gradient-hero" />
      <div className="absolute top-1/4 left-1/4 w-96 h-96 gradient-glow blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 gradient-glow blur-3xl" />
      
      <div className="container relative mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-8 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5"
          >
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-primary">
              AI-Powered Workflow Automation
            </span>
          </motion.div>

          {/* Heading */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-4xl font-bold tracking-tight sm:text-6xl lg:text-7xl"
          >
            Automate Everything with{" "}
            <span className="text-gradient">AI Workflows</span>
          </motion.h1>

          {/* Subheading */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mt-6 text-lg leading-8 text-muted-foreground sm:text-xl"
          >
            Build powerful automation workflows visually. Connect AI models, 
            APIs, and data sources with a simple drag-and-drop interface. 
            No coding required.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row"
          >
            <Button
              size="lg"
              asChild
              className="gradient-primary text-primary-foreground hover:opacity-90 shadow-glow"
            >
              <Link to="/signup">
                Start Building Free
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="group">
              <Play className="mr-2 h-4 w-4 transition-transform group-hover:scale-110" />
              Watch Demo
            </Button>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="mt-16 grid grid-cols-2 gap-8 sm:grid-cols-4"
          >
            {[
              { value: "50+", label: "Integrations" },
              { value: "10K+", label: "Workflows Built" },
              { value: "99.9%", label: "Uptime" },
              { value: "5M+", label: "Executions" },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-3xl font-bold text-gradient">{stat.value}</div>
                <div className="mt-1 text-sm text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </motion.div>
        </div>

        {/* Preview Image */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.5 }}
          className="mt-20 relative"
        >
          <div className="relative mx-auto max-w-5xl overflow-hidden rounded-2xl border border-border bg-card shadow-2xl">
            {/* Browser chrome */}
            <div className="flex items-center gap-2 border-b border-border bg-muted/50 px-4 py-3">
              <div className="flex gap-1.5">
                <div className="h-3 w-3 rounded-full bg-destructive/60" />
                <div className="h-3 w-3 rounded-full bg-warning/60" />
                <div className="h-3 w-3 rounded-full bg-success/60" />
              </div>
              <div className="flex-1 text-center text-xs text-muted-foreground">
                ctrlchecks.pro/workflow/builder
              </div>
            </div>
            
            {/* Mock workflow builder */}
            <div className="relative aspect-[16/9] bg-gradient-to-br from-muted/30 to-muted/10 p-8">
              <div className="absolute inset-0 grid grid-cols-12 gap-4 p-8">
                {/* Sidebar */}
                <div className="col-span-2 rounded-lg bg-card border border-border p-4">
                  <div className="space-y-3">
                    <div className="h-8 rounded bg-primary/10" />
                    <div className="h-6 rounded bg-muted" />
                    <div className="h-6 rounded bg-muted" />
                    <div className="h-6 rounded bg-muted" />
                    <div className="h-8 rounded bg-secondary/10" />
                    <div className="h-6 rounded bg-muted" />
                    <div className="h-6 rounded bg-muted" />
                  </div>
                </div>
                
                {/* Canvas */}
                <div className="col-span-8 rounded-lg bg-card/50 border border-border relative overflow-hidden">
                  {/* Nodes */}
                  <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.3, delay: 0.8 }}
                    className="absolute top-12 left-16 flex h-14 w-36 items-center gap-2 rounded-lg border-2 border-primary bg-card px-3 shadow-lg"
                  >
                    <div className="rounded bg-primary/20 p-1.5">
                      <Zap className="h-4 w-4 text-primary" />
                    </div>
                    <div className="text-xs font-medium">Webhook</div>
                  </motion.div>
                  
                  <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.3, delay: 1 }}
                    className="absolute top-12 left-1/2 -translate-x-1/2 flex h-14 w-36 items-center gap-2 rounded-lg border-2 border-accent bg-card px-3 shadow-lg"
                  >
                    <div className="rounded bg-accent/20 p-1.5">
                      <Sparkles className="h-4 w-4 text-accent" />
                    </div>
                    <div className="text-xs font-medium">AI Process</div>
                  </motion.div>
                  
                  <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.3, delay: 1.2 }}
                    className="absolute top-12 right-16 flex h-14 w-36 items-center gap-2 rounded-lg border-2 border-secondary bg-card px-3 shadow-lg"
                  >
                    <div className="rounded bg-secondary/20 p-1.5">
                      <Workflow className="h-4 w-4 text-secondary" />
                    </div>
                    <div className="text-xs font-medium">Send Email</div>
                  </motion.div>
                  
                  {/* Connection lines */}
                  <svg className="absolute inset-0 w-full h-full pointer-events-none">
                    <motion.path
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ duration: 0.5, delay: 1.4 }}
                      d="M 152 58 Q 200 58 240 58"
                      fill="none"
                      stroke="hsl(var(--primary))"
                      strokeWidth="2"
                      strokeDasharray="5,5"
                    />
                    <motion.path
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ duration: 0.5, delay: 1.6 }}
                      d="M 310 58 Q 360 58 400 58"
                      fill="none"
                      stroke="hsl(var(--accent))"
                      strokeWidth="2"
                      strokeDasharray="5,5"
                    />
                  </svg>
                </div>
                
                {/* Properties panel */}
                <div className="col-span-2 rounded-lg bg-card border border-border p-4">
                  <div className="space-y-3">
                    <div className="h-6 w-20 rounded bg-muted" />
                    <div className="h-10 rounded bg-muted/50 border border-border" />
                    <div className="h-6 w-16 rounded bg-muted" />
                    <div className="h-10 rounded bg-muted/50 border border-border" />
                    <div className="h-6 w-24 rounded bg-muted" />
                    <div className="h-20 rounded bg-muted/50 border border-border" />
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Glow effect */}
          <div className="absolute -inset-x-20 -bottom-20 h-40 bg-gradient-to-t from-background to-transparent" />
        </motion.div>
      </div>
    </section>
  );
}
