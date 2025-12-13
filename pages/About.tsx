
import React from 'react';
import { motion } from 'framer-motion';
import { PageReadyTracker } from '../components/PageReadyTracker';
import { staggerContainer, fadeInUp, buttonTap } from '../utils/animations';
import { 
  Zap, Wifi, Cpu, Layers, Globe, Mail, ArrowRight, 
  Terminal, Shield, Database, Activity, GitBranch, 
  Server, Lock, Code, Hash 
} from 'lucide-react';
import { Link } from 'react-router-dom';

const SysStat = ({ label, value, color = "text-charcoal-900 dark:text-white" }: { label: string, value: string, color?: string }) => (
  <div className="flex flex-col">
    <span className="text-[10px] font-mono uppercase text-charcoal-400 dark:text-charcoal-500 tracking-wider mb-1">{label}</span>
    <span className={`font-mono font-bold text-sm ${color}`}>{value}</span>
  </div>
);

const TechModule = ({ name, version, type }: { name: string, version: string, type: string }) => (
  <div className="flex items-center justify-between p-3 border-b border-slate-100 dark:border-charcoal-800 last:border-0 hover:bg-slate-50 dark:hover:bg-charcoal-800 transition-colors font-mono text-xs">
    <div className="flex items-center gap-3">
      <div className="w-1.5 h-1.5 rounded-full bg-brand-purple/50"></div>
      <span className="text-charcoal-700 dark:text-slate-300 font-bold">{name}</span>
    </div>
    <div className="flex items-center gap-4">
      <span className="text-charcoal-400">{type}</span>
      <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-charcoal-700 text-charcoal-600 dark:text-slate-400">{version}</span>
    </div>
  </div>
);

export const About: React.FC = () => {
  return (
    <div className="flex-1 w-full overflow-y-auto custom-scrollbar bg-slate-50 dark:bg-charcoal-950 relative">
      <PageReadyTracker />
      
      {/* Technical Grid Background */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.03] dark:opacity-[0.05]" 
           style={{ backgroundImage: 'linear-gradient(#64748b 1px, transparent 1px), linear-gradient(to right, #64748b 1px, transparent 1px)', backgroundSize: '40px 40px' }} 
      />

      <div className="relative z-10 max-w-6xl mx-auto px-6 py-12 md:py-20">
        
        {/* --- HEADER: SYSTEM MANIFEST --- */}
        <motion.div 
          variants={staggerContainer}
          initial="hidden"
          animate="show"
          className="mb-16"
        >
          <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-6 border-b border-slate-200 dark:border-charcoal-800 pb-8">
            <div>
              <motion.div variants={fadeInUp} className="flex items-center gap-2 text-brand-purple mb-4">
                <Terminal size={16} />
                <span className="font-mono text-xs font-bold uppercase tracking-widest">System_Manifest_v1.0</span>
              </motion.div>
              <motion.h1 variants={fadeInUp} className="text-4xl md:text-5xl font-heading font-extrabold text-charcoal-900 dark:text-white tracking-tight leading-tight">
                Architecture <br className="hidden md:block" />
                <span className="text-charcoal-400 dark:text-charcoal-600">Overview</span>
              </motion.h1>
            </div>
            
            <motion.div variants={fadeInUp} className="flex gap-8 md:gap-12 bg-white dark:bg-charcoal-900 p-4 rounded-xl border border-slate-200 dark:border-charcoal-800 shadow-sm">
               <SysStat label="Latency" value="0ms (Local)" color="text-green-500" />
               <SysStat label="Environment" value="Browser / PWA" />
               <SysStat label="Security" value="Isolated" color="text-brand-purple" />
            </motion.div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-12">
          
          {/* --- COL 1: MISSION LOG (8 cols) --- */}
          <div className="lg:col-span-8 flex flex-col gap-6">
             
             {/* Main Mission Card */}
             <motion.div 
               initial={{ opacity: 0, y: 20 }}
               whileInView={{ opacity: 1, y: 0 }}
               viewport={{ once: true }}
               className="bg-white dark:bg-charcoal-900 rounded-xl border border-slate-200 dark:border-charcoal-800 overflow-hidden shadow-sm"
             >
                <div className="bg-slate-50 dark:bg-charcoal-850 px-4 py-2 border-b border-slate-200 dark:border-charcoal-800 flex items-center justify-between">
                   <div className="flex items-center gap-2">
                      <Activity size={14} className="text-brand-blue" />
                      <span className="font-mono text-xs font-bold text-charcoal-600 dark:text-slate-400 uppercase">Protocol: Privacy_First</span>
                   </div>
                   <div className="flex gap-1.5">
                      <div className="w-2 h-2 rounded-full bg-slate-300 dark:bg-charcoal-600"></div>
                      <div className="w-2 h-2 rounded-full bg-slate-300 dark:bg-charcoal-600"></div>
                   </div>
                </div>
                <div className="p-6 md:p-8">
                   <p className="text-base md:text-lg text-charcoal-700 dark:text-slate-300 leading-relaxed font-mono">
                      <span className="text-brand-purple">➜</span> EZtify executes all operations within the client's local memory stack.<br/><br/>
                      <span className="text-brand-purple">➜</span> Traditional web utilities offload processing to remote servers, introducing latency and privacy vectors. We utilize <span className="font-bold text-charcoal-900 dark:text-white">WebAssembly</span> binaries to port desktop-grade performance directly to the browser runtime.<br/><br/>
                      <span className="text-brand-purple">➜</span> Result: Zero data egress. Instantaneous feedback loops. Offline persistence.
                   </p>
                </div>
             </motion.div>

             {/* Stack Grid */}
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Tech Stack */}
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  className="bg-white dark:bg-charcoal-900 rounded-xl border border-slate-200 dark:border-charcoal-800 overflow-hidden shadow-sm"
                >
                   <div className="bg-slate-50 dark:bg-charcoal-850 px-4 py-2 border-b border-slate-200 dark:border-charcoal-800 flex items-center gap-2">
                      <GitBranch size={14} className="text-charcoal-400" />
                      <span className="font-mono text-xs font-bold text-charcoal-600 dark:text-slate-400 uppercase">Dependencies</span>
                   </div>
                   <div className="p-0">
                      <TechModule name="React" version="19.0.0" type="Core" />
                      <TechModule name="Vite" version="6.0.7" type="Build" />
                      <TechModule name="PDF-Lib" version="1.17.1" type="Engine" />
                      <TechModule name="Framer Motion" version="12.0.0" type="UX" />
                      <TechModule name="WASM" version="Native" type="Kernel" />
                   </div>
                </motion.div>

                {/* Features / Capabilities */}
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  className="bg-white dark:bg-charcoal-900 rounded-xl border border-slate-200 dark:border-charcoal-800 overflow-hidden shadow-sm"
                >
                   <div className="bg-slate-50 dark:bg-charcoal-850 px-4 py-2 border-b border-slate-200 dark:border-charcoal-800 flex items-center gap-2">
                      <Cpu size={14} className="text-charcoal-400" />
                      <span className="font-mono text-xs font-bold text-charcoal-600 dark:text-slate-400 uppercase">Capabilities</span>
                   </div>
                   <div className="p-4 grid grid-cols-2 gap-4">
                      <div className="p-3 bg-slate-50 dark:bg-charcoal-850 rounded-lg border border-slate-100 dark:border-charcoal-700">
                         <div className="text-brand-purple mb-2"><Zap size={20} /></div>
                         <div className="font-bold text-sm text-charcoal-900 dark:text-white">Zero Latency</div>
                         <div className="text-[10px] text-charcoal-500 mt-1">No network RTT overhead</div>
                      </div>
                      <div className="p-3 bg-slate-50 dark:bg-charcoal-850 rounded-lg border border-slate-100 dark:border-charcoal-700">
                         <div className="text-brand-blue mb-2"><Lock size={20} /></div>
                         <div className="font-bold text-sm text-charcoal-900 dark:text-white">Encrypted</div>
                         <div className="text-[10px] text-charcoal-500 mt-1">AES-256 Support</div>
                      </div>
                      <div className="p-3 bg-slate-50 dark:bg-charcoal-850 rounded-lg border border-slate-100 dark:border-charcoal-700">
                         <div className="text-brand-green mb-2"><Database size={20} /></div>
                         <div className="font-bold text-sm text-charcoal-900 dark:text-white">Local I/O</div>
                         <div className="text-[10px] text-charcoal-500 mt-1">Direct memory access</div>
                      </div>
                      <div className="p-3 bg-slate-50 dark:bg-charcoal-850 rounded-lg border border-slate-100 dark:border-charcoal-700">
                         <div className="text-brand-orange mb-2"><Wifi size={20} /></div>
                         <div className="font-bold text-sm text-charcoal-900 dark:text-white">Offline</div>
                         <div className="text-[10px] text-charcoal-500 mt-1">PWA Service Workers</div>
                      </div>
                   </div>
                </motion.div>
             </div>
          </div>

          {/* --- COL 2: STATUS SIDEBAR (4 cols) --- */}
          <div className="lg:col-span-4 space-y-6">
             
             {/* Server Status Widget */}
             <motion.div 
               initial={{ opacity: 0, x: 20 }}
               whileInView={{ opacity: 1, x: 0 }}
               viewport={{ once: true }}
               className="bg-charcoal-900 text-white rounded-xl border border-charcoal-800 overflow-hidden shadow-lg p-5 font-mono text-xs relative"
             >
                <div className="absolute top-0 right-0 p-2 opacity-20"><Server size={64} /></div>
                
                <h3 className="text-charcoal-400 font-bold uppercase tracking-wider mb-4">Network_Topography</h3>
                
                <div className="space-y-4 relative z-10">
                   <div className="flex justify-between items-center pb-2 border-b border-charcoal-700">
                      <span>Server Uploads</span>
                      <span className="text-red-400 font-bold">DISABLED</span>
                   </div>
                   <div className="flex justify-between items-center pb-2 border-b border-charcoal-700">
                      <span>Tracking Pixels</span>
                      <span className="text-red-400 font-bold">BLOCKED</span>
                   </div>
                   <div className="flex justify-between items-center pb-2 border-b border-charcoal-700">
                      <span>Client Execution</span>
                      <span className="text-green-400 font-bold">ACTIVE</span>
                   </div>
                   <div className="mt-4 p-3 bg-charcoal-800 rounded border border-charcoal-700 text-charcoal-300 leading-relaxed">
                      > All file processing logic is contained within the application bundle. No external API calls required.
                   </div>
                </div>
             </motion.div>

             {/* Contact Terminal */}
             <motion.div 
               initial={{ opacity: 0, x: 20 }}
               whileInView={{ opacity: 1, x: 0 }}
               viewport={{ once: true }}
               transition={{ delay: 0.1 }}
               className="bg-white dark:bg-charcoal-900 rounded-xl border border-slate-200 dark:border-charcoal-800 p-5 font-mono text-sm shadow-sm"
             >
                <div className="flex items-center gap-2 mb-4 text-charcoal-400 dark:text-slate-500 uppercase font-bold text-xs tracking-wider">
                   <Mail size={14} /> Communication_Link
                </div>
                <p className="text-charcoal-600 dark:text-slate-300 mb-6 text-xs">
                   Found a bug in the matrix? Need a feature upgrade? Initiate transmission.
                </p>
                <div className="flex flex-col gap-3">
                   <Link to="/" className="w-full">
                      <motion.button 
                        whileTap={buttonTap}
                        className="w-full py-3 bg-slate-100 dark:bg-charcoal-800 hover:bg-slate-200 dark:hover:bg-charcoal-700 text-charcoal-800 dark:text-white font-bold rounded-lg transition-colors flex items-center justify-center gap-2 text-xs uppercase tracking-wide border border-slate-200 dark:border-charcoal-700"
                      >
                         <ArrowRight size={14} /> Return_Dashboard
                      </motion.button>
                   </Link>
                   <a href="mailto:eztifyapps@gmail.com" className="w-full">
                      <motion.button 
                        whileTap={buttonTap}
                        className="w-full py-3 bg-brand-purple text-white hover:bg-brand-purpleDark font-bold rounded-lg transition-colors flex items-center justify-center gap-2 text-xs uppercase tracking-wide shadow-lg shadow-brand-purple/20"
                      >
                         <Hash size={14} /> Open_Channel
                      </motion.button>
                   </a>
                </div>
             </motion.div>

          </div>
        </div>

        {/* Footer Hash */}
        <div className="text-center pt-12 border-t border-slate-200 dark:border-charcoal-800 font-mono text-[10px] text-charcoal-400 dark:text-charcoal-600 uppercase tracking-widest">
           ID: {Math.random().toString(36).substr(2, 9).toUpperCase()} // END_OF_FILE
        </div>

      </div>
    </div>
  );
};
