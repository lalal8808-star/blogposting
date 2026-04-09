'use client';

import { useState } from 'react';

export default function RunButton() {
  const [loading, setLoading] = useState(false);

  const handleRun = async () => {
    if (loading) return;
    
    setLoading(true);
    try {
      const response = await fetch('/api/run-agent');
      const data = await response.json();
      
      if (data.success) {
        alert('✅ AI 기술 블로그 포스팅 완료!\n새로운 글이 등록되었습니다.');
        window.location.reload();
      } else {
        alert('❌ 실행 중 오류가 발생했습니다: ' + (data.error || '알 수 없는 에러'));
      }
    } catch (err) {
      console.error(err);
      alert('❌ 서버 연결에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-end gap-2">
      {loading && (
        <span className="text-xs font-mono text-blue-400 animate-pulse bg-blue-900/20 px-3 py-1 rounded-full border border-blue-500/30">
          🤖 AI 파이프라인 가동 중... (약 2분)
        </span>
      )}
      <button
        onClick={handleRun}
        disabled={loading}
        className={`px-6 py-2 rounded-xl font-bold transition-all shadow-lg ${
          loading 
          ? 'bg-neutral-800 text-neutral-500 cursor-not-allowed' 
          : 'bg-white text-black hover:bg-blue-50 hover:scale-105 active:scale-95 shadow-white/5'
        }`}
      >
        {loading ? '에이전트 실행 중...' : '수동 파이프라인 실행'}
      </button>
    </div>
  );
}
