/**
 * Supabase Storage helper for the enhanced suite.
 * ------------------------------------------------
 * The `VideoInterviewLayer` records the candidate's camera locally in
 * the browser, then hands the resulting `Blob` to this helper at call-end
 * to upload to Supabase Storage. The public URL is then written back onto
 * the response row so the feedback dashboard can play it back.
 *
 * The bucket must exist before this is called. See the bottom of
 * `supabase_schema.sql` for the one-liner that creates it.
 *
 * The upload is intentionally simple: single-shot PUT. For longer
 * interviews you would want to switch to a resumable upload (tus.io
 * or a custom chunked protocol). Keeping it single-shot means we can
 * keep the call-page code under 200 lines.
 */

import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

const BUCKET = "interview-videos";

export interface UploadResult {
  /** Public URL — drop into `<video src=…>`. */
  publicUrl: string;
  /** Path inside the bucket — useful for delete/cleanup. */
  storagePath: string;
  /** Final size, bytes. */
  sizeBytes: number;
}

const supabase = createClientComponentClient();

export const StorageService = {
  /**
   * Upload a recorded interview video to Supabase Storage.
   *
   * @param blob     The MediaRecorder output. Should be webm.
   * @param callId   Used to namespace the path so each call's recording
   *                 lives in its own folder.
   * @param ext      File extension, defaults to "webm".
   */
  async uploadInterviewVideo(
    blob: Blob,
    callId: string,
    ext = "webm",
  ): Promise<UploadResult> {
    const safeCallId = callId.replace(/[^a-zA-Z0-9_-]/g, "_");
    const path = `${safeCallId}/recording.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(path, blob, {
        contentType: blob.type || `video/${ext}`,
        upsert: true,
        cacheControl: "3600",
      });

    if (uploadError) {
      throw new Error(`Upload failed: ${uploadError.message}`);
    }

    const { data: publicData } = supabase.storage
      .from(BUCKET)
      .getPublicUrl(path);

    return {
      publicUrl: publicData.publicUrl,
      storagePath: path,
      sizeBytes: blob.size,
    };
  },

  /**
   * Best-effort delete. Used when a recruiter explicitly removes a
   * candidate's response.
   */
  async deleteInterviewVideo(storagePath: string): Promise<void> {
    if (!storagePath) return;
    const { error } = await supabase.storage.from(BUCKET).remove([storagePath]);
    if (error) {
      // Non-fatal — log and move on.
      console.warn(`Storage delete failed for ${storagePath}:`, error.message);
    }
  },

  /**
   * Test the bucket exists and is writable. Run from /setup or a health
   * check route.
   */
  async healthCheck(): Promise<{ ok: boolean; error?: string }> {
    try {
      const { error } = await supabase.storage
        .from(BUCKET)
        .list("", { limit: 1 });
      if (error) return { ok: false, error: error.message };
      return { ok: true };
    } catch (err) {
      return {
        ok: false,
        error: err instanceof Error ? err.message : String(err),
      };
    }
  },
};
