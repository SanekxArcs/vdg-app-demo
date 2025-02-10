"use client";

import { Layout } from "@/components/layout/layout";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  Package,
  BarChart2,
  Shield,
  Clock,
  CheckCircle,
  Users,
} from "lucide-react";
import Link from "next/link";

const features = [
  {
    icon: Package,
    title: "Inventory Management",
    description:
      "Track materials and stock levels in real-time with automated alerts and reordering.",
  },
  {
    icon: BarChart2,
    title: "Project Analytics",
    description:
      "Gain insights into project performance with detailed analytics and reporting.",
  },
  {
    icon: Shield,
    title: "Quality Control",
    description:
      "Ensure quality standards with comprehensive checklists and documentation.",
  },
  {
    icon: Clock,
    title: "Time Tracking",
    description:
      "Monitor project timelines and deadlines with automated scheduling.",
  },
  {
    icon: CheckCircle,
    title: "Task Management",
    description:
      "Organize and track tasks with customizable workflows and priorities.",
  },
  {
    icon: Users,
    title: "Team Collaboration",
    description:
      "Enable seamless communication and file sharing between team members.",
  },
];

const testimonials = [
  {
    quote:
      "This system has transformed how we manage our construction projects. The efficiency gains are remarkable.",
    author: "Sarah Johnson",
    role: "Project Manager",
    company: "BuildTech Solutions",
  },
  {
    quote:
      "The material tracking features have helped us reduce waste and optimize our inventory levels.",
    author: "Michael Chen",
    role: "Operations Director",
    company: "Global Construction Corp",
  },
];

const stats = [
  { value: "98%", label: "Project Success Rate" },
  { value: "45%", label: "Cost Reduction" },
  { value: "2x", label: "Faster Delivery" },
  { value: "24/7", label: "Support Available" },
];

export default function Home() {
  return (
    <Layout>
      {/* Hero Section */}
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-primary/5 pointer-events-none" />
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-32">
          <div className="text-center space-y-8">
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
              Streamline Your Material
              <span className="text-primary block">Management Process</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Efficiently manage your materials, track projects, and optimize
              your workflow with our comprehensive management solution.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/dashboard">
                <Button size="lg" className="w-full sm:w-auto">
                  Get Started
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Button size="lg" variant="outline" className="w-full sm:w-auto">
                Schedule Demo
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="bg-primary/5 py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-primary">
                  {stat.value}
                </div>
                <div className="text-sm text-muted-foreground mt-1">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-24 bg-background">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold">
              Powerful Features for Modern Projects
            </h2>
            <p className="text-muted-foreground mt-4 max-w-2xl mx-auto">
              Our comprehensive suite of tools helps you manage every aspect of
              your projects efficiently.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="p-6 rounded-lg border bg-card">
                <feature.icon className="h-12 w-12 text-primary mb-4" />
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Testimonials Section */}
      <div className="bg-primary/5 py-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold">Trusted by Industry Leaders</h2>
            <p className="text-muted-foreground mt-4 max-w-2xl mx-auto">
              See what our customers have to say about their experience with our
              platform.
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-8">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="bg-background p-8 rounded-lg border">
                <p className="text-lg italic mb-6">
                  &ldquo;{testimonial.quote}&rdquo;
                </p>
                <div>
                  <div className="font-semibold">{testimonial.author}</div>
                  <div className="text-sm text-muted-foreground">
                    {testimonial.role} at {testimonial.company}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-24 bg-background">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Get Started?</h2>
          <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
            Join thousands of companies already using our platform to streamline
            their material management process.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/dashboard">
              <Button size="lg" className="w-full sm:w-auto">
                Start Free Trial
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Button size="lg" variant="outline" className="w-full sm:w-auto">
              Contact Sales
            </Button>
          </div>
        </div>
      </div>
    </Layout>
  );
}
