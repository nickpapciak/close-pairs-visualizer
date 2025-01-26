import React, { useState, useCallback, useEffect, useMemo } from "react";
import { InlineMath, BlockMath } from "react-katex"; // Import LaTeX components
import "katex/dist/katex.min.css"; // Import KaTeX CSS

const VectorPointsVisualization = () => {
  const [n, setN] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });

  // some random unit vectors
  // I asked deepseek to generate
  const maxVectors = useMemo(() => {
    return [
      { x: 0.7071067811865476, y: -0.7071067811865475 },
      { x: 0.8660254037844387, y: 0.49999999999999994 },
      { x: -0.2588190451025207, y: 0.9659258262890683 },
      { x: -0.6427876096865393, y: -0.766044443118978 },
      { x: 0.9396926207859084, y: -0.3420201433256687 },
      { x: -0.1736481776669303, y: -0.984807753012208 },
      { x: 0.42261826174069944, y: 0.9063077870366499 },
      { x: -0.9063077870366499, y: 0.42261826174069944 },
      { x: 0.573576436351046, y: 0.8191520442889918 },
      { x: -0.8191520442889918, y: 0.573576436351046 },
      { x: 0.08715574274765817, y: -0.9961946980917455 },
      { x: -0.9961946980917455, y: -0.08715574274765817 },
      { x: 0.3090169943749474, y: 0.9510565162951535 },
    ];
  }, []);

  const maxPossibleExtent = useMemo(() => {
    const allPoints = generatePoints(maxVectors);
    const maxX = Math.max(...allPoints.map((p) => Math.abs(p.x))) || 1;
    const maxY = Math.max(...allPoints.map((p) => Math.abs(p.y))) || 1;
    return Math.max(maxX, maxY);
  }, [maxVectors]);

  useEffect(() => {
    const updateDimensions = () => {
      setDimensions({
        width: Math.min(800, window.innerWidth - 48),
        height: Math.min(600, window.innerHeight - 200),
      });
    };

    updateDimensions();
    window.addEventListener("resize", updateDimensions);
    return () => window.removeEventListener("resize", updateDimensions);
  }, []);

  useEffect(() => {
    const svgContainer = document.querySelector(".svg-container");

    const handleWheel = (e) => {
      e.preventDefault();
      const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
      setZoom((prevZoom) => Math.max(0.4, Math.min(10, prevZoom * zoomFactor)));
    };

    if (svgContainer) {
      svgContainer.addEventListener("wheel", handleWheel, { passive: false });
      return () => svgContainer.removeEventListener("wheel", handleWheel);
    }
  }, []);

  function generatePoints(vectors) {
    let points = new Set(["0,0"]);

    for (let i = 0; i < vectors.length; i++) {
      const vector = vectors[i];
      const currentPoints = Array.from(points).map((p) => {
        const [x, y] = p.split(",").map(Number);
        return { x, y };
      });

      currentPoints.forEach((point) => {
        const newPoint = {
          x: point.x + vector.x,
          y: point.y + vector.y,
        };
        const newPointStr = `${newPoint.x},${newPoint.y}`;
        points.add(newPointStr);
      });
    }

    return Array.from(points).map((p) => {
      const [x, y] = p.split(",").map(Number);
      return { x, y };
    });
  }

  const points = useMemo(
    () => generatePoints(maxVectors.slice(0, n)),
    [n, maxVectors],
  );

  // Hardcoded close pairs count
  const closePairsCount = useMemo(() => {
    const counts = [0, 1, 4, 12, 32, 80, 192, 448, 1024, 2304, 5120];
    return counts[n] || 0;
  }, [n]);

  // Function to get all close pairs (for visualization)
  const getClosePairs = (points, vectors) => {
    if (vectors.length === 0) return []; // Handle n = 0 case
    const closePairs = [];
    const lastVector = vectors[vectors.length - 1]; // Get the last vector used

    for (let i = 0; i < points.length / 2; i++) {
      const originalPoint = points[i];
      const duplicatePoint = {
        x: originalPoint.x + lastVector.x,
        y: originalPoint.y + lastVector.y,
      };
      closePairs.push([originalPoint, duplicatePoint]);
    }
    return closePairs;
  };

  const closePairs = useMemo(
    () => getClosePairs(points, maxVectors.slice(0, n)),
    [points, n],
  );

  const baseScale = Math.min(
    (dimensions.width * 0.4) / maxPossibleExtent,
    (dimensions.height * 0.4) / maxPossibleExtent,
  );
  const scale = baseScale * zoom;

  const centerX = dimensions.width / 2;
  const centerY = dimensions.height / 2;

  const handleMouseDown = (e) => {
    setIsDragging(true);
    setDragStart({
      x: e.clientX - pan.x,
      y: e.clientY - pan.y,
    });
  };

  const handleMouseMove = (e) => {
    if (isDragging) {
      setPan({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const resetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  const gridSize = 40;
  const visibleGridLines = 41;
  const halfGridLines = Math.floor(visibleGridLines / 2);

  return (
    <div className="min-h-screen bg-slate-100 p-6 flex justify-center items-center">
      <div className="w-full max-w-4xl bg-white rounded-xl shadow-lg p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">
            Close Point Algoritm Visualizer
          </h1>
          <p className="text-gray-600 mb-4">
            Generates <InlineMath math={`\\Omega(n\\log(n))`} /> close points.
            Use the slider to adjust the number of points, scroll to zoom, and
            drag to pan.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="col-span-3">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <InlineMath math={`n = ${Math.pow(2, n)} \\text{ points}`} />
            </label>
            <input
              type="range"
              min="0"
              max="12" // Max n set to 10
              value={n}
              onChange={(e) => setN(parseInt(e.target.value))}
              className="w-full"
            />
          </div>
          <div className="flex items-center gap-4 justify-end">
            <div className="text-sm text-gray-600">
              Zoom: {zoom.toFixed(2)}x
            </div>
            <button
              onClick={resetView}
              className="px-4 py-2 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              Reset View
            </button>
          </div>
        </div>

        <div className="overflow-hidden rounded-lg bg-gray-50 border border-gray-200 svg-container">
          <svg
            width={dimensions.width}
            height={dimensions.height}
            className="cursor-move"
            viewBox={`0 0 ${dimensions.width} ${dimensions.height}`}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          >
            <g transform={`translate(${pan.x}, ${pan.y})`}>
              {/* Grid lines */}
              {Array.from(
                { length: visibleGridLines },
                (_, i) => i - halfGridLines,
              ).map((i) => {
                const x = centerX + i * gridSize * zoom;
                const y = centerY + i * gridSize * zoom;
                return (
                  <React.Fragment key={i}>
                    <line
                      x1={x}
                      y1={-dimensions.height}
                      x2={x}
                      y2={dimensions.height * 2}
                      stroke="#f0f0f0"
                      strokeWidth="1"
                    />
                    <line
                      x1={-dimensions.width}
                      y1={y}
                      x2={dimensions.width * 2}
                      y2={y}
                      stroke="#f0f0f0"
                      strokeWidth="1"
                    />
                  </React.Fragment>
                );
              })}

              {/* Coordinate axes */}
              <line
                x1={-dimensions.width}
                y1={centerY}
                x2={dimensions.width * 2}
                y2={centerY}
                stroke="#ddd"
                strokeWidth="2"
              />
              <line
                x1={centerX}
                y1={-dimensions.height}
                x2={centerX}
                y2={dimensions.height * 2}
                stroke="#ddd"
                strokeWidth="2"
              />

              {/* Lines between close pairs */}
              {closePairs.map(([p1, p2], i) => (
                <line
                  key={i}
                  x1={centerX + p1.x * scale}
                  y1={centerY - p1.y * scale}
                  x2={centerX + p2.x * scale}
                  y2={centerY - p2.y * scale}
                  stroke="#666" // Grey color
                  strokeWidth={0.2} // Fixed thin lines
                  strokeOpacity={0.8} // Higher opacity for last batch
                />
              ))}

              {/* Points */}
              {points.map((point, i) => (
                <circle
                  key={i}
                  cx={centerX + point.x * scale}
                  cy={centerY - point.y * scale}
                  r={3 / Math.sqrt(zoom)} // Slightly larger dots
                  fill="#4299e1"
                />
              ))}
            </g>
          </svg>
        </div>

        <div className="mt-4 flex justify-between text-sm text-gray-600">
          <div>
            Total points: <InlineMath math={`${points.length}`} />
          </div>
          <div>
            Close pairs: <InlineMath math={`${closePairsCount}`} />
          </div>
          <div className="text-gray-500">Scroll to zoom, drag to pan</div>
        </div>
      </div>
    </div>
  );
};

export default VectorPointsVisualization;
