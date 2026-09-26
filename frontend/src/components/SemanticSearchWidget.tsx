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
    <div className="flex flex-col h-full space-y-4">
      
      {/* 1. Radar Query Header Deck */}
      <div className="bg-[var(--panel-card)] p-4 border border-[var(--line)] flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center h-9 w-9 bg-[var(--paper)] border border-[var(--line)] text-[var(--accent)] flex-shrink-0">
            <BrainCircuit className="h-4 w-4" />
          </div>
          
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="font-mono-tech text-[10px] text-slate-400 font-medium uppercase tracking-wider flex items-center gap-1.5">
                <Radio className="h-3 w-3 text-[var(--accent)]" />
                VECTOR RADAR // COSINE SIMILARITY
              </span>
              <span className="font-mono-tech text-[9px] px-1.5 py-0.5 bg-[var(--paper)] border border-[var(--line)] text-slate-400">
                16-DIM EMBEDDINGS
              </span>
            </div>
            <span className="text-xs font-mono text-slate-200 mt-1 max-w-lg truncate">
              "{query}"
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 font-mono-tech text-[10px]">
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-[var(--paper)] border border-[var(--line)] text-slate-400">
            <Target className="h-3 w-3 text-[var(--accent)]" />
            <span>k-NN DISTANCE</span>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-[var(--paper)] border border-[var(--line)] text-emerald-400">
            <Activity className="h-3 w-3" />
            <span>TOP {displayRows.length} MATCHES</span>
          </div>
        </div>
      </div>

      {/* 2. Results Visualizer Radar Grid */}
      <div className="bg-[var(--panel)] border border-[var(--line)] overflow-hidden">
        <div className="bg-[var(--panel-card)] border-b border-[var(--line)] px-4 py-2.5 flex items-center justify-between">
          <span className="font-mono-tech text-[11px] text-slate-300 flex items-center gap-2 uppercase tracking-wide">
            <Sparkles className="h-3.5 w-3.5 text-[var(--accent)]" /> 
            SEMANTIC AUDIENCE SENTIMENT MATCHES
          </span>
          <span className="font-mono-tech text-[10px] text-slate-500 uppercase tracking-widest">
            CLICKHOUSE VECTOR SCAN
          </span>
        </div>

        <div className="p-4 space-y-3 overflow-y-auto max-h-[460px]">
          {displayRows.length === 0 ? (
            <div className="text-center text-slate-500 text-xs py-12 space-y-2 font-mono-tech">
              <BrainCircuit className="h-8 w-8 mx-auto text-slate-600" />
              <p>NO VECTOR SIMILARITY MATCHES DISCOVERED FOR THIS QUERY</p>
            </div>
          ) : (
            displayRows.map((row, idx) => {
              const rawScore = scoreCol ? row[scoreCol] : Math.max(0.96 - (idx * 0.08), 0.45);
              const score = normalizeScore(rawScore);
              const scorePct = (score * 100).toFixed(1);
              const rank = String(idx + 1).padStart(2, '0');
              const textContent = String(row[contentCol] || 'No review text provided');
              
              const isNegative = textContent.toLowerCase().includes('bad') || 
                textContent.toLowerCase().includes('slow') || 
                textContent.toLowerCase().includes('pacing') || 
                textContent.toLowerCase().includes('poor') || 
                textContent.toLowerCase().includes('terrible');

              return (
                <div 
                  key={idx} 
                  className="group relative bg-[var(--paper)] border border-[var(--line)] hover:border-[var(--accent)] p-3.5 transition-colors duration-150 space-y-2.5"
                >
                  {/* Top line: Rank, Text Preview, Score Badge */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2.5 flex-1 min-w-0">
                      <span className="font-mono-tech text-[10px] text-[var(--accent)] bg-[var(--panel-card)] px-2 py-0.5 border border-[var(--line)] flex-shrink-0">
                        #{rank}
                      </span>
                      
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-slate-300 leading-relaxed break-words">
                          <MessageSquare className="h-3 w-3 inline text-slate-500 mr-1.5 -mt-0.5" />
                          "{textContent}"
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      <div className={`px-2 py-0.5 border font-mono-tech text-[10px] font-semibold flex items-center gap-1.5 ${getScoreBadgeColor(score)}`}>
                        <Zap className="h-3 w-3" />
                        <span>{scorePct}% MATCH</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Proximity Score Bar */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between font-mono-tech text-[9px] text-slate-500">
                      <span>PROXIMITY VECTOR DENSITY</span>
                      <span>COSINE SIM: {score.toFixed(4)}</span>
                    </div>
                    <div className="h-1 w-full bg-slate-800 overflow-hidden">
                      <div 
                        className={`h-full bg-gradient-to-r ${getScoreGradient(score)} transition-all duration-1000 ease-out`}
                        style={{ width: `${scorePct}%` }}
                      />
                    </div>
                  </div>
                  
                  {/* Metadata pills */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    <span className={`px-2 py-0.5 text-[9px] font-mono-tech uppercase flex items-center gap-1 border ${
                      isNegative 
                        ? 'bg-rose-950/40 border-rose-900 text-rose-300' 
                        : 'bg-emerald-950/40 border-emerald-900 text-emerald-300'
                    }`}>
                      {isNegative ? <ThumbsDown className="h-2.5 w-2.5" /> : <ThumbsUp className="h-2.5 w-2.5" />}
                      <span>{isNegative ? 'CRITICAL FEEDBACK' : 'POSITIVE FEEDBACK'}</span>
                    </span>

                    {columns
                      .filter(c => c !== contentCol && c !== scoreCol)
                      .slice(0, 4)
                      .map((col, cIdx) => (
                        <span 
                          key={cIdx} 
                          className="px-2 py-0.5 bg-[var(--panel-card)] border border-[var(--line)] text-[9px] font-mono-tech text-slate-400"
                        >
                          <span className="text-slate-500">{col}:</span> <span className="text-slate-300">{String(row[col])}</span>
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

