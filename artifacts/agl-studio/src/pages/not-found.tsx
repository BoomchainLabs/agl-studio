import { Link } from "wouter";
import { AlertTriangle, Home } from "lucide-react";
import { motion } from "framer-motion";

export default function NotFound() {
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }} 
      animate={{ opacity: 1, scale: 1 }} 
      className="min-h-[70vh] flex items-center justify-center"
    >
      <div className="max-w-md w-full p-8 border border-destructive/30 bg-card/50 text-center relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-destructive" />
        
        <AlertTriangle className="h-16 w-16 text-destructive mx-auto mb-6 opacity-80" />
        
        <h1 className="text-4xl font-bold tracking-tighter uppercase text-destructive mb-2">404 Error</h1>
        <div className="font-mono text-sm text-destructive/80 mb-8 border border-destructive/20 bg-destructive/5 p-3">
          ERROR_CODE: ROUTE_NOT_FOUND
          <br/>
          DESTINATION: UNKNOWN
        </div>
        
        <p className="text-muted-foreground mb-8">
          The terminal sequence you requested does not exist on this network layer.
        </p>
        
        <Link href="/">
          <div className="inline-flex items-center gap-2 h-12 px-6 bg-primary/10 border border-primary/30 text-primary hover:bg-primary hover:text-primary-foreground font-bold text-sm tracking-widest uppercase transition-all cursor-pointer">
            <Home className="h-4 w-4" />
            Return to Dashboard
          </div>
        </Link>
      </div>
    </motion.div>
  );
}
