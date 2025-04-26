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
        const headerHeight = 80; // 大致的头部高度
        const historyHeight = 150; // 历史记录区高度
        const mainContentHeight = windowHeight - headerHeight - historyHeight;
        
        document.documentElement.style.setProperty('--main-height', `${mainContentHeight}px`);
        
        // 更新调试信息
        const debugInfo = document.querySelector('.debug-info');
        if (debugInfo) {
          debugInfo.textContent = `window: ${windowHeight}px, doc: ${docHeight}px, main: ${mainContentHeight}px`;
        }
      }, 100);
    };
    
    // 初始计算
    setRealHeight();
    
    // 监听窗口变化
    window.addEventListener('resize', setRealHeight);
    window.addEventListener('orientationchange', setRealHeight);
    window.addEventListener('scroll', setRealHeight);
    
    // 清理
    return () => {
      window.removeEventListener('resize', setRealHeight);
      window.removeEventListener('orientationchange', setRealHeight);
      window.removeEventListener('scroll', setRealHeight);
    };
  }, []);
  
  // 这个组件不渲染任何内容
  return null;
};

export default LayoutAdjuster; 