import { ArrowRight, Server } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { coreServerNodes } from "../../data/coreServerNodes";
import { ServerVisual } from "../ServerVisual";

export function CoreServerMap() {
  const [activeNodeId, setActiveNodeId] = useState(coreServerNodes[0].id);
  const activeNode = coreServerNodes.find((node) => node.id === activeNodeId) ?? coreServerNodes[0];

  return (
    <section className="interactive-section core-map-section" id="core-server-map">
      <div className="container">
        <div className="interactive-head">
          <div>
            <div className="section-kicker">Interactive self-symbol</div>
            <h2>Core server as a living map.</h2>
          </div>
          <p>
            I chose core server because it reflects how I understand myself: quiet, connected, structured, and useful.
            Click a node to see how the symbol routes into the rest of this portfolio.
          </p>
        </div>

        <div className="core-map-layout">
          <div className="core-map-visual">
            <ServerVisual />
            <div className="core-center-chip">
              <Server size={16} />
              Core Server
            </div>
            {coreServerNodes.map((node) => (
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
            <div className="section-kicker">Selected node</div>
            <h3>{activeNode.label}</h3>
            <p>{activeNode.description}</p>
            <Link className="inline-link" to={activeNode.href}>
              Open related page <ArrowRight size={15} />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
