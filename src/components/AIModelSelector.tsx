import React, { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { MODELS } from "../services";
import type { SubModelConfig } from "../services";

type Props = {
  model: string;
  subModel: string;
  onModelChange: (model: string) => void;
  onSubModelChange: (subModel: string) => void;
};

export default function AIModelSelector({
  model,
  subModel,
  onModelChange,
  onSubModelChange,
}: Props) {
  const activeModel = MODELS.find((m) => m.value === model || m.children?.some((sm) => sm.value === subModel));
  const showSubModels = !!activeModel?.children;
  const [selectedSubModel, setSelectedSubModel] = useState<SubModelConfig | null>(null);

  // 当模型或子模型变化时，更新当前选中的子模型信息
  useEffect(() => {
    if (activeModel?.children) {
      const found = activeModel.children.find(m => m.value === subModel);
      if (found) {
        setSelectedSubModel(found);
      }
    }
  }, [activeModel, subModel]);

  return (
    <div>
      <select
        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        value={model}
        onChange={e => {
          onModelChange(e.target.value);
          // 如果切换主模型，自动选中子模型列表第一个
          const found = MODELS.find(m => m.value === e.target.value);
          if (found?.children?.length) {
            onSubModelChange(found.children[0].value);
            setSelectedSubModel(found.children[0]);
          } else {
            onSubModelChange("");
            setSelectedSubModel(null);
          }
        }}
      >
        {MODELS.map(m => (
          <option key={m.value} value={m.value}>
            {m.name}
          </option>
        ))}
      </select>
      
      {showSubModels && (
        <select
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          value={subModel}
          onChange={e => {
            onSubModelChange(e.target.value);
            const selected = activeModel?.children?.find(m => m.value === e.target.value);
            setSelectedSubModel(selected || null);
          }}
        >
          {activeModel?.children?.map(sm => (
            <option key={sm.value} value={sm.value}>
              {sm.label}
            </option>
          ))}
        </select>
      )}
      
      {/* 价格提示 */}
      {selectedSubModel?.price && (
        <div className="text-xs text-gray-500 mb-3 flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          价格提示: <span className="font-medium ml-1">{selectedSubModel.price}</span>
        </div>
      )}
      
      {activeModel?.url && (
        <a
          href={activeModel.url}
          className="text-blue-500 text-xs hover:underline block"
          target="_blank"
          rel="noopener noreferrer"
        >
          查看API接入文档
        </a>
      )}
    </div>
  );
}

