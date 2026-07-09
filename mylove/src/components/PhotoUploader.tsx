import { useState, useRef } from 'react';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { storage } from '../firebase';
import { ImagePlus, X, Loader2 } from 'lucide-react';

interface PhotoUploaderProps {
  dateId: string;
  onClose: () => void;
  onUploadSuccess: (url: string) => void;
}

export default function PhotoUploader({ dateId, onClose, onUploadSuccess }: PhotoUploaderProps) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      
      // Preview
      const reader = new FileReader();
      reader.onload = (e) => setPreview(e.target?.result as string);
      reader.readAsDataURL(selectedFile);
    }
  };

  const handleUpload = () => {
    if (!file) return;

    setUploading(true);
    setErrorMessage(null);
    // Create a unique file name to avoid overwriting
    const fileName = `${Date.now()}_${file.name}`;
    const storageRef = ref(storage, `dates/${dateId}/${fileName}`);
    const uploadTask = uploadBytesResumable(storageRef, file);

    uploadTask.on(
      'state_changed',
      (snapshot) => {
        const p = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        setProgress(p);
      },
      (error) => {
        console.error('Error uploading file:', error);
        setUploading(false);
        setErrorMessage(`No se pudo subir la imagen. Código: ${error.code || 'unknown'}`);
      },
      () => {
        getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
          setUploading(false);
          onUploadSuccess(downloadURL);
          onClose();
        });
      }
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity" onClick={onClose}></div>
      
      <div className="bg-white relative w-full max-w-sm rounded-3xl p-6 shadow-2xl animate-in fade-in zoom-in duration-300">
        <button onClick={onClose} className="absolute right-4 top-4 text-gray-400 hover:text-gray-700">
          <X className="w-5 h-5" />
        </button>

        <h3 className="text-2xl font-cursive font-bold text-pink-600 mb-4 text-center">
          Añadir Recuerdo
        </h3>

        {!preview ? (
          <div 
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-pink-300 rounded-2xl h-48 flex flex-col items-center justify-center cursor-pointer hover:bg-pink-50 transition-colors"
          >
            <ImagePlus className="w-10 h-10 text-pink-400 mb-2" />
            <p className="text-gray-500 font-medium">Selecciona una foto</p>
          </div>
        ) : (
          <div className="relative rounded-2xl overflow-hidden h-48 mb-4">
            <img src={preview} alt="Preview" className="w-full h-full object-cover" />
            {!uploading && (
              <button 
                onClick={() => { setFile(null); setPreview(null); }}
                className="absolute top-2 right-2 bg-white/80 rounded-full p-1 text-gray-700 hover:bg-white"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        )}

        <input 
          type="file" 
          accept="image/*" 
          className="hidden" 
          ref={fileInputRef} 
          onChange={handleFileChange}
        />

        {errorMessage && (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {errorMessage}
          </div>
        )}

        {uploading && (
          <div className="mt-4">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-pink-500 h-2 rounded-full transition-all duration-300" 
                style={{ width: `${progress}%` }}
              ></div>
            </div>
            <p className="text-center text-sm text-gray-500 mt-2 flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" /> Subiendo... {Math.round(progress)}%
            </p>
          </div>
        )}

        {preview && !uploading && (
          <button
            onClick={handleUpload}
            className="w-full mt-4 bg-pink-500 hover:bg-pink-600 text-white font-medium py-3 px-4 rounded-xl shadow-md transition-colors"
          >
            Guardar Foto
          </button>
        )}
      </div>
    </div>
  );
}
