 "use client";

import { useEffect, useState } from "react";
import { apiUploadImage, apiGetImages, ApiImageRow } from "../utils/api"; // adjust path to your api.ts

export default function R2GalleryPage() {
  const [file, setFile] = useState<File | null>(null);
  const [images, setImages] = useState<ApiImageRow[]>([]);
  const [uploading, setUploading] = useState(false);
  const [loadingList, setLoadingList] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadImages = async () => {
    try {
      setError(null);
      setLoadingList(true);
      const imgs = await apiGetImages();
      setImages(imgs || []);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to load images");
    } finally {
      setLoadingList(false);
    }
  };

  useEffect(() => {
    loadImages();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!file) {
      setError("Please choose a file");
      return;
    }

    try {
      setUploading(true);

      // apiUploadImage should now return ApiImageRow
      const uploaded: ApiImageRow = await apiUploadImage(file);

      // Prepend latest file (image/pdf)
      setImages((prev) => [uploaded, ...prev]);

      setFile(null);
      const fileInput = document.getElementById(
        "file-input"
      ) as HTMLInputElement | null;
      if (fileInput) fileInput.value = "";
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        padding: "2rem",
        fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
        background: "#f5f5f5",
      }}
    >
      <div
        style={{
          maxWidth: 900,
          margin: "0 auto",
          background: "#ffffff",
          borderRadius: 12,
          padding: "1.5rem 2rem 2rem",
          boxShadow: "0 10px 25px rgba(0, 0, 0, 0.05)",
        }}
      >
        <h1 style={{ marginBottom: "1rem" }}>R2 Image Upload & Gallery</h1>

        <form
          onSubmit={handleSubmit}
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "0.75rem",
            marginBottom: "1.5rem",
            border: "1px solid #eee",
            borderRadius: 8,
            padding: "1rem",
          }}
        >
          <label htmlFor="file-input" style={{ fontWeight: 600 }}>
            Choose an image:
          </label>
          <input
            id="file-input"
            type="file"
            accept="image/*"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
          />
          <button
            type="submit"
            disabled={!file || uploading}
            style={{
              marginTop: "0.5rem",
              padding: "0.6rem 1.2rem",
              borderRadius: 6,
              border: "none",
              cursor: uploading || !file ? "not-allowed" : "pointer",
              opacity: uploading || !file ? 0.7 : 1,
              fontWeight: 600,
            }}
          >
            {uploading ? "Uploading..." : "Upload"}
          </button>
        </form>

        {error && (
          <div
            style={{
              marginBottom: "1rem",
              padding: "0.75rem 1rem",
              borderRadius: 8,
              background: "#ffe5e5",
              color: "#b00000",
            }}
          >
            {error}
          </div>
        )}

        <div
          style={{
            marginBottom: "0.5rem",
            display: "flex",
            alignItems: "center",
            gap: "0.75rem",
          }}
        >
          <h2 style={{ margin: 0 }}>Uploaded Files</h2>
          {loadingList && (
            <span style={{ fontSize: "0.85rem", color: "#777" }}>
              Loading...
            </span>
          )}
        </div>

        {images.length === 0 && !loadingList ? (
          <p style={{ color: "#666" }}>No files uploaded yet.</p>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
              gap: "0.75rem",
            }}
          >
            {images.map((img) => (
              <div
                key={img.id}
                style={{
                  background: "#fafafa",
                  borderRadius: 8,
                  padding: "0.5rem",
                  border: "1px solid #eee",
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.4rem",
                }}
              >
                <div
                  style={{
                    width: "100%",
                    paddingBottom: "100%",
                    position: "relative",
                    overflow: "hidden",
                    borderRadius: 6,
                  }}
                >
                  {/* If file is image, show thumbnail; if pdf/other, you could later show icon */}
                  <img
                    src={img.file_url}
                    alt={img.title || `File ${img.id}`}
                    style={{
                      position: "absolute",
                      inset: 0,
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                    }}
                  />
                </div>

                {img.title && (
                  <span
                    style={{
                      fontSize: "0.8rem",
                      fontWeight: 600,
                      color: "#333",
                      wordBreak: "break-word",
                    }}
                  >
                    {img.title}
                  </span>
                )}

                <span
                  style={{
                    fontSize: "0.75rem",
                    color: "#666",
                  }}
                >
                  {img.date ?? img.created_at?.slice(0, 10)}
                </span>

                <span
                  style={{
                    fontSize: "0.75rem",
                    color: "#888",
                    wordBreak: "break-all",
                  }}
                >
                  ID: {img.id}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
