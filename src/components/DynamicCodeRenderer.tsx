import React, { useEffect, useState } from 'react';
import * as Babel from '@babel/standalone';

// Declare the window interface extension
declare global {
  interface Window {
    [key: string]: any; // For development only - consider making this more specific in production
  }
}

interface Props {
  code: string;
  globalVarName: string;
  eventCallback: (message: string) => void;
}

export default function DynamicCodeRenderer({ code, globalVarName, eventCallback }: Props) {
  const [CompiledComp, setCompiledComp] = useState<React.FC<{ eventCallback: (message: string) => void}> | null>(null);

  useEffect(() => {
    try {
      // 1. 用 Babel.transform 编译为 JS
      const result = Babel.transform(code, {
        presets: ['env', 'react'], // 也可以只用 ['react']
      });

      if (!result || !result.code) {
        console.error('代码编译失败');
        return;
      }
      // 2. 执行编译结果
      // eval 或 new Function 均可，这里用 new Function 示例
      // 注意安全风险：如果 code 来源不可信，需要做好 sandbox 等防范
      new Function('React', result.code)(React);

      // 3. 拿到挂载在 window 上的组件
      const DynamicComp = window[globalVarName];
      if (DynamicComp) {
        setCompiledComp(() => DynamicComp);
      } else {
        console.error(`没有在 window 上找到名为 ${globalVarName} 的组件`);
      }
    } catch (err) {
      console.error('代码编译/执行出错: ', err);
    }
  }, [code, globalVarName]);

  // 如果编译成功，就渲染组件；否则可以给个 fallback
  return CompiledComp ? <CompiledComp eventCallback={eventCallback} /> : <div>Loading / Error</div>;
}
