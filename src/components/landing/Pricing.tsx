import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Check, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const plans = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    description: "Perfect for trying out CtrlChecks",
    features: [
      "5 workflows",
      "100 executions/month",
      "5 AI credits/month",
      "Community support",
      "Basic integrations",
    ],
    cta: "Get Started",
    popular: false,
  },
  {
    name: "Pro",
    price: "$29",
    period: "/month",
    description: "For individuals and small teams",
    features: [
      "Unlimited workflows",
      "10,000 executions/month",
      "500 AI credits/month",
      "Priority support",
      "All integrations",
      "Version history",
      "Team collaboration (5 members)",
      "Custom webhooks",
    ],
    cta: "Start Free Trial",
    popular: true,
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "",
    description: "For large organizations",
    features: [
      "Everything in Pro",
      "Unlimited executions",
      "Unlimited AI credits",
      "24/7 dedicated support",
      "SSO & SAML",
      "Custom integrations",
      "SLA guarantee",
      "On-premise deployment",
      "Audit logs",
    ],
    cta: "Contact Sales",
    popular: false,
  },
];

export function Pricing() {
  return (
    <section id="pricing" className="py-20 sm:py-32">
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
            Simple, transparent <span className="text-gradient">pricing</span>
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Start free and scale as you grow. No hidden fees.
          </p>
        </motion.div>

        {/* Pricing Cards */}
        <div className="mt-16 grid gap-8 lg:grid-cols-3">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className={cn(
                "relative rounded-2xl border bg-card p-8",
                plan.popular
                  ? "border-primary shadow-xl shadow-primary/10"
                  : "border-border"
              )}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <span className="inline-flex items-center gap-1 rounded-full gradient-primary px-4 py-1 text-sm font-medium text-primary-foreground">
                    <Sparkles className="h-4 w-4" />
                    Most Popular
                  </span>
                </div>
              )}

              <div className="text-center">
                <h3 className="text-xl font-semibold">{plan.name}</h3>
                <div className="mt-4 flex items-baseline justify-center gap-1">
                  <span className="text-4xl font-bold">{plan.price}</span>
                  <span className="text-muted-foreground">{plan.period}</span>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  {plan.description}
                </p>
              </div>

              <ul className="mt-8 space-y-3">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-3">
                    <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10">
                      <Check className="h-3 w-3 text-primary" />
                    </div>
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-8">
                <Button
                  asChild
                  className={cn(
                    "w-full",
                    plan.popular
                      ? "gradient-primary text-primary-foreground hover:opacity-90"
                      : ""
                  )}
                  variant={plan.popular ? "default" : "outline"}
                >
                  <Link to="/signup">{plan.cta}</Link>
                </Button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
