import { motion } from "framer-motion";
import {
  Zap,
  Brain,
  GitBranch,
  Database,
  Shield,
  Users,
  Clock,
  Code,
  Webhook,
  Layers,
  BarChart3,
  Globe,
} from "lucide-react";

const features = [
  {
    icon: Brain,
    title: "AI-Powered Nodes",
    description:
      "Connect to OpenAI GPT, Claude, Gemini, and more. Build intelligent workflows with state-of-the-art AI models.",
    color: "text-accent",
    bgColor: "bg-accent/10",
  },
  {
    icon: Zap,
    title: "Visual Workflow Builder",
    description:
      "Intuitive drag-and-drop interface. Build complex automations without writing a single line of code.",
    color: "text-primary",
    bgColor: "bg-primary/10",
  },
  {
    icon: Webhook,
    title: "Webhooks & Triggers",
    description:
      "Start workflows from HTTP requests, schedules, or custom events. Integrate with any system.",
    color: "text-secondary",
    bgColor: "bg-secondary/10",
  },
  {
    icon: GitBranch,
    title: "Advanced Logic",
    description:
      "Conditionals, loops, switches, and error handling. Build workflows as complex as you need.",
    color: "text-warning",
    bgColor: "bg-warning/10",
  },
  {
    icon: Database,
    title: "Data Transformation",
    description:
      "Parse JSON, process CSV, format text, and more. Transform data between any formats.",
    color: "text-success",
    bgColor: "bg-success/10",
  },
  {
    icon: Shield,
    title: "Enterprise Security",
    description:
      "SOC 2 compliant. End-to-end encryption. Role-based access control for teams.",
    color: "text-destructive",
    bgColor: "bg-destructive/10",
  },
  {
    icon: Users,
    title: "Team Collaboration",
    description:
      "Share workflows, collaborate in real-time, and manage permissions across your team.",
    color: "text-primary",
    bgColor: "bg-primary/10",
  },
  {
    icon: Clock,
    title: "Scheduled Execution",
    description:
      "Run workflows on a schedule with cron expressions. Automate recurring tasks effortlessly.",
    color: "text-accent",
    bgColor: "bg-accent/10",
  },
  {
    icon: Code,
    title: "Custom Code",
    description:
      "Write JavaScript functions when you need custom logic. Full flexibility when required.",
    color: "text-secondary",
    bgColor: "bg-secondary/10",
  },
  {
    icon: Layers,
    title: "Version Control",
    description:
      "Track changes, compare versions, and rollback anytime. Never lose your work.",
    color: "text-warning",
    bgColor: "bg-warning/10",
  },
  {
    icon: BarChart3,
    title: "Execution Analytics",
    description:
      "Monitor performance, track success rates, and debug with detailed execution logs.",
    color: "text-success",
    bgColor: "bg-success/10",
  },
  {
    icon: Globe,
    title: "50+ Integrations",
    description:
      "Connect to popular services like Slack, Email, databases, and more out of the box.",
    color: "text-destructive",
    bgColor: "bg-destructive/10",
  },
];

export function Features() {
  return (
    <section id="features" className="py-20 sm:py-32">
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
            Everything you need to{" "}
            <span className="text-gradient">automate</span>
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            A complete toolkit for building, managing, and scaling your workflow automations
          </p>
        </motion.div>

        {/* Features Grid */}
        <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.05 }}
              className="group relative rounded-2xl border border-border bg-card p-6 transition-all hover:border-primary/50 hover:shadow-lg"
            >
              <div
                className={`inline-flex h-12 w-12 items-center justify-center rounded-xl ${feature.bgColor}`}
              >
                <feature.icon className={`h-6 w-6 ${feature.color}`} />
              </div>
              <h3 className="mt-4 text-lg font-semibold">{feature.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
