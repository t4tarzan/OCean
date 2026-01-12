'use client';

import { useEffect, useState } from 'react';
import ReactFlow, { 
  Node, 
  Edge, 
  Background, 
  Controls, 
  MiniMap,
  useNodesState,
  useEdgesState,
  Panel
} from 'reactflow';
import 'reactflow/dist/style.css';
import { ArrowLeft, Maximize2 } from 'lucide-react';
import Link from 'next/link';

interface Decision {
  id: number;
  type: string;
  decision: string;
  reasoning: string;
  impact: string;
  made_by: string;
  created_at: string;
}

export default function DecisionMapPage() {
  const [decisions, setDecisions] = useState<Decision[]>([]);
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedNode, setSelectedNode] = useState<Decision | null>(null);

  useEffect(() => {
    fetchDecisions();
  }, []);

  const fetchDecisions = async () => {
    try {
      const res = await fetch('/api/decisions');
      const data = await res.json();
      const decisionsData = data.decisions || [];
      setDecisions(decisionsData);
      generateGraph(decisionsData);
      setIsLoading(false);
    } catch (error) {
      console.error('Failed to fetch decisions:', error);
      setIsLoading(false);
    }
  };

  const generateGraph = (decisions: Decision[]) => {
    const nodeList: Node[] = [];
    const edgeList: Edge[] = [];
    
    // Group decisions by type
    const typeGroups = decisions.reduce((acc, decision) => {
      if (!acc[decision.type]) acc[decision.type] = [];
      acc[decision.type].push(decision);
      return acc;
    }, {} as Record<string, Decision[]>);

    let yOffset = 0;
    const typePositions: Record<string, number> = {};

    Object.entries(typeGroups).forEach(([type, typedDecisions], typeIndex) => {
      typePositions[type] = yOffset;

      typedDecisions.forEach((decision, index) => {
        const nodeId = `decision-${decision.id}`;
        const xPos = (index % 4) * 320 + 50;
        const yPos = yOffset + Math.floor(index / 4) * 180;

        nodeList.push({
          id: nodeId,
          type: 'default',
          position: { x: xPos, y: yPos },
          data: {
            label: (
              <div className="p-3 cursor-pointer" onClick={() => setSelectedNode(decision)}>
                <div className="font-semibold text-sm mb-1 line-clamp-2">{decision.decision}</div>
                <div className="text-xs text-gray-500 capitalize">{decision.type}</div>
                <div className={`text-xs mt-1 font-medium ${getImpactColor(decision.impact)}`}>
                  {decision.impact}
                </div>
              </div>
            ),
          },
          style: {
            background: getColorForImpact(decision.impact),
            border: `2px solid ${getBorderColor(decision.impact)}`,
            borderRadius: '12px',
            width: 280,
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
          },
        });

        // Create edges between decisions of related types
        if (index > 0) {
          const prevNodeId = `decision-${typedDecisions[index - 1].id}`;
          edgeList.push({
            id: `edge-${prevNodeId}-${nodeId}`,
            source: prevNodeId,
            target: nodeId,
            type: 'smoothstep',
            animated: decision.impact === 'critical',
            style: { stroke: '#94a3b8', strokeWidth: 2 },
          });
        }
      });

      yOffset += Math.ceil(typedDecisions.length / 4) * 180 + 120;
    });

    setNodes(nodeList);
    setEdges(edgeList);
  };

  const getColorForImpact = (impact: string) => {
    switch (impact) {
      case 'critical': return '#fee2e2';
      case 'high': return '#fef3c7';
      case 'medium': return '#dbeafe';
      case 'low': return '#f0fdf4';
      default: return '#f3f4f6';
    }
  };

  const getBorderColor = (impact: string) => {
    switch (impact) {
      case 'critical': return '#dc2626';
      case 'high': return '#f59e0b';
      case 'medium': return '#3b82f6';
      case 'low': return '#10b981';
      default: return '#6b7280';
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'critical': return 'text-red-600';
      case 'high': return 'text-orange-600';
      case 'medium': return 'text-blue-600';
      case 'low': return 'text-green-600';
      default: return 'text-gray-600';
    }
  };

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading decision map...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/decisions" className="text-gray-600 hover:text-gray-900">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Decision Map</h1>
            <p className="text-sm text-gray-600">Visual representation of architecture decisions</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="text-sm text-gray-600">
            <span className="font-semibold">{decisions.length}</span> decisions mapped
          </div>
        </div>
      </div>

      {/* Graph */}
      <div className="flex-1 bg-gray-50">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          fitView
          attributionPosition="bottom-left"
        >
          <Background color="#e5e7eb" gap={16} />
          <Controls />
          <MiniMap 
            nodeColor={(node) => {
              const decision = decisions.find(d => `decision-${d.id}` === node.id);
              return decision ? getBorderColor(decision.impact) : '#6b7280';
            }}
            maskColor="rgba(0, 0, 0, 0.1)"
          />
          
          <Panel position="top-right" className="bg-white p-4 rounded-lg shadow-lg border border-gray-200 max-w-sm">
            <h3 className="font-semibold text-sm mb-2">Legend</h3>
            <div className="space-y-1 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded border-2 border-red-600 bg-red-100"></div>
                <span>Critical Impact</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded border-2 border-orange-600 bg-orange-100"></div>
                <span>High Impact</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded border-2 border-blue-600 bg-blue-100"></div>
                <span>Medium Impact</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded border-2 border-green-600 bg-green-100"></div>
                <span>Low Impact</span>
              </div>
            </div>
          </Panel>
        </ReactFlow>
      </div>

      {/* Selected Node Details */}
      {selectedNode && (
        <div className="absolute bottom-4 left-4 bg-white p-4 rounded-lg shadow-xl border border-gray-200 max-w-md">
          <div className="flex items-start justify-between mb-2">
            <h3 className="font-semibold text-lg">{selectedNode.decision}</h3>
            <button 
              onClick={() => setSelectedNode(null)}
              className="text-gray-400 hover:text-gray-600"
            >
              ×
            </button>
          </div>
          <div className="space-y-2 text-sm">
            <div>
              <span className="text-gray-600">Type:</span>
              <span className="ml-2 font-medium capitalize">{selectedNode.type}</span>
            </div>
            <div>
              <span className="text-gray-600">Impact:</span>
              <span className={`ml-2 font-medium ${getImpactColor(selectedNode.impact)}`}>
                {selectedNode.impact}
              </span>
            </div>
            {selectedNode.reasoning && (
              <div>
                <span className="text-gray-600">Reasoning:</span>
                <p className="mt-1 text-gray-700">{selectedNode.reasoning}</p>
              </div>
            )}
            <div>
              <span className="text-gray-600">Made by:</span>
              <span className="ml-2 font-medium">{selectedNode.made_by || 'team'}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
