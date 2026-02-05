import { useRef, useState, useEffect } from "react";

export default function ImageCropper({ imageSrc, onCropComplete }) {
  const canvasRef = useRef(null);
  const [cropArea, setCropArea] = useState({ x: 0, y: 0, size: 100 });
  const [isDragging, setIsDragging] = useState(false);
  const [imageData, setImageData] = useState(null);

  useEffect(() => {
    if (imageSrc) {
      const img = new Image();
      img.onload = () => {
        setImageData(img);
        // 초기 크롭 영역을 이미지 중앙에 설정
        const minDimension = Math.min(img.width, img.height);
        setCropArea({
          x: (img.width - minDimension) / 2,
          y: (img.height - minDimension) / 2,
          size: minDimension,
        });
      };
      img.src = imageSrc;
    }
  }, [imageSrc]);

  useEffect(() => {
    if (imageData && canvasRef.current) {
      drawCanvas();
    }
  }, [imageData, cropArea]);

  const drawCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const scale = 500 / Math.max(imageData.width, imageData.height);

    canvas.width = imageData.width * scale;
    canvas.height = imageData.height * scale;

    // 이미지 그리기
    ctx.drawImage(imageData, 0, 0, canvas.width, canvas.height);

    // 어두운 오버레이
    ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 크롭 영역 지우기 (밝게 표시)
    ctx.clearRect(
      cropArea.x * scale,
      cropArea.y * scale,
      cropArea.size * scale,
      cropArea.size * scale,
    );
    ctx.drawImage(
      imageData,
      cropArea.x,
      cropArea.y,
      cropArea.size,
      cropArea.size,
      cropArea.x * scale,
      cropArea.y * scale,
      cropArea.size * scale,
      cropArea.size * scale,
    );

    // 크롭 영역 테두리
    ctx.strokeStyle = "#3b82f6";
    ctx.lineWidth = 2;
    ctx.strokeRect(
      cropArea.x * scale,
      cropArea.y * scale,
      cropArea.size * scale,
      cropArea.size * scale,
    );
  };

  const handleMouseDown = (e) => {
    setIsDragging(true);
  };

  const handleMouseMove = (e) => {
    if (!isDragging || !imageData) return;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scale = imageData.width / canvas.width;

    const x = (e.clientX - rect.left) * scale - cropArea.size / 2;
    const y = (e.clientY - rect.top) * scale - cropArea.size / 2;

    setCropArea({
      ...cropArea,
      x: Math.max(0, Math.min(x, imageData.width - cropArea.size)),
      y: Math.max(0, Math.min(y, imageData.height - cropArea.size)),
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleSizeChange = (e) => {
    const newSize = parseInt(e.target.value);
    const maxSize = Math.min(imageData.width, imageData.height);
    setCropArea({
      ...cropArea,
      size: Math.min(newSize, maxSize),
      x: Math.max(0, Math.min(cropArea.x, imageData.width - newSize)),
      y: Math.max(0, Math.min(cropArea.y, imageData.height - newSize)),
    });
  };

  const handleApplyCrop = () => {
    const croppedCanvas = document.createElement("canvas");
    croppedCanvas.width = cropArea.size;
    croppedCanvas.height = cropArea.size;
    const ctx = croppedCanvas.getContext("2d");

    ctx.drawImage(
      imageData,
      cropArea.x,
      cropArea.y,
      cropArea.size,
      cropArea.size,
      0,
      0,
      cropArea.size,
      cropArea.size,
    );

    onCropComplete(croppedCanvas.toDataURL());
  };

  if (!imageData) return null;

  return (
    <div className="p-4 space-y-4">
      <canvas
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        className="border border-gray-300 cursor-move mx-auto"
      />
      <div className="space-y-2">
        <label className="block text-sm font-medium">
          크롭 크기: {cropArea.size}px
        </label>
        <input
          type="range"
          min="50"
          max={Math.min(imageData.width, imageData.height)}
          value={cropArea.size}
          onChange={handleSizeChange}
          className="w-full"
        />
      </div>
      <button
        onClick={handleApplyCrop}
        className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700"
      >
        3D로 보기
      </button>
    </div>
  );
}
