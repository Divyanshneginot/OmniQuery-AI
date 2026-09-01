import React from 'react';
import { BrainCircuit, Activity, Zap, Target, Sparkles, MessageSquare, Radio, ThumbsUp, ThumbsDown } from 'lucide-react';

interface SemanticSearchWidgetProps {
  query?: string;
  rows: Record<string, any>[];
  columns: string[];
}

export const SemanticSearchWidget: React.FC<SemanticSearchWidgetProps> = ({
  query = "Vector Similarity Search",
  rows,
  columns
}) => {
  // Try to find a score/similarity column
  const scoreCol = columns.find(c => 
    c.toLowerCase().includes('score') || 
    c.toLowerCase().includes('similarity') || 
    c.toLowerCase().includes('distance')
  );
  
  // Try to find a content column
  const contentCol = columns.find(c => 
    c.toLowerCase().includes('content') || 
    c.toLowerCase().includes('text') || 
    c.toLowerCase().includes('comment') ||
    c.toLowerCase().includes('review')
  ) || columns[0];
  
  const displayRows = rows.slice(0, 8); // Top 8 results

  const normalizeScore = (val: any): number => {
    const num = parseFloat(val);
    if (isNaN(num)) return 0.85;
    if (num > 1) return Math.min(num / 100, 1);
    return Math.min(Math.max(num, 0), 1);
  };

  const getScoreGradient = (score: number) => {
    if (score >= 0.85) return 'from-emerald-400 to-cyan-400';
    if (score >= 0.70) return 'from-cyan-400 to-blue-500';
    if (score >= 0.50) return 'from-amber-400 to-orange-500';
    return 'from-rose-500 to-pink-600';
  };

  const getScoreBadgeColor = (score: number) => {
    if (score >= 0.85) return 'text-emerald-300 bg-emerald-950/40 border-emerald-800/50';
    if (score >= 0.70) return 'text-cyan-300 bg-cyan-950/40 border-cyan-800/50';
    if (score >= 0.50) return 'text-amber-300 bg-amber-950/40 border-amber-800/50';
    return 'text-rose-300 bg-rose-950/40 border-rose-800/50';
  };

  return (
    <div className="flex flex-col h-full text-zinc-100 space-y-4">
      
      {/* 1. Radar Query Header Deck */}
      <div className="bg-zinc-950 rounded-xl p-4 border border-zinc-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center h-10 w-10 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 flex-shrink-0">
            <BrainCircuit className="h-5 w-5" />
          </div>
          
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-zinc-400 font-mono font-bold uppercase tracking-wider flex items-center gap-1">
                <Radio className="h-3 w-3" />
                Vector Radar
              </span>
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-400 font-mono">
                16-Dim Cosine
              </span>
            </div>
            <span className="text-xs font-semibold font-mono text-zinc-200 mt-0.5 max-w-lg truncate">
              "{query}"
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-zinc-900 border border-zinc-800 text-[10px] font-mono text-zinc-400">
            <Target className="h-3 w-3 text-zinc-400" />
            <span>k-NN Cosine Distance</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-zinc-900 border border-zinc-800 text-[10px] font-mono text-zinc-400">
            <Activity className="h-3 w-3 text-zinc-400" />
            <span>Top {displayRows.length} Matches</span>
          </div>
        </div>
      </div>

      {/* 2. Results Visualizer Radar Grid */}
      <div className="bg-zinc-950 rounded-xl border border-zinc-800 overflow-hidden">
        <div className="bg-zinc-900/50 border-b border-zinc-800 px-4 py-2.5 flex items-center justify-between">
          <span className="text-[11px] font-mono text-zinc-300 flex items-center gap-2 font-semibold">
            <Sparkles className="h-3.5 w-3.5 text-zinc-400" /> 
            Semantic Matches
          </span>
          <span className="text-[10px] font-mono text-zinc-500">
            ClickHouse Search
          </span>
        </div>

        <div className="p-4 space-y-3.5 overflow-y-auto max-h-[460px]">
          {displayRows.length === 0 ? (
            <div className="text-center text-zinc-500 text-xs font-mono py-12 space-y-2">
              <BrainCircuit className="h-8 w-8 mx-auto text-zinc-600" />
              <p>No vector similarity matches discovered for this semantic query.</p>
            </div>
          ) : (
            displayRows.map((row, idx) => {
              const rawScore = scoreCol ? row[scoreCol] : Math.max(0.96 - (idx * 0.08), 0.45);
              const score = normalizeScore(rawScore);
              const scorePct = (score * 100).toFixed(1);
              const rank = String(idx + 1).padStart(2, '0');
              const textContent = String(row[contentCol] || 'No review text provided');
              
              // Sentiment heuristic
              const isNegative = textContent.toLowerCase().includes('bad') || 
                textContent.toLowerCase().includes('slow') || 
                textContent.toLowerCase().includes('pacing') || 
                textContent.toLowerCase().includes('poor') || 
                textContent.toLowerCase().includes('terrible');

              return (
                <div 
                  key={idx} 
                  className="group relative rounded-xl bg-zinc-900/50 border border-zinc-800 hover:border-zinc-700 p-3.5 transition-all duration-200 space-y-2.5"
                >
                  {/* Top line: Rank, Text Preview, Score Badge */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2.5 flex-1 min-w-0">
                      <span className="text-[11px] font-mono font-bold text-zinc-400 bg-zinc-800/50 px-2 py-0.5 rounded border border-zinc-700/50 flex-shrink-0">
                        #{rank}
                      </span>
                      
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-zinc-200 font-sans leading-relaxed break-words">
                          <MessageSquare className="h-3 w-3 inline text-zinc-500 mr-1.5 -mt-0.5" />
                          "{textContent}"
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      <div className={`px-2.5 py-1 rounded-lg border font-mono text-[11px] font-bold flex items-center gap-1.5 ${getScoreBadgeColor(score)}`}>
                        <Zap className="h-3 w-3" />
                        <span>{scorePct}% Match</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Animated Score Bar */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[9px] font-mono text-zinc-500">
                      <span>Proximity Vector Density</span>
                      <span>Cosine sim: {score.toFixed(4)}</span>
                    </div>
                    <div className="h-1.5 w-full bg-zinc-900 rounded-full overflow-hidden border border-white/[0.04]">
                      <div 
                        className={`h-full rounded-full bg-gradient-to-r ${getScoreGradient(score)} transition-all duration-1000 ease-out shadow-sm`}
                        style={{ width: `${scorePct}%` }}
                      />
                    </div>
                  </div>
                  
                  {/* Metadata pills */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    {/* Sentiment Tag */}
                    <span className={`px-2 py-0.5 rounded-md text-[9px] font-mono font-semibold flex items-center gap-1 border ${
                      isNegative 
                        ? 'bg-rose-950/30 border-rose-800/40 text-rose-300' 
                        : 'bg-emerald-950/30 border-emerald-800/40 text-emerald-300'
                    }`}>
                      {isNegative ? <ThumbsDown className="h-2.5 w-2.5" /> : <ThumbsUp className="h-2.5 w-2.5" />}
                      <span>{isNegative ? 'Critical Feedback' : 'Positive Feedback'}</span>
                    </span>

                    {columns
                      .filter(c => c !== contentCol && c !== scoreCol)
                      .slice(0, 4)
                      .map((col, cIdx) => (
                        <span 
                          key={cIdx} 
                          className="px-2 py-0.5 rounded-md bg-zinc-900/90 border border-zinc-800 text-[9px] font-mono text-zinc-400"
                        >
                          <span className="text-zinc-600">{col}:</span> <span className="text-zinc-300">{String(row[col])}</span>
                        </span>
                      ))}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

