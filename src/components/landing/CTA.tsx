import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

export function CTA() {
  return (
    <section className="py-20 sm:py-32">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="relative overflow-hidden rounded-3xl gradient-primary p-8 sm:p-16"
        >
          {/* Background decorations */}
          <div className="absolute inset-0 opacity-20">
            <div className="absolute -top-20 -right-20 h-80 w-80 rounded-full bg-white/20 blur-3xl" />
            <div className="absolute -bottom-20 -left-20 h-80 w-80 rounded-full bg-white/20 blur-3xl" />
          </div>

          <div className="relative mx-auto max-w-2xl text-center">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/20 px-4 py-1.5">
              <Sparkles className="h-4 w-4 text-white" />
              <span className="text-sm font-medium text-white">
                Start automating today
              </span>
            </div>

            <h2 className="mt-6 text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl">
              Ready to supercharge your workflows?
            </h2>

            <p className="mt-4 text-lg text-white/80">
              Join thousands of teams using CtrlChecks to automate their work.
              Get started for free, no credit card required.
            </p>

            <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Button
                size="lg"
                asChild
                className="bg-white text-primary hover:bg-white/90"
              >
                <Link to="/signup">
                  Get Started Free
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                asChild
                className="border-white/30 bg-transparent text-white hover:bg-white/10"
              >
                <Link to="/signin">Talk to Sales</Link>
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
