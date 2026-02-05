import { useState } from "react";
import ImageUploader from "./components/ImageUploader";
import ImageCropper from "./components/ImageCropper";
import Scene3D from "./components/Scene3D";

function App() {
  const [uploadedImage, setUploadedImage] = useState(null);
  const [croppedImage, setCroppedImage] = useState(null);

  return (
    <div className="min-h-screen bg-gray-100">
      {!croppedImage ? (
        <div className="max-w-2xl mx-auto py-8">
          <h1 className="text-3xl font-bold text-center mb-8">
            Image 3D Viewer
          </h1>
          <div className="bg-white rounded-lg shadow-lg">
            {!uploadedImage ? (
              <ImageUploader onImageLoad={setUploadedImage} />
            ) : (
              <ImageCropper
                imageSrc={uploadedImage}
                onCropComplete={setCroppedImage}
              />
            )}
          </div>
          {uploadedImage && (
            <button
              onClick={() => setUploadedImage(null)}
              className="mt-4 text-blue-600 hover:underline"
            >
              ← 다른 이미지 선택
            </button>
          )}
        </div>
      ) : (
        <div>
          <button
            onClick={() => {
              setCroppedImage(null);
              setUploadedImage(null);
            }}
            className="absolute top-4 left-4 z-10 bg-white px-4 py-2 rounded shadow hover:bg-gray-100"
          >
            ← 처음으로
          </button>
          <Scene3D croppedImage={croppedImage} />
        </div>
      )}
    </div>
  );
}

export default App;
