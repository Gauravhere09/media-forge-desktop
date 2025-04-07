
import React, { useState } from "react";
import { Link } from "react-router-dom";
import { 
  Settings,
  FileText, 
  Mic, 
  Image as ImageIcon, 
  Video, 
  ChevronLeft, 
  ChevronRight
} from "lucide-react";
import { cn } from "@/lib/utils";

const Sidebar: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);

  const navigation = [
    { name: "Script", icon: FileText, to: "/script" },
    { name: "Voice", icon: Mic, to: "/voice" },
    { name: "Image", icon: ImageIcon, to: "/image" },
    { name: "Video", icon: Video, to: "/video" },
    { name: "Settings", icon: Settings, to: "/settings" },
  ];

  return (
    <div
      className={cn(
        "h-screen bg-card border-r border-border transition-all duration-300 flex flex-col",
        collapsed ? "w-16" : "w-64"
      )}
    >
      <div className="flex items-center justify-between p-4 border-b border-border">
        {!collapsed && (
          <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-accent text-transparent bg-clip-text">
            MediaForge
          </h1>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
        >
          {collapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
        </button>
      </div>

      <nav className="flex-1 py-6 space-y-1 overflow-y-auto">
        {navigation.map((item) => (
          <Link
            key={item.name}
            to={item.to}
            className={cn(
              "flex items-center px-4 py-3 text-sm font-medium rounded-md hover:bg-muted hover:text-primary transition-colors",
              collapsed ? "justify-center" : "space-x-3"
            )}
          >
            <item.icon size={20} />
            {!collapsed && <span>{item.name}</span>}
          </Link>
        ))}
      </nav>

      <div className="p-4 border-t border-border">
        <div className={cn(
          "flex items-center",
          collapsed ? "justify-center" : "space-x-3"
        )}>
          <div className="w-8 h-8 rounded-full bg-gradient-to-r from-primary to-accent"></div>
          {!collapsed && (
            <div>
              <p className="text-sm font-medium">Local User</p>
              <p className="text-xs text-muted-foreground">Desktop App</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
