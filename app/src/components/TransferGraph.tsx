import { useMemo, useState } from 'react';
import { GitCommit, ArrowRight, Clock, Filter } from 'lucide-react';
import { getTransferNodes, teamMembers, getProjectColor } from '@/data/mockData';
import { useProjects } from '@/hooks/useProjects';

export default function TransferGraph() {
  const allNodes = useMemo(() => getTransferNodes(), []);
  const { projects } = useProjects();
  const [filterProject, setFilterProject] = useState<string | null>(null);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);

  const activeMembers = teamMembers;

  const nodes = filterProject
    ? allNodes.filter((n) => n.projectId === filterProject)
    : allNodes;

  const grouped = useMemo(() => {
    const map = new Map<string, typeof nodes>();
    nodes.forEach((n) => {
      const arr = map.get(n.taskId) || [];
      arr.push(n);
      map.set(n.taskId, arr);
    });
    return map;
  }, [nodes]);

  // Dynamic X positions based on active member count
  const memberXPositions: Record<string, number> = {};
  const totalWidth = 900;
  const padding = 80;
  const usableWidth = totalWidth - padding * 2;
  activeMembers.forEach((m, i) => {
    memberXPositions[m.id] = padding + (usableWidth / (activeMembers.length - 1)) * i;
  });

  const laneHeight = 64;
  const headerHeight = 52;

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <GitCommit className="w-5 h-5 text-[#f59e0b]" />
          <h2 className="text-xl font-semibold text-[#f4f4f5]">移交轨迹追踪</h2>
          <span className="text-xs font-mono text-[#969699] bg-[#1f1f22] px-2 py-1 rounded-full">
            {nodes.length} 次移交
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-[#969699]" />
          <select
            value={filterProject || ''}
            onChange={(e) => setFilterProject(e.target.value || null)}
            className="h-7 px-2 rounded bg-[#050507] border border-[#1f1f22] text-xs text-[#f4f4f5] focus:outline-none focus:border-[#1868d6]/50 font-mono"
          >
            <option value="">全部项目</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Member Header */}
      <div className="flex-shrink-0 flex items-end border-b border-[#1f1f22] pb-2 mb-2" style={{ height: headerHeight }}>
        <div className="w-48 flex-shrink-0" />
        {activeMembers.map((m) => (
          <div
            key={m.id}
            className="absolute flex flex-col items-center"
            style={{ left: (memberXPositions[m.id] || 0) + 220 }}
          >
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white mb-1"
              style={{ backgroundColor: m.color }}
            >
              {m.initials}
            </div>
            <span className="text-[10px] text-[#969699]">{m.name}</span>
          </div>
        ))}
      </div>

      {/* Graph */}
      <div className="flex-1 overflow-y-auto scrollbar-thin relative">
        <svg className="w-full" style={{ height: Math.max(grouped.size * laneHeight + 40, 400) }}>
          {Array.from({ length: grouped.size + 1 }).map((_, i) => (
            <line
              key={`lane-${i}`}
              x1={0}
              y1={headerHeight + i * laneHeight}
              x2={1100}
              y2={headerHeight + i * laneHeight}
              stroke="#1f1f22"
              strokeWidth={1}
              strokeDasharray="4 4"
            />
          ))}

          {activeMembers.map((m) => (
            <line
              key={`member-line-${m.id}`}
              x1={memberXPositions[m.id]}
              y1={0}
              x2={memberXPositions[m.id]}
              y2={headerHeight + grouped.size * laneHeight}
              stroke="#1a1a1c"
              strokeWidth={1}
            />
          ))}

          {Array.from(grouped.entries()).map(([taskId, transfers], laneIdx) => {
            const laneY = headerHeight + laneIdx * laneHeight + laneHeight / 2;
            const projId = transfers[0]?.projectId || 'p1';
            const projColor = getProjectColor(projId);

            return (
              <g key={taskId}>
                <text
                  x={10}
                  y={laneY + 4}
                  fill="#969699"
                  fontSize="11"
                  fontFamily="JetBrains Mono, monospace"
                  className="select-none"
                >
                  {transfers[0]?.taskTitle.slice(0, 14)}
                  {transfers[0] && transfers[0].taskTitle.length > 14 ? '...' : ''}
                </text>

                {transfers.map((t, i) => {
                  if (i === 0) return null;
                  const prev = transfers[i - 1];
                  const fromX = memberXPositions[prev.to.id] || 60;
                  const toX = memberXPositions[t.to.id] || 500;
                  const midY = laneY;

                  return (
                    <g key={`${t.id}-line`}>
                      <path
                        d={`M ${fromX} ${midY - 8} Q ${(fromX + toX) / 2} ${midY - 24} ${toX} ${midY - 8}`}
                        fill="none"
                        stroke={projColor}
                        strokeWidth={2}
                        opacity={hoveredNode === t.id ? 1 : 0.6}
                        className="transition-opacity duration-200"
                      />
                      <polygon
                        points={`${toX - 5},${midY - 12} ${toX},${midY - 8} ${toX - 5},${midY - 4}`}
                        fill={projColor}
                        opacity={hoveredNode === t.id ? 1 : 0.8}
                      />
                    </g>
                  );
                })}

                {transfers.map((t) => {
                  const x = memberXPositions[t.to.id] || 500;
                  return (
                    <g
                      key={t.id}
                      className="cursor-pointer"
                      onMouseEnter={() => setHoveredNode(t.id)}
                      onMouseLeave={() => setHoveredNode(null)}
                    >
                      <circle
                        cx={x}
                        cy={laneY - 8}
                        r={hoveredNode === t.id ? 8 : 6}
                        fill={t.from ? projColor : '#10b981'}
                        stroke="#050507"
                        strokeWidth={2}
                        className="transition-all duration-200"
                      />
                      {t.from && (
                        <text
                          x={x}
                          y={laneY + 14}
                          fill="#969699"
                          fontSize="9"
                          textAnchor="middle"
                          fontFamily="JetBrains Mono, monospace"
                        >
                          {t.to.initials}
                        </text>
                      )}
                    </g>
                  );
                })}
              </g>
            );
          })}
        </svg>

        {hoveredNode && (
          <div className="absolute top-2 right-2 glass-panel rounded-lg p-3 max-w-xs z-20">
            {(() => {
              const node = nodes.find((n) => n.id === hoveredNode);
              if (!node) return null;
              const proj = projects.find((p) => p.id === node.projectId);
              return (
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: getProjectColor(node.projectId) }} />
                    <span className="text-xs font-mono text-[#969699]">{proj?.name}</span>
                  </div>
                  <p className="text-sm font-medium text-[#f4f4f5]">{node.taskTitle}</p>
                  <div className="flex items-center gap-2 text-xs text-[#969699]">
                    {node.from ? (
                      <>
                        <span className="font-medium" style={{ color: node.from.color }}>{node.from.name}</span>
                        <ArrowRight className="w-3 h-3" />
                      </>
                    ) : (
                      <span className="text-[#10b981]">新创建</span>
                    )}
                    <span className="font-medium" style={{ color: node.to.color }}>{node.to.name}</span>
                  </div>
                  <div className="flex items-center gap-1 text-[10px] text-[#969699]">
                    <Clock className="w-3 h-3" />
                    {node.timestamp}
                  </div>
                </div>
              );
            })()}
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="flex-shrink-0 flex items-center gap-4 mt-3 pt-3 border-t border-[#1f1f22]">
        <div className="flex items-center gap-1.5 text-xs text-[#969699]">
          <div className="w-3 h-3 rounded-full bg-[#10b981]" />
          创建
        </div>
        {projects.slice(0, 4).map((p) => (
          <div key={p.id} className="flex items-center gap-1.5 text-xs text-[#969699]">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: getProjectColor(p.id) }} />
            {p.name}
          </div>
        ))}
      </div>
    </div>
  );
}
