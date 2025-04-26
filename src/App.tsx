import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useEffect } from "react";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => {
  // 设置真实视口高度 - 优化版本
  useEffect(() => {
    const setRealViewportHeight = () => {
      // 获取视口高度
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty('--vh', `${vh}px`);
      
      // 设置一个额外的变量用于内容区域，减去顶部和底部的固定区域
      // 这里可以根据实际项目中顶部和底部区域的高度进行调整
      const headerHeight = 70; // 估计的顶部区域高度
      const historyHeight = 140; // 估计的历史记录区域高度
      const contentHeight = (window.innerHeight - headerHeight - historyHeight) * 0.01;
      document.documentElement.style.setProperty('--content-vh', `${contentHeight}px`);
      
      // 为调试目的，将实际计算的高度添加到文档中
      document.documentElement.style.setProperty('--window-inner-height', `${window.innerHeight}px`);
      document.documentElement.style.setProperty('--window-outer-height', `${window.outerHeight}px`);
    };

    // 初始设置
    setRealViewportHeight();

    // 监听窗口大小变化
    window.addEventListener('resize', setRealViewportHeight);
    
    // 在移动浏览器中，地址栏隐藏/显示也会改变窗口高度，但不触发resize事件
    // 因此我们也监听滚动事件
    window.addEventListener('scroll', setRealViewportHeight);
    
    // 特别针对iOS设备，延迟再次计算以确保地址栏完全显示/隐藏后的准确高度
    setTimeout(setRealViewportHeight, 500);
    
    // 清理函数
    return () => {
      window.removeEventListener('resize', setRealViewportHeight);
      window.removeEventListener('scroll', setRealViewportHeight);
    };
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
