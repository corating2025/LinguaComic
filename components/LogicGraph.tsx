import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { LogicGraphData, LogicNode, LogicLink } from '../types';

interface LogicGraphProps {
  data: LogicGraphData;
  onUpdate: (newData: LogicGraphData) => void;
}

const LogicGraph: React.FC<LogicGraphProps> = ({ data, onUpdate }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<LogicGraphData>(data);

  useEffect(() => {
    setEditData(data);
  }, [data]);

  useEffect(() => {
    if (!data || !svgRef.current || !wrapperRef.current || isEditing) return;

    // Clear previous graph
    d3.select(svgRef.current).selectAll("*").remove();

    const width = wrapperRef.current.clientWidth;
    const height = 500;

    const svg = d3.select(svgRef.current)
      .attr("width", width)
      .attr("height", height)
      .attr("viewBox", [0, 0, width, height])
      .attr("style", "max-width: 100%; height: auto; font-family: sans-serif;");

    // Prepare data
    // Create a copy to prevent mutation issues with React state
    const nodes = data.nodes.map(d => ({ ...d }));
    const links = data.links.map(d => ({ ...d }));

    const simulation = d3.forceSimulation(nodes as any)
      .force("link", d3.forceLink(links).id((d: any) => d.id).distance(120))
      .force("charge", d3.forceManyBody().strength(-300))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collide", d3.forceCollide().radius(40));

    // Arrow marker
    svg.append("defs").selectAll("marker")
      .data(["end"])
      .enter().append("marker")
      .attr("id", "arrow")
      .attr("viewBox", "0 -5 10 10")
      .attr("refX", 25)
      .attr("refY", 0)
      .attr("markerWidth", 6)
      .attr("markerHeight", 6)
      .attr("orient", "auto")
      .append("path")
      .attr("fill", "#94a3b8")
      .attr("d", "M0,-5L10,0L0,5");

    const link = svg.append("g")
      .attr("stroke", "#94a3b8")
      .attr("stroke-opacity", 0.6)
      .selectAll("line")
      .data(links)
      .join("line")
      .attr("stroke-width", 2)
      .attr("marker-end", "url(#arrow)");

    const linkLabel = svg.append("g")
        .attr("class", "link-labels")
        .selectAll("text")
        .data(links)
        .enter().append("text")
        .attr("font-size", 10)
        .attr("fill", "#64748b")
        .attr("text-anchor", "middle")
        .text((d: any) => d.relationship);

    const node = svg.append("g")
      .attr("stroke", "#fff")
      .attr("stroke-width", 1.5)
      .selectAll("g")
      .data(nodes)
      .join("g")
      .call((d3.drag() as any)
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended));

    // Node circles
    node.append("circle")
      .attr("r", 25)
      .attr("fill", (d: any) => d.group === 1 ? "#6366f1" : (d.group === 2 ? "#ec4899" : "#14b8a6")) // indigo, pink, teal
      .attr("class", "cursor-pointer transition-opacity hover:opacity-80");

    // Node labels
    node.append("text")
      .attr("x", 0)
      .attr("y", 35) // Below the circle
      .attr("text-anchor", "middle")
      .attr("stroke", "none")
      .attr("fill", "#1e293b")
      .attr("font-size", 12)
      .attr("font-weight", "bold")
      .text((d: any) => d.label)
      .clone(true).lower()
      .attr("stroke", "white")
      .attr("stroke-width", 3);

    simulation.on("tick", () => {
      link
        .attr("x1", (d: any) => d.source.x)
        .attr("y1", (d: any) => d.source.y)
        .attr("x2", (d: any) => d.target.x)
        .attr("y2", (d: any) => d.target.y);

      linkLabel
        .attr("x", (d: any) => (d.source.x + d.target.x) / 2)
        .attr("y", (d: any) => (d.source.y + d.target.y) / 2 - 5);

      node
        .attr("transform", (d: any) => `translate(${d.x},${d.y})`);
    });

    function dragstarted(event: any, d: any) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      d.fx = d.x;
      d.fy = d.y;
    }

    function dragged(event: any, d: any) {
      d.fx = event.x;
      d.fy = event.y;
    }

    function dragended(event: any, d: any) {
      if (!event.active) simulation.alphaTarget(0);
      d.fx = null;
      d.fy = null;
    }

    return () => {
      simulation.stop();
    };
  }, [data, isEditing]);

  const handleSave = () => {
    onUpdate(editData);
    setIsEditing(false);
  };

  // Simple editor helpers
  const addNode = () => setEditData({...editData, nodes: [...editData.nodes, { id: `n${Date.now()}`, label: 'New', group: 1 }]});
  const removeNode = (idx: number) => setEditData({...editData, nodes: editData.nodes.filter((_, i) => i !== idx)});
  const updateNode = (idx: number, field: keyof LogicNode, val: any) => {
    const newNodes = [...editData.nodes];
    newNodes[idx] = { ...newNodes[idx], [field]: val };
    setEditData({...editData, nodes: newNodes});
  }
  
  const addLink = () => setEditData({...editData, links: [...editData.links, { source: editData.nodes[0]?.id || '', target: '', relationship: '' }]});
  const removeLink = (idx: number) => setEditData({...editData, links: editData.links.filter((_, i) => i !== idx)});
  const updateLink = (idx: number, field: keyof LogicLink, val: any) => {
    const newLinks = [...editData.links];
    newLinks[idx] = { ...newLinks[idx], [field]: val };
    setEditData({...editData, links: newLinks});
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end space-x-2">
        {isEditing ? (
           <>
             <button onClick={handleSave} className="bg-green-600 text-white px-3 py-1 rounded text-sm">Save Changes</button>
             <button onClick={() => setIsEditing(false)} className="bg-slate-400 text-white px-3 py-1 rounded text-sm">Cancel</button>
           </>
        ) : (
           <button onClick={() => setIsEditing(true)} className="bg-indigo-600 text-white px-3 py-1 rounded text-sm">Edit Logic</button>
        )}
      </div>

      {isEditing ? (
        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-inner h-[500px] overflow-y-auto">
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             {/* Nodes Editor */}
             <div>
               <div className="flex justify-between mb-2">
                 <h4 className="font-bold text-slate-700">Nodes</h4>
                 <button onClick={addNode} className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded">+ Add Node</button>
               </div>
               <div className="space-y-2">
                 {editData.nodes.map((node, idx) => (
                   <div key={idx} className="flex gap-2 items-center">
                     <input type="text" value={node.id} onChange={e => updateNode(idx, 'id', e.target.value)} className="w-1/4 border p-1 text-xs rounded" placeholder="ID" />
                     <input type="text" value={node.label} onChange={e => updateNode(idx, 'label', e.target.value)} className="w-1/2 border p-1 text-xs rounded" placeholder="Label" />
                     <button onClick={() => removeNode(idx)} className="text-red-500 text-xs">✕</button>
                   </div>
                 ))}
               </div>
             </div>

             {/* Links Editor */}
             <div>
              <div className="flex justify-between mb-2">
                 <h4 className="font-bold text-slate-700">Links</h4>
                 <button onClick={addLink} className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded">+ Add Link</button>
               </div>
               <div className="space-y-2">
                 {editData.links.map((link, idx) => (
                   <div key={idx} className="flex gap-2 items-center flex-wrap p-2 bg-slate-50 rounded border border-slate-100">
                     <input type="text" value={link.source} onChange={e => updateLink(idx, 'source', e.target.value)} className="w-1/4 border p-1 text-xs rounded" placeholder="Source ID" />
                     <span className="text-slate-400">→</span>
                     <input type="text" value={link.target} onChange={e => updateLink(idx, 'target', e.target.value)} className="w-1/4 border p-1 text-xs rounded" placeholder="Target ID" />
                     <input type="text" value={link.relationship} onChange={e => updateLink(idx, 'relationship', e.target.value)} className="w-1/3 border p-1 text-xs rounded" placeholder="Rel" />
                     <button onClick={() => removeLink(idx)} className="text-red-500 text-xs">✕</button>
                   </div>
                 ))}
               </div>
             </div>
           </div>
        </div>
      ) : (
        <div ref={wrapperRef} className="w-full h-[500px] bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden relative">
          <div className="absolute top-4 left-4 bg-white/90 p-2 rounded-lg text-xs text-slate-500 shadow-sm z-10 pointer-events-none">
            Drag nodes to rearrange
          </div>
          <svg ref={svgRef} className="w-full h-full"></svg>
        </div>
      )}
    </div>
  );
};

export default LogicGraph;