import React, { useState, useEffect } from "react";
import { toast } from "@/hooks/use-toast";

type Props = {
  url: string;
  prompt: string;
  loading?: boolean;
  width?: number;
  height?: number;
};

// 在React组件外定义CSS动画样式
const fadeInKeyframes = `
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
`;

export default function GeneratedImageCard({ url, prompt, loading, width = 1024, height = 1024 }: Props) {
  // 添加浮层状态
  const [showFullImage, setShowFullImage] = useState(false);

  // 动态添加和移除样式
  useEffect(() => {
    // 添加动画样式到head
    const styleElement = document.createElement('style');
    styleElement.innerHTML = fadeInKeyframes;
    document.head.appendChild(styleElement);

    return () => {
      // 组件卸载时移除样式
      document.head.removeChild(styleElement);
    };
  }, []);

  // 下载图片函数
  const handleDownload = async () => {
    if (!url) return;

    try {
      // 获取图片 blob
      const response = await fetch(url);
      const blob = await response.blob();
      
      // 创建下载链接
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = `ai-image-${new Date().getTime()}.png`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(downloadUrl);
      document.body.removeChild(a);
      
      toast({ title: "图片已下载" });
    } catch (e) {
      console.error('下载失败', e);
      toast({ title: "下载失败", description: "请直接右键图片另存为" });
    }
  };

  // 复制图片链接
  const handleCopyLink = () => {
    if (!url) return;
    
    navigator.clipboard.writeText(url)
      .then(() => {
        toast({ title: "图片链接已复制到剪贴板" });
      })
      .catch(err => {
        console.error('复制失败', err);
        toast({ title: "复制失败", description: "请手动复制图片链接" });
      });
  };
  
  // 打开图片浮层
  const openImageOverlay = () => {
    if (url) {
      setShowFullImage(true);
      console.log("打开图片浮层");
    }
  };
  
  return (
    <div className="flex items-center justify-center w-full h-full">
      {loading ? (
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-t-blue-500 border-r-transparent border-b-blue-500 border-l-transparent" />
          <span className="text-gray-300">正在生成图片，请稍候...</span>
        </div>
      ) : url ? (
        <div className="max-w-full max-h-full p-2">
          <div className="flex flex-col items-center">
            <div className="relative mb-3">
              <img 
                src={url} 
                alt={prompt || "AI生成图片"} 
                className="max-w-full max-h-[75vh] object-contain rounded cursor-pointer hover:opacity-90 transition-opacity"
                onDoubleClick={openImageOverlay}
              />
              <div className="absolute bottom-2 right-2 bg-black bg-opacity-70 text-white px-2 py-1 rounded text-xs">
                {width}x{height}
              </div>
              <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity pointer-events-none">
                <div className="bg-black bg-opacity-50 text-white px-3 py-1.5 rounded text-sm">
                  双击查看原图
                </div>
              </div>
            </div>
            
            {prompt && (
              <p className="text-center text-gray-400 text-sm max-w-2xl mb-4 line-clamp-2">{prompt}</p>
            )}
            
            <div className="flex gap-3">
              <button 
                className="bg-gray-800 hover:bg-gray-700 text-white px-4 py-1.5 rounded text-xs flex items-center gap-1.5"
                onClick={handleDownload}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span>下载</span>
              </button>
              
              <button 
                className="bg-gray-800 hover:bg-gray-700 text-white px-4 py-1.5 rounded text-xs flex items-center gap-1.5"
                onClick={handleCopyLink}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <rect x="8" y="2" width="8" height="4" rx="1" ry="1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span>复制链接</span>
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center text-center">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M4 16L8.586 11.414C8.96106 11.0391 9.46967 10.8284 10 10.8284C10.5303 10.8284 11.0389 11.0391 11.414 11.414L16 16M14 14L15.586 12.414C15.9611 12.0391 16.4697 11.8284 17 11.8284C17.5303 11.8284 18.0389 12.0391 18.414 12.414L20 14M14 8H14.01M6 20H18C18.5304 20 19.0391 19.7893 19.4142 19.4142C19.7893 19.0391 20 18.5304 20 18V6C20 5.46957 19.7893 4.96086 19.4142 4.58579C19.0391 4.21071 18.5304 4 18 4H6C5.46957 4 4.96086 4.21071 4.58579 4.58579C4.21071 4.96086 4 5.46957 4 6V18C4 18.5304 4.21071 19.0391 4.58579 19.4142C4.96086 19.7893 5.46957 20 6 20Z" stroke="#666" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <p className="text-gray-400 mt-4 mb-2">这里将显示生成的图片</p>
          <p className="text-gray-600 text-sm max-w-md">
            在左侧输入提示词并调整参数，然后点击"生成图片"按钮开始创建
          </p>
        </div>
      )}

      {/* 全屏浮层 */}
      {showFullImage && url && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 cursor-pointer"
          onClick={() => setShowFullImage(false)}
          style={{ 
            position: 'fixed', 
            top: 0, 
            left: 0, 
            right: 0, 
            bottom: 0,
            animation: 'fadeIn 0.3s ease-in-out'
          }}
        >
          <div className="relative max-w-[90vw] max-h-[90vh]">
            <img 
              src={url} 
              alt={prompt || "AI生成图片"} 
              className="max-w-full max-h-full object-contain"
            />
            <button
              className="absolute top-4 right-4 bg-black bg-opacity-50 text-white rounded-full p-2 hover:bg-opacity-70"
              onClick={() => setShowFullImage(false)}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
