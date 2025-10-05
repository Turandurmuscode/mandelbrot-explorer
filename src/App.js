import React, { useState, useRef, useEffect } from 'react';
import { ZoomIn, ZoomOut, Home, Palette, Info, Sparkles, Loader } from 'lucide-react';

export default function MandelbrotExplorer() {
  const [zoom, setZoom] = useState(1);
  const [centerX, setCenterX] = useState(-0.5);
  const [centerY, setCenterY] = useState(0);
  const [maxIterations, setMaxIterations] = useState(100);
  const [colorScheme, setColorScheme] = useState('cosmic');
  const [isComputing, setIsComputing] = useState(false);
  const [showInfo, setShowInfo] = useState(true);
  const [mousePos, setMousePos] = useState(null);
  const [zoomHistory, setZoomHistory] = useState([]);
  
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  
  const colorSchemes = {
    cosmic: (n, max) => {
      if (n === max) return [0, 0, 0];
      const hue = (n / max) * 360;
      const sat = 100;
      const light = n < max ? 50 + (n / max) * 50 : 0;
      return hslToRgb(hue, sat, light);
    },
    fire: (n, max) => {
      if (n === max) return [0, 0, 0];
      const t = n / max;
      return [
        Math.floor(255 * Math.min(1, t * 2)),
        Math.floor(255 * Math.min(1, Math.max(0, (t - 0.5) * 2))),
        Math.floor(100 * Math.max(0, (t - 0.8) * 5))
      ];
    },
    ocean: (n, max) => {
      if (n === max) return [0, 0, 0];
      const t = n / max;
      return [
        Math.floor(20 + 100 * t),
        Math.floor(50 + 150 * t),
        Math.floor(150 + 105 * t)
      ];
    },
    psychedelic: (n, max) => {
      if (n === max) return [0, 0, 0];
      const t = n / max;
      return [
        Math.floor(128 + 127 * Math.sin(t * Math.PI * 4)),
        Math.floor(128 + 127 * Math.sin(t * Math.PI * 4 + 2)),
        Math.floor(128 + 127 * Math.sin(t * Math.PI * 4 + 4))
      ];
    },
    monochrome: (n, max) => {
      if (n === max) return [0, 0, 0];
      const gray = Math.floor(255 * (n / max));
      return [gray, gray, gray];
    }
  };
  
  function hslToRgb(h, s, l) {
    s /= 100;
    l /= 100;
    const k = n => (n + h / 30) % 12;
    const a = s * Math.min(l, 1 - l);
    const f = n => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
    return [
      Math.floor(255 * f(0)),
      Math.floor(255 * f(8)),
      Math.floor(255 * f(4))
    ];
  }
  
  const mandelbrot = (cx, cy, maxIter) => {
    let x = 0, y = 0;
    let iteration = 0;
    
    while (x * x + y * y <= 4 && iteration < maxIter) {
      const xTemp = x * x - y * y + cx;
      y = 2 * x * y + cy;
      x = xTemp;
      iteration++;
    }
    
    if (iteration < maxIter) {
      const log_zn = Math.log(x * x + y * y) / 2;
      const nu = Math.log(log_zn / Math.log(2)) / Math.log(2);
      iteration = iteration + 1 - nu;
    }
    
    return iteration;
  };
  
  const drawMandelbrot = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    setIsComputing(true);
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    const imageData = ctx.createImageData(width, height);
    
    const aspectRatio = width / height;
    const rangeX = 3.5 / zoom;
    const rangeY = rangeX / aspectRatio;
    
    let maxIterFound = 0;
    const iterations = [];
    
    for (let py = 0; py < height; py++) {
      for (let px = 0; px < width; px++) {
        const x0 = centerX + (px / width - 0.5) * rangeX;
        const y0 = centerY + (py / height - 0.5) * rangeY;
        
        const iter = mandelbrot(x0, y0, maxIterations);
        iterations.push(iter);
        maxIterFound = Math.max(maxIterFound, iter);
      }
    }
    
    let idx = 0;
    for (let py = 0; py < height; py++) {
      for (let px = 0; px < width; px++) {
        const iter = iterations[idx++];
        const [r, g, b] = colorSchemes[colorScheme](iter, maxIterations);
        
        const offset = (py * width + px) * 4;
        imageData.data[offset] = r;
        imageData.data[offset + 1] = g;
        imageData.data[offset + 2] = b;
        imageData.data[offset + 3] = 255;
      }
    }
    
    ctx.putImageData(imageData, 0, 0);
    
    // Overlay bilgileri
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(10, 10, 280, 100);
    
    ctx.fillStyle = '#00ff88';
    ctx.font = 'bold 14px monospace';
    ctx.fillText(`Zoom: ${zoom.toExponential(2)}x`, 20, 30);
    ctx.fillText(`İterasyonlar: ${maxIterations}`, 20, 50);
    ctx.fillText(`Merkez: (${centerX.toFixed(6)}, ${centerY.toFixed(6)})`, 20, 70);
    ctx.fillText(`Renk: ${colorScheme}`, 20, 90);
    
    setIsComputing(false);
  };
  
  useEffect(() => {
    drawMandelbrot();
  }, [zoom, centerX, centerY, maxIterations, colorScheme]);
  
  const handleCanvasClick = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const aspectRatio = canvas.width / canvas.height;
    const rangeX = 3.5 / zoom;
    const rangeY = rangeX / aspectRatio;
    
    const newCenterX = centerX + (x / canvas.width - 0.5) * rangeX;
    const newCenterY = centerY + (y / canvas.height - 0.5) * rangeY;
    
    setZoomHistory([...zoomHistory, { x: centerX, y: centerY, z: zoom }]);
    setCenterX(newCenterX);
    setCenterY(newCenterY);
    setZoom(zoom * 2);
    
    if (maxIterations < 500) {
      setMaxIterations(Math.min(500, maxIterations + 20));
    }
  };
  
  const handleMouseMove = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const aspectRatio = canvas.width / canvas.height;
    const rangeX = 3.5 / zoom;
    const rangeY = rangeX / aspectRatio;
    
    const complexX = centerX + (x / canvas.width - 0.5) * rangeX;
    const complexY = centerY + (y / canvas.height - 0.5) * rangeY;
    
    setMousePos({ x: complexX, y: complexY, px: x, py: y });
  };
  
  const zoomIn = () => {
    setZoom(zoom * 2);
    if (maxIterations < 500) {
      setMaxIterations(Math.min(500, maxIterations + 20));
    }
  };
  
  const zoomOut = () => {
    setZoom(Math.max(1, zoom / 2));
  };
  
  const reset = () => {
    setZoom(1);
    setCenterX(-0.5);
    setCenterY(0);
    setMaxIterations(100);
    setZoomHistory([]);
  };
  
  const goBack = () => {
    if (zoomHistory.length > 0) {
      const last = zoomHistory[zoomHistory.length - 1];
      setCenterX(last.x);
      setCenterY(last.y);
      setZoom(last.z);
      setZoomHistory(zoomHistory.slice(0, -1));
    }
  };
  
  const interestingPoints = [
    { name: 'Seahorse Valley', x: -0.75, y: 0.1, zoom: 100, desc: 'Denizatı şeklindeki vadi' },
    { name: 'Double Spiral', x: -0.7269, y: 0.1889, zoom: 1000, desc: 'Çift spiral yapı' },
    { name: 'Mini Mandelbrot', x: -0.1592, y: -1.0317, zoom: 50, desc: 'Küçük Mandelbrot kopyası' },
    { name: 'Elephant Valley', x: 0.3, y: 0.03, zoom: 50, desc: 'Fil vadisi' }
  ];
  
  const jumpToPoint = (point) => {
    setCenterX(point.x);
    setCenterY(point.y);
    setZoom(point.zoom);
    setMaxIterations(200);
    setZoomHistory([]);
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-purple-950 to-black p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Sparkles className="text-purple-400 animate-pulse" size={32} />
            <h1 className="text-4xl md:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400">
              Mandelbrot Set
            </h1>
            <Sparkles className="text-blue-400 animate-pulse" size={32} />
          </div>
          <p className="text-xl text-gray-300">
            Sonsuzluğa Matematiksel Yolculuk - Fraktal Evren
          </p>
          <p className="text-sm text-purple-400 mt-2 font-mono">
            z<sub>n+1</sub> = z<sub>n</sub>² + c
          </p>
        </div>
        
        {showInfo && (
          <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 backdrop-blur-lg rounded-2xl p-6 mb-6 border border-purple-500/30 animate-fade-in">
            <div className="flex items-start gap-3">
              <Info className="text-purple-400 mt-1 flex-shrink-0" size={24} />
              <div className="flex-1">
                <h3 className="text-xl font-bold text-purple-400 mb-2">Mandelbrot Set Nedir?</h3>
                <p className="text-gray-300 mb-3">
                  1980'de Benoit Mandelbrot tarafından keşfedilen bu fraktal, matematik tarihinin en ünlü ve büyüleyici yapılarından biridir. 
                  Her kompleks sayı c için z = z² + c iterasyonu yapılır. Eğer z sonsuza gitmezse, o nokta set'in içindedir (siyah).
                </p>
                <div className="bg-black/40 rounded-lg p-3 mb-3">
                  <p className="text-gray-300 text-sm mb-2">🔍 <strong>İlginç Gerçek:</strong> Ne kadar zoom yaparsanız yapın, sonsuza kadar yeni detaylar görürsünüz!</p>
                  <p className="text-gray-300 text-sm">🎨 <strong>Renkler:</strong> Her renk, o noktanın kaç iterasyonda "patladığını" gösterir</p>
                </div>
                <button 
                  onClick={() => setShowInfo(false)}
                  className="text-sm text-purple-400 hover:text-purple-300"
                >
                  Gizle
                </button>
              </div>
            </div>
          </div>
        )}
        
        <div className="grid lg:grid-cols-4 gap-6">
          
          <div className="lg:col-span-3 bg-white/5 backdrop-blur-lg rounded-2xl p-4 border border-white/10">
            <div className="relative">
              {isComputing && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-xl z-10">
                  <div className="flex items-center gap-3 bg-purple-500/20 backdrop-blur-lg px-6 py-3 rounded-full border border-purple-500/30">
                    <Loader className="animate-spin text-purple-400" size={24} />
                    <span className="text-white font-semibold">Hesaplanıyor...</span>
                  </div>
                </div>
              )}
              
              <canvas
                ref={canvasRef}
                width={1000}
                height={700}
                className="w-full rounded-xl cursor-crosshair border-2 border-purple-500/30 hover:border-purple-500/50 transition-all"
                onClick={handleCanvasClick}
                onMouseMove={handleMouseMove}
                onMouseLeave={() => setMousePos(null)}
              />
              
              {mousePos && (
                <div 
                  className="absolute bg-black/80 text-white text-xs px-3 py-2 rounded-lg font-mono pointer-events-none border border-purple-500/50"
                  style={{ 
                    left: mousePos.px + 10, 
                    top: mousePos.py + 10,
                    transform: mousePos.px > 500 ? 'translateX(-100%)' : 'none'
                  }}
                >
                  <div className="text-purple-400">c = {mousePos.x.toFixed(6)}</div>
                  <div className="text-pink-400">+ {mousePos.y.toFixed(6)}i</div>
                </div>
              )}
            </div>
            
            <div className="mt-4 text-center text-gray-400 text-sm">
              💡 Tıklayarak o noktaya zoom yapın • Fare ile koordinatları görün
            </div>
          </div>
          
          <div className="space-y-4">
            
            <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-4 border border-white/10">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <ZoomIn className="text-blue-400" size={20} />
                Kontroller
              </h3>
              
              <div className="space-y-3">
                <button
                  onClick={zoomIn}
                  className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white px-4 py-3 rounded-xl font-semibold transition-all transform hover:scale-105"
                >
                  <ZoomIn size={18} />
                  Zoom In (2x)
                </button>
                
                <button
                  onClick={zoomOut}
                  className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-4 py-3 rounded-xl font-semibold transition-all transform hover:scale-105"
                >
                  <ZoomOut size={18} />
                  Zoom Out
                </button>
                
                <button
                  onClick={goBack}
                  disabled={zoomHistory.length === 0}
                  className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-semibold transition-all ${
                    zoomHistory.length === 0
                      ? 'bg-gray-600/20 text-gray-500 cursor-not-allowed'
                      : 'bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white transform hover:scale-105'
                  }`}
                >
                  ← Geri Dön
                </button>
                
                <button
                  onClick={reset}
                  className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white px-4 py-3 rounded-xl font-semibold transition-all transform hover:scale-105"
                >
                  <Home size={18} />
                  Başa Dön
                </button>
              </div>
            </div>
            
            <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-4 border border-white/10">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <Palette className="text-pink-400" size={20} />
                Renk Şeması
              </h3>
              
              <div className="space-y-2">
                {Object.keys(colorSchemes).map((scheme) => (
                  <button
                    key={scheme}
                    onClick={() => setColorScheme(scheme)}
                    className={`w-full px-4 py-2 rounded-lg font-semibold transition-all ${
                      colorScheme === scheme
                        ? 'bg-gradient-to-r from-pink-500 to-purple-500 text-white'
                        : 'bg-white/5 text-gray-300 hover:bg-white/10'
                    }`}
                  >
                    {scheme.charAt(0).toUpperCase() + scheme.slice(1)}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-4 border border-white/10">
              <h3 className="text-lg font-bold text-white mb-4">İterasyonlar</h3>
              <input
                type="range"
                min="50"
                max="500"
                value={maxIterations}
                onChange={(e) => setMaxIterations(parseInt(e.target.value))}
                className="w-full"
              />
              <div className="text-center text-gray-300 mt-2">{maxIterations}</div>
              <p className="text-xs text-gray-400 mt-2">Daha yüksek = Daha detaylı (ama yavaş)</p>
            </div>
            
            <div className="bg-gradient-to-br from-yellow-500/10 to-orange-500/10 backdrop-blur-lg rounded-2xl p-4 border border-yellow-500/30">
              <h3 className="text-lg font-bold text-yellow-400 mb-3">🌟 İlginç Yerler</h3>
              <div className="space-y-2">
                {interestingPoints.map((point, i) => (
                  <button
                    key={i}
                    onClick={() => jumpToPoint(point)}
                    className="w-full text-left bg-black/30 hover:bg-black/50 px-3 py-2 rounded-lg transition-all group"
                  >
                    <div className="text-white font-semibold group-hover:text-yellow-400 transition-colors">
                      {point.name}
                    </div>
                    <div className="text-xs text-gray-400">{point.desc}</div>
                  </button>
                ))}
              </div>
            </div>
            
          </div>
          
        </div>
        
        <div className="mt-8 bg-gradient-to-r from-purple-500/10 to-blue-500/10 backdrop-blur-lg rounded-2xl p-6 border border-purple-500/20">
          <h3 className="text-xl font-bold text-white mb-3">🎓 Matematiksel Açıklama</h3>
          <div className="text-gray-300 space-y-2 text-sm">
            <p>
              <strong className="text-purple-400">Kompleks Sayılar:</strong> Her nokta c = a + bi şeklinde bir kompleks sayıdır.
            </p>
            <p>
              <strong className="text-blue-400">İterasyon:</strong> z₀ = 0 ile başlayıp z<sub>n+1</sub> = z<sub>n</sub>² + c formülünü tekrarlarız.
            </p>
            <p>
              <strong className="text-pink-400">Karar Kriteri:</strong> |z| büyük 2 olursa, o nokta sete ait değildir ve sonsuza gider.
            </p>
            <p>
              <strong className="text-yellow-400">Fraktal Özelliği:</strong> Ne kadar zoom yaparsanız yapın, benzer karmaşık desenler görürsünüz. Bu "öz-benzerlik" fraktalların temel özelliğidir.
            </p>
          </div>
        </div>
        
      </div>
    </div>
  );
}