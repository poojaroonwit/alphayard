"use client";

import React, { useState } from "react";
import { 
  FloatingMenu,
  Carousel,
  Accordion,
  NotificationBadge,
  MetricCard,
  Drawer,
  Sparkline,
  Rating,
  Slider,
  InfiniteScroll,
  StatusIndicator,
  ChipField,
  AvatarGroup,
  StatisticRoll,
  SortableList,
  Timeline,
  TimelineItem,
  Tabbar,
  SkeletonWrapper,
  MobileSkeleton,
  GlassCard,
  ToggleSwitch,
  Button,
  Card,
  CardBody,
  BottomSheet, 
  FloatingActionButton, 
  SegmentedControl, 
  PullToRefresh, 
  SwipeableListItem,
  ActionSheet,
  Stepper,
  OTPInput,
  ProgressRing,
  SearchOverlay
} from "./index";
import { 
  Plus, Trash2, Edit2, Share2, Info, RefreshCw, MoreHorizontal, 
  Search, Settings, Home, Bell, User, Layout, Activity, Hash, 
  Users, TrendingUp, GripVertical, ChevronDown, Package, Shield, 
  Zap, Globe, MessageSquare, Heart, Star, Cloud, CheckCircle
} from "lucide-react";
// @ts-ignore
import { DndProvider } from 'react-dnd';
// @ts-ignore
import { HTML5Backend } from 'react-dnd-html5-backend';

export const MobileComponentsDemo = () => {
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isActionSheetOpen, setIsActionSheetOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isToggleOn, setIsToggleOn] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(2);
  const [activeTab, setActiveTab] = useState("home");
  const [otpComplete, setOtpComplete] = useState(false);
  const [segment, setSegment] = useState("all");
  const [rating, setRating] = useState(4);
  const [sliderValue, setSliderValue] = useState(75);
  const [chips, setChips] = useState(["UI", "Mobile", "Next.js"]);
  const [items, setItems] = useState([
    { id: 1, title: "Initial Task", description: "The beginning of the journey" },
    { id: 2, title: "Feature Polish", description: "Adding the final touches" },
    { id: 3, title: "Market Ready", description: "Deploying to production" },
  ]);
  const [sortableItems, setSortableItems] = useState([
    { id: "s1", content: "Architecture Review" },
    { id: "s2", content: "Mobile UI Polish" },
    { id: "s3", content: "Backend Integration" },
  ]);

  const handleRefresh = async () => {
    setIsLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setItems((prev) => [...prev]);
    setIsLoading(false);
  };

  const removeItem = (id: number) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-950 p-4 pb-48">
      {/* Header with Status Indictors */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-1 tracking-tight">Admin Ultimate</h2>
          <div className="flex items-center gap-3">
             <StatusIndicator status="online" label="System Live" pulse size="sm" />
             <p className="text-slate-400 text-[10px] uppercase font-black tracking-widest">30 Components</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <NotificationBadge count={5} ping variant="indigo">
            <button className="p-2.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
               <Bell className="h-5 w-5 text-slate-600 dark:text-slate-400" />
            </button>
          </NotificationBadge>
          <FloatingMenu
            trigger={
              <button className="p-2.5 rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-lg">
                <Plus className="h-5 w-5" />
              </button>
            }
            items={[
              { id: "1", label: "New Report", icon: <TrendingUp size={16}/>, onClick: () => {} },
              { id: "2", label: "Advanced UI", icon: <Layout size={16}/>, onClick: () => setIsDrawerOpen(true) },
              { id: "3", label: "Global Search", icon: <Search size={16}/>, onClick: () => setIsSearchOpen(true) },
            ]}
          />
        </div>
      </div>

      {/* Hero Sparkline Section */}
      <section className="mb-8 p-6 rounded-3xl bg-indigo-600 dark:bg-indigo-500 shadow-xl shadow-indigo-500/20 text-white relative overflow-hidden">
        <div className="relative z-10 flex items-end justify-between">
           <div>
              <p className="text-[10px] uppercase font-black tracking-widest text-indigo-100 opacity-80">Network Performance</p>
              <h3 className="text-4xl font-black tracking-tighter mt-1">99.8<span className="text-xl opacity-50">%</span></h3>
           </div>
           <Sparkline 
              data={[20, 45, 28, 65, 45, 80, 70, 95]} 
              width={140} 
              height={60} 
              color="white" 
              strokeWidth={3}
              fill
           />
        </div>
        <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-3xl pointer-events-none" />
      </section>

      {/* Feature Navigation Carousel */}
      <section className="mb-8">
        <Carousel showArrows={false} autoPlay interval={5000}>
           <div className="p-1">
              <GlassCard gradient className="h-44 flex flex-col justify-center p-8 text-center">
                 <h4 className="text-lg font-black text-indigo-600 dark:text-indigo-400 tracking-tight">PHASE 7 COMPLETE</h4>
                 <p className="mt-2 text-sm text-slate-500 leading-relaxed font-medium">All 30 premium components are now integrated and production-ready.</p>
              </GlassCard>
           </div>
           <div className="p-1">
              <GlassCard gradient className="h-44 flex flex-col justify-center p-8 text-center border-none" variant="indigo">
                 <h4 className="text-lg font-black text-white tracking-tight">MOBILE FIRST ARCHITECTURE</h4>
                 <p className="mt-2 text-sm text-indigo-100 leading-relaxed font-medium">Optimised for performance with zero external heavy dependencies.</p>
              </GlassCard>
           </div>
        </Carousel>
      </section>

      {/* Input Controls Grid */}
      <section className="mb-8 grid grid-cols-1 md:grid-cols-2 gap-4">
        <GlassCard className="p-6">
           <Slider 
              label="System Load Limit" 
              value={sliderValue} 
              onChange={setSliderValue} 
              variant="indigo" 
           />
        </GlassCard>
        <GlassCard className="p-6 flex items-center justify-between">
           <div>
              <p className="text-[10px] uppercase font-black text-slate-400 tracking-widest mb-1">Feedback Score</p>
              <Rating value={rating} onChange={setRating} size={24} />
           </div>
           <div className="text-right">
              <p className="text-2xl font-black dark:text-white">{rating}/5</p>
              <p className="text-[10px] text-green-500 font-bold">TOP RATED</p>
           </div>
        </GlassCard>
      </section>

      {/* Metric Visuals Grid */}
      <section className="mb-8 grid grid-cols-2 gap-4">
        <MetricCard 
          title="Active Sessions" 
          value="1,284" 
          variant="primary"
          icon={<Users size={20} />}
          trend={{ value: "8%", isUp: true }}
        />
        <MetricCard 
          title="Server Health" 
          value="Stable" 
          variant="success"
          icon={<Cloud size={20} />}
          sparkle
        />
      </section>

      {/* Detail Stats Section */}
      <section className="mb-8 grid grid-cols-1 md:grid-cols-2 gap-4">
        <GlassCard gradient className="p-6">
          <StatisticRoll label="Total Downloads" value={84.2} suffix="k" trend="up" decimals={1} />
          <div className="mt-6 flex items-center justify-between border-t border-slate-100 dark:border-slate-800 pt-4">
            <AvatarGroup 
              size="sm"
              avatars={[
                { name: "User 1", src: "https://i.pravatar.cc/150?u=11" },
                { name: "User 2", src: "https://i.pravatar.cc/150?u=22" },
                { name: "User 3", src: "https://i.pravatar.cc/150?u=33" },
                { name: "User 4" },
              ]}
            />
            <StatusIndicator status="success" label="Secure" size="sm" />
          </div>
        </GlassCard>
        
        <div className="space-y-4">
          <ChipField 
            label="Project Metadata" 
            chips={chips} 
            onChange={setChips} 
            variant="indigo"
          />
          <GlassCard className="p-5 flex items-center justify-between">
             <div>
                <span className="block text-sm font-bold text-slate-900 dark:text-white tracking-tight">Haptic Feedback</span>
                <span className="text-[10px] text-indigo-500 font-bold uppercase tracking-widest">Enhanced UI</span>
             </div>
             <ToggleSwitch checked={isToggleOn} onChange={setIsToggleOn} variant="indigo" />
          </GlassCard>
        </div>
      </section>

      {/* Collapsible Info Section */}
      <section className="mb-8">
        <h3 className="text-[10px] uppercase font-black text-slate-400 tracking-widest mb-3 px-1">System Architecture FAQ</h3>
        <Accordion 
          items={[
            { id: "1", title: "Batch 6 Components Overview", content: "Batch 6 adds high-impact visualization (Sparklines), user feedback (Rating), and better input controls (Sliders)." },
            { id: "2", title: "Deployment Status", content: "All components have been verified across different mobile viewports and support dark/light modes out of the box." },
          ]}
        />
      </section>

      {/* Swipeable & Pull List */}
      <section className="overflow-hidden rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm mb-8">
        <h3 className="p-5 border-b border-slate-100 dark:border-slate-800 text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center justify-between">
          <span>Swiper Tasks</span>
          <div className="flex items-center gap-2">
             <button onClick={() => setIsActionSheetOpen(true)} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors">
               <MoreHorizontal className="h-4 w-4" />
             </button>
          </div>
        </h3>
        <PullToRefresh onRefresh={handleRefresh} className="h-[280px]">
          <div className="divide-y divide-slate-50 dark:divide-slate-800/50">
            {items.map((item) => (
              <SwipeableListItem
                key={item.id}
                rightActions={[{ label: "Delete", icon: <Trash2 className="h-4 w-4" />, color: "bg-red-500", onClick: () => removeItem(item.id) }]}
                leftActions={[{ label: "Edit", icon: <Edit2 className="h-4 w-4" />, color: "bg-blue-500", onClick: () => setIsSheetOpen(true) }]}
              >
                <div className="p-5 flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-white tracking-tight">{item.title}</h4>
                    <p className="text-xs text-slate-500 mt-0.5">{item.description}</p>
                  </div>
                  <CheckCircle className="text-slate-200 dark:text-slate-800" size={20} />
                </div>
              </SwipeableListItem>
            ))}
            <InfiniteScroll 
               isLoading={false} 
               hasMore={false} 
               onLoadMore={() => {}} 
               className="py-4 border-t border-slate-50 dark:border-slate-800/50"
            />
          </div>
        </PullToRefresh>
      </section>

       {/* Timeline & Reorder Section */}
      <section className="mb-8 grid grid-cols-1 md:grid-cols-2 gap-6">
        <GlassCard className="p-6">
           <h3 className="text-[10px] uppercase font-black text-slate-400 tracking-widest mb-6">Execution Order</h3>
           <DndProvider backend={HTML5Backend}>
              <SortableList
                items={sortableItems}
                keyExtractor={(it) => it.id}
                onOrderChange={setSortableItems}
                renderItem={(it) => (
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-slate-900 dark:text-white">{it.content}</span>
                    <span className="text-[10px] font-black text-indigo-500 tracking-tighter uppercase">PID: {it.id}</span>
                  </div>
                )}
              />
            </DndProvider>
        </GlassCard>
        <GlassCard className="p-6">
           <h3 className="text-[10px] uppercase font-black text-slate-400 tracking-widest mb-6">Live Events</h3>
           <Timeline>
              <TimelineItem 
                title="System Milestone" 
                time="2m ago" 
                status="success"
                description="30 components reached successfully."
                icon={<Package className="h-full w-full" />}
              />
              <TimelineItem 
                title="Review Stage" 
                time="1h ago" 
                status="warning"
                description="Waiting for user sign-off."
                icon={<Star className="h-full w-full" />}
                isLast
              />
           </Timeline>
        </GlassCard>
      </section>

      {/* Global Overlays and DRAWER */}
      <FloatingActionButton
        icon={<TrendingUp />}
        label="Analytics"
        onClick={() => setIsDrawerOpen(true)}
      />

      <ActionSheet
        isOpen={isActionSheetOpen}
        onClose={() => setIsActionSheetOpen(false)}
        title="Quick Menu"
        options={[
          { label: "Export PDF", icon: <Share2 className="h-5 w-5 text-slate-500" />, onClick: () => {} },
          { label: "Support", icon: <MessageSquare className="h-5 w-5 text-slate-500" />, onClick: () => {} },
          { label: "Close Panel", variant: "danger", onClick: () => setIsActionSheetOpen(false) },
        ]}
      />

      <SearchOverlay
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onSearch={(q: string) => console.log("Searching for:", q)}
        recentSearches={["Phase 7", "Sparklines", "30 Components"]}
      />

      <BottomSheet
        isOpen={isSheetOpen}
        onClose={() => setIsSheetOpen(false)}
        title="Admin Control"
      >
        <div className="space-y-6 pb-6 text-center px-6">
           <div className="flex flex-col items-center gap-3">
              <div className="w-20 h-20 rounded-3xl bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-100 dark:border-indigo-800 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                <Settings size={40} />
              </div>
              <h4 className="text-xl font-black dark:text-white tracking-tighter">PREFERENCES</h4>
           </div>
           <p className="text-sm text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
              Global settings for the mobile UI kit and dashboard interactions.
           </p>
           <div className="grid grid-cols-1 gap-3">
              <Button variant="primary" className="py-4 rounded-2xl" onClick={() => setIsSheetOpen(false)}>Apply Global Changes</Button>
              <Button variant="secondary" className="py-4 rounded-2xl" onClick={() => setIsSheetOpen(false)}>Dismiss</Button>
           </div>
        </div>
      </BottomSheet>

      <Drawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        title="Advanced UI Settings"
        side="right"
      >
        <div className="space-y-8">
           <div className="flex flex-col gap-5">
              <GlassCard className="p-5 flex items-center gap-5">
                 <div className="p-3 rounded-2xl bg-indigo-500/10 text-indigo-500"><Globe size={24} /></div>
                 <div>
                    <h5 className="text-sm font-black dark:text-white uppercase tracking-tighter">Region Target</h5>
                    <p className="text-xs text-slate-500">Auto-detected (EU-London)</p>
                 </div>
              </GlassCard>
              <GlassCard className="p-5 flex items-center gap-5">
                 <div className="p-3 rounded-2xl bg-green-500/10 text-green-500"><Heart size={24} /></div>
                 <div>
                    <h5 className="text-sm font-black dark:text-white uppercase tracking-tighter">System Fidelity</h5>
                    <p className="text-xs text-slate-500 font-medium">Ultra High Mode</p>
                 </div>
              </GlassCard>
           </div>
           <Button variant="primary" className="w-full py-4 rounded-2xl shadow-lg shadow-indigo-500/20" onClick={() => setIsDrawerOpen(false)}>Lock UI Settings</Button>
        </div>
      </Drawer>

      <Tabbar 
        activeTab={activeTab}
        onChange={setActiveTab}
        tabs={[
          { id: "home", label: "Dashboard", icon: <Home className="h-6 w-6"/> },
          { id: "stats", label: "Analytics", icon: <TrendingUp className="h-6 w-6"/> },
          { id: "ui", label: "Library", icon: <Layout className="h-6 w-6"/> },
          { id: "profile", label: "Account", icon: <User className="h-6 w-6"/> },
        ]}
      />
    </div>
  );
};
