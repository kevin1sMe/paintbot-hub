import React, { useEffect } from 'react';

/**
 * LayoutAdjuster 组件用于自动调整移动设备上的布局
 * 它会根据实际屏幕高度设置CSS变量，并监听屏幕方向变化
 */
const LayoutAdjuster: React.FC = () => {
  useEffect(() => {
    // 计算并设置真实可用高度
    const setRealHeight = () => {
      // 等待浏览器UI完全加载
      setTimeout(() => {
        // 窗口高度
        const windowHeight = window.innerHeight;
        // 文档高度
        const docHeight = document.documentElement.clientHeight;
        
        // 设置CSS变量
        document.documentElement.style.setProperty('--real-height', `${windowHeight}px`);
        document.documentElement.style.setProperty('--doc-height', `${docHeight}px`);
        
        // 计算历史区和主内容区的高度
        const headerHeight = 85; // 调整后的头部高度
        
        // 检查历史记录的当前状态
        const historyIsCollapsed = document.querySelector('.history-container')?.classList.contains('max-h-[40px]');
        const historyHeight = historyIsCollapsed ? 40 : 160; // 根据历史记录的展开状态设置高度
        
        const mainContentHeight = windowHeight - headerHeight - historyHeight;
        
        document.documentElement.style.setProperty('--main-height', `${mainContentHeight}px`);
        document.documentElement.style.setProperty('--history-height', `${historyHeight}px`);
      }, 100);
    };
    
    // 初始计算
    setRealHeight();
    
    // 监听窗口变化
    window.addEventListener('resize', setRealHeight);
    window.addEventListener('orientationchange', setRealHeight);
    window.addEventListener('scroll', setRealHeight);
    
    // 添加监听历史记录展开/收起事件
    const historyObserver = new MutationObserver(setRealHeight);
    const historyElement = document.querySelector('.history-container');
    if (historyElement) {
      historyObserver.observe(historyElement, { 
        attributes: true, 
        attributeFilter: ['class'] 
      });
    }
    
    // 清理
    return () => {
      window.removeEventListener('resize', setRealHeight);
      window.removeEventListener('orientationchange', setRealHeight);
      window.removeEventListener('scroll', setRealHeight);
      historyObserver.disconnect();
    };
  }, []);
  
  // 这个组件不渲染任何内容
  return null;
};

export default LayoutAdjuster; 