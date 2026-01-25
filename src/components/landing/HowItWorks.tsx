import { motion } from "framer-motion";
import { MousePointerClick, Settings2, Rocket, BarChart } from "lucide-react";

const steps = [
  {
    number: "01",
    icon: MousePointerClick,
    title: "Drag & Drop Nodes",
    description:
      "Choose from 50+ pre-built nodes including AI models, integrations, and logic operators. Simply drag them onto your canvas.",
  },
  {
    number: "02",
    icon: Settings2,
    title: "Configure & Connect",
    description:
      "Connect nodes together to define your workflow. Configure each node with your specific parameters and credentials.",
  },
  {
    number: "03",
    icon: Rocket,
    title: "Test & Deploy",
    description:
      "Test your workflow with sample data. Once verified, deploy it with a single click. Set up triggers for automatic execution.",
  },
  {
    number: "04",
    icon: BarChart,
    title: "Monitor & Iterate",
    description:
      "Track execution metrics, debug issues with detailed logs, and continuously improve your workflows based on performance data.",
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="py-20 sm:py-32 bg-muted/30">
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
            How it <span className="text-gradient">works</span>
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Get started in minutes. No coding experience required.
          </p>
        </motion.div>

        {/* Steps */}
        <div className="mt-16 grid gap-8 lg:grid-cols-4">
          {steps.map((step, index) => (
            <motion.div
              key={step.number}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="relative"
            >
              {/* Connector line */}
              {index < steps.length - 1 && (
                <div className="absolute top-12 left-1/2 hidden h-0.5 w-full bg-gradient-to-r from-primary/50 to-transparent lg:block" />
              )}

              <div className="relative flex flex-col items-center text-center">
                {/* Number badge */}
                <div className="relative">
                  <div className="flex h-24 w-24 items-center justify-center rounded-2xl border border-border bg-card shadow-lg">
                    <step.icon className="h-10 w-10 text-primary" />
                  </div>
                  <span className="absolute -top-3 -right-3 flex h-8 w-8 items-center justify-center rounded-full gradient-primary text-sm font-bold text-primary-foreground">
                    {step.number}
                  </span>
                </div>

                <h3 className="mt-6 text-xl font-semibold">{step.title}</h3>
                <p className="mt-2 text-muted-foreground">{step.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
