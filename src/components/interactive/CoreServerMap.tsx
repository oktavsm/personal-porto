import { ArrowRight, Server } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { coreServerNodes as fallbackNodes, type CoreServerNode } from "../../data/coreServerNodes";
import { publicApi } from "../../lib/publicApi";
import { FormattedText } from "../FormattedText";
import { ServerVisual } from "../ServerVisual";

type CoreServerMapProps = {
  kicker?: string;
  title?: string;
  body?: string;
  selectedKicker?: string;
  centerLabel?: string;
  linkLabel?: string;
  anchorId?: string;
};

export function CoreServerMap({
  kicker = "Interactive self-symbol",
  title = "Core Server as a living map.",
  body = "I chose a core server as my self-symbol because it reflects how I understand myself: steady, connected, structured, and useful. Each node represents a part of my portfolio, from identity and values to projects and experiences.\n\nClick a node to see how each part connects to the rest of my story.",
  selectedKicker = "Selected node",
  centerLabel = "Core Server",
  linkLabel = "Open related page",
  anchorId = "core-server-map",
}: CoreServerMapProps) {
  const [nodes, setNodes] = useState<CoreServerNode[]>(fallbackNodes);
  const [activeNodeId, setActiveNodeId] = useState(fallbackNodes[0].id);

  useEffect(() => {
    let active = true;
    publicApi.coreNodes().then((response) => {
      if (!active || response.data.length === 0) return;
      const apiNodes: CoreServerNode[] = response.data.map((node) => ({
        id: node.id,
        label: node.label,
        description: node.description,
        href: node.href,
        position: { x: node.positionX, y: node.positionY },
      }));
      setNodes(apiNodes);
      setActiveNodeId(apiNodes[0].id);
    }).catch(() => undefined);
    return () => { active = false; };
  }, []);

  const activeNode = nodes.find((node) => node.id === activeNodeId) ?? nodes[0];

  return (
    <section className="interactive-section core-map-section" id={anchorId}>
      <div className="container">
        <div className="interactive-head">
          <div>
            <div className="section-kicker">{kicker}</div>
            <h2>{title}</h2>
          </div>
          <p><FormattedText text={body} /></p>
        </div>

        <div className="core-map-layout">
          <div className="core-map-visual">
            <ServerVisual />
            <div className="core-center-chip">
              <Server size={16} />
              {centerLabel}
            </div>
            {nodes.map((node) => (
              <button
                className={`core-node ${activeNode.id === node.id ? "core-node-active" : ""}`}
                style={{ left: `${node.position.x}%`, top: `${node.position.y}%` }}
                type="button"
                key={node.id}
                onClick={() => setActiveNodeId(node.id)}
              >
                {node.label}
              </button>
            ))}
          </div>

          <div className="core-node-panel">
            <div className="section-kicker">{selectedKicker}</div>
            <h3>{activeNode.label}</h3>
            <p>{activeNode.description}</p>
            <Link className="inline-link" to={activeNode.href}>
              {linkLabel} <ArrowRight size={15} />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
