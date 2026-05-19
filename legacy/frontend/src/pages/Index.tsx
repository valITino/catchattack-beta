
import { useNavigate } from "react-router-dom";
import { Shield, ArrowRight, Terminal, FileCode2, Database, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-cyber-darker flex flex-col">
      <header className="border-b border-cyber-primary/20 p-5">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Shield className="h-6 w-6 text-cyber-primary" />
            <span className="font-bold text-xl">Detection-as-Code</span>
          </div>
          <Button 
            variant="outline" 
            className="border-cyber-primary text-cyber-primary hover:bg-cyber-primary hover:text-white"
            onClick={() => navigate('/dashboard')}
          >
            Launch Platform
          </Button>
        </div>
      </header>

      <main className="flex-grow">
        <section className="py-16 md:py-24 px-4 container mx-auto">
          <div className="text-center max-w-4xl mx-auto">
            <motion.h1 
              className="text-4xl md:text-6xl font-bold mb-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            >
              <span className="bg-gradient-to-r from-cyber-primary to-cyber-accent bg-clip-text text-transparent">
                Automate Detection from <br />Breach to SIEM
              </span>
            </motion.h1>
            
            <motion.p 
              className="text-xl text-gray-400 mb-10"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.8 }}
            >
              Turn adversary emulation into automated threat detection with sigma rule generation and SIEM integration
            </motion.p>

            <motion.div 
              className="flex flex-wrap gap-4 justify-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8, duration: 0.5 }}
            >
              <Button 
                size="lg"
                className="bg-cyber-primary hover:bg-cyber-primary/90 py-6 px-8"
                onClick={() => navigate('/dashboard')}
              >
                Start Securing Your Systems <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button 
                variant="outline" 
                size="lg"
                className="border-cyber-primary/50 text-cyber-primary hover:bg-cyber-primary/10 py-6 px-8"
              >
                View Documentation
              </Button>
            </motion.div>
            
            <motion.div 
              className="mt-16 p-6 border border-cyber-primary/30 rounded-lg bg-cyber-darker relative cyber-glow"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 1.2, duration: 0.5 }}
            >
              <div className="flex items-center gap-2 mb-2 text-cyber-primary">
                <Terminal className="h-5 w-5" />
                <span className="font-mono text-sm">sigma_rule_generator.py</span>
              </div>
              <pre className="text-left bg-cyber-darker p-4 rounded-md overflow-x-auto text-sm text-gray-300 font-mono">
{`# Generated Sigma Rule for PowerShell Encoded Command Detection
title: PowerShell Execution with Encoded Command
description: Detects PowerShell execution with encoded command parameter
status: experimental
author: Detection-as-Code Platform
date: 2025/04/10
logsource:
  product: windows
  service: powershell
detection:
  selection:
    EventID: 4104
    ScriptBlockText|contains:
      - "-enc "
      - "-EncodedCommand"
  condition: selection
falsepositives:
  - Administrative scripts
level: high
tags:
  - attack.execution
  - attack.t1059.001`}
              </pre>
            </motion.div>
          </div>
        </section>

        <section className="py-16 bg-cyber-dark">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold mb-12 text-center">End-to-End Detection Workflow</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              <FeatureCard 
                icon={<Terminal className="h-10 w-10 text-cyber-primary" />}
                title="Adversary Emulation"
                description="Configure and run emulations of real-world threat actors using MITRE ATT&CK framework"
              />
              <FeatureCard 
                icon={<Lock className="h-10 w-10 text-cyber-danger" />}
                title="Vulnerability Analysis"
                description="Automatically identify security gaps and attack vectors in your infrastructure"
              />
              <FeatureCard 
                icon={<FileCode2 className="h-10 w-10 text-cyber-accent" />}
                title="Sigma Rule Generation"
                description="Generate detection rules directly from discovered vulnerabilities and TTPs"
              />
              <FeatureCard 
                icon={<Database className="h-10 w-10 text-cyber-success" />}
                title="SIEM Integration"
                description="Deploy detection rules to Elasticsearch and other SIEM platforms with one click"
              />
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-cyber-primary/20 py-6 px-6">
        <div className="container mx-auto text-center text-sm text-gray-400">
          &copy; {new Date().getFullYear()} Detection-as-Code Platform. All rights reserved.
          <div className="mt-2 text-xs text-gray-500">
            Designed for security teams who want to automate their detection pipeline
          </div>
        </div>
      </footer>
    </div>
  );
};

const FeatureCard = ({ icon, title, description }: { 
  icon: React.ReactNode;
  title: string;
  description: string;
}) => {
  return (
    <motion.div 
      className="cyber-card p-6"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      viewport={{ once: true }}
    >
      <div className="mb-4">{icon}</div>
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-gray-400">{description}</p>
    </motion.div>
  );
};

export default Index;
