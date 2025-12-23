
import React, { useState, useMemo, useEffect } from 'react';
import { analyzeText } from './services/geminiService.ts';
import { AnalysisResult, TextStats } from './types.ts';
import { CheckIcon, TrashIcon, MagicIcon, CopyIcon, CogIcon, KeyIcon } from './components/Icons.tsx';

const App: React.FC = () => {
  const [inputText, setInputText] = useState<string>('');
  const [isChecking, setIsChecking] = useState<boolean>(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copySuccess, setCopySuccess] = useState<boolean>(false);
  
  // API Key Management
  const [userApiKey, setUserApiKey] = useState<string>(localStorage.getItem('gemini_api_key') || '');
  const [showKeyModal, setShowKeyModal] = useState<boolean>(false);
  const [tempKey, setTempKey] = useState<string>(userApiKey);

  const stats = useMemo<TextStats>(() => {
    const text = inputText.trim();
    if (!text) return { words: 0, characters: 0, sentences: 0, errorCount: 0 };
    return {
      words: text.split(/\s+/).filter(w => w.length > 0).length,
      characters: text.length,
      sentences: text.split(/[.!?]+/).filter(s => s.trim().length > 0).length,
      errorCount: result?.errors?.length || 0
    };
  }, [inputText, result]);

  const handleCheck = async () => {
    const trimmedInput = inputText.trim();
    if (!trimmedInput) {
      setError("Vui lòng nhập văn bản để kiểm tra.");
      return;
    }

    if (!userApiKey && !process.env.API_KEY) {
      setError("Bạn chưa cấu hình API Key cá nhân.");
      setShowKeyModal(true);
      return;
    }
    
    setIsChecking(true);
    setError(null);
    setResult(null);
    
    try {
      const analysis = await analyzeText(trimmedInput, userApiKey);
      if (!analysis) throw new Error("Phản hồi từ AI không hợp lệ.");
      setResult(analysis);
    } catch (err: any) {
      console.error("Check error:", err);
      setError(err.message || "Đã xảy ra lỗi không xác định.");
    } finally {
      setIsChecking(false);
    }
  };

  const handleSaveKey = () => {
    localStorage.setItem('gemini_api_key', tempKey);
    setUserApiKey(tempKey);
    setShowKeyModal(false);
    setError(null);
  };

  const handleCopy = () => {
    const textToCopy = result?.correctedText || inputText;
    if (!textToCopy) return;
    navigator.clipboard.writeText(textToCopy);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  const clearAll = () => {
    setInputText('');
    setResult(null);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 font-vietnam selection:bg-emerald-100 selection:text-emerald-900">
      <header className="glass-morphism border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="bg-emerald-600 p-2.5 rounded-2xl shadow-lg shadow-emerald-200">
              <MagicIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-emerald-950 tracking-tight">VietCheck AI</h1>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Tiếng Việt Chuẩn Hóa</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setShowKeyModal(true)}
              className="p-3 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-all flex items-center gap-2 group"
              title="Cài đặt API Key"
            >
              <CogIcon className="w-5 h-5 text-slate-400 group-hover:text-emerald-600 transition-colors" />
              <span className="text-xs font-bold text-slate-500 group-hover:text-emerald-700 hidden sm:inline uppercase tracking-widest">Cấu hình</span>
            </button>
            <div className="hidden md:flex px-4 py-2 bg-emerald-50 rounded-xl border border-emerald-100 shadow-sm items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
              <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-widest">Gemini Flash Ready</span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          
          <div className="lg:col-span-8 space-y-8">
            <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-slate-200/60 border border-slate-100 flex flex-col min-h-[550px] overflow-hidden">
              <div className="bg-slate-50/80 px-8 py-4 flex items-center justify-between border-b border-slate-100">
                <div className="flex gap-4">
                  <button onClick={clearAll} className="text-[10px] font-bold text-slate-400 hover:text-red-500 transition uppercase tracking-widest">Xóa hết</button>
                  <button onClick={handleCopy} className="text-[10px] font-bold text-slate-400 hover:text-emerald-600 transition uppercase tracking-widest flex items-center gap-1">
                    {copySuccess ? 'Đã chép' : <><CopyIcon className="w-3 h-3" /> Sao chép</>}
                  </button>
                </div>
                <div className="flex gap-4 items-center">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{stats.words} TỪ</span>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{stats.characters} KÝ TỰ</span>
                </div>
              </div>
              
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                spellCheck={false}
                placeholder="Dán hoặc nhập văn bản tiếng Việt của bạn vào đây..."
                className="flex-1 p-10 text-xl leading-relaxed outline-none resize-none bg-transparent text-slate-800 font-medium placeholder:text-slate-200"
              />

              <div className="p-8 border-t border-slate-50 flex justify-end bg-white">
                <button
                  onClick={handleCheck}
                  disabled={isChecking || !inputText.trim()}
                  className={`flex items-center gap-4 px-12 py-5 rounded-[1.5rem] font-black text-lg transition-all ${isChecking || !inputText.trim() ? 'bg-slate-100 text-slate-300 cursor-not-allowed' : 'bg-emerald-600 text-white shadow-xl shadow-emerald-100 hover:bg-emerald-700 hover:-translate-y-1 active:translate-y-0'}`}
                >
                  {isChecking ? <div className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin"></div> : <MagicIcon className="w-6 h-6" />}
                  {isChecking ? 'ĐANG PHÂN TÍCH...' : 'KIỂM TRA NGAY'}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border-l-8 border-red-500 p-6 rounded-2xl flex items-center gap-4 animate-result">
                <div className="bg-red-500 text-white p-2 rounded-full flex-shrink-0"><TrashIcon className="w-5 h-5" /></div>
                <div>
                  <p className="font-black text-red-800 uppercase text-xs tracking-widest mb-1">Thông báo lỗi</p>
                  <p className="font-bold text-red-700">{error}</p>
                </div>
              </div>
            )}

            {result && (
              <div className="bg-emerald-600 p-10 rounded-[3rem] text-white shadow-2xl animate-result">
                <h3 className="text-xl font-black flex items-center gap-3 mb-4"><CheckIcon className="w-6 h-6" /> Nhận xét tổng quát</h3>
                <p className="text-emerald-50 text-xl font-medium leading-relaxed italic">"{result.overallFeedback}"</p>
              </div>
            )}
          </div>

          <aside className="lg:col-span-4 space-y-8">
            <div className="bg-white rounded-[2.5rem] shadow-xl border border-slate-100 p-8 flex flex-col h-full max-h-[800px]">
              <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-8 flex justify-between items-center">
                DANH SÁCH LỖI 
                <span className={`px-2 py-0.5 rounded-full ${stats.errorCount > 0 ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-600'}`}>
                  {stats.errorCount}
                </span>
              </h2>
              
              <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-4">
                {!result ? (
                  <div className="text-center py-24 opacity-20">
                    <MagicIcon className="w-16 h-16 mx-auto mb-4" />
                    <p className="text-[10px] font-black uppercase tracking-widest">Chưa có kết quả</p>
                  </div>
                ) : result.errors.length === 0 ? (
                  <div className="text-center py-16 bg-emerald-50 rounded-[2rem] text-emerald-700">
                    <CheckIcon className="w-12 h-12 mx-auto mb-3" />
                    <p className="font-black text-sm uppercase tracking-wider">Văn bản chuẩn xác!</p>
                  </div>
                ) : (
                  result.errors.map((err, idx) => (
                    <div key={idx} className="p-5 rounded-2xl bg-slate-50 border border-transparent hover:border-emerald-100 transition-all group animate-result" style={{animationDelay: `${idx * 0.1}s`}}>
                      <div className="flex justify-between items-start mb-3">
                        <span className="text-[9px] font-black px-2 py-1 rounded bg-white border text-slate-400 uppercase tracking-widest">{err.type}</span>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 mb-2 font-bold text-sm">
                        <span className="text-red-400 line-through decoration-2">{err.original}</span>
                        <span className="text-slate-300">→</span>
                        <span className="text-emerald-700 bg-emerald-50 px-2 rounded">{err.replacement}</span>
                      </div>
                      <p className="text-[10px] text-slate-500 italic leading-relaxed">"{err.reason}"</p>
                    </div>
                  ))
                )}
              </div>

              {result && (
                <div className="mt-8 pt-8 border-t border-slate-100">
                   <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4">Văn bản đã sửa</h3>
                   <div className="p-4 bg-slate-50 rounded-2xl text-sm font-medium text-slate-600 max-h-40 overflow-y-auto custom-scrollbar">
                     {result.correctedText}
                   </div>
                   <button 
                    onClick={handleCopy}
                    className="w-full mt-4 py-3 bg-white border border-emerald-200 text-emerald-600 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-emerald-50 transition-colors"
                   >
                     {copySuccess ? 'ĐÃ SAO CHÉP' : 'SAO CHÉP VĂN BẢN ĐÃ SỬA'}
                   </button>
                </div>
              )}
            </div>
          </aside>
        </div>
      </main>

      {/* API Key Modal */}
      {showKeyModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden animate-in slide-in-from-bottom-8 duration-500">
            <div className="p-10">
              <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center mb-6 text-emerald-600">
                <KeyIcon className="w-8 h-8" />
              </div>
              <h2 className="text-2xl font-black text-slate-900 mb-2">Cấu hình API Key</h2>
              <p className="text-slate-500 text-sm leading-relaxed mb-8">
                Ứng dụng này sử dụng AI Gemini để kiểm tra chính tả. Vui lòng nhập API Key cá nhân của bạn để tiếp tục. 
                Dữ liệu của bạn được lưu trữ an toàn tại trình duyệt.
              </p>
              
              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Google Gemini API Key</label>
                  <input 
                    type="password"
                    value={tempKey}
                    onChange={(e) => setTempKey(e.target.value)}
                    placeholder="AIzaSy..."
                    className="w-full p-4 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-mono text-sm"
                  />
                </div>
                
                <a 
                  href="https://aistudio.google.com/app/apikey" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-xs text-emerald-600 font-bold hover:underline block"
                >
                  Chưa có Key? Lấy ngay tại Google AI Studio →
                </a>
              </div>
              
              <div className="mt-10 flex gap-4">
                <button 
                  onClick={() => setShowKeyModal(false)}
                  className="flex-1 py-4 px-6 rounded-xl font-bold text-slate-400 hover:bg-slate-50 transition-colors uppercase tracking-widest text-xs"
                >
                  Đóng
                </button>
                <button 
                  onClick={handleSaveKey}
                  className="flex-1 py-4 px-6 bg-emerald-600 text-white rounded-xl font-black hover:bg-emerald-700 shadow-lg shadow-emerald-100 transition-all uppercase tracking-widest text-xs"
                >
                  Lưu cấu hình
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <footer className="text-center py-12 opacity-30">
        <p className="text-[9px] font-black uppercase tracking-[0.5em]">VIETCHECK AI • DỰ ÁN NGÔN NGỮ CHUẨN HÓA</p>
      </footer>
    </div>
  );
};

export default App;
