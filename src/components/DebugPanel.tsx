import React, { useState } from "react";
import type { LogEntry } from "@/services";

interface Props {
  logs: LogEntry[];
  clearLogs: () => void;
}

export default function DebugPanel({ logs, clearLogs }: Props) {
  const [activeTab, setActiveTab] = useState<"request" | "response" | "error" | "info">("request");

  return (
    <div className="fixed inset-0 bg-white bg-opacity-95 z-50 overflow-auto p-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-medium text-gray-800">调试面板</h2>
          
          <div className="flex gap-2">
            <button 
              className="text-sm bg-red-50 text-red-700 px-2 py-1 rounded"
              onClick={clearLogs}
            >
              清空日志
            </button>
            <button 
              className="text-sm bg-gray-100 text-gray-700 px-2 py-1 rounded"
              onClick={() => document.getElementById('debug-panel')?.classList.add('hidden')}
            >
              关闭
            </button>
          </div>
        </div>
        
        <div className="flex border-b border-gray-200 mb-3">
          <button
            className={`px-4 py-2 text-sm font-medium ${
              activeTab === "request" ? "border-b-2 border-blue-500 text-blue-600" : "text-gray-500"
            }`}
            onClick={() => setActiveTab("request")}
          >
            请求 ({logs.filter(log => log.type === "request").length})
          </button>
          <button
            className={`px-4 py-2 text-sm font-medium ${
              activeTab === "response" ? "border-b-2 border-blue-500 text-blue-600" : "text-gray-500"
            }`}
            onClick={() => setActiveTab("response")}
          >
            响应 ({logs.filter(log => log.type === "response").length})
          </button>
          <button
            className={`px-4 py-2 text-sm font-medium ${
              activeTab === "error" ? "border-b-2 border-red-500 text-red-600" : "text-gray-500"
            }`}
            onClick={() => setActiveTab("error")}
          >
            错误 ({logs.filter(log => log.type === "error").length})
          </button>
          <button
            className={`px-4 py-2 text-sm font-medium ${
              activeTab === "info" ? "border-b-2 border-green-500 text-green-600" : "text-gray-500"
            }`}
            onClick={() => setActiveTab("info")}
          >
            信息 ({logs.filter(log => log.type === "info").length})
          </button>
        </div>
        
        <div className="space-y-3">
          {logs
            .filter(log => log.type === activeTab)
            .map((log, index) => (
              <div key={index} className="bg-gray-50 p-3 rounded text-xs border border-gray-200">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium">{log.timestamp}</span>
                  {log.type === "error" && (
                    <span className="text-red-600 font-medium">错误</span>
                  )}
                  {log.type === "info" && (
                    <span className="text-green-600 font-medium">信息</span>
                  )}
                </div>
                <pre className="whitespace-pre-wrap break-words overflow-auto max-h-40">
                  {JSON.stringify(log.data, null, 2)}
                </pre>
              </div>
            ))}
          
          {logs.filter(log => log.type === activeTab).length === 0 && (
            <div className="text-center text-gray-500 py-6">暂无{activeTab === "request" ? "请求" : activeTab === "response" ? "响应" : activeTab === "info" ? "信息" : "错误"}日志</div>
          )}
        </div>
      </div>
    </div>
  );
}
