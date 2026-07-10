import { useRef, useState } from 'react';
import { getDownloadURL, ref, uploadBytesResumable } from 'firebase/storage';
import { ensureAuthenticated, storage } from '../firebase';
import { ImagePlus, Loader2, Trash2, X } from 'lucide-react';

interface PhotoUploaderProps {
  dateId: string;
  onClose: () => void;
  onUploadSuccess: (urls: string[]) => void | Promise<void>;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const MAX_IMAGE_DIMENSION = 1600;
const MAX_INLINE_DATA_URL_LENGTH = 700_000;

function getErrorDetails(error: unknown): { code: string; message: string } {
  if (error && typeof error === 'object') {
    const firebaseError = error as { code?: string; message?: string };
    return {
      code: firebaseError.code || 'unknown',
      message: firebaseError.message || 'Sin descripción',
    };
  }

  return { code: 'unknown', message: String(error) };
}

function getFriendlyError(error: unknown): string {
  const { code, message } = getErrorDetails(error);

  if (code === 'auth/operation-not-allowed') {
    return 'Debes habilitar el proveedor Anónimo en Firebase Authentication antes de guardar imágenes.';
  }

  if (code === 'permission-denied') {
    return 'Firestore rechazó el respaldo de la imagen. Publica las reglas incluidas en el proyecto.';
  }

  return `No se pudieron guardar las imágenes. Código: ${code}. ${message}`;
}

function sanitizeFileName(fileName: string): string {
  return fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const image = new Image();

    image.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error(`No se pudo procesar la imagen ${file.name}.`));
    };
    image.src = objectUrl;
  });
}

function canvasToBlob(
  canvas: HTMLCanvasElement,
  mimeType: string,
  quality: number
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('El navegador no pudo comprimir la imagen.'));
        }
      },
      mimeType,
      quality
    );
  });
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error || new Error('No se pudo leer la imagen comprimida.'));
    reader.readAsDataURL(blob);
  });
}

async function compressImageForFirestore(file: File): Promise<string> {
  const image = await loadImage(file);
  const largestSide = Math.max(image.naturalWidth, image.naturalHeight);
  let scale = Math.min(1, MAX_IMAGE_DIMENSION / largestSide);
  const qualityLevels = [0.82, 0.72, 0.62, 0.52, 0.42, 0.32];

  for (let resizeAttempt = 0; resizeAttempt < 5; resizeAttempt += 1) {
    const width = Math.max(1, Math.round(image.naturalWidth * scale));
    const height = Math.max(1, Math.round(image.naturalHeight * scale));
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;

    const context = canvas.getContext('2d');
    if (!context) {
      throw new Error('El navegador no permite procesar la imagen seleccionada.');
    }

    context.drawImage(image, 0, 0, width, height);

    for (const quality of qualityLevels) {
      const blob = await canvasToBlob(canvas, 'image/webp', quality);
      const dataUrl = await blobToDataUrl(blob);

      if (dataUrl.length <= MAX_INLINE_DATA_URL_LENGTH) {
        return dataUrl;
      }
    }

    scale *= 0.75;
  }

  throw new Error(
    `La imagen ${file.name} sigue siendo demasiado grande después de optimizarla. Prueba con otra imagen.`
  );
}

export default function PhotoUploader({ dateId, onClose, onUploadSuccess }: PhotoUploaderProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files || []);

    if (selectedFiles.length === 0) {
      return;
    }

    const invalidType = selectedFiles.find((file) => !file.type.startsWith('image/'));
    const oversizedFile = selectedFiles.find((file) => file.size > MAX_FILE_SIZE);

    if (invalidType) {
      setErrorMessage(`El archivo ${invalidType.name} no es una imagen válida.`);
      event.target.value = '';
      return;
    }

    if (oversizedFile) {
      setErrorMessage(`La imagen ${oversizedFile.name} supera el máximo de 10 MB.`);
      event.target.value = '';
      return;
    }

    setFiles((currentFiles) => [...currentFiles, ...selectedFiles]);
    setErrorMessage(null);
    event.target.value = '';
  };

  const removeFile = (indexToRemove: number) => {
    setFiles((currentFiles) => currentFiles.filter((_, index) => index !== indexToRemove));
  };

  const uploadFileToStorage = (file: File, index: number, totalFiles: number): Promise<string> =>
    new Promise((resolve, reject) => {
      const randomId =
        typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
          ? crypto.randomUUID()
          : Math.random().toString(36).slice(2);
      const fileName = `${Date.now()}_${randomId}_${sanitizeFileName(file.name)}`;
      const storageRef = ref(storage, `dates/${dateId}/${fileName}`);
      const uploadTask = uploadBytesResumable(storageRef, file, { contentType: file.type });

      uploadTask.on(
        'state_changed',
        (snapshot) => {
          const fileProgress = snapshot.totalBytes
            ? snapshot.bytesTransferred / snapshot.totalBytes
            : 0;
          setProgress(((index + fileProgress) / totalFiles) * 100);
        },
        reject,
        async () => {
          try {
            resolve(await getDownloadURL(uploadTask.snapshot.ref));
          } catch (error) {
            reject(error);
          }
        }
      );
    });

  const handleUpload = async () => {
    if (files.length === 0) {
      return;
    }

    setUploading(true);
    setProgress(0);
    setErrorMessage(null);

    try {
      await ensureAuthenticated();
      const urls: string[] = [];

      for (let index = 0; index < files.length; index += 1) {
        const file = files[index];

        try {
          urls.push(await uploadFileToStorage(file, index, files.length));
        } catch (storageError) {
          console.warn(
            'Firebase Storage no está disponible; se usará el respaldo optimizado en Firestore:',
            storageError
          );
          setProgress(((index + 0.5) / files.length) * 100);
          urls.push(await compressImageForFirestore(file));
        }

        setProgress(((index + 1) / files.length) * 100);
      }

      await onUploadSuccess(urls);
      onClose();
    } catch (error) {
      console.error('Error saving files:', error);
      setErrorMessage(getFriendlyError(error));
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
        onClick={uploading ? undefined : onClose}
      ></div>

      <div className="bg-white relative w-full max-w-lg rounded-3xl p-6 shadow-2xl animate-in fade-in zoom-in duration-300">
        <button
          onClick={onClose}
          disabled={uploading}
          className="absolute right-4 top-4 text-gray-400 hover:text-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
          aria-label="Cerrar"
        >
          <X className="w-5 h-5" />
        </button>

        <h3 className="text-2xl font-cursive font-bold text-pink-600 mb-2 text-center">
          Añadir recuerdos
        </h3>
        <p className="mb-4 text-center text-sm text-gray-500">
          Puedes seleccionar varias fotos. Máximo 10 MB por imagen.
        </p>

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="border-2 border-dashed border-pink-300 rounded-2xl min-h-36 w-full flex flex-col items-center justify-center cursor-pointer hover:bg-pink-50 transition-colors disabled:cursor-not-allowed disabled:opacity-60"
        >
          <ImagePlus className="w-10 h-10 text-pink-400 mb-2" />
          <span className="text-gray-600 font-medium">
            {files.length > 0 ? 'Agregar más fotos' : 'Seleccionar fotos'}
          </span>
        </button>

        <input
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          ref={fileInputRef}
          onChange={handleFileChange}
        />

        {files.length > 0 && (
          <div className="mt-4 max-h-52 space-y-2 overflow-y-auto pr-1 custom-scrollbar">
            {files.map((file, index) => (
              <div
                key={`${file.name}-${file.lastModified}-${index}`}
                className="flex items-center justify-between gap-3 rounded-xl border border-pink-100 bg-pink-50/60 px-3 py-2"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-gray-700">{file.name}</p>
                  <p className="text-xs text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                </div>
                <button
                  type="button"
                  onClick={() => removeFile(index)}
                  disabled={uploading}
                  className="rounded-lg p-2 text-red-500 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
                  aria-label={`Quitar ${file.name}`}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}

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
              <Loader2 className="w-4 h-4 animate-spin" /> Guardando {files.length}{' '}
              {files.length === 1 ? 'foto' : 'fotos'}... {Math.round(progress)}%
            </p>
          </div>
        )}

        {files.length > 0 && !uploading && (
          <button
            onClick={handleUpload}
            className="w-full mt-4 bg-pink-500 hover:bg-pink-600 text-white font-medium py-3 px-4 rounded-xl shadow-md transition-colors"
          >
            Guardar {files.length} {files.length === 1 ? 'foto' : 'fotos'}
          </button>
        )}
      </div>
    </div>
  );
}
